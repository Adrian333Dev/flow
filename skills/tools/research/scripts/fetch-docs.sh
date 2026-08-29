#!/usr/bin/env bash
# fetch-docs.sh — download current docs for a tool into the local research cache.
# Part of the `/research` skill. Run from the project root.
#
# Usage:
#   fetch-docs.sh <tool> <domain> [url...]
#
#   <tool>    cache folder name — files land in tmp/references/<tool>/
#   <domain>  bare domain (e.g. ai-sdk.dev) — llms.txt candidates are derived
#             from it. Pass "-" to skip discovery and only fetch the extra URLs.
#   [url...]  extra URLs fetched verbatim (individual doc pages, raw markdown)
#
# Tries the known llms.txt locations in a chain and keeps the first real hit
# per variant (rejects HTML error pages), fetches BOTH llms.txt and
# llms-full.txt when available, and records source URL + fetch date in
# tmp/references/<tool>/_sources.md

set -u

tool="${1:?usage: fetch-docs.sh <tool> <domain> [url...]}"
domain="${2:?usage: fetch-docs.sh <tool> <domain> [url...]}"
shift 2

dest="tmp/references/$tool"
mkdir -p "$dest"
meta="$dest/_sources.md"

# fetch <url> <outfile> — succeeds only on HTTP 200 with non-empty, non-HTML content
fetch() {
  local url="$1" out="$2" code
  code=$(curl -sL --max-time 120 -o "$out.part" -w '%{http_code}' "$url" 2>/dev/null) || { rm -f "$out.part"; return 1; }
  if [ "$code" != "200" ] || [ ! -s "$out.part" ] || head -c 512 "$out.part" | grep -qi '<html\|<!doctype'; then
    rm -f "$out.part"
    return 1
  fi
  mv "$out.part" "$out"
  echo "- \`${out##*/}\` <- $url ($(date +%F))" >> "$meta"
  echo "saved: $out ($(wc -c < "$out" | tr -d ' ') bytes) <- $url"
}

# llms.txt discovery — chained candidates, first real hit per variant wins
if [ "$domain" != "-" ]; then
  for variant in llms-full.txt llms.txt; do
    for base in "https://$domain" "https://docs.$domain" "https://$domain/docs"; do
      fetch "$base/$variant" "$dest/$variant" && break
    done
  done
  if [ ! -e "$dest/llms.txt" ] && [ ! -e "$dest/llms-full.txt" ]; then
    echo "no llms.txt found for $domain — fall back: Context7 -> web search -> ask the user"
  fi
fi

# extra URLs, fetched verbatim
for url in "$@"; do
  name="${url%%\?*}"; name="${name%/}"; name="${name##*/}"
  [ -n "$name" ] || name="page-$(date +%s)"
  case "$name" in *.md|*.mdx|*.txt) ;; *) name="$name.md" ;; esac
  fetch "$url" "$dest/$name" || echo "MISS: $url"
done
