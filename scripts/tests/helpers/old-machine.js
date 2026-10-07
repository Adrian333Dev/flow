'use strict';
/**
 * The machine Flow's own setup misread on 2026-10-06, rebuilt in tmp/.
 *
 * It held 2 plugins synced from the claude.ai account, which the setup never
 * saw, util listed from 2 clones of one repository, and 7 plugins installed
 * for one project, which the setup wrongly offered to uninstall machine-wide.
 * A survey that reads this machine right fixes all 3.
 *
 * `claude` is a stub on PATH answering `plugin list --json` the way 2.1.292
 * does: the synced plugins drop out while CLAUDE_CODE_SAFE_MODE is set.
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { project, write, skillFile, claudeStub, gitRepo } = require('./scratch');

const MARKET = 'claude-plugins-official';
const UTIL = 'https://github.com/Adrian333Dev/util';

/** The plugins installed for one project, by the project's folder name. */
const PROJECT_PLUGINS = {
  lumacraft_v2: ['playwright', 'greptile', 'frontend-design', 'typescript-lsp', 'superpowers'],
  delapse: ['supabase', 'superpowers'],
};

/** A plugin's folder, holding what `contents` names. */
function pluginFolder(dir, name, { skills = [], mcp = [], hooks = [] } = {}) {
  write(dir, '.claude-plugin/plugin.json', JSON.stringify({ name }));
  for (const skill of skills) write(dir, `skills/${skill}/SKILL.md`, skillFile(skill));
  if (mcp.length) write(dir, '.mcp.json', JSON.stringify({ mcpServers: Object.fromEntries(mcp.map((m) => [m, { command: m }])) }));
  if (hooks.length) write(dir, 'hooks/hooks.json', JSON.stringify({ hooks: Object.fromEntries(hooks.map((h) => [h, []])) }));
  return dir;
}

/** A clone of util with an origin, so 2 of them read as one repository. */
function utilClone(dir) {
  gitRepo(dir, { 'commands/fs/tree.sh': 'echo tree\n' });
  spawnSync('git', ['-C', dir, 'remote', 'add', 'origin', `${UTIL}.git`]);
  return path.join(dir, 'commands');
}

/**
 * The machine under `<scratch>/<name>/root`. Returns its folders, the 2
 * projects, the stub's folder, and the list entries, so a test can build a
 * stub of its own that answers differently.
 */
function oldMachine(name) {
  const dir = project(name);
  const root = path.join(dir, 'root');
  const claude = path.join(root, '.claude');
  const cache = (plugin) => path.join(claude, 'plugins', 'cache', MARKET, plugin, '1.0.0');
  const projects = {};
  for (const folder of Object.keys(PROJECT_PLUGINS)) {
    projects[folder] = path.join(root, 'code', 'projects', folder);
    fs.mkdirSync(projects[folder], { recursive: true });
  }

  // The install record: 2 plugins for every session, 7 for one project each.
  const record = {};
  const list = [];
  const add = (plugin, row) => {
    const id = `${plugin}@${MARKET}`;
    (record[id] = record[id] || []).push({ ...row, installPath: cache(plugin), version: '1.0.0' });
    list.push({ id, scope: row.scope, enabled: row.scope === 'user', installPath: cache(plugin) });
  };
  for (const plugin of ['typescript-lsp', 'frontend-design']) add(plugin, { scope: 'user' });
  for (const [folder, plugins] of Object.entries(PROJECT_PLUGINS)) {
    for (const plugin of plugins) add(plugin, { scope: 'project', projectPath: projects[folder] });
  }
  write(claude, 'plugins/installed_plugins.json', JSON.stringify({ version: 2, plugins: record }, null, 2));
  for (const plugin of new Set(Object.values(PROJECT_PLUGINS).flat().concat('typescript-lsp', 'frontend-design'))) {
    pluginFolder(cache(plugin), plugin, {
      skills: plugin === 'superpowers' ? ['brainstorming', 'tdd'] : [],
      hooks: plugin === 'superpowers' ? ['SessionStart'] : [],
      mcp: plugin === 'supabase' ? ['supabase'] : [],
    });
  }

  // The 2 synced plugins, with no line in the install record.
  const account = path.join(claude, 'plugins', 'synced', 'account-1');
  write(account, 'manifest.json', JSON.stringify({ plugins: [{ name: 'engineering' }, { name: 'productivity' }] }));
  write(path.dirname(account), '.bucket-account-1', '');
  pluginFolder(path.join(account, 'engineering'), 'engineering', { skills: ['standup', 'code-review'], mcp: ['github', 'linear'] });
  pluginFolder(path.join(account, 'productivity'), 'productivity', { skills: ['plan-day'] });
  const synced = ['engineering', 'productivity'].map((p) => ({ id: `${p}@synced`, scope: 'synced', enabled: false, installPath: path.join(account, p) }));

  // Rule files, a skill copied in by hand, a synced skill, the settings.
  write(claude, 'CLAUDE.md', 'Be terse.\n\n@~/notes/rules.md\n');
  write(root, 'notes/rules.md', 'Never use em dashes.\n');
  write(claude, 'skills/tdd/SKILL.md', skillFile('tdd'));
  write(claude, 'skills/synced/account-1/grill-me/SKILL.md', skillFile('grill-me'));
  write(claude, 'settings.json', JSON.stringify({
    model: 'opus',
    skillOverrides: { 'grill-me': 'off' },
    hooks: { Stop: [{ hooks: [{ type: 'command', command: 'node ~/hooks/stop.js' }] }] },
  }, null, 2));

  // util, listed from 2 clones of one repository.
  const sources = [utilClone(path.join(root, '.flow', 'repos', 'util')), utilClone(path.join(root, 'code', 'util'))];
  write(root, '.util/sources', `${sources.join('\n')}\n`);

  const full = [...list, ...synced];
  const bin = claudeStub(dir, { list: full, safe: list });
  return { dir, root, claude, projects, bin, list: full };
}

module.exports = { oldMachine, PROJECT_PLUGINS };
