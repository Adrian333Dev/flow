'use strict';
/**
 * The argument layer: one resolver, one parser, one dispatcher, and the help
 * text generated from what the commands declare.
 *
 * Nothing here knows what a ticket is. The entry point hands over a table of
 * commands, each declaring the flags it accepts, and this file turns argv into
 * a call.
 */

const fs = require('fs');
const { FlowError } = require('./error');

/**
 * `--json` on a run turns the text off: `out` prints nothing, and the action
 * hands its result to `json`, printed once after it ran. One result per run,
 * the last set: `flow notes promote` calls `flow tickets new`, and only the
 * promote's result prints.
 */
const run = { json: false, result: undefined };

const out = (s) => {
  if (run.json) return;
  process.stdout.write(s.endsWith('\n') ? s : s + '\n');
};

/** The result `--json` prints. Called by every action that takes `--json`. */
const json = (data) => { run.result = data; };

/** True while a `--json` run is on, so the entry point prints a refusal as JSON. */
const jsonMode = () => run.json;

const HELP_WORDS = ['-h', '--help', 'help'];
const HELP_FLAGS = ['-h', '--help'];

/**
 * Matches a typed word against the names that are legal in its position: the
 * command, a group's action, a flag, a flag's value. The whole name, always:
 * an abbreviation changes meaning the day a name is added beside it.
 */
function resolve(word, candidates, label, prefix = '') {
  if (candidates.includes(word)) return word;
  const show = candidates.map((c) => prefix + c).join(', ');
  throw new FlowError(`unknown ${label} "${prefix}${word}", one of: ${show}`);
}

/**
 * The short form of each flag, typed by hand: 1 letter where free, 2 or 3 on
 * a clash. One table, so a form means the same flag in every command. Docs
 * and skills always write the long name. A hidden flag gets none.
 */
const SHORT = {
  project: 'p', parent: 'pa', prefix: 'pre', prereq: 'prq',
  label: 'l', limit: 'li', last: 'la',
  force: 'f', first: 'fi', from: 'fr', full: 'fu',
  by: 'b', body: 'bo', before: 'be',
  reason: 'r', rebuild: 'rb',
  activity: 'a', after: 'af', all: 'al',
  deps: 'd', description: 'de',
  turns: 't', thinking: 'th',
  global: 'g', quiet: 'q',
  flat: 'fl',
};

/**
 * `--json` is on every action but the ones declaring `json: false` (install,
 * update, init, sync), so it is added here rather than declared 20 times. It
 * is hidden from each help line, and said once under the help's title.
 */
const JSON_FLAG = { bool: true, hidden: true };
const takesJson = (decl) => decl.json !== false;

/** The short form a declared flag is typed with, or null. */
const shortOf = (name, flag) => (flag.hidden ? null : SHORT[name] || null);

/**
 * Turns argv into positionals, flags and the query, against what the action
 * declared.
 *
 * An undeclared flag fails here. It used to be collected and ignored, so
 * `--statuss building` exited 0 having changed nothing, which reads exactly
 * like success.
 *
 * `--` marks the one argument after it as the query, for an action declared
 * with `query: true`. A flag may still follow: `flow tickets -- "label:ui" -p fw`.
 * A word left over beside a query is a query the shell split, since its
 * quotes were dropped, and is refused naming the quoted form. An action
 * declared with `query: 'beside'` also takes positionals before the `--`, as
 * `flow audit summary <id> -- "since:2026-10-01"` does; a word after it is
 * still refused.
 *
 * A short form (`SHORT`) is matched whole, never bundled: `-pa` is `--parent`,
 * never `-p -a`. It lands in `flags` under its long name.
 */
function parseArgs(argv, decl = {}) {
  const declared = takesJson(decl) ? { ...decl.flags, json: JSON_FLAG } : decl.flags || {};
  const names = Object.keys(declared);
  const shorts = Object.fromEntries(names.filter((name) => shortOf(name, declared[name])).map((name) => [shortOf(name, declared[name]), name]));
  const positional = [];
  const flags = {};
  let query;
  let beforeQuery = 0;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    if (arg === '--') {
      if (!decl.query) throw new FlowError(`${decl.usage || 'this command'} takes no query.`);
      if (query !== undefined) throw new FlowError('one query only: quote it after a single "--".');
      beforeQuery = positional.length;
      query = argv[++i];
      if (query === undefined) throw new FlowError(`"--" needs a quoted query after it: ${decl.usage} -- "label:ui cache".`);
      continue;
    }

    if (!arg.startsWith('--')) {
      if (arg.startsWith('-') && shorts[arg.slice(1)]) {
        const name = shorts[arg.slice(1)];
        if (declared[name].bool) {
          flags[name] = true;
          continue;
        }
        const value = argv[++i];
        if (value === undefined) throw new FlowError(`${arg} needs a value.`);
        flags[name] = declared[name].values ? resolve(value, declared[name].values, `${arg} value`) : value;
        continue;
      }
      if (arg.startsWith('-') && arg.length > 1) {
        const known = Object.keys(SHORT).find((name) => SHORT[name] === arg.slice(1));
        if (known) throw new FlowError(`${decl.usage || 'this command'} takes no --${known} (${arg}).`);
        throw new FlowError(`unknown flag "${arg}". Long flags take two dashes, such as --${arg.replace(/^-+/, '')}.`);
      }
      positional.push(arg);
      continue;
    }

    const eq = arg.indexOf('=');
    const typed = eq === -1 ? arg.slice(2) : arg.slice(2, eq);
    if (!names.length) throw new FlowError(`${decl.usage || 'this command'} takes no flags.`);

    const name = resolve(typed, names, 'flag', '--');
    const flag = declared[name];

    if (flag.bool) {
      if (eq !== -1) throw new FlowError(`--${name} takes no value.`);
      flags[name] = true;
      continue;
    }

    const value = eq === -1 ? argv[++i] : arg.slice(eq + 1);
    if (value === undefined) throw new FlowError(`--${name} needs a value.`);
    flags[name] = flag.values ? resolve(value, flag.values, `--${name} value`) : value;
  }

  const loose = decl.query === 'beside' ? (query === undefined ? [] : positional.slice(beforeQuery)) : positional;
  if (decl.query && loose.length) {
    const words = [query, ...loose].filter((w) => w !== undefined).join(' ');
    const ids = decl.query === 'beside' ? positional.slice(0, beforeQuery).map((w) => ` ${w}`).join('') : '';
    throw new FlowError(`quote the query: ${decl.usage}${ids} -- "${words}"`);
  }

  for (const [name, flag] of Object.entries(declared)) {
    if (flag.required && flags[name] === undefined) {
      throw new FlowError(flag.missing || `--${name} is required.`);
    }
  }

  return { positional, flags, query };
}

/**
 * `check` runs once per run, between the flags and the action, so a check that
 * needs `--root` sees it. The tool decides what it does: flow refuses a
 * machine `flow install` never finished.
 *
 * `--help` or `-h` anywhere after the command prints that command's lines from
 * the help, and runs nothing.
 *
 * Under `--json` the mode is on before the flags are read, so a refusal of the
 * flags prints as JSON too. An action that set no result is a bug in flow,
 * refused loudly rather than printing nothing.
 */
function runAction(action, argv, usage, check, extra) {
  if (argv.some((a) => HELP_FLAGS.includes(a))) {
    out(actionLines(usage.replace(/ [^ ]+$/, ''), { [usage.split(' ').pop()]: action }).map((l) => l.slice(2)).join('\n'));
    return 0;
  }
  run.json = takesJson(action) && argv.includes('--json');
  run.result = undefined;
  const { positional, flags, query } = parseArgs(argv, { ...action, usage });
  if (check) check(action, flags);
  const code = action.run({ positional, flags, query, usage, ...extra });
  if (!run.json) return code;
  if (run.result === undefined) throw new FlowError(`${usage} set no JSON result: a bug in flow.`);
  process.stdout.write(`${JSON.stringify(run.result, null, 2)}\n`);
  return code;
}

const err = (s) => process.stderr.write(s.endsWith('\n') ? s : s + '\n');

/**
 * The first word is a bare command or a noun. A noun typed alone runs its
 * `list` action, and so does a noun followed by `--` and a query or by a
 * flag: `flow notes`, `flow notes -- "cache"`, `flow tickets -p fw`. Any
 * other word after a noun is a verb, so a one-word query never reads as one.
 *
 * An unknown command, a removed one included, exits 1 with one error line and
 * the help of the noun it was typed under, or the whole help at the top.
 */
function dispatch(argv, { commands, groups, sections, title, check }) {
  if (!argv.length || HELP_WORDS.includes(argv[0])) {
    out(help({ commands, groups, sections, title }));
    return 0;
  }

  const [first, ...rest] = argv;
  if (first.startsWith('-')) throw new FlowError(`"${first}" is a flag: a command comes first.`);

  if (commands[first]) return runAction(commands[first], rest, `flow ${first}`, check);

  const group = groups[first];
  if (!group) {
    err(`flow: unknown command "${first}".\n`);
    err(help({ commands, groups, sections, title }));
    return 1;
  }

  const [typed, ...args] = rest;
  if (HELP_WORDS.includes(typed)) {
    out(groupHelp(first, group));
    return 0;
  }

  if (typed === undefined || typed.startsWith('-')) {
    if (group.list) return runAction(group.list, rest, `flow ${first}`, check);
    out(groupHelp(first, group));
    return typed === undefined ? 0 : 1;
  }

  const action = group.actions?.[typed];
  if (!action) {
    err(`flow: unknown command "${first} ${typed}".\n`);
    err(groupHelp(first, group));
    return 1;
  }
  return runAction(action, args, `flow ${first} ${typed}`, check);
}

// ---------------------------------------------------------------- help

const GUTTER = 38;

/**
 * A flag, a command or a noun marked `hidden` works and never prints in the
 * help: the ones the tests and the agent's skills use, which a person never
 * types, and a noun paused until its feature is rebuilt.
 */
function flagText(action) {
  return Object.entries(action.flags || {})
    .filter(([, flag]) => !flag.hidden)
    .map(([name, flag]) => {
      const short = shortOf(name, flag);
      const typed = short ? `-${short}, --${name}` : `--${name}`;
      return flag.required ? `${typed} ${flag.arg || '<value>'}` :
        flag.bool ? `[${typed}]` : `[${typed} ${flag.arg || '<value>'}]`;
    })
    .join(' ');
}

/**
 * The summary sits beside the command and the flags go underneath it. Both on
 * one line ran past 200 characters on `new` and `edit`, which is where the
 * flags matter most.
 */
function line(left, summary) {
  const pad = ' '.repeat(GUTTER);
  return left.length < GUTTER ? left.padEnd(GUTTER) + summary : `${left}\n${pad}${summary}`;
}

/**
 * One row per action, its flags underneath. `helpName` stands in for the name
 * where 2 forms run the same action: `flow [get] <id>`.
 */
function actionLines(prefix, actions) {
  const pad = ' '.repeat(GUTTER);
  const lines = [];
  for (const [name, action] of Object.entries(actions)) {
    lines.push(line(`  ${prefix} ${action.helpName || name}${action.args ? ' ' + action.args : ''}`, action.summary));
    const flags = flagText(action);
    if (flags) lines.push(pad + flags);
  }
  return lines;
}

/** A noun's list line, typed as the noun alone, then its verbs. */
function groupLines(name, group) {
  const lines = group.list ? actionLines('flow', { [name]: group.list }) : [];
  lines.push(...actionLines(`flow ${name}`, group.actions || {}));
  return lines;
}

/** The bare commands in their sections, then each noun with its verbs. */
function help({ commands, groups, sections, title }) {
  const plain = Object.keys(commands).filter((name) => !takesJson(commands[name]));
  const lines = [title, `--json on every command${plain.length ? ` but ${joinAnd(plain)}` : ''} prints JSON.`];
  for (const s of sections) {
    const picked = Object.fromEntries(Object.entries(commands).filter(([, a]) => a.section === s.key && !a.hidden));
    if (!Object.keys(picked).length) continue;
    lines.push('', s.title);
    lines.push(...actionLines('flow', picked));
  }
  for (const [name, group] of Object.entries(groups)) {
    if (group.hidden) continue;
    lines.push('', group.summary ? `${name}: ${group.summary}` : name);
    lines.push(...groupLines(name, group));
  }
  return lines.join('\n');
}

function groupHelp(name, group) {
  const lines = [group.summary ? `flow ${name}: ${group.summary}` : `flow ${name}`, ''];
  lines.push(...groupLines(name, group));
  return lines.join('\n');
}

/** `a, b and c`, so a list of names reads as a sentence. */
function joinAnd(items) {
  if (items.length < 2) return items.join('');
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

/** `--body -` reads the whole body from stdin, so creating and filling a record is one command. */
function readBody(flags) {
  if (flags.body === '-') {
    let body;
    try {
      body = fs.readFileSync(0, 'utf8');
    } catch {
      throw new FlowError('--body - expects the body on stdin, and nothing was piped in.');
    }
    if (!body.trim()) throw new FlowError('--body - got empty stdin.');
    return body;
  }
  return flags.body == null ? undefined : flags.body;
}

/**
 * The items of a comma-joined list argument: `fw-1,fw-2`. Spaces around a
 * comma are dropped, so a list the shell kept whole still reads.
 */
const listOf = (value) => String(value ?? '').split(',').map((s) => s.trim()).filter(Boolean);

module.exports = { out, json, jsonMode, resolve, parseArgs, dispatch, joinAnd, readBody, listOf, SHORT };
