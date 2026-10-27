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
 * `flow tickets check` is the other verification command and answers a different
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
const { out, json } = require('../lib/cli');
const failures = require('../lib/logs/failures');
const installed = require('../lib/machine/installed');
const { markdownFiles } = require('../lib/machine/links');
const prereq = require('../lib/machine/prereq');
const setupSession = require('../lib/machine/setup-session');
const skills = require('../lib/skills/skills');
const paths = require('../lib/paths');
const project = require('../lib/project');
const registry = require('../lib/registry');
const settings = require('../lib/settings');
const store = require('../lib/tickets/store');
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
        problems: ['util is not on PATH at all, so the util commands Flow calls cannot run'],
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

  return { name: 'util', problems, summary: `${UTIL_COMMANDS.map((c) => c.name).join(', ')} ${UTIL_COMMANDS.length === 1 ? 'runs' : 'all run'}` };
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

  const linkDir = skills.linkDir(at.agents);
  problems.push(...checkLinks(installable.map((s) => ({
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
  const names = new Set();
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
  const problems = checkLinks(['scripts', 'guides', 'docs'].map((name) => ({
    at: path.join(flowHome, name), target: path.join(clone, name), what: name,
  })));
  return { name: paths.shorten(flowHome), problems, summary: 'scripts, guides and docs resolve into this clone' };
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
 * The projects this machine knows (lib/registry.js), read and never scanned
 * for: a registered path that is gone, a prefix two folders both claim, a line
 * whose folder changed its `ticketPrefix`, and the project around you missing
 * from the list. `current` is that project, or null.
 */
function checkProjects(at, current) {
  const map = registry.read(at.flow);
  const listed = registry.projects(at.flow).filter((p) => p.prefix !== store.HOME_WORD);
  const problems = [];

  for (const p of listed) {
    if (!p.exists) {
      problems.push(`${p.prefix} is registered at ${paths.shorten(p.folder)}, which is gone: a ticket-writing command in the moved folder updates the line`);
    } else if (fs.existsSync(path.join(p.folder, '.flow')) && store.prefixOf(p.folder) !== p.prefix) {
      problems.push(`${paths.shorten(p.folder)} is registered as "${p.prefix}", but its ticketPrefix is now "${store.prefixOf(p.folder)}": a ticket-writing command in it updates the line`);
    }
  }

  if (current && fs.existsSync(path.join(current, '.flow'))) {
    const prefix = store.prefixOf(current);
    const named = Boolean(settings.read(settings.projectFile(current)).ticketPrefix);
    const holder = registry.holder(prefix, current, at.flow);
    if (holder) {
      problems.push(`this folder's prefix "${prefix}" is held by ${paths.shorten(holder)}: set ticketPrefix in ${paths.shorten(path.join(current, '.flow', 'settings.json'))} to another word`);
    } else if (named && !registry.registeredAs(current, at.flow)) {
      problems.push(`this folder (prefix "${prefix}") is not in the list: a ticket-writing command here adds it`);
    }
  }

  const notes = problems.length
    ? [`registered: ${listed.map((p) => `${p.prefix} ${paths.shorten(p.folder)}`).join(', ') || 'none'}`]
    : [];
  const pairs = Object.entries(map).map(([prefix, folder]) => `${prefix} ${paths.shorten(folder)}`);
  return { name: 'projects', problems, notes, summary: pairs.length ? pairs.join(', ') : 'none registered yet' };
}

/**
 * The project's tickets, for any still in the format from before `ticket.md`
 * stood alone: a folder named with more than its id, a `groundwork/map.md` that
 * is the empty template, a title that is one of the ticket's own labels.
 */
function checkTickets(root) {
  if (!root) return { name: 'tickets', skipped: 'not inside a Flow project' };
  let tickets;
  try {
    tickets = store.readTickets(root);
  } catch (e) {
    // A project with no ticket prefix, or a ticket file that does not parse,
    // must not take the machine's report down with it.
    return { name: 'tickets', problems: [`the tickets could not be read: ${e.message.split('\n')[0]}`] };
  }
  const problems = [];
  for (const t of tickets) {
    if (t.dirName !== store.folderName(t.id)) {
      problems.push(`${t.dirName} is in a folder not named by its number: rename the folder to ${store.folderName(t.id)}`);
    }
    const map = path.join(t.dir, 'groundwork', 'map.md');
    if (fs.existsSync(map) && emptyMap(fs.readFileSync(map, 'utf8'))) {
      problems.push(`${t.id} holds a groundwork/map.md that is only the empty template: delete it`);
    }
    if (t.data.labels.includes(t.data.title)) {
      problems.push(`${t.id} is titled "${t.data.title}", a label and no name: flow tickets edit ${t.id} --title "<up to 4 words>"`);
    }
  }
  return { name: 'tickets', problems, summary: `${count(tickets.length, 'ticket', 'tickets')} in the current format` };
}

/** True for a map with the empty template's comment and nothing else but headings. */
function emptyMap(text) {
  return /Empty until this ticket is picked up/.test(text) &&
    !text.replace(/<!--[\s\S]*?-->/g, '').replace(/^#.*$/gm, '').trim();
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
  const ran = checks.filter((c) => !c.skipped);
  json({
    installed: true,
    checks: checks.map((c) => ({
      name: c.name, skipped: c.skipped || null, problems: c.problems || [], notes: c.notes || [], summary: c.summary || null,
    })),
    failed: ran.filter((c) => c.problems.length).length,
    ran: ran.length,
  });
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
      json({ installed: false, checks: [], failed: 0, ran: 0 });
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
      checkProjects(at, project.around(null, at)),
      checkTickets(project.around(null, at)),
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
