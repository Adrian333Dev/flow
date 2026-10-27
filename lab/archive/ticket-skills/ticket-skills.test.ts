/**
 * The ticket skills: one user-only skill per open ticket, written by every
 * `flow` command that writes a ticket and by `sync` itself. What each test
 * reads is the folder of skills, the thing Claude Code lists.
 */

import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { project, write, flow } from '../../shared/testing.ts';
import * as ticketSkills from './ticket-skills.ts';


const skillsOf = (dir) => path.join(dir, '.claude', 'skills');
const skillText = (dir, id) => fs.readFileSync(path.join(skillsOf(dir), id, 'SKILL.md'), 'utf8');
const listed = (dir) => (fs.existsSync(skillsOf(dir)) ? fs.readdirSync(skillsOf(dir)).sort() : []);

/** `sync` run here, against the scratch project's home and Claude Code folders. */
function syncIn(dir, claude = path.join(dir, 'claude')) {
  process.env.FLOW_HOME = path.join(dir, 'flow-home');
  return ticketSkills.sync({ project: dir, claude });
}

test('flow new writes a user-only skill for the ticket, labelled with its status and description', () => {
  const dir = project('ticket-skills-new');
  assert.strictEqual(flow(dir, ['tickets', 'new', 'Daemon "detection"']).code, 0);

  const text = skillText(dir, 'exp-1');
  assert.match(text, /^name: exp-1$/m);
  assert.match(text, /^description: "Ticket, todo: Daemon \\"detection\\""$/m);
  assert.match(text, /^disable-model-invocation: true$/m);
  assert.match(text, /^<!-- flow: ticket exp-1, /m);
  assert.match(text, /^!`flow tickets get exp-1 2>&1 \|\| true`$/m);
  assert.match(text, /^On what exists, the files win\. On decisions and what is still open, `ticket\.md` wins over `context\.md`/m);
  assert.strictEqual(fs.readFileSync(path.join(skillsOf(dir), 'exp-1', '.gitignore'), 'utf8'), '*\n');
});

test('a status move or a new description rewrites the skill, and a sync with nothing new changes nothing', () => {
  const dir = project('ticket-skills-rewrite');
  flow(dir, ['tickets', 'new', 'Parser']);
  assert.strictEqual(flow(dir, ['tickets', 'start', 'exp-1']).code, 0);
  assert.match(skillText(dir, 'exp-1'), /"Ticket, in-progress: Parser"/);

  flow(dir, ['tickets', 'edit', 'exp-1', '--description', 'Parser split']);
  assert.match(skillText(dir, 'exp-1'), /"Ticket, in-progress: Parser split"/);

  assert.strictEqual(syncIn(dir), false);
});

test('a ticket done or dropped loses its skill, a parked one keeps it, and one reopened gets it again', () => {
  const dir = project('ticket-skills-remove');
  for (const title of ['One', 'Two', 'Three']) flow(dir, ['tickets', 'new', title]);
  assert.deepStrictEqual(listed(dir), ['exp-1', 'exp-2', 'exp-3']);

  flow(dir, ['tickets', 'park', 'exp-1', '--reason', 'waiting on the vendor']);
  flow(dir, ['tickets', 'start', 'exp-2']);
  flow(dir, ['tickets', 'done', 'exp-2']);
  flow(dir, ['tickets', 'drop', 'exp-3', '--reason', 'not needed']);
  assert.deepStrictEqual(listed(dir), ['exp-1']);
  assert.match(skillText(dir, 'exp-1'), /"Ticket, parked: One"/);

  flow(dir, ['tickets', 'start', 'exp-2']);
  assert.deepStrictEqual(listed(dir), ['exp-1', 'exp-2']);
});

test('a ticket waiting on another says blocked, until the other is done', () => {
  const dir = project('ticket-skills-blocked');
  flow(dir, ['tickets', 'new', 'Base']);
  flow(dir, ['tickets', 'new', 'On top', '--deps', 'exp-1']);
  assert.match(skillText(dir, 'exp-2'), /"Ticket, todo, blocked: On top"/);

  flow(dir, ['tickets', 'start', 'exp-1']);
  assert.match(skillText(dir, 'exp-2'), /"Ticket, todo, blocked: On top"/);
  flow(dir, ['tickets', 'done', 'exp-1']);
  assert.match(skillText(dir, 'exp-2'), /"Ticket, todo: On top"/);
});

test('a skill folder flow never wrote is left alone, even under a ticket id', () => {
  const dir = project('ticket-skills-foreign');
  write(dir, '.claude/skills/exp-1/SKILL.md', '---\nname: exp-1\ndescription: mine\n---\n');
  write(dir, '.claude/skills/review-pr/SKILL.md', '---\nname: review-pr\ndescription: mine\n---\n');
  flow(dir, ['tickets', 'new', 'Parser']);
  assert.match(skillText(dir, 'exp-1'), /description: mine/);

  flow(dir, ['tickets', 'done', 'exp-1']);
  assert.deepStrictEqual(listed(dir), ['exp-1', 'review-pr']);
});

test('a marked folder holding a file flow never wrote survives its ticket closing', () => {
  const dir = project('ticket-skills-extra');
  flow(dir, ['tickets', 'new', 'Parser']);
  write(dir, '.claude/skills/exp-1/notes.md', 'mine\n');
  flow(dir, ['tickets', 'done', 'exp-1']);
  assert.ok(fs.existsSync(path.join(skillsOf(dir), 'exp-1', 'notes.md')));
});

test('the tickets in ~/.flow/ get their skills in Claude Code\'s own folder', () => {
  const dir = project('ticket-skills-home');
  const claude = path.join(dir, 'claude');
  write(dir, 'flow-home/tickets/home-4-backup-script/ticket.md',
    '---\nid: home-4\ntitle: Backup script\nstatus: in-progress\ntype: chore\n---\n\nBody.\n');

  assert.strictEqual(syncIn(dir, claude), true);
  assert.match(fs.readFileSync(path.join(claude, 'skills', 'home-4', 'SKILL.md'), 'utf8'),
    /"Ticket, in-progress: Backup script"/);
  assert.deepStrictEqual(listed(dir), []);
});
