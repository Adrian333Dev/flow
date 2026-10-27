/**
 * Notes: ideas and put-off work as small files (features/notes/notes.ts), under
 * `flow notes`.
 *
 * A note has no id: a command names it by its whole file name without `.md`,
 * or its path. `flow notes` typed alone lists them, and `flow notes -- "<query>"`
 * narrows the list (shared/query.ts). A query selects and a flag sets: `new`
 * takes `--label` and `--project`, and the list takes neither.
 *
 * No `edit`: the file is plain text, so the board's editor or any editor
 * covers it. `promote` is the one extra action, because it makes a ticket and
 * removes a note, which no standard action does.
 */

import { FlowError } from '../shared/error.ts';
import { out, json } from '../shared/cli.ts';
import type { Action } from '../shared/cli.ts';
import { projectRoot, projectRootOrNull } from '../shared/project.ts';
import * as store from '../features/tickets/store.ts';
import * as records from '../features/tickets/records.ts';
import * as query from '../shared/query.ts';
import * as notes from '../features/notes/notes.ts';
import * as tickets from './tickets.ts';
import { projectNamed, outside, PROJECT_FLAG } from '../features/tickets/places.ts';
import * as ticketJson from '../features/tickets/json.ts';

const FIELDS = ['label', 'project'];

/** The labels a `--label a,b` value names, each checked as a ticket's are. */
function labelsFrom(value) {
  const labels = store.toLabelList(value);
  for (const label of labels) {
    const bad = store.badLabel(label);
    if (bad) throw new FlowError(bad);
  }
  return labels;
}

/**
 * A `project:` value must read as a prefix. It need not be registered on this
 * machine: notes travel with the Flow home, the registry does not.
 */
function checkProjectWord(word) {
  if (word === 'global') throw new FlowError('"global" is now named "home": use project:home.');
  if (['here', 'all', store.HOME_WORD].includes(word) || store.WORD.test(word)) return;
  throw new FlowError(`project:${word} is not a project prefix. A note names its project by prefix, such as fw or home, never its folder.`);
}

/** The prefix of the project the command runs in, or null outside a Flow project. */
function hereName() {
  const root = projectRootOrNull();
  return root ? notes.projectOf(root) : null;
}

/** Notes live in the Flow home, so a save is the home's background sync. */
const saved = () => records.syncLater(store.homeRoot());

/** One note as `--json` prints it, the list's shape. */
const noteJson = (n) => ({
  name: n.id, title: notes.titleOf(n), date: n.data.date, project: n.data.project, labels: n.data.labels, path: n.file, text: n.body,
});

/** Adds the note and prints what was made. */
function add(words, flags, usage) {
  const [text, ...extra] = words.map((w) => w.trim());
  if (!text || extra.length) throw new FlowError(`usage: ${usage} "<text>", in quotes`);
  const root = flags.project === undefined ? projectRootOrNull() : projectNamed(flags.project, '--project');
  if (!root) throw outside();
  const { note } = notes.create({ text, labels: labelsFrom(flags.label), project: notes.projectOf(root) });
  saved();
  json({ note: noteJson(note) });
  out(`created ${note.id}`);
  out(`        ${note.file}`);
  out(`        project: ${note.data.project}`);
  if (note.data.labels.length) out(`        labels: ${note.data.labels.join(', ')}`);
  return 0;
}

const needsRef = (positional, usage) => {
  if (!positional[0]) throw new FlowError(`usage: ${usage}`);
  return positional[0];
};

const actions: Record<string, Action> = {};

/** `flow notes`, typed alone or with a query. */
const listing = {
  args: '[-- "<query>"]',
  summary: 'every note whole as JSON, newest change first; a query like "label:ui,profile project:all cache" narrows it',
  query: true,
  run({ query: text }) {
    const terms = query.parse(text, FIELDS);
    for (const term of terms.filter((t) => t.field === 'project')) term.values.forEach(checkProjectWord);
    if (!query.has(terms, 'project')) terms.push({ field: 'project', values: ['here', store.HOME_WORD] });
    const wantsHere = terms.some((t) => t.field === 'project' && t.values.includes('here'));
    const here = wantsHere ? hereName() : null;
    const test = query.matcher(terms, {
      word: (n, w) => `${n.body}\n${n.data.labels.join(' ')}\n${n.data.project}`.toLowerCase().includes(w),
      label: (n, v) => n.data.labels.includes(v),
      project: (n, v) => v === 'all' || n.data.project.toLowerCase() === (v === 'here' ? here?.toLowerCase() : v),
    });
    const found = notes.readNotes().filter(test).map(noteJson);
    json(found);
    out(JSON.stringify(found, null, 2));
    return 0;
  },
};

actions.new = {
  args: '"<text>"',
  summary: 'add one; --project names where it belongs, and is needed outside a project',
  flags: { label: { arg: '<label,label>' }, project: PROJECT_FLAG },
  run({ positional, flags, usage }) {
    return add(positional, flags, usage);
  },
};

actions.get = {
  args: '<name>',
  summary: 'show one, with its path',
  run({ positional, usage }) {
    const note = notes.findNote(notes.readNotes(), needsRef(positional, usage));
    json({ note: noteJson(note) });
    out(`${note.id}   ${note.data.date}   project: ${note.data.project}${note.data.labels.length ? `   labels: ${note.data.labels.join(', ')}` : ''}`);
    out(`  ${note.file}`);
    out(`\n${note.body}`);
    return 0;
  },
};

actions.drop = {
  args: '<name>',
  summary: 'delete one; the agent asks first',
  run({ positional, usage }) {
    const note = notes.findNote(notes.readNotes(), needsRef(positional, usage));
    notes.remove(note);
    saved();
    json({ dropped: note.id });
    out(`dropped ${note.id}: ${notes.titleOf(note)}`);
    return 0;
  },
};

/**
 * The ticket is made by `flow tickets new`'s own code, so its number, its push and its
 * refusals are the same. The note goes only once the ticket exists. A ticket
 * belongs to the project it is made in, so a note of another project is refused.
 */
actions.promote = {
  args: '<name>',
  summary: 'make a ticket from one and remove it; only inside the project it belongs to',
  run({ positional, usage }) {
    const root = projectRoot();
    const note = notes.findNote(notes.readNotes(), needsRef(positional, usage));
    const here = notes.projectOf(root);
    if (note.data.project.toLowerCase() !== here.toLowerCase()) {
      const where = note.data.project === store.HOME_WORD ? 'in ~/.flow' : `inside the project with the prefix ${note.data.project}`;
      throw new FlowError(`${note.id} belongs to ${note.data.project}, not ${here}: run promote ${where}.`);
    }
    const known = new Set(store.readTickets(root).map((t) => t.id));

    tickets.actions.new.run({
      positional: [notes.firstLine(note)],
      query: undefined,
      flags: { body: note.body, label: note.data.labels.join(',') },
      usage: 'flow tickets new',
    });

    const after = store.readTickets(root);
    const made = after.find((t) => !known.has(t.id));
    notes.remove(note);
    saved();
    json({ note: note.id, ticket: made ? ticketJson.record(made, after) : null });
    out(`\npromoted ${note.id} → ${made ? made.id : 'a new ticket'}`);
    return 0;
  },
};

export default {
  summary: 'ideas and put-off work as small files',
  list: listing,
  actions,
};
