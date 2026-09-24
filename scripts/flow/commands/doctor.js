'use strict';
/**
 * `flow doctor`: everything about an installed machine a function can decide.
 *
 * The management skill runs this first, then walks what no function can reach:
 * whether a hook actually fires, and whether a rule holds under load. The split
 * is the whole point. A skill asked to check 20 symlinks by hand gets one wrong
 * and reports success, so every check a function can make is made here and the
 * skill reads an exit code.
 *
 * Nothing is written. Every check is a read, so running this against a broken
 * machine can only ever tell you more about it.
 *
 * `flow check` is the other verification command and answers a different
 * question: the ticket graph in the project you are standing in. That one needs
 * a project and refuses without one. This one needs a machine and runs from
 * anywhere, install day included.
 *
 * The flags exist so the tests can run a real install and then verify it.
 * `--root` reads the whole install under a scratch folder in place of the home
 * folder, the same as `flow install --root`. `--no-bin` matches
 * `flow install --no-bin` (a scratch install writes no names into
 * ~/.local/bin, so there are none to check), and `--no-tests` drops the 2
 * suites, which are the only slow part of this.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const { out } = require('../lib/cli');
const { cloneRoot } = require('../lib/clone');
const installed = require('../lib/installed');
const { markdownFiles } = require('../lib/links');
const machine = require('../lib/machine');
const migrations = require('../lib/migrations');
const originals = require('../lib/originals');
const prereq = require('../lib/prereq');
const render = require('../lib/render');
const { projectRoot } = require('../lib/root');
const links = require('../lib/skill-links');
const skills = require('../lib/skills');
const version = require('../lib/version');

/** Typed names util puts there, linked into util's clone at `~/.flow/repos/util/`. */
const UTIL_BIN = ['util', 'u'];

/**
 * What a path is, as one word.
 *
 * Four states rather than a boolean, because the fix differs for each: a
 * missing link means the install never ran, a broken one means the clone moved,
 * and a real file means something that is not Flow's owns the name.
 */
function inspect(p) {
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
  const problems = [];
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
    else if (found.target !== real(item.target)) problems.push(`${item.what} points at ${found.target}, not ${shorten(item.target)}: ${fix}`);
  }
  return problems;
}

const { shorten } = machine;

/** One or many, so a count never reads "1 rules". */
const count = (n, one, many) => `${n} ${n === 1 ? one : many}`;

/**
 * The file a hook depends on: the first path in the command line ending in .js
 * or .mjs, or in .md for a hook that prints a file instead of running a script.
 */
function scriptOf(command) {
  const found = /([^\s"']+\.(?:js|mjs|md))/.exec(command || '');
  return found ? found[1] : null;
}

/** Every hook in a settings object, flattened to one row each. */
function hookRows(settings) {
  const rows = [];
  for (const [event, entries] of Object.entries((settings && settings.hooks) || {})) {
    for (const entry of entries || []) {
      for (const hook of entry.hooks || []) {
        rows.push({ event, matcher: entry.matcher || '', script: scriptOf(hook.command) });
      }
    }
  }
  return rows;
}

const label = (row) => (row.matcher ? `${row.event} ${row.matcher}` : row.event);

// ---- the checks -------------------------------------------------------------

/** The names you type, linked into ~/.local/bin. lib/prereq.js has the programs. */
function checkNames(clone, { bin }) {
  const problems = [];
  const counted = [];

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
 * The util commands Flow calls, and the only hand-maintained list Flow has.
 *
 * Nothing anywhere declares this dependency, so the list is written out, and
 * the caller beside each entry says what stops working when it fails.
 */
const UTIL_COMMANDS = [
  { name: 'fs tree', callers: 'home/AGENTS.md, in tree-for-structure' },
  { name: 'fs merge', callers: 'home/AGENTS.md, in read-one-merge-many' },
  { name: 'fs open', callers: 'flow get --files, through tickets.js' },
];

/**
 * The util commands, proved by running each one.
 *
 * `--help` rather than reading util's registry: it exits 0 only when the
 * command resolved and ran, so it catches a util clone too old to carry the
 * command as well as one that was never registered. Re-deriving util's own
 * resolution rules inside Flow would drift from them instead.
 */
function checkUtil() {
  const problems = [];
  for (const command of UTIL_COMMANDS) {
    const run = spawnSync('util', [...command.name.split(' '), '--help'], { stdio: 'ignore' });
    if (run.error && run.error.code === 'ENOENT') {
      return {
        name: 'util',
        problems: ['util is not on PATH at all, so none of the 3 commands Flow calls can run'],
      };
    }
    if (run.status !== 0) problems.push(`util ${command.name} does not run, and it is called by ${command.callers}`);
  }

  // A failure above is nearly always the registry rather than the command,
  // because nothing is built into util: it reads ~/.util/sources and every
  // command comes out of a directory named there.
  if (problems.length) problems.push(...registryDiagnosis());

  return { name: 'util', problems, summary: `${UTIL_COMMANDS.map((c) => c.name).join(', ')} all run` };
}

/** Why a util command is missing, read off util's own source registry. */
function registryDiagnosis() {
  const file = path.join(process.env.UTIL_HOME || path.join(os.homedir(), '.util'), 'sources');
  let text;
  try {
    text = fs.readFileSync(file, 'utf8');
  } catch {
    return [`${file} does not exist, so no source is registered: run flow install`];
  }
  const paths = text.split('\n')
    .map((l) => l.replace(/\s+#.*$/, '').trim())
    .filter((l) => l && !l.startsWith('#'))
    .map(machine.expandHome);
  if (!paths.length) return [`${file} is empty, so no source is registered: run flow install`];
  const gone = paths.filter((p) => !fs.existsSync(p));
  if (gone.length) return gone.map((p) => `${file} names ${p}, which does not exist: run flow install`);
  return [`${file} names ${paths.length} live source(s), so the command itself is missing from util's clone: run flow install`];
}

/**
 * The one real copy of everything Flow keeps outside the clone: the plugin
 * folder with its manifest and a link per skill, and the rule file.
 */
function checkAgents(at, catalog) {
  const problems = [];

  // A clash is reported rather than thrown, so the rest of the report still
  // prints. Two skills sharing a name is not a missing link: a link is named
  // for the skill, so one would silently overwrite the other.
  if (catalog.error) problems.push(catalog.error.message.split('\n')[0]);
  const installable = catalog.skills.filter((s) => s.group !== skills.DRAFTS);

  const plugin = skills.pluginDir(at.agents);
  const found = inspect(plugin);
  if (found.state !== 'missing' && found.state !== 'real') {
    problems.push(`${shorten(plugin)} is a link: it has to be the real folder, and ~/.claude/skills/flow the link to it`);
  }

  // A Flow skill switched off has no link, on purpose, so only the ones on
  // for this machine are checked: every essential one, and a dev one with a line.
  const machineLines = links.lines({ home: at.flow, root: null, levels: ['machine', 'global'] });
  const on = installable.filter((s) =>
    links.machineState({ name: s.name, essential: skills.essential(s) }, { type: 'flow' }, machineLines) === 'on');
  const linkDir = skills.linkDir(at.agents);
  problems.push(...checkLinks(on.map((s) => ({
    at: path.join(linkDir, s.name), target: s.dir, what: `skills/${s.name}`,
  }))));

  // The one file that gives every skill its name. Without it the skills still
  // load, under bare names, and every command in every doc is wrong by one word.
  const manifest = skills.manifestFile(at.agents);
  let manifestName = null;
  try {
    manifestName = JSON.parse(fs.readFileSync(manifest, 'utf8')).name;
  } catch (e) {
    problems.push(e.code === 'ENOENT'
      ? `${shorten(manifest)} is missing, so the skills load unprefixed: run flow install`
      : `${shorten(manifest)} is not valid JSON: ${e.message}`);
  }
  if (manifestName && manifestName !== skills.PLUGIN) {
    problems.push(`the plugin manifest names "${manifestName}", so the skills are typed /${manifestName}:groundwork: run flow install`);
  }

  const rules = path.join(at.agents, 'AGENTS.md');
  if (!fs.existsSync(rules)) {
    problems.push(`${shorten(rules)} is missing: run flow setup, which writes it`);
  }

  return {
    name: shorten(at.agents),
    problems,
    summary: `${count(on.length, 'skill', 'skills')} linked under skills/${skills.PLUGIN}/` +
      `${on.length < installable.length ? `, ${installable.length - on.length} switched off` : ''}, AGENTS.md present`,
  };
}

/**
 * What Claude Code reads: the link to the plugin folder, one link per agent
 * and rule, and a CLAUDE.md importing the rule file.
 */
function checkClaude(clone, at) {
  const agents = markdownFiles(path.join(clone, 'agents'));
  const rules = markdownFiles(path.join(clone, 'rules'));
  const problems = checkLinks([
    { at: skills.pluginLink(at.claude), target: skills.pluginDir(at.agents), what: `skills/${skills.PLUGIN}` },
    ...agents.map((f) => ({ at: path.join(at.claude, 'agents', f), target: path.join(clone, 'agents', f), what: `agents/${f}` })),
    ...rules.map((f) => ({ at: path.join(at.claude, 'rules', f), target: path.join(clone, 'rules', f), what: `rules/${f}` })),
  ]);

  // An import rather than a link, so the check reads the line. Without it
  // Claude Code starts every session with none of the rules.
  const file = path.join(at.claude, 'CLAUDE.md');
  const line = machine.importLine(clone, at.base);
  let text = null;
  try {
    text = fs.readFileSync(file, 'utf8');
  } catch {
    problems.push(`CLAUDE.md is missing, so Claude Code loads no rules: run flow setup`);
  }
  if (text !== null && !text.split('\n').some((l) => l.trim() === line)) {
    problems.push(`CLAUDE.md does not import the rules, so Claude Code never reads them: add the line ${line}`);
  }

  const counted = [
    `skills/${skills.PLUGIN}`,
    count(agents.length, 'agent', 'agents'),
    count(rules.length, 'rule', 'rules'),
  ].join(', ');
  return { name: shorten(at.claude), problems, summary: `${counted} linked, CLAUDE.md imports the rules` };
}

/**
 * settings.json: the one file Flow shares rather than owns.
 *
 * `flow setup` merges Flow's keys into it, key by key, because it
 * already holds your model, your plugins and your effort level. A merge that
 * stopped half way is the likeliest state on this whole page.
 */
function checkSettings(clone, claude, catalog) {
  const problems = [];
  const file = path.join(claude, 'settings.json');
  let live;
  try {
    live = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    const why = e.code === 'ENOENT'
      ? "does not exist, so none of Flow's hooks run"
      : `does not parse: ${e.message}`;
    return {
      name: 'settings.json',
      problems: [`${file} ${why}: run flow setup, which merges ${path.join(clone, 'home', 'settings.json')} into it`],
    };
  }

  const template = JSON.parse(fs.readFileSync(path.join(clone, 'home', 'settings.json'), 'utf8'));
  const installed = hookRows(live);
  const wanted = hookRows(template);

  for (const row of wanted) {
    const match = installed.find((h) => h.event === row.event && h.matcher === row.matcher &&
      h.script && path.basename(h.script) === path.basename(row.script));
    if (!match) {
      problems.push(`no ${label(row)} hook running ${path.basename(row.script)}: run flow setup, which merges it in`);
      continue;
    }
    const resolved = machine.expandHome(match.script);
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

  // With no mode set, Claude Code starts a session on a Pro, Max or Team plan
  // in auto mode, and nothing on screen says so. A missing key is a merge that
  // went wrong, so it fails. A different mode is somebody's choice, so it is a
  // note: docs/manual/settings.md argues the case, and this only reports it.
  const notes = [];
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

/** What only Flow reads. Claude Code never opens any of the 3. */
function checkFlowHome(clone, flowHome) {
  const problems = checkLinks(['scripts', 'references', 'docs'].map((name) => ({
    at: path.join(flowHome, name), target: path.join(clone, name), what: name,
  })));
  return { name: shorten(flowHome), problems, summary: 'scripts, references and docs resolve into this clone' };
}

/**
 * Both suites, run rather than trusted.
 *
 * util's clone is found by resolving the name on PATH, because Flow has no
 * other way to know where it sits: it is a separate repository the user clones
 * wherever they like.
 */
function checkTests(clone, { bin }) {
  const problems = [];
  const ran = [];

  const suite = (dir) => spawnSync(process.execPath, ['--test', 'tests/**/*.test.js'], { cwd: dir, stdio: 'ignore' });

  if (suite(path.join(clone, 'scripts')).status === 0) ran.push('flow');
  else problems.push(`the flow suite fails: run npm test in ${path.join(clone, 'scripts')}`);

  const util = bin ? inspect(path.join(bin, 'util')) : { state: 'missing' };
  if (util.state !== 'ok') {
    problems.push('util is not linked, so its suite could not be found');
  } else {
    const utilClone = path.dirname(util.target);
    if (suite(utilClone).status === 0) ran.push('util');
    else problems.push(`the util suite fails: run npm test in ${utilClone}`);
  }

  return { name: 'tests', problems, summary: `${ran.join(' and ')} suites pass` };
}

/**
 * The record of this machine as it was before Flow, which is the whole of what
 * `flow restore machine` and `flow uninstall` put back.
 *
 * Every line here is a note rather than a problem. A machine with no original
 * works exactly as well as one with it, and nothing can write the original now:
 * the paths it would copy are Flow's own. It changes one thing, and that thing
 * only happens on the way out.
 */
function checkOriginals(at) {
  const notes = [];
  const mine = originals.read(at);
  if (!mine) {
    notes.push('this machine has no original, so flow restore machine has nothing to put back ' +
      'and flow uninstall removes Flow\'s own paths instead of restoring them');
  } else if (!mine.closed) {
    notes.push('the machine\'s original is still open, so flow setup has not run to the end. ' +
      'It closes the original on its way out');
  }

  const projects = originals.list(at).filter((row) => row.manifest.project);
  for (const row of projects) {
    if (!fs.existsSync(row.manifest.project)) {
      notes.push(`the original of ${shorten(row.manifest.project)} names a folder that is gone, so nothing in it can be put back`);
    }
  }

  const summary = mine
    ? `${count(mine.entries.length, 'path', 'paths')} recorded before Flow, ${mine.closed ? 'closed' : 'still open'}` +
      (projects.length ? `, and ${count(projects.length, 'project', 'projects')} beside it` : '')
    : 'nothing recorded';
  return { name: 'originals', problems: [], notes, summary };
}

/**
 * The skills Flow switches, read against the settings: every source cloned,
 * every line naming a skill some source holds and none naming an essential
 * one, and every skill switched on linked where it loads from.
 *
 * Read-only like everything here. A link out of step is a problem even
 * though the next session start fixes it, since until then the skill list
 * is wrong. `flow skills ls` makes the links match now.
 */
function checkSkills(at) {
  const problems = [];
  const groups = links.catalog(at.flow);
  const machineLines = links.lines({ home: at.flow, root: null, levels: ['machine', 'global'] });
  let root = null;
  try {
    root = projectRoot();
  } catch {
    // Outside a project: the machine's links are the whole check.
  }
  const projectLines = root ? links.lines({ home: at.flow, root, levels: ['project'] }) : new Map();

  const sources = groups.filter((g) => g.type === 'source');
  for (const g of sources.filter((g) => !g.cloned)) {
    problems.push(`${g.id} is a source and is not cloned, so none of its skills can load: run flow install`);
  }

  const known = new Set(groups.flatMap((g) => [...g.skills.keys()]));
  for (const [name, line] of new Map([...machineLines, ...projectLines])) {
    if (known.has(name.split(':').pop())) continue;
    const flag = line.level === 'project' ? '' : ` --${line.level}`;
    problems.push(`"${name}" is switched ${line.state} at ${line.level} level, and no source holds it: flow skills drop ${name}${flag}`);
  }

  // A line naming an essential skill changes nothing, since that skill is
  // always linked, so it only misleads whoever reads the settings.
  const flow = groups.find((g) => g.type === 'flow');
  for (const [name, line] of new Map([...machineLines, ...projectLines])) {
    const skill = flow.skills.get(name.split(':').pop());
    if (!skill || !links.isEssential(flow, skill)) continue;
    const flag = line.level === 'project' ? '' : ` --${line.level}`;
    problems.push(`"${name}" is switched ${line.state} at ${line.level} level, and it is part of Flow's workflow, ` +
      `always on, so the line does nothing: flow skills drop ${name}${flag}`);
  }

  // Flow's own skills link into the plugin folder, which checkAgents reads.
  let machineOn = 0;
  let projectOn = 0;
  const wanted = (dir, skill) => {
    const found = inspect(path.join(dir, skill.name));
    if (found.state !== 'ok' || found.target !== fs.realpathSync(skill.dir)) {
      problems.push(`${skill.name} is switched on and ${shorten(path.join(dir, skill.name))} does not link to it: run flow skills ls`);
    }
  };
  for (const g of groups.filter((g) => g.type !== 'flow')) {
    for (const skill of g.skills.values()) {
      if (links.machineState(skill, g, machineLines) === 'on') {
        machineOn++;
        wanted(path.join(at.claude, 'skills'), skill);
        continue;
      }
      const line = root && links.lineFor(projectLines, g, skill.name);
      if (line && line.state === 'on') {
        projectOn++;
        wanted(path.join(root, '.claude', 'skills'), skill);
      }
    }
  }

  const summary = `${count(sources.filter((g) => g.cloned).length, 'source', 'sources')} cloned, ` +
    `${count(machineOn, 'skill', 'skills')} on for this machine` +
    (root ? `, ${projectOn} more for ${path.basename(root)}` : '');
  return { name: 'skills', problems, summary };
}

/**
 * A run that stopped part-way, reported before anything else.
 *
 * `flow setup`, /flow:setup-project and /flow:migrate each write
 * ~/.flow/run.json before their first step and delete it at their last, so
 * the file on disk means a run never finished. Every check below it is then
 * reading a machine half way through a change, and reads it wrong.
 */
function checkRun(at) {
  const found = migrations.run(at);
  const file = shorten(migrations.runFile(at));
  if (!found) return { name: 'run.json', problems: [], summary: 'no run stopped part-way' };
  if (found.error) {
    return { name: 'run.json', problems: [`${file} does not parse, and a run wrote it: ${found.error}`] };
  }

  const started = found.started ? `, started ${found.started}` : '';
  const step = found.step ? `after step ${found.step}` : 'before its first step';
  // The machine's setup is a command. The other 2 are skills.
  const resume = found.type === 'setup-machine' ? 'run flow setup'
    : migrations.TYPES.includes(found.type) ? `open a session and type /flow:${found.type}` : 'open the run that wrote it again';
  const back = found.project ? `flow restore project ${found.project}` : 'flow restore machine';

  return {
    name: 'run.json',
    problems: [
      `a ${found.type || 'Flow'} run stopped ${step}${started}, so this machine is part way through a change`,
      `carry on: ${resume}, which reads ${file} and starts at that step`,
      `go back: type ${back} in a shell with no session open, which puts the place back to how it was before Flow`,
    ],
  };
}

/**
 * How far behind the changelog this machine is, and the project standing in.
 *
 * Behind is a note: the machine works, and one command answers it either way.
 * Ahead is a problem, because the only thing that puts a machine above the
 * newest entry is a clone that moved backwards, and then every migration
 * between the two numbers counts as applied and never runs.
 */
function checkVersion(clone, at) {
  const problems = [];
  const notes = [];

  const newest = version.newest(clone);
  if (newest === null) {
    return {
      name: 'version',
      problems: [`${path.join(clone, 'CHANGELOG.md')} names no entry, so nothing here can say how current this machine is`],
    };
  }

  const file = path.join(at.flow, 'version');
  const mine = version.applied(file);
  if (mine.state === 'missing') {
    notes.push(`${shorten(file)} is missing, and the last step of flow setup is what stamps it`);
  } else if (mine.state === 'unreadable') {
    problems.push(`${shorten(file)} holds "${mine.text}", and it holds one changelog entry number and nothing else`);
  } else if (mine.number > newest) {
    problems.push(`this machine is at entry ${mine.number} and the changelog stops at ${newest}, so the clone moved backwards: ` +
      'every entry between the two counts as applied and never runs');
  } else if (mine.number < newest) {
    notes.push(`this machine is at entry ${mine.number}, ${count(newest - mine.number, 'entry', 'entries')} behind the changelog: run flow up`);
  }

  const parts = [mine.state === 'ok'
    ? `this machine is at entry ${mine.number}${mine.number === newest ? ', the newest one written' : ''}`
    : 'this machine carries no entry number'];

  let root = null;
  try {
    root = projectRoot();
  } catch {
    // Outside a project. The machine's own number is the whole check then.
  }
  if (root) {
    const name = path.basename(root);
    const theirs = version.applied(path.join(root, '.flow', 'version'));
    if (theirs.state === 'missing') {
      notes.push(`${name} has no .flow/version, and the last step of /flow:setup-project is what stamps it`);
    } else if (theirs.state === 'unreadable') {
      problems.push(`${name}/.flow/version holds "${theirs.text}", and it holds one changelog entry number and nothing else`);
    } else {
      parts.push(`${name} is at entry ${theirs.number}`);
      if (mine.state === 'ok' && theirs.number < mine.number) {
        notes.push(`${name} is at entry ${theirs.number} and this machine is at ${mine.number}, ` +
          'so the project half of a migration never ran: run flow up inside it');
      } else if (mine.state === 'ok' && theirs.number > mine.number) {
        problems.push(`${name} is at entry ${theirs.number}, above this machine's ${mine.number}, ` +
          'and a project cannot be ahead of the machine it sits on');
      }
    }
  }

  return { name: 'version', problems, notes, summary: parts.join(', ') };
}

/**
 * The clone: where its submodules sit, and with --updates the newest version
 * tag the remote carries.
 *
 * Every line is a note. A submodule off its gitlink is somebody mid-work in
 * util or the toolbox, and a clone a few entries behind still runs.
 *
 * `git ls-remote` rather than a fetch, because it writes nothing at all and
 * the tag names are the whole of what is wanted. It is the one check on this
 * page that touches the network, which is why it takes a flag.
 */
function checkClone(clone, { updates }) {
  const notes = [];
  const parts = [];

  const status = spawnSync('git', ['submodule', 'status'], { cwd: clone, encoding: 'utf8' });
  const rows = (status.stdout || '').split('\n').filter(Boolean);
  const said = {
    '+': (name) => `${name} sits at a commit this clone does not point at, so a fresh clone gets a different one`,
    '-': (name) => `${name} is not checked out, so nothing under it can be read`,
    U: (name) => `${name} has a merge conflict`,
  };
  let off = 0;
  for (const row of rows) {
    const found = /^([-+U ])\S+ (\S+)/.exec(row);
    if (!found || found[1] === ' ') continue;
    off++;
    notes.push(`${said[found[1]](found[2])}: flow up updates the submodules`);
  }
  parts.push(`${count(rows.length - off, 'submodule', 'submodules')} on the commit this clone points at`);

  if (!updates) {
    parts.push('the remote is not read without --updates');
  } else {
    const tags = spawnSync('git', ['ls-remote', '--tags', 'origin'], { cwd: clone, encoding: 'utf8' });
    const said2 = (tags.stderr || '').trim().split('\n')[0];
    const numbers = [...(tags.stdout || '').matchAll(/refs\/tags\/v(\d+)\b/g)].map((m) => Number(m[1]));
    const highest = numbers.length ? Math.max(...numbers) : null;
    const here = version.newest(clone);
    if (tags.status !== 0) notes.push(`the remote could not be read, so nothing says whether a newer version exists: ${said2}`);
    else if (highest === null) notes.push('the remote carries no version tag, so there is nothing to compare this clone against');
    else if (here !== null && highest > here) notes.push(`the remote is tagged v${highest} and this clone stops at entry ${here}: run flow up`);
    else parts.push(`the remote's newest tag is v${highest}`);
  }

  return { name: 'clone', problems: [], notes, summary: parts.join(', ') };
}

// ---- the command ------------------------------------------------------------

const actions = {};

/** The report, and the exit code a skill reads instead of the report. */
function report(checks) {
  out(render.doctorReport(checks));
  return checks.some((c) => c.problems && c.problems.length) ? 1 : 0;
}

actions.doctor = {
  section: 'setup',
  anywhere: true,
  summary: 'verify this machine: version, links, PATH, util, skills, hooks, both suites',
  flags: {
    root: { arg: '<dir>' },
    'no-bin': { bool: true },
    'no-tests': { bool: true },
    updates: { bool: true },
    prereq: { bool: true },
  },
  run({ flags }) {
    // Step 0 of a setup or a migration, so it runs on a machine Flow is not on
    // yet: what Flow calls and never installs, and nothing else. Everything
    // below this line describes an install and would refuse such a machine.
    if (flags.prereq) return report(prereq.checks());

    const clone = cloneRoot();
    const at = machine.folders(flags.root);
    const bin = flags['no-bin'] ? null : path.join(at.base, '.local', 'bin');

    // The empty case, and it is the one this machine is in until install day.
    // Without it a fresh machine reads as 20 separate failures, all of them the
    // same failure said again.
    if (inspect(path.join(at.flow, 'scripts')).state === 'missing' && !anyFlowSkillLinked(at.agents)) {
      out(
        `Flow is not installed here. ${shorten(at.flow)} has no scripts link and ${shorten(at.agents)} holds no Flow skill.\n\n` +
        `Install it, then run this again:\n\n  node ${path.join(clone, 'scripts', 'flow', 'flow.js')} install\n`
      );
      return 1;
    }

    const catalog = readCatalog();

    const checks = [
      checkRun(at),
      checkVersion(clone, at),
      checkClone(clone, { updates: flags.updates }),
      prereq.checkPrograms(),
      bin ? checkNames(clone, { bin }) : { name: 'names', skipped: '--no-bin' },
      checkUtil(),
      checkAgents(at, catalog),
      checkClaude(clone, at),
      checkSettings(clone, at.claude, catalog),
      checkFlowHome(clone, at.flow),
      checkOriginals(at),
      checkSkills(at),
      flags['no-tests']
        ? { name: 'tests', skipped: '--no-tests' }
        : checkTests(clone, { bin }),
    ].filter(Boolean);

    return report(checks);
  },
};

/**
 * The skill catalog, read once, with a name clash carried rather than thrown.
 *
 * Two checks need it and `skills.catalog()` refuses outright on a clash, which
 * would take the whole report down over one thing it is meant to report.
 */
function readCatalog() {
  try {
    const all = skills.catalog();
    return { skills: [...all.values()], names: new Set(all.keys()), error: null };
  } catch (e) {
    return { skills: [], names: new Set(), error: e };
  }
}

/** True when the plugin folder holds even one link into this clone. */
function anyFlowSkillLinked(agents) {
  const clone = cloneRoot();
  const linkDir = skills.linkDir(agents);
  let entries = [];
  try {
    entries = fs.readdirSync(linkDir);
  } catch {
    return false;
  }
  return entries.some((name) => {
    const found = inspect(path.join(linkDir, name));
    return found.state === 'ok' && found.target.startsWith(clone + path.sep);
  });
}

module.exports = actions;
