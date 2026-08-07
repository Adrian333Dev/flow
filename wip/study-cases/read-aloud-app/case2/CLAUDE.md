# CLAUDE.md — working rules for this repo

Standing rules and durable context. This file replaces the per-project "memory" system,
which is no longer used.

## Memory system: DO NOT USE

Never use the persistent memory system: do not create or edit files under
`~/.claude/projects/**/memory/`, and do not write or update `MEMORY.md`. It is prohibited.
Put durable info **here** in `CLAUDE.md` if it's global, or in the relevant project file
(a topic's `brainstorm.md`, context files, or a skill's own docs) if it's project-specific.

## How to work with the user

- **Never use the AskUserQuestion tool.** Ask questions in free-form prose in your normal reply;
  the user answers inline. Applies even in brainstorming / plan mode.
- **Never do git mutations.** Read-only git (`status` / `log` / `show` / `diff`) is fine when you
  need to look something up. Never `add` / `commit` / `branch` / `checkout` / `mv` / `rm` / `push`,
  and don't offer to — the user manages version control themselves. At a natural commit point, just
  report it's done and stop.
- **Capture only on decisions.** Do NOT write running design commentary into `brainstorm.md` or other
  working docs every turn. Write only when an actual decision is locked, and batch related ones. Hold
  exploratory thinking in the conversation.
- **Don't prematurely narrow scope.** When designing something general, capture broadly and keep all
  layers first-class; reason about the full range of future use cases before dropping anything.
- **Keep explanations plain and concrete.** The user dislikes overly-complex explanations. Don't
  assume they've read background material — establish what a thing *is* before how it works.
- **HARD RULE — all explanations go at the END of the turn, after every tool call.** The user only
  reads the final message of a turn. Any prose written before or between tool calls (edits, file
  writes, commands) is effectively invisible to them. Do the tool work first, then deliver the full
  explanation in the closing message — never split it around edits, and never assume text written
  before a tool call was seen. If an earlier turn violated this, re-deliver the explanation in full.
- **Calibrate explanations to the actual gap.** The user is a developer: never define
  universally-obvious things (what a sound file is, React basics). DO define project-specific
  referents (which concrete module a shorthand like "the screen" points to) and genuinely
  unfamiliar domain terms (e.g. browser audio internals). No validation phrasing ("you're
  absolutely right") — go directly to the point.

## Visualizations

- **The current approach is UNVALIDATED — pending redesign.** The sequence-style text formats from
  the local `visualization` skill performed badly in practice (user verdict 2026-07-22: "worked
  absolutely horrible"). A separate brainstorm session will design a better explanation/visualization
  framework. Study-case corpus + full feedback report:
  `real-aloud-app/docs/work/topics/t01-reading-engine/visualizations/2026-07-22-explanation-study-case-report.md`
  (plus the v1/v2/v3 files beside it).
- **Prose first.** Escalate to a diagram only when a written explanation genuinely won't land. The
  local `visualization` skill (partial: `SKILL.md` + `references/text-formats.md`) is available.
- Inline ASCII carries *structure* well but *two-way interactions / handshakes* poorly — use a
  sequence-style "A → B: message" flow or prose for those.
- **Always save any visual to a file:** a dated file under the topic's `visualizations/` folder, WITH
  the input that prompted it + design reasoning + a short self-critique. The user runs a later
  study-case pass to improve visuals, so the reasoning matters as much as the picture.

## Farming research to external LLMs

- Primary: **Claude with web search** (best critical coverage + citation integrity).
- Backup / second opinion: **ChatGPT Deep Research** (well-calibrated, no fabrications, but shallower).
- Caution: **DeepSeek** — fabricates authoritative-looking citations (invented the Misaki repo org);
  mine it for mechanisms, verify every named artifact/citation.
- Avoid for anything critical: **Gemini** (under-verified, broken citations, bad install commands).

## Other project — `debug-web-pages` skill

Project-local skill at `.claude/skills/debug-web-pages/` that reverse-engineers live web pages you
don't control. Two modes (capture + live-experiment), one loop: understand → hypothesize → probe →
intervene → verify → record. NOT a superpowers skill. Build it **incrementally (thin slices), NOT via
superpowers `writing-plans`.** Validation loop: the user pastes `capture.js` into their own Chrome
console, drops `capture.json` + `console.log` at `page-capture/temp/`; unpack with `-o
page-capture/captures`. Detail lives in the skill's own `SKILL.md` / `DESIGN.md` / `ROADMAP.md` /
`knowledge/`.
- **NEXT there:** run the scrub-back live experiment (`delapse/scrub-back-spike.md`) to resolve
  ArrowLeft(←) interception on YouTube — first real exercise of live-experiment mode.
