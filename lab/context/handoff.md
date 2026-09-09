# Handoff

## Where the work is

**Two features left Flow for `util` on 2026-09-09, and util grew its first shared library on
2026-09-10.** 76 of 76 Flow tests pass, 36 of 36 util tests pass, `rule-check.js` is silent, and
nothing is installed, so none of it has run in a live session. `lab/context/state.md` carries the
reasoning; this file says what to do next.

## Uncommitted, and waiting on the user

**Two commits, because `lab/util/` is a submodule.** The submodule first, then this repo. Nothing else
is blocked on them.

```
cd /home/me/code/flow/lab/util && gsave "add git work and claude proxy, and the shared help reader"
cd /home/me/code/flow && gsave "move work and proxy to util, and link the open block by URL"
```

## What moved, and the line that decides the next one

**A Flow command belongs in `util` when it never touches `.flow/` or `~/.flow/`.** Applied across the
whole surface it caught one command and stopped. Re-run the line before proposing a third move.

- **`flow work` is `util git work`**, at `lab/util/commands/git/work.js`. Four actions: `send`, `get`,
  `ls`, `drop`. It carries uncommitted files between two machines, as a commit filed under
  `refs/unfinished/<machine>/<branch>`.
- **`lab/scripts/proxy.mjs` is `util claude proxy`**, in a new `claude` namespace.
- **The move renamed three things.** `git config --global util.machine <name>` replaces
  `flow.machine`, `UTIL_MACHINE` replaces `FLOW_MACHINE`, `.work-include` replaces `.flow-include`.
  **`util.machine` has to be set again on both machines** or `send` refuses. `refs/unfinished/` was
  not renamed, so copies stored before the move still read.
- **`flow audit` stays.** It reads `~/.claude/projects/` with no ticket involved, so it passes the
  letter of the line, and writes `~/.flow/audit/audit.db`, so it fails it.
- **The four hooks cannot move.** They read a tool call on stdin and print a verdict. Nothing to type.

## util's shared library, built 2026-09-10

**`lab/util/lib/command.js`**: `usage(file)`, `wantsHelp(argv)`, `helpOrRun(file, argv)`. A command's
`--help` prints that command's own header comment, so help and documentation are one text.

- **It exists because `--help` was broken**, not because of duplication. `fs tree --help` used to print
  a directory tree. Four of six commands got it wrong.
- **Optional forever.** A command in a private source cannot reach `lib/`, and `git save` is bash and
  keeps its awk reader. util still runs any executable in any language and never reads its arguments.
- Adding a command? One line: `require('../../lib/command').helpOrRun(__filename, process.argv.slice(2));`

## The user's open question: what was in the context

**Rejected on 2026-09-10: `/context` and `util claude proxy` both.** The bar is an agent checking on
its own, without the user, about any past session including one already compacted or cleared.
`/context` is user-typed and live-only. The proxy must be started in advance.

**What already meets most of the bar**: `scripts/instructions-loaded.js`, the `InstructionsLoaded`
hook. Claude Code fires it whenever a `CLAUDE.md` or `.claude/rules/*.md` enters context, and again
with `load_reason: "compact"` after a compaction. It appends to `~/.flow/scorecards/<session-id>.jsonl`,
permanently, and `rule-check.js` reads it back. **The gap**: it records instruction files only, not
skills, tool definitions, subagent definitions or message sizes. Widening that record is the next
move, and it is undesigned.

## What is still open

- **A rule that the user is always short on time.** Ruled 2026-09-10 after a bloated reply.
  `size-by-worth` did not fire because it reads as permission to be long. In `backlog.md` under
  `## Rules and always-loaded files`, marked **v1**.
- **`util git work drop` does not fetch.** `ls` and `get` do, so `drop <machine>` on a clone that has
  never listed reports no copy. Inherited, preserved on purpose. `backlog.md` → `## Testing`.
- **Splitting `## Commands` out of util's README into `docs/commands.md`.** Recommended and not done:
  the dispatcher half is finished, the command prose grows one section per command. `## Commands` is
  contiguous so the split is a lift-out. It moves the 4 links below to `.../blob/main/docs/commands.md`.
- **A flag parser and a column printer in `lib/`.** Deliberately not extracted: 4 of 5 commands parse
  1 to 6 lines of arguments, and the column printer has one user. Wait for a third caller.
- **`/flow-review` assumes a rule was loaded.** Step 3 of `## Suspected flaw` compares behavior against
  loaded rules without checking that they loaded. Ties to the context question above.
- **`util` has never been swept for em dashes**: 20 sites, 6 reaching the user, one asserted in
  `tests/util.test.js:158`. `backlog.md` → `## util, the utility CLI`.
- **A brute-force guard in `transition()`**, `scripts/flow/commands/tickets.js:76`: refuse a move out
  of `groundwork` while `map.md` has an unticked `[ ]`. `store.mapQuestions` does the counting.
  Additive, undesigned.
- **`~/.flow/` as a git repository**, and **one state path across harnesses**. Both **talk first**.
- **`store.js:282`** moves a groundwork folder with `fs.renameSync` under a comment reading "Same
  filesystem by construction". A global-to-project move breaks that with `EXDEV`.
- The 2 deletes: 3 of the 4 entries in `lab/context/shit-explanations.md`, and `repos/toolbox`.
- v1 queue in `backlog.md` → `## Next`, item 1 not started: the harvest of Delapse and lumacraft_v2.

## Easy to get wrong

- **Answers must be short.** The user is always short on time and has now ruled on it twice.
- **`util` is not on this machine's `PATH`.** `flow get --files` prints `unread: util fs open failed`
  and carries on. Both chains were verified against a scratch `UTIL_HOME`.
- **`util claude proxy` writes into the working directory**, not beside itself. `PROXY_LOGS` moves it.
- **Tool search goes off under the proxy** because `ANTHROPIC_BASE_URL` points at a **non-first-party
  host**, which localhost is. Corrected 2026-09-10: an earlier note claiming *any* custom base URL did
  it was wrong. `ENABLE_TOOL_SEARCH=true` overrides, and survives a proxy forwarding bodies unmodified.
- **Four Flow files link util's README by URL**, not by path: `docs/manual/tickets.md`,
  `docs/dev/cli.md`, the root `README.md`, `references/workflow.md`, all at
  https://github.com/Adrian333Dev/util#the-open-block.
- **A commented-out checkbox is not a checkbox.** `countBoxes` strips comments first.
- **`FLOW_PROJECT=$HOME flow new "…"` works today.** `projectRoot()` never checks it is a repository.
- **Nothing global reaches `docs/`.** A global run's `docs/` routes land under `~/.flow/`.
- **`/groundwork t042` does not work.** A long skill taking arguments makes Claude Code re-append it.
- **Nothing in `tmp/planned-projects/` is a decision.** The user's own material, read-only.
- **`--body` replaces the ticket template outright**, so `## Done when` exists only where written.
- **`parked` has `satisfies: false`.** A parked ticket blocks its dependents until it revives.
- Nothing is installed and nothing in `skills/` loads. `bash lab/scripts/try.sh`.
- The repo `CLAUDE.md` is not `home/CLAUDE.md`. Never write personal content into this repo.
