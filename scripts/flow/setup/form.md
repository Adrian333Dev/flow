# The setup form

`migration.md`, as the setup session writes it. Copy every fixed line word for word, and leave out each one the machine already matches: `## What goes in the form` in `machine.md` beside this file. Replace each line holding a `{…}` whole, with the lines it stands for, filled from the survey. The text after `such as:` is one example, written for a machine with superpowers, a `tdd` skill, `grill-me` synced from a claude.ai account and `find-skills` from `npx skills`. Never leave a `{…}` in the file.

## What each `{…}` holds

- **`{plugins that override Flow}`**: one line per installed plugin that tells Claude how to work in every session, whether or not a skill is invoked, switched on or not. `superpowers` is the example below. None found → no line.
- **`{competing things}`**: one box per skill, rule file, hook or agent on ground Flow rules on, and per account-synced skill that fights Flow's rules. Name what it does in plain words, then what Flow does instead. None found → no line.
- **`{takeovers}`**: one box per outside skill Flow can take over. None found → the whole section goes.
- **`{left as they are}`**: plugins and synced skills that stay, by name. None → the line goes.
- **`{preferences}` and `{about you}`**: the harvest, one line each. Empty → the fence stays, empty.
- **`{action lines}`**: every line under `## Every file this changes`, in the order they run.

## The template

````markdown
---
type: setup-machine
---

# Setting up this machine

⚠️ Don't change anything in this file unless you know exactly why. Flow is built and tested as one setup, and a change here can break parts of it in ways you won't notice until later. Every key below is explained in ~/.flow/docs/manual/settings.md.

## What Flow sets up

- Flow's rules, read at the start of every session. `~/.agents/AGENTS.md`, loaded by `~/.claude/CLAUDE.md`
- Flow's hooks: guard.js, changes.js, rule-check.js, instructions-loaded.js, check-ticket.js, reminder.js, session-check.js. `hooks`
- Commands that can destroy work always ask you first: a delete outside the project, a download run straight as a script, a change to your shell's startup file, and git commands that throw work away. `guard.js`
- Claude sees exactly what each helper agent changed, even with several working at once. `changes.js`
- The file list after `@` comes from Flow, which stays fast in big projects. `fileSuggestion`
- Edits, file reads, web pages, web search and context7 (a library docs lookup) run without asking. So do the everyday shell commands: moving and copying files, running node or python, running tests and scripts, and Flow's own commands. `permissions.allow`
- Every session starts in Manual mode: Claude asks before anything the line above doesn't cover. `permissions.defaultMode`
- Claude can't run the commands that undo Flow. Only you can. `permissions.deny: Bash(flow restore …), Bash(flow uninstall …)`
- Claude can't run commands as the system's admin, format a disk, or start a copy of itself that never asks. `permissions.deny: Bash(sudo *), Bash(mkfs*), Bash(* --dangerously-skip-permissions *)`

### Always removed, because Flow can't work with them

- Plan mode: Claude can switch into a mode where it can't edit files, and Flow's planning writes files. `permissions.deny: EnterPlanMode, ExitPlanMode`
- Worktrees: Claude works in a separate copy of your project, without the uncommitted changes Flow's debugging looks at. `permissions.deny: EnterWorktree, Agent(isolation:worktree)`, `worktree.bgIsolation`
- /batch, Claude Code's skill for big changes: it needs worktrees. `skillOverrides`
- Bypass mode: Claude could switch off Flow's checks without asking you. `permissions.disableBypassPermissionsMode`
- {plugins that override Flow}, such as: superpowers plugin: at the start of every session it tells Claude to run one of its skills before replying, which overrides Flow's rules. `claude plugin uninstall`

## Flow's skills

Claude starts these on its own, so each one's description is in every session:
- /flow:groundwork, /flow:execute, /flow:prototype, /flow:debug: the 4 steps of work
- /flow:research, /flow:visualize, /flow:handoff: used inside the 4 steps
- /flow:review: writes up each time Flow itself fails

These cost nothing until you type them:
- /flow:start, /flow:tickets-from-spec, /flow:file-findings, /flow:apply-domain-findings

## 🔴 Removed unless you untick it

⚠️ Do not untick these. Flow was built and tested with every one of them gone. Keeping one makes Claude work against Flow's rules, or fills every session with text Flow never uses, and nothing will tell you it's happening. Anything you untick is shown to you again before setup goes ahead.

### Works against Flow's rules

- [x] Memory: notes Claude Code writes about each project and loads into every session, beside Flow's rules. `autoMemoryEnabled`
- [x] Forks: helper agents that start with a copy of the whole conversation. Flow's helpers see only what they're told. `permissions.deny: Agent(fork)`
- [x] Workflows: Claude writes a script that runs many helper agents at once, outside Flow's steps. `disableWorkflows`
- [x] Skills that come with Claude Code: /debug and /code-review do what Flow's own skills do, and all 6 add to every session. `disableBundledSkills`
- [x] Pick-list questions: Claude asks you to choose from options, where Flow has it recommend one. `permissions.deny: AskUserQuestion`
- [x] Artifacts: Claude publishes its work as a web page on claude.ai, where Flow draws it in the terminal. `disableArtifact`
- [x] The review findings tool: during a code review, Claude shows its findings in Claude Code's own layout instead of Flow's. `permissions.deny: ReportFindings`
- [x] Claude replying after a command you run yourself with `!`: Flow asks you to run commands such as `! flow sync`, and a reply to each costs a turn. `respondToBashCommands`
- [x] {competing things}, such as: tdd skill: tells Claude how to plan and test every change, which Flow's steps already do. `~/.claude/skills/tdd/`
- [x] {competing things}, such as: grill-me, synced from your Claude account: interviews you with a list of questions, where Flow has Claude recommend. `skillOverrides`

### Rarely used, and each one is sent with every message

⚠️ These sound useful, but most people never use any of them. Each one is still sent to Claude with every message you type, used or not. Design sync alone is about 2,200 tokens, roughly 1,600 words. Flow keeps every session as small as it can, so they all go. Keep one only if you already use it every week.

- [x] Connectors you added on claude.ai, such as Google Drive: added for chatting on claude.ai. Flow never calls them. `disableClaudeAiConnectors`
- [x] Remote control: driving this session from claude.ai or your phone. `disableRemoteControl`
- [x] Editing Jupyter notebooks: only for data-science notebook files (.ipynb). `permissions.deny: NotebookEdit`
- [x] Notifications: Claude alerts your desktop or phone when you've walked away from a long task. `permissions.deny: PushNotification`
- [x] Timers: Claude runs a prompt again later or on repeat. Mostly used by /loop, which Flow already removes. `permissions.deny: CronCreate, CronDelete, CronList, ScheduleWakeup`
- [x] Routines: prompts that run on a schedule on claude.ai's servers, on paid plans. `permissions.deny: RemoteTrigger`
- [x] Sending files: Claude sends a report or screenshot to your phone or the desktop app. `permissions.deny: SendUserFile`
- [x] Sharing a setup guide: uploads a guide for teammates joining a team, for /team-onboarding. `permissions.deny: ShareOnboardingGuide`
- [x] Messaging other sessions: for running several Claude Code sessions that talk to each other. `permissions.deny: ListAgents`
- [x] Design sync: syncing with a design app. Claude Code's own docs don't even list it. `permissions.deny: DesignSync`

## 🟢 Turned on unless you untick it

⚠️ Leave these on. Turning one off takes away something Flow relies on to keep working well.

- [x] Auto-update the skill repositories you added, each time a session opens. Off, each session tells you what's waiting instead. `skillsAutoUpdate`
- [x] Remind Claude how to reply, beside every message you send. `reminder`
- [x] Tell you when a session opens if Flow or your skill repositories need updating. `sessionCheck`
- [x] Keep session history for a year instead of 30 days, so a rule can be traced back to the session that caused it. `cleanupPeriodDays`

## Taken over by Flow unless you untick it

From now on `flow skills` installs, updates and switches these. Each one stays on for this machine, as it is now. An unticked one stays exactly as it is, and Flow never touches it.

- [x] {takeovers}, such as: find-skills, installed with npx skills from vercel-labs/skills: replaced by the same skill from Flow's own clone of that repository. `sources`, `skills`
- [x] {takeovers}, such as: my-helper, a folder copied in by hand: moved into ~/.flow/private-skills/ and linked back. `skills`

Left as they are: {left as they are}, such as: plugins, such as frontend-design, which /plugin switches.

## Moving into Flow's rules

~/.claude/CLAUDE.md is replaced whole. What's worth keeping from it and your other files is below, and a copy of the old file is kept. Edit or delete any line.

### Your preferences

```text
{preferences}
```

### About you

```text
{about you}
```

## Every file this changes

{action lines}

~/.flow/settings.json is written too if you untick one of the first 3 green lines. ~/.flow/version is stamped once the check at the end passes. ~/.flow/originals/machine/ keeps a copy of every file above as it was, so `flow restore machine` can put this machine back.
````

## The action lines

`~/.flow/scripts/apply-migration.js` acts on every line opening `- write `, `- delete `, `- move ` or `- run `, anywhere in the file, so no other line may open with one of those 4 words. One path per line. Everything after `: ` is for the user.

```markdown
- write ~/.flow/AGENTS.md: Flow's rules, with the 2 boxes above
- run mkdir -p ~/.agents && ln -sfn ~/.flow/AGENTS.md ~/.agents/AGENTS.md: writes ~/.agents/AGENTS.md
- write ~/.claude/CLAUDE.md: one line loading Flow's rules, in place of what it holds now
- write ~/.claude/settings.json: every key named above. Your own settings, such as model and theme, stay as they are
- run claude plugin uninstall superpowers@claude-plugins-official: writes ~/.claude/settings.json, ~/.claude/plugins/installed_plugins.json, ~/.claude/plugins/cache/claude-plugins-official/superpowers, ~/.claude/plugins/data/superpowers-claude-plugins-official
- delete ~/.claude/skills/tdd: a skill ticked above
- delete ~/.claude/skills/find-skills: the npx skills copy
- delete ~/.agents/skills/find-skills: the npx skills copy
- run node ~/.flow/scripts/flow/flow.js skills add vercel-labs/skills find-skills --machine: writes ~/.flow/settings.json, ~/.flow/settings.local.json, ~/.claude/skills/find-skills
- write ~/.agents/.skill-lock.json: find-skills removed from the record npx skills keeps, so npx skills update can't bring its old copy back
- move ~/.claude/skills/my-helper -> ~/.flow/private-skills/my-helper: a folder copied in by hand
- run node ~/.flow/scripts/flow/flow.js skills on my-helper --machine: writes ~/.flow/settings.local.json, ~/.claude/skills/my-helper
```

A delete comes before the `skills add` that replaces it, since `add` refuses to put a link where a real folder stands. A plugin's uninstall comes after the `settings.json` write, and names the plugin's `installPath` from `installed_plugins.json` and its data folder, where one exists. A `run` line names every path its command writes, or ends `: writes nothing`.
