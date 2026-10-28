/**
 * `flow groups`: a label with a card, ranked and parked as one. Each test
 * builds its tickets through `flow`, then reads the card on disk, the text a
 * reader sees, and the `--json` record a hook reads.
 */

import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { project, flow } from '../../shared/testing.ts';
import * as frontmatter from '../../shared/frontmatter.ts';

function asJson(dir, args) {
  const ran = flow(dir, [...args, '--json']);
  let data;
  try {
    data = JSON.parse(ran.stdout);
  } catch {
    assert.fail(`flow ${args.join(' ')} --json printed no JSON:\n${ran.stdout}${ran.stderr}`);
  }
  return { code: ran.code, data };
}

const ok = (dir, args) => {
  const ran = flow(dir, args);
  assert.strictEqual(ran.code, 0, `flow ${args.join(' ')}\n${ran.stdout}${ran.stderr}`);
  return ran.stdout;
};

const card = (dir, label) => frontmatter.parse(fs.readFileSync(path.join(dir, '.flow', 'groups', `${label}.md`), 'utf8')).data;

const ticketFile = (dir, id) => {
  const folder = fs.readdirSync(path.join(dir, '.flow', 'tickets')).find((f) => f === String(id) || f.startsWith(`exp-${id}-`) || f.startsWith(`${id}-`))!;
  return frontmatter.parse(fs.readFileSync(path.join(dir, '.flow', 'tickets', folder, 'ticket.md'), 'utf8')).data;
};

test('flow groups rank makes a card, and places groups first, before and last', () => {
  const dir = project('groups-rank');
  ok(dir, ['tickets', 'new', 'Seo work', '--label', 'seo']);
  ok(dir, ['tickets', 'new', 'Docs work', '--label', 'docs']);
  ok(dir, ['tickets', 'new', 'Api work', '--label', 'api']);

  assert.match(ok(dir, ['groups', 'rank', 'seo', '--first']), /seo {2}first/);
  assert.ok(Number.isFinite(Number(card(dir, 'seo').rank)));
  ok(dir, ['groups', 'rank', 'docs', '--before', 'seo']);
  ok(dir, ['groups', 'rank', 'api', '--last']);

  const { data } = asJson(dir, ['groups']);
  assert.deepStrictEqual(data.groups.filter((g) => g.rank !== null).map((g) => g.label), ['docs', 'seo', 'api']);
  const rankOf = (label) => Number(card(dir, label).rank);
  assert.ok(rankOf('docs') < rankOf('seo') && rankOf('seo') < rankOf('api'));
});

test('flow groups rank refuses an unknown label, an unranked neighbour, no place, and itself', () => {
  const dir = project('groups-rank-refusals');
  ok(dir, ['tickets', 'new', 'Seo work', '--label', 'seo']);
  ok(dir, ['tickets', 'new', 'Docs work', '--label', 'docs']);

  const unknown = flow(dir, ['groups', 'rank', 'typo', '--first']);
  assert.strictEqual(unknown.code, 1);
  assert.match(unknown.stderr + unknown.stdout, /no ticket carries typo.*Labels in use: docs, seo/);
  assert.ok(!fs.existsSync(path.join(dir, '.flow', 'groups', 'typo.md')));

  const unranked = flow(dir, ['groups', 'rank', 'seo', '--before', 'docs']);
  assert.strictEqual(unranked.code, 1);
  assert.match(unranked.stderr + unranked.stdout, /docs is no ranked group/);

  const nowhere = flow(dir, ['groups', 'rank', 'seo']);
  assert.strictEqual(nowhere.code, 1);
  assert.match(nowhere.stderr + nowhere.stdout, /say where/);

  ok(dir, ['groups', 'rank', 'seo', '--first']);
  const itself = flow(dir, ['groups', 'rank', 'seo', '--after', 'seo']);
  assert.strictEqual(itself.code, 1);
  assert.match(itself.stderr + itself.stdout, /beside itself/);
});

test('a parked group holds its todo and in-progress tickets, and the files keep their status', () => {
  const dir = project('groups-park');
  ok(dir, ['tickets', 'new', 'Later one', '--label', 'later']);
  ok(dir, ['tickets', 'new', 'Later two', '--label', 'later']);
  ok(dir, ['tickets', 'new', 'Other work']);
  ok(dir, ['tickets', 'start', 'exp-2']);

  const parked = ok(dir, ['groups', 'park', 'later', '--reason', 'After the release']);
  assert.match(parked, /later parked, holding 2 tickets/);
  assert.match(parked, /in progress, now held:\n {2}exp-2/);
  assert.strictEqual(card(dir, 'later').parked, 'After the release');
  assert.strictEqual(ticketFile(dir, 1).status, 'todo');
  assert.strictEqual(ticketFile(dir, 2).status, 'in-progress');

  const next = ok(dir, ['next']);
  assert.doesNotMatch(next, /in progress\n/);
  assert.doesNotMatch(next, /later-one|later-two/);
  assert.match(next, /take: exp-3/);
  assert.match(next, /2 held by later/);

  const list = ok(dir, ['tickets']);
  assert.doesNotMatch(list, /later-one/);
  assert.match(list, /later +parked +- +2 held, After the release/);

  assert.match(ok(dir, ['tickets', 'get', 'exp-1']), /status: todo \(held by later\)/);
  assert.match(ok(dir, ['tickets', 'get', 'exp-1']), /pick up with: flow groups revive later/);

  const { data } = asJson(dir, ['tickets', 'get', 'exp-1']);
  const record = data.ticket || data;
  assert.strictEqual(record.status, 'parked');
  assert.strictEqual(record.storedStatus, 'todo');
  assert.strictEqual(record.heldBy, 'later');
  assert.deepStrictEqual(record.groups, ['later']);

  const start = flow(dir, ['tickets', 'start', 'exp-1']);
  assert.strictEqual(start.code, 1);
  assert.match(start.stderr + start.stdout, /flow groups revive later/);
  assert.strictEqual(ticketFile(dir, 1).status, 'todo');

  const revived = ok(dir, ['groups', 'revive', 'later']);
  assert.match(revived, /later revived, 2 tickets back/);
  assert.match(ok(dir, ['next']), /later-two/);
  assert.match(ok(dir, ['next']), /later-one/);
});

test('a ticket with 2 groups is held by either one parked, and stays held until both are revived', () => {
  const dir = project('groups-two');
  ok(dir, ['tickets', 'new', 'Both groups', '--label', 'seo,later']);
  ok(dir, ['tickets', 'new', 'Seo alone', '--label', 'seo']);
  ok(dir, ['groups', 'rank', 'seo', '--first']);
  ok(dir, ['groups', 'park', 'later', '--reason', 'Not now']);

  const next = ok(dir, ['next']);
  assert.doesNotMatch(next, /both-groups/);
  assert.match(next, /seo-alone/);
  assert.match(next, /1 held by later/);

  ok(dir, ['groups', 'park', 'seo', '--reason', 'Paused too']);
  const revived = ok(dir, ['groups', 'revive', 'later']);
  assert.match(revived, /exp-1 is still held by seo/);
  assert.doesNotMatch(ok(dir, ['next']), /both-groups/);

  const revive = flow(dir, ['groups', 'revive', 'later']);
  assert.strictEqual(revive.code, 1);
  assert.match(revive.stderr + revive.stdout, /later is no parked group\. Parked: seo\./);
});

test('a ranked group heads its tickets in flow next, take picks its first, and a child sits under its parent', () => {
  const dir = project('groups-sections');
  ok(dir, ['tickets', 'new', 'Plain one']);
  ok(dir, ['tickets', 'new', 'Seo parent', '--label', 'seo']);
  ok(dir, ['tickets', 'new', 'Seo child', '--parent', 'exp-2']);
  ok(dir, ['tickets', 'new', 'Seo leaf', '--label', 'seo']);
  ok(dir, ['groups', 'rank', 'seo', '--first']);

  const next = ok(dir, ['next']);
  assert.match(next, /ready \(3\)\n {2}seo\n {4}exp-3-seo-child +-\n {4}exp-4-seo-leaf +seo\n {2}exp-1-plain-one/);
  assert.match(next, /take: exp-3/);

  const { data } = asJson(dir, ['next']);
  const placed = Object.fromEntries(data.ready.map((r) => [r.id, r.placedIn]));
  assert.strictEqual(placed['exp-3'], 'seo');
  assert.ok(!placed['exp-1']);

  const list = ok(dir, ['tickets']);
  assert.match(list, /^seo +0\/2\n {2}exp-2-seo-parent/m);
});

test('flow-issue is a built-in group, unranked, and reorders nothing', () => {
  const dir = project('groups-built-in');
  ok(dir, ['tickets', 'new', 'Plain one']);
  ok(dir, ['tickets', 'new', 'An issue', '--label', 'flow-issue']);

  const { data } = asJson(dir, ['groups']);
  const issue = data.groups.find((g) => g.label === 'flow-issue');
  assert.ok(issue.builtIn);
  assert.strictEqual(issue.rank, null);
  assert.strictEqual(issue.groupBy, 'label');
  assert.ok(!fs.existsSync(path.join(dir, '.flow', 'groups')));

  assert.match(ok(dir, ['next']), /exp-1-plain-one.*\n.*exp-2-an-issue/);
  assert.match(ok(dir, ['groups']), /flow-issue +0\/1 +unranked/);

  ok(dir, ['tickets', 'drop', 'exp-2', '--reason', 'Not a fault']);
  assert.doesNotMatch(ok(dir, ['groups']), /flow-issue/, 'a group with nothing open hides');
});

test('flow groups lists ranked groups first, and a parked one with its hold and reason', () => {
  const dir = project('groups-list');
  ok(dir, ['tickets', 'new', 'Seo work', '--label', 'seo']);
  ok(dir, ['tickets', 'new', 'Later work', '--label', 'later']);
  ok(dir, ['groups', 'rank', 'seo', '--first']);
  ok(dir, ['groups', 'park', 'later', '--reason', 'After the release']);

  // The first line names the place.
  const lines = ok(dir, ['groups']).trim().split('\n').slice(1);
  assert.match(lines[0], /^seo +0\/1/);
  assert.ok(lines.some((l) => /^later +0\/1 +parked, 1 held, After the release/.test(l)), lines.join('\n'));
});
