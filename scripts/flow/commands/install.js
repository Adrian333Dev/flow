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
 * lists. `lib/machine.js` says which folder holds what. The other half is the
 * skill this prints at the end, `/flow:setup-machine`: it writes the rule file
 * `~/.agents/AGENTS.md` and the import line, merges Flow's hooks into
 * `~/.claude/settings.json`, and closes the original. A rule file written here
 * would be the template with nothing of the user in it, so this writes none.
 *
 * Every clone lives in `~/.flow/repos/`. Flow's own is `repos/flow`, a link
 * where this clone sits somewhere else. util, the toolbox and every skill
 * repository in `sources` are cloned when missing, and a clone that fails is
 * a warning: running install again changes nothing that exists, so it is
 * always the fix. util gets its names through its own `util install`.
 * `--no-clone` skips all 3, for the tests and the scratch session.
 *
 * On a machine where setup already finished, `~/.flow/version` exists and the
 * run ends without sending the user to setup again.
 *
 * Before it creates anything, the first run writes the machine's original: a
 * copy of every path it is about to make, as that path was before Flow.
 * `flow restore machine` puts all of them back, `~/.local/bin/flow` included.
 *
 * At a terminal it asks 2 questions, this machine's name and the GitHub
 * repository that carries `~/.flow/` to a second machine. Run where nobody is
 * at the keyboard it asks neither and says so.
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
    const show = machine.shorten;
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

    done.push(...ask(at, clone));
    history.record(at.flow, { type: 'install', clone });
    out(done.join('\n'));

    if (setUp) {
      out('\nFlow is already set up on this machine, so there is nothing more to do.');
      return 0;
    }

    out(
      `\nOne step left: restart Claude Code, then type /flow:setup-machine.\n` +
      `That skill lists every change in one form for you to check, writes your rule file ${show(path.join(at.agents, 'AGENTS.md'))},\n` +
      `merges Flow's hooks and permission rules into ${show(path.join(at.claude, 'settings.json'))},\n` +
      `and closes the record of how this machine looked before Flow.\n` +
      `Restart first: settings and skills are both read when a session starts.`
    );

    out(`\nEvery skill is typed under the plugin name: /${skills.PLUGIN}:groundwork.`);

    if (bin) {
      out('\nCheck ~/.local/bin is on your PATH, then every name above works anywhere.');
    }
    return 0;
  },
};

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
 * The 2 questions, asked at a terminal and skipped anywhere else.
 *
 * Skipped rather than answered by default, because Enter on the second one
 * makes a repository on GitHub. A default nobody typed must never do that, and
 * a test never has a terminal.
 *
 * Neither answer can fail the install. Every link is already made by the time
 * these are asked, so a `gh` that is not logged in reports itself as a line in
 * the output and the machine is still installed.
 */
function ask(at, clone) {
  const done = [];
  if (!confirm.hasTerminal()) {
    done.push(
      'asked nothing: no terminal here, so this machine has no name and no repository.\n' +
      `  Run node ${path.join(clone, 'scripts', 'flow', 'flow.js')} install from a terminal to answer both.`
    );
    return done;
  }

  const already = flowRepo.machineName(at);
  const suggested = already || suggestName();
  const name = confirm.ask(
    `\nA name for this machine, so work sent to the other one says where it came from [${suggested}]: `,
    suggested
  );
  if (name === already) done.push(`kept: this machine is called ${name}`);
  else {
    const set = flowRepo.git(at.flow, ['config', '--global', 'util.machine', name]);
    done.push(set.ok ? `named: this machine is ${name}` : `could not save the name: ${set.err}`);
  }

  const answer = confirm.ask(
    '\n~/.flow/ holds your rules, notes, study cases and the tickets that belong to no\n' +
    'project. One private GitHub repository is how a second machine gets them.\n' +
    '  Enter      make one now with gh, private\n' +
    '  <address>  use a repository you already made\n' +
    '  skip       leave ~/.flow/ on this machine alone\n' +
    'Which: ',
    'new'
  );
  if (answer === 'skip') {
    done.push('skipped: ~/.flow/ stays on this machine. flow install again to give it a repository');
    return done;
  }
  try {
    done.push(`repository: ${flowRepo.start(at, answer)}`);
    done.push('send it up and bring the other machine\'s down with flow sync');
  } catch (e) {
    done.push(e.message);
  }
  return done;
}

module.exports = actions;
