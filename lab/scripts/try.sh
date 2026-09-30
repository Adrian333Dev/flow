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
# The first run of a name builds it from a seed, a saved computer in
# tmp/computers/<seed>/, copied and never changed. A seed with no Flow on it,
# before-flow for one, runs install.sh from this checkout, the way a new user's
# first step does: the real install, with util, the toolbox and the skill
# repositories cloned from GitHub, and the setup session after it. A seed saved
# from a run that finished setup skips both. Running the same name again
# reopens it as it was left, so a machine that went through setup stays one to
# test on.
#
# --save <seed> copies a run's computer into tmp/computers/<seed>/, so every
# later run can start from it: the last run opened, or the one --name names.
# Its ~/.flow comes along, and its project stays behind, since each new run
# builds its own. lab/scripts/save-computer.sh saves the real computer instead.
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
#   bash lab/scripts/try.sh                                  a new run from the before-flow seed, named before-flow
#   bash lab/scripts/try.sh --seed set-up                    a new run from another seed, named after it
#   bash lab/scripts/try.sh --seed set-up --name research-1  the same, the run named research-1
#   bash lab/scripts/try.sh --name research-1                reopen research-1 as it was left
#   bash lab/scripts/try.sh --name research-1 --fresh        build research-1 again from its seed
#   bash lab/scripts/try.sh --save set-up                    save the last run opened as the seed set-up
#   bash lab/scripts/try.sh --list                           every run and every seed
#   bash lab/scripts/try.sh --delete research-1              delete that run
#   bash lab/scripts/try.sh --codex                          a Codex session in place of Claude Code
#   bash lab/scripts/try.sh --project broken-board           a new run's practice project, from lab/scripts/test-projects/
#
# Run where no terminal is attached, from an agent's shell, it builds
# everything and prints the line that starts the session.
set -euo pipefail

fresh=0
codex=0
list=0
project=
seed=
name=
delete=
save=
while [ $# -gt 0 ]; do
  case "$1" in
    --fresh) fresh=1 ;;
    --codex) codex=1 ;;
    --list) list=1 ;;
    --project) project="${2:-}"; shift ;;
    --seed) seed="${2:-}"; shift ;;
    --save) save="${2:-}"; shift ;;
    --name) name="${2:-}"; shift ;;
    --delete) delete="${2:-}"; shift ;;
    *) echo "try.sh: unknown argument \"$1\", takes --seed, --name, --project, --save, --codex, --fresh, --list and --delete" >&2; exit 2 ;;
  esac
  shift
done

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
try="$root/tmp/try"
computers="$root/tmp/computers"
projects="$root/lab/scripts/test-projects"
program=claude
[ "$codex" = 1 ] && program=codex

plain() {
  case "$1" in
    ''|*/*|.*) echo "try.sh: \"$1\" is not a plain name" >&2; exit 2 ;;
  esac
}

# How far a computer got: its home folder in, one of 3 words out.
state() {
  if [ -e "$1/.flow/version" ]; then echo "set up"
  elif [ -e "$1/.flow/scripts" ]; then echo "installed, setup not finished"
  else echo "no Flow"
  fi
}

# ---- list, delete and save --------------------------------------------------

if [ "$list" = 1 ]; then
  echo runs
  for dir in "$try"/*/; do
    [ -e "$dir/seed" ] || continue
    printf '  %-20s from %-16s %s\n' "$(basename "$dir")" "$(cat "$dir/seed")" "$(state "$dir/home")"
  done
  echo seeds
  for dir in "$computers"/*/; do
    [ -d "$dir" ] || continue
    printf '  %-20s %s\n' "$(basename "$dir")" "$(state "$dir")"
  done
  exit 0
fi

if [ -n "$delete" ]; then
  plain "$delete"
  if [ ! -e "$try/$delete/seed" ]; then
    echo "try.sh: no run named \"$delete\". bash lab/scripts/try.sh --list shows them" >&2
    exit 2
  fi
  rm -rf "${try:?}/$delete"
  echo "deleted the run $delete"
  exit 0
fi

# The run's home folder, whole but for 3 things: what a session writes as it
# goes, the logins, and the project, which every new run builds again.
if [ -n "$save" ]; then
  plain "$save"
  from="${name:-$(cat "$try/.last" 2>/dev/null || true)}"
  if [ -z "$from" ] || [ ! -e "$try/$from/seed" ]; then
    echo "try.sh: no run to save. Add --name <run>, as bash lab/scripts/try.sh --list shows them" >&2
    exit 2
  fi
  to="$computers/$save"
  if [ -e "$to" ]; then
    echo "try.sh: the seed $save exists, and a seed is never overwritten" >&2
    exit 2
  fi
  mkdir -p "$to"
  rsync -a --exclude /code --exclude .venv --exclude node_modules \
    --exclude /.claude/.credentials.json --exclude /.codex/auth.json \
    --exclude /.claude/projects --exclude /.claude/file-history --exclude /.claude/history.jsonl \
    --exclude /.claude/sessions --exclude /.claude/session-env --exclude /.claude/shell-snapshots \
    --exclude /.claude/paste-cache --exclude /.claude/cache --exclude /.claude/todos \
    --exclude /.claude/debug --exclude /.claude/statsig --exclude /.claude/telemetry \
    --exclude /.claude/usage-data --exclude /.claude/backups --exclude '/.claude/daemon*' \
    --exclude /.claude/jobs --exclude /.claude/ide --exclude /.claude/downloads \
    --exclude /.claude/feedback --exclude /.claude/plugins/.trash \
    --exclude /.codex/sessions --exclude '/.codex/logs*' --exclude '/.codex/*.sqlite*' \
    --exclude /.codex/.tmp --exclude /.codex/tmp --exclude /.codex/cache \
    --exclude /.codex/history.jsonl --exclude /.codex/log --exclude /.codex/shell_snapshots \
    "$try/$from/home/" "$to/"
  echo "saved the run $from as the seed $save ($(du -sh "$to" | cut -f1))"
  exit 0
fi

# ---- which run --------------------------------------------------------------

name="${name:-${seed:-before-flow}}"
plain "$name"
run="$try/$name"
scratch="$run/home"

# --fresh keeps what the run was built from, unless the flags name another.
if [ "$fresh" = 1 ] && [ -e "$run/seed" ]; then
  seed="${seed:-$(cat "$run/seed")}"
  project="${project:-$(cat "$run/project")}"
  rm -rf "${run:?}"
fi

built=0
if [ -e "$run/seed" ]; then
  built=1
  if [ -n "$seed" ] && [ "$seed" != "$(cat "$run/seed")" ]; then
    echo "try.sh: the run $name was built from $(cat "$run/seed"), not $seed. Name another run, or add --fresh to build $name again" >&2
    exit 2
  fi
  if [ -n "$project" ] && [ "$project" != "$(cat "$run/project")" ]; then
    echo "try.sh: the run $name holds the $(cat "$run/project") project. Name another run, or add --fresh" >&2
    exit 2
  fi
  seed="$(cat "$run/seed")"
  project="$(cat "$run/project")"
fi
seed="${seed:-before-flow}"
project="${project:-expense-tracker}"
plain "$seed"
plain "$project"

if [ "$built" = 0 ] && [ ! -d "$computers/$seed" ]; then
  echo "try.sh: no seed named \"$seed\". The seeds: $(ls "$computers" 2>/dev/null | tr '\n' ' ')" >&2
  exit 2
fi
if [ ! -d "$projects/$project" ]; then
  echo "try.sh: no project named \"$project\", the projects are: $(ls "$projects" | tr '\n' ' ')" >&2
  exit 2
fi
if ! command -v bwrap >/dev/null; then
  echo "try.sh: the session runs under bwrap, and bwrap is not on the PATH" >&2
  exit 2
fi
proj="$scratch/code/$project"

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
  mkdir -p "$scratch"

  # Git settings come along in every run: the scratch project commits, and a
  # computer without a git identity is not one Flow ever meets. A seed that
  # holds its own copies it over this one.
  [ -e "$HOME/.gitconfig" ] && cp "$HOME/.gitconfig" "$scratch/.gitconfig"
  cp -a "$computers/$seed/." "$scratch/"

  # The install finds the Flow home's repository, flow-home on GitHub through
  # gh, and FLOW_HOME_REMOTE points it at this one instead. The real one would
  # be the user's own, and gh's login never enters the sandbox. A seed
  # that is set up already brings its Flow home, which holds all the
  # stand-in held: the new stand-in is made from it, and the Flow home sends to
  # the new one.
  if [ -d "$scratch/.flow/.git" ]; then
    git clone --quiet --bare "$scratch/.flow" "$run/remote.git"
    git -C "$scratch/.flow" remote set-url origin "$run/remote.git"
    git -C "$scratch/.flow" fetch --quiet origin
  else
    git init --quiet --bare "$run/remote.git"
  fi

  # The practice project is built from a folder under lab/scripts/test-projects/:
  # files/ is copied into the project, then build.sh runs with FLOW_JS and PROJ set
  # and builds the board. The default, expense-tracker, is a small real program
  # with tickets that fit it, so the phase skills run against code. The manual's
  # captured examples come from it.
  mkdir -p "$proj"
  git -C "$proj" init --quiet
  if [ -e "$projects/$project/build.sh" ]; then
    cp -r "$root/project-template/." "$proj/"
    [ -d "$projects/$project/files" ] && cp -r "$projects/$project/files/." "$proj/"
    # The project arrives set up, as flow init leaves one: .flow/ is the branch
    # flow, checked out, holding settings.json with the prefix exp and the
    # version stamp. Without .flow/ every flow command in build.sh refuses the
    # project. There is no remote, so every commit stays in the sandbox.
    newest="$(node -e 'console.log(require(process.argv[1]).newest(process.argv[2]))' \
      "$root/scripts/flow/lib/version.js" "$root")"
    git -C "$proj" worktree add --quiet --orphan -b flow .flow
    printf '.flow/\n' >> "$proj/.gitignore"
    echo '{ "ticketPrefix": "exp" }' > "$proj/.flow/settings.json"
    echo "$newest" > "$proj/.flow/version"
    # build.sh runs outside the sandbox, where Flow is not set up and every flow
    # command refuses. A ~/.flow of its own, holding only the version stamp, lets
    # it through without reading or writing the real one.
    build_home="$run/build-flow"
    mkdir -p "$build_home"
    echo "$newest" > "$build_home/version"
    FLOW_HOME="$build_home" FLOW_JS="$root/scripts/flow/flow.js" FLOW_PROJECT="$proj" PROJ="$proj" \
      bash "$projects/$project/build.sh"
    rm -rf "$build_home"
    # Every flow command commits what it wrote. The files build.sh wrote by hand,
    # map.md and plan.md among them, ride along with the next command, so only
    # what the last one left is committed here, if anything.
    git -C "$proj/.flow" add -A
    git -C "$proj/.flow" diff --cached --quiet ||
      git -C "$proj/.flow" -c user.name=try -c user.email=try@localhost commit --quiet -m "the practice board"
  else
    # A project with no build.sh arrives the way a real one does before Flow:
    # its files committed, with no template, no .flow/ and no tickets, for
    # flow init to bring in.
    cp -r "$projects/$project/files/." "$proj/"
    git -C "$proj" add -A
    git -C "$proj" -c user.name=try -c user.email=try@localhost commit --quiet -m "start"
  fi

  echo "$seed" > "$run/seed"
  echo "$project" > "$run/project"
fi

# Claude Code comes in every run, since install.sh checks for it, and Codex
# with --codex. Brought on every run, after the seed is copied, so its own links
# to them are replaced by ones that resolve inside the sandbox.
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

# A run with no Flow starts at install.sh, run from this checkout with --use, so the
# test covers edits nobody has committed. --drafts always, because a draft
# that cannot be tested is the one thing this script exists to make testable.
# The session opens once the install ends. A run whose computer has Flow
# starts the session alone. One built from an agent's shell and never started
# has no Flow yet, so it installs when it is first opened.
if [ ! -e "$scratch/.flow/scripts" ]; then
  inside=(bash -c 'FLOW_HOME_REMOTE="$3" bash "$1" --use "$2" --drafts && exec "$4"' install
    "$root/install.sh" "$root" "$run/remote.git" "$program")
else
  inside=("$program")
fi
launcher="$run/sandbox.sh"
{
  echo '#!/usr/bin/env bash'
  echo "# Written by lab/scripts/try.sh: the run $name, from the $seed seed."
  printf 'exec'
  printf ' %q' "${box[@]}" --chdir "$HOME/code/$project" "${inside[@]}"
  echo
} > "$launcher"
echo "$name" > "$try/.last"

reopened=
[ "$built" = 1 ] && reopened=", reopened as it was left"
cat <<EOF

the run $name, from the $seed seed$reopened
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
