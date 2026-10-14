'use strict';
/**
 * `flow skills`: switch every skill Flow can reach, Flow's own and the
 * user's private ones.
 *
 *   ls [pattern...]       every skill by group, and whether it is on
 *   on | off <name...>    write that name's line at one level
 *   reset <name...>       remove the line, so the level above decides again
 *
 * Flow's essential skills, every one outside `skills/dev/`, are left out of
 * `ls`, and `on` and `off` refuse them: they are the workflow, always on.
 *
 * The level is a flag: none for this project, `--global` for every project on
 * every machine. `lib/skills/skill-links.js` holds the settings, the groups
 * and the step that makes the links match, which every action here runs
 * before it answers.
 */

const fs = require('fs');
const path = require('path');
const { out } = require('../lib/cli');
const { FlowError } = require('../lib/error');
const logs = require('../lib/logs/logs');
const render = require('../lib/render');
const projects = require('../lib/project');
const links = require('../lib/skills/skill-links');
const skills = require('../lib/skills/skills');
const paths = require('../lib/paths');

const COST = 'Every session now loads its description, in projects it has nothing to do with too.';

const LEVEL_FLAGS = { global: { bool: true } };

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

/** The project for a project-level switch, or a refusal naming the other level. */
function rootFor(level) {
  if (level !== 'project') return projects.around();
  const root = projects.around();
  if (!root) {
    throw new FlowError('no Flow project here, and a switch with no flag is for this project.\n' +
      '  --global switches it everywhere.');
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
  summary: 'every skill by group; each pattern is a regular expression over the name and description',
  flags: { source: { arg: '<name>' } },
  run({ positional, flags }) {
    const at = where(projects.around());
    const done = links.apply(at);
    const res = patterns(positional);
    const whole = !!(positional.length || flags.source);
    const every = new Map([...done.machineLines, ...done.projectLines]);

    const picked = (g) => !flags.source || g.name === flags.source;
    const known = [...done.groups.map((g) => g.name), 'outside'];
    if (flags.source && !known.includes(flags.source)) {
      throw new FlowError(`no source "${flags.source}", one of: ${known.join(', ')}`);
    }

    const rows = [['', 'state', 'level']];
    for (const g of done.groups.filter(picked)) {
      const all = [...g.skills.values()].filter((s) => !links.isEssential(g, s) && matches(res, s)).sort((a, b) => a.name.localeCompare(b.name));
      if (!all.length && (whole || g.type === 'private')) continue;
      rows.push([g.name, '', '']);
      for (const s of all) {
        const line = done.projectLines.get(s.name) || done.machineLines.get(s.name);
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
      out(`missing: ${name} is ${line.state} at ${line.level} level, and no skill has that name. flow skills reset ${name}${flag} removes the line.`);
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
  if (!names.length) throw new FlowError(`usage: flow skills ${by} <name...> [--global]`);
  const level = flags.global ? 'global' : 'project';
  const root = rootFor(level);
  const at = where(root);
  const groups = links.catalog(at.home);
  const machineLines = links.lines({ home: at.home, root: null, levels: ['global'] });
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
    const key = hit ? hit.skill.name : ref;
    if (hit && state !== null && links.isEssential(hit.group, hit.skill)) {
      problems.push(`${key} is part of Flow's workflow and always on. Only the skills in skills/${skills.SWITCHABLE}/ switch.`);
      continue;
    }
    if (hit && hit.group.type === 'flow' && level === 'project') {
      problems.push(`${key} is a Flow skill, and Flow's skills load for the whole machine: add --global.`);
      continue;
    }
    if (hit && state === 'off' && level === 'project' && links.machineState(hit.skill, hit.group, machineLines) === 'on') {
      problems.push(`${key} is on everywhere (--global), and a project cannot hide a skill linked for the whole machine yet.\n` +
        `  flow skills off ${key} --global switches it off everywhere.`);
      continue;
    }
    links.writeLine(level, at, key, state);
    written.push(key);
    logs.recordHistory(at.home, { type: 'skill', name: key, state: state || 'reset', level, by: `flow skills ${by}` });
    const note = state === 'on' && level !== 'project' && hit && hit.group.type !== 'flow' ? ` ${COST}` : '';
    out(`${state || 'reset'}: ${key}, ${level === 'project' ? 'this project' : 'everywhere'}.${note}`);
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
  summary: 'turn skills on for this project, or everywhere (--global)',
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

module.exports = {
  summary: 'switch every skill: Flow\'s and your private ones',
  default: 'ls',
  actions,
};
