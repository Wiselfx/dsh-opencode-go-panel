import { test } from 'node:test'
import { strict as assert } from 'node:assert'
import { apply } from '../index.js'

function createHarness({ configured = false, rejection } = {}) {
  const routes = new Map()
  const calls = { deleted: 0, modified: 0 }
  const ctx = {
    effect(fn) {
      return fn()
    },
    logger: { warn() {} },
    get(name) {
      if (name === 'webServer') {
        return {
          register(route) {
            routes.set(route.path, route)
            return () => {}
          },
        }
      }
      if (name === 'connection') {
        return { requestRejection: () => rejection }
      }
      if (name === 'credentials') {
        return {
          async readRecord() {
            return undefined
          },
          async modifyRecord() {
            calls.modified += 1
            return { kind: 'api-key' }
          },
          async deleteRecord() {
            calls.deleted += 1
          },
        }
      }
      if (name === 'agentDefaultModel') {
        return { currentSelection: () => ({ provider: 'opencode-go', model: 'deepseek-v4.1-flash' }) }
      }
      return undefined
    },
  }
  apply(ctx, {})
  return { routes, calls, configured }
}

function request({ method = 'GET', body = null, contentType = null, url = '/_dsh/opencode-go/status' } = {}) {
  const headers = {}
  if (contentType) headers['content-type'] = contentType
  return {
    method,
    url,
    headers,
    async *[Symbol.asyncIterator]() {
      if (body !== null) yield Buffer.from(body)
    },
  }
}

function response() {
  return {
    statusCode: 0,
    headers: {},
    body: '',
    writeHead(status, headers) {
      this.statusCode = status
      this.headers = headers
    },
    end(data = '') {
      this.body = String(data)
    },
  }
}

async function invoke(routes, path, options) {
  const route = routes.get(path)
  assert.ok(route, `route ${path}`)
  const res = response()
  await route.handler(request({ ...options, url: options?.url || path }), res)
  return { status: res.statusCode, headers: res.headers, body: JSON.parse(res.body) }
}

test('status returns the empty connect state without a key', async () => {
  const { routes } = createHarness()
  const result = await invoke(routes, '/_dsh/opencode-go/status', {})
  assert.equal(result.status, 200)
  assert.equal(result.body.connected, false)
  assert.equal(result.body.auth.key.configured, false)
  assert.equal(result.headers['cache-control'], 'no-store')
})

test('routes reject unauthenticated peers', async () => {
  const { routes } = createHarness({ rejection: 401 })
  const result = await invoke(routes, '/_dsh/opencode-go/status', {})
  assert.equal(result.status, 401)
  assert.equal(result.body.error, 'UNAUTHORIZED')
})

test('status only accepts GET', async () => {
  const { routes } = createHarness()
  const result = await invoke(routes, '/_dsh/opencode-go/status', { method: 'POST' })
  assert.equal(result.status, 405)
})

test('connect requires POST, JSON, and a valid body', async () => {
  const { routes, calls } = createHarness()
  assert.equal((await invoke(routes, '/_dsh/opencode-go/connect', { method: 'GET' })).status, 405)
  assert.equal((await invoke(routes, '/_dsh/opencode-go/connect', {
    method: 'POST', body: '{}', contentType: 'text/plain',
  })).status, 415)
  const invalid = await invoke(routes, '/_dsh/opencode-go/connect', {
    method: 'POST', body: 'not json', contentType: 'application/json',
  })
  assert.equal(invalid.status, 400)
  assert.equal(invalid.body.error, 'INVALID_JSON')
  assert.equal(calls.modified, 0)
})

test('usage route requires a saved key and a valid range', async () => {
  const { routes } = createHarness()
  const missingKey = await invoke(routes, '/_dsh/opencode-go/usage', {
    url: '/_dsh/opencode-go/usage?range=month',
  })
  assert.equal(missingKey.status, 400)
  assert.equal(missingKey.body.error, 'NO_KEY')
  const invalidRange = await invoke(routes, '/_dsh/opencode-go/usage', {
    url: '/_dsh/opencode-go/usage?range=6m',
  })
  assert.equal(invalidRange.status, 400)
  assert.equal(invalidRange.body.error, 'INVALID_RANGE')
  const wrongMethod = await invoke(routes, '/_dsh/opencode-go/usage', {
    method: 'POST', url: '/_dsh/opencode-go/usage?range=month',
  })
  assert.equal(wrongMethod.status, 405)
})

test('disconnect removes the panel record only through POST', async () => {
  const { routes, calls } = createHarness()
  assert.equal((await invoke(routes, '/_dsh/opencode-go/disconnect', { method: 'GET' })).status, 405)
  const result = await invoke(routes, '/_dsh/opencode-go/disconnect', { method: 'POST' })
  assert.equal(result.status, 200)
  assert.equal(result.body.connected, false)
  assert.equal(calls.deleted, 1)
})
