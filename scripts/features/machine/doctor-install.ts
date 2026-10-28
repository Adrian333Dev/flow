/**
 * The `flow doctor` checks of an install: the links Flow made, the plugin
 * folder, what Claude Code reads and `settings.json`. Every check is a read.
 */

import fs from 'node:fs';
import path from 'node:path';
import * as installed from './installed.ts';
import { markdownFiles } from './links.ts';
import * as setupSession from './setup-session.ts';
import * as skills from '../skills/skills.ts';
import * as paths from '../../shared/paths.ts';

/** Typed names util puts there, linked into util's clone at `~/.flow/repos/util/`. */
const UTIL_BIN = ['util', 'u'];

/**
 * What a path is, as one word.
 *
 * Four states rather than a boolean, because the fix differs for each: a
 * missing link means the install never ran, a broken one means the clone moved,
 * and a real file means something that is not Flow's owns the name.
 */
function inspect(p): { state: string; target?: string; raw?: string } {
  let stat;
  try {
    stat = fs.lstatSync(p);
  } catch {
    return { state: 'missing' };
  }
  if (!stat.isSymbolicLink()) return { state: 'real' };
  try {
    return { state: 'ok', target: fs.realpathSync(p) };
  } catch {
    return { state: 'broken', raw: fs.readlinkSync(p) };
  }
}

/**
 * Each wanted link, checked against its target: `{ at, target, what, fix }`.
 *
 * The target is compared after resolving both sides, so a clone reached
 * through a linked folder still counts as this clone. `fix` names the command
 * that makes the link, and only a link `flow install` does not make has to say
 * so.
 */
function checkLinks(wanted) {
  const problems : string[] = [];
  const real = (p) => {
    try {
      return fs.realpathSync(p);
    } catch {
      return p;
    }
  };
  for (const item of wanted) {
    const found = inspect(item.at);
    const fix = item.fix || 'run flow install';
    if (found.state === 'missing') problems.push(`${item.what} is not linked: ${fix}`);
    else if (found.state === 'real') problems.push(`${item.what} is a real file, not a link: Flow never wrote it`);
    else if (found.state === 'broken') problems.push(`${item.what} points at ${found.raw}, which is gone: ${fix}`);
    else if (found.target !== real(item.target)) problems.push(`${item.what} points at ${found.target}, not ${paths.shorten(item.target)}: ${fix}`);
  }
  return problems;
}

/** One or many, so a count never reads "1 rules". */
const count = (n, one, many) => `${n} ${n === 1 ? one : many}`;

/**
 * The file a hook depends on: the first path in the command line ending in .ts,
 * .js or .mjs, or in .md for a hook that prints a file instead of running a script.
 * .js stays until every machine's settings name the .ts hooks.
 */
function scriptOf(command) {
  const found = /([^\s"']+\.(?:ts|js|mjs|md))/.exec(command || '');
  return found ? found[1] : null;
}

/** Every hook in a settings object, flattened to one row each. */
function hookRows(settings) {
  const rows : any[] = [];
  for (const [event, entries] of Object.entries((settings && settings.hooks) || {})) {
    for (const entry of (entries as any[]) || []) {
      for (const hook of entry.hooks || []) {
        rows.push({ event, matcher: entry.matcher || '', script: scriptOf(hook.command) });
      }
    }
  }
  return rows;
}

const label = (row) => (row.matcher ? `${row.event} ${row.matcher}` : row.event);

/** The names you type, linked into ~/.local/bin. features/machine/prereq.ts has the programs. */
function checkNames(clone, { bin }) {
  const problems : string[] = [];
  const counted : string[] = [];

  if (bin) {
    const dirs = (process.env.PATH || '').split(path.delimiter).map((d) => path.resolve(d || '.'));
    if (!dirs.includes(path.resolve(bin))) {
      problems.push(`${bin} is not on PATH, so every name below is unreachable however it is linked`);
    }
    for (const [name, file] of Object.entries(installed.BIN)) {
      const found = inspect(path.join(bin, name));
      const wanted = path.join(clone, file);
      if (found.state === 'missing') problems.push(`${name} is not linked: run flow install`);
      else if (found.state === 'real') problems.push(`${name} is a real file, not a link: Flow never wrote it`);
      else if (found.state === 'broken') problems.push(`${name} points at ${found.raw}, which is gone: run flow install`);
      else if (found.target !== wanted) problems.push(`${name} runs ${found.target}, not this clone: run flow install`);
      else counted.push(name);
    }
    for (const name of UTIL_BIN) {
      const found = inspect(path.join(bin, name));
      if (found.state === 'ok') counted.push(name);
      else if (found.state === 'missing') problems.push(`${name} is not linked: run flow install`);
      else if (found.state === 'real') problems.push(`${name} is a real file, not a link`);
      else problems.push(`${name} points at ${found.raw}, which is gone: run flow install`);
    }
  }

  return { name: 'names', problems, summary: `${counted.join(', ')} all resolve` };
}

/**
 * The one real copy of everything Flow keeps outside the clone: the plugin
 * folder with its manifest and a link per skill, and the rule file.
 */
function checkAgents(at, catalog) {
  const problems : string[] = [];

  // A clash is reported rather than thrown, so the rest of the report still
  // prints. Two skills sharing a name is not a missing link: a link is named
  // for the skill, so one would silently overwrite the other.
  if (catalog.error) problems.push(catalog.error.message.split('\n')[0]);
  const installable = catalog.skills;

  const plugin = skills.pluginDir(at.agents);
  const found = inspect(plugin);
  if (found.state !== 'missing' && found.state !== 'real') {
    problems.push(`${paths.shorten(plugin)} is a link: it has to be the real folder, and ~/.claude/skills/flow the link to it`);
  }

  const linkDir = skills.linkDir(at.agents);
  problems.push(...checkLinks(installable.map((s) => ({
    at: path.join(linkDir, s.name), target: s.dir, what: `skills/${s.name}`,
  }))));

  // The one file that gives every skill its name. Without it the skills still
  // load, under bare names, and every command in every doc is wrong by one word.
  const manifest = skills.manifestFile(at.agents);
  let manifestName : string | null = null;
  try {
    manifestName = JSON.parse(fs.readFileSync(manifest, 'utf8')).name;
  } catch (e: any) {
    problems.push(e.code === 'ENOENT'
      ? `${paths.shorten(manifest)} is missing, so the skills load unprefixed: run flow install`
      : `${paths.shorten(manifest)} is not valid JSON: ${e.message}`);
  }
  if (manifestName && manifestName !== skills.PLUGIN) {
    problems.push(`the plugin manifest names "${manifestName}", so the skills are typed /${manifestName}:groundwork: run flow install`);
  }

  return {
    name: paths.shorten(at.agents),
    problems,
    summary: `${count(installable.length, 'skill', 'skills')} linked under skills/${skills.PLUGIN}/`,
  };
}

/**
 * What Claude Code reads: the link to the plugin folder, one link per agent,
 * rule and command, and `CLAUDE.md`, a link to the rule file `~/.flow/CLAUDE.md`.
 */
function checkClaude(clone, at) {
  const agents = markdownFiles(path.join(clone, 'claude', 'agents'));
  const rules = markdownFiles(path.join(clone, 'claude', 'rules'));
  const commands = markdownFiles(path.join(clone, 'claude', 'commands'));
  const problems = checkLinks([
    { at: skills.pluginLink(at.claude), target: skills.pluginDir(at.agents), what: `skills/${skills.PLUGIN}` },
    // Without it Claude Code starts every session with none of the rules.
    { at: path.join(at.claude, 'CLAUDE.md'), target: path.join(at.flow, 'CLAUDE.md'), what: 'CLAUDE.md' },
    ...agents.map((f) => ({ at: path.join(at.claude, 'agents', f), target: path.join(clone, 'claude', 'agents', f), what: `agents/${f}` })),
    ...rules.map((f) => ({ at: path.join(at.claude, 'rules', f), target: path.join(clone, 'claude', 'rules', f), what: `rules/${f}` })),
    ...commands.map((f) => ({ at: path.join(at.claude, 'commands', f), target: path.join(clone, 'claude', 'commands', f), what: `commands/${f}` })),
  ]);

  // `flow install` owes the setup session, which finishes settings.json and
  // sorts the old rules. A marker still standing means that session never
  // reached its last step.
  if (setupSession.isPending(at)) {
    problems.push(`the setup session did not finish (${paths.shorten(setupSession.pendingFile(at))} stands): run flow install`);
  }

  const counted = [
    `skills/${skills.PLUGIN}`,
    count(agents.length, 'agent', 'agents'),
    count(rules.length, 'rule', 'rules'),
    count(commands.length, 'command', 'commands'),
  ].join(', ');
  return { name: paths.shorten(at.claude), problems, summary: `${counted} and CLAUDE.md linked` };
}

/**
 * The skills synced from the claude.ai account: one folder per skill under
 * `~/.claude/skills/synced/<account>/`, beside files that start with a dot.
 */
function syncedSkills(claude) {
  const root = path.join(claude, 'skills', 'synced');
  const names = new Set<string>();
  try {
    for (const account of fs.readdirSync(root, { withFileTypes: true })) {
      if (!account.isDirectory() || account.name.startsWith('.')) continue;
      for (const skill of fs.readdirSync(path.join(root, account.name), { withFileTypes: true })) {
        if (skill.isDirectory() && !skill.name.startsWith('.')) names.add(skill.name);
      }
    }
  } catch {
    // No synced folder: this machine never signed in to claude.ai.
  }
  return [...names].sort();
}

/**
 * settings.json: the one file Flow shares rather than owns.
 *
 * It already holds your model, your plugins and your effort level, so no
 * code writes it. The setup session `flow update` and `flow install` owe does:
 * an agent reads it beside `home/settings.json` and adds what Flow needs. A
 * session that never finished is the likeliest state on this whole page.
 */
function checkSettings(clone, claude, catalog) {
  const problems : string[] = [];
  const file = path.join(claude, 'settings.json');
  let live;
  try {
    live = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e: any) {
    const why = e.code === 'ENOENT'
      ? "does not exist, so none of Flow's hooks run"
      : `does not parse: ${e.message}`;
    return {
      name: 'settings.json',
      problems: [`${file} ${why}: run flow update, whose setup session fixes settings.json from ${path.join(clone, 'home', 'settings.json')}`],
    };
  }

  const template = JSON.parse(fs.readFileSync(path.join(clone, 'home', 'settings.json'), 'utf8'));
  const installed = hookRows(live);
  const wanted = hookRows(template);

  for (const row of wanted) {
    const match = installed.find((h) => h.event === row.event && h.matcher === row.matcher &&
      h.script && path.basename(h.script) === path.basename(row.script));
    if (!match) {
      problems.push(`no ${label(row)} hook running ${path.basename(row.script)}: run flow update, whose setup session fixes settings.json`);
      continue;
    }
    const resolved = paths.expandHome(match.script);
    if (!fs.existsSync(resolved)) problems.push(`the ${label(row)} hook names ${match.script}, which is not on disk`);
  }

  // `skillOverrides` cannot reach a plugin's skills, and Flow's are a plugin,
  // so a key naming one is read by nothing and nothing reports it. Every other
  // key names a skill from outside this clone, which Flow has no business judging.
  for (const name of Object.keys(live.skillOverrides || {})) {
    if (!catalog.error && catalog.names.has(name)) {
      problems.push(`skillOverrides names "${name}", a Flow skill, and does nothing: ` +
        `Flow's skills load as the ${skills.PLUGIN} plugin, and skillOverrides does not reach a plugin`);
    }
  }

  // A skill synced from the claude.ai account arrives in any session signed in
  // to claude.ai, a day after setup on this machine once, and loads everywhere
  // unless skillOverrides decides it. "on" counts as decided: it keeps the skill.
  for (const name of syncedSkills(claude)) {
    if (!(name in (live.skillOverrides || {}))) {
      problems.push(`the synced skill "${name}" has no skillOverrides entry, so it loads in every session: ` +
        `add "${name}": "off" to skillOverrides in ${paths.shorten(file)} to switch it off, or "on" to keep it`);
    }
  }

  // With no mode set, Claude Code starts a session on a Pro, Max or Team plan
  // in auto mode, and nothing on screen says so. A missing key is a setup
  // session that never finished, so it fails. A different mode is somebody's choice, so it is a
  // note: docs/spec/permissions.md argues the case, and this only reports it.
  const notes : string[] = [];
  const wantedMode = (template.permissions || {}).defaultMode;
  const liveMode = (live.permissions || {}).defaultMode;
  if (wantedMode && !liveMode) {
    problems.push(`permissions.defaultMode is not set, so a session on a Pro, Max or Team plan starts in auto mode: ` +
      `merge "defaultMode": "${wantedMode}" from the template`);
  } else if (wantedMode && liveMode !== wantedMode) {
    notes.push(`permissions.defaultMode is "${liveMode}", and Flow's template starts every session in "${wantedMode}"`);
  }

  const summary = `${count(wanted.length, 'hook', 'hooks')} registered, every file they name on disk` +
    (wantedMode ? `, sessions start in "${liveMode}" mode` : '');
  return { name: 'settings.json', problems, notes, summary };
}

/** What only Flow reads. Claude Code never opens any of the 4. */
function checkFlowHome(clone, flowHome) {
  const problems = checkLinks(['scripts', 'guides', 'docs', 'prompts'].map((name) => ({
    at: path.join(flowHome, name), target: path.join(clone, name), what: name,
  })));
  return { name: paths.shorten(flowHome), problems, summary: 'scripts, guides, docs and prompts resolve into this clone' };
}

export { inspect, count, checkNames, checkAgents, checkClaude, checkSettings, checkFlowHome };
