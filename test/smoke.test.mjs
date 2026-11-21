import { test } from 'node:test'
import { strict as assert } from 'node:assert'
import { readFileSync } from 'node:fs'

const index = readFileSync(new URL('../index.js', import.meta.url), 'utf8')
const data = readFileSync(new URL('../data.js', import.meta.url), 'utf8')
const client = readFileSync(new URL('../client.js', import.meta.url), 'utf8')

test('host identity auth is required', () => {
  assert.match(index, /inject = \['webServer', 'connection'\]/)
  assert.match(index, /ctx\.get\('connection'\)/)
  assert.match(index, /connection\.requestRejection\(req\)/)
  assert.doesNotMatch(index, /function sameOrigin/)
  assert.doesNotMatch(index, /REQUEST_HEADER/)
})

test('client no longer sends forgeable request header', () => {
  assert.doesNotMatch(client, /x-opencode-go-request/)
})

test('the panel key is a plugin-owned credential record, not ambient state', () => {
  assert.match(data, /dsh-opencode-go-panel\/api-key/)
  assert.match(data, /readRecord\(CREDENTIAL_RECORD\)/)
  assert.match(data, /modifyRecord\(CREDENTIAL_RECORD/)
  assert.match(data, /deleteRecord\(CREDENTIAL_RECORD\)/)
  // No reference-space lookups, environment fallbacks, or plaintext secret files.
  assert.doesNotMatch(data, /process\.env/)
  assert.doesNotMatch(data, /homedir|writeFile|readFile|mkdir/)
  assert.doesNotMatch(data, /credentials\.resolve/)
  assert.doesNotMatch(data, /OPENCODE_GO_API_KEY/)
})

test('the panel is empty until a key is saved', () => {
  assert.match(data, /if \(!stored\.key\) return emptySnapshot\(config\)/)
  assert.match(data, /connected: false/)
})

test('client locale dictionaries agree', () => {
  const enStart = client.indexOf('      en: {')
  const zhStart = client.indexOf('      zh: {')
  const cssStart = client.indexOf('    const CSS = `')
  assert.ok(enStart > 0 && zhStart > enStart && cssStart > zhStart)
  const keysOf = (block) => [...block.matchAll(/^\s{8}([a-zA-Z0-9]+):/gm)].map((match) => match[1])
  const en = keysOf(client.slice(enStart, zhStart))
  const zh = keysOf(client.slice(zhStart, cssStart))
  assert.deepEqual([...en].sort(), [...zh].sort())
  assert.equal(new Set(en).size, en.length, 'duplicate English locale keys')
  assert.equal(new Set(zh).size, zh.length, 'duplicate Chinese locale keys')
})
