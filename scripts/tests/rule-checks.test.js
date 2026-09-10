'use strict';
/**
 * The shipped checks in scripts/rule-checks/, run against real code.
 *
 * Every example here was taken from this repo, most of them out of git history
 * rather than written for the test. `references/write-checks.md` bans an
 * invented violation for a reason: an invented one proves the check matches the
 * pattern you had in mind, never that it matches what an agent actually writes.
 */

const { test } = require('node:test');
const assert = require('node:assert');
const path = require('node:path');

const jsAndTs = require(path.join(__dirname, '..', 'rule-checks', 'js-and-ts'));

// ------------------------------------------------------------- js-and-ts

/** store.js before 2026-09-10, when the run was converted to a block. */
const VIOLATION_FUNCTION = `// \`tickets\` is passed in when the caller already read the pool: at a few
// thousand tickets a second scan is the most expensive thing a command does.
function createTicket(root, { title, type, priority, parent, deps, tickets }) {`;

/** cases.js before the same conversion: an arrow is a function too. */
const VIOLATION_ARROW = `// FLOW_HOME mirrors FLOW_PROJECT: the default is the installed location, and an
// override exists so the tool can be exercised without writing to it.
const flowHome = () => process.env.FLOW_HOME || path.join(os.homedir(), '.flow');`;

/** frontmatter.js as it reads now. */
const CLEAN_BLOCK = `/** Drops a trailing \` # comment\`, but not a # inside a quoted string. */
function stripComment(s) {`;

/** graph.js: 3 comment lines on an import, which is the noise to stay out of. */
const SKIP_REQUIRE = `// Every property of a status is a column in one table: see statuses.js. These
// are that table's columns, read as sets: SATISFYING unblocks a dependent, LIVE
// is still repairable, OPEN still owes work, IN_FLIGHT is being worked on now.
const statuses = require('./statuses');`;

/** board.js as it reads now: a plain value, which the rule never names. */
const SKIP_VALUE = `// 10, not 15: \`next\` answers a question, and a longer answer is a second list
// to triage. The count of what was hidden always prints: a silent truncation
// is the only way a ceiling does harm.
const NEXT_LIMIT = 10;`;

test('a run of line comments on a function is a violation', () => {
  assert.strictEqual(jsAndTs.applies('scripts/flow/lib/store.js', VIOLATION_FUNCTION), true);
  assert.strictEqual(jsAndTs.check('scripts/flow/lib/store.js', VIOLATION_FUNCTION), false);
  assert.deepStrictEqual(jsAndTs.offenders(VIOLATION_FUNCTION), [3]);
});

test('an arrow bound to a name counts as a function', () => {
  assert.strictEqual(jsAndTs.check('scripts/flow/lib/cases.js', VIOLATION_ARROW), false);
});

test('the block form passes', () => {
  assert.strictEqual(jsAndTs.applies('scripts/flow/lib/frontmatter.js', CLEAN_BLOCK), true);
  assert.strictEqual(jsAndTs.check('scripts/flow/lib/frontmatter.js', CLEAN_BLOCK), true);
});

test('a const holding a value or an import never applies', () => {
  for (const text of [SKIP_REQUIRE, SKIP_VALUE]) {
    assert.strictEqual(jsAndTs.applies('scripts/flow/lib/graph.js', text), false);
    assert.deepStrictEqual(jsAndTs.offenders(text), []);
  }
});

test('one line above a declaration is left alone', () => {
  const single = `// Drops a trailing \` # comment\`, but not a # inside a quoted string.
function stripComment(s) {`;
  assert.strictEqual(jsAndTs.check('a.js', single), true);
});

test('line comments inside a body are the right form', () => {
  const body = `function parseArgs() {
  // everything after -- is prose for the model
  // and never a path
  const args = process.argv.slice(2);
}`;
  assert.strictEqual(jsAndTs.check('a.js', body), true);
});

test('only javascript and typescript apply', () => {
  for (const file of ['notes.md', 'q.sql', 'run.sh', 'a.py']) {
    assert.strictEqual(jsAndTs.applies(file, VIOLATION_FUNCTION), false);
  }
  for (const file of ['a.js', 'a.mjs', 'a.cjs', 'a.jsx', 'a.ts', 'a.tsx']) {
    assert.strictEqual(jsAndTs.applies(file, VIOLATION_FUNCTION), true);
  }
});

test('it declares the fields the loader demands, and names a real rule', () => {
  const checks = require(path.join(__dirname, '..', 'flow', 'lib', 'checks'));
  const { checks: loaded, problems } = checks.load();
  assert.deepStrictEqual(problems, []);
  const mine = loaded.find((c) => c.id === 'js-and-ts');
  assert.ok(mine, 'js-and-ts loads');
  assert.strictEqual(mine.tier, 'measure');
  assert.ok(checks.ruleText(checks.rulePath(mine.rule), mine.id), 'the rule text is quotable');
});
