'use strict';
/**
 * Put Flow on this machine — every symlink, in one idempotent pass.
 *
 * Run it once by path on a fresh machine, because `flow` is not a command
 * until this has made it one:
 *
 *   node <clone>/scripts/flow/flow.js install
 *
 * Everything after that is `flow install`, and re-running it is how a new
 * skill, a renamed command or a moved clone reaches this machine. Nothing is
 * ever copied except the global `CLAUDE.md`, which is yours to edit and so is
 * written only when absent.
 *
 * It stops short of `settings.json`. Merging Flow's keys into a file already
 * holding your model, your effort level and your plugins is a judgment call,
 * so this prints the file to merge and leaves it alone.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { out } = require('../lib/cli');
const { cloneRoot } = require('../lib/clone');
const { link, pruneDead, markdownFiles } = require('../lib/links');
const skills = require('../lib/skills');

/**
 * The 4 scripts typed as commands. The link drops the extension, and `flow`
 * gets a second one under `fw`, because it is the one typed all day.
 */
const BIN = {
  ptree: 'ptree.js',
  fmerge: 'fmerge.js',
  gsave: 'gsave.sh',
  flow: path.join('flow', 'flow.js'),
  fw: path.join('flow', 'flow.js'),
};

const actions = {};

actions.install = {
  section: 'setup',
  summary: 'link Flow into ~/.claude and ~/.local/bin',
  flags: {
    home: { arg: '<path>' },
    'no-bin': { bool: true },
  },
  run({ flags }) {
    const clone = cloneRoot();
    const home = path.resolve(flags.home || path.join(os.homedir(), '.claude'));
    const done = [];

    // Per item, never per folder: both hold entries Flow does not own.
    const named = new Set(skills.readList(skills.globalList()));
    const catalog = skills.catalog();
    const unknown = [...named].filter((n) => !catalog.has(n));

    for (const dir of ['skills', 'agents']) {
      fs.mkdirSync(path.join(home, dir), { recursive: true });
      for (const gone of pruneDead(path.join(home, dir), clone)) {
        done.push(`unlinked (gone): ${dir}/${gone}`);
      }
    }

    for (const name of named) {
      const skill = catalog.get(name);
      if (!skill) continue;
      link(skill.dir, path.join(home, 'skills', name));
      done.push(`linked: skills/${name}`);
    }

    for (const file of markdownFiles(path.join(clone, 'agents'))) {
      link(path.join(clone, 'agents', file), path.join(home, 'agents', file));
      done.push(`linked: agents/${file}`);
    }

    // Named by path rather than typed: settings.json points hooks at
    // ~/.claude/scripts, and a skill reads ~/.claude/flow/references.
    link(path.join(clone, 'scripts'), path.join(home, 'scripts'));
    done.push('linked: scripts');
    link(path.join(clone, 'references'), path.join(home, 'flow', 'references'));
    done.push('linked: flow/references');

    if (!flags['no-bin']) {
      const bin = path.join(os.homedir(), '.local', 'bin');
      for (const [name, file] of Object.entries(BIN)) {
        link(path.join(clone, 'scripts', file), path.join(bin, name));
        done.push(`linked: ~/.local/bin/${name}`);
      }
    }

    // The template and the copy at ~/.claude drift apart on purpose: one is
    // public and holds placeholders, the other is yours and holds your
    // profile. Overwriting would take the second one away.
    const rules = path.join(home, 'CLAUDE.md');
    if (fs.existsSync(rules)) {
      done.push(`kept: CLAUDE.md — yours, already here`);
    } else {
      fs.copyFileSync(path.join(clone, 'home', 'CLAUDE.md'), rules);
      done.push('copied: CLAUDE.md');
    }

    out(done.join('\n'));

    for (const name of unknown) {
      process.stderr.write(`flow: "${name}" is named in home/skills and no skill has that name.\n`);
    }

    out(
      `\nOne step left, by hand: merge ${path.join(clone, 'home', 'settings.json')}\n` +
      `into ${path.join(home, 'settings.json')}. It carries the permission rules, the\n` +
      `PreToolUse hook and a few feature flags; ${path.join(clone, 'home', 'settings.md')} explains every key.\n` +
      `Merged rather than copied, because your settings hold things Flow should not own.\n` +
      `Restart Claude Code afterwards — settings load at startup.`
    );

    if (!flags['no-bin']) {
      out('\nCheck ~/.local/bin is on your PATH, then every name above works anywhere.');
    }
    return 0;
  },
};

module.exports = actions;
