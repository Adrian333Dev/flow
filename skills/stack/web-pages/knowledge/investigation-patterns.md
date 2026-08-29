# Investigation patterns

Pick the investigation *type*, then use the approach below. These are **starting
points, not a menu** (see the stance in [`../SKILL.md`](../SKILL.md)) — if a better
route exists, take it. Check [`domains/`](domains/) first for what's already known
about the page.

Two families: **static** patterns read a capture bundle
([`capturing-and-querying.md`](capturing-and-querying.md)); **live** patterns run
probes in the tab ([`live-experiments.md`](live-experiments.md)). Most
investigations combine them.

## A — Scrape structure / content (static)

**Layer:** `page.html` (a snapshot of the *rendered* DOM, so JS-injected content
is present). `rg` for known anchors, then cheerio/linkedom for extraction. Content
inside web components/embeds is in `shadow-and-frames.json`. Virtualized lists only
hold what was materialized — scroll the region into view *before* capturing.

## B — What handles this event? (static → live)

1. **Static:** `listeners.json` `.byType["<event>"]` — read each `source`, note
   `useCapture` (capture runs before bubble and can cancel first) and `passive` (a
   passive listener *cannot* `preventDefault`). Keyboard shortcuts are usually on
   `document`/`window`, not the focused element.
2. **Live:** confirm *which* event actually drives the action, and whether you can
   intercept it — a recon probe, then an interception probe. See
   [`live-experiments.md`](live-experiments.md).

The static pass narrows the search; the live pass proves it. Neither alone is
enough for interception work.

## C — Read framework / runtime state (static)

`runtime.json` (detected frameworks + site globals) cross-read with `page.html`
roots (`#root`, `#__next`, custom elements). Prefer reading a site's own state
globals over scraping rendered nodes when they exist.

## D — Intervene / modify behavior (live)

Recon → intervene → verify → robustness. The whole procedure and the established
interception knowledge (capture-phase order, `stopImmediatePropagation` vs
`preventDefault`, keyup-vs-keydown, the content-script registration caveat) live in
[`live-experiments.md`](live-experiments.md).

## Standing blind spots (console-snippet capture)

Properties of *how* we capture, not of a page:

- **Closed shadow roots** aren't traversable — content and listeners inside them
  are invisible. Component-heavy sites hide most internals this way.
- **Non-DOM EventTargets** (XHR, WebSocket, AudioContext, custom emitters) aren't
  reached by the walk; `window`/`document` are captured explicitly, others aren't.
- **Live-page skew** — see `capturing-and-querying.md`.
- Only **open** shadow roots and **same-origin** iframes are captured losslessly.

## When you're stuck

A task that keeps failing is a signal to **change the approach, not repeat it**:

1. **Question the hypothesis.** State it explicitly; what evidence would falsify
   it? Run a recon probe that could disprove it, not just confirm it.
2. **Change one variable at a time** — phase (capture↔bubble), node
   (`window`→`document`→element), event (`keydown`↔`keyup`), timing (registration
   order). One change per probe so the result is attributable.
3. **Cross the modes.** Stuck live? Capture and read `listeners.json` to see where
   the handler *really* is. Stuck static? A live probe reveals runtime-only behavior.
4. **Suspect a blind spot.** If the mechanism is nowhere visible, it's likely
   behind a closed shadow root or on a non-DOM target, which the console backend
   cannot reach at all. Say so rather than looping.
5. **Measure the right primitive.** A probe that logs *nothing* is only evidence if
   it watches the actual mechanism. A visual "scroll" may be **wheel-driven JS**
   (moves via transform, fires no `scroll` event, changes no `scrollTop`) — a
   scroll-state probe then reports **false silence**. When the thing visibly moves
   but your probe is silent, re-ask *what primitive moves it* (`wheel`? `pointer`?
   transform? WAAPI?) and instrument that instead. (A user detail that isolates the
   input — e.g. "scrollbar thumb is fine, only the wheel leaks" — points straight at
   the primitive; `wheel` fires no event on thumb-drag.)
6. **Invent.** Nothing here is exhaustive — a novel probe, a different tool, or an
   angle the docs don't mention is fair game. Then write what worked into the
   domain file so next time starts ahead.
