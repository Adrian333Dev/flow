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
 *   the Flow home's sync      brings in what another machine sent, so the
 *                             next 2 states see it
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
 * lib/tickets/records-place.js holds how. The link is listed in `.git/info/exclude`,
 * git's ignore list for one clone, so `.gitignore` gets no `.flow/` line.
 * Everything else is the branch's: the rule files, the template and the setup
 * session, since a project needs its rules wherever its tickets live.
 *
 * The project's original, lib/machine/originals.js, opens before the first write, and
 * every path written here is recorded first, so `flow restore project` undoes
 * all of it. The template closes it. The setup session leaves it open for
 * apply-migration.js, which closes it at the end. A `git init` is never
 * recorded: the history the user commits into it is theirs.
 *
 *   flow init            set this project up
 *   flow init --check    exit 0 where it can be; the setup session's first step
 *   flow init --finish   stamp .flow/version; the setup session's last step
 */

const fs = require('fs');
const path = require('path');
const { out } = require('../lib/cli');
const confirm = require('../lib/machine/confirm');
const { FlowError } = require('../lib/error');
const flowRepo = require('../lib/machine/flow-repo');
const machine = require('../lib/machine/machine');
const originals = require('../lib/machine/originals');
const records = require('../lib/tickets/records');
const place = require('../lib/tickets/records-place');
const projects = require('../lib/project');
const settings = require('../lib/settings');
const store = require('../lib/tickets/store');
const ticketSkills = require('../lib/tickets/ticket-skills');
const version = require('../lib/machine/version');
const setup = require('../lib/setup');
const paths = require('../lib/paths');

const show = paths.shorten;
const { git } = require('../lib/git');

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

/**
 * The template's last line. With no setup session, nothing reads which plugin
 * or skill the code uses, so the user is told how to switch one on here. A
 * list of what is off would need a record of what the machine's setup
 * switched off, since the user switches things off too, and Flow keeps none.
 */
const SWITCH_ON = 'A plugin or skill switched off on this computer is switched on here with: ' +
  'claude plugin enable <id> --scope project, or flow skills on <name>';

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
  return /^y(es)?$/i.test(confirm.ask('This folder already has files.\nRead them in a setup session first? (y/N) ', 'n', ''));
}

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
 * Where nothing chose a place and the repository is public, or gh could not
 * tell: the question. With no terminal, the Flow home, since the branch
 * would publish the tickets.
 */
function askPlace(seen) {
  if (!process.stdout.isTTY || !confirm.hasTerminal()) return 'home';
  const open = seen === 'public';
  const answer = confirm.ask(
    `${open ? 'This repository is public.' : 'Flow could not tell whether this repository is public.'} Where should its tickets live?\n` +
    '  1. Your Flow home: private, on all your machines\n' +
    `  2. The project's flow branch: ${open ? 'PUBLIC, anyone can read them' : 'anyone who can read the repository reads them'}\n` +
    'Type 1 or 2: ', '1').trim();
  return answer === '2' ? 'branch' : 'home';
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
function writeTemplate(clone, project, keep) {
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
          keep(to);
          fs.writeFileSync(to, `${had.trimEnd()}${had.trim() ? '\n\n' : ''}${missing.join('\n\n')}\n`);
          wrote.push('.gitignore');
        }
        continue;
      }
      if (fs.existsSync(to)) continue;
      keep(to);
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

  let project = projects.top(here);
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

  pullHome(at, done);
  originals.start(at, project);
  const keep = (p) => originals.record(at, project, p);
  keep(records_);
  keep(ticketSkills.folderOf(project));

  const where = choosePlace(at, project, flags);
  if (where === 'home') keep(place.excludeFile(project));
  const home = where === 'home' ? linkHome(at, project, done) : null;
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
    keep(path.join(project, '.gitignore'));
    if (place.addIgnore(project)) done.push('.gitignore: .flow/ added');
  }

  // A teammate, or another machine, set the project up: the stamp is there.
  if (fs.existsSync(path.join(records_, 'version'))) {
    makeSkillsFolder(project);
    // Only old memory to fold in opens a session, and its migration closes the window.
    if (!setup.holdsFiles(setup.memoryDir(at, project))) originals.close(at, project);
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

  for (const rel of writeTemplate(clone, project, keep)) done.push(`wrote: ${rel}`);
  const newest = version.stamp(path.join(project, '.flow', 'version'), clone);
  originals.close(at, project);
  records.commit(project, 'flow init');
  records.syncLater(project, at.flow);
  out(`${done.join('\n')}\n\nset up: ${show(project)} is on entry ${newest}. Nothing in the code is committed: ` +
    'AGENTS.md, CLAUDE.md, .gitignore and .claude/ wait for your next commit.' +
    (home ? '\nIts tickets are private, in your Flow home, and flow sync carries them to your other machines.' : '') +
    `\n${SWITCH_ON}` +
    (flags.y && !something ? '\nNothing here to read. Describe the project with /flow:groundwork.' : ''));
  return 0;
}

const actions = {};

actions.init = {
  section: 'setup',
  anywhere: true,
  summary: 'set up the project you are in; --check and --finish are the setup session\'s own steps',
  flags: {
    ...setup.STEP_FLAGS,
    root: { arg: '<dir>', hidden: true }, prefix: { arg: '<word>' }, private: { bool: true }, y: { bool: true, letter: true },
  },
  run({ positional, flags }) {
    const at = paths.folders(flags.root);
    const word = setup.stepOf(positional, flags, 'flow init [--check|--finish] [--prefix <word>] [--private] [-y]');
    if (word === 'check') return setup.checkProject(at);
    if (word === 'finish') return setup.finishProject(at, paths.cloneRoot());
    machine.requireSetup(flags.root);
    return init(at, paths.cloneRoot(), flags);
  },
};

module.exports = actions;
