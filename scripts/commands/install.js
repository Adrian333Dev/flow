'use strict';
/**
 * Put Flow on this machine: every symlink, in one idempotent pass.
 *
 * Run it once by path on a fresh machine, because `flow` is not a command
 * until this has made it one:
 *
 *   node <clone>/scripts/flow.js install
 *
 * Everything after that is `flow install`, and re-running it is how a new
 * skill, a renamed command or a moved clone reaches this machine.
 *
 * It makes links into the clone, which `lib/machine/installed.js` lists, the
 * clones Flow reads, which `lib/skills/repos.js` lists, and the Flow home.
 * Where the Flow home brought no `~/.flow/CLAUDE.md`, as on the first
 * machine, it starts one from its template in `home/`, then links
 * `~/.claude/CLAUDE.md` to the rules. It writes over no existing file.
 * It never edits `~/.claude/settings.json`. Where that link was not Flow's
 * yet, it owes the setup session, which `lib/machine/setup-session.js`
 * describes, and opens the session as its last step.
 *
 * Every clone lives in `~/.flow/repos/`. Flow's own is `repos/flow`, a link
 * where this clone sits somewhere else. util is cloned when missing, and a
 * clone that fails is a warning: running install again changes nothing that
 * exists, so it is always the fix. util gets its names through its own
 * `util install`. `--no-clone` skips every clone, for the tests.
 *
 * It checks before it makes anything. `check()` signs `gh` in where it is
 * not, finds the Flow home's repository, `<login>/flow-home` on GitHub, reads
 * what the other machines left in it, and asks this machine's name, the one
 * question. A check that fails stops the install with nothing linked. Then
 * the links, and `connectHome()`: on the first machine the repository is made
 * and started, and on every machine after it the other machines' `~/.flow/`
 * comes down.
 *
 * The screen gets a summary and every line that changed or failed. The whole
 * run goes to `~/.flow/logs/install.log`, and a line that failed also to the
 * failure log.
 *
 * `--root <dir>` puts the whole install under `<dir>` in place of the home
 * folder, `~/.local/bin` included. The tests use it to build a machine inside
 * tmp/.
 *
 * Which skills link is read off the tree: every group. There is no list to
 * keep in step, so a skill is typeable the moment its folder exists.
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
const confirm = require('../lib/machine/confirm');
const { FlowError } = require('../lib/error');
const flowRepo = require('../lib/machine/flow-repo');
const failures = require('../lib/logs/failures');
const logs = require('../lib/logs/logs');
const installed = require('../lib/machine/installed');
const { link, pruneDead, pruneUnlisted, markdownFiles } = require('../lib/machine/links');
const machineName = require('../lib/machine/machine-name');
const setupSession = require('../lib/machine/setup-session');
const repos = require('../lib/skills/repos');
const skills = require('../lib/skills/skills');
const paths = require('../lib/paths');
const { git } = require('../lib/git');

const show = paths.shorten;
const actions = {};

actions.install = {
  section: 'setup',
  summary: 'put Flow on this machine: the links, the clones, the Flow home and its rules',
  flags: {
    root: { arg: '<dir>', hidden: true },
    'no-bin': { bool: true, hidden: true },
    'no-clone': { bool: true, hidden: true },
  },
  run: guarded(({ flags }) => {
    const clone = paths.cloneRoot();
    const at = paths.folders(flags.root);
    const done = [];
    const bin = flags['no-bin'] ? null : path.join(at.base, '.local', 'bin');

    // Refused before anything is made: 2 clones would each think the other's
    // skills and scripts were their own.
    const flowClone = repos.flowClone(at.flow);
    const found = lstat(flowClone);
    if (found && found.isSymbolicLink() && !fs.existsSync(flowClone)) fs.unlinkSync(flowClone);
    const already = fs.existsSync(flowClone) ? realpath(flowClone) : null;
    if (already && already !== realpath(clone)) {
      throw new FlowError(`${paths.shorten(flowClone)} is ${already}, and this is ${clone}. ` +
        'Run flow install from that clone, or remove the link first.');
    }

    const checked = check(at);
    if (checked.stop) {
      out(`stopped: ${checked.stop}`);
      failures.record(at.flow, { source: 'install', what: 'flow install', error: `stopped: ${checked.stop}` });
      return 1;
    }

    // Per item, never per folder: all four hold entries Flow does not own.
    for (const dir of ['skills', 'agents', 'rules', 'commands']) {
      fs.mkdirSync(path.join(at.claude, dir), { recursive: true });
      for (const gone of pruneDead(path.join(at.claude, dir), clone)) {
        done.push(`unlinked (gone): ${show(path.join(at.claude, dir, gone))}`);
      }
    }

    // Flow's skills are a plugin, so they link one level down, under a folder
    // holding the manifest that names them. The manifest is copied rather than
    // linked: Codex checks it with `symlink_metadata` and ignores a link.
    // The clone's `skills` key names its group folders, for a session loading
    // the clone with `--plugin-dir`. The copy drops it, since the plugin
    // folder holds the skills flat.
    const linkDir = skills.linkDir(at.agents);
    const manifest = skills.manifestFile(at.agents);
    fs.mkdirSync(path.dirname(manifest), { recursive: true });
    const named = JSON.parse(fs.readFileSync(skills.manifestSource(), 'utf8'));
    delete named.skills;
    fs.writeFileSync(manifest, JSON.stringify(named, null, 2) + '\n');
    done.push(`wrote: ${show(manifest)}`);

    fs.mkdirSync(linkDir, { recursive: true });
    for (const gone of pruneDead(linkDir, clone)) {
      done.push(`unlinked (gone): ${show(path.join(linkDir, gone))}`);
    }
    for (const skill of skills.installable()) {
      link(skill.dir, path.join(linkDir, skill.name));
      done.push(`linked: ${show(path.join(linkDir, skill.name))}`);
    }

    // The one folder link Flow makes. It is safe where a link to skills/ would
    // not be: this folder holds Flow's skills alone, and skills/ beside it
    // keeps every other tool's.
    const pluginLink = skills.pluginLink(at.claude);
    link(skills.pluginDir(at.agents), pluginLink);
    done.push(`linked: ${show(pluginLink)}`);

    for (const file of markdownFiles(path.join(clone, 'claude', 'agents'))) {
      link(path.join(clone, 'claude', 'agents', file), path.join(at.claude, 'agents', file));
      done.push(`linked: ${show(path.join(at.claude, 'agents', file))}`);
    }

    for (const file of markdownFiles(path.join(clone, 'claude', 'rules'))) {
      link(path.join(clone, 'claude', 'rules', file), path.join(at.claude, 'rules', file));
      done.push(`linked: ${show(path.join(at.claude, 'rules', file))}`);
    }

    // Named by path rather than typed: settings.json points hooks at
    // ~/.flow/scripts, a skill reads ~/.flow/references, and a session reads
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

    const asked = connectHome(at, checked);
    done.push(...asked.lines);
    if (asked.joined && !flags['no-clone']) done.push(...cloneMissing(at));
    // After the join: a rule file written before it would block a second
    // machine from joining, and theirs arrives with the download.
    if (asked.ok) done.push(...startRules(at, clone), ...setupSession.linkRules(at));
    logs.recordHistory(at.flow, { type: 'install', clone });

    // Every line goes to the log. The screen gets the ones that say something
    // changed or failed: a link made again, the same as last time, is noise
    // above the part that matters.
    const log = path.join(logs.dir(at.flow), 'install.log');
    fs.mkdirSync(path.dirname(log), { recursive: true });
    fs.writeFileSync(log, `${new Date().toISOString()}\n${done.join('\n')}\n`);
    for (const line of done.filter((l) => /^(could not|not sent:|stopped:|util install failed)/.test(l))) {
      failures.record(at.flow, { source: 'install', what: 'flow install', error: line });
    }
    const count = skills.installable().length;
    const shown = done.filter((line) => !/^(linked|wrote): /.test(line));
    out([
      `Flow is installed: ${count} skills, each typed under the plugin name, as /${skills.PLUGIN}:groundwork.`,
      ...shown,
      `Every line of the install is in ${show(log)}.`,
    ].join('\n'));

    if (bin && !onPath(bin)) {
      out(`\n${show(bin)} is not on your PATH, so flow and util do not run by name yet. Add it, then open a new terminal.`);
    }

    const opened = asked.ok ? setupSession.open(at, clone, { printOnly: Boolean(flags.root) }) : 'none';
    if (opened === 'failed') {
      failures.record(at.flow, { source: 'install', what: 'flow install', error: 'claude would not start the setup session' });
    }
    return asked.ok && opened !== 'failed' ? 0 : 1;
  }),
};

/**
 * Run an install and log the error of one that throws. A refusal, such as
 * another clone at `repos/flow` or a real file in a link's way, is a failure
 * too, and `check()` and `connectHome()` log theirs where they return.
 */
function guarded(perform) {
  return (args) => {
    try {
      return perform(args);
    } catch (e) {
      failures.record(paths.folders(args.flags.root).flow, { source: 'install', what: 'flow install', error: e.message });
      throw e;
    }
  };
}

/** Start `~/.flow/CLAUDE.md` from Flow's own rules where the Flow home brought none. */
function startRules(at, clone) {
  const rules = path.join(at.flow, 'CLAUDE.md');
  if (fs.existsSync(rules)) return [];
  fs.copyFileSync(path.join(clone, 'home', 'CLAUDE.md'), rules);
  return [`started: ${show(rules)} from Flow's own rules`];
}

/** What `lstat` says about a path, or null where there is none. */
function lstat(p) {
  try {
    return fs.lstatSync(p);
  } catch {
    return null;
  }
}

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
 * Clone util if it is missing from `~/.flow/repos/`.
 * A failure is a line of the report, never a stop: every link is already made.
 */
function cloneMissing(at) {
  const done = [];
  const wanted = Object.entries(repos.OWN).map(([name, entry]) => ({ source: repos.parse(entry), to: repos.ownClone(at.flow, name) }));
  for (const { source, to } of wanted) {
    if (fs.existsSync(to)) continue;
    const cloned = repos.clone(source.url, to);
    if (cloned.ok) {
      logs.recordHistory(at.flow, { type: 'clone', source: source.id, commit: cloned.commit });
      done.push(`cloned: ${source.id} into ${paths.shorten(to)}`);
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
 * Everything an install needs, found before anything is made: `gh` signed in,
 * the repository, what the other machines left in it, and this machine's
 * name. Writes nothing but git's own copy of the repository's history, under
 * `~/.flow/.git`.
 *
 * Returns `{ stop }` with why it cannot go on, or what `connectHome()` acts on.
 *
 * The repository has no skip. `~/.flow/` holds the rules, the notes and the
 * study cases, and the repository is both their backup and how another
 * machine gets them, so an install without one is not finished. It is always
 * `<login>/flow-home`, so nothing about it is asked. A repository already set
 * is kept.
 */
function check(at) {
  const lines = [];
  const terminal = confirm.hasTerminal();
  if (!process.env.FLOW_HOME_REMOTE) {
    const why = signIn(terminal);
    if (why) return { stop: why };
  }

  let make = null;
  let found;
  try {
    const origin = flowRepo.isRepo(at) ? git(at.flow, ['remote', 'get-url', 'origin']) : { ok: false };
    if (origin.ok) lines.push(`kept: ${show(at.flow)} is sent to ${origin.out}`);
    else {
      const located = flowRepo.locate();
      if (located.exists) {
        flowRepo.connect(at, located.url);
        lines.push(`repository: ${located.said}`);
      } else make = located;
    }
    found = make ? { state: 'first', taken: [] } : flowRepo.inspect(at);
  } catch (e) {
    return { stop: e.message };
  }

  const kept = flowRepo.machineName(at);
  if (kept) lines.push(`kept: this machine is called ${kept}`);
  const name = kept ? null : askName(found.taken, terminal);
  return { lines, make, found, name };
}

/**
 * This machine's name: the offer from `lib/machine/machine-name.js`, or what was
 * typed. A name another machine's record holds is taken only on a yes, which
 * is how a rebuilt machine gets its old name back. With nobody at a terminal,
 * the offer.
 */
function askName(taken, terminal) {
  const offered = machineName.suggest(taken);
  if (!terminal) return offered;
  for (;;) {
    const name = machineName.clean(confirm.ask(`\nMachine name: `, offered));
    if (!name) continue;
    if (!taken.includes(name)) return name;
    if (/^y(es)?$/i.test(confirm.ask(`${name} is taken. Replace it? (y/N) `, 'n', ''))) return name;
  }
}

/**
 * Act on what `check()` found, once every link is made: save the name, make
 * the repository on the first machine and start it, or bring the other
 * machines' files down and send this machine's record up.
 *
 * Returns the lines to print, whether the Flow home is in place, and
 * `joined` once another machine's files came down.
 */
function connectHome(at, checked) {
  const lines = [...checked.lines];
  if (checked.name) {
    const why = flowRepo.saveName(checked.name);
    lines.push(why ? `could not save the name: ${why}` : `named: this machine is ${checked.name}`);
  }
  const stop = (why) => {
    lines.push(`stopped: ${why}`);
    return { lines, ok: false };
  };
  const { state } = checked.found;
  try {
    if (checked.make) {
      const said = flowRepo.create(checked.make);
      flowRepo.connect(at, checked.make.url);
      lines.push(`repository: ${said}`);
    }
    flowRepo.writeIgnore(at);
    if (state === 'first') {
      flowRepo.seed(at);
      lines.push('started: your Flow home, sent up so your other machines join it');
    }
    if (state !== 'join') return { lines, ok: true };
    flowRepo.join(at);
  } catch (e) {
    return stop(e.message);
  }
  const { files, from } = checked.found;
  const names = from.length ? ` from ${from.join(', ')}` : '';
  lines.push(`joined: ${files} file${files === 1 ? '' : 's'}${names}, your Flow home as your other machine last sent it`);
  const failed = flowRepo.claim(at);
  if (failed) lines.push(`not sent: this machine's record, which the next flow sync sends. ${failed}`);
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

module.exports = actions;
