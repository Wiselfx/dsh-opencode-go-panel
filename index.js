/**
 * Host half of the OpenCode Go panel. It owns credential resolution, the
 * Console/inference reads, and the same-origin JSON endpoints the panel uses.
 * No key or token is ever returned to the browser.
 */
import { createProvider } from './data.js'

export const inject = ['webServer', 'connection']

const STATUS_PATH = '/_dsh/opencode-go/status'
const CONNECT_PATH = '/_dsh/opencode-go/connect'
const DISCONNECT_PATH = '/_dsh/opencode-go/disconnect'
const USAGE_PATH = '/_dsh/opencode-go/usage'
const MAX_BODY_BYTES = 16_384

function sendJson(res, status, body) {
  const data = JSON.stringify(body)
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'content-length': Buffer.byteLength(data),
  })
  res.end(data)
}

function bodyError(code, status, message) {
  const error = new Error(message)
  error.code = code
  error.status = status
  return error
}

async function readJsonBody(req) {
  const chunks = []
  let size = 0
  for await (const chunk of req) {
    size += chunk.length
    if (size > MAX_BODY_BYTES) throw bodyError('BODY_TOO_LARGE', 413, 'Request body is too large')
    chunks.push(Buffer.from(chunk))
  }
  if (!chunks.length) return {}
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'))
  } catch {
    throw bodyError('INVALID_JSON', 400, 'Request body is not valid JSON')
  }
}

function failureBody(error) {
  const code = typeof error?.code === 'string' ? error.code : 'INTERNAL'
  return {
    ok: false,
    error: code,
    detail: typeof error?.detail === 'string' && error.detail
      ? error.detail
      : (error instanceof Error ? error.message : String(error)),
  }
}

function rejectionStatus(error) {
  const status = Number(error?.status)
  return Number.isInteger(status) && status >= 400 && status <= 599 ? status : 500
}

export function apply(ctx, config = {}) {
  const webServer = ctx.get('webServer')
  const connection = ctx.get('connection')
  if (!webServer || !connection) return
  const provider = createProvider(ctx, config)

  function authorize(req, res) {
    const rejection = connection.requestRejection(req)
    if (rejection === undefined) return true
    sendJson(res, rejection, { ok: false, error: rejection === 401 ? 'UNAUTHORIZED' : 'FORBIDDEN' })
    return false
  }

  ctx.effect(() => webServer.register({
    kind: 'exact',
    path: STATUS_PATH,
    async handler(req, res) {
      if (!authorize(req, res)) return
      if (req.method !== 'GET') {
        sendJson(res, 405, { ok: false, error: 'METHOD_NOT_ALLOWED' })
        return
      }
      try {
        const url = new URL(req.url || STATUS_PATH, 'http://localhost')
        sendJson(res, 200, await provider.get(url.searchParams.get('refresh') === '1'))
      } catch (error) {
        ctx.logger?.warn?.(error instanceof Error ? error : new Error(String(error)))
        sendJson(res, 500, failureBody(error))
      }
    },
  }), 'opencode-go: status route')

  ctx.effect(() => webServer.register({
    kind: 'exact',
    path: CONNECT_PATH,
    async handler(req, res) {
      if (!authorize(req, res)) return
      if (req.method !== 'POST') {
        sendJson(res, 405, { ok: false, error: 'METHOD_NOT_ALLOWED' })
        return
      }
      const type = String(req.headers['content-type'] || '')
      if (!type.toLowerCase().startsWith('application/json')) {
        sendJson(res, 415, { ok: false, error: 'EXPECTED_JSON' })
        return
      }
      try {
        const body = await readJsonBody(req)
        sendJson(res, 200, await provider.connect(body?.apiKey))
      } catch (error) {
        sendJson(res, rejectionStatus(error), failureBody(error))
      }
    },
  }), 'opencode-go: connect route')

  ctx.effect(() => webServer.register({
    kind: 'exact',
    path: USAGE_PATH,
    async handler(req, res) {
      if (!authorize(req, res)) return
      if (req.method !== 'GET') {
        sendJson(res, 405, { ok: false, error: 'METHOD_NOT_ALLOWED' })
        return
      }
      try {
        const url = new URL(req.url || USAGE_PATH, 'http://localhost')
        const range = url.searchParams.get('range') || 'month'
        const report = await provider.getUsage(range, url.searchParams.get('refresh') === '1')
        sendJson(res, 200, { ok: true, ...report })
      } catch (error) {
        sendJson(res, rejectionStatus(error), failureBody(error))
      }
    },
  }), 'opencode-go: usage route')

  ctx.effect(() => webServer.register({
    kind: 'exact',
    path: DISCONNECT_PATH,
    async handler(req, res) {
      if (!authorize(req, res)) return
      if (req.method !== 'POST') {
        sendJson(res, 405, { ok: false, error: 'METHOD_NOT_ALLOWED' })
        return
      }
      try {
        sendJson(res, 200, await provider.disconnect())
      } catch (error) {
        sendJson(res, rejectionStatus(error), failureBody(error))
      }
    },
  }), 'opencode-go: disconnect route')
}
