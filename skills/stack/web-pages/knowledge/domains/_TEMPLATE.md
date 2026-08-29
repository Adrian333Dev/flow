# Domain: <url pattern, e.g. youtube.com/watch>

_Last updated: <YYYY-MM-DD> from capture `<bundle-name>`._

> Copy this file to `<slug>.md` (e.g. `youtube-watch.md`) for a new page. Record
> only what you **verified** from a real capture — this file is trusted by future
> runs. Mark anything unconfirmed as an open question.

## What this page is
<one-liner>

## Landmarks
Key containers / ids / selectors and where they sit in `page.html` (with the
locator so it's greppable).

## Framework / runtime
Detected frameworks; important globals (`window.X`); how state is stored.

## Known behaviors & handlers (+ proven interventions)
`event → which handler owns it` (include `handlerHash` and/or the node's css-path
when known), and any **intervention** proven to work or fail (e.g. "← seek blocked
by `window`-capture `stopImmediatePropagation`; `preventDefault` alone does
nothing"). This is the highest-value section — the "we already figured this out"
cache.

## Shadow DOM / iframes
Open vs closed shadow roots; same/cross-origin frames; what's reachable vs. a
blind spot here.

## Do's & don'ts (when investigating this page)
- **Do:** …
- **Don't:** …

## Open questions / gotchas
Unresolved threads and traps for the next run.
