'use strict';
/**
 * The ticket skills: one user-only skill per open ticket, written by every
 * `flow` command that writes a ticket and by `sync` itself. What each test
 * reads is the folder of skills, the thing Claude Code lists.
 */

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { project, write, flow } = require('./helpers/scratch');
const ticketSkills = require('../lib/tickets/ticket-skills');

const skillsOf = (dir) => path.join(dir, '.claude', 'skills');
const skillText = (dir, id) => fs.readFileSync(path.join(skillsOf(dir), id, 'SKILL.md'), 'utf8');
const listed = (dir) => (fs.existsSync(skillsOf(dir)) ? fs.readdirSync(skillsOf(dir)).sort() : []);

/** `sync` run here, against the scratch project's home and Claude Code folders. */
function syncIn(dir, claude = path.join(dir, 'claude')) {
  process.env.FLOW_HOME = path.join(dir, 'flow-home');
  return ticketSkills.sync({ project: dir, claude });
}

test('flow new writes a user-only skill for the ticket, labelled with its status and title', () => {
  const dir = project('ticket-skills-new');
  assert.strictEqual(flow(dir, ['new', 'Daemon "detection"']).code, 0);

  const text = skillText(dir, 'exp-1');
  assert.match(text, /^name: exp-1$/m);
  assert.match(text, /^description: "Ticket, todo: Daemon \\"detection\\""$/m);
  assert.match(text, /^disable-model-invocation: true$/m);
  assert.match(text, /^<!-- flow: ticket exp-1, /m);
  assert.match(text, /^!`flow get exp-1 --files 2>&1 \|\| true`$/m);
  assert.strictEqual(fs.readFileSync(path.join(skillsOf(dir), 'exp-1', '.gitignore'), 'utf8'), '*\n');
});

test('a status move or a new title rewrites the skill, and a sync with nothing new changes nothing', () => {
  const dir = project('ticket-skills-rewrite');
  flow(dir, ['new', 'Parser']);
  assert.strictEqual(flow(dir, ['build', 'exp-1']).code, 0);
  assert.match(skillText(dir, 'exp-1'), /"Ticket, building: Parser"/);

  flow(dir, ['edit', 'exp-1', '--title', 'Parser split']);
  assert.match(skillText(dir, 'exp-1'), /"Ticket, building: Parser split"/);

  assert.strictEqual(syncIn(dir), false);
});

test('a ticket parked, done or dropped loses its skill, and one brought back gets it again', () => {
  const dir = project('ticket-skills-remove');
  for (const title of ['One', 'Two', 'Three']) flow(dir, ['new', title]);
  assert.deepStrictEqual(listed(dir), ['exp-1', 'exp-2', 'exp-3']);

  flow(dir, ['park', 'exp-1', '--reason', 'waiting on the vendor']);
  flow(dir, ['build', 'exp-2']);
  flow(dir, ['done', 'exp-2']);
  flow(dir, ['drop', 'exp-3', '--reason', 'not needed']);
  assert.deepStrictEqual(listed(dir), []);

  flow(dir, ['todo', 'exp-1']);
  assert.deepStrictEqual(listed(dir), ['exp-1']);
});

test('a ticket waiting on another says blocked, until the other is done', () => {
  const dir = project('ticket-skills-blocked');
  flow(dir, ['new', 'Base']);
  flow(dir, ['new', 'On top', '--deps', 'exp-1']);
  assert.match(skillText(dir, 'exp-2'), /"Ticket, todo, blocked: On top"/);

  flow(dir, ['build', 'exp-1']);
  flow(dir, ['review', 'exp-1']);
  assert.match(skillText(dir, 'exp-2'), /"Ticket, todo: On top"/);
});

test('a skill folder flow never wrote is left alone, even under a ticket id', () => {
  const dir = project('ticket-skills-foreign');
  write(dir, '.claude/skills/exp-1/SKILL.md', '---\nname: exp-1\ndescription: mine\n---\n');
  write(dir, '.claude/skills/review-pr/SKILL.md', '---\nname: review-pr\ndescription: mine\n---\n');
  flow(dir, ['new', 'Parser']);
  assert.match(skillText(dir, 'exp-1'), /description: mine/);

  flow(dir, ['done', 'exp-1']);
  assert.deepStrictEqual(listed(dir), ['exp-1', 'review-pr']);
});

test('a marked folder holding a file flow never wrote survives its ticket closing', () => {
  const dir = project('ticket-skills-extra');
  flow(dir, ['new', 'Parser']);
  write(dir, '.claude/skills/exp-1/notes.md', 'mine\n');
  flow(dir, ['done', 'exp-1']);
  assert.ok(fs.existsSync(path.join(skillsOf(dir), 'exp-1', 'notes.md')));
});

test('the tickets in ~/.flow/ get their skills in Claude Code\'s own folder, and uninstall\'s step removes them', () => {
  const dir = project('ticket-skills-home');
  const claude = path.join(dir, 'claude');
  write(dir, 'flow-home/tickets/home-4-backup-script/ticket.md',
    '---\nid: home-4\ntitle: Backup script\nstatus: groundwork\ntype: chore\n---\n\nBody.\n');

  assert.strictEqual(syncIn(dir, claude), true);
  assert.match(fs.readFileSync(path.join(claude, 'skills', 'home-4', 'SKILL.md'), 'utf8'),
    /"Ticket, groundwork: Backup script"/);
  assert.deepStrictEqual(listed(dir), []);

  write(dir, 'claude/skills/react/SKILL.md', '---\nname: react\ndescription: mine\n---\n');
  const gone = ticketSkills.removeAll([path.join(claude, 'skills')]);
  assert.deepStrictEqual(gone, [path.join(claude, 'skills', 'home-4')]);
  assert.deepStrictEqual(fs.readdirSync(path.join(claude, 'skills')), ['react']);
});
