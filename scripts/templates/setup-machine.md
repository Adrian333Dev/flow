---
type: setup-machine
---

# Setting up this machine

- **Ticked**: Flow does it. **Unticked**: Flow leaves that thing exactly as it is.
- **Text boxes**: edit or delete any line.
- **Say go** in the session. Nothing changes before that, and `flow restore machine` puts everything back.

Your choices come first: {count} boxes and 2 text boxes. Everything under ✅ happens with no choice.

## ❌ Removed: works against Flow's rules

⚠️ Keep one only if you know exactly why. Claude follows it over Flow's rules, and nothing tells you when.

- [x] {competing}, such as: **tdd** skill: deleted. It plans and tests every change, which Flow's steps already do.
- [x] {competing}, such as: **grill-me** skill, synced from your Claude account: switched off on this machine, still on at claude.ai. It interviews you with a list of questions, where Flow has Claude recommend an answer.
- [x] {competing}, such as: **engineering** plugin, synced from your Claude account: switched off on this machine, still on at claude.ai. Its skills review code and debug, which Flow's own skills do. Its connections to outside services go with it: github, linear.

## ⏸️ Switched off: rarely used, and sent with every message

Each one is sent to Claude with every message you type, used or not. Keep one only if you use it every week.

- [x] **Connectors** from claude.ai, such as Google Drive: added for chatting on claude.ai. Flow never calls them.
- [x] **Remote control** ([docs][remote]): driving this session from claude.ai or your phone.
- [x] **Jupyter notebooks** ([docs][notebook]): editing `.ipynb` files.
- [x] **Notifications** ([docs][tools]): an alert on your desktop or phone when a long task ends.
- [x] **Timers** ([docs][timers]): running a prompt again later, or on repeat.
- [x] **Routines** ([docs][routines]): prompts run on a schedule on claude.ai's servers.
- [x] **Sending files** ([docs][tools]): Claude sends a report or a screenshot to your phone.
- [x] **Setup guides** ([docs][tools]): uploading a guide for teammates, for /team-onboarding.
- [x] **Messaging other sessions** ([docs][teams]): several sessions talking to each other.
- [x] **Design sync**: syncing with a design app. About 2,200 tokens on every message.

## ⏸️ Switched off, except in the projects that use it

- [x] {switched off}, such as: **supabase** plugin: knows the Supabase database service. Switched off everywhere, and `flow init` switches it on in a project that uses it.

## ❌ Deleted: Flow has its own

A copy of each stays in the migration folder.

- [x] {replaced}, such as: **write-a-skill**: writes a new skill, which Flow's skill rules already cover.

## Taken over by Flow

Flow installs and updates it from now on, on your other machines too.

- [x] {takeovers}, such as: **find-skills**, from vercel-labs/skills: Flow's own copy replaces the one npx skills installed. On in every project.
- [x] {takeovers}, such as: **stripe-helper**, a folder copied in by hand: moved into `~/.flow/private-skills/`. On only in the projects that use it.

## Your rules

{rules intro}, such as: Your old `~/.claude/CLAUDE.md` was empty, so both boxes start empty. Anything you write here goes into Flow's rules.

**Your preferences**, how you want Claude to work:

```text
{preferences}
```

**About you**:

```text
{about you}
```

## ✅ Set up with no choice

Flow is built and tested as one setup. [Flow's settings guide][settings] explains each one.

**Safety**

- Commands that can do harm ask you first: losing work git can't give back, sending data off the machine, a deploy or a database wipe, a global install, running a downloaded script, reading a file of passwords or keys.
- A git commit, a git push and publishing a package ask you every time.
- Claude can't run commands as admin or as another user, format a disk, or start a copy of itself that never asks.
- Claude can't run `flow restore` or `flow uninstall`. Only you can.

**Fewer prompts**

- Edits, file reads, web pages, web search and shell commands run without asking.
- Every session starts in Manual mode: Claude asks before anything else.

**Flow in every session**

- Flow's rules load at the start of every session.
- Claude is reminded how to reply, beside every message you send.
- Past 150,000 tokens, Claude stops at a safe point and writes a handoff.
- A session tells you when Flow or your skills need updating.
- A session in a git repository without Flow suggests setting it up.
- The skill repositories you added update themselves.
- Claude sees exactly what each helper agent changed.
- The file list after `@` stays fast in big projects.
- A status line ([docs][statusline]) shows the ticket, its status, and how full the conversation is.
- Session history is kept for a year instead of 30 days.

Turn off the reminder, the handoff, the update notice, the setup suggestion or the skill updates later with `flow settings off <key> --global`.

**Always removed: Flow can't work with them**

- {overrides}, such as: **superpowers** plugin: tells Claude to run its skills before replying, over Flow's rules. Uninstalled from this machine.
- **Plan mode** ([docs][plan]): Claude can't edit files in it, and Flow's planning writes files.
- **Worktrees** ([docs][worktrees]): Claude works in a copy of your project, without your uncommitted changes.
- **Bypass mode** ([docs][bypass]): Claude could switch off Flow's checks without asking.
- **Memory** ([docs][memory]): Claude Code's own notes per project, loaded beside Flow's rules.
- **Forks** ([docs][forks]): helpers that start with the whole conversation. Flow's helpers see only what they're told.
- **Compacting** ([docs][commands]): a long conversation swapped for a summary. Flow ends one with /flow:handoff, then /clear.
- **Workflows** ([docs][workflows]): a script running many helpers at once, outside Flow's steps.
- **Built-in skills** ([docs][skills]): /debug and /code-review do what Flow's own skills do.
- **Pick-list questions** ([docs][picklist]): Claude asks you to choose, where Flow has it recommend one.
- **Artifacts** ([docs][artifacts]): work published as a web page on claude.ai.
- **The review findings tool** ([docs][tools]): review findings in Claude Code's layout instead of Flow's.
- **Replies to your `!` commands**: Flow asks you to run commands such as `! flow sync`, and each reply costs a turn.

**Flow's skills**

- Claude starts these on its own: /flow:groundwork, /flow:execute, /flow:prototype and /flow:debug, the 4 steps of work. Then /flow:research, /flow:visualize, /flow:handoff, /flow:help and /flow:review.
- These cost nothing until you type them: /flow:start, /flow:tickets-from-spec, /flow:file-findings, /flow:apply-domain-findings.

**Left as they are**: {left as they are}, such as: the security-guidance plugin, and the docs and pdf skills synced from your Claude account.

## What setup could not check

Each one below stays exactly as it is.

- {unread}, such as: whether each plugin is switched on. Claude Code's plugin list stopped with "not signed in".

## Every file this changes

With every box ticked, in the order it runs. A copy of each path as it was goes to `~/.flow/originals/machine/` before the first change.

### ➕ Written

- `~/.flow/CLAUDE.md`: Flow's rules, with your 2 text boxes
- `~/.claude/settings.json`: Flow's settings, plus one line for each box under ⏸️. Yours, such as model and theme, stay
- {written}, such as: `~/.agents/.skill-lock.json`: find-skills taken out of npx skills' record, so `npx skills update` can't bring it back

### ➖ Deleted

- {deleted}, such as: `~/.claude/skills/tdd`
- {deleted}, such as: `~/.claude/skills/find-skills` and `~/.agents/skills/find-skills`, the npx skills copies

### ▶️ Commands

- `ln -sfn ~/.flow/CLAUDE.md ~/.claude/CLAUDE.md` writes `~/.claude/CLAUDE.md`: a link to Flow's rules, in place of the file there now
- {commands}, such as: `claude plugin uninstall superpowers@claude-plugins-official` writes `~/.claude/settings.json`, `~/.claude/plugins/installed_plugins.json`
- {commands}, such as: `claude plugin disable supabase@claude-plugins-official --scope user` writes `~/.claude/settings.json`
- {commands}, such as: `claude plugin disable engineering@synced` writes `~/.claude/settings.json`
- {commands}, such as: `flow skills add vercel-labs/skills` writes `~/.flow/settings.json`, `~/.flow/repos/sources/vercel-labs_skills`
- {commands}, such as: `flow skills on find-skills --global` writes `~/.flow/settings.json`, `~/.claude/skills/find-skills`

`~/.flow/version` is stamped once the check at the end passes.

[settings]: ~/.flow/docs/reference/settings.md
[plan]: https://code.claude.com/docs/en/permission-modes#analyze-before-you-edit-with-plan-mode
[bypass]: https://code.claude.com/docs/en/permission-modes#skip-all-checks-with-bypasspermissions-mode
[worktrees]: https://code.claude.com/docs/en/worktrees
[memory]: https://code.claude.com/docs/en/memory#auto-memory
[forks]: https://code.claude.com/docs/en/sub-agents#fork-the-current-conversation
[commands]: https://code.claude.com/docs/en/commands
[workflows]: https://code.claude.com/docs/en/workflows
[skills]: https://code.claude.com/docs/en/skills
[picklist]: https://code.claude.com/docs/en/tools-reference#askuserquestion-tool-behavior
[artifacts]: https://code.claude.com/docs/en/artifacts
[statusline]: https://code.claude.com/docs/en/statusline
[remote]: https://code.claude.com/docs/en/remote-control
[notebook]: https://code.claude.com/docs/en/tools-reference#notebookedit-tool-behavior
[timers]: https://code.claude.com/docs/en/scheduled-tasks
[routines]: https://code.claude.com/docs/en/routines
[teams]: https://code.claude.com/docs/en/agent-teams
[tools]: https://code.claude.com/docs/en/tools-reference
