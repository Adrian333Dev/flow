# Model identity

Researched 2026-09-06 and 2026-09-07. Nothing here is locked. The file is findings plus one
recommendation, and the single change it asks for is a field on a record that is designed and
unbuilt.

Open items are in `backlog.md` → `## Other people, other models`. The companion record is
`harness-portability.md`, which covers running Flow on other harnesses and other models.
`design-knowledge-base.md` owns the scorecard this file wants a field on.

## Why model identity matters

**Every rule binds each model differently.** Sonnet 4.6 puts the report before the edits without
being told. Opus 5 never does, and fails plain-language explanation even with `## Explaining` loaded
and `/visualize` available. A rule written to fix one model can do nothing on another.

Two things follow.

- **A finding is worthless without the model that produced it.** `shit-explanations.md` records the
  message, the rejection and the fault. It does not record which model wrote the message, so no
  entry can be checked against a second model later.
- **A rule's violation rate is a number per model, never one number.** Without the split, a rule that
  binds Sonnet and fails on Opus reads as a rule with a mediocre rate.

**On a Claude Pro plan the default model is Sonnet 5.** Max, Enterprise and API accounts default to
Opus 5. So the baseline any measurement on this machine produces is Sonnet unless a model is picked
by hand, and that has to be stated wherever a result is written down.

## What Claude Code gives you

Claude Code makes model identity deliberately awkward, and it hands reasoning effort over freely.

**Reasoning effort is easy.** Every hook that fires inside a tool-use context receives an `effort`
object with a `level` field: `low`, `medium`, `high`, `xhigh` or `max`. `PreToolUse`, `PostToolUse`,
`Stop` and `SubagentStop` all get it, when the current model supports the effort parameter. The same
value reaches hook commands and the Bash tool as `$CLAUDE_EFFORT`.

Two details that decide what the number means:

- **It reports what ran, never what was asked for.** A requested level above what the model supports
  arrives already downgraded.
- **Ultracode is not its own level.** It reports as `xhigh`.

**Model identity has no easy source.**

- **No `$CLAUDE_MODEL` environment variable exists.** Documented, not an oversight.
- **Only `SessionStart` hooks can receive a `model` field, and it is not guaranteed to be present.**
  Every other event receives nothing.
- **`$ANTHROPIC_MODEL` is inherited and stale.** A hook can read it when the shell exported it, and
  it does not change when `/model` switches models mid-session. It lies exactly when it matters.

Three real sources exist:

- **The transcript.** Every assistant event carries `message.model`. Authoritative, and it tracks a
  mid-session switch.
- **The status line.** The command configured as `statusLine` receives JSON on stdin holding a
  `model` object with `id` and `display_name`, alongside `session_id`, `transcript_path`, `cwd`,
  `workspace`, `version`, `output_style`, `cost` and `effort`. It runs on every render.
- **The audit index**, covered below.

## What Codex gives you

The asymmetry runs the other way.

- **Every Codex hook payload carries the active model slug** in a `model` field. No sensor needed.
- **Reasoning effort appears in no documented Codex hook payload.** Whether it is exposed under
  another name is unverified.
- **Codex writes a session log per run** at `~/.codex/sessions/YYYY/MM/DD/rollout-<id>.jsonl`, with a
  `session_meta` record on line 1. Same idea as a Claude Code transcript, different schema.

## The status line is the sensor

**Recommendation: have the status line write the current model to a file, and let every hook read
that file.**

The status line already runs, it already receives `model.id`, and it is the only source that sees a
`/model` switch the moment it happens. Writing one small file keyed by session id costs nothing that
is not already being spent.

The alternative is every hook parsing the transcript backwards for the last assistant event. That
works, and it repeats file reading on every single edit. It also fails on the first turn of a
session, where no assistant event exists yet.

`SessionStart`'s `model` field is not a substitute, because the documentation refuses to guarantee
it.

## The audit already records the model

`flow audit` indexes every assistant event with the model that produced it.
`scripts/flow/lib/audit/scan.js:407` reads `message.model`, and `scripts/flow/lib/audit/store.js:156`
holds the column. **Every session already on this machine can be split by model today, with nothing
built.**

**One defect appears the moment a non-Anthropic model runs.** The index also stores `cost_usd`,
`input_tokens` and `output_tokens` per session (`store.js:80` to `:82`), and per turn it stores
tokens plus `cache_read` and `cache_write` (`store.js:128` to `:132`). All of those come from the
`usage` block the provider returned. A provider that does not implement Anthropic's prompt caching
returns no cache figures, so the columns read 0 rather than missing. On a flat monthly plan there is
no per-request dollar figure at all. Any query that sums cost across models is wrong from the first
session that runs elsewhere.

## The one change to make now

**Add `model` and `effort` to the scorecard's result record.**

The recorder shipped 2026-09-07. `scripts/flow/lib/scorecard.js` appends one JSON object per line,
and `scripts/rule-check.js:111` builds the object:

```
scorecard.append(call.session_id, { kind: 'result', id: c.id, tier: c.tier, since: c.since, project, ok })
```

`project` is already there, and `scripts/flow/lib/scorecard.js:19` to `:21` justifies it in one line:
free to record now, impossible to backfill. **That argument holds for the model and the effort level
without a word changed.**

**Effort is free.** `rule-check.js` runs as a `PreToolUse` hook, and that payload carries the `effort`
object, so `call.effort.level` needs no new machinery.

**The model needs the sensor** from the section above, because no `PreToolUse` payload carries one.

With both fields, `flow scorecard` can print a rule's violation rate per model. Without them, every
result recorded before the fields exist is unusable for the question, and `scripts/rule-checks/` is
still empty so almost nothing has been recorded yet. **The window to do this cheaply is now.**

## Per-model context, if the data earns it

**The shape is a base rule set plus a per-model overlay. The timing is after the measurement, not
before it.**

Why the shape is right: two observed failures need two different corrections, and one rule set
carrying both loads every rule into every model. Every loaded token is re-read on every message,
which is the argument `design-knowledge-base.md` already makes for the loading ladder.

Why the timing is wrong today: 2 observations cannot tell "this rule binds Opus 5 and not Sonnet 4.6"
apart from "Opus 5 was worse that week". An overlay written from a sample of 2 becomes a rule nobody
can overturn.

**The loading mechanism, when it is earned.** A `SessionStart` hook's stdout is added to context.
`UserPromptSubmit`, `UserPromptExpansion` and `SessionStart` are the only 3 events whose stdout
becomes context rather than debug log. So the hook reads the active model and prints that model's
overlay file, and a model with no overlay costs nothing.

**Never fork the rule set per model.** Two full sets drift, and the second one is the one nobody
maintains.

## Still open

- **Whether `SessionStart` actually delivers `model` in practice.** The documentation says it can and
  will not promise it. One run answers it.
- **Whether Codex exposes reasoning effort to a hook** under some name the documentation does not
  list.
- **What the per-model split needs before an overlay is justified.** No threshold is set, and
  guessing one now repeats the scorecard's own 5-violations-and-60% guess.
- **Whether a model outside Claude holds Flow's rules at all.** This is the question underneath all
  of the above, and only a paid plan and a real session answer it.
