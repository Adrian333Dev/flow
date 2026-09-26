'use strict';
/**
 * `flow settings`: switch the settings Flow reads on or off, at one level.
 *
 *   ls                 every setting, whether it is on here, and which level says so
 *   on | off <name>    write that setting at one level
 *
 * The levels are `flow skills`' own: no flag for this folder, `--machine` for
 * this machine, `--global` for every machine. The folder is the enclosing git
 * repository. A setting works per folder only where it has a list of folders
 * to skip, since a line like the reminder has nowhere to say "not here".
 *
 * `SETTINGS` is the whole list. A new on/off setting is one more entry, and
 * `lib/settings.js` holds the files and how they merge.
 */

const path = require('path');
const { spawnSync } = require('child_process');
const { out } = require('../lib/cli');
const { FlowError } = require('../lib/error');
const history = require('../lib/history');
const machine = require('../lib/machine');
const render = require('../lib/render');
const settings = require('../lib/settings');

/** Every on/off setting, on unless a file says false. `skip` names its list of folders. */
const SETTINGS = [
  { key: 'reminder', says: 'a line beside every message, pointing Claude at the reply rules' },
  { key: 'sessionCheck', says: 'what needs attention, when a session opens' },
  { key: 'setupReminder', says: 'suggests flow setup project in a git repository without Flow', skip: 'setupReminderSkip' },
  { key: 'skillsAutoUpdate', says: 'each skill repository updates itself when a session opens' },
];

const LEVEL_FLAGS = { machine: { bool: true }, global: { bool: true } };
const LEVEL_NAMES = { folder: 'this folder', machine: 'this machine', global: 'every machine' };

function levelOf(flags) {
  if (flags.machine && flags.global) throw new FlowError('--machine or --global, not both.');
  return flags.global ? 'global' : flags.machine ? 'machine' : 'folder';
}

function find(key) {
  const found = SETTINGS.find((s) => s.key === key);
  if (!found) throw new FlowError(`no setting "${key}", one of: ${SETTINGS.map((s) => s.key).join(', ')}`);
  return found;
}

/**
 * The git repository around the working folder, or null outside one. Asked
 * of git directly: `lib/root.js` refuses a repository with no `.flow/`, and
 * that is the very folder the setup line shows in.
 */
function here() {
  const git = spawnSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' });
  return git.status === 0 ? path.resolve(git.stdout.trim()) : null;
}

/** How a folder is written into a list: from `~` where it sits under the home folder. */
function written(dir) {
  const home = machine.folders().base;
  return dir === home || dir.startsWith(home + path.sep) ? `~${dir.slice(home.length)}` : dir;
}

const expand = (entry) => path.resolve(entry.replace(/^~(?=\/|$)/, machine.folders().base));

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
  const { value, file } = settings.globalKey(s.key);
  if (value === undefined) return { on: true, level: '' };
  return { on: value !== false, level: file === settings.localFile() ? 'machine' : 'global' };
}

const actions = {};

actions.ls = {
  summary: 'every setting, whether it is on here, and which level says so',
  run({ positional, usage }) {
    if (positional.length) throw new FlowError(`${usage} takes no words. Switch one with flow settings on or off <name>.`);
    const dir = here();
    const rows = [['setting', 'state', 'level', '']];
    for (const s of SETTINGS) {
      const now = state(s, dir);
      rows.push([s.key, now.on ? 'on' : 'off', LEVEL_NAMES[now.level] || '', s.says]);
    }
    out(render.columns(rows));
    return 0;
  },
};

/** Write one setting at one level, then say where it now stands here. */
function switchSetting({ positional, flags, on, by }) {
  const [key, ...extra] = positional;
  if (!key || extra.length) throw new FlowError(`usage: flow settings ${by} <name> [--machine | --global]`);
  const s = find(key);
  const level = levelOf(flags);
  const dir = here();
  const home = settings.flowHome();

  if (level === 'folder') {
    if (!s.skip) throw new FlowError(`${key} has no per-folder switch. Add --machine for this machine, or --global for every machine.`);
    if (!dir) throw new FlowError('no git repository here, and a switch with no flag is for this folder. Add --machine or --global.');
    const file = settings.localFile();
    const data = settings.read(file);
    const list = [].concat(data[s.skip] || []).filter((e) => typeof e === 'string' && expand(e) !== dir);
    if (!on) list.push(written(dir));
    if (list.length) data[s.skip] = list;
    else delete data[s.skip];
    settings.write(file, data);
  } else {
    const file = level === 'machine' ? settings.localFile() : settings.globalFile();
    const data = settings.read(file);
    data[key] = on;
    settings.write(file, data);
  }

  history.record(home, { type: 'setting', name: key, state: on ? 'on' : 'off', level, by: `flow settings ${by}` });
  out(`${on ? 'on' : 'off'}: ${key}, ${LEVEL_NAMES[level]}.`);
  const now = state(s, dir);
  if (now.on !== on) out(`${key} is still ${now.on ? 'on' : 'off'} here, since ${LEVEL_NAMES[now.level]} says so.`);
  return 0;
}

actions.on = {
  args: '<name>',
  summary: 'turn a setting on for this folder, this machine (--machine) or every machine (--global)',
  flags: LEVEL_FLAGS,
  run: ({ positional, flags }) => switchSetting({ positional, flags, on: true, by: 'on' }),
};

actions.off = {
  args: '<name>',
  summary: 'turn a setting off at that level',
  flags: LEVEL_FLAGS,
  run: ({ positional, flags }) => switchSetting({ positional, flags, on: false, by: 'off' }),
};

module.exports = { summary: 'switch the settings Flow reads on or off', default: 'ls', actions };
