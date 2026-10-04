# Contenders

The whole workflows Flow competes with, compared 2026-10-04 against their clones in `repos/workflows/`. The user's question: does a tool already do what Flow does? Each has its own file in `lab/research/`.

## No tool does what Flow does, and every piece of it exists somewhere

Each part of Flow has a match in another tool. No tool carries tickets, an automatic handoff, learning written into its own rules and skills, and sync across machines together. None of the 33 clones has that, and no entry among the about 215 in `awesome-claude-code` claims it.

What would overturn it: one tool holding those 4 together. ECC comes closest on learning, and Pilot Shell on shape.

## The contenders

- **Superpowers**: about 295,000 stars, MIT. A skill set with 1 hook.
- **ECC**: about 272,000 stars, MIT. 286 skills, 68 agents, hooks, and "instincts" that grow into skills. `ecc.md`.
- **gstack**: about 135,000 stars, MIT. A sprint of 56 long skills, opt-in guard hooks, a learnings log per project. `gstack.md`.
- **Compound Engineering**: about 25,000 stars, MIT. 36 skills, no hooks, a lesson file per solved problem. `compound-engineering.md`.
- **Pilot Shell**: about 2,100 stars, paid and closed. Hooks around every step, background memory, a context meter. `pilot-shell.md`.

## Who has each piece

Row by row, in the README's order:

- **Design before code**: all 5. Flow alone researches every open decision and tests the design on real cases.
- **Task tracking**: none of the 5 has tickets. Separate tools do, such as `claude-task-master`.
- **Long sessions**: Pilot Shell warns at 90% and restores the plan after compaction. gstack and Compound Engineering hand off when asked. Flow hands off by itself at 150,000 tokens.
- **Self-improvement**: Compound Engineering keeps lessons per repository, gstack a log per project, Pilot Shell a memory store. ECC grows instincts into skills. Flow alone writes lessons into its own rules, its skills and a wiki every project reads.
- **Rule enforcement**: Pilot Shell checks code style per language. Flow alone checks its own rules on every edit.
- **Multi-machine sync**: Flow alone, uncommitted code included. The rest carry what git carries.
- **Skill management**: Flow alone.
- **Hooks and guardrails**: ECC and Pilot Shell run hooks always, gstack's guard only after `/careful`, Superpowers and Compound Engineering none to speak of. Pilot Shell has no destructive-command guard.
- **Supported agents**: every contender supports more than Flow's 1.

## Where Flow loses

- **Proof.** The contenders have users. Flow has never run on a real project, and its guard has never met a live session.
- **Agents.** Claude Code only.
- **Session start.** About 4,000 tokens, against gstack's 1,000, Superpowers' 1,400 and Compound Engineering's 2,200. gstack pays later: each of its skills loads 10,000 tokens or more when it runs.
- **Reach.** gstack drives a browser, makes design mockups and deploys.
