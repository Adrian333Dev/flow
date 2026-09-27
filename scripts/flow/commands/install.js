'use strict';
/**
 * Put Flow on this machine: every symlink, in one idempotent pass.
 *
 * Run it once by path on a fresh machine, because `flow` is not a command
 * until this has made it one:
 *
 *   node <clone>/scripts/flow/flow.js install
 *
 * Everything after that is `flow install`, and re-running it is how a new
 * skill, a renamed command or a moved clone reaches this machine.
 *
 * This is half of putting Flow on a machine: links into the clone, which
 * `lib/installed.js` lists, and the clones Flow reads, which `lib/repos.js`
 * lists. `lib/machine.js` says which folder holds what. The other half is
 * `flow setup`, which this starts at the end: a Claude Code session that
 * writes the rule file and the import line, merges Flow's hooks into
 * `~/.claude/settings.json`, and closes the original. A rule file written here
 * would be the template with nothing of the user in it, so this writes none.
 * `commands/setup.js` says how the session opens.
 *
 * Every clone lives in `~/.flow/repos/`. Flow's own is `repos/flow`, a link
 * where this clone sits somewhere else. util, the toolbox and every skill
 * repository in `sources` are cloned when missing, and a clone that fails is
 * a warning: running install again changes nothing that exists, so it is
 * always the fix. util gets its names through its own `util install`.
 * `--no-clone` skips all 3, for the tests.
 *
 * On a machine where setup already finished, `~/.flow/version` exists and the
 * run ends without sending the user to setup again.
 *
 * Before it creates anything, the first run writes the machine's original: a
 * copy of every path it is about to make, as that path was before Flow.
 * `flow restore machine` puts all of them back, `~/.local/bin/flow` included.
 *
 * At a terminal it asks one question, this machine's name. Then it finds the
 * Flow home's repository, `<login>/flow-home` on GitHub, signing `gh` in
 * first where it is not. On every machine after the first, the repository
 * holds the other machine's `~/.flow/`, and it comes down before setup starts,
 * at the release the Flow home is on. `connect()` below holds all of it, and
 * says why an install with no repository stops before setup.
 *
 * The screen gets a summary and every line that changed or failed. The whole
 * run goes to `~/.flow/install.log`.
 *
 * `--root <dir>` puts the whole install under `<dir>` in place of the home
 * folder, `~/.local/bin` included. The tests and lab/scripts/try.sh use it to
 * build a machine inside tmp/.
 *
 * Which skills link is read off the tree: every group except `drafts/`, which
 * `--drafts` adds back for the scratch session. There is no list to keep in
 * step, so a skill is typeable the moment its folder exists.
 *
 * The plugin manifest is what makes every skill typed as `/flow:groundwork`
 * rather than `/groundwork`. Both harnesses read it, which is why the clone
 * itself carries no prefix anywhere.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const { out } = require('../lib/cli');
const { cloneRoot } = require('../lib/clone');
const confirm = require('../lib/confirm');
const { FlowError } = require('../lib/error');
const flowRepo = require('../lib/flow-repo');
const history = require('../lib/history');
const installed = require('../lib/installed');
const { link, pruneDead, pruneUnlisted, markdownFiles } = require('../lib/links');
const machine = require('../lib/machine');
const originals = require('../lib/originals');
const repos = require('../lib/repos');
const links = require('../lib/skill-links');
const skills = require('../lib/skills');
const version = require('../lib/version');
const setup = require('./setup');

const show = machine.shorten;
const actions = {};

actions.install = {
  section: 'setup',
  anywhere: true,
  summary: 'link Flow into ~/.agents, ~/.claude, ~/.flow and ~/.local/bin, and clone what it reads',
  flags: {
    root: { arg: '<dir>' },
    'no-bin': { bool: true },
    'no-clone': { bool: true },
    drafts: { bool: true },
  },
  run({ flags }) {
    const clone = cloneRoot();
    const at = machine.folders(flags.root);
    const done = [];
    const bin = flags['no-bin'] ? null : path.join(at.base, '.local', 'bin');
    const setUp = fs.existsSync(path.join(at.flow, 'version'));

    // Refused before anything is made: 2 clones would each think the other's
    // skills and scripts were their own.
    const flowClone = repos.flowClone(at.flow);
    const found = originals.lstat(flowClone);
    if (found && found.isSymbolicLink() && !fs.existsSync(flowClone)) fs.unlinkSync(flowClone);
    const already = fs.existsSync(flowClone) ? realpath(flowClone) : null;
    if (already && already !== realpath(clone)) {
      throw new FlowError(`${machine.shorten(flowClone)} is ${already}, and this is ${clone}. ` +
        'Run flow install from that clone, or remove the link first.');
    }

    // Before anything is created, and only on a machine Flow was never on. A
    // later run would copy Flow's own links into the original and call them the
    // state to go back to. `~/.flow/scripts` is the tell: this command is the
    // only thing that makes it, and it makes it on every run.
    const fresh = !originals.lstat(path.join(at.flow, 'scripts'));
    if (fresh && !originals.read(at)) {
      originals.start(at);
      for (const p of installed.paths(clone, at, { bin })) originals.record(at, null, p);
      done.push(`wrote: ${show(originals.dir(at))}, this machine as it was before Flow`);
    }

    // Per item, never per folder: all three hold entries Flow does not own.
    for (const dir of ['skills', 'agents', 'rules']) {
      fs.mkdirSync(path.join(at.claude, dir), { recursive: true });
      for (const gone of pruneDead(path.join(at.claude, dir), clone)) {
        done.push(`unlinked (gone): ${show(path.join(at.claude, dir, gone))}`);
      }
    }

    // Flow's skills are a plugin, so they link one level down, under a folder
    // holding the manifest that names them. The manifest is copied rather than
    // linked: Codex checks it with `symlink_metadata` and ignores a link.
    const linkDir = skills.linkDir(at.agents);
    const manifest = skills.manifestFile(at.agents);
    fs.mkdirSync(path.dirname(manifest), { recursive: true });
    fs.copyFileSync(skills.manifestSource(), manifest);
    done.push(`wrote: ${show(manifest)}`);

    fs.mkdirSync(linkDir, { recursive: true });
    for (const gone of pruneDead(linkDir, clone)) {
      done.push(`unlinked (gone): ${show(path.join(linkDir, gone))}`);
    }
    // The essential skills only: a dev skill starts off, and apply below links
    // one switched on.
    for (const skill of skills.installable({ drafts: flags.drafts }).filter(skills.essential)) {
      link(skill.dir, path.join(linkDir, skill.name));
      done.push(`linked: ${show(path.join(linkDir, skill.name))}`);
    }

    // The one folder link Flow makes. It is safe where a link to skills/ would
    // not be: this folder holds Flow's skills alone, and skills/ beside it
    // keeps every other tool's.
    const pluginLink = skills.pluginLink(at.claude);
    link(skills.pluginDir(at.agents), pluginLink);
    done.push(`linked: ${show(pluginLink)}`);

    for (const file of markdownFiles(path.join(clone, 'agents'))) {
      link(path.join(clone, 'agents', file), path.join(at.claude, 'agents', file));
      done.push(`linked: ${show(path.join(at.claude, 'agents', file))}`);
    }

    for (const file of markdownFiles(path.join(clone, 'rules'))) {
      link(path.join(clone, 'rules', file), path.join(at.claude, 'rules', file));
      done.push(`linked: ${show(path.join(at.claude, 'rules', file))}`);
    }

    // Named by path rather than typed: settings.json points hooks at
    // ~/.flow/scripts, a skill reads ~/.flow/references, and /flow:help reads
    // ~/.flow/docs. Claude Code reads none of the 3, which is why they sit
    // outside ~/.claude. A link rather than a copy, so a page edited in the
    // clone is the page a session reads.
    fs.mkdirSync(at.flow, { recursive: true });
    for (const name of ['scripts', 'references', 'docs']) {
      link(path.join(clone, name), path.join(at.flow, name));
      done.push(`linked: ${show(path.join(at.flow, name))}`);
    }

    // Flow's own clone, where every other clone sits beside it. A link when
    // the clone lives somewhere else, which is the usual case.
    if (!already) {
      fs.mkdirSync(path.dirname(flowClone), { recursive: true });
      fs.symlinkSync(clone, flowClone);
      done.push(`linked: ${show(flowClone)}`);
    }

    if (!flags['no-clone']) done.push(...cloneMissing(at));

    if (bin) {
      for (const [name, file] of Object.entries(installed.BIN)) {
        link(path.join(clone, file), path.join(bin, name));
        done.push(`linked: ${show(path.join(bin, name))}`);
      }
      // A command that was renamed or retired leaves a name behind that still
      // runs, because its link still resolves into the clone. Only links into
      // the clone's scripts/ go: every name Flow ships points at a file there,
      // and util keeps its own names in the same folder.
      for (const gone of pruneUnlisted(bin, path.join(clone, 'scripts'), Object.keys(installed.BIN))) {
        done.push(`unlinked (renamed): ${show(path.join(bin, gone))}`);
      }
    }

    if (bin && !flags['no-clone']) done.push(...installUtil(at, bin));

    // Last, once every skill link is made and every clone is in place: a
    // skill switched off loses its link, and one switched on for the machine
    // gets its own.
    const applied = links.apply({ home: at.flow, root: null, claude: at.claude, agents: at.agents });
    done.push(...applied.changed);
    done.push(...applied.problems);

    const newest = version.newest(clone);
    const asked = connect(at, newest);
    done.push(...asked.lines);
    // Another machine's settings came down with its sources and its skills.
    if (asked.joined) {
      if (!flags['no-clone']) done.push(...cloneMissing(at));
      const joined = links.apply({ home: at.flow, root: null, claude: at.claude, agents: at.agents });
      done.push(...joined.changed, ...joined.problems);
    }
    history.record(at.flow, { type: 'install', clone });

    // Every line goes to the log. The screen gets the ones that say something
    // changed or failed: a link made again, the same as last time, is noise
    // above the part that matters.
    const log = path.join(at.flow, 'install.log');
    fs.writeFileSync(log, `${new Date().toISOString()}\n${done.join('\n')}\n`);
    const count = skills.installable({ drafts: flags.drafts }).filter(skills.essential).length;
    const shown = done.filter((line) => !/^(linked|wrote): /.test(line) || /originals/.test(line));
    out([
      `Flow is installed: ${count} skills, each typed under the plugin name, as /${skills.PLUGIN}:groundwork.`,
      ...shown,
      `Every line of the install is in ${show(log)}.`,
    ].join('\n'));

    if (bin && !onPath(bin)) {
      out(`\n${show(bin)} is not on your PATH, so flow and util do not run by name yet. Add it, then open a new terminal.`);
    }

    if (asked.switchTo) return switchAndRerun(clone, flowClone, asked.switchTo, newest);
    if (!asked.ok) return 1;
    if (setUp) {
      out('\nFlow is already set up on this machine, so there is nothing more to do.');
      return 0;
    }
    // A scratch root is never the machine a session would read, so the
    // session is left for the test to open through flow setup itself.
    if (flags.root) {
      out(`\nOne step left: setting up this machine. Start it from a terminal:\n\n  flow setup --root ${flags.root}`);
      return 0;
    }
    out('');
    return setup.start(at, clone, null);
  },
};

/** True when `dir` is one of the folders on PATH. */
function onPath(dir) {
  return (process.env.PATH || '').split(path.delimiter).some((d) => path.resolve(d || '.') === path.resolve(dir));
}

/** A path with every link resolved, or the path itself where it resolves to nothing. */
function realpath(p) {
  try {
    return fs.realpathSync(p);
  } catch {
    return p;
  }
}

/**
 * Clone util, the toolbox and every source missing from `~/.flow/repos/`.
 * A failure is a line of the report, never a stop: every link is already made.
 */
function cloneMissing(at) {
  const done = [];
  const wanted = [
    ...Object.entries(repos.OWN).map(([name, entry]) => ({ source: repos.parse(entry), to: repos.ownClone(at.flow, name) })),
    ...repos.sources(at.flow).map((entry) => {
      const source = repos.parse(entry);
      return { source, to: repos.sourceDir(at.flow, source) };
    }),
  ];
  for (const { source, to } of wanted) {
    if (fs.existsSync(to)) continue;
    const cloned = repos.clone(source.url, to);
    if (cloned.ok) {
      history.record(at.flow, { type: 'clone', source: source.id, commit: cloned.commit });
      done.push(`cloned: ${source.id} into ${machine.shorten(to)}`);
    } else {
      done.push(`could not clone ${source.id}: ${cloned.why}. Run flow install again once that is fixed.`);
    }
  }
  return done;
}

/**
 * util's names, made by util's own installer so its record of them stays
 * whole. A root other than the home folder keeps util's own folder there too.
 */
function installUtil(at, bin) {
  const entry = path.join(repos.ownClone(at.flow, 'util'), 'util.js');
  if (!fs.existsSync(entry)) return [];
  const env = { ...process.env };
  if (at.base !== os.homedir()) env.UTIL_HOME = path.join(at.base, '.util');
  const ran = spawnSync(process.execPath, [entry, 'install', '--bin', bin], { env, encoding: 'utf8' });
  if (ran.status === 0) return [`linked: util and u, through util install`];
  return [`util install failed: ${(ran.stderr || ran.stdout || '').trim().split('\n').pop()}`];
}

/**
 * A name no second machine will hold: this computer's name, and 4 random
 * letters.
 *
 * The letters are there because the computer's name is not reliably different.
 * WSL hands out `me` on every machine it is installed on, and 2 machines
 * sharing a name silently overwrite each other's stored work in `util git`.
 */
function suggestName() {
  const letters = 'abcdefghijklmnopqrstuvwxyz';
  let tail = '';
  for (let i = 0; i < 4; i++) tail += letters[Math.floor(Math.random() * letters.length)];
  return `${os.hostname().split('.')[0].toLowerCase()}-${tail}`;
}

/**
 * This machine's name, asked once, then the Flow home's repository: found,
 * connected and, on every machine after the first, brought down.
 *
 * The repository has no skip. `~/.flow/` holds the rules, the notes and the
 * study cases, and the repository is both their backup and how another
 * machine gets them, so an install without one is not finished and setup
 * does not start. It is always `<login>/flow-home`, found through `gh`, so
 * nothing about it is asked. A repository already set is kept.
 *
 * Returns the lines to print and whether the repository is in place, plus
 * `joined` once another machine's files came down, and `switchTo` where they
 * wait for this clone to move to the release they are on.
 */
function connect(at, newest) {
  const lines = [];
  const terminal = confirm.hasTerminal();

  const already = flowRepo.machineName(at);
  if (already) lines.push(`kept: this machine is called ${already}`);
  else if (terminal) {
    const suggested = suggestName();
    const name = confirm.ask(
      `\nA name for this machine, so work sent to the other one says where it came from [${suggested}]: `,
      suggested
    );
    const set = flowRepo.git(at.flow, ['config', '--global', 'util.machine', name]);
    lines.push(set.ok ? `named: this machine is ${name}` : `could not save the name: ${set.err}`);
  }

  const stop = (why) => {
    lines.push(`stopped: ${why}`);
    return { lines, ok: false };
  };
  const github = !process.env.FLOW_HOME_REMOTE;
  if (github) {
    const why = signIn(terminal);
    if (why) return stop(why);
  }

  const origin = flowRepo.isRepo(at) ? flowRepo.git(at.flow, ['remote', 'get-url', 'origin']) : { ok: false };
  if (origin.ok) lines.push(`kept: ${show(at.flow)} is sent to ${origin.out}`);
  else {
    try {
      const found = flowRepo.locate();
      flowRepo.connect(at, found.url);
      lines.push(`repository: ${found.said}`);
    } catch (e) {
      return stop(e.message);
    }
  }

  let joined;
  try {
    joined = flowRepo.join(at, newest);
  } catch (e) {
    return stop(e.message);
  }
  if (joined && joined.state === 'version') return { lines, ok: false, switchTo: joined };
  flowRepo.writeIgnore(at);
  if (!joined) {
    try {
      if (flowRepo.seed(at)) lines.push('started: your Flow home, sent up so your other machines join it');
    } catch (e) {
      return stop(e.message);
    }
    return { lines, ok: true };
  }
  const from = joined.from.length ? ` from ${joined.from.join(', ')}` : '';
  lines.push(`joined: ${joined.files} file${joined.files === 1 ? '' : 's'}${from}, your Flow home as your other machine last sent it`);
  return { lines, ok: true, joined: true };
}

/** What a token needs, shown before gh asks for one. */
const TOKEN_TIP = [
  '',
  'Flow keeps your Flow home in a private GitHub repository, through gh, and gh is not signed in.',
  'Sign in with a token, which works everywhere, WSL included:',
  '  1. Open github.com/settings/tokens/new, which makes a classic token.',
  '  2. Tick repo, read:org and gist. Nothing else.',
  '  3. Generate it and copy it.',
  '  4. Below, choose "Paste an authentication token", and paste it.',
  '',
].join('\n');

/**
 * Sign gh in where it is not, then point git's own sign-in at it, so a push to
 * the repository never asks for a password. Returns why it stopped, or null.
 */
function signIn(terminal) {
  const status = spawnSync('gh', ['auth', 'status'], { stdio: 'ignore' });
  if (status.error) return 'gh is not installed, and Flow keeps your Flow home on GitHub through it. Install it from cli.github.com, then run flow install again.';
  if (status.status !== 0) {
    if (!terminal) return 'gh is not signed in, and there is no terminal here to sign in. Run gh auth login, then flow install again.';
    out(TOKEN_TIP);
    const tty = fs.openSync('/dev/tty', 'r');
    const login = spawnSync('gh', ['auth', 'login', '--hostname', 'github.com', '--git-protocol', 'https'], { stdio: [tty, 'inherit', 'inherit'] });
    fs.closeSync(tty);
    if (login.status !== 0) return 'gh did not sign in. Run flow install again to try once more.';
  }
  const git = spawnSync('gh', ['auth', 'setup-git'], { encoding: 'utf8' });
  return git.status === 0 ? null : `gh could not set git up to use its sign-in: ${(git.stderr || '').trim()}`;
}

/**
 * Move the clone `install.sh` made to the release the Flow home is on, then
 * run the install again from it. A clone somebody works in is never moved:
 * the install stops and says what to do.
 */
function switchAndRerun(clone, flowClone, wanted, newest) {
  const place = `your Flow home is on changelog entry ${wanted.home}, since ${wanted.name} is on it, and this Flow is on ${newest}`;
  const found = originals.lstat(flowClone);
  if (found && found.isSymbolicLink()) {
    out(`stopped: ${place}. Switch ${clone} to v${wanted.home}, then run flow install again.`);
    return 1;
  }
  const why = flowRepo.switchClone(clone, wanted.home);
  if (why) {
    out(`stopped: ${place}, and ${why}.`);
    return 1;
  }
  out(`switched: Flow to v${wanted.home}, since ${place}. Installing again from it.\n`);
  const again = spawnSync(process.execPath, [path.join(clone, 'scripts', 'flow', 'flow.js'), ...process.argv.slice(2)], { stdio: 'inherit' });
  return again.status === null ? 1 : again.status;
}

module.exports = actions;
