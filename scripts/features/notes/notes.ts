/**
 * Notes: an idea or a piece of put-off work, kept as one small file instead of
 * a ticket. A ticket exists only when the user asks for one.
 *
 *   ~/.flow/notes/board-notes-page.md      one folder for every project's notes
 *
 * The header holds `date`, `labels` and `project`: the ticket prefix of the
 * project the note belongs to, `home` for a note of ~/.flow. The text
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

import fs from 'node:fs';
import path from 'node:path';
import * as frontmatter from '../../shared/frontmatter.ts';
import * as store from '../tickets/store.ts';
import * as records from '../tickets/records.ts';
import { FlowError } from '../../shared/error.ts';

const KEYS = ['date', 'labels', 'project'];

// A colon later than this in the first line belongs to the sentence, not to a title.
const TITLE_COLON_MAX = 60;

/** A note as `readNotes` returns it: the header in `data`, the text in `body`. */
interface Note {
  id: string;
  file: string;
  changed: number;
  data: { date: string; labels: string[]; project: string };
  body: string;
}

const notesDir = () => path.join(store.homeRoot(), 'notes');

/** The project word a root files its notes under: its ticket prefix, `home` for the Flow home. */
const projectOf = (root: string) => store.prefixOf(root);

/** A note's file name, or null for a file that is not one. */
const stemOf = (name: string) => (name.endsWith('.md') && !name.startsWith('.') ? name.slice(0, -3) : null);

function readNote(dir: string, name: string): Note | null {
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
      project: data.project ? String(data.project).trim() : store.HOME_WORD,
    },
    body: body.trim(),
  };
}

/** Every note, the newest change first, then by file name. */
function readNotes(): Note[] {
  const dir = notesDir();
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .map((name) => readNote(dir, name))
    .filter((note): note is Note => note !== null)
    .sort((a, b) => b.changed - a.changed || a.id.localeCompare(b.id));
}

/** A note's first non-empty line. */
const firstLine = (note: Pick<Note, 'body'>) => (note.body.split('\n').find((l) => l.trim()) || '').trim();

/**
 * A note's title: the words before the first `: ` of its first line, cut as
 * `flow tickets new` cuts a ticket's, else the whole first line. A list cuts a long
 * one to its width.
 */
function titleOf(note: Pick<Note, 'body'>) {
  const line = firstLine(note);
  const cut = line.match(new RegExp(`^(.{1,${TITLE_COLON_MAX}}?):(?:\\s|$)`));
  return (cut && cut[1].trim()) || line;
}

function writeNote(note: Pick<Note, 'file' | 'data' | 'body'>) {
  fs.writeFileSync(note.file, frontmatter.stringify(note.data, KEYS, note.body));
}

/** A file name's words: the title, shortened, or `note` where it holds no word. */
function slugOf(text: string) {
  try {
    return store.slugify(text);
  } catch {
    return 'note';
  }
}

/** The first free file name for a slug: `board-notes-page`, then `board-notes-page-2`. */
function freeName(dir: string, slug: string) {
  const taken = new Set(fs.existsSync(dir) ? fs.readdirSync(dir) : []);
  for (let n = 1; ; n++) {
    const name = n === 1 ? slug : `${slug}-${n}`;
    if (!taken.has(`${name}.md`)) return name;
  }
}

const realPath = (file: string) => {
  try {
    return fs.realpathSync(file);
  } catch {
    return path.resolve(file);
  }
};

/** The note a ref names: its path, or its whole file name without `.md`. */
function findNote(notes: Note[], ref: unknown) {
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
function create({ text, labels = [], project = store.HOME_WORD }: { text: unknown; labels?: string[]; project?: string }) {
  const made = records.locked(store.homeRoot(), () => {
    const dir = notesDir();
    const body = String(text).trim();
    const id = freeName(dir, slugOf(titleOf({ body })));
    const note: Omit<Note, 'changed'> = { id, file: path.join(dir, `${id}.md`), data: { date: store.today(), labels, project }, body };
    fs.mkdirSync(dir, { recursive: true });
    writeNote(note);
    return { ok: true, note };
  });
  if (!made.ok) throw new FlowError(`no note was made: ${made.why}.`);
  return made;
}

function remove(note: Pick<Note, 'file'>) {
  fs.rmSync(note.file, { force: true });
}

export type { Note };
export { notesDir, projectOf, readNotes, firstLine, titleOf, findNote, create, remove, writeNote };
