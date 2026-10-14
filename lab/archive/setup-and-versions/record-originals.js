#!/usr/bin/env node
'use strict';
/**
 * record-originals.js <path>... [--root <dir>]: copy each path into the
 * original of the place a setup is changing, before anything changes it.
 * `lib/machine/originals.js` says what an original holds and when it closes.
 *
 * A setup session runs it once at go, on every path its form's file list
 * names, then makes each ticked change with its own tools. Recording is the
 * one job the session never does by hand: a path it missed is a file
 * `flow restore` cannot bring back. A path already recorded keeps its first
 * copy, so a setup that stopped part way runs this again safely.
 *
 * The place comes from `~/.flow/run.json`, so it refuses outside a setup, and
 * it is off PATH: typed weeks later, it would record the machine as it was
 * then. Where the place has no original yet, it opens one. `flow install
 * --finish` and `flow init --finish` close it.
 *
 * It refuses, recording nothing, when a prerequisite of Flow's is not met,
 * when a relative path comes with no project, and when a path holds the
 * originals or the migrations. A path inside `~/.flow/` is left out, since
 * nothing there is ever recorded. The prerequisites are checked here because
 * this is the last command before the session's first change.
 */

const path = require('path');
const { out, parseArgs } = require('./lib/cli');
const { FlowError } = require('./lib/error');
const migrations = require('./lib/machine/migrations');
const originals = require('./lib/machine/originals');
const prereq = require('./lib/machine/prereq');
const setup = require('./lib/setup');
const paths = require('./lib/paths');

const show = paths.shorten;
const USAGE = 'record-originals.js <path>... [--root <dir>]';

/** `~/` is the home folder or `--root`. A relative path sits inside the project. */
function resolve(raw, at, project) {
  if (raw === '~' || raw.startsWith('~/')) return path.resolve(at.base, '.' + raw.slice(1));
  if (path.isAbsolute(raw)) return path.resolve(raw);
  if (!project) throw new FlowError(`"${raw}" is relative, and a machine setup names no project.`);
  return path.resolve(project, raw);
}

function main(argv) {
  const { positional, flags } = parseArgs(argv, { flags: { root: { arg: '<dir>' } }, usage: USAGE });
  if (!positional.length) throw new FlowError(`usage: ${USAGE}`);
  paths.useRoot(flags.root);
  const at = paths.folders(flags.root);

  const run = setup.readRun(at);
  if (!run || !['setup-machine', 'setup-project'].includes(run.type)) {
    throw new FlowError(`no setup is running: ${show(setup.runFile(at))} names none, so nothing was recorded.`);
  }
  const project = run.type === 'setup-project' ? run.project : null;
  const targets = positional.map((raw) => resolve(raw, at, project));
  for (const p of targets) migrations.guard(p, at);
  prereq.demand('nothing was recorded');

  if (!originals.read(at, project)) originals.start(at, project);
  const where = show(originals.dir(at, project));
  if (originals.read(at, project).closed) {
    out(`${where} is closed, so nothing was recorded: it keeps the state from before Flow.`);
    return 0;
  }

  const inFlow = (p) => p === at.flow || p.startsWith(at.flow + path.sep);
  let recorded = 0;
  let skipped = 0;
  for (const p of targets) {
    if (inFlow(p)) skipped += 1;
    else if (originals.record(at, project, p)) recorded += 1;
  }
  const already = targets.length - recorded - skipped;
  const left = [skipped && `${skipped} inside ${show(at.flow)}`, already && `${already} recorded already`].filter(Boolean);
  out(`recorded ${recorded} of ${targets.length} paths into ${where}.${left.length ? ` Left out: ${left.join(', ')}.` : ''}`);
  return 0;
}

try {
  process.exitCode = main(process.argv.slice(2));
} catch (e) {
  if (e instanceof FlowError) {
    process.stderr.write(`record-originals: ${e.message}\n`);
    process.exitCode = 1;
  } else {
    throw e;
  }
}
