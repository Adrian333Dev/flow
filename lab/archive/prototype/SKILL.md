---
name: prototype
description: Naive code answering one question, kept in its ticket beside a report of what it found. Never promoted into the real build.
---

# Prototype

**A fresh subagent builds it**, on a child ticket typed `prototype` that `/flow:groundwork` cuts. **Never build in the session that asked.** The subagent sees the ticket and nothing else.

**Never start a prototype nobody asked for.**

## When it is not a prototype

**Build only once talking and reading have both failed.** Where documentation would settle the question, read it and build nothing.

**Colour, density and type weight → one HTML file in `/flow:visualize`.** Build a prototype only where the running stack answers it: real components, real data at volume, motion, a device.

**Lock the layout in `/flow:visualize` first**: several ASCII frames side by side, one chosen. The prototype works on the frozen frame.

## What the ticket must carry

`/flow:groundwork` writes these into the ticket body. Check that each one applying to this question arrived. Any missing → stop and ask.

- **The question, in one sentence.** 3 at most: past 3 it is a project.
- **Pass and fail**, for a question that can come out false: what each answer means, and what each one changes. Skip a question whose 2 answers lead to the same decision.
- **The comparison plan**, for a question only the user can judge: what is compared, and how many variants. **Never one.** No pass and fail: the user's reaction is the result.

The rest of the body follows `/flow:handoff`.

**Everything arrived → `flow build <id>`.** No phase comes before building.

## 1. Stand it up before testing anything

**Approach not obvious → confirm it in one message first**: what gets built, the library and version, the fallback route if the machinery will not run, and how many variants a judged question needs. The ticket stays in `building`. Interrupted → `## State` in `ticket.md` carries what was agreed.

Prove the machinery runs once, on the simplest input, before asking it anything. Name a fallback route in advance.

## 2. Build only what the question needs

Build nothing that serves a second purpose. Cut tests, error handling past runnable, abstractions, and any persistence the question does not test.

**Keep the harness small. A large folder is fine**: `tts-lab` was 779 MB of speech model around 441 lines of code. A large harness means the question grew.

**Print the full state after every action.**

## 3. Report what you found

**The report is the deliverable, never the code.** Write `reports/<question>.md` in the ticket folder, named after what it answers, one file per question.

- **Measured** → top-line answers first, in the question's words, with the numbers: "ratio 0.83 to 1.01, no desync", never "timestamps are fine". Keep the raw output beside it. Cite the code by its `protos/` path.
- **Judged** → show the variants. Attach no recommendation until the user has looked.

Then tell the user the answers, in the question's words, and stop. `flow review <id>` hands the ticket over. `flow done <id>` closes it once the user accepts the answer.

**Never write to `map.md`.** `/flow:groundwork` reads the report and closes its own branch.

## Where it lives

- **`.flow/tickets/<id>/protos/<name>/`**: one folder per prototype, named by what it proves.
- **No ticket** → `flow new "<question>" --type prototype` first. Outside a project it lands in `~/.flow/tickets/`.
- **Saved**: the scripts and the report.
- **Ignored**: `node_modules/`, already, at any depth. Model caches and generated media → a `.gitignore` inside `protos/<name>/`.

## One prototype per unknown

A video pipeline with an unknown in each of its script, image, voice and assembly steps is 4 prototypes. Wiring them together end to end is fine. They stay naive parts.

**Spans more than one session → split it.**
