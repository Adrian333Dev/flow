# codealmanac

993 stars, YC S26. A living wiki for codebases, maintained by AI coding agents. The wiki is plain markdown in `almanac/` within the repo, indexed locally with SQLite + FTS5, and reviewed in Git like any other code change. The cleanest design philosophy of all repos studied.

## Core mechanism — intelligence in prompts, not pipelines

Three agents do all the work:

1. **ingest** — folds material (files, diffs, commits, PRs, transcripts, URLs) into the wiki. Decides what is worth adding. No-op is valid: if the material adds no durable knowledge, the wiki stays unchanged.
2. **garden** — reviews the wiki for stale pages, weak links, duplicated knowledge, and poor graph structure. Runs as periodic maintenance.
3. **sync** — scans Codex and Claude transcripts for conversations that produced durable knowledge and queues them as ingest jobs.

All three run as background macOS `launchd` jobs on a schedule (sync every 5h, garden every 24h). No human intervention required for ongoing maintenance.

The key design principle: judgment lives in the prompts, not in orchestration code. No propose/review/apply state machines, no intermediate proposal files, no `--dry-run` rehearsals. The agent writes directly; humans read the diff in `git status`.

## Wiki structure

```
almanac/
├── README.md
├── topics.yaml
├── architecture/
│   ├── README.md
│   └── indexing.md
├── decisions/
│   └── local-first.md
└── guides/
    └── setup.md
```

Pages are atomic markdown files. Page identity is the path under `almanac/` without `.md`. Topics form a DAG (not a folder tree), stored in `topics.yaml`. Links use standard markdown syntax, not wikilinks. File evidence goes in `sources:` frontmatter.

SQLite is a derived index, not the source of truth. Every query command silently checks page mtimes against the index and rebuilds if stale. `reindex` is silent and implicit.

## The notability bar

sync may decide that a conversation contains no durable knowledge and leave the wiki unchanged. This is the critical filter missing from most memory systems: not everything is worth remembering. The agent makes a judgment call about what crosses the notability threshold.

## Design philosophy — the manual

codealmanac's `MANUAL.md` is the most thoughtful engineering document in the batch. Key principles:

- **The unit of work is "reshape the codebase so the feature fits, then build it."** Refusal is a valid output.
- **Seam vs. machinery.** Build seams eagerly (boundaries, names, typed contracts). Build machinery lazily (implementations, dispatchers, config surfaces). The antidote to naive YAGNI.
- **Wireframe habit.** Show pseudocode wireframes in chat before writing real code. The wireframe is the design-review surface.

## What matters for Flow

### Wiki-as-code is the right commitment model

The wiki is committed to the repo and reviewed in Git. It is not hidden runtime state. This means the knowledge base has version history, diffs, and code review for free. Flow's existing model (markdown files in the repo, committed alongside code) already follows this pattern.

### The notability bar solves the noise problem

Most memory systems capture everything and rely on search to filter. codealmanac captures only what crosses a notability threshold. For Flow, this means the knowledge capture step needs judgment: not every session produces knowledge worth keeping, and the system should say so rather than accumulating noise.

### Garden is the missing maintenance step

Most memory systems grow forever. codealmanac's garden agent periodically reviews the wiki for staleness, duplication, and structural problems. Flow needs an equivalent: knowledge that ages without evidence should eventually fade or be pruned.

### Sync-from-transcripts is passive capture

The sync job scans existing transcripts without requiring the user to do anything. This is closer to browser-harness's zero-overhead model than ECC's hook-on-every-tool-call approach. For Flow, scanning conversation transcripts after sessions end is a lower-overhead path to knowledge capture than real-time observation hooks.
