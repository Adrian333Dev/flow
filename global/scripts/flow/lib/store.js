'use strict';
/**
 * The ticket model on disk. One entity — a ticket absorbs what used to be a
 * separate "topic", so a ticket that decomposes just has children.
 *
 *   docs/tickets/t047-daemon-detection/ticket.md    folder from birth, constant inner name
 *
 * Frontmatter is owned by these commands; the body is written by hand. That is
 * why templates hold body only — the frontmatter is generated, never templated.
 */

const fs = require('fs');
const path = require('path');
const frontmatter = require('./frontmatter');
const statuses = require('./statuses');
const { FlowError } = require('./error');

const TICKET_KEYS = ['id', 'title', 'status', 'type', 'priority', 'parent', 'deps', 'reason', 'resume', 'closed', 'filed'];

// The vocabulary and every property of it live in one table — see statuses.js.
const TICKET_STATUSES = statuses.NAMES;

// `topic` is a ticket whose deliverable is a settled answer rather than code.
// It was called `research` until the name collided with the `research` skill,
// which fetches documentation and decides nothing.
const TICKET_TYPES = ['feature', 'issue', 'chore', 'topic', 'prototype'];

// Only `high` and `low` reach disk. `normal` is the name for the missing field,
// so an ordinary ticket carries no priority line at all — which is the whole
// defence against the usual rot, where everything is stamped at creation and
// `high` stops meaning anything a year in. Nothing sets it but the user asking.
const TICKET_PRIORITIES = ['high', 'normal', 'low'];
const STORED_PRIORITIES = ['high', 'low'];

/** Anything that is not a stored value — including `normal` — means unset. */
const toPriority = (v) => {
  const s = String(v || '').trim().toLowerCase();
  return STORED_PRIORITIES.includes(s) ? s : '';
};

// Statuses whose `reason:` is required and typed by the user. Everywhere else
// the workflow is its own explanation.
//
// `resume` is the other half of parking: the status the ticket left, so it
// comes back where it stopped. It lives and dies with `reason` — both are
// written when a ticket is parked and cleared by the move off it.
const REASON_STATUSES = [...statuses.NEEDS_REASON];

// `closed` is the moment work stopped — stamped when a ticket reaches `done`
// or `dropped`, cleared by any move back to a live status. It carries the clock
// down to the second because its only job is ordering, and closing a batch puts
// several tickets inside one minute — which then tie, and `last closed` picks
// whichever the directory happened to list first. Nothing else on a ticket can
// answer "what did I finish last":
// `filed` is stamped days later by the filing pass, ids are creation order and
// not finishing order, and a file's mtime is rewritten by `git checkout` and by
// `flow file`.
//
// `filed` holds the date the filing pass swept this ticket, and only that pass
// writes it. `status: done` says the work is finished; `filed` says the
// knowledge was harvested — two different claims, and nothing else on the
// ticket makes the second one. It is set even where the ticket taught nothing,
// because recording that it was looked at is what drains the queue.

// Terminal tickets move to docs/tickets/archive/ so the live pool stays
// readable in a file tree. Two buckets, never one per status — a folder per
// status would make location duplicate `status`, which is the thing that
// killed promote-on-building. `parked` is revivable, so it stays in the pool.
const TERMINAL_STATUSES = [...statuses.TERMINAL];
const ARCHIVE = 'archive';

const ID_WIDTH = 3;
const SLUG_MAX = 48;

// The label on the end of an id — `t047-parser-split`. Short enough to read at
// a glance in a list, and long enough to say what the ticket is. The number
// stays the identity, so a label that goes stale breaks nothing.
const LABEL_WORDS = 3;

const ticketsDir = (root) => path.join(root, 'docs', 'tickets');
const archiveDir = (root) => path.join(root, 'docs', 'tickets', ARCHIVE);

/**
 * t47 / 47 / T047 all normalize to t047. Returns null for anything else.
 * Past t999 the id simply grows a digit — padStart never truncates.
 */
function normalizeId(ref) {
  const m = String(ref || '').trim().match(/^t?(\d+)$/i);
  if (!m) return null;
  return 't' + String(parseInt(m[1], 10)).padStart(ID_WIDTH, '0');
}

/** Sort key. String compare puts t182 between t1819 and t1820 once ids pass 999. */
function idNumber(id) {
  const m = String(id).match(/^t(\d+)$/);
  return m ? parseInt(m[1], 10) : Number.MAX_SAFE_INTEGER;
}

const byId = (a, b) => idNumber(a.id) - idNumber(b.id) || String(a.id).localeCompare(String(b.id));

function requireId(ref) {
  const id = normalizeId(ref);
  if (!id) throw new FlowError(`not a ticket id: ${ref}`);
  return id;
}

/** Local date, not UTC — a date stamped a day behind the user's own calendar
 *  is wrong in the only way this field can be wrong. */
function today() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** `today()` plus the clock, for `closed` — see the note on that field. */
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
  if (!base) throw new FlowError('that title produces an empty slug — it needs words, not punctuation.');
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

/** The label part of a folder name, with the number stripped off. */
const labelOf = (t) => t.dirName.replace(/^t\d+-/, '');

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

function toIdList(v) {
  if (v === undefined || v === null || v === '') return [];
  const raw = Array.isArray(v) ? v : String(v).split(',');
  return raw
    .map((x) => String(x).trim())
    .filter(Boolean)
    .map((x) => normalizeId(x) || x); // keep unparseable entries so `check` can report them
}

// ---------------------------------------------------------------- tickets

function readTickets(root) {
  const tickets = [];
  scanTicketDir(ticketsDir(root), root, tickets);
  scanTicketDir(archiveDir(root), root, tickets);
  tickets.sort(byId);
  return tickets;
}

function scanTicketDir(dir, root, out) {
  if (!fs.existsSync(dir)) return;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name === ARCHIVE) continue;
    const file = path.join(dir, entry.name, 'ticket.md');
    if (!fs.existsSync(file)) continue;

    const { data, body } = frontmatter.parse(fs.readFileSync(file, 'utf8'));
    data.id = normalizeId(data.id) || entry.name.split('-')[0];
    data.deps = toIdList(data.deps);
    // One parent at most — the ticket this one was split out of. Unparseable
    // values survive as written so `check` can report them.
    data.parent = data.parent ? (normalizeId(data.parent) || String(data.parent).trim()) : '';
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

function nextId(tickets) {
  let max = 0;
  for (const t of tickets) {
    const n = idNumber(t.id);
    if (n !== Number.MAX_SAFE_INTEGER) max = Math.max(max, n);
  }
  return 't' + String(max + 1).padStart(ID_WIDTH, '0');
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

// `tickets` is passed in when the caller already read the pool — at a few
// thousand tickets a second scan is the most expensive thing a command does.
function createTicket(root, { title, type, priority, parent, deps, tickets, body: given, fromGroundwork, label }) {
  const id = nextId(tickets || readTickets(root));
  const slug = labelize(label || title);
  const dir = path.join(ticketsDir(root), `${id}-${slug}`);
  if (fs.existsSync(dir)) throw new FlowError(`${dir} already exists.`);

  const data = {
    id,
    title: String(title).trim(),
    status: 'todo',
    type: type || 'feature',
    priority: toPriority(priority),
    parent: parent || '',
    deps: deps || [],
    reason: '',
    closed: '',
    filed: '',
  };
  // A supplied body replaces the template outright — the caller wrote the whole
  // file, so creating and filling a ticket is one command instead of two.
  const body = given != null ? String(given).trim() + '\n' : renderTemplate('ticket.md', { id, slug, title: data.title });

  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, 'ticket.md');
  fs.writeFileSync(file, frontmatter.stringify(data, TICKET_KEYS, body));

  // `groundwork/` exists from birth, always. You cannot know at the start
  // whether groundwork will split a ticket, so its location must never
  // depend on that outcome — and a ticket's path is fixed for life.
  const groundworkDir = path.join(dir, 'groundwork');
  if (fromGroundwork) {
    // A loose groundwork that turned out to be exactly one unit of work moves
    // in whole and leaves nothing behind, so there is never a second copy to
    // drift. Same filesystem by construction: both paths are under `root`.
    fs.renameSync(fromGroundwork, groundworkDir);
  } else {
    fs.mkdirSync(groundworkDir, { recursive: true });
    fs.writeFileSync(
      path.join(groundworkDir, 'map.md'),
      renderTemplate('map.md', { id, title: data.title })
    );
  }

  return { id, dirName: `${id}-${slug}`, dir, file, data, body, root, movedFrom: fromGroundwork || null };
}

/**
 * Whether this ticket has a plan, and how far it got.
 *
 * `flow` used to report `4/9` in every list, which put a regex over
 * hand-written prose into the daily views and read zero whenever a plan was
 * shaped any other way. The count is back in `flow <id>` alone. There it
 * answers the question a session picking the ticket up actually has — is the
 * plan written, and is it finished — and it is counted at read time, so it
 * cannot drift from the file the way a stored number would. A plan with no
 * checkboxes reports no count at all rather than `0/0`.
 */
const planFile = (t) => path.join(t.dir, 'plan.md');
const hasPlan = (t) => fs.existsSync(planFile(t));

// `1. [ ] **Add the config table**` is a step. Anything indented under it is a
// sub-check the build added, which `execute` says explicitly in the format it
// writes — so the left margin is what separates the two.
const STEP = /^ {0,3}(?:\d+[.)]|[-*])\s+\[([ xX])\]/;

function planSteps(t) {
  if (!hasPlan(t)) return null;
  const boxes = fs.readFileSync(planFile(t), 'utf8').split('\n').map((l) => l.match(STEP)).filter(Boolean);
  if (!boxes.length) return null;
  return { done: boxes.filter((m) => m[1] !== ' ').length, total: boxes.length };
}

/**
 * Reports written into the ticket, one per thing answered. A folder rather than
 * a single `report.md` for the reason `groundwork/` is a folder: you cannot
 * know at the start whether a ticket answers one question or three. Unlike
 * `groundwork/` it appears on first write, because a report's location never
 * moves — it just may not exist.
 */
const reportFiles = (t) => {
  const dir = path.join(t.dir, 'reports');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.endsWith('.md')).sort();
};

/** Resolves an id (t047, t47, 47), a slug, or a folder name. */
function findTicket(tickets, ref) {
  const id = normalizeId(ref);
  if (id) {
    const hit = tickets.find((t) => t.id === id);
    if (!hit) throw new FlowError(`no ticket ${id}.`);
    return hit;
  }

  const needle = String(ref || '').trim();
  if (!needle) throw new FlowError('which ticket? give an id or a slug.');

  const slugOf = (t) => t.dirName.replace(/^t\d+-/, '');
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
  const file = path.join(__dirname, '..', 'templates', name);
  if (!fs.existsSync(file)) throw new FlowError(`missing template: ${file}`);
  return fs.readFileSync(file, 'utf8').replace(/\{\{(\w+)\}\}/g, (m, key) =>
    Object.prototype.hasOwnProperty.call(vars, key) ? vars[key] : m
  );
}

/**
 * The `flow-open` block — what a resumed session reads before its first turn.
 *
 * A fenced block and not a bullet list, because a fence has hard edges: finding
 * it is reading from one marker to the next, never a guess about where prose
 * stops. `handoff` writes it, into `## State` on a ticket or into a `handoff.md`
 * beside loose work, so the paths sit in the same file as the note explaining
 * them. A separate file would be a second copy of `handoff`'s What to open.
 *
 * ```flow-open
 * plan.md
 * src/parser.js:40-120   # where step 4 stopped
 * ```
 *
 * No minimum. A ticket cut from a spec carries everything in its own body, and
 * an absent block is the honest answer there.
 */
const OPEN_START = /^```flow-open\s*$/;
const OPEN_END = /^```\s*$/;

function openBlock(text) {
  const lines = String(text || '').split('\n');
  const start = lines.findIndex((l) => OPEN_START.test(l));
  if (start === -1) return [];
  const specs = [];
  for (let i = start + 1; i < lines.length; i++) {
    if (OPEN_END.test(lines[i])) break;
    const spec = lines[i].replace(/(^|\s)#.*$/, '').trim();
    if (spec) specs.push(spec);
  }
  return specs;
}

module.exports = {
  TICKET_KEYS, TICKET_STATUSES, TICKET_TYPES, TICKET_PRIORITIES, REASON_STATUSES, TERMINAL_STATUSES,
  ticketsDir, archiveDir,
  normalizeId, idNumber, requireId, slugify, labelize, labelOf, relabel, toIdList, toPriority, today, now,
  readTickets, nextId, writeTicket, createTicket, findTicket, hasPlan, planSteps, reportFiles, openBlock,
  renderTemplate, // cases.js borrows this, slugify and today; nothing else is shared
};
