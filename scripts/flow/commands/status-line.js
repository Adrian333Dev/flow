'use strict';
/**
 * `flow status-line`: the ticket this session works on, and its status, for
 * the line under Claude Code's input box.
 *
 *   exp-47 building
 *   exp-47 building · 98k of 150k        with --context
 *
 * Claude Code runs the status line command after each message, with the
 * session's data on stdin: its id, its folder, its transcript and the size of
 * the context. ccstatusline hands its Custom Command widget the same data, so
 * this works as a widget there or as the whole status line. A status line
 * never enters the conversation, so it costs no tokens.
 *
 * The session's ticket is the last one the user typed a skill for, `/exp-47`
 * or `/flow:execute /exp-47`, read off the transcript. Where none was typed,
 * it is the ticket whose `history.md` last names this session, which a
 * ticket made and moved by a skill has. The transcript is read once up to
 * its end: `~/.flow/status-line.json` keeps where reading stopped and what
 * it found, per session, so each run reads only what was added.
 *
 * It prints nothing outside a Flow project or before a ticket is picked, and
 * nothing on any failure of its own: a status line that errors shows the
 * error under every message.
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const settings = require('../lib/settings');
const store = require('../lib/store');
const ticketHistory = require('../lib/ticket-history');

const LIMIT = 150000;
const WEEK = 7 * 24 * 60 * 60 * 1000;

const cacheFile = () => path.join(settings.flowHome(), 'status-line.json');

/** The Flow project around `cwd`, or null. */
function projectAt(cwd) {
  const top = spawnSync('git', ['rev-parse', '--show-toplevel'], { cwd, encoding: 'utf8' });
  if (top.status !== 0) return null;
  const root = top.stdout.trim();
  return fs.existsSync(path.join(root, '.flow')) ? root : null;
}

/**
 * The last ticket of this project the user typed a skill for, in the bytes
 * of the transcript after `from`. Returns the id found, or null, and where
 * reading stopped: after the last whole line.
 */
function typedSince(transcript, from, prefix) {
  const size = fs.statSync(transcript).size;
  if (size <= from) return { id: null, to: from };
  const fd = fs.openSync(transcript, 'r');
  const buffer = Buffer.alloc(size - from);
  fs.readSync(fd, buffer, 0, buffer.length, from);
  fs.closeSync(fd);
  const text = buffer.toString('utf8');
  const end = text.lastIndexOf('\n') + 1;
  const id = new RegExp(`<command-(?:name|args)>\\/?(${prefix}-\\d+)\\b`, 'g');
  let found = null;
  for (const m of text.slice(0, end).matchAll(id)) found = m[1];
  return { id: found, to: from + Buffer.byteLength(text.slice(0, end)) };
}

/** The ticket whose `history.md` last names this session, or null. */
function movedBy(tickets, session) {
  let best = null;
  for (const t of tickets) {
    const file = path.join(t.dir, ticketHistory.FILE);
    if (!fs.existsSync(file)) continue;
    for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
      if (!line.includes(session)) continue;
      const when = line.slice(0, 16);
      if (!best || when >= best.when) best = { id: t.id, when };
    }
  }
  return best && best.id;
}

/** The context's size as `98k of 150k`, or '' before the first answer. */
function contextOf(data) {
  const u = data.context_window && data.context_window.current_usage;
  if (!u) return '';
  const used = (u.input_tokens || 0) + (u.cache_read_input_tokens || 0) + (u.cache_creation_input_tokens || 0);
  const limit = Number(settings.readGlobal().wrapUpAt) || LIMIT;
  return `${Math.round(used / 1000)}k of ${Math.round(limit / 1000)}k`;
}

function line(data, withContext) {
  const parts = [];
  const cwd = (data.workspace && data.workspace.current_dir) || data.cwd;
  const root = cwd && projectAt(cwd);
  if (root && data.session_id) {
    const tickets = store.readTickets(root);
    const cache = settings.read(cacheFile());
    const mine = cache[data.session_id] || { offset: 0 };
    let id = mine.id || null;
    if (data.transcript_path && fs.existsSync(data.transcript_path)) {
      const typed = typedSince(data.transcript_path, mine.offset || 0, tickets.prefix);
      if (typed.id) id = typed.id;
      const now = Date.now();
      for (const [key, value] of Object.entries(cache)) if (now - (value.at || 0) > WEEK) delete cache[key];
      cache[data.session_id] = { id, offset: typed.to, at: now };
      settings.write(cacheFile(), cache);
    }
    const ticket = tickets.find((t) => t.id === (id || movedBy(tickets, data.session_id)));
    if (ticket) parts.push(`${ticket.id} ${ticket.data.status}`);
  }
  if (withContext) {
    const size = contextOf(data);
    if (size) parts.push(size);
  }
  return parts.join(' · ');
}

const actions = {};

actions['status-line'] = {
  section: 'board',
  anywhere: true,
  summary: 'this session\'s ticket and its status, for Claude Code\'s status line; --context adds its size',
  flags: { context: { bool: true } },
  run({ flags }) {
    try {
      const data = JSON.parse(fs.readFileSync(0, 'utf8') || '{}');
      process.stdout.write(`${line(data, flags.context)}\n`);
    } catch {
      process.stdout.write('\n');
    }
    return 0;
  },
};

module.exports = actions;
