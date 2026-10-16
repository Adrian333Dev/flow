'use strict';
/**
 * Notes: an idea or a piece of put-off work, kept as one small file instead of
 * a ticket. A ticket exists only when the user asks for one.
 *
 *   ~/.flow/notes/board-notes-page.md      one folder for every project's notes
 *
 * The header holds `date`, `labels` and `project`: the folder name of the
 * project the note was made in, `global` for a note made outside one. The text
 * follows. A note has no number, no id, no title field and no rank:
 * `titleOf` reads its title from the text, so editing the first line changes
 * the title at once, and a list shows the newest change first. The file name
 * is made from that title once, when the note is created, with `-2`, `-3` on a
 * clash, and never changes after. A command names a note by its whole file
 * name without `.md`, or by its path.
 *
 * Sessions run in parallel on one checkout, so a name is taken and its file
 * written while holding the records lock of the Flow home. It is the home's
 * and never a project's: 2 projects adding a note meet in the same folder.
 */

const fs = require('fs');
const path = require('path');
const frontmatter = require('./frontmatter');
const store = require('./tickets/store');
const records = require('./tickets/records');
const { FlowError } = require('./error');

const KEYS = ['date', 'labels', 'project'];

// The project of a note made outside one. It is a project like any other, so no project folder may take the name.
const GLOBAL = 'global';

// A colon later than this in the first line belongs to the sentence, not to a title.
const TITLE_COLON_MAX = 60;

const notesDir = () => path.join(store.homeRoot(), 'notes');

/** The project name a root files its notes under: its folder name, `global` for the Flow home. */
const projectOf = (root) => (store.isHome(root) ? GLOBAL : path.basename(root));

/** A note's file name, or null for a file that is not one. */
const stemOf = (name) => (name.endsWith('.md') && !name.startsWith('.') ? name.slice(0, -3) : null);

function readNote(dir, name) {
  const stem = stemOf(name);
  if (!stem) return null;
  const file = path.join(dir, name);
  const { data, body } = frontmatter.parse(fs.readFileSync(file, 'utf8'));
  return {
    id: stem,
    file,
    changed: fs.statSync(file).mtimeMs,
    data: {
      date: data.date ? String(data.date).trim() : '',
      labels: store.toLabelList(data.labels).map((l) => l.toLowerCase()),
      project: data.project ? String(data.project).trim() : GLOBAL,
    },
    body: body.trim(),
  };
}

/** Every note, the newest change first, then by file name. */
function readNotes() {
  const dir = notesDir();
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .map((name) => readNote(dir, name))
    .filter(Boolean)
    .sort((a, b) => b.changed - a.changed || a.id.localeCompare(b.id));
}

/** A note's first non-empty line. */
const firstLine = (note) => (note.body.split('\n').find((l) => l.trim()) || '').trim();

/**
 * A note's title: the words before the first `: ` of its first line, cut as
 * `flow new` cuts a ticket's, else the whole first line. A list cuts a long
 * one to its width.
 */
function titleOf(note) {
  const line = firstLine(note);
  const cut = line.match(new RegExp(`^(.{1,${TITLE_COLON_MAX}}?):(?:\\s|$)`));
  return (cut && cut[1].trim()) || line;
}

function writeNote(note) {
  fs.writeFileSync(note.file, frontmatter.stringify(note.data, KEYS, note.body));
}

/** A file name's words: the title, shortened, or `note` where it holds no word. */
function slugOf(text) {
  try {
    return store.slugify(text);
  } catch {
    return 'note';
  }
}

/** The first free file name for a slug: `board-notes-page`, then `board-notes-page-2`. */
function freeName(dir, slug) {
  const taken = new Set(fs.existsSync(dir) ? fs.readdirSync(dir) : []);
  for (let n = 1; ; n++) {
    const name = n === 1 ? slug : `${slug}-${n}`;
    if (!taken.has(`${name}.md`)) return name;
  }
}

const realPath = (file) => {
  try {
    return fs.realpathSync(file);
  } catch {
    return path.resolve(file);
  }
};

/** The note a ref names: its path, or its whole file name without `.md`. */
function findNote(notes, ref) {
  const given = String(ref ?? '').trim();
  if (!given) throw new FlowError('name a note: its file name without .md, or its path. The list is flow notes.');
  if (given.includes('/')) {
    const hit = notes.find((n) => realPath(n.file) === realPath(given));
    if (!hit) throw new FlowError(`${given} is not a note.`);
    return hit;
  }
  const name = given.replace(/\.md$/i, '').toLowerCase();
  const hit = notes.find((n) => n.id === name);
  if (!hit) throw new FlowError(`no note "${given}". Give the whole file name without .md; the list is flow notes.`);
  return hit;
}

/** Adds a note. The name and the file are settled together under the lock, so 2 sessions adding at once get 2 names. */
function create({ text, labels = [], project = GLOBAL }) {
  const made = records.locked(store.homeRoot(), () => {
    const dir = notesDir();
    const note = {
      data: { date: store.today(), labels, project },
      body: String(text).trim(),
    };
    note.id = freeName(dir, slugOf(titleOf(note)));
    note.file = path.join(dir, `${note.id}.md`);
    fs.mkdirSync(dir, { recursive: true });
    writeNote(note);
    return { ok: true, note };
  });
  if (!made.ok) throw new FlowError(`no note was made: ${made.why}.`);
  return made;
}

function remove(note) {
  fs.rmSync(note.file, { force: true });
}

module.exports = {
  GLOBAL, notesDir, projectOf, readNotes, firstLine, titleOf, findNote, create, remove, writeNote,
};
