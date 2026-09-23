#!/usr/bin/env bash
# save-computer.sh: keep a copy of this computer's Claude Code and Codex setup,
# so lab/scripts/try.sh can start a session on it later with --case <name>.
#
# A development script. It ships nowhere.
#
# The copy lands in tmp/computers/<name>/, laid out the way the home folder is:
# ~/.claude, ~/.agents, ~/.codex, ~/.claude.json, ~/.gitconfig and the links in
# ~/.local/bin. It is made once and never rewritten. The point is to keep a
# computer as it was: this one changes the day Flow is installed on it, and
# the copy is what setup gets tested against after that.
#
# Left out: what a session writes as it goes (transcripts, history, caches,
# snapshots), the logins, and anything a skill carries to run itself, a
# virtualenv or node_modules. That is 800 MB on this computer, which setup
# never reads. What is left is about 50 MB and takes a second.
#
#   bash lab/scripts/save-computer.sh my-laptop
set -euo pipefail

name="${1:-}"
case "$name" in
  '') echo "save-computer.sh: name the copy, as in: bash lab/scripts/save-computer.sh my-laptop" >&2; exit 2 ;;
  empty|with-flow) echo "save-computer.sh: \"$name\" is one of try.sh's own cases, pick another name" >&2; exit 2 ;;
  */*|.*) echo "save-computer.sh: \"$name\" is not a plain name" >&2; exit 2 ;;
esac

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
to="$root/tmp/computers/$name"
if [ -e "$to" ]; then
  echo "save-computer.sh: $to already exists, and a saved computer is never overwritten" >&2
  exit 2
fi
mkdir -p "$to"

skip=(--exclude .venv --exclude node_modules)
[ -d "$HOME/.claude" ] && rsync -a "${skip[@]}" \
  --exclude /projects --exclude /file-history --exclude /history.jsonl \
  --exclude /sessions --exclude /session-env --exclude /shell-snapshots \
  --exclude /paste-cache --exclude /cache --exclude /usage-data --exclude /backups \
  --exclude /telemetry --exclude '/daemon*' --exclude /jobs --exclude /ide \
  --exclude /downloads --exclude /feedback --exclude /debug --exclude /todos \
  --exclude /statsig --exclude /plugins/.trash --exclude /.credentials.json \
  "$HOME/.claude/" "$to/.claude/"
[ -d "$HOME/.agents" ] && rsync -a "${skip[@]}" "$HOME/.agents/" "$to/.agents/"
[ -d "$HOME/.codex" ] && rsync -a "${skip[@]}" \
  --exclude /sessions --exclude '/logs*' --exclude '/*.sqlite*' --exclude /.tmp \
  --exclude /tmp --exclude /cache --exclude /packages --exclude /history.jsonl \
  --exclude /log --exclude /shell_snapshots --exclude /models_cache.json \
  --exclude /auth.json --exclude /.credentials.json \
  "$HOME/.codex/" "$to/.codex/"
[ -e "$HOME/.claude.json" ] && cp "$HOME/.claude.json" "$to/.claude.json"
[ -e "$HOME/.gitconfig" ] && cp "$HOME/.gitconfig" "$to/.gitconfig"
if [ -d "$HOME/.local/bin" ]; then
  mkdir -p "$to/.local/bin"
  find "$HOME/.local/bin" -maxdepth 1 -type l -exec cp -P {} "$to/.local/bin/" \;
fi

echo "saved this computer as $to ($(du -sh "$to" | cut -f1))"
echo "start a session on it: bash lab/scripts/try.sh --case $name"
