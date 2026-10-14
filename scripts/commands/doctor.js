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
 * ~/.local/bin, so there are none to check).
 *
 * The 2 suites run only with `--tests`. They take about 14 seconds and hold a
 * test that fails now and then on its own, where a flaky failure would read as
 * a broken install.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const { out } = require('../lib/cli');
const failures = require('../lib/logs/failures');
const installed = require('../lib/machine/installed');
const { markdownFiles } = require('../lib/machine/links');
const prereq = require('../lib/machine/prereq');
const setupSession = require('../lib/machine/setup-session');
const { projectRoot } = require('../lib/project');
const links = require('../lib/skills/skill-links');
const skills = require('../lib/skills/skills');
const paths = require('../lib/paths');
const { git } = require('../lib/git');

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
    else if (found.target !== real(item.target)) problems.push(`${item.what} points at ${found.target}, not ${paths.shorten(item.target)}: ${fix}`);
  }
  return problems;
}


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

/** The names you type, linked into ~/.local/bin. lib/machine/prereq.js has the programs. */
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
  { name: 'fs tree', callers: 'home/CLAUDE.md, in tree-for-structure' },
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
    const run = runUtil(command.name);
    if (run.error && run.error.code === 'ENOENT') {
      return {
        name: 'util',
        problems: [`util is not on PATH at all, so none of the ${UTIL_COMMANDS.length} commands Flow calls can run`],
      };
    }
    // A null status means the process never ran to an exit: the system
    // refused to start it, or killed it, which a busy machine does. That says
    // nothing about util, so it is not counted.
    if (run.status !== null && run.status !== 0) {
      problems.push(`util ${command.name} does not run, and it is called by ${command.callers}`);
    }
  }

  // A failure above is nearly always the registry rather than the command,
  // because nothing is built into util: it reads ~/.util/sources and every
  // command comes out of a directory named there.
  if (problems.length) problems.push(...registryDiagnosis());

  return { name: 'util', problems, summary: `${UTIL_COMMANDS.map((c) => c.name).join(', ')} all run` };
}

/**
 * One util command's `--help`, retried up to 3 times while the process never
 * reaches an exit of its own, 200ms apart. Missing util is not retried.
 */
function runUtil(name) {
  let run;
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt) Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 200);
    run = spawnSync('util', [...name.split(' '), '--help'], { stdio: 'ignore' });
    if (run.status !== null || (run.error && run.error.code === 'ENOENT')) break;
  }
  return run;
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
  const listed = text.split('\n')
    .map((l) => l.replace(/\s+#.*$/, '').trim())
    .filter((l) => l && !l.startsWith('#'))
    .map(paths.expandHome);
  if (!listed.length) return [`${file} is empty, so no source is registered: run flow install`];
  const gone = listed.filter((p) => !fs.existsSync(p));
  if (gone.length) return gone.map((p) => `${file} names ${p}, which does not exist: run flow install`);
  return [`${file} names ${listed.length} live source(s), so the command itself is missing from util's clone: run flow install`];
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
  const installable = catalog.skills;

  const plugin = skills.pluginDir(at.agents);
  const found = inspect(plugin);
  if (found.state !== 'missing' && found.state !== 'real') {
    problems.push(`${paths.shorten(plugin)} is a link: it has to be the real folder, and ~/.claude/skills/flow the link to it`);
  }

  // A Flow skill switched off has no link, on purpose, so only the ones on
  // everywhere are checked: every essential one, and a dev one with a line.
  const machineLines = links.lines({ home: at.flow, root: null, levels: ['global'] });
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
      ? `${paths.shorten(manifest)} is missing, so the skills load unprefixed: run flow install`
      : `${paths.shorten(manifest)} is not valid JSON: ${e.message}`);
  }
  if (manifestName && manifestName !== skills.PLUGIN) {
    problems.push(`the plugin manifest names "${manifestName}", so the skills are typed /${manifestName}:groundwork: run flow install`);
  }

  return {
    name: paths.shorten(at.agents),
    problems,
    summary: `${count(on.length, 'skill', 'skills')} linked under skills/${skills.PLUGIN}/` +
      `${on.length < installable.length ? `, ${installable.length - on.length} switched off` : ''}`,
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

  // `flow install` starts the profile and owes the setup session, which finishes
  // settings.json and moves old rules into the profile. A marker still standing
  // means that session never reached its last step.
  if (!fs.existsSync(path.join(at.flow, 'profile.md'))) {
    problems.push(`${paths.shorten(path.join(at.flow, 'profile.md'))} does not exist, so your preferences load from nowhere: run flow install`);
  }
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
 * settings.json: the one file Flow shares rather than owns.
 *
 * It already holds your model, your plugins and your effort level, so no
 * code writes it. The setup session `flow update` and `flow install` owe does:
 * an agent reads it beside `home/settings.json` and adds what Flow needs. A
 * session that never finished is the likeliest state on this whole page.
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

  // With no mode set, Claude Code starts a session on a Pro, Max or Team plan
  // in auto mode, and nothing on screen says so. A missing key is a setup
  // session that never finished, so it fails. A different mode is somebody's choice, so it is a
  // note: docs/spec/permissions.md argues the case, and this only reports it.
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
  return { name: paths.shorten(flowHome), problems, summary: 'scripts, references and docs resolve into this clone' };
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
 * The open issues: a job that runs with nobody watching, such as a ticket
 * sync, whose last run failed. The next run that
 * works clears one by itself, so each line stays until its cause is fixed.
 */
function checkIssues(at) {
  const problems = failures.open(at.flow).map((issue) => {
    const times = issue.count === 1 ? 'failed' : `failed ${issue.count} times`;
    const error = String(issue.error || '').split('\n')[0];
    return `${issue.job.split(os.homedir()).join('~')}: ${times} since ${issue.since.slice(0, 16).replace('T', ' ')}. ${error}`;
  });
  return { name: 'issues', problems, summary: 'every job running in the background worked last time' };
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
  const machineLines = links.lines({ home: at.flow, root: null, levels: ['global'] });
  let root = null;
  try {
    root = projectRoot();
  } catch {
    // Outside a project: the machine's links are the whole check.
  }
  const projectLines = root ? links.lines({ home: at.flow, root, levels: ['project'] }) : new Map();

  const known = new Set(groups.flatMap((g) => [...g.skills.keys()]));
  for (const [name, line] of new Map([...machineLines, ...projectLines])) {
    if (known.has(name)) continue;
    const flag = line.level === 'project' ? '' : ` --${line.level}`;
    problems.push(`"${name}" is switched ${line.state} at ${line.level} level, and no skill has that name: flow skills reset ${name}${flag}`);
  }

  // A line naming an essential skill changes nothing, since that skill is
  // always linked, so it only misleads whoever reads the settings.
  const flow = groups.find((g) => g.type === 'flow');
  for (const [name, line] of new Map([...machineLines, ...projectLines])) {
    const skill = flow.skills.get(name);
    if (!skill || !links.isEssential(flow, skill)) continue;
    const flag = line.level === 'project' ? '' : ` --${line.level}`;
    problems.push(`"${name}" is switched ${line.state} at ${line.level} level, and it is part of Flow's workflow, ` +
      `always on, so the line does nothing: flow skills reset ${name}${flag}`);
  }

  // Flow's own skills link into the plugin folder, which checkAgents reads.
  let machineOn = 0;
  let projectOn = 0;
  const wanted = (dir, skill) => {
    const found = inspect(path.join(dir, skill.name));
    if (found.state !== 'ok' || found.target !== fs.realpathSync(skill.dir)) {
      problems.push(`${skill.name} is switched on and ${paths.shorten(path.join(dir, skill.name))} does not link to it: run flow skills ls`);
    }
  };
  for (const g of groups.filter((g) => g.type !== 'flow')) {
    for (const skill of g.skills.values()) {
      if (links.machineState(skill, g, machineLines) === 'on') {
        machineOn++;
        wanted(path.join(at.claude, 'skills'), skill);
        continue;
      }
      const line = root && projectLines.get(skill.name);
      if (line && line.state === 'on') {
        projectOn++;
        wanted(path.join(root, '.claude', 'skills'), skill);
      }
    }
  }

  const summary = `${count(machineOn, 'skill', 'skills')} on everywhere` +
    (root ? `, ${projectOn} more for ${path.basename(root)}` : '');
  return { name: 'skills', problems, summary };
}

/**
 * The clone: where its submodules sit.
 *
 * Every line is a note. A submodule off its gitlink is somebody mid-work in
 * util, and the clone still runs.
 */
function checkClone(clone) {
  const notes = [];
  const parts = [];

  const rows = git(clone, ['submodule', 'status']).raw.split('\n').filter(Boolean);
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
    notes.push(`${said[found[1]](found[2])}: git submodule update --init updates them`);
  }
  parts.push(`${count(rows.length - off, 'submodule', 'submodules')} on the commit this clone points at`);

  return { name: 'clone', problems: [], notes, summary: parts.join(', ') };
}

// ---- the command ------------------------------------------------------------

/**
 * `flow doctor`: one line per area when it is clean, one line per problem when
 * it is not.
 *
 * A clean area prints what it counted rather than nothing, because a report
 * that only speaks up when something is wrong gives you no way to tell a pass
 * from a check that never ran.
 */
function doctorReport(checks) {
  const lines = [];
  let failed = 0;
  let ran = 0;

  for (const check of checks) {
    if (check.skipped) {
      lines.push(`skip  ${check.name}: ${check.skipped}`);
      continue;
    }
    ran++;
    if (check.problems.length) {
      failed++;
      lines.push(`fail  ${check.name}:`);
      for (const problem of check.problems) lines.push(`        ${problem}`);
    } else {
      lines.push(`ok    ${check.name}: ${check.summary}`);
    }
    for (const note of check.notes || []) lines.push(`note  ${check.name}: ${note}`);
  }

  lines.push('');
  lines.push(failed ? `${failed} of ${ran} checks failed.` : 'nothing to fix.');
  return lines.join('\n');
}

const actions = {};

/** The report, and the exit code a skill reads instead of the report. */
function report(checks) {
  out(doctorReport(checks));
  return checks.some((c) => c.problems && c.problems.length) ? 1 : 0;
}

actions.doctor = {
  section: 'setup',
  summary: 'check that Flow is installed correctly: links, PATH, util, skills and hooks',
  flags: {
    root: { arg: '<dir>', hidden: true },
    'no-bin': { bool: true, hidden: true },
    tests: { bool: true, hidden: true },
    prereq: { bool: true },
  },
  run({ flags }) {
    // Runs on a machine Flow is not on yet: what Flow calls and never
    // installs, and nothing else. Everything below this line describes an
    // install and would refuse such a machine.
    if (flags.prereq) return report(prereq.checks());

    const clone = paths.cloneRoot();
    const at = paths.folders(flags.root);
    const bin = flags['no-bin'] ? null : path.join(at.base, '.local', 'bin');

    // The empty case, and it is the one this machine is in until install day.
    // Without it a fresh machine reads as 20 separate failures, all of them the
    // same failure said again.
    if (inspect(path.join(at.flow, 'scripts')).state === 'missing' && !anyFlowSkillLinked(at.agents)) {
      out(
        `Flow is not installed here. ${paths.shorten(at.flow)} has no scripts link and ${paths.shorten(at.agents)} holds no Flow skill.\n\n` +
        `Install it, then run this again:\n\n  node ${path.join(clone, 'scripts', 'flow.js')} install\n`
      );
      return 1;
    }

    const catalog = readCatalog();

    const checks = [
      checkIssues(at),
      checkClone(clone),
      prereq.checkPrograms(),
      prereq.checkClaude(),
      bin ? checkNames(clone, { bin }) : { name: 'names', skipped: '--no-bin' },
      checkUtil(),
      checkAgents(at, catalog),
      checkClaude(clone, at),
      checkSettings(clone, at.claude, catalog),
      checkFlowHome(clone, at.flow),
      checkSkills(at),
      // Hidden from help, so the report never names it when it was left out.
      flags.tests && checkTests(clone, { bin }),
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
  const clone = paths.cloneRoot();
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
