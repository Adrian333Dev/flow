# gstack

Read 2026-10-04 from `repos/workflows/gstack/`. Garry Tan's Claude Code setup, about 135,000 stars, MIT. Its pitch: "a virtual engineering team", 23 specialists and 8 power tools, all slash commands.

## How it works

**56 skills run as a sprint**: think, plan, build, review, test, ship, reflect. `/office-hours` writes a design doc, and every later skill reads what the one before it wrote. Each skill is a role:

- `/plan-ceo-review` rethinks the product
- `/plan-eng-review` locks the architecture and writes a test plan
- `/review` hunts bugs and fixes the obvious ones
- `/qa` drives a real browser
- `/ship` opens the pull request
- `/retro` runs a weekly retrospective

**The skills are long, and their descriptions short.** Most `SKILL.md` files run 900 to 1,900 lines, 37,645 lines in all, generated from templates. The 56 descriptions total 4,200 characters, since the "when to invoke" text moved into each body. A session starts light, about 1,000 tokens, and each run loads 10,000 or more.

**A learning is one JSON line in a per-project log.** Skills write `type`, `key`, `insight`, a `confidence` from 1 to 10, a `source`, and the `files` it concerns. A later run prints "Prior learning applied" when a finding matches. `/learn` searches and prunes the log. A learning whose files were deleted gets flagged as stale.

**Hooks are mostly opt-in.** `/careful` warns before `rm -rf`, `DROP TABLE` and a force-push. `/freeze` limits edits to one folder. Each one registers its hook only while active. Setup adds one `Stop` hook, a session timeline. `gstack-verify-gate`, opt-in, keeps a turn from ending until the project's test command passes, and gives up after 3 tries.

**Sessions carry over by hand**: `/context-save` and `/context-restore`.

**Install** clones into `~/.claude/skills/gstack/` and runs `./setup`, which needs Bun, builds binaries and downloads Chromium. Team mode checks for updates once an hour. Claude Code is the one fully supported host, with Codex, Cursor and 4 more experimental.

## Against Flow

What gstack has that Flow lacks:

- a real browser for QA, design mockups, and a deploy step
- support for 7 agents
- a team mode

What Flow has that gstack lacks:

- **Tickets.** gstack's work lives in design docs and pull requests.
- **An automatic handoff.** gstack saves context only when asked.
- **Learning that changes the agent.** A gstack learning stays a line in one project's log. Flow files a lesson into its own rules, its skills and a wiki every project reads.
- **Sync across machines**, and **skill management**.
- **A guard always on.** gstack's guard runs only after `/careful`.

## What Flow could take

- **A learning names its files, and goes stale when they go.** A cheap check for a stored note: `lab/research/compound-engineering.md` → idea 2.
- **`gstack-context-bill`**: what a skill set costs at every session start against what each run costs. Flow measured the first by hand on 2026-10-04, in `lab/research/compound-engineering.md` → `## What each loads into a session`.
- **`/plan-tune`**: the user marks a question "never ask". Flow reaches the same through a correction filed as a preference, so nothing to take.
