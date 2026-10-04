# SkilLock

Read 2026-10-04 from `repos/tools/skil-lock/`. 6 stars, Apache 2.0. Records what each skill can touch in a committed `skills.lock`: the shell commands, network hosts and file paths named in it. On every pull request it shows what changed, such as a skill gaining `curl` or a read of `.env`, and blocks until someone approves.

## Against Flow

**Flow updates outside skills by itself.** `scripts/jobs/skills-pull.js` pulls every skill repository at session start, and each skill is a symlink into its clone. A skill gaining `curl … | bash` in an update reaches every project the next session, unseen. The 2 guards before a pull check for local changes and a non-fast-forward, never for what the update adds.

## What Flow could take

**Show what an update adds before it lands**: new commands, hosts and paths in the changed skill files, printed where `~/.flow/skills-update.json` already reports waiting updates. `lab/backlog/after-v1.md` → the skill update item.
