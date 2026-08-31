#!/usr/bin/env bash
# try.sh — a throwaway Claude Code config, so a real session can run against
# this repo while nothing is installed.
#
# A development script. It ships nowhere, and `flow install` never links it.
#
# Everything is built under tmp/, which is gitignored. The one path reached
# outside the repo is the credential file, symlinked so the scratch session can
# authenticate; ~/.claude and ~/.flow are never read and never written.
#
# Skills and agents are symlinked rather than copied, so editing one in the
# repo is live inside the running session — write, save, invoke. That is the
# point of it: a change is usually five skills and a global rule, and this is
# the only way to test the whole state at once.
#
# It runs from whichever checkout holds it. `flow` resolves its clone from
# __dirname, so a second checkout at ~/code/flow-dev builds a session against
# that checkout and leaves the stable one alone.
#
#   bash lab/scripts/try.sh            rebuild the config, then start a session
#   bash lab/scripts/try.sh --fresh    delete tmp/try first, scratch project included
#   bash lab/scripts/try.sh --print    rebuild, then print the command instead
set -euo pipefail

fresh=0
start=1
for arg in "$@"; do
  case "$arg" in
    --fresh) fresh=1 ;;
    --print) start=0 ;;
    *) echo "try.sh: unknown argument \"$arg\" — takes --fresh and --print" >&2; exit 2 ;;
  esac
done

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
try="$root/tmp/try"
home="$try/home"
flowhome="$try/flow"
proj="$try/project"

# The config is rebuilt every run. The scratch project is not, and this is the
# fix: it accumulates the tickets, handoffs and inbox entries a real test needs,
# and wiping it every run left nothing to test against. --fresh takes it out.
[ "$fresh" = 1 ] && rm -rf "$try"
rm -rf "$home" "$flowhome"
mkdir -p "$home" "$flowhome" "$proj"

# ---- the throwaway config ---------------------------------------------------

# The same command a real machine runs, pointed at tmp/ and told to leave
# ~/.local/bin alone. The scratch session then runs the arrangement a real
# install produces, rather than a second one built by hand here.
#
# Both roots are redirected. --home is what Claude Code reads and --flow-home
# is what only Flow reads; without the second one, scripts/ and references/
# would install into the real ~/.flow.
#
# --drafts always, because a draft that cannot be tested is the one thing this
# script exists to make testable.
node "$root/scripts/flow/flow.js" install \
  --home "$home" --flow-home "$flowhome" --no-bin --drafts >/dev/null

# The hooks name $HOME/.flow/scripts, which is where Flow installs and where
# nothing sits yet. Point them at this config's own scripts symlink instead.
sed "s|\$HOME/.flow/scripts|$flowhome/scripts|g" "$root/home/settings.json" > "$home/settings.json"

creds="$HOME/.claude/.credentials.json"
if [ -e "$creds" ]; then
  ln -sfn "$creds" "$home/.credentials.json"
else
  echo "warning: no credentials at $creds — the scratch session will ask you to log in"
fi

# ---- the scratch project ----------------------------------------------------

# Built once and kept. flow finds the project root through git, and tmp/ sits
# inside the Flow repo — without a repo of its own here, every ticket would
# land in Flow itself.
if [ ! -e "$proj/.git" ]; then
  cp -r "$root/project-template/." "$proj/"
  git -C "$proj" init --quiet
  echo "built the scratch project at $proj"
fi

# ---- start it ---------------------------------------------------------------

# FLOW_HOME sends `flow cases new` into tmp/ as well. Without it a scratch
# session writes study cases into the real ones.
export CLAUDE_CONFIG_DIR="$home"
export FLOW_HOME="$flowhome"

if [ "$start" = 1 ]; then
  cd "$proj"
  # exec, so the session replaces this script rather than starting under it.
  exec claude
fi

cat <<EOF

built $try
  home/     what Claude Code reads — skills and agents linked live
  flow/     what only Flow reads — scripts and references
  project/  a git repo carrying the project template, kept between runs

start the session from the project:

  cd $proj
  CLAUDE_CONFIG_DIR=$home FLOW_HOME=$flowhome claude

EOF
