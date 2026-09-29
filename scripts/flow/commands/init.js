'use strict';
/**
 * `flow init`: set up the project you are in.
 *
 * What it checks is whether anything competes with Flow's rules, never
 * whether the folder is empty. Code, a README and a package.json change
 * nothing. Each state is checked on its own, in this order:
 *
 *   no git repository         `git init`, never inside an existing one
 *   typed in a subfolder      works at the repository's top folder, and says so
 *   a run stopped part way    carries it on
 *   already a Flow project    says so and stops, or folds in this machine's old
 *                             Claude Code memory where there is some
 *   a teammate set it up      the `flow` branch is on the remote: checks it
 *                             out, and the project is set up
 *   no `flow` branch          makes one, checked out at `.flow/`
 *   no competing files        writes the template at once, with no session
 *   competing files           opens the setup session, for those files only
 *   an existing .gitignore    Flow's lines are added, and nothing is replaced
 *
 * The project's ticket prefix is asked once, `exp` for an expense app, with
 * the first letters of the folder offered. `--prefix` answers it.
 *
 * `--local` is for a repository other people keep, such as a client's or a
 * team's that never adopted Flow, for as long as the user works on it. `.flow/`
 * is a plain folder listed in `.git/info/exclude`, git's ignore list for one
 * clone, which is never committed. Nothing else in the repository is touched:
 * no rule file, no `.gitignore` line, no session. The tickets are the user's
 * alone, and never leave the clone.
 *
 *   flow init            set this project up
 *   flow init check      exit 0 where it can be; the setup session's first step
 *   flow init finish     stamp .flow/version; the setup session's last step
 */

const fs = require('fs');
const path = require('path');
const { out } = require('../lib/cli');
const { cloneRoot } = require('../lib/clone');
const confirm = require('../lib/confirm');
const { FlowError } = require('../lib/error');
const flowRepo = require('../lib/flow-repo');
const machine = require('../lib/machine');
const records = require('../lib/records');
const settings = require('../lib/settings');
const store = require('../lib/store');
const version = require('../lib/version');
const setup = require('./setup');

const show = machine.shorten;
const git = flowRepo.git;

/**
 * What competes with Flow's rules: a file that tells Claude Code or another
 * agent how to work here. Each is read by the setup session and sorted into
 * Flow's places before anything is replaced.
 */
const COMPETING = [
  'CLAUDE.md', 'AGENTS.md', 'CLAUDE.local.md', 'GEMINI.md', '.mcp.json',
  '.claude/settings.json', '.claude/settings.local.json',
  '.claude/skills', '.claude/rules', '.claude/agents', '.claude/commands',
  '.cursorrules', '.cursor/rules', '.windsurfrules', '.github/copilot-instructions.md',
];

/** The lines Flow adds to the project's `.gitignore`. */
const IGNORE_LINES = [
  '',
  '# Flow: .flow/ holds the tickets, checked out from the branch "flow", which',
  '# shares no history with the code. Every branch sees the same tickets, and',
  '# none of them is ever merged in.',
  '.flow/',
];

/** What `.flow/` itself ignores on the `flow` branch: whatever a prototype installed. */
const RECORDS_IGNORE = [
  '# What a prototype installs or generates, fetched again wherever it runs.',
  'node_modules/',
  '',
].join('\n');

/** The paths competing with Flow's rules in this project, as found. */
function competing(at, project) {
  const found = COMPETING.filter((rel) => fs.existsSync(path.join(project, rel)));
  if (setup.holdsFiles(setup.memoryDir(at, project))) found.push('Claude Code\'s memory for this folder');
  return found;
}

/** The top folder of the repository around `from`, or null outside one. */
function topOf(from) {
  const found = git(from, ['rev-parse', '--show-toplevel']);
  return found.ok ? found.out : null;
}

/** The word this project's ids start with: `--prefix`, the one asked, or the one offered. */
function choosePrefix(project, given) {
  const offered = store.offerWord(project);
  let word = given;
  if (!word && process.stdout.isTTY && confirm.hasTerminal()) {
    word = confirm.ask(`Ticket prefix, so its tickets read ${offered}-1, ${offered}-2 (default: ${offered}): `, offered);
  }
  word = String(word || offered).trim().toLowerCase();
  const bad = store.badWord(word);
  if (bad) throw new FlowError(bad);
  return word;
}

/** Add Flow's lines to `.gitignore`, keeping every line already there. */
function addIgnore(project) {
  const file = path.join(project, '.gitignore');
  const had = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  const lines = new Set(had.split('\n').map((l) => l.trim()));
  if (lines.has('.flow/') || lines.has('.flow')) return false;
  fs.writeFileSync(file, `${had}${had && !had.endsWith('\n') ? '\n' : ''}${IGNORE_LINES.join('\n').replace(/^\n/, had ? '\n' : '')}\n`);
  return true;
}

/** List `.flow/` in `.git/info/exclude`, the ignore list of this one clone. */
function excludeLocally(project) {
  const common = git(project, ['rev-parse', '--git-common-dir']).out || '.git';
  const file = path.resolve(project, common, 'info', 'exclude');
  const had = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  if (had.split('\n').some((l) => l.trim() === '.flow/')) return;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${had}${had && !had.endsWith('\n') ? '\n' : ''}# Flow, local here: this clone's own tickets\n.flow/\n`);
}

/**
 * Copy the project template, every file missing here. `.gitignore` is merged
 * rather than copied, and a file already present is never replaced: where one
 * is, the setup session runs instead of this.
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

/** Stamp the project's `.flow/version` with the newest changelog entry. */
function stamp(clone, project) {
  const newest = version.newest(clone);
  if (newest === null) throw new FlowError('CHANGELOG.md holds no entry, so there is no version to stamp.');
  const file = path.join(project, '.flow', 'version');
  fs.writeFileSync(file, `${newest}\n`);
  return newest;
}

/** The records folder's first files: the prefix, and what the branch ignores. */
function seedRecords(project, prefix) {
  const dir = path.join(project, '.flow');
  fs.mkdirSync(path.join(dir, 'tickets'), { recursive: true });
  const file = settings.projectFile(project);
  settings.write(file, { ...settings.read(file), ticketPrefix: prefix });
  if (!fs.existsSync(path.join(dir, '.gitignore'))) fs.writeFileSync(path.join(dir, '.gitignore'), RECORDS_IGNORE);
}

function init(at, clone, flags) {
  const here = path.resolve(process.env.FLOW_PROJECT || process.cwd());
  const done = [];

  let project = topOf(here);
  if (!project) {
    if (flags.local) throw new FlowError('--local hides .flow/ from a git repository, and this folder is not one. Run flow init without it.');
    const made = git(here, ['init', '-q']);
    if (!made.ok) throw new FlowError(`could not run git init in ${show(here)}: ${made.err}`);
    project = here;
    done.push(`git init: ${show(here)} is a git repository now`);
  } else if (path.resolve(project) !== here) {
    done.push(`working at the repository's top folder, ${show(project)}, since ${show(here)} is inside it`);
  }

  const run = setup.readRun(at);
  if (run && run.type === 'setup-project' && run.project === project) {
    out(done.join('\n'));
    return setup.startProject(at, clone, flags.root);
  }
  if (run) {
    throw new FlowError(`${show(setup.runFile(at))} says a ${run.type} run stopped part way. Finish that first.`);
  }

  const records_ = path.join(project, '.flow');
  if (fs.existsSync(path.join(records_, 'version'))) {
    if (done.length) out(done.join('\n'));
    return setup.startProject(at, clone, flags.root);
  }

  if (flags.local) {
    fs.mkdirSync(records_, { recursive: true });
    excludeLocally(project);
    seedRecords(project, choosePrefix(project, flags.prefix));
    const newest = stamp(clone, project);
    done.push('.flow/ made, and listed in .git/info/exclude, so git never sees it');
    out(`${done.join('\n')}\n\nset up locally: ${show(project)} is on entry ${newest}. Its tickets are yours alone and never leave this clone.`);
    return 0;
  }

  // The branch before any file lands in `.flow/`: git checks out only into
  // a missing or empty folder.
  if (!records.onBranch(project)) {
    if (fs.existsSync(records_) && fs.readdirSync(records_).length) {
      throw new FlowError(`${show(records_)} already holds files, and is not a checkout of the flow branch. ` +
        'Move them out, run flow init, then move them back.');
    }
    fs.rmSync(records_, { recursive: true, force: true });
    const checked = records.checkOut(project);
    if (!checked.ok) throw new FlowError(`could not check out the flow branch at .flow/: ${checked.why}`);
    done.push(checked.joined
      ? '.flow/: the flow branch someone already made, checked out'
      : '.flow/: a new flow branch, sharing no history with the code, checked out');
  }
  if (addIgnore(project)) done.push('.gitignore: .flow/ added');

  // A teammate set the project up: the branch brought the stamp down.
  if (fs.existsSync(path.join(records_, 'version'))) {
    out(done.join('\n'));
    return setup.startProject(at, clone, flags.root);
  }

  seedRecords(project, choosePrefix(project, flags.prefix));
  const rivals = competing(at, project);
  if (rivals.length) {
    records.commit(project, 'flow init');
    out(`${done.join('\n')}\n\n${rivals.length} thing${rivals.length === 1 ? '' : 's'} here already tell${rivals.length === 1 ? 's' : ''} ` +
      `Claude how to work: ${rivals.join(', ')}. The setup session sorts them.\n`);
    return setup.startProject(at, clone, flags.root);
  }

  for (const rel of writeTemplate(clone, project)) done.push(`wrote: ${rel}`);
  const newest = stamp(clone, project);
  records.commit(project, 'flow init');
  records.syncLater(project, at.flow);
  out(`${done.join('\n')}\n\nset up: ${show(project)} is on entry ${newest}. Nothing in the code is committed: ` +
    'AGENTS.md, CLAUDE.md, .gitignore and .claude/ wait for your next commit.');
  return 0;
}

const actions = {};

actions.init = {
  section: 'setup',
  anywhere: true,
  args: '[check|finish]',
  summary: 'set up the project you are in; check and finish are the setup session\'s own steps',
  flags: { root: { arg: '<dir>' }, prefix: { arg: '<word>' }, local: { bool: true } },
  run({ positional, flags }) {
    const at = machine.folders(flags.root);
    const [word, ...extra] = positional;
    if (extra.length || (word && !['check', 'finish'].includes(word))) {
      throw new FlowError('usage: flow init [check|finish] [--prefix <word>] [--local]');
    }
    if (word === 'check') return setup.checkProject(at);
    if (word === 'finish') {
      const code = setup.finishProject(at, cloneRoot());
      return code;
    }
    if (!fs.existsSync(path.join(at.flow, 'version'))) {
      throw new FlowError('Flow is not set up on this machine. Run flow install first.');
    }
    return init(at, cloneRoot(), flags);
  },
};

module.exports = actions;
