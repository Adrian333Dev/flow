# Claude Code's permission system: what failed for Flow

Written 2026-09-28, against Claude Code 2.1.281 and the docs in `lab/research/claude-code-docs/`. Each section is one problem Flow hit, with how to reproduce it, what the docs say, and the change to ask Anthropic for. Each is written to become one GitHub issue on its own. [Issues to file](#issues-to-file) lists them, most useful first.

## Contents

- [How Flow ended up allowing every shell command](#how-flow-ended-up-allowing-every-shell-command)
- [1. A permission rule is text with one wildcard](#1-a-permission-rule-is-text-with-one-wildcard)
- [2. "Don't ask again" saves rules that never match again](#2-dont-ask-again-saves-rules-that-never-match-again)
- [3. A loop or a variable asks even when every program is allowed](#3-a-loop-or-a-variable-asks-even-when-every-program-is-allowed)
- [4. Auto mode is no answer](#4-auto-mode-is-no-answer)
- [5. A hook's prompt is cluttered and offers only Yes or No](#5-a-hooks-prompt-is-cluttered-and-offers-only-yes-or-no)
- [6. The sandbox breaks ordinary tools](#6-the-sandbox-breaks-ordinary-tools)
- [7. Prompts no setting can turn off](#7-prompts-no-setting-can-turn-off)
- [Issues to file](#issues-to-file)

## How Flow ended up allowing every shell command

Flow wants one thing from permissions: routine commands run without a question, and the few dangerous ones always ask. It took 3 designs to get there, and the settings file could express none of them well.

1. **A list of safe programs, from 2026-09-25.** `permissions.allow` named each routine program: `Bash(node *)`, `Bash(grep *)`, `Bash(npm test *)`. Commands still asked all day, for the reasons in sections 2 and 3.
2. **A hook approving safe shapes, `approve.js`, built and removed 2026-09-28.** It read each command and answered `allow` when every program in it was on the list. Its first live session asked within minutes, on `wc -l < "$f"` inside a loop, a shape it had not been written for. Every new shape meant editing the script.
3. **Every shell command allowed, since 2026-09-28.** A bare `Bash` in `allow`, 6 `ask` rules for commit, push and publish, and `scripts/guard.js`, a 1,400-line `PreToolUse` hook that reads the shell and answers `ask` before 5 kinds of harm. `docs/manual/settings.md` → `### hooks` describes it.

The third design works. It needed a hand-written shell reader because a rule cannot say "ask before a delete of an uncommitted file", or even "ask before `git push` however it is spelled".

## 1. A permission rule is text with one wildcard

**What happens.** A Bash rule matches the command's text. `*` is the only special character, standing for any text. There are no regular expressions, no character classes, no "one of these flags", and nothing that knows a flag from a path.

**What the docs say.** `permissions.md` → `### Wildcard patterns`: "A `*` in a Bash rule matches any text, including spaces … A rule with no `*` matches one exact command." Its own warning: "Bash permission patterns that try to constrain command arguments are fragile", with `Bash(curl http://github.com/ *)` missing `curl -X GET http://github.com/...`.

**How to reproduce.** Add `"ask": ["Bash(git push *)"]`, then have Claude run each of these. The first asks. The other 2 run unasked:

```sh
git push origin main
git -C . push origin main
bash -c 'git push origin main'
```

A deny or ask rule meant as a safety net has the same hole. `Bash(rm -rf *)` misses `rm -fr`, `rm -r -f` and `find . -delete`.

**What it cost Flow.** Every danger Flow wanted to ask about had to move into a hook, and the hook had to parse shell: quotes, `$(…)`, here-docs, `bash -c`, `xargs`, `cd`. That is `scripts/guard.js`, 1,400 lines, work Claude Code already does internally when it splits a compound command.

**The change to ask for.**

- Regular expressions in a rule, such as `Bash(/^git\s+(-C\s+\S+\s+)?push\b/)`.
- Better still, rules matched against the parsed command Claude Code already builds: program, subcommand, flags, and the words after them. For example, `{ "program": "git", "subcommand": "push", "flags": ["--force", "-f"] }`, matched however the command is wrapped or chained.

## 2. "Don't ask again" saves rules that never match again

**What happens.** Answering "Yes, and don't ask again" saves a rule to `.claude/settings.local.json`. Often the saved rule is the exact command, full paths, quotes and arguments included. It matches that one command, and the next command like it asks again.

**The evidence.** This repository's `.claude/settings.local.json`, accumulated over a month of sessions:

- 129 saved rules, 115 of them for Bash.
- 100 of the 115 are one exact command, with no `*`.
- 13 carry a full path.

A sample, verbatim:

```text
Bash(FLOW_HOME=/home/me/code/flow/wip node scripts/flow/flow.js study-case ls --issue premature-implementation)
Bash(export FLOW_PROJECT=/home/me/code/flow/tmp/prio)
Bash(git -C /home/me/code/flow diff --stat home/CLAUDE.md)
Bash(grep -n -E '^#{2,3} ' lab/remaining.md)
Bash(awk '/^## Rendering/{exit} {print}' tmp/claude-md-draft.md)
```

Not one of these will match again. The file only grows, and reading it tells you nothing about what is allowed.

**Tested 2026-09-24** in tmux sessions, recorded in `lab/context/state.md`. A lone command is offered a pattern: `npm view *` for `npm view left-pad`. A chained command is offered one rule per piece, and a piece can come back exact: `npm view left-pad version && curl -sI https://example.com` offered `npm view *` and `curl -sI https://example.com`. An environment variable in front of a command, such as `FLOW_HOME=…`, lands in the saved rule whole.

**The change to ask for.**

- Always offer a pattern, never the exact command: the program and subcommand followed by `*`.
- Drop leading variable assignments and absolute paths from the offered rule.
- Show the rule before saving it, and let it be edited in the prompt.

## 3. A loop or a variable asks even when every program is allowed

**What happens.** With `Bash(echo *)` and `Bash(wc *)` both allowed, a loop over them still asks:

```sh
for f in docs/*.md; do echo "$f"; wc -l "$f"; done
```

No rule can approve that shape, since the rule would have to match the whole text of the loop. Answering "don't ask again" saves that one loop, word for word, which is section 2 again.

**What the docs say.** `permissions.md` → `#### Read-only commands` lists more cases that prompt although every part is harmless: an unquoted glob with `find`, `sort`, `sed` or `git`, because "the glob could expand to a flag like `-delete`", and `cd` with `git`, because "running `git` in a new directory can execute that directory's hooks".

**Why it matters.** Claude writes loops, `$(…)` and variables constantly. Each one stopped the session for a yes the user always gave. This is what pushed Flow from a list of safe programs to allowing everything.

**The change to ask for.** Judge a compound command by its parts. When every command inside a loop, a `$(…)` or a pipeline matches an allow rule, and no redirect writes outside the working directories, run it.

## 4. Auto mode is no answer

Auto mode is Claude Code's own fix for prompts: a second model, the classifier, reviews each call and blocks what looks beyond the request. The user ruled it out for Flow on 2026-09-28, for these reasons.

- **It costs extra.** `permission-modes.md`: "classifier calls count toward your token usage" on Enterprise plans and API accounts. "Each check sends a portion of the transcript plus the pending action, adding a round-trip before execution."
- **Its review fails on its own.** A failed check blocks the call, with a message that auto mode "cannot determine the safety" of an action, or that the server returned no safety verdict. The docs add that Claude Code "stops the turn after ten responses in a row with no verdict". Flow sessions hit both messages.
- **It blocks what the user already agreed to.** The classifier judges the action, and misses the conversation that led to it. An edit to a settings file, or a delete the user approved a message earlier, gets blocked as destructive or as Claude changing its own setup. It refused Flow's own `~/.flow/run.json` that way. Each block costs a question anyway.
- **It changes how Claude behaves.** The docs: "Auto mode also nudges Claude to keep working without stopping for clarifying questions." Flow's first rule is the opposite: a message that is not an instruction gets a reply and no edit.
- **It sets broad allow rules aside.** "On entering auto mode, broad allow rules that grant arbitrary code execution are dropped", a blanket `Bash(*)` first among them. A setup built on allowing every shell command stops working the moment auto mode starts.
- **It is the default without asking.** Since 2.1.228, a terminal session on a Pro, Max or Team plan starts in `auto` unless a settings file names another mode. Setting `"auto"` in a project's `.claude/settings.json` "doesn't take effect", and Claude Code then ignores the user's own `defaultMode` too, falling back to the built-in default.
- **It keeps offering itself.** After switching away, prompts still carry a "switch to auto mode" option, and a banner suggests it again. The user switched modes on purpose, and does not want the question back.

**The change to ask for.**

- Once a user leaves auto mode, stop offering it, in prompts and in banners, until they turn it on again.
- Let a setting turn the offer off for good.
- Let the classifier see the conversation's recent turns, so an action the user just approved is not blocked as unrequested.
- On a failed review, ask the user rather than deny.

## 5. A hook's prompt is cluttered and offers only Yes or No

**What happens.** A `PreToolUse` hook answering `ask` produces this, seen live on 2026-09-28:

```text
 for f in tmp/guard-demo/notes.md; do rm "$f"; done; ls tmp/guard-demo
   Delete the demo's new file inside a loop

 │ Hook PreToolUse:Bash requires confirmation for this command:
 │ Deletes tmp/guard-demo/notes.md, a new file git has no copy of
 settings.json to update hooks

 Do you want to proceed?
 ❯ 1. Yes
   2. No
```

The hook controls one line, the reason. The header, the settings hint and the 2 answers are Claude Code's own.

**What the docs say.** `hooks.md` → PreToolUse decision control: `permissionDecisionReason` is, "for `"allow"` and `"ask"`, shown to the user but not Claude". Nothing else in the prompt is configurable.

**Why it matters.** The user reads the command, the line saying what it is for, and the reason. The header and the hint repeat on every hook prompt and say nothing about this command. A hook also cannot offer "allow for the rest of this session", so a guard asking about a command the user trusts asks again every time.

**The change to ask for.**

- Let a hook replace the header, or drop it, and hide the settings hint.
- Let a hook offer a third answer, "yes for this session", scoped by a pattern the hook supplies.

## 6. The sandbox breaks ordinary tools

The sandbox is a wall the operating system puts around each shell command. Inside it, commands run without asking. Flow looked at it as the fix for prompts, and ruled it out.

- **It needs extra system packages.** `bubblewrap` and `socat` on Linux and WSL. On Ubuntu 24.04 and later, AppArmor also has to allow bubblewrap to create user namespaces. It never runs on Windows outside WSL.
- **It breaks tools.** Docker, dev containers, jest's file watcher and package caches outside the project fail inside it, and Claude Code's own settings files cannot be written from it.
- **A failure moves the prompt instead of removing it.** `sandboxing.md` → "The unsandboxed retry escape hatch": a command that fails inside the wall is retried outside it, which "goes through the regular permission flow. In Manual mode you get a confirmation prompt." Turning the retry off with `allowUnsandboxedCommands: false` means those commands never run at all.

Recorded in `lab/research/claude-code-docs/sandboxing.md` and `docs/manual/settings.md` → `#### Why every shell command is allowed`.

**The change to ask for.** Nothing specific. The sandbox is a different tool from a permission rule. The report records it so an issue about sections 1 to 3 is not answered with "use the sandbox".

## 7. Prompts no setting can turn off

These ask whatever the allow list, a hook or the mode says. Each is a reasonable safety net, recorded here as a limit rather than a complaint.

- **A delete aimed at a critical path**, such as `rm -rf /` or `rm -rf ~`. `permission-modes.md`: Claude Code "never lets a `permissions.allow` rule or a `PreToolUse` hook that returns `"allow"` approve" one.
- **A write into a protected path**: `.git`, `.claude`, `.vscode`, `.idea`, `.husky` and similar. No allow rule pre-approves one outside `bypassPermissions`.
- **A redirect or `tee` writing outside the working directories**, or to a target holding `~` or a glob, checked as if Claude edited that file.

**The change to ask for.** Optional: let a hook's `allow` approve a protected-path write inside the project, since a hook can read exactly which file it is.

## Issues to file

Most useful first. Each links the section holding its evidence.

1. **Regular expressions, or matching on the parsed command, in permission rules.** [Section 1](#1-a-permission-rule-is-text-with-one-wildcard).
2. **"Don't ask again" saves a pattern, never the exact command, and shows it for editing first.** [Section 2](#2-dont-ask-again-saves-rules-that-never-match-again).
3. **A compound command runs when every part is allowed.** [Section 3](#3-a-loop-or-a-variable-asks-even-when-every-program-is-allowed).
4. **Auto mode stays off once the user leaves it, with a setting to stop the offer for good.** [Section 4](#4-auto-mode-is-no-answer).
5. **A hook controls its prompt's header and can offer "yes for this session".** [Section 5](#5-a-hooks-prompt-is-cluttered-and-offers-only-yes-or-no).
6. **The auto-mode classifier sees recent turns, and asks rather than denies when its review fails.** [Section 4](#4-auto-mode-is-no-answer).

Filing publishes on Anthropic's public repository, so each goes out by the user's hand. Before filing, search the repository's open issues for each, and add evidence to an existing one rather than opening a duplicate.
