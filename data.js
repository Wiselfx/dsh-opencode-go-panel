/**
 * OpenCode Go API provider for the Harness panel.
 *
 * Everything shown by the panel comes from OpenCode Go itself:
 * - subscription state and exact dollar meters from the Console status API;
 * - the percentage usage fallback from the inference API;
 * - the authenticated model catalog and its published per-million rates.
 *
 * OpenCode does not expose token totals through these APIs, so the panel
 * deliberately does not estimate or reconstruct them from local session logs.
 */
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'

const DEFAULT_API_ORIGIN = 'https://opencode.ai'
const USER_AGENT = 'dsh-opencode-go-panel/1.1'
const MICROCENTS_PER_USD = 100_000_000
const DAY = 86_400_000
const HOUR = 3_600_000

const PLANS = {
  go: { name: 'Go', priceMonthly: 10, caps: { rolling: 12, weekly: 30, monthly: 60 } },
  'go-plus': { name: 'Go Plus', priceMonthly: 40, caps: { rolling: 48, weekly: 120, monthly: 240 } },
  'go-teams': { name: 'Go Teams', priceMonthly: 20, caps: { rolling: 12, weekly: 30, monthly: 60 } },
}

/**
 * Monthly allowances published by OpenCode for each Go model, in dollars of
 * list-price usage. `null` means free/unlimited. The API meter itself is a
 * single normalized pool; these values are what each model can consume on its
 * own. They are OpenCode's published plan data, not derived from local usage.
 */
const GO_ALLOWANCES = {
  'deepseek-v4.1-flash': 100,
  'deepseek-v4-pro': 15,
  'glm-5.2': 60,
  'glm-5.3': 15,
  'glm-5.3-flash': 60,
  'grok-4.7': 15,
  'gpt-5.6-luna': 15,
  'gpt-6-luna': 15,
  'claude-haiku-5-5': 15,
  'kimi-k3': 15,
  'kimi-k3.1-pro': 15,
  'kimi-k2.7-code': 60,
  'minimax-m3': 60,
  'minimax-m3.1-flash': 20,
  'mimo-v2.6-flash': 60,
  'mimo-v2.6-pro': 15,
  'mimo-v2.5': 60,
  'mimo-v2.5-pro': 15,
  'muse-spark-1.2-contributor': 60,
  'muse-spark-1.3-contributor': 60,
  'qwen3.8-max': 15,
  'qwen3.8-flash': 30,
  'qwen3.7-plus': 60,
  'longcat-2.0': 60,
  'step-5-preview': 15,
  'hy3': 60,
  'hy4-preview': 30,
  'gemini-4-argon': 30,
  'beam-free': null,
  'iceman-contributor-free': null,
}

const GO_PLUS_ALLOWANCES = {
  'deepseek-v4.1-flash': 200,
  'deepseek-v4-pro': 60,
  'glm-5.2': 180,
  'glm-5.3': 120,
  'glm-5.3-flash': 180,
  'grok-4.7': 60,
  'gpt-5.6-luna': 60,
  'gpt-6-luna': 60,
  'claude-haiku-5-5': 60,
  'kimi-k3': 60,
  'kimi-k3.1-pro': 60,
  'kimi-k2.7-code': 180,
  'minimax-m3': 180,
  'minimax-m3.1-flash': 80,
  'mimo-v2.6-flash': 120,
  'mimo-v2.6-pro': 60,
  'mimo-v2.5': 120,
  'mimo-v2.5-pro': 60,
  'muse-spark-1.2-contributor': 120,
  'muse-spark-1.3-contributor': 120,
  'qwen3.8-max': 60,
  'qwen3.8-flash': 90,
  'qwen3.7-plus': 180,
  'longcat-2.0': 240,
  'step-5-preview': 60,
  'hy3': 240,
  'hy4-preview': 120,
  'gemini-4-argon': 120,
  'beam-free': null,
  'iceman-contributor-free': null,
}

const GO_TEAMS_ALLOWANCES = Object.fromEntries(
  Object.entries(GO_ALLOWANCES).map(([id, value]) => [id, value === null ? null : value + 5]),
)

const MODEL_ALLOWANCES = {
  go: GO_ALLOWANCES,
  'go-plus': GO_PLUS_ALLOWANCES,
  'go-teams': GO_TEAMS_ALLOWANCES,
}

const DEFAULT_CONFIG = {
  apiKeyEnv: 'OPENCODE_GO_API_KEY',
  providers: ['opencode-go'],
  refreshSeconds: 300,
  plan: 'go',
  monthlyPriceUsd: null,
  opencodeDb: null,
  opencodeAuth: null,
  apiOrigin: DEFAULT_API_ORIGIN,
}

function configFor(config = {}) {
  return {
    ...DEFAULT_CONFIG,
    ...config,
    providers: Array.isArray(config.providers) && config.providers.length
      ? config.providers.map(String)
      : DEFAULT_CONFIG.providers,
  }
}

function planFor(product, config, memberCount = 1) {
  const id = typeof product === 'string' && PLANS[product] ? product : (PLANS[config.plan] ? config.plan : 'go')
  const plan = PLANS[id]
  const price = id === 'go-teams'
    ? plan.priceMonthly * Math.max(1, memberCount)
    : (Number.isFinite(config.monthlyPriceUsd) ? config.monthlyPriceUsd : plan.priceMonthly)
  return { id, name: plan.name, priceMonthly: price, caps: plan.caps }
}

function usdFromMicroCents(value) {
  const n = Number(value)
  return Number.isFinite(n) ? n / MICROCENTS_PER_USD : null
}

function numberOrNull(value) {
  return Number.isFinite(value) ? value : null
}

function modelKey(value) {
  return String(value || '').toLowerCase().replace(/^[^/]+\//, '')
}

async function readJson(path) {
  try {
    return JSON.parse(await readFile(path, 'utf8'))
  } catch {
    return undefined
  }
}

async function fileExists(path) {
  try {
    return (await stat(path)).isFile()
  } catch {
    return false
  }
}

async function fetchJson(url, headers, timeoutMs = 15_000) {
  const response = await fetch(url, {
    headers: { accept: 'application/json', 'user-agent': USER_AGENT, ...headers },
    signal: AbortSignal.timeout(timeoutMs),
  })
  const text = await response.text()
  let body
  try {
    body = text.length ? JSON.parse(text) : null
  } catch {
    body = null
  }
  return { ok: response.ok, status: response.status, body, text: text.slice(0, 300) }
}

/** Credentials stored by the harness itself are the first choice. */
async function resolveSavedKeys(ctx, config) {
  const found = []
  const seen = new Set()
  const add = (key, source) => {
    if (typeof key !== 'string') return
    const value = key.trim()
    if (value.length < 8 || seen.has(value)) return
    seen.add(value)
    found.push({ key: value, source })
  }

  const refs = [config.apiKeyEnv, 'OPENCODE_GO_API_KEY', 'OPENCODE_API_KEY', 'OPENCODE_ZEN_API_KEY']
  const credentials = ctx.get?.('credentials')
  if (credentials?.resolve) {
    for (const ref of [...new Set(refs.filter(Boolean))]) {
      try {
        const hit = await credentials.resolve(ref)
        if (hit?.value) add(hit.value, `Saved key (${ref})`)
      } catch {
        // A missing provider or a malformed reference is not fatal.
      }
    }
  }

  for (const ref of refs) {
    if (ref && process.env[ref]) add(process.env[ref], `Environment (${ref})`)
  }

  const localPath = join(process.env.DSH_HOME || join(homedir(), '.dsh'), 'opencode-go', 'api-key')
  if (await fileExists(localPath)) {
    try {
      add((await readFile(localPath, 'utf8')).trim(), 'Saved by this panel')
    } catch {
      // Ignore unreadable optional storage.
    }
  }

  const piAuth = await readJson(join(homedir(), '.pi', 'agent', 'auth.json'))
  for (const id of ['opencode-go', 'opencode']) {
    const record = piAuth?.[id]
    if (record?.key) add(record.key, 'Pi sign-in')
    if (record?.access) add(record.access, 'Pi sign-in')
  }

  const openCodeAuth = await readJson(join(homedir(), '.local', 'share', 'opencode', 'auth.json'))
  for (const id of ['opencode-go', 'opencode']) {
    const record = openCodeAuth?.[id]
    if (record?.key) add(record.key, 'OpenCode sign-in')
    if (record?.access) add(record.access, 'OpenCode sign-in')
  }

  return found
}

/** The local OpenCode credential carries the workspace id the Console needs. */
async function resolveConsole(ctx, config) {
  const dbPath = config.opencodeDb || join(homedir(), '.local', 'share', 'opencode', 'opencode.db')
  try {
    const { DatabaseSync } = await import('node:sqlite')
    const db = new DatabaseSync(dbPath, { readOnly: true })
    try {
      const rows = db.prepare(
        "select value from credential where integration_id in ('opencode', 'opencode-go') order by active desc",
      ).all()
      for (const row of rows) {
        let value
        try {
          value = JSON.parse(row.value)
        } catch {
          continue
        }
        if (!value || value.type !== 'oauth') continue
        const token = value.access
        const orgID = value.metadata?.orgID
        const expires = Number(value.expires)
        if (typeof token !== 'string' || token.length < 8) continue
        if (Number.isFinite(expires) && expires > 0 && expires < Date.now() + 60_000) continue
        if (typeof orgID !== 'string' || !orgID.startsWith('org_')) continue
        return {
          access: token,
          orgID,
          server: typeof value.metadata?.server === 'string' ? value.metadata.server : 'https://opencode.ai/console',
          workspaceName: typeof value.metadata?.orgName === 'string' ? value.metadata.orgName : null,
          source: 'OpenCode local sign-in',
        }
      }
    } finally {
      db.close()
    }
  } catch {
    // node:sqlite may be unavailable, or OpenCode may not be installed.
  }

  const authPath = config.opencodeAuth || join(homedir(), '.local', 'share', 'opencode', 'auth.json')
  const auth = await readJson(authPath)
  for (const id of ['opencode', 'opencode-go']) {
    const value = auth?.[id]
    if (!value || value.type !== 'oauth') continue
    const token = value.access
    const orgID = value.metadata?.orgID
    const expires = Number(value.expires)
    if (typeof token !== 'string' || token.length < 8) continue
    if (Number.isFinite(expires) && expires > 0 && expires < Date.now() + 60_000) continue
    if (typeof orgID !== 'string' || !orgID.startsWith('org_')) continue
    return {
      access: token,
      orgID,
      server: typeof value.metadata?.server === 'string' ? value.metadata.server : 'https://opencode.ai/console',
      workspaceName: typeof value.metadata?.orgName === 'string' ? value.metadata.orgName : null,
      source: 'OpenCode local sign-in',
    }
  }

  return undefined
}

async function fetchUsageForKeys(keys, config) {
  let lastError = null
  for (const candidate of keys) {
    try {
      const result = await fetchJson(`${config.apiOrigin}/zen/go/v1/usage`, {
        authorization: `Bearer ${candidate.key}`,
      })
      if (result.ok && result.body?.usage) {
        return { ...result, candidate }
      }
      lastError = `HTTP ${result.status}`
      if (result.status !== 401 && result.status !== 403) break
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error)
    }
  }
  return { ok: false, candidate: keys[0], error: lastError || 'No API key found' }
}

async function fetchModels(config, headers) {
  const urls = [
    `${config.apiOrigin}/zen/go/v1/models`,
    `${config.apiOrigin}/inference/go/v1/models`,
  ]
  for (const url of urls) {
    try {
      const result = await fetchJson(url, headers)
      if (result.ok && Array.isArray(result.body?.data)) {
        return { data: result.body.data, authenticated: Boolean(headers.authorization) }
      }
    } catch {
      // Try the alternate public catalog URL.
    }
  }
  if (headers.authorization) {
    // The authenticated call can fail on an expired key; a public catalog is
    // still better than an empty page, and the caller records the fallback.
    return fetchModels(config, {})
  }
  return { data: [], authenticated: false }
}

function describePeak(multiplier) {
  const factor = Number(multiplier?.factor)
  if (!Number.isFinite(factor) || factor <= 1) return null
  return `${factor}× during scheduled peak hours`
}

function normalizeModels(raw) {
  return raw.map((model) => {
    const text = model.cost?.text || {}
    const rates = {
      input: numberOrNull(text.input?.price) ?? 0,
      output: numberOrNull(text.output?.price) ?? 0,
      cacheRead: numberOrNull(text.input?.cache?.read) ?? 0,
      cacheWrite: numberOrNull(text.input?.cache?.write) ?? 0,
    }
    const multiplier = Array.isArray(model.cost?.multipliers) ? model.cost.multipliers[0] : null
    return {
      id: String(model.id || ''),
      canonicalId: typeof model.canonical_id === 'string' ? model.canonical_id : null,
      name: typeof model.name === 'string' && model.name ? model.name : String(model.id || ''),
      context: numberOrNull(model.limit?.context),
      maxTokens: numberOrNull(model.limit?.output),
      rates,
      free: rates.input === 0 && rates.output === 0,
      reasoning: Boolean(model.capabilities?.reasoning?.supported),
      vision: Array.isArray(model.modalities?.input)
        && model.modalities.input.some((kind) => String(kind).startsWith('image/')),
      peakFactor: numberOrNull(multiplier?.factor),
      peakNote: describePeak(multiplier),
      releaseDate: typeof model.release_date === 'string' ? model.release_date : null,
      family: typeof model.family === 'string' ? model.family : null,
    }
  }).filter((model) => model.id)
}

function statusMeters(statusDto) {
  const access = statusDto?.access || {}
  const meters = access.meters || {}
  const now = Date.now()
  const raw = [
    ['rolling', '5-hour window', meters.fiveHour, access.startsAt],
    ['weekly', 'Weekly', meters.week, access.startsAt],
    ['monthly', 'Monthly', meters.month, access.startsAt],
  ]
  return raw.map(([key, label, meter, fallbackStart]) => {
    if (!meter) return null
    const limit = usdFromMicroCents(meter.limitMicroCents)
    const used = usdFromMicroCents(meter.usedMicroCents)
    const startsAt = Date.parse(meter.startsAt || fallbackStart || '') || null
    const resetsAt = Date.parse(meter.resetsAt || '') || null
    const percent = limit && limit > 0 ? Math.max(0, Math.min(100, (used / limit) * 100)) : 0
    const elapsed = startsAt && resetsAt && resetsAt > startsAt
      ? Math.max(0, Math.min(1, (now - startsAt) / (resetsAt - startsAt)))
      : null
    return {
      key,
      label,
      used,
      limit,
      remaining: limit != null && used != null ? Math.max(0, limit - used) : null,
      percent,
      status: meter.status || 'ok',
      startsAt,
      resetsAt,
      elapsed,
      pace: elapsed && elapsed > 0.02 ? percent / 100 / elapsed : null,
      rateLimited: meter.status === 'rate-limited',
    }
  }).filter(Boolean)
}

function usageMeters(usageDto, plan) {
  const usage = usageDto?.usage || {}
  const now = Date.now()
  const mapping = [
    ['rolling', '5-hour window', usage.rolling, 5 * HOUR, plan.caps.rolling],
    ['weekly', 'Weekly', usage.weekly, 7 * DAY, plan.caps.weekly],
    ['monthly', 'Monthly', usage.monthly, 30 * DAY, plan.caps.monthly],
  ]
  return mapping.map(([key, label, meter, length, cap]) => {
    if (!meter) return null
    const percent = Number(meter.percent) || 0
    const limit = cap
    const used = (percent / 100) * limit
    const resetsAt = Date.parse(meter.resetsAt || '') || null
    const startsAt = resetsAt != null ? resetsAt - length : null
    const elapsed = startsAt && resetsAt && resetsAt > startsAt
      ? Math.max(0, Math.min(1, (now - startsAt) / (resetsAt - startsAt)))
      : null
    return {
      key,
      label,
      used,
      limit,
      remaining: Math.max(0, limit - used),
      percent,
      status: meter.status || 'ok',
      startsAt,
      resetsAt,
      elapsed,
      pace: elapsed && elapsed > 0.02 ? percent / 100 / elapsed : null,
      rateLimited: meter.status === 'rate-limited',
    }
  }).filter(Boolean)
}

function allowanceFor(planId, modelId) {
  const table = MODEL_ALLOWANCES[planId] || MODEL_ALLOWANCES.go
  const key = modelKey(modelId)
  if (Object.prototype.hasOwnProperty.call(table, key)) return table[key]
  return undefined
}

/** The largest single-model cap is the plan's base unit, so every model fits one meter. */
function baseAllowanceFor(planId) {
  const table = MODEL_ALLOWANCES[planId] || MODEL_ALLOWANCES.go
  const caps = Object.values(table).filter((value) => typeof value === 'number')
  return caps.length ? Math.max(...caps) : 100
}

function modelAllowanceInfo(model, planId, baseAllowance, baseUsed, baseRemaining) {
  const published = allowanceFor(planId, model.id)
  const unlimited = published === null
  const monthlyAllowance = typeof published === 'number' ? published : null
  const fraction = baseAllowance > 0 && baseUsed != null ? baseUsed / baseAllowance : null
  return {
    monthlyAllowance,
    unlimited,
    allowancePublished: published !== undefined,
    burnMultiplier: monthlyAllowance != null ? baseAllowance / monthlyAllowance : null,
    usedIfExclusive: monthlyAllowance != null && fraction != null ? fraction * monthlyAllowance : null,
    remainingIfExclusive: monthlyAllowance != null && baseRemaining != null
      ? (baseRemaining / baseAllowance) * monthlyAllowance
      : null,
  }
}

function snapshotError(error) {
  return error instanceof Error ? error.message : String(error)
}

async function buildSnapshot(ctx, config) {
  const warnings = []
  const errors = []
  const savedKeys = await resolveSavedKeys(ctx, config)
  const consoleLogin = await resolveConsole(ctx, config)

  const modelHeaders = consoleLogin
    ? { authorization: `Bearer ${consoleLogin.access}`, 'x-org-id': consoleLogin.orgID }
    : savedKeys[0]
      ? { authorization: `Bearer ${savedKeys[0].key}` }
      : {}

  const [statusResult, usageResult, publicModels, workspaceModels] = await Promise.all([
    consoleLogin
      ? fetchJson(`${consoleLogin.server.replace(/\/$/, '')}/api/go/status`, {
        authorization: `Bearer ${consoleLogin.access}`,
        'x-org-id': consoleLogin.orgID,
      }).catch((error) => ({ ok: false, status: 0, error: snapshotError(error) }))
      : Promise.resolve(null),
    fetchUsageForKeys(savedKeys, config),
    fetchModels(config, {}).catch(() => ({ data: [], authenticated: false })),
    modelHeaders.authorization
      ? fetchModels(config, modelHeaders).catch(() => ({ data: [], authenticated: false }))
      : Promise.resolve(null),
  ])
  const workspaceIds = workspaceModels?.data?.length
    ? new Set(workspaceModels.data.map((model) => String(model.id)))
    : null
  const modelResult = publicModels.data.length
    ? publicModels
    : (workspaceModels || { data: [], authenticated: false })

  const statusDto = statusResult?.ok ? statusResult.body : null
  const plan = planFor(statusDto?.product || config.plan, config, statusDto?.teamsUpgradePrice?.memberCount || 1)
  const meterList = statusDto
    ? statusMeters(statusDto)
    : usageMeters(usageResult.ok ? usageResult.body : null, plan)
  const monthMeter = meterList.find((meter) => meter.key === 'monthly') || null

  let subscription = null
  if (statusDto) {
    const access = statusDto.access || {}
    const month = access.meters?.month
    const monthlyLimit = usdFromMicroCents(month?.limitMicroCents)
    const monthlyUsed = usdFromMicroCents(month?.usedMicroCents)
    subscription = {
      source: 'console',
      product: statusDto.product || plan.id,
      renewalProduct: statusDto.renewalProduct || null,
      plan: plan.name,
      planId: plan.id,
      priceMonthly: plan.priceMonthly,
      currency: String(statusDto.renewalCurrency || 'usd').toUpperCase(),
      status: statusDto.cancelAtPeriodEnd ? 'cancelling' : (statusDto.access ? 'active' : 'unknown'),
      cancelAtPeriodEnd: Boolean(statusDto.cancelAtPeriodEnd),
      renewalStopReason: statusDto.renewalStopReason || null,
      renewalPending: Boolean(statusDto.renewalPending),
      nextPeriodPaid: Boolean(statusDto.nextPeriodPaid),
      useBalance: Boolean(statusDto.useBalance),
      accessStartsAt: Date.parse(access.startsAt || '') || null,
      accessEndsAt: Date.parse(access.endsAt || '') || null,
      monthlyLimit,
      monthlyUsed,
      monthlyRemaining: monthlyLimit != null && monthlyUsed != null ? Math.max(0, monthlyLimit - monthlyUsed) : null,
      includedValueMultiple: plan.priceMonthly > 0 && monthlyLimit != null ? monthlyLimit / plan.priceMonthly : null,
      workspaceName: consoleLogin?.workspaceName || null,
      upgrade: statusDto.upgradePrice ? {
        amount: usdFromMicroCents(statusDto.upgradePrice.amountMicroCents),
        currency: String(statusDto.upgradePrice.currency || 'usd').toUpperCase(),
      } : null,
    }
    if (subscription.cancelAtPeriodEnd) warnings.push('This Go plan is cancelled and will stop at the end of the current period.')
    if (!subscription.useBalance) warnings.push('Extra usage is off: requests stop at the allowance instead of charging your balance.')
  } else if (usageResult.ok) {
    const monthly = usageResult.body.usage?.monthly
    const monthlyLimit = plan.caps.monthly
    const monthlyUsed = monthly ? (Number(monthly.percent) / 100) * monthlyLimit : null
    subscription = {
      source: 'usage',
      product: plan.id,
      renewalProduct: null,
      plan: plan.name,
      planId: plan.id,
      priceMonthly: plan.priceMonthly,
      currency: 'USD',
      status: monthly?.status === 'rate-limited' ? 'limited' : 'active',
      cancelAtPeriodEnd: null,
      renewalStopReason: null,
      renewalPending: null,
      nextPeriodPaid: null,
      useBalance: null,
      accessStartsAt: monthly?.resetsAt ? (Date.parse(monthly.resetsAt) - 30 * DAY) : null,
      accessEndsAt: monthly?.resetsAt ? Date.parse(monthly.resetsAt) : null,
      monthlyLimit,
      monthlyUsed,
      monthlyRemaining: monthlyUsed != null ? Math.max(0, monthlyLimit - monthlyUsed) : null,
      includedValueMultiple: plan.priceMonthly > 0 ? monthlyLimit / plan.priceMonthly : null,
      workspaceName: null,
      upgrade: null,
    }
    warnings.push('OpenCode sign-in was not found, so renewal state and exact spend come from the percentage usage API.')
  }

  if (!consoleLogin) {
    warnings.push('Sign in to OpenCode on this machine to unlock exact Console billing data.')
  }
  if (!savedKeys.length) {
    warnings.push('No OpenCode Go API key was found. Save one to load the usage API.')
  }
  if (statusResult && !statusResult.ok && consoleLogin) {
    errors.push(`Console status: HTTP ${statusResult.status || 'error'}${statusResult.text ? ` — ${statusResult.text}` : ''}`)
  }
  if (!usageResult.ok && savedKeys.length) {
    errors.push(`Usage API: ${usageResult.error || 'unavailable'}`)
  }
  if (modelResult.authenticated && modelResult.data.length === 0) {
    warnings.push('The authenticated model catalog returned no models; showing the public catalog instead.')
  }

  const baseAllowance = baseAllowanceFor(plan.id)
  const basePercent = monthMeter?.percent ?? null
  const baseUsed = basePercent != null ? (basePercent / 100) * baseAllowance : null
  const baseRemaining = baseUsed != null ? Math.max(0, baseAllowance - baseUsed) : null
  const rawModels = modelResult.data
  const models = normalizeModels(rawModels).map((model) => ({
    ...model,
    available: workspaceIds ? workspaceIds.has(model.id) : null,
    ...modelAllowanceInfo(model, plan.id, baseAllowance, baseUsed, baseRemaining),
  }))

  let currentModelId = null
  try {
    const selection = ctx.get?.('agentDefaultModel')?.currentSelection?.()
    if (selection?.provider && config.providers.includes(String(selection.provider))) {
      currentModelId = String(selection.model)
    }
  } catch {
    // The default-model service is optional.
  }
  if (!currentModelId || !models.some((model) => model.id === currentModelId)) {
    currentModelId = models.find((model) => !model.free)?.id || models[0]?.id || null
  }
  const currentModel = models.find((model) => model.id === currentModelId) || null

  const allowance = {
    baseAllowance,
    baseUsed,
    baseRemaining,
    basePercent,
    currentModelId: currentModel?.id || null,
    currentModelName: currentModel?.name || null,
    currentModelAllowance: currentModel?.monthlyAllowance ?? null,
    currentModelUnlimited: Boolean(currentModel?.unlimited),
    currentModelBurnMultiplier: currentModel?.burnMultiplier ?? null,
    currentModelRemainingIfExclusive: currentModel?.remainingIfExclusive ?? null,
    published: Boolean(currentModel?.allowancePublished),
  }

  if (currentModel && !currentModel.allowancePublished) {
    warnings.push(`No published monthly allowance is available for ${currentModel.name}.`)
  }
  if (models.length === 0) {
    warnings.push('The model catalog is empty; per-model rates and allowances are unavailable.')
  }

  const keySource = usageResult.ok ? usageResult.candidate?.source : savedKeys[0]?.source
  return {
    ok: true,
    version: 2,
    fetchedAt: Date.now(),
    connected: Boolean(subscription || usageResult.ok),
    auth: {
      key: {
        configured: savedKeys.length > 0,
        source: keySource || null,
        error: usageResult.ok ? null : (usageResult.error || null),
      },
      console: {
        configured: Boolean(consoleLogin),
        source: consoleLogin?.source || null,
        workspaceName: consoleLogin?.workspaceName || null,
      },
    },
    subscription,
    meters: meterList,
    allowance,
    currentModel,
    models,
    modelScope: workspaceIds ? 'workspace' : 'catalog',
    availableCount: workspaceIds ? workspaceIds.size : null,
    warnings: [...new Set(warnings)],
    errors: [...new Set(errors)],
  }
}

export function createProvider(ctx, rawConfig = {}) {
  const config = configFor(rawConfig)
  const refreshMs = Math.max(60, Number(config.refreshSeconds) || 300) * 1000
  let cache = null
  let cacheUntil = 0
  let inflight = null

  async function get(force = false) {
    if (!force && cache && Date.now() < cacheUntil) return cache
    if (inflight) return inflight
    inflight = buildSnapshot(ctx, config)
      .then((snapshot) => {
        cache = snapshot
        cacheUntil = Date.now() + refreshMs
        return snapshot
      })
      .finally(() => {
        inflight = null
      })
    return inflight
  }

  async function connect(apiKey) {
    const value = String(apiKey || '').trim()
    if (value.length < 20) throw new Error('That does not look like an OpenCode API key.')
    const credentials = ctx.get?.('credentials')
    let stored = false
    if (credentials?.set) {
      try {
        await credentials.set(config.apiKeyEnv, value)
        stored = true
      } catch {
        // Fall through to the panel's private file when no writable store exists.
      }
    }
    if (!stored) {
      const dir = join(process.env.DSH_HOME || join(homedir(), '.dsh'), 'opencode-go')
      await mkdir(dir, { recursive: true, mode: 0o700 })
      await writeFile(join(dir, 'api-key'), `${value}\n`, { encoding: 'utf8', mode: 0o600 })
    }
    cache = null
    cacheUntil = 0
    return get(true)
  }

  return { get, connect }
}
