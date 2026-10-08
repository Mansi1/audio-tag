#!/usr/bin/env node
// Serves the project root, so the built website (website/dist/, with its ES modules) opens over HTTP.
// Usage: npm run serve   (npm run serve -- --port 8080, or PORT=8080, to change the port)
//        npm run website (the same, and opens the website in the browser)
// It is the package's bin: npx audio-tag --open [--port 8080] (also yarn audio-tag, bunx audio-tag)
import { execFile } from 'node:child_process'
import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { createServer } from 'node:http'
import { extname, join, normalize, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

// the folder above scripts/ (import.meta.dirname would need Node 20.11; the package supports 18)
const root = fileURLToPath(new URL('..', import.meta.url)).replace(/[\\/]$/, '')
// VERIFIED: --port works the same in every shell, where PORT=… needs shell-specific syntax; PORT still works.
const flag = process.argv.indexOf('--port')
const port = Number(flag > 0 ? process.argv[flag + 1] : (process.env.PORT ?? 5173))
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error('The port must be a whole number from 1 to 65535, for example --port 8080')
  process.exit(1)
}

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
    res.writeHead(302, { Location: '/website/dist/' }).end()
    return
  }
  // stay inside the project root
  let path = normalize(join(root, decodeURIComponent(url.pathname)))
  if (path !== root && !path.startsWith(root + sep)) {
    res.writeHead(403).end('Forbidden')
    return
  }
  try {
    // as GitHub Pages does: a folder serves its index.html, a path without an extension its .html file
    let s = await stat(path).catch(() => null)
    if (s?.isDirectory()) s = await stat((path = join(path, 'index.html'))).catch(() => null)
    else if (!s && !extname(path)) s = await stat((path += '.html')).catch(() => null)
    if (!s?.isFile()) throw new Error('not a file')
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

// VERIFIED: listening on localhost keeps other machines out (a LAN address is refused); the server hands out every file of its folder.
server.listen(port, 'localhost', () => {
  console.log(`Serving ${root}`)
  console.log(`Website: http://localhost:${port}/website/dist/`)
  if (process.argv.includes('--open')) {
    const url = `http://localhost:${port}/website/dist/`
    const [cmd, args] = process.platform === 'darwin' ? ['open', [url]] : process.platform === 'win32' ? ['cmd', ['/c', 'start', '', url]] : ['xdg-open', [url]]
    execFile(cmd, args, (err) => err && console.log(`Open ${url} in your browser`))
  }
})
