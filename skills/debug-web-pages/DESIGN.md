# Design: debug-web-pages skill

This doc is the technical design of the skill's **capture engine** (the page →
bundle → query pipeline), which is the architecture-heavy part. The **live
experiment** mode is procedural — its design lives in
`knowledge/live-experiments.md`.


- **Date:** 2026-07-12 (packaged as a skill 2026-07-13)
- **Status:** Approved — building incrementally (no separate implementation plan; see "Incremental Build Approach")
- **Owner:** Adrian
- **Packaging:** a project-local Claude Code skill at `.claude/skills/debug-web-pages/`.
  Capture is one of two **modes** (the other is live experiments); `SKILL.md` is the entry point.
  Future packaging (hostable multi-skill repo) is in `ROADMAP.md`. Unrelated to superpowers.

## Problem

When building browser extensions (e.g. a Chrome MV3 / WXT + React extension on YouTube),
we constantly need to investigate the *client side* of a live page — not just its markup,
but its behavior: which nodes have event listeners, on what phase; what JS actually runs;
what network traffic flows; what runtime/framework state exists. A concrete example is the
"intercept ArrowLeft on YouTube" spike (`delapse/scrub-back-spike.md`): nothing in the HTML
tells you that YouTube seeks via JS on `keyup`, that handlers sit at document level, or that
the player lives in shadow DOM. That is *behavior*, and it lives in JS, listeners, and runtime
state.

Today, handing this context to a local agent (Claude Code, Codex) is painful. Playwright is
awkward in the extension world, and copy-pasting raw HTML is both huge and insufficient — it
omits JS, CSS, listeners, network, and runtime state. We want a repeatable way to capture a
**comprehensive, structured bundle** of any page and save it locally so an agent can freely
investigate and query it offline.

## Goals

- Capture a page **broadly** — full HTML is always included, plus DOM structure (incl. shadow
  DOM), event listeners with phase info, CSS, JS, runtime/framework state, and (optionally)
  network traffic and a screenshot.
- Produce a **single, backend-agnostic bundle format** (a directory) that an agent reads the
  same way regardless of how it was captured.
- Support **multiple capture backends** that write into that one format, usable individually
  or combined:
  - a zero-setup **console-snippet** backend (the default), which is the *only* backend that
    runs inside the user's real, logged-in Chrome;
  - a **CDP** backend for deep cases (closed shadow roots, complete JS sources, coverage,
    screenshots, full automation);
  - **native HAR** folded in for network.
- Support a **hybrid capture** model: arm → interact with the page → dump. Point-in-time state
  is a snapshot; network is recorded over the interaction interval.

## Non-Goals

- Not building the ArrowLeft extension feature itself — this is investigation tooling.
- Not a general web crawler/scraper — it captures a single page, not a site.
- Not defeating anti-bot, DRM, or cross-origin security boundaries. Cross-origin iframe
  internals are noted as boundaries, not pierced.
- Not a hosted service — a local developer tool.

## Key Concepts

1. **Bundle format** — the canonical output. A directory with a `README.md` index (for
   humans/agents), a `manifest.json` (machine index), and per-layer files. This is the
   *interface* every backend targets; consumers only ever learn this one shape.
2. **Capture backend** — a producer that gathers page data and hands it to the shared bundle
   writer. Backends differ in mechanism and reach (see comparison below) but never in output.
3. **Hybrid capture** — snapshot (state at dump time) + interval log (network over the
   session). "Scroll/click first, then dump" simply snapshots a more interesting state.

### Backend reach (why we support several, not one)

| Capability | Console snippet | CDP | Native HAR |
|---|---|---|---|
| Full HTML | ✅ | ✅ | — |
| DOM + **open** shadow roots | ✅ | ✅ | — |
| **Closed** shadow roots | ❌ | ✅ (`DOM.getDocument {pierce:true}`) | — |
| Event listeners + phase | ✅ `getEventListeners` | ✅ `DOMDebugger.getEventListeners` | — |
| Complete JS sources (eval'd, injected, source maps) | ⚠️ fetchable URLs only, CORS-limited | ✅ every parsed script | — |
| Code coverage (what ran) | ❌ | ✅ | — |
| Full-page screenshot | ❌ | ✅ | — |
| Network (req/resp bodies, WS frames) | ⚠️ forward-only monkeypatch | ✅ | ✅ complete |
| Runs in real logged-in Chrome | ✅ | ❌ (needs copied/dedicated profile) | ✅ |
| Zero setup / no automation | ✅ | ❌ | ✅ (manual export) |

The last two rows are the point: **the console snippet is the only backend that runs in the
user's actual everyday logged-in browser** — Chrome 136+ forbids remote-debugging the default
profile. Each backend has a niche, so we make them pluggable rather than picking one.

## Architecture

```
                 ┌─────────────────────────────────────────────┐
   BACKENDS      │              SHARED BUNDLE FORMAT            │   CONSUMER
                 │            captures/<slug>-<ts>/             │
 ┌───────────┐   │   README.md  manifest.json  page.html  ...  │   ┌────────┐
 │ console   │──▶│                                             │──▶│ agent  │
 │ snippet   │   │        (written by shared writer module)    │   │ reads  │
 └───────────┘   └─────────────────────────────────────────────┘   └────────┘
 ┌───────────┐            ▲                     ▲
 │ CDP       │────────────┘                     │
 └───────────┘                                  │
 ┌───────────┐                                  │
 │ native    │──────────────────────────────────┘
 │ HAR       │
 └───────────┘
```

**Components (each isolated, one purpose, well-defined interface):**

- **`bundle-writer`** (Node module) — the single place that knows the bundle format. Takes a
  normalized in-memory capture object and writes the directory, `manifest.json`, and
  `README.md`. Every backend routes through it, so the format lives in exactly one file.
- **`bundle-schema`** — the manifest/bundle JSON schema + a `validate-bundle` checker used by
  tests and as a sanity CLI. Defines the interface consumers rely on.
- **`capture.js`** (console snippet) — pasted into DevTools console, gathers page data, and
  downloads one `capture.json`.
- **`arm-network.js`** (console snippet, optional, phase 2) — pasted *first* to record
  fetch/XHR/WebSocket going forward into a global buffer that `capture.js` folds in.
- **`unpack.js`** (Node CLI) — takes the downloaded `capture.json` (+ optional `.har`),
  fetches external assets that the snippet couldn't (no CORS in Node), and calls
  `bundle-writer` to emit the directory.
- **`cdp-capture.mjs`** (Node CLI, phase 3) — connects over CDP to a Chrome launched with a
  copied/dedicated profile, gathers the deep layers, and calls `bundle-writer` directly.
- **`profile-helper`** (phase 3) — copies the real profile or launches a dedicated debug
  profile for the CDP backend.

## The Bundle Format

```
captures/<slug>-<YYYY-MM-DD-HHMMSS>/
  README.md          # index the agent reads first (see template below)
  manifest.json      # machine index (schema below)
  page.html          # full documentElement.outerHTML — the lossless light DOM; always present
  shadow-and-frames.json # lossless HTML for open shadow roots + same-origin iframes
                     #   (the content page.html physically can't hold); cross-origin = boundary note
  listeners.json     # grouped listeners + CSS-path locators + blind-spot notes (schema below)
  runtime.json       # framework detection + selected globals (depth/size capped)
  styles/
    index.json       # [{ id, kind:"inline"|"external", href?, media, disabled }]
    <id>.css         # stylesheet text where reachable
  scripts/
    index.json       # [{ id, kind, src?, type, module, async, defer }]
    <id>.js          # inline text always; external where fetchable/parsed
  network.har        # optional — native HAR, arm-network, or CDP
  screenshot.png     # optional — CDP or native DevTools capture
  meta/
    capture.raw.json # provenance: the raw producer output
```

### `manifest.json` (machine index)

```json
{
  "schemaVersion": 1,
  "url": "https://www.youtube.com/watch?v=…",
  "title": "…",
  "capturedAt": "2026-07-12T12:30:00Z",
  "backends": ["console-snippet", "native-har"],
  "userAgent": "…",
  "viewport": { "width": 1512, "height": 982, "dpr": 2 },
  "metrics": { "domNodes": 4123, "openShadowRoots": 37, "listeners": 512,
               "stylesheets": 18, "scripts": 44, "networkEntries": 63 },
  "files": [ { "path": "page.html", "layer": "html", "desc": "full page HTML" }, … ],
  "warnings": [ "getEventListeners unavailable — snippet not run in console" ],
  "blindSpots": [ "closed shadow roots (console backend)",
                  "non-DOM EventTargets not discovered by tree walk" ]
}
```

### `README.md` (agent-facing index)

Generated from the manifest. Contains: URL/title/time, which backends ran, a one-line
description of each file, the recorded warnings/blind-spots, a short "start here" pointer
(e.g. "for scraping read `page.html`; for web-component content read `shadow-and-frames.json`;
for behavior read `listeners.json`"), and a **"How to query this bundle"** section — these files
are multi-MB, so the intended access pattern is *query, don't wholesale-read*: `grep`/`cheerio`
for `page.html`, `jq` for the JSON layers.

### `listeners.json` (grouped, not truncated)

Listeners are captured by a **full DOM-tree walk** (all open shadow roots), then **grouped by
event type and identical handler source** so a page with hundreds of nodes stays readable:

```json
{
  "blindSpots": [
    "closed shadow roots are not traversable via the console backend",
    "listeners on non-DOM EventTargets (XHR, WebSocket, AudioContext, custom) are not found by tree walk"
  ],
  "byType": {
    "keydown": [
      { "handlerHash": "a1b2c3",
        "source": "function(e){ if(e.key==='ArrowLeft'){…} }",
        "useCapture": false, "passive": false, "once": false,
        "nodeCount": 2,
        "nodes": ["window", "#movie_player"] }
    ],
    "click": [ { "handlerHash": "…", "nodeCount": 342, "nodes": ["…", "…"], "…": "…" } ]
  },
  "byNode": { "#movie_player": ["keydown", "click"], "…": [] }
}
```

- Nodes are recorded as **CSS-path strings**, never live node references.
- `source` is `handler.toString()` (may be `[native code]` or minified); `handlerHash` groups
  identical handlers so duplicates collapse.

## Capture Workflow (hybrid)

1. **(optional) Arm network** — paste `arm-network.js` first (phase 2), or start recording in
   the DevTools Network panel.
2. **Interact** — scroll, click, go fullscreen, play a round — whatever surfaces the behavior
   (e.g. listeners that only attach after focusing the player).
3. **Dump** — paste `capture.js`; it snapshots point-in-time state and folds in any armed
   network buffer, then downloads `capture.json`. (Optionally also "Save all as HAR" from the
   Network panel.)
4. **Unpack** — `node unpack.js ~/Downloads/capture.json [--har page.har] [-o captures/]`
   explodes it into the bundle directory, fetching external assets Node-side.

## Console-Snippet Backend (`capture.js`) — details

Must be **pasted into the DevTools console** (not injected as a page script): `getEventListeners`
is a console-only Command Line API. If it's absent, record a warning and still produce
everything else. Steps:

1. **Metadata** — `location.href`, `document.title`, timestamp, `navigator.userAgent`, viewport.
2. **Full HTML (serialized once)** — `document.documentElement.outerHTML`, taken a **single time**
   next to the walk to minimise skew; byte count via `TextEncoder` so `htmlBytes` matches the
   written file.
3. **Walk — but emit no node tree** — recursive; descend into `element.shadowRoot` (open) and
   same-origin iframe `contentDocument`. For each open shadow root / same-origin iframe, capture
   its **serialized HTML** into `shadow-and-frames.json` (lossless — the content `page.html`
   can't hold); cross-origin iframes are recorded as boundary notes. The walk exists to generate
   CSS-path locators, discover shadow/iframes, and count nodes — it does **not** emit a redundant,
   lossy node tree (`page.html` already holds the light DOM losslessly; a JSON mirror would drop
   text/comments and double the bundle — validated and removed in Slice 1).
4. **Listeners** — during the walk, `getEventListeners(node)` per node; group per the schema
   above; node refs stored as CSS-path strings.
5. **CSS** — iterate `document.styleSheets`; inline (`<style>`) text via `textContent`; external
   records `href` (Node fetches it in `unpack`); reading `cssRules` cross-origin throws and is
   caught → href-only.
6. **Runtime** — framework detection (React DevTools hook, Vue, Angular, plus site hooks like
   `ytInitialData`/`ytcfg`) and a **safe-serialized** set of selected globals (depth + size
   caps, circular-reference guarded).
7. **Package + deliver** — assemble one JSON object and trigger a Blob download as
   `capture.json`. Download (not clipboard) because HTML alone can be megabytes.

## CDP Backend (`cdp-capture.mjs`) — phase 3, designed-in

Connects to a Chrome started with `--remote-debugging-port` **and a non-default profile**
(Chrome 136+ forbids the default profile). Enables `Page`, `DOM`, `CSS`, `Debugger`, `Network`,
`DOMDebugger` and gathers: full tree incl. **closed** shadow roots (`DOM.getDocument
{pierce:true}`), listeners (`DOMDebugger.getEventListeners`), **all** parsed scripts +
source maps (`Debugger.scriptParsed` / `getScriptSource`), full network incl. WebSocket frames,
and a full-page screenshot (`Page.captureScreenshot`). It writes through the **same
`bundle-writer`**, so output is identical in shape to the console backend.

**Profile handling** (`profile-helper`): either (a) copy the real profile dir and launch CDP
against the copy — an approach Chromium has explicitly declined to close, so it's durable; on
the same machine/OS-user cookies decrypt, though it's a point-in-time copy that goes stale — or
(b) a dedicated debug profile logged into the target sites once and reused. Never the live
default profile.

## Error Handling & Edge Cases

- `getEventListeners` undefined (snippet not run in console) → `warnings` entry; rest still
  produced.
- Cross-origin stylesheet `cssRules` throws → href recorded; `unpack` fetches Node-side.
- Cross-origin iframe → `src` + boundary marker; not descended (security boundary).
- Closed shadow roots → unreachable in console backend; listed in `blindSpots`; CDP fills them.
- Non-DOM `EventTarget`s (XHR/WebSocket/AudioContext/custom) → not found by tree walk; listed in
  `blindSpots`.
- Huge/circular runtime globals → depth + size caps and circular guard in safe-serialize.
- Large HTML → handled by download path, never clipboard.
- All node references serialized as CSS-path strings, never live nodes.

## Testing Strategy

- **`bundle-writer` + `bundle-schema`/`validate-bundle`** — pure Node, TDD-friendly: feed a
  fixture normalized-capture object, assert the exact directory contents and a schema-valid
  `manifest.json`.
- **`unpack.js`** — feed a fixture `capture.json` (+ fixture `.har`), assert the produced bundle
  passes `validate-bundle`; mock external asset fetches.
- **`capture.js` pure helpers** — extract slugify, listener-grouping, safe-serialize, and the
  tree-walk (given a DOM) into testable functions; unit-test with jsdom.
- **`cdp-capture.mjs`** (phase 3) — integration test against headless Chrome for Testing on a
  local fixture page; assert a valid bundle with the CDP-only layers present.

## Incremental Build Approach

We deliberately do **not** write a detailed upfront implementation plan. This tool pokes at live
browser internals (`getEventListeners`, shadow-DOM traversal, real minified pages), and any full
plan would be fiction that reality breaks on first contact. Instead we build **thin vertical
slices**, each producing a usable bundle end-to-end, and **test each slice against a real page**
(the YouTube ArrowLeft spike is the first target — it exercises listeners + shadow DOM, our
hardest layers). We add layers only after the previous slice works on a real page.

The build loop per slice:

1. Write/extend `capture.js` (+ `unpack.js`) for the new layer.
2. User pastes `capture.js` into the DevTools console on a real page and downloads `capture.json`.
3. Run `unpack.js` to produce the bundle; inspect it; note what's wrong or missing.
4. Fix, then move to the next layer.

Rough slice order (a guide, not a contract — expect it to change as we learn):

- **Slice 1 — thin end-to-end (DONE — validated on youtube.com/watch):** `capture.js` (metadata
  + full HTML + lossless shadow/iframe HTML + grouped listeners + light framework detection) →
  `capture.json` → `unpack.js` → bundle dir (`README.md`, `manifest.json`, `page.html`,
  `shadow-and-frames.json`, `listeners.json`, `runtime.json`, `meta/capture.raw.json`). Real-page
  results: `getEventListeners` works from the pasted snippet (3.9k attachments, 0 warnings, no
  hang); grouping is effective (≈3.9k attachments → ≈470 groups, ≈124 distinct handlers);
  `htmlBytes` matches `page.html` exactly; captured 227 KB of open-shadow HTML (`#booster_root`)
  that `page.html` didn't hold. Learnings folded back in: dropped the lossy `dom-tree.json`
  mirror; single HTML serialization; documented live-page "skew". Confirmed YouTube's main UI
  shadow roots are **closed** → motivates the CDP backend.
- **Slice 2 — styles + scripts:** inline captured in-snippet; external `href`/`src` fetched
  Node-side in `unpack.js`; `styles/` + `scripts/` written.
- **Slice 3 — richer runtime + safe-serialize hardening** (depth/size caps, circular guard).
- **Slice 4 — network:** native-HAR fold-in via `unpack.js --har`, then `arm-network.js` for
  forward capture in the snippet.
- **Slice 5 — CDP backend:** `cdp-capture.mjs` + `profile-helper` for closed shadow roots,
  complete sources, coverage, screenshots, and automation — reusing the same bundle writer.

`validate-bundle` (schema check) is introduced alongside Slice 1's format and grows with it.

## Skill Layout

```
.claude/skills/debug-web-pages/
  SKILL.md                       entry point: the debug loop, mode selection, the "starting point not menu" stance
  scripts/
    capture.js                   console snippet (paste in DevTools); + arm-network.js (Slice 4)
    unpack.js                    capture.json → bundle dir; + cdp-capture.mjs / profile-helper (Slice 5)
  knowledge/
    capturing-and-querying.md    CAPTURE mode: capture workflow + how to query each bundle layer
    live-experiments.md          LIVE mode: the recon→intervene→verify probe loop + interception knowledge
    investigation-patterns.md    how to attack each investigation type, blind spots, when stuck
    domains/<page>.md            per-page verified findings (landmarks, handlers, interventions, do's/don'ts)
  DESIGN.md  ROADMAP.md  MAINTAINING.md
```

Captures (output bundles) do NOT live in the skill — `unpack.js` writes them to
`./captures/` in the CWD of the project being investigated (override with `-o`).

## Open Follow-ups (not blocking)

- Whether to also capture computed styles per node (expensive) — deferred; add behind a flag if
  a future scraping task needs it.
- `jq` is not guaranteed to be installed; `knowledge/capturing-and-querying.md` gives a Node fallback.
