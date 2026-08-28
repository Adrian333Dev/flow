#!/usr/bin/env bash
# Clone the repos listed in docs/repos.md into repos/. Idempotent: a folder that
# already exists is left alone, so re-running only fills the gaps.
#
# docs/repos.md is the one home for the list. Every entry is a bullet holding the
# folder name and the clone URL, each in backticks:
#
#   - **`name`** — `https://github.com/owner/name.git`
#
# An entry written any other way is skipped silently, which is why the count is
# printed at the end — compare it against the bullets in the file.
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
list="$root/docs/repos.md"
dest="$root/repos"

[ -f "$list" ] || { echo "no docs/repos.md — nothing to clone"; exit 1; }
mkdir -p "$dest"

found=0 cloned=0
while read -r name url; do
  found=$((found + 1))
  if [ -d "$dest/$name" ]; then
    echo "have:    $name"
    continue
  fi
  echo "cloning: $name"
  git clone --quiet "$url" "$dest/$name"
  cloned=$((cloned + 1))
done < <(sed -n 's/^- \*\*`\([^`]*\)`\*\* — `\([^`]*\)`.*/\1 \2/p' "$list")

echo "$found listed, $cloned cloned"
