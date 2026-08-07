# Who plays the audio, and who highlights the words

**Date:** 2026-07-22
**Topic:** t01-reading-engine · Branch C5 (playback & interaction controller)

## What prompted this

During C5 the user asked two plain questions and said my earlier explanation was too jargon-heavy
to follow (no prior background in browser audio):
1. "Why are we using the Web Audio API? Does it just play the audio we generated in the browser?"
2. "Why don't we just keep all the words + the active word in React state, and play the right audio
   from that?"

The confusion to clear up: the difference between **the screen (React state)** and **the audio
engine (Web Audio)**, and — the crux — **which direction the highlight flows.**

---

## The three pieces, and the ONE job each has

| Piece | Plain name | Its one job |
|---|---|---|
| HeadTTS | the voice maker | Turn text into sound **+ per-word timings**. Feeds the audio engine. |
| Web Audio | the audio engine | **Play** the sound clips · keep the **exact clock** · **jump** to any point. |
| React | the screen | **Show** the words · **light** the active one · play/pause buttons. |

The audio engine does NOT create sound (HeadTTS does). The screen does NOT play sound or keep time
(the audio engine does). Each piece has one job.

---

## The one rule that fixes the confusion

```
   Commands go DOWN  ─────────────►   You → Screen → Audio engine   ("play", "jump to word 47")

   The highlight comes UP  ────────►   Audio engine → Screen         ("we're on word 47 → light it")
```

React holds the word list and the active word — exactly as expected. It just learns *which word is
active* FROM the audio engine, because only the audio knows precisely where the sound is right now.
(A React timer can't do it — it slowly drifts out of sync with the real sound.)

---

## Walk it through — two everyday actions

Read each line as "A → B: message".

```
WHEN YOU PRESS PLAY
  You     → Screen :  "play"
  Screen  → Audio  :  "start playing"
  Audio   → .......:  plays the sentence clips back-to-back, keeps the exact clock
  Audio   → Screen :  "we're on word 12 now"      ◄─ repeats ~60x a second
  Screen  → You    :  word 12 lights up
```

```
WHEN YOU CLICK A WORD  (say word 47)
  You     → Screen :  "clicked word 47"
  Screen  → Audio  :  "jump to word 47"
  Audio   → .......:  stops, restarts the sound starting at word 47
  Audio   → Screen :  "we're on word 47 now"
  Screen  → You    :  word 47 lights up, voice continues from there
```

---

## Design reasoning

- **Format choice:** a two-way handshake (commands down / highlight up) is the exact thing CLAUDE.md
  says inline ASCII boxes carry *poorly* — so the core is shown as a sequence-style "A → B: message"
  flow, plus one small responsibility table for "who is who." No boxes-and-arrows tangle.
- **Single concept, on purpose.** The previous viz (2026-07-21-full-architecture, 7 diagrams) was too
  much at once. This file teaches exactly one idea: screen vs audio engine, and the highlight flows
  UP. Everything else about C5 is deferred to later, separate visuals.
- **Plain labels.** "the voice maker / the audio engine / the screen" instead of HeadTTS / Web Audio /
  React, so a first-time reader parses it without prior knowledge; the real names sit in the table.
- **Concrete before abstract.** The two "walk it through" scenarios use real actions (press play,
  click a word) rather than describing the mechanism in the abstract.

## Self-critique

- The two scenarios both end in "Screen → You: word lights up," which slightly over-repeats; kept it
  for symmetry so each scenario reads as a complete loop.
- "repeats ~60x a second" hints at the animation-frame loop without naming it — deliberately vague to
  avoid a new term, but a curious reader gets no handle to look it up. Acceptable at this stage.
- The table lists HeadTTS even though the confusion was really screen-vs-audio; included so the reader
  sees where the sound *comes from* and doesn't think the audio engine invents it. Minor scope creep,
  judged worth it.
- Does not yet show the hard cases (jumping into a not-yet-generated region, buffering stalls). That's
  intentional — those come after this foundation lands, as their own visual.
