/**
 * The ticket model on disk, and the only file that reads or writes a ticket's
 * folder. Every other file asks this one, and anything outside Flow's scripts
 * runs `flow`. A ticket that breaks into parts has children.
 *
 *   .flow/tickets/47/ticket.md    folder from birth, constant inner name
 *
 * A ticket's folder is its number alone, and the files hold no word: the word
 * lives in `ticketPrefix` in the project's settings, so a project that changes
 * its word keeps every ticket. A folder may keep words after the number
 * (`47-daemon-detection`); the number is all a lookup reads.
 *
 * Frontmatter is owned by these commands; the body is written by hand. That is
 * why templates hold body only: the frontmatter is generated, never templated.
 * `id`, `was`, `parent` and `deps` are stored bare (`47`) for the ticket's own
 * place and as `word-n` for another (`home-3`); in memory every id is full.
 *
 * An id is a word and a number, `exp-47`. The word names the place the ticket
 * lives: one per project, set when the project is set up, and `home` for the
 * tickets in ~/.flow/, which belong to no project. 2 places therefore never
 * produce the same id, and an id typed anywhere says where to look.
 */

import fs from 'node:fs';
import path from 'node:path';
import * as frontmatter from '../../shared/frontmatter.ts';
import * as statuses from './statuses.ts';
import * as ticketHistory from './ticket-history.ts';
import * as settings from '../../shared/settings.ts';
import { FlowError } from '../../shared/error.ts';
import * as paths from '../../shared/paths.ts';
import type { Ticket, TicketList } from './types.ts';
import { HOME_WORD, offerWord, badWord, normalizeId, wordOf, idNumber, byId, idOfFolder, idOfRef, folderName, storedId, toIdList } from './ids.ts';
import { toLabelList, toRank, now } from './fields.ts';
import { CONTEXT } from './ticket-body.ts';
import { readGroups, holder } from './groups.ts';

// `was` is the id a ticket held before `flow tickets move` took it to another place,
// or before a clash renumbered it, so the old id still finds it. `branch` is
// the code branch the work is built on, written once: see ticket-history.ts.
// `title` is the short name, 2 to 4 hyphenated words; `description` is the
// sentence saying what the ticket is for. Editing one never changes the other.
// `activity` is the kind of work under way on an in-progress ticket, which the
// band shows in capitals. Any status move clears it.
const TICKET_KEYS = ['id', 'was', 'title', 'description', 'status', 'activity', 'labels', 'rank', 'branch', 'parent', 'deps', 'reason', 'resume', 'closed', 'filed'];

// `reason` is required and typed by the user for the statuses statuses.ts
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
// `flow tickets file`.
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
 * The highest number this place ever gave out, committed with the tickets so
 * every clone shares it. The tickets on disk cannot say it: a ticket deleted,
 * moved away or taken back would free its number, and the next one would
 * take it while old records still name the first.
 */
const COUNTER = 'ticket-counter';
const counterFile = (root) => path.join(recordsDir(root), COUNTER);

/** 0 where the file is missing or unreadable: the tickets on disk then decide alone. */
function readCounter(root) {
  try {
    return parseInt(fs.readFileSync(counterFile(root), 'utf8'), 10) || 0;
  } catch {
    return 0;
  }
}

/** Raises the counter to `id`'s number. It never goes down. */
function countNumber(root, id) {
  const n = idNumber(id);
  if (n <= readCounter(root)) return;
  fs.mkdirSync(recordsDir(root), { recursive: true });
  fs.writeFileSync(counterFile(root), `${n}\n`);
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

/** A ticket's data as it is written, the ids in `storedId` form. Without a place to name the word, as it is. */
function storedData(t) {
  const prefix = t.root ? prefixOf(t.root) : null;
  if (!prefix) return t.data;
  const data = { ...t.data };
  for (const key of ['id', 'was', 'parent']) if (data[key]) data[key] = storedId(data[key], prefix);
  if (Array.isArray(data.deps)) data.deps = data.deps.map((d) => storedId(d, prefix));
  return data;
}

/** A ticket as the badge and the board show it: `exp-47-parser-split`. */
const nameOf = (t) => (t.data.title ? `${t.id}-${t.data.title}` : t.id);

/**
 * The words after the number in a folder name, '' for a folder that is the number
 * alone. A folder still holding its word (`exp-47-words`) gives its words too,
 * which lab/scripts/convert-tickets.ts reads from projects made before the number form.
 */
const labelOf = (t) => t.dirName.replace(/^(?:[a-z]{2,8}-)?\d+-?/, '');

// ---------------------------------------------------------------- tickets

/**
 * Every ticket in one place. The list carries the place's word as `prefix`,
 * so a caller holding the list can read an id typed without one, and the
 * place's `groups`. A todo or in-progress ticket carrying a parked group's
 * label gets `held`, that group's label.
 */
function readTickets(root) {
  const prefix = prefixOf(root);
  const groups = readGroups(recordsDir(root));
  const tickets: TicketList = Object.assign([] as Ticket[], { prefix, counter: readCounter(root), groups });
  scanTicketDir(ticketsDir(root), root, prefix, tickets);
  scanTicketDir(archiveDir(root), root, prefix, tickets);
  for (const t of tickets) {
    if (t.data.status === 'todo' || t.data.status === 'in-progress') t.held = holder(t, groups);
  }
  tickets.sort(byId);
  return tickets;
}

/**
 * The status every list, query and `--json` record reads: `parked` while a
 * parked group holds the ticket, else the stored one. The file keeps the
 * stored status, so a revive changes the card alone.
 */
const statusOf = (t: Ticket) => (t.held ? 'parked' : t.data.status);

function scanTicketDir(dir, root, prefix, out) {
  if (!fs.existsSync(dir)) return;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name === ARCHIVE) continue;
    const file = path.join(dir, entry.name, 'ticket.md');
    if (!fs.existsSync(file)) continue;

    const { data, body } = frontmatter.parse(fs.readFileSync(file, 'utf8'));
    data.id = normalizeId(data.id, prefix) || normalizeId(idOfFolder(entry.name), prefix) || entry.name;
    data.was = data.was ? (normalizeId(data.was, prefix) || String(data.was).trim()) : '';
    data.branch = data.branch ? String(data.branch).trim() : '';
    data.deps = toIdList(data.deps, prefix);
    // One parent at most: the ticket this one was split out of. Unparseable
    // values survive as written so `check` can report them.
    data.parent = data.parent ? (normalizeId(data.parent, prefix) || String(data.parent).trim()) : '';
    data.status = data.status || 'todo';
    data.activity = data.activity ? String(data.activity).trim().toLowerCase() : '';
    data.rank = toRank(data.rank);
    data.labels = toLabelList(data.labels).map((l) => l.toLowerCase());
    data.title = data.title || entry.name;
    data.description = data.description ? String(data.description).trim() : '';
    data.reason = data.reason ? String(data.reason).trim() : '';
    data.closed = data.closed ? String(data.closed).trim() : '';
    data.filed = data.filed ? String(data.filed).trim() : '';

    out.push({ id: data.id, dirName: entry.name, dir: path.join(dir, entry.name), file, data, body, root });
  }
}

/**
 * The higher of the counter and the highest ticket in the place, plus 1. A
 * missing counter, or a ticket made by hand, can never send it backwards.
 */
function nextId(tickets, prefix = tickets.prefix, counter = tickets.counter || 0) {
  let max = counter;
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
  fs.writeFileSync(t.file, frontmatter.stringify(storedData(t), TICKET_KEYS, t.body));
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
 * filesystems. `flow tickets move` can take a ticket from ~/.flow/ into a project on
 * another disk, and a rename across disks throws EXDEV.
 */
function moveFolder(from, to) {
  try {
    fs.renameSync(from, to);
  } catch (err: any) {
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
function setStatus(t, status, reason = '', activity = '') {
  const from = t.data.status;
  t.data.status = status;
  // The kind of work belongs to the stretch of work in progress; a move ends it.
  // Only a pickup (`flow tickets start --activity`) hands the next stretch its word.
  t.data.activity = status === 'in-progress' ? activity : '';
  // The moment work stopped. Any move back to a live status clears it, because
  // a ticket in flight has no finish to point at.
  t.data.closed = statuses.TERMINAL.has(status) ? now() : '';
  // A reason outlives only the status it explains. Carrying "waiting on the Q3
  // API" into a ticket now being built is worse than carrying nothing.
  t.data.reason = reason;
  // Where a parked ticket comes back to: the status it left is the only thing
  // that knows.
  t.data.resume = status === 'parked' ? from : '';
  // The code branch is written once, when work starts on the ticket.
  if (status === 'in-progress') ticketHistory.claimBranch(t);

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
  const folder = path.join(parent, folderName(id, labelOf(t)));
  if (fs.existsSync(folder)) throw new FlowError(`${folder} already exists.`);
  fs.mkdirSync(parent, { recursive: true });
  moveFolder(t.dir, folder);
  Object.assign(t, { root: target, dir: folder, dirName: path.basename(folder), file: path.join(folder, 'ticket.md') });
  t.data.was = t.id;
  t.data.deps = t.data.deps.map((d) => renamed.get(d) || d);
  t.data.parent = renamed.get(t.data.parent) || t.data.parent;
  t.data.id = id;
  writeTicket(t);
  countNumber(target, id);
}

/**
 * Deletes a ticket's folder whole: a new ticket the remote never took, or one
 * `flow tickets delete` removes. The counter is raised first, since a ticket
 * made before the counter existed would otherwise free its number.
 */
function remove(t) {
  if (t.root) countNumber(t.root, t.id);
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
  const renamed: { from: string; to: string }[] = [];

  for (const list of clashes) {
    const keep = list.find((t) => remote.has(t.dirName)) || list[0];
    for (const t of list) {
      if (t === keep) continue;
      const to = nextId(readTickets(root), tickets.prefix);
      const folder = path.join(path.dirname(t.dir), folderName(to, labelOf(t)));
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
      countNumber(root, to);
    }
  }
  return renamed;
}

// ---------------------------------------------------------------- history.md

/** A ticket's `history.md`: one line per status move, which `ticket-history.ts` builds. */
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
function createTicket(root, { title, description, labels, parent, deps, tickets, body: given }: { title: string; description?: string; labels?: any; parent?: any; deps?: any; tickets?: TicketList; body?: string }) {
  const id = nextId(tickets || readTickets(root), prefixOf(root));
  const dir = path.join(ticketsDir(root), folderName(id));
  if (fs.existsSync(dir)) throw new FlowError(`${dir} already exists.`);

  const data = {
    id,
    was: '',
    title: String(title).trim(),
    description: String(description || '').trim(),
    status: 'todo',
    labels: labels || [],
    rank: '',
    branch: '',
    parent: parent || '',
    deps: deps || [],
    reason: '',
    closed: '',
    filed: '',
  };
  // A supplied body replaces the template outright: the caller wrote the whole
  // file, so creating and filling a ticket is one command instead of two.
  const body = given != null ? String(given).trim() + '\n' : renderTemplate('ticket.md', {});

  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, 'ticket.md');
  fs.writeFileSync(file, frontmatter.stringify(storedData({ data, root }), TICKET_KEYS, body));
  fs.writeFileSync(path.join(dir, CONTEXT), renderTemplate(CONTEXT, {}));
  countNumber(root, id);

  return { id, dirName: path.basename(dir), dir, file, data, body, root };
}

/**
 * Resolves an id (exp-47, 47), an id the ticket held before it moved, a
 * folder name, or a word of a title, within one place's list. Only the id
 * part of `exp-47-old-words` is read, so a title that was renamed still finds it.
 */
function findTicket(tickets, ref) {
  const id = normalizeId(ref, tickets.prefix) || normalizeId(idOfRef(ref), tickets.prefix);
  if (id) {
    const hit = tickets.find((t) => t.id === id) || tickets.find((t) => t.data.was === id);
    if (!hit) throw new FlowError(`no ticket ${id}.`);
    return hit;
  }

  const needle = String(ref || '').trim();
  if (!needle) throw new FlowError('which ticket? give an id or a slug.');

  const exact = tickets.filter((t) => labelOf(t) === needle || t.dirName === needle || t.data.title === needle);
  if (exact.length === 1) return exact[0];
  if (exact.length > 1) throw new FlowError(ambiguous(needle, exact));

  const partial = tickets.filter((t) => t.dirName.includes(needle) || t.data.title.includes(needle));
  if (partial.length === 1) return partial[0];
  if (partial.length > 1) throw new FlowError(ambiguous(needle, partial));

  throw new FlowError(`no ticket matching "${needle}".`);
}

function ambiguous(needle, matches) {
  return `"${needle}" matches ${matches.length} tickets:\n` +
    matches.map((t) => `  ${nameOf(t)}`).join('\n');
}

// ---------------------------------------------------------------- templates

function renderTemplate(name, vars) {
  const file = path.join(import.meta.dirname, '..', '..', 'templates', name);
  if (!fs.existsSync(file)) throw new FlowError(`missing template: ${file}`);
  return fs.readFileSync(file, 'utf8').replace(/\{\{(\w+)\}\}/g, (m, key) =>
    Object.prototype.hasOwnProperty.call(vars, key) ? vars[key] : m
  );
}

// The ids, fields and folder parts live in their own files; callers keep asking this one.
export { WORD, requireId } from './ids.ts';
export { slugify, titleFrom, badTitle, toLabelList, badLabel, badActivity, today, now } from './fields.ts';
export { hasPlan, planSteps, hasMap, mapQuestions, reportFiles, decisionFiles, contextSections, questionCount, taskCount, openWork, tickTask, taskOf, removeTask } from './ticket-body.ts';
export { HOME_WORD, offerWord, badWord, wordOf, idOfFolder, normalizeId, idNumber, idOfRef, folderName, toIdList, CONTEXT };
export { TICKET_KEYS, recordsDir, isHome, homeRoot, ticketsDir, archiveDir, prefixOf, labelOf, nameOf, COUNTER, readTickets, statusOf, nextId, writeTicket, createTicket, findTicket, setStatus, move, moveFolder, remove, renumber, historyFile, appendHistory, readHistory };
