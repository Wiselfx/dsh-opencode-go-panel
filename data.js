/**
 * OpenCode Go API provider for the Harness panel.
 *
 * Everything the panel shows comes from OpenCode Go itself:
 * - subscription state and exact dollar meters from the Console status API;
 * - a percentage-only usage fallback from the inference API;
 * - the model catalog with its published per-million-token rates.
 *
 * OpenCode exposes dollars and percentages, not token totals, so the panel
 * never estimates or reconstructs tokens from local session logs.
 */
const DEFAULT_API_ORIGIN = 'https://opencode.ai'
/** The panel's own credential record: `<package>/<id>` in the Harness record space. */
const CREDENTIAL_RECORD = 'dsh-opencode-go-panel/api-key'
const USER_AGENT = 'dsh-opencode-go-panel/1.4.0'
const MICROCENTS_PER_USD = 100_000_000
const DAY = 86_400_000
const HOUR = 3_600_000
const MIN_REFRESH_SECONDS = 60
const USAGE_CACHE_MS = 60_000
const USAGE_MAX_BYTES = 16 * 1024 * 1024
const USAGE_RANGES = new Set(['today', 'month', '90d'])
const USAGE_COLUMNS = [
  'day', 'provider', 'model', 'requests', 'input_tokens', 'output_tokens',
  'cache_read_tokens', 'cache_write_5m_tokens', 'cache_write_1h_tokens', 'cost_micro_cents',
]

/** Plan names and monthly prices. Dollar meters themselves always come from the API. */
const PLANS = {
  go: { name: 'Go', priceMonthly: 10 },
  'go-plus': { name: 'Go Plus', priceMonthly: 40 },
  'go-teams': { name: 'Go Teams', priceMonthly: 20 },
}

const DEFAULT_CONFIG = {
  providers: ['opencode-go'],
  refreshSeconds: 300,
  plan: 'go',
  monthlyPriceUsd: null,
  apiOrigin: DEFAULT_API_ORIGIN,
}

/** A failure the panel UI can localize from its `code`. */
export class PanelApiError extends Error {
  constructor(code, status = 500, detail = null) {
    super(code)
    this.name = 'PanelApiError'
    this.code = code
    this.status = status
    this.detail = detail
  }
}

function errorMessage(error) {
  return error instanceof Error ? error.message : String(error)
}

function configFor(config = {}) {
  const refreshSeconds = Number(config.refreshSeconds)
  return {
    providers: Array.isArray(config.providers) && config.providers.length
      ? config.providers.map(String)
      : [...DEFAULT_CONFIG.providers],
    refreshSeconds: Number.isFinite(refreshSeconds)
      ? Math.max(MIN_REFRESH_SECONDS, Math.round(refreshSeconds))
      : DEFAULT_CONFIG.refreshSeconds,
    plan: typeof config.plan === 'string' ? config.plan : DEFAULT_CONFIG.plan,
    monthlyPriceUsd: Number.isFinite(config.monthlyPriceUsd) ? config.monthlyPriceUsd : null,
    apiOrigin: typeof config.apiOrigin === 'string' && config.apiOrigin.trim()
      ? config.apiOrigin.trim().replace(/\/+$/, '')
      : DEFAULT_API_ORIGIN,
  }
}

function usdFromMicroCents(value) {
  if (value === null || value === undefined || value === '') return null
  const n = Number(value)
  return Number.isFinite(n) ? n / MICROCENTS_PER_USD : null
}

function numberOrNull(value) {
  return Number.isFinite(value) ? value : null
}

function dateOrNull(value) {
  return typeof value === 'string' && value ? Date.parse(value) || null : null
}

function modelKey(value) {
  return String(value || '').toLowerCase().replace(/^[^/]+\//, '')
}

function authorization(key) {
  return { authorization: `Bearer ${key}` }
}

function reasonForStatus(status) {
  if (status === 401) return 'invalid-key'
  if (status === 403) return 'forbidden'
  if (status === 0) return 'network'
  return 'http'
}

async function fetchJson(url, headers = {}, timeoutMs = 15_000) {
  const response = await fetch(url, {
    headers: { accept: 'application/json', 'user-agent': USER_AGENT, ...headers },
    signal: AbortSignal.timeout(timeoutMs),
  })
  const text = await response.text()
  let body = null
  try {
    body = text.length ? JSON.parse(text) : null
  } catch {
    body = null
  }
  return { ok: response.ok, status: response.status, body, text: text.slice(0, 300) }
}

/** A short, human-readable fragment of a failed response for the panel's error line. */
function remoteDetail(result) {
  const remote = result.body?.error || result.body?.message
  if (typeof remote === 'string' && remote) return remote
  if (result.text) return result.text
  return `HTTP ${result.status}`
}

async function readConsoleStatus(config, key) {
  try {
    const result = await fetchJson(`${config.apiOrigin}/console/api/go/status`, authorization(key))
    if (result.ok && result.body?.access) return { ok: true, body: result.body }
    if (result.ok) return { ok: false, status: 200, reason: 'no-subscription', detail: remoteDetail(result) }
    return { ok: false, status: result.status, reason: reasonForStatus(result.status), detail: remoteDetail(result) }
  } catch (error) {
    return { ok: false, status: 0, reason: 'network', detail: errorMessage(error) }
  }
}

async function readBilling(config, key) {
  try {
    const result = await fetchJson(`${config.apiOrigin}/console/api/billing/status`, authorization(key))
    if (result.ok && result.body) return { ok: true, body: result.body }
    return { ok: false, status: result.status, reason: reasonForStatus(result.status), detail: remoteDetail(result) }
  } catch (error) {
    return { ok: false, status: 0, reason: 'network', detail: errorMessage(error) }
  }
}

async function readUsage(config, key) {
  try {
    const result = await fetchJson(`${config.apiOrigin}/zen/go/v1/usage`, authorization(key))
    if (result.ok && result.body?.usage) return { ok: true, body: result.body }
    return { ok: false, status: result.status, reason: reasonForStatus(result.status), detail: remoteDetail(result) }
  } catch (error) {
    return { ok: false, status: 0, reason: 'network', detail: errorMessage(error) }
  }
}

/**
 * Read the model catalog. An authenticated call returns the models this
 * workspace may use; a public call is the fallback. The public call never
 * inherits the authenticated result, so workspace availability is never
 * inferred from the public catalog.
 */
async function readModels(config, key) {
  const urls = [
    `${config.apiOrigin}/zen/go/v1/models`,
    `${config.apiOrigin}/inference/go/v1/models`,
  ]
  for (const url of urls) {
    try {
      const result = await fetchJson(url, key ? authorization(key) : {})
      if (result.ok && Array.isArray(result.body?.data)) {
        return { data: result.body.data, source: key ? 'workspace' : 'public' }
      }
    } catch {
      // Try the alternate catalog URL.
    }
  }
  return { data: [], source: 'none' }
}

/** Verify a pasted key before it is stored, so a typo never replaces a working key. */
async function probeKey(config, key) {
  const status = await readConsoleStatus(config, key)
  if (status.ok) return { ok: true }
  const usage = await readUsage(config, key)
  if (usage.ok) return { ok: true }
  const failure = status.reason === 'network' && usage.reason !== 'network' ? usage : status
  return { ok: false, reason: failure.reason, detail: failure.detail }
}

async function readStoredKey(ctx) {
  const credentials = ctx.get?.('credentials')
  if (!credentials?.readRecord) return { key: null }
  try {
    const record = await credentials.readRecord(CREDENTIAL_RECORD)
    if (record?.kind === 'api-key' && typeof record.key === 'string') {
      const key = record.key.trim()
      if (key.length >= 8) return { key }
    }
  } catch {
    // An unreadable store means no key is available; the panel reports it when saving.
  }
  return { key: null }
}

function planFor(product, config) {
  const requested = typeof product === 'string' ? product : ''
  const id = PLANS[requested] ? requested : (PLANS[config.plan] ? config.plan : 'go')
  const plan = PLANS[id]
  return {
    id,
    name: plan.name,
    priceMonthly: Number.isFinite(config.monthlyPriceUsd) ? config.monthlyPriceUsd : plan.priceMonthly,
  }
}

function buildMeter(key, {
  limit, used, percent: givenPercent, startsAt, resetsAt, rateLimited = false, estimated = false,
}) {
  const now = Date.now()
  const usable = limit != null && limit > 0 && used != null
  const percent = usable
    ? Math.max(0, Math.min(100, (used / limit) * 100))
    : Math.max(0, Math.min(100, Number(givenPercent) || 0))
  const elapsed = startsAt && resetsAt && resetsAt > startsAt
    ? Math.max(0, Math.min(1, (now - startsAt) / (resetsAt - startsAt)))
    : null
  return {
    key,
    used: used ?? null,
    limit: limit ?? null,
    remaining: limit != null && used != null ? Math.max(0, limit - used) : null,
    percent,
    startsAt: startsAt || null,
    resetsAt: resetsAt || null,
    elapsed,
    pace: elapsed != null && elapsed > 0.02 ? percent / 100 / elapsed : null,
    rateLimited: Boolean(rateLimited),
    estimated: Boolean(estimated) || limit == null,
  }
}

function statusMeters(statusDto) {
  const access = statusDto?.access || {}
  const meters = access.meters || {}
  const raw = [
    ['rolling', meters.fiveHour, access.startsAt],
    ['weekly', meters.week, access.startsAt],
    ['monthly', meters.month, access.startsAt],
  ]
  return raw.map(([key, meter, fallbackStart]) => {
    if (!meter) return null
    return buildMeter(key, {
      limit: usdFromMicroCents(meter.limitMicroCents),
      used: usdFromMicroCents(meter.usedMicroCents),
      startsAt: dateOrNull(meter.startsAt) || dateOrNull(fallbackStart),
      resetsAt: dateOrNull(meter.resetsAt),
      rateLimited: meter.status === 'rate-limited',
    })
  }).filter(Boolean)
}

/** The percentage API has no dollar pool: expose percentages only, never invented dollars. */
function usageMeters(usageDto) {
  const usage = usageDto?.usage || {}
  const settings = [
    ['rolling', usage.rolling, 5 * HOUR],
    ['weekly', usage.weekly, 7 * DAY],
    ['monthly', usage.monthly, 30 * DAY],
  ]
  return settings.map(([key, meter, length]) => {
    if (!meter) return null
    const resetsAt = dateOrNull(meter.resetsAt)
    return buildMeter(key, {
      percent: meter.percent,
      startsAt: resetsAt != null ? resetsAt - length : null,
      resetsAt,
      rateLimited: meter.status === 'rate-limited',
      estimated: true,
    })
  }).filter(Boolean)
}

const UTC_DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

function clockMinutes(value) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(String(value || ''))
  return match ? Number(match[1]) * 60 + Number(match[2]) : null
}

function hourRangeMatches(range, minutes) {
  if (!range || typeof range !== 'object') return true
  const gte = clockMinutes(range.gte)
  const gt = clockMinutes(range.gt)
  const lte = clockMinutes(range.lte)
  const lt = clockMinutes(range.lt)
  if (gte != null && minutes < gte) return false
  if (gt != null && minutes <= gt) return false
  if (lte != null && minutes > lte) return false
  if (lt != null && minutes >= lt) return false
  return true
}

/** Evaluate the model API's `when` expression (UTC days and hour windows). */
function whenMatches(when, at) {
  if (!when || typeof when !== 'object') return true
  const day = UTC_DAYS[at.getUTCDay()]
  const minutes = at.getUTCHours() * 60 + at.getUTCMinutes()
  const dayList = (list) => Array.isArray(list) ? list.map((entry) => String(entry).toLowerCase()) : null
  if (Array.isArray(when.utc_days)) {
    const days = dayList(when.utc_days)
    if (!days.includes(day)) return false
  } else if (when.utc_days && typeof when.utc_days === 'object') {
    const included = dayList(when.utc_days.in)
    const excluded = dayList(when.utc_days.not_in)
    if (included && !included.includes(day)) return false
    if (excluded && excluded.includes(day)) return false
  }
  if (when.utc_hours && !hourRangeMatches(when.utc_hours, minutes)) return false
  if (Array.isArray(when.all) && !when.all.every((condition) => whenMatches(condition, at))) return false
  if (Array.isArray(when.any) && !when.any.some((condition) => whenMatches(condition, at))) return false
  return true
}

function multiplierFactor(multiplier) {
  const factor = Number(multiplier?.factor)
  return Number.isFinite(factor) && factor > 1 ? factor : null
}

/** Published peak factor and whether it applies at `at` (the API schedule is UTC). */
function peakState(multipliers, at) {
  if (!Array.isArray(multipliers)) return { peakFactor: null, peakActive: false }
  let scheduled = null
  let active = null
  for (const multiplier of multipliers) {
    const factor = multiplierFactor(multiplier)
    if (factor === null) continue
    scheduled = scheduled === null ? factor : Math.max(scheduled, factor)
    if (whenMatches(multiplier.when, at)) active = active === null ? factor : Math.max(active, factor)
  }
  return { peakFactor: scheduled, peakActive: active !== null }
}

function normalizeModels(raw, at = new Date()) {
  return raw.map((model) => {
    const text = model?.cost?.text || {}
    const rates = {
      input: numberOrNull(text.input?.price) ?? 0,
      output: numberOrNull(text.output?.price) ?? 0,
      cacheRead: numberOrNull(text.input?.cache?.read) ?? 0,
    }
    const peak = peakState(model?.cost?.multipliers, at)
    return {
      id: String(model?.id || ''),
      name: typeof model?.name === 'string' && model.name ? model.name : String(model?.id || ''),
      context: numberOrNull(model?.limit?.context),
      maxTokens: numberOrNull(model?.limit?.output),
      rates,
      free: rates.input === 0 && rates.output === 0,
      peakFactor: peak.peakFactor,
      peakActive: peak.peakActive,
    }
  }).filter((model) => model.id)
}

function subscriptionFromStatus(statusDto, plan) {
  const access = statusDto.access || {}
  return {
    source: 'console',
    plan: plan.name,
    priceMonthly: plan.priceMonthly,
    currency: String(statusDto.renewalCurrency || 'usd').toUpperCase(),
    status: statusDto.cancelAtPeriodEnd ? 'cancelling' : 'active',
    cancelAtPeriodEnd: Boolean(statusDto.cancelAtPeriodEnd),
    renewalStopReason: typeof statusDto.renewalStopReason === 'string' ? statusDto.renewalStopReason : null,
    resumability: typeof statusDto.resumability === 'string' ? statusDto.resumability : null,
    nextPeriodPaid: typeof statusDto.nextPeriodPaid === 'boolean' ? statusDto.nextPeriodPaid : null,
    renewalPending: typeof statusDto.renewalPending === 'boolean' ? statusDto.renewalPending : null,
    useBalance: typeof statusDto.useBalance === 'boolean' ? statusDto.useBalance : null,
    needsPaymentMethod: statusDto.resumability === 'needs-payment-method',
    accessEndsAt: dateOrNull(access.endsAt),
    upgrade: statusDto.upgradePrice ? {
      amount: usdFromMicroCents(statusDto.upgradePrice.amountMicroCents),
      currency: String(statusDto.upgradePrice.currency || 'usd').toUpperCase(),
    } : null,
    teams: statusDto.teamsUpgradePrice ? {
      amount: usdFromMicroCents(statusDto.teamsUpgradePrice.amountMicroCents),
      currency: String(statusDto.teamsUpgradePrice.currency || 'usd').toUpperCase(),
      memberCount: numberOrNull(statusDto.teamsUpgradePrice.memberCount),
    } : null,
  }
}

function subscriptionFromUsage(usageDto, plan) {
  const resetsAt = dateOrNull(usageDto?.usage?.monthly?.resetsAt)
  return {
    source: 'usage',
    plan: plan.name,
    priceMonthly: plan.priceMonthly,
    currency: 'USD',
    status: 'active',
    cancelAtPeriodEnd: null,
    renewalStopReason: null,
    resumability: null,
    nextPeriodPaid: null,
    renewalPending: null,
    useBalance: null,
    needsPaymentMethod: false,
    accessEndsAt: resetsAt,
    upgrade: null,
    teams: null,
  }
}

function billingFrom(dto) {
  if (!dto) return null
  const mode = dto.mode || dto.billingMode
  return {
    mode: typeof mode === 'string' ? mode : null,
    balance: usdFromMicroCents(dto.balanceMicroCents),
    available: usdFromMicroCents(dto.availableMicroCents),
    creditLimit: usdFromMicroCents(dto.creditLimitMicroCents),
    canPurchaseCredits: typeof dto.canPurchaseCredits === 'boolean' ? dto.canPurchaseCredits : null,
    canEnableAutoRecharge: typeof dto.canEnableAutoRecharge === 'boolean' ? dto.canEnableAutoRecharge : null,
  }
}

function selectCurrentModel(ctx, config, models) {
  let selected = null
  try {
    const selection = ctx.get?.('agentDefaultModel')?.currentSelection?.()
    if (selection?.provider
      && config.providers.includes(String(selection.provider))
      && selection.model) {
      selected = String(selection.model)
    }
  } catch {
    // The default-model service is optional.
  }
  const match = (id) => models.find((model) => modelKey(model.id) === modelKey(id)) || null
  return (selected ? match(selected) : null) || models.find((model) => !model.free) || models[0] || null
}

function emptySnapshot(config) {
  return {
    ok: true,
    version: 3,
    fetchedAt: Date.now(),
    refreshSeconds: config.refreshSeconds,
    connected: false,
    auth: {
      key: { configured: false },
      console: { configured: false },
    },
    subscription: null,
    billing: null,
    meters: [],
    currentModelId: null,
    models: [],
    warnings: [],
    errors: [],
  }
}

function utcDay(ms) {
  return new Date(ms).toISOString().slice(0, 10)
}

/** RFC 4180 rows, including quoted fields with commas, CRLF and doubled quotes. */
function csvRecords(text) {
  const csv = text.replace(/^\uFEFF/, '')
  if (!csv || csv.includes('\u0000')) return null
  const records = []
  let row = []
  let field = ''
  let quoted = false
  let ended = false
  for (let index = 0; index < csv.length; index++) {
    const char = csv[index]
    ended = false
    if (quoted) {
      if (char === '"') {
        if (csv[index + 1] === '"') { field += '"'; index++ } else quoted = false
      } else field += char
      continue
    }
    if (char === '"') { quoted = true; continue }
    if (char === ',') { row.push(field); field = ''; continue }
    if (char === '\r' || char === '\n') {
      if (char === '\r') {
        if (csv[index + 1] !== '\n') return null
        index++
      }
      row.push(field)
      if (row.some((value) => value !== '')) records.push(row)
      row = []
      field = ''
      ended = true
      continue
    }
    field += char
  }
  if (quoted) return null
  if (!ended) {
    row.push(field)
    if (row.some((value) => value !== '')) records.push(row)
  }
  return records
}

function csvInteger(value) {
  const text = String(value ?? '').trim()
  if (!/^\d{1,15}$/.test(text)) return null
  const number = Number(text)
  return Number.isSafeInteger(number) ? number : null
}

function parseUsageCsv(text) {
  const records = csvRecords(text)
  if (!records || records.length === 0) throw new PanelApiError('USAGE_INVALID', 502)
  const header = records[0].map((column) => column.trim())
  const columns = new Map(header.map((column, index) => [column, index]))
  if (USAGE_COLUMNS.some((column) => !columns.has(column))) {
    throw new PanelApiError('USAGE_INVALID', 502)
  }
  const rows = []
  for (const fields of records.slice(1)) {
    if (fields.length < header.length) continue
    const get = (column) => fields[columns.get(column)]
    const day = get('day').trim()
    const provider = get('provider').trim().slice(0, 200)
    const model = get('model').trim().slice(0, 200)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !provider || !model) continue
    const requests = csvInteger(get('requests'))
    const inputTokens = csvInteger(get('input_tokens'))
    const outputTokens = csvInteger(get('output_tokens'))
    const cacheReadTokens = csvInteger(get('cache_read_tokens'))
    const cacheWrite5m = csvInteger(get('cache_write_5m_tokens'))
    const cacheWrite1h = csvInteger(get('cache_write_1h_tokens'))
    const costMicroCents = csvInteger(get('cost_micro_cents'))
    if ([requests, inputTokens, outputTokens, cacheReadTokens, cacheWrite5m, cacheWrite1h, costMicroCents]
      .some((value) => value === null)) continue
    rows.push({
      day,
      provider,
      model,
      requests,
      inputTokens,
      outputTokens,
      cacheReadTokens,
      cacheWriteTokens: cacheWrite5m + cacheWrite1h,
      costMicroCents,
    })
  }
  return rows
}

async function fetchUsageRows(config, key) {
  const url = `${config.apiOrigin}/console/api/v2/usage/export?range=90d`
  let response
  try {
    response = await fetch(url, {
      headers: {
        ...authorization(key),
        accept: 'text/csv',
        'accept-encoding': 'identity',
        'user-agent': USER_AGENT,
      },
      redirect: 'error',
      signal: AbortSignal.timeout(30_000),
    })
  } catch (error) {
    throw new PanelApiError('USAGE_NETWORK', 502, errorMessage(error))
  }
  if (!response.ok) {
    const code = response.status === 401 || response.status === 403
      ? 'USAGE_PERMISSION'
      : response.status === 429 ? 'USAGE_RATE_LIMITED' : 'USAGE_UPSTREAM'
    throw new PanelApiError(code, 502, `HTTP ${response.status}`)
  }
  if (!/^text\/csv(?:\s*;|$)/i.test(response.headers.get('content-type') || '')) {
    throw new PanelApiError('USAGE_INVALID', 502)
  }
  let text
  try {
    text = await response.text()
  } catch (error) {
    throw new PanelApiError('USAGE_NETWORK', 502, errorMessage(error))
  }
  if (!text || Buffer.byteLength(text) > USAGE_MAX_BYTES) {
    throw new PanelApiError('USAGE_INVALID', 502)
  }
  return parseUsageCsv(text)
}

function emptyUsageTotals() {
  return {
    requests: 0,
    inputTokens: 0,
    outputTokens: 0,
    cacheReadTokens: 0,
    cacheWriteTokens: 0,
    tokens: 0,
    costUsd: 0,
  }
}

function addUsageTotals(target, row) {
  target.requests += row.requests
  target.inputTokens += row.inputTokens
  target.outputTokens += row.outputTokens
  target.cacheReadTokens += row.cacheReadTokens
  target.cacheWriteTokens += row.cacheWriteTokens
  target.costUsd += row.costMicroCents / MICROCENTS_PER_USD
}

function finishUsageTotals(totals) {
  totals.tokens = totals.inputTokens + totals.outputTokens + totals.cacheReadTokens + totals.cacheWriteTokens
  return totals
}

function buildUsageReport(rows, range, now = Date.now()) {
  const today = utcDay(now)
  const from = range === 'today'
    ? today
    : range === 'month' ? `${today.slice(0, 8)}01` : utcDay(now - 89 * DAY)
  const selected = rows.filter((row) => row.day >= from && row.day <= today)
  const totals = emptyUsageTotals()
  const byModel = new Map()
  const days = new Set()
  let firstDay = null
  let lastDay = null
  for (const row of selected) {
    addUsageTotals(totals, row)
    days.add(row.day)
    firstDay = firstDay === null || row.day < firstDay ? row.day : firstDay
    lastDay = lastDay === null || row.day > lastDay ? row.day : lastDay
    const id = JSON.stringify([row.provider, row.model])
    let model = byModel.get(id)
    if (!model) {
      model = { provider: row.provider, model: row.model, ...emptyUsageTotals() }
      byModel.set(id, model)
    }
    addUsageTotals(model, row)
  }
  finishUsageTotals(totals)
  return {
    range,
    generatedAt: now,
    from,
    to: today,
    apiLimitDays: 90,
    coverage: { from: firstDay, to: lastDay, days: days.size },
    totals,
    byModel: [...byModel.values()]
      .map(finishUsageTotals)
      .sort((left, right) => right.costUsd - left.costUsd
        || left.model.localeCompare(right.model)),
  }
}

async function buildSnapshot(ctx, config) {
  const stored = await readStoredKey(ctx)
  if (!stored.key) return emptySnapshot(config)
  const key = stored.key

  const [consoleResult, billingResult, usageResult, publicModels, workspaceModels] = await Promise.all([
    readConsoleStatus(config, key),
    readBilling(config, key),
    readUsage(config, key),
    readModels(config, null),
    readModels(config, key),
  ])

  const errors = []
  const warnings = []
  const statusDto = consoleResult.ok ? consoleResult.body : null
  const plan = planFor(statusDto?.product || config.plan, config)
  const meters = statusDto
    ? statusMeters(statusDto)
    : (usageResult.ok ? usageMeters(usageResult.body) : [])
  const subscription = statusDto
    ? subscriptionFromStatus(statusDto, plan)
    : (usageResult.ok ? subscriptionFromUsage(usageResult.body, plan) : null)
  const billing = billingFrom(billingResult.ok ? billingResult.body : null)

  // Prefer the authenticated catalog: it lists the models this workspace can actually use.
  const catalog = workspaceModels.data.length
    ? workspaceModels
    : (publicModels.data.length ? publicModels : { data: [], source: 'none' })
  if (catalog.source === 'public') warnings.push({ code: 'models-public' })
  if (catalog.data.length === 0) warnings.push({ code: 'catalog-empty' })

  const models = normalizeModels(catalog.data, new Date())
  const current = selectCurrentModel(ctx, config, models)

  if (!consoleResult.ok) {
    errors.push({ code: 'console', reason: consoleResult.reason, detail: consoleResult.detail })
  }
  if (!statusDto && !usageResult.ok) {
    errors.push({ code: 'usage', reason: usageResult.reason, detail: usageResult.detail })
  }

  return {
    ok: true,
    version: 3,
    fetchedAt: Date.now(),
    refreshSeconds: config.refreshSeconds,
    connected: true,
    auth: {
      key: { configured: true },
      console: { configured: Boolean(statusDto) },
    },
    subscription,
    billing,
    meters,
    currentModelId: current?.id ?? null,
    models,
    warnings,
    errors,
  }
}

export function createProvider(ctx, rawConfig = {}) {
  const config = configFor(rawConfig)
  const cacheMs = config.refreshSeconds * 1000
  let cache = null
  let cacheUntil = 0
  let inflight = null
  let inflightGeneration = 0
  let generation = 0
  let usageRows = null
  let usageRowsAt = 0
  let usageInflight = null
  let usageInflightGeneration = 0

  /** A credential change invalidates every snapshot and usage report built before it. */
  function invalidate() {
    cache = null
    cacheUntil = 0
    usageRows = null
    usageRowsAt = 0
    usageInflight = null
    generation += 1
  }

  async function get(force = false) {
    if (!force && cache && Date.now() < cacheUntil) return cache
    if (inflight && inflightGeneration === generation) return inflight
    const buildGeneration = generation
    const build = buildSnapshot(ctx, config)
      .then((snapshot) => {
        if (buildGeneration === generation) {
          cache = snapshot
          cacheUntil = Date.now() + cacheMs
        }
        return snapshot
      })
      .finally(() => {
        if (inflight === build) inflight = null
      })
    inflight = build
    inflightGeneration = buildGeneration
    return build
  }

  /** Verify, then store, a key. A rejected key never replaces a working one. */
  async function connect(apiKey) {
    const value = String(apiKey ?? '').trim()
    if (value.length < 20 || /\s/.test(value)) {
      throw new PanelApiError('INVALID_KEY_FORMAT', 400)
    }
    const probe = await probeKey(config, value)
    if (!probe.ok) throw new PanelApiError('KEY_REJECTED', 400, probe.detail)
    const credentials = ctx.get?.('credentials')
    if (!credentials?.modifyRecord) throw new PanelApiError('STORE_UNAVAILABLE', 500)
    try {
      await credentials.modifyRecord(CREDENTIAL_RECORD, async () => ({ kind: 'api-key', key: value }))
    } catch (error) {
      throw new PanelApiError('STORE_UNAVAILABLE', 500, errorMessage(error))
    }
    invalidate()
    return get(true)
  }

  /** Remove the stored key; the panel returns to its connect state. */
  async function disconnect() {
    const credentials = ctx.get?.('credentials')
    if (!credentials?.deleteRecord) throw new PanelApiError('STORE_UNAVAILABLE', 500)
    try {
      await credentials.deleteRecord(CREDENTIAL_RECORD)
    } catch (error) {
      throw new PanelApiError('STORE_UNAVAILABLE', 500, errorMessage(error))
    }
    invalidate()
    return get(true)
  }

  /** Official workspace usage history: one 90-day export, filtered to the requested range. */
  async function getUsage(range = 'month', force = false) {
    const selected = typeof range === 'string' ? range : 'month'
    if (!USAGE_RANGES.has(selected)) throw new PanelApiError('INVALID_RANGE', 400)
    const stored = await readStoredKey(ctx)
    if (!stored.key) throw new PanelApiError('NO_KEY', 400)
    const now = Date.now()
    if (!force && usageRows && now - usageRowsAt < USAGE_CACHE_MS) {
      return buildUsageReport(usageRows, selected, now)
    }
    const buildGeneration = generation
    if (!usageInflight || usageInflightGeneration !== buildGeneration) {
      const task = fetchUsageRows(config, stored.key)
        .then((rows) => {
          if (buildGeneration === generation) {
            usageRows = rows
            usageRowsAt = Date.now()
          }
          return rows
        })
        .finally(() => {
          if (usageInflight === task) usageInflight = null
        })
      usageInflight = task
      usageInflightGeneration = buildGeneration
    }
    const rows = await usageInflight
    return buildUsageReport(rows, selected, Date.now())
  }

  return { get, connect, disconnect, getUsage }
}
