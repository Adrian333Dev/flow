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
 *
 * Two roots, and a flag each. `--home` is what Claude Code reads: CLAUDE.md,
 * settings.json, skills/, agents/ and rules/. `--flow-home` is what only Flow reads:
 * scripts/ and references/, which the hooks and the skills name by path.
 * Both matter to the scratch session in lab/scripts/try.sh, which redirects
 * the whole install into tmp/ and would otherwise write half of it into the
 * real ~/.flow. Passing one alone is refused for that reason: a redirect that
 * covers half the install is the accident, never the intent.
 *
 * Which skills link is read off the tree: every group except `drafts/`, which
 * `--drafts` adds back for the scratch session. There is no list to keep in
 * step, so a skill is typeable the moment its folder exists.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { out } = require('../lib/cli');
const { cloneRoot } = require('../lib/clone');
const { FlowError } = require('../lib/error');
const { link, pruneDead, markdownFiles } = require('../lib/links');
const skills = require('../lib/skills');

/**
 * The one script typed as a command, linked twice. The link drops the
 * extension, and `fw` is the second name, because `flow` is typed all day.
 *
 * `gsave`, `ptree` and `fmerge` all left on 2026-08-30, into the `util` repo as
 * `git save`, `fs tree` and `fs merge`. `util install` owns those links now.
 */
const BIN = {
  flow: path.join('flow', 'flow.js'),
  fw: path.join('flow', 'flow.js'),
};

const actions = {};

actions.install = {
  section: 'setup',
  summary: 'link Flow into ~/.claude, ~/.flow and ~/.local/bin',
  flags: {
    home: { arg: '<path>' },
    'flow-home': { arg: '<path>' },
    'no-bin': { bool: true },
    drafts: { bool: true },
  },
  run({ flags }) {
    // Redirect both roots or neither. One flag on its own leaves the other
    // root at the real machine, which is how a scratch run installs Flow for
    // real without saying so.
    const ROOTS = { home: '~/.claude', 'flow-home': '~/.flow' };
    const given = Object.keys(ROOTS).filter((f) => flags[f]);
    if (given.length === 1) {
      const [missing] = Object.keys(ROOTS).filter((f) => !flags[f]);
      throw new FlowError(
        `--${given[0]} was passed without --${missing}, so ${ROOTS[missing]} would be written for real.\n` +
        'Pass both, or neither.'
      );
    }

    const clone = cloneRoot();
    const home = path.resolve(flags.home || path.join(os.homedir(), '.claude'));
    const flowHome = path.resolve(flags['flow-home'] || path.join(os.homedir(), '.flow'));
    const done = [];

    // Per item, never per folder: all three hold entries Flow does not own.
    for (const dir of ['skills', 'agents', 'rules']) {
      fs.mkdirSync(path.join(home, dir), { recursive: true });
      for (const gone of pruneDead(path.join(home, dir), clone)) {
        done.push(`unlinked (gone): ${dir}/${gone}`);
      }
    }

    for (const skill of skills.installable({ drafts: flags.drafts })) {
      link(skill.dir, path.join(home, 'skills', skill.name));
      done.push(`linked: skills/${skill.name}`);
    }

    for (const file of markdownFiles(path.join(clone, 'agents'))) {
      link(path.join(clone, 'agents', file), path.join(home, 'agents', file));
      done.push(`linked: agents/${file}`);
    }

    for (const file of markdownFiles(path.join(clone, 'rules'))) {
      link(path.join(clone, 'rules', file), path.join(home, 'rules', file));
      done.push(`linked: rules/${file}`);
    }

    // Named by path rather than typed: settings.json points hooks at
    // ~/.flow/scripts, and a skill reads ~/.flow/references. Claude Code reads
    // neither, which is why they sit outside ~/.claude.
    fs.mkdirSync(flowHome, { recursive: true });
    link(path.join(clone, 'scripts'), path.join(flowHome, 'scripts'));
    done.push(`linked: ${path.join(flowHome, 'scripts')}`);
    link(path.join(clone, 'references'), path.join(flowHome, 'references'));
    done.push(`linked: ${path.join(flowHome, 'references')}`);

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
