/**
 * `flow search`: the wiki folders and research reports closest to a situation.
 * `flow visit`: one read inside a folder, counted for a ticket or the project.
 */

import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { project, write, flow } from '../shared/testing.ts';

function place(name: string) {
  const dir = project(name);
  const home = path.join(dir, 'flow-home');
  write(home, 'wiki/tmux/index.md', '# tmux\n\nA terminal multiplexer: panes and sessions that survive a closed window.\n');
  write(home, 'wiki/node/index.md', '# node\n\nThe JavaScript runtime the scripts run on.\n');
  write(home, 'wiki/node/findings/node-test-skips-type-checks.md', '---\nlabels: [test-runner]\n---\n\nText.\n');
  write(dir, '.flow/research/agent-memory/how-letta-splits-memory.md', '# How Letta splits core and archival memory\n\nText.\n');
  for (const n of [1, 2, 3, 4]) write(dir, `.flow/research/agent-memory/memory-report-${n}.md`, `# Memory report ${n}\n\nAgent memory.\n`);
  write(dir, '.flow/research/agent-memory/copies/a/b/memory.md', '# A copied file\n\nAgent memory.\n');
  return dir;
}

test('a search lists the closest places, one line each: path, then what the place is about', () => {
  const dir = place('search-places');
  const lines = flow(dir, ['search', '--', 'terminal sessions tmux']).stdout.trim().split('\n');
  assert.match(lines[0], /\/flow-home\/wiki\/tmux\/   A terminal multiplexer: panes and sessions that survive a closed window\.$/);
  const findingHit = flow(dir, ['search', '--', 'type checks']).stdout;
  assert.match(findingHit, /wiki\/node\//, "a finding's name counts toward its folder");
});

test('a topic shows at most 3 reports, and a file deeper than a report is no report', () => {
  const dir = place('search-topic');
  const hits = JSON.parse(flow(dir, ['search', '--', 'agent memory', '--json']).stdout);
  assert.strictEqual(hits.length, 3);
  assert.ok(hits.every((h: { path: string }) => h.path.startsWith('.flow/research/agent-memory/') && !h.path.includes('copies')));
});

test('a search that matches nothing says so, and no words is refused', () => {
  const dir = place('search-none');
  assert.match(flow(dir, ['search', '--', 'kubernetes']).stdout, /^nothing in the wiki or the research folders/);
  assert.strictEqual(flow(dir, ['search']).code, 1);
});

test('a visit adds to the ticket folder or the project, and a bad folder name is refused', () => {
  const dir = place('search-visit');
  flow(dir, ['tickets', 'new', 'probe: a ticket']);
  flow(dir, ['visit', 'tmux', '--ticket', '1']);
  flow(dir, ['visit', 'tmux', '--ticket', '1']);
  flow(dir, ['visit', 'research:agent-memory']);
  const ticketDir = path.join(dir, '.flow', 'tickets', fs.readdirSync(path.join(dir, '.flow', 'tickets')).find((n) => /^\d/.test(n))!);
  assert.strictEqual(JSON.parse(fs.readFileSync(path.join(ticketDir, 'usage.json'), 'utf8')).tmux.count, 2);
  assert.strictEqual(JSON.parse(fs.readFileSync(path.join(dir, '.flow', 'usage.json'), 'utf8'))['research:agent-memory'].count, 1);
  assert.strictEqual(flow(dir, ['visit', '../etc']).code, 1);
});
