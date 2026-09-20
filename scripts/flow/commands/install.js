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
 * This is half of putting Flow on a machine, and the half is links: every one
 * of them points into the clone, and `lib/installed.js` lists what gets made.
 * `lib/machine.js` says which folder holds what. The other half is the skill
 * this prints at the end, `/flow:setup-machine`: it interviews the user, then
 * writes the rule file `~/.agents/AGENTS.md` and the 2 ways in to it, merges
 * Flow's hooks into `~/.claude/settings.json`, and closes the original. A rule
 * file written here would be the template with nothing of the user in it, so
 * this no longer writes one.
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
const { out } = require('../lib/cli');
const { cloneRoot } = require('../lib/clone');
const confirm = require('../lib/confirm');
const flowRepo = require('../lib/flow-repo');
const installed = require('../lib/installed');
const { link, pruneDead, pruneUnlisted, markdownFiles } = require('../lib/links');
const machine = require('../lib/machine');
const originals = require('../lib/originals');
const settings = require('../lib/settings');
const skills = require('../lib/skills');

const actions = {};

actions.install = {
  section: 'setup',
  anywhere: true,
  summary: 'link Flow into ~/.agents, ~/.claude, ~/.codex, ~/.flow and ~/.local/bin',
  flags: {
    root: { arg: '<dir>' },
    'no-bin': { bool: true },
    drafts: { bool: true },
  },
  run({ flags }) {
    const clone = cloneRoot();
    const at = machine.folders(flags.root);
    const show = machine.shorten;
    const done = [];
    const bin = flags['no-bin'] ? null : path.join(at.base, '.local', 'bin');

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
    for (const skill of skills.installable({ drafts: flags.drafts })) {
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
    // ~/.flow/scripts, and a skill reads ~/.flow/references. Claude Code reads
    // neither, which is why they sit outside ~/.claude.
    fs.mkdirSync(at.flow, { recursive: true });
    for (const name of ['scripts', 'references']) {
      link(path.join(clone, name), path.join(at.flow, name));
      done.push(`linked: ${show(path.join(at.flow, name))}`);
    }

    // Where the clone sits, for everything that has to name a file in it by
    // path. /flow:help reads <clone>/docs/manual/README.md from here. It goes
    // in the local file because the path holds this machine alone: the other
    // machine keeps its clone somewhere else, and ~/.flow/settings.json is
    // shared between the two.
    const local = settings.localFile(at.flow);
    settings.write(local, { ...settings.read(local), clone });
    done.push(`wrote: ${show(local)}, clone: ${clone}`);

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

    done.push(...ask(at, clone));
    out(done.join('\n'));

    out(
      `\nOne step left: restart Claude Code, then type /flow:setup-machine.\n` +
      `That skill asks what it needs, writes your rule file ${show(path.join(at.agents, 'AGENTS.md'))},\n` +
      `merges Flow's hooks and permission rules into ${show(path.join(at.claude, 'settings.json'))},\n` +
      `and closes the record of how this machine looked before Flow.\n` +
      `Restart first: settings and skills are both read when a session starts.`
    );

    out(
      `\nEvery skill is typed under the plugin name: /${skills.PLUGIN}:groundwork in Claude Code,\n` +
      `$${skills.PLUGIN}:groundwork in Codex.`
    );

    if (bin) {
      out('\nCheck ~/.local/bin is on your PATH, then every name above works anywhere.');
    }
    return 0;
  },
};

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
