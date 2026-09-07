'use strict';
/**
 * Rule checks: the files under scripts/rule-checks/, and the rule ids they name.
 *
 * The folder is the registry. A check is one file exporting everything about
 * itself, so adding one is adding a file and nothing else. A second list would
 * be a second thing to update, and it goes stale the first time somebody
 * forgets. Flow already made that call for skills.
 *
 * Nothing here runs a check. This file finds them, refuses a malformed one, and
 * reads rule ids back out of the markdown, so staleness can be answered in both
 * directions: a check naming a rule no file defines, and a rule nothing checks.
 *
 * A rule id lives inline in the bold slot where a label used to sit:
 *
 *     - **`no-git-mutations`** No `add`, `commit`, `push`, `checkout`.
 *
 * The id states the rule and the body says only what the id cannot, so nothing
 * is paid twice. A rule is also written as a numbered step or as a plain
 * paragraph, so all three carry an id and all three are read back here.
 * Extracting one rule's text means reading from its own line to the next line
 * that opens a rule at the same indent.
 */

const fs = require('fs');
const path = require('path');

const TIERS = ['measure', 'warn', 'block'];
const NEEDS = ['added', 'file'];

/** Where the checks live. The override exists so a test can point elsewhere. */
const checksDir = () => process.env.FLOW_CHECKS || path.join(__dirname, '..', '..', 'rule-checks');

// ---------------------------------------------------------------- loading

/**
 * Everything a check must declare, and what counts as declared.
 *
 * Validation is strict and the failure is loud, because a check that silently
 * does nothing is worse than no check: the scorecard reports it as measured and
 * nothing was ever measured.
 */
const FIELDS = [
  ['id', (v) => typeof v === 'string' && /^[a-z0-9-]+$/.test(v), 'a lowercase id, letters digits and dashes'],
  ['rule', (v) => typeof v === 'string' && v.length > 0, 'a path to the file holding the rule'],
  ['tier', (v) => TIERS.includes(v), `one of: ${TIERS.join(', ')}`],
  ['applies', (v) => typeof v === 'function', 'a function (path, content)'],
  ['check', (v) => typeof v === 'function', 'a function (path, content)'],
  ['needs', (v) => NEEDS.includes(v), `one of: ${NEEDS.join(', ')}`],
  ['message', (v) => typeof v === 'string' && v.length > 0, 'the one line the agent reads'],
  ['since', (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v), 'a date, YYYY-MM-DD'],
];

function validate(mod, file) {
  const problems = [];
  for (const [field, ok, want] of FIELDS) {
    if (!ok(mod[field])) problems.push(`${path.basename(file)}: ${field} must be ${want}`);
  }
  if (mod.id && path.basename(file, '.js') !== mod.id) {
    problems.push(`${path.basename(file)}: id "${mod.id}" does not match the filename`);
  }
  return problems;
}

/**
 * Every check on disk, and everything wrong with the ones that failed.
 *
 * Problems come back rather than throwing. The hook has to keep working when
 * one check file is broken, and the scorecard is the place that reports it.
 */
function load(dir = checksDir()) {
  const checks = [];
  const problems = [];
  if (!fs.existsSync(dir)) return { checks, problems };

  for (const name of fs.readdirSync(dir).sort()) {
    if (!name.endsWith('.js')) continue;
    const file = path.join(dir, name);
    let mod;
    try {
      mod = require(file);
    } catch (e) {
      problems.push(`${name}: will not load: ${e.message}`);
      continue;
    }
    const bad = validate(mod, file);
    if (bad.length) problems.push(...bad);
    else checks.push({ ...mod, file });
  }
  return { checks, problems };
}

// ---------------------------------------------------------------- rule files

/** A bullet, a numbered step or a paragraph, each opening with its id. */
const ID_LINE = /^(\s*)(?:[-*]\s+|\d+\.\s+)?\*\*`([a-z0-9-]+)`\*\*/;

/** A line that opens a rule of its own, whatever its depth. */
const OPENS_RULE = /^(\s*)(?:[-*]\s|\d+\.\s|\*\*`)/;

/** Every rule id defined in one markdown file, in the order they appear. */
function ruleIds(file) {
  if (!fs.existsSync(file)) return [];
  const ids = [];
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(ID_LINE);
    if (m) ids.push(m[2]);
  }
  return ids;
}

/**
 * One rule's text, from its own line to the next rule no deeper than it is.
 *
 * This is what gets injected when a check fires against a rule whose file never
 * loaded. Telling the agent to go read the file costs a turn and can be
 * skipped; handing it the text cannot.
 */
function ruleText(file, id) {
  if (!fs.existsSync(file)) return null;
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  let start = -1;
  let indent = '';

  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(ID_LINE);
    if (m && m[2] === id) {
      start = i;
      indent = m[1];
      break;
    }
  }
  if (start === -1) return null;

  // A nested rule ends at the next rule that is no deeper than it is, so a
  // sub-bullet stops at the numbered step below it rather than swallowing it.
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    const opens = lines[i].match(OPENS_RULE);
    if (/^#{1,6}\s/.test(lines[i]) || (opens && opens[1].length <= indent.length)) {
      end = i;
      break;
    }
  }
  return lines.slice(start, end).join('\n').trimEnd();
}

/**
 * Resolve a check's `rule` path. Relative paths are read from the Flow clone,
 * so a check written here names `home/CLAUDE.md` rather than an absolute path
 * that only exists on one machine.
 */
function rulePath(rule) {
  return path.isAbsolute(rule) ? rule : path.join(__dirname, '..', '..', '..', rule);
}

module.exports = { TIERS, NEEDS, checksDir, load, ruleIds, ruleText, rulePath };
