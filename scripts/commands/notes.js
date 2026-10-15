'use strict';
/**
 * Notes: ideas and put-off work as small files (lib/notes.js). `flow notes` is
 * the group, and `flow note <text>` is the short form that adds one at once.
 *
 * A note has no id: a command names it by its whole file name without `.md`,
 * or its path. `ls` takes one quoted query (lib/query.js) and prints the paths.
 * A query selects and a flag sets: `new` takes `--label` and `--project`, and
 * `ls` takes neither.
 *
 * No `edit`: the file is plain text, so the board's editor or any editor
 * covers it. `promote` is the one extra action, because it makes a ticket and
 * removes a note, which no standard action does. `flow note` is a kept
 * exception to the command principles: notes are thrown in mid-work, so the
 * short form is typed most.
 */

const path = require('path');
const { FlowError } = require('../lib/error');
const { out } = require('../lib/cli');
const { projectRoot } = require('../lib/project');
const store = require('../lib/tickets/store');
const records = require('../lib/tickets/records');
const query = require('../lib/query');
const notes = require('../lib/notes');
const tickets = require('./tickets');

const FIELDS = ['label', 'project'];

// Values a `project:` term reads as words, so no note may be filed under them.
const RESERVED = ['all', 'here'];

/** The labels a `--label a,b` value names, each checked as a ticket's are. */
function labelsFrom(value) {
  const labels = store.toLabelList(value);
  for (const label of labels) {
    const bad = store.badLabel(label);
    if (bad) throw new FlowError(bad);
  }
  return labels;
}

/** The project name a root files its notes under: its folder name, `global` for the Flow home. */
const nameOf = (root) => (store.isHome(root) ? notes.GLOBAL : path.basename(root));

/** The project the command runs in, or null outside a Flow project, which only `here` needs. */
function hereName() {
  try {
    return nameOf(projectRoot());
  } catch (e) {
    if (e instanceof FlowError) return null;
    throw e;
  }
}

/** Notes live in the Flow home, so a save is the home's background sync. */
const saved = () => records.syncLater(store.homeRoot());

/** Adds the note and prints what was made. Both `flow note` and `flow notes new` run it. */
function add(words, flags, usage) {
  const text = words.join(' ').trim();
  if (!text) throw new FlowError(`usage: ${usage}`);
  const project = flags.project ? String(flags.project).trim() : hereName() || notes.GLOBAL;
  if (RESERVED.includes(project.toLowerCase())) throw new FlowError(`"${project}" cannot be a project: it is a word a query reads.`);
  const { note } = notes.create({ text, labels: labelsFrom(flags.label), project });
  saved();
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

const actions = {};

actions.ls = {
  args: '["<query>"]',
  summary: 'every note whole as JSON, newest change first; a query like "label:ui,profile project:all cache" narrows it',
  run({ positional, usage }) {
    if (positional.length > 1) throw new FlowError(`${usage} takes one quoted query: "label:profile cache".`);
    const terms = query.parse(positional[0], FIELDS);
    if (!query.has(terms, 'project')) terms.push({ field: 'project', values: ['here', notes.GLOBAL] });
    const wantsHere = terms.some((t) => t.field === 'project' && t.values.includes('here'));
    const here = wantsHere ? hereName() : null;
    const test = query.matcher(terms, {
      word: (n, w) => `${n.body}\n${n.data.labels.join(' ')}\n${n.data.project}`.toLowerCase().includes(w),
      label: (n, v) => n.data.labels.includes(v),
      project: (n, v) => v === 'all' || n.data.project.toLowerCase() === (v === 'here' ? here?.toLowerCase() : v),
    });
    out(JSON.stringify(notes.readNotes().filter(test).map((n) => ({
      name: n.id, title: notes.titleOf(n), date: n.data.date, project: n.data.project, labels: n.data.labels, path: n.file, text: n.body,
    })), null, 2));
    return 0;
  },
};

actions.new = {
  args: '"<text>"',
  summary: 'add one; --project names where it belongs, global when outside a project',
  flags: { label: { arg: '<label,label>' }, project: { arg: '<name>' } },
  run({ positional, flags, usage }) {
    return add(positional, flags, usage);
  },
};

actions.get = {
  args: '<name>',
  summary: 'show one, with its path',
  run({ positional, usage }) {
    const note = notes.findNote(notes.readNotes(), needsRef(positional, usage));
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
    out(`dropped ${note.id}: ${notes.titleOf(note)}`);
    return 0;
  },
};

/**
 * The ticket is made by `flow new`'s own code, so its number, its push and its
 * refusals are the same. The note goes only once the ticket exists. A ticket
 * belongs to the project it is made in, so a note of another project is refused.
 */
actions.promote = {
  args: '<name>',
  summary: 'make a ticket from one and remove it; only inside the project it belongs to',
  run({ positional, usage }) {
    const root = projectRoot();
    const note = notes.findNote(notes.readNotes(), needsRef(positional, usage));
    const here = nameOf(root);
    if (note.data.project.toLowerCase() !== here.toLowerCase()) {
      const where = note.data.project === notes.GLOBAL ? 'in ~/.flow' : `inside ${note.data.project}`;
      throw new FlowError(`${note.id} belongs to ${note.data.project}, not ${here}: run promote ${where}.`);
    }
    const known = new Set(store.readTickets(root).map((t) => t.id));

    tickets.actions.new.run({
      positional: [notes.firstLine(note)],
      flags: { body: note.body, label: note.data.labels.join(',') },
      usage: 'flow new',
    });

    const made = store.readTickets(root).find((t) => !known.has(t.id));
    notes.remove(note);
    saved();
    out(`\npromoted ${note.id} → ${made ? made.id : 'a new ticket'}`);
    return 0;
  },
};

/** `flow note try X --label board`: the text is every word that is not a flag, so quotes are optional. */
const note = {
  hidden: true,
  args: '<text>...',
  summary: 'add a note at once; the short form of flow notes new',
  flags: { label: { arg: '<label,label>' }, project: { arg: '<name>' } },
  run({ positional, flags, usage }) {
    return add(positional, flags, usage);
  },
};

module.exports = {
  summary: 'ideas and put-off work as small files; flow note <text> adds one at once',
  default: 'ls',
  actions,
  note,
};
