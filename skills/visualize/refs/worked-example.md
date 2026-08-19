# Worked example — stripped excerpts, NOT the full artifact

A complete explanation of a playback architecture, for a reader who is strong in React with no browser-audio background. Only its key moves appear below; the full version defined the *other* component the same way, wrote both key interactions as prose steps, and closed with its two decision points. A real explanation has no gaps between these moves.

**The opening — the whole picture, before any part:**

> Playback lives entirely outside React. A plain TypeScript module — the **playback controller** — plays the sound and tells React which word is active, every frame. React draws what it's told and never calculates the highlight itself.

**A component defined from zero** (the user is a React expert — but this module is ours, so it's new; the one unfamiliar tech term gets defined by its abilities):

> **Playback controller** — a plain TS module, no React anywhere in it. It owns the **audio clips** (one per chunk, already synthesized) and the **timing table** (for every word: which clip it lives in, at which millisecond). It plays the clips through the **Web Audio API** — the browser's built-in sound engine. We need it for exactly three abilities a plain `<audio>` tag doesn't have: an exact playback clock, gapless back-to-back playback, starting any clip at any millisecond.

**The whole-picture diagram** — layered stack; the two-way asymmetry is the design:

```
┌────────────────────────────────────┐
│         UI LAYER  (React)          │
│                                    │
│  state:  words[] / activeWordIndex │
│  draws:  word list / controls      │
└────────────────────────────────────┘
      │                        ▲
      │ commands               │ the active word
      │                        │
      │ play() / pause()       │ setActiveWord(n)
      │ seekToWord(n)          │ every frame
      │ setSpeed(x)            │
      ▼                        │
┌────────────────────────────────────┐
│  PLAYBACK CONTROLLER  (plain TS)   │
│                                    │
│  owns:  audio clips / timing table │
└────────────────────────────────────┘
                  │
                  │ schedule clips / read the clock
                  ▼
┌────────────────────────────────────┐
│           WEB AUDIO API            │
│   (browser built-in sound player)  │
└────────────────────────────────────┘
```

**The load-bearing rule, with depth** — the one non-obvious idea gets the why and the failed alternative:

> **`activeWordIndex` is written by the controller — never computed in React.** The obvious alternative — a React-side `setInterval` advancing the word on schedule — drifts: browsers throttle and delay timers, so within tens of seconds the highlight and the voice visibly disagree. Web Audio's clock can't drift, because it isn't an estimate of the audio position — it *is* the audio position.

**The close:** key interactions as short prose steps ("Press play: the controller schedules the clips..."), then exactly two decision points ("Playback code fully outside React — OK?").
