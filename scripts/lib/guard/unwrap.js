'use strict';
/**
 * Peels a command down to the program it runs: keywords, assignments and
 * wrappers such as `env`, `timeout`, `xargs` and `sudo` come off, and
 * `bash -c '…'` or `eval` comes back as commands to read again.
 */

const path = require('path');
const { parse, newWord, DYNAMIC } = require('./parse');
const { literal, expandAll, expand, braces } = require('./words');
const { SHELLS } = require('./outside-code');

const KEYWORDS = new Set(['if', 'then', 'else', 'elif', 'do', 'while', 'until', '!', '{', '}', 'fi', 'done', 'esac', 'time', 'coproc']);
const isKeyword = (w) => w.open && KEYWORDS.has(w.prefix) && literal(w) === w.prefix;
const isAssignment = (w) => /^[A-Za-z_][A-Za-z0-9_]*\+?=/.test(w.prefix);

function assign(words, ctx) {
  for (const w of words) {
    const name = /^[A-Za-z_][A-Za-z0-9_]*/.exec(w.prefix)?.[0];
    if (!name || !isAssignment(w)) continue;
    const first = typeof w.parts[0] === 'string' ? w.parts[0].slice(w.prefix.indexOf('=') + 1) : '';
    ctx.vars.set(name, expand({ ...w, parts: [first, ...w.parts.slice(1)] }, ctx));
  }
}

// Programs that run the command after their own flags, each with the flags that take a value.
// `timeout` also takes the time limit before the command.
const WRAPPERS = new Map([
  ...['command', 'builtin', 'nohup', 'time', 'caffeinate', 'chronic', 'unbuffer', 'noglob', 'nocorrect', 'setsid'].map((p) => [p, []]),
  ['exec', ['-a']],
  ['nice', ['-n']],
  ['ionice', ['-c', '-n']],
  ['stdbuf', ['-i', '-o', '-e']],
  ['timeout', ['-s', '-k', '--signal', '--kill-after']],
  ...['sudo', 'doas'].map((p) => [p, ['-u', '-g', '-C', '-h', '-p', '-r', '-t', '-U']]),
]);

const dropFlags = (w, valueFlags = new Set()) => {
  let i = 0;
  while (i < w.length && (literal(w[i]) ?? '').startsWith('-') && literal(w[i]) !== '-') {
    i += valueFlags.has(literal(w[i])) ? 2 : 1;
  }
  return w.slice(i);
};

/**
 * The program a command really runs, and its arguments, with keywords,
 * assignments and wrappers such as `env`, `timeout`, `xargs` and `sudo`
 * peeled off. `{ inline }` when the command runs a string of shell, such as
 * `bash -c` or `eval`. Null for a line that runs nothing.
 */
function unwrap(words, ctx) {
  let w = words.slice();
  for (;;) {
    while (w.length && isKeyword(w[0])) w.shift();
    if (!w.length) return null;
    const first = literal(w[0]);
    if (first === 'for' || first === 'select') {
      // `for f in a b` holds each word in turn. A word the guard cannot know leaves the variable unknown.
      const name = literal(w[1]);
      const items = literal(w[2]) === 'in' ? w.slice(3).map((item) => expandAll(item, ctx)) : [null];
      if (name) ctx.vars.set(name, items.includes(null) ? null : items.flat().flatMap(braces));
      return null;
    }
    if (['case', 'function', '[[', 'in'].includes(first)) return null;

    let k = 0;
    while (k < w.length && isAssignment(w[k])) k++;
    if (k === w.length) {
      assign(w, ctx);
      return null;
    }
    if (k) {
      w = w.slice(k);
      continue;
    }

    const programText = expand(w[0], ctx);
    if (programText === null) return { program: null, word: w[0], args: w.slice(1) };
    const program = path.basename(programText);
    const args = w.slice(1);

    if (WRAPPERS.has(program)) {
      // `command -v x` and `ionice -p 12` only look, and run nothing.
      if (['command', 'builtin'].includes(program) && ['-v', '-V'].includes(literal(args[0]))) return null;
      if (program === 'ionice' && args.some((a) => literal(a) === '-p')) return null;
      w = dropFlags(args, new Set(WRAPPERS.get(program)));
      if (program === 'timeout') w = w.slice(1);
      continue;
    }

    switch (program) {
      case 'env': {
        let i = 1;
        for (;;) {
          const t = literal(w[i]);
          if (t === '-u' || t === '-C' || t === '--chdir') i += 2;
          else if (t === '-S' || t === '--split-string') return { inline: w[i + 1] ? parse(w[i + 1].raw, 1) : [] };
          else if ((t ?? '').startsWith('-') || (w[i] && isAssignment(w[i]))) i++;
          else break;
        }
        w = w.slice(i);
        continue;
      }
      case 'flock': {
        const rest = dropFlags(args, new Set(['-w', '-E', '--timeout', '--conflict-exit-code']));
        const c = rest.findIndex((a) => ['-c', '--command'].includes(literal(a)));
        if (c >= 0) return { inline: rest[c + 1] ? parse(rest[c + 1].raw, 1) : [] };
        w = rest.slice(1);
        continue;
      }
      case 'watch': {
        const rest = dropFlags(args, new Set(['-n', '--interval', '-q', '--equexit']));
        return { inline: parse(rest.map((a) => a.raw).join(' '), 1) };
      }
      case 'bundle':
        if (literal(w[1]) !== 'exec') break;
        w = w.slice(2);
        continue;
      case 'xargs': {
        let i = 1;
        let replace = null;
        for (; i < w.length; i++) {
          const t = literal(w[i]) ?? '';
          if (!t.startsWith('-')) break;
          if (t === '-I') replace = literal(w[++i]);
          else if (t === '-i' || t === '--replace') replace = '{}';
          else if (/^-i./.test(t)) replace = t.slice(2);
          else if (t.startsWith('--replace=')) replace = t.slice(10);
          else if (['-n', '-L', '-P', '-s', '-d', '-a', '-E'].includes(t)) i++;
        }
        const inner = w.slice(i);
        if (!inner.length) return null;
        if (replace) {
          w = inner.map((a) => (a.raw.includes(replace) ? { ...a, parts: [DYNAMIC] } : a));
        } else {
          w = [...inner, { ...newWord(), parts: [DYNAMIC], raw: '<xargs input>' }];
        }
        continue;
      }
      case 'eval':
        return { inline: parse(args.map((a) => a.raw).join(' '), 1) };
      default:
        break;
    }

    if (SHELLS.has(program)) {
      const c = args.findIndex((a) => /^-[a-zA-Z]*c[a-zA-Z]*$/.test(literal(a) ?? ''));
      if (c >= 0) return { inline: args[c + 1] ? parse(args[c + 1].raw, 1) : [] };
    }
    return { program, programText, args };
  }
}

module.exports = { unwrap, assign };
