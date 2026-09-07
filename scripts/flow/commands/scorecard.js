'use strict';
/**
 * `flow scorecard`: how the rule checks are doing, across every session.
 *
 * Reads every file under ~/.flow/scorecards/, adds the counts, and prints four
 * lists: checks pointing at a rule nobody defines, the rules broken most, the
 * ones ready to stop measuring and start warning, and the ones that load every
 * session and never once apply.
 *
 * It states its own coverage. Without that line a clean report reads as a clean
 * session, when the truth is usually that most rules were never checked at all.
 *
 * A result recorded before a check last changed is dropped. `since` on the
 * check is what says when that was, so rewriting a check throws away the counts
 * the old version produced rather than averaging two different questions.
 *
 * The command only reads. Acting on what it says means editing a check file,
 * and that needs approval like any other change.
 */

const fs = require('fs');
const path = require('path');
const { out } = require('../lib/cli');
const render = require('../lib/render');
const checks = require('../lib/checks');
const scorecard = require('../lib/scorecard');

// Both are guesses until real data exists. A rule broken 5 times in 8 chances
// is a rule the agent is not reading; one broken twice is a rule it usually
// follows.
const MIN_VIOLATIONS = 5;
const MIN_RATE = 0.6;

const clone = () => path.join(__dirname, '..', '..', '..');

/**
 * Every file that can define a rule id: the two always-loaded files and
 * everything in rules/. Nowhere else holds one, so nowhere else is scanned.
 */
function ruleFiles() {
  const root = clone();
  const files = [path.join(root, 'home', 'CLAUDE.md'), path.join(root, 'CLAUDE.md')];
  const dir = path.join(root, 'rules');
  if (fs.existsSync(dir)) {
    for (const name of fs.readdirSync(dir).sort()) {
      if (name.endsWith('.md')) files.push(path.join(dir, name));
    }
  }
  return files.filter((f) => fs.existsSync(f));
}

/**
 * Every rule id defined anywhere, mapped to the file that defines it.
 *
 * The files a check points at are scanned too, not only the ones in the known
 * places. A project keeping its own rules under .claude/rules/ is the case: a
 * check naming one of those is not stale just because the file sits outside the
 * Flow clone.
 */
function definedRules(all = []) {
  const map = new Map();
  const files = [...ruleFiles(), ...all.map((c) => checks.rulePath(c.rule))];
  for (const file of [...new Set(files)]) {
    for (const id of checks.ruleIds(file)) if (!map.has(id)) map.set(id, file);
  }
  return map;
}

/**
 * Counts per check id, ignoring anything recorded before the check last
 * changed. The comparison is against the check on disk now, never the `since`
 * stored on the row: the row carries which version produced it, and the
 * question is whether that version is still the one being asked.
 */
function tally(all, rows) {
  const counts = new Map(all.map((c) => [c.id, { relevant: 0, violations: 0 }]));
  const since = new Map(all.map((c) => [c.id, c.since]));
  for (const row of rows) {
    if (row.kind !== 'result') continue;
    const seen = counts.get(row.id);
    if (!seen) continue;
    if (row.at && row.at.slice(0, 10) < since.get(row.id)) continue;
    seen.relevant += 1;
    if (row.ok === false) seen.violations += 1;
  }
  return counts;
}

const rate = (c) => (c.relevant ? c.violations / c.relevant : 0);
const pct = (c) => (c.relevant ? `${Math.round(rate(c) * 100)}%` : '-');

function section(title, lines) {
  return lines.length ? [`${title}`, render.indent(lines.join('\n')), ''] : [];
}

const actions = {};

actions.scorecard = {
  section: 'rules',
  summary: 'how the rule checks are doing, across every session',
  run() {
    const { checks: all, problems } = checks.load();
    const defined = definedRules(all);
    const rows = scorecard.readAll();
    const counts = tally(all, rows);
    const lines = [];

    // A check that will not load is the whole report. Printed under the counts
    // it reads as a footnote, and the counts it should have produced are the
    // ones missing from them.
    lines.push(...section('broken check files', problems));

    lines.push(...section('stale: the check names a rule no file defines',
      all.filter((c) => !defined.has(c.id)).map((c) => `${c.id}  (${c.rule})`)));

    const violated = all
      .map((c) => ({ c, n: counts.get(c.id) }))
      .filter((r) => r.n.violations > 0)
      .sort((a, b) => b.n.violations - a.n.violations);
    lines.push(...section('violated most', violated.length
      ? [render.table(['RULE', 'TIER', 'BROKEN', 'OF', 'RATE'],
        violated.map(({ c, n }) => [c.id, c.tier, n.violations, n.relevant, pct(n)]))]
      : []));

    lines.push(...section(`ready for promotion: measure to warn, past ${MIN_VIOLATIONS} and ${Math.round(MIN_RATE * 100)}%`,
      all.filter((c) => c.tier === 'measure')
        .filter((c) => counts.get(c.id).violations >= MIN_VIOLATIONS && rate(counts.get(c.id)) >= MIN_RATE)
        .map((c) => `${c.id}  ${counts.get(c.id).violations} of ${counts.get(c.id).relevant}`)));

    // Never violated is not this list. A rule only gets written after a real
    // mistake, so zero violations means the fix took. Never *relevant* is the
    // signal: the situation the rule governs stopped happening.
    lines.push(...section('never applied: loaded every session, never once relevant',
      all.filter((c) => counts.get(c.id).relevant === 0).map((c) => c.id)));

    const measured = all.filter((c) => defined.has(c.id)).length;
    const sessions = new Set(rows.filter((r) => r.kind === 'result').map((r) => r.at?.slice(0, 10))).size;

    if (!lines.length) out('nothing to report yet.');
    else out(lines.join('\n').trimEnd());

    out(`\n${measured} rules measured, ${defined.size - measured} not measurable. ` +
      `${rows.filter((r) => r.kind === 'result').length} results over ${sessions} days.`);
    if (!all.length) out(`No checks yet. One file each in ${checks.checksDir()}.`);
    return 0;
  },
};

module.exports = actions;
