/**
 * Where a ticket command finds its tickets: the project it runs in, a project
 * named by its prefix, or home (~/.flow). Also the record of which projects a
 * command read or wrote, which `commands/tickets.ts` syncs and registers after a
 * write.
 */

import fs from 'node:fs';
import path from 'node:path';
import { FlowError } from '../../shared/error.ts';
import { out } from '../../shared/cli.ts';
import { projectRootOrNull } from '../../shared/project.ts';
import * as registry from '../../shared/registry.ts';
import * as paths from '../../shared/paths.ts';
import * as store from './store.ts';

// True while a write runs (set around it by commands/tickets.ts): a write
// outside a project refuses, where a read shows the home place.
let writing = false;

const setWriting = (on: boolean) => {
  writing = on;
};

// The projects a command read or wrote. After a write their ticket skills are
// synced and they are registered.
const touched = new Set<string>();

/** The flag `new`, the list, `next` and `flow notes new` take to name a project by its prefix. */
const PROJECT_FLAG = { arg: '<prefix>' };

/** The refusal for a write that has no project to go to. */
const outside = () => new FlowError(
  'not inside a Flow project, so this has nowhere to write.\n' +
  '  Run flow init here to make this folder a project, or use --project home to write to ~/.flow.'
);

const rel = (root: string, p: string) => path.relative(root, p) || p;

/** The header over a project's tickets in a listing: its prefix, then its folder. */
function placeLine(root: string) {
  return `${store.prefixOf(root)}  ${paths.shorten(root)}`;
}

/** The home place: the tickets in ~/.flow/, which belong to no project. */
function loadHome() {
  const root = store.homeRoot();
  return { root, tickets: store.readTickets(root) };
}

/**
 * The tickets of the project this runs in. Outside one, a read shows the home
 * place under its header line, and a write refuses. `here` is passed by a
 * caller that has already looked; null means it looked and found none.
 */
function load(here = projectRootOrNull()) {
  if (here) {
    touched.add(here);
    return { root: here, tickets: store.readTickets(here) };
  }
  if (writing) throw outside();
  out(placeLine(store.homeRoot()));
  return loadHome();
}

/** The root `--project` names, else the project this runs in; null where there is neither. */
function rootFor(flags: Record<string, any>) {
  return flags.project === undefined ? projectRootOrNull() : projectNamed(flags.project, '--project');
}

/** The project a write goes to: the one `--project` names, else the one it runs in, or a refusal. */
function needProject(flags: Record<string, any> = {}) {
  const root = rootFor(flags);
  if (!root) throw outside();
  touched.add(root);
  return root;
}

/**
 * The tickets `ls` and `next` list: the project `--project` names, else the
 * one this runs in, else home. The project's header line prints first, so
 * every listing has one shape.
 */
function loadFor(flags: Record<string, any> = {}) {
  const root = rootFor(flags);
  if (!root) return load(null);
  touched.add(root);
  out(placeLine(root));
  return { root, tickets: store.readTickets(root) };
}

/**
 * The tickets of every project this machine knows and of home, joined into
 * one list, plus the project this runs in before it has registered. `places`
 * holds each project's own tickets, the project you stand in first and home
 * last. A registered path that is gone is skipped, and `flow doctor` names it.
 */
function loadAll() {
  const here = projectRootOrNull();
  const folders = registry.projects()
    .filter((p) => p.exists && (p.prefix === store.HOME_WORD || fs.existsSync(path.join(p.folder, '.flow'))))
    .map((p) => p.folder);
  if (here && !store.isHome(here) && !registry.registeredAs(here)) folders.push(here);
  const places = folders.map((root) => ({ root, tickets: store.readTickets(root) }));
  const rank = ({ root }) => (store.isHome(root) ? 2 : here && store.prefixOf(root) === store.prefixOf(here) ? 0 : 1);
  places.sort((a, b) => rank(a) - rank(b));
  const tickets = Object.assign(places.flatMap((place) => place.tickets), { prefix: here ? store.prefixOf(here) : store.HOME_WORD });
  return { root: here || store.homeRoot(), tickets, places };
}

/**
 * The folder of the project registered under `word`, or a refusal saying what
 * to do. The registry is this machine's list (shared/registry.ts), filled by a
 * project's first ticket write.
 */
function registered(word: string) {
  const folder = registry.read()[word];
  if (!folder) {
    throw new FlowError(
      `no project on this machine has the prefix "${word}".\n` +
      '  A project is registered by its first ticket write: run a command that writes one (flow tickets new, flow tickets start) inside it, once.\n' +
      '  flow doctor lists the projects this machine knows.'
    );
  }
  if (!fs.existsSync(path.join(folder, '.flow'))) {
    throw new FlowError(
      `"${word}" is registered at ${folder}, which holds no .flow/ now.\n` +
      '  If the project moved, a command that writes a ticket inside it updates the path. flow doctor names it.'
    );
  }
  const now = store.prefixOf(folder);
  if (now !== word) {
    throw new FlowError(`"${word}" is registered at ${folder}, whose ticketPrefix is now "${now}". flow doctor names it.`);
  }
  return folder;
}

/**
 * The root a project word names: `home`, the prefix of the project this runs
 * in, or any registered prefix. `by` is what took the word, for the refusal.
 * A folder is refused with the prefix to type instead, since the registry
 * knows every project by its prefix alone; `global` is refused naming `home`.
 */
function projectNamed(value: unknown, by: string) {
  const given = String(value).trim();
  const word = given.toLowerCase();
  if (word === 'global') throw new FlowError('"global" is now named "home": use home for ~/.flow.');
  if (word === store.HOME_WORD) return store.homeRoot();
  const here = projectRootOrNull();
  if (here && store.prefixOf(here) === word) return here;
  const known = registry.read();
  if (store.badWord(word) || (!known[word] && fs.existsSync(path.resolve(given)))) {
    const folder = path.resolve(given);
    const prefix = Object.keys(known).find((p) => known[p] === folder || path.basename(known[p]).toLowerCase() === word);
    throw new FlowError(
      `${given} is not a project prefix. ${by} takes the prefix of a project, such as fw or home, never its folder.\n` +
      (prefix ? `  The project in ${known[prefix]} has the prefix ${prefix}.\n` : '') +
      '  flow doctor lists the prefixes on this machine.'
    );
  }
  return registered(word);
}

/**
 * The place an id points at: `home-4` is read from ~/.flow/ wherever this
 * runs, and a word that is the prefix of the project this runs in, or no word
 * at all, from that project. Any other word is a project's prefix, looked up
 * in the registry: the folder you stand in wins, and the rest is reachable
 * from anywhere.
 */
function placeOf(word: string | null) {
  if (word === store.HOME_WORD) return loadHome();
  const here = projectRootOrNull();
  if (!word || (here && word === store.prefixOf(here))) return load(here);
  const root = registered(word);
  touched.add(root);
  return { root, tickets: store.readTickets(root) };
}

/**
 * The place a ticket lives, its tickets, and the ticket. An id missing from a
 * project may belong to a ticket `flow tickets move` took home, which kept it as `was:`.
 */
function locate(ref: string) {
  const place = placeOf(store.wordOf(String(ref || '').trim().toLowerCase()));
  try {
    return { ...place, t: store.findTicket(place.tickets, ref) };
  } catch (e: any) {
    if (store.isHome(place.root)) throw e;
    const id = store.normalizeId(ref, place.tickets.prefix);
    const home = id && fs.existsSync(store.ticketsDir(store.homeRoot())) ? loadHome() : null;
    const moved = home && home.tickets.find((t) => t.data.was === id);
    if (moved) return { ...home, t: moved };
    throw e;
  }
}

export { touched, setWriting, PROJECT_FLAG, outside, rel, placeLine, load, loadHome, loadFor, loadAll, needProject, projectNamed, locate };
