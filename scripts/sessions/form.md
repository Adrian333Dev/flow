# The setup form

`migration.md`, as the setup session writes it. Copy every fixed line word for word, and leave out each one the machine already matches: `## What goes in the form` in `machine.md` beside this file. Replace each line holding a `{…}` whole, with the lines it stands for, filled from the survey. The text after `such as:` is one example, written for a machine with superpowers, the supabase plugin, a `tdd` skill, `grill-me` synced from a claude.ai account, `find-skills` from `npx skills` and a `stripe-helper` skill copied in by hand. Never leave a `{…}` in the file.

## What each `{…}` holds

- **`{plugins that override Flow}`**: one line per installed plugin that tells Claude how to work in every session, whether or not a skill is invoked, switched on or not. `superpowers` is the example below. None found → no line.
- **`{competing things}`**: one box per skill, rule file, hook or agent on ground Flow rules on, and per account-synced skill that fights Flow's rules. Name what it does in plain words, then what Flow does instead. None found → the whole subsection goes.
- **`{switched off}`**: one box per plugin that stays and that only some projects use. Name what it knows in plain words. None found → the whole section goes.
- **`{takeovers}`**: one box per outside skill Flow can take over, saying whether it is on in every project or only in the projects that use it. None found → the whole section goes.
- **`{left as they are}`**: plugins on in every project, and synced skills that stay, by name. None → the line goes.
- **`{preferences}` and `{about you}`**: the harvest, one line each. Empty → the fence stays, empty.
- **`{action lines}`**: every line under `## Every file this changes`, in the order they run.

## The template

````markdown
---
type: setup-machine
---

# Setting up this machine

⚠️ Don't change anything in this file unless you know exactly why. Flow is built and tested as one setup, and a change here can break parts of it in ways you won't notice until later. Every key below is explained in ~/.flow/docs/reference/settings.md.

## What Flow sets up

- Flow's rules, read at the start of every session. `~/.agents/AGENTS.md`, loaded by `~/.claude/CLAUDE.md`
- Flow's hooks: guard.js, changes.js, rule-check.js, instructions-loaded.js, check-ticket.js, reminder.js, context-check.js, session-check.js. `hooks`
- Commands that can do harm always ask you first: losing work git cannot give back, sending data off the machine, a deploy or a database wipe, a global install, running a downloaded script, and reading a file of passwords or keys. `guard.js`
- Claude sees exactly what each helper agent changed, even with several working at once. `changes.js`
- The file list after `@` comes from Flow, which stays fast in big projects. `fileSuggestion`
- Edits, file reads, web pages, web search and every shell command run without asking. `permissions.allow: Edit, Read, WebFetch, WebSearch, Bash`
- A git commit, a git push and publishing a package ask you every time. `permissions.ask`
- Every session starts in Manual mode: Claude asks before anything the 2 lines above don't cover. `permissions.defaultMode`
- Claude can't run the commands that undo Flow. Only you can. `permissions.deny: Bash(flow restore …), Bash(flow uninstall …)`
- Claude can't run commands as the system's admin or as another user, format a disk, or start a copy of itself that never asks. `permissions.deny: Bash(sudo *), Bash(su *), Bash(mkfs*), Bash(* --dangerously-skip-permissions *)`
- The skill repositories you added update themselves each time a session opens. `skillsAutoUpdate`
- Claude is reminded how to reply, beside every message you send. `reminder`
- Claude stops at a safe point and writes a handoff once the conversation passes 150,000 tokens. `wrapUp`
- A session tells you as it opens when Flow or your skill repositories need updating. `sessionCheck`
- A session opened in a git repository without Flow suggests setting it up. `setupReminder`
- A status line under the box you type in: the ticket this session works on, its status, and how full the conversation is. Shown only where you have no status line of your own. `statusLine`
- Session history is kept for a year instead of 30 days, so a rule can be traced back to the session that caused it. `cleanupPeriodDays`

To turn off `skillsAutoUpdate`, `reminder`, `wrapUp`, `sessionCheck` or `setupReminder` later, type `flow settings off <key> --global`.

### Always removed, because Flow can't work with them

- Plan mode: Claude can switch into a mode where it can't edit files, and Flow's planning writes files. `permissions.deny: EnterPlanMode, ExitPlanMode`
- Worktrees: Claude works in a separate copy of your project, without the uncommitted changes Flow's debugging looks at. `permissions.deny: EnterWorktree, Agent(isolation:worktree)`, `worktree.bgIsolation`
- Bypass mode: Claude could switch off Flow's checks without asking you. `permissions.disableBypassPermissionsMode`
- Memory: notes Claude Code writes about each project and loads into every session, beside Flow's rules. `autoMemoryEnabled`
- Forks: helper agents that start with a copy of the whole conversation. Flow's helpers see only what they're told. `permissions.deny: Agent(fork)`
- Compacting: Claude Code swaps a long conversation for its own summary of it, when you type /compact or by itself near the limit. Flow ends a long conversation with /flow:handoff, then /clear. `autoCompactEnabled`, `hooks.PreCompact`
- Workflows: Claude writes a script that runs many helper agents at once, outside Flow's steps. `disableWorkflows`
- Skills that come with Claude Code: /debug and /code-review do what Flow's own skills do, and all 6 add to every session. `disableBundledSkills`
- Pick-list questions: Claude asks you to choose from options, where Flow has it recommend one. `permissions.deny: AskUserQuestion`
- Artifacts: Claude publishes its work as a web page on claude.ai, where Flow draws it in the terminal. `disableArtifact`
- The review findings tool: during a code review, Claude shows its findings in Claude Code's own layout instead of Flow's. `permissions.deny: ReportFindings`
- Claude replying after a command you run yourself with `!`: Flow asks you to run commands such as `! flow sync`, and a reply to each costs a turn. `respondToBashCommands`
- {plugins that override Flow}, such as: superpowers plugin: at the start of every session it tells Claude to run one of its skills before replying, which overrides Flow's rules. `claude plugin uninstall`

## Flow's skills

Claude starts these on its own, so each one's description is in every session:
- /flow:groundwork, /flow:execute, /flow:prototype, /flow:debug: the 4 steps of work
- /flow:research, /flow:visualize, /flow:handoff: used inside the 4 steps
- /flow:review: writes up each time Flow itself fails

These cost nothing until you type them:
- /flow:start, /flow:tickets-from-spec, /flow:file-findings, /flow:apply-domain-findings

## 🔴 Removed unless you untick it

Anything you untick is shown to you again before setup goes ahead.

### Works against Flow's rules

⚠️ Do not untick these. Flow was built and tested with every one of them gone. Keeping one makes Claude work against Flow's rules, and nothing will tell you it's happening.

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

## Switched on only in the projects that use it

Each one stays installed, switched off in every project. Setting up a project with `flow init` switches it on there when the project uses it. Untick one to keep it on everywhere.

- [x] {switched off}, such as: supabase plugin: knows the Supabase database service. `claude plugin disable`

## Taken over by Flow unless you untick it

From now on `flow skills` installs, updates and switches these, on your other machines too. Each line says whether it is on in every project, or only in the projects that use it, where `flow init` switches it on. An unticked one stays exactly as it is, and Flow never touches it.

- [x] {takeovers}, such as: find-skills, installed with npx skills from vercel-labs/skills: replaced by the same skill from Flow's own clone of that repository, on in every project. `sources`, `skills`
- [x] {takeovers}, such as: stripe-helper, a folder copied in by hand: moved into ~/.flow/private-skills/, on only in the projects that use it. `~/.flow/private-skills/`

Left as they are: {left as they are}, such as: plugins, such as security-guidance, which /plugin switches.

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

~/.flow/version is stamped once the check at the end passes. ~/.flow/originals/machine/ keeps a copy of every file above as it was, so `flow restore machine` can put this machine back.
````

## The action lines

`~/.flow/scripts/apply-migration.js` acts on every line opening `- write `, `- delete `, `- move ` or `- run `, anywhere in the file, so no other line may open with one of those 4 words. One path per line. Everything after `: ` is for the user.

```markdown
- write ~/.flow/AGENTS.md: Flow's rules, with the 2 boxes above
- run mkdir -p ~/.agents && ln -sfn ~/.flow/AGENTS.md ~/.agents/AGENTS.md: writes ~/.agents/AGENTS.md
- write ~/.claude/CLAUDE.md: one line loading Flow's rules, in place of what it holds now
- write ~/.claude/settings.json: every key named above. Your own settings, such as model and theme, stay as they are
- run claude plugin uninstall superpowers@claude-plugins-official: writes ~/.claude/settings.json, ~/.claude/plugins/installed_plugins.json, ~/.claude/plugins/cache/claude-plugins-official/superpowers, ~/.claude/plugins/data/superpowers-claude-plugins-official
- run claude plugin disable engineering@synced: writes ~/.claude/settings.json. Switched off on this machine only, and still on at claude.ai
- run claude plugin disable supabase@claude-plugins-official --scope user: writes ~/.claude/settings.json. Switched off in every project until one switches it on
- delete ~/.claude/skills/tdd: a skill ticked above
- delete ~/.claude/skills/find-skills: the npx skills copy
- delete ~/.agents/skills/find-skills: the npx skills copy
- run node ~/.flow/scripts/flow.js skills add vercel-labs/skills: writes ~/.flow/settings.json, ~/.flow/repos/sources/vercel-labs_skills
- run node ~/.flow/scripts/flow.js skills on find-skills --global: writes ~/.flow/settings.json, ~/.claude/skills/find-skills
- write ~/.agents/.skill-lock.json: find-skills removed from the record npx skills keeps, so npx skills update can't bring its old copy back
- move ~/.claude/skills/stripe-helper -> ~/.flow/private-skills/stripe-helper: a folder copied in by hand, switched on by each project that uses it
```

A delete comes before the `skills add` that replaces it. A plugin's uninstall or disable comes after the `settings.json` write. An uninstall names the plugin's `installPath` from `claude plugin list --json` and its data folder, where one exists. A `run` line names every path its command writes, or ends `: writes nothing`.
