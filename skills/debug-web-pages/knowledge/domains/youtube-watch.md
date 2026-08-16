# Domain: youtube.com/watch

_Last updated: 2026-07-13 from capture `www-youtube-com-watch-2026-07-13-162323`
(console-snippet backend) + live-experiment session 2026-07-13 (scrub-back spike)
+ live-experiment session 2026-07-16 (fullscreen recon, for the fake-stage spec)
+ live-experiment session 2026-07-20 (wheel leaking into the fullscreen videowall grid)._

## What this page is
The YouTube video watch page — a Polymer/custom-element app (`ytd-*`, `tp-yt-*`)
wrapping an HTML5 video player.

## Landmarks (verified in `page.html`)
- `ytd-app` — app root; `ytd-watch-flexy` — the watch-page layout container.
- `#masthead` (top bar), `#content` (main content region).
- `#movie_player` — the player container; `.html5-video-player` — the player;
  `.video-stream` (`.html5-main-video`) — the actual `<video>` element.

## Framework / runtime
- `runtime.json`: `youtube: true`, globals **`ytcfg`, `ytInitialData`,
  `ytInitialPlayerResponse`** (initial page/player state lives here — read these
  for video metadata, config, and server-provided state).
- Scale (typical): ~6k DOM nodes, ~4k listener attachments across ~250 event
  types, ~40 stylesheets, ~65 scripts, ~2.2–2.5 MB of HTML.
- Handler sources are **heavily obfuscated** (control-flow-flattened minification),
  so reading intent from a handler's `source` alone is hard — lean on *where* it's
  bound and its flags. djb2 grouping still collapses duplicates well.

## Known behaviors & handlers (+ proven interventions)
Global **keyboard** entry points (this is where shortcuts like ←/→ seek, space,
`f`, `j`/`l` live — they are NOT bound on the player element). Verified in bundle
`…162323`:
- **`window`** — *nothing*. No `keydown`/`keyup` listener on `window`. So the
  topmost node of the capture phase is uncontested — a listener you add there is
  the first handler in the entire dispatch. (This is the lever the intervention
  below uses.)
- **`document`** — `keydown` **capture** `a12de06a` (`[native code]`,
  `passive:false`) **← the seek chokepoint**; plus `keydown`/`keyup` **bubble**
  `9dbd5fd4` (`function(J){L(J,J.detail)}`, an app-level command dispatcher).
- **`html > body`** — `keydown`+`keypress`+`keyup`, one handler `8cf73ac9`,
  **`useCapture:true` but `passive:true` → cannot `preventDefault()`**.
- **`#movie_player`** — `keydown`+`keyup` bubble `1e1a8d54`.

⚠️ **Handler hashes drift between YouTube builds** (the body-capture handler was
`c1787dde` in the 07-12 capture, `8cf73ac9` in 07-13; same role). Trust
**position + phase + flags**, not the hash string, when comparing across captures.

⚠️ The body-level capture handler is **passive → it cannot `preventDefault()`**,
so it is *not* the thing that cancels a key.

### ✅ PROVEN: block the ArrowLeft (←) −5 s seek
Verified live 2026-07-13 (paused **and** playing), resolving the scrub-back spike:
- The seek fires on **`keydown`** — `currentTime` drops the full 5.00 s *within*
  the keydown dispatch; **`keyup` never seeks**.
- It's a **JS action, not the browser default**: it happens even when
  `defaultPrevented === false`, so **`preventDefault()` alone does nothing.**
- Reliably blocked by a **`window` capture-phase `keydown` listener that calls
  `stopImmediatePropagation()`** — window-capture runs upstream of the `document`
  capture seeker (`a12de06a`), and nothing else is bound on `window`, so the
  position is uncontested:
  ```js
  window.addEventListener("keydown", (e) => {
    if (e.key !== "ArrowLeft") return;
    e.stopImmediatePropagation();   // preventDefault() alone is NOT enough
  }, true);                          // capture phase
  ```
- ⚠️ **Collateral — gate the target:** the raw listener fires page-wide, so gate it
  to stay inert in text inputs. Shadow-safe gate, **verified 2026-07-13**:
  ```js
  const isEditable = (el) => !!el && (el.isContentEditable === true ||
    /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName || ""));
  window.addEventListener("keydown", (e) => {
    if (e.key !== "ArrowLeft") return;
    const real = e.composedPath()[0] || e.target;  // pierce shadow retargeting
    if (isEditable(real)) return;                   // let text fields keep ←
    e.stopImmediatePropagation();
  }, true);
  ```
  (`composedPath()[0]` recovers the true focused node even across shadow
  boundaries — keyboard events are `composed:true`.)
- **For an MV3 content script:** register at `document_start`. Because
  window-capture is topmost and uncontested, registration timing vs YouTube's own
  scripts doesn't matter (there's no window-level competitor to lose a race to);
  an isolated-world `window` listener still participates in the page's dispatch.
- **Robustness — stress-tested 2026-07-13, all green:**
  - Player context (focus `BODY`) and **fullscreen** (focus becomes the player
    `DIV`) — both blocked.
  - **Text inputs** (search box) — interceptor stays inert (zero fires when an
    editable node is focused); ← behaves as YouTube natively does there.
  - **Other shortcuts** (→, space, `j`/`l`) — untouched (we key on `ArrowLeft`).
  - **SPA in-app nav** — the `window` listener persists across YouTube's
    client-side navigation (window survives the route change), so no re-arm needed.

## Fullscreen — mechanism & state (verified 2026-07-16, live FS-RECON probe)
**Check the player variant before trusting this section.** It was verified against
YouTube's **full-bleed / cinematics** player (classes `full-bleed-player`,
`cinematics-active`, `ytp-full-bleed-player`), which is one of several configurations
YouTube serves. Classic configs differ — see the warning under A1.

- **A1 — the fullscreen element is `<html>`, not the player.**
  `document.fullscreenElement === document.documentElement`. Modern YouTube calls
  `requestFullscreen()` on the **document root** and fills it with CSS ("fuller
  screen"; note the `yt-set-fullerscreen-styles` event) — it does **not** fullscreen
  `#movie_player` or the `<video>`. Because `<html>` is the fullscreen element,
  *any* in-document node is a descendant → **visibility in fullscreen is free**; the
  real work is positioning + stacking + click isolation.
  ⚠️ Classic (non-full-bleed) configs historically fullscreen `#movie_player`. A host
  mounted **as a child of `#movie_player`** is inside the fullscreen element either
  way — the robust mount choice.
- **A3 — no re-parenting.** `#movie_player`'s ancestry is identical in default and
  fullscreen; fullscreen is signalled by class/attribute flips, not DOM moves.
- **Verified ancestry (both modes):**
  `body → ytd-app → div#content → ytd-page-manager#page-manager → ytd-watch-flexy →
  div#full-bleed-container → div#player-full-bleed-container → div#player-container →
  ytd-player#ytd-player → div#container → div#movie_player.html5-video-player`
  (`<video class="video-stream html5-main-video">` sits inside `#movie_player`).
- **A4 — state signals (default → fullscreen):**
  | node | default | fullscreen |
  |---|---|---|
  | `document.fullscreenElement` | none | **`<html>`** |
  | `<body>` | — | **`.no-scroll`** (`overflow:hidden`) |
  | `ytd-app` | `overflow:visible` | `overflow:hidden` |
  | `ytd-watch-flexy` | (no attr) | **`fullscreen`** attribute |
  | `#movie_player` | `ytp-autohide` | **`ytp-fullscreen ytp-full-bleed-player ytp-fullscreen-grid-peeking ytp-autohide-active`** |
- **A6 — no containing-context traps.** Nothing in the ancestry sets
  `transform`/`contain`/`will-change`/`filter`/`perspective` in either mode. The only
  positioning contexts are `position`: `ytd-app` absolute, `#full-bleed-container`
  relative (`overflow:clip`), `#player-container` absolute, and **`#movie_player`
  `position:relative; overflow:hidden; z-index:0`** — a stacking context that **clips**
  absolutely-positioned children.
- **A5 — stacking.** Highest z-index inside `#movie_player` is **6000** (settings-menu
  popup `#ytp-id-5.ytp-settings-menu`), then tooltip ~1003, unmute ~1001; persistent
  chrome lower. An overlay must exceed **6000** to sit above everything, ~1003 to beat
  the normal control bar.

## Pointer / click (from capture `…162323`; static)
- **`#movie_player` handles `click` + `dblclick` in the _bubble_ phase** (wrapped sink
  `1e1a8d54`): single click → play/pause, double click → fullscreen toggle. So a
  **child overlay's click bubbles into the player handler → it must `stopPropagation()`**
  (D3), or mount above `#movie_player`.
- `document` **capture** click handlers: `810ecaa7` (`_onCaptureClick`), `7298bfbe`
  (suspicious-link guard). `#player-container` has a bubble `pointerdown` (`ef2d1205`).

## Wheel / scroll — mechanism & proven intervention (verified 2026-07-20, live WHEEL-GUARD session)
- **No `wheel` handler on `window`** — window-capture is uncontested for wheel too (same lever as
  keyboard). YouTube's broad wheel handlers are **passive** (`passive:true` → cannot
  `preventDefault`, but they still run JS): `html>body` **capture** `8cf73ac9`; `#movie_player`
  **bubble** `1e1a8d54`. The rest are scoped to non-player containers (`#guide` / `#playlist` /
  `ytd-popup-container` `7265c676`; settings-menu `a12de06a`; description social-links + related
  chip-cloud horizontal scroll-rails). ⚠️ hashes drift between builds — trust position + phase + flags.
- **The fullscreen related-videos grid is wheel-DRIVEN, not a scroll.** In fullscreen, wheeling
  reveals/moves YouTube's **"videowall"**: `.ytp-fullscreen-grid` → `.ytp-fullscreen-grid-main-content`
  → `.ytp-fullscreen-grid-stills-container` → `.ytp-modern-videowall-still` tiles (all `ytp-*` **light
  DOM inside `#movie_player`**). It
  moves via YouTube's JS off `deltaY` — **no element's `scrollTop`/`scrollLeft` changes and no
  `scroll` event fires**, and in fullscreen `<body>` is `.no-scroll` (`overflow:hidden`) so the page
  can't scroll either. ⇒ **a scroll-position / `scroll`-event probe reports false silence here** —
  measure the *wheel*, not scroll state. (`overscroll-behavior: contain` also does nothing: there is
  no native scroll chain to contain.)

### ✅ PROVEN: stop an in-overlay wheel from leaking into YouTube's grid
A child overlay mounted **inside `#movie_player`** leaks the mouse wheel
into that grid: `wheel` is **`composed:true`**, so it bubbles OUT of the overlay's shadow root into
the passive `#movie_player`/`body` handlers. (Dragging the scrollbar **thumb** emits *no* `wheel`
event → never leaks; only the wheel does — the discriminating symptom that points straight at
`wheel` rather than a scroll container.)
- Fix (verified live 2026-07-20): a **`window` capture-phase `wheel` listener** that
  `stopPropagation()` **only when `composedPath()` includes the overlay** — window-capture runs
  before both YouTube wheel handlers, and `stopPropagation` (NOT `preventDefault`) hides the event
  from them while the browser still scrolls the overlay's own list natively.
  ```js
  window.addEventListener("wheel", (e) => {
    const overOverlay = e.composedPath().some(
      (n) => n instanceof Element && n.classList.contains(OVERLAY_CLASS));  // your overlay's own marker class
    if (!overOverlay) return;        // bare-video wheel → leave YouTube's grid behavior untouched
    e.stopPropagation();             // preventDefault is NOT needed; native list scroll still works
  }, true);                          // capture phase
  ```
- **Gating to the overlay is essential** — ungated, this kills YouTube's own scroll-to-reveal-grid.
- Same **window-capture-is-uncontested** topology as the ArrowLeft block above.

## Shadow DOM / iframes
- Exactly **one open shadow root**: `#booster_root` (~228 KB, captured in
  `shadow-and-frames.json`).
- One trivial **same-origin** iframe; one **cross-origin** iframe (opaque).
- **Everything else in the component UI (incl. much of the player chrome) is
  behind CLOSED shadow roots → invisible to the console backend.** This is the
  dominant blind spot for this domain.

## Do's & don'ts
- **Do** look at `document` (and `body`) for global keyboard shortcuts — not the
  player element.
- **Do** read `ytInitialData` / `ytInitialPlayerResponse` for state instead of
  scraping rendered nodes when you can.
- **Don't** expect the player's internal controls/handlers in `page.html` or
  `shadow-and-frames.json` — they're behind closed shadow roots (→ needs the CDP
  backend).
- **Don't** assume the `body` capture handler blocks keys — it's passive.
- **Don't** assume a visual "scroll" is an element scroll. YouTube's fullscreen videowall is
  **wheel-driven JS** (no `scroll` event, no `scrollTop` change) → scroll-based probes see nothing;
  instrument the `wheel` instead. See the Wheel/scroll section.

## Open questions / gotchas
- **Fullscreen mechanism — RESOLVED 2026-07-16.** Fullscreen element is `<html>`
  (full-bleed player), `#movie_player` does not re-parent, no containing-context
  traps, chrome z-index ceiling 6000 — see the **Fullscreen** section above. This is
  the basis for building a fake-fullscreen test stage.
- **Escape in fullscreen — WON'T-FIX (browser-native).** Esc is consumed by the
  browser to exit fullscreen *above* the page's JS listeners, so no `keydown` handler
  can reliably intercept it. Confirmed as a hard constraint — never bind Esc, and any
  fake stage using the real Fullscreen API inherits the behavior for free.
- **ArrowLeft (←) −5 s seek — RESOLVED 2026-07-13.** Intercepted via `window`
  capture-phase `stopImmediatePropagation()` on `keydown`; see the proven
  intervention above. The seeker never surfaced from a closed shadow root — it's
  the `document` capture-phase keydown handler, fully reachable.
- **Robustness — RESOLVED 2026-07-13:** block holds in fullscreen and across SPA
  nav; the gated version leaves text inputs and all other shortcuts untouched. See
  the proven-intervention notes.
- Same `stopImmediatePropagation`-at-`window`-capture recipe should generalize to
  YouTube's other single-key shortcuts (→, `j`/`l`, space) — unverified, but the
  handler topology (uncontested `window`, seeker on `document` capture) is shared.
- **In-overlay wheel leaking into the fullscreen videowall — RESOLVED 2026-07-20.** A child overlay
  inside `#movie_player` leaks the mouse wheel (composed `wheel` bubbles to YouTube's passive
  handlers). Fixed with a **gated `window`-capture `stopPropagation` on `wheel`** — see the
  Wheel/scroll proven intervention. Two traps that cost two wrong probes: (1) the grid is wheel-driven
  JS, so scroll-position probes show false silence; (2) `overscroll-behavior` does nothing (no native
  chain). The scrollbar-thumb-doesn't-leak / wheel-does asymmetry is the tell.
