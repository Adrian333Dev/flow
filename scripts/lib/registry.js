'use strict';
/**
 * The projects this machine knows: `registry.json` in the Flow home, one line
 * per project, `prefix → absolute folder`. A project's path differs between
 * machines and its prefix may name a client, so the file is on the sync's
 * ignore list (lib/machine/flow-repo.js) and never leaves this machine.
 *
 * A ticket-writing command registers the project it runs in (`register`); a
 * read never does, so scratch folders, worktrees and temporary clones stay
 * out. Registering asks nothing, because an agent runs these commands. A
 * prefix another existing folder holds is a clash: the first project keeps it
 * and the later one stays unregistered, which `flow doctor` names.
 *
 * Every function takes the Flow home last, for `flow init --root` and the
 * tests; it defaults to the machine's own.
 */

const fs = require('fs');
const path = require('path');
const paths = require('./paths');
const store = require('./tickets/store');

const file = (home = paths.flowHome()) => path.join(home, 'registry.json');

const real = (p) => {
  try {
    return fs.realpathSync(p);
  } catch {
    return path.resolve(p);
  }
};

/** The same folder, reached through a link or not. */
const same = (a, b) => real(a) === real(b);

/** `prefix → folder`, empty where the file is missing or does not parse. */
function read(home) {
  try {
    const found = JSON.parse(fs.readFileSync(file(home), 'utf8'));
    if (!found || typeof found !== 'object' || Array.isArray(found)) return {};
    return Object.fromEntries(Object.entries(found).filter(([, folder]) => typeof folder === 'string'));
  } catch {
    return {};
  }
}

/** Replaces the file whole, keys sorted. A rename, so a run beside it never reads half a file. */
function write(map, home) {
  const target = file(home);
  const sorted = Object.fromEntries(Object.entries(map).sort(([a], [b]) => a.localeCompare(b)));
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const temp = `${target}.${process.pid}`;
  fs.writeFileSync(temp, JSON.stringify(sorted, null, 2) + '\n');
  fs.renameSync(temp, target);
}

/**
 * Every place `flow` can reach: the `home` place first, then each registered
 * project as `{ prefix, folder, exists }`. The board and the commands that
 * list across projects start from here.
 */
function projects(home = paths.flowHome()) {
  const listed = Object.entries(read(home)).map(([prefix, folder]) => ({ prefix, folder, exists: fs.existsSync(folder) }));
  return [{ prefix: store.HOME_WORD, folder: path.resolve(home), exists: true }, ...listed.sort((a, b) => a.prefix.localeCompare(b.prefix))];
}

/**
 * The folder that keeps `prefix` against `folder`, or null. A registered path
 * that no longer exists holds nothing: its project moved.
 */
function holder(prefix, folder, home) {
  const held = read(home)[prefix];
  return held && fs.existsSync(held) && !same(held, folder) ? held : null;
}

/** The prefix `folder` is registered under, or null. */
function registeredAs(folder, home) {
  const found = Object.entries(read(home)).find(([, held]) => same(held, folder));
  return found ? found[0] : null;
}

/**
 * Registers `project` under its ticket prefix. Returns `added`, `moved` (the
 * prefix was registered at a path that is gone), `same`, `clash` (an existing
 * folder keeps the prefix) or `skipped` (the home place, or no `.flow/`).
 * A folder registered under an older prefix loses that line.
 */
function register(project, home = paths.flowHome()) {
  if (same(project, home) || store.isHome(project) || !fs.existsSync(path.join(project, '.flow'))) return 'skipped';
  const prefix = store.prefixOf(project);
  const map = read(home);
  const held = map[prefix];
  if (held && same(held, project)) return 'same';
  if (held && fs.existsSync(held)) return 'clash';
  for (const [word, folder] of Object.entries(map)) if (word !== prefix && same(folder, project)) delete map[word];
  map[prefix] = path.resolve(project);
  write(map, home);
  return held ? 'moved' : 'added';
}

/**
 * The next word `folder` can take instead of `word`: a longer cut of its
 * name, then `word` and a letter. Null where none is free.
 */
function freeWord(word, folder, home) {
  const letters = path.basename(path.resolve(folder)).toLowerCase().replace(/[^a-z]/g, '');
  const longer = letters.startsWith(word)
    ? Array.from({ length: Math.max(0, Math.min(8, letters.length) - word.length) }, (_, i) => letters.slice(0, word.length + i + 1))
    : [];
  const lettered = [...'abcdefghijklmnopqrstuvwxyz'].map((c) => word.slice(0, 7) + c);
  return [...longer, ...lettered].find((w) => !store.badWord(w) && !holder(w, folder, home)) || null;
}

module.exports = { file, read, write, projects, holder, registeredAs, register, freeWord };
