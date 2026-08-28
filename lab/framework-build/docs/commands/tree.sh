#!/usr/bin/env bash
# Filtered directory tree. Run from project root.
# Usage: bash docs/commands/tree.sh [path] [--depth N] [--except pattern]
#   --depth N      Limit output depth (default: unlimited)
#   --except pat   Exclude by name, folder name, or glob — repeatable
#                  Examples: --except __tests__  --except .github  --except "*.md"

TARGET="."
DEPTH=""
EXCEPT=()

while [[ $# -gt 0 ]]; do
  case "$1" in
    --depth)  DEPTH="$2";  shift 2 ;;
    --except) EXCEPT+=("$2"); shift 2 ;;
    -*)       shift ;;
    *)        TARGET="$1"; shift ;;
  esac
done

DEFAULT="node_modules|.git|dist|build|.next|.turbo|__pycache__|.cache|coverage|out|.svelte-kit|temp|.venv|vendor|tmp"

if command -v tree &>/dev/null; then
  IGNORE="$DEFAULT"
  for p in "${EXCEPT[@]}"; do IGNORE="$IGNORE|$p"; done

  ARGS=(-a --dirsfirst -I "$IGNORE")
  [[ -n "$DEPTH" ]] && ARGS+=(-L "$DEPTH")
  tree "$TARGET" "${ARGS[@]}"
else
  # find fallback — flat sorted list (best effort when tree not installed)
  PRUNE=()
  first=true
  for seg in node_modules .git dist build .next .turbo __pycache__ .cache coverage out .svelte-kit temp .venv vendor tmp "${EXCEPT[@]}"; do
    $first && PRUNE+=(-name "$seg") || PRUNE+=(-o -name "$seg")
    first=false
  done

  CMD=(find "$TARGET")
  [[ -n "$DEPTH" ]] && CMD+=(-maxdepth "$DEPTH")
  CMD+=(\( "${PRUNE[@]}" \) -prune -o -print)
  "${CMD[@]}" | sort
fi
