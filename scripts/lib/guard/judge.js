'use strict';
/**
 * The guard's judgment: a shell command in, the reason to ask about it out,
 * or null to stay silent.
 *
 * `parse.js` reads a command the way bash splits it. Loops, `$(…)`, backticks,
 * `<(…)`, here-docs, `bash -c '…'`, `eval`, `xargs` and `find -exec` all reach
 * the checks as separate commands, and `cd` moves the folder later paths
 * resolve against. So a new shape of command needs nothing here, and a new
 * tool joins a kind of harm with one entry in a table in that kind's file.
 *
 * Where it cannot tell, it asks only when the unknown part decides a loss: a
 * delete or a git discard aimed at a variable, or a program named by one.
 * Anything else it cannot read stays silent, and so does a command bash itself
 * would refuse, such as one with an unclosed quote.
 *
 * Nothing in `lib/guard/` but `world.js` touches the disk, git or the
 * environment. Every judging function reads them through `ctx.world`.
 */

const path = require('path');
const { parse, Unreadable } = require('./parse');
const { literal, pathOf, positionals } = require('./words');
const { unwrap, assign } = require('./unwrap');
const { deletes, gitCheck } = require('./losing-work');
const { network } = require('./off-machine');
const { shared, database, hereInput } = require('./shared-systems');
const { machine, writeTargets, protectedWrite } = require('./machine-changes');
const { SHELLS, downloads, readsInput, outsideCode, packageRunner } = require('./outside-code');
const { secrets, secretWord } = require('./secrets');

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
    if (r.target && r.op === '<') {
      const read = secretWord(r.target, ctx);
      if (read) return read;
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
    if (!target) ctx.dir = ctx.world.home;
    else if (literal(target) === '-') ctx.dir = null;
    else {
      const p = pathOf(target, ctx);
      ctx.dir = p === null ? null : ctx.world.real(p);
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
    || network(run, ctx) || shared(run) || database(run, cmd) || machine(run, ctx) || secrets(run, ctx);
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

// A mention of one of these in a command the guard failed on still asks.
const RISKY = /\b(rm|unlink|shred|find|xargs|git|curl|wget|dd|kubectl|terraform|ssh|scp|rsync|docker|npx)\b/;

/**
 * Why `command`, run from `cwd`, needs the user's yes, or null. The project is
 * the folder Claude Code names in `CLAUDE_PROJECT_DIR`, else `cwd`.
 */
function judge(command, cwd, world) {
  const dir = world.real(cwd);
  const root = world.real(world.env('CLAUDE_PROJECT_DIR') || dir);
  // A find's `-exec` judges the command it runs, from inside losing-work.js.
  const ctx = { root, dir, vars: new Map(), world, judge: (cmd, from) => judgeCommand(cmd, child(from)) };
  try {
    return judgeItems(parse(command), ctx);
  } catch (err) {
    if (err instanceof Unreadable) return null;
    return RISKY.test(command) ? `The guard could not read this command (${err.message})` : null;
  }
}

module.exports = { judge };
