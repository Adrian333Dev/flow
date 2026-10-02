'use strict';
/**
 * Harm 5, running outside code: a download run straight away, and an npx of
 * a package the project lacks.
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
  if (args.some(downloads)) return 'Runs a downloaded script';
  if (INTERPRETERS.has(program) && readsInput(args)) {
    for (let c = cmd.pipeFrom; c; c = c.pipeFrom) if (isDownload(c)) return 'Runs a downloaded script';
  }
  return null;
}

/** Whether the project has `name` among its packages, installed or listed. */
function projectHas(name, ctx) {
  const { world } = ctx;
  for (let dir = ctx.dir ?? ctx.root; ; dir = path.dirname(dir)) {
    if (world.exists(path.join(dir, 'node_modules', name, 'package.json'))) return true;
    if (world.exists(path.join(dir, 'node_modules', '.bin', name))) return true;
    try {
      const pkg = JSON.parse(world.readFile(path.join(dir, 'package.json')));
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

module.exports = { SHELLS, downloads, readsInput, outsideCode, packageRunner };
