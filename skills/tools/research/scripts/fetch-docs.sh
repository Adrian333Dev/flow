#!/usr/bin/env bash
# fetch-docs.sh: download a tool's current docs into its wiki folder,
# ~/.flow/wiki/<tool>/downloads/. Part of the `/flow:research` skill. Runs from
# any folder. FLOW_HOME moves ~/.flow, for a trial.
#
# Usage:
#   fetch-docs.sh <tool> <domain> [--package <name>] [--repo <owner/repo>] [--clone] [url...]
#
#   <tool>       the wiki folder: the tool's GitHub repository name, such as next.js
#   <domain>     bare domain, such as nextjs.org: llms.txt candidates are derived
#                from it. "-" skips them and fetches only the URLs given
#   --package    the npm package, such as next: its latest release is logged
#   --repo       the GitHub repository: its latest release is logged where no
#                package is given, and --clone clones it
#   --clone      clone the source into downloads/repo/, or pull an existing clone
#   [url...]     single pages, fetched as they are into downloads/pages/
#
# Tries the known llms.txt locations in a chain, keeps the first real hit per
# variant (rejects HTML error pages), and fetches both llms.txt and
# llms-full.txt where both exist. Every file saved gets one line in
# downloads/_sources.md: the address, the date, and the tool's latest release
# that day. downloads/.gitignore keeps the whole folder out of git.

set -u

usage='usage: fetch-docs.sh <tool> <domain> [--package <name>] [--repo <owner/repo>] [--clone] [url...]'
tool="${1:?$usage}"
domain="${2:?$usage}"
shift 2

package='' repo='' clone='' urls=()
while [ $# -gt 0 ]; do
  case "$1" in
    --package) package="${2:?$usage}"; shift 2 ;;
    --repo) repo="${2:?$usage}"; shift 2 ;;
    --clone) clone=1; shift ;;
    *) urls+=("$1"); shift ;;
  esac
done
if [ -n "$clone" ] && [ -z "$repo" ]; then
  echo "--clone needs --repo <owner/repo>" >&2
  exit 1
fi

dest="${FLOW_HOME:-$HOME/.flow}/wiki/$tool/downloads"
mkdir -p "$dest"
[ -e "$dest/.gitignore" ] || echo '*' > "$dest/.gitignore"
meta="$dest/_sources.md"
touch "$meta"

# The tool's latest release today, from npm or GitHub. Empty when neither says.
release=''
if [ -n "$package" ]; then
  release=$(npm view "$package" version 2>/dev/null)
elif [ -n "$repo" ]; then
  release=$(gh release view --repo "$repo" --json tagName --jq .tagName 2>/dev/null)
fi
stamp="$(date +%F)${release:+, latest release then $release}"

# log <name> <source>: one line per file, replacing the file's earlier line
log() {
  grep -vF -- "- \`$1\` <- " "$meta" > "$meta.part"
  echo "- \`$1\` <- $2 ($stamp)" >> "$meta.part"
  mv "$meta.part" "$meta"
}

# fetch <url> <path under downloads/>: succeeds only on HTTP 200 with non-empty, non-HTML content
fetch() {
  local url="$1" out="$dest/$2" code
  code=$(curl -sL --max-time 120 -o "$out.part" -w '%{http_code}' "$url" 2>/dev/null) || { rm -f "$out.part"; return 1; }
  if [ "$code" != "200" ] || [ ! -s "$out.part" ] || head -c 512 "$out.part" | grep -qi '<html\|<!doctype'; then
    rm -f "$out.part"
    return 1
  fi
  mv "$out.part" "$out"
  log "$2" "$url"
  echo "saved: $out ($(wc -c < "$out" | tr -d ' ') bytes)"
}

# llms.txt discovery: chained candidates, first real hit per variant wins
if [ "$domain" != "-" ]; then
  for variant in llms-full.txt llms.txt; do
    for base in "https://$domain" "https://docs.$domain" "https://$domain/docs"; do
      fetch "$base/$variant" "$variant" && break
    done
  done
  if [ ! -e "$dest/llms.txt" ] && [ ! -e "$dest/llms-full.txt" ]; then
    echo "no llms.txt: $domain"
  fi
fi

# single pages, fetched as they are
for url in "${urls[@]}"; do
  mkdir -p "$dest/pages"
  name="${url%%\?*}"; name="${name%/}"; name="${name##*/}"
  [ -n "$name" ] || name="page-$(date +%s)"
  case "$name" in *.md|*.mdx|*.txt) ;; *) name="$name.md" ;; esac
  fetch "$url" "pages/$name" || echo "missed: $url"
done

# the source, cloned once and pulled after
if [ -n "$clone" ]; then
  source="https://github.com/$repo"
  if [ -d "$dest/repo/.git" ]; then
    git -C "$dest/repo" pull --ff-only --quiet && log 'repo/' "$source" && echo "pulled: $dest/repo"
  else
    git clone --depth 1 --quiet "$source" "$dest/repo" && log 'repo/' "$source" && echo "cloned: $dest/repo"
  fi || echo "missed: $source"
fi

# nothing saved, ever: leave no folder behind
if [ ! -s "$meta" ]; then
  rm -f "$meta" "$dest/.gitignore"
  rmdir "$dest/pages" "$dest" "${dest%/downloads}" 2>/dev/null
fi
exit 0
