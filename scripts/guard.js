#!/usr/bin/env node
'use strict';
/**
 * guard.js — PreToolUse guard, enforcing what CLAUDE.md can only ask for.
 *
 * Registered as a PreToolUse hook on Bash. Reads the pending tool call as JSON
 * on stdin and prints a verdict on stdout.
 *
 * Returns "deny" only for things that are wrong in every project, "ask" for
 * judgment calls, and stays silent otherwise. It never returns "allow", so the
 * permissions.deny list stays the final authority and a bug here cannot widen
 * anything.
 *
 * git is the one command judged by an allowlist rather than a blocklist: a read
 * passes, everything else denies. The user drives git, and enumerating the ways
 * git writes is a losing game.
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

// Wrong in every project. The git line is a fast path with a precise reason;
// GIT_READS below is what actually decides a git command, and it catches these
// too. Kept because it also fires on a segment the tokenizer cannot split.
const DENY = [
  [/(^|[;&|]\s*)(sudo|su)\s/, 'privileged command'],
  [/\b(curl|wget)\b[^|]*\|\s*(sudo\s+)?(ba)?sh\b/, 'pipe-to-shell'],
  [/--dangerously-skip-permissions/, 'permission bypass'],
  [/\bgit\s+(add|commit|push|pull|reset|rebase|merge|checkout|switch|restore|rm|mv|stash|clean|cherry-pick|revert)\b/,
    'git mutation'],
];

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
const GIT_INSTRUCTED = new Set(['clone']);

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

/** Drops leading `VAR=value` assignments, so `GIT_INDEX_FILE=x git add` still reads as git. */
function stripAssignments(tokens) {
  let i = 0;
  while (i < tokens.length && /^[A-Za-z_][A-Za-z0-9_]*=/.test(tokens[i])) i++;
  return tokens.slice(i);
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

for (const [pattern, reason] of DENY) {
  if (pattern.test(cmd)) verdict('deny', `${reason} — name the command, the user runs it`);
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
for (const segment of cmd.split(/&&|\|\||[;|&]/)) {
  const raw = shellSplit(segment);

  // Unbalanced quotes. A segment naming git is worth a prompt, since the
  // subcommand cannot be read and the DENY list covers only the common writes.
  if (!raw) {
    if (/\bgit\b/.test(segment)) verdict('ask', 'git command that could not be parsed');
    continue;
  }

  const tokens = stripAssignments(raw);
  if (!tokens.length) continue;
  const program = path.basename(tokens[0]);

  if (program === 'git') {
    const sub = gitSubcommand(tokens);
    if (!GIT_READS.has(sub) && !GIT_INSTRUCTED.has(sub)) {
      verdict('deny', `git ${sub || '<no subcommand>'} is not a read — name the command, the user runs it`);
    }
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
