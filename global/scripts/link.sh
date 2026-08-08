#!/usr/bin/env bash
# Link this repo's skills, commands and agents into ~/.claude/.
# Re-run after adding, renaming, or removing any of them. Idempotent.
#
# ~/.claude/{skills,commands,agents}/ are shared with entries Flow does not own
# (other catalogs, plugins, hand-written ones). Link per item, never the whole
# folder — a folder symlink would evict every non-Flow entry and block new ones.
set -euo pipefail

repo="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

# $1 folder name, same on both sides · $2 glob for what to link (folders or files)
link_group() {
  local name="$1" glob="$2"
  local src="$repo/$name" dest="$HOME/.claude/$name"

  [ -d "$src" ] || { echo "skipped: no $name/ in repo"; return 0; }
  mkdir -p "$dest"

  # Drop links that point into this repo but no longer resolve (renamed or removed).
  # Only ever touches broken symlinks whose target is inside this repo — never real files.
  local link
  for link in "$dest"/*; do
    [ -L "$link" ] || continue
    [ -e "$link" ] && continue
    case "$(readlink "$link")" in
      "$src"/*) rm "$link"; echo "unlinked (gone): $name/$(basename "$link")" ;;
    esac
  done

  local path base
  for path in "$src"/$glob; do
    [ -e "$path" ] || continue            # unmatched glob stays literal — skip it
    base="$(basename "${path%/}")"
    ln -sfn "${path%/}" "$dest/$base"
    echo "linked: $name/$base"
  done
}

link_group skills   '*/'      # one folder per skill
link_group commands '*.md'    # one file per command, extension kept — /<name> comes from it
link_group agents   '*.md'    # not built yet; skipped until the folder exists
