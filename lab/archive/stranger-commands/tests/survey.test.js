'use strict';
/**
 * The survey, read against the machine Flow's setup misread on 2026-10-06.
 *
 * Each test calls the function behind `flow survey` and reads the object it
 * returns, never the text, apart from the tests of the text and the command.
 * The stub `claude` is put on PATH for the run, and CLAUDE_CODE_SAFE_MODE is
 * set the way the machine's setup session sets it.
 */

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { claudeStub, pathWith, write, run } = require('./helpers/scratch');
const { oldMachine } = require('./helpers/old-machine');
const paths = require('../lib/paths');
const survey = require('../lib/machine/survey');

/** Run `fn` with `bin` in front of PATH and `extra` in the environment, then put both back. */
function withEnv(bin, extra, fn) {
  const saved = { ...process.env };
  process.env.PATH = pathWith(bin);
  Object.assign(process.env, extra);
  try {
    return fn();
  } finally {
    for (const key of Object.keys(process.env)) if (!(key in saved)) delete process.env[key];
    Object.assign(process.env, saved);
  }
}

const SAFE = { CLAUDE_CODE_SAFE_MODE: '1' };

const machineOf = (m, bin = m.bin, extra = SAFE) => withEnv(bin, extra, () => survey.machine(paths.folders(m.root)));
const projectOf = (m, folder, bin = m.bin) => withEnv(bin, SAFE, () => survey.project(paths.folders(m.root), folder));

const group = (result, title) => result.groups.find((g) => g.title === title || g.title.startsWith(`${title} (`));
const itemNames = (g) => (g.items || []).map((i) => i.name);

test('in safe mode the machine still lists both synced plugins, switched off', () => {
  const m = oldMachine('survey-synced');
  const result = machineOf(m);
  const plugins = group(result, 'plugins');
  assert.deepStrictEqual(result.groups.filter((g) => g.unread), [], 'the .bucket file beside the account is no source');

  for (const id of ['engineering@synced', 'productivity@synced']) {
    const item = plugins.items.find((i) => i.name === id);
    assert.ok(item, `${id} listed`);
    assert.strictEqual(item.state, 'off');
    assert.strictEqual(item.scope, 'synced');
  }
  const engineering = plugins.items.find((i) => i.name === 'engineering@synced');
  assert.deepStrictEqual(engineering.under, [
    'folder: ~/.claude/plugins/synced/account-1/engineering', 'skills: code-review, standup', 'mcp: github, linear',
  ]);
  const productivity = plugins.items.find((i) => i.name === 'productivity@synced');
  assert.ok(
    productivity.under.includes('mcp: slack, notion, asana, linear, atlassian, monday, clickup, google-calendar, gmail, box'),
    'every MCP server listed, past 8',
  );
});

test('the machine lists no plugin installed for one project', () => {
  const m = oldMachine('survey-no-project');
  const result = machineOf(m);
  const listed = itemNames(group(result, 'plugins'));

  assert.deepStrictEqual(listed.sort(), [
    'engineering@synced', 'frontend-design@claude-plugins-official', 'productivity@synced', 'typescript-lsp@claude-plugins-official',
  ]);
  for (const plugin of ['playwright', 'greptile', 'superpowers', 'supabase']) {
    assert.ok(!listed.some((id) => id.startsWith(plugin)), `${plugin} left out`);
  }
  assert.ok(!result.problems.some((p) => /claude plugin list/.test(p)), result.problems.join('\n'));
});

test('util listed from 2 clones of one repository is a problem', () => {
  const m = oldMachine('survey-util-clones');
  const result = machineOf(m);

  assert.strictEqual(group(result, 'util sources').items.length, 2);
  assert.ok(result.problems.some((p) => /lists 2 clones of https:\/\/github\.com\/Adrian333Dev\/util: ~\/\.flow\/repos\/util and ~\/code\/util/.test(p)), result.problems.join('\n'));
});

test('a folder listed twice in util sources is a problem', () => {
  const m = oldMachine('survey-util-twice');
  const sources = path.join(m.root, '.util', 'sources');
  const first = fs.readFileSync(sources, 'utf8').split('\n')[0];
  fs.writeFileSync(sources, `${first}\n${first}\n`);

  assert.ok(machineOf(m).problems.some((p) => p.endsWith('lists ~/.flow/repos/util/commands twice')));
});

test('a project lists the plugins installed for it, and no other', () => {
  const m = oldMachine('survey-project');
  const lumacraft = group(projectOf(m, m.projects.lumacraft_v2), 'plugins');
  const delapse = group(projectOf(m, m.projects.delapse), 'plugins');

  assert.deepStrictEqual(itemNames(lumacraft).map((id) => id.split('@')[0]).sort(),
    ['frontend-design', 'greptile', 'playwright', 'superpowers', 'typescript-lsp']);
  assert.deepStrictEqual(itemNames(delapse).map((id) => id.split('@')[0]).sort(), ['supabase', 'superpowers']);
  for (const item of lumacraft.items) assert.strictEqual(item.scope, 'project');
  assert.ok(lumacraft.items.find((i) => i.name.startsWith('superpowers')).under.includes('hooks: SessionStart'));
});

test("a project lists its own files: rules, skills, settings and MCP servers", () => {
  const m = oldMachine('survey-project-files');
  const dir = m.projects.delapse;
  write(dir, 'CLAUDE.md', 'Use pnpm.\n');
  write(dir, '.claude/rules/db.md', 'Migrations only.\n');
  write(dir, '.claude/skills/deploy/SKILL.md', 'x');
  write(dir, '.claude/settings.local.json', JSON.stringify({ skillOverrides: { deploy: 'off' } }));
  write(dir, '.mcp.json', JSON.stringify({ mcpServers: { supabase: { type: 'http', url: 'https://x' } } }));
  const result = projectOf(m, dir);

  assert.deepStrictEqual(itemNames(group(result, 'rule files')), ['~/code/projects/delapse/CLAUDE.md', '.claude/rules/db.md']);
  assert.deepStrictEqual(group(result, 'skills').items, [{ name: 'deploy', state: 'off', scope: 'folder' }]);
  assert.deepStrictEqual(group(result, 'mcp servers').items, [{ name: 'supabase', scope: 'http' }]);
});

test("a project's AGENTS.md beside a CLAUDE.md is off, and one CLAUDE.md imports lists once", () => {
  const m = oldMachine('survey-agents-md');
  const { delapse, lumacraft_v2: lumacraft } = m.projects;
  write(delapse, 'CLAUDE.md', 'Use pnpm.\n');
  write(delapse, 'AGENTS.md', 'Use npm.\n');
  write(lumacraft, 'CLAUDE.md', '@AGENTS.md\n');
  write(lumacraft, 'AGENTS.md', 'Use pnpm.\n');

  assert.deepStrictEqual(group(projectOf(m, delapse), 'rule files').items, [
    { name: '~/code/projects/delapse/CLAUDE.md', scope: 'rule file' },
    { name: '~/code/projects/delapse/AGENTS.md', state: 'off', scope: 'not read: ~/code/projects/delapse/CLAUDE.md is present' },
  ]);
  assert.deepStrictEqual(group(projectOf(m, lumacraft), 'rule files').items, [
    { name: '~/code/projects/lumacraft_v2/CLAUDE.md', scope: 'rule file' },
    { name: '~/code/projects/lumacraft_v2/AGENTS.md', scope: 'imported by ~/code/projects/lumacraft_v2/CLAUDE.md' },
  ]);
});

test("a CLAUDE.md in a folder above turns a project's AGENTS.md off, and the setting turns it back on", () => {
  const m = oldMachine('survey-agents-md-above');
  const dir = m.projects.delapse;
  write(dir, 'AGENTS.md', 'Use npm.\n');
  assert.deepStrictEqual(group(projectOf(m, dir), 'rule files').items, [{ name: '~/code/projects/delapse/AGENTS.md', scope: 'rule file' }]);

  write(path.dirname(dir), 'CLAUDE.md', 'Every project.\n');
  assert.deepStrictEqual(group(projectOf(m, dir), 'rule files').items, [
    { name: '~/code/projects/delapse/AGENTS.md', state: 'off', scope: 'not read: ~/code/projects/CLAUDE.md is present' },
  ]);

  const settings = path.join(paths.folders(m.root).claude, 'settings.json');
  const config = { pluginConfigs: { 'agents-md@builtin': { options: { instructionFiles: 'claude-md-and-agents-md' } } } };
  fs.writeFileSync(settings, JSON.stringify({ ...JSON.parse(fs.readFileSync(settings, 'utf8')), ...config }));
  assert.deepStrictEqual(group(projectOf(m, dir), 'rule files').items, [{ name: '~/code/projects/delapse/AGENTS.md', scope: 'rule file' }]);
});

test('an MCP server the settings approve and .mcp.json does not define is a problem', () => {
  const m = oldMachine('survey-stale-mcp');
  const dir = m.projects.delapse;
  write(dir, '.mcp.json', JSON.stringify({ mcpServers: { context7: { command: 'npx' }, supabase: { type: 'http', url: 'https://x' } } }));
  write(dir, '.claude/settings.local.json', JSON.stringify({ enabledMcpjsonServers: ['context7', 'playwright', 'supabase'] }));
  assert.deepStrictEqual(
    projectOf(m, dir).problems.filter((p) => p.includes('.mcp.json')),
    ['~/code/projects/delapse/.claude/settings.local.json names playwright in enabledMcpjsonServers, and .mcp.json does not define it'],
  );
});

test('the machine lists rule files with their imports, skills, and settings key by key', () => {
  const m = oldMachine('survey-machine-files');
  const result = machineOf(m);

  assert.deepStrictEqual(itemNames(group(result, 'rule files')), ['~/.claude/CLAUDE.md', '~/notes/rules.md']);
  assert.deepStrictEqual(group(result, 'skills').items, [
    { name: 'tdd', state: 'on', scope: 'folder' },
    { name: 'grill-me', state: 'off', scope: 'synced' },
  ]);
  const settings = group(result, 'settings');
  assert.deepStrictEqual(itemNames(settings), ['model', 'skillOverrides', 'hooks']);
  assert.deepStrictEqual(settings.items[2].under, ['Stop: node ~/hooks/stop.js']);
});

test('a settings file that is not JSON prints unread, and the rest still lists', () => {
  const m = oldMachine('survey-bad-json');
  fs.writeFileSync(path.join(m.claude, 'settings.json'), '{ "model": ');
  const result = machineOf(m);

  assert.match(group(result, 'settings').unread, /^not valid JSON/);
  assert.ok(result.problems.some((p) => p.startsWith('~/.claude/settings.json is not valid JSON')));
  assert.strictEqual(group(result, 'plugins').items.length, 4);
});

test('a list that fails prints unread, and the plugins on disk still list', () => {
  const m = oldMachine('survey-list-fails');
  const result = machineOf(m, claudeStub(m.dir, { fails: 'not signed in', name: 'claude-fails' }));

  assert.strictEqual(group(result, 'plugins (claude plugin list)').unread, 'exit 1, "not signed in"');
  const plugins = group(result, 'plugins');
  assert.strictEqual(plugins.items.length, 4);
  for (const item of plugins.items) assert.strictEqual(item.state, '?');
});

test('the disk and the list disagreeing is a problem, both ways', () => {
  const m = oldMachine('survey-disagree');
  const list = m.list.filter((p) => !p.id.startsWith('typescript-lsp')).concat({ id: 'ghost@somewhere', scope: 'user', enabled: true });
  const result = machineOf(m, claudeStub(m.dir, { list, name: 'claude-disagree' }));

  assert.ok(result.problems.some((p) => /^typescript-lsp@claude-plugins-official is on disk at .*, and missing from claude plugin list$/.test(p)), result.problems.join('\n'));
  assert.ok(result.problems.includes('ghost@somewhere is in claude plugin list, and nowhere on disk Flow reads'));
});

test("a dead link and a link into an older Flow's clone are problems", () => {
  const m = oldMachine('survey-links');
  const old = path.join(m.root, 'old', 'flow');
  write(old, 'scripts/flow.js', '');
  write(old, 'skills/.claude-plugin/plugin.json', '{}');
  write(old, 'skills/phases/plan/SKILL.md', 'x');
  fs.symlinkSync(path.join(old, 'skills', 'phases', 'plan'), path.join(m.claude, 'skills', 'plan'));
  fs.mkdirSync(path.join(m.claude, 'agents'), { recursive: true });
  fs.symlinkSync(path.join(m.root, 'nowhere.md'), path.join(m.claude, 'agents', 'gone.md'));
  const result = machineOf(m);

  assert.deepStrictEqual(itemNames(group(result, 'older Flow')), ['~/.claude/skills/plan']);
  assert.ok(result.problems.includes("~/.claude/skills/plan links into ~/old/flow, a Flow clone this machine's install does not run from"));
  assert.ok(result.problems.some((p) => /^~\/\.claude\/agents\/gone\.md points at .*nowhere\.md, which is gone$/.test(p)));
});

test("an unreadable Claude Code folder stops the survey", () => {
  const m = oldMachine('survey-no-claude');
  fs.rmSync(m.claude, { recursive: true });

  assert.throws(() => machineOf(m), /cannot read Claude Code's folder ~\/\.claude: it does not exist/);
});

test('flow survey runs on a machine setup has not finished, and --project reads one project', () => {
  const m = oldMachine('survey-command');
  const env = { ...process.env, PATH: pathWith(m.bin), ...SAFE };
  assert.ok(!fs.existsSync(path.join(m.root, '.flow', 'version')), 'setup never finished here');

  const machine = run('flow.js', ['survey', '--root', m.root], { env });
  assert.strictEqual(machine.code, 0, machine.stderr);
  assert.match(machine.stdout, /^ {2}engineering@synced +off +synced$/m);
  assert.match(machine.stdout, /lists 2 clones of/);
  assert.doesNotMatch(machine.stdout, /playwright/);

  const lumacraft = run('flow.js', ['survey', '--root', m.root, '--project', m.projects.lumacraft_v2], { env });
  assert.strictEqual(lumacraft.code, 0, lumacraft.stderr);
  assert.strictEqual((lumacraft.stdout.match(/@claude-plugins-official +off +project$/gm) || []).length, 5, lumacraft.stdout);
});

test('the text holds one line per item, unread sources, and the problems last', () => {
  const m = oldMachine('survey-text');
  const text = survey.render(machineOf(m, claudeStub(m.dir, { fails: 'not signed in', name: 'claude-text' })));
  const lines = text.split('\n');

  assert.ok(lines.includes('plugins (claude plugin list)   unread: exit 1, "not signed in"'));
  assert.ok(lines.some((l) => /^ {2}engineering@synced +\? +synced$/.test(l)), text);
  assert.ok(lines.includes('    mcp: github, linear'));
  assert.strictEqual(lines[lines.length - 2], 'problems');
});
