'use strict';
/**
 * The form `flow restore` and `flow uninstall` hand over before they change
 * anything: one box per path Flow touched, in `~/.flow/restore.md`. A ticked
 * path goes back to how it was before Flow, or is deleted where it did not
 * exist. An unticked one stays as it is now.
 *
 * No agent reads it. Both commands exist for the day a change broke Claude
 * Code, so the script reads the ticks itself, and one line shape alone counts
 * as a box:
 *
 *   - [x] `.claude/settings.json`: put back. Changed since setup, so ...
 *
 * The path between the backticks has to be one the form was written with,
 * letter for letter, and the text after it is for the user alone. Any box that
 * is off fails the whole form: a path missing, doubled or unknown, or a mark
 * other than `x` or a space. A typo never turns into a delete.
 *
 * A project's knowledge starts unticked: its `CLAUDE.md` and `docs/` work
 * without Flow, since Claude Code reads `CLAUDE.md` on its own. Ruled by the
 * user 2026-10-01. An `AGENTS.md` is the user's own file as it was, since Flow
 * writes none, so it goes back ticked like any other path.
 */

const fs = require('fs');
const path = require('path');
const confirm = require('./confirm');
const { FlowError } = require('../error');
const { git } = require('../git');
const machine = require('./machine');
const originals = require('./originals');
const records = require('../tickets/records');
const store = require('../tickets/store');
const ticketSkills = require('../tickets/ticket-skills');
const paths = require('../paths');

const show = paths.shorten;

/** Where the form is written. `~/.flow/.gitignore` keeps it off GitHub. */
const fileOf = (at) => path.join(at.flow, 'restore.md');

/** A project path that is the project's own knowledge, kept by default. */
const isKnowledge = (rel) => rel === 'CLAUDE.md' || rel === 'docs' || rel.startsWith(`docs${path.sep}`);

/** The folder a place's ticket skills sit in: `lib/tickets/ticket-skills.js`. */
const skillsDir = (at, project) => (project ? ticketSkills.folderOf(project) : path.join(at.claude, 'skills'));

/**
 * One row per path a restore of one place can change: every path in its
 * original, then each ticket skill, which no original holds since `flow`
 * writes them after the window shuts. Null where the place has no original.
 */
function rows(at, project = null) {
  const planned = originals.plan(at, project);
  if (!planned) return null;
  const skills = ticketSkills.findAll([skillsDir(at, project)])
    .map((p) => ({ path: p, removed: true, folder: true, skill: true }));
  return [...planned, ...skills].map((row) => {
    const rel = project ? path.relative(project, row.path) : null;
    return { ...row, project, knowledge: Boolean(project && isKnowledge(rel)), ticked: !(project && isKnowledge(rel)) };
  });
}

/** What the box says will happen, after the path. */
function note(row) {
  if (row.skill) return 'deleted. Flow wrote it to list one of your tickets.';
  if (row.project && row.path === store.recordsDir(row.project)) {
    if (records.linked(row.project)) {
      return `deleted: the link alone. The tickets stay in ${show(path.resolve(row.project, fs.readlinkSync(row.path)))}.`;
    }
    return records.onBranch(row.project)
      ? "deleted, with every ticket in it. Tickets sent to GitHub stay on the project's flow branch."
      : 'deleted, with every ticket in it. This .flow/ was never sent anywhere, so its tickets exist nowhere else.';
  }
  if (row.removed) return 'deleted. It was not there before Flow.';
  return row.changed ? 'put back. Changed since setup, so those changes are lost.' : 'put back.';
}

/**
 * The form's text. `parts` are `{ heading, text?, rows, name }`, where
 * `name` turns a row into the path its box shows. `always` lists what runs
 * whatever the boxes say, as plain lines with no box.
 */
function render(parts, always = []) {
  const lines = [
    '# Putting Flow\'s changes back',
    '',
    'One box per path Flow changed. Ticked: it goes back to how it was before Flow, or is deleted where it did not exist. Unticked: it stays as it is now.',
    '',
    'Only the boxes are read. Change an x to a space or a space to an x, and nothing else on the line.',
  ];
  for (const s of parts) {
    lines.push('', `## ${s.heading}`, '');
    if (s.text) lines.push(s.text, '');
    if (!s.rows.length) lines.push('Nothing to put back.');
    for (const row of s.rows) lines.push(`- [${row.ticked ? 'x' : ' '}] \`${s.name(row)}\`: ${note(row)}`);
  }
  if (always.length) lines.push('', '## Done whatever the boxes say', '', ...always.map((l) => `- ${l}`));
  return lines.join('\n') + '\n';
}

/**
 * The paths ticked in the form, checked against the rows it was written with.
 * Throws on the first line that is off, naming it.
 */
function parse(text, parts) {
  const byName = new Map();
  for (const s of parts) for (const row of s.rows) byName.set(s.name(row), row);
  const seen = new Set();
  const ticked = new Set();
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].startsWith('- [')) continue;
    const at = `restore.md line ${i + 1}`;
    const m = lines[i].match(/^- \[(.)\] `([^`]+)`/);
    if (!m) throw new FlowError(`${at} is not a box: it needs - [x] or - [ ], then the path in backticks.`);
    const [, mark, name] = m;
    if (mark !== 'x' && mark !== 'X' && mark !== ' ') throw new FlowError(`${at} has [${mark}]. A box is [x] or [ ].`);
    const row = byName.get(name);
    if (!row) throw new FlowError(`${at}: \`${name}\` is not a path this form was written with.`);
    if (seen.has(name)) throw new FlowError(`${at}: \`${name}\` has a box already.`);
    seen.add(name);
    if (mark !== ' ') ticked.add(row.path);
  }
  const missing = [...byName.keys()].filter((name) => !seen.has(name));
  if (missing.length) throw new FlowError(`restore.md has no box for ${missing.map((n) => `\`${n}\``).join(', ')}.`);
  return ticked;
}

/**
 * Write the form, ask for the word, and read the ticks back. A form that is off
 * is named and asked about again, so a fix needs no second run. Returns the
 * ticked paths, or null where any other word was typed. The form is deleted
 * either way.
 */
function ask(at, word, parts, always, lines) {
  const file = fileOf(at);
  fs.writeFileSync(file, render(parts, always));
  try {
    let prompt = [`Wrote ${show(file)}: ${lines[0]}`, ...lines.slice(1), 'Untick what should stay as it is now, and save the file.'];
    for (;;) {
      if (!confirm.word(word, prompt)) return null;
      try {
        return parse(fs.readFileSync(file, 'utf8'), parts);
      } catch (e) {
        if (!(e instanceof FlowError)) throw e;
        prompt = [`${e.message} Nothing was changed. Fix the line and save.`];
      }
    }
  } finally {
    originals.remove(file);
  }
}

/** A path in a form: a project's from inside it, anything else from ~. */
const named = (project) => (row) => (project ? path.relative(project, row.path) : show(row.path)) + (row.folder ? '/' : '');

/**
 * One place's sections: a project's own files, then its knowledge, which
 * works without Flow. `inside` shows a project's paths from inside it.
 */
function sections(at, project, inside = false) {
  const all = rows(at, project);
  const name = named(inside ? project : null);
  if (!project) return [{ heading: 'This machine', rows: all, name }];
  return [
    { heading: `Flow's files in ${show(project)}`, rows: all.filter((r) => !r.knowledge), name },
    {
      heading: `What ${show(project)} knows`,
      text: 'These work without Flow: Claude Code reads CLAUDE.md on its own.',
      rows: all.filter((r) => r.knowledge),
      name,
    },
  ];
}

/**
 * What a project's ticked `.flow/` holds that GitHub does not: files changed
 * and not committed, or commits not pushed. Null where nothing, or where the
 * folder never sends anywhere.
 */
function unsent(project, ticked) {
  const dir = store.recordsDir(project);
  if (!ticked.has(dir) || !records.onBranch(project) || !records.hasRemote(dir)) return null;
  const status = git(dir, ['status', '--porcelain']);
  if (status.ok && status.out) return 'ticket changes not yet sent to GitHub';
  const ahead = records.remoteHasBranch(dir)
    ? Number(git(dir, ['rev-list', '--count', `${records.REMOTE}/${records.BRANCH}..HEAD`]).out || 0)
    : 1;
  return ahead ? 'ticket changes not yet sent to GitHub' : null;
}

/** Refuse before anything changes where a ticked `.flow/` holds unsent tickets. */
function refuseUnsent(projects, ticked) {
  for (const project of projects) {
    const found = unsent(project, ticked);
    if (found) throw new FlowError(`${show(store.recordsDir(project))} holds ${found}. Nothing was changed. Run flow sync inside ${show(project)}, then try again.`);
  }
}

/**
 * Put back what was ticked in one place: its ticket skills first, then the
 * original's paths. A project's `.claude/skills/` and `.claude/` go where that
 * left them empty: `flow init` makes both before the project's original is
 * written, so no original holds them, and an empty folder holds nothing to
 * lose. Returns a line per path changed.
 */
function apply(at, project, ticked) {
  const done = [];
  for (const p of ticketSkills.findAll([skillsDir(at, project)])) {
    if (ticked.has(p) && ticketSkills.remove(p)) done.push(`removed ${show(p)}`);
  }
  if (project) {
    for (const empty of [skillsDir(at, project), path.join(project, '.claude')]) {
      try {
        fs.rmdirSync(empty);
        done.push(`removed ${show(empty)}`);
      } catch {
        // Not empty, or not there: either way it stays.
      }
    }
  }
  for (const entry of originals.restore(at, project, ticked) || []) {
    done.push(`${entry.removed ? 'removed' : 'put back'} ${show(entry.path)}`);
  }
  return done;
}

/** Whether a project keeps Flow after the form: its `.flow/` left unticked. */
const keepsFlow = (project, ticked) => fs.existsSync(store.recordsDir(project)) && !ticked.has(store.recordsDir(project));

module.exports = { fileOf, isKnowledge, rows, sections, render, parse, ask, refuseUnsent, apply, keepsFlow };
