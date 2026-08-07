# Reading Engine v1 (web app) — Spec

Synthesized from `brainstorm.md` (all branches closed 2026-07-23). Working name: **Reading Engine**
(real name = deferred A4).

## Goal

Ship phase 1 of the standalone open-source read-aloud product: a web app where a user pastes text or
Markdown and listens to it read by on-device neural TTS (Kokoro-82M timestamped, via HeadTTS) with
word-by-word highlighting, click-any-word seek, and speed control — free, private, no backend.

## Scope

**In scope:**

- `@reading-engine/core` — framework-agnostic TypeScript package, zero DOM/React: pipeline
  (pre-clean → format strip → segment → per-chunk synth → align), playback controller, synthesis
  queue, cache, `SpeechProvider` + `CacheStore` interfaces.
- Thin React web client: editable source input + rendered reading view (mode-based edit/read),
  word-list rendering, highlight painting, transport UI (play/pause, speed, buffering indicator),
  minimal cold-load progress indication.
- Input formats: plain text + Markdown (thin cleaner). User picks the format on paste; file upload
  (.txt/.md) detects from extension. English-only.
- One synthesis provider: HeadTTS in-browser (WebGPU-first, WASM fallback) behind `SpeechProvider`.
- Word-level highlight/seek, model-level speed change, pause/resume, buffering state, cold-seek
  behavior, pre-warm + eager first chunk.
- Persistent content-addressed cache: IndexedDB tier behind `CacheStore`; edit-with-reuse.
- Repo setup: AGPLv3 (whole repo) + CLA bot active from commit #1.

**Out of scope (could be confused as in):**

- Browser extension, desktop app, local daemon, hosted synthesis (phases 2/3 — the interfaces ship,
  the implementations don't).
- Multilingual anything (normalization layer is language-scoped, but only `en` ships).
- PDF ingestion; LaTeX / nested Markdown / HTML / footnotes (v2 formats).
- Block editor (BlockNote/ProseMirror/Lexical) — rejected for v1.
- Parallel chunk synthesis (captured optimization, benchmark-gated).
- Clever cold-start/warmup UX beyond a plain progress indicator (B5, own session).
- Premium/BYO-key voices, donations infra, commercial-license mechanics (E-branch; not code).

## Key decisions (locked in brainstorm.md)

1. **Core/client split (A1):** DOM-free `@reading-engine/core` + thin web client; later clients
   reuse the core unchanged.
2. **Provider (B1/B2):** depend on `@met4citizen/headtts` (npm, version-pinned) wrapped behind our
   `SpeechProvider`; model = `onnx-community/Kokoro-82M-v1.0-ONNX-timestamped`. Vanilla kokoro-js
   rejected (no word timestamps).
3. **Backends (B3/B4):** WebGPU-first, WASM fallback, chosen at runtime; provider interface is the
   swap seam for daemon/hosted later.
4. **Data model (C1):** single source of truth = flat ordered list of rendered source tokens
   `{ id, text, renderAnchor(opaque), audioStart?, audioEnd? }` on one absolute-ms timeline;
   tolerates N↔M; rebuilt on edit.
5. **Format scope (C2):** thin Markdown cleaner; code block → spoken "code block" label + skip
   contents; tables → cell-by-cell, row by row, small pauses; URLs → speak the domain; images →
   alt text; easy syntax stripped in the render layer.
6. **Unknown-token fallback (C2):** meaningful symbol → name from a static table (&→"and",
   @→"at", ©→"copyright"); unpronounceable junk → silent, but keeps a zero-duration alignment
   span; word-shaped unknown → pass to G2P, never letter-spelling.
7. **Pre-clean (C2):** structural pre-clean before segmentation for pasted PDF/web text: join
   intra-paragraph line breaks, de-hyphenate word wraps, collapse whitespace, blank line =
   paragraph break. Garbage in never crashes.
8. **Segmentation (C3):** WE segment (never HeadTTS's splitter): 4-level LOCAL cascade —
   structural hard cut → `Intl.Segmenter` sentence (abbreviation-aware) → clause-split only when
   over threshold → word-count slice for run-ons. Chunk length = target + hard cap; exact numbers
   are benchmark-tuned constants, not design.
9. **One chunk per synthesize call (C4/T1):** never batch chunks in one request — embedding
   changes prosody/duration (700–850 ms shrink measured).
10. **Alignment (C4, Option B):** feed the synthesizer the SOURCE chunk text verbatim; HeadTTS
    returns `words[]` as verbatim source tokens 1:1 (T3-proven) → positional match with trailing
    punctuation stripped; `words.join("") == chunk text` is the sanity check. Our normalizer is a
    TARGETED OVERRIDE layer only (currency / % / symbols / common abbreviations — HeadTTS's known
    TN gaps); overridden spans use the two-join fallback or proportional time distribution.
    Forced alignment is banned.
11. **Highlight policy (C4):** highlight never lags audio — advance to the next word whose start ≥
    clock (≈150 ms early imperceptible, ≈50 ms lag perceptible); stop at lastWordEnd, not clip end
    (8–17 % trailing silence measured).
12. **Playback controller (C5a):** plain TS module (no React) over Web Audio; single clock =
    `audioContext.currentTime`; controller owns clips + timing table, writes `activeWordIndex` via
    an rAF loop; commands down (`play() · pause() · seekToWord(n) · setSpeed(x)`), position/state up
    (`setActiveWord(n)`, `setPlaybackState(s)`); gapless back-to-back clip scheduling;
    `AudioBufferSourceNode.start(0, offsetSec)` for word-offset starts.
13. **Cold regions (C5b):** third state `buffering`; highlight jumps to the clicked word
    immediately; the target chunk jumps to the queue front and look-ahead re-anchors; pending synth
    is dropped, the in-flight chunk completes and is cached (ONNX inference is not abortable).
14. **Speed (C5c):** model-level (Kokoro speed param), re-synth forward from the current word,
    applied immediately via the buffering path; speed is part of the cache key; `playbackRate`
    rejected (pitch shift).
15. **Pause (C5d):** `audioContext.suspend()` / `resume()` — sample-exact, zero bookkeeping; the
    synthesis queue keeps filling while paused.
16. **First audio (C5e):** provider init starts at app load + a dummy synth absorbs WebGPU shader
    compile; on paste, eagerly synthesize the FIRST chunk only; play-before-ready = cold seek to
    word 0.
17. **Queue (C3):** adaptive look-ahead with a bounded buffer (K chunks / N seconds decoded),
    cancellable priority queue; backpressure on slow devices.
18. **Cache (D):** persistent, layered, universal key
    `hash(exact synth-input string + voice + speed + model version)`; v1 ships the IndexedDB tier
    behind `CacheStore { get, set }`; read-through + write-back; store Opus (WebCodecs
    `AudioEncoder`; fallback WASM encoder or Int16 PCM) + per-word timings JSON; LRU by bytes;
    decoded PCM lives only in the look-ahead window.
19. **Editing (C1/D):** reading and editing are mutually exclusive modes; entering edit pauses
    playback; leaving re-renders + re-segments the whole doc, recomputes keys, diffs against the
    cache — unchanged chunks reuse audio + relative timings verbatim, only base offsets shift;
    changed chunks go dirty and synthesize lazily.
20. **License (E3):** AGPLv3 + CLA on the whole repo; CLA bot before any external PR merges.

## Architecture / Technical approach

### Package layout

```
packages/
├─ core/                      @reading-engine/core — zero DOM, zero React
│  ├─ pipeline/
│  │  ├─ preclean.ts          structural pre-clean (line joins, de-hyphenate, whitespace)
│  │  ├─ markdown.ts          thin Markdown cleaner → rendered text + structure marks
│  │  ├─ segment.ts           4-level cascade → Chunk[] (deterministic, local)
│  │  ├─ tokenize.ts          rendered text → SourceToken[] (ids, per-chunk grouping)
│  │  ├─ normalize/           targeted override layer (en-scoped): currency, %, symbols, abbrev
│  │  └─ align.ts             words[] ↔ tokens match; override two-join; zero-duration spans
│  ├─ playback/
│  │  ├─ controller.ts        Web Audio playback controller (states, clock, rAF loop)
│  │  └─ schedule.ts          gapless clip scheduling, offset starts
│  ├─ queue/
│  │  └─ synthQueue.ts        cancellable priority queue + adaptive look-ahead
│  ├─ cache/
│  │  ├─ CacheStore.ts        interface { get(key), set(key, entry) }
│  │  ├─ idb.ts               IndexedDB implementation (v1's only tier)
│  │  └─ codec.ts             Opus encode/decode (WebCodecs; fallbacks)
│  ├─ provider/
│  │  ├─ SpeechProvider.ts    interface (synthesizeChunk, setup, warmup, capabilities)
│  │  └─ headtts.ts           HeadTTS wrapper (webgpu → wasm endpoint priority)
│  └─ engine.ts               public facade: document lifecycle + command surface + events
└─ web/                       React client
   ├─ InputView               editable source (textarea-level), format picker, file upload
   ├─ ReadingView             rendered word list; paints highlight from activeWordIndex
   └─ Transport               play/pause button (shows buffering), speed control, progress
```

### Data flow (read path)

```
   pasted text/markdown
        │
        ▼
 ┌──────────────┐
 │  PRE-CLEAN   │   join wrapped lines, de-hyphenate, collapse whitespace
 └──────────────┘
        │  clean source
        ▼
 ┌──────────────┐
 │   RENDER /   │   markdown stripped for speech; structure marks kept
 │    CLEAN     │   (paragraphs, list items, code blocks, table cells)
 └──────────────┘
        │  rendered text + structure
        ▼
 ┌──────────────┐
 │   SEGMENT    │   4-level cascade → Chunk[] with stable local boundaries
 └──────────────┘
        │  chunks + SourceToken[] per chunk
        ▼
 ┌──────────────┐
 │  SYNTH QUEUE │   look-ahead window; priority; cache read-through
 └──────────────┘
        │  per chunk: cache hit → entry | miss → SpeechProvider.synthesizeChunk
        ▼
 ┌──────────────┐
 │    ALIGN     │   words[] ↔ tokens (1:1 strip-punctuation match; override two-join)
 └──────────────┘
        │  audio + per-token [start,end] relative to chunk
        ▼
 ┌──────────────┐
 │   TIMELINE   │   base offsets = running duration sum → absolute times on tokens
 └──────────────┘
        │
        ▼
   playback controller  ──▶  UI (setActiveWord / setPlaybackState)
```

### Runtime shape

- **Single clock:** every position question is answered by `audioContext.currentTime`; nothing
  else keeps time.
- **Controller states:** `idle → playing ⇄ paused`, plus `buffering` entered from any
  play/seek/speed action that needs a chunk not yet in cache.
- **Memory:** decoded `AudioBuffer`s exist only for the bounded look-ahead window; the cache holds
  encoded Opus + timings; document length never scales RAM.
- **Two-layer chunk data:** (a) content-keyed cacheable artifact = audio + timings relative to
  chunk start; (b) derived layout = base offsets (running sum) recomputed cheaply on any edit.
- **Engine ⇄ client contract:** ordered tokens + opaque render anchors down; `lightWord(id)` /
  state events up; client reports `clickedWord(id)`. No DOM types cross the boundary.

## Requirements

### Input & pipeline

- **R1.** The client offers an editable source input and a rendered reading view; the two are
  mutually exclusive modes. Entering edit mode pauses playback; leaving it re-runs the pipeline
  and re-enables reading.
- **R2.** On paste the user picks Text or Markdown (no auto-detection); `.txt`/`.md` upload picks
  by extension.
- **R3.** Pre-clean runs before segmentation and performs exactly: intra-paragraph line-break
  joining, hyphenated word-wrap repair, whitespace collapse, blank-line = paragraph break.
- **R4.** The Markdown cleaner strips heading/bold/italic/list/blockquote syntax from speech;
  a fenced or indented code block is spoken as the two words "code block" and its contents are
  skipped (rendered view still shows the code; its tokens get zero-duration spans); a table is
  spoken cell-by-cell, row by row, with a `break` pause between cells; a URL is spoken as its
  domain; an image is spoken as its alt text (absent alt → skipped with zero-duration span).
- **R5.** Segmentation is the 4-level cascade (structural cut → sentence → clause-if-over-threshold
  → word-count slice) with all boundaries computed from local text only. Chunk target length and
  hard cap are named constants in one config file, marked benchmark-tunable.
- **R6.** Exactly one chunk is sent per synthesize call. The provider wrapper asserts this.
- **R7.** The override normalizer rewrites ONLY: currency amounts, percentages, the symbol-name
  table, and a common-abbreviation table. Everything else passes through verbatim. The layer is
  keyed by language (`en` only ships) with no English rules outside it.
- **R8.** Alignment: for pass-through chunks, `words[].join("") === chunkText` is checked; on
  match, tokens map positionally with trailing punctuation stripped. On mismatch or for overridden
  spans, the two-join fallback applies; if a span can't line up, its time is distributed
  proportionally. Every on-screen token ends with a `[start,end]` span — silent tokens get
  zero-duration spans. This invariant (every token has a span) is asserted after every chunk.
- **R9.** Desync guards run on every synth result: `len(words)==len(wtimes)==len(wdurations)`,
  monotonic wtimes, no NaN. A failed guard marks the chunk dirty and logs; it never crashes
  playback.

### Playback & interaction

- **R10.** The playback controller is plain TS with no React imports; the UI never computes
  timing. `activeWordIndex` is written only by the controller.
- **R11.** Highlight advance rule (locked in C4): never strict interval containment — on each
  animation frame the highlight advances to the next word whose `start ≥ currentTime`, so it may
  run ~150 ms ahead but never behind the audio; it halts at the final word's end, not at the
  clip's end (trailing silence).
- **R12.** Consecutive clips are scheduled back-to-back on the audio clock with no audible gap
  while the look-ahead holds them.
- **R13.** Clicking any rendered word seeks to it: highlight moves to it on the same frame; warm
  chunk → audio starts at its offset via `start(0, offsetSec)`; cold chunk → state `buffering`,
  chunk jumps to queue front, look-ahead re-anchors, playback auto-starts on arrival.
- **R14.** On any seek/speed re-target: queued-not-started synthesis is dropped immediately; an
  in-flight inference completes and its result is written to cache.
- **R15.** Speed control synthesizes at the model level (HeadTTS setup speed), re-synthesizing
  forward from the current word, applied immediately through the buffering path. Speed is in the
  cache key.
- **R16.** Pause = `audioContext.suspend()`, resume = `audioContext.resume()`. The synthesis
  queue keeps filling its look-ahead while paused.
- **R17.** Provider init (worker + model load) starts at app load, followed by a discarded dummy
  synth; pasting text triggers segmentation plus eager synthesis of chunk 1 only; pressing play
  before readiness behaves as a cold seek to word 0.
- **R18.** The controller exposes exactly: `play()`, `pause()`, `seekToWord(id)`, `setSpeed(x)`
  down; `setActiveWord(id)`, `setPlaybackState('idle'|'playing'|'paused'|'buffering')` up.

### Cache

- **R19.** Cache key = SHA-256 of (exact synth-input string, voice, speed, model version). Lookup
  precedes every synthesis; results write back on arrival.
- **R20.** The IndexedDB store persists entries as encoded Opus + timings JSON; eviction is LRU by
  total bytes against a tunable cap; entries with a different model version are never returned.
- **R21.** Audio encode uses WebCodecs `AudioEncoder` where available; otherwise a WASM Opus
  encoder; otherwise Int16 PCM storage. The choice is behind `cache/codec.ts` and invisible to
  callers.
- **R22.** After an edit: full re-render + re-segment, recompute all keys, diff; unchanged keys
  reuse audio + relative timings with only base offsets recomputed; changed keys go dirty and
  synthesize lazily (on approach or seek).

### Client & repo

- **R23.** The reading view renders tokens as spans keyed by token id; the highlight style follows
  `activeWordIndex`; the transport shows a distinct buffering indication and a speed control.
- **R24.** Cold model load shows a plain determinate-if-possible progress indicator (no further
  warmup UX — B5).
- **R25.** Repo ships AGPLv3 license, CLA (off-the-shelf Apache-style ICLA + CLA-assistant bot)
  active from commit #1; the HeadTTS dependency version is pinned exactly.

## Success criteria

1. Paste a multi-paragraph article, press play → speech starts; on a real-GPU machine with a warm
   model, first audio ≤ ~1 s (verified by the pre-v1 TTFA benchmark — the deferred gate).
2. The highlight visibly tracks word-by-word and is never behind the voice on a 10-minute read.
3. Clicking any word — including far-ahead cold regions — starts playback at that word; cold
   clicks show buffering and start unaided; the highlight lands on the clicked word instantly.
4. Changing speed mid-read takes effect within ~1 s (warm) at correct pitch; returning to a
   previously-used speed over heard text requires zero new synthesis (cache hits observable).
5. Editing one paragraph of a 10-paragraph document re-synthesizes only that paragraph's chunks
   (cache hit/miss counts observable in dev tooling); playback position elsewhere is not reset.
6. Reloading the page and replaying the same document produces zero synthesis calls for unchanged
   chunks (IndexedDB persistence works).
7. A Markdown document with code blocks and tables reads without speaking any syntax characters;
   code blocks are announced and skipped; highlight/seek still work across them.
8. Pasting mangled PDF text (hard line wraps, hyphenation) reads as continuous prose.
9. The desync guards (R9) and the every-token-has-a-span invariant (R8) pass across the test
   corpus (reuse + extend the tts-lab T2/T3 corpus).
10. `@reading-engine/core` builds and its tests run with no DOM/React present (Node environment).

## Open questions / deferred

- **Chunk target/cap numbers + cache byte caps + look-ahead K/N** — benchmark-tuned; needs the
  real-hardware TTFA benchmark (also the gate for success criterion 1). Deferred until the
  benchmark exists; constants land in one config file (R5).
- **B5 cold-start/warmup UX** — own session; v1 ships only R24's plain indicator.
- **A4 product name** — "Reading Engine" is a working name; blocks branding, not code.
- **"$5" spoken-form verification + typed-items override path** — cheap tts-lab listen/test;
  decides whether some overrides can use HeadTTS `speech{value,subtitles}` items instead of the
  two-join (would keep 1:1 even for rewritten spans). Non-blocking: the override layer works
  either way.
- **Parallel chunk synthesis** — deferred optimization; only after benchmarks prove a win on
  multi-core WASM machines; never default-on.
- **Hosted shared-cache privacy call** — before hosted ships (phase 3).
- **v2 formats** — LaTeX, nested structures, HTML, footnotes.
- **Assumptions being carried** (from brainstorm `## Assumptions`): external TTFA numbers,
  HeadTTS verbatim-`words[]` contract stability, clause-seam prosody, in-browser Opus encoding
  availability — each with a recorded fallback.
