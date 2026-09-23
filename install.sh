#!/usr/bin/env bash
# install.sh: put Flow on this machine, from one pasted line.
#
#   curl -fsSL https://raw.githubusercontent.com/Adrian333Dev/flow/<version>/install.sh | bash
#
# It clones Flow into ~/.flow/repos/flow/, then hands over to `flow install`,
# which does every other step. Running it again changes nothing: a clone that
# exists is never cloned again, and `flow install` leaves a set-up machine
# alone. Updating Flow is `flow up`, never this.
#
#   bash install.sh --use <folder>   use that folder as Flow and clone nothing
#
# Every other argument goes on to `flow install`.
set -euo pipefail

# Everything sits in a function called on the last line, so a download cut off
# halfway runs nothing.
main() {
  local version=main # a release writes its own tag here
  local clone="$HOME/.flow/repos/flow" use= args=() missing=

  while [ $# -gt 0 ]; do
    case "$1" in
      --use) use="${2:?--use takes a folder}"; shift ;;
      *) args+=("$1") ;;
    esac
    shift
  done

  for program in git node claude; do
    command -v "$program" >/dev/null || missing+=" $program"
  done
  if [ -n "$missing" ]; then
    echo "Flow needs git, node and claude, and this machine has no:$missing" >&2
    exit 1
  fi

  if [ -n "$use" ]; then
    clone="$(cd "$use" && pwd)"
  elif [ ! -e "$clone" ]; then
    git clone --quiet --branch "$version" https://github.com/Adrian333Dev/flow.git "$clone"
  fi
  exec node "$clone/scripts/flow/flow.js" install "${args[@]}"
}

main "$@"
