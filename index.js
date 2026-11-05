/**
 * Host half of the OpenCode Go panel. It owns credential resolution, the
 * Console/inference reads, and the small same-origin JSON endpoint the panel
 * uses. No key or token is ever returned to the browser.
 */
import { createProvider } from './data.js'

export const inject = ['webServer', 'connection']

const STATUS_PATH = '/_dsh/opencode-go/status'
const CONNECT_PATH = '/_dsh/opencode-go/connect'

function sendJson(res, status, body) {
  const data = JSON.stringify(body)
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'content-length': Buffer.byteLength(data),
  })
  res.end(data)
}

async function readJsonBody(req) {
  const chunks = []
  let size = 0
  for await (const chunk of req) {
    size += chunk.length
    if (size > 16_384) throw new Error('Request body is too large')
    chunks.push(Buffer.from(chunk))
  }
  if (!chunks.length) return {}
  return JSON.parse(Buffer.concat(chunks).toString('utf8'))
}

function safeMessage(error) {
  return error instanceof Error ? error.message : String(error)
}

export function apply(ctx, config = {}) {
  const webServer = ctx.get('webServer')
  const connection = ctx.get('connection')
  if (!webServer || !connection) return
  const provider = createProvider(ctx, config)

  const statusRoute = webServer.register({
    kind: 'exact',
    path: STATUS_PATH,
    async handler(req, res) {
      const rejection = connection.requestRejection(req)
      if (rejection !== undefined) {
        sendJson(res, rejection, { ok: false, error: rejection === 401 ? 'Unauthorized' : 'Forbidden' })
        return
      }
      try {
        const url = new URL(req.url || STATUS_PATH, 'http://localhost')
        const snapshot = await provider.get(url.searchParams.get('refresh') === '1')
        sendJson(res, 200, snapshot)
      } catch (error) {
        ctx.logger?.warn?.(error instanceof Error ? error : new Error(String(error)))
        sendJson(res, 500, { ok: false, error: safeMessage(error) })
      }
    },
  })

  const connectRoute = webServer.register({
    kind: 'exact',
    path: CONNECT_PATH,
    async handler(req, res) {
      if (req.method !== 'POST') {
        sendJson(res, 405, { ok: false, error: 'Method not allowed' })
        return
      }
      const rejection = connection.requestRejection(req)
      if (rejection !== undefined) {
        sendJson(res, rejection, { ok: false, error: rejection === 401 ? 'Unauthorized' : 'Forbidden' })
        return
      }
      const type = String(req.headers['content-type'] || '')
      if (!type.toLowerCase().startsWith('application/json')) {
        sendJson(res, 415, { ok: false, error: 'Expected application/json' })
        return
      }
      try {
        const body = await readJsonBody(req)
        const snapshot = await provider.connect(body?.apiKey)
        sendJson(res, 200, snapshot)
      } catch (error) {
        sendJson(res, 400, { ok: false, error: safeMessage(error) })
      }
    },
  })

  ctx.effect(() => () => {
    statusRoute()
    connectRoute()
  }, 'opencode-go: HTTP routes')
}
