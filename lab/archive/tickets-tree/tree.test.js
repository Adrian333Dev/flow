// The tests of `flow tickets tree`, from scripts/tests/board.test.js. Moved 2026-10-26 by fw-234.

test('flow ls and flow tree hide parked tickets, with a count, until asked', () => {
  const dir = project('board-parked-hidden');
  flow(dir, ['tickets', 'new', 'Alpha']);
  flow(dir, ['tickets', 'new', 'Beta']);
  flow(dir, ['tickets', 'park', 'exp-2', '--reason', 'after release one']);

  const ls = flow(dir, ['tickets']).stdout;
  assert.doesNotMatch(ls, /beta/);
  assert.match(ls, /1 parked hidden: "status:all"/);
  assert.match(flow(dir, ['tickets', '--', 'status:parked']).stdout, /beta/);

  const tree = flow(dir, ['tickets', 'tree']).stdout;
  assert.doesNotMatch(tree, /beta|after release one/);
  assert.match(tree, /1 parked hidden \(flow tickets tree --all\)/);
  assert.match(flow(dir, ['tickets', 'tree', '--all']).stdout, /beta/);
});

test('flow tree nests children under their parent', () => {
  const dir = project('board-tree');

  flow(dir, ['tickets', 'new', 'Parent feature']);
  const folders = fs.readdirSync(path.join(dir, '.flow', 'tickets')).filter((f) => f !== 'archive');
  const parentId = idOf(folders[0]);

  flow(dir, ['tickets', 'new', 'Child A', '--parent', parentId]);
  flow(dir, ['tickets', 'new', 'Child B', '--parent', parentId]);

  const r = flow(dir, ['tickets', 'tree']);
  assert.strictEqual(r.code, 0, r.stderr);
  assert.match(r.stdout, /exp-1-parent-feature/);
  assert.match(r.stdout, /exp-2-child-a/);
  assert.match(r.stdout, /[│├└]/);
});
