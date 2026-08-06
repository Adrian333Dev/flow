#!/usr/bin/env bash
# gsave — git add, commit and push, in one command.
#
#   gsave                     everything, generated message, push
#   gsave "fix the parser"    everything, that message, push
#   gsave -p src,docs "msg"   stage only those paths (comma-separated)
#   gsave -n                  commit, do not push
#   gsave --dry-run           print the commands, run none of them
#
# That is the whole surface. This shortens `add && commit && push`; it is not a
# replacement for git. Amend, revert, rebase, force — plain git commands.

set -euo pipefail

msg=""
push=1
dry=0
paths=()

while [ $# -gt 0 ]; do
  case "$1" in
    -m|--message) msg="${2:?gsave: -m needs a message}"; shift 2 ;;
    -p|--path)    IFS=',' read -r -a _split <<< "${2:?gsave: -p needs a path}"
                  for p in "${_split[@]}"; do [ -n "$p" ] && paths+=("$p"); done
                  shift 2 ;;
    -n|--no-push) push=0; shift ;;
    --dry-run)    dry=1; shift ;;
    -h|--help)    sed -n '2,11p' "$0" | sed 's/^#\( \|$\)//'; exit 0 ;;
    -*)           echo "gsave: unknown option $1 (try gsave --help)" >&2; exit 1 ;;
    *)            if [ -z "$msg" ]; then msg="$1"; shift
                  else echo "gsave: unexpected argument \"$1\" — quote the message" >&2; exit 1; fi ;;
  esac
done

git rev-parse --show-toplevel >/dev/null 2>&1 || { echo "gsave: not inside a git repository." >&2; exit 1; }

run() {
  if [ "$dry" = 1 ]; then
    local out; out=$(printf '%q ' "$@"); echo "  ${out% }"
  else
    "$@"
  fi
}

# No message given: name the files, rather than every commit reading "save".
# Two levels deep reads better than one — "flow/global" beats "flow".
generated_message() {
  local files count where
  files=$(git diff --cached --name-only)
  count=$(printf '%s\n' "$files" | grep -c . || true)
  where=$(printf '%s\n' "$files" | awk -F/ 'NF>1 {print $1"/"$2; next} {print $1}' \
          | sort -u | head -3 | paste -sd', ' -)
  [ -n "$where" ] || where="repo"
  echo "wip: ${count} file(s) — ${where}"
}

if [ ${#paths[@]} -gt 0 ]; then run git add -- "${paths[@]}"; else run git add -A; fi

if [ "$dry" = 1 ] || ! git diff --cached --quiet; then
  [ -n "$msg" ] || msg=$(generated_message)
  run git commit -m "$msg"
else
  echo "gsave: nothing to commit."   # still pushes, so gsave also means "catch the remote up"
fi

[ "$push" = 1 ] || exit 0

# A branch that has never been pushed has no upstream, and a bare push errors.
if git rev-parse --abbrev-ref --symbolic-full-name '@{u}' >/dev/null 2>&1; then
  run git push
else
  run git push -u origin HEAD
fi
