#!/usr/bin/env bash
# context7.sh: ask Context7, a web service that answers questions from a
# library's docs, for one version where it holds that version. Part of the
# `/flow:research` skill. Runs from any folder.
#
# Usage:
#   context7.sh search <name> <question>
#   context7.sh ask <id> <question> [--tool <folder>]
#   context7.sh ask <folder>[@<version>] <question>
#
#   search   the libraries Context7 holds under a name: id, branch, the day
#            Context7 last read it, and the versions it can pin
#   ask      the answer, as snippets each naming its source page. An id with a
#            version, /vercel/next.js/v15.1.8, asks for that version
#   <folder> a wiki folder, such as next.js: the id comes from the `Context7:`
#            line of ~/.flow/wiki/<folder>/index.md, and no search runs.
#            next.js@v15.1.8 pins the version
#   --tool   writes the id into that folder's index.md once it has answered
#
# CONTEXT7_API_KEY is sent when set, for higher limits. It works without one.
# Gives up after 15 seconds, on any HTTP error and on a used-up quota: one
# line, and exit 1. CONTEXT7_URL moves the service, for a trial. FLOW_HOME
# moves ~/.flow.

set -u

usage='usage: context7.sh search <name> <question> | ask <id|folder> <question> [--tool <folder>]'
base="${CONTEXT7_URL:-https://context7.com/api}"
wiki="${FLOW_HOME:-$HOME/.flow}/wiki"

# get <path> <param=value>...: the body on success, else one line and exit 1
get() {
  local path="$1" out code args=()
  shift
  for pair in "$@"; do args+=(--data-urlencode "$pair"); done
  [ -n "${CONTEXT7_API_KEY:-}" ] && args+=(-H "Authorization: Bearer $CONTEXT7_API_KEY")
  out=$(curl -sG --max-time 15 -w '\n%{http_code}' "${args[@]}" "$base$path" 2>/dev/null)
  if [ $? -ne 0 ]; then
    echo "context7: unavailable (no answer in 15 seconds)"
    exit 1
  fi
  code="${out##*$'\n'}"
  out="${out%$'\n'*}"
  if grep -qi 'quota exceeded' <<< "$out"; then
    echo "context7: unavailable (monthly quota exceeded)"
    exit 1
  fi
  if [ "$code" != "200" ]; then
    local message
    message=$(node -e 'try { console.log(JSON.parse(process.argv[1]).message || "") } catch { }' "$out" 2>/dev/null)
    case "$code" in
      404) echo "context7: ${message:-not found}" ;;
      *) echo "context7: unavailable (HTTP $code${message:+: $message})" ;;
    esac
    exit 1
  fi
  printf '%s\n' "$out"
}

# the id on the `Context7:` line of a folder's index.md, trailing period dropped
saved_id() {
  sed -n 's/^- Context7: \([^ ]*\).*/\1/p' "$wiki/$1/index.md" 2>/dev/null | head -n 1 | sed 's/\.$//'
}

# save_id <folder> <id>: writes or rewrites the `Context7:` line under `## Live docs`
save_id() {
  local index="$wiki/$1/index.md" line="- Context7: $2"
  mkdir -p "$wiki/$1"
  [ -e "$index" ] || printf '# %s\n\n## Live docs\n' "$1" > "$index"
  if grep -q '^- Context7: ' "$index"; then
    [ "$(saved_id "$1")" = "$2" ] && return
    awk -v line="$line" '/^- Context7: / { print line; next } { print }' "$index" > "$index.part"
  elif grep -q '^## Live docs' "$index"; then
    awk -v line="$line" '{ print } /^## Live docs/ { print line }' "$index" > "$index.part"
  else
    { cat "$index"; printf '\n## Live docs\n%s\n' "$line"; } > "$index.part"
  fi
  mv "$index.part" "$index"
}

command="${1:-}"
case "$command" in
  search)
    name="${2:?$usage}" question="${3:?$usage}"
    body=$(get /v2/libs/search "libraryName=$name" "query=$question") || { echo "$body"; exit 1; }
    node -e '
      for (const lib of JSON.parse(process.argv[1]).results || []) {
        const versions = (lib.versions || []).filter((v) => !v.startsWith("__branch__"));
        console.log(`${lib.id}  ${lib.title}, branch ${lib.branch}, read ${String(lib.lastUpdateDate).slice(0, 10)}`);
        console.log(`  versions: ${versions.join(" ") || "none"}`);
      }' "$body"
    ;;
  ask)
    target="${2:?$usage}" question="${3:?$usage}" tool=''
    [ "${4:-}" = "--tool" ] && tool="${5:?$usage}"
    if [ "${target:0:1}" = "/" ]; then
      id="$target"
    else
      tool="${target%%@*}"
      id=$(saved_id "$tool")
      if [ -z "$id" ]; then
        echo "context7: no Context7 line in $wiki/$tool/index.md"
        exit 1
      fi
      [ "$target" != "$tool" ] && id="$id/${target#*@}"
    fi
    body=$(get /v2/context "libraryId=$id" "query=$question" type=txt) || { echo "$body"; exit 1; }
    # the id without a pinned version is the one worth keeping
    [ -n "$tool" ] && [ "${target:0:1}" = "/" ] && save_id "$tool" "$(sed 's#^\(/[^/]*/[^/]*\).*#\1#' <<< "$id")"
    printf '%s\n' "$body"
    ;;
  *)
    echo "$usage" >&2
    exit 1
    ;;
esac
