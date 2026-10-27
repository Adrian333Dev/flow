/**
 * `flow init`: set up the project you are in.
 *
 * Each state is checked on its own, in this order:
 *
 *   no git repository         `git init`, never inside an existing one
 *   typed in a subfolder      works at the repository's top folder, and says so
 *   already a Flow project    says so and stops
 *   the Flow home's sync      brings in what another machine sent, so the
 *                             next state sees it
 *   the Flow home holds it    another machine put this project in the Flow
 *                             home: links `.flow/` to that folder, and the
 *                             project is set up
 *   no folder there yet       makes one in the Flow home, links `.flow/` to it
 *                             and writes the template
 *
 * A project counts as set up when its `.flow/settings.json` holds
 * `ticketPrefix`. The template adds a file only where none exists, so an
 * existing `CLAUDE.md` is kept as it is, and an existing `.gitignore` gets
 * Flow's lines added and nothing replaced.
 *
 * The project's ticket prefix is asked once, `exp` for an expense app, with
 * the first letters of the folder offered. `--prefix` answers it. A word another
 * project on this machine holds (shared/registry.ts) is refused, with the next
 * free word named. The project is registered once it is set up.
 *
 * The tickets live in the Flow home: `.flow/` is a link to
 * ~/.flow/projects/<name>/, and features/tickets/records-place.ts holds how. The
 * link is listed in `.git/info/exclude`, git's ignore list for one clone, so
 * `.gitignore` gets no `.flow/` line.
 *
 *   flow init            set this project up
 */

import fs from 'node:fs';
import path from 'node:path';
import { out } from '../shared/cli.ts';
import type { Action } from '../shared/cli.ts';
import * as confirm from '../features/machine/confirm.ts';
import { FlowError } from '../shared/error.ts';
import * as flowRepo from '../features/machine/flow-repo.ts';
import * as records from '../features/tickets/records.ts';
import * as registry from '../shared/registry.ts';
import * as place from '../features/tickets/records-place.ts';
import * as projects from '../shared/project.ts';
import * as settings from '../shared/settings.ts';
import * as store from '../features/tickets/store.ts';
import * as paths from '../shared/paths.ts';

const show = paths.shorten;
import { git } from '../shared/git.ts';

/**
 * The template's last line. Nothing reads which plugin or skill the code
 * uses, so the user is told how to switch one on here. A list of what is off
 * would need a record of what was switched off, since the user switches things
 * off too, and Flow keeps none.
 */
const SWITCH_ON = 'A plugin switched off on this computer is switched on here with: ' +
  'claude plugin enable <id> --scope project';

/** What `.flow/` itself ignores: whatever a prototype installed. */
const RECORDS_IGNORE = [
  '# What a prototype installs or generates, fetched again wherever it runs.',
  'node_modules/',
  '',
].join('\n');

/** Whether a records folder holds a prefix, which is what a set-up project has. */
const isSetUp = (dir) => Boolean(settings.read(path.join(dir, 'settings.json')).ticketPrefix);

/**
 * The word this project's ids start with: `--prefix`, the one asked, or the one
 * offered. A word another project on this machine holds is refused with the
 * next free one, since two projects on one prefix cannot be told apart by id.
 */
function choosePrefix(project, given, home) {
  const offered = store.offerWord(project);
  let word = given;
  if (!word && process.stdout.isTTY && confirm.hasTerminal()) {
    word = confirm.ask(`Ticket prefix, so its tickets read ${offered}-1, ${offered}-2: `, offered);
  }
  word = String(word || offered).trim().toLowerCase();
  const bad = store.badWord(word);
  if (bad) throw new FlowError(bad);
  const holder = registry.holder(word, project, home);
  if (holder) {
    const free = registry.freeWord(word, project, home);
    throw new FlowError(`"${word}" is the prefix of ${show(holder)}, another project on this machine.` +
      (free ? ` Run flow init --prefix ${free}.` : ' Run flow init --prefix <another word>.'));
  }
  return word;
}

/**
 * Puts the project in the machine's registry. A prefix another folder holds
 * leaves it out, and the setup carries on: a line in `done` says so. A registry
 * that cannot be written is a line too, never a failed setup.
 */
function registerProject(project, home, done) {
  try {
    if (registry.register(project, home) !== 'clash') return;
    const prefix = store.prefixOf(project);
    done.push(`not in the machine's project list: ${show(registry.holder(prefix, project, home)!)} holds the prefix "${prefix}". flow doctor names the fix.`);
  } catch (e: any) {
    done.push(`not in the machine's project list: ${e.message.split('\n')[0]}`);
  }
}

/**
 * Bring the Flow home level with the other machines first, so a folder
 * another machine made for this project is found rather than made twice. A
 * failure is a line in the report, and the setup carries on.
 */
function pullHome(at, done) {
  if (!flowRepo.isRepo(at)) return;
  try {
    flowRepo.syncHome(at);
  } catch (e: any) {
    done.push(`the Flow home did not sync first, so a folder another machine made for this project may be missed: ${e.message.split('\n')[0]}`);
  }
}

/**
 * Link `.flow/` to this project's folder in the Flow home: the one another
 * machine made for the same repository, or a new one. Returns the folder.
 */
function linkHome(at, project, done) {
  const records_ = path.join(project, '.flow');
  const now = place.placeOf(project, at.flow);
  if (now && now.dir === records_ && fs.readdirSync(records_).length) {
    throw new FlowError(`${show(records_)} already holds files. Move them out, run flow init, then move them back.`);
  }
  const found = place.findFolder(project, at.flow);
  const dir = found || (now && now.type === 'home' ? now.dir : place.newFolder(project, at.flow));
  if (now && now.dir === records_) fs.rmdirSync(records_);
  place.link(project, dir);
  done.push(isSetUp(dir)
    ? `.flow/: linked to ${show(dir)}, where another machine put this project's tickets`
    : `.flow/: a link to ${show(dir)}, in your Flow home, listed in .git/info/exclude so git never sees it`);
  return dir;
}

/**
 * Copy the project template, every file missing here. `.gitignore` is merged
 * rather than copied, and a file already present is never replaced.
 */
function writeTemplate(clone, project) {
  const template = path.join(clone, 'project-template');
  const wrote: string[] = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const from = path.join(dir, entry.name);
      const rel = path.relative(template, from);
      if (entry.isDirectory()) { walk(from); continue; }
      const to = path.join(project, rel);
      if (rel === '.gitignore') {
        // Group by group, so a comment stays above its lines: a group goes in
        // whole where any of its patterns is missing.
        const had = fs.existsSync(to) ? fs.readFileSync(to, 'utf8') : '';
        const have = new Set(had.split('\n').map((l) => l.trim()));
        const groups = fs.readFileSync(from, 'utf8').trim().split(/\n\s*\n/);
        const missing = groups.filter((g) => g.split('\n').some((l) => l.trim() && !l.startsWith('#') && !have.has(l.trim())));
        if (missing.length) {
          fs.writeFileSync(to, `${had.trimEnd()}${had.trim() ? '\n\n' : ''}${missing.join('\n\n')}\n`);
          wrote.push('.gitignore');
        }
        continue;
      }
      if (fs.existsSync(to)) continue;
      fs.mkdirSync(path.dirname(to), { recursive: true });
      fs.copyFileSync(from, to);
      wrote.push(rel);
    }
  };
  walk(template);
  return wrote;
}

/** The records folder's first files: the prefix, and what it ignores. */
function seedRecords(project, prefix) {
  const dir = path.join(project, '.flow');
  fs.mkdirSync(path.join(dir, 'tickets'), { recursive: true });
  const file = settings.projectFile(project);
  settings.write(file, { ...settings.read(file), ticketPrefix: prefix });
  if (!fs.existsSync(path.join(dir, '.gitignore'))) fs.writeFileSync(path.join(dir, '.gitignore'), RECORDS_IGNORE);
}

function init(at, clone, flags) {
  const here = path.resolve(process.env.FLOW_PROJECT || process.cwd());
  const done: string[] = [];

  let project = projects.top(here);
  if (!project) {
    const made = git(here, ['init', '-q']);
    if (!made.ok) throw new FlowError(`could not run git init in ${show(here)}: ${made.err}`);
    project = here;
    done.push(`git init: ${show(here)} is a git repository now`);
  } else if (path.resolve(project) !== here) {
    done.push(`working at the repository's top folder, ${show(project)}, since ${show(here)} is inside it`);
  }

  const records_ = path.join(project, '.flow');
  if (isSetUp(records_)) {
    out([...done, `${show(project)} is already a Flow project.`].join('\n'));
    return 0;
  }

  pullHome(at, done);
  const home = linkHome(at, project, done);

  // Another machine set the project up: its tickets are linked, and nothing is written.
  if (isSetUp(home)) {
    registerProject(project, at.flow, done);
    out(`${done.join('\n')}\n\nset up: ${show(project)}, with the tickets another machine started.`);
    return 0;
  }

  seedRecords(project, choosePrefix(project, flags.prefix, at.flow));
  place.remember(project, home);
  registerProject(project, at.flow, done);
  for (const rel of writeTemplate(clone, project)) done.push(`wrote: ${rel}`);
  records.syncLater(project, at.flow);
  out(`${done.join('\n')}\n\nset up: ${show(project)}. Nothing in the code is committed: ` +
    'CLAUDE.md, .gitignore and .claude/ wait for your next commit.' +
    '\nIts tickets are private, in your Flow home, and flow sync carries them to your other machines.' +
    `\n${SWITCH_ON}`);
  return 0;
}

const actions: Record<string, Action> = {};

actions.init = {
  section: 'setup',
  json: false,
  summary: 'set up the project you are in',
  flags: {
    root: { arg: '<dir>', hidden: true }, prefix: { arg: '<word>' },
  },
  run({ flags }) {
    return init(paths.folders(flags.root), paths.cloneRoot(), flags);
  },
};

export default actions;
