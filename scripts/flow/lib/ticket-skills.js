'use strict';
/**
 * One user-only skill per open ticket, so typing `/exp` lists the tickets with
 * their title and status, the way the `/` list shows any skill.
 *
 *   <project>/.claude/skills/exp-47/SKILL.md    a project's ticket
 *   ~/.claude/skills/home-4/SKILL.md            a ticket in ~/.flow/
 *
 * A skill holds a label only. Its body runs `flow get <id> --files` when typed,
 * so the ticket is read at that moment, and a stale skill shows an old row but
 * never old data. `disable-model-invocation` keeps every name out of context.
 * Each folder carries a `.gitignore` holding `*`, so git ignores it without an
 * edit to the project's own.
 *
 * `sync` runs after every `flow` command that writes a ticket, and when a
 * session opens. It touches only folders carrying MARK, so a skill the user
 * named `exp-47` is left alone. Claude Code sees a skill added, changed or
 * removed without a restart, but only under a skills folder that existed when
 * the session started, which is why `flow init` makes the project's.
 */

const fs = require('fs');
const path = require('path');
const graph = require('./graph');
const skills = require('./skills');
const store = require('./store');

// Parked is left out as set aside, and done and dropped as closed.
const LISTED = new Set(['todo', 'groundwork', 'planning', 'building', 'review']);

const MARK = '<!-- flow: ticket ';

// The only files `sync` writes, so the only ones it deletes.
const OWN = ['SKILL.md', '.gitignore'];

/** A project's folder of skills, the one `flow init` makes. */
const folderOf = (project) => path.join(project, '.claude', 'skills');

/** The row the `/` list shows: `Ticket, building: Daemon detection`. */
function describe(t, index) {
  const blocked = graph.unmetDeps(t, index).length ? ', blocked' : '';
  return `Ticket, ${t.data.status}${blocked}: ${t.data.title}`;
}

function render(t, index) {
  return [
    '---',
    `name: ${t.id}`,
    // A JSON string is a valid YAML one, quotes in the title included.
    `description: ${JSON.stringify(describe(t, index))}`,
    'disable-model-invocation: true',
    '---',
    `${MARK}${t.id}, rewritten by flow on every ticket change -->`,
    `!\`flow get ${t.id} --files 2>&1 || true\``,
    '',
  ].join('\n');
}

function read(file) {
  try {
    return fs.readFileSync(file, 'utf8');
  } catch {
    return null;
  }
}

const marked = (folder) => (read(path.join(folder, 'SKILL.md')) || '').includes(MARK);

/** Delete a marked folder, unless it holds a file `sync` never wrote. */
function remove(folder) {
  if (fs.readdirSync(folder).some((name) => !OWN.includes(name))) return false;
  fs.rmSync(folder, { recursive: true, force: true });
  return true;
}

/** Make one folder of skills match one place's tickets. */
function syncPlace(tickets, dir) {
  const done = { written: [], removed: [] };
  const index = graph.indexById(tickets);
  const wanted = new Map(tickets.filter((t) => LISTED.has(t.data.status)).map((t) => [t.id, render(t, index)]));
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
function sync({ project, claude = skills.configDir() } = {}) {
  const places = [[store.homeRoot(), path.join(claude, 'skills')]];
  if (project && !store.isHome(project)) places.push([project, folderOf(project)]);
  let changed = false;
  for (const [root, dir] of places) {
    const done = syncPlace(store.readTickets(root), dir);
    if (done.written.length || done.removed.length) changed = true;
  }
  return changed;
}

/** Every marked folder in these folders of skills, so a prompt can list them before they go. */
function findAll(dirs) {
  const found = [];
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) continue;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const folder = path.join(dir, entry.name);
      if (entry.isDirectory() && marked(folder)) found.push(folder);
    }
  }
  return found;
}

/** Delete every marked folder in these folders of skills: `flow uninstall`'s step, and `flow restore`'s. */
const removeAll = (dirs) => findAll(dirs).filter(remove);

/**
 * Clear one place's ticket skills: every marked folder, then a project's
 * `.claude/skills/` and `.claude/` where that left them empty. `flow init`
 * makes both before the project's original is written, so no original holds
 * them, and an empty folder holds nothing to lose. Returns each path deleted.
 */
function clear(dir, project = null) {
  const gone = removeAll([dir]);
  if (!project) return gone;
  for (const empty of [dir, path.join(project, '.claude')]) {
    try {
      fs.rmdirSync(empty);
      gone.push(empty);
    } catch {
      // Not empty, or not there: either way it stays.
    }
  }
  return gone;
}

module.exports = { sync, findAll, removeAll, clear, folderOf, isTicketSkill: marked };
