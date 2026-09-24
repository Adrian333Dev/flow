#!/usr/bin/env node
'use strict';
/**
 * guard.js: PreToolUse guard, for what a permission pattern cannot say.
 *
 * Registered as a PreToolUse hook on Bash. Reads the pending tool call as JSON
 * on stdin and prints a verdict on stdout.
 *
 * Claude Code's own settings hold every rule a pattern can state: the allow
 * list, and a deny list for sudo, mkfs and the permission bypass. What is left
 * here needs to read inside a command, where a pattern only sees its start:
 *
 *   - a recursive or forced delete pointing outside the working directory
 *   - a download piped into a shell
 *   - a write into a shell startup file
 *   - a git command that throws work away
 *
 * Each one answers "ask", every time, so you are the one who says yes. The
 * rest of the time it stays silent and Claude Code's own prompt decides. It
 * never returns "allow", so a bug here cannot widen past what the settings
 * already allow.
 *
 * It only ever sees what the agent runs. A command the user types in their own
 * terminal, or in the input box behind a `!`, does not reach a tool call and
 * therefore does not reach this file. Nothing here is a rule about the user.
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

// Read over the whole command, since the danger sits between two programs or
// after a redirect, where no permission pattern reaches.
const ASK = [
  [/\b(curl|wget)\b[^|]*\|\s*(sudo\s+)?(ba|z)?sh\b/, 'a download piped into a shell'],
  [/>>?\s*~?\/?\.?(bash|zsh|profile)\w*/, 'a write into a shell startup file'],
];

const short = (tokens, letter) => tokens.some((t) => new RegExp(`^-[^-]*${letter}`).test(t));
const has = (tokens, ...names) => tokens.some((t) => names.includes(t));

/**
 * Each one throws away work that no reflog, stash or remote gets back. They ask
 * even for someone who saved `git push *` as always allowed, since the pattern
 * cannot tell a push from a force push.
 *
 * Matched on the subcommand and its own tokens, never on the raw text. A
 * pattern over the whole segment makes `git log --grep=clean` a destructive
 * clean, and a read that stops to ask is a read nobody trusts.
 */
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

// git's own options, before the subcommand, that swallow the token after them.
const GIT_OPTS_WITH_VALUE = new Set(['-C', '-c', '--git-dir', '--work-tree', '--namespace', '--exec-path']);

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

/** realpath that tolerates a target which does not exist yet: rm arguments often do not. */
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
 * Both hide the program from a check that reads token 0. `env git tag -d v1`
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
    if (!t.startsWith('-')) return t;
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

for (const [pattern, reason] of ASK) {
  if (pattern.test(cmd)) verdict('ask', reason);
}

/**
 * Every segment, in the shell's own order: which git subcommand, and where an
 * `rm -r` points.
 *
 * `&&` matches before the character class, so it still splits as one operator.
 * A command substitution (`$(rm -rf ~)`, backticks) is not split at all, and
 * separating it properly needs a real shell parser. Nothing here allows, so a
 * segment this misses still meets Claude Code's own prompt.
 */
function walk() {
  for (const segment of cmd.split(/&&|\|\||[;|&]/)) {
    const raw = shellSplit(segment);
    if (!raw) continue;

    const tokens = stripPrefix(raw);
    if (!tokens.length) continue;
    const program = path.basename(tokens[0]);

    if (program === 'git') {
      const destructive = GIT_DESTRUCTIVE[gitSubcommand(tokens)];
      if (destructive && destructive[0](tokens)) verdict('ask', destructive[1]);
      continue;
    }

    if (program !== 'rm') continue;

    const rest = tokens.slice(1);
    if (!rest.some((t) => t.startsWith('-') && /[rRf]/.test(t))) continue;

    const root = realpathish(cwd);
    for (const arg of rest.filter((t) => !t.startsWith('-'))) {
      const target = realpathish(path.resolve(cwd, expandUser(arg)));
      if (!isInside(root, target)) {
        verdict('ask', `a recursive or forced delete outside the working directory: ${arg}`);
      }
    }
  }
}

// A throw stays silent. The guard never allows, so the command still meets
// Claude Code's own prompt unless a saved rule already allows it.
try {
  walk();
} catch {
  // nothing to do
}
