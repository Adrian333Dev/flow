# Visualizations — Reading Engine full architecture + incremental edit-reuse

**Saved:** 2026-07-21 · **Topic:** t01-reading-engine · **Format:** text/ASCII (SVG diagrams deleted)

**Purpose of this file:** archive of the visual explanations produced this session, WITH the input
that prompted each and the reasoning behind the framing — so a later study-case pass can critique and
improve them. (User feedback: earlier visualizations were often hard to understand; keep saving them
with reasoning so we can study and improve.)

---

## INPUT / context that prompted these

- User asked: "after the user pastes/uploads text (markdown or plain), what is the FULL architecture?
  Have we even defined it? I want very clean ASCII/diagram-style visualization; split large diagrams
  into multiple smaller ones and visualize in chunks."
- Follow-up asked to clarify: what HeadTTS actually does in the pipeline (the complex parts, not the
  obvious client stuff), what SpeechProvider is, and what "light word #id / user clicked #id" means.
- Follow-up raised the real design concern: DON'T re-run the whole pipeline on every edit — reuse
  unchanged parts, regenerate only what changed, lazily, and never reset playback. Wants a consistent
  chunking util. Wants phase-2 (extension) forward-compatibility considered now.

---

## Diagram 1 — Whole system (what talks to what)

**Goal:** establish the top-level shape and the core↔client split before any pipeline detail.
**Reasoning:** the load-bearing idea is that the core is DOM-free and speaks only in opaque ids; the
client is the only side that maps ids↔pixels. Everything else (phase-2 reuse, seek, highlight) falls
out of that. So diagram 1 leads with it.
**Known weakness (for study case):** the two-way id arrows (highlight down, seek up) were unclear to
the user in the first pass and needed a prose paragraph to land — the arrows alone didn't carry it.

```
   YOU
    │  paste text  /  upload file      (you tag it: Text or Markdown;
    ▼                                   upload = detected from extension)
┌──────────────────────────────────────────────────────────────────┐
│  WEB CLIENT  (thin — the only part that touches the screen)        │
│                                                                    │
│   ┌──────────────────┐     edit     ┌───────────────────────────┐  │
│   │ SOURCE INPUT     │◀────────────▶│ READING VIEW              │  │
│   │ editable box     │  re-runs the │ rendered words, one screen│  │
│   │                  │   pipeline   │ span per word, each id-   │  │
│   └──────────────────┘              │ tagged; highlight + click │  │
│                                     └───────────────────────────┘  │
│        client keeps the map:   word-id  ⇆  screen span             │
└───────────────────────────────┬──────────────────▲─────────────────┘
                    text goes in │                  │ "light word #id" / seek
                                 ▼                  │ "user clicked #id"
┌──────────────────────────────────────────────────────────────────┐
│  @reading-engine/core   (framework-agnostic, NEVER touches DOM)    │
│  ── runs the pipeline (Diagram 2) + owns the word-list truth ──    │
└───────────────────────────────┬────────────────────────────────────┘
                                 │  synthesize(chunk)
                                 ▼
┌──────────────────────────────────────────────────────────────────┐
│  SpeechProvider   (one interface, swappable — Diagram 6)           │
└──────────────────────────────────────────────────────────────────┘
```

Runtime handshake the diagram encodes (clarified in prose because arrows alone failed):
- Highlight = core → client: core computes which word is due and says "light word #id".
- Seek = client → core: user clicks a word, client knows its id, says "user clicked #id"; core jumps
  audio to that word's start time.
- The id is the shared language; only the client knows id↔pixels. This is what keeps the core DOM-free
  and reusable in the extension.

---

## Diagram 2 — End-to-end pipeline (the "conveyor")

**Goal:** show the ordered stations and that HeadTTS is only ONE of them.
**Reasoning:** users kept over-attributing work to HeadTTS; the diagram deliberately boxes it as a
single station (2c) inside a per-chunk group.
**Known weakness:** first pass said "first chunk deliberately short" — user correctly pushed back that
ALL chunks should be short via one consistent segmenter (see incremental section). Update the label.

```
 SOURCE TEXT  (Text or Markdown)
   │
   ▼
┌───────────────┐  Markdown → strip the syntax, keep the words
│ 1. RENDER     │  (**bold**→bold · code block→a spoken label · table→rows)
│    [C2]       │  output = the reading surface: what you see IS what's read
└──────┬────────┘
       ▼
┌───────────────┐  cut the surface into uniformly SHORT sentence-ish chunks with
│ 2. SEGMENT    │  ONE deterministic, local segmenter (stable boundaries under edits)
│    [C3]       │
└──────┬────────┘
       │   chunk1 ─── chunk2 ─── chunk3 ─── …   (streamed, see Diagram 5)
       ▼
   ┌─────────────────────────────────────────────┐
   │  PER-CHUNK STATIONS  (repeat for each chunk) │  ← detail in Diagram 3
   │  2a tokenize → 2b normalize → 2c synth →     │
   │  2d align  (stamp each word with a time)     │
   └───────────────────┬─────────────────────────┘
                       ▼
┌───────────────┐  queue the audio buffers gap-free on ONE timeline;
│ 3. PLAY +     │  every frame: light the current word; click a word → seek
│ HIGHLIGHT +   │
│ SEEK  [C5]    │
└───────────────┘

  edit the source ──▶ re-run from step 1, BUT reuse unchanged chunks from cache
                      (content-addressed; see incremental section) — Branch D
```

---

## Diagram 3 — Inside one chunk (where 1-to-1 breaks)

**Goal:** make the N↔M (one written word → several spoken words) concrete, and locate the
source→spoken map.
**Reasoning:** normalization is the ONLY station that changes word count; isolating it explains why
highlighting needs an explicit alignment step rather than getting it free from HeadTTS.

```
   one chunk:  "I paid $5 today."
        │
        ▼
┌────────────────────┐  split into on-screen WORDS = "source tokens"
│ 2a. TOKENIZE  [C1] │  each gets: id · surface text · a render-anchor
└─────────┬──────────┘  → [I] [paid] [$5] [today.]      ← the source of truth
          ▼
┌────────────────────┐  rewrite ONLY where speech needs it, and REMEMBER the link:
│ 2b. NORMALIZE      │      $5  ──▶  "five" "dollars"    (1 written word → 2 spoken)
│     [C2]           │      I · paid · today.  pass straight through (1:1)
│  the ONLY station  │  keeps a source→spoken MAP so highlighting can line back up
│  that changes the  │
│  word count        │
└─────────┬──────────┘
          ▼   spoken text: "I paid five dollars today."
┌────────────────────┐  HeadTTS (Kokoro, timestamped model):
│ 2c. SYNTHESIZE     │    → audio buffer
│     [B]            │    → words[] · wtimes[] · wdurations[]  (per spoken word)
└─────────┬──────────┘
          ▼
┌────────────────────┐  using the source→spoken map + the wtimes, stamp
│ 2d. ALIGN   [C4]   │  audioStart / audioEnd onto each SOURCE token:
│                    │    [$5] gets the span covering "five" + "dollars"
└────────────────────┘  → now every on-screen word has a time on one axis
```

---

## Diagram 4 — Data model / timeline (C1↔C4 crux)

**Goal:** show the single absolute-ms timeline and how one source token can own a multi-word span.
**Reasoning:** highlight = lookup by currentTime; seek = lookup by clicked id. Both are lookups over
this one structure, so the diagram shows both axes at once.

```
SOURCE TOKENS  (on screen — the source of truth):
   ┌────┐ ┌──────┐ ┌──────┐ ┌────────┐
   │ I  │ │ paid │ │  $5  │ │ today. │
   └────┘ └──────┘ └──┬───┘ └────────┘
                      │  normalize (N↔M): one token → two spoken words
                      ▼
SPOKEN WORDS  (HeadTTS output, each has a start + duration):
   "I "    "paid "    "five "   "dollars "   "today."

AUDIO TIMELINE  (one absolute ms axis):
   0        280       600       880          1500      2050
   │   I    │  paid   │  five   │  dollars   │  today. │
   ├────────┼─────────┼─────────┴────────────┼─────────┤
                      └──────── $5 span ──────┘

HIGHLIGHT = find the token whose [start,end] holds the audio's currentTime → light its id
SEEK      = client reports the clicked id → jump audio to that token's start
design notes: never let highlight LAG audio; budget leading/trailing silence.
```

---

## Diagram 5 — Streaming conveyor (why you only wait once)

**Goal:** show that the user waits only for chunk 1, then audio never runs dry.

```
wall-clock ─────────────────────────────────────────────────────▶

 chunk 1  │synth│▶▶▶ PLAY 1 ▶▶▶│
 chunk 2        │ synth │▶▶▶ PLAY 2 ▶▶▶│
 chunk 3               │ synth │▶▶▶ PLAY 3 ▶▶▶│
 chunk 4                       │ synth │▶▶▶ …
          └──┬──┘
        first audio: ~300–750ms warm on a real GPU
        (short first chunk + model pre-warmed at app-load, not 7–18s cold)

  • chunks synthesize AHEAD of the playhead (read-ahead prefetch)
  • HeadTTS emits chunks in order (FIFO) → we queue buffers gap-free
```

---

## Diagram 6 — Where the voice runs (one interface, three engines)

**Goal:** show SpeechProvider as the swap seam behind B4.

```
        core calls ONE interface:  synthesize(chunk) → {audio, words, wtimes}
                                 │
        ┌────────────────────────┼────────────────────────┐
        ▼                        ▼                         ▼
┌────────────────┐     ┌────────────────────┐     ┌────────────────┐
│ IN-BROWSER     │     │ LOCAL DAEMON       │     │ HOSTED         │
│ Kokoro         │     │ native/headtts-node│     │ synthesis svc  │
│ WebGPU ▸ WASM  │     │ on localhost       │     │                │
│ zero-install   │     │ PREFERRED when up: │     │ any device incl│
│ DEFAULT        │     │ one warm process,  │     │ mobile; sub-1s │
│ (phase 1)      │     │ shared by all,     │     │ paid-convenience│
│                │     │ faster than WASM   │     │ leg (E2)       │
└────────────────┘     └────────────────────┘     └────────────────┘
        └──────── all three return the SAME shape ────────┘
    the pipeline, highlighting, seek, and cache never know which one ran
```

---

## Diagram 7 (NEW this turn) — Incremental edit-reuse (content-addressed segment cache)

**Goal:** show that an edit reuses unchanged segments and regenerates only the changed one, lazily,
without resetting playback.
**Reasoning:** the key teaching point is the split between the EXPENSIVE cacheable artifact (audio +
relative times, keyed by content) and the CHEAP derived layout (absolute offsets = running sum). An
upstream edit re-adds offsets but never re-synthesizes downstream audio.

```
EDIT lands (user changes line 1 of 10)
1. Re-render + re-segment the WHOLE doc        (cheap: pure string work, no audio)
2. Recompute every segment's content-key = hash(normalized text + voice + speed + model)
3. Diff the new key list against the old one:

   ├─ key UNCHANGED  → cache HIT
   │     reuse stored audio + per-word times exactly (zero synthesis)
   │
   └─ key CHANGED/NEW → cache MISS → mark segment DIRTY
         re-synthesize LAZILY — only when the playhead nears it,
         or when the user seeks into it. Never eagerly.

4. Rebuild the absolute timeline = running sum of segment durations
      (cheap: one integer add per segment — audio itself is untouched)

Result: the currently-playing audio is in an UNCHANGED segment → it never stops.
Mental model: git blobs addressed by content hash / React reconciliation diff.

Load-bearing assumption: Kokoro synthesizes each chunk INDEPENDENTLY, so identical
chunk text + params → identical audio → safe to cache by content. (Verify in C4.)
```

---

## Self-critique (seed for the study case)

- Box-and-arrow ASCII carries STRUCTURE well but carries DYNAMIC/two-way relationships (the id
  handshake) poorly — those needed prose. Consider: for interaction/handshake, prefer a sequence-style
  text-flow (A → B: message) over a box diagram.
- Diagrams 1–6 are a top-down zoom sequence; that ordering worked ("I'm starting to understand after
  reading the second diagram"). Keep the "short text establishing what it IS → diagram → bridge →
  next" cadence from the visualization skill.
- Recurring failure mode to watch: labeling a station with a branch code (`[C4]`) assumes the reader
  tracks our branch taxonomy. For user-facing visuals, prefer plain labels; keep branch codes only in
  internal/brainstorm copies.
