/**
 * One user-only skill per ticket not yet `done` or `dropped`, so typing `/exp`
 * lists the tickets with their title and status, the way the `/` list shows
 * any skill. A note gets none: it is found by `#` in the prompt box.
 *
 *   <project>/.claude/skills/exp-47/SKILL.md    a project's ticket
 *   ~/.claude/skills/home-4/SKILL.md            a ticket in ~/.flow/
 *
 * A skill holds a label and one rule. Its body runs `flow <id>` when typed, so
 * the ticket is read at that moment, and a stale skill shows an old row but
 * never old data. The rule is what a session needs when the index, its
 * sections and the files disagree. `disable-model-invocation` keeps every name out of context.
 * Each folder carries a `.gitignore` holding `*`, so git ignores it without an
 * edit to the project's own.
 *
 * `sync` runs after every `flow` command that writes a ticket, and when a
 * session opens. It touches only folders carrying MARK, so a skill the user
 * named `exp-47` is left alone. Claude Code sees a skill added, changed or
 * removed without a restart, but only under a skills folder that existed when
 * the session started, which is why `flow init` makes the project's.
 */

import fs from 'node:fs';
import path from 'node:path';
import * as graph from './graph.ts';
import * as store from './store.ts';
import * as statuses from './statuses.ts';
import * as paths from '../../shared/paths.ts';
import type { Ticket } from './types.ts';

// Every open ticket, parked ones included: a parked ticket is found by typing
// its words, which is how it is browsed. Done and dropped are closed.
const listed = (t: Ticket) => !statuses.TERMINAL.has(t.data.status);

const MARK = '<!-- flow: ticket ';

// The only files `sync` writes, so the only ones it deletes.
const OWN = ['SKILL.md', '.gitignore'];

/** A project's folder of skills, the one `flow init` makes. */
const folderOf = (project: string) => path.join(project, '.claude', 'skills');

/** The row the `/` list shows: `Ticket, in-progress: Find the daemon`, the title where there is no description. */
function describe(t: Ticket, index: Map<string, Ticket>) {
  const blocked = graph.unmetDeps(t, index).length ? ', blocked' : '';
  return `Ticket, ${t.data.status}${blocked}: ${t.data.description || t.data.title}`;
}

function render(t: Ticket, index: Map<string, Ticket>) {
  return [
    '---',
    `name: ${t.id}`,
    // A JSON string is a valid YAML one, quotes in the title included.
    `description: ${JSON.stringify(describe(t, index))}`,
    'disable-model-invocation: true',
    '---',
    `${MARK}${t.id}, rewritten by flow on every ticket change -->`,
    `!\`flow tickets get ${t.id} 2>&1 || true\``,
    '',
    'On what exists, the files win. On decisions and what is still open, `ticket.md` wins over `context.md`.',
    '',
  ].join('\n');
}

function read(file: string) {
  try {
    return fs.readFileSync(file, 'utf8');
  } catch {
    return null;
  }
}

const marked = (folder: string) => (read(path.join(folder, 'SKILL.md')) || '').includes(MARK);

/** Delete a marked folder, unless it holds a file `sync` never wrote. */
function remove(folder: string) {
  if (fs.readdirSync(folder).some((name) => !OWN.includes(name))) return false;
  fs.rmSync(folder, { recursive: true, force: true });
  return true;
}

/** Make one folder of skills match one place's tickets. */
function syncPlace(tickets: Ticket[], dir: string) {
  const done: { written: string[]; removed: string[] } = { written: [], removed: [] };
  const index = graph.indexById(tickets);
  const wanted = new Map(tickets.filter(listed).map((t) => [t.id, render(t, index)]));
  if (!wanted.size && !fs.existsSync(dir)) return done;
  fs.mkdirSync(dir, { recursive: true });

  for (const [id, text] of wanted) {
    const folder = path.join(dir, id);
    if (fs.existsSync(folder) && !marked(folder)) continue;
    if (read(path.join(folder, 'SKILL.md')) === text) continue;
    fs.mkdirSync(folder, { recursive: true });
    fs.writeFileSync(path.join(folder, 'SKILL.md'), text);
    fs.writeFileSync(path.join(folder, '.gitignore'), '*\n');
    done.written.push(id);
  }

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory() || wanted.has(entry.name)) continue;
    const folder = path.join(dir, entry.name);
    if (marked(folder) && remove(folder)) done.removed.push(entry.name);
  }
  return done;
}

/**
 * Make the ticket skills match the tickets: the project's where `project` is
 * one, and always the ones in ~/.flow/. Returns whether a skill changed.
 */
function sync({ project, claude = paths.claudeHome() }: { project?: string | null; claude?: string } = {}) {
  const places: [string, string][] = [[store.homeRoot(), path.join(claude, 'skills')]];
  if (project && !store.isHome(project)) places.push([project, folderOf(project)]);
  let changed = false;
  for (const [root, dir] of places) {
    const done = syncPlace(store.readTickets(root), dir);
    if (done.written.length || done.removed.length) changed = true;
  }
  return changed;
}

export { sync, folderOf, marked as isTicketSkill };
