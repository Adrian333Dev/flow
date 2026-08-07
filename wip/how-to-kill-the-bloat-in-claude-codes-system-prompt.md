Title: How To Kill The Bloat In Claude Code's System Prompt

URL Source: https://www.aihero.dev/how-to-kill-the-bloat-in-claude-codes-system-prompt

Published Time: 2026-07-07T11:51:13.696Z

Markdown Content:
Every message you send Claude Code ships a payload you never see. Not your prompt — the machinery around it: tool definitions, a skills catalogue, system instructions for features you may never touch. It goes out on every request, and you're billed for it every turn.

You can remove most of it. The six steps below show how to see what your requests actually contain, then trim it with two settings Claude Code already has. Mine dropped by tens of thousands of tokens per turn.

## [1. Measure your context with `/context`](https://www.aihero.dev/how-to-kill-the-bloat-in-claude-codes-system-prompt#1-measure-your-context-with-context)

Type `/context` in any Claude Code session. It breaks your context window down by category — system prompt, system tools, MCP tools, memory files, messages — each with a token count and its share of the window.

Note the numbers now, before changing anything. You'll compare against them in the last step.

`/context` shows the tools as a group. It won't tell you which individual tool is largest — it reports one "tools" number, not a ranking. The next step fixes that.

Claude Code talks to the Anthropic API over HTTP, so you can put a proxy in between that forwards each request untouched, streams the reply straight back, and records what went past. The CLI doesn't notice.

Grab [`proxy.mjs`](https://gist.github.com/mattpocock/5b3d76ea21f5f698aefded47a9cea3b1) — one file, no dependencies, Node built-ins only. Run it:

node proxy.mjs

Point Claude Code at it in another terminal and send a message:

ANTHROPIC_BASE_URL=http://localhost:8787 claude

Each request is written to `./logs/` as readable Markdown, and a ranked table prints to the terminal:

[agent-proxy] 69 tools · 154,946 tool bytes · 65,538 real input tokens

Workflow 21229 B ~5307 tok

DesignSync 8978 B ~2245 tok

Monitor 7767 B ~1942 tok

…

Open the Markdown file and read it: every tool's full schema, the system prompt, the message history — the whole request as the model receives it. The ranked table at the top is your list to work from, so you can remove the exact tools you don't use rather than guess.

Now you know what's in the payload and which parts are largest. The next two steps remove it. Both settings live in your settings file — `~/.claude/settings.json` for every project, or `.claude/settings.json` for one.

Some features bring a whole cluster of tools and instructions with them. A single flag turns the feature off along with everything it carries:

- `disableBundledSkills` — removes all of Anthropic's bundled skills at once (the `dataviz`, `review`, `init` catalogue), while leaving their slash commands typable.
- `disableWorkflows` — removes the multi-agent `Workflow` tool, the largest single line in the table.

Use one whenever a whole feature isn't earning its place.

For individual tools, a `permissions.deny` rule with a bare tool name removes that tool's definition from the payload — Claude never sees it:

{

"permissions": {

"deny": ["NotebookEdit", "CronCreate"]

}

}

One detail worth knowing: a bare name (`"NotebookEdit"`) removes the tool. A scoped rule (`"Bash(rm *)"`, `"Skill(dataviz)"`) blocks the matching call but leaves the definition in the payload. To shrink the request, use bare names.

The flags in the previous step are the broad first pass; these deny rules pick off the individual tools the flags don't cover.

> Keeping some skills but not all? `disableBundledSkills` is all-or-nothing. To drop them one at a time, use `skillOverrides` with a skill set to `"off"` (removed from the payload) or `"user-invocable-only"` (still typable, but Claude doesn't see it).

Here's what the previous two steps produced — the flags and deny rules that trim the bloat, ready to drop into `~/.claude/settings.json`:

{

"permissions": {

"deny": [

"EnterPlanMode",

"ExitPlanMode",

"DesignSync",

"NotebookEdit",

"SendMessage",

"PushNotification",

"RemoteTrigger",

"ReportFindings",

"ScheduleWakeup",

"AskUserQuestion",

"CronCreate",

"CronDelete",

"CronList"

]

},

"disableBundledSkills": true,

"disableWorkflows": true,

"disableRemoteControl": true,

"disableClaudeAiConnectors": true,

"disableArtifact": true

}

Treat it as a menu, not a prescription. The reason to see your own payload first is so you cut what you don't use. If you work in plan mode, keep it. If you write notebooks, keep `NotebookEdit`. The list above is what earned removal for me.

One caveat: some of what looks like bloat is machinery that background jobs and multi-agent runs rely on — the task tools, `Workflow`, worktree tools. If you use those, keep them.

## [6. Re-measure with `/context`](https://www.aihero.dev/how-to-kill-the-bloat-in-claude-codes-system-prompt#6-re-measure-with-context)

Restart Claude Code so it reloads the settings, and run `/context` again. The tools count and token total should be lower.

That difference is the tokens you were sending every turn and now aren't — cheaper requests, and less for the model to read past before it reaches your problem.
