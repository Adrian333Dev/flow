'use strict';
/**
 * Migrations: a change to where Flow and the harnesses keep their files,
 * written by /flow:setup-machine, /flow:setup-project or /flow:migrate.
 *
 *   ~/.flow/migrations/<machine or project>/<date-time>/
 *   ├─ migration.md   one line per change: write, delete, move or run
 *   └─ files/         the new version of each file it writes, at files/<full path>
 *
 * The folder sits beside the project's original, named the same way:
 * `lib/originals.js` says how. Its name is the time the agent wrote it, and
 * the script reads that time back to find files changed since.
 *
 * The agent reads and decides, and never writes a real path itself. The user
 * says yes, then the skill runs `~/.flow/scripts/apply-migration.js <id>`,
 * the only thing that touches a real path. During the first setup of a machine
 * or a project it records each path in that place's original first, and after
 * that window closes it changes paths and records nothing. No path the
 * migration leaves out changes at all, which is why migration.md is the list
 * rather than a second list the agent could get wrong.
 *
 * The action lines. Everything else in the file is prose for the user:
 *
 *   - write <path>: <why>                    files/<path> replaces it, file or folder
 *   - delete <path>: <why>
 *   - move <path> -> <path>: <why>
 *   - run <command>: writes <path>, <path>   or `writes nothing`
 *
 * `~` is the home folder, or the folder `--root` names. A relative path sits
 * inside the project the frontmatter names.
 */

const fs = require('fs');
const path = require('path');
const { FlowError } = require('./error');
const frontmatter = require('./frontmatter');
const originals = require('./originals');

const TYPES = ['setup-machine', 'setup-project', 'migrate'];
const VERBS = ['write', 'delete', 'move', 'run'];

const home = (at) => path.join(at.flow, 'migrations');

const folder = (at, id) => originals.inside(home(at), id, 'migration');

function resolvePath(raw, { base, project }) {
  const text = raw.trim().replace(/^`(.*)`$/, '$1');
  if (!text) throw new FlowError('a migration line names no path.');
  if (text === '~' || text.startsWith('~/')) return path.resolve(base, '.' + text.slice(1));
  if (path.isAbsolute(text)) return path.resolve(text);
  if (!project) throw new FlowError(`"${text}" is relative, and the migration names no project.`);
  return path.resolve(project, text);
}

/**
 * One action line, split into what it does and to which paths. The reason
 * after the colon is for the user and is never read.
 */
function parseLine(line, ctx) {
  const [, verb, rest] = line.match(/^- (\w+) (.+)$/);
  const at = (raw) => resolvePath(raw, ctx);
  const beforeReason = (s) => (s.includes(': ') ? s.slice(0, s.indexOf(': ')) : s);

  if (verb === 'write' || verb === 'delete') return { line, verb, path: at(beforeReason(rest)) };
  if (verb === 'move') {
    const [from, to] = beforeReason(rest).split(' -> ');
    if (!to) throw new FlowError(`"${line}" needs the form: move <path> -> <path>.`);
    return { line, verb, from: at(from), to: at(to) };
  }
  const cut = rest.lastIndexOf(': writes ');
  if (cut === -1) {
    throw new FlowError(`"${line}" must name what the command writes: run <command>: writes <path>, or writes nothing.`);
  }
  const named = rest.slice(cut + ': writes '.length).trim();
  const paths = named === 'nothing' ? [] : named.split(', ').map(at);
  return { line, verb, command: rest.slice(0, cut), paths };
}

/** Every path one action changes, in the order it changes them. */
const touched = (a) => (a.verb === 'move' ? [a.from, a.to] : a.verb === 'run' ? a.paths : [a.path]);

/**
 * migration.md, read into its frontmatter and its action lines, with the time
 * the folder is named for. Every line is checked before anything runs, so a
 * migration with one bad line changes nothing.
 */
function read(dir, at) {
  const file = path.join(dir, 'migration.md');
  if (!fs.existsSync(file)) throw new FlowError(`${file} does not exist: the agent writes the migration first.`);
  const written = originals.timeOf(path.basename(dir));
  if (!written) {
    throw new FlowError(`a migration's folder is named for the time it was written, such as 2026-09-20T10-12-40, and ${path.basename(dir)} is not one.`);
  }
  const { data, body } = frontmatter.parse(fs.readFileSync(file, 'utf8'));

  if (!TYPES.includes(data.type)) {
    throw new FlowError(`migration.md needs a type in its frontmatter, one of: ${TYPES.join(', ')}.`);
  }
  const ctx = { base: at.base, project: data.project ? resolvePath(String(data.project), { base: at.base }) : null };

  const lines = body.split('\n').filter((l) => VERBS.some((v) => l.startsWith(`- ${v} `)));
  if (!lines.length) throw new FlowError('migration.md has no action lines, so there is nothing to apply.');

  const actions = lines.map((l) => parseLine(l, ctx));
  for (const p of actions.flatMap(touched)) guard(p, at);
  return { type: data.type, project: ctx.project, written, actions };
}

/** No migration may touch the migrations or the originals, or anything holding them. */
function guard(p, at) {
  for (const kept of [home(at), originals.home(at)]) {
    if (p === kept || p.startsWith(kept + path.sep) || kept.startsWith(p + path.sep)) {
      throw new FlowError(`${p} holds ${path.basename(kept)}, and a migration may not touch it.`);
    }
  }
}

/**
 * Every file a write or delete line names that changed after the migration
 * was written, read off each file's time. A folder counts every file inside
 * it. The folder name keeps whole seconds, so a change inside that second
 * passes.
 *
 * run and move lines are left out: a command acts on the file as it finds it,
 * and a move takes whatever is there with it. So are links, which hold no
 * content a new version was built from. `done` holds the paths a run carrying
 * on already changed itself.
 */
function changedSince(migration, actions, done = []) {
  const after = migration.written.getTime() + 1000;
  const ours = (p) => done.some((d) => p === d || p.startsWith(d + path.sep));
  const changed = new Set();
  const walk = (p) => {
    if (ours(p)) return;
    const stat = originals.lstat(p);
    if (!stat || stat.isSymbolicLink()) return;
    if (stat.isDirectory()) for (const name of fs.readdirSync(p).sort()) walk(path.join(p, name));
    else if (stat.mtimeMs >= after) changed.add(p);
  };
  for (const a of actions) if (a.verb === 'write' || a.verb === 'delete') walk(a.path);
  return [...changed];
}

module.exports = { TYPES, home, folder, read, touched, changedSince };
