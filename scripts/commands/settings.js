'use strict';
/**
 * `flow settings`: switch the settings Flow reads on or off, at one level.
 *
 *   ls                    every setting, whether it is on here, and which level says so
 *   on | off <name>       write that setting at one level
 *   reset <name>          remove it from that level, so the level above decides
 *
 * The levels are `flow skills`' own: no flag for this folder, `--global` for
 * every project on every machine. The folder is the enclosing git repository.
 * A setting works per folder only where it has a list of folders to skip,
 * since a line like the reminder has nowhere to say "not here". That list
 * holds paths, so it lives in `settings.local.json`; every switch lives in
 * `settings.json`.
 *
 * `SETTINGS` is the whole list. A new on/off setting is one more entry, and
 * `lib/settings.js` holds the files and how they merge.
 */

const path = require('path');
const { out } = require('../lib/cli');
const { FlowError } = require('../lib/error');
const logs = require('../lib/logs/logs');
const machine = require('../lib/machine/machine');
const render = require('../lib/render');
const settings = require('../lib/settings');
const paths = require('../lib/paths');
const projects = require('../lib/project');

/** Every on/off setting, on unless a file says false. `skip` names its list of folders. */
const SETTINGS = [
  { key: 'reminder', says: 'a line beside every message, pointing Claude at the reply rules' },
  { key: 'sessionCheck', says: 'what needs attention, when a session opens' },
  { key: 'setupReminder', says: 'suggests flow init where a repository or old memory needs it', skip: 'setupReminderSkip' },
  { key: 'skillsAutoUpdate', says: 'each skill repository updates itself when a session opens' },
  { key: 'wrapUp', says: 'tells Claude to hand off once the conversation passes wrapUpAt tokens' },
];

const LEVEL_FLAGS = { global: { bool: true } };
const LEVEL_NAMES = { folder: 'this folder', global: 'everywhere' };

function find(key) {
  const found = SETTINGS.find((s) => s.key === key);
  if (!found) throw new FlowError(`no setting "${key}", one of: ${SETTINGS.map((s) => s.key).join(', ')}`);
  return found;
}

/** How a folder is written into a list: from `~` where it sits under the home folder. */
function written(dir) {
  const home = paths.folders().base;
  return dir === home || dir.startsWith(home + path.sep) ? `~${dir.slice(home.length)}` : dir;
}

const expand = (entry) => path.resolve(entry.replace(/^~(?=\/|$)/, paths.folders().base));

/** The folder list a setting skips, from both machine files. */
function skipped(s) {
  const all = settings.readGlobal();
  return [].concat(all[s.skip] || []).filter((e) => typeof e === 'string').map(expand);
}

/** Whether a setting is on in `dir`, and the level that decided it. */
function state(s, dir) {
  if (s.skip && dir && skipped(s).some((d) => dir === d || dir.startsWith(d + path.sep))) {
    return { on: false, level: 'folder' };
  }
  const value = settings.read(settings.globalFile())[s.key];
  if (value === undefined) return { on: true, level: '' };
  return { on: value !== false, level: 'global' };
}

const actions = {};

actions.ls = {
  summary: 'every setting, whether it is on here, and which level says so',
  run({ positional, usage }) {
    if (positional.length) throw new FlowError(`${usage} takes no words. Switch one with flow settings on, off or reset <name>.`);
    const dir = projects.top(process.cwd());
    const rows = [['setting', 'state', 'level', '']];
    for (const s of SETTINGS) {
      const now = state(s, dir);
      rows.push([s.key, now.on ? 'on' : 'off', LEVEL_NAMES[now.level] || '', s.says]);
    }
    out(render.columns(rows));
    return 0;
  },
};

/**
 * Write one setting at one level, then say where it now stands here. `state`
 * null removes the line: for a folder that is the same as on, leaving the list.
 */
function switchSetting({ positional, flags, state: wanted, by }) {
  const [key, ...extra] = positional;
  if (!key || extra.length) throw new FlowError(`usage: flow settings ${by} <name> [--global]`);
  const s = find(key);
  const level = flags.global ? 'global' : 'folder';
  const dir = projects.top(process.cwd());
  const home = paths.flowHome();

  if (level === 'folder') {
    if (!s.skip) throw new FlowError(`${key} has no per-folder switch. Add --global to switch it everywhere.`);
    if (!dir) throw new FlowError('no git repository here, and a switch with no flag is for this folder. Add --global to switch it everywhere.');
    const file = settings.localFile();
    const data = settings.read(file);
    const list = [].concat(data[s.skip] || []).filter((e) => typeof e === 'string' && expand(e) !== dir);
    if (wanted === 'off') list.push(written(dir));
    if (list.length) data[s.skip] = list;
    else delete data[s.skip];
    settings.write(file, data);
  } else {
    const file = settings.globalFile();
    const data = settings.read(file);
    if (wanted === null) delete data[key];
    else data[key] = wanted === 'on';
    settings.write(file, data);
  }

  logs.recordHistory(home, { type: 'setting', name: key, state: wanted || 'reset', level, by: `flow settings ${by}` });
  out(`${wanted || 'reset'}: ${key}, ${LEVEL_NAMES[level]}.`);
  const now = state(s, dir);
  if (wanted === null) out(`${key} is now ${now.on ? 'on' : 'off'} here${now.level ? `, since ${LEVEL_NAMES[now.level]} says so` : ''}.`);
  else if (now.on !== (wanted === 'on')) out(`${key} is still ${now.on ? 'on' : 'off'} here, since ${LEVEL_NAMES[now.level]} says so.`);
  return 0;
}

actions.on = {
  args: '<name>',
  summary: 'turn a setting on for this folder, or everywhere (--global)',
  flags: LEVEL_FLAGS,
  run: ({ positional, flags }) => switchSetting({ positional, flags, state: 'on', by: 'on' }),
};

actions.off = {
  args: '<name>',
  summary: 'turn a setting off at that level',
  flags: LEVEL_FLAGS,
  run: ({ positional, flags }) => switchSetting({ positional, flags, state: 'off', by: 'off' }),
};

actions.reset = {
  args: '<name>',
  summary: 'remove a setting from that level, so the level above decides',
  flags: LEVEL_FLAGS,
  run: ({ positional, flags }) => switchSetting({ positional, flags, state: null, by: 'reset' }),
};

module.exports = { summary: 'switch the settings Flow reads on or off, or reset one', default: 'ls', actions };
