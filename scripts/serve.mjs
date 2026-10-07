// Serves the project root so the website can load ../dist/*.js as ES modules.
// Usage: npm run serve   (PORT=8080 npm run serve to change the port)
//        npm run website (the same, and opens the website in the browser)
import { execFile } from 'node:child_process'
import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { createServer } from 'node:http'
import { extname, join, normalize, resolve, sep } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const port = Number(process.env.PORT ?? 5173)

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.cjs': 'text/javascript; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.mp3': 'audio/mpeg',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost')
  if (url.pathname === '/') {
    res.writeHead(302, { Location: '/website/index.html' }).end()
    return
  }
  // stay inside the project root
  const path = normalize(join(root, decodeURIComponent(url.pathname)))
  if (path !== root && !path.startsWith(root + sep)) {
    res.writeHead(403).end('Forbidden')
    return
  }
  try {
    const s = await stat(path)
    if (!s.isFile()) throw new Error('not a file')
    res.writeHead(200, {
      'Content-Type': TYPES[extname(path)] ?? 'application/octet-stream',
      'Content-Length': s.size,
      'Cache-Control': 'no-store',
    })
    createReadStream(path).pipe(res)
  } catch {
    res.writeHead(404).end('Not found')
  }
  console.log(`${res.statusCode} ${req.method} ${url.pathname}`)
})

server.listen(port, () => {
  console.log(`Serving ${root}`)
  console.log(`Website: http://localhost:${port}/website/index.html`)
  if (process.argv.includes('--open')) {
    const url = `http://localhost:${port}/website/index.html`
    const [cmd, args] = process.platform === 'darwin' ? ['open', [url]] : process.platform === 'win32' ? ['cmd', ['/c', 'start', '', url]] : ['xdg-open', [url]]
    execFile(cmd, args, (err) => err && console.log(`Open ${url} in your browser`))
  }
})
