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
 *
 * A heading is a target too, and its id is the slug of its own text, so
 * `## The turn` is `the-turn`. A check names a whole section that way, and no
 * rule has to be invented to restate a heading. Both kinds share one namespace:
 * an id is unique inside its file whichever kind defines it.
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

/** A heading, level 2 and deeper. The title names the file, never a section. */
const SECTION_LINE = /^(#{2,6})\s+(\S.*?)\s*$/;

/** Lowercase, dashes for everything else. `## The turn` becomes `the-turn`. */
const slug = (text) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

/**
 * Every id one file defines, in the order they appear, each with what it needs
 * to be read back out: a section carries its heading level, a rule its indent.
 */
function scan(file) {
  if (!fs.existsSync(file)) return { lines: [], found: [] };
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  const found = [];
  lines.forEach((line, index) => {
    const heading = line.match(SECTION_LINE);
    if (heading) {
      found.push({ id: slug(heading[2]), index, level: heading[1].length, indent: '' });
      return;
    }
    const rule = line.match(ID_LINE);
    if (rule) found.push({ id: rule[2], index, level: null, indent: rule[1] });
  });
  return { lines, found };
}

/** Every rule id defined in one markdown file, in the order they appear. */
const ruleIds = (file) => scan(file).found.filter((f) => f.level === null).map((f) => f.id);

/** Every section id, which is every heading below the title. */
const sectionIds = (file) => scan(file).found.filter((f) => f.level !== null).map((f) => f.id);

/** Both kinds, since a check names either one and the two share a namespace. */
const ids = (file) => scan(file).found.map((f) => f.id);

/**
 * Every id one file defines more than once.
 *
 * Only ever within one file. Two files defining the same id is normal: a rule
 * shipped in `home/CLAUDE.md` is restated in a project's own rules, and both
 * are the same rule. Twice in one file is a rule nothing can name.
 */
function duplicateIds(file) {
  const seen = new Set();
  const twice = new Set();
  for (const id of ids(file)) {
    if (seen.has(id)) twice.add(id);
    seen.add(id);
  }
  return [...twice];
}

/**
 * One target's text: a rule to the next rule no deeper than it is, a section to
 * the next heading no deeper than it is.
 *
 * This is what gets injected when a check fires against a rule whose file never
 * loaded. Telling the agent to go read the file costs a turn and can be
 * skipped; handing it the text cannot. A section comes back whole, sub-headings
 * and all, because a check naming a section wants what the section governs.
 */
function ruleText(file, id) {
  const { lines, found } = scan(file);
  const target = found.find((f) => f.id === id);
  if (!target) return null;

  const start = target.index;
  let end = lines.length;

  if (target.level !== null) {
    const next = found.find((f) => f.index > start && f.level !== null && f.level <= target.level);
    if (next) end = next.index;
  } else {
    // A nested rule ends at the next rule that is no deeper than it is, so a
    // sub-bullet stops at the numbered step below it rather than swallowing it.
    for (let i = start + 1; i < lines.length; i++) {
      const opens = lines[i].match(OPENS_RULE);
      if (SECTION_LINE.test(lines[i]) || /^#\s/.test(lines[i])
        || (opens && opens[1].length <= target.indent.length)) {
        end = i;
        break;
      }
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

module.exports = {
  TIERS, NEEDS, checksDir, load,
  ruleIds, sectionIds, ids, duplicateIds, ruleText, rulePath,
};
