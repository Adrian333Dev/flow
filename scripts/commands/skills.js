'use strict';
/**
 * `flow skills`: install and switch every skill Flow can reach, whatever it
 * came from.
 *
 *   ls [pattern...]       every skill by source, and whether it is on
 *   on | off <name...>    write that name's line at one level
 *   reset <name...>       remove the line, so the level above decides again
 *   add <owner/repo>      clone a skill repository and make it a source
 *   drop <owner/repo...>  remove a source and its clone
 *
 * Flow's essential skills, every one outside `skills/dev/`, are left out of
 * `ls`, and `on` and `off` refuse them: they are the workflow, always on.
 *
 * The level is a flag: none for this project, `--machine` for this machine,
 * `--global` for every machine. `lib/skills/skill-links.js` holds the settings, the
 * sources and the step that makes the links match, which every action here
 * runs before it answers.
 *
 * It replaces `npx skills` inside Flow: a repository is cloned whole and each
 * skill is a link into it, so the session-start pull keeps every one current
 * and nothing records a path that a reshuffled repository would break.
 */

const fs = require('fs');
const path = require('path');
const { out } = require('../lib/cli');
const { FlowError } = require('../lib/error');
const logs = require('../lib/logs/logs');
const machine = require('../lib/machine/machine');
const render = require('../lib/render');
const repos = require('../lib/skills/repos');
const projects = require('../lib/project');
const settings = require('../lib/settings');
const links = require('../lib/skills/skill-links');
const skills = require('../lib/skills/skills');
const paths = require('../lib/paths');

const COST = 'Every session on this machine now loads its description, in a project it has nothing to do with too.';

const LEVEL_FLAGS = { machine: { bool: true }, global: { bool: true } };

/** Where every action reads and writes: Flow's folder, Claude Code's, the plugin's. */
function where(root) {
  return { home: paths.flowHome(), root, claude: paths.claudeHome(), agents: paths.folders().agents };
}

/** Make the links match, and say what that changed. */
function sync(at) {
  const folders = [path.join(at.claude, 'skills'), at.root && path.join(at.root, '.claude', 'skills')].filter(Boolean);
  const had = folders.filter((d) => fs.existsSync(d));
  const done = links.apply(at);
  if (done.changed.length) out(done.changed.join('\n'));
  if (folders.some((d) => fs.existsSync(d) && !had.includes(d))) {
    out('Restart Claude Code: it only watches a skills folder that existed when the session started.');
  }
  return done;
}

/** The level a switch writes to, from the flags. */
/** The project for a project-level switch, or a refusal naming the 2 other levels. */
function rootFor(level) {
  if (level !== 'project') return projects.around();
  const root = projects.around();
  if (!root) {
    throw new FlowError('no Flow project here, and a switch with no flag is for this project.\n' +
      '  --machine switches it for this machine, --global for every machine.');
  }
  return root;
}

// ---------------------------------------------------------------------- ls

/** The patterns as regular expressions, refusing one that does not parse. */
function patterns(words) {
  return words.map((w) => {
    try {
      return new RegExp(w, 'i');
    } catch (e) {
      throw new FlowError(`"${w}" is not a pattern: ${e.message}`);
    }
  });
}

const matches = (res, s) => res.every((re) => re.test(s.name) || re.test(s.description || ''));

const actions = {};

actions.ls = {
  args: '[pattern...]',
  summary: 'every skill by source; each pattern is a regular expression over the name and description',
  flags: { source: { arg: '<name>' } },
  run({ positional, flags }) {
    const at = where(projects.around());
    const done = links.apply(at);
    const res = patterns(positional);
    const whole = !!(positional.length || flags.source);
    const every = new Map([...done.machineLines, ...done.projectLines]);

    const picked = (g) => !flags.source || g.name === flags.source || g.id === flags.source;
    const known = [...done.groups.map((g) => g.name), 'outside'];
    if (flags.source && !known.includes(flags.source) && !done.groups.some((g) => g.id === flags.source)) {
      throw new FlowError(`no source "${flags.source}", one of: ${known.join(', ')}`);
    }

    const rows = [['', 'state', 'level']];
    for (const g of done.groups.filter(picked)) {
      const all = [...g.skills.values()].filter((s) => !links.isEssential(g, s) && matches(res, s)).sort((a, b) => a.name.localeCompare(b.name));
      const shown = whole || g.type !== 'source' ? all : all.filter((s) => links.lineFor(every, g, s.name));
      if (g.type === 'source' && !g.cloned) {
        rows.push([g.name, 'not cloned: flow install clones it', '']);
        continue;
      }
      if (!shown.length && (whole || g.type === 'private')) continue;
      const more = all.length - shown.length;
      rows.push([g.name, more ? `${more} more` : '', '']);
      for (const s of shown) {
        const line = links.lineFor(done.projectLines, g, s.name) || links.lineFor(done.machineLines, g, s.name);
        const state = line ? line.state : links.machineState(s, g, done.machineLines);
        rows.push([`  ${s.name}`, state, line ? line.level : '']);
      }
    }
    if (!flags.source || flags.source === 'outside') {
      const others = links.outside(at).filter((s) => matches(res, s));
      if (others.length) {
        rows.push(['outside', '', '']);
        for (const s of others) rows.push([`  ${s.name}`, s.type, '']);
      }
    }

    if (rows.length === 1) {
      out(positional.length ? `no skill matches ${positional.map((p) => `"${p}"`).join(' ')}.` : 'no skills.');
    } else {
      out(render.columns(rows));
    }
    for (const name of done.missing) {
      const line = every.get(name);
      const flag = line.level === 'project' ? '' : ` --${line.level}`;
      out(`missing: ${name} is ${line.state} at ${line.level} level, and no source holds it. flow skills reset ${name}${flag} removes the line.`);
    }
    return 0;
  },
};

// ------------------------------------------------------------------- switch

/**
 * Write one state at one level for each name, then make the links match.
 * `state` null removes the line.
 */
function switchSkills({ names, flags, state, by }) {
  if (!names.length) throw new FlowError(`usage: flow skills ${by} <name...> [--machine | --global]`);
  const level = settings.levelOf(flags, 'project');
  const root = rootFor(level);
  const at = where(root);
  const groups = links.catalog(at.home);
  const machineLines = links.lines({ home: at.home, root: null, levels: ['machine', 'global'] });
  const problems = [];
  const written = [];

  for (const ref of names) {
    let hit = null;
    try {
      hit = links.find(groups, ref);
    } catch (e) {
      // A line can outlive its skill: reset still has to be able to remove it.
      if (state !== null) {
        problems.push(e.message);
        continue;
      }
    }
    const key = ref.includes(':') ? ref : (hit ? hit.skill.name : ref);
    if (hit && state !== null && links.isEssential(hit.group, hit.skill)) {
      problems.push(`${key} is part of Flow's workflow and always on. Only the skills in skills/${skills.SWITCHABLE}/ switch.`);
      continue;
    }
    if (hit && hit.group.type === 'flow' && level === 'project') {
      problems.push(`${key} is a Flow skill, and Flow's skills load for the whole machine: add --machine or --global.`);
      continue;
    }
    if (hit && state === 'off' && level === 'project' && links.machineState(hit.skill, hit.group, machineLines) === 'on') {
      problems.push(`${key} is on for this machine, and a project cannot hide a skill linked for the whole machine yet.\n` +
        `  flow skills off ${key} --machine switches it off everywhere on this machine.`);
      continue;
    }
    links.writeLine(level, at, key, state);
    written.push(key);
    logs.recordHistory(at.home, { type: 'skill', name: key, state: state || 'reset', level, by: `flow skills ${by}` });
    const note = state === 'on' && level !== 'project' && hit && hit.group.type !== 'flow' ? ` ${COST}` : '';
    out(`${state || 'reset'}: ${key}, ${level === 'project' ? 'this project' : level === 'machine' ? 'this machine' : 'every machine'}.${note}`);
  }

  if (written.length) {
    const done = sync(at);
    problems.push(...done.problems);
  }
  if (problems.length) throw new FlowError(problems.join('\n'));
  return 0;
}

actions.on = {
  args: '<name...>',
  summary: 'turn skills on for this project, this machine (--machine) or every machine (--global)',
  flags: LEVEL_FLAGS,
  run: ({ positional, flags }) => switchSkills({ names: positional, flags, state: 'on', by: 'on' }),
};

actions.off = {
  args: '<name...>',
  summary: 'turn skills off at that level, keeping them installed',
  flags: LEVEL_FLAGS,
  run: ({ positional, flags }) => switchSkills({ names: positional, flags, state: 'off', by: 'off' }),
};

actions.reset = {
  args: '<name...>',
  summary: 'remove the line at that level, so the level above decides',
  flags: LEVEL_FLAGS,
  run: ({ positional, flags }) => switchSkills({ names: positional, flags, state: null, by: 'reset' }),
};

// ---------------------------------------------------------------- sources

/** `sources` as written, starting from the default when the key is absent. */
const listed = (home) => repos.sources(home);

actions.add = {
  args: '<owner/repo>',
  summary: 'clone a skill repository as a source; flow skills on turns its skills on',
  run({ positional, usage }) {
    const [entry, ...extra] = positional;
    if (!entry || extra.length) throw new FlowError(`usage: ${usage} <owner/repo>, then flow skills on <name> for each skill to turn on.`);
    const home = paths.flowHome();
    const source = repos.parse(entry);
    const list = listed(home);
    const already = list.some((s) => repos.parse(s).id === source.id);
    const dir = repos.sourceDir(home, source);

    if (!fs.existsSync(dir)) {
      const cloned = repos.clone(source.url, dir);
      if (!cloned.ok) throw new FlowError(`could not clone ${source.entry}: ${cloned.why}`);
      if (!links.scan(dir).size) {
        fs.rmSync(dir, { recursive: true, force: true });
        throw new FlowError(`no skill found in ${source.entry}: no folder in it holds a SKILL.md.`);
      }
      logs.recordHistory(home, { type: 'clone', source: source.id, commit: cloned.commit });
      out(`cloned: ${source.id} into ${paths.shorten(dir)}`);
    }
    if (!already) {
      repos.writeSources(home, [...list, source.entry]);
      out(`added: ${source.id} to sources in ${paths.shorten(settings.globalFile(home))}`);
    }

    const found = [...links.scan(dir).values()];
    out(`\n${found.length} skill${found.length === 1 ? '' : 's'}, none switched on by this:`);
    out(render.columns(found.map((s) => [`  ${s.name}`, s.description])));
    out(`\nflow skills on <name> turns one on here, --machine or --global more widely.`);
    return 0;
  },
};

actions.drop = {
  args: '<owner/repo...>',
  summary: 'remove a source and its clone',
  run({ positional, usage }) {
    if (!positional.length) throw new FlowError(`usage: ${usage} <owner/repo...>`);
    const names = positional.filter((p) => !p.includes('/') || p.includes(':'));
    if (names.length) {
      throw new FlowError(`${names.join(', ')} names a skill, not a source. flow skills reset <name> removes a skill's line.`);
    }
    const home = paths.flowHome();

    for (const entry of positional) {
      const source = repos.parse(entry);
      const list = listed(home);
      const kept = list.filter((s) => repos.parse(s).id !== source.id);
      if (kept.length === list.length) throw new FlowError(`${source.id} is not a source. flow skills ls lists them.`);
      repos.writeSources(home, kept);
      fs.rmSync(repos.sourceDir(home, source), { recursive: true, force: true });
      logs.recordHistory(home, { type: 'source', source: source.id, state: 'dropped' });
      out(`dropped: ${source.id} and its clone`);
    }
    sync(where(projects.around()));
    return 0;
  },
};

module.exports = {
  summary: 'install and switch every skill: Flow\'s, your private ones, and each skill repository',
  default: 'ls',
  actions,
};
