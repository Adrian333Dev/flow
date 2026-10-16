'use strict';
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
 * the first letters of the folder offered. `--prefix` answers it.
 *
 * The tickets live in the Flow home: `.flow/` is a link to
 * ~/.flow/projects/<name>/, and lib/tickets/records-place.js holds how. The
 * link is listed in `.git/info/exclude`, git's ignore list for one clone, so
 * `.gitignore` gets no `.flow/` line.
 *
 *   flow init            set this project up
 */

const fs = require('fs');
const path = require('path');
const { out } = require('../lib/cli');
const confirm = require('../lib/machine/confirm');
const { FlowError } = require('../lib/error');
const flowRepo = require('../lib/machine/flow-repo');
const records = require('../lib/tickets/records');
const place = require('../lib/tickets/records-place');
const projects = require('../lib/project');
const settings = require('../lib/settings');
const store = require('../lib/tickets/store');
const ticketSkills = require('../lib/tickets/ticket-skills');
const paths = require('../lib/paths');

const show = paths.shorten;
const { git } = require('../lib/git');

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

/** The word this project's ids start with: `--prefix`, the one asked, or the one offered. */
function choosePrefix(project, given) {
  const offered = store.offerWord(project);
  let word = given;
  if (!word && process.stdout.isTTY && confirm.hasTerminal()) {
    word = confirm.ask(`Ticket prefix, so its tickets read ${offered}-1, ${offered}-2: `, offered);
  }
  word = String(word || offered).trim().toLowerCase();
  const bad = store.badWord(word);
  if (bad) throw new FlowError(bad);
  return word;
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
  } catch (e) {
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
  const wrote = [];
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

/**
 * The folder the ticket skills go in, made now because Claude Code sees a skill
 * added mid-session only under a folder that existed when the session started.
 */
const makeSkillsFolder = (project) => fs.mkdirSync(ticketSkills.folderOf(project), { recursive: true });

/** The records folder's first files: the prefix, and what it ignores. */
function seedRecords(project, prefix) {
  const dir = path.join(project, '.flow');
  makeSkillsFolder(project);
  fs.mkdirSync(path.join(dir, 'tickets'), { recursive: true });
  const file = settings.projectFile(project);
  settings.write(file, { ...settings.read(file), ticketPrefix: prefix });
  if (!fs.existsSync(path.join(dir, '.gitignore'))) fs.writeFileSync(path.join(dir, '.gitignore'), RECORDS_IGNORE);
}

function init(at, clone, flags) {
  const here = path.resolve(process.env.FLOW_PROJECT || process.cwd());
  const done = [];

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
    makeSkillsFolder(project);
    out(`${done.join('\n')}\n\nset up: ${show(project)}, with the tickets another machine started.`);
    return 0;
  }

  seedRecords(project, choosePrefix(project, flags.prefix));
  place.remember(project, home);
  for (const rel of writeTemplate(clone, project)) done.push(`wrote: ${rel}`);
  records.syncLater(project, at.flow);
  out(`${done.join('\n')}\n\nset up: ${show(project)}. Nothing in the code is committed: ` +
    'CLAUDE.md, .gitignore and .claude/ wait for your next commit.' +
    '\nIts tickets are private, in your Flow home, and flow sync carries them to your other machines.' +
    `\n${SWITCH_ON}`);
  return 0;
}

const actions = {};

actions.init = {
  section: 'setup',
  summary: 'set up the project you are in',
  flags: {
    root: { arg: '<dir>', hidden: true }, prefix: { arg: '<word>' },
  },
  run({ flags }) {
    return init(paths.folders(flags.root), paths.cloneRoot(), flags);
  },
};

module.exports = actions;
