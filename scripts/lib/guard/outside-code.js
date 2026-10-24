'use strict';
/**
 * Harm 4, running outside code: a download run straight away. A package
 * runner (`npx`, `pnpm dlx`) never asks for itself: it hands the command it
 * runs on to the other checks. Its asks were all allowed, and half misread a
 * flag as the package (2026-10-24).
 */

const path = require('path');
const { literal, positionals } = require('./words');

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
  if (args.some(downloads)) return 'Run a downloaded script';
  if (INTERPRETERS.has(program) && readsInput(args)) {
    for (let c = cmd.pipeFrom; c; c = c.pipeFrom) if (isDownload(c)) return 'Run a downloaded script';
  }
  return null;
}

/** `npx pkg …` and its kin: the command it runs, past the runner's own flags. Empty when it names none. */
function packageRunner(args) {
  const p = args.map(literal).findIndex((t) => t === '-p' || t === '--package');
  const pos = positionals(args, new Set(['-p', '--package', '-c', '--call']));
  if (!pos.length) return [];
  return p >= 0 ? pos : args.slice(args.indexOf(pos[0]));
}

module.exports = { SHELLS, downloads, readsInput, outsideCode, packageRunner };
