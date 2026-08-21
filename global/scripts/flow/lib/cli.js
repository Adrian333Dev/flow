'use strict';
/**
 * The argument layer: one resolver, one parser, one dispatcher, and the help
 * text generated from what the commands declare.
 *
 * Nothing here knows what a ticket is. A command group hands over a table of
 * actions, each declaring the flags it accepts, and this file turns argv into
 * a call.
 */

const { FlowError } = require('./error');

const out = (s) => process.stdout.write(s.endsWith('\n') ? s : s + '\n');

const HELP_WORDS = ['-h', '--help', 'help'];

/**
 * Matches a typed word against the names that are legal in its position — the
 * stored thing, the action, a flag, a flag's value.
 *
 * An exact match always wins, so no name is ever hidden by being the start of
 * a longer one. A single prefix match resolves. Several fail and list the
 * candidates, because guessing is how an abbreviation silently changes meaning
 * the day a new name is added beside it.
 */
function resolve(word, candidates, label, prefix = '') {
  const show = (list) => list.map((c) => prefix + c).join(', ');
  if (candidates.includes(word)) return word;

  const hits = candidates.filter((c) => c.startsWith(word));
  if (hits.length === 1) return hits[0];
  if (hits.length === 0) {
    throw new FlowError(`unknown ${label} "${prefix}${word}" — one of: ${show(candidates)}`);
  }
  throw new FlowError(`"${prefix}${word}" is ambiguous — ${show(hits)}`);
}

/**
 * Turns argv into positionals and flags, against what the action declared.
 *
 * An undeclared flag fails here. It used to be collected and ignored, so
 * `--statuss building` exited 0 having changed nothing, which reads exactly
 * like success.
 */
function parseArgs(argv, decl = {}) {
  const declared = decl.flags || {};
  const names = Object.keys(declared);
  const positional = [];
  const flags = {};

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    if (!arg.startsWith('--')) {
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

function runAction(action, argv, usage) {
  const { positional, flags } = parseArgs(argv, { ...action, usage });
  return action.run({ positional, flags, usage });
}

/**
 * Two kinds of command, and the first word says which. A board command answers
 * a question about the work as a whole; everything else names a stored thing
 * and the action comes next.
 */
function dispatch(argv, { groups, board, title, notes }) {
  if (!argv.length || HELP_WORDS.includes(argv[0])) {
    out(help({ groups, board, title, notes }));
    return 0;
  }

  const [first, ...rest] = argv;
  if (first.startsWith('-')) throw new FlowError(`"${first}" is a flag — a command comes first.`);

  const name = resolve(first, [...Object.keys(board), ...Object.keys(groups)], 'command');

  if (board[name]) return runAction(board[name], rest, `flow ${name}`);

  const group = groups[name];
  const [typed, ...args] = rest;
  if (!typed || HELP_WORDS.includes(typed)) { out(groupHelp(name, group)); return 0; }

  const action = resolve(typed, Object.keys(group.actions), `${name} action`);
  return runAction(group.actions[action], args, `flow ${name} ${action}`);
}

// ---------------------------------------------------------------- help

const GUTTER = 38;

function flagText(action) {
  return Object.entries(action.flags || {})
    .map(([name, flag]) => (flag.required ? `--${name} ${flag.arg || '<value>'}` :
      flag.bool ? `[--${name}]` : `[--${name} ${flag.arg || '<value>'}]`))
    .join(' ');
}

/**
 * The summary sits beside the command and the flags go underneath it. Both on
 * one line ran past 200 characters on `new` and `edit`, which is where the
 * flags matter most.
 */
function actionLines(prefix, actions) {
  const pad = ' '.repeat(GUTTER);
  const lines = [];
  for (const [name, action] of Object.entries(actions)) {
    const left = `  ${prefix} ${name}${action.args ? ' ' + action.args : ''}`;
    lines.push(left.length < GUTTER ? left.padEnd(GUTTER) + action.summary : `${left}\n${pad}${action.summary}`);
    const flags = flagText(action);
    if (flags) lines.push(pad + flags);
  }
  return lines;
}

function help({ groups, board, title, notes }) {
  const lines = [title, '', 'the board'];
  lines.push(...actionLines('flow', board));
  for (const [name, group] of Object.entries(groups)) {
    lines.push('', group.summary ? `${name} — ${group.summary}` : name);
    lines.push(...actionLines(`flow ${name}`, group.actions));
  }
  if (notes) lines.push('', notes);
  return lines.join('\n');
}

function groupHelp(name, group) {
  const lines = [group.summary ? `flow ${name} — ${group.summary}` : `flow ${name}`, ''];
  lines.push(...actionLines(`flow ${name}`, group.actions));
  return lines.join('\n');
}

module.exports = { out, resolve, parseArgs, dispatch };
