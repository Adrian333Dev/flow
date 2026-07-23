#!/usr/bin/env bash
# SessionStart hook — verify the global companion skills this workflow depends on.
# Prints nothing when everything is installed, so it costs zero context after setup.

proj="${CLAUDE_PROJECT_DIR:-.}"

missing=()
for skill in brainstorm research explain capture-context execute; do
  if [ ! -e "$HOME/.claude/skills/$skill" ] && [ ! -e "$proj/.claude/skills/$skill" ]; then
    missing+=("$skill")
  fi
done

if [ ${#missing[@]} -gt 0 ]; then
  echo "MISSING REQUIRED SKILLS: ${missing[*]}"
  echo "This workflow depends on them and cannot run properly without them."
  echo "Do NOT improvise their function. Stop and tell the user to install them:"
  echo "  npx skills add Adrian333Dev/flow-skills"
fi
