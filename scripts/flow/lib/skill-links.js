'use strict';
/**
 * Every skill Flow can switch, which ones are on, and the one step that makes
 * the links match.
 *
 * A skill comes from one of 3 places, each a source in `flow skills ls`:
 *
 *   flow      Flow's own, in this clone, linked into the plugin folder
 *             `~/.agents/skills/flow/skills/`
 *   private   `~/.flow/private-skills/<name>/`, the user's own
 *   a source  a skill repository cloned into `~/.flow/repos/sources/`, the
 *             domain-skills repository being the first
 *
 * Whether one is on is a line in a settings file, `"skills": { "react": "on" }`.
 * The 3 files are 3 levels, and the nearest line wins, name by name:
 *
 *   project  <project>/.flow/settings.json
 *   machine  ~/.flow/settings.local.json
 *   global   ~/.flow/settings.json, every machine through `flow sync`
 *
 * A name no file mentions starts off, being a library to pick from. So the
 * files hold only what the user switched.
 *
 * Flow's essential skills, every one outside `skills/dev/`, are the workflow
 * itself: always linked, whatever a line says. `on` and `off` refuse them,
 * `ls` leaves them out, and `flow doctor` reports a line naming one.
 *
 * A skill is on when its link exists, and nothing else switches one. `apply`
 * makes every link match the settings, and every command that can change them
 * runs it, the session-start hook included. A link is Flow's to add or remove
 * only when it points into a source or the private folder: a real folder, or a
 * link another installer made, is left alone and reported.
 *
 * A project cannot hide a skill linked for the whole machine: that link loads
 * in every session. `off` refuses that case rather than write a line nothing
 * obeys.
 */

const fs = require('fs');
const path = require('path');
const { FlowError } = require('./error');
const frontmatter = require('./frontmatter');
const { shorten } = require('./machine');
const repos = require('./repos');
const settings = require('./settings');
const skills = require('./skills');

const LEVELS = ['project', 'machine', 'global'];

/** The settings file one level writes to. */
function levelFile(level, { home, root }) {
  if (level === 'global') return settings.globalFile(home);
  if (level === 'machine') return settings.localFile(home);
  return settings.projectFile(root);
}

/** The `skills` object in one file, keeping only `on` and `off`. */
function linesIn(file) {
  const found = settings.read(file).skills;
  const kept = {};
  if (found && typeof found === 'object' && !Array.isArray(found)) {
    for (const [name, state] of Object.entries(found)) if (state === 'on' || state === 'off') kept[name] = state;
  }
  return kept;
}

/**
 * Every line in force, name by name: `{ state, level }`. `levels` limits the
 * files read, so the machine's own view leaves the project out.
 */
function lines({ home, root, levels = LEVELS }) {
  const found = new Map();
  for (const level of [...LEVELS].reverse()) {
    if (!levels.includes(level) || (level === 'project' && !root)) continue;
    for (const [name, state] of Object.entries(linesIn(levelFile(level, { home, root })))) {
      found.set(name, { state, level });
    }
  }
  return found;
}

/** Write one name's line at one level, or remove it with `state` null. */
function writeLine(level, where, name, state) {
  const file = levelFile(level, where);
  const data = settings.read(file);
  const next = { ...linesIn(file) };
  if (state) next[name] = state;
  else delete next[name];
  if (Object.keys(next).length) data.skills = next;
  else delete data.skills;
  if (Object.keys(data).length) settings.write(file, data);
  else fs.rmSync(file, { force: true });
}

// ------------------------------------------------------------- the catalog

const describe = (file) => {
  try {
    const { data } = frontmatter.parse(fs.readFileSync(file, 'utf8'));
    return { name: data.name ? String(data.name) : null, description: String(data.description || '') };
  } catch {
    return { name: null, description: '' };
  }
};

const SKIP = new Set(['.git', 'node_modules']);

/**
 * Every skill in a folder, at any depth: a folder holding `SKILL.md` is one,
 * and nothing below it is searched. A `SKILL.md` at the top makes the whole
 * folder one skill, named by the file's `name:` line.
 */
function scan(dir) {
  const found = new Map();
  const top = path.join(dir, 'SKILL.md');
  if (fs.existsSync(top)) {
    const { name, description } = describe(top);
    const called = name || path.basename(dir);
    found.set(called, { name: called, dir, description });
    return found;
  }
  const walk = (at) => {
    let entries;
    try {
      entries = fs.readdirSync(at, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      if (!e.isDirectory() || SKIP.has(e.name)) continue;
      const sub = path.join(at, e.name);
      const file = path.join(sub, 'SKILL.md');
      if (fs.existsSync(file)) {
        if (!found.has(e.name)) found.set(e.name, { name: e.name, dir: sub, description: describe(file).description });
      } else {
        walk(sub);
      }
    }
  };
  walk(dir);
  return found;
}

const privateDir = (home) => path.join(home || settings.flowHome(), 'private-skills');

/** Flow's own skills, with the description each one's frontmatter carries. */
function flowSkills() {
  const found = new Map();
  for (const s of skills.installable()) {
    found.set(s.name, {
      name: s.name, dir: s.dir, essential: skills.essential(s),
      description: describe(path.join(s.dir, 'SKILL.md')).description,
    });
  }
  return found;
}

/**
 * Every source of skills, in the order `ls` prints them: Flow's, each
 * repository in `sources`, then the private ones. A repository not cloned
 * yet is listed with no skills and `cloned: false`.
 */
function catalog(home) {
  const groups = [{ name: 'flow', type: 'flow', skills: flowSkills() }];
  for (const source of repos.names(repos.sources(home))) {
    const dir = repos.sourceDir(home, source);
    const cloned = fs.existsSync(dir);
    groups.push({ ...source, type: 'source', dir, cloned, skills: cloned ? scan(dir) : new Map() });
  }
  groups.push({ name: 'private', type: 'private', dir: privateDir(home), skills: scan(privateDir(home)) });
  return groups;
}

/**
 * One skill by name, or by `owner/repo:name` where 2 sources share it.
 * Refuses a name found nowhere, and a bare name found twice.
 */
function find(groups, ref) {
  const at = ref.lastIndexOf(':');
  const [from, name] = at > 0 ? [ref.slice(0, at), ref.slice(at + 1)] : [null, ref];
  const hits = groups
    .filter((g) => !from || g.name === from || g.id === from)
    .filter((g) => g.skills.has(name))
    .map((g) => ({ group: g, skill: g.skills.get(name) }));
  if (hits.length === 1) return hits[0];
  if (!hits.length) {
    const missing = groups.filter((g) => g.type === 'source' && !g.cloned).map((g) => g.name);
    const hint = missing.length ? `\n  Not cloned yet: ${missing.join(', ')}. flow install clones them.` : '';
    throw new FlowError(`no skill named "${ref}". flow skills ls <pattern> searches every source.${hint}`);
  }
  throw new FlowError(
    `"${name}" is in ${hits.length} sources. Name the one you mean:\n` +
    hits.map((h) => `  ${h.group.id || h.group.name}:${name}`).join('\n')
  );
}

// --------------------------------------------------------------- the links

/** What sits at a path: `missing`, `link` (with its target) or `folder`. */
function slot(to) {
  let stat;
  try {
    stat = fs.lstatSync(to);
  } catch {
    return { state: 'missing' };
  }
  if (!stat.isSymbolicLink()) return { state: 'folder' };
  return { state: 'link', target: fs.readlinkSync(to), live: fs.existsSync(to) };
}

/** Whether a link points somewhere Flow links from: a source clone or the private folder. */
const ours = (target, home) =>
  [path.join(repos.dir(home), 'sources'), privateDir(home)].some((d) => target.startsWith(d + path.sep));

/** Whether a skill is one of Flow's essential ones, linked whatever the settings say. */
const isEssential = (group, skill) => group.type === 'flow' && !!skill.essential;

/** The line naming a skill: `owner/repo:name` where one was written, else the bare name. */
const lineFor = (found, group, name) => (group.id && found.get(`${group.id}:${name}`)) || found.get(name);

/** On or off for the whole machine: always on if essential, else the line, else off. */
function machineState(skill, group, machineLines) {
  if (isEssential(group, skill)) return 'on';
  const line = lineFor(machineLines, group, skill.name);
  return line ? line.state : 'off';
}

/**
 * Make every link match the settings. Returns what changed, what could not be
 * made, and the names a line mentions that no source holds.
 *
 *   claude  the Claude Code folder holding `skills/`
 *   agents  the folder holding Flow's plugin, or null to leave Flow's skills alone
 *   root    the project, or null outside one
 */
function apply({ home, root = null, claude, agents = null }) {
  const groups = catalog(home);
  const machineLines = lines({ home, root: null, levels: ['machine', 'global'] });
  const projectLines = root ? lines({ home, root, levels: ['project'] }) : new Map();
  const changed = [];
  const problems = [];

  const put = (dir, name, target, { anyLink = false } = {}) => {
    const to = path.join(dir, name);
    const at = slot(to);
    if (at.state === 'link' && at.target === target) return;
    if (at.state === 'folder') return problems.push(`${to} is a real folder, not a link: left alone.`);
    if (at.state === 'link' && at.live && !anyLink && !ours(at.target, home)) {
      return problems.push(`${to} links to ${at.target}, which Flow never made: left alone.`);
    }
    if (at.state === 'link') fs.unlinkSync(to);
    fs.mkdirSync(dir, { recursive: true });
    fs.symlinkSync(target, to);
    changed.push(`linked: ${shorten(to)}`);
  };

  const take = (dir, name, { anyLink = false } = {}) => {
    const to = path.join(dir, name);
    const at = slot(to);
    if (at.state !== 'link') return;
    if (!anyLink && !ours(at.target, home)) return;
    fs.unlinkSync(to);
    changed.push(`unlinked: ${shorten(to)}`);
  };

  const flowDir = agents ? skills.linkDir(agents) : null;
  const machineDir = path.join(claude, 'skills');
  const projectDir = root ? path.join(root, '.claude', 'skills') : null;

  for (const group of groups) {
    for (const skill of group.skills.values()) {
      const onMachine = machineState(skill, group, machineLines) === 'on';
      if (group.type === 'flow') {
        if (!flowDir || !fs.existsSync(flowDir)) continue;
        if (onMachine) put(flowDir, skill.name, skill.dir, { anyLink: true });
        else take(flowDir, skill.name, { anyLink: true });
        continue;
      }
      if (onMachine) put(machineDir, skill.name, skill.dir);
      else take(machineDir, skill.name);
      if (!projectDir) continue;
      const line = lineFor(projectLines, group, skill.name);
      if (line && line.state === 'on' && !onMachine) put(projectDir, skill.name, skill.dir);
      else take(projectDir, skill.name);
    }
  }

  // A link into a source whose skill is gone: a pull removed it, or a source
  // was dropped. Nothing in the catalog reaches it, so it is swept here.
  for (const dir of [machineDir, projectDir].filter(Boolean)) {
    let entries = [];
    try {
      entries = fs.readdirSync(dir);
    } catch {
      continue;
    }
    for (const name of entries) {
      const at = slot(path.join(dir, name));
      if (at.state === 'link' && !at.live && ours(at.target, home)) take(dir, name);
    }
  }

  const known = new Set(groups.flatMap((g) => [...g.skills.keys()]));
  const everyLine = new Map([...machineLines, ...projectLines]);
  const missing = [...everyLine.keys()].filter((n) => !known.has(n.split(':').pop())).sort();
  return { changed, problems, missing, groups, machineLines, projectLines };
}

// ------------------------------------------------------------ outside skills

/**
 * What Flow does not manage: skill folders and links another tool put in
 * `~/.claude/skills/`, and the plugins Claude Code installed. `ls` shows them
 * so the list is whole, and switches none of them.
 */
function outside({ home, claude }) {
  const found = [];
  const dir = path.join(claude, 'skills');
  let entries = [];
  try {
    entries = fs.readdirSync(dir);
  } catch {
    // No skills folder yet.
  }
  for (const name of entries.sort()) {
    if (name === skills.PLUGIN) continue;
    const at = slot(path.join(dir, name));
    if (at.state === 'link' && ours(at.target, home)) continue;
    if (!fs.existsSync(path.join(dir, name, 'SKILL.md'))) continue;
    found.push({ name, type: 'skill', description: describe(path.join(dir, name, 'SKILL.md')).description });
  }
  try {
    const listed = JSON.parse(fs.readFileSync(path.join(claude, 'plugins', 'installed_plugins.json'), 'utf8')).plugins || {};
    for (const id of Object.keys(listed).sort()) found.push({ name: id.split('@')[0], type: 'plugin', description: '' });
  } catch {
    // No plugins, or a file Claude Code changed the shape of. Neither is Flow's.
  }
  return found;
}

module.exports = {
  LEVELS, levelFile, lines, lineFor, writeLine, scan, privateDir, catalog, find, apply, outside,
  machineState, isEssential,
};
