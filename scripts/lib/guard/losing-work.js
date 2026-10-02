'use strict';
/**
 * Harm 1, losing work on this machine: a delete outside the project, a delete
 * of files git cannot give back, a delete aimed at a variable, and the git
 * commands that throw work away.
 */

const path = require('path');
const { newWord, DYNAMIC } = require('./parse');
const { literal, expandAll, expand, braces, isInside, pathOf, positionals, listed, rsyncDestination } = require('./words');

const DELETERS = new Set(['rm', 'unlink', 'shred', 'srm', 'trash', 'trash-put', 'rimraf']);

// Folders a build or an install makes again. A delete in one, ignored by git or outside it, has nothing to lose.
const REBUILT = new Set(['node_modules', 'dist', 'build', 'out', 'target', '.next', '.nuxt', '.svelte-kit', '.cache',
  'coverage', '__pycache__', '.pytest_cache', '.turbo', '.parcel-cache', '.venv', 'venv']);

// The project's own `tmp/` is scratch: the agent makes it, and clears it without asking.
const scratch = (p, ctx) => isInside(path.join(ctx.root, 'tmp'), p);
const rebuilt = (p, ctx) => scratch(p, ctx) || path.relative(ctx.root, p).split(path.sep).some((part) => REBUILT.has(part));
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

/** A path as the prompt shows it, with the home folder as `~`. */
const tilde = (p, ctx) => (isInside(ctx.world.home, p) ? path.join('~', path.relative(ctx.world.home, p)) : p);

/**
 * Where a delete of `one` lands: `{ reason }` to ask, `{}` when nothing there
 * can be lost, or `{ real, spec }` for git to judge, `spec` keeping any glob.
 */
function locate(one, glob, ctx) {
  const { world } = ctx;
  if (!path.isAbsolute(one) && ctx.dir === null) return { reason: `Deletes ${one}, in a folder the guard lost track of` };
  const full = path.resolve(ctx.dir ?? '/', one);
  const base = glob ? full.slice(0, full.search(/[*?[]/)).replace(/[^/]*$/, '') || '/' : full;
  // A link is deleted, not what it points at, so only the folder above it
  // resolves. Typed with a trailing `/`, the delete empties what it points at.
  const follows = glob || base.endsWith('/') || /\/\.?$/.test(one);
  const real = follows ? world.real(base) : path.join(world.real(path.dirname(base)), path.basename(base));

  if (real === ctx.root) return { reason: 'Deletes this whole project', whole: true };
  if (real === path.parse(real).root || isInside(real, world.home) || isInside(real, ctx.root)) {
    return { reason: `Deletes ${tilde(one, ctx)}, which holds your home folder or this project` };
  }
  if (!isInside(ctx.root, real)) return { reason: `Deletes ${tilde(one, ctx)}, outside this project` };
  if (!glob && !world.exists(real)) return {};
  if (scratch(real, ctx)) return {};
  if (!glob && world.exists(path.join(real, '.git'))) return { reason: `Deletes ${one}, a whole git repository`, whole: true };
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
    const entries = ctx.world.uncommitted(place.spec, true);
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

  const { world } = ctx;
  const result = world.find([...startTexts, ...probe], ctx.dir);
  if (!result.ok) return 'Deletes files the guard could not list first';
  const matched = result.stdout.split('\0').filter(Boolean).map((p) => world.real(path.resolve(ctx.dir, p)));
  if (!matched.length) return null;
  if (matched.some((m) => m === ctx.root || m.split(path.sep).includes('.git'))) return 'Deletes this project or a .git folder';

  const lost = [];
  for (const start of startTexts) {
    const entries = world.uncommitted(world.real(path.resolve(ctx.dir, start)), true);
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
        const reason = ctx.judge({ words: inner, redirects: [], pipeFrom: null }, ctx);
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
      lost.push(...(ctx.world.uncommitted(p, false) ?? []).map((e) => e.file));
    }
    return lost.length ? `Throws away your edits in ${shown(lost, ctx)}` : null;
  };
  const here = [{ ...newWord(), parts: ['.'], raw: '.' }];
  const exists = (w) => {
    const p = dir === null ? null : pathOf(w, { ...ctx, dir });
    return p !== null && ctx.world.exists(p);
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

module.exports = { deletes, gitCheck };
