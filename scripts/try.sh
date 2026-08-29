#!/usr/bin/env bash
# try.sh — a throwaway ~/.claude, so a real Claude Code session can run against
# this repo while nothing is installed.
#
# Everything is built under tmp/, which is gitignored. The one path reached
# outside the repo is the credential file, symlinked so the scratch session can
# authenticate; ~/.claude itself is never read and never written.
#
# Skills and agents are symlinked rather than copied, so editing one in the
# repo is live inside the running session — write, save, invoke.
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

# The same command a real machine runs, pointed at tmp/ and told to leave
# ~/.local/bin alone. The scratch session then runs the arrangement a real
# install produces, rather than a second one built by hand here.
node "$root/scripts/flow/flow.js" install --home "$home" --no-bin >/dev/null

# The hooks name $HOME/.claude/scripts, which is where Flow installs and where
# nothing sits yet. Point them at this config's own scripts symlink instead.
sed "s|\$HOME/.claude/scripts|$home/scripts|g" "$root/home/settings.json" > "$home/settings.json"


creds="$HOME/.claude/.credentials.json"
if [ -e "$creds" ]; then
  ln -sfn "$creds" "$home/.credentials.json"
else
  echo "warning: no credentials at $creds — the scratch session will ask you to log in"
fi

# ---- the scratch project ----------------------------------------------------

# The whole template, dotfiles included — .claude/flow/ carries the skills
# list and the overlays folder, so nothing here builds them by hand.
cp -r "$root/project-template/." "$proj/"

# flow finds the project root through git, and tmp/ sits inside the Flow repo.
# Without a repo of its own here, every ticket would land in Flow itself.
git -C "$proj" init --quiet

cat <<EOF

built $try
  home/     a whole ~/.claude — skills and agents linked live
  project/  a git repo carrying the project template

start the session from the project:

  cd $proj
  CLAUDE_CONFIG_DIR=$home claude

EOF
