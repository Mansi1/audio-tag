// End-to-end check of the published package, run by `make e2e` after `npm run build`.
// 1. Packs the npm tarball and installs it in a clean consumer project under tmp/e2e/.
// 2. The consumer reads and writes every file in input/ through each entry point (audio-tag, audio-tag/node,
//    audio-tag/browser, and the CommonJS build) and writes what it saw to output/e2e/results.json.
// 3. Serves the website the way a user opens the installed copy (`npx audio-tag`, the package's bin) and
//    drives every page and control in Chromium: no console errors or failed requests, no sideways scrolling;
//    the docs tabs, generated tables, filters, section menu and theme toggle; the playground opening, editing
//    and downloading every input file with its byte map and hex, adding and removing a cover, Reset, the
//    discard dialog and the recorder (on a fake microphone). The repository's server covers 404.html, which is
//    left out of the package; its /audio-tag/ paths are mapped to website/dist/ as on GitHub Pages. Screenshots and downloads go to output/e2e/.
// Any failed check exits 1.
// VERIFIED: a packed tarball in a clean consumer, rather than importing dist/ from the repository, also proves the
// package.json `files` list and `exports` map, which a repository import bypasses.
import { execFileSync, spawn } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { chromium } from 'playwright'

const root = resolve(import.meta.dirname, '..')
const work = join(root, 'tmp/e2e')
const consumer = join(work, 'consumer')
const out = join(root, 'output/e2e')
const inputs = readdirSync(join(root, 'input')).filter((f) => f.startsWith('sample.')).sort()
const failures = []
const check = (ok, what) => {
  console.log(`${new Date().toISOString()} ${ok ? 'ok  ' : 'FAIL'} ${what}`)
  if (!ok) failures.push(what)
}

rmSync(work, { recursive: true, force: true })
rmSync(out, { recursive: true, force: true })
mkdirSync(consumer, { recursive: true })
mkdirSync(out, { recursive: true })

// 1. pack and install like a user
const npm = (args, cwd) => execFileSync('npm', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] })
const tgz = JSON.parse(npm(['pack', '--json', '--pack-destination', work], root))[0].filename
writeFileSync(join(consumer, 'package.json'), JSON.stringify({ name: 'e2e-consumer', private: true, type: 'module' }))
npm(['install', '--no-audit', '--no-fund', join(work, tgz)], consumer)
check(true, `installed ${tgz} in a clean consumer`)

// 2. the consumer script: every high-level read/write function of each entry, on every input file
const PER_FORMAT = { mpeg: 'ID3', mp4: 'MP4', flac: 'FLAC', ogg: 'Ogg', aiff: 'AIFF', riff: 'RIFF' }
writeFileSync(
  join(consumer, 'run.mjs'),
  `import { copyFileSync, readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import * as bytesApi from 'audio-tag'
import * as nodeApi from 'audio-tag/node'
import * as browserApi from 'audio-tag/browser'
const cjs = createRequire(import.meta.url)('audio-tag')
const [inputDir, outDir, ...files] = process.argv.slice(2)
const PER_FORMAT = ${JSON.stringify(PER_FORMAT)}
const results = []
for (const name of files) {
  const src = inputDir + '/' + name
  const data = new Uint8Array(readFileSync(src))
  const r = { file: name, format: bytesApi.detectFormat(data) }
  const kind = PER_FORMAT[r.format]
  // audio-tag: bytes in, bytes out
  r.read = bytesApi.read(data).format
  r.write = bytesApi.read(bytesApi.write(data, { metadata: { title: 'bytes' } }).bytes).metadata.title
  r.perFormatBytes = bytesApi['read' + kind + 'File'](bytesApi['write' + kind + 'File'](data, { metadata: { title: 'per-format' } }).bytes).metadata.title
  // CommonJS build
  r.cjs = cjs.read(cjs.write(data, { metadata: { title: 'cjs' } }).bytes).metadata.title
  // audio-tag/node: files on disk, written to copies in output/
  const any = outDir + '/node-any-' + name
  copyFileSync(src, any)
  await nodeApi.writeFile(any, { metadata: { title: 'node' } })
  r.nodeFile = (await nodeApi.readFile(any)).metadata.title
  const own = outDir + '/node-' + kind + '-' + name
  copyFileSync(src, own)
  await nodeApi['write' + kind + 'ToFile'](own, { metadata: { title: 'node per-format' } })
  r.nodePerFormat = (await nodeApi['read' + kind + 'FromFile'](own)).metadata.title
  if (kind === 'ID3') {
    await nodeApi.removeID3FromFile(own)
    r.removedID3 = (await nodeApi.readID3FromFile(own)).id3v2 === undefined
  }
  // audio-tag/browser: Blob and File (Node has both)
  const file = new File([data], name)
  const written = await browserApi.writeToBlob(file, { metadata: { title: 'blob' } })
  r.blob = (await browserApi.readFromBlob(written)).metadata.title
  r.blobName = written.name
  const ownBlob = await browserApi['write' + kind + 'ToBlob'](file, { metadata: { title: 'blob per-format' } })
  r.blobPerFormat = (await browserApi['read' + kind + 'FromBlob'](ownBlob)).metadata.title
  results.push(r)
}
// refused input: not an audio format
try { bytesApi.read(new TextEncoder().encode('not audio')); results.push({ unknown: 'no error' }) }
catch (e) { results.push({ unknown: e.code }) }
results.push({ json: JSON.parse(readFileSync(new URL('./node_modules/audio-tag/dist/build-info.json', import.meta.url), 'utf8')) })
writeFileSync(outDir + '/results.json', JSON.stringify(results, null, 2))
`,
)
execFileSync('node', ['run.mjs', join(root, 'input'), out, ...inputs], { cwd: consumer, stdio: 'inherit' })
const results = JSON.parse(readFileSync(join(out, 'results.json'), 'utf8'))
for (const r of results.filter((x) => x.file)) {
  check(r.read === r.format && r.format !== 'unknown', `${r.file}: read() gives ${r.read}`)
  check(r.write === 'bytes', `${r.file}: write() then read()`)
  check(r.perFormatBytes === 'per-format', `${r.file}: read${PER_FORMAT[r.format]}File / write${PER_FORMAT[r.format]}File`)
  check(r.cjs === 'cjs', `${r.file}: CommonJS build`)
  check(r.nodeFile === 'node', `${r.file}: audio-tag/node writeFile / readFile`)
  check(r.nodePerFormat === 'node per-format', `${r.file}: audio-tag/node per-format file functions`)
  if ('removedID3' in r) check(r.removedID3, `${r.file}: removeID3FromFile`)
  check(r.blob === 'blob' && r.blobName === r.file, `${r.file}: audio-tag/browser writeToBlob / readFromBlob`)
  check(r.blobPerFormat === 'blob per-format', `${r.file}: audio-tag/browser per-format Blob functions`)
}
check(results.find((x) => 'unknown' in x).unknown === 'format-unknown', 'read() refuses non-audio data with format-unknown')
const { json: built } = results.find((x) => x.json)
const installed = join(consumer, 'node_modules/audio-tag')
check(existsSync(join(installed, 'website/dist/index.html')) && existsSync(join(installed, 'website/dist/404.html')) && !existsSync(join(installed, 'website/dist/config.js')), 'the package ships the built website with its 404 page, without its build config')
const { version } = JSON.parse(readFileSync(join(installed, 'package.json'), 'utf8'))
check(built.version === version && built.commit !== undefined && !Number.isNaN(Date.parse(built.date)), `dist/build-info.json holds the build (${built.version}, ${built.commit}, ${built.date})`)
// the recorded byte sizes are those of the files in the installed package
const wrong = Object.entries(built.sizes.bundles).filter(([file, { bytes }]) => statSync(join(installed, file)).size !== bytes)
check(Object.keys(built.sizes.bundles).length === 9 && wrong.length === 0, `dist/build-info.json records the byte size of every bundle${wrong.length ? ': wrong for ' + wrong.map(([f]) => f).join(', ') : ''}`)

// 3. the website, served as a user opens the installed copy
function serve(cwd, command, args, env = {}) {
  const p = spawn(command, args, { cwd, env: { ...process.env, ...env }, stdio: ['ignore', 'pipe', 'inherit'] })
  return new Promise((ok, fail) => {
    p.stdout.on('data', (d) => d.includes('Website:') && ok(p))
    p.on('exit', (code) => fail(new Error(`${command} in ${cwd} exited with ${code}`)))
  })
}
// the installed copy through the package's bin, the link npx, yarn and bunx run for `audio-tag`, on another port
// (starting at all proves the link, the shebang and the executable bit). The link itself, not `npm exec audio-tag`,
// so SIGTERM below reaches the server rather than an npm wrapper. The repository server through PORT
const servers = [
  await serve(consumer, join(consumer, 'node_modules/.bin/audio-tag'), ['--port', '5291']),
  await serve(root, 'node', ['scripts/serve.mjs'], { PORT: '5292' }),
]
// a fake microphone, so the playground's recorder runs without hardware
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'] })
const { read } = await import(pathToFileURL(join(installed, 'dist/index.js')).href)
// a 1×1 PNG for the cover picture
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64')
try {
  for (const [label, viewport, colorScheme] of [['desktop-light', { width: 1280, height: 900 }, 'light'], ['phone-dark', { width: 390, height: 844 }, 'dark']]) {
    const context = await browser.newContext({ viewport, colorScheme, acceptDownloads: true })
    await context.grantPermissions(['microphone', 'clipboard-read', 'clipboard-write'], { origin: 'http://localhost:5291' })
    const page = await context.newPage()
    const errors = []
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
    page.on('pageerror', (e) => errors.push(String(e)))
    page.on('requestfailed', (r) => errors.push(`request failed: ${r.url()}`))
    // privacy: the site loads everything from where it is served, nothing from third parties
    const external = new Set()
    page.on('request', (r) => { const u = new URL(r.url()); if (/^https?:$/.test(u.protocol) && u.hostname !== 'localhost') external.add(u.origin) })
    // the playground loads the library as a vendor file, the package's own dist/browser.min.js; the body is
    // read on arrival, since Playwright drops it once the page navigates away
    const library = []
    page.on('response', (r) => {
      if (r.url().endsWith('/assets/vendor/audio-tag/browser.min.js')) library.push(r.body().then((body) => ({ status: r.status(), body }), () => ({ status: r.status() })))
    })
    const visit = async (url, name) => {
      const res = await page.goto(url, { waitUntil: 'networkidle' })
      check(res.ok() || name === '404', `${label} ${name}: HTTP ${res.status()}`)
      check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${label} ${name}: no sideways scrolling`)
      check(await page.evaluate((dark) => document.documentElement.classList.contains('dark') === dark, colorScheme === 'dark'), `${label} ${name}: ${colorScheme} mode`)
      const icon = await page.evaluate(async () => {
        const r = await fetch(document.querySelector('link[rel="icon"]').href)
        return r.ok && r.headers.get('content-type')
      })
      check(String(icon).startsWith('image/svg+xml'), `${label} ${name}: the icon loads (${icon})`)
      // link previews (WhatsApp, Slack) need an absolute image URL; the image itself ships in the package
      const og = await page.getAttribute('meta[property="og:image"]', 'content')
      check(og === 'https://mansi1.github.io/audio-tag/assets/og.jpg' && existsSync(join(installed, 'website/dist/assets/og.jpg')), `${label} ${name}: link preview image ${og}`)
      await page.screenshot({ path: join(out, `${label}-${name}.png`), fullPage: false })
    }
    await visit('http://localhost:5291/website/dist/docs', 'docs')
    const showsBuild = async (name) => {
      await page.locator('[data-build="line"]').waitFor({ state: built.commit ? 'visible' : 'hidden' })
      check((await page.textContent('[data-build="version"]')) === built.version, `${label} ${name}: shows version ${built.version}`)
      if (built.commit) check((await page.textContent('[data-build="commit"]')) === built.commit && (await page.getAttribute('[data-build="date"]', 'datetime')) === built.date, `${label} ${name}: footer shows build ${built.commit} from ${built.date}`)
    }
    await showsBuild('docs')
    // the site's own layout CSS applies (a truncated site.css once left the docs and playground unstyled)
    const styled = await page.evaluate(() => [getComputedStyle(document.querySelector('.docs')).display, getComputedStyle(document.querySelector('.site-footer .page')).display])
    check(styled[0] === 'grid' && styled[1] === 'flex', `${label} docs: layout CSS applies (${styled.join(', ')})`)
    // docs: the usage tabs, the generated tables and their filters, the section menu and the dark-mode toggle
    await page.click('#tab-usage-node')
    check(await page.isVisible('#usage-node') && !(await page.isVisible('#usage-browser')), `${label} docs: usage tabs switch panels`)
    check((await page.locator('.install-tabs').count()) === 1, `${label} docs: shows the install tabs`)
    // code examples: syntax colors, and the copy button puts the exact code on the clipboard
    const code = await page.textContent('#usage-node pre')
    await page.click('#usage-node [data-copy]')
    const copied = await page.evaluate(() => navigator.clipboard.readText())
    check(copied === code && code.startsWith('import') && (await page.textContent('#usage-node [data-copy]')) === 'Copied', `${label} docs: Copy puts the Node example on the clipboard`)
    check((await page.locator('#usage-node pre .code-keyword').count()) > 3 && (await page.locator('#usage-node pre .code-string').count()) > 3 && (await page.locator('#usage-node pre .code-comment').count()) >= 2, `${label} docs: code examples have syntax colors`)
    const visibleRows = (table) => page.locator(`#${table} tbody tr:visible`).count()
    check((await visibleRows('frame-table')) === 104 && (await visibleRows('genre-table')) === 148 && (await visibleRows('mapping-table')) > 30, `${label} docs: generated tables have 104 frames, 148 genres and the field mapping`)
    await page.fill('input[aria-controls="frame-table"]', 'CHAP')
    check((await visibleRows('frame-table')) >= 1 && (await visibleRows('frame-table')) < 104, `${label} docs: frame filter narrows the table`)
    await page.fill('input[aria-controls="genre-table"]', 'Rock')
    check((await visibleRows('genre-table')) >= 1 && (await visibleRows('genre-table')) < 148, `${label} docs: genre filter narrows the table`)
    if (viewport.width >= 960) {
      // the side menu jumps to a section and marks it (on phones the menu is a list above the article)
      await page.click('.docs-nav a[href="#genres"]')
      await page.waitForFunction(() => document.querySelector('.docs-nav a[aria-current]')?.getAttribute('href') === '#genres' && location.hash === '#genres', null, { timeout: 5000 }).catch(() => {})
      check((await page.getAttribute('.docs-nav a[aria-current]', 'href')) === '#genres', `${label} docs: the menu jumps to a section and marks it`)
    }
    await page.click('[data-theme-toggle]')
    check(await page.evaluate((dark) => document.documentElement.classList.contains('dark') !== dark, colorScheme === 'dark'), `${label} docs: theme toggle switches the mode`)
    await page.click('[data-theme-toggle]')
    // 404.html is written for GitHub Pages, where website/ is served under /audio-tag/
    await page.route('http://localhost:5292/audio-tag/**', (route) => route.fulfill({ path: join(root, 'website/dist', new URL(route.request().url()).pathname.slice('/audio-tag/'.length)) }))
    await visit('http://localhost:5292/website/dist/404.html', '404')
    check((await page.getAttribute('.mk-empty-state-actions a', 'href')) === 'https://mansi1.github.io/audio-tag/', `${label} 404: links back to the website`)
    await visit('http://localhost:5291/website/dist/', 'index')
    await showsBuild('index')
    check(await page.evaluate(() => getComputedStyle(document.querySelector('.play-grid')).display === 'grid'), `${label} index: playground layout CSS applies`)
    // the install tabs, the same component as on the docs
    await page.click('.install-tabs #tab-bun')
    check(await page.isVisible('#pm-bun') && !(await page.isVisible('#pm-npm')) && (await page.textContent('#pm-bun pre')) === 'bun add audio-tag', `${label} index: install tabs switch to bun add audio-tag`)
    // page links have no .html (GitHub Pages and serve.mjs resolve them), and they lead to the page
    const htmlLinks = await page.evaluate(() => [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')).filter((h) => /\.html(#|$)/.test(h) && !/^[a-z]+:/i.test(h)))
    check(htmlLinks.length === 0, `${label} index: page links without .html${htmlLinks.length ? ': ' + htmlLinks.join(', ') : ''}`)
    await page.click('.topnav a[href="docs"]')
    await page.waitForLoadState('networkidle')
    check(new URL(page.url()).pathname === '/website/dist/docs' && (await page.locator('#frame-table').count()) === 1, `${label} index: the Docs link opens ${new URL(page.url()).pathname}`)
    await page.click('a.brand')
    await page.waitForLoadState('networkidle')
    check(new URL(page.url()).pathname === '/website/dist/' && (await page.locator('#playground').count()) === 1, `${label} docs: the brand link opens the start page (${new URL(page.url()).pathname})`)
    // the README diagrams are inline SVG elements whose card follows the theme
    // on phones each diagram has its own layout: the boxes stacked, the formats as lists; on desktop the drawings
    const layout = await page.evaluate(() => ({
      wide: [...document.querySelectorAll('.diagram-wide')].filter((e) => e.offsetParent).length,
      steps: [...document.querySelectorAll('.diagram-steps svg')].filter((e) => e.getBoundingClientRect().width > 0).length,
      formats: [...document.querySelectorAll('.diagram-formats .format-strip')].filter((e) => e.offsetParent).length,
    }))
    const phone = viewport.width < 640
    check(phone ? layout.wide === 0 && layout.steps === 8 && layout.formats === 6 : layout.wide === 2 && layout.steps === 0 && layout.formats === 0,
      `${label} index: diagrams use the ${phone ? 'phone' : 'desktop'} layout (${JSON.stringify(layout)})`)
    const diagrams = await page.evaluate(() => [...document.querySelectorAll('.diagram svg')].map((svg) => ({
      texts: svg.querySelectorAll('text').length,
      card: getComputedStyle(svg.querySelector('rect[style*="--dg-bg"]')).fill,
    })))
    const darkCard = 'rgb(15, 23, 42)'
    check(diagrams.length === 2 && diagrams.every((d) => d.texts > 20 && (colorScheme === 'dark' ? d.card === darkCard : d.card !== darkCard)),
      `${label} index: both diagrams render as SVG with a ${colorScheme} card (${diagrams.map((d) => `${d.texts} texts, ${d.card}`).join('; ')})`)
    // Saves and waits until the playground has read the saved file back: the download starts before that, and
    // the next step would otherwise race the reload (an edit looks unsaved and opens the discard dialog, or
    // the reload resets a checkbox the test just set). Only a slow CI runner loses that race.
    const save = async () => {
      const [download] = await Promise.all([page.waitForEvent('download'), page.click('#save')])
      await page.locator('#save:not([disabled])').waitFor()
      return download
    }
    for (const name of inputs) {
      await page.setInputFiles('#pick', join(root, 'input', name))
      await page.locator('#editor').waitFor({ state: 'visible' })
      // for nerds: the byte map of this file, a region's offsets and its hex
      await page.waitForFunction((n) => document.getElementById('file-name').textContent === n, name)
      const regions = await page.locator('#byte-map button').count()
      if (!(await page.getAttribute('#nerds-map', 'open') !== null)) await page.click('#nerds-map summary')
      await page.locator('#byte-map button').first().click()
      // the hex view fills asynchronously (it reads the region from the file)
      const hexShown = await page.waitForFunction(() => /^00000000 /.test(document.getElementById('hex').textContent), null, { timeout: 5000 }).then(() => true, () => false)
      check(regions >= 2 && hexShown && /bytes 0–\d+/.test(await page.textContent('#region-title')), `${label} playground: ${name} byte map has ${regions} regions, offsets and hex`)
      await page.fill('#f-title', `e2e ${name}`)
      const download = await save()
      const saved = join(out, `${label}-download-${name}`)
      await download.saveAs(saved)
      check(download.suggestedFilename() === name, `${label} playground: ${name} downloads as ${download.suggestedFilename()}`)
      check(read(new Uint8Array(readFileSync(saved))).metadata.title === `e2e ${name}`, `${label} playground: ${name} saved with the new title`)
    }
    // playground: several pictures, with their pixel size and type, browsed with next and previous
    await page.setInputFiles('#pick', join(root, 'input', 'sample.pictures.mp3'))
    await page.waitForFunction(() => document.getElementById('file-name').textContent === 'sample.pictures.mp3')
    await page.waitForFunction(() => /^3 × 2 px · PNG · .* · Cover \(front\)/.test(document.getElementById('cover-info').textContent), null, { timeout: 5000 }).catch(() => {})
    const firstPicture = [await page.textContent('#cover-info'), await page.textContent('#cover-count')]
    await page.click('#cover-next')
    await page.waitForFunction(() => /^1 × 1 px · PNG · .* · Cover \(back\)/.test(document.getElementById('cover-info').textContent), null, { timeout: 5000 }).catch(() => {})
    const secondPicture = [await page.textContent('#cover-info'), await page.textContent('#cover-count')]
    await page.click('#cover-prev')
    await page.waitForFunction(() => document.getElementById('cover-count').textContent === '1 of 2', null, { timeout: 5000 }).catch(() => {})
    check(/^3 × 2 px/.test(firstPicture[0]) && firstPicture[1] === '1 of 2' && /^1 × 1 px/.test(secondPicture[0]) && secondPicture[1] === '2 of 2' && (await page.textContent('#cover-count')) === '1 of 2',
      `${label} playground: pictures show pixel size and type, next and previous (${firstPicture.join(', ')} / ${secondPicture.join(', ')})`)
    // playground: cover picture, removing it, Reset, the discard dialog and the microphone recorder
    const loaded = inputs.at(-1)
    await page.setInputFiles('#f-cover', { name: 'cover.png', mimeType: 'image/png', buffer: PNG })
    let download = await save()
    await download.saveAs(join(out, `${label}-cover-${loaded}`))
    check(read(new Uint8Array(readFileSync(join(out, `${label}-cover-${loaded}`)))).metadata.pictures?.[0]?.mimeType === 'image/png', `${label} playground: cover picture saved`)
    await page.check('#f-nocover')
    download = await save()
    await download.saveAs(join(out, `${label}-nocover-${loaded}`))
    check(!read(new Uint8Array(readFileSync(join(out, `${label}-nocover-${loaded}`)))).metadata.pictures?.length, `${label} playground: cover picture removed`)
    const title = await page.inputValue('#f-title')
    await page.fill('#f-title', 'not saved')
    await page.click('#reset')
    check((await page.inputValue('#f-title')) === title, `${label} playground: Reset restores the loaded tags`)
    await page.fill('#f-title', 'not saved')
    await page.setInputFiles('#pick', join(root, 'input', inputs[0]))
    await page.locator('#discard-dialog').waitFor({ state: 'visible' })
    await page.click('#discard-dialog [data-answer="keep"]')
    check((await page.inputValue('#f-title')) === 'not saved', `${label} playground: discard dialog keeps unsaved edits`)
    await page.click('#record')
    await page.locator('#discard-dialog').waitFor({ state: 'visible' })
    await page.click('#discard-dialog [data-answer="discard"]')
    await page.waitForTimeout(1500)
    await page.click('#record')
    await page.waitForFunction(() => /^recording-.*\.wav$/.test(document.getElementById('file-name').textContent))
    check(true, `${label} playground: discard dialog discards; mic recording loads as ${await page.textContent('#file-name')}`)
    check(errors.length === 0, `${label}: no console errors or failed requests${errors.length ? ': ' + errors.join(' | ') : ''}`)
    check(external.size === 0, `${label}: no request leaves the site${external.size ? ': ' + [...external].join(', ') : ''}`)
    const shipped = readFileSync(join(installed, 'dist/browser.min.js'))
    const served = await Promise.all(library)
    check(served.length > 0 && served.every((r) => r.status === 200 && r.body && shipped.equals(r.body)),
      `${label} playground: loads the library from assets/vendor/audio-tag/, identical to dist/browser.min.js (${served.map((r) => r.status).join(', ') || 'not requested'})`)
    await context.close()
  }
} finally {
  await browser.close()
  for (const s of servers) s.kill('SIGTERM')
}

console.log(`${new Date().toISOString()} ${failures.length ? 'FAIL' : 'ok  '} e2e: ${failures.length} failed, results in output/e2e/`)
process.exit(failures.length ? 1 : 0)
