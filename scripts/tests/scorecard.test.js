'use strict';
/**
 * The enforcement bridge: the check loader, the two hooks, and `flow scorecard`.
 *
 * No real check is exercised here. Every check below is a fixture written into
 * a scratch folder and pointed at by FLOW_CHECKS, so this file tests the wiring
 * whatever `scripts/rule-checks/` happens to hold. The shipped checks have
 * their own tests in rule-checks.test.js.
 *
 * Every test sets FLOW_HOME as well, so the counts land under tmp/ and never in
 * a real ~/.flow/scorecards/.
 */

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { project, write, run, SCRIPTS } = require('./helpers/scratch');

const checks = require(path.join(SCRIPTS, 'flow', 'lib', 'checks'));

/** The fields a fixture varies. Anything left out takes the value here. */
const base = (id) => ({
  id,
  rule: '',
  tier: 'measure',
  applies: '() => true',
  check: '() => true',
  needs: 'added',
  message: `${id} was broken`,
  since: '2026-01-01',
});

/**
 * A check file, written as source so the loader has to `require` it for real.
 * `applies` and `check` arrive as source text, since a function cannot be
 * serialised into a file with its closure intact.
 */
function check(dir, id, spec) {
  const c = { ...base(id), ...spec };
  const body = [
    `  id: ${JSON.stringify(c.id)},`,
    `  rule: ${JSON.stringify(c.rule)},`,
    `  tier: ${JSON.stringify(c.tier)},`,
    `  needs: ${JSON.stringify(c.needs)},`,
    `  message: ${JSON.stringify(c.message)},`,
    `  since: ${JSON.stringify(c.since)},`,
    `  applies: ${c.applies},`,
    `  check: ${c.check},`,
  ].join('\n');
  return write(dir, path.join('checks', `${id}.js`), `module.exports = {\n${body}\n};\n`);
}

const env = (dir) => ({
  ...process.env,
  FLOW_HOME: path.join(dir, 'flow-home'),
  FLOW_CHECKS: path.join(dir, 'checks'),
});

const edit = (file, added, session = 's1', cwd = '/tmp/demo') =>
  JSON.stringify({ session_id: session, cwd, tool_name: 'Write', tool_input: { file_path: file, content: added } });

function lines(dir, session = 's1') {
  const file = path.join(dir, 'flow-home', 'scorecards', `${session}.jsonl`);
  if (!fs.existsSync(file)) return [];
  return fs.readFileSync(file, 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l));
}

// ------------------------------------------------------------- the loader

test('the loader refuses a check that is missing a field, misnamed, or will not parse', () => {
  const dir = project('checks-loader');
  check(dir, 'good-rule', { rule: 'CLAUDE.md' });
  check(dir, 'no-tier', { rule: 'CLAUDE.md', tier: 'sometimes' });
  check(dir, 'mismatched', { rule: 'CLAUDE.md', id: 'other-id' });
  write(dir, 'checks/broken.js', 'module.exports = { this is not javascript');

  const { checks: loaded, problems } = checks.load(path.join(dir, 'checks'));

  assert.deepStrictEqual(loaded.map((c) => c.id), ['good-rule']);
  assert.match(problems.join('\n'), /no-tier\.js: tier must be one of: measure, warn, block/);
  assert.match(problems.join('\n'), /mismatched\.js: id "other-id" does not match the filename/);
  assert.match(problems.join('\n'), /broken\.js: will not load/);
});

test('a missing checks folder loads as empty rather than throwing', () => {
  const { checks: loaded, problems } = checks.load('/nowhere/at/all');
  assert.deepStrictEqual(loaded, []);
  assert.deepStrictEqual(problems, []);
});

// ------------------------------------------------------------- rule ids

test('rule ids and rule text come out of the bullet they live in', () => {
  const dir = project('checks-rules');
  const file = write(dir, 'rules.md', [
    '## Tools',
    '',
    '- **`no-mkdir`** Write creates directories.',
    '- **`batch-calls`** Shell steps chain with `&&`.',
    '  A second line belongs to the same rule.',
    '- **`no-git-writes`** Not unless the user enables them.',
    '',
    '## Next section',
  ].join('\n'));

  assert.deepStrictEqual(checks.ruleIds(file), ['no-mkdir', 'batch-calls', 'no-git-writes']);
  assert.strictEqual(
    checks.ruleText(file, 'batch-calls'),
    '- **`batch-calls`** Shell steps chain with `&&`.\n  A second line belongs to the same rule.'
  );
  assert.strictEqual(checks.ruleText(file, 'no-git-writes'), '- **`no-git-writes`** Not unless the user enables them.');
  assert.strictEqual(checks.ruleText(file, 'never-written'), null);
  assert.deepStrictEqual(checks.ruleIds('/nowhere.md'), []);
});

test('a numbered step and a paragraph carry a rule id too', () => {
  const dir = project('checks-shapes');
  const file = write(dir, 'rules.md', [
    '## The turn',
    '',
    '**`one-reply`** One user message, your work, one reply.',
    '',
    '1. **`instruction-or-thinking`** An instruction names the change.',
    '   - **`hedging-is-thinking`** A hedge is never an instruction.',
    '2. **`disagree-first`** Say it once, before building.',
    '',
    '## Next section',
  ].join('\n'));

  assert.deepStrictEqual(checks.ruleIds(file),
    ['one-reply', 'instruction-or-thinking', 'hedging-is-thinking', 'disagree-first']);
  assert.strictEqual(checks.ruleText(file, 'one-reply'),
    '**`one-reply`** One user message, your work, one reply.');
  assert.strictEqual(checks.ruleText(file, 'instruction-or-thinking'),
    '1. **`instruction-or-thinking`** An instruction names the change.\n   - **`hedging-is-thinking`** A hedge is never an instruction.');
  assert.strictEqual(checks.ruleText(file, 'hedging-is-thinking'),
    '   - **`hedging-is-thinking`** A hedge is never an instruction.');
  assert.strictEqual(checks.ruleText(file, 'disagree-first'),
    '2. **`disagree-first`** Say it once, before building.');
});

test('a heading is a target too, and its id is the slug of its own text', () => {
  const dir = project('checks-sections');
  const file = write(dir, 'rules.md', [
    '# The title names the file, never a section',
    '',
    '## The turn',
    '',
    '**`name-each-action`** One line as you take it.',
    '',
    '### When it has parts',
    '',
    '- **`walk-a-real-case`** Start to finish.',
    '',
    '## Reading',
    '',
    '- **`read-minimal-context`** Path and line range.',
  ].join('\n'));

  assert.deepStrictEqual(checks.sectionIds(file), ['the-turn', 'when-it-has-parts', 'reading']);
  assert.deepStrictEqual(checks.ids(file),
    ['the-turn', 'name-each-action', 'when-it-has-parts', 'walk-a-real-case', 'reading', 'read-minimal-context']);

  // A section comes back whole, sub-headings and all, because a check naming a
  // section wants everything the section governs.
  assert.strictEqual(checks.ruleText(file, 'the-turn'), [
    '## The turn',
    '',
    '**`name-each-action`** One line as you take it.',
    '',
    '### When it has parts',
    '',
    '- **`walk-a-real-case`** Start to finish.',
  ].join('\n'));
  assert.strictEqual(checks.ruleText(file, 'when-it-has-parts'),
    '### When it has parts\n\n- **`walk-a-real-case`** Start to finish.');
  assert.strictEqual(checks.ruleText(file, 'reading'),
    '## Reading\n\n- **`read-minimal-context`** Path and line range.');
});

test('an id defined twice in one file is reported, and twice across files is not', () => {
  const dir = project('checks-duplicates');
  const clash = write(dir, 'clash.md', [
    '## Capture',
    '',
    '**`capture`** Write anything worth keeping.',
    '',
    '## Reading',
    '',
    '- **`read-minimal-context`** Path and line range.',
    '- **`read-minimal-context`** The same id, a second rule.',
  ].join('\n'));
  const other = write(dir, 'other.md', '- **`read-minimal-context`** Same id, another file, still fine.');

  assert.deepStrictEqual(checks.duplicateIds(clash).sort(), ['capture', 'read-minimal-context']);
  assert.deepStrictEqual(checks.duplicateIds(other), []);
});

test('every id in the two CLAUDE.md files is defined once in its file', () => {
  const clone = path.join(SCRIPTS, '..');
  for (const file of [path.join(clone, 'home', 'CLAUDE.md'), path.join(clone, 'CLAUDE.md')]) {
    const ids = checks.ids(file);
    assert.ok(ids.length > 30, `${file}: only ${ids.length} ids`);
    assert.deepStrictEqual(checks.duplicateIds(file), [], `${file}: an id is used twice`);
  }
});

// ------------------------------------------------------------- the hook

test('measure records the result and says nothing to the agent', () => {
  const dir = project('hook-measure');
  check(dir, 'no-todo', { rule: 'CLAUDE.md', check: '(p, c) => !c.includes("TODO")' });

  const clean = run('rule-check.js', [], { input: edit('/x/a.js', 'const a = 1;'), env: env(dir) });
  const dirty = run('rule-check.js', [], { input: edit('/x/b.js', '// TODO later'), env: env(dir) });

  assert.strictEqual(clean.stdout.trim(), '', 'measure never speaks');
  assert.strictEqual(dirty.stdout.trim(), '', 'not even on a violation');

  const rows = lines(dir);
  assert.deepStrictEqual(rows.map((r) => r.ok), [true, false]);
  assert.deepStrictEqual(rows.map((r) => r.id), ['no-todo', 'no-todo']);
  assert.strictEqual(rows[0].project, 'demo', 'the project is recorded, and cannot be backfilled later');
});

test('warn puts the message in additionalContext and block denies the edit', () => {
  const dir = project('hook-tiers');
  const rule = write(dir, 'rules.md', '- **`no-todo`** Never leave a TODO behind.');
  check(dir, 'no-todo', { rule, tier: 'warn', check: '(p, c) => !c.includes("TODO")' });

  const warned = run('rule-check.js', [], { input: edit('/x/a.js', '// TODO'), env: env(dir) });
  const out = JSON.parse(warned.stdout);
  assert.strictEqual(out.hookSpecificOutput.hookEventName, 'PreToolUse');
  assert.match(out.hookSpecificOutput.additionalContext, /no-todo was broken/);
  assert.strictEqual(out.hookSpecificOutput.permissionDecision, undefined, 'warn never decides the call');

  check(dir, 'no-todo', { rule, tier: 'block', check: '(p, c) => !c.includes("TODO")' });
  const blocked = run('rule-check.js', [], { input: edit('/x/a.js', '// TODO'), env: env(dir) });
  const denial = JSON.parse(blocked.stdout).hookSpecificOutput;
  assert.strictEqual(denial.permissionDecision, 'deny');
  assert.match(denial.permissionDecisionReason, /no-todo was broken/);
});

test('a warning carries the rule text when its file never loaded, and the id when it did', () => {
  const dir = project('hook-injection');
  const rule = write(dir, 'rules.md', '- **`no-todo`** Never leave a TODO behind.');
  check(dir, 'no-todo', { rule, tier: 'warn', check: '(p, c) => !c.includes("TODO")' });

  const cold = run('rule-check.js', [], { input: edit('/x/a.js', '// TODO'), env: env(dir) });
  assert.match(JSON.parse(cold.stdout).hookSpecificOutput.additionalContext,
    /Never leave a TODO behind/, 'the text is injected, so no extra turn is needed to read it');

  const loaded = JSON.stringify({ session_id: 's1', file_path: rule, memory_type: 'User', load_reason: 'session_start' });
  run('instructions-loaded.js', [], { input: loaded, env: env(dir) });

  const warm = run('rule-check.js', [], { input: edit('/x/a.js', '// TODO'), env: env(dir) });
  const text = JSON.parse(warm.stdout).hookSpecificOutput.additionalContext;
  assert.match(text, /\(no-todo\)/, 'the agent already holds the rule, so the id is enough');
  assert.doesNotMatch(text, /Never leave a TODO behind/);

  assert.strictEqual(lines(dir).filter((r) => r.kind === 'loaded').length, 1);
});

test('the hook stays silent on a broken check rather than blocking every edit', () => {
  const dir = project('hook-safety');
  check(dir, 'explodes', { rule: 'CLAUDE.md', check: '() => { throw new Error("boom"); }' });

  const result = run('rule-check.js', [], { input: edit('/x/a.js', 'anything'), env: env(dir) });
  assert.strictEqual(result.stdout.trim(), '');
  assert.strictEqual(lines(dir).length, 0, 'a check that throws is broken, never violated');
});

test('the hook ignores a tool it was not registered for', () => {
  const dir = project('hook-other-tool');
  check(dir, 'no-todo', { rule: 'CLAUDE.md', check: '() => false' });

  const call = JSON.stringify({ session_id: 's1', tool_name: 'Bash', tool_input: { command: 'ls' } });
  const result = run('rule-check.js', [], { input: call, env: env(dir) });

  assert.strictEqual(result.stdout.trim(), '');
  assert.strictEqual(lines(dir).length, 0);
});

test('needs file rebuilds the whole file for an Edit, where needs added sees only the new text', () => {
  const dir = project('hook-needs');
  const target = write(dir, 'src.js', 'const kept = 1;\nconst old = 2;\n');
  check(dir, 'whole-file', { rule: 'CLAUDE.md', needs: 'file', check: '(p, c) => c.includes("kept")' });
  check(dir, 'added-only', { rule: 'CLAUDE.md', needs: 'added', check: '(p, c) => c.includes("kept")' });

  const call = JSON.stringify({
    session_id: 's1', cwd: '/tmp/demo', tool_name: 'Edit',
    tool_input: { file_path: target, old_string: 'const old = 2;', new_string: 'const fresh = 3;' },
  });
  run('rule-check.js', [], { input: call, env: env(dir) });

  const rows = Object.fromEntries(lines(dir).map((r) => [r.id, r.ok]));
  assert.strictEqual(rows['whole-file'], true, 'the rest of the file is visible');
  assert.strictEqual(rows['added-only'], false, 'only the replacement text is');
});

// ------------------------------------------------------------- the scorecard

test('the scorecard counts, ranks, and states what it did not measure', () => {
  const dir = project('scorecard-report');
  const rule = write(dir, 'rules.md', [
    '- **`broken-often`** The one that keeps failing.',
    '- **`never-relevant`** The one that stopped mattering.',
    '- **`unchecked`** The one no function judges.',
  ].join('\n'));

  check(dir, 'broken-often', { rule, check: '(p, c) => !c.includes("bad")' });
  check(dir, 'never-relevant', { rule, applies: '() => false' });
  check(dir, 'ghost-rule', { rule });

  for (let i = 0; i < 6; i++) run('rule-check.js', [], { input: edit('/x/a.js', 'bad'), env: env(dir) });
  run('rule-check.js', [], { input: edit('/x/a.js', 'fine'), env: env(dir) });

  const report = run('flow/flow.js', ['scorecard'], { env: env(dir) });

  assert.match(report.stdout, /stale: the check names a rule no file defines/);
  assert.match(report.stdout, /ghost-rule/);
  assert.match(report.stdout, /violated most/);
  assert.match(report.stdout, /broken-often\s+measure\s+6\s+7\s+86%/);
  assert.match(report.stdout, /ready for promotion/);
  assert.match(report.stdout, /never applied/);
  assert.match(report.stdout, /never-relevant/);
  // The total counts every rule the clone defines as well as the 3 fixtures, so
  // it moves whenever a rule is added to either CLAUDE.md. Only the measured
  // half is this test's subject.
  assert.match(report.stdout, /2 rules measured, \d+ not measurable/);
  assert.strictEqual(report.code, 0);
});

test('the scorecard names an id its own file defines twice', () => {
  const dir = project('scorecard-duplicate');
  const rule = write(dir, 'rules.md', [
    '## Capture',
    '',
    '**`capture`** Write anything worth keeping.',
    '',
    '- **`no-todo`** Never leave a TODO behind.',
  ].join('\n'));
  check(dir, 'no-todo', { rule, check: '() => true' });

  const report = run('flow/flow.js', ['scorecard'], { env: env(dir) });

  assert.match(report.stdout, /defined twice in one file/);
  assert.match(report.stdout, /capture\s+\(.*rules\.md\)/);
  assert.strictEqual(report.code, 0);
});

test('the scorecard throws away results older than a check that has since changed', () => {
  const dir = project('scorecard-since');
  const rule = write(dir, 'rules.md', '- **`no-todo`** Never leave a TODO behind.');
  check(dir, 'no-todo', { rule, check: '() => false' });

  run('rule-check.js', [], { input: edit('/x/a.js', 'anything'), env: env(dir) });
  assert.match(run('flow/flow.js', ['scorecard'], { env: env(dir) }).stdout, /no-todo\s+measure\s+1\s+1/);

  check(dir, 'no-todo', { rule, since: '2099-01-01', check: '() => false' });
  const after = run('flow/flow.js', ['scorecard'], { env: env(dir) });

  assert.doesNotMatch(after.stdout, /violated most/, 'the old version answered a different question');
  assert.match(after.stdout, /never applied/);
});

test('an empty checks folder reports coverage rather than looking clean', () => {
  const dir = project('scorecard-empty');
  fs.mkdirSync(path.join(dir, 'checks'), { recursive: true });

  const report = run('flow/flow.js', ['scorecard'], { env: env(dir) });

  assert.match(report.stdout, /nothing to report yet/);
  assert.match(report.stdout, /0 rules measured/);
  assert.match(report.stdout, /No checks yet/);
  assert.strictEqual(report.code, 0);
});
