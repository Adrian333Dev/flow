'use strict';
/**
 * Skills linked in from a folder outside the clone: the domain-skills
 * repository, and `~/.flow/private-skills/`.
 *
 * Both commands keep 3 things in step: a source folder holding one skill per
 * folder, a list file naming the skills added, and one link per name in a
 * skills folder Claude Code reads. A link holds this machine's path, so the
 * list is what travels to a second machine, and an add with no names relinks
 * every name on it.
 *
 * A command replaces or removes only a link it could have made: one into its
 * source, or one whose target is gone. A clone that moved leaves only dead
 * links, and add has to be able to fix them. A live link anywhere else came
 * from another installer and is left alone.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { out } = require('./cli');
const { FlowError } = require('./error');
const frontmatter = require('./frontmatter');
const { projectRoot } = require('./root');
const settings = require('./settings');
const { subdirs } = require('./skills');

/** The project, or null where there is none: `ls` works anywhere. */
function maybeRoot() {
  try {
    return projectRoot();
  } catch {
    return null;
  }
}

/** A path under the home folder written with `~`, for output. */
const shorten = (p) => (p.startsWith(os.homedir() + path.sep) ? '~' + p.slice(os.homedir().length) : p);

/**
 * `domainSkills`: the file it sits in, whether it is set, and the folder it
 * names with a leading `~` expanded.
 *
 * It holds the path to a clone, so it belongs in `~/.flow/settings.local.json`,
 * which stays on this machine. `~/.flow/settings.json` beside it is shared with
 * the other machine, where that path is somebody else's. A value in either is
 * read, and the local one wins.
 */
function domainSetting() {
  const { file, value } = settings.globalKey('domainSkills');
  const set = typeof value === 'string' && value.trim() !== '';
  return { file, set, dir: set ? path.resolve(value.replace(/^~(?=$|\/)/, os.homedir())) : null };
}

/** Every skill in a source folder, keyed by name, with its description. */
function readSource(source) {
  const found = new Map();
  for (const name of subdirs(source)) {
    const file = path.join(source, name, 'SKILL.md');
    if (!fs.existsSync(file)) continue;
    const { data } = frontmatter.parse(fs.readFileSync(file, 'utf8'));
    found.set(name, { name, dir: path.join(source, name), description: String(data.description || '') });
  }
  return found;
}

function readList(file) {
  try {
    return fs.readFileSync(file, 'utf8').split('\n').map((l) => l.trim()).filter(Boolean);
  } catch (e) {
    if (e.code === 'ENOENT') return [];
    throw new FlowError(`${file} exists and could not be read: ${e.message}`);
  }
}

/** Sorted, so the file never records the order skills were added in. Empty deletes it. */
function writeList(file, names) {
  const sorted = [...new Set(names)].sort();
  if (!sorted.length) {
    fs.rmSync(file, { force: true });
    return;
  }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, sorted.join('\n') + '\n');
}

/** Where a link points, or null when nothing or a real folder sits there. */
function linkTarget(to) {
  try {
    return fs.lstatSync(to).isSymbolicLink() ? fs.readlinkSync(to) : null;
  } catch {
    return null;
  }
}

/**
 * What sits where a skill's link goes: `missing`, `ours` (a live link into the
 * source), `dead` (a link to nothing), `elsewhere` (a live link somewhere
 * else) or `folder` (a real file or folder).
 */
function slot(to, source) {
  let stat;
  try {
    stat = fs.lstatSync(to);
  } catch {
    return { state: 'missing' };
  }
  if (!stat.isSymbolicLink()) return { state: 'folder' };
  const target = fs.readlinkSync(to);
  if (!fs.existsSync(to)) return { state: 'dead', target };
  if (target.startsWith(source + path.sep)) return { state: 'ours', target };
  return { state: 'elsewhere', target };
}

/** Refuses a path passed where a name belongs. Run before anything is read. */
function checkNames(names) {
  for (const name of names) {
    if (name.includes('/') || name.includes(path.sep)) {
      throw new FlowError(`"${name}" is a skill name, not a path.`);
    }
  }
}

/**
 * What `ls` prints in a place's column: `added`, `not linked`, `not listed`
 * or `-`. The two halves are shown apart because each has its own fix: a listed
 * skill with no link needs a bare add, a link nobody listed needs add <name>.
 */
function placeState({ name, source, skillsDir, listed }) {
  const linked = linkTarget(path.join(skillsDir, name)) === path.join(source, name);
  const isListed = listed.includes(name);
  if (linked && isListed) return 'added';
  if (isListed) return 'not linked';
  if (linked) return 'not listed';
  return '-';
}

/**
 * Where skills get added: a project or the machine.
 *
 *   skillsDir  the folder Claude Code reads the links from
 *   list       the file naming what was added
 *   where      "in this project" or "on this machine", for messages
 *   show       a path as the output prints it
 */
function project(root, listName) {
  return {
    skillsDir: path.join(root, '.claude', 'skills'),
    list: path.join(root, '.flow', listName),
    where: 'in this project',
    show: (p) => path.relative(root, p),
  };
}

/**
 * Link each name into `place.skillsDir` and add it to `place.list`. No names
 * links every listed one. A name that fails never stops the others: on a
 * second machine whose clone is behind, one skill missing from the pull should
 * cost that one skill, not every link.
 *
 * `refuse(name)` returns a reason a name may not be linked, or null. `flag`
 * is appended to the commands a message suggests, such as ` --global`.
 */
function addSkills({ names, source, known, place, command, flag = '', refuse = () => null }) {
  const listed = readList(place.list);
  const wanted = names.length ? names : listed;

  if (!wanted.length) {
    out(`${place.show(place.list)} lists no skills, so there is nothing to link.\n  Name one: ${command} add <name>${flag}`);
    return 0;
  }

  const hadFolder = fs.existsSync(place.skillsDir);
  const linked = [];
  const problems = [];

  for (const name of wanted) {
    const skill = known.get(name);
    const reason = refuse(name);
    const to = path.join(place.skillsDir, name);
    const at = slot(to, source);
    if (reason) {
      problems.push(reason);
    } else if (!skill) {
      problems.push(`no skill named "${name}" in ${shorten(source)}. Pull the latest, or remove it: ${command} drop ${name}${flag}`);
    } else if (at.state === 'folder') {
      problems.push(`${place.show(to)} is a real folder, not a link: left alone.`);
    } else if (at.state === 'elsewhere') {
      problems.push(`${place.show(to)} links to ${shorten(at.target)}, which ${command} never made: left alone.`);
    } else {
      if (at.state !== 'missing') fs.unlinkSync(to);
      fs.mkdirSync(place.skillsDir, { recursive: true });
      fs.symlinkSync(skill.dir, to);
      linked.push(name);
    }
  }

  writeList(place.list, [...listed, ...linked]);
  if (linked.length) out(linked.map((n) => `linked: ${place.show(path.join(place.skillsDir, n))}`).join('\n'));
  if (linked.length && !hadFolder) {
    out(`\nRestart Claude Code: it only watches a skills folder that existed when the session started.`);
  }
  if (problems.length) throw new FlowError(problems.join('\n'));
  return 0;
}

/**
 * Remove each name's link and its line. `place.skillsDir` also holds a
 * project's own skills as real folders, and links from other installers, and
 * both are left alone.
 */
function dropSkills({ names, source, place }) {
  const listed = readList(place.list);
  const dropped = [];
  const problems = [];

  for (const name of names) {
    const to = path.join(place.skillsDir, name);
    const at = slot(to, source);
    if (at.state === 'ours' || at.state === 'dead') {
      fs.unlinkSync(to);
      dropped.push(name);
    } else if (at.state === 'elsewhere') {
      problems.push(`${place.show(to)} links to ${shorten(at.target)}, outside ${shorten(source)}: left alone.`);
    } else if (at.state === 'folder') {
      problems.push(`${place.show(to)} is a real folder, not a link: left alone.`);
    } else if (listed.includes(name)) {
      dropped.push(name);
    } else {
      problems.push(`"${name}" is neither linked nor listed ${place.where}.`);
    }
  }

  writeList(place.list, listed.filter((n) => !dropped.includes(n)));
  if (dropped.length) out(dropped.map((n) => `dropped: ${n}`).join('\n'));
  if (problems.length) throw new FlowError(problems.join('\n'));
  return 0;
}

/** The skills whose name or description holds every word, ignoring case. */
function matching(known, words) {
  const lower = words.map((w) => w.toLowerCase());
  return [...known.values()].filter((s) => {
    const text = `${s.name} ${s.description}`.toLowerCase();
    return lower.every((w) => text.includes(w));
  });
}

module.exports = {
  maybeRoot, shorten, project, checkNames, domainSetting, readSource, readList, linkTarget, placeState, matching, addSkills, dropSkills,
};
