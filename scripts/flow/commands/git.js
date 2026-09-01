'use strict';
/**
 * `flow git` — whether the agent may run a git command that writes.
 *
 * Off is the normal state and the default everywhere. Turning it on writes an
 * entry that `guard.js` reads before every shell command, so it takes effect on
 * the next one with nothing to restart.
 *
 * The actions are named after the state they land in — `flow git allow` — which
 * is the shape the status verbs already use.
 *
 * Nothing here decides what a git command may do. This command only writes down
 * the mode; guard.js holds the rules, including the destructive commands that
 * ask however this is set.
 */

const { FlowError } = require('../lib/error');
const { out } = require('../lib/cli');
const { projectRoot } = require('../lib/root');
const settings = require('../lib/settings');

const DEFAULT_MINUTES = 60;

/** The project, or null outside one — every action works anywhere. */
function maybeRoot() {
  try {
    return projectRoot();
  } catch {
    return null;
  }
}

/**
 * `--for` as minutes, or null for an entry with no clock on it.
 *
 * Left off, an unlock lasts an hour. Nothing tells Flow that a session ended or
 * that you finished committing, so an entry with no expiry is one you have to
 * remember to turn off — which is the failure this exists to prevent, not a
 * convenience to default to.
 */
function minutes(value) {
  if (value === undefined) return DEFAULT_MINUTES;
  if (value === 'never') return null;

  const match = /^(\d+)([mh]?)$/.exec(value.trim());
  if (!match) {
    throw new FlowError(`--for takes 30m, 2h or never — not "${value}".`);
  }
  const count = Number(match[1]);
  if (!count) throw new FlowError('--for needs a length greater than zero, or never.');
  return match[2] === 'h' ? count * 60 : count;
}

/**
 * Where an entry lands, and the scope's name.
 *
 * Session is the default because it is the narrowest thing that can be meant: a
 * switch turned on to get one job done should not outlive the conversation that
 * needed it. Outside a session there is no session to scope to.
 */
function target(flags) {
  if (flags.project && flags.global) {
    throw new FlowError('--project and --global name two different files. Pass one.');
  }

  const root = maybeRoot();

  if (flags.global) return { scope: 'global', file: settings.globalFile() };

  if (flags.project) {
    if (!root) throw new FlowError('--project needs a git repository, and this is not inside one.');
    return { scope: 'project', file: settings.projectFile(root) };
  }

  const session = process.env.CLAUDE_CODE_SESSION_ID;
  if (session) return { scope: 'session', file: settings.globalFile(), session };
  if (root) return { scope: 'project', file: settings.projectFile(root) };
  return { scope: 'global', file: settings.globalFile() };
}

const clock = (until) => new Date(until).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

/** How long is left, in whole minutes, for a line the user reads. */
function remaining(until) {
  const left = Math.round((Date.parse(until) - Date.now()) / 60000);
  return left < 1 ? 'under a minute left' : left === 1 ? '1 minute left' : `${left} minutes left`;
}

const WHERE = { session: 'in this session', project: 'in this project', global: 'everywhere' };

function describe(state) {
  if (state.mode === 'off') return 'git writes: off — name the command, you run it';
  const where = WHERE[state.scope];
  const when = state.entry.until ? `, expires ${clock(state.entry.until)} (${remaining(state.entry.until)})` : ', no expiry';
  return `git writes: ${state.mode} ${where}${when}`;
}

/** Writes one mode, and says what it replaced when the old entry sat elsewhere. */
function set(mode, flags) {
  const spot = target(flags);
  const before = settings.gitMode({ session: process.env.CLAUDE_CODE_SESSION_ID, cwd: process.cwd() });
  const span = minutes(flags.for);

  const entry = { mode };
  if (span !== null) entry.until = new Date(Date.now() + span * 60000).toISOString();
  if (spot.session) entry.session = spot.session;

  const data = settings.read(spot.file);
  data.git = entry;
  settings.write(spot.file, data);

  out(describe({ mode, scope: spot.scope, entry }));

  if (before.mode !== 'off' && before.scope !== spot.scope) {
    out(`  replaces the ${before.scope} entry, which no longer applies here`);
  }
  return 0;
}

const SCOPE_FLAGS = {
  project: { bool: true },
  global: { bool: true },
};

const actions = {};

actions.get = {
  summary: 'whether the agent may write with git, and until when',
  run() {
    out(describe(settings.gitMode({ session: process.env.CLAUDE_CODE_SESSION_ID, cwd: process.cwd() })));
    return 0;
  },
};

actions.allow = {
  summary: 'let the agent run git commands that write',
  flags: { for: { arg: '<30m|2h|never>' }, ...SCOPE_FLAGS },
  run({ flags }) {
    return set('allow', flags);
  },
};

actions.ask = {
  summary: 'same, but confirm every one of them',
  flags: { for: { arg: '<30m|2h|never>' }, ...SCOPE_FLAGS },
  run({ flags }) {
    return set('ask', flags);
  },
};

// No --project or --global. Off is the state you reach for when git should
// stop, and clearing one file while another still holds an entry would print
// "off" and leave writes running.
actions.off = {
  summary: 'back to reads only, in every scope',
  run() {
    const files = [settings.globalFile()];
    const root = maybeRoot();
    if (root) files.push(settings.projectFile(root));

    const cleared = files.filter((file) => settings.remove(file, 'git'));
    out(cleared.length ? 'git writes: off' : 'git writes: off already');
    return 0;
  },
};

module.exports = {
  summary: 'whether the agent may run git commands that write',
  default: 'get',
  actions,
};
