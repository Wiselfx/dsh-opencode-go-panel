import { test } from 'node:test'
import { strict as assert } from 'node:assert'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'

const source = readFileSync(new URL('../client.js', import.meta.url), 'utf8')

/** Evaluate the browser bundle with a stub React and the real slot/locale contract. */
function loadClient(initialState = []) {
  let definition = null
  const sandbox = {
    window: {
      __ModuleLoader__: {
        load(value) {
          definition = value
        },
      },
    },
    require(name) {
      if (name !== 'react') throw new Error(`unexpected module: ${name}`)
      return {
        createElement: (type, props, ...children) => ({
          type,
          props: { ...props, children: children.length <= 1 ? children[0] : children },
        }),
        useState: (initial) => {
          if (initialState.length > 0) return [initialState.shift(), () => {}]
          return [typeof initial === 'function' ? initial() : initial, () => {}]
        },
        useEffect: () => {},
        useCallback: (callback) => callback,
        useMemo: (factory) => factory(),
      }
    },
    document: {
      hidden: false,
      addEventListener() {},
      removeEventListener() {},
    },
    setInterval: () => 0,
    clearInterval: () => {},
    fetch: async () => {
      throw new Error('the registration test must not fetch')
    },
    console,
    Intl,
    Date,
  }
  vm.runInNewContext(source, sandbox, { filename: 'client.js' })
  assert.ok(definition, 'the module loader received a definition')
  assert.equal(definition.id, 'dsh-opencode-go-panel')
  return definition.factory(sandbox.require)
}

test('the client registers one sidebar entry and the matching main panel', () => {
  const client = loadClient()

  const dictionaries = []
  const registrations = []
  const ctx = {
    effect(fn) {
      return fn()
    },
    locale: {
      register(ns, dicts) {
        dictionaries.push({ ns, dicts })
        return () => {}
      },
      bind(ns) {
        const en = dictionaries.find((entry) => entry.ns === ns)?.dicts.en
        return (key, params) => {
          const template = en?.[key] ?? key
          if (!params) return template
          return template.replace(/\{(\w+)\}/g, (match, name) => (name in params ? String(params[name]) : match))
        }
      },
    },
    slots: {
      inject(_owner, callback) {
        callback()
      },
      register(options, component) {
        registrations.push({ options, component })
        return () => {}
      },
    },
  }

  client.apply(ctx)

  assert.deepEqual(Array.from(client.inject), ['slots', 'locale'])
  assert.equal(dictionaries.length, 1)
  assert.equal(dictionaries[0].ns, 'opencode-go')
  assert.ok(dictionaries[0].dicts.en && dictionaries[0].dicts.zh)

  assert.equal(registrations.length, 2)

  const sidebar = registrations.find((entry) => entry.options.name === 'sidebar.panellist')
  assert.ok(sidebar, 'sidebar.panellist registration')
  assert.equal(sidebar.options.id, 'opencode-go')
  assert.equal(sidebar.options.locale, 'opencode-go')
  assert.equal(typeof sidebar.options.label, 'function')
  assert.equal(sidebar.options.label(), 'OpenCode Go')
  assert.equal(typeof sidebar.component, 'function')

  const main = registrations.find((entry) => entry.options.name === 'main')
  assert.ok(main, 'main registration')
  assert.equal(main.options.key, 'opencode-go')
  assert.equal(main.options.locale, 'opencode-go')
  assert.equal(typeof main.component, 'function')
})

/** Render function components as plain functions; enough to catch a broken view. */
function renderToString(node) {
  if (node === null || node === undefined || node === false || node === true) return ''
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(renderToString).join('')
  if (typeof node === 'object' && typeof node.type === 'function') {
    return renderToString(node.type(node.props || {}))
  }
  if (typeof node === 'object') {
    if (node.props?.dangerouslySetInnerHTML) return ''
    return renderToString(node.props?.children)
  }
  return ''
}

const USAGE_REPORT = {
  ok: true,
  range: 'month',
  generatedAt: Date.now(),
  from: '2026-11-01',
  to: '2026-11-21',
  coverage: { from: '2026-11-20', to: '2026-11-21', days: 2 },
  byDay: [
    { day: '2026-11-20', requests: 2, tokens: 600, costUsd: 0.5 },
    { day: '2026-11-21', requests: 15, tokens: 7600, costUsd: 3.5 },
  ],
  totals: {
    requests: 17,
    inputTokens: 1600,
    outputTokens: 3200,
    cacheReadTokens: 3300,
    cacheWriteTokens: 100,
    tokens: 8200,
    costUsd: 4,
  },
  byModel: [{
    provider: 'opencode',
    model: 'DeepSeek V4.1 Flash 1017',
    requests: 12,
    inputTokens: 1100,
    outputTokens: 2200,
    cacheReadTokens: 3300,
    cacheWriteTokens: 100,
    tokens: 6700,
    costUsd: 3,
  }],
}

const SNAPSHOT = {
  ok: true,
  version: 3,
  connected: true,
  refreshSeconds: 300,
  fetchedAt: Date.now(),
  auth: { key: { configured: true }, console: { configured: true } },
  subscription: {
    source: 'console',
    plan: 'Go',
    planId: 'go',
    priceMonthly: 10,
    status: 'active',
    cancelAtPeriodEnd: true,
    needsPaymentMethod: true,
    useBalance: false,
    accessEndsAt: Date.now() + 10 * 86_400_000,
    renewalStopReason: null,
    resumability: null,
    nextPeriodPaid: null,
    renewalPending: null,
    upgrade: null,
    teams: null,
  },
  billing: {
    mode: 'pay-as-you-go',
    billingMode: 'prepaid',
    invoiceCount: 0,
    balance: 0,
    available: 0,
    creditLimit: null,
    canPurchaseCredits: true,
    canEnableAutoRecharge: true,
  },
  meters: [
    { key: 'rolling', used: 1, limit: 12, remaining: 11, percent: 8.3, startsAt: 0, resetsAt: Date.now() + 3_600_000, elapsed: 0.5, pace: 0.17, rateLimited: true, estimated: false },
    { key: 'weekly', used: 3, limit: 30, remaining: 27, percent: 10, startsAt: 0, resetsAt: Date.now() + 86_400_000, elapsed: 0.5, pace: 0.2, rateLimited: false, estimated: false },
    { key: 'monthly', used: 15, limit: 60, remaining: 45, percent: 25, startsAt: 0, resetsAt: Date.now() + 20 * 86_400_000, elapsed: 0.5, pace: 0.5, rateLimited: false, estimated: false },
  ],
  currentModelId: 'deepseek-v4.1-flash',
  models: [{
    id: 'deepseek-v4.1-flash',
    name: 'DeepSeek V4.1 Flash 1017',
    context: 1000000,
    maxTokens: 384000,
    rates: { input: 0.15, output: 0.6, cacheRead: 0.003 },
    free: false,
    peakFactor: 2,
    peakActive: false,
    monthlyUsage: { go: 100, 'go-plus': 200, 'go-teams': 105 },
    training: false,
    zdr: true,
    limitedRegions: false,
    featured: true,
    tools: true,
    reasoning: true,
    reasoningEfforts: ['low', 'high', 'max'],
    structuredOutput: true,
    temperature: true,
    topP: true,
    topK: true,
    inputModalities: ['text', 'image/png'],
    outputModalities: ['text'],
    knowledge: '2025-05',
    releaseDate: '2026-10-17',
    lastUpdated: '2026-10-17',
    openWeights: true,
    family: 'deepseek-flash',
    canonicalId: 'deepseek/deepseek-v4.1-flash-1017',
    recommendedApi: 'chat-completions',
  }],
  warnings: [{ code: 'models-public' }],
  errors: [],
}

test('the connected view renders plan, windows, models, account, and key copy', () => {
  const client = loadClient([SNAPSHOT, false, null, Date.now(), 0, 0, 'month', USAGE_REPORT, false, null, 0, '', 'deepseek-v4.1-flash'])
  const registrations = []
  let t = (key) => key
  const ctx = {
    effect(fn) { return fn() },
    locale: {
      register(ns, dicts) {
        t = (key, params) => {
          const template = dicts.en[key] ?? key
          if (!params) return template
          return template.replace(/\{(\w+)\}/g, (match, name) => (name in params ? String(params[name]) : match))
        }
        return () => {}
      },
      bind() { return t },
    },
    slots: {
      inject(_owner, callback) { callback() },
      register(options, component) { registrations.push({ options, component }); return () => {} },
    },
  }
  client.apply(ctx)
  const page = registrations.find((entry) => entry.options.name === 'main').component
  const html = renderToString(page({ t }))
  const expectedCopy = [
    'Go',
    'DeepSeek V4.1 Flash 1017',
    '$15.00 of $60.00 used',
    '25%',
    'In $/M',
    'Subscription details',
    'dsh-opencode-go-panel/api-key',
    'This plan is cancelled',
    'needs a payment method',
    'Extra usage is off',
    'Off-peak',
    '5-hour window is rate limited',
    'workspace model list could not be read',
    'Usage history',
    'Today',
    'Last 7 days',
    'Last 30 days',
    'This month',
    'Last 6 months',
    'All time',
    'Usage amount',
    '$4.00',
    '8.2K',
    'Cache hit rate',
    'Tokens / request',
    'Usage / 1M tokens',
    'Free model tokens',
    'Daily tokens',
    'Monthly usage',
    'Hide',
    'Zero data retention',
    'Knowledge cutoff',
    '2025-05',
    'Billing mode',
    'Invoices',
  ]
  for (const expected of expectedCopy) {
    assert.ok(html.includes(expected), `expected rendered copy: ${expected}`)
  }
})

test('the empty view renders the connect card', () => {
  const client = loadClient([{ ...SNAPSHOT, connected: false, subscription: null, billing: null, meters: [], models: [], currentModelId: null, auth: { key: { configured: false }, console: { configured: false } } }, false, null])
  const registrations = []
  let t = (key) => key
  const ctx = {
    effect(fn) { return fn() },
    locale: {
      register(_ns, dicts) {
        t = (key) => dicts.en[key] ?? key
        return () => {}
      },
      bind() { return t },
    },
    slots: {
      inject(_owner, callback) { callback() },
      register(options, component) { registrations.push({ options, component }); return () => {} },
    },
  }
  client.apply(ctx)
  const page = registrations.find((entry) => entry.options.name === 'main').component
  const html = renderToString(page({ t }))
  assert.ok(html.includes('Connect your OpenCode Go key'))
  assert.ok(html.includes('Save and connect'))
  assert.ok(!html.includes('Usage windows'))
})
