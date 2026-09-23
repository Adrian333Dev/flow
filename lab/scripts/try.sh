#!/usr/bin/env bash
# try.sh: a pretend computer with this repo's Flow on it, so a real Claude Code
# or Codex session can run against the repo while nothing is installed.
#
# A development script. It ships nowhere, and `flow install` never links it.
#
# The session runs under bwrap, which only exists on Linux. tmp/try/root/ is
# mounted where the home folder is, and the rest of the disk is read-only, so
# nothing of the real home shows through: no ~/.agents, no ~/.local/bin, no
# ~/.claude. The session writes into tmp/try/ and nowhere else, apart from the
# Claude Code login, below.
#
# --case picks what the pretend computer starts as:
#
#   with-flow   Flow installed by `flow install`, and signed in (the default)
#   empty       signed in to Claude Code and nothing else. The session starts
#               by running install.sh, the way a new user's first step does
#   <name>      a computer saved by lab/scripts/save-computer.sh. It starts
#               with install.sh too
#
# Every run copies the case into tmp/try/root/ afresh, so a test never changes
# a saved computer.
#
# Skills and agents are symlinked rather than copied, so editing one in the
# repo is live inside the running session: write, save, invoke. That is the
# point of it: a change is usually five skills and a global rule, and this is
# the only way to test the whole state at once.
#
# It runs from whichever checkout holds it, so a second checkout at
# ~/code/flow-dev builds a session against that checkout and leaves the stable
# one alone.
#
#   bash lab/scripts/try.sh                    the with-flow case, the app project
#   bash lab/scripts/try.sh --case empty       a computer before Flow
#   bash lab/scripts/try.sh --case my-laptop   a saved computer
#   bash lab/scripts/try.sh --codex            the same, in a Codex session
#   bash lab/scripts/try.sh --project guards   build the scratch project from another seed
#   bash lab/scripts/try.sh --fresh            delete tmp/try first, scratch project included
#
# Run where no terminal is attached, from an agent's shell, it builds
# everything and prints the line that starts the session.
set -euo pipefail

fresh=0
codex=0
project=app
case=with-flow
while [ $# -gt 0 ]; do
  case "$1" in
    --fresh) fresh=1 ;;
    --codex) codex=1 ;;
    --project) project="${2:-}"; shift ;;
    --case) case="${2:-}"; shift ;;
    *) echo "try.sh: unknown argument \"$1\", takes --case <name>, --project <name>, --codex and --fresh" >&2; exit 2 ;;
  esac
  shift
done

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
try="$root/tmp/try"
scratch="$try/root"
home="$scratch/.claude"
proj="$try/project"
computers="$root/tmp/computers"
seeds="$root/lab/scripts/seeds"
program=claude
[ "$codex" = 1 ] && program=codex

case "$case" in
  with-flow|empty) ;;
  *)
    if [ -z "$case" ] || [ ! -d "$computers/$case" ]; then
      echo "try.sh: no case named \"$case\". The cases are with-flow, empty, and the saved computers: $(ls "$computers" 2>/dev/null | tr '\n' ' ')" >&2
      echo "Save this computer with: bash lab/scripts/save-computer.sh <name>" >&2
      exit 2
    fi
    ;;
esac
if [ -z "$project" ] || [ ! -e "$seeds/$project/seed.sh" ]; then
  echo "try.sh: no project named \"$project\", the projects are: $(ls "$seeds" | tr '\n' ' ')" >&2
  exit 2
fi
if ! command -v bwrap >/dev/null; then
  echo "try.sh: the session runs under bwrap, and bwrap is not on the PATH" >&2
  exit 2
fi

# The pretend computer is rebuilt every run. The scratch project is not, and
# this is the fix: it accumulates the tickets, handoffs and inbox entries a
# real test needs, and wiping it every run left nothing to test against.
# --fresh takes it out. tmp/computers/ is never touched.
[ "$fresh" = 1 ] && rm -rf "$try"
rm -rf "$scratch"
mkdir -p "$scratch" "$home" "$proj"

# The first-run answers: the account and the onboarding flag from
# ~/.claude.json, the theme from ~/.claude/settings.json. Each is stored, and
# none of them in the credential file. Without them the whole sequence runs
# again every time: a theme, the terminal key binding, then a login.
#
# Named keys, never the whole file. The real ~/.claude.json also carries every
# project opened on this machine, every MCP server ever connected and every
# skill's usage count: none of which a session pretending to be a fresh install
# should see. A saved computer keeps its own whole file instead.
first_run() {
  node - "$HOME/.claude.json" "$HOME/.claude/settings.json" "$scratch/.claude.json" "$home/settings.json" <<'NODE'
const fs = require('fs');
const [state, settings, stateOut, settingsOut] = process.argv.slice(2);

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
fs.writeFileSync(stateOut, `${JSON.stringify(seed, null, 2)}\n`);

// The theme travels on its own, because it is answered during onboarding and
// then written to settings.json. It stays out of home/settings.json: that
// template is public, and a colour choice belongs to the machine.
const { theme } = read(settings);
if (theme) {
  const scratch = read(settingsOut);
  scratch.theme = theme;
  fs.writeFileSync(settingsOut, `${JSON.stringify(scratch, null, 2)}\n`);
}
NODE
}

creds="$HOME/.claude/.credentials.json"
[ -e "$creds" ] || echo "warning: no credentials at $creds, the scratch session will ask you to log in"

# ---- the sandbox ------------------------------------------------------------

# The session's view of the disk. The whole disk read-only, then the scratch
# root mounted over the home folder at its real path, so ~ and every path
# built from it read the way they do on a real machine. Three things come back
# in: the repo, read-only, since skills link into it; tmp/try, writable, which
# holds the scratch root and the project; and the programs the session runs,
# which live under the real home folder here.
#
# The login is the one file bound writable from the real home. Claude Code
# renews it by writing it, and a copy that renewed would use up the refresh
# token the real file holds.
#
# --clearenv, then only what a terminal needs: a variable exported in this
# shell, CLAUDE_CONFIG_DIR or FLOW_HOME among them, would leak the real
# machine back in.
node_dir="$(dirname "$(dirname "$(readlink -f "$(command -v node)")")")"
path="$HOME/.local/bin:$node_dir/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
box=(bwrap --die-with-parent --ro-bind / / --dev /dev --proc /proc --tmpfs /tmp
  --bind "$scratch" "$HOME"
  --ro-bind "$root" "$root"
  --bind "$try" "$try"
  --ro-bind "$node_dir" "$node_dir")
[ -e "$creds" ] && box+=(--bind "$creds" "$creds")

# A program installed under the home folder is bound in at its real path, and
# linked from the scratch ~/.local/bin the way its installer links it. One
# living in a bin/ folder brings the folder above, which holds what it loads.
bring() {
  local found real
  found="$(command -v "$1" 2>/dev/null)" || { echo "try.sh: no $1 on the PATH" >&2; exit 2; }
  real="$(readlink -f "$found")"
  mkdir -p "$scratch/.local/bin"
  ln -sfn "$real" "$scratch/.local/bin/$1"
  [ "$(basename "$(dirname "$real")")" = bin ] && real="$(dirname "$(dirname "$real")")"
  case "$real" in "$HOME"/*) box+=(--ro-bind "$real" "$real") ;; esac
}

box+=(--clearenv --setenv HOME "$HOME" --setenv PATH "$path"
  --setenv USER "$USER" --setenv TERM "${TERM:-xterm-256color}" --setenv LANG "${LANG:-C.UTF-8}")
for name in COLORTERM WSL_DISTRO_NAME WSL_INTEROP DISPLAY WAYLAND_DISPLAY; do
  [ -n "${!name:-}" ] && box+=(--setenv "$name" "${!name}")
done

# ---- the case ---------------------------------------------------------------

# Git settings come along in every case: the scratch project commits, and a
# computer without a git identity is not one Flow ever meets. A saved computer
# brings its own over this copy.
[ -e "$HOME/.gitconfig" ] && cp "$HOME/.gitconfig" "$scratch/.gitconfig"

case "$case" in
  empty) first_run ;;
  with-flow) ;;
  *) cp -a "$computers/$case/." "$scratch/" ;;
esac

# Claude Code comes in every case, since install.sh checks for it, and Codex
# with --codex. Brought after a saved computer is copied, so its own links to
# them are replaced by ones that resolve inside the sandbox.
bring claude
[ "$codex" = 1 ] && bring codex

if [ "$case" = with-flow ]; then
  # `flow install` itself, run inside the sandbox with no --root, so every link
  # it makes is the one a real machine gets: ~/.local/bin/flow included.
  #
  # --new-session takes the terminal away, so the install's 2 questions are
  # skipped rather than asked behind the silenced output.
  #
  # --no-clone, so a scratch session never reaches the network: util, the
  # toolbox and the skill repositories stay uncloned, and the session has
  # Flow's own skills alone. --drafts always, because a draft that cannot be
  # tested is the one thing this script exists to make testable.
  "${box[@]}" --new-session --chdir "$root" node "$root/scripts/flow/flow.js" install \
    --no-clone --drafts </dev/null >/dev/null
  # On a real machine /flow:setup-machine merges Flow's hooks into
  # settings.json. This case stands for a machine where setup already ran.
  cp "$root/home/settings.json" "$home/settings.json"
  first_run
fi

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
# A project is built from a seed, a folder under lab/scripts/seeds/: files/ is
# copied into the project, then seed.sh runs with FLOW_JS and PROJ set and
# builds the board. The default, app, is a small real program with tickets
# that fit it, so the phase skills run against code. The manual's captured
# examples come from it.
if [ ! -e "$proj/.git" ]; then
  cp -r "$root/project-template/." "$proj/"
  git -C "$proj" init --quiet
  [ -d "$seeds/$project/files" ] && cp -r "$seeds/$project/files/." "$proj/"
  FLOW_JS="$root/scripts/flow/flow.js" FLOW_PROJECT="$proj" PROJ="$proj" bash "$seeds/$project/seed.sh"
  echo "built the scratch project at $proj from the $project seed"
fi

# ---- start it ---------------------------------------------------------------

# The session starts from a script, since the bwrap line is too long to copy
# by hand. The script is rewritten every run, with the rest of the computer.
#
# Every case but with-flow starts at install.sh, run from this checkout with
# --use, so the test covers edits nobody has committed. The session opens once
# the install ends.
if [ "$case" = with-flow ]; then
  inside=("$program")
else
  inside=(bash -c 'bash "$1" --use "$2" --no-clone --drafts && exec "$3"' install
    "$root/install.sh" "$root" "$program")
fi
launcher="$try/sandbox.sh"
{
  echo '#!/usr/bin/env bash'
  echo "# Written by lab/scripts/try.sh: the scratch session, on the $case case."
  printf 'exec'
  printf ' %q' "${box[@]}" --chdir "$proj" "${inside[@]}"
  echo
} > "$launcher"

if [ -t 0 ]; then
  exec bash "$launcher"
fi

cat <<EOF

built $try, on the $case case
  root/        the pretend computer's home folder, mounted at $HOME
  project/     a git repo carrying the project template, kept between runs
  sandbox.sh   the bwrap line that starts the session

start the session from a terminal:

  bash $launcher

EOF
