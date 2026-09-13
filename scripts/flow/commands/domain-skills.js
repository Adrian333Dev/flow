'use strict';
/**
 * Domain skills: skills from the `domain-skills` repository, installed into one
 * project at a time.
 *
 * A domain skill carries knowledge about one field or tool, such as React. It
 * never installs on the machine, because its description would then load in
 * every session there, React in a Python project included. `add` links it into
 * `<project>/.claude/skills/<name>`, so only the project using it pays.
 *
 * A link rather than a copy, so a merge into the repository reaches every
 * project that installed the skill the moment the clone is pulled.
 *
 * git ignores the link, since it holds this machine's path and would load
 * nothing anywhere else. So `add` and `drop` also keep `.flow/domain-skills.txt`,
 * committed, one name per line, and a bare `add` links every name on it. That
 * is how a second machine, a fresh clone or a new worktree gets them back.
 *
 * The repository is found through `domainSkills` in `~/.flow/settings.json`: the
 * path to the clone's `skills/` folder. Nothing else reads that setting.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { out } = require('../lib/cli');
const { FlowError } = require('../lib/error');
const frontmatter = require('../lib/frontmatter');
const { link } = require('../lib/links');
const { projectRoot } = require('../lib/root');
const render = require('../lib/render');
const settings = require('../lib/settings');
const { subdirs } = require('../lib/skills');

const LIST = path.join('.flow', 'domain-skills.txt');

/** The project, or null where there is none: `ls` works anywhere. */
function maybeRoot() {
  try {
    return projectRoot();
  } catch {
    return null;
  }
}

/** The repository's `skills/` folder, or a refusal saying what to set. */
function repoSkills() {
  const file = settings.globalFile();
  const value = settings.read(file).domainSkills;
  if (typeof value !== 'string' || !value.trim()) {
    throw new FlowError(
      `no domainSkills in ${file}, so there is no repository to read.\n` +
      '  Set it to the skills folder of your clone: "domainSkills": "~/code/domain-skills/skills"'
    );
  }
  const dir = path.resolve(value.replace(/^~(?=$|\/)/, os.homedir()));
  if (!fs.existsSync(dir)) {
    throw new FlowError(`domainSkills in ${file} points at ${dir}, which does not exist.`);
  }
  return dir;
}

/** Every skill in the repository, keyed by name, with its description. */
function catalog(repo) {
  const found = new Map();
  for (const name of subdirs(repo)) {
    const file = path.join(repo, name, 'SKILL.md');
    if (!fs.existsSync(file)) continue;
    const { data } = frontmatter.parse(fs.readFileSync(file, 'utf8'));
    found.set(name, { name, dir: path.join(repo, name), description: String(data.description || '') });
  }
  return found;
}

function readList(root) {
  const file = path.join(root, LIST);
  try {
    return fs.readFileSync(file, 'utf8').split('\n').map((l) => l.trim()).filter(Boolean);
  } catch (e) {
    if (e.code === 'ENOENT') return [];
    throw new FlowError(`${file} exists and could not be read: ${e.message}`);
  }
}

/** Sorted, so the file never records the order skills were added in. Empty deletes it. */
function writeList(root, names) {
  const file = path.join(root, LIST);
  const sorted = [...new Set(names)].sort();
  if (!sorted.length) {
    fs.rmSync(file, { force: true });
    return;
  }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, sorted.join('\n') + '\n');
}

/** Where a link into the project points, or null when nothing or a real folder sits there. */
function linkTarget(to) {
  try {
    return fs.lstatSync(to).isSymbolicLink() ? fs.readlinkSync(to) : null;
  } catch {
    return null;
  }
}

function checkNames(names) {
  for (const name of names) {
    if (name.includes('/') || name.includes(path.sep)) {
      throw new FlowError(`"${name}" is a skill name, not a path.`);
    }
  }
}

const actions = {};

actions.ls = {
  args: '[words...]',
  summary: 'every skill in the repository, or the ones matching every word',
  run({ positional }) {
    const repo = repoSkills();
    const root = maybeRoot();
    const listed = root ? readList(root) : [];

    const words = positional.map((w) => w.toLowerCase());
    const rows = [...catalog(repo).values()].filter((s) => {
      const text = `${s.name} ${s.description}`.toLowerCase();
      return words.every((w) => text.includes(w));
    });

    if (!rows.length) {
      out(words.length ? `no domain skills match "${positional.join(' ')}".` : `no skills in ${repo}.`);
      return 0;
    }

    // Both halves are shown apart, because each has its own fix: a listed
    // skill with no link needs a bare add, a link nobody listed needs add <name>.
    const here = (name) => {
      if (!root) return '-';
      const linked = linkTarget(path.join(root, '.claude', 'skills', name)) === path.join(repo, name);
      const isListed = listed.includes(name);
      if (linked && isListed) return 'added';
      if (isListed) return 'not linked';
      if (linked) return 'not listed';
      return '-';
    };

    out(render.table(['SKILL', 'HERE', 'DESCRIPTION'], rows.map((s) => [s.name, here(s.name), s.description])));
    if (!root) out('\nNo project here, so nothing is added anywhere.');
    return 0;
  },
};

/**
 * A name the repository lacks never stops the others linking. On a second
 * machine whose clone is behind, one skill missing from the pull should cost
 * that one skill, not every link the project has.
 */
actions.add = {
  args: '[name...]',
  summary: 'link skills into this project; with no name, every skill it lists',
  run({ positional }) {
    checkNames(positional);
    const root = projectRoot();
    const repo = repoSkills();
    const known = catalog(repo);
    const listed = readList(root);
    const names = positional.length ? positional : listed;

    if (!names.length) {
      out(`${LIST} lists no skills, so there is nothing to link.\n  Name one: flow domain-skills add <name>`);
      return 0;
    }

    const skillsDir = path.join(root, '.claude', 'skills');
    const hadFolder = fs.existsSync(skillsDir);
    const linked = [];
    const problems = [];

    for (const name of names) {
      const skill = known.get(name);
      if (!skill) {
        problems.push(`no skill named "${name}" in ${repo}. Pull the clone, or remove it: flow domain-skills drop ${name}`);
        continue;
      }
      try {
        link(skill.dir, path.join(skillsDir, name));
        linked.push(name);
      } catch (e) {
        if (!(e instanceof FlowError)) throw e;
        problems.push(e.message);
      }
    }

    writeList(root, [...listed, ...linked]);
    if (linked.length) out(linked.map((n) => `linked: .claude/skills/${n}`).join('\n'));
    if (linked.length && !hadFolder) {
      out('\nRestart Claude Code in this project: it only watches a skills folder that existed when the session started.');
    }
    if (problems.length) throw new FlowError(problems.join('\n'));
    return 0;
  },
};

/**
 * Only a link into the repository is removed. `.claude/skills/` also holds a
 * project's own skills as real folders, and links this command never made.
 */
actions.drop = {
  args: '<name...>',
  summary: 'remove skills from this project',
  run({ positional, usage }) {
    if (!positional.length) throw new FlowError(`usage: ${usage} <name...>`);
    checkNames(positional);
    const root = projectRoot();
    const repo = repoSkills();
    const listed = readList(root);
    const dropped = [];
    const problems = [];

    for (const name of positional) {
      const to = path.join(root, '.claude', 'skills', name);
      const target = linkTarget(to);
      if (target && target.startsWith(repo + path.sep)) {
        fs.unlinkSync(to);
        dropped.push(name);
      } else if (target) {
        problems.push(`.claude/skills/${name} links to ${target}, outside ${repo}: left alone.`);
      } else if (fs.existsSync(to)) {
        problems.push(`.claude/skills/${name} is a real folder, not a link: left alone.`);
      } else if (listed.includes(name)) {
        dropped.push(name);
      } else {
        problems.push(`"${name}" is neither linked nor listed in this project.`);
      }
    }

    writeList(root, listed.filter((n) => !dropped.includes(n)));
    if (dropped.length) out(dropped.map((n) => `dropped: ${n}`).join('\n'));
    if (problems.length) throw new FlowError(problems.join('\n'));
    return 0;
  },
};

module.exports = {
  summary: 'skills from the domain-skills repository, added to one project',
  default: 'ls',
  actions,
};
