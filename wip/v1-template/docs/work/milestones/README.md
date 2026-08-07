# Milestones

One folder per milestone.

The hard rule **"one formal milestone at a time"** applies here: only one milestone has a `spec.md` + `plan.md` at any moment. The next milestone is formalized only after the current one ships.

A loose, forward-looking blueprint of upcoming work belongs in `docs/work/roadmap.md` — that's not a commitment and is allowed to grow indefinitely.

---

## Naming

`m<NN>-<feature-slug>/` — e.g. `m01-authentication/`, `m02-dashboard/`.

If a milestone unexpectedly grows, split it: `m01a-auth-core/`, `m01b-auth-social/`.

## Folder contents

| File | Written by | Purpose |
|------|-----------|---------|
| `spec.md` | `superpowers:brainstorming` | Feature design and requirements |
| `plan.md` | `superpowers:writing-plans` | Step-by-step implementation plan |
| `session.md` | `checkpoint` skill | Latest session snapshot for resuming |
| `issues.md` | Agent + user, during milestone | Process problems, surprises, inefficiencies — reviewed at wrap, promoted to `workflow-rules.md` or `conventions.md` |
| `progress.md` | Optional, manual | Deferred items, notes, decisions |

## Flow

```
brainstorming → spec.md
[grill-me]                   → stress-test
writing-plans                → plan.md
implement (subagent-driven-development | executing-plans)
checkpoint                   → session.md (mid-session, as needed)
verification-before-completion
requesting-code-review
finishing-a-development-branch → update now.md, adjust roadmap.md → next milestone
```

`grill-with-docs` is an opt-in alternative to `grill-me`, useful once the project has accumulated domain terminology. It writes to repo-root `CONTEXT.md` and `docs/adr/` — not the milestone folder — so don't reach for it on early milestones.

## Philosophy

One milestone = one feature. Small scope = fast feedback = less wasted work. If a milestone takes more than a few days, it's probably too big — split it.
