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
 * Almost everything is a link into the clone. What is not has one real copy,
 * in `~/.agents/`, and each harness reaches that copy the way it can:
 *
 *   ~/.agents/AGENTS.md         the rule file, copied from home/AGENTS.md only
 *                               when there is none, because it is yours to edit
 *   ~/.claude/CLAUDE.md         one line importing it, written only when absent
 *   ~/.codex/AGENTS.md          a link to it: Codex has no import
 *   ~/.agents/skills/flow/      the plugin folder: a copy of the manifest in
 *                               skills/.claude-plugin/, rewritten every run,
 *                               and one link per skill
 *   ~/.claude/skills/flow       a link to that folder: Claude Code never reads
 *                               ~/.agents/skills/, and Codex reads nothing else
 *
 * `lib/machine.js` says which folder holds what.
 *
 * It stops short of `settings.json`. Merging Flow's keys into a file already
 * holding your model, your effort level and your plugins is a judgment call,
 * so this prints the file to merge and leaves it alone.
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
const path = require('path');
const { out } = require('../lib/cli');
const { cloneRoot } = require('../lib/clone');
const { link, pruneDead, markdownFiles } = require('../lib/links');
const machine = require('../lib/machine');
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

    if (!flags['no-bin']) {
      const bin = path.join(at.base, '.local', 'bin');
      for (const [name, file] of Object.entries(BIN)) {
        link(path.join(clone, 'scripts', file), path.join(bin, name));
        done.push(`linked: ${show(path.join(bin, name))}`);
      }
    }

    done.push(...installRules(clone, at));

    out(done.join('\n'));

    out(
      `\nOne step left, by hand: merge ${path.join(clone, 'home', 'settings.json')}\n` +
      `into ${path.join(at.claude, 'settings.json')}. It carries the permission rules, the\n` +
      `PreToolUse hook and a few feature flags; ${path.join(clone, 'docs', 'manual', 'settings.md')} explains every key.\n` +
      `Merged rather than copied, because your settings hold things Flow should not own.\n` +
      `Restart Claude Code afterwards: settings load at startup.`
    );

    out(
      `\nEvery skill is typed under the plugin name: /${skills.PLUGIN}:groundwork in Claude Code,\n` +
      `$${skills.PLUGIN}:groundwork in Codex. Both read the skills at startup, so a new skill needs a restart too.`
    );

    if (!flags['no-bin']) {
      out('\nCheck ~/.local/bin is on your PATH, then every name above works anywhere.');
    }
    return 0;
  },
};

/** True when a file exists and holds only whitespace. */
const blank = (file) => fs.readFileSync(file, 'utf8').trim() === '';

/**
 * The rule file, and the 2 ways in to it.
 *
 * The template and the copy in ~/.agents drift apart on purpose: one is public
 * and holds placeholders, the other is yours and holds your profile. So each
 * of the 3 is written only where nothing is there yet, or where an empty file
 * is, and never over anything you wrote. An empty file counts as nothing,
 * because a fresh Claude Code install can leave an empty CLAUDE.md behind.
 */
function installRules(clone, at) {
  const done = [];
  const show = machine.shorten;
  const rules = path.join(at.agents, 'AGENTS.md');
  const claudeRules = path.join(at.claude, 'CLAUDE.md');
  const codexRules = path.join(at.codex, 'AGENTS.md');
  const line = machine.importLine(at.base);

  if (fs.existsSync(rules) && !blank(rules)) {
    done.push(`kept: ${show(rules)}, yours, already here`);
  } else {
    fs.mkdirSync(at.agents, { recursive: true });
    fs.copyFileSync(path.join(clone, 'home', 'AGENTS.md'), rules);
    done.push(`copied: ${show(rules)}`);
  }

  if (!fs.existsSync(claudeRules) || blank(claudeRules)) {
    fs.writeFileSync(claudeRules, `${line}\n`);
    done.push(`wrote: ${show(claudeRules)}, one line importing ${show(rules)}`);
  } else if (fs.readFileSync(claudeRules, 'utf8').split('\n').some((l) => l.trim() === line)) {
    done.push(`kept: ${show(claudeRules)}, already importing ${show(rules)}`);
  } else {
    done.push(
      `kept: ${show(claudeRules)}, yours, and it does not import ${show(rules)}.\n` +
      `  Move what it holds into ${show(rules)}, then make its first line: ${line}`
    );
  }

  let existing = null;
  try {
    existing = fs.lstatSync(codexRules);
  } catch {
    // Nothing there, so the link goes in.
  }
  if (existing && !existing.isSymbolicLink() && !blank(codexRules)) {
    done.push(
      `kept: ${show(codexRules)}, yours, so Codex reads it instead of ${show(rules)}.\n` +
      `  Move what it holds into ${show(rules)}, delete it, and run flow install again.`
    );
  } else {
    if (existing && !existing.isSymbolicLink()) fs.unlinkSync(codexRules);
    link(rules, codexRules);
    done.push(`linked: ${show(codexRules)}`);
  }
  return done;
}

module.exports = actions;
