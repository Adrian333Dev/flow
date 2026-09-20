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
const originals = require('../lib/originals');
const render = require('../lib/render');
const { projectRoot } = require('../lib/root');
const skills = require('../lib/skills');

/**
 * The util commands Flow calls, and the only hand-maintained list in this file.
 *
 * Everything else checked here is derived and so cannot fall behind: the skills
 * come off the tree, the hooks out of home/settings.json. Nothing anywhere
 * declares Flow's dependency on util, so this list is written by hand, and the
 * caller beside each entry says what stops working when it fails.
 */
const UTIL_COMMANDS = [
  { name: 'fs tree', callers: 'home/AGENTS.md, overlays.js, audit/files.js' },
  { name: 'fs merge', callers: 'home/AGENTS.md, audit/files.js, audit/store.js' },
  { name: 'fs open', callers: 'flow get --files, through tickets.js' },
];

/** Typed names util puts there. Their target is util's clone, which Flow never knows. */
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

/**
 * Where a name resolves on PATH, or null.
 *
 * A PATH walk rather than spawning `which`: a broken symlink fails the execute
 * check here for the same reason it fails for the shell, and this costs no
 * process.
 */
function onPath(name) {
  for (const dir of (process.env.PATH || '').split(path.delimiter)) {
    if (!dir) continue;
    try {
      const full = path.join(dir, name);
      fs.accessSync(full, fs.constants.X_OK);
      return full;
    } catch {
      // Not here, or not executable. Either way the next directory decides.
    }
  }
  return null;
}

const { shorten } = machine;

/** One or many, so a count never reads "1 rules". */
const count = (n, one, many) => `${n} ${n === 1 ? one : many}`;

/** `$HOME` and a leading `~` are what a settings file writes instead of a path. */
const expandHome = (p) => p.replace(/^~(?=\/|$)/, os.homedir()).split('$HOME').join(os.homedir());

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

/** The names you type, and the programs Flow shells out to. */
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
      else if (found.state === 'missing') problems.push(`${name} is not linked: run util install from util's clone`);
      else if (found.state === 'real') problems.push(`${name} is a real file, not a link`);
      else problems.push(`${name} points at ${found.raw}, which is gone: re-run util install`);
    }
  }

  // Every script here is Node, projectRoot() shells out to git rev-parse, and
  // Flow is a workflow for Claude Code. A machine missing any of the three has
  // a problem no symlink check would ever show.
  for (const program of ['node', 'git', 'claude']) {
    if (onPath(program)) counted.push(program);
    else problems.push(`${program} is not on PATH`);
  }

  return { name: 'names', problems, summary: `${counted.join(', ')} all resolve` };
}

/**
 * The util commands Flow calls, proved by running each one.
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
    return [`${file} does not exist, so no source is registered: run util install`];
  }
  const paths = text.split('\n')
    .map((l) => l.replace(/\s+#.*$/, '').trim())
    .filter((l) => l && !l.startsWith('#'))
    .map(expandHome);
  if (!paths.length) return [`${file} is empty, so no source is registered: run util install`];
  const gone = paths.filter((p) => !fs.existsSync(p));
  if (gone.length) return gone.map((p) => `${file} names ${p}, which does not exist: util source drop it, or re-run util install`);
  return [`${file} names ${paths.length} live source(s), so the command itself is missing from util's clone`];
}

/**
 * The one real copy of everything Flow keeps outside the clone: the plugin
 * folder with its manifest and a link per skill, and the rule file.
 */
function checkAgents(at, catalog) {
  const problems = [];
  const notes = [];

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
      ? `${shorten(manifest)} is missing, so the skills load unprefixed: run flow install`
      : `${shorten(manifest)} is not valid JSON: ${e.message}`);
  }
  if (manifestName && manifestName !== skills.PLUGIN) {
    problems.push(`the plugin manifest names "${manifestName}", so the skills are typed /${manifestName}:groundwork: run flow install`);
  }

  const rules = path.join(at.agents, 'AGENTS.md');
  if (!fs.existsSync(rules)) {
    problems.push(`${shorten(rules)} is missing: type /flow:setup-machine, which writes it after the interview`);
  } else if (fs.readFileSync(rules, 'utf8').includes('<!-- e.g.')) {
    // A note rather than a problem. The file is a copy and is meant to diverge,
    // so a placeholder left in it means one section was never filled, which is
    // a thing to finish rather than a thing that is broken.
    notes.push('AGENTS.md still carries its template placeholders, so ## The user and ## Preferences were never filled in');
  }

  return {
    name: shorten(at.agents),
    problems,
    notes,
    summary: `${count(installable.length, 'skill', 'skills')} linked under skills/${skills.PLUGIN}/, AGENTS.md present`,
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
    problems.push(`CLAUDE.md is missing, so Claude Code loads no rules: type /flow:setup-machine`);
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
 * What Codex reads: AGENTS.md, a link to the rule file.
 *
 * Codex reads AGENTS.override.md first when one exists, so a leftover one
 * hides the rules as surely as a missing link.
 */
function checkCodex(at) {
  const problems = checkLinks([
    {
      at: path.join(at.codex, 'AGENTS.md'),
      target: path.join(at.agents, 'AGENTS.md'),
      what: 'AGENTS.md',
      fix: 'type /flow:setup-machine',
    },
  ]);
  const override = path.join(at.codex, 'AGENTS.override.md');
  if (fs.existsSync(override) && fs.readFileSync(override, 'utf8').trim() !== '') {
    problems.push(`${shorten(override)} exists, and Codex reads it in place of AGENTS.md: move what it holds into ${shorten(path.join(at.agents, 'AGENTS.md'))}`);
  }
  return { name: shorten(at.codex), problems, summary: 'AGENTS.md links to the rules' };
}

/**
 * settings.json: the one file Flow shares rather than owns.
 *
 * `/flow:setup-machine` merges Flow's keys into it, key by key, because it
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
      problems: [`${file} ${why}: type /flow:setup-machine, which merges ${path.join(clone, 'home', 'settings.json')} into it`],
    };
  }

  const template = JSON.parse(fs.readFileSync(path.join(clone, 'home', 'settings.json'), 'utf8'));
  const installed = hookRows(live);
  const wanted = hookRows(template);

  for (const row of wanted) {
    const match = installed.find((h) => h.event === row.event && h.matcher === row.matcher &&
      h.script && path.basename(h.script) === path.basename(row.script));
    if (!match) {
      problems.push(`no ${label(row)} hook running ${path.basename(row.script)}: type /flow:setup-machine, which merges it in`);
      continue;
    }
    const resolved = expandHome(match.script);
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

/** What only Flow reads. Claude Code never opens either of these. */
function checkFlowHome(clone, flowHome) {
  const problems = checkLinks(['scripts', 'references'].map((name) => ({
    at: path.join(flowHome, name), target: path.join(clone, name), what: name,
  })));
  return { name: shorten(flowHome), problems, summary: 'scripts and references resolve into this clone' };
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
    notes.push('the machine\'s original is still open, so /flow:setup-machine has not run to the end. ' +
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
 * The skills this project lists against the links it has, or null outside a
 * project.
 *
 * git commits the 2 lists and ignores the links, because a link holds this
 * machine's path. So a fresh clone, a new worktree and a second machine each
 * start with every name listed and no link at all, and `flow domain-skills
 * add` with no name puts them back. A note rather than a problem: a project
 * nobody has run that command in yet is not broken.
 */
function checkProjectSkills() {
  let root;
  try {
    root = projectRoot();
  } catch {
    return null;
  }

  const notes = [];
  const linked = [];
  for (const [file, command] of [['domain-skills.txt', 'flow domain-skills add'], ['private-skills.txt', 'flow private-skills add']]) {
    let names = [];
    try {
      names = fs.readFileSync(path.join(root, '.flow', file), 'utf8').split('\n').map((l) => l.trim()).filter(Boolean);
    } catch {
      continue;
    }
    for (const name of names) {
      // existsSync follows the link, so a link into a clone that moved reads
      // as missing here, which is the same fix.
      if (fs.existsSync(path.join(root, '.claude', 'skills', name))) linked.push(name);
      else notes.push(`.flow/${file} names ${name}, which is not linked in this project: run ${command}`);
    }
  }

  return {
    name: `${path.basename(root)}, the skills it lists`,
    problems: [],
    notes,
    summary: linked.length ? `${count(linked.length, 'skill', 'skills')} listed and linked: ${linked.join(', ')}` : 'no skills listed',
  };
}

// ---- the command ------------------------------------------------------------

const actions = {};

actions.doctor = {
  section: 'setup',
  anywhere: true,
  summary: 'verify this machine: links, PATH, util, hooks, both suites',
  flags: {
    root: { arg: '<dir>' },
    'no-bin': { bool: true },
    'no-tests': { bool: true },
  },
  run({ flags }) {
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
      checkNames(clone, { bin }),
      checkUtil(),
      checkAgents(at, catalog),
      checkClaude(clone, at),
      checkCodex(at),
      checkSettings(clone, at.claude, catalog),
      checkFlowHome(clone, at.flow),
      checkOriginals(at),
      checkProjectSkills(),
      flags['no-tests']
        ? { name: 'tests', skipped: '--no-tests' }
        : checkTests(clone, { bin }),
    ].filter(Boolean);

    out(render.doctorReport(checks));
    return checks.some((c) => c.problems && c.problems.length) ? 1 : 0;
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
