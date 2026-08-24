---
name: prototype
description: ALWAYS invoke when a session opens on a `prototype` ticket, or on a handoff asking for throwaway code that answers one named question — a claim about how a tool really behaves, a cost nobody has measured, a state model that has to be driven to be judged, a look only real components, real data and motion can settle. Builds the smallest thing that answers it, then reports what it found. A job that is only reading documentation or source is `research`, never this. A static preview file is `visualize`, never this.
---

# Prototype

Code written to answer one named question, then deleted.

**Naive on purpose.** No tests, no error handling, no abstractions. The real build reads the prototype as a reference and starts again — nothing written here is ever promoted.

**Two sessions.** Groundwork that hits a question talking cannot settle cuts a child ticket typed `prototype`, carrying the question, and waits. A fresh session picks that ticket up and builds. **Never do both in one session** — the session that invented the question will accept a vague one, because it already knows what it meant.

**Talking failed and reading failed — that is the entry condition.** A page of documentation costs less than code, so where reading would settle the question, reading settles it and nothing gets built.

## What the ticket must carry

Groundwork writes these into the ticket body. The building session checks they arrived, and stops if they did not. Handed over without a ticket, it is the same three wherever the handoff put them.

- **The question, in one sentence.** Three at most — past three it is a project.
- **Pass and fail**, for a question that can come out false. What each answer means, and what each one changes. Skip a question whose two answers lead to the same decision.
- **The comparison plan**, for a question only the user can judge. What is being compared, and how many variants. Pass and fail do not exist here; the user's reaction is the result.

The `handoff` skill covers everything else a picked-up job needs — what turns on the answer, what is already set up, what was found, what to say back. Never restate any of that here.

**Missing pass and fail → stop and ask.** Criteria written after the run match whatever came out.

**Everything arrived → `flow build <id>`**, then stand it up. Skip the move where a `→ building` line above shows `/start` already made it. A prototype has no phase before building.

### When the approach is not obvious

Confirm it in one message before standing anything up: what gets built, which library and version, the fallback route if the machinery will not run, and how many variants a judged question needs. Then build.

Nothing here reaches disk — the report is the deliverable, and the ticket stays in `building` throughout. Interrupted mid-round, `## State` in `ticket.md` carries what was agreed.

### When the question is about appearance

**Colour, density and type weight cost one round in `visualize`** — one HTML file, opened from disk, no session split. Where only the running stack answers it — real components, real data at volume, motion, a device — build a prototype.

**Lock the layout first, in `visualize`.** ASCII carries layout, so the rounds happen there and cost little — several frames side by side, one chosen. Everything after works on a frozen frame. Reverse the order and every expensive round redraws boxes that were never wrong.

## 1. Stand it up before testing anything

Prove the machinery runs once, on the simplest input, before asking any question of it. Name a fallback route in advance.

Most prototypes die here rather than in the test. The `tts-lab` harness needed a device override, an absolute path for a module its worker thread could not resolve, and a launch directory the package hard-codes — three traps, all in setup, all found before the first test ran.

## 2. Build only what the question needs

Build nothing that serves a second purpose. Cut tests, error handling past runnable, abstractions and persistence — persistence is what a prototype checks, never what it leans on.

**Size comes from the dependency, never the harness.** `tts-lab` filled 779 MB because the speech model ships that way; its own code was 441 lines. A large folder is fine. A large harness means the question grew while nobody watched.

**Print the full state after every action**, so the user reads what changed instead of inferring it.

## 3. Report what you found

**`reports/<question>.md` in the ticket folder**, named after what it answers, one file per question. No ticket → `REPORT.md` beside the code.

- **Measured** → top-line answers first, in the words the question used. Give the numbers. A verdict alone rots: "timestamps are fine" means nothing in six months, "ratio 0.83 to 1.01, no desync" still does. Keep the raw output beside it and cite the code by its `protos/` path.
- **Judged** → show the variants. Attach no recommendation until the user has looked.

Then say the answers out loud, in the words the question asked for, and stop there. `flow review <id>` hands it over, and `flow done <id>` closes it once the user accepts the answer. Groundwork reads the report and closes its own branch.

## Where it lives

- **`protos/<name>/`** — repo root, flat, named by what it proves. Never under `docs/`, which stops being documentation once code lives in it
- **Committed** — the scripts, and the report wherever it landed. The spec cites them for years
- **Ignored** — `node_modules/`, model caches, generated media. One harness reached 779 MB

## When it is not a prototype

Give each unknown its own prototype. One prototype for a whole system answers nothing precisely.

A generated-video pipeline has a script step, an image step, a voice step and an assembly step. Each unknown gets its own. Wiring those prototypes together into something that runs end to end is fine, and often the point — it stays a set of naive parts, and the real version gets written afterwards from the spec.

**Spans more than one session → split it.**

## Hard rules

- **Never start a prototype nobody asked for.**
- **Never build in the session that named the question.**
- **Write pass and fail before building**, on every measured question.
- **Never build one variant** for a judged question. One variant gets approved by default.
- **Lock the layout in `visualize` first.** A running prototype never settles layout.
- **Never promote prototype code.** The real build reads it, then starts again.
- **The report is the deliverable**, never the code.
- **Never write to `map.md`.** Groundwork closes its own branch.
