#!/usr/bin/env node
'use strict';
/**
 * guard.js — PreToolUse guard, enforcing what CLAUDE.md can only ask for.
 *
 * Registered as a PreToolUse hook on Bash. Reads the pending tool call as JSON
 * on stdin and prints a verdict on stdout.
 *
 * Returns "deny" only for things that are wrong in every project, "ask" for
 * judgment calls, and stays silent otherwise. It never returns "allow", so a
 * deny rule in settings stays the final authority and a bug here cannot widen
 * past what the permission system already allows.
 *
 * It only ever sees what the agent runs. A command the user types in their own
 * terminal, or in the input box behind a `!`, does not reach a tool call and
 * therefore does not reach this file. Nothing here is a rule about the user.
 *
 * git is the one command judged by an allowlist rather than a blocklist: a read
 * passes, everything else is decided by the mode in settings.json. Enumerating
 * the ways git writes is a losing game, so the list holds the reads instead.
 *
 * That mode used to be a fixed ban, held in three places at once. It moved here
 * because permissions.deny is read at session start and no switch can reach it:
 * deny is additive, so nothing in a project or a file can lift a user-level
 * entry. Code that runs per call can. The cost is that this file is now the
 * only thing between the agent and git, which is why an unexpected throw denies
 * a git command rather than falling through.
 *
 * Scope rule: this file installs to ~/.claude/ and therefore runs in every
 * directory. Only put rules here that hold everywhere. A rule that belongs to
 * one repo goes in that repo's .claude/settings.json, never here.
 *
 * Node, not Python: `flow` and `util` already make node a hard dependency of
 * the toolchain, so this adds nothing new and drops a third language.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const settings = require('./flow/lib/settings');

// Wrong in every project, whatever git is set to.
const DENY = [
  [/(^|[;&|]\s*)(sudo|su)\s/, 'privileged command'],
  [/\b(curl|wget)\b[^|]*\|\s*(sudo\s+)?(ba)?sh\b/, 'pipe-to-shell'],
  [/--dangerously-skip-permissions/, 'permission bypass'],
];

// The switch is not the agent's to throw. Without this the whole mechanism is
// decorative: an agent that wants to commit turns git on first and then commits.
//
// A speed bump rather than a seal. This file sees shell commands, so an agent
// determined to get past it can write settings.json with a file tool instead.
// What it stops is the ordinary case, where turning the switch on looks like
// the helpful next step. Turning it off is allowed from anywhere.
const SELF_UNLOCK = [
  [/\b(flow|fw)\s+git\s+(allow|ask)\b/, 'flow git allow'],
  [/\bflow\.js\s+git\s+(allow|ask)\b/, 'flow git allow'],
];

// Destructive whatever the mode says: each one throws away work that no reflog,
// stash or remote gets back. These ask rather than deny, so nothing is walled
// off — you are still the one who says yes, every time.
//
// Matched on the subcommand and its own tokens, never on the raw text. A
// pattern over the whole segment makes `git log --grep=clean` a destructive
// clean, and a read that stops to ask is a read nobody trusts.
const short = (tokens, letter) => tokens.some((t) => new RegExp(`^-[^-]*${letter}`).test(t));
const has = (tokens, ...names) => tokens.some((t) => names.includes(t));

const GIT_DESTRUCTIVE = {
  push: [(t) => t.some((x) => x.startsWith('--force')) || short(t, 'f') || t.some((x) => /^\+.+:/.test(x)),
    'a force push, which overwrites what is on the remote'],
  reset: [(t) => has(t, '--hard'), 'a hard reset, which throws away uncommitted work'],
  clean: [() => true, 'clean, which deletes untracked files'],
  rebase: [() => true, 'a rebase, which rewrites history'],
  'filter-branch': [() => true, 'a history rewrite'],
  branch: [(t) => has(t, '-D') || (has(t, '--delete') && has(t, '--force')), 'a forced branch delete'],
  tag: [(t) => has(t, '-d', '--delete'), 'a tag delete'],
  'update-ref': [(t) => has(t, '-d'), 'a ref delete'],
  worktree: [(t) => has(t, 'remove') && t.some((x) => x.startsWith('--force')), 'a forced worktree removal'],
  reflog: [(t) => has(t, 'delete', 'expire'), 'a reflog delete'],
  gc: [(t) => has(t, '--prune'), 'a prune'],
};

// Every git subcommand that only reads. Anything missing from this set denies —
// a write, an alias, a typo, a subcommand a future git adds.
//
// Inverted deliberately. A list of forbidden writes is only ever as complete as
// whoever last edited it, and the one it replaced was missing `apply`, `tag`,
// `config`, `update-ref` and `submodule`, each of which writes. Denying by
// default costs a rejected read now and then; the other direction costs history.
const GIT_READS = new Set([
  'status', 'log', 'diff', 'show', 'describe', 'blame', 'shortlog', 'grep',
  'ls-files', 'ls-tree', 'ls-remote', 'rev-parse', 'rev-list', 'cat-file',
  'for-each-ref', 'show-ref', 'diff-tree', 'diff-index', 'whatchanged',
  'check-ignore', 'check-attr', 'count-objects', 'var', 'help', 'version',
  '--version', '--help', // options rather than subcommands, and both only print
]);

// Writes Flow itself instructs, so denying them would fight the workflow.
// `research` level 3 says to clone a source repo without asking. Nothing else
// belongs here: an entry is a rule Flow states somewhere, never a convenience.
//
// `worktree` is here rather than behind the switch because it writes no history
// and touches nothing in the checkout you are standing in — it makes a second
// directory, which is closer to `clone` than to `commit`, and dispatch will
// instruct it. `worktree remove --force` is destructive and asks above.
const GIT_INSTRUCTED = new Set(['clone', 'worktree']);

// git's own options, before the subcommand, that swallow the token after them.
const GIT_OPTS_WITH_VALUE = new Set(['-C', '-c', '--git-dir', '--work-tree', '--namespace', '--exec-path']);

// Legitimate often enough to warrant a prompt rather than a wall.
const ASK = [
  [/\b(npm|pnpm|yarn|bun)\s+(i|install|add|remove|rm|uninstall|up|update)\b/, 'dependency change'],
  [/\b(pip3?|uv|cargo|go|gem)\s+(install|add|remove)\b/, 'dependency change'],
  [/\b(apt-get|apt|dnf|yum|brew|snap)\s+(install|remove|purge)\b/, 'system package change'],
  [/\bchmod\s+(-\w+\s+)*777\b/, 'world-writable chmod'],
  [/\bdd\b[^|;&]*\bof=\/dev\//, 'raw device write'],
  [/\bmkfs/, 'filesystem format'],
  [/>>?\s*~?\/?\.?(bash|zsh|profile)\w*/, 'shell startup file write'],
];

function verdict(decision, reason) {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: decision,
      permissionDecisionReason: `guard.js: ${reason}`,
    },
  }) + '\n');
  process.exit(0);
}

/** Word-splits one command segment the way a shell would. Null on unbalanced quotes. */
function shellSplit(segment) {
  const tokens = [];
  let cur = '';
  let quote = null;
  let started = false;

  for (let i = 0; i < segment.length; i++) {
    const c = segment[i];
    if (quote) {
      if (c === quote) quote = null;
      else if (c === '\\' && quote === '"') cur += segment[++i] ?? '';
      else cur += c;
      continue;
    }
    if (c === '"' || c === "'") { quote = c; started = true; continue; }
    if (c === '\\') { cur += segment[++i] ?? ''; started = true; continue; }
    if (/\s/.test(c)) {
      if (cur || started) tokens.push(cur);
      cur = '';
      started = false;
      continue;
    }
    cur += c;
    started = true;
  }
  if (quote) return null;
  if (cur || started) tokens.push(cur);
  return tokens;
}

/** realpath that tolerates a target which does not exist yet — rm arguments often do not. */
function realpathish(p) {
  let abs = path.resolve(p);
  const tail = [];
  for (;;) {
    try {
      return path.join(fs.realpathSync(abs), ...tail);
    } catch {
      const parent = path.dirname(abs);
      if (parent === abs) return path.resolve(p);
      tail.unshift(path.basename(abs));
      abs = parent;
    }
  }
}

const expandUser = (p) => (p === '~' || p.startsWith('~/') ? path.join(os.homedir(), p.slice(1)) : p);

/**
 * Drops what sits in front of the real command: leading `VAR=value` assignments,
 * and an `env` that only sets more of them.
 *
 * Both hide the program from a check that reads token 0. `env git tag -f v1`
 * used to leave this file with `env` as the program, so it skipped the git
 * check entirely and ran.
 */
function stripPrefix(tokens) {
  const assignment = /^[A-Za-z_][A-Za-z0-9_]*=/;
  let i = 0;
  for (;;) {
    while (i < tokens.length && assignment.test(tokens[i])) i++;
    if (i < tokens.length && path.basename(tokens[i]) === 'env') {
      i++;
      // env's own flags. -i and -u drop variables rather than naming the
      // command, and -u swallows the token after it.
      while (i < tokens.length && tokens[i].startsWith('-')) {
        i += tokens[i] === '-u' ? 2 : 1;
      }
      continue;
    }
    return tokens.slice(i);
  }
}

/** The subcommand from a git invocation, or '' when there is none. */
function gitSubcommand(tokens) {
  let i = 1;
  while (i < tokens.length) {
    const t = tokens[i];
    if (!t.startsWith('-') || GIT_READS.has(t)) return t;
    i += GIT_OPTS_WITH_VALUE.has(t) ? 2 : 1;
  }
  return '';
}

const isInside = (root, target) => {
  const rel = path.relative(root, target);
  return rel === '' || (!rel.startsWith('..' + path.sep) && rel !== '..' && !path.isAbsolute(rel));
};

let data;
try {
  data = JSON.parse(fs.readFileSync(0, 'utf8'));
} catch {
  process.exit(0);
}

const cmd = (data.tool_input && data.tool_input.command) || '';
const cwd = data.cwd || process.cwd();

/**
 * The git mode, read fresh on every call.
 *
 * Nothing is cached and nothing is read at session start, which is the whole
 * reason the switch can be thrown mid-session: `flow git allow` writes the
 * entry, and the next shell command sees it.
 */
function gitMode() {
  return settings.gitMode({ session: data.session_id, cwd }).mode;
}

const OFF_REASON =
  'git writes are off — name the command, the user runs it. ' +
  'Turning them on is theirs to type: ! flow git allow';

for (const [pattern, reason] of DENY) {
  if (pattern.test(cmd)) verdict('deny', `${reason} — name the command, the user runs it`);
}

for (const [pattern, reason] of SELF_UNLOCK) {
  if (pattern.test(cmd)) {
    verdict('deny', `${reason} is the user's to run, not yours — they type it as ! flow git allow`);
  }
}

for (const [pattern, reason] of ASK) {
  if (pattern.test(cmd)) verdict('ask', reason);
}

// Per-command checks: which git subcommand, and where an `rm -r` points.
//
// `&&` matches before the character class, so it still splits as one operator.
// A command substitution — `$(rm -rf ~)`, backticks — is not split at all, and
// separating it properly needs a real shell parser. The DENY patterns above
// still see inside one, so what escapes here is the `rm` check alone.
/**
 * One git command, against the mode.
 *
 * A read passes whatever the mode says. Everything else goes off, ask or allow,
 * except the destructive ones, which ask even under allow: nothing is walled
 * off, and the commands that throw work away always stop for a yes.
 */
function decideGit(tokens) {
  const sub = gitSubcommand(tokens);
  const destructive = GIT_DESTRUCTIVE[sub];
  const risky = !!destructive && destructive[0](tokens);
  const asks = () => verdict('ask', `${destructive[1]} — this one asks however git is set`);

  // A read passes, and so does a write Flow itself instructs. The destructive
  // form of an instructed one still asks: `git worktree add` is routine, and
  // `git worktree remove --force` deletes whatever was uncommitted in there.
  if (GIT_READS.has(sub) || GIT_INSTRUCTED.has(sub)) {
    if (risky) asks();
    return;
  }

  // Off denies before anything else gets a say. Otherwise the destructive list
  // would soften the closed state into a prompt, which is backwards.
  const mode = gitMode();
  if (mode === 'off') {
    verdict('deny', `git ${sub || '<no subcommand>'} is not a read. ${OFF_REASON}`);
  }

  if (risky) asks();
  if (mode === 'ask') verdict('ask', `git ${sub}, and git writes are set to ask`);
}

/**
 * Every segment, in the shell's own order.
 *
 * Wrapped because this file is now the only thing holding git back. An
 * unexpected throw used to fall through to a permissions.deny entry that no
 * longer exists, so a git command denies on the way out instead. Everything
 * else stays silent: failing closed on all of Bash would stop the session dead
 * over a bug in one regex.
 */
function walk() {
  // `&&` matches before the character class, so it still splits as one operator.
  // A command substitution — `$(rm -rf ~)`, backticks — is not split at all, and
  // separating it properly needs a real shell parser. The DENY patterns above
  // still see inside one, so what escapes here is the `rm` check alone.
  for (const segment of cmd.split(/&&|\|\||[;|&]/)) {
    const raw = shellSplit(segment);

    // Unbalanced quotes. A segment naming git is worth a prompt, since the
    // subcommand cannot be read and the DENY list covers only the worst writes.
    if (!raw) {
      if (/\bgit\b/.test(segment)) verdict('ask', 'git command that could not be parsed');
      continue;
    }

    const tokens = stripPrefix(raw);
    if (!tokens.length) continue;
    const program = path.basename(tokens[0]);

    if (program === 'git') {
      decideGit(tokens);
      continue;
    }

    if (program !== 'rm') continue;

    const rest = tokens.slice(1);
    if (!rest.some((t) => t.startsWith('-') && /[rRf]/.test(t))) continue;

    const root = realpathish(cwd);
    for (const arg of rest.filter((t) => !t.startsWith('-'))) {
      const target = realpathish(path.resolve(cwd, expandUser(arg)));
      if (!isInside(root, target)) {
        verdict('ask', `recursive delete outside the working directory: ${arg}`);
      }
    }
  }
}

try {
  walk();
} catch (e) {
  if (e && e.__verdict) throw e;
  if (/\bgit\b/.test(cmd)) {
    verdict('deny', `the guard could not decide this one — ${e && e.message}. Name the command, the user runs it`);
  }
}
