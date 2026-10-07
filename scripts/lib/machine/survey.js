'use strict';
/**
 * The survey: every place Claude Code reads its setup from, each item with
 * whether it is on, and the problems a function can see without judgment.
 *
 * `flow survey` prints it, both setup sessions start from it, and `flow doctor`
 * reports its problems. It changes nothing. The agent still looks beyond it:
 * a machine this was never written for holds something it cannot see.
 *
 * The disk says what exists. `claude plugin list --json` says whether a plugin
 * is on, since that is Claude Code's own rule across 4 settings scopes and an
 * organization's managed settings, and a copy of it here would break silently.
 * Where the 2 disagree, both print. The list runs with CLAUDE_CODE_SAFE_MODE
 * removed: the machine's setup session runs in safe mode, passes that variable
 * to every command it runs, and the list then hides every synced plugin. That
 * is how the setup of 2026-10-06 missed 2 of them.
 *
 * A source that cannot be read prints `unread:` and the error, and the rest
 * still lists: an empty source and an unread one must never look the same.
 * Only an unreadable Claude Code folder stops the survey.
 *
 * The machine's survey leaves out every plugin installed for one project. It
 * loads only in that project's sessions, so `--project` lists it instead, read
 * off Claude Code's install record: the machine's survey never opens a project.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const { FlowError } = require('../error');
const paths = require('../paths');

/** How many names a plugin's contents show before `…`. */
const SHOWN = 8;

/** Where an organization's settings sit on disk. An MDM policy or the claude.ai console never reach it. */
const MANAGED = {
  linux: '/etc/claude-code',
  darwin: '/Library/Application Support/ClaudeCode',
  win32: 'C:\\Program Files\\ClaudeCode',
};

/**
 * One survey's reading context. Under `--root` every path moves into the
 * scratch machine, util's home and the managed folder included, so a test never
 * reads the real ones.
 */
function context(at) {
  const scratch = path.resolve(at.base) !== os.homedir();
  return {
    at,
    problems: [],
    show: (p) => (p === at.base || p.startsWith(at.base + path.sep) ? '~' + p.slice(at.base.length) : paths.shorten(p)),
    home: (p) => p.replace(/^~(?=\/|$)/, at.base).split('$HOME').join(at.base),
    utilHome: scratch ? path.join(at.base, '.util') : process.env.UTIL_HOME || path.join(at.base, '.util'),
    managed: scratch ? path.join(at.base, 'etc', 'claude-code') : MANAGED[process.platform] || MANAGED.linux,
  };
}

// ---- reading --------------------------------------------------------------

/** A JSON file: `{ value }`, `{ missing }`, or `{ unread }` with its problem named. */
function readJson(c, file) {
  let text;
  try {
    text = fs.readFileSync(file, 'utf8');
  } catch (e) {
    return e.code === 'ENOENT' ? { missing: true } : { unread: e.code || e.message };
  }
  try {
    return { value: JSON.parse(text) };
  } catch (e) {
    c.problems.push(`${c.show(file)} is not valid JSON: ${e.message}`);
    return { unread: `not valid JSON, ${e.message}` };
  }
}

/** A folder's entries, sorted: `{ names }`, `{ missing }` or `{ unread }`. */
function readDir(dir) {
  try {
    return { names: fs.readdirSync(dir).sort() };
  } catch (e) {
    return e.code === 'ENOENT' || e.code === 'ENOTDIR' ? { missing: true } : { unread: e.code || e.message };
  }
}

/** What sits at a path: `real`, `link` with its target, `dead` with what it names, or `missing`. */
function entry(p) {
  let stat;
  try {
    stat = fs.lstatSync(p);
  } catch {
    return { kind: 'missing' };
  }
  if (!stat.isSymbolicLink()) return { kind: 'real', dir: stat.isDirectory() };
  const raw = fs.readlinkSync(p);
  try {
    const target = fs.realpathSync(p);
    return { kind: 'link', target, dir: fs.statSync(target).isDirectory() };
  } catch {
    return { kind: 'dead', raw };
  }
}

const isFile = (p) => {
  try {
    return fs.statSync(p).isFile();
  } catch {
    return false;
  }
};

/** `a, b, c, …` past SHOWN names. */
const names = (list) => (list.length > SHOWN ? `${list.slice(0, SHOWN).join(', ')}, …` : list.join(', '));

const clip = (s, n = 70) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

/** One value of a settings key, short enough for one line. */
function brief(value) {
  if (Array.isArray(value)) return `${value.length} ${value.length === 1 ? 'entry' : 'entries'}`;
  if (value && typeof value === 'object') return `${Object.keys(value).length} ${Object.keys(value).length === 1 ? 'key' : 'keys'}`;
  return clip(JSON.stringify(value), 50);
}

// ---- the groups -------------------------------------------------------------

/**
 * Where an entry links, for its scope column: `link → <target>`, or `dead →`
 * with what it names. A dead link is a problem once, in `linkProblems`.
 */
function linkScope(c, found) {
  if (found.kind === 'link') return `link → ${c.show(found.target)}`;
  if (found.kind === 'dead') return `dead → ${found.raw}`;
  return found.dir ? 'folder' : 'file';
}

/**
 * Every `@` import in a rule file, resolved: relative to the file, or from
 * `~`. Claude Code follows them 5 deep, and so does this.
 */
function imports(c, file, text) {
  const found = [];
  const body = text.replace(/```[\s\S]*?```/g, '').replace(/`[^`\n]*`/g, '');
  for (const match of body.matchAll(/(?:^|\s)@(~?[\w./-]*\/[\w./-]+|[\w-]+\.md)\b/g)) {
    const raw = match[1];
    const resolved = raw.startsWith('~') ? c.home(raw) : path.resolve(path.dirname(file), raw);
    found.push(resolved);
  }
  return found;
}

/** A rule file and every file it imports, each once, in reading order. */
function ruleFile(c, file, items, seen, depth = 0, scope = 'rule file') {
  if (seen.has(file)) return;
  seen.add(file);
  let text;
  try {
    text = fs.readFileSync(file, 'utf8');
  } catch (e) {
    if (depth) items.push({ name: c.show(file), state: e.code === 'ENOENT' ? 'missing' : `unread: ${e.code}`, scope });
    return;
  }
  const found = entry(file);
  items.push({ name: c.show(file), scope: found.kind === 'link' ? `${scope}, link → ${c.show(found.target)}` : scope });
  if (depth >= 5) return;
  for (const next of imports(c, file, text)) ruleFile(c, next, items, seen, depth + 1, `imported by ${c.show(file)}`);
}

/** Every `*.md` under a rules folder, at any depth. */
function ruleFolder(c, dir) {
  const items = [];
  const walk = (at, prefix) => {
    const read = readDir(at);
    for (const name of read.names || []) {
      const p = path.join(at, name);
      const found = entry(p);
      if (found.dir) walk(p, `${prefix}${name}/`);
      else if (name.endsWith('.md')) items.push({ name: `${prefix}${name}`, scope: linkScope(c, found) });
    }
  };
  walk(dir, '');
  return items;
}

/** The skills under one `skills/` folder, plugins left to the plugins group. */
function skillItems(c, dir, overrides) {
  const read = readDir(dir);
  if (read.unread) return { unread: read.unread };
  const lock = readJson(c, path.join(c.at.agents, '.skill-lock.json'));
  const locked = (lock.value && lock.value.skills) || {};
  const agentsSkills = path.join(c.at.agents, 'skills') + path.sep;
  const items = [];
  for (const name of read.names || []) {
    if (name === 'synced' || name.startsWith('.')) continue;
    const p = path.join(dir, name);
    if (isFile(path.join(p, '.claude-plugin', 'plugin.json'))) continue;
    const found = entry(p);
    let scope = linkScope(c, found);
    if (found.kind === 'link' && found.target.startsWith(agentsSkills)) {
      const from = locked[name] && (locked[name].source || locked[name].sourceUrl);
      scope = from ? `npx skills, ${from}` : `npx skills, not in ${c.show(path.join(c.at.agents, '.skill-lock.json'))}`;
    }
    items.push({ name, state: skillState(overrides, name), scope });
  }
  return { items };
}

/** A skill is on unless `skillOverrides` says otherwise. */
const skillState = (overrides, name) => (overrides && overrides[name] && overrides[name] !== 'on' ? overrides[name] : 'on');

/** The skills synced from the claude.ai account: `skills/synced/<account>/<skill>/`. */
function syncedSkills(c, overrides) {
  const root = path.join(c.at.claude, 'skills', 'synced');
  const items = [];
  for (const account of readDir(root).names || []) {
    for (const name of readDir(path.join(root, account)).names || []) {
      if (name.startsWith('.') || !entry(path.join(root, account, name)).dir) continue;
      items.push({ name, state: skillState(overrides, name), scope: 'synced' });
    }
  }
  return items;
}

/** One folder's entries, for agents, commands and output styles. */
function folderItems(c, dir) {
  const read = readDir(dir);
  if (read.unread) return { unread: read.unread };
  return { items: (read.names || []).filter((n) => !n.startsWith('.')).map((name) => ({ name, scope: linkScope(c, entry(path.join(dir, name))) })) };
}

/** A settings file, key by key, its hooks, plugins and skill switches spelled out. */
function settingsGroup(c, title, file) {
  const read = readJson(c, file);
  if (read.unread) return { title, unread: read.unread };
  if (read.missing) return { title, items: [], note: `${c.show(file)} does not exist` };
  const settings = read.value || {};
  const items = [];
  for (const [key, value] of Object.entries(settings)) {
    const under = [];
    if (key === 'hooks') {
      for (const [event, rows] of Object.entries(value || {})) {
        for (const row of rows || []) {
          for (const hook of row.hooks || []) {
            under.push(`${event}${row.matcher ? ` ${row.matcher}` : ''}: ${clip(hook.command || hook.url || hook.type || '', 80)}`);
          }
        }
      }
    } else if (key === 'statusLine' && value) {
      under.push(clip(value.command || JSON.stringify(value), 80));
    } else if ((key === 'enabledPlugins' || key === 'skillOverrides') && value && typeof value === 'object') {
      for (const [name, on] of Object.entries(value)) under.push(`${name}: ${JSON.stringify(on)}`);
    } else if (key === 'permissions' && value && typeof value === 'object') {
      for (const [name, v] of Object.entries(value)) under.push(`${name}: ${brief(v)}`);
    }
    items.push({ name: key, scope: brief(value), under });
  }
  return { title, items };
}

/**
 * A plugin's folder, and everything it brings, read off that folder: skills,
 * agents, commands, hooks by event, and MCP servers, from `.mcp.json` or its
 * manifest.
 */
function carries(c, dir) {
  const under = [`folder: ${c.show(dir)}`];
  const listed = (sub, keep) => (readDir(path.join(dir, sub)).names || []).filter(keep);
  const skills = listed('skills', (n) => isFile(path.join(dir, 'skills', n, 'SKILL.md')));
  const agents = listed('agents', (n) => n.endsWith('.md')).map((n) => n.slice(0, -3));
  const commands = listed('commands', (n) => n.endsWith('.md')).map((n) => n.slice(0, -3));
  const manifest = readJson(c, path.join(dir, '.claude-plugin', 'plugin.json')).value || {};
  const hookFile = readJson(c, path.join(dir, 'hooks', 'hooks.json')).value;
  const hooks = Object.keys((hookFile && (hookFile.hooks || hookFile)) || (typeof manifest.hooks === 'object' && manifest.hooks) || {});
  const mcpFile = readJson(c, path.join(dir, '.mcp.json')).value;
  const servers = mcpFile ? mcpFile.mcpServers || mcpFile : typeof manifest.mcpServers === 'object' ? manifest.mcpServers : {};
  const mcp = Object.keys(servers || {});
  if (skills.length) under.push(`skills: ${names(skills)}`);
  if (agents.length) under.push(`agents: ${names(agents)}`);
  if (commands.length) under.push(`commands: ${names(commands)}`);
  if (hooks.length) under.push(`hooks: ${names(hooks)}`);
  if (mcp.length) under.push(`mcp: ${names(mcp)}`);
  return under;
}

/** Plugins saved as folders under a `skills/` folder, which load as `<name>@skills-dir`. */
function skillsDirPlugins(c, dir) {
  const found = [];
  for (const name of readDir(dir).names || []) {
    const folder = path.join(dir, name);
    const manifest = path.join(folder, '.claude-plugin', 'plugin.json');
    if (!isFile(manifest)) continue;
    const id = `${(readJson(c, manifest).value || {}).name || name}@skills-dir`;
    found.push({ id, scope: 'skills-dir', installPath: folder });
  }
  return found;
}

/** The synced plugins on disk, one manifest per claude.ai account. */
function syncedPlugins(c) {
  const root = path.join(c.at.claude, 'plugins', 'synced');
  const found = [];
  const unread = [];
  for (const account of readDir(root).names || []) {
    // Claude Code keeps a `.bucket-<account>` file beside each account's folder.
    if (account.startsWith('.') || !entry(path.join(root, account)).dir) continue;
    const file = path.join(root, account, 'manifest.json');
    const manifest = readJson(c, file);
    if (manifest.unread) unread.push(`${c.show(file)}: ${manifest.unread}`);
    for (const plugin of (manifest.value && manifest.value.plugins) || []) {
      found.push({ id: `${plugin.name}@synced`, scope: 'synced', installPath: path.join(root, account, plugin.name) });
    }
  }
  return { found, unread };
}

/**
 * Claude Code's own list, with CLAUDE_CODE_SAFE_MODE removed. It reads the
 * same Claude Code folder as the survey: a scratch one gets CLAUDE_CONFIG_DIR.
 * The real one never does, since that variable also moves `.claude.json`.
 */
function pluginList(c, cwd) {
  const env = { ...process.env };
  delete env.CLAUDE_CODE_SAFE_MODE;
  if (path.resolve(c.at.claude) !== path.resolve(paths.claudeHome())) env.CLAUDE_CONFIG_DIR = c.at.claude;
  const ran = spawnSync('claude', ['plugin', 'list', '--json'], { cwd, env, encoding: 'utf8', timeout: 60000 });
  if (ran.error) return { unread: ran.error.code === 'ENOENT' ? 'claude is not on the PATH' : ran.error.message };
  if (ran.status !== 0) {
    const said = `${ran.stderr || ''}${ran.stdout || ''}`.trim().split('\n')[0];
    return { unread: `exit ${ran.status}, ${JSON.stringify(clip(said))}` };
  }
  try {
    const list = JSON.parse(ran.stdout);
    if (Array.isArray(list)) return { list };
  } catch {
    // Falls through to the line below.
  }
  return { unread: 'printed something that is not a JSON list' };
}

/**
 * The plugins on disk, each with whether Claude Code's list says it is on.
 *
 * `project` null is the machine: every install whose scope names no project,
 * the synced ones, and the skills-folder ones. A folder is that project's:
 * every install whose `projectPath` names it, and its own skills-folder ones.
 */
function pluginGroups(c, project) {
  const record = path.join(c.at.claude, 'plugins', 'installed_plugins.json');
  const installed = readJson(c, record);
  const disk = [];
  const groups = [];

  for (const [id, rows] of Object.entries((installed.value && installed.value.plugins) || {})) {
    for (const row of [].concat(rows || [])) {
      const forProject = Boolean(row.projectPath);
      if (project ? !forProject || !sameFolder(row.projectPath, project) : forProject) continue;
      disk.push({ id, scope: row.scope || '?', installPath: row.installPath, installed: true });
    }
  }
  if (project) {
    disk.push(...skillsDirPlugins(c, path.join(project, '.claude', 'skills')));
  } else {
    const synced = syncedPlugins(c);
    disk.push(...synced.found);
    for (const u of synced.unread) groups.push({ title: 'synced plugins', unread: u });
    disk.push(...skillsDirPlugins(c, path.join(c.at.claude, 'skills')));
  }

  const listed = pluginList(c, project || (fs.existsSync(c.at.base) ? c.at.base : os.homedir()));
  const list = listed.list || [];
  const matched = new Set();
  const items = [];

  for (const plugin of disk) {
    const found = list.find((p) => !matched.has(p) && p.id === plugin.id && (!plugin.installed || p.scope === plugin.scope));
    let state = '?';
    if (found) {
      matched.add(found);
      state = found.enabled ? 'on' : 'off';
      if (found.required) state += ', required by your organization';
    } else if (listed.list) {
      c.problems.push(`${plugin.id} is on disk at ${c.show(plugin.installPath || '?')}, and missing from claude plugin list`);
    }
    items.push({ name: plugin.id, state, scope: plugin.scope, under: plugin.installPath ? carries(c, plugin.installPath) : [] });
  }

  // A plugin the list names and the disk does not. A project's list cannot
  // say which project a project-scope install belongs to, so only the
  // machine's survey looks for these.
  if (!project) {
    for (const p of list) {
      if (matched.has(p) || p.scope === 'project' || p.scope === 'local') continue;
      items.push({ name: p.id, state: p.enabled ? 'on' : 'off', scope: `${p.scope}, in the list only`, under: p.installPath ? carries(c, p.installPath) : [] });
      c.problems.push(`${p.id} is in claude plugin list, and nowhere on disk Flow reads`);
    }
  }

  if (installed.unread) groups.push({ title: `plugins (${c.show(record)})`, unread: installed.unread });
  if (listed.unread) groups.push({ title: 'plugins (claude plugin list)', unread: listed.unread });
  groups.unshift({ title: 'plugins', items });
  return groups;
}

/** True when 2 paths name one folder, through links too. */
function sameFolder(a, b) {
  const real = (p) => {
    try {
      return fs.realpathSync(p);
    } catch {
      return path.resolve(p);
    }
  };
  return real(a) === real(b);
}

/** A git repository's top folder and its `origin`, or null outside one. */
function repository(dir) {
  const git = (...args) => spawnSync('git', ['-C', dir, ...args], { encoding: 'utf8' });
  const top = git('rev-parse', '--show-toplevel');
  if (top.status !== 0) return null;
  const origin = git('remote', 'get-url', 'origin');
  return { top: top.stdout.trim(), origin: origin.status === 0 ? origin.stdout.trim().replace(/\.git$/, '') : null };
}

/**
 * util's sources, `~/.util/sources`: a folder listed twice, and 2 clones of
 * one repository, are problems. On 2026-10-06 util was listed from 2 clones,
 * and nobody compared the lines.
 */
function utilGroup(c) {
  const title = 'util sources';
  const file = path.join(c.utilHome, 'sources');
  let text;
  try {
    text = fs.readFileSync(file, 'utf8');
  } catch (e) {
    if (e.code === 'ENOENT') return { title, items: [], note: `${c.show(file)} does not exist` };
    return { title, unread: e.code || e.message };
  }
  const listed = text.split('\n')
    .map((l) => l.replace(/\s+#.*$/, '').trim())
    .filter((l) => l && !l.startsWith('#'))
    .map((l) => path.resolve(c.home(l)));
  const items = [];
  const seen = new Set();
  const byOrigin = new Map();
  for (const p of listed) {
    if (seen.has(p)) {
      c.problems.push(`${c.show(file)} lists ${c.show(p)} twice`);
      continue;
    }
    seen.add(p);
    const exists = fs.existsSync(p);
    items.push({ name: c.show(p), state: exists ? '' : 'missing' });
    const repo = exists && repository(p);
    if (repo && repo.origin) {
      const tops = byOrigin.get(repo.origin) || new Set();
      tops.add(repo.top);
      byOrigin.set(repo.origin, tops);
    }
  }
  for (const [origin, tops] of byOrigin) {
    if (tops.size > 1) {
      c.problems.push(`${c.show(file)} lists ${tops.size} clones of ${origin}: ${[...tops].map(c.show).join(' and ')}`);
    }
  }
  return { title, items };
}

/** The folder a Flow clone lives in, found walking up from a path inside it. */
function flowCloneOf(p) {
  for (let dir = p; dir !== path.dirname(dir); dir = path.dirname(dir)) {
    if (isFile(path.join(dir, 'scripts', 'flow.js')) && isFile(path.join(dir, 'skills', '.claude-plugin', 'plugin.json'))) return dir;
  }
  return null;
}

/**
 * Every link Flow could have made or met, checked: one pointing nowhere, and
 * one into a Flow clone other than the one this machine's install runs from,
 * which an older Flow left. The install's clone is the one `~/.flow/scripts`
 * links into, so a survey run from another checkout judges the same.
 */
function linkProblems(c) {
  const { at } = c;
  const installedScripts = entry(path.join(at.flow, 'scripts'));
  const clone = installedScripts.kind === 'link' ? path.dirname(installedScripts.target) : paths.cloneRoot();
  const older = [];
  const visit = (p, depth) => {
    const found = entry(p);
    if (found.kind === 'dead') c.problems.push(`${c.show(p)} points at ${found.raw}, which is gone`);
    if (found.kind === 'link') {
      const other = flowCloneOf(found.target);
      if (other && other !== clone) {
        older.push({ name: c.show(p), scope: `link → ${c.show(found.target)}` });
        c.problems.push(`${c.show(p)} links into ${c.show(other)}, a Flow clone this machine's install does not run from`);
      }
      return;
    }
    if (found.kind === 'real' && found.dir && depth > 0) {
      for (const name of readDir(p).names || []) visit(path.join(p, name), depth - 1);
    }
  };
  for (const dir of ['skills', 'agents', 'rules', 'commands', 'output-styles']) visit(path.join(at.claude, dir), dir === 'skills' ? 2 : 1);
  visit(path.join(at.agents, 'skills'), 3);
  visit(path.join(at.agents, 'AGENTS.md'), 0);
  for (const dir of ['scripts', 'references', 'docs']) visit(path.join(at.flow, dir), 0);
  visit(path.join(at.base, '.local', 'bin'), 1);
  return { title: 'older Flow', items: older };
}

/** The organization's settings on disk: reported, never changed. */
function managedGroup(c) {
  const title = 'managed settings';
  const read = readDir(c.managed);
  const note = 'an MDM policy or settings from the claude.ai console never reach the disk: /status in a session names them';
  if (read.unread) return { title, unread: `${c.show(c.managed)}: ${read.unread}` };
  const items = [];
  for (const name of read.names || []) {
    const p = path.join(c.managed, name);
    if (name.endsWith('.json')) {
      const json = readJson(c, p);
      items.push({ name: c.show(p), state: json.unread ? `unread: ${json.unread}` : '', scope: json.value ? brief(json.value) : '' });
    } else if (name === 'managed-settings.d') {
      for (const part of readDir(p).names || []) items.push({ name: c.show(path.join(p, part)) });
    } else {
      items.push({ name: c.show(p) });
    }
  }
  return { title, items, note };
}

/** An MCP server file: one line per server, with how it is reached. */
function mcpGroup(c, file) {
  const title = `mcp servers (${c.show(file)})`;
  const read = readJson(c, file);
  if (read.unread) return { title, unread: read.unread };
  const servers = (read.value && (read.value.mcpServers || read.value)) || {};
  return {
    title,
    items: Object.entries(servers).map(([name, s]) => ({ name, scope: (s && (s.type || (s.url ? 'http' : 'stdio'))) || '' })),
  };
}

/** Stops the survey where Claude Code's own folder cannot be read: nothing after it means anything. */
function requireClaudeFolder(c) {
  const read = readDir(c.at.claude);
  if (read.names) return;
  const why = read.missing ? 'it does not exist' : read.unread;
  throw new FlowError(`cannot read Claude Code's folder ${c.show(c.at.claude)}: ${why}. Nothing else means anything without it`);
}

// ---- the 2 surveys ----------------------------------------------------------

/** Everything that loads in every session on this machine. */
function machine(at) {
  const c = context(at);
  requireClaudeFolder(c);
  const settings = settingsGroup(c, `settings (${c.show(path.join(at.claude, 'settings.json'))})`, path.join(at.claude, 'settings.json'));
  const overrides = (readJson({ ...c, problems: [] }, path.join(at.claude, 'settings.json')).value || {}).skillOverrides;

  const rules = [];
  const seen = new Set();
  ruleFile(c, path.join(at.claude, 'CLAUDE.md'), rules, seen);
  ruleFile(c, path.join(at.agents, 'AGENTS.md'), rules, seen);
  rules.push(...ruleFolder(c, path.join(at.claude, 'rules')).map((i) => ({ ...i, name: `${c.show(path.join(at.claude, 'rules'))}/${i.name}` })));

  const skills = skillItems(c, path.join(at.claude, 'skills'), overrides);
  const dir = (name) => ({ title: `${name} (${c.show(path.join(at.claude, name))})`, ...folderItems(c, path.join(at.claude, name)) });

  const claudeScope = process.env.CLAUDE_CONFIG_DIR && path.resolve(at.base) === os.homedir() ? 'moved by CLAUDE_CONFIG_DIR' : '';
  const groups = [
    { title: 'claude folder', items: [{ name: c.show(at.claude), scope: claudeScope }] },
    linkProblems(c),
    { title: 'rule files', items: rules },
    { title: `skills (${c.show(path.join(at.claude, 'skills'))})`, ...skills, items: [...(skills.items || []), ...syncedSkills(c, overrides)] },
    ...pluginGroups(c, null),
    settings,
    dir('agents'),
    dir('commands'),
    dir('output-styles'),
    managedGroup(c),
    utilGroup(c),
  ];
  return { groups, problems: c.problems };
}

/** Everything that loads in one project's sessions, beyond the machine's. */
function project(at, folder) {
  const c = context(at);
  requireClaudeFolder(c);
  const dir = path.resolve(folder);
  if (!entry(dir).dir) throw new FlowError(`${c.show(dir)} is not a folder`);
  const claude = path.join(dir, '.claude');
  const local = readJson({ ...c, problems: [] }, path.join(claude, 'settings.local.json')).value || {};
  const shared = readJson({ ...c, problems: [] }, path.join(claude, 'settings.json')).value || {};
  const overrides = { ...shared.skillOverrides, ...local.skillOverrides };

  const rules = [];
  const seen = new Set();
  for (const name of ['CLAUDE.md', 'CLAUDE.local.md', 'AGENTS.md']) ruleFile(c, path.join(dir, name), rules, seen);
  rules.push(...ruleFolder(c, path.join(claude, 'rules')).map((i) => ({ ...i, name: `.claude/rules/${i.name}` })));

  const sub = (name) => ({ title: `${name} (${c.show(path.join(claude, name))})`, ...folderItems(c, path.join(claude, name)) });

  const groups = [
    { title: 'project', items: [{ name: c.show(dir) }] },
    { title: 'rule files', items: rules },
    { title: `skills (${c.show(path.join(claude, 'skills'))})`, ...skillItems(c, path.join(claude, 'skills'), overrides) },
    ...pluginGroups(c, dir),
    settingsGroup(c, `settings (${c.show(path.join(claude, 'settings.json'))})`, path.join(claude, 'settings.json')),
    settingsGroup(c, `local settings (${c.show(path.join(claude, 'settings.local.json'))})`, path.join(claude, 'settings.local.json')),
    sub('agents'),
    sub('commands'),
    mcpGroup(c, path.join(dir, '.mcp.json')),
  ];
  return { groups, problems: c.problems };
}

// ---- the text -------------------------------------------------------------

/**
 * Plain text, one line per item, grouped by source, and `problems` last. Its
 * 2 readers, the agent and the user, both read text fastest. Tests and
 * `flow doctor` read the object this prints from, never the text.
 */
function render(result) {
  const lines = [];
  for (const group of result.groups) {
    if (group.unread) {
      lines.push(`${group.title}   unread: ${group.unread}`);
      continue;
    }
    lines.push(group.title);
    const items = group.items || [];
    const wide = Math.min(48, Math.max(0, ...items.map((i) => i.name.length)));
    const stateWide = Math.max(0, ...items.map((i) => (i.state || '').length));
    for (const item of items) {
      const row = [item.name.padEnd(wide), (item.state || '').padEnd(stateWide), item.scope || ''];
      lines.push(`  ${row.join('   ').trimEnd()}`);
      for (const u of item.under || []) lines.push(`    ${u}`);
    }
    if (!items.length) lines.push('  none');
    if (group.note) lines.push(`  (${group.note})`);
  }
  lines.push('problems');
  for (const p of result.problems) lines.push(`  ${p}`);
  if (!result.problems.length) lines.push('  none');
  return lines.join('\n');
}

module.exports = { machine, project, render };
