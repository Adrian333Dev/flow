#!/usr/bin/env bash
# try.sh: a throwaway install of Flow, so a real Claude Code or Codex session
# can run against this repo while nothing is installed.
#
# A development script. It ships nowhere, and `flow install` never links it.
#
# Everything is built under tmp/try/root/, which stands in for the home folder:
# .agents, .claude and .flow, the same 3 folders a real install fills, and
# .codex with --codex.
# Files outside it are read and none is written: Claude Code's credentials,
# ~/.claude.json and ~/.claude/settings.json, and for --codex ~/.codex/auth.json.
# Between them they carry the login and every answer onboarding asks for, so a
# scratch session starts signed in. ~/.flow and ~/.agents are neither read nor
# written.
#
# Skills and agents are symlinked rather than copied, so editing one in the
# repo is live inside the running session: write, save, invoke. That is the
# point of it: a change is usually five skills and a global rule, and this is
# the only way to test the whole state at once.
#
# It runs from whichever checkout holds it. `flow` resolves its clone from
# __dirname, so a second checkout at ~/code/flow-dev builds a session against
# that checkout and leaves the stable one alone.
#
#   bash lab/scripts/try.sh                rebuild the config, then start a session
#   bash lab/scripts/try.sh --codex        the same install, in a Codex session
#   bash lab/scripts/try.sh --seed guards  build the scratch project from another seed
#   bash lab/scripts/try.sh --fresh        delete tmp/try first, scratch project included
#   bash lab/scripts/try.sh --print        rebuild, then print the command instead
set -euo pipefail

fresh=0
start=1
codex=0
seed=app
while [ $# -gt 0 ]; do
  case "$1" in
    --fresh) fresh=1 ;;
    --print) start=0 ;;
    --codex) codex=1 ;;
    --seed) seed="${2:-}"; shift ;;
    *) echo "try.sh: unknown argument \"$1\", takes --fresh, --print, --codex and --seed <name>" >&2; exit 2 ;;
  esac
  shift
done

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
try="$root/tmp/try"
scratch="$try/root"
home="$scratch/.claude"
flowhome="$scratch/.flow"
proj="$try/project"

# The config is rebuilt every run. The scratch project is not, and this is the
# fix: it accumulates the tickets, handoffs and inbox entries a real test needs,
# and wiping it every run left nothing to test against. --fresh takes it out.
[ "$fresh" = 1 ] && rm -rf "$try"
rm -rf "$scratch"
mkdir -p "$scratch" "$proj"

# ---- the throwaway config ---------------------------------------------------

# The same command a real machine runs, pointed at tmp/ and told to leave
# ~/.local/bin alone. The scratch session then runs the arrangement a real
# install produces, rather than a second one built by hand here.
#
# --root stands in for the home folder, so all 3 folders land under it and
# none in the real one.
#
# --no-clone, so a scratch session never reaches the network: util, the
# toolbox and the skill repositories stay uncloned, and the session has
# Flow's own skills alone.
#
# --drafts always, because a draft that cannot be tested is the one thing this
# script exists to make testable.
node "$root/scripts/flow/flow.js" install \
  --root "$scratch" --no-bin --no-clone --drafts >/dev/null

# The hooks name $HOME/.flow/scripts and $HOME/.flow/references, which is
# where Flow installs and where nothing sits yet. Point them at this config's
# own links instead.
sed "s|\$HOME/.flow/|$flowhome/|g" "$root/home/settings.json" > "$home/settings.json"

creds="$HOME/.claude/.credentials.json"
if [ -e "$creds" ]; then
  ln -sfn "$creds" "$home/.credentials.json"
else
  echo "warning: no credentials at $creds, the scratch session will ask you to log in"
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
# skill's usage count: none of which a session pretending to be a fresh install
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

# Codex keeps its login in auth.json, and renews it by rewriting that file
# when the access token is 5 minutes from expiring. Renewal uses up the old
# refresh token, so a scratch copy renewing would sign the real ~/.codex out.
# A copy whose token has a day left cannot renew during a session, and one
# closer than that is refused: running codex once, anywhere, renews the real
# file, and the next copy is fresh.
if [ "$codex" = 1 ]; then
  auth="$HOME/.codex/auth.json"
  if [ ! -e "$auth" ]; then
    echo "try.sh: no Codex login at $auth, run codex once and sign in" >&2
    exit 2
  fi
  node - "$auth" <<'NODE'
const fs = require('fs');
const auth = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const token = auth.tokens && auth.tokens.access_token;
if (!token) process.exit(0);
const { exp } = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString());
if (exp * 1000 < Date.now() + 24 * 3600 * 1000) {
  console.error('try.sh: the Codex login renews within a day, and a scratch copy renewing it would');
  console.error('sign out the real one. Run codex once from anywhere, then run this again.');
  process.exit(2);
}
NODE
  mkdir -p "$scratch/.codex"
  cp "$auth" "$scratch/.codex/auth.json"
  chmod 600 "$scratch/.codex/auth.json"
fi

# ---- the scratch project ----------------------------------------------------

# Built once and kept. flow finds the project root through git, and tmp/ sits
# inside the Flow repo, without a repo of its own here, every ticket would
# land in Flow itself.
# A seed is a folder under lab/scripts/seeds/: files/ is copied into the
# project, then seed.sh runs with FLOW_JS and PROJ set and builds the board.
# The default, app, is a small real program with tickets that fit it, so the
# phase skills run against code. The manual's captured examples come from it.
seeds="$root/lab/scripts/seeds"
if [ ! -e "$seeds/$seed/seed.sh" ]; then
  echo "try.sh: no seed named \"$seed\", the seeds are: $(ls "$seeds" | tr '\n' ' ')" >&2
  exit 2
fi

if [ ! -e "$proj/.git" ]; then
  cp -r "$root/project-template/." "$proj/"
  git -C "$proj" init --quiet
  [ -d "$seeds/$seed/files" ] && cp -r "$seeds/$seed/files/." "$proj/"
  FLOW_JS="$root/scripts/flow/flow.js" FLOW_PROJECT="$proj" PROJ="$proj" bash "$seeds/$seed/seed.sh"
  echo "built the scratch project at $proj from the $seed seed"
fi

# ---- start it ---------------------------------------------------------------

# FLOW_HOME sends `flow cases new` into tmp/ as well. Without it a scratch
# session writes study cases into the real ones.
#
# Claude Code moves with CLAUDE_CONFIG_DIR alone. Codex finds its skills under
# $HOME/.agents, so its session gets the scratch root as HOME, and CODEX_HOME
# is set as well so the two can never disagree.
if [ "$codex" = 1 ]; then
  env_line="HOME=$scratch CODEX_HOME=$scratch/.codex FLOW_HOME=$flowhome"
  program=codex
else
  env_line="CLAUDE_CONFIG_DIR=$home FLOW_HOME=$flowhome"
  program=claude
fi

if [ "$start" = 1 ]; then
  cd "$proj"
  # exec, so the session replaces this script rather than starting under it.
  exec env $env_line $program
fi

cat <<EOF

built $try
  root/.agents  the plugin folder and the rule file, the one real copy of each
  root/.claude  what Claude Code reads: a link to the plugin, agents, CLAUDE.md
$([ "$codex" = 1 ] && echo "  root/.codex   a copy of the Codex login")
  root/.flow    what only Flow reads: scripts, references and docs
  project/      a git repo carrying the project template, kept between runs

start the session from the project:

  cd $proj
  $env_line $program

EOF
