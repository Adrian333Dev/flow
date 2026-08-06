'use strict';
/**
 * The ticket and topic model on disk.
 *
 *   docs/tickets/t047-daemon-detection/ticket.md    folder from birth, constant inner name
 *   docs/topics/local-daemon/topic.md
 *
 * Frontmatter is owned by these commands; the body is written by hand. That is
 * why templates hold body only — the frontmatter is generated, never templated.
 */

const fs = require('fs');
const path = require('path');
const frontmatter = require('./frontmatter');
const { FlowError } = require('./error');

const TICKET_KEYS = ['id', 'title', 'status', 'type', 'topic', 'deps', 'by'];
const TOPIC_KEYS = ['slug', 'title', 'status', 'from'];

const TICKET_STATUSES = ['todo', 'in-progress', 'review', 'done', 'dropped', 'superseded'];
const TICKET_TYPES = ['feature', 'issue', 'chore', 'research'];
const TOPIC_STATUSES = ['in-progress', 'parked', 'committed', 'dropped'];

// Terminal tickets move to docs/tickets/archive/ so the live pool stays
// readable in a file tree. Two buckets, never one per status — a folder per
// status would make location duplicate `status`, which is the thing that
// killed promote-on-in-progress.
const TERMINAL_STATUSES = ['done', 'dropped', 'superseded'];
const ARCHIVE = 'archive';

const ID_WIDTH = 3;
const SLUG_MAX = 48;

const ticketsDir = (root) => path.join(root, 'docs', 'tickets');
const archiveDir = (root) => path.join(root, 'docs', 'tickets', ARCHIVE);
const topicsDir = (root) => path.join(root, 'docs', 'topics');

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
    data.by = toIdList(data.by);
    data.status = data.status || 'todo';
    data.type = data.type || 'feature';
    data.title = data.title || entry.name;

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
function createTicket(root, { title, type, topic, deps, tickets, body: given }) {
  const id = nextId(tickets || readTickets(root));
  const slug = slugify(title);
  const dir = path.join(ticketsDir(root), `${id}-${slug}`);
  if (fs.existsSync(dir)) throw new FlowError(`${dir} already exists.`);

  const data = {
    id,
    title: String(title).trim(),
    status: 'todo',
    type: type || 'feature',
    topic: topic || '',
    deps: deps || [],
    by: [],
  };
  // A supplied body replaces the template outright — the caller wrote the whole
  // file, so creating and filling a ticket is one command instead of two.
  const body = given != null ? String(given).trim() + '\n' : renderTemplate('ticket.md', { id, slug, title: data.title });

  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, 'ticket.md');
  fs.writeFileSync(file, frontmatter.stringify(data, TICKET_KEYS, body));

  return { id, dirName: `${id}-${slug}`, dir, file, data, body, root };
}

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

// ---------------------------------------------------------------- topics

function readTopics(root) {
  const dir = topicsDir(root);
  if (!fs.existsSync(dir)) return [];

  const topics = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const file = path.join(dir, entry.name, 'topic.md');
    if (!fs.existsSync(file)) continue;

    const { data, body } = frontmatter.parse(fs.readFileSync(file, 'utf8'));
    data.slug = data.slug || entry.name;
    data.status = data.status || 'in-progress';
    data.title = data.title || entry.name;
    data.from = toIdList(data.from);

    topics.push({ slug: data.slug, dir: path.join(dir, entry.name), file, data, body });
  }

  topics.sort((a, b) => a.slug.localeCompare(b.slug));
  return topics;
}

function writeTopic(tp) {
  fs.writeFileSync(tp.file, frontmatter.stringify(tp.data, TOPIC_KEYS, tp.body));
}

function createTopic(root, { title, slug, from }) {
  const finalSlug = slug ? slugify(slug) : slugify(title);
  const dir = path.join(topicsDir(root), finalSlug);
  if (fs.existsSync(dir)) throw new FlowError(`topic "${finalSlug}" already exists at ${dir}.`);

  const data = {
    slug: finalSlug,
    title: String(title).trim(),
    status: 'in-progress',
    from: from || [],
  };
  const body = renderTemplate('topic.md', { slug: finalSlug, title: data.title });

  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, 'topic.md');
  fs.writeFileSync(file, frontmatter.stringify(data, TOPIC_KEYS, body));

  return { slug: finalSlug, dir, file, data, body };
}

function findTopic(topics, ref) {
  const needle = String(ref || '').trim();
  if (!needle) throw new FlowError('which topic? give its slug.');
  const hit = topics.find((tp) => tp.slug === needle);
  if (!hit) throw new FlowError(`no topic "${needle}".`);
  return hit;
}

// ---------------------------------------------------------------- templates

function renderTemplate(name, vars) {
  const file = path.join(__dirname, '..', 'templates', name);
  if (!fs.existsSync(file)) throw new FlowError(`missing template: ${file}`);
  return fs.readFileSync(file, 'utf8').replace(/\{\{(\w+)\}\}/g, (m, key) =>
    Object.prototype.hasOwnProperty.call(vars, key) ? vars[key] : m
  );
}

module.exports = {
  TICKET_KEYS, TOPIC_KEYS, TICKET_STATUSES, TICKET_TYPES, TOPIC_STATUSES, TERMINAL_STATUSES,
  ticketsDir, archiveDir, topicsDir,
  normalizeId, idNumber, requireId, slugify, toIdList,
  readTickets, nextId, writeTicket, createTicket, findTicket,
  readTopics, writeTopic, createTopic, findTopic,
};
