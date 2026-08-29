'use strict';
/**
 * Skills — what exists in the clone, and which of them this project uses.
 *
 * Installing a skill means creating 1 symlink named for the skill. Nothing is
 * copied, so every project shares one file and an edit is live everywhere at
 * once. A symlink cannot be committed — git stores it as this machine's path,
 * and the next machine keeps its clone elsewhere — so the project commits a
 * list of names and `sync` turns the list back into links.
 *
 * Every Flow skill installs globally, so `add` and `sync` are for skills that
 * are not Flow's — one vendored in, or one belonging to a single project. What
 * a session pays for a skill is `skillOverrides` in the project's
 * settings.json, which no command here touches.
 *
 * No `new` and no `drop`. Writing a skill is writing a file in the clone, and
 * removing one from a project is deleting a link, which nothing needs a
 * command to do.
 */

const fs = require('fs');
const path = require('path');
const { FlowError } = require('../lib/error');
const { out } = require('../lib/cli');
const { projectRoot } = require('../lib/root');
const render = require('../lib/render');
const skills = require('../lib/skills');
const { cloneRoot } = require('../lib/clone');
const { link, pruneDead } = require('../lib/links');

/** The project, or null where there is none — `ls` and `get` work anywhere. */
function maybeRoot() {
  try {
    return projectRoot();
  } catch {
    return null;
  }
}

const actions = {};

actions.ls = {
  summary: 'every skill in the clone, and where each one installs',
  run() {
    const root = maybeRoot();
    const global = new Set(skills.readList(skills.globalList()));
    const local = new Set(root ? skills.readList(skills.projectList(root)) : []);

    const rows = [...skills.catalog().values()].map((s) => [
      s.name,
      s.group,
      global.has(s.name) ? 'global' : local.has(s.name) ? 'this project' : '-',
    ]);

    out(render.table(['SKILL', 'GROUP', 'INSTALLED'], rows));
    if (!root) out('\nNo project here, so nothing shows as installed in one.');
    return 0;
  },
};

actions.get = {
  args: '<name>',
  summary: 'print one skill, installed or not',
  run({ positional, usage }) {
    const [name, ...extra] = positional;
    if (!name) throw new FlowError(`usage: ${usage} <name>`);
    if (extra.length) throw new FlowError(`${usage} takes one skill name.`);
    out(fs.readFileSync(path.join(skills.find(name).dir, 'SKILL.md'), 'utf8'));
    return 0;
  },
};

/**
 * `--global` writes the name and stops there.
 *
 * Global links are built by `flow install` and nothing else, so there is one
 * writer for them. `home/skills` is committed with Flow, which makes adding a
 * name a change to Flow rather than to this machine.
 */
actions.add = {
  args: '<name>',
  summary: 'link a skill into this project, and name it in the list',
  flags: { global: { bool: true } },
  run({ positional, flags, usage }) {
    const [name, ...extra] = positional;
    if (!name) throw new FlowError(`usage: ${usage} <name>`);
    if (extra.length) throw new FlowError(`${usage} takes one skill name.`);

    const skill = skills.find(name);
    const globalNames = skills.readList(skills.globalList());

    if (flags.global) {
      const file = skills.globalList();
      if (!skills.addToList(file, name)) {
        out(`${name} was already in ${file}.`);
        return 0;
      }
      out(`${name} → ${file}\n  Run flow install to link it on this machine.`);
      return 0;
    }

    if (globalNames.includes(name)) {
      throw new FlowError(
        `${name} is already installed globally, and a global skill beats a project one silently.\n` +
        `  Every Flow skill is, so this list is for skills that are not Flow's.\n` +
        `  To change what this project pays for ${name}, set skillOverrides in .claude/settings.json.`
      );
    }

    const root = projectRoot();
    link(skill.dir, path.join(skills.projectLinks(root), name));
    const added = skills.addToList(skills.projectList(root), name);
    out(`${name} → .claude/skills/${name}` + (added ? `\n  named in .claude/flow/skills` : ''));
    return 0;
  },
};

/**
 * The 1 command a fresh clone of a project needs.
 *
 * A name whose skill is gone warns and the rest still link. Refusing outright
 * would mean 1 stale line blocks a whole clone from being set up, and the
 * repair belongs to whoever edits the list.
 */
actions.sync = {
  summary: 'rebuild this project\'s links from its list',
  run() {
    const root = projectRoot();
    const dir = skills.projectLinks(root);
    const names = skills.readList(skills.projectList(root));
    const catalog = skills.catalog();

    const pruned = pruneDead(dir, cloneRoot());
    const linked = [];
    const missing = [];

    for (const name of names) {
      const skill = catalog.get(name);
      if (!skill) { missing.push(name); continue; }
      link(skill.dir, path.join(dir, name));
      linked.push(name);
    }

    for (const name of pruned) out(`unlinked (gone): ${name}`);
    for (const name of linked) out(`linked: ${name}`);
    if (!names.length) out('nothing named in .claude/flow/skills — no links to build.');

    for (const name of missing) {
      process.stderr.write(
        `flow: "${name}" is named in .claude/flow/skills and no skill has that name.\n`
      );
    }
    return 0;
  },
};

module.exports = {
  summary: 'what exists in the clone, and what this project uses',
  default: 'get',
  actions,
};
