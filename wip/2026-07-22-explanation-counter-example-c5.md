# Who plays the audio, and who moves the highlight

## The proposal in one breath

Playback lives entirely outside React. A plain TypeScript module — the **playback controller** — plays the sound and tells React which word is active, every frame. React draws what it's told and never calculates the highlight itself. Everything below explains those two sentences.

## The two pieces of code

**UI layer** — our React components: the word list and the play/pause/speed controls. State: `words[]` and `activeWordIndex`. Rendering rule: the word at `activeWordIndex` gets the highlight style. It draws state — nothing else.

**Playback controller** — a plain TS module, no React anywhere in it. It owns two things:

- the **audio clips** — one short clip per chunk (the sentence-ish pieces the text was cut into), already synthesized by HeadTTS
- the **timing table** — for every word: which clip it lives in, and at which millisecond of that clip it is spoken

It plays the clips through the **Web Audio API** — the browser's built-in sound engine, the one genuinely new term here. We need it for exactly three abilities a plain `<audio>` tag doesn't have: an exact playback clock ("we are 3.217s into clip 2"), gapless back-to-back playback of many clips, and starting any clip at any millisecond. It creates no sound — it plays the clips we already have.

## The whole picture

```
┌────────────────────────────────────┐
│         UI LAYER  (React)          │
│                                    │
│  state:  words[] · activeWordIndex │
│  draws:  word list · controls      │
└────────────────────────────────────┘
      │                        ▲
      │ commands               │ the active word
      │                        │
      │ play() · pause()       │ setActiveWord(n)
      │ seekToWord(n)          │ every frame
      │ setSpeed(x)            │
      ▼                        │
┌────────────────────────────────────┐
│  PLAYBACK CONTROLLER  (plain TS)   │
│                                    │
│  owns:  audio clips · timing table │
└────────────────────────────────────┘
                  │
                  │ schedule clips · read the clock
                  ▼
┌────────────────────────────────────┐
│           WEB AUDIO API            │
│   (browser built-in sound player)  │
└────────────────────────────────────┘
```

One direction each: commands go down, the active word comes up. That asymmetry is the entire design.

## The rule everything hangs on

**`activeWordIndex` is written by the controller — never computed in React.**

"Which word is being spoken right now" can only be derived from the true playback position, and only Web Audio's clock has it. The obvious alternative — a React-side `setInterval` advancing the word on schedule — drifts: browsers throttle and delay timers, so within tens of seconds the highlight and the voice visibly disagree. Web Audio's clock can't drift, because it isn't an estimate of the audio position — it *is* the audio position.

So the loop is: every frame the controller reads the clock, looks it up in the timing table ("3.2s into clip 2 = word 12"), and calls `setActiveWord(12)`. React re-renders. That is the whole highlight mechanism.

## The two interactions that matter

**Press play.** Controller schedules the clips back-to-back in Web Audio and starts the per-frame loop above. Words light up as they're spoken.

**Click word 47.** UI calls `seekToWord(47)`. The timing table says word 47 = clip 3 at 14.8s. The controller stops what's playing, starts clip 3 at 14.8s — Web Audio's start-anywhere ability — and calls `setActiveWord(47)`. The voice continues from the word you clicked.

## What you're deciding

1. Playback code fully outside React — OK?
2. The highlight driven *by* the controller (React receives it, never computes it) — OK?

---

*Design-lab artifact (session 13): the failed C5 explanation from `temp/study-cases/read-aloud-app/case2/visualizations/` rewritten under the draft explanation-skill rules, as a validation sample.*
