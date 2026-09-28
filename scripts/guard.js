#!/usr/bin/env node
'use strict';
/**
 * guard.js: the PreToolUse hook on Bash, and the one check between Claude and
 * a dangerous shell command.
 *
 * Flow's settings allow every shell command. This file reads each one before
 * it runs, and answers "ask" when it finds one of 5 kinds of harm:
 *
 *   1. losing work on this machine: a delete outside the project, a delete of
 *      files git cannot give back, a delete aimed at a variable, and the git
 *      commands that throw work away
 *   2. sending things off the machine: curl or wget sending data, a copy to
 *      another host, ssh
 *   3. touching shared systems: a deploy or cloud tool doing more than read,
 *      a database drop
 *   4. changing the machine outside the project: a global install, a
 *      scheduled job or background service, killing programs by name, a write
 *      into ~/.ssh, a shell startup file or the global git settings
 *   5. running outside code, or switching Flow off: a download run straight
 *      away, an npx of a package the project lacks, a write into ~/.claude,
 *      ~/.flow, ~/.agents or a project's .claude/settings*.json
 *
 * Otherwise it stays silent and the command runs. It never answers "allow".
 *
 * `parse` reads a command the way bash splits it. Loops, `$(…)`, backticks,
 * `<(…)`, here-docs, `bash -c '…'`, `eval`, `xargs` and `find -exec` all reach
 * the checks as separate commands, and `cd` moves the folder later paths
 * resolve against. So a new shape of command needs nothing here, and a new
 * tool joins a family with one entry in a table below.
 *
 * Where it cannot tell, it asks only when the unknown part decides a loss: a
 * delete or a git discard aimed at a variable, or a program named by one.
 * Anything else it cannot read stays silent, and so does a command bash itself
 * would refuse, such as one with an unclosed quote.
 *
 * It cannot see inside a script: `node -e`, `python3 -c`, or a file Claude
 * wrote and then runs. It catches the forms Claude writes, and is no wall.
 *
 * It only ever sees what the agent runs. A command typed behind `!` reaches no
 * hook. This file installs to ~/.claude/ and runs in every directory, so only
 * a rule that holds everywhere belongs here.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const HOME = os.homedir();

/** A command bash itself would refuse to run, such as one with an unclosed quote. */
class Unreadable extends Error {}

// ---------------------------------------------------------------------------
// Reading the command
// ---------------------------------------------------------------------------

// A word is a list of parts: plain text, the home folder, a named variable,
// or something only known when it runs. `raw` keeps the source text with one
// level of quotes removed, so `bash -c '…'` and `eval` can be read again.
const DYNAMIC = { dynamic: true };
const HOME_PART = { home: true };

const newWord = () => ({ parts: [], raw: '', quoted: false, glob: false, nested: [], prefix: '', open: true });
const newCommand = () => ({ words: [], redirects: [], pipeFrom: null });

function text(word, s) {
  const last = word.parts[word.parts.length - 1];
  if (typeof last === 'string') word.parts[word.parts.length - 1] = last + s;
  else word.parts.push(s);
}

/** Adds quoted text: `value` as the shell reads it, `raw` as written. */
function quotedText(word, value, raw) {
  word.quoted = true;
  word.open = false;
  text(word, value);
  word.raw += raw;
}

/** Adds a `$(…)`, backtick or `<(…)` spanning `src[from..to]`, its commands read from `src[start..end]`. */
function nestedRun(word, src, from, to, start, end, depth) {
  word.open = false;
  word.nested.push(...parse(src.slice(start, end), depth + 1));
  word.parts.push(DYNAMIC);
  word.raw += src.slice(from, to + 1);
  return to + 1;
}

/** The index of the `)` closing the `(` at `open`. */
function closing(src, open) {
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    const c = src[i];
    if (c === '\\') i++;
    else if (c === "'") {
      i = src.indexOf("'", i + 1);
      if (i < 0) break;
    } else if (c === '"') i = endOfDouble(src, i + 1);
    else if (c === '`') i = endOfBacktick(src, i + 1);
    else if (c === '(') depth++;
    else if (c === ')' && --depth === 0) return i;
  }
  throw new Unreadable('unclosed (');
}

function endOfDouble(src, i) {
  for (; i < src.length; i++) {
    const c = src[i];
    if (c === '\\') i++;
    else if (c === '"') return i;
    else if (c === '$' && src[i + 1] === '(') i = closing(src, i + 1);
    else if (c === '`') i = endOfBacktick(src, i + 1);
  }
  throw new Unreadable('unclosed "');
}

function endOfBacktick(src, i) {
  for (; i < src.length; i++) {
    if (src[i] === '\\') i++;
    else if (src[i] === '`') return i;
  }
  throw new Unreadable('unclosed `');
}

function endOfBrace(src, open) {
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    const c = src[i];
    if (c === '\\') i++;
    else if (c === '{') depth++;
    else if (c === '}' && --depth === 0) return i;
  }
  throw new Unreadable('unclosed ${');
}

/** Every `$(…)` and backtick inside `source`, read as commands into `into.nested`. */
function substitutions(source, into, depth) {
  for (let i = 0; i < source.length; i++) {
    if (source[i] === '\\') {
      i++;
    } else if (source[i] === '$' && source[i + 1] === '(') {
      const end = closing(source, i + 1);
      into.nested.push(...parse(source.slice(i + 2, end), depth + 1));
      i = end;
    } else if (source[i] === '`') {
      const end = endOfBacktick(source, i + 1);
      into.nested.push(...parse(source.slice(i + 1, end), depth + 1));
      i = end;
    }
  }
}

/** Reads the `$…` at `src[i]` into `word`, and returns the index after it. */
function dollar(src, i, word, depth) {
  word.open = false;
  const next = src[i + 1];
  if (next === '(' && src[i + 2] === '(') {
    const end = closing(src, i + 1);
    substitutions(src.slice(i + 3, end - 1), word, depth);
    word.parts.push(DYNAMIC);
    word.raw += src.slice(i, end + 1);
    return end + 1;
  }
  if (next === '(') {
    const end = closing(src, i + 1);
    return nestedRun(word, src, i, end, i + 2, end, depth);
  }
  if (next === '{') {
    const end = endOfBrace(src, i + 1);
    const inner = src.slice(i + 2, end);
    if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(inner)) word.parts.push({ variable: inner });
    else {
      substitutions(inner, word, depth);
      word.parts.push(DYNAMIC);
    }
    word.raw += src.slice(i, end + 1);
    return end + 1;
  }
  const name = /^[A-Za-z_][A-Za-z0-9_]*/.exec(src.slice(i + 1));
  if (name) {
    word.parts.push({ variable: name[0] });
    word.raw += `$${name[0]}`;
    return i + 1 + name[0].length;
  }
  if (next && /[0-9@*#?$!-]/.test(next)) {
    word.parts.push(DYNAMIC);
    word.raw += `$${next}`;
    return i + 2;
  }
  text(word, '$');
  word.raw += '$';
  return i + 1;
}

/** Reads a double-quoted string starting after its `"`, and returns the index after the closing one. */
function double(src, i, word, depth) {
  word.quoted = true;
  word.open = false;
  for (; i < src.length; i++) {
    const c = src[i];
    if (c === '"') return i + 1;
    if (c === '\\' && /[$`"\\\n]/.test(src[i + 1] ?? '')) {
      if (src[i + 1] !== '\n') text(word, src[i + 1]);
      word.raw += src.slice(i, i + 2);
      i++;
    } else if (c === '$' && /[({A-Za-z_0-9@*#?$!-]/.test(src[i + 1] ?? '')) {
      i = dollar(src, i, word, depth) - 1;
    } else if (c === '`') {
      const end = endOfBacktick(src, i + 1);
      i = nestedRun(word, src, i, end, i + 1, end, depth) - 1;
    } else {
      text(word, c);
      word.raw += c;
    }
  }
  throw new Unreadable('unclosed "');
}

/** Reads the bodies of the here-docs waiting in `docs`, from the line starting at `i`. */
function hereDocs(src, i, docs, depth) {
  while (docs.length) {
    const doc = docs.shift();
    const delimiter = doc.target.parts.map((p) => (typeof p === 'string' ? p : '')).join('');
    let body = '';
    while (i < src.length) {
      const nl = src.indexOf('\n', i);
      const line = src.slice(i, nl < 0 ? src.length : nl);
      i = nl < 0 ? src.length : nl + 1;
      if ((doc.op === '<<-' ? line.replace(/^\t+/, '') : line) === delimiter) break;
      body += `${line}\n`;
    }
    doc.body = body;
    if (!doc.target.quoted) substitutions(body, doc, depth);
  }
  return i;
}

const REDIRECTS = ['<<<', '<<-', '<<', '<>', '<&', '<', '>>', '>&', '>|', '>'];

/**
 * Splits `src` into commands, in the shell's own order. Returns a list of
 * commands, with `(` and `)` kept as markers so a `cd` inside a subshell ends
 * with it. A command substitution is read into the word holding it.
 */
function parse(src, depth = 0) {
  if (depth > 12) throw new Error('nested too deep');
  const items = [];
  const docs = [];
  let cmd = newCommand();
  let word = null;
  let redirect = null;
  let pipe = null;

  const take = () => word || (word = newWord());
  const endWord = () => {
    if (!word) return;
    if (redirect) {
      redirect.target = word;
      cmd.redirects.push(redirect);
      if (redirect.op === '<<' || redirect.op === '<<-') docs.push(redirect);
      redirect = null;
    } else {
      cmd.words.push(word);
    }
    word = null;
  };
  const endCommand = (piped) => {
    endWord();
    redirect = null;
    if (!cmd.words.length && !cmd.redirects.length) return;
    cmd.pipeFrom = pipe;
    items.push(cmd);
    pipe = piped ? cmd : null;
    cmd = newCommand();
  };

  let i = 0;
  while (i < src.length) {
    const c = src[i];
    const two = src.slice(i, i + 2);

    if (c === ' ' || c === '\t') {
      endWord();
      i++;
    } else if (c === '\n') {
      endCommand(false);
      i = hereDocs(src, i + 1, docs, depth);
    } else if (c === '#' && !word) {
      while (i < src.length && src[i] !== '\n') i++;
    } else if (c === '\\') {
      if (src[i + 1] !== '\n') quotedText(take(), src[i + 1] ?? '', src.slice(i, i + 2));
      i += 2;
    } else if (c === "'") {
      const end = src.indexOf("'", i + 1);
      if (end < 0) throw new Unreadable('unclosed quote');
      quotedText(take(), src.slice(i + 1, end), src.slice(i + 1, end));
      i = end + 1;
    } else if (c === '"') {
      i = double(src, i + 1, take(), depth);
    } else if (c === '$' && src[i + 1] === "'") {
      let j = i + 2;
      let body = '';
      for (; j < src.length && src[j] !== "'"; j++) {
        if (src[j] === '\\') body += { n: '\n', t: '\t' }[src[++j]] ?? src[j] ?? '';
        else body += src[j];
      }
      if (j >= src.length) throw new Unreadable('unclosed quote');
      quotedText(take(), body, body);
      i = j + 1;
    } else if (c === '$' && src[i + 1] === '"') {
      i++;
    } else if (c === '$') {
      i = dollar(src, i, take(), depth);
    } else if (c === '`') {
      const end = endOfBacktick(src, i + 1);
      i = nestedRun(take(), src, i, end, i + 1, end, depth);
    } else if ((c === '<' || c === '>') && src[i + 1] === '(') {
      const end = closing(src, i + 1);
      i = nestedRun(take(), src, i, end, i + 2, end, depth);
    } else if (c === '<' || c === '>') {
      // `2>` names a file descriptor, not a word.
      if (word && word.open && /^\d+$/.test(word.prefix)) word = null;
      endWord();
      const op = REDIRECTS.find((o) => src.startsWith(o, i));
      redirect = { op, target: null, body: null, nested: [] };
      i += op.length;
    } else if (c === '&') {
      if (two === '&&') {
        endCommand(false);
        i += 2;
      } else if (src.startsWith('&>>', i) || two === '&>') {
        endWord();
        const op = src.startsWith('&>>', i) ? '>>' : '>';
        redirect = { op, target: null, body: null, nested: [] };
        i += op.length + 1;
      } else {
        endCommand(false);
        i++;
      }
    } else if (c === '|') {
      if (two === '||') endCommand(false);
      else endCommand(true);
      i += two === '||' || two === '|&' ? 2 : 1;
    } else if (c === ';') {
      endCommand(false);
      i += src.startsWith(';;&', i) ? 3 : two === ';;' || two === ';&' ? 2 : 1;
    } else if (c === '(' || c === ')') {
      endCommand(false);
      items.push(c);
      i++;
    } else {
      const w = take();
      const after = src[i + 1];
      const startsValue = w.parts.length === 0 || (w.parts.length === 1 && w.open && /^[A-Za-z_]\w*=$/.test(w.prefix));
      if (c === '~' && startsValue && (after === undefined || /[/\s;&|()<>]/.test(after))) {
        w.parts.push(HOME_PART);
      } else {
        if (c === '*' || c === '?' || c === '[') w.glob = true;
        text(w, c);
      }
      if (w.open) w.prefix += c;
      w.raw += c;
      i++;
    }
  }
  endCommand(false);
  return items;
}

// ---------------------------------------------------------------------------
// What a word holds
// ---------------------------------------------------------------------------

/** The word's text when it holds nothing but text, else null. */
function literal(word) {
  if (!word) return null;
  return word.parts.every((p) => typeof p === 'string') ? word.parts.join('') : null;
}

function variable(name, ctx) {
  if (ctx.vars.has(name)) return ctx.vars.get(name);
  if (name === 'PWD') return ctx.dir;
  if (name === 'HOME') return HOME;
  return process.env[name] ?? null;
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
    else if (p.home) outs = outs.map((o) => o + HOME);
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

/** realpath that tolerates a path which does not exist yet. */
function realpathish(p) {
  let abs = path.resolve(p);
  const tail = [];
  for (;;) {
    try {
      return path.join(fs.realpathSync(abs), ...tail);
    } catch {
      const parent = path.dirname(abs);
      if (parent === abs) return path.resolve(p);
      tail.unshift(path.basename(abs));
      abs = parent;
    }
  }
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

// ---------------------------------------------------------------------------
// Git, asked about the files a command would lose
// ---------------------------------------------------------------------------

function git(dir, args) {
  const env = { ...process.env };
  for (const key of ['GIT_DIR', 'GIT_WORK_TREE', 'GIT_INDEX_FILE']) delete env[key];
  const result = spawnSync('git', ['-C', dir, ...args], { encoding: 'utf8', env });
  return result.status === 0 ? result.stdout : null;
}

/**
 * The files under `spec` that hold work no commit has, each `{ file, state }`:
 * `changed` for changed or staged, and with `untracked` also `new`, and
 * `ignored` for what git ignores. An ignored folder comes back whole, as one
 * entry that may hold `spec`. Null outside a git repository.
 */
function uncommitted(spec, untracked) {
  let anchor = fs.existsSync(spec) && fs.statSync(spec).isDirectory() ? spec : path.dirname(spec);
  while (!fs.existsSync(anchor)) {
    const up = path.dirname(anchor);
    if (up === anchor) return null;
    anchor = up;
  }
  const top = git(anchor, ['rev-parse', '--show-toplevel']);
  if (top === null) return null;
  const rel = path.relative(top.trim(), spec) || '.';
  if (rel.startsWith('..')) return null;
  const listing = untracked ? ['--untracked-files=all', '--ignored=matching'] : ['--untracked-files=no'];
  const out = git(top.trim(), ['status', '--porcelain=v1', '-z', ...listing, '--', rel]);
  if (out === null) return null;
  const files = [];
  const entries = out.split('\0');
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    if (!entry) continue;
    const xy = entry.slice(0, 2);
    if (xy[0] === 'R' || xy[0] === 'C') i++;
    if (xy === ' D' || xy === 'D ' || xy === 'DD') continue;
    const state = xy === '??' ? 'new' : xy === '!!' ? 'ignored' : 'changed';
    files.push({ file: path.join(top.trim(), entry.slice(3)), state });
  }
  return files;
}

// ---------------------------------------------------------------------------
// Family 1: losing work on this machine
// ---------------------------------------------------------------------------

const DELETERS = new Set(['rm', 'unlink', 'shred', 'srm', 'trash', 'trash-put', 'rimraf']);

// Folders a build or an install makes again. A delete in one, ignored by git or outside it, has nothing to lose.
// `tmp/` is missing on purpose: scratch work there has no other copy.
const REBUILT = new Set(['node_modules', 'dist', 'build', 'out', 'target', '.next', '.nuxt', '.svelte-kit', '.cache',
  'coverage', '__pycache__', '.pytest_cache', '.turbo', '.parcel-cache', '.venv', 'venv']);

const rebuilt = (p, ctx) => path.relative(ctx.root, p).split(path.sep).some((part) => REBUILT.has(part));
const shown = (files, ctx) => listed(files.map((f) => path.relative(ctx.root, f) || '.'));

const WHY_LOST = {
  new: ['a new file git has no copy of', 'new files git has no copy of'],
  changed: ['with edits git has no copy of', 'with edits git has no copy of'],
  ignored: ['which git ignores, so it has no copy', 'which git ignores, so they have no copy'],
  outside: ['outside git, so nothing can bring it back', 'outside git, so nothing can bring them back'],
};

/** "Deletes notes.md, a new file git has no copy of", from `{ file, state }` entries. */
function lossReason(lost, ctx) {
  const states = new Set(lost.map((l) => l.state));
  const one = lost.length === 1 ? 0 : 1;
  const why = states.size === 1 ? WHY_LOST[[...states][0]][one] : 'which git has no copy of';
  return `Deletes ${shown(lost.map((l) => l.file), ctx)}, ${why}`;
}

/** What a delete of `spec` would lose: work git has no copy of, minus ignored folders a build makes again. */
const losable = (entries, ctx) => entries.filter((e) => e.state !== 'ignored' || !rebuilt(e.file, ctx));

/**
 * Where a delete of `one` lands: `{ reason }` to ask, `{}` when nothing there
 * can be lost, or `{ real, spec }` for git to judge, `spec` keeping any glob.
 */
/** A path as the prompt shows it, with the home folder as `~`. */
const tilde = (p) => (isInside(HOME, p) ? path.join('~', path.relative(HOME, p)) : p);

function locate(one, glob, ctx) {
  if (!path.isAbsolute(one) && ctx.dir === null) return { reason: `Deletes ${one}, in a folder the guard lost track of` };
  const full = path.resolve(ctx.dir ?? '/', one);
  const base = glob ? full.slice(0, full.search(/[*?[]/)).replace(/[^/]*$/, '') || '/' : full;
  // A link is deleted, not what it points at, so only the folder above it resolves.
  const real = glob || base.endsWith('/') ? realpathish(base) : path.join(realpathish(path.dirname(base)), path.basename(base));

  if (real === ctx.root) return { reason: 'Deletes this whole project', whole: true };
  if (real === path.parse(real).root || isInside(real, HOME) || isInside(real, ctx.root)) {
    return { reason: `Deletes ${tilde(one)}, which holds your home folder or this project` };
  }
  if (!isInside(ctx.root, real)) return { reason: `Deletes ${tilde(one)}, outside this project` };
  if (!glob && !fs.existsSync(real)) return {};
  if (!glob && fs.existsSync(path.join(real, '.git'))) return { reason: `Deletes ${one}, a whole git repository`, whole: true };
  return { real, spec: glob ? path.join(real, path.relative(base, full)) : real };
}

/** Why deleting what `word` names would lose something, or null. */
function deleteTarget(word, ctx) {
  const texts = expandAll(word, ctx);
  if (texts === null) return `Deletes ${word.raw}, a path only known when it runs`;
  // A glob can also arrive through a loop's variable.
  const globbing = word.glob || word.parts.some((p) => p.variable);
  for (const one of texts.flatMap(braces)) {
    const place = locate(one, globbing && /[*?[]/.test(one), ctx);
    if (place.reason) return place.reason;
    if (!place.real) continue;
    const entries = uncommitted(place.spec, true);
    if (entries === null) {
      if (rebuilt(place.real, ctx)) continue;
      return lossReason([{ file: place.real, state: 'outside' }], ctx);
    }
    const lost = losable(entries, ctx);
    if (lost.length) return lossReason(lost, ctx);
  }
  return null;
}

// find's actions. Each one that deletes becomes `-print0` in a dry run, and every other becomes `-true`.
const FIND_ACTIONS = { '-print': 0, '-print0': 0, '-ls': 0, '-printf': 1, '-fprint': 1, '-fprint0': 1, '-fls': 1, '-fprintf': 2 };

/**
 * Why a `find` that deletes would lose something, or null. It runs the same
 * find with its deleting actions swapped for `-print0`, then asks git about
 * exactly the paths that matched.
 */
function findDeletes(starts, expression, ctx) {
  const startTexts = [];
  for (const w of starts) {
    const t = expand(w, ctx);
    if (t === null) return `Deletes files under ${w.raw}, a path only known when it runs`;
    const place = locate(t, false, ctx);
    // A find filters what it deletes, so the start folder may be the project or a repository.
    if (place.reason && !place.whole) return place.reason.replace(/^Deletes /, 'Deletes files under ');
    startTexts.push(t);
  }
  if (ctx.dir === null) return 'Deletes files in a folder the guard lost track of';

  const probe = [];
  for (let i = 0; i < expression.length; i++) {
    const t = literal(expression[i]);
    if (t === null) return `Deletes files matched by ${expression[i].raw}, only known when it runs`;
    if (t === '-delete') probe.push('-print0');
    else if (['-exec', '-execdir', '-ok', '-okdir'].includes(t)) {
      let end = i + 1;
      while (end < expression.length && ![';', '+'].includes(literal(expression[end]))) end++;
      probe.push(DELETERS.has(path.basename(literal(expression[i + 1]) ?? '')) ? '-print0' : '-true');
      i = end;
    } else if (t in FIND_ACTIONS) {
      probe.push('-true');
      i += FIND_ACTIONS[t];
    } else probe.push(t);
  }

  const result = spawnSync('find', [...startTexts, ...probe], { cwd: ctx.dir, encoding: 'utf8', timeout: 3000, maxBuffer: 64 * 1024 * 1024 });
  if (result.error || result.status !== 0) return 'Deletes files the guard could not list first';
  const matched = result.stdout.split('\0').filter(Boolean).map((p) => realpathish(path.resolve(ctx.dir, p)));
  if (!matched.length) return null;
  if (matched.some((m) => m === ctx.root || m.split(path.sep).includes('.git'))) return 'Deletes this project or a .git folder';

  const lost = [];
  for (const start of startTexts) {
    const entries = uncommitted(realpathish(path.resolve(ctx.dir, start)), true);
    if (entries === null) {
      const loose = matched.filter((m) => !rebuilt(m, ctx));
      if (loose.length) return lossReason(loose.map((file) => ({ file, state: 'outside' })), ctx);
    } else {
      // A match can sit inside an entry, when git lists a whole ignored folder.
      lost.push(...losable(entries, ctx).filter((e) => matched.some((m) => isInside(m, e.file) || isInside(e.file, m))));
    }
  }
  return lost.length ? lossReason(lost, ctx) : null;
}

const rsyncDestination = (args) => positionals(args, new Set(['-e', '--rsh', '-f', '--filter'])).pop();

function deletes({ program, args }, ctx) {
  if (DELETERS.has(program)) {
    for (const w of positionals(args)) {
      const reason = deleteTarget(w, ctx);
      if (reason) return reason;
    }
    return null;
  }

  if (program === 'find') {
    let k = 0;
    while (k < args.length && ['-H', '-L', '-P'].includes(literal(args[k]))) k++;
    const starts = [];
    for (; k < args.length; k++) {
      const t = literal(args[k]);
      if (t && (t.startsWith('-') || t === '(' || t === '!')) break;
      starts.push(args[k]);
    }
    let removes = args.slice(k).some((w) => literal(w) === '-delete');
    for (let e = k; e < args.length; e++) {
      if (!['-exec', '-execdir', '-ok', '-okdir'].includes(literal(args[e]))) continue;
      let end = e + 1;
      while (end < args.length && ![';', '+'].includes(literal(args[end]))) end++;
      const inner = args.slice(e + 1, end).map((w) => (literal(w) === '{}' ? { ...newWord(), parts: [DYNAMIC], raw: '{}' } : w));
      if (DELETERS.has(path.basename(literal(inner[0]) ?? ''))) removes = true;
      else {
        const reason = judgeCommand({ words: inner, redirects: [], pipeFrom: null }, child(ctx));
        if (reason) return reason;
      }
      e = end;
    }
    if (!removes) return null;
    return findDeletes(starts.length ? starts : [{ ...newWord(), parts: ['.'], raw: '.' }], args.slice(k), ctx);
  }

  if (program === 'rsync' && args.some((w) => /^--(delete|remove-source-files)/.test(literal(w) ?? ''))) {
    const dest = rsyncDestination(args);
    return dest ? deleteTarget(dest, ctx) : null;
  }

  if (program === 'dd') {
    const target = args.map(literal).find((t) => t && t.startsWith('of='));
    if (target && /^of=\/dev\//.test(target) && target !== 'of=/dev/null') return `Writes straight onto the device ${target.slice(3)}`;
  }
  return null;
}

const GIT_OPTS_WITH_VALUE = new Set(['-C', '-c', '--git-dir', '--work-tree', '--namespace', '--exec-path', '--config-env']);

/** Why a git command would lose work, or null. */
function gitCheck({ args }, ctx) {
  let dir = ctx.dir;
  let i = 0;
  while (i < args.length) {
    const t = literal(args[i]);
    if (t === '-C') {
      dir = args[i + 1] ? pathOf(args[i + 1], { ...ctx, dir }) : null;
      i += 2;
    } else if (GIT_OPTS_WITH_VALUE.has(t)) {
      i += 2;
    } else if (t && t.startsWith('-')) {
      i++;
    } else break;
  }
  if (i >= args.length) return null;
  const sub = literal(args[i]);
  if (sub === null) return `Runs a git command named by a variable: ${args[i].raw}`;
  const rest = args.slice(i + 1);
  const r = rest.map(literal);
  const has = (...names) => r.some((t) => names.includes(t));
  const short = (letter) => r.some((t) => t && /^-[A-Za-z]+$/.test(t) && t.includes(letter));

  // What `paths` would overwrite: changes no commit holds. Null when nothing is lost.
  const losing = (paths, action) => {
    if (dir === null) return `${action} in a folder the guard lost track of`;
    const lost = [];
    for (const w of paths) {
      const p = pathOf(w, { ...ctx, dir });
      if (p === null) return `${action} at ${w.raw}, a path only known when it runs`;
      lost.push(...(uncommitted(p, false) ?? []).map((e) => e.file));
    }
    return lost.length ? `Throws away your edits in ${shown(lost, ctx)}` : null;
  };
  const here = [{ ...newWord(), parts: ['.'], raw: '.' }];
  const exists = (w) => {
    const p = dir === null ? null : pathOf(w, { ...ctx, dir });
    return p !== null && fs.existsSync(p);
  };

  switch (sub) {
    case 'push':
      if (r.some((t) => t && (t.startsWith('--force') || t === '--mirror' || t === '--delete' || t === '--prune' || /^[+:]./.test(t)))
        || short('f') || short('d')) {
        return 'Force-pushes, overwriting or deleting what is on the remote';
      }
      return null;
    case 'reset':
      return has('--hard') ? 'Hard-resets, throwing away uncommitted work' : null;
    case 'clean':
      return has('-n', '--dry-run') || short('n') ? null : 'Deletes the files git does not track';
    case 'rebase':
      return has('--abort', '--continue', '--edit-todo', '--show-current-patch') ? null : 'Rebases, rewriting history';
    case 'filter-branch':
    case 'filter-repo':
      return 'Rewrites history';
    case 'branch':
      return has('-D') || (has('-d', '--delete') && has('-f', '--force')) ? 'Force-deletes a branch' : null;
    case 'tag':
      return has('-d', '--delete') ? 'Deletes a tag' : null;
    case 'update-ref':
      return has('-d') ? 'Deletes a git ref' : null;
    case 'worktree':
      return has('remove') && (has('--force') || short('f')) ? 'Force-removes a worktree' : null;
    case 'reflog':
      return has('delete', 'expire') ? 'Deletes reflog entries' : null;
    case 'gc':
      return r.some((t) => t && t.startsWith('--prune')) ? 'Prunes commits nothing points at' : null;
    case 'stash':
      return has('drop', 'clear') ? 'Deletes stashed work' : null;
    case 'checkout': {
      if (has('-b', '-B', '--orphan')) return null;
      if (has('-f', '--force')) return losing(here, 'Force-checks out');
      const dash = r.indexOf('--');
      const paths = dash >= 0 ? rest.slice(dash + 1) : positionals(rest).filter(exists);
      return paths.length ? losing(paths, 'Checks out files') : null;
    }
    case 'restore':
      if (has('--staged', '-S') && !has('--worktree', '-W')) return null;
      return losing(positionals(rest, new Set(['-s', '--source'])), 'Restores files');
    case 'switch':
      return has('-f', '--force', '--discard-changes') ? losing(here, 'Force-switches branches') : null;
    case 'rm':
      return (has('--force') || short('f')) && !has('--cached') ? losing(positionals(rest), 'Force-removes files from git') : null;
    case 'config': {
      if (!has('--global', '--system')) return null;
      const words = positionals(rest).map(literal);
      const writes = has('--unset', '--unset-all', '--add', '--replace-all', '--remove-section', '--rename-section', '--edit', '-e')
        || ['set', 'unset', 'edit', 'rename-section', 'remove-section'].includes(words[0])
        || (!has('--get', '--get-all', '--get-regexp', '--list', '-l') && !['get', 'list'].includes(words[0]) && words.length >= 2);
      return writes ? 'Changes your global git settings' : null;
    }
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Family 2: sending things off the machine
// ---------------------------------------------------------------------------

const LOCAL = /^(https?:\/\/)?(localhost|127(\.\d+){3}|0\.0\.0\.0|\[::1\]|[\w.-]+\.localhost|host\.docker\.internal)(:\d+)?([/?#]|$)/i;
const WRITE_METHOD = /^(POST|PUT|PATCH|DELETE)$/i;

/** The first host the command names that is off this machine, else null. With no address found, "another machine". */
function offMachine(args, ctx) {
  const texts = args.map((w) => expand(w, ctx) ?? w.raw);
  const addresses = texts.filter((t) => /^[a-z][\w+.-]*:\/\//i.test(t) || /^[\w-]+(\.[\w-]+)+(:\d+)?(\/|$)/.test(t) || LOCAL.test(t));
  if (!addresses.length) return 'another machine';
  const away = addresses.find((t) => !LOCAL.test(t));
  return away ? away.replace(/^[a-z][\w+.-]*:\/\//i, '').replace(/[/?#].*$/, '') : null;
}

const remoteSpec = (w) => /^[^/\s:]+:/.test(literal(w) ?? '') || /^rsync:\/\//.test(literal(w) ?? '');
const hostOf = (w) => literal(w).replace(/^rsync:\/\//, '').split(/[:/]/)[0];

function network({ program, args }, ctx) {
  const r = args.map(literal);

  let sends = false;
  if (program === 'curl') {
    sends = r.some((t) => t && (/^--(data|data-\w+|form|form-string|upload-file|json)(=|$)/.test(t) || /^-[a-zA-Z]*[dFT]/.test(t)))
      || WRITE_METHOD.test(flagValue(r, ['-X', '--request']) ?? '');
  }
  if (program === 'wget') {
    sends = r.some((t) => t && /^--(post-data|post-file|body-data|body-file)/.test(t)) || WRITE_METHOD.test(flagValue(r, ['--method']) ?? '');
  }
  if (['http', 'https', 'xh', 'xhs'].includes(program)) {
    const pos = positionals(args).map(literal);
    sends = WRITE_METHOD.test(pos[0] ?? '') || pos.some((t) => t && /^[\w.[\]-]+(:=|=(?!=)|@)/.test(t));
  }
  if (sends) {
    const host = offMachine(args, ctx);
    if (host) return `Sends data to ${host}`;
  }
  if (program === 'scp') {
    const dest = positionals(args, new Set(['-P', '-i', '-o', '-F', '-c', '-l', '-S', '-J'])).pop();
    if (dest && remoteSpec(dest)) return `Copies files to ${hostOf(dest)}`;
  }
  if (program === 'rsync') {
    const dest = rsyncDestination(args);
    if (dest && remoteSpec(dest)) return `Syncs files to ${hostOf(dest)}`;
  }
  if (program === 'sftp') return 'Opens a file transfer with another machine';
  if (program === 'ssh' && !r.every((t) => t === '-V' || t === '-G')) return 'Connects to another machine over ssh';
  return null;
}

// ---------------------------------------------------------------------------
// Family 3: touching shared systems
// ---------------------------------------------------------------------------

// Deploy and cloud tools. Each asks unless one of its words reads and none changes anything.
const SHARED = new Set(['kubectl', 'helm', 'terraform', 'tofu', 'terragrunt', 'pulumi', 'aws', 'gcloud', 'az', 'gh', 'glab',
  'vercel', 'netlify', 'fly', 'flyctl', 'firebase', 'wrangler', 'heroku', 'railway', 'doctl', 'eksctl']);

const READS = new Set(['get', 'list', 'ls', 'describe', 'show', 'status', 'logs', 'log', 'view', 'inspect', 'whoami',
  'version', 'info', 'history', 'diff', 'plan', 'preview', 'validate', 'fmt', 'output', 'dev', 'build', 'serve', 'tail',
  'help', 'pull', 'top', 'explain', 'search', 'events', 'lint', 'template', 'checks', 'watch', 'download', 'clone',
  'checkout', 'init', 'providers', 'graph', 'test', 'emulators:start', 'emulators:exec', 'api-resources',
  'api-versions', 'cluster-info', 'current-context', 'get-contexts']);

const CHANGES = new Set(['deploy', 'delete', 'rm', 'remove', 'destroy', 'apply', 'create', 'up', 'down', 'publish',
  'push', 'set', 'update', 'upgrade', 'install', 'uninstall', 'scale', 'restart', 'promote', 'put', 'patch', 'replace',
  'edit', 'import', 'drain', 'cordon', 'taint', 'exec', 'merge', 'close', 'reopen', 'comment', 'approve', 'rollback',
  'use-context', 'annotate', 'label', 'expose', 'run', 'cancel', 'rerun', 'sync', 'transfer', 'archive', 'fork']);

const SHARED_VALUE_FLAGS = new Set(['-n', '--namespace', '--context', '--cluster', '--kubeconfig', '-l', '--selector',
  '-o', '--output', '-c', '--container', '-f', '--filename', '--profile', '--region', '--project', '--zone', '-R',
  '--repo', '-q', '--jq', '-t', '--template', '-X', '--method', '--query', '-a', '--app', '--config', '-s', '--stack',
  '--scope', '-e', '--env', '--org', '--team', '-H', '--header', '-L', '--limit']);

const VERSION_FLAGS = new Set(['--version', '-v', '-V', '--help', '-h']);

function shared({ program, args }) {
  if (SHARED.has(program)) {
    const r = args.map(literal);
    const words = positionals(args, SHARED_VALUE_FLAGS).map(literal);
    if ((program === 'gh' || program === 'glab') && words[0] === 'api') {
      const method = flagValue(r, ['-X', '--method']);
      const writes = method !== null && !/^GET$/i.test(method);
      const fields = r.some((t) => ['-f', '-F', '--field', '--raw-field', '--input'].includes(t));
      return writes || fields ? `Changes a shared system: ${program} api` : null;
    }
    // A bare `vercel` deploys. Every other tool here prints its help.
    if (!words.length) {
      const harmless = r.length ? r.every((t) => t && VERSION_FLAGS.has(t)) : program !== 'vercel';
      return harmless ? null : `Changes a shared system: ${program}`;
    }
    const reads = words.some((t) => t && (READS.has(t) || /^(get|list|describe|show)-/.test(t)));
    const changes = words.some((t) => t && CHANGES.has(t));
    return reads && !changes ? null : `Changes a shared system: ${program} ${words.filter(Boolean).join(' ')}`;
  }

  if (program === 'docker' || program === 'podman' || program === 'docker-compose') {
    const words = positionals(args, new Set(['-f', '--file', '-p', '--project-name', '-H', '--host', '--context'])).map(literal);
    const r = args.map(literal);
    const volumes = r.includes('-v') || r.includes('--volumes');
    if (words[0] === 'push' || (words[0] === 'image' && words[1] === 'push')) return 'Pushes an image to a registry';
    if (words[0] === 'volume' && ['rm', 'remove', 'prune'].includes(words[1])) return 'Deletes a docker volume and its data';
    if (words[0] === 'system' && words[1] === 'prune' && volumes) return 'Deletes docker volumes and their data';
    if ((program === 'docker-compose' || words[0] === 'compose') && words.includes('down') && volumes) {
      return 'Deletes docker compose volumes and their data';
    }
  }
  return null;
}

/** The text a command reads from its here-docs and here-strings. */
const hereInput = (cmd) => cmd.redirects.map((r) => r.body ?? (r.op === '<<<' && r.target ? r.target.raw : null)).filter((s) => s !== null);

const DATABASES = new Set(['psql', 'mysql', 'mariadb', 'sqlite3', 'mongosh', 'mongo', 'cockroach', 'clickhouse-client', 'redis-cli']);
const WIPE = /\b(drop\s+(table|database|schema|view|index|collection|user|role)\b|truncate\b|dropDatabase\s*\(|\.drop\s*\(|flushall\b|flushdb\b)/i;

function database({ program, args }, cmd) {
  if (DATABASES.has(program)) {
    const fed = [];
    for (let c = cmd.pipeFrom; c; c = c.pipeFrom) fed.push(...c.words.map((w) => w.raw));
    const source = [...args.map((w) => w.raw), ...hereInput(cmd), ...fed].join('\n');
    if (WIPE.test(source)) return 'Drops or wipes database data';
  }
  if (program === 'dropdb' || program === 'dropuser') return `Drops a database with ${program}`;
  const words = positionals(args).map(literal);
  if (program === 'prisma' && ((words[0] === 'migrate' && words[1] === 'reset')
    || args.some((w) => ['--force-reset', '--accept-data-loss'].includes(literal(w))))) {
    return 'Resets the database with prisma';
  }
  if ((program === 'rails' || program === 'rake') && words.some((t) => t && /^db:(drop|reset|purge|schema:load|truncate_all|migrate:reset)/.test(t))) {
    return 'Resets the database with rails';
  }
  if (/^python[\d.]*$/.test(program) && path.basename(words[0] ?? '') === 'manage.py' && ['flush', 'reset_db'].includes(words[1])) {
    return 'Wipes the database with django';
  }
  return null;
}

// ---------------------------------------------------------------------------
// Family 4: changing the machine outside the project
// ---------------------------------------------------------------------------

function inVirtualEnv(programText) {
  return Boolean(process.env.VIRTUAL_ENV || process.env.CONDA_PREFIX) || /(^|\/)\.?venv\//.test(programText);
}

function machine({ program, args, programText }) {
  const r = args.map(literal);
  const words = positionals(args).map(literal);
  const global = r.some((t) => ['-g', '--global', '--location=global'].includes(t));

  if (['npm', 'pnpm', 'yarn', 'bun'].includes(program)) {
    if (global && ['install', 'i', 'add', 'in', 'isntall', 'update', 'up', 'upgrade', 'link', 'ln', 'remove', 'rm', 'uninstall', 'un'].includes(words[0])) {
      return `Installs globally with ${program}, outside this project`;
    }
    if (program === 'yarn' && words[0] === 'global') return 'Installs globally with yarn, outside this project';
  }

  const pipModule = /^python[\d.]*$/.test(program) && r[0] === '-m' && r[1] === 'pip';
  if (/^pip[\d.]*$/.test(program) || pipModule) {
    const verb = pipModule ? literal(args[2]) : words[0];
    const rest = pipModule ? args.slice(3).map(literal) : r;
    if (['install', 'uninstall'].includes(verb)) {
      if (rest.includes('--user')) return 'Installs with pip into your user folder, outside this project';
      if (!rest.some((t) => ['--target', '-t', '--prefix', '--root', '--dry-run'].includes(t)) && !inVirtualEnv(programText)) {
        return 'Installs with pip outside a virtual environment';
      }
    }
  }
  if (program === 'uv' && ((words[0] === 'pip' && r.includes('--system')) || (words[0] === 'tool' && ['install', 'upgrade'].includes(words[1])))) {
    return 'Installs with uv, outside this project';
  }
  if (program === 'pipx' && !['list', undefined].includes(words[0]) && !r.every((t) => VERSION_FLAGS.has(t))) {
    return 'Installs or runs a package with pipx, outside this project';
  }
  if ((program === 'cargo' || program === 'go' || program === 'gem') && words[0] === 'install') return `Installs globally with ${program}, outside this project`;
  if (program === 'gem' && words[0] === 'uninstall') return 'Uninstalls a gem, outside this project';
  if (program === 'brew' && words.length && !['list', 'ls', 'info', 'search', 'config', 'doctor', 'outdated', 'deps', 'leaves', 'home', 'desc', 'uses', 'help'].includes(words[0])) {
    return `Changes this machine: brew ${words[0]}`;
  }

  if (program === 'crontab' && !r.includes('-l')) return 'Changes your scheduled jobs';
  if (program === 'systemctl' && words.length && !['status', 'show', 'list-units', 'list-unit-files', 'list-timers', 'list-sockets', 'is-active', 'is-enabled', 'is-failed', 'cat', 'help'].includes(words[0])) {
    return `Changes a background service: systemctl ${words[0]}`;
  }
  if (program === 'launchctl' && words.length && !['list', 'print', 'print-disabled', 'help', 'version', 'blame'].includes(words[0])) {
    return `Changes a background service: launchctl ${words[0]}`;
  }
  if (program === 'pkill' || program === 'killall') return `Stops programs by name with ${program}`;
  return null;
}

// Where a write could lock you out, change every shell, or switch Flow and this guard off.
// Each place carries what a write there is, for "Writes into <path>, <what>".
function protectedPlaces(root) {
  const setup = "Claude Code's or Flow's setup, which could switch the guard off";
  const startup = 'a shell startup file';
  return [
    [path.join(HOME, '.ssh'), 'where your login keys live'],
    [path.join(HOME, '.claude'), setup],
    [path.join(HOME, '.flow'), setup],
    [path.join(HOME, '.agents'), setup],
    [path.join(root, '.claude', 'settings.json'), setup],
    [path.join(root, '.claude', 'settings.local.json'), setup],
    [path.join(HOME, '.gitconfig'), 'your global git settings'],
    [path.join(HOME, '.config', 'git'), 'your global git settings'],
    ...['.bashrc', '.bash_profile', '.bash_login', '.bash_logout', '.profile', '.zshrc', '.zprofile', '.zshenv', '.zlogin', '.config/fish']
      .map((f) => [path.join(HOME, f), startup]),
  ];
}

/** The words a command writes to, beyond its redirects. */
function writeTargets({ program, args }) {
  const r = args.map(literal);
  const pos = (valueFlags) => positionals(args, new Set(valueFlags));
  switch (program) {
    case 'tee':
      return pos([]);
    case 'cp':
    case 'mv':
    case 'install':
    case 'ln': {
      const t = r.indexOf('-t');
      if (t >= 0 && args[t + 1]) return [args[t + 1]];
      const words = pos(['-S', '--suffix', '-m', '--mode', '-o', '--owner', '-g', '--group']);
      return program === 'mv' ? words : words.slice(-1);
    }
    case 'sed':
    case 'gsed': {
      if (!r.some((t) => t && (/^-[^-]*i/.test(t) || t.startsWith('--in-place')))) return [];
      const scripted = r.some((t) => ['-e', '-f', '--expression', '--file'].includes(t));
      const words = pos(['-e', '-f', '--expression', '--file', '-l']);
      return scripted ? words : words.slice(1);
    }
    case 'perl':
      return r.some((t) => t && /^-[a-zA-Z]*i/.test(t)) ? pos(['-e', '-E', '-M', '-I', '-m']) : [];
    case 'truncate':
      return pos(['-s', '--size', '-r', '--reference']);
    case 'chmod':
    case 'chown':
    case 'chgrp':
      return pos(['--reference']).slice(1);
    case 'dd': {
      const target = args.find((w) => (literal(w) ?? '').startsWith('of='));
      return target ? [{ ...target, parts: [literal(target).slice(3)] }] : [];
    }
    default:
      return [];
  }
}

/** Why writing to `word` touches a place listed in `protectedPlaces`, or null. */
function protectedWrite(word, ctx) {
  const p = pathOf(word, ctx);
  if (p === null) return null;
  for (const candidate of new Set([p, realpathish(p)])) {
    for (const [place, reason] of protectedPlaces(ctx.root)) {
      // A project that itself lives in one of these folders may still write to its own files.
      if (isInside(place, ctx.root) && isInside(ctx.root, candidate) && !candidate.startsWith(path.join(ctx.root, '.claude'))) continue;
      if (isInside(place, candidate)) return `Writes into ${word.raw}, ${reason}`;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Family 5: running outside code
// ---------------------------------------------------------------------------

const SHELLS = new Set(['bash', 'sh', 'zsh', 'dash', 'ksh', 'mksh', 'fish']);
const INTERPRETERS = new Set([...SHELLS, 'python', 'python3', 'node', 'perl', 'ruby', 'php', 'deno', 'bun']);
const DOWNLOADERS = new Set(['curl', 'wget', 'fetch', 'http', 'https', 'xh', 'aria2c']);

function isDownload(cmd) {
  if (cmd === '(' || cmd === ')') return false;
  const first = cmd.words.find((w) => !/^[A-Za-z_]\w*=/.test(w.prefix));
  return DOWNLOADERS.has(path.basename(literal(first) ?? ''));
}
const downloads = (word) => word.nested.some(isDownload);

/** Whether a shell or an interpreter reads its program from its input rather than a file. */
function readsInput(args) {
  const r = args.map(literal);
  return !positionals(args).length || r.includes('-') || r.includes('-s');
}

function outsideCode({ program, args }, cmd) {
  if (!INTERPRETERS.has(program) && !['eval', 'source', '.'].includes(program)) return null;
  if (args.some(downloads)) return 'Runs a downloaded script';
  if (INTERPRETERS.has(program) && readsInput(args)) {
    for (let c = cmd.pipeFrom; c; c = c.pipeFrom) if (isDownload(c)) return 'Runs a downloaded script';
  }
  return null;
}

/** Whether the project has `name` among its packages, installed or listed. */
function projectHas(name, ctx) {
  for (let dir = ctx.dir ?? ctx.root; ; dir = path.dirname(dir)) {
    if (fs.existsSync(path.join(dir, 'node_modules', name, 'package.json'))) return true;
    if (fs.existsSync(path.join(dir, 'node_modules', '.bin', name))) return true;
    try {
      const pkg = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'));
      if ({ ...pkg.dependencies, ...pkg.devDependencies, ...pkg.optionalDependencies }[name]) return true;
    } catch {
      // no package.json here
    }
    if (path.dirname(dir) === dir) return false;
  }
}

/** `npx pkg …` and its kin: asks for a package the project lacks, and reads the rest as a command. */
function packageRunner(args, ctx, label) {
  const r = args.map(literal);
  let name = null;
  const p = r.findIndex((t) => t === '-p' || t === '--package');
  if (p >= 0) name = r[p + 1];
  const pos = positionals(args, new Set(['-p', '--package', '-c', '--call']));
  if (!name) name = literal(pos[0]);
  if (!name) return { reason: null };
  const bare = /^(@[^/]+\/[^@]+|[^@]+)/.exec(name)?.[1] ?? name;
  if (!projectHas(bare, ctx)) return { reason: `Downloads and runs ${bare} through ${label}, a package this project does not have` };
  return { reason: null, inner: p >= 0 ? pos : args.slice(args.indexOf(pos[0])) };
}

// ---------------------------------------------------------------------------
// Peeling a command down to the program it runs
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Judging
// ---------------------------------------------------------------------------

const child = (ctx) => ({ ...ctx, vars: new Map(ctx.vars) });

function judgeItems(items, ctx) {
  const saved = [];
  for (const item of items) {
    if (item === '(') saved.push(ctx.dir);
    else if (item === ')') {
      if (saved.length) ctx.dir = saved.pop();
    } else {
      const reason = judgeCommand(item, ctx);
      if (reason) return reason;
    }
  }
  return null;
}

const WRITE_REDIRECTS = new Set(['>', '>>', '>|', '<>', '>&']);

function judgeCommand(cmd, ctx) {
  for (const w of cmd.words) {
    const reason = judgeItems(w.nested, child(ctx));
    if (reason) return reason;
  }
  for (const r of cmd.redirects) {
    const reason = judgeItems(r.nested, child(ctx)) || (r.target && judgeItems(r.target.nested, child(ctx)));
    if (reason) return reason;
    if (r.target && WRITE_REDIRECTS.has(r.op) && !/^(\d+-?|-)$/.test(literal(r.target) ?? '')) {
      const write = protectedWrite(r.target, ctx);
      if (write) return write;
    }
  }

  const run = unwrap(cmd.words, ctx);
  if (!run) return null;
  if (run.inline) return judgeItems(run.inline, child(ctx));
  if (run.program === null) {
    return downloads(run.word) ? 'Runs a downloaded script' : `Runs a program named by a variable: ${run.word.raw}`;
  }
  return judgeRun(run, cmd, ctx);
}

function judgeRun(run, cmd, ctx) {
  const { program, args } = run;

  if (program === 'cd' || program === 'pushd') {
    const target = positionals(args)[0];
    if (!target) ctx.dir = HOME;
    else if (literal(target) === '-') ctx.dir = null;
    else {
      const p = pathOf(target, ctx);
      ctx.dir = p === null ? null : realpathish(p);
    }
    return null;
  }
  if (program === 'popd') {
    ctx.dir = null;
    return null;
  }
  if (['export', 'declare', 'local', 'readonly', 'typeset'].includes(program)) {
    assign(args, ctx);
    return null;
  }
  if (program === 'read') {
    for (const w of positionals(args, new Set(['-p', '-d', '-n', '-N', '-t', '-u', '-a']))) {
      const name = literal(w);
      if (name) ctx.vars.set(name, null);
    }
    return null;
  }

  // A shell reading its program from a here-doc, a here-string or an echo piped in.
  if (SHELLS.has(program) && readsInput(args)) {
    const from = cmd.pipeFrom;
    const fed = !from ? []
      : ['echo', 'printf'].includes(literal(from.words[0])) ? [from.words.slice(1).map((w) => w.raw).join(' ')]
        : hereInput(from);
    for (const source of [...hereInput(cmd), ...fed]) {
      const reason = judgeItems(parse(source, 1), child(ctx));
      if (reason) return reason;
    }
  }

  const direct = outsideCode(run, cmd) || deletes(run, ctx) || (program === 'git' && gitCheck(run, ctx))
    || network(run, ctx) || shared(run) || database(run, cmd) || machine(run);
  if (direct) return direct;

  for (const w of writeTargets(run)) {
    const reason = protectedWrite(w, ctx);
    if (reason) return reason;
  }

  const runner = { npx: 'npx', bunx: 'bunx' }[program]
    ?? (['npm', 'pnpm', 'yarn', 'bun'].includes(program) && ['exec', 'dlx', 'x'].includes(literal(positionals(args)[0])) ? `${program} ${literal(positionals(args)[0])}` : null);
  if (runner) {
    const own = runner.includes(' ') ? positionals(args).slice(1) : args;
    // `pnpm exec` runs only what the project installed.
    if (runner === 'pnpm exec') return null;
    const { reason, inner } = packageRunner(own, ctx, runner);
    if (reason) return reason;
    if (inner && inner.length) {
      const name = path.basename(literal(inner[0]) ?? '');
      return judgeRun({ program: name, programText: name, args: inner.slice(1) }, cmd, ctx);
    }
  }
  return null;
}

// ---------------------------------------------------------------------------

// A mention of one of these in a command the guard failed on still asks.
const RISKY = /\b(rm|unlink|shred|find|xargs|git|curl|wget|dd|kubectl|terraform|ssh|scp|rsync|docker|npx)\b/;

function ask(reason) {
  process.stdout.write(`${JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'ask',
      permissionDecisionReason: reason,
    },
  })}\n`);
}

function main() {
  let data;
  try {
    data = JSON.parse(fs.readFileSync(0, 'utf8'));
  } catch {
    return;
  }
  const command = data && data.tool_input && data.tool_input.command;
  if (typeof command !== 'string' || !command.trim()) return;
  const dir = realpathish(data.cwd || process.cwd());
  const root = realpathish(process.env.CLAUDE_PROJECT_DIR || dir);

  let reason = null;
  try {
    reason = judgeItems(parse(command), { root, dir, vars: new Map() });
  } catch (err) {
    if (err instanceof Unreadable) return;
    if (RISKY.test(command)) reason = `The guard could not read this command (${err.message})`;
  }
  if (reason) ask(reason);
}

if (require.main === module) main();

module.exports = { parse };
