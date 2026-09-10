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
 * `--home` and `--flow-home` point the two roots at a scratch tree, `--no-bin`
 * matches `flow install --no-bin` (a scratch install writes no names into
 * ~/.local/bin, so there are none to check), and `--no-tests` drops the 2
 * suites, which are the only slow part of this.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const { out } = require('../lib/cli');
const { cloneRoot } = require('../lib/clone');
const { FlowError } = require('../lib/error');
const { markdownFiles } = require('../lib/links');
const render = require('../lib/render');
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
  { name: 'fs tree', callers: 'home/CLAUDE.md, overlays.js, audit/files.js' },
  { name: 'fs merge', callers: 'home/CLAUDE.md, audit/files.js, audit/store.js' },
  { name: 'fs open', callers: 'flow get --files, through tickets.js' },
];

/** Typed names Flow puts in ~/.local/bin, against the file each one points at. */
const FLOW_BIN = { flow: path.join('scripts', 'flow', 'flow.js'), fw: path.join('scripts', 'flow', 'flow.js') };

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

/** A path under the home directory, written the way every page writes it. */
const shorten = (p) => (p === os.homedir() || p.startsWith(os.homedir() + path.sep)
  ? '~' + p.slice(os.homedir().length)
  : p);

/** One or many, so a count never reads "1 rules". */
const count = (n, one, many) => `${n} ${n === 1 ? one : many}`;

/** `$HOME` and a leading `~` are what a settings file writes instead of a path. */
const expandHome = (p) => p.replace(/^~(?=\/|$)/, os.homedir()).split('$HOME').join(os.homedir());

/** The script a hook runs: the first path in the command line ending in .js or .mjs. */
function scriptOf(command) {
  const found = /([^\s"']+\.(?:js|mjs))/.exec(command || '');
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
    for (const [name, file] of Object.entries(FLOW_BIN)) {
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

/** What Claude Code reads: one link per skill, agent and rule, and CLAUDE.md. */
function checkClaudeHome(clone, home, catalog) {
  const problems = [];
  const notes = [];

  // A clash is reported rather than thrown, so the rest of the report still
  // prints. Two skills sharing a name is not a missing link: a link is named
  // for the skill, so one would silently overwrite the other.
  if (catalog.error) problems.push(catalog.error.message.split('\n')[0]);
  const installable = catalog.skills.filter((s) => s.group !== skills.DRAFTS);

  const wanted = [
    ...installable.map((s) => ({ at: path.join(home, 'skills', s.name), target: s.dir, what: `skills/${s.name}` })),
    ...markdownFiles(path.join(clone, 'agents'))
      .map((f) => ({ at: path.join(home, 'agents', f), target: path.join(clone, 'agents', f), what: `agents/${f}` })),
    ...markdownFiles(path.join(clone, 'rules'))
      .map((f) => ({ at: path.join(home, 'rules', f), target: path.join(clone, 'rules', f), what: `rules/${f}` })),
  ];

  for (const item of wanted) {
    const found = inspect(item.at);
    if (found.state === 'missing') problems.push(`${item.what} is in the tree and not linked: run flow install`);
    else if (found.state === 'real') problems.push(`${item.what} is a real file, not a link: Flow never wrote it`);
    else if (found.state === 'broken') problems.push(`${item.what} points at ${found.raw}, which is gone: run flow install`);
    else if (found.target !== fs.realpathSync(item.target)) problems.push(`${item.what} points at ${found.target}, not this clone: run flow install`);
  }

  const rules = path.join(home, 'CLAUDE.md');
  if (!fs.existsSync(rules)) {
    problems.push('CLAUDE.md is missing: run flow install, which copies the template when there is none');
  } else if (fs.readFileSync(rules, 'utf8').includes('<!-- e.g.')) {
    // A note rather than a problem. The file is a copy and is meant to diverge,
    // so a placeholder left in it means one section was never filled, which is
    // a thing to finish rather than a thing that is broken.
    notes.push('CLAUDE.md still carries its template placeholders, so ## The user and ## Preferences were never filled in');
  }

  const counted = [
    count(installable.length, 'skill', 'skills'),
    count(markdownFiles(path.join(clone, 'agents')).length, 'agent', 'agents'),
    count(markdownFiles(path.join(clone, 'rules')).length, 'rule', 'rules'),
  ].join(', ');
  return { name: shorten(home), problems, notes, summary: `${counted} linked, CLAUDE.md present` };
}

/**
 * settings.json: the one install step `flow install` refuses to do for you.
 *
 * It is merged by hand, into a file already holding your model, your plugins
 * and your effort level, so a half-finished merge is the likeliest state on
 * this whole page.
 */
function checkSettings(clone, home, catalog) {
  const problems = [];
  const file = path.join(home, 'settings.json');
  let live;
  try {
    live = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    const why = e.code === 'ENOENT' ? 'does not exist' : `does not parse: ${e.message}`;
    return { name: 'settings.json', problems: [`${file} ${why}: merge ${path.join(clone, 'home', 'settings.json')} into it`] };
  }

  const template = JSON.parse(fs.readFileSync(path.join(clone, 'home', 'settings.json'), 'utf8'));
  const installed = hookRows(live);
  const wanted = hookRows(template);

  for (const row of wanted) {
    const match = installed.find((h) => h.event === row.event && h.matcher === row.matcher &&
      h.script && path.basename(h.script) === path.basename(row.script));
    if (!match) {
      problems.push(`no ${label(row)} hook running ${path.basename(row.script)}: merge it from the template`);
      continue;
    }
    const resolved = expandHome(match.script);
    if (!fs.existsSync(resolved)) problems.push(`the ${label(row)} hook names ${match.script}, which is not on disk`);
  }

  // An override outlives the skill it names, and nothing reports it: the key is
  // read against a catalog that no longer has that entry and simply does nothing.
  for (const name of Object.keys(live.skillOverrides || {})) {
    if (!catalog.error && !catalog.names.has(name)) {
      problems.push(`skillOverrides names "${name}", which is not a skill in this clone`);
    }
  }

  return { name: 'settings.json', problems, summary: `${count(wanted.length, 'hook', 'hooks')} registered, every script on disk` };
}

/** What only Flow reads. Claude Code never opens either of these. */
function checkFlowHome(clone, flowHome) {
  const problems = [];
  for (const name of ['scripts', 'references']) {
    const found = inspect(path.join(flowHome, name));
    const wanted = path.join(clone, name);
    if (found.state === 'missing') problems.push(`${name} is not linked: run flow install`);
    else if (found.state === 'real') problems.push(`${name} is a real directory, not a link`);
    else if (found.state === 'broken') problems.push(`${name} points at ${found.raw}, which is gone: run flow install`);
    else if (found.target !== wanted) problems.push(`${name} points at ${found.target}, not this clone: run flow install`);
  }
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

// ---- the command ------------------------------------------------------------

const actions = {};

actions.doctor = {
  section: 'setup',
  summary: 'verify this machine: links, PATH, util, hooks, both suites',
  flags: {
    home: { arg: '<path>' },
    'flow-home': { arg: '<path>' },
    'no-bin': { bool: true },
    'no-tests': { bool: true },
  },
  run({ flags }) {
    // The same both-or-neither rule `flow install` follows, for a different
    // reason: there it stops half an install landing on the real machine, and
    // here it stops a report that read one scratch root and one real one.
    const ROOTS = { home: '~/.claude', 'flow-home': '~/.flow' };
    const given = Object.keys(ROOTS).filter((f) => flags[f]);
    if (given.length === 1) {
      const [missing] = Object.keys(ROOTS).filter((f) => !flags[f]);
      throw new FlowError(
        `--${given[0]} was passed without --${missing}, so ${ROOTS[missing]} would be read for real.\n` +
        'Pass both, or neither.'
      );
    }

    const clone = cloneRoot();
    const home = path.resolve(flags.home || path.join(os.homedir(), '.claude'));
    const flowHome = path.resolve(flags['flow-home'] || path.join(os.homedir(), '.flow'));
    const bin = flags['no-bin'] ? null : path.join(os.homedir(), '.local', 'bin');

    // The empty case, and it is the one this machine is in until install day.
    // Without it a fresh machine reads as 20 separate failures, all of them the
    // same failure said again.
    if (inspect(path.join(flowHome, 'scripts')).state === 'missing' && !anyFlowSkillLinked(home)) {
      out(
        `Flow is not installed here. ${shorten(flowHome)} has no scripts link and ${shorten(home)} holds no Flow skill.\n\n` +
        `Install it, then run this again:\n\n  node ${path.join(clone, 'scripts', 'flow', 'flow.js')} install\n`
      );
      return 1;
    }

    const catalog = readCatalog();

    const checks = [
      checkNames(clone, { bin }),
      checkUtil(),
      checkClaudeHome(clone, home, catalog),
      checkSettings(clone, home, catalog),
      checkFlowHome(clone, flowHome),
      flags['no-tests']
        ? { name: 'tests', skipped: '--no-tests' }
        : checkTests(clone, { bin }),
    ];

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

/** True when ~/.claude/skills holds even one link into this clone. */
function anyFlowSkillLinked(home) {
  const clone = cloneRoot();
  let entries = [];
  try {
    entries = fs.readdirSync(path.join(home, 'skills'));
  } catch {
    return false;
  }
  return entries.some((name) => {
    const found = inspect(path.join(home, 'skills', name));
    return found.state === 'ok' && found.target.startsWith(clone + path.sep);
  });
}

module.exports = actions;
