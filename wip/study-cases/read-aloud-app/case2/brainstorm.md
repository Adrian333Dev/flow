# Reading Engine (standalone Read-Aloud product) — Brainstorm

Standalone, open-source alternative to Microsoft Edge's Read Aloud. Extracted from
the Delapse voiceover feature into its own product. Three phases: (1) web app where
users paste/upload text and get streamed, word-highlighted voiceover; (2) browser
extension to read any selected text on any page; (3) desktop/tool integrations.
Delapse becomes one downstream client later, not the driver.

## Session resume pointer (last updated 2026-07-21)

**Where we are:** branches A (product), E (business), B (architecture) resolved. In branch C (reading
pipeline). **C1 (data model), C2 (format scope + normalization), C3 (segmentation + orchestration) all
RESOLVED.** Remaining in C: C4 (runtime word alignment), C5 (playback/interaction controller), then
branch D (caching — mostly designed already, needs formal close). Engine is **English-only**
(HeadTTS/Kokoro) → multilingual out of scope for v1. Deferred within otherwise-done branches: B5
(warmup UX), A4 (name).

**IMMEDIATE NEXT STEP:** **C3 is RESOLVED** — all three decisions locked 2026-07-21 (see "Branch C3 —
the chunker + streaming orchestration — DECISIONS LOCKED" block below): (1) 4-level LOCAL boundary
cascade (structural → sentence → clause-if-long → run-on word-count fallback); (2) chunk length =
target + hard cap, exact number benchmark-tuned; (3) adaptive look-ahead + cancellable priority queue
(seek jumps its target chunk to the front). Key reframe: chunk size ≠ seek granularity (seek is
word-level via in-chunk wtime offset), so short chunks are only for TTFA / edit blast-radius / seek-miss
latency. **C4 (runtime word alignment) — RESOLVED 2026-07-22, all 3 tests PASS** (harness + report in
`real-aloud-app/tts-lab/`: `REPORT.md` + `artifacts/`). Confirmed: synth is deterministic → the simple cache
`hash(chunk text+voice+speed+model)→audio+times` is SAFE (T1, byte-identical), reuse incl. duplicate
sentences; NO cross-chunk desync (T2). Two new facts from the tests: (a) **exactly one chunk per
`/v1/synthesize` call — never batch** (embedding shortens prosody 700–850 ms; hardens C3's
splitSentences:false); (b) **`words[]` returns VERBATIM SOURCE tokens timestamped 1:1** ("$5 " not "five
dollars"), so the two-join mapping collapses to a trivial source↔words[] match — falsifies the old "returned
words are spoken tokens / provenance lost" assumption. **Option B LOCKED (2026-07-22): feed SOURCE text by
default (alignment 1:1, free); our normalizer scoped to a targeted override for HeadTTS's TN gaps
(currency/symbols/abbrev). C2/C4 reconciled. NEXT = C5.** C5 (playback/interaction
controller) inherits the runtime highlight policy (never lag audio; advance to next word whose start ≥
currentTime; ~150ms-ahead OK, ~50ms lag perceptible). (Note: memory is retired — all standing rules +
the research tool-choice now live in the repo root `CLAUDE.md`, not memory.)

**Also (2026-07-21, this session):** full pipeline architecture visualized + saved to
`visualizations/2026-07-21-full-architecture.md` (7 diagrams). Clarified for the user: HeadTTS's real
role (ONE station = per-segment synth + word timings; non-GPL phonemization + timestamp-decoding are
the hard, load-bearing parts), what SpeechProvider is (our swap-seam interface), and the core↔client
id-handshake (core→client "light word #id" for highlight; client→core "clicked #id" for seek). NEW
design captured below: **incremental edit-reuse via content-addressed segment cache** (reuse unchanged
segments, re-synth changed ones lazily, never reset playback) — PROPOSED, opens Branch D, and pins C3
to ONE deterministic/local/uniformly-short segmenter for cache-key stability. The two C2 decisions are
STILL unanswered (Decision 1 = markdown cleaner in v1; Decision 2 = unknown-symbol fallback).

**Resolved:** A1 engine-core + thin client · A2 universal (no segment positioning) · A3 wedge =
unoccupied intersection (neural quality + word-level highlight + click-seek + free-forever + OSS +
private + universal) · E1 copyleft+CLA+commercial-license (not MIT) · E2 revenue = commercial
embedding license (primary) + premium/BYO-key voices (add-on) + donations/corporate sponsors +
brand-protect name/logo · E3 **AGPLv3 + CLA on whole repo** · B1 **HeadTTS behind our
`SpeechProvider` interface** (fork approved) · B2 timestamps via **timestamped Kokoro model through
HeadTTS**, NOT vanilla kokoro-js · B3 **WebGPU-first + WASM fallback** (warm TTFA ~300–750ms on real
GPUs) · B4 **in-browser default + optional local daemon (preferred when present) + hosted**, all via
the provider interface.

**Deferred / own session:** B5 smooth cold-start/warmup UX (7–18s first model load — user wants a
clever solution) · A4 product name · real-hardware/low-spec TTFA benchmark before v1.

**Locked constraints:** free-forever core; on-device by default; ~1s first-audio target (achievable
on GPU via pre-warm + short first chunk; integrated-GPU/WASM tail covered by cache/daemon/hosted);
CLA bot from commit #1; use off-the-shelf CLA templates; lawyer review before first commercial deal.

**Key external deps:** `@met4citizen/headtts` (MIT — audio + `words/wtimes/wdurations` + phonemes +
ignorable visemes; WebGPU/WASM in Web Worker; also a Node WS/REST server = the daemon) ·
`onnx-community/Kokoro-82M-v1.0-ONNX-timestamped` (Apache-2.0). Product model inspiration: Handy
(`github.com/cjpais/Handy`). Delapse = future downstream client, not the driver. **HeadTTS is cloned
locally at `real-aloud-app/refs/HeadTTS`** — read `modules/headtts.mjs` + README; API facts recorded
in the "HeadTTS API facts" section below (they reshape branch C).

---

## Decision Tree

Walk order (per user, 2026-07-20): resolve **product + business first (A, E), then technical (B, C, D)**.

```
[ ] A — Product definition, positioning & name
    [x] A1 — Architecture framing: engine-core + thin web client, flagship web app,
             platform-factoring WITHOUT platform-servers (agreed)
    [x] A2 — Audience: UNIVERSAL read-aloud, NO segment positioning (resolved)
    [x] A3 — Differentiation/wedge: the unoccupied market intersection (resolved);
             standout-feature menu deferred to scope decision
    [ ] A4 — Product name & identity (deferred)
[x] E — Business strategy (RESOLVED)
    [x] E1 — Open source model: copyleft + CLA + commercial license (NOT MIT / not max-forkable)
    [x] E2 — Revenue: commercial embedding license (primary) + premium/BYO-key voices (add-on)
             + donations/corporate sponsors; brand-protect name/logo/icon (Handy trick)
    [x] E3 — License: AGPLv3 + CLA on the whole repo (user approved)
[ ] B — Architecture & where speech synthesis runs (core resolved; B5 deferred)
    [x] B1 — Provider interface + v1 provider = HeadTTS wrapped behind `SpeechProvider` (fork OK)
    [x] B2 — Word-timestamp strategy: timestamped Kokoro model via HeadTTS, NOT vanilla kokoro-js
    [x] B3 — WebGPU-first + WASM fallback; TTFA ~300–750ms warm on real GPUs (characterized)
    [x] B4 — Run in-browser AND local daemon AND hosted, chosen at runtime via provider interface:
             in-browser = zero-install default; daemon = optional native upgrade (preferred when
             present, fixes per-profile duplication + warmup + speed); hosted = any-device/mobile
    [ ] B5 — Smooth cold-start/warmup UX (7–18s first load) — DEFERRED to its own session
[ ] C — Reading pipeline: ingest → normalize → segment → streaming synth → sync → seek
    [x] C1 — Content/timeline data model: on-screen word list = single source of truth; tolerates N↔M;
             rebuilt on edit (two surfaces: editable input + rendered view); DOM-free core (RESOLVED)
    [ ] C2 — Format scope + normalization (RESEARCH-GATED): (i) text-only vs markdown for v1;
             (ii) normalization rules (numbers/currency/symbols/abbrev/punctuation). English-only engine
    [x] C3 — Segmentation & streaming orchestration (RESOLVED 2026-07-21): 4-level LOCAL boundary
             cascade (structural → sentence → clause-if-long → word-count run-on fallback); chunk size
             ≠ seek granularity (seek is word-level via in-chunk wtime offset); we own segmentation
             (splitSentences:false); segment-then-normalize-per-chunk; adaptive look-ahead + cancellable
             priority queue (seek jumps front); length = target+cap, exact number benchmark-tuned
    [x] C4 — Runtime word alignment (RESOLVED 2026-07-22, all 3 tests PASS): timestamp-based, never
             forced-align; simple cache hash(chunk text+voice+speed+model)→audio+times CONFIRMED safe (T1
             byte-identical); one chunk per synth call (T1 context constraint); no desync (T2); words[]
             returns SOURCE tokens 1:1 (T3) → mapping simplifies to source↔words[] match. Pass-through-by-
             default LOCKED (Option B, 2026-07-22); normalizer = targeted override for TN gaps. See "TESTS
             RUN — RESULTS (2026-07-22)" block.
    [ ] C5 — Playback & interaction controller: transport (play/pause/resume/speed), rAF highlight
             loop, click-to-seek incl. into not-yet-synthesized regions, pre-warm / first-audio behavior
[ ] D — Caching & indexing: content-addressed reuse; read-ahead prefetch
```

## Working notes (carry into technical phase B)

- **Model correction:** the tested model in `test-kokoro.js` (`onnx-community/Kokoro-82M-ONNX`)
  is the **non-timestamped** build. The product MUST use the **timestamped** Kokoro build
  (voiceover spec references `Kokoro-82M-v1.0-ONNX-timestamped`) — word timestamps are load-bearing
  for highlighting/seek. Verify exact repo + JS API for timestamps in phase B.
- **Local daemon (new, from user):** phase 1 web app runs Kokoro in-browser (WASM). For
  phase 2/3 (extension/desktop) there's a notion of a **native local daemon** running TTS
  faster than WASM, with a **hosted synthesis service** as a fallback for users who won't
  install it. The daemon is intentionally *small/lightweight*. Revisit in phase B — affects
  the "where TTS runs" decision and the hosted-service monetization leg.
- **Treat prior research as incomplete.** The `voiceover-feature/` brainstorm+spec and the referenced
  research files have known gaps/errors. Re-verify all technical claims (offscreen/worker constraints,
  timestamp API, latency) in phase B before committing.

## HeadTTS API facts (local clone at `refs/HeadTTS` — load-bearing for branch C)

Read `modules/headtts.mjs` (the in-browser client class we'll wrap behind `SpeechProvider`) + README.
Findings that reshape branch C:

1. **HeadTTS already does chunking + ordered streaming.** `synthesize({input})` runs `divideToParts()`,
   which splits a long string on sentence dividers `". " / "! " / "? "` AND caps each chunk at `splitLength`
   (default 500 chars, breaking at the last space when a sentence exceeds it). Each chunk becomes its own
   queued message; `onmessage` fires one `audio` message per chunk **in order** — a FIFO OUT queue guarantees
   part N is emitted before N+1 even if the worker finishes them out of order. Each message carries
   `metaData: {part, partsTotal}`. ⇒ We do NOT build streaming from scratch; HeadTTS delivers per-chunk,
   in-order audio. Our job is the content model, normalization, alignment, playback, and *controlling* how
   the text is chunked.

2. **`audio` message shape** (`data`): `words[]` (spoken word strings, e.g. `["This ","is ","an ","example."]`),
   `wtimes[]` (word start, ms), `wdurations[]` (word duration, ms) — **per-chunk, relative to that chunk's
   start** — plus `phonemes/visemes/vtimes/vdurations` (visemes ignorable for us). For `wav` encoding the
   client calls `audioCtx.decodeAudioData()` internally, so `data.audio` arrives as a **decoded AudioBuffer**.
   HeadTTS does NOT play audio — queueing AudioBufferSourceNodes, the rAF highlight loop, and seek are OUR
   job (matches the vision: playback/highlighting are our system).

3. **`words` are the SOURCE tokens, timestamped — CORRECTED by the C4/T3 test (2026-07-22).** Earlier we
   thought `words` were post-G2P *spoken* tokens with source provenance lost; the test DISPROVED it. Fed the
   source text, HeadTTS returns the VERBATIM SOURCE tokens ("$5 ", "1999.", "Dr. "), each timestamped to where
   its expansion is spoken — so for pass-through text (Option B) source↔time is **1:1 and essentially free from
   `words`** (just strip trailing punctuation). The **N↔M** case (one source token → several spoken words) only
   arises for tokens WE rewrite in the override layer; C1's model tolerates it and C4's two-join handles it as
   the fallback. (The old voiceover spec's real gap was assuming timestamps came free from vanilla kokoro-js,
   which they don't — see B1.)

4. **Rich input item types = HeadTTS's normalization vocabulary.** `input` may be a string OR an array of
   items: `text`, `speech {value,subtitles}` (spoken ≠ shown), `phonetic`, `characters`, `number`, `date`,
   `time`, `break {value:ms}`. The `subtitles` field is decisive for us — it lets the SHOWN text differ from
   the SPOKEN text, a hook to keep source provenance while controlling pronunciation. But HeadTTS does NOT
   parse markdown/HTML; markdown/plain-text normalization is entirely OUR pipeline (C2).

5. **`splitLength` capped at 500; no "short first chunk" option.** For a ~1s TTFA we must control
   segmentation ourselves (feed a deliberately short first unit), which also preserves the source-position
   provenance HeadTTS's internal splitter would otherwise hide. ⇒ Likely: WE segment and feed pre-split units
   (with `splitSentences:false`), rather than hand HeadTTS a raw blob. (Decide in C3.)

6. **One client, three transports, identical output.** The same class talks to a `webgpu`/`wasm` worker, a
   `ws://` daemon, or an `http` REST server (auto-fallback in `endpoints` priority order), all producing the
   same `audio` message shape. ⇒ Confirms B4: our `SpeechProvider` can be a thin wrapper over one configured
   HeadTTS client; provider swap = endpoint config. Stateful `setup()` carries voice/language/speed/encoding.

7. **`speed` is applied at synthesis** (range 0.25–4), baked into both audio and timings. Runtime speed change
   = re-`setup()` + (re)synthesize, OR play at `AudioBufferSourceNode.playbackRate` and scale timings
   ourselves. (Decide in C5.)

<!-- Decision sections appended below as branches resolve -->

## Branch C: Reading pipeline (IN PROGRESS — walking C1)

**Diagrams (text-based — prior `diagrams/*.svg` were DELETED by user):**
- `visualizations/2026-07-21-full-architecture.md` — the seven-part set: (1) system context /
  core↔client id-handshake · (2) end-to-end pipeline · (3) inside-one-chunk (N↔M) · (4) data
  model/timeline · (5) streaming conveyor · (6) SpeechProvider/where-voice-runs · (7) incremental
  edit-reuse (content-addressed segment cache). Each carries its input + design reasoning +
  self-critique (kept for a later visualization study-case pass).

**Confirmed UX inputs (user, 2026-07-20) — feed the C decisions:**
- We synthesize the **rendered** text, not the raw input. The rendered document is the reading surface.
- **User picks the input format** (Text vs Markdown) on paste; on file upload we detect from the extension.
  This sidesteps format auto-detection entirely.
- **Two surfaces, editable (user correction — NOT render-once-read-only):** the app has both an **editable
  source input** and a **rendered reading view**. The user can go back to the input and edit; editing
  re-runs the pipeline and rebuilds the word list. (The C1 model is unaffected — an edit just yields a new
  list; branch-D cache keeps unchanged spans instant.)
- User pushed back that C1 felt over-engineered; agreed the alignment concern is real but its SIZE is a
  function of how much we normalize — light normalization ⇒ mostly 1:1. Model must merely *tolerate* N↔M.
- User flagged the hard markdown constructs to handle separately: **code blocks** (all competitors mangle
  them — needs a clever policy, maybe not fully solvable) and **tables**; floated starting **text-only**.
  → These are C2/C3 scope decisions (format scope + normalization rules), taken up next.

### Branch C1: Content/timeline data model (RESOLVED)

**Decision:** The engine's single source of truth is a flat, ordered **list of the on-screen (rendered)
words** — "source tokens." Each carries a stable id, its surface text, an opaque **render anchor** the
client supplies (client maps id → DOM span; core never touches the DOM), and — once synthesized —
`audioStart`/`audioEnd` on one absolute-ms timeline. Both highlighting and seeking are lookups over this one
list: highlight = binary-search for the token whose [start,end] contains `audioContext.currentTime`, tell
the client to light that id; seek = client reports clicked id → jump audio to its audioStart. This is the
vision's "reading unit" made concrete and DOM-free (per the A1 core/client split).

**Tolerates N↔M (not 1:1):** where normalization rewrites text (e.g. "$5"→"five dollars"), one source token
can own a time span covering several spoken words; the model allows a source token's [start,end] to span
multiple HeadTTS `words`. How that mapping is computed is C4; C1 only requires it be representable.
(Update 2026-07-22: with Option B pass-through the common case is 1:1 — one source token ↔ one HeadTTS word;
N↔M is now only the override-layer exception. The model must still *represent* N↔M, so this stays unchanged.)

**Editing refinement (user correction):** NOT a one-time read-only render. The web app has TWO surfaces — an
**editable source input** and the **rendered reading view**. Editing the input re-runs the pipeline and
**rebuilds the word list** (cheap; branch-D cache makes unchanged spans instant). The
word-list-as-source-of-truth is unaffected — an edit just produces a new list. ("Render once" was wrong;
"rebuild on edit" is right.)

**Rejected:** (a) audio-timeline-primary (treat HeadTTS `words`+times as truth, fuzzy-match to DOM) —
desyncs on any normalization, no stable seek target; (b) segment-only (no word tokens) — kills word-level
highlight + word-click seek (hard requirements); (c) re-derive the mapping by string-match each frame —
expensive + fragile.

## Branch C2: Format scope + normalization — RESOLVED (2026-07-21; decisions locked below)

Two parts: **(i) format scope** (text-only vs markdown for v1) and **(ii) normalization rules** (numbers,
currency, symbols, abbreviations, punctuation…). Both raised by user; normalization to be backed by
**external research before concluding** (user request, 2026-07-20). Not yet decided.

**What HeadTTS's en-us module actually normalizes (read `modules/language-en-us.mjs`) — load-bearing:**
- DOES handle in `partSetText` (case "text"), BEFORE G2P: integers, decimals ("POINT"), negatives ("MINUS"),
  thousand-separated numbers, **years** (1000–2000 & 2010–3000 read as two pairs), **ordinals** (1st→FIRST),
  **decades** (1970s→NINETEEN SEVENTIES), phone/zip/area digit-by-digit heuristics, mixed alphanumerics
  (3D→"three D"). Full number-word machinery.
- Typed input items get dedicated handling: `number`, `date`, `time`, `characters` (spelled out via a
  char→phoneme table that DOES include `$`→"dollar", digits, letters), `speech`/`phonetic` (spoken≠shown via
  `subtitles`).
- **Gaps (NOT handled in plain text): currency/symbol expansion is an explicit `// TODO: Implement`** —
  `this.symbols`/`symbolsReg` ($,€,%,&,+) are defined but NEVER applied in the text path. ⇒ **raw "$5" in
  text → "5" becomes "FIVE" and "$" is dropped → reads "five", not "five dollars."** Also unhandled:
  abbreviations (Dr./St.), acronyms, %, math/units, URLs/emails, ranges, fractions, roman numerals; and the
  heuristics are context-blind (year vs quantity, St.=Saint/Street, 1/2).
- **Answer to "can the model just handle $5?": partly — numbers yes, currency/symbols no.** So we can't
  assume the engine normalizes correctly; options: (a) improve/contribute HeadTTS's normalizer, (b) add our
  own normalization layer in front, or (c) drive HeadTTS with **typed items** where we detect structure.

**Architectural catch — RESOLVED by the C4 tests (2026-07-22); the earlier claim was WRONG.** We had assumed
HeadTTS's returned `words` were already-expanded spoken tokens with the source→spoken link lost. The T3 test
DISPROVED this: fed raw source text, `words[]` comes back as the VERBATIM SOURCE tokens ("$5 ", "1999.",
"Dr. "), each timestamped to where its expansion is spoken; `words.join("")` == source; alignment is 1:1.
⇒ **DECISION (Option B, user, 2026-07-22): feed HeadTTS the SOURCE chunk text verbatim by default** and take
its source-aligned `words`/`wtimes` directly (trivial punctuation-stripped source↔words match — no provenance
tracking, no two-join). Our own normalization is RETAINED but **scoped to a targeted override layer** for the
gaps HeadTTS's plain-text path gets wrong (currency/symbols/abbrev, above): where we rewrite a token we lose
1:1 for it and fall back to C4's two-join / proportional split. NET: "we normalize everything" → "we normalize
ONLY the gaps; everything else passes through 1:1." **CAVEAT to verify (cheap, non-blocking):** the T3 report
inferred the audio speaks "$5"→"five dollars", but headless it could NOT listen, and the source-read above
says currency is an unimplemented TODO (raw "$5" likely reads "five", dropping "$"). So currency/symbol/abbrev
sit firmly in the override bucket — confirm later with the tts-lab harness (listen, or send a typed
`speech`/`characters` item). Does NOT block C5.

**Multilingual:** HeadTTS/Kokoro is **English-only today** (en-us; the "fi" module is explicitly unsupported
by the model). Text normalization is inherently per-language (number words, currency placement, decimal
separators, date formats). ⇒ v1 English-only, multilingual normalization **out of scope for v1**, but the
normalization layer must be **language-scoped** from the start (no English assumptions baked in globally).

**Research to run before concluding C2 (planned):** (1) the standard non-standard-word / text-normalization
taxonomy + how modern TTS front-ends structure TN; (2) how Kokoro/Misaki G2P handles TN and what it misses;
(3) how competitors (Speechify, NaturalReader, Edge/Read Aloud, ElevenReader) handle numbers/currency/
abbreviations; (4) existing JS/TS normalization libraries to reuse vs build; (5) how much normalization is
"enough" for a decent read (diminishing returns). Then decide (i) format scope and (ii) normalization depth.

**Local competitor sources on disk (user downloaded, 2026-07-21) — highest-signal, an external LLM can't see these:**
- `refs/speecify/` — **Speechify** extension (closest to our target UX). MV3, sidepanel + content + offscreen +
  pdf-viewer bundles (minified). Cloud TTS ⇒ source likely reveals CLIENT-side chunking + word-highlighting
  mechanism, but NOT normalization (server-side). Read for: how they segment, how they drive highlight/seek.
- `refs/tts-reader/` — **TTS Reader** extension (deliberately simpler; user says NOT our target — no
  word-by-word highlight, unimpressive UI). Contrast case: background.js/contentScript.js/PDFViewer.js.
- Edge "Read Aloud" is not open source → cover via web research (uses word-boundary events + Azure voices).

**Research EXECUTION plan (detailed prompts written 2026-07-21, in `research/`):** research is farmed to
SEPARATE runners so raw findings never bloat this brainstorm's context; each returns a tight report file.
- `research/PROMPT-local-session.md` → paste into a **fresh local Claude Code session**; it tears down the
  local sources (`refs/speecify` Speechify, `refs/tts-reader` TTS Reader, `refs/HeadTTS`) + does the JS/TS
  library survey via web + writes `research/REPORT-local-teardown.md`. (Only a local session can read `refs/`.)
- `research/PROMPT-external-A-normalization.md` → **web-enabled external LLM**; NSW taxonomy · per-category
  rules+ambiguities · "minimum viable TN" tiers · graceful-fallback policy · SSML relevance.
- `research/PROMPT-external-B-competitors.md` → **web-enabled external LLM**; teardown of Edge Read Aloud /
  Speechify / NaturalReader / ElevenReader / Kokoro-Misaki — highlighting-sync mechanism, chunking, TN,
  code/table/URL handling.
- User plans to run MULTIPLE runners in parallel (intentional cross-check overlap is fine). External reports
  get pasted back / saved as `research/REPORT-external-A.md` / `-B.md`; agent then reads all reports and
  synthesizes into the C2 decision (i) format scope + (ii) normalization depth.

**RESEARCH COMPLETE + EVALUATED + FINALIZED (2026-07-21).** All three reports delivered and still live in
`research/`: `PROMPT-external-A-normalization.md` (4 model responses inline), `PROMPT-external-B-competitors.md`
(4 inline — Claude's was later re-run to a COMPLETE, reference-quality ~960-line artifact), `REPORT-local-teardown.md`
(our own source teardown). Evaluation was done via the research-evaluation skill; that skill + its logs are now
being RETIRED/DELETED (decision made — enough data gathered). The one durable takeaway (which external LLM to
trust for research) is saved to persistent memory `research-llm-tool-choice`: **Claude w/ web search = primary**,
ChatGPT Deep Research = calibrated backup, DeepSeek citations = suspect (Expert fabricated the Misaki repo org),
Gemini = avoid. Load-bearing sources for C2 = Claude's A + B artifacts; do NOT quote DeepSeek's citations.

**Convergent findings (high confidence — cross-checked across models + our own source read):**
1. Do TN in OUR layer, before HeadTTS, preserving provenance (unanimous; matches prior lean).
2. **Tier-1 minimum-viable TN** = currency + percent + a small common-abbreviation table + symbol-name table
   + Markdown-syntax stripping; PLUS mirror the numbers/ordinals/decades HeadTTS already does so provenance is
   ours. New code ≈ small (local report: ~160 lines). Reuse `n2words` (MIT) for number/currency words,
   `chrono-node` for dates (T2), `Intl.Segmenter` for sentences (already used by HeadTTS).
3. **Run TN on the RENDERED text, not raw Markdown** — strip Markdown in the render layer (matches our C1
   "synthesize rendered text"). Kills the #1 competitor complaint (reading `**`/`#` aloud) by construction.
4. **Graceful fallback (recommended, from Claude-A + NVDA precedent):** meaningful symbol → speak its name
   (static table); pure decoration/unknown non-word → **drop from AUDIO but keep a zero-duration alignment
   span** (preserves highlight/seek invariant — every on-screen token maps to *some* audio position);
   unknown word-shaped token → pass to G2P, do NOT spell letter-by-letter. (ChatGPT/DeepSeek argued spell-out;
   rejected as worse for a reading app.)
5. **Format scope v1:** plain text native + a thin (~50-line) Markdown pre-processor (headings/bold/italic/
   lists/blockquote stripped; code block → spoken "code block" label; tables → cells row-by-row with pauses;
   URLs → domain or skip; images → alt text). Defer LaTeX/nested/HTML/footnotes to v2.
6. **Timestamps — our approach CONFIRMED (completed Claude-B report).** Reports that said "Kokoro has NO
   timestamps → must forced-align" were describing the vanilla JS/WebGPU port; the timestamped ONNX build via
   HeadTTS (our path) exposes real per-word `wtimes` — same class of signal as Edge's `WordBoundary`. Claude-B
   adds decision-grade backing for C4: **never use forced-alignment** — an academic ebook-sync study found even a
   purpose-built aligner misses the acceptable-drift window on 30%+ of sentences (Whisper-align: only 6.6% OK).
   Use synthesis-time timestamps only.
7. **C4 gotchas to design for (new, from Claude-B):** (a) human drift tolerance is asymmetric — a highlight
   ~150ms *ahead* of audio is tolerable, but even ~50ms *lag* is perceptible → target: never let highlight lag
   audio; (b) timestamp emission can silently desync from audio at the TN/segmentation layer (documented
   `Kokoro-FastAPI` `---` bug dropped a whole sentence's timestamps while audio played fine) → C4 needs its OWN
   test suite independent of "does the audio sound right," and our TN/chunk offsets must carry through to the
   timing output; (c) budget for leading/trailing silence (first/last word won't span the full clip) and
   inter-word gaps — advance the highlighter to the next word whose start ≥ currentTime rather than strict
   interval containment (Speechify's own documented pattern).
8. Confirms our differentiation: code/tables/URLs are a universal competitor failure; word-level click-to-seek
   is rare (Edge lacks it — likely because re-buffering a remote stream makes mid-stream seek hard; Voice Dream
   Reader, the one on-device-voice product, DOES ship "double-tap a word to read from there," supporting that our
   on-device architecture is what makes true word-seek feasible). Edge's highlight = Azure `WordBoundary` events
   (our equivalent = HeadTTS wtimes).

**Two genuine open decisions for the user (C2 not yet locked):** (a) **markdown-in-v1 vs pure-text-first** —
agent recommends the thin markdown pre-processor IN for v1 (cheap, high value); (b) **fallback for unknown
tokens** — agent recommends drop-with-zero-duration-span + G2P-passthrough over spell-out.

**⚠️ ON RESUME — THE USER HAS NOT READ ANY OF THE REPORTS.** Do NOT mention "report A/B", model names, or the
eval; do NOT assume prior reading. Prior explanation was too complex and wrongly assumed the user had read the
research — user was frustrated by this. On resume: explain the C2 proposal in PLAIN language (below), then get
the two decisions. Keep it simple and concrete.

**PLAIN-LANGUAGE C2 PROPOSAL (use this wording with the user):**
- What "normalization" means: turning written text into how you SAY it out loud. `$5` → "five dollars",
  `50%` → "fifty percent", `Dr.` → "Doctor". We add a small step that does this *before* the voice speaks,
  because our voice engine doesn't handle currency/symbols on its own, and we need to remember which spoken
  words came from which on-screen words (so highlighting + click-to-jump line up).
- The research (both outside research and reading real competitors' code) all pointed the same way, so most of
  this is settled. Only TWO things actually need the user's decision:

  **DECISION 1 — What can a user paste in version 1?**
  - Option A: plain text only. Simplest. Downside: if someone pastes Markdown, symbols like `#` and `**` and
    code blocks get read out loud and sound broken.
  - Option B (recommended): plain text **plus** a tiny "Markdown cleaner" — it strips `#`/`**`, says
    "code block" instead of reading code aloud, reads tables one row at a time, and for links reads just the
    text/domain. Costs ~a day. This is exactly the thing every competitor does badly, so it's an edge for us.

  **DECISION 2 — What do we do with a weird symbol we don't know how to pronounce (e.g. `∫`, `→`)?**
  - Option A: always spell it out / say its name.
  - Option B (recommended): if it's a common symbol (`&`→"and", `@`→"at", `©`→"copyright") say its name; if
    it's junk we can't say, stay SILENT for it but keep it "attached" in our list so highlighting and
    click-to-jump don't break; if it's an unknown *word*, let the voice engine try to pronounce it rather than
    spelling it letter-by-letter (a slightly-off word sounds better than "A-P-P-R-O-X").

- Everything else (which helper library, ~160 lines of code, how we keep the on-screen↔spoken link) is a HOW
  detail that's already settled and does NOT need a user decision — only Decision 1 and Decision 2 do.

**Next after compaction:** present Decision 1 + Decision 2 simply → get answers → write `### Branch C2
(RESOLVED)` → move to C3 (segmentation & streaming: how we cut text into sentence-chunks, start audio fast,
and keep it playing ahead).

**Symbols reframe (user, 2026-07-21):** "$5" is ONE cell of the NSW taxonomy (hundreds of surface forms:
numbers, currency, %, symbols &@#/+=©, units/math, dates/times, abbrev, acronyms, URLs/emails/paths, ranges,
fractions, roman numerals, emoji). Strategy is NOT per-symbol whack-a-mole → the two real questions: (i) the
**minimum viable subset** that makes a read sound decent (likely numbers + currency + common abbrev ≈ 80%),
and (ii) the **graceful fallback** for everything else (drop / spell out / say the symbol's name).

**Pipeline flow (explained to user 2026-07-21, concrete):** render → **segment** → per segment
[**tokenize** to source tokens (C1 truth) → **normalize** (only station that changes word count; keep the
source→spoken map) → **synthesize** (HeadTTS: audio + per-word times) → **align** (stamp audioStart/End onto
source tokens on one abs timeline)] running as a **conveyor/streaming** (seg 1 plays ~1s while seg 2..n
synthesize ahead) → **play + rAF-highlight + click-to-seek**. Edit re-runs from the top; cache keeps
unchanged segments instant. Key insight: normalization is the ONLY place 1:1 breaks.

### Branch C2 — DECISIONS LOCKED (2026-07-21)

**Decision 1 (format scope):** Build the thin Markdown cleaner for v1 (plain text + Markdown, NOT
plain-text-only). Clarified with user that normalization (TN, e.g. $5→"five dollars") and
Markdown-stripping are SEPARATE steps; stripping happens in the render layer so `#`/`**` never reach
the voice. Hard-construct policy: **code blocks → speak a short "code block" label and skip the
contents; tables → read cell-by-cell, row by row, with small pauses.** Easy syntax (#, **, lists,
italics, blockquote) stripped. Defer LaTeX / nested / HTML / footnotes to v2.

**Decision 2 (unknown-token fallback):** name common symbols (&→"and", @→"at", ©→"copyright") via a
static table; true junk we can't say → **stay SILENT but keep a zero-duration alignment span** (so
highlight + click-to-seek never break); unknown WORD-shaped token → pass to G2P, do NOT spell
letter-by-letter. This fallback IS also our messy-input safety net.

**Input-cleanliness policy (same discussion):** garbage-in never crashes — read what we can, silently
drop true junk, keep highlight+seek intact; do NOT infer structure from arbitrary messy text in v1.
Per-type: clean prose = happy path; clean Markdown = cleaner handles it; **PDF/web copy-paste → add a
STRUCTURAL PRE-CLEAN before segmentation (join intra-paragraph line breaks, de-hyphenate word-wraps,
collapse whitespace, blank line = paragraph break)** — the most common messy input; run-on/no-punct →
chunk-length cap still slices it; random symbols/emoji → Decision-2 fallback; non-English words → v1
English-only, best-effort; raw (unfenced) code/tables → best-effort, real detection deferred.

### Incremental edit-reuse + caching — PROPOSED (2026-07-21, user-driven; refines C3 + opens Branch D)

Problem (user): editing one line of a 10-line doc must NOT reset audio or re-synthesize the whole
thing. Reuse everything unchanged; re-synthesize only what changed; do it LAZILY (only when the
playhead reaches the changed part / user seeks into it). If the user just hits continue, playback
keeps going untouched. Confirmed direction; open Qs below → Branch D.

Design = content-addressed SEGMENT cache:
- Cache unit = the segment (short sentence-ish chunk) — the natural synthesis unit. Word-level caching
  is pointless (audio isn't reusable per-word); segment-level is the sweet spot.
- Content-key per segment = hash(normalized spoken text + voice + speed + model version). Load-bearing
  assumption: Kokoro synthesizes each chunk INDEPENDENTLY, so identical chunk text + params →
  identical audio → safe to cache by content. VERIFY no cross-chunk prosody carry-over in C4.
- On edit: re-render + re-segment the whole doc (cheap string work) → recompute every key → DIFF new
  key-list vs old. Unchanged key = cache HIT (reuse audio + per-word times as-is, zero synth).
  Changed/new key = mark DIRTY, synth lazily on approach/seek. (Mental model: git blobs by content
  hash / React reconciliation diff.)
- EFFICIENCY CRUX — split each segment into two data kinds: (a) EXPENSIVE cacheable artifact = audio +
  per-word times RELATIVE to segment start, keyed by content; (b) CHEAP derived layout = each
  segment's absolute base-offset = running sum of preceding durations. An edit that lengthens a
  segment only shifts following base-offsets (O(segments) integer adds); audio + relative times reused
  untouched. "Rebuild timeline" ≠ "re-synthesize." Audio never moves; only its position on the ruler.
- Currently-playing audio lives in an unchanged segment ⇒ upstream edit never stops it.

Consequence for C3 segmentation (user point, load-bearing): use ONE consistent, deterministic, LOCAL
segmenter yielding uniformly SHORT segments — NOT first-short-then-greedy. Reason = boundary stability:
if boundaries depend only on local text, an edit in one place can't re-flow downstream boundaries and
bust their keys. Stable boundaries = stable keys = maximal reuse. Also gives fine, predictable seek
targets + fast re-synth on a seek miss, and first-audio-fast for free. Feeds HeadTTS pre-split
(splitSentences:false).

Phase-2 (extension) forward-compat CONFIRMED by this design: DOM-free core + opaque render-anchor
already covers arbitrary live-page content. Phase 2 adds only two CLIENT-layer pieces — a
content-extraction adapter (DOM → source tokens + anchors, reader-mode style) and a page-range
highlight painter (e.g. CSS Custom Highlight API). Core contract stays "ordered tokens + opaque
anchors"; never leak DOM into core. Segment cache is a bonus in phase 2 (recurring sentences synth once).

TERMINOLOGY (locked 2026-07-21): "segment" ≡ "chunk" — use **chunk**. Only three levels:
document → chunk (synth + cache unit; ≤ one sentence, long sentences split at clauses) → word
(highlight + seek unit). Nothing between chunk and word.

Branch D cache — PERSISTENT + LAYERED + UNIVERSAL KEY (user decision 2026-07-21; memory: "not
in-memory, must work across all three synth backends"):
- Same content-key everywhere = hash(normalized text + voice + speed + model version) — so a sentence
  has ONE key regardless of which backend made it → logically unified even though bytes sit in
  different tiers.
- `CacheStore { get(key), set(key) }` interface (mirrors SpeechProvider). Impl per environment:
  in-browser → IndexedDB; local daemon → on-disk SQLite/files (the BEST cache host: one process, one
  disk cache shared across all browsers/profiles/extension — same argument as B4); hosted → server
  store shared across users.
- READ-THROUGH + WRITE-BACK: check local IndexedDB → miss → ask provider (checks its store) → miss →
  synth → result written back into local store en route. Local always caches whatever ANY provider
  produced (daemon/hosted results included) → instant repeat, no net/synth.
- Store ENCODED audio (Opus ~18KB/3s-sentence vs ~144KB raw PCM) + tiny per-word timings JSON; decode
  on play. Eviction = LRU by bytes, per-tier cap. Model version in key → auto-invalidates on upgrade.
- Open (not now): hosted shared cache makes "was this sentence synthed before" faintly timing-
  observable — fine for generic text (audio not user-linked), conscious call before hosted ships.

SEEK to ANY word — mechanics (user edge case 2026-07-21; C4/C5):
- We NEVER force chunk-start and NEVER synthesize sentence fragments (fragments → bad neural prosody).
- Always synth WHOLE chunks; but PLAYBACK can begin at any word's in-chunk offset via
  AudioBufferSourceNode.start(0, offsetSec) using the word's wtime. Sample-accurate, no glitch, no
  re-synth. This is the GOOD solution vs the bad "re-synth from clicked word."
- Seek flow: find word's chunk → ensure that chunk's audio exists (synth now if missing — short,
  ~300–750ms warm, once) → start its buffer at the word offset → set highlight → conveyor continues
  from next chunk. Only cost: seeking into not-yet-synthed territory waits for that one short chunk.

Editing UX — RESOLVED (2026-07-21): MODE-BASED two-view — reading and editing are MUTUALLY EXCLUSIVE
(entering edit pauses/stops playback; leaving re-runs the pipeline with cache-reuse and resumes). This
DELETES the "edit the currently-playing chunk" edge case (it can't happen). Block editor
(BlockNote/ProseMirror/Lexical) rejected for v1 (heavier; owns its own doc model + DOM → would fight
the DOM-free-core / opaque-anchor contract) — kept as a possible FUTURE upgrade or a SECONDARY client
for users who prefer that UI. Edits to any chunk are handled by lazy content-addressed invalidation.

### Branch C3 — the chunker + streaming orchestration — DECISIONS LOCKED (2026-07-21)

Reframing that shrank C3: **chunk size does NOT control seek granularity.** Playback can start at ANY
word inside a chunk via its in-chunk `wtime` offset (`AudioBufferSourceNode.start(0, offsetSec)`), so
seeking is word-level regardless of chunk size. ⇒ The only forces pushing chunks SHORTER are (a) TTFA,
(b) edit blast-radius, (c) seek-miss re-synth latency, (d) prefetch pipelining. The only force pushing
LONGER is prosody (Kokoro sounds better on fuller phrases; every inter-chunk seam risks a click / gap).

**Decision 1 (segmentation rule) — a 4-level LOCAL cascade.** Every level decided from local text only,
so boundaries stay stable (an early edit can't reflow downstream boundaries → keys stay valid → max
cache reuse). Boundaries anchor to LINGUISTIC/STRUCTURAL features, NEVER a running char budget (that's
why greedy packing was rejected).
  1. **Structural boundary → ALWAYS a hard cut**, a chunk never crosses one:
     paragraph · list item · heading · table row · the "code block" label.
  2. **Sentence** (within a block): `Intl.Segmenter`, abbreviation-aware so "Dr." / "e.g." / "3.14"
     don't false-split.
  3. **Clause-split — ONLY if the sentence exceeds the length threshold:** cut at strong internal
     punctuation ( ; : — , before a coordinating conjunction ). A clause is a natural prosodic unit, so
     Kokoro handles it far better than an arbitrary char cut. Most short/medium sentences stay WHOLE.
  4. **Word-count slice — ONLY for a punctuation-less run-on still over the hard cap:** last resort;
     blast-radius contained to that one run-on (the next real sentence boundary re-anchors).
  Chose clause-split (not whole-sentence-always) because small edit blast-radius + fast seek-miss synth
  are what make the incremental-edit UX feel instant. Because level 3 caps length, **the first chunk is
  automatically short — NO special-case "short first chunk" needed.** (Whole-sentence-always is the
  fallback only if clause seams turn out audible — it would re-require a first-chunk exception for TTFA.)

**Decision 2 (chunk length) — pin the SHAPE, defer the NUMBER.** Commit to "target length + hard cap,
clause-anchored." Exact numbers (~10–20 words target, ballpark) are a BENCHMARK-TUNED knob — the right
value depends on real GPU/WASM synth speed we haven't measured. Do NOT hard-code a number in the design.

**Decision 3 (streaming orchestration) — adaptive look-ahead + cancellable priority queue.**
  - **Adaptive look-ahead, not fixed:** synth ahead of the playhead but CAP the buffer (K chunks or ~N s
    of decoded audio) → bounded memory. Fast GPU outruns playback trivially; WASM may lag → buffer cap +
    "keep synthesizing the next uncached chunk" smooths gaps (backpressure).
  - **Cancellable requests with priority:** a SEEK jumps its target chunk to the FRONT (synth now, high
    priority) and abandons the now-irrelevant sequential prefetch. Same machinery handles an EDIT: dirty
    chunks are re-queued lazily when the playhead approaches. Seek target = high; prefetch = low.

**We own segmentation (confirmed):** feed HeadTTS pre-cut chunks with `splitSentences:false` (its
`divideToParts` becomes a no-op since our chunks are already short). One API detail to confirm at build
time: one `synthesize` call per chunk vs. passing an array — doesn't change the design.
**Ordering note:** SEGMENT runs on the cleaned/rendered source text; NORMALIZE runs per-chunk AFTER
(keeps each chunk's normalized text — and thus its content-key — dependent only on that chunk's source).
Segmentation stays abbreviation-aware so it doesn't need normalization to have run first.

### Branch C4 — runtime word alignment — DECISIONS LOCKED + TEST PLAN (2026-07-21)

**Highlight-to-audio mapping — DEFAULT = PASS-THROUGH 1:1 (Option B, LOCKED 2026-07-22); the two-join is the
fallback.** Never forced-alignment (research: purpose-built aligners miss the acceptable-drift window on 30%+
of sentences; Whisper-align 6.6% → out; use HeadTTS synthesis-time timestamps only).
- **DEFAULT (pass-through):** feed HeadTTS the SOURCE chunk text verbatim; T3 proved `words[]` comes back as
  the source tokens themselves, timestamped. Map source token ↔ `words[]` entry by position, strip trailing
  punctuation, done — ONE trivial join, no normalizer provenance needed. `words.join("")` == source is the
  sanity check.
- **FALLBACK (overridden tokens only):** for the few tokens we rewrite ourselves (HeadTTS TN gaps —
  currency/symbols/abbrev) that span becomes N↔M, so the old two joins apply: Join 1 = source token → our
  rewritten tokens (free — the normalizer's own output); Join 2 = our tokens → HeadTTS `words[]` (local text
  match; if it can't line up, distribute the span's time proportionally, still no forced-align). Worked ex.
  override "I paid $5 today." → send "...five dollars...", "$5" span = [start "five", end "dollars"].
- Compose → each source token gets a `[start,end]` span RELATIVE to chunk start (+ chunk base-offset =
  absolute, per the caching timeline split); click a word → seek to its start. (Cleaner override path to
  verify later: HeadTTS typed `speech {value, subtitles}` / `characters` items may keep the SHOWN token in
  `words[]` and preserve 1:1 even for rewritten spans — cheap tts-lab check, not a blocker.)

**Cache — SIMPLE (user simplified 2026-07-21; earlier "cache vs derived / indexing" framing dropped as
overcomplication):** ONE content-addressed lookup table. Key = hash(spoken text + voice + speed +
model). Value = audio + per-word timings. Hit → reuse (incl. the SAME sentence appearing many times
anywhere in the doc → synth once); miss → synth + store. Edit one line → every other chunk's text is
unchanged → same hash → reused → only the edited chunk regenerates. NO separate index, and the cache
does NOT store the source→spoken link — that link falls out of the normalizer on every render (free),
so there is nothing extra to build or store.

**Dropped junk (from C2 Decision 2):** a source token with no audio → zero-duration span between its
neighbors (highlight passes through instantly; click-to-seek lands on the next real audio).

**Uncertainties → RUN as tests against the local HeadTTS clone (`refs/HeadTTS`, node build
`modules/headtts-node.mjs`, deps `@huggingface/transformers`, `tests/` + jest already present), then
CLOSE — no lingering "not sure" notes:**
- **TEST 1 — chunk independence (GATES the cache).** Synth "The cat sat." three ways: alone · as chunk
  2 after "Hello there." · as chunk 1 before "Goodbye now." Compare audio samples + `wtimes`. PASS
  (identical within tolerance) → caching by text hash is safe. FAIL → fold a little neighbor context
  into the hash. This is the ONE load-bearing cache assumption — measure it, don't assume it.
- **TEST 2 — timestamp/audio integrity (desync canary).** Synth a batch incl. tricky normalization
  ($5, 1999, Dr. Smith, 3.14). Assert: len(words)==len(wtimes)==len(wdurations); `wtimes` monotonic;
  last word end ≈ audio buffer length (catches the "dropped a whole sentence's timestamps" bug); no NaN.
- **TEST 3 — alignment golden set.** Known inputs → known spoken groupings; assert the two-join spans
  (e.g. "I paid $5 today." → "$5" span = [start "five", end "dollars"]).

**TESTS RUN — RESULTS (2026-07-22): C4 gate CLOSED, all three PASS.** Write-up + raw artifacts:
`real-aloud-app/tts-lab/REPORT.md` (+ `tts-lab/artifacts/`; reusable harness in `tts-lab/`). Env: HeadTTS
v1.3.0, Kokoro-82M-v1.0-ONNX-timestamped, q8/cpu, af_bella, 24 kHz, Node 24.
- **T1 → cache SAFE.** Same chunk text synthesized twice = byte-identical PCM (max_abs_diff = 0) + identical
  wtimes, every probe. Key `hash(chunk text + voice + speed + model)` sufficient, no neighbor context needed.
  BUT embedding a sentence in a longer input string shortened it 700–850 ms (Kokoro compresses prosody over a
  longer forward pass) ⇒ **HARD CONSTRAINT: exactly one chunk per `/v1/synthesize` call; never batch multiple
  chunks and cache the parts** — confirms + hardens C3's own-segmentation (splitSentences:false).
- **T2 → no desync.** All 6 inputs pass every invariant (len(words)==len(wtimes)==len(wdurations) · monotonic
  wtimes · no NaN); the dropped-timestamps bug was NOT observed. lastWordEnd/audioDur ratio 0.83–1.01 (sub-1.0
  is just trailing silence) ⇒ stop highlight advance at lastWordEnd, ignore the silent tail. Desync canary
  kept only as a cheap runtime guard, not a design worry.
- **T3 → contradicts a prior assumption (good news).** Fed RAW source text, `words[]` comes back as the
  VERBATIM SOURCE tokens ("$5 " / "£20 " / "1999." / "3.14." / "Dr. "), each timestamped to where its
  expansion is spoken; `words.join("")` == source; mapping is 1:1, no token explosion. This FALSIFIES the
  earlier C1/C2/C4 claim that returned words are post-G2P spoken tokens with the source→spoken link lost —
  HeadTTS does G2P for the audio but times against SOURCE surface tokens. (Wrinkle: end punctuation attaches
  to the last token → strip before matching to an on-screen word.) ⇒ When we feed source text verbatim the
  two joins collapse to a single trivial source↔words[] match; **decide pass-through-by-default (vs our-pre-
  normalization) as the next step, then reconcile the C2/C4 mapping + the now-stale "spoken tokens" lines.**

## Branch B: Architecture & where speech synthesis runs (RESOLVED except B5/warmup — deferred)

**Research findings (2026) — corrections to prior voiceover-feature docs:**

1. **CORRECTION — word timestamps are NOT free via vanilla kokoro-js.** The public `kokoro-js`
   ONNX path does NOT expose the model's native alignment output in-browser; it gives per-chunk
   text+audio only (best you can do there is crude chunk-duration approximation). Real word-level
   timing requires the **`onnx-community/Kokoro-82M-v1.0-ONNX-timestamped`** model (Apache-2.0) +
   custom decoding of its phoneme-duration tensors. The old brainstorm/spec assumed kokoro-js
   would surface timestamps — it won't. This is the error the user flagged.

2. **BIG FIND — HeadTTS (`github.com/met4citizen/HeadTTS`, `@met4citizen/headtts`) solves the
   hard part and is MIT-licensed.** It is neural TTS on Kokoro that OUTPUTS real word-level timing
   (`words`, `wtimes`, `wdurations`) + phoneme timing + Oculus visemes, using the timestamped ONNX
   model. Runs **in-browser via Web Workers, WebGPU primary + WASM fallback** — AND as a **Node.js
   WebSocket/REST server (WebGPU or CPU)**. npm/CDN published. **MIT license explicitly avoids
   eSpeak/GPL** → clean to use inside our AGPL app AND inside commercial-licensed builds (does not
   poison the E2 commercial-embedding plan). Gap: it delivers a *complete* audio+timing object per
   call, no built-in chunk streaming — so sentence-by-sentence STREAMING is OUR engine's job
   (branch C); HeadTTS gives us the per-sentence synth+timings unit we need.

3. **WebGPU vs WASM is a first-order constraint.** WebGPU ≈ 3× real-time (≈10× faster than WASM);
   WASM ≈ 0.5–1× real-time on modern CPUs (30s audio in 30–60s). ⇒ WebGPU-first with WASM fallback;
   on weak/WASM-only devices, first-sentence latency is the risk → raises the value of caching (D),
   read-ahead prefetch, and (later) the local-daemon / hosted provider. Confirms the deferred
   low-spec benchmark is real and needed before v1 ships.

4. **Native "local daemon" for phases 2/3 is well-supported.** Rust Kokoro impls exist (`Kokoros`,
   `kokoro-rs`, `kokoro-en` [mobile-cross-compilable], `any-tts`, `tts-rs`) + `Kokoro-FastAPI`
   (~5GB container). BUT the cheapest daemon may simply be **headtts-node** (same MIT project,
   same word/phoneme output, WebSocket) → one provider implementation covers browser AND daemon.

**What HeadTTS actually solves (clarification — it is NOT the 3D avatar):** the talking-head/3D
demo is a *separate* project (met4citizen's "TalkingHead") that *consumes* HeadTTS. HeadTTS itself
is just the audio+timing engine; visemes are ignorable numeric fields, no 3D code to strip. It
solves the three hard, easy-to-get-wrong, non-differentiating parts we'd least want to build:
(1) in-browser Kokoro on WebGPU+WASM in a Web Worker (ONNX Runtime Web plumbing, backend
detection); (2) **non-GPL phonemization** (text→phonemes without GPL eSpeak-NG — a technical AND
a licensing asset: eSpeak would contaminate the E2 commercial-license plan); (3) timestamp
decoding + phoneme→word alignment → `{word,start,end}`. Our differentiation is the reading
experience (pipeline/sync/seek/cache/adapters/UX), not re-deriving phoneme timings.
Reuse approach: **wrap behind our own `SpeechProvider` interface**; depend on `@met4citizen/headtts`
(npm) to ship phase 1 fast; vendor/fork the engine modules later if we need control (MIT allows
anything); downstream code talks to OUR interface, never HeadTTS directly (keeps it swappable).

**SPEED — concrete browser TTFA numbers (QuickTTS benchmark, 2026).** The scary "30s audio in
30–60s" figure is *whole-document WASM throughput* — irrelevant to us, because we only ever wait
for the FIRST short chunk. Warm time-to-first-audio for ~200 chars (≈1–2 sentences), model already
loaded: RTX 4070 ~300ms · RTX 3060 laptop ~500ms · M3 Pro ~600ms · M2 Air ~750ms · RX 7600 ~700ms
· Intel Arc A380 ~1300ms · **Intel UHD 770 integrated ~3500ms**. Pipelined batches hold ~400ms TTFA
regardless of total length (user waits only for first batch). WASM-only (no WebGPU) ≈ 0.8–1× RT →
seconds. One-time cold load (model download+init) 7–18s by device, then cached <1s.

**⇒ Feasibility of user's "first sentence ready in ~1s on a normal device": YES on any machine
with a real GPU (discrete NVIDIA/AMD or Apple Silicon) — 300–750ms warm, under target with margin —
PROVIDED two techniques (both belong to branch C):**
1. **Pre-warm before the click** — eagerly init the worker + model (and run a tiny dummy synth to
   trigger WebGPU shader compilation) when the app loads / text is pasted, so the first real click
   hits the ~300–750ms warm path, NOT the 7–18s cold init.
2. **Short first chunk** — split so the very first unit is small (first clause/short sentence) →
   fastest possible time-to-first-audio, then continue with full sentences in the background.

**Weak-device tail (1s NOT achievable in-browser):** integrated GPUs (~3.5s) and WASM-only/no-WebGPU
(seconds). Escape hatches, all already in the architecture: **caching (D)** makes repeat/known
content instant; **local daemon (phase 2/3, native/headtts-node)** hits real-time+ even on CPU;
**hosted synthesis** guarantees sub-second on ANY device incl. mobile (network round-trip + fast
server) and doubles as the E2 convenience/monetization leg. Benchmark early — TTFA on target
hardware is the make-or-break UX metric.

Sources: HeadTTS repo (MIT), onnx-community Kokoro timestamped model card + discussions, Ryan
Welch "Kokoro word timestamps", OfflineTTS & QuickTTS WebGPU benchmarks (TTFA table), Rust-Kokoro
projects — 2026.

**B1 — fork decision (RESOLVED):** user is fine forking HeadTTS. Confirmed approach: wrap behind our
`SpeechProvider` interface; depend on `@met4citizen/headtts` (npm) to ship phase 1 fast; vendor/fork
the engine modules into our repo when we need control (MIT permits anything). Downstream code talks
only to OUR interface, never HeadTTS directly, so the provider stays swappable.

**B4 — in-browser vs local daemon (RESOLVED): BOTH, chosen at runtime via the provider interface.**
User's daemon argument is correct and load-bearing: in-browser model storage is **per-browser-profile**,
so a user with multiple profiles/browsers duplicates the ~85–150MB download, the 7–18s warmup, and the
in-memory running instance N times. A single native **local daemon** = one install, one on-disk model,
one warm long-running process on a localhost WebSocket/HTTP endpoint that ALL browsers/profiles/
extensions/desktop apps share → kills duplication, eliminates per-browser warmup (stays warm across
clients), and runs faster than WASM. BUT requiring a daemon would break the zero-install web wedge.
**Resolution (progressive enhancement, the whole point of the provider abstraction):**
- **In-browser (WebGPU/WASM) = zero-install DEFAULT** → web app works instantly on landing. Phase 1.
- **Local daemon = first-class OPTIONAL native upgrade.** App probes localhost; if a daemon is running
  it becomes the PREFERRED provider automatically. Solves duplication/warmup/speed for regulars, power
  users, weak devices. Designed-for now; shipped as optional install ~phase 2.
- **Hosted = third provider** for any-device/mobile + the E2 paid convenience leg.
All three implement one interface; pipeline/highlighting/seek/cache are provider-agnostic. The daemon
is ALSO the cleanest fix for warmup (warm once, serve all clients forever); the pure-web path only
*mitigates* warmup (pre-warm + cache + progress UI), which is why B5 gets its own session.

**B5 — smooth cold-start/warmup UX (DEFERRED to its own session).** The 7–18s first-load (model
download + init) on the pure-web path is "fine for now" but the user wants a dedicated session for a
cleverer solution. Ideas to explore later (NOT yet decided): eager pre-warm on app-load / on-paste
(+ tiny dummy synth to pre-compile WebGPU shaders); service-worker / Cache-API precache; CDN-chunked
or smaller "fast-first" model then upgrade to full quality; background download with clear progress;
daemon sidesteps it entirely. Not blocking the spec.

## Branch E: Business strategy (RESOLVED)

**Model inspiration — Handy (`github.com/cjpais/Handy`, MIT):** user's main reference. Handy is
local-first, offline, privacy-first speech-to-text (the mirror image of our TTS). Its model:
100% free, NO paywalls/tiers/subscriptions ever; funded by donations (handy.computer/donate,
PayPal, Ko-fi, BMC), GitHub Sponsors, and **corporate sponsors** (Wordcab, Epicenter, Bolt AI).
Ethos: *"Accessibility tooling belongs in everyone's hands, not behind a paywall"* and *"trying
to be the most forkable"* STT app. Clever move to copy: **code is MIT/free, but name+logo+icon+
brand assets are NOT open source** — blocks knockoffs while keeping software free.

**Cloud sync / reading-library pillar — DROPPED.** User challenged it correctly: for a
paste-text-and-listen local tool, local save is enough; cloud sync only matters for a heavier
cross-device "listen-later" (Pocket-model) product, which is off-model for the Handy ethos.

**E1 — Open source model: DECIDED (direction).** NOT pure-Handy / not MIT / not "maximally
forkable." User's line: free = the real features for **individual users**; forking allowed for
tinkerers; **corporations do NOT get a free ride — they pay to embed.** ⇒ **copyleft + CLA +
commercial embedding license.** (Copyleft still permits forks & contributions; it only blocks
*closing* the code — so the community upside is fully retained; only closed corporate embedding
is denied/monetized.)

**E2 — Revenue lines:** **commercial embedding license = confirmed primary line** (user
explicitly in favor). Premium / BYO-key voices = candidate add-on (proposed; not gating; aligns
with vision provider-independence). Donations + corporate-sponsor program + Handy-style
brand-protection (trademark name/logo/icon) = adopt from day one. Export/hosted/enterprise =
deferred "later if it pulls."

**Contributor economics (answered for user):** No default obligation to revenue-share with
contributors. Mechanism = **CLA** (contributor grants owner a broad/relicensing license) — this
is what legally enables the commercial license to include community code; REQUIRED from commit #1
(a plain DCO sign-off is NOT enough for dual-licensing). Norm: contributors are unpaid volunteers,
expect no cut; maintainer monetizing is accepted IF core stays genuinely free + transparent;
backlash comes from *rug-pulls* (open→closed relicensing: HashiCorp/OpenTofu, Redis, Elastic),
NOT from selling commercial licenses alongside a free copyleft core (Qt, Sidekiq, GitLab). Optional
generosity (bounties via Polar/IssueHunt, Open Collective, hiring top contributors) = strategic,
never owed.

**E3 — License flavor: DECIDED — AGPLv3 + CLA on the whole repo (engine AND apps).** User
approved. Rationale: NOT LGPL (its whole purpose is free closed embedding — opposite of the
goal); AGPL over plain GPL because a company running the engine as a *hosted service* doesn't
"distribute" under GPL (loophole) — AGPL's network clause closes it, protecting our own
hosted-service/public-API plans; do NOT split (permissive engine / copyleft apps) — that hands
corporations the free embed we're monetizing, killing the commercial line; stay OSI-open (avoid
BSL/source-available) to keep the contribution + HN-goodwill flywheel. AGPL's cost (some corps
blanket-ban it) converts into a sales funnel, not lost individual free users.

**Safety notes (user has zero licensing background — flagged, reassured):** choice is standard
(GitLab/Grafana lineage) and REVERSIBLE toward more-permissive only (CLA lets owner relicense
AGPL→GPL→MIT later; never the reverse) — erring on the undoable side deliberately. **Must-do:**
CLA bot on repo from commit #1; never merge an external PR without it (only truly hard-to-unwind
mistake). Use off-the-shelf templates (Apache-style ICLA + CLA-assistant bot), not hand-rolled
legal text. Not legal advice: get a one-time lawyer review of CLA + commercial-license terms
BEFORE the first commercial deal / large sponsorship (a later checkpoint, not a blocker now).

**Architecture insight banked for B/C — adapter/plugin surface:** contributions have marginal
value in the phase-1 web app but ENORMOUS value in the **phase 2/3 per-site adapter layer**
(uBlock filter-list / Dark Reader per-site-fix / Tampermonkey pattern): a fast-moving long tail
of site extractors the solo maintainer can't keep up with; community patches a broken adapter the
day a site redesigns. User's "pre-injected play button per Reddit/ChatGPT block that auto-selects
+ reads" is exactly an adapter. ⇒ Design a **first-class adapter/extractor plugin surface**
separate from the core engine. Bonus: clean business split — **core engine = monetizable,
copyleft-protected IP; adapters = community contribution zone.**

## Branch A2: Audience & positioning (RESOLVED)

**Decision:** This is a **universal read-aloud tool**. Do NOT position around any segment
(developers, students, accessibility). The feature set is identical for every audience, so a
segment label would invent a constraint the product doesn't have.

**Reasoning:** Agent initially proposed a "developers/knowledge-worker beachhead" for
go-to-market + contributor-flywheel reasons. User rejected: the tool is horizontal — the same
tool serves developers and non-developers identically. Markdown is NOT a developer signal:
mainstream users hit markdown constantly (voicing a ChatGPT response is the canonical everyday
case — notes, docs, chat output). Primary jobs are format-first, audience-agnostic: paste or
upload any text / markdown / PDF and listen with word-sync + click-to-seek interaction.
Launch-surface choice (where to first post it) is a later marketing detail, not product positioning.

## Branch A3: Differentiation / wedge (RESOLVED)

**Decision:** The wedge is the **unoccupied market intersection**: neural-quality voice +
true word-level highlighting + click-to-seek interaction + free forever at any scale +
open-source + private/offline + universal (web → extension → desktop).

**Reasoning (grounded in competitive scan, 2026):**
- **Read Aloud** (OSS incumbent, large install base): free + OSS + universal, BUT robotic
  browser voices or *bring-your-own paid cloud key*, and sentence-level highlighting only.
- **Speechify** ($139/yr): neural, but free tier capped (1.5×, 10 voices); cloud/closed.
- **ElevenReader** (free app): best-in-class voice, but cloud/closed, ~10k chars/mo on core.
- **NaturalReader**: strong file support, but variable quality; cloud/closed; premium 20 min/day.
- **Mira Reader** (beta): word-level highlighting, BUT closed, Chrome-only, "free *during beta*".

No one holds the full intersection. **On-device Kokoro is what makes it economically possible** —
$0 marginal cost is a structural advantage paid players can't match without wrecking their
margins, and free players lack the quality. One-line wedge: *"the quality of Speechify, the
freedom of Read Aloud, the interaction Edge never gave you — free forever, open source, on your
machine."*

**Deferred:** the *standout-feature menu* (podcastify/export, reading queue/"listen later",
code-block-aware reading, multi-voice for dialogue, speed-reading modes, custom pronunciation
lexicon) — captured as candidates; decide which are in v1 during scope (overlaps branch C).

Sources: Speechify pricing, ElevenReader/NaturalReader comparison, OSS TTS extension landscape
(TechRadar, Chrome Web Store, vendor pages) — 2026.

## Branch A1: Architecture framing (RESOLVED)

**Decision:** v1 is a single deployable **web app**, but the code splits into (a) a
framework-agnostic **`@reading-engine/core`** TypeScript package with zero DOM/React —
owning ingest → normalize → segment → schedule synthesis → cache → drive the reading
timeline, exposed via an event/observer interface — and (b) a **thin web client** that
renders the document, subscribes to engine events for highlighting, and forwards seek
clicks. Later clients (extension, desktop, Delapse) reuse the same core.

**Reasoning:** The vision's "platform for many clients" gets ~90% of its value from the
*factoring discipline* (no DOM assumptions in core), not from building servers/public APIs.
Pay the factoring tax now; defer the platform-server tax (public API, auth, multi-tenant)
until demand is proven — that's the YAGNI line. Wedge vs. Edge Read Aloud is not voice
quality but universality + ownership ("read-aloud that isn't a hostage to your browser") +
instant streaming + click-to-seek interaction. Keeps v1 shippable in weeks: one app, one
runtime, no backend. User agreed.

**Rejected:** (1) "Hosted service / public API from day one" — too much scope, adds backend
cost that fights the "fully free" goal, premature. (2) "Web app monolith, refactor later" —
the refactor to extract a DOM-free core after the fact is expensive and error-prone; the
discipline is cheap if adopted from the first commit.
