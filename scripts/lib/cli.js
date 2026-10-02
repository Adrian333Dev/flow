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

const out = (s) => process.stdout.write(s.endsWith('\n') ? s : s + '\n');

const HELP_WORDS = ['-h', '--help', 'help'];

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
 * Turns argv into positionals and flags, against what the action declared.
 *
 * An undeclared flag fails here. It used to be collected and ignored, so
 * `--statuss building` exited 0 having changed nothing, which reads exactly
 * like success.
 *
 * A flag declared with `letter: true` is one letter typed after one dash,
 * where a wide convention already owns the letter: `-y` answers yes, as in
 * `npm init -y`. It has no two-dash form.
 */
function parseArgs(argv, decl = {}) {
  const declared = decl.flags || {};
  const names = Object.keys(declared).filter((name) => !declared[name].letter);
  const letters = Object.keys(declared).filter((name) => declared[name].letter);
  const positional = [];
  const flags = {};

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    if (!arg.startsWith('--')) {
      if (arg.startsWith('-') && letters.includes(arg.slice(1))) {
        flags[arg.slice(1)] = true;
        continue;
      }
      if (arg.startsWith('-') && arg.length > 1) {
        throw new FlowError(`flags take two dashes: "--${arg.replace(/^-+/, '')}", not "${arg}".`);
      }
      positional.push(arg);
      continue;
    }

    const eq = arg.indexOf('=');
    const typed = eq === -1 ? arg.slice(2) : arg.slice(2, eq);
    if (!typed) throw new FlowError('"--" on its own is not a flag.');
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

  for (const [name, flag] of Object.entries(declared)) {
    if (flag.required && flags[name] === undefined) {
      throw new FlowError(flag.missing || `--${name} is required.`);
    }
  }

  return { positional, flags };
}

/**
 * `check` runs once per run, between the flags and the action, so a check that
 * needs `--root` sees it. The tool decides what it does: flow refuses a
 * machine `flow install` never finished.
 */
function runAction(action, argv, usage, check, extra) {
  const { positional, flags } = parseArgs(argv, { ...action, usage });
  if (check) check(action, flags);
  return action.run({ positional, flags, usage, ...extra });
}

/**
 * The first word is the command or the group. Tickets have no name of their
 * own here: `flow ls`, `flow build exp-47`. A word that names no command is a
 * ticket id, which is what makes `flow exp-47` show one.
 *
 * A group may name a default action, and the same rule then runs one level
 * down: a word naming no action is that action's argument, which is what makes
 * `flow cases <ref>` reach `flow cases get <ref>`.
 */
function dispatch(argv, { commands, groups, fallback, sections, title, check }) {
  if (!argv.length || HELP_WORDS.includes(argv[0])) {
    out(help({ commands, groups, sections, title }));
    return 0;
  }

  const [first, ...rest] = argv;
  if (first.startsWith('-')) throw new FlowError(`"${first}" is a flag: a command comes first.`);

  const names = [...Object.keys(commands), ...Object.keys(groups)];
  const name = names.includes(first) ? first : null;

  if (!name) return runAction(fallback, argv, 'flow <id>', check, { unnamed: names });
  if (commands[name]) return runAction(commands[name], rest, `flow ${name}`, check);

  const group = groups[name];
  const [typed, ...args] = rest;

  // A group with nothing after it prints its help, unless its default action
  // needs no argument, then the bare form is that action. `flow cases` has
  // nothing to show without a name and helps instead; `flow skills` answers,
  // since its patterns are optional.
  if (!typed || HELP_WORDS.includes(typed)) {
    const fallbackAction = group.default && group.actions[group.default];
    const optional = !fallbackAction?.args || fallbackAction.args.startsWith('[');
    if (!typed && fallbackAction && optional) {
      return runAction(fallbackAction, [], `flow ${name} ${group.default}`, check);
    }
    out(groupHelp(name, group));
    return 0;
  }

  const actions = Object.keys(group.actions);
  if (group.default && !actions.includes(typed)) {
    return runAction(group.actions[group.default], rest, `flow ${name} ${group.default}`, check);
  }

  const action = resolve(typed, actions, `${name} action`);
  return runAction(group.actions[action], args, `flow ${name} ${action}`, check);
}

// ---------------------------------------------------------------- help

const GUTTER = 38;

function flagText(action) {
  return Object.entries(action.flags || {})
    .map(([name, flag]) => (flag.letter ? `[-${name}]` : flag.required ? `--${name} ${flag.arg || '<value>'}` :
      flag.bool ? `[--${name}]` : `[--${name} ${flag.arg || '<value>'}]`))
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

/**
 * A group's actions, and the line saying which of them can be left out.
 */
function groupLines(name, group) {
  const lines = actionLines(`flow ${name}`, group.actions);
  if (group.default) {
    const action = group.actions[group.default];
    lines.push(line(
      `  flow ${name}${action.args ? ' ' + action.args : ''}`,
      `${group.default} is the default and can be left out`
    ));
  }
  return lines;
}

/**
 * Commands print in sections, though they all live in one flat namespace. The
 * sections are for reading: 18 commands in one alphabetical block hides which
 * ones move a ticket and which ones only look at it.
 */
function help({ commands, groups, sections, title }) {
  const lines = [title];
  for (const s of sections) {
    const picked = Object.fromEntries(Object.entries(commands).filter(([, a]) => a.section === s.key));
    if (!Object.keys(picked).length) continue;
    lines.push('', s.title);
    lines.push(...actionLines('flow', picked));
  }
  for (const [name, group] of Object.entries(groups)) {
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

module.exports = { out, resolve, parseArgs, dispatch, joinAnd, readBody };
