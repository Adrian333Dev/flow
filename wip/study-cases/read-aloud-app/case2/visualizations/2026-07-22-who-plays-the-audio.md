# Who plays the sound, and who moves the highlight (v3)

**Date:** 2026-07-22 · t01-reading-engine · C5

## The two pieces of our code

- **UI layer (React)** — the components that render the word list and the play/pause button.
  State: `words[]` and `activeWordIndex`. Rendering rule: the word at `activeWordIndex` gets the
  highlight style. ("Screen" in earlier drafts meant this module, not the monitor.)
- **Playback controller (plain JS module, no React)** — owns the per-sentence audio clips from
  HeadTTS and their word-timing data. Plays them via the **Web Audio API**: browser-built-in
  functions for sound playback with an exact clock ("3.217s into this clip"), gapless
  back-to-back scheduling, and starting any clip from any millisecond offset. Web Audio creates
  no sound — it plays the clips we already generated. (A plain `<audio>` tag can't do this job:
  no precise clock, audible gaps between clips, coarse seeking.)

## The one non-obvious rule

**`activeWordIndex` is written by the playback controller, not computed in React.**

"Which word is being spoken right now" can only be derived from the exact playback position, and
only Web Audio's clock has it. A React-side timer (`setInterval` advancing the word on schedule)
drifts away from the real audio within tens of seconds — browsers don't fire timers on time.

```
commands go down:   UI → controller     play() · pause() · seekToWord(n) · setSpeed(x)
position comes up:  controller → UI     setActiveWord(n)    (every frame)
```

## Walkthroughs

```
PRESS PLAY
  UI          → controller :  play()
  controller  → Web Audio  :  schedule clip 1, then clip 2, back-to-back
  controller               :  every frame: read clock → timing data → "word 12"
  controller  → UI         :  setActiveWord(12)
  UI                       :  re-render, word 12 highlighted
```

```
CLICK WORD 47
  UI          → controller :  seekToWord(47)
  controller               :  timing data: word 47 = clip 3, offset 14.8s
  controller  → Web Audio  :  stop current; start clip 3 at 14.8s
  controller  → UI         :  setActiveWord(47)
```

---

*Study-case metadata (kept per CLAUDE.md; v1/v2 preserved as sibling files for the framework
study pass).*

**Input:** v1 failed on undefined actors ("Screen", "Audio" used as labels with no referent).
v2 over-corrected: defined universally-obvious things (sound file, React basics) while still
never pinning the actors to concrete modules of this app; opened with preamble restating what
the file is about; user also banned validation phrasing ("you're absolutely right").

**Reasoning:** calibrate to the actual gap — the reader knows React and general computing, not
browser audio or this app's internal architecture. So: name the two concrete code modules first,
define only the genuinely unfamiliar thing (Web Audio, by its three abilities vs `<audio>`), and
spend the depth on the single non-obvious rule (who writes `activeWordIndex`, and why timer
drift forbids the alternative). Content leads; metadata demoted to the bottom.

**Self-critique:** "every frame" introduces frame terminology without defining rAF — judged
closer to code and better than v2's vague "many times a second". Walkthroughs use function-call
notation (`play()`, `setActiveWord(n)`), assuming comfort reading code — matches the reader.
"Clip 3" appears in the seek walkthrough without stating that words map to clips via chunking —
relies on the reader's existing knowledge of the chunking design from the brainstorm.
