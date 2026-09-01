#!/usr/bin/env bash
# try.sh — a throwaway Claude Code config, so a real session can run against
# this repo while nothing is installed.
#
# A development script. It ships nowhere, and `flow install` never links it.
#
# Everything is built under tmp/, which is gitignored. Three files outside it
# are read and none is written: the credentials, ~/.claude.json and
# ~/.claude/settings.json. Between them they carry the login and every answer
# onboarding asks for, so a scratch session starts signed in. ~/.flow is neither
# read nor written.
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

# The credentials alone leave the session at the first-run screens: a theme, the
# terminal key binding, then a login. Each of those answers is stored, and none
# of them is stored in the credential file. The account and the onboarding flag
# live in ~/.claude.json, and the theme in ~/.claude/settings.json. This config
# is rebuilt every run, so without copying them the whole sequence runs again
# every time.
#
# Named keys, never the whole file. The real ~/.claude.json also carries every
# project opened on this machine, every MCP server ever connected and every
# skill's usage count — none of which a session pretending to be a fresh install
# should see.
node - "$HOME/.claude.json" "$HOME/.claude/settings.json" "$home" <<'NODE'
const fs = require('fs');
const [state, settings, home] = process.argv.slice(2);

const read = (file) => {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return {};
  }
};

const KEYS = [
  'hasCompletedOnboarding',
  'lastOnboardingVersion',
  'shiftEnterKeyBindingInstalled',
  'oauthAccount',
  'userID',
  'installMethod',
  'firstStartTime',
  'numStartups',
];

const real = read(state);
const seed = {};
for (const key of KEYS) if (key in real) seed[key] = real[key];
fs.writeFileSync(`${home}/.claude.json`, `${JSON.stringify(seed, null, 2)}\n`);

// The theme travels on its own, because it is answered during onboarding and
// then written to settings.json. It stays out of home/settings.json: that
// template is public, and a colour choice belongs to the machine.
const { theme } = read(settings);
if (theme) {
  const file = `${home}/settings.json`;
  const scratch = read(file);
  scratch.theme = theme;
  fs.writeFileSync(file, `${JSON.stringify(scratch, null, 2)}\n`);
}
NODE

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
