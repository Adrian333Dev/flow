#!/usr/bin/env bash
# skills-search.sh: a wide search of skills.sh, the index of public skills, for
# a survey of what exists. Part of the `/flow:research` skill. Runs from any
# folder.
#
# Usage:
#   skills-search.sh <wording>... [--owner <owner>] [--top <n>]
#
#   <wording>  one search each, up to 100 results apiece from the site's API,
#              where `npx skills find` shows about 8
#   --owner    keeps only skills from that GitHub account
#   --top      how many lines to print, 40 by default
#
# Prints one line per skill, the ones most wordings found first, then the ones
# the site ranked highest for any wording:
#   <installs>  <owner/repo>@<skill>  <hits>/<wordings>
# A wording the site fails to answer in 15 seconds is named on stderr and
# skipped. All of them failing exits 1. SKILLS_URL moves the service, for a
# trial.

set -u

usage='usage: skills-search.sh <wording>... [--owner <owner>] [--top <n>]'
base="${SKILLS_URL:-https://skills.sh}"
owner='' top=40 wordings=()

while [ $# -gt 0 ]; do
  case "$1" in
    --owner) owner="${2:?$usage}"; shift 2 ;;
    --top) top="${2:?$usage}"; shift 2 ;;
    -*) echo "$usage" >&2; exit 1 ;;
    *) wordings+=("$1"); shift ;;
  esac
done
[ ${#wordings[@]} -eq 0 ] && { echo "$usage" >&2; exit 1; }

answers=()
for wording in "${wordings[@]}"; do
  if body=$(curl -sfG --max-time 15 --data-urlencode "q=$wording" --data-urlencode limit=100 "$base/api/search"); then
    answers+=("$body")
  else
    echo "skills.sh: no answer for \"$wording\", skipped" >&2
  fi
done
[ ${#answers[@]} -eq 0 ] && { echo "skills.sh: unavailable"; exit 1; }

node -e '
  const [owner, top, total, ...bodies] = process.argv.slice(1);
  const found = new Map();
  for (const body of bodies) {
    let skills = [];
    try { skills = JSON.parse(body).skills || []; } catch { continue; }
    skills.forEach((s, place) => {
      if (owner && !s.source.toLowerCase().startsWith(owner.toLowerCase() + "/")) return;
      const seen = found.get(s.id) || { name: `${s.source}@${s.skillId}`, installs: s.installs || 0, hits: 0, best: place };
      seen.hits++;
      seen.best = Math.min(seen.best, place);
      found.set(s.id, seen);
    });
  }
  // ties go to the relevance order of the site: by installs, popular skills
  // unrelated to the need crowd out the ones that fit
  const ranked = [...found.values()].sort((a, b) => b.hits - a.hits || a.best - b.best);
  for (const s of ranked.slice(0, Number(top))) console.log(`${String(s.installs).padStart(8)}  ${s.name}  ${s.hits}/${total}`);
  console.log(`${found.size} found, ${Math.min(found.size, Number(top))} shown. --top shows more.`);
' "$owner" "$top" "${#wordings[@]}" "${answers[@]}"
