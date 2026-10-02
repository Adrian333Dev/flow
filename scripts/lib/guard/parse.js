'use strict';
/**
 * Reads a shell command the way bash splits it: words, redirects, pipes,
 * here-docs, and the commands inside `$(…)`, backticks and `<(…)`. Text in,
 * a list of commands out.
 */

/** A command bash itself would refuse to run, such as one with an unclosed quote. */
class Unreadable extends Error {}

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

module.exports = { parse, Unreadable, newWord, DYNAMIC };
