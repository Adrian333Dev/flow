'use strict';
/**
 * The ticket model on disk, and the only file that reads or writes a ticket's
 * folder. Every other file asks this one, and anything outside Flow's scripts
 * runs `flow`. A ticket that breaks into parts has children.
 *
 *   .flow/tickets/exp-47-daemon-detection/ticket.md    folder from birth, constant inner name
 *
 * Frontmatter is owned by these commands; the body is written by hand. That is
 * why templates hold body only: the frontmatter is generated, never templated.
 *
 * An id is a word and a number, `exp-47`. The word names the place the ticket
 * lives: one per project, set when the project is set up, and `home` for the
 * tickets in ~/.flow/, which belong to no project. 2 places therefore never
 * produce the same id, and an id typed anywhere says where to look.
 */

const fs = require('fs');
const path = require('path');
const frontmatter = require('../frontmatter');
const statuses = require('./statuses');
const settings = require('../settings');
const { FlowError } = require('../error');
const paths = require('../paths');

// `was` is the id a ticket held before `flow move` took it to another place,
// or before a clash renumbered it, so the old id still finds it. `branch` is
// the code branch the work is built on, written once: see ticket-history.js.
const TICKET_KEYS = ['id', 'was', 'title', 'status', 'type', 'priority', 'branch', 'parent', 'deps', 'reason', 'resume', 'closed', 'filed'];

// `topic` is a ticket whose deliverable is a settled answer rather than code.
// It was called `research` until the name collided with the `research` skill,
// which fetches documentation and decides nothing.
const TICKET_TYPES = ['feature', 'issue', 'chore', 'topic', 'prototype'];

// Only `high` and `low` reach disk. `normal` is the name for the missing field,
// so an ordinary ticket carries no priority line at all, which is the whole
// defence against the usual rot, where everything is stamped at creation and
// `high` stops meaning anything a year in. Nothing sets it but the user asking.
const TICKET_PRIORITIES = ['high', 'normal', 'low'];
const STORED_PRIORITIES = ['high', 'low'];

/** Anything that is not a stored value (including `normal`) means unset. */
const toPriority = (v) => {
  const s = String(v || '').trim().toLowerCase();
  return STORED_PRIORITIES.includes(s) ? s : '';
};

// `reason` is required and typed by the user for the statuses statuses.js
// marks as needing one. Everywhere else the workflow is its own explanation.
//
// `resume` is the other half of parking: the status the ticket left, so it
// comes back where it stopped. It lives and dies with `reason`: both are
// written when a ticket is parked and cleared by the move off it.

// `closed` is the moment work stopped: stamped when a ticket reaches `done`
// or `dropped`, cleared by any move back to a live status. It carries the clock
// down to the second because its only job is ordering, and closing a batch puts
// several tickets inside one minute, which then tie, and `last closed` picks
// whichever the directory happened to list first. Nothing else on a ticket can
// answer "what did I finish last":
// `filed` is stamped days later by the filing pass, ids are creation order and
// not finishing order, and a file's mtime is rewritten by `git checkout` and by
// `flow file`.
//
// `filed` holds the date the filing pass swept this ticket, and only that pass
// writes it. `status: done` says the work is finished; `filed` says the
// knowledge was harvested: two different claims, and nothing else on the
// ticket makes the second one. It is set even where the ticket taught nothing,
// because recording that it was looked at is what drains the queue.

// Terminal tickets move to .flow/tickets/archive/ so the live pool stays
// readable in a file tree. Two buckets, never one per status: a folder per
// status would make location duplicate `status`, which is the thing that
// killed promote-on-building. `parked` is revivable, so it stays in the pool.
const TERMINAL_STATUSES = [...statuses.TERMINAL];
const ARCHIVE = 'archive';

const SLUG_MAX = 48;

// The label on the end of an id: `exp-47-parser-split`. Short enough to read
// at a glance in a list, and long enough to say what the ticket is. The number
// stays the identity, so a label that goes stale breaks nothing.
const LABEL_WORDS = 3;

// ---------------------------------------------------------------- places

const HOME_WORD = 'home';

// 2 to 8 lowercase letters. A digit or a dash would make `exp2-4` or `my-app-4`
// ambiguous to read back.
const WORD = /^[a-z]{2,8}$/;

/**
 * The folder holding a place's records. A project keeps them in `.flow/`. The
 * home place is ~/.flow/ itself, reached either as its own root or as the home
 * folder with `.flow/` under it, which is how `FLOW_PROJECT=$HOME` has always
 * named it.
 */
function recordsDir(root) {
  const home = path.resolve(paths.flowHome());
  if (path.resolve(root) === home) return home;
  return path.join(root, '.flow');
}

const isHome = (root) => path.resolve(recordsDir(root)) === path.resolve(paths.flowHome());

/** The root `home-4` lives under. */
const homeRoot = () => path.resolve(paths.flowHome());

const ticketsDir = (root) => path.join(recordsDir(root), 'tickets');
const archiveDir = (root) => path.join(recordsDir(root), 'tickets', ARCHIVE);

/**
 * The word a folder name offers, before the user picks: its letters whole where
 * they fit a prefix, `my-app` → `myapp`, else the first 3, `expense-tracker` →
 * `exp`. Under 2 letters, `flow`.
 */
function offerWord(folder) {
  const letters = path.basename(path.resolve(folder)).toLowerCase().replace(/[^a-z]/g, '');
  const word = letters.length <= 8 ? letters : letters.slice(0, 3);
  return word.length >= 2 && word !== HOME_WORD ? word : 'flow';
}

/** The refusal for a word that cannot be one, or null. */
function badWord(word) {
  if (!WORD.test(String(word))) return `"${word}" cannot be a ticket prefix: use 2 to 8 lowercase letters.`;
  if (word === HOME_WORD) return '"home" is the prefix of the tickets in ~/.flow/, so no project can take it.';
  return null;
}

/**
 * The word this place's ids start with. A project's sits in `.flow/settings.json`
 * as `ticketPrefix`, written by `flow init`; a project set up before that key
 * existed gets the word its folder offers, so its ids are stable either way.
 */
function prefixOf(root) {
  if (isHome(root)) return HOME_WORD;
  const saved = settings.read(settings.projectFile(root)).ticketPrefix;
  return saved && !badWord(saved) ? saved : offerWord(root);
}

/**
 * `exp-47`, `EXP-47` and `47` all normalize to `exp-47` in a place whose word
 * is `exp`. A word other than the place's own stays as typed, lowercased, so
 * the caller can send it to the place that owns it. Null for anything else.
 */
function normalizeId(ref, prefix) {
  const s = String(ref || '').trim().toLowerCase();
  const bare = s.match(/^(\d+)$/);
  if (bare) return prefix ? `${prefix}-${parseInt(bare[1], 10)}` : null;
  const full = s.match(/^([a-z]{2,8})-(\d+)$/);
  return full ? `${full[1]}-${parseInt(full[2], 10)}` : null;
}

/** The word of an id, `exp` for `exp-47`, or null. */
const wordOf = (id) => (String(id).match(/^([a-z]{2,8})-\d+$/) || [])[1] || null;

/** Sort key. String compare puts exp-182 between exp-1819 and exp-1820. */
function idNumber(id) {
  const m = String(id).match(/-(\d+)$/);
  return m ? parseInt(m[1], 10) : Number.MAX_SAFE_INTEGER;
}

const byId = (a, b) => idNumber(a.id) - idNumber(b.id) || String(a.id).localeCompare(String(b.id));

function requireId(ref, prefix) {
  const id = normalizeId(ref, prefix);
  if (!id) throw new FlowError(`not a ticket id: ${ref}`);
  return id;
}

/** The id at the front of a folder name, `exp-47` from `exp-47-parser-split`. */
const idOfFolder = (name) => (String(name).match(/^([a-z]{2,8}-\d+)(?:-|$)/) || [])[1] || null;

/** Local date, not UTC: a date stamped a day behind the user's own calendar
 *  is wrong in the only way this field can be wrong. */
function today() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** `today()` plus the clock, for `closed`: see the note on that field. */
function now() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${today()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function slugify(title) {
  const base = String(title)
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (!base) throw new FlowError('that title produces an empty slug: it needs words, not punctuation.');
  if (base.length <= SLUG_MAX) return base;
  const cut = base.slice(0, SLUG_MAX);
  const lastDash = cut.lastIndexOf('-');
  return (lastDash > 12 ? cut.slice(0, lastDash) : cut).replace(/-+$/, '');
}

// Dropped before the label is cut to length. "Fix the login redirect loop"
// would otherwise spend a third of the label on "the".
const LABEL_SKIP = new Set(['a', 'an', 'the', 'of', 'to', 'in', 'on', 'for', 'and', 'or', 'into', 'with', 'from', 'that', 'this', 'its', 'it']);

/** The 1-3 word label that follows the number in an id. */
function labelize(text) {
  const words = slugify(text).split('-');
  const kept = words.filter((w) => !LABEL_SKIP.has(w));
  return (kept.length ? kept : words).slice(0, LABEL_WORDS).join('-');
}

/** The label part of a folder name, with the id stripped off. */
const labelOf = (t) => t.dirName.slice(t.id.length).replace(/^-/, '');

/**
 * Renames the folder, and only the folder. Nothing stores a label: `deps` and
 * `parent` hold bare ids, so a rename has no references to chase and cannot
 * strand one.
 */
function relabel(t, given) {
  const from = labelOf(t);
  const to = labelize(given);
  if (to === from) return { from, to };

  const dirName = `${t.id}-${to}`;
  const wanted = path.join(path.dirname(t.dir), dirName);
  if (fs.existsSync(wanted)) throw new FlowError(`${wanted} already exists.`);

  fs.renameSync(t.dir, wanted);
  t.dir = wanted;
  t.dirName = dirName;
  t.file = path.join(wanted, 'ticket.md');
  return { from, to };
}

function toIdList(v, prefix) {
  if (v === undefined || v === null || v === '') return [];
  const raw = Array.isArray(v) ? v : String(v).split(',');
  return raw
    .map((x) => String(x).trim())
    .filter(Boolean)
    .map((x) => normalizeId(x, prefix) || x); // keep unparseable entries so `check` can report them
}

// ---------------------------------------------------------------- tickets

/**
 * Every ticket in one place. The list carries the place's word as `prefix`,
 * so a caller holding the list can read an id typed without one.
 */
function readTickets(root) {
  const prefix = prefixOf(root);
  const tickets = [];
  scanTicketDir(ticketsDir(root), root, prefix, tickets);
  scanTicketDir(archiveDir(root), root, prefix, tickets);
  tickets.sort(byId);
  tickets.prefix = prefix;
  return tickets;
}

function scanTicketDir(dir, root, prefix, out) {
  if (!fs.existsSync(dir)) return;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name === ARCHIVE) continue;
    const file = path.join(dir, entry.name, 'ticket.md');
    if (!fs.existsSync(file)) continue;

    const { data, body } = frontmatter.parse(fs.readFileSync(file, 'utf8'));
    data.id = normalizeId(data.id, prefix) || idOfFolder(entry.name) || entry.name;
    data.was = data.was ? String(data.was).trim() : '';
    data.branch = data.branch ? String(data.branch).trim() : '';
    data.deps = toIdList(data.deps, prefix);
    // One parent at most: the ticket this one was split out of. Unparseable
    // values survive as written so `check` can report them.
    data.parent = data.parent ? (normalizeId(data.parent, prefix) || String(data.parent).trim()) : '';
    data.status = data.status || 'todo';
    data.type = data.type || 'feature';
    data.priority = toPriority(data.priority);
    data.title = data.title || entry.name;
    data.reason = data.reason ? String(data.reason).trim() : '';
    data.closed = data.closed ? String(data.closed).trim() : '';
    data.filed = data.filed ? String(data.filed).trim() : '';

    out.push({ id: data.id, dirName: entry.name, dir: path.join(dir, entry.name), file, data, body, root });
  }
}

/** The highest number in the place, plus 1. A ticket that moved away keeps no claim on its number. */
function nextId(tickets, prefix = tickets.prefix) {
  let max = 0;
  for (const t of tickets) {
    if (wordOf(t.id) !== prefix) continue;
    max = Math.max(max, idNumber(t.id));
  }
  return `${prefix}-${max + 1}`;
}

/** Writes the file, relocating the folder first if the status changed bucket.
 *  Returns { from, to } when it moved, otherwise null. */
function writeTicket(t) {
  const moved = relocate(t);
  fs.writeFileSync(t.file, frontmatter.stringify(t.data, TICKET_KEYS, t.body));
  return moved;
}

function relocate(t) {
  if (!t.root) return null;
  const parent = TERMINAL_STATUSES.includes(t.data.status) ? archiveDir(t.root) : ticketsDir(t.root);
  const wanted = path.join(parent, t.dirName);
  if (wanted === t.dir) return null;

  const from = t.dir;
  fs.mkdirSync(parent, { recursive: true });
  fs.renameSync(from, wanted);
  t.dir = wanted;
  t.file = path.join(wanted, 'ticket.md');
  return { from, to: wanted };
}

/**
 * A rename, or a copy then a delete where the 2 paths sit on different
 * filesystems. `flow move` can take a ticket from ~/.flow/ into a project on
 * another disk, and a rename across disks throws EXDEV.
 */
function moveFolder(from, to) {
  try {
    fs.renameSync(from, to);
  } catch (err) {
    if (err.code !== 'EXDEV') throw err;
    fs.cpSync(from, to, { recursive: true, preserveTimestamps: true, verbatimSymlinks: true });
    fs.rmSync(from, { recursive: true, force: true });
  }
}

/**
 * The one place a status is written, with the fields that go with it and the
 * line in `history.md`. Returns `{ from, moved }`, `moved` as `writeTicket`
 * gives it. The refusals belong to the command, which knows why it moves.
 */
function setStatus(t, status, reason = '') {
  // ticket-history.js reads this file for the time, so it loads here.
  const ticketHistory = require('./ticket-history');
  const from = t.data.status;
  t.data.status = status;
  // The moment work stopped. Any move back to a live status clears it, because
  // a ticket in flight has no finish to point at.
  t.data.closed = statuses.TERMINAL.has(status) ? now() : '';
  // A reason outlives only the status it explains. Carrying "waiting on the Q3
  // API" into a ticket now being built is worse than carrying nothing.
  t.data.reason = reason;
  // Where a parked ticket comes back to. Nothing used to store this: revive
  // recomputed the entry status from the type, so a feature parked at
  // `building` came back at `groundwork`: losing two phases, on the command
  // the tool printed for it. The status it left is the only thing that knows.
  t.data.resume = status === 'parked' ? from : '';
  // The code branch is written once, when code work starts on the ticket.
  if (status === 'building' || status === 'review') ticketHistory.claimBranch(t);

  const moved = writeTicket(t);
  ticketHistory.append(t, `${from} → ${status}`);
  return { from, moved };
}

/**
 * Takes a ticket into another place under `id`, keeping its old id as `was:`.
 * `renamed` maps every id moving in the same command to its new one, so the
 * links between them follow.
 */
function move(t, target, id, renamed) {
  const parent = TERMINAL_STATUSES.includes(t.data.status) ? archiveDir(target) : ticketsDir(target);
  const folder = path.join(parent, `${id}-${labelOf(t)}`);
  if (fs.existsSync(folder)) throw new FlowError(`${folder} already exists.`);
  fs.mkdirSync(parent, { recursive: true });
  moveFolder(t.dir, folder);
  Object.assign(t, { root: target, dir: folder, dirName: path.basename(folder), file: path.join(folder, 'ticket.md') });
  t.data.was = t.id;
  t.data.deps = t.data.deps.map((d) => renamed.get(d) || d);
  t.data.parent = renamed.get(t.data.parent) || t.data.parent;
  t.data.id = id;
  writeTicket(t);
}

/** Deletes a ticket's folder whole. Only a new ticket the remote never took goes this way. */
function remove(t) {
  fs.rmSync(t.dir, { recursive: true, force: true });
}

/**
 * 2 tickets holding one id after a pull. The one already on the remote keeps
 * it, and every other takes the next free number. Deps and parents pointing at
 * the old id are rewritten only in tickets the remote never saw, since those
 * are the ones that meant the ticket renumbered here.
 *
 * `onRemote()` gives the folder names the remote holds, asked only once a
 * clash is found. Returns each change as `{ from, to }`.
 */
function renumber(root, onRemote, { keepWas = true } = {}) {
  const tickets = readTickets(root);
  const byId = new Map();
  for (const t of tickets) byId.set(t.id, [...(byId.get(t.id) || []), t]);
  const clashes = [...byId.values()].filter((list) => list.length > 1);
  if (!clashes.length) return [];

  const remote = onRemote();
  const local = tickets.filter((t) => !remote.has(t.dirName));
  const renamed = [];

  for (const list of clashes) {
    const keep = list.find((t) => remote.has(t.dirName)) || list[0];
    for (const t of list) {
      if (t === keep) continue;
      const to = nextId(readTickets(root), tickets.prefix);
      const folder = path.join(path.dirname(t.dir), `${to}-${labelOf(t)}`);
      fs.renameSync(t.dir, folder);
      t.dir = folder;
      t.dirName = path.basename(folder);
      t.file = path.join(folder, 'ticket.md');
      if (keepWas) t.data.was = t.id;
      t.data.id = to;
      for (const other of local) {
        if (other === t) continue;
        const deps = other.data.deps.map((d) => (d === t.id ? to : d));
        const parent = other.data.parent === t.id ? to : other.data.parent;
        if (deps.join() !== other.data.deps.join() || parent !== other.data.parent) {
          other.data.deps = deps;
          other.data.parent = parent;
          writeTicket(other);
        }
      }
      renamed.push({ from: t.id, to });
      t.id = to;
      writeTicket(t);
    }
  }
  return renamed;
}

// ---------------------------------------------------------------- history.md

/** A ticket's `history.md`: one line per status move or handoff, which `ticket-history.js` builds. */
const historyFile = (t) => path.join(t.dir, 'history.md');

function appendHistory(t, line) {
  fs.appendFileSync(historyFile(t), `${line}\n`);
}

/** The whole of `history.md`, or '' before its first line. */
function readHistory(t) {
  try {
    return fs.readFileSync(historyFile(t), 'utf8');
  } catch {
    return '';
  }
}

/**
 * `tickets` is passed in when the caller already read the pool: at a few
 * thousand tickets a second scan is the most expensive thing a command does.
 */
function createTicket(root, { title, type, priority, parent, deps, tickets, body: given, label }) {
  const id = nextId(tickets || readTickets(root), prefixOf(root));
  const slug = labelize(label || title);
  const dir = path.join(ticketsDir(root), `${id}-${slug}`);
  if (fs.existsSync(dir)) throw new FlowError(`${dir} already exists.`);

  const data = {
    id,
    was: '',
    title: String(title).trim(),
    status: 'todo',
    type: type || 'feature',
    priority: toPriority(priority),
    branch: '',
    parent: parent || '',
    deps: deps || [],
    reason: '',
    closed: '',
    filed: '',
  };
  // A supplied body replaces the template outright: the caller wrote the whole
  // file, so creating and filling a ticket is one command instead of two.
  const body = given != null ? String(given).trim() + '\n' : renderTemplate('ticket.md', { id, slug, title: data.title });

  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, 'ticket.md');
  fs.writeFileSync(file, frontmatter.stringify(data, TICKET_KEYS, body));

  // `groundwork/` exists from birth, always. You cannot know at the start
  // whether groundwork will split a ticket, so its location must never
  // depend on that outcome, and a ticket's path is fixed for life.
  const groundworkDir = path.join(dir, 'groundwork');
  fs.mkdirSync(groundworkDir, { recursive: true });
  fs.writeFileSync(
    path.join(groundworkDir, 'map.md'),
    renderTemplate('map.md', { id, title: data.title })
  );

  return { id, dirName: `${id}-${slug}`, dir, file, data, body, root };
}

/**
 * Whether this ticket has a plan, and how far it got.
 *
 * `flow` used to report `4/9` in every list, which put a regex over
 * hand-written prose into the daily views and read zero whenever a plan was
 * shaped any other way. The count is back in `flow <id>` alone. There it
 * answers the question a session picking the ticket up actually has: is the
 * plan written, and is it finished, and it is counted at read time, so it
 * cannot drift from the file the way a stored number would. A plan with no
 * checkboxes reports no count at all rather than `0/0`.
 */
const planFile = (t) => path.join(t.dir, 'plan.md');
const hasPlan = (t) => fs.existsSync(planFile(t));

// `1. [ ] **Add the config table**` is a step. Anything indented under it is a
// sub-check the build added, which `execute` says explicitly in the format it
// writes, so the left margin is what separates the two.
const STEP = /^ {0,3}(?:\d+[.)]|[-*])\s+\[([ xX])\]/;

function planSteps(t) {
  return hasPlan(t) ? countBoxes(fs.readFileSync(planFile(t), 'utf8'), STEP) : null;
}

/**
 * Ticked and total, over one file's checkboxes.
 *
 * A commented-out box is not a box. Both templates carry their example inside
 * an HTML comment, so counting the raw file makes an untouched map read
 * `1/4 answered` and a ticket nobody has opened look half worked.
 */
function countBoxes(text, pattern) {
  const boxes = text.replace(/<!--[\s\S]*?-->/g, '')
    .split('\n').map((l) => l.match(pattern)).filter(Boolean);
  if (!boxes.length) return null;
  return { done: boxes.filter((m) => m[1] !== ' ').length, total: boxes.length };
}

/**
 * The groundwork map, and how many of its questions are answered.
 *
 * Counted at read time like the plan's steps, and counted at every indent: a
 * group is a question at the coarse level and the branches under it are the
 * questions themselves, so the honest total is every box on the map. What the
 * line is for is one thing, whether groundwork closed, and that is the count
 * reaching its own total.
 */
const mapFile = (t) => path.join(t.dir, 'groundwork', 'map.md');
const hasMap = (t) => fs.existsSync(mapFile(t));

const QUESTION = /^\s*(?:\d+[.)]|[-*])\s+\[([ xX])\]/;

function mapQuestions(t) {
  return hasMap(t) ? countBoxes(fs.readFileSync(mapFile(t), 'utf8'), QUESTION) : null;
}

/**
 * Reports written into the ticket, one per thing answered. A folder rather than
 * a single `report.md` for the reason `groundwork/` is a folder: you cannot
 * know at the start whether a ticket answers one question or three. Unlike
 * `groundwork/` it appears on first write, because a report's location never
 * moves: it just may not exist.
 */
const reportFiles = (t) => {
  const dir = path.join(t.dir, 'reports');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.endsWith('.md')).sort();
};

/**
 * Resolves an id (exp-47, 47), an id the ticket held before it moved, a
 * label, or a folder name, within one place's list.
 */
function findTicket(tickets, ref) {
  const id = normalizeId(ref, tickets.prefix);
  if (id) {
    const hit = tickets.find((t) => t.id === id) || tickets.find((t) => t.data.was === id);
    if (!hit) throw new FlowError(`no ticket ${id}.`);
    return hit;
  }

  const needle = String(ref || '').trim();
  if (!needle) throw new FlowError('which ticket? give an id or a slug.');

  const slugOf = (t) => labelOf(t);
  const exact = tickets.filter((t) => slugOf(t) === needle || t.dirName === needle);
  if (exact.length === 1) return exact[0];
  if (exact.length > 1) throw new FlowError(ambiguous(needle, exact));

  const partial = tickets.filter((t) => t.dirName.includes(needle));
  if (partial.length === 1) return partial[0];
  if (partial.length > 1) throw new FlowError(ambiguous(needle, partial));

  throw new FlowError(`no ticket matching "${needle}".`);
}

function ambiguous(needle, matches) {
  return `"${needle}" matches ${matches.length} tickets:\n` +
    matches.map((t) => `  ${t.id}  ${t.data.title}`).join('\n');
}

// ---------------------------------------------------------------- templates

function renderTemplate(name, vars) {
  const file = path.join(__dirname, '..', '..', 'templates', name);
  if (!fs.existsSync(file)) throw new FlowError(`missing template: ${file}`);
  return fs.readFileSync(file, 'utf8').replace(/\{\{(\w+)\}\}/g, (m, key) =>
    Object.prototype.hasOwnProperty.call(vars, key) ? vars[key] : m
  );
}

module.exports = {
  TICKET_KEYS, TICKET_TYPES, TICKET_PRIORITIES, HOME_WORD,
  recordsDir, isHome, homeRoot, ticketsDir, archiveDir, offerWord, badWord, prefixOf, wordOf, idOfFolder,
  normalizeId, idNumber, requireId, slugify, labelize, labelOf, relabel, toIdList, toPriority, today, now,
  readTickets, nextId, writeTicket, createTicket, findTicket, setStatus, move, moveFolder, remove, renumber,
  historyFile, appendHistory, readHistory,
  hasPlan, planSteps, hasMap, mapQuestions, reportFiles,
  renderTemplate, // cases.js borrows this, slugify and today; nothing else is shared
};
