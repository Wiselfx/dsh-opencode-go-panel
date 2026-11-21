import { test } from 'node:test'
import { strict as assert } from 'node:assert'
import { createProvider, PanelApiError } from '../data.js'

const KEY = 'oc_sk_test_1234567890abcdef'
const RECORD = 'dsh-opencode-go-panel/api-key'

const STATUS = {
  product: 'go',
  renewalCurrency: 'usd',
  useBalance: false,
  cancelAtPeriodEnd: true,
  renewalStopReason: 'cancelled_by_user',
  resumability: 'needs-payment-method',
  renewalPending: false,
  nextPeriodPaid: false,
  access: {
    startsAt: '2026-11-03T05:56:29.000Z',
    endsAt: '2026-12-03T05:56:29.000Z',
    meters: {
      fiveHour: {
        startsAt: '2026-11-21T07:41:12.000Z',
        resetsAt: '2026-11-21T12:41:12.000Z',
        limitMicroCents: '1200000000',
        usedMicroCents: '12888440',
      },
      week: {
        startsAt: '2026-11-16T00:00:00.000Z',
        resetsAt: '2026-11-23T00:00:00.000Z',
        limitMicroCents: '3000000000',
        usedMicroCents: '91822624',
      },
      month: {
        resetsAt: '2026-12-03T05:56:29.000Z',
        limitMicroCents: '6000000000',
        usedMicroCents: '1500000000',
      },
    },
  },
  upgradePrice: { amountMicroCents: '3241000000', currency: 'usd' },
  teamsUpgradePrice: { amountMicroCents: '3241000000', currency: 'usd', memberCount: 2 },
}

const USAGE = {
  usage: {
    rolling: { status: 'ok', percent: 1, resetsAt: '2026-11-21T12:41:12.000Z' },
    weekly: { status: 'ok', percent: 3, resetsAt: '2026-11-23T00:00:00.000Z' },
    monthly: { status: 'ok', percent: 24, resetsAt: '2026-12-03T05:56:29.000Z' },
  },
}

const USAGE_CSV = [
  'day,user_type,user_id,user_name,provider,model,requests,input_tokens,output_tokens,cache_read_tokens,cache_write_5m_tokens,cache_write_1h_tokens,cost_micro_cents,cost_usd',
  '2026-11-21,user,user_1,"Doe, Jane",opencode,deepseek-v4.1-flash,10,1000,2000,3000,40,60,250000000,2.50',
  '2026-11-21,user,user_2,Bob,opencode,glm-5.3,5,500,1000,0,0,0,100000000,1.00',
  '2026-11-20,user,user_1,"Doe, Jane",opencode,deepseek-v4.1-flash,2,100,200,300,0,0,50000000,0.50',
  '2026-10-15,user,user_1,Bob,opencode,glm-5.3,7,700,800,0,0,0,70000000,0.70',
  '2026-09-01,user,user_1,Bob,opencode,kimi-k3,1,10,20,0,0,0,1000000,0.01',
  '',
].join('\r\n')

const BILLING = {
  billingMode: 'prepaid',
  mode: 'pay-as-you-go',
  balanceMicroCents: '0',
  creditLimitMicroCents: null,
  availableMicroCents: '0',
  canPurchaseCredits: true,
  canEnableAutoRecharge: true,
}

const MODELS = {
  object: 'list',
  data: [
    {
      id: 'deepseek-v4.1-flash',
      name: 'DeepSeek V4.1 Flash 1017',
      modalities: { input: ['text', 'image/png'] },
      capabilities: { reasoning: { supported: true } },
      limit: { context: 1000000, output: 384000 },
      cost: {
        text: { input: { price: 0.15, cache: { read: 0.003 } }, output: { price: 0.6 } },
        multipliers: [{
          factor: 2,
          when: {
            utc_days: { in: ['mon', 'tue', 'wed', 'thu', 'fri'] },
            any: [
              { all: [{ utc_hours: { gte: '01:00' } }, { utc_hours: { lt: '04:00' } }] },
              { all: [{ utc_hours: { gte: '06:00' } }, { utc_hours: { lt: '10:00' } }] },
            ],
          },
        }],
      },
    },
    {
      id: 'glm-5.3',
      name: 'GLM-5.3',
      limit: { context: 1000000, output: 131072 },
      cost: { text: { input: { price: 1.4, cache: { read: 0.26 } }, output: { price: 4.4 } } },
    },
  ],
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

function createContext({ key = null, withStore = true } = {}) {
  const records = new Map()
  if (key) records.set(RECORD, { kind: 'api-key', key })
  return {
    records,
    get(name) {
      if (name === 'credentials' && withStore) {
        return {
          async readRecord(recordKey) {
            return records.get(recordKey)
          },
          async modifyRecord(recordKey, mutate) {
            const next = await mutate(records.get(recordKey))
            if (next !== undefined) records.set(recordKey, next)
            return records.get(recordKey)
          },
          async deleteRecord(recordKey) {
            records.delete(recordKey)
          },
        }
      }
      if (name === 'agentDefaultModel') {
        return { currentSelection: () => ({ provider: 'opencode-go', model: 'deepseek-v4.1-flash' }) }
      }
      return undefined
    },
  }
}

/** Mock the four OpenCode endpoints; each status is configurable per test. */
function mockApi(t, {
  status = 200, usage = 200, models = 200, authedModels = 200, modelData = MODELS.data,
  usageExport = 200, usageCsv = USAGE_CSV,
} = {}) {
  const calls = []
  t.mock.method(globalThis, 'fetch', async (input, init = {}) => {
    const url = String(input)
    const auth = init.headers?.authorization
    calls.push({ url, auth, method: init.method || 'GET' })
    if (url.endsWith('/console/api/go/status')) {
      return status === 200 ? json(STATUS) : json({ error: 'console unavailable' }, status)
    }
    if (url.includes('/console/api/v2/usage/export')) {
      return usageExport === 200
        ? new Response(usageCsv, { status: 200, headers: { 'content-type': 'text/csv; charset=utf-8' } })
        : json({ error: 'usage export unavailable' }, usageExport)
    }
    if (url.endsWith('/console/api/billing/status')) {
      return status === 200 ? json(BILLING) : json({ error: 'billing unavailable' }, status)
    }
    if (url.endsWith('/zen/go/v1/usage')) {
      return usage === 200 ? json(USAGE) : json({ error: 'usage unavailable' }, usage)
    }
    if (url.endsWith('/zen/go/v1/models')) {
      if (auth) return authedModels === 200 ? json({ ...MODELS, data: modelData }) : json({ error: 'models unavailable' }, authedModels)
      return models === 200 ? json({ ...MODELS, data: modelData }) : json({ error: 'models unavailable' }, models)
    }
    return json({ error: 'not found' }, 404)
  })
  return calls
}

test('no stored key returns the connect state without reading the environment', async (t) => {
  const calls = mockApi(t)
  const previous = process.env.OPENCODE_GO_PANEL_API_KEY
  process.env.OPENCODE_GO_PANEL_API_KEY = KEY
  try {
    const snapshot = await createProvider(createContext(), {}).get()
    assert.equal(snapshot.ok, true)
    assert.equal(snapshot.version, 3)
    assert.equal(snapshot.connected, false)
    assert.equal(snapshot.auth.key.configured, false)
    assert.deepEqual(snapshot.models, [])
    assert.deepEqual(snapshot.errors, [])
    assert.equal(calls.length, 0, 'no key means no OpenCode request and no discovery')
  } finally {
    if (previous === undefined) delete process.env.OPENCODE_GO_PANEL_API_KEY
    else process.env.OPENCODE_GO_PANEL_API_KEY = previous
  }
})

test('Console status builds exact meters and the current model from the real data shape', async (t) => {
  t.mock.timers.enable({ apis: ['Date'], now: Date.UTC(2026, 10, 21, 10, 30, 0) })
  const calls = mockApi(t)
  const snapshot = await createProvider(createContext({ key: KEY }), {}).get()

  assert.equal(snapshot.connected, true)
  assert.equal(snapshot.auth.console.configured, true)
  assert.equal(snapshot.subscription.source, 'console')
  assert.equal(snapshot.subscription.plan, 'Go')
  assert.equal(snapshot.subscription.priceMonthly, 10)
  assert.equal(snapshot.subscription.status, 'cancelling')
  assert.equal(snapshot.subscription.cancelAtPeriodEnd, true)
  assert.equal(snapshot.subscription.needsPaymentMethod, true)
  assert.equal(snapshot.subscription.useBalance, false)

  const monthly = snapshot.meters.find((meter) => meter.key === 'monthly')
  assert.equal(monthly.limit, 60)
  assert.equal(monthly.used, 15)
  assert.equal(monthly.remaining, 45)
  assert.equal(monthly.percent, 25)
  assert.equal(monthly.estimated, false)
  assert.equal(snapshot.meters.length, 3)

  assert.equal(snapshot.currentModelId, 'deepseek-v4.1-flash')
  const deepseek = snapshot.models.find((model) => model.id === 'deepseek-v4.1-flash')
  assert.equal(deepseek.rates.input, 0.15)
  assert.equal(deepseek.rates.output, 0.6)
  assert.equal(deepseek.rates.cacheRead, 0.003)
  assert.equal(deepseek.peakFactor, 2)
  assert.equal(deepseek.peakActive, false, 'Saturday is outside the weekday peak schedule')
  assert.equal(deepseek.context, 1000000)
  assert.equal(deepseek.maxTokens, 384000)

  assert.equal(snapshot.billing.mode, 'pay-as-you-go')
  assert.equal(snapshot.billing.balance, 0)
  assert.equal(snapshot.billing.canEnableAutoRecharge, true)
  assert.deepEqual(snapshot.errors, [])
  assert.deepEqual(snapshot.warnings, [])

  // Read-only: every request is a GET carrying only this key as a Bearer token.
  assert.ok(calls.length > 0)
  assert.ok(calls.every((call) => call.method === 'GET'))
  assert.ok(calls.every((call) => call.url.startsWith('https://opencode.ai/')))
  assert.equal(calls.filter((call) => !call.auth).length, 1)
  assert.ok(calls.filter((call) => call.auth).every((call) => call.auth === `Bearer ${KEY}`))
})

test('a peak multiplier only applies inside its UTC schedule', async (t) => {
  t.mock.timers.enable({ apis: ['Date'], now: Date.UTC(2026, 10, 20, 0, 0, 0) })
  mockApi(t)
  const cases = [
    ['2026-11-20T02:30:00.000Z', true, 'Friday inside 01:00-04:00'],
    ['2026-11-20T05:00:00.000Z', false, 'Friday between windows'],
    ['2026-11-20T06:00:00.000Z', true, 'Friday at the 06:00 boundary'],
    ['2026-11-20T09:59:00.000Z', true, 'Friday inside 06:00-10:00'],
    ['2026-11-20T10:00:00.000Z', false, 'Friday at the 10:00 boundary'],
    ['2026-11-21T02:30:00.000Z', false, 'Saturday'],
    ['2026-11-23T01:00:00.000Z', true, 'Monday at the 01:00 boundary'],
    ['2026-11-23T00:59:00.000Z', false, 'Monday before 01:00'],
  ]
  for (const [iso, expected, label] of cases) {
    t.mock.timers.setTime(Date.parse(iso))
    const snapshot = await createProvider(createContext({ key: KEY }), {}).get(true)
    const model = snapshot.models.find((candidate) => candidate.id === 'deepseek-v4.1-flash')
    assert.equal(model.peakActive, expected, `${label} (${iso})`)
  }
})

test('percentage-only fallback never invents dollar amounts', async (t) => {
  mockApi(t, { status: 403 })
  const snapshot = await createProvider(createContext({ key: KEY }), {}).get()

  assert.equal(snapshot.subscription.source, 'usage')
  assert.equal(snapshot.meters.length, 3)
  const monthly = snapshot.meters.find((meter) => meter.key === 'monthly')
  assert.equal(monthly.limit, null)
  assert.equal(monthly.used, null)
  assert.equal(monthly.remaining, null)
  assert.equal(monthly.percent, 24)
  assert.equal(monthly.estimated, true)
  assert.deepEqual(snapshot.errors.map((entry) => entry.code), ['console'])
  assert.equal(snapshot.errors[0].reason, 'forbidden')
  assert.equal(snapshot.subscription.accessEndsAt, Date.parse(USAGE.usage.monthly.resetsAt))
})

test('a key without a Go subscription is reported clearly', async (t) => {
  t.mock.method(globalThis, 'fetch', async (input) => {
    const url = String(input)
    if (url.endsWith('/console/api/go/status')) return json({ product: 'go' })
    if (url.endsWith('/console/api/billing/status')) return json(BILLING)
    if (url.endsWith('/zen/go/v1/usage')) return json(USAGE)
    if (url.endsWith('/zen/go/v1/models')) return json(MODELS)
    return json({ error: 'not found' }, 404)
  })
  const snapshot = await createProvider(createContext({ key: KEY }), {}).get()
  assert.equal(snapshot.subscription.source, 'usage')
  assert.equal(snapshot.errors[0].code, 'console')
  assert.equal(snapshot.errors[0].reason, 'no-subscription')
})

test('an unreadable workspace catalog uses the public one and says so', async (t) => {
  mockApi(t, { authedModels: 401 })
  const snapshot = await createProvider(createContext({ key: KEY }), {}).get()

  assert.equal(snapshot.models.length, 2)
  assert.deepEqual(snapshot.warnings.map((entry) => entry.code), ['models-public'])
  assert.equal(snapshot.models[0].rates.input, 0.15)
})

test('a prefixed catalog id still matches the configured current model', async (t) => {
  const modelData = [{ ...MODELS.data[0], id: 'opencode-go/deepseek-v4.1-flash' }]
  mockApi(t, { modelData })
  const snapshot = await createProvider(createContext({ key: KEY }), {}).get()
  assert.equal(snapshot.currentModelId, 'opencode-go/deepseek-v4.1-flash')
})

test('short keys are rejected before any network call', async (t) => {
  const calls = mockApi(t)
  const ctx = createContext()
  await assert.rejects(
    () => createProvider(ctx, {}).connect('oc_short'),
    (error) => error instanceof PanelApiError && error.code === 'INVALID_KEY_FORMAT',
  )
  assert.equal(calls.length, 0)
  assert.equal(ctx.records.size, 0)
})

test('a rejected key is not stored and does not replace a working key', async (t) => {
  mockApi(t, { status: 401, usage: 401 })
  const ctx = createContext({ key: KEY })
  const provider = createProvider(ctx, {})
  await assert.rejects(
    () => provider.connect('oc_sk_bad_bad_bad_bad_bad'),
    (error) => error instanceof PanelApiError && error.code === 'KEY_REJECTED',
  )
  assert.equal(ctx.records.get(RECORD).key, KEY)
})

test('a verified key is saved as the panel credential record', async (t) => {
  mockApi(t)
  const ctx = createContext()
  const provider = createProvider(ctx, {})
  const snapshot = await provider.connect(KEY)
  assert.equal(ctx.records.get(RECORD).kind, 'api-key')
  assert.equal(ctx.records.get(RECORD).key, KEY)
  assert.equal(snapshot.connected, true)
  assert.equal(snapshot.subscription.plan, 'Go')
})

test('connect reports a missing credential store instead of writing a plaintext file', async (t) => {
  mockApi(t)
  const ctx = createContext({ withStore: false })
  await assert.rejects(
    () => createProvider(ctx, {}).connect(KEY),
    (error) => error instanceof PanelApiError && error.code === 'STORE_UNAVAILABLE',
  )
})

test('the panel key stays isolated from other plugins and credential references', async (t) => {
  mockApi(t)
  const ctx = createContext()
  ctx.records.set('other-plugin/api-key', { kind: 'api-key', key: 'other-key' })
  const provider = createProvider(ctx, {})
  await provider.connect(KEY)
  assert.deepEqual(
    [...ctx.records.keys()].sort(),
    ['dsh-opencode-go-panel/api-key', 'other-plugin/api-key'],
  )
  assert.equal(ctx.records.get('other-plugin/api-key').key, 'other-key')
  assert.equal(ctx.records.get(RECORD).key, KEY)
  await provider.disconnect()
  assert.equal(ctx.records.has('other-plugin/api-key'), true)
  assert.equal(ctx.records.has(RECORD), false)
})

test('disconnect removes the record and returns the connect state', async (t) => {
  mockApi(t)
  const ctx = createContext({ key: KEY })
  const provider = createProvider(ctx, {})
  const snapshot = await provider.disconnect()
  assert.equal(ctx.records.has(RECORD), false)
  assert.equal(snapshot.connected, false)
  assert.equal(snapshot.auth.key.configured, false)
})

test('a credential change never serves a snapshot built with the old key', async (t) => {
  const oldKey = 'oc_sk_test_old_1234567890abcdef'
  const newKey = 'oc_sk_test_new_1234567890abcdef'
  const usedFor = (microCents) => ({
    ...STATUS,
    access: {
      ...STATUS.access,
      meters: { ...STATUS.access.meters, month: { ...STATUS.access.meters.month, usedMicroCents: microCents } },
    },
  })
  t.mock.method(globalThis, 'fetch', async (input, init = {}) => {
    const url = String(input)
    const auth = init.headers?.authorization
    if (url.endsWith('/console/api/go/status')) {
      if (auth === `Bearer ${oldKey}`) {
        await new Promise((resolve) => setTimeout(resolve, 40))
        return json(usedFor('1000000000'))
      }
      return auth === `Bearer ${newKey}` ? json(usedFor('2000000000')) : json({ error: 'unauthorized' }, 401)
    }
    if (url.endsWith('/console/api/billing/status')) return json(BILLING)
    if (url.endsWith('/zen/go/v1/usage')) return json(USAGE)
    if (url.endsWith('/zen/go/v1/models')) return json(MODELS)
    return json({ error: 'not found' }, 404)
  })
  const ctx = createContext({ key: oldKey })
  const provider = createProvider(ctx, {})
  const slowOldRequest = provider.get(true)
  const connected = await provider.connect(newKey)
  assert.equal(connected.meters.find((meter) => meter.key === 'monthly').used, 20)
  await slowOldRequest
  const cached = await provider.get()
  assert.equal(cached.meters.find((meter) => meter.key === 'monthly').used, 20)
  assert.equal(ctx.records.get(RECORD).key, newKey)
})

test('official usage export aggregates tokens and amount by model and range', async (t) => {
  t.mock.timers.enable({ apis: ['Date'], now: Date.UTC(2026, 10, 21, 10, 30, 0) })
  mockApi(t)
  const provider = createProvider(createContext({ key: KEY }), {})

  const month = await provider.getUsage('month')
  assert.equal(month.range, 'month')
  assert.deepEqual(month.totals, {
    requests: 17,
    inputTokens: 1600,
    outputTokens: 3200,
    cacheReadTokens: 3300,
    cacheWriteTokens: 100,
    tokens: 8200,
    costUsd: 4,
  })
  assert.deepEqual(month.coverage, { from: '2026-11-20', to: '2026-11-21', days: 2 })
  assert.deepEqual(month.byModel.map((row) => [row.model, row.requests, row.tokens, row.costUsd]), [
    ['deepseek-v4.1-flash', 12, 6700, 3],
    ['glm-5.3', 5, 1500, 1],
  ])
  // Personal fields from the CSV never reach the report.
  assert.doesNotMatch(JSON.stringify(month), /Doe|Jane|Bob|user_1|user_2|user_name/)

  const today = await provider.getUsage('today')
  assert.deepEqual(today.totals, {
    requests: 15,
    inputTokens: 1500,
    outputTokens: 3000,
    cacheReadTokens: 3000,
    cacheWriteTokens: 100,
    tokens: 7600,
    costUsd: 3.5,
  })
  assert.deepEqual(today.coverage, { from: '2026-11-21', to: '2026-11-21', days: 1 })

  const ninety = await provider.getUsage('90d')
  assert.equal(ninety.totals.requests, 25)
  assert.ok(Math.abs(ninety.totals.costUsd - 4.71) < 1e-9)
  assert.deepEqual(ninety.byModel.map((row) => row.model), ['deepseek-v4.1-flash', 'glm-5.3', 'kimi-k3'])
  assert.deepEqual(ninety.coverage, { from: '2026-09-01', to: '2026-11-21', days: 4 })
})

test('usage history caches one export and refreshes on demand', async (t) => {
  t.mock.timers.enable({ apis: ['Date'], now: Date.UTC(2026, 10, 21, 10, 30, 0) })
  const calls = mockApi(t)
  const provider = createProvider(createContext({ key: KEY }), {})
  await provider.getUsage('month')
  await provider.getUsage('today')
  let exports = calls.filter((call) => call.url.includes('/v2/usage/export')).length
  assert.equal(exports, 1)
  await provider.getUsage('month', true)
  exports = calls.filter((call) => call.url.includes('/v2/usage/export')).length
  assert.equal(exports, 2)
})

test('usage history rejects invalid ranges and reports export failures', async (t) => {
  t.mock.timers.enable({ apis: ['Date'], now: Date.UTC(2026, 10, 21, 10, 30, 0) })
  mockApi(t, { usageExport: 403 })
  const provider = createProvider(createContext({ key: KEY }), {})
  await assert.rejects(
    () => provider.getUsage('6m'),
    (error) => error instanceof PanelApiError && error.code === 'INVALID_RANGE',
  )
  await assert.rejects(
    () => provider.getUsage('month'),
    (error) => error instanceof PanelApiError && error.code === 'USAGE_PERMISSION',
  )
})

test('usage history rejects an unreadable CSV and requires a key', async (t) => {
  t.mock.timers.enable({ apis: ['Date'], now: Date.UTC(2026, 10, 21, 10, 30, 0) })
  mockApi(t, { usageCsv: 'not,a,valid,header\r\n1,2,3,4\r\n' })
  const provider = createProvider(createContext({ key: KEY }), {})
  await assert.rejects(
    () => provider.getUsage('month'),
    (error) => error instanceof PanelApiError && error.code === 'USAGE_INVALID',
  )

  const empty = createProvider(createContext(), {})
  await assert.rejects(
    () => empty.getUsage('month'),
    (error) => error instanceof PanelApiError && error.code === 'NO_KEY',
  )
})

test('refresh seconds are clamped and sent to the client', async (t) => {
  mockApi(t)
  const snapshot = await createProvider(createContext(), { refreshSeconds: 5 }).get()
  assert.equal(snapshot.refreshSeconds, 60)
})
