#!/usr/bin/env bash
# try.sh — a throwaway ~/.claude, so a real Claude Code session can run against
# this repo while nothing is installed.
#
# Everything is built under tmp/, which is gitignored. The one path reached
# outside the repo is the credential file, symlinked so the scratch session can
# authenticate; ~/.claude itself is never read and never written.
#
# Skills, commands and agents are symlinked rather than copied, so editing one
# in the repo is live inside the running session — write, save, invoke.
#
# It prints the command instead of running it. An interactive session cannot be
# started from inside a script that is already holding the terminal.
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
try="$root/tmp/try"
home="$try/home"
proj="$try/project"

rm -rf "$try"
mkdir -p "$home/flow" "$proj"

# ---- the throwaway ~/.claude ------------------------------------------------

cp "$root/home/CLAUDE.md" "$home/CLAUDE.md"

# The hooks name $HOME/.claude/scripts, which is where Flow installs and where
# nothing sits yet. Point them at this config's own scripts symlink instead.
sed "s|\$HOME/.claude/scripts|$home/scripts|g" "$root/home/settings.json" > "$home/settings.json"

ln -sfn "$root/scripts" "$home/scripts"
ln -sfn "$root/references" "$home/flow/references"
ln -sfn "$root/toolbox" "$home/flow/toolbox"

# One link per entry, matching how link.sh installs. A folder link would work
# here, since nothing else owns this config, but then the scratch session would
# not be running the arrangement the real install produces.
link_each() {
  local name="$1" glob="$2" path
  mkdir -p "$home/$name"
  for path in "$root/$name"/$glob; do
    [ -e "$path" ] || continue
    ln -sfn "${path%/}" "$home/$name/$(basename "${path%/}")"
  done
}
link_each skills   '*/'
link_each commands '*.md'
link_each agents   '*.md'

creds="$HOME/.claude/.credentials.json"
if [ -e "$creds" ]; then
  ln -sfn "$creds" "$home/.credentials.json"
else
  echo "warning: no credentials at $creds — the scratch session will ask you to log in"
fi

# ---- the scratch project ----------------------------------------------------

cp "$root/project-template/CLAUDE.md" "$root/project-template/.gitignore" \
   "$root/project-template/.flow-include" "$proj/"
mkdir -p "$proj/.claude/flow"
: > "$proj/.claude/flow/skills"

# flow finds the project root through git, and tmp/ sits inside the Flow repo.
# Without a repo of its own here, every ticket would land in Flow itself.
git -C "$proj" init --quiet

cat <<EOF

built $try
  home/     a whole ~/.claude — skills, commands and agents linked live
  project/  a git repo carrying the project template

start the session from the project:

  cd $proj
  CLAUDE_CONFIG_DIR=$home claude

EOF
