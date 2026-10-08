#!/usr/bin/env bash
# claude-code-changes.sh: print Claude Code's release notes newer than the
# last version this repository checked against Flow.
#
#   bash lab/scripts/claude-code-changes.sh
#
# A development script. It ships nowhere.
#
# The last version checked is line 1 of .flow/research/claude-code-updates.md,
# as in "Last checked: 2.1.285". The notes come from Anthropic's CHANGELOG.md
# on GitHub, newest release first, and printing stops at that version. The
# script decides nothing: reading each note against Flow, and moving line 1
# forward, is the agent's job, by the root CLAUDE.md → check-claude-code-updates.
set -euo pipefail

url=https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
record="$root/.flow/research/claude-code-updates.md"

last="$(sed -n '1s/^Last checked: \([0-9][0-9.]*\).*/\1/p' "$record")"
if [ -z "$last" ]; then
  echo "claude-code-changes.sh: line 1 of $record does not read \"Last checked: <version>\"" >&2
  exit 1
fi

notes="$(curl -fsS --max-time 20 "$url")" || {
  echo "claude-code-changes.sh: could not download $url" >&2
  exit 1
}
if ! grep -qx "## $last" <<<"$notes"; then
  echo "claude-code-changes.sh: $last is not in the changelog, so nothing can be cut" >&2
  exit 1
fi

new="$(awk -v last="## $last" '$0 == last { exit } /^## / { seen = 1 } seen' <<<"$notes")"
if [ -z "$new" ]; then
  echo "Nothing newer than $last. Installed: $(claude --version 2>/dev/null || echo unknown)"
  exit 0
fi
echo "Newer than $last: $(grep -c '^## ' <<<"$new") releases. Installed: $(claude --version 2>/dev/null || echo unknown)"
echo
echo "$new"
