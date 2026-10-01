'use strict';
/**
 * `flow init`: set up the project you are in.
 *
 * A file telling Claude how to work here always gets the setup session,
 * since only reading it can sort its rules into Flow's files. Any other file
 * gets a question: only the user can tell a project from a folder of scratch
 * code. Each state is checked on its own, in this order:
 *
 *   no git repository         `git init`, never inside an existing one
 *   typed in a subfolder      works at the repository's top folder, and says so
 *   a run stopped part way    carries it on
 *   already a Flow project    says so and stops, or folds in this machine's old
 *                             Claude Code memory where there is some
 *   --private                 the tickets go to the Flow home: below
 *   the Flow home holds it    another machine put this project in the Flow
 *                             home: links `.flow/` to that folder, and the
 *                             project is set up
 *   a teammate set it up      the `flow` branch is on the remote: checks it
 *                             out, and the project is set up
 *   a public repository       asks where the tickets live, since the branch
 *                             would publish them. gh failing to tell asks too.
 *                             With no terminal, the Flow home
 *   a remote refusing a push  stops before anything is made, offering --private
 *   no `flow` branch          makes one, checked out at `.flow/`
 *   competing files           opens the setup session, which sorts them
 *   other files, or old       asks whether the setup session should read
 *   Claude Code memory        them; -y answers yes. The default, and the
 *                             answer with no terminal, is the template
 *   an empty folder           writes the template at once
 *   an existing .gitignore    Flow's lines are added, and nothing is replaced
 *
 * The project's ticket prefix is asked once, `exp` for an expense app, with
 * the first letters of the folder offered. `--prefix` answers it.
 *
 * In the Flow home, `.flow/` is a link to ~/.flow/projects/<name>/, and
 * lib/records-place.js holds how. The link is listed in `.git/info/exclude`,
 * git's ignore list for one clone, so `.gitignore` gets no `.flow/` line.
 * Everything else is the branch's: the rule files, the template and the setup
 * session, since a project needs its rules wherever its tickets live.
 *
 *   flow init            set this project up
 *   flow init check      exit 0 where it can be; the setup session's first step
 *   flow init finish     stamp .flow/version; the setup session's last step
 *   flow store           where the tickets live; `branch` or `private` moves them
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
const place = require('../lib/records-place');
const { projectRoot } = require('../lib/root');
const settings = require('../lib/settings');
const store = require('../lib/store');
const ticketSkills = require('../lib/ticket-skills');
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

/**
 * The paths competing with Flow's rules in this project, as found. A skills
 * folder holding nothing but Flow's ticket skills is Flow's own.
 */
function competing(project) {
  return COMPETING.filter((rel) => {
    const at = path.join(project, rel);
    if (!fs.existsSync(at)) return false;
    if (rel !== '.claude/skills') return true;
    return fs.readdirSync(at).some((name) => !ticketSkills.isTicketSkill(path.join(at, name)));
  });
}

/**
 * Whether the project holds a file of its own: one git keeps, or one it would
 * keep once added. The `.gitignore` Flow just wrote doesn't count.
 */
function hasFiles(project) {
  const listed = git(project, ['ls-files', '--cached', '--others', '--exclude-standard']).out;
  return listed.split('\n').some((rel) => rel && rel !== '.gitignore');
}

/** Whether the user wants the setup session: `-y`, the typed answer, or no. */
function wantsSession(yes) {
  if (yes) return true;
  if (!process.stdout.isTTY || !confirm.hasTerminal()) return false;
  return /^y(es)?$/i.test(confirm.ask('This folder already has files.\nRead them in a setup session first? (y/N) ', 'n'));
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

/**
 * Where nothing chose a place and the repository is public, or gh could not
 * tell: the question. With no terminal, the Flow home, since the branch
 * would publish the tickets.
 */
function askPlace(seen) {
  if (!process.stdout.isTTY || !confirm.hasTerminal()) return 'home';
  const open = seen === 'public';
  const answer = confirm.ask(
    `${open ? 'This repository is public.' : 'Flow could not tell whether this repository is public.'} Where should its tickets live?\n` +
    '  1. Your Flow home: private, on all your machines   (default)\n' +
    `  2. The project's flow branch: ${open ? 'PUBLIC, anyone can read them' : 'anyone who can read the repository reads them'}\n` +
    'Type 1 or 2: ', '1').trim();
  return answer === '2' ? 'branch' : 'home';
}

/** Where this project's tickets go: `branch` or `home`. The file header holds the order. */
function choosePlace(at, project, flags) {
  if (flags.private || place.findFolder(project, at.flow)) return 'home';
  if (git(project, ['rev-parse', '-q', '--verify', `refs/heads/${records.BRANCH}`]).ok) return 'branch';
  if (records.hasRemote(project)) {
    git(project, ['fetch', '-q', records.REMOTE, records.BRANCH]);
    if (records.remoteHasBranch(project)) return 'branch';
  }
  const seen = place.visibility(project);
  return ['public', 'unknown'].includes(seen) ? askPlace(seen) : 'branch';
}

/**
 * Link `.flow/` to this project's folder in the Flow home: the one another
 * machine made for the same repository, or a new one. Returns the folder.
 */
function linkHome(at, project, done) {
  const records_ = path.join(project, '.flow');
  const now = place.placeOf(project, at.flow);
  if (now && now.type === 'branch') {
    throw new FlowError(`${show(records_)} is a checkout of the flow branch. Run flow store private to move its tickets.`);
  }
  if (now && now.dir === records_ && fs.readdirSync(records_).length) {
    throw new FlowError(`${show(records_)} already holds files. Move them out, run flow init, then move them back.`);
  }
  const found = place.findFolder(project, at.flow);
  const dir = found || (now && now.type === 'home' ? now.dir : place.newFolder(project, at.flow));
  if (now && now.dir === records_) fs.rmdirSync(records_);
  place.link(project, dir);
  done.push(fs.existsSync(path.join(dir, 'version'))
    ? `.flow/: linked to ${show(dir)}, where another machine put this project's tickets`
    : `.flow/: a link to ${show(dir)}, in your Flow home, listed in .git/info/exclude so git never sees it`);
  return dir;
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

/**
 * The folder the ticket skills go in, made now because Claude Code sees a skill
 * added mid-session only under a folder that existed when the session started.
 */
const makeSkillsFolder = (project) => fs.mkdirSync(ticketSkills.folderOf(project), { recursive: true });

/** The records folder's first files: the prefix, and what the branch ignores. */
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

  let project = topOf(here);
  if (!project) {
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

  const home = choosePlace(at, project, flags) === 'home' ? linkHome(at, project, done) : null;
  if (!home) {
    // A ticket gets its number only once the remote has it, so a remote that
    // refuses this clone's pushes would leave the project unable to make one.
    const push = records.canPush(project);
    if (!push.ok) {
      throw new FlowError(`the remote refuses a push from this clone, so no ticket could ever be made here. git said: ${push.why}\n` +
        'Fix what git names and run flow init again, or run flow init --private to keep the tickets in your private Flow home.');
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
  }

  // A teammate, or another machine, set the project up: the stamp is there.
  if (fs.existsSync(path.join(records_, 'version'))) {
    makeSkillsFolder(project);
    out(done.join('\n'));
    return setup.startProject(at, clone, flags.root);
  }

  seedRecords(project, choosePrefix(project, flags.prefix));
  if (home) place.remember(project, home);
  const rivals = competing(project);
  const something = hasFiles(project) || setup.holdsFiles(setup.memoryDir(at, project));
  if (rivals.length || (something && wantsSession(flags.y))) {
    records.commit(project, 'flow init');
    const why = rivals.length ? `\nThis folder already has rules for Claude: ${rivals.join(', ')}. The setup session reads them first.` : '';
    out(`${done.join('\n')}\n${why}\n`);
    return setup.startProject(at, clone, flags.root);
  }

  for (const rel of writeTemplate(clone, project)) done.push(`wrote: ${rel}`);
  const newest = stamp(clone, project);
  records.commit(project, 'flow init');
  records.syncLater(project, at.flow);
  out(`${done.join('\n')}\n\nset up: ${show(project)} is on entry ${newest}. Nothing in the code is committed: ` +
    'AGENTS.md, CLAUDE.md, .gitignore and .claude/ wait for your next commit.' +
    (home ? '\nIts tickets are private, in your Flow home, and flow sync carries them to your other machines.' : '') +
    (flags.y && !something ? '\nNothing here to read. Describe the project with /flow:groundwork.' : ''));
  return 0;
}

const actions = {};

actions.init = {
  section: 'setup',
  anywhere: true,
  args: '[check|finish]',
  summary: 'set up the project you are in; check and finish are the setup session\'s own steps',
  flags: {
    root: { arg: '<dir>' }, prefix: { arg: '<word>' }, private: { bool: true }, y: { bool: true, letter: true },
  },
  run({ positional, flags }) {
    const at = machine.folders(flags.root);
    const [word, ...extra] = positional;
    if (extra.length || (word && !['check', 'finish'].includes(word))) {
      throw new FlowError('usage: flow init [check|finish] [--prefix <word>] [--private] [-y]');
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

// ------------------------------------------------------------ flow store

/** One line saying where the tickets live now, and who reads them. */
function describe(found, project) {
  const name = path.basename(project);
  if (found.type === 'branch') return `${name}'s tickets live on the project's flow branch. Everyone who can read the repository reads them.`;
  if (found.type === 'home') return `${name}'s tickets live in your Flow home, ${show(found.dir)}: private, and carried to your other machines by flow sync.`;
  return `${name}'s tickets live in ${show(found.dir)}, in this clone alone.`;
}

/** From the branch, or a plain folder, to a new Flow home folder. */
function intoHome(at, project, found) {
  const records_ = path.join(project, '.flow');
  const already = place.findFolder(project, at.flow);
  if (already) throw new FlowError(`${show(already)} already holds this project's tickets. Move or delete it first.`);
  const dir = place.newFolder(project, at.flow);
  if (found.type === 'branch') records.commit(project, 'saved before moving to the Flow home');
  place.copyRecords(records_, dir);
  if (found.type === 'branch') {
    const removed = git(project, ['worktree', 'remove', '--force', records_]);
    if (!removed.ok) {
      fs.rmSync(dir, { recursive: true, force: true });
      throw new FlowError(`could not take the flow branch's checkout away from .flow/: ${removed.err}`);
    }
  } else {
    fs.rmSync(records_, { recursive: true, force: true });
  }
  place.link(project, dir);
  place.remember(project, dir);
  const lines = [`moved: ${path.basename(project)}'s tickets now live in ${show(dir)}.`];
  if (found.type === 'branch') {
    lines.push('The flow branch keeps the tickets as they were, here and on the remote, and anyone who read the repository may hold a copy.',
      'To delete it: git branch -D flow, then git push origin --delete flow.');
  }
  return lines;
}

/**
 * From the Flow home, or a plain folder, onto the branch: the one already
 * there where an earlier move left it, a new one otherwise. The branch then
 * holds exactly what moved, so a ticket the branch has and the moved folder
 * lacks would be deleted, and that refuses.
 */
function ontoBranch(at, project, found) {
  const records_ = path.join(project, '.flow');
  const push = records.canPush(project);
  if (!push.ok) throw new FlowError(`the remote refuses a push from this clone, so the branch could never be sent. git said: ${push.why}`);

  let from = found.dir;
  let staged = null;
  if (found.type === 'folder' && from === records_) {
    staged = fs.mkdtempSync(path.join(require('os').tmpdir(), 'flow-store-'));
    place.copyRecords(records_, staged);
    from = staged;
  }
  const restore = () => {
    git(project, ['worktree', 'remove', '--force', records_]);
    if (staged) {
      place.copyRecords(staged, records_);
      fs.rmSync(staged, { recursive: true, force: true });
    } else {
      place.link(project, found.dir);
    }
  };
  fs.rmSync(records_, { recursive: true, force: true });
  const checked = records.checkOut(project);
  if (!checked.ok) {
    restore();
    throw new FlowError(`could not check out the flow branch at .flow/: ${checked.why}`);
  }
  const moving = new Set(place.ticketFolders(from));
  const lost = place.ticketFolders(records_).filter((n) => !moving.has(n));
  if (lost.length) {
    restore();
    throw new FlowError(`the flow branch already holds tickets that would be deleted: ${lost.join(', ')}. Nothing was changed.`);
  }
  for (const entry of fs.readdirSync(records_)) {
    if (entry !== '.git') fs.rmSync(path.join(records_, entry), { recursive: true, force: true });
  }
  place.copyRecords(from, records_);
  const file = settings.projectFile(project);
  const { repository, ...rest } = settings.read(file);
  if (repository) settings.write(file, rest);
  const lines = [`moved: ${path.basename(project)}'s tickets now live on the project's flow branch, at .flow/.`];
  if (addIgnore(project)) lines.push('.gitignore: .flow/ added, waiting for your next commit');
  records.commit(project, found.type === 'folder' ? 'moved from a folder in this clone' : 'moved from the Flow home');
  records.syncLater(project, at.flow);
  // A link to a folder outside the Flow home points at something Flow never made.
  if (staged || found.type !== 'folder') fs.rmSync(from, { recursive: true, force: true });
  lines.push('Everyone who can read the repository reads them once the branch is sent, which starts now.');
  return lines;
}

actions.store = {
  section: 'setup',
  args: '[branch|private]',
  summary: 'where this project\'s tickets live; branch or private moves them there',
  flags: { root: { arg: '<dir>' } },
  run({ positional, flags }) {
    const at = machine.folders(flags.root);
    const [word, ...extra] = positional;
    if (extra.length || (word && !['branch', 'private'].includes(word))) {
      throw new FlowError('usage: flow store [branch|private]');
    }
    const project = projectRoot();
    const found = place.placeOf(project, at.flow);
    if (!word) {
      out(describe(found, project));
      return 0;
    }
    const want = word === 'branch' ? 'branch' : 'home';
    if (found.type === want) {
      out(`${describe(found, project)} Nothing moved.`);
      return 0;
    }
    const lines = want === 'branch' ? ontoBranch(at, project, found) : intoHome(at, project, found);
    out(lines.join('\n'));
    return 0;
  },
};

module.exports = actions;
