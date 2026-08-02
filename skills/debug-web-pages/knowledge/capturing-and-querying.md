# Capturing a page & querying the bundle

The **capture** mode: snapshot a live page into an offline **bundle**, then query
it. Use it to understand a page's structure/behavior/state without the live tab.
For testing behavior or interventions on the *running* page, that's the other mode
— see [`live-experiments.md`](live-experiments.md).

## Capturing

1. **(optional) Arm / interact.** Get the page into the state you care about
   (scroll, click, go fullscreen, open a menu). The capture is a **point-in-time
   snapshot** — whatever's on screen is what you get.
2. **Capture.** Open DevTools → **Console**, paste the entire contents of
   [`../scripts/capture.js`](../scripts/capture.js), press Enter → downloads `capture.json`.
   - MUST be the **console** — it uses `getEventListeners()`, which only exists in
     the DevTools command-line API. A page-injected script can't call it.
3. **Unpack**, from the project you're debugging:
   ```bash
   node ~/.claude/skills/debug-web-pages/scripts/unpack.js ~/Downloads/capture.json
   ```
   → writes `./captures/<slug>-<timestamp>/` (`README.md`, `manifest.json`,
   `page.html`, `shadow-and-frames.json`, `listeners.json`, `runtime.json`,
   `meta/capture.raw.json`). `-o <dir>` to relocate.
4. **Read the bundle's generated `README.md` first**, then query — see below.

## Querying — the golden rule

**Bundle files are multi-MB. Query them — never read them whole into context.**
Each unpacked bundle carries a generated `README.md` with a query section tailored
to that capture; this is the deeper reference behind it.

> **`jq` may not be installed.** The JSON examples use `jq` for brevity; if
> `command -v jq` is empty, use Node — always available, reads JSON natively:
> ```bash
> node --input-type=module -e '
>   import { readFileSync } from "node:fs";
>   const li = JSON.parse(readFileSync("captures/<bundle>/listeners.json","utf8"));
>   console.log(Object.keys(li.byType));
>   console.log(li.byType.keydown.map(g => ({hash:g.handlerHash, n:g.nodeCount})));
> '
> ```

### `page.html` — the lossless light DOM

Real, newline'd HTML — an `outerHTML` snapshot of the *live, rendered* DOM (so
JS-injected content is already present).

- **Text / attribute lookups:** `grep` / `rg` directly.
- **Structural queries / extraction:** parse in Node with **cheerio** or
  **linkedom** (`querySelectorAll` / `.textContent`) — the "jQuery-like" path.
  ```js
  // node --input-type=module   (npm i cheerio, or npx)
  import { readFileSync } from "node:fs";
  import * as cheerio from "cheerio";
  const $ = cheerio.load(readFileSync("captures/<bundle>/page.html", "utf8"));
  console.log($("a#video-title").map((_, el) => $(el).text().trim()).get());
  ```

> **Hard rule:** never re-execute the page's *own* JS against `page.html`. It
> expects the live origin and will just error. It's inert markup — parse it as
> data with a static parser only.

### `listeners.json` — event handlers, grouped

- `.byType["<event>"]` → array of grouped entries (identical source+flags
  collapsed): `handlerHash`, `source` (~2000-char cap), `useCapture`, `passive`,
  `once`, `nodeCount`, `nodes[]`.
- `.byNode["<css-path>"]` → event types on one node.
- `.blindSpots` → what this layer can't see.

**CSS-path locator format** (how `nodes[]` reads): `#id` else `tag` else
`tag:nth-of-type(n)`; ` > ` = parent→child; ` >> ` crosses into an **open shadow
root**; ` >>iframe>> ` into a **same-origin iframe**; `window`/`document` are their
own paths.

### `shadow-and-frames.json` — what `page.html` can't hold

Array of `{ hostPath, kind, mode?/origin?, src?, html?, note? }`. Open shadow roots
and same-origin iframes carry lossless `html` — extract it and query like `page.html`.

### `runtime.json` / `manifest.json` — small, `jq`/Node-friendly

Frameworks + site globals; capture metadata, metrics, warnings, blindSpots.

## Skew caveat

Artifacts are sampled across a few ms of a live, mutating page — a few
`listeners.json` node paths may not resolve in `page.html`. Treat a non-resolving
path as "was there at capture time," not a bug. Only the CDP backend fully removes
this (see [`../ROADMAP.md`](../ROADMAP.md)).
