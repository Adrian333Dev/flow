# This session finishes setting up this machine

`flow install` made Flow's links, joined the Flow home and opened this session. Two jobs remain: the rules in `~/.claude/CLAUDE.md` and the keys in `~/.claude/settings.json`. Ask the user nothing. Report what changed at the end.

The session runs in safe mode, so no rule, plugin or hook of the machine loads. Claude Code asks before the first write to a path holding `.claude`. Tell the user in one line that it is about to ask, and that **allow Claude to edit its own settings for this session** covers the rest.

Flow's clone is `~/.flow/repos/flow/`. Every path below starting `home/` sits inside it. The files as they were before this run are in `~/.flow/logs/before/`.

## Steps

1. **Harvest the old rules.** `~/.flow/logs/before/CLAUDE.md` missing → skip to step 2.
   - Read it whole, and every file it imports with `@`.
   - Sort every line into 1 of 3 places:
     - A rule in `~/.flow/CLAUDE.md` does the same job → drop it. Name that rule before dropping.
     - How the user wants Claude to work, and they would still want it had Flow been there from the start → `## Preferences` in `~/.flow/profile.md`. `Never use em dashes` passes. `Always show me a diff before you edit` fails: it works around a missing workflow.
     - True of the user, and it changes what Claude does → `## The user` in `~/.flow/profile.md`. Never a skill level, what they don't know, or what they are working on.
   - Add only what `~/.flow/CLAUDE.md` and `~/.flow/profile.md` do not say already. One sentence per line, in plain words, replacing a line it sharpens.
   - `~/.flow/CLAUDE.md` holds no line `@~/.flow/profile.md` → say so in the last message: no session loads the profile until it does.
2. **Settings.** Read `~/.claude/settings.json` and `home/settings.json`.
   - The live file ends up holding everything the template names, with the template's value.
   - A hook whose command runs a file under `.flow/scripts/` is Flow's: replace it by the template's. A hook of the user's own stays, unless it works against Flow.
   - Remove what conflicts with Flow. A `deny` rule on a tool a Flow hook or skill uses is one: `SendMessage`, which Flow's `PostToolUse` hook matches.
   - Keep every other key. A key the template lacks, such as `model`, `theme` or `enabledPlugins`, is the user's.
   - Build JSON with `node`, never by hand. The file must parse after the edit.
3. **Check.** Run `flow doctor`. Fix each problem it names in the 2 files above. Name the others in the last message.
4. **Finish.** Run `rm ~/.flow/logs/setup-pending`. Skip it where a step above failed, so the next `flow install` opens this session again.
5. **The last message.**
   - One line per change: the file, what changed, why.
   - Keys kept that `home/settings.json` lacks, by name. A machine rebuilt from GitHub gets the template alone, so the user adds the ones worth keeping there.
   - The copies in `~/.flow/logs/before/` undo a bad edit.
   - End with: "Quit this session and start `claude` again: Flow's rules and hooks load when a session starts."
