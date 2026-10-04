# CC Safety Net

Read 2026-10-04 from `repos/tools/cc-safety-net/`. About 1,600 stars, MIT. A hook that blocks destructive commands and secret reads, for Claude Code, Codex and 5 more agents.

## How it works

- **It reads what a command does**, through `bash -c`, `python -c` and wrappers, as Flow's guard does.
- **It blocks reading secrets**: SSH keys, `.env` files, `~/.aws` and the agents' own credentials, from the shell and from the agent's file tools.
- **3 modes**: standard, strict and paranoid.
- **It states its threat model.** Standard mode stops a helpful agent's accidents and is not bypass-proof. A crafted bypass is a strict-mode case. `docs/residual-risk.md` lists the bypass families it accepts.

## Against Flow

**Flow misses secret reads.** `home/settings.json` denies `Read(~/.ssh/**)` and `Read(~/.aws/**)`, the file tool alone. `cat ~/.ssh/id_ed25519` runs through the shell unasked, and nothing covers a `.env` file. A secret read lands in the transcript, which goes to the model's servers.

## What Flow could take

- **Secret reads as a sixth harm**: `lab/backlog/after-v1.md` → the secrets item.
- **Its tests as guard cases**, 253 test files: `lab/backlog/after-v1.md` → the guard test item.
- **A threat model sentence** for `docs/safety.md` → `## The guard`: it stops accidents and was never built to stop an attack. Joined to the same item.
