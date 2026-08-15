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
 * Scope rule: this file installs to ~/.claude/ and therefore runs in every
 * directory. Only put rules here that hold everywhere. A rule that belongs to
 * one repo goes in that repo's .claude/settings.json, never here.
 *
 * Node, not Python: `flow` and `fmerge` already make node a hard dependency of
 * the toolchain, so this adds nothing new and drops a third language.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');

// Wrong in every project.
const DENY = [
  [/(^|[;&|]\s*)(sudo|su)\s/, 'privileged command'],
  [/\b(curl|wget)\b[^|]*\|\s*(sudo\s+)?(ba)?sh\b/, 'pipe-to-shell'],
  [/--dangerously-skip-permissions/, 'permission bypass'],
  [/\bgit\s+(add|commit|push|pull|reset|rebase|merge|checkout|switch|restore|rm|mv|stash|clean|cherry-pick|revert)\b/,
    'git mutation'],
];

// One exemption: `git add` into a throwaway index is a read. GIT_INDEX_FILE
// points staging at a scratch file, so the real index, the working tree and HEAD
// all stay untouched — it writes objects and moves nothing. `execute` snapshots a
// dirty tree that way, before and after a subagent runs. Only `add` is exempt;
// `commit` moves HEAD whichever index it reads from.
const SCRATCH_ADD = /(^|[;&|]\s*)GIT_INDEX_FILE=\S+\s+git\s+add\b/g;

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

// Scratch-index staging drops out first, so the deny scan never sees it.
const scanned = cmd.replace(SCRATCH_ADD, ' ');

for (const [pattern, reason] of DENY) {
  if (pattern.test(scanned)) verdict('deny', `${reason} — name the command, the user runs it`);
}

for (const [pattern, reason] of ASK) {
  if (pattern.test(cmd)) verdict('ask', reason);
}

// Recursive delete reaching outside the working directory.
for (const segment of cmd.split(/&&|\|\||[;|]/)) {
  const tokens = shellSplit(segment);
  if (!tokens || !tokens.length || path.basename(tokens[0]) !== 'rm') continue;

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
