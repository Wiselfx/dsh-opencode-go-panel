import { test } from 'node:test'
import { strict as assert } from 'node:assert'
import { readFileSync } from 'node:fs'

const index = readFileSync(new URL('../index.js', import.meta.url), 'utf8')

test('host identity auth is required', () => {
  assert.match(index, /inject = \['webServer', 'connection'\]/)
  assert.match(index, /ctx\.get\('connection'\)/)
  assert.match(index, /connection\.requestRejection\(req\)/)
  assert.doesNotMatch(index, /function sameOrigin/)
  assert.doesNotMatch(index, /REQUEST_HEADER/)
})

test('client no longer sends forgeable request header', () => {
  const client = readFileSync(new URL('../client.js', import.meta.url), 'utf8')
  assert.doesNotMatch(client, /x-opencode-go-request/)
})
