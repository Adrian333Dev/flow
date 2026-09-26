'use strict';
/**
 * The locks on the 2 commands that undo Flow, `flow restore` and
 * `flow uninstall`. Both delete real files on a real machine, and neither has
 * an undo, so the bar is higher than anywhere else in the tool.
 *
 * 4 locks, and the agent fails the first 2 on its own:
 *
 * 1. Every session closed. `sessions()` looks for a running `claude` or
 *    `codex` process. The agent only exists inside one, so this alone refuses
 *    it, `!` inside a session included. A restore needs the check anyway: a
 *    running session rewrites ~/.claude.json as it goes, and would write its
 *    own copy back over the one just put back.
 * 2. A word typed at the terminal. `word()` reads ~/dev/tty~ rather than
 *    stdin, so a pipe, a heredoc and `yes |` all miss it. The agent's commands
 *    have no terminal at all: opening /dev/tty from one fails with
 *    "No such device or address", tested 2026-09-20.
 * 3. No flag skips the prompt. There is nothing to add to a pasted line or to
 *    pull out of shell history, which is why neither command takes one.
 * 4. `deny` rules in ~/.claude/settings.json covering `flow`, `fw` and the
 *    script's own path. Those live in home/settings.json, not here.
 *
 * Every refusal is one line saying what to do, never an explanation.
 *
 * `ask` sits here too, for `flow install`'s 2 questions. Same terminal, the
 * opposite default: a missing terminal takes the fallback rather than refusing,
 * because an install with no answers still has work to do.
 */

const fs = require('fs');
const { execFileSync } = require('child_process');
const { FlowError } = require('./error');

/** Every running Claude Code or Codex process, as `claude 2167`. */
function sessions() {
  let listing = '';
  try {
    listing = execFileSync('ps', ['-eo', 'pid=,comm='], { encoding: 'utf8' });
  } catch {
    return [];
  }
  return listing
    .split('\n')
    .map((line) => line.trim().split(/\s+/))
    .filter(([, comm]) => comm === 'claude' || comm === 'codex')
    .map(([pid, comm]) => `${comm} ${pid}`);
}

/** Lock 1, as a refusal. */
function noSessions() {
  const open = sessions();
  if (open.length) throw new FlowError(`Close these sessions first: ${open.join(', ')}.`);
}

/**
 * Lock 2: print the lines, then read one word from the terminal. Returns the
 * word typed where it is one asked for, and null for anything else. `wanted`
 * is one word, or a list where the answer picks what runs.
 */
function word(wanted, lines) {
  const words = [].concat(wanted);
  const named = words.join(' or ');
  let tty;
  try {
    tty = fs.openSync('/dev/tty', 'r');
  } catch {
    throw new FlowError(`Run this in a terminal, and type ${named} when it asks.`);
  }
  try {
    process.stdout.write(`${lines.join('\n')}\nType ${named}${words.length === 1 ? ' to go on' : ''}: `);
    const buffer = Buffer.alloc(1);
    let typed = '';
    while (fs.readSync(tty, buffer, 0, 1, null) === 1 && buffer[0] !== 10) typed += buffer.toString();
    return words.includes(typed.trim()) ? typed.trim() : null;
  } finally {
    fs.closeSync(tty);
  }
}

/**
 * True where a terminal is attached, so there is somebody to ask.
 *
 * `flow install` asks its 2 questions only when this says yes. Pressing Enter
 * is an answer there, and one of the defaults makes a repository on GitHub, so
 * a run with nobody at the keyboard, a test included, has to skip the
 * questions rather than take a default nobody chose.
 */
function hasTerminal() {
  try {
    fs.closeSync(fs.openSync('/dev/tty', 'r'));
    return true;
  } catch {
    return false;
  }
}

/**
 * One typed line, or `fallback` for an empty one. Ask `hasTerminal()` first:
 * with no terminal this returns the fallback without asking anything.
 */
function ask(question, fallback) {
  let tty;
  try {
    tty = fs.openSync('/dev/tty', 'r');
  } catch {
    return fallback;
  }
  try {
    process.stdout.write(question);
    const buffer = Buffer.alloc(1);
    let typed = '';
    while (fs.readSync(tty, buffer, 0, 1, null) === 1 && buffer[0] !== 10) typed += buffer.toString();
    return typed.trim() || fallback;
  } finally {
    fs.closeSync(tty);
  }
}

module.exports = { sessions, noSessions, word, hasTerminal, ask };
