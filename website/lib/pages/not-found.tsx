// The 404 page GitHub Pages shows for any missing address under /audio-tag/ (server only). Its links are
// absolute, since it is served at any depth; config.ts makes its asset URLs absolute too. VERIFIED: make
// e2e serves it under /audio-tag/ as GitHub Pages does, with no failed request.
import { Head } from "../head.tsx";
import { SITE } from "../site.ts";

// Counts down; the meta refresh redirects even without JavaScript. No `&`, `<` or `>` (serialized as XML).
const COUNTDOWN = "let left = 5; const timer = setInterval(function () { left -= 1; document.getElementById('countdown').textContent = left ? 'Taking you back to audio-tag in ' + left + (left === 1 ? ' second.' : ' seconds.') : 'Taking you back to audio-tag.'; if (left === 0) clearInterval(timer) }, 1000)";

export function NotFoundPage({ title, description }: { title: string; description: string }) {
  return (
    <html lang="en">
      <Head title={title} description={description} />
      <body>
        <meta http-equiv="refresh" content={`5;url=${SITE}`} />
        <meta name="robots" content="noindex" />
        <main class="page not-found">
          <section class="mk-empty-state" aria-labelledby="nf-title">
            <h1 class="mk-empty-state-title" id="nf-title"><img src="assets/icon.svg" alt="" width="64" height="64" /><br />Page not found</h1>
            <p class="mk-empty-state-text">There is nothing at this address. <span id="countdown">Taking you back to audio-tag in 5 seconds.</span></p>
            <div class="mk-empty-state-actions">
              <a class="btn brand-btn" href={SITE}>Back to audio-tag</a>
              <a class="btn" data-variant="outline" href={`${SITE}docs`}>Read the docs</a>
            </div>
          </section>
        </main>
        <script>{COUNTDOWN}</script>
      </body>
    </html>
  );
}
