// Every page: dark mode (class="dark" on <html>, remembered) and, on the docs, the menu entry of the
// section in view. VERIFIED: plain script rather than an island, since every page needs it and it renders nothing.
const root = document.documentElement

function setDark(dark) {
  root.classList.toggle('dark', dark)
  try { localStorage.setItem('audio-tag-theme', dark ? 'dark' : 'light') } catch {}
  for (const b of document.querySelectorAll('[data-theme-toggle]')) b.setAttribute('aria-pressed', String(dark))
}
for (const b of document.querySelectorAll('[data-theme-toggle]')) {
  b.setAttribute('aria-pressed', String(root.classList.contains('dark')))
  b.addEventListener('click', () => setDark(!root.classList.contains('dark')))
}

// VERIFIED: the section in view is the last heading above 30% of the viewport (an IntersectionObserver marks
// whichever entry fires last when several cross at once, which is not always the one in view).
const links = new Map([...document.querySelectorAll('.docs-nav a[href^="#"]')].map((a) => [a.getAttribute('href').slice(1), a]))
const targets = [...links.keys()].map((id) => document.getElementById(id)).filter(Boolean)
if (targets.length) {
  let queued = false
  const mark = () => {
    queued = false
    const line = innerHeight * 0.3
    let current = targets[0]
    for (const t of targets) if (t.getBoundingClientRect().top <= line) current = t
    for (const [id, a] of links) {
      if (id === current.id) a.setAttribute('aria-current', 'location')
      else a.removeAttribute('aria-current')
    }
  }
  addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(mark) } }, { passive: true })
  mark()
}
