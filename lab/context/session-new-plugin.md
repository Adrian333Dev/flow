# Session log — where a decision came from

The historical log, newest at the bottom. Come here for **why** a decision was made, never for what to do.
`backlog.md` at the repo root holds open work. `remaining.md` holds the 2 locked decisions whose origins
this file records.

**Everything before 2026-08-08 went on 2026-08-28** — 531 lines logging sessions from 2026-07-01 to 07-27,
written under names that no longer exist. The workbench repo `agentic-setup`, the catalog repo `flow-skills`,
the folder `new-workflow/`, `plugin.json` and the skills CLI were all deleted before this repo reached its
current shape. Git holds that log.

What survives is the 2 sessions that produced the locked decisions.

## 2026-08-08 — the ticket absorbs the topic; `/grill`; `handoff` becomes a command

**Full decision record: `remaining.md` → `## ✅ LOCKED — one entity: the ticket absorbs the topic`.** Only the
origins live here.

- **Topics deleted, approved by the user after a full walk-through.** Proposed and parked 2026-08-07,
  re-opened 2026-08-08 at the user's request specifically so `/grill` would have something real to attack.
  The parked write-up survived intact; what changed in the rework is the **status set**, the **drop
  semantics** and **`reason:`**, none of which existed before.
- **`in-progress` split into `thinking` and `building`** — user's objection, and correct: `in-progress` was
  true while thinking, while coding and while checking, so it answered nothing. Seven statuses now cover what
  took ten across two entities.
- **`superseded` — the agent got this wrong twice in one session.** First recommended deleting it as a
  duplicate of parent/children, having never read the implementation; it is in fact the only thing that
  repairs dependents when a ticket dies, and the source comment says so outright. Then recommended keeping
  the machinery as `drop --by`. The user rejected the *automatic re-point* as too specific, and asked for two
  explicit outcomes instead — `--by` re-points, `--force` cascades — with a bare `drop` refusing while live
  dependents exist. That is what landed.
- **`reason:` on status changes is the user's idea**, raised while settling the cascade: a dropped or parked
  ticket should say why. Required on those two exits only; automatic on cascade; cleared on revive.
- **Parent auto-close: refuse.** User was indifferent and left the call to the agent.
- **Naming.** The user asked whether "ticket" still fits now that it absorbs topics. Kept — `item` was the
  only alternative worth considering and the gain is a word against a sweep of every id, command and document.
- **`/grill` built** as `commands/grill.md` (see the design threads section), and **`handoff` converted from
  a skill to `commands/handoff.md`**, prefetching `git status --short` and `flow status` so the write-path
  ladder can be read off rather than reasoned out. The earlier "wait for the skill rewrite" argument was
  wrong: the rewrite changes where the file gets written, which is disjoint from frontmatter and prefetch.
- **`link-skills.sh` renamed `link.sh`** and extended to link commands and agents per item. Folder-level
  symlinks are banned: `~/.claude/{skills,commands,agents}/` are shared with entries Flow does not own.
- **Two explaining rules hardened** after the user rejected a message outright: checklist IDs (`2i`, `M2`,
  `T1`) banned in user-facing text, and "a quote is not an explanation". First entry written to
  `lab/study-cases/bad-explanations/`.
- **Never install, re-stated a third time** and written into the root `CLAUDE.md` as a hard rule, along with
  cleanup-after-a-change being pre-approved and never needing a delete confirmation.

## 2026-08-09 — brainstorms cut loose from any container

Origins only; the decided content lives in `lab/context/remaining.md` under the second locked section.

- **The session opened with the user re-opening a locked call** — merging `docs/brainstorm/` into tickets —
  and with three real directories offered as test cases: `~/code/toolbox`, `~/code/playground`, `~/kb_v0`.
  They were named as *unrelated scenarios*, not one system. The agent's first pass treated them as one
  family and invented a "construction vs operation" fault around the toolbox, reading "rebuild" as manual
  filing. **Completely wrong** — the rebuild is a scheduled crawler plus a queryable library, an ordinary
  software product the workflow already fits. Fault withdrawn the same turn.
- **The real fault was the agent's second pass**, and it held: Flow assumed a brainstorm sits inside a
  container Flow owns. Evidence was pulled from the user's own disk, not from reasoning — `reader-app` in two
  repos, `delapse` in three, seven undated stalled brainstorms in `kb_v0/20-projects/planned/`.
- **The user rejected two consecutive explanations.** The second failure was the word **"mint"**, lifted
  from this repo's own files and used as if shared; the idea underneath was accepted immediately once
  restated as "create". Recorded as the second entry in `lab/study-cases/bad-explanations/` — a short
  paragraph made of the wrong words fails exactly as hard as a long one.
- **Two modes are the user's call, against the agent's argument.** The agent held that a mode cannot be
  chosen up front because you cannot know whether a brainstorm becomes a product, and proposed choosing an
  *ending* at resolution instead. The user's counter closed it: if a normal brainstorm turns out to be a
  product, start a fresh product-mode brainstorm and reference the earlier ones — nothing converts, nothing
  moves, a wrong guess costs one folder. **Objection withdrawn.** The agent's "will you still be creating
  tickets in six months" test was deleted with it.
- **The loose brainstorm folder is what topics should have been.** The user's read, and it is right: it is a
  brainstorm not attached to a ticket *yet*, with no command, no statuses, no birth rule and no forced
  ending. The agent flagged the honest version of the objection — structurally this is `docs/topics/` under a
  new name — and the answer stands: what failed about topics was the machinery that forced a declaration at
  the start, and none of it comes back.
- **The product brainstorm keeps its own mode, against the agent's proposal to delete it.** The agent had
  argued the product case collapses into an ordinary brainstorm that happens to write a spec. The user
  pushed back on the grounds that the *output* differs — research, prototyping, a full tree, and a spec — and
  that this is a specific type of task with its own requirements. Accepted.
- **The global register of loose brainstorms was proposed by the agent and parked by the user** after one
  round of argument. `CLAUDE_CODE_SESSION_ID` was verified to exist before the session-id line was proposed.
- **`grill` moved from `commands/` to `skills/`** at the user's request, with the reason stated generally: a
  command is one-shot and is right only when shell output must land before the model reasons. This does not
  reverse the handoff conversion the day before — `/handoff` prefetches `git status` and `flow status`, which
  is exactly the case commands exist for.
- **Path overrides settled small.** The user asked for one rule rather than per-path machinery and pointed at
  superpowers; its brainstorming skill names one default path and adds a single parenthetical saying user
  preferences override it. Copied.
- **The user stopped the agent from implementing.** Approval covered *recording* the decisions and the
  `grill` move only. What gets built, and in what order, is a separate decision not yet made.
- **The two blocking decisions closed the same day.** After the stop, the user asked what was still open in
  `remaining.md`. Two things were, both consequences of that day's brainstorm lock, and both were approved on
  the spot. *Handoff path:* the user framed it themselves — the handoff is like the brainstorm folder, it
  depends on preference, it can be literally anywhere, and the default should be the most relevant place;
  ask for one mid-brainstorm and it belongs in that brainstorm's folder. That produced three rows plus a
  single override sentence, replacing a four-row ladder that had never been approved and named two dead
  paths. *`write-spec.md`:* two sub-files. The spec is written once, tickets come off it for as long as the
  product lives — two lifetimes, and the ticket-creation half is read cold months later with no brainstorm
  in context.
- **The user did not know what "spec writing" referred to, and the confusion was the agent's.** The agent had
  named `write-spec.md` — an unbuilt sub-file — without saying what it was, in a message about ticket order.
  The user's question was the right one: is the chain brainstorm → spec → plan? It is not. There is no spec
  in a ticket at all; a spec is written once per product, in product mode only. Per ticket it is brainstorm
  (only when decisions are genuinely open) → `## Plan` inside `ticket.md` → build.
- **The old "phase 1 only" spec failure is a real specimen and the scope ladder is already its fix.** The
  user remembered a spec that captured only the first phase and dropped the rest. It is on disk:
  `study-cases/read-aloud-app/case3/` — a 1069-line brainstorm covering three phases became a 309-line spec
  opening "Ship phase 1", with phases 2 and 3 listed out of scope. The locked design fixes it by separating
  the two things that got fused: `product.md` records the **whole** product, every behavior, all versions,
  and the four-rung scope ladder; only *ticket creation* is scoped to the first rung. Scoping the writing was
  the bug; scoping the building is the design.
- **Two `home/CLAUDE.md` rules requested and confirmed, not yet written.** *One:* the agent may improvise —
  Flow's instructions are not followed 100% of the time, and in a scenario the workflow never considered the
  agent departs from it rather than forcing a bad fit. *Two:* once Flow is in daily use, when the agent
  notices a gap or problem **in the workflow itself**, it writes it down unprompted, so the set can be
  reviewed later. The user's first statement of the second rule broke off mid-transcription; the agent
  recorded its reading explicitly as a guess and asked, and the user restated it. The guess was close but
  filed it wrongly — it assumed the note had nowhere to go and blocked it on the deferred complaints
  question. Checking `home/CLAUDE.md` showed the destination has existed since 2026-08-07:
  `~/.claude/flow/notes.md` already takes anything *about Flow itself*, with a routing test, a date-and-
  project stamp, a `[flow-notes]` marker, and an already-unprompted capture reflex. So rule two is a
  sharpening of an existing row — name faults and gaps, not just insights, and tie it to rule one — not a
  new mechanism. The deferred complaints question shrinks correspondingly: it covers the user's own
  complaints and study-case filing, not agent-noticed faults.
- **The whole main build landed on 2026-08-09**, in one pass after the user said "you can proceed and start
  applying those changes." Order was the agent's call and went root-first: `home/CLAUDE.md` (the document
  everything else mirrors), then `flow`, then `project-template/`, then the skills. Nothing was blocked and
  nothing was left half-applied.
- **Four judgment calls the locked record did not cover**, all made by the agent and none reviewed by the
  user: `parked` does not archive (the locked list of terminal statuses names exactly two, and parked is
  revivable — `flow status` gained a parked block so a deliberate "not now" cannot become "forgotten");
  `flow build <id>` was invented, because the seven statuses need a `thinking → building` transition and the
  record named no command for it; `render.reasonText` was renamed `blockText` to stop it colliding with the
  new `reason:` field; and `write-plan.md` was deleted rather than rewritten, on the grounds that a sub-file
  is for what gets read on *some* runs while planning happens at every pickup.
- **The old `write-spec.md` was the cause of the phase-1 bug, not a victim of it.** Its section list opened
  with "Scope (in/out)", which forces the writer to pick one slice before anything else is written. The
  replacement inverts it: `product.md` holds the whole product at every version, and the four-rung scope
  ladder is what scopes the *building*. That is the fix the user asked about earlier the same day, made
  concrete.
- **Both requested rules were written in the same pass**, contradicting the note made an hour earlier that
  they were pending. The improvise rule sits at the end of `## Workflow` and is deliberately bounded so it
  cannot reach `## Hard rules` — the obvious failure mode is an agent reading "you may depart from the
  workflow" as "you may edit without approval". The fault-recording rule was folded into the existing
  `flow/notes.md` row rather than added as a new mechanism.
