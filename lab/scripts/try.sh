#!/usr/bin/env bash
# try.sh: a pretend computer, so a real Claude Code or Codex session can run
# against this repo's Flow while nothing is installed on the real one.
#
# A development script. It ships nowhere, and `flow install` never links it.
#
# The session runs under bwrap, which only exists on Linux. A run's home
# folder is mounted where the real one is, and the rest of the disk is
# read-only, so nothing of the real home shows through: no ~/.agents, no
# ~/.local/bin, no ~/.claude. The session writes into its run's folder and
# nowhere else, apart from the Claude Code login, below.
#
# Each run is a folder of its own, tmp/try/<name>/, kept until you delete it:
#
#   home/        the pretend computer's home folder, seen inside as ~
#   home/code/<project>   the scratch project, seen inside as ~/code/<project>
#   remote.git   the stand-in for the GitHub repository ~/.flow/ lives in
#   sandbox.sh   the bwrap line that starts the session, rewritten every run
#
# The first run of a name builds it from a case, then runs install.sh from
# this checkout, the way a new user's first step does: the real install, with
# util, the toolbox and the skill repositories cloned from GitHub, and the
# setup session after it. Running the same name again reopens it as it was
# left, with no install, so a machine that went through setup stays one to
# test on.
#
# --case picks what a new run's computer starts as:
#
#   empty       signed in to Claude Code and nothing else (the default)
#   <name>      a computer saved by lab/scripts/save-computer.sh, copied from
#               tmp/computers/<name>/, which is never changed
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
#   bash lab/scripts/try.sh                                    a new computer, the run named empty
#   bash lab/scripts/try.sh --case before-flow                 a saved computer, the run named before-flow
#   bash lab/scripts/try.sh --case before-flow --name setup-1  the same, the run named setup-1
#   bash lab/scripts/try.sh --name setup-1                     reopen setup-1 as it was left
#   bash lab/scripts/try.sh --name setup-1 --fresh             build setup-1 again from its case
#   bash lab/scripts/try.sh --list                             every run, and how far each got
#   bash lab/scripts/try.sh --delete setup-1                   delete that run
#   bash lab/scripts/try.sh --codex                            a Codex session in place of Claude Code
#   bash lab/scripts/try.sh --project guards                   a new run's project from another seed
#
# Run where no terminal is attached, from an agent's shell, it builds
# everything and prints the line that starts the session.
set -euo pipefail

fresh=0
codex=0
list=0
project=
case=
name=
delete=
while [ $# -gt 0 ]; do
  case "$1" in
    --fresh) fresh=1 ;;
    --codex) codex=1 ;;
    --list) list=1 ;;
    --project) project="${2:-}"; shift ;;
    --case) case="${2:-}"; shift ;;
    --name) name="${2:-}"; shift ;;
    --delete) delete="${2:-}"; shift ;;
    *) echo "try.sh: unknown argument \"$1\", takes --case, --name, --project, --codex, --fresh, --list and --delete" >&2; exit 2 ;;
  esac
  shift
done

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
try="$root/tmp/try"
computers="$root/tmp/computers"
seeds="$root/lab/scripts/seeds"
program=claude
[ "$codex" = 1 ] && program=codex

plain() {
  case "$1" in
    ''|*/*|.*) echo "try.sh: \"$1\" is not a plain name" >&2; exit 2 ;;
  esac
}

# ---- list and delete --------------------------------------------------------

if [ "$list" = 1 ]; then
  found=0
  for dir in "$try"/*/; do
    [ -e "$dir/case" ] || continue
    found=1
    state="not installed"
    [ -e "$dir/home/.flow/scripts" ] && state="installed, setup not finished"
    [ -e "$dir/home/.flow/version" ] && state="set up"
    printf '%-20s from %-16s %s\n' "$(basename "$dir")" "$(cat "$dir/case")" "$state"
  done
  [ "$found" = 1 ] || echo "no runs yet. Start one with: bash lab/scripts/try.sh --case <name>"
  exit 0
fi

if [ -n "$delete" ]; then
  plain "$delete"
  if [ ! -e "$try/$delete/case" ]; then
    echo "try.sh: no run named \"$delete\". bash lab/scripts/try.sh --list shows them" >&2
    exit 2
  fi
  rm -rf "${try:?}/$delete"
  echo "deleted the run $delete"
  exit 0
fi

# ---- which run --------------------------------------------------------------

name="${name:-${case:-empty}}"
plain "$name"
run="$try/$name"
scratch="$run/home"
home="$scratch/.claude"

# --fresh keeps what the run was built from, unless the flags name another.
if [ "$fresh" = 1 ] && [ -e "$run/case" ]; then
  case="${case:-$(cat "$run/case")}"
  project="${project:-$(cat "$run/project")}"
  rm -rf "${run:?}"
fi

built=0
if [ -e "$run/case" ]; then
  built=1
  if [ -n "$case" ] && [ "$case" != "$(cat "$run/case")" ]; then
    echo "try.sh: the run $name was built from $(cat "$run/case"), not $case. Name another run, or add --fresh to build $name again" >&2
    exit 2
  fi
  if [ -n "$project" ] && [ "$project" != "$(cat "$run/project")" ]; then
    echo "try.sh: the run $name holds the $(cat "$run/project") project. Name another run, or add --fresh" >&2
    exit 2
  fi
  case="$(cat "$run/case")"
  project="$(cat "$run/project")"
fi
case="${case:-empty}"
project="${project:-app}"
plain "$case"
plain "$project"

if [ "$case" != empty ] && [ ! -d "$computers/$case" ]; then
  echo "try.sh: no case named \"$case\". The cases are empty, and the saved computers: $(ls "$computers" 2>/dev/null | tr '\n' ' ')" >&2
  echo "Save this computer with: bash lab/scripts/save-computer.sh <name>" >&2
  exit 2
fi
if [ ! -e "$seeds/$project/seed.sh" ]; then
  echo "try.sh: no project named \"$project\", the projects are: $(ls "$seeds" | tr '\n' ' ')" >&2
  exit 2
fi
if ! command -v bwrap >/dev/null; then
  echo "try.sh: the session runs under bwrap, and bwrap is not on the PATH" >&2
  exit 2
fi
proj="$scratch/code/$project"

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
# in: the repo, read-only, since skills link into it; the run's own folder,
# writable, which holds the stand-in repository; and the programs the session
# runs, which live under the real home folder here.
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
  --bind "$run" "$run"
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
for var in COLORTERM WSL_DISTRO_NAME WSL_INTEROP DISPLAY WAYLAND_DISPLAY; do
  [ -n "${!var:-}" ] && box+=(--setenv "$var" "${!var}")
done

# ---- a new run --------------------------------------------------------------

if [ "$built" = 0 ]; then
  mkdir -p "$scratch" "$home"

  # Git settings come along in every case: the scratch project commits, and a
  # computer without a git identity is not one Flow ever meets. A saved
  # computer brings its own over this copy.
  [ -e "$HOME/.gitconfig" ] && cp "$HOME/.gitconfig" "$scratch/.gitconfig"

  if [ "$case" = empty ]; then
    first_run
  else
    cp -a "$computers/$case/." "$scratch/"
  fi

  # The install asks for the repository ~/.flow/ lives in, and --repo answers
  # with this one. A real one would put a new private repository on GitHub
  # every time a run is built.
  git init --quiet --bare "$run/remote.git"

  # A project is built from a seed, a folder under lab/scripts/seeds/: files/
  # is copied into the project, then seed.sh runs with FLOW_JS and PROJ set
  # and builds the board. The default, app, is a small real program with
  # tickets that fit it, so the phase skills run against code. The manual's
  # captured examples come from it.
  mkdir -p "$proj"
  cp -r "$root/project-template/." "$proj/"
  git -C "$proj" init --quiet
  [ -d "$seeds/$project/files" ] && cp -r "$seeds/$project/files/." "$proj/"
  # The seed runs outside the sandbox, where Flow is not set up and every flow
  # command refuses. A ~/.flow of its own, holding only the version stamp, lets
  # it through without reading or writing the real one.
  seed_home="$run/seed-flow"
  mkdir -p "$seed_home"
  node -e 'console.log(require(process.argv[1]).newest(process.argv[2]))' \
    "$root/scripts/flow/lib/version.js" "$root" > "$seed_home/version"
  FLOW_HOME="$seed_home" FLOW_JS="$root/scripts/flow/flow.js" FLOW_PROJECT="$proj" PROJ="$proj" \
    bash "$seeds/$project/seed.sh"
  rm -rf "$seed_home"

  echo "$case" > "$run/case"
  echo "$project" > "$run/project"
fi

# Claude Code comes in every run, since install.sh checks for it, and Codex
# with --codex. Brought on every run, after a saved computer is copied, so its own links to
# them are replaced by ones that resolve inside the sandbox.
bring claude
[ "$codex" = 1 ] && bring codex

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

# ---- start it ---------------------------------------------------------------

# A new run starts at install.sh, run from this checkout with --use, so the
# test covers edits nobody has committed. --drafts always, because a draft
# that cannot be tested is the one thing this script exists to make testable.
# The session opens once the install ends. A run reopened starts the session
# alone.
if [ "$built" = 0 ]; then
  inside=(bash -c 'bash "$1" --use "$2" --drafts --repo "$3" && exec "$4"' install
    "$root/install.sh" "$root" "$run/remote.git" "$program")
else
  inside=("$program")
fi
launcher="$run/sandbox.sh"
{
  echo '#!/usr/bin/env bash'
  echo "# Written by lab/scripts/try.sh: the run $name, from the $case case."
  printf 'exec'
  printf ' %q' "${box[@]}" --chdir "$HOME/code/$project" "${inside[@]}"
  echo
} > "$launcher"

reopened=
[ "$built" = 1 ] && reopened=", reopened as it was left"
cat <<EOF

the run $name, from the $case case$reopened
  home folder    $scratch, seen inside as ~
  Flow's files   $scratch/.flow
  project        $proj, seen inside as ~/code/$project

EOF

if [ -t 0 ]; then
  exec bash "$launcher"
fi

cat <<EOF
start the session from a terminal:

  bash $launcher

EOF
