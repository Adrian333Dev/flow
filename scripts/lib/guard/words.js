'use strict';
/**
 * What a word from `parse.js` holds: its plain text, the texts it expands to,
 * the path it names, and the flags and arguments of a command's words.
 */

const path = require('path');

/** The word's text when it holds nothing but text, else null. */
function literal(word) {
  if (!word) return null;
  return word.parts.every((p) => typeof p === 'string') ? word.parts.join('') : null;
}

function variable(name, ctx) {
  if (ctx.vars.has(name)) return ctx.vars.get(name);
  if (name === 'PWD') return ctx.dir;
  if (name === 'HOME') return ctx.world.home;
  return ctx.world.env(name);
}

/**
 * Every text the word can stand for, with `~` and each variable the guard can
 * know filled in, else null. A loop's variable holds a list, so its word stands
 * for one text per item.
 */
function expandAll(word, ctx) {
  let outs = [''];
  for (const p of word.parts) {
    if (typeof p === 'string') outs = outs.map((o) => o + p);
    else if (p.home) outs = outs.map((o) => o + ctx.world.home);
    else if (p.variable) {
      const value = variable(p.variable, ctx);
      if (value == null) return null;
      outs = Array.isArray(value) ? outs.flatMap((o) => value.map((v) => o + v)) : outs.map((o) => o + value);
    } else return null;
  }
  return outs;
}

/** The word's one text, else null: unknown, or a loop's variable holding several. */
function expand(word, ctx) {
  const all = expandAll(word, ctx);
  return all && all.length === 1 ? all[0] : null;
}

/** `a{b,c}d` as `abd` and `acd`. */
function braces(s) {
  const m = /^(.*?)\{([^{}]*,[^{}]*)\}(.*)$/.exec(s);
  if (!m) return [s];
  return m[2].split(',').flatMap((part) => braces(m[1] + part + m[3]));
}

const isInside = (root, target) => {
  const rel = path.relative(root, target);
  return rel === '' || (!rel.startsWith(`..${path.sep}`) && rel !== '..' && !path.isAbsolute(rel));
};

/** The path a word names, from the folder the command runs in. Null when the guard cannot know it. */
function pathOf(word, ctx) {
  const t = expand(word, ctx);
  if (t === null || (!path.isAbsolute(t) && ctx.dir === null)) return null;
  return path.resolve(ctx.dir ?? '/', t);
}

/** The words after the flags. `valueFlags` names the flags whose value is the next word. */
function positionals(args, valueFlags = new Set()) {
  const out = [];
  let flags = true;
  for (let i = 0; i < args.length; i++) {
    const t = literal(args[i]);
    if (flags && t === '--') {
      flags = false;
    } else if (flags && t && t.startsWith('-') && t !== '-') {
      if (valueFlags.has(t)) i++;
    } else {
      out.push(args[i]);
    }
  }
  return out;
}

/** The value given to any of `flags`, written `-X POST`, `-XPOST` or `--request=POST`, else null. */
function flagValue(r, flags) {
  for (let i = 0; i < r.length; i++) {
    const t = r[i] ?? '';
    for (const f of flags) {
      if (t === f) return r[i + 1] ?? null;
      const joined = f.startsWith('--') ? `${f}=` : f;
      if (t.startsWith(joined) && t.length > joined.length) return t.slice(joined.length);
    }
  }
  return null;
}

const listed = (files) => files.slice(0, 3).join(', ') + (files.length > 3 ? ` and ${files.length - 3} more` : '');

/** Where an rsync writes: its last argument. Both a delete and a send read it. */
const rsyncDestination = (args) => positionals(args, new Set(['-e', '--rsh', '-f', '--filter'])).pop();

module.exports = { literal, expandAll, expand, braces, isInside, pathOf, positionals, flagValue, listed, rsyncDestination };
