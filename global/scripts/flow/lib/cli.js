'use strict';
/**
 * The argument layer: one resolver, one parser, one dispatcher, and the help
 * text generated from what the commands declare.
 *
 * Nothing here knows what a ticket is. The entry point hands over a table of
 * commands, each declaring the flags it accepts, and this file turns argv into
 * a call.
 */

const { FlowError } = require('./error');

const out = (s) => process.stdout.write(s.endsWith('\n') ? s : s + '\n');

const HELP_WORDS = ['-h', '--help', 'help'];

/**
 * Matches a typed word against the names that are legal in its position — the
 * command, a group's action, a flag, a flag's value.
 *
 * An exact match always wins, so no name is ever hidden by being the start of
 * a longer one. A single prefix match resolves. Several fail and list the
 * candidates, because guessing is how an abbreviation silently changes meaning
 * the day a new name is added beside it.
 */
function resolve(word, candidates, label, prefix = '') {
  const hit = match(word, candidates, prefix);
  if (hit) return hit;
  const show = candidates.map((c) => prefix + c).join(', ');
  throw new FlowError(`unknown ${label} "${prefix}${word}" — one of: ${show}`);
}

/**
 * `resolve` without the last refusal: nothing matched returns null, so the
 * caller can try the word as something other than a name. Ambiguity still
 * throws — two commands start with `p`, and picking one would be a guess.
 */
function match(word, candidates, prefix = '') {
  if (candidates.includes(word)) return word;
  const hits = candidates.filter((c) => c.startsWith(word));
  if (hits.length === 1) return hits[0];
  if (hits.length === 0) return null;
  throw new FlowError(`"${prefix}${word}" is ambiguous — ${hits.map((c) => prefix + c).join(', ')}`);
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

function runAction(action, argv, usage, extra) {
  const { positional, flags } = parseArgs(argv, { ...action, usage });
  return action.run({ positional, flags, usage, ...extra });
}

/**
 * The first word is the command. Almost every one of them acts on a ticket, so
 * tickets have no name of their own here — `flow ls`, `flow build t047`. A word
 * that names no command is a ticket id, which is what makes `flow t047` show
 * one. Only `cases` keeps a group, because it is a different stored thing.
 */
function dispatch(argv, { commands, groups, fallback, sections, title, notes }) {
  if (!argv.length || HELP_WORDS.includes(argv[0])) {
    out(help({ commands, groups, sections, title, notes }));
    return 0;
  }

  const [first, ...rest] = argv;
  if (first.startsWith('-')) throw new FlowError(`"${first}" is a flag — a command comes first.`);

  const names = [...Object.keys(commands), ...Object.keys(groups)];
  const name = match(first, names);

  if (!name) return runAction(fallback, argv, 'flow <id>', { unnamed: names });
  if (commands[name]) return runAction(commands[name], rest, `flow ${name}`);

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
function line(left, summary) {
  const pad = ' '.repeat(GUTTER);
  return left.length < GUTTER ? left.padEnd(GUTTER) + summary : `${left}\n${pad}${summary}`;
}

function actionLines(prefix, actions) {
  const pad = ' '.repeat(GUTTER);
  const lines = [];
  for (const [name, action] of Object.entries(actions)) {
    lines.push(line(`  ${prefix} ${name}${action.args ? ' ' + action.args : ''}`, action.summary));
    const flags = flagText(action);
    if (flags) lines.push(pad + flags);
  }
  return lines;
}

/**
 * Commands print in sections, though they all live in one flat namespace. The
 * sections are for reading: 18 commands in one alphabetical block hides which
 * ones move a ticket and which ones only look at it.
 */
function help({ commands, groups, sections, title, notes }) {
  const lines = [title];
  for (const s of sections) {
    const picked = Object.fromEntries(Object.entries(commands).filter(([, a]) => a.section === s.key));
    if (!Object.keys(picked).length && !s.lead) continue;
    lines.push('', s.title);
    for (const [left, summary] of s.lead || []) lines.push(line(`  ${left}`, summary));
    lines.push(...actionLines('flow', picked));
  }
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

module.exports = { out, resolve, match, parseArgs, dispatch };
