#!/usr/bin/env bash
# Link every skill in this repo into ~/.claude/skills/.
# Re-run after adding, renaming, or removing a skill. Idempotent.
set -euo pipefail

repo="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
src="$repo/skills"
dest="$HOME/.claude/skills"

[ -d "$src" ] || { echo "no skills/ folder at $src" >&2; exit 1; }
mkdir -p "$dest"

# Drop links that point into this repo but no longer resolve (renamed or removed skills).
# Only ever touches broken symlinks whose target is inside this repo — never real files.
for link in "$dest"/*; do
  [ -L "$link" ] || continue
  [ -e "$link" ] && continue
  case "$(readlink "$link")" in
    "$src"/*) rm "$link"; echo "unlinked (gone): $(basename "$link")" ;;
  esac
done

for dir in "$src"/*/; do
  name="$(basename "$dir")"
  ln -sfn "${dir%/}" "$dest/$name"
  echo "linked: $name"
done
