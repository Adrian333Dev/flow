# Who plays the sound, and who colors the words

**Date:** 2026-07-22 (v2 — full rewrite same day)
**Topic:** t01-reading-engine · Branch C5 (playback & interaction controller)

## What prompted this

During C5 the user asked two plain questions (no prior background in browser audio):
1. "Why are we using the Web Audio API? Does it just play the audio we generated in the browser?"
2. "Why not just keep all the words + the active word in React state, and play the right audio
   from that?"

**v1 of this file failed.** It used "Screen" and "Audio" as actor labels without ever defining
what those things are, and the user could not follow it at all. Lesson locked in: **define every
actor from zero — what it literally is and its one responsibility — before it may appear in any
diagram.** No shorthand before its definition.

---

## The app, from the user's seat

A web page. You paste text → the words appear on the page. You press play → a voice reads the
text out loud through the speakers, and the word being spoken right now is highlighted,
karaoke-style.

## The three jobs the code has to do

| Job | What it literally does | Tool |
|---|---|---|
| 1. Make the sound | Turn each sentence into a small sound file + a timing sheet | HeadTTS |
| 2. Play the sound | Play the files through the speakers, gapless, jump to any second | Web Audio |
| 3. Draw the page | Show the words and buttons; color the active word | React |

Definitions (each in one breath):

- **Sound file** — like an MP3, one per sentence, made by HeadTTS from the text.
- **Timing sheet** — comes with every sound file: "word 1 is spoken 0.4s–0.6s, word 2 is spoken
  0.6s–0.9s, …". This is what makes highlighting possible.
- **Web Audio** — the browser's built-in precise sound-file player. Nothing more. Creates no
  sound; plays what HeadTTS made. Used instead of the browser's basic player because the basic
  one can't chain many small files without gaps and can't report its position precisely.
- **React** — a tool for writing the page-drawing code. Our code keeps a record ("active word
  = 12"); React makes the page match it (colors word 12). Change the record → the page changes.

Shorthand for the rest of this file — now that both are defined:
**the player** = Job 2's code. **the page** = Job 3's code.

---

## The key question: who knows which word is being spoken?

Only the player. It always knows its exact position ("I'm 3.2 seconds into this file"), and the
timing sheet translates position → word (3.2s = word 12). A stopwatch running in page code
drifts out of step with the real sound within a minute — so the active-word number must come
FROM the player, not be guessed by the page.

```
Everything you DO flows down:      you → the page → the player     (play, click a word, speed)
The active-word number flows up:   the player → the page           ("active word = 12" → color it)
```

The page still holds all the words and the active word in its record — exactly the user's
intuition. It just receives WHICH word from the player instead of guessing.

---

## Walk it through — two everyday actions

Read each line as "who → whom : what".

```
WHEN YOU PRESS PLAY
  you         → the page   :  click the play button
  the page    → the player :  "start playing"
  the player  :               plays the sentence sound files back-to-back through the speakers
  the player  :               checks its position against the timing sheet: "3.2s in = word 12"
  the player  → the page   :  "active word = 12"          ◄─ repeats many times a second
  the page    :               colors word 12 yellow
```

```
WHEN YOU CLICK WORD 47
  you         → the page   :  click word 47
  the page    → the player :  "jump to word 47"
  the player  :               timing sheet says word 47 starts at 14.8s → restarts the file there
  the player  → the page   :  "active word = 47"
  the page    :               colors word 47 yellow; the voice continues from there
```

---

## Design reasoning

- **Ground before diagram.** The failure in v1 was undefined actors. v2 opens with the app as the
  user experiences it, then defines every term (sound file, timing sheet, Web Audio, React) in
  one plain sentence each, and only then introduces the shorthand used in the sequences.
- **"Timing sheet" as the load-bearing concrete object.** Instead of abstract talk about
  "timestamps" or "wtimes", the file gives the artifact a household name and shows its literal
  content. Both walkthroughs reference it explicitly so the reader sees where the word number
  comes from.
- **Sequence-style lines for the two-way exchange** (per CLAUDE.md: ASCII boxes carry handshakes
  poorly). Lines with no arrow-target are the actor doing something alone, which keeps internal
  steps (position lookup) visible without inventing a fake recipient.
- **Single concept, still.** Only "who plays vs who colors, and which way the word number flows."
  Hard cases (jumping into a not-yet-generated region, stalls, speed change) stay out — they get
  their own visuals after this lands.

## Self-critique

- "Many times a second" stays deliberately vague (no rAF / frame terminology) — right call at
  this stage, but a later technical visual must reconcile with this one.
- The definitions block is longer than the diagrams. Acceptable here because the definitions ARE
  the fix; a reader who already has them can skip straight to the sequences.
- "The player tells the page" compresses reality (our code polls the player's clock and updates
  the record) — the direction of information flow is truthful, the mechanism is simplified on
  purpose.
