# Live experiments

The **live-experiment** mode: test hypotheses and interventions on the *running*
page — the things a static capture can't answer ("which event does the seek fire
on?", "can I block it?"). Capture maps the terrain; live experiments prove
behavior.

**It's a collaborative loop — I can't drive the browser.** I write a console
**probe**, you run it in a real tab and interact (press keys, click), you paste
the logs back, I read them and write the next probe. Design every probe so its
output is enough for me to decide the next move without seeing your screen.

## The probe loop

**recon → hypothesize → intervene → verify → record**

1. **Recon** — a *non-destructive* probe that only observes: which events fire, in
   what order, and what state changes as a result. Find the real mechanism before
   touching it.
2. **Hypothesize** — name the mechanism ("the seek happens on keyup, handled near
   document level").
3. **Intervene** — a probe that tries to change behavior, at one specific
   position/phase.
4. **Verify** — confirm the intervention worked *and* did no collateral damage.
5. **Record** — write the proven result into the page's `domains/<page>.md`.

## Writing good probes

- **Gate early and narrowly** — `if (e.key !== "ArrowLeft") return;` — so logs
  aren't drowned by unrelated events.
- **Log the state that proves the outcome**, not just that the handler ran (e.g.
  `document.querySelector('video').currentTime`). The state delta is the evidence.
- **Make PASS/FAIL observable** and tell the user *exactly* what to do: "pause the
  video, note currentTime, press ← three times, paste the logs + the new
  currentTime."
- **Interception listeners persist** — tell the user to **reload** between
  attempts to clear them (a fresh state per hypothesis).
- Prefer capture-phase, one variable per probe (see below).

## Established interception knowledge

Prior knowledge worth not re-deriving (validated on YouTube; generalizes):

- **Capture-phase order is Window → Document → … → target.** A **capture**
  listener on `window` runs *before* any `document`-level listener **regardless of
  registration order**. That's usually the most promising interception point.
- **Keyboard events are `composed: true`** — they cross shadow-DOM boundaries, so
  a shadow-hosted app still sees page keystrokes and vice-versa.
- **JS-driven actions are not browser defaults.** If the site performs an action
  in JS (YouTube's seek), `preventDefault()` **alone will not stop it** — you must
  stop the event reaching the site's own handler with **`stopImmediatePropagation()`
  in a listener that runs before it**.
- **Some sites act on `keyup`, not `keydown`** (proven for Space on YouTube). Test
  and, if intercepting, block **both**.
- **Registration-order caveat:** a real content script registers at
  `document_start`, *before* page scripts; a console snippet registers *late*. So
  if `window`-capture works from the console, it'll work in the extension. But if
  the only thing that works needs registering before the site on the *same*
  node/phase, the console test **under-reports** — call that out explicitly, since
  an early content script may still succeed.

## Robustness (once an intervention passes)

Re-verify PASS under each condition — these are where interventions silently break:

- **Fullscreen** (often a different focus/handler context).
- **Focus variations** — click the video, click empty page area, click a text
  element, then trigger.
- **After SPA navigation** — client-side nav may swap the target element or
  re-bind handlers even though your `window` listener survives.
- **No collateral damage** — confirm the keys/actions you *didn't* target still
  behave normally.

## When a probe fails

Don't re-run the same probe hoping for a different result. **Change one variable
and re-test**: the phase (capture vs bubble), the node (`window` → `document` →
the specific element, e.g. `#movie_player`), or the event (`keydown` ↔ `keyup`).
If nothing lands, **cross-reference the capture** — find the actual handler in
`listeners.json` to see where it's really bound — and consider that the mechanism
lives behind a **closed shadow root** (invisible to the console; a CDP-backend
job). See "When you're stuck" in [`investigation-patterns.md`](investigation-patterns.md).
