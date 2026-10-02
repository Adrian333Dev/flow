'use strict';
/**
 * Recorded failures: the one group that works outside a project, because the
 * payoff is seeing one failure three times rather than once per repo.
 *
 * No `drop`. A recorded failure is never removed: keeping it is the whole
 * reason for writing it down.
 */

const { FlowError } = require('../lib/error');
const { out, readBody } = require('../lib/cli');
const store = require('../lib/tickets/store');
const cases = require('../lib/cases');
const { table, indent } = require('../lib/render');

/**
 * The index that decides where a new case goes. One line per issue, because it
 * is read before every create: the rules are here because "is my failure this
 * one?" is answered by the rule that failed far more often than by the name.
 */
function issueTable(issues) {
  if (issues.length === 0) return 'no issues yet: the first study case creates one.';
  return table(
    ['ISSUE', 'CASES', 'OPEN', 'LATEST', 'RULES'],
    issues.map((i) => [i.issue, i.total, i.open, i.latest || '-', i.rules.length ? i.rules.join('; ') : '-'])
  );
}

function caseList(list) {
  if (list.length === 0) return 'no study cases.';

  const byIssue = new Map();
  for (const c of list) {
    if (!byIssue.has(c.issue)) byIssue.set(c.issue, []);
    byIssue.get(c.issue).push(c);
  }

  const lines = [];
  for (const [issue, filed] of [...byIssue.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    lines.push(`${issue} (${filed.length})`);
    lines.push(indent(table(
      ['DATE', 'STATUS', 'CASE', 'RULE', 'PROJECT'],
      filed.map((c) => [c.data.date || '-', c.data.status, c.slug, c.data.rule || '-', c.data.project || '-'])
    )));
    lines.push('');
  }
  return lines.join('\n').trimEnd();
}

const actions = {};

/**
 * The issue is the folder, and the folder is the whole mechanism: 3 cases of
 * one failure only add up while they share a name. So `--issue` is required, it
 * is slugified rather than trusted, and a near-miss refuses.
 */
actions.new = {
  args: '"<title>"',
  summary: 'record one',
  flags: {
    issue: { required: true, arg: '<issue>', missing: '--issue names the kind of failure, not this instance of it. See the ones that exist: flow cases issues' },
    rule: { arg: '"<rule>"' },
    body: { arg: '<text|->' },
    force: { bool: true },
  },
  run({ positional, flags, usage }) {
    const title = positional.join(' ').trim();
    if (!title) throw new FlowError(`usage: ${usage} "<title>" --issue <issue>`);

    const issue = store.slugify(flags.issue);
    const names = cases.readIssues().map((i) => i.issue);

    if (!names.includes(issue)) {
      const near = cases.nearMatches(issue, names);
      if (near.length && !flags.force) {
        throw new FlowError(
          `"${issue}" is close to an issue that already exists:\n` +
          near.map((n) => `  ${n}`).join('\n') +
          '\n\nOne failure, one folder: a second spelling splits the count and nothing errors.\n' +
          `  Reuse it:           flow cases new "${title}" --issue ${near[0]}\n` +
          `  A new kind, really: flow cases new "${title}" --issue ${issue} --force`
        );
      }
    }

    const body = readBody(flags);
    const c = cases.createCase({ issue, title, rule: flags.rule, body });
    out(`created ${c.issue}/${c.name}`);
    out(`        ${c.file}`);
    if (c.data.project) out(`        project: ${c.data.project}`);
    if (c.data.model) out(`        model: ${c.data.model}${c.data.effort ? `, effort ${c.data.effort}` : ''}`);
    if (c.data.rule) out(`        rule: ${c.data.rule}`);
    if (body == null) out('\nPaste the artifact in now, verbatim. The analysis waits.');
    return 0;
  },
};

actions.ls = {
  summary: 'list many, filtered',
  flags: {
    issue: { arg: '<issue>' },
    status: { values: cases.CASE_STATUSES, arg: '<status>' },
  },
  run({ flags }) {
    const all = cases.readCases();
    let list = all;
    if (flags.issue) {
      const issue = store.slugify(flags.issue);
      list = list.filter((c) => c.issue === issue);
    }
    if (flags.status) list = list.filter((c) => c.data.status === flags.status);

    out(caseList(list));
    if (list.length) out(`\n${list.length} of ${all.length}.`);
    return 0;
  },
};

actions.get = {
  args: '<ref>',
  summary: 'show one in full',
  run({ positional, usage }) {
    if (!positional[0]) throw new FlowError(`usage: ${usage} <ref>`);
    const c = cases.findCase(cases.readCases(), positional[0]);
    out(`${c.issue}/${c.name}   ${c.data.status}`);
    out(`  ${c.file}`);
    if (c.data.rule) out(`  rule: ${c.data.rule}`);
    if (c.data.project) out(`  project: ${c.data.project}`);
    if (c.data.model) out(`  model: ${c.data.model}`);
    if (c.data.effort) out(`  effort: ${c.data.effort}`);
    if (c.data.fix) out(`  fix: ${c.data.fix}`);
    out('');
    out(c.body.trim());
    return 0;
  },
};

actions.edit = {
  args: '<ref>',
  summary: 'change a field',
  flags: {
    status: { values: cases.CASE_STATUSES, arg: '<status>' },
    by: { arg: '<file>' },
    rule: { arg: '"<rule>"' },
  },
  run({ positional, flags, usage }) {
    if (!positional[0]) throw new FlowError(`usage: ${usage} <ref> --status fixed --by <file>`);

    const c = cases.findCase(cases.readCases(), positional[0]);
    const changes = [];

    if (flags.rule !== undefined) {
      changes.push(`rule: ${c.data.rule || '-'} → ${flags.rule}`);
      c.data.rule = String(flags.rule).trim();
    }

    if (flags.status === 'fixed') {
      // A fix nobody can point at is not a fix: the file that changed is the
      // only evidence the rule actually moved.
      if (!flags.by && !c.data.fix) throw new FlowError('marking a case fixed needs --by <the file that changed>.');
      if (c.data.status === 'fixed' && !flags.by) {
        out(`${c.issue}/${c.name} is already fixed by ${c.data.fix || '-'}.`);
        return 0;
      }
      changes.push(`status: ${c.data.status} → fixed`);
      c.data.status = 'fixed';
      if (flags.by) {
        changes.push(`fix: ${c.data.fix || '-'} → ${flags.by}`);
        c.data.fix = String(flags.by).trim();
      }
    } else if (flags.status === 'open') {
      changes.push(`status: ${c.data.status} → open`);
      c.data.status = 'open';
      c.data.fix = '';
    }

    if (!changes.length) throw new FlowError('nothing to change: pass --status or --rule.');

    cases.writeCase(c);
    out(`${c.issue}/${c.name}\n  ${changes.join('\n  ')}`);

    const stillOpen = cases.readCases().filter((x) => x.issue === c.issue && x.data.status === 'open');
    if (stillOpen.length) out(`\n${stillOpen.length} still open in ${c.issue}.`);
    return 0;
  },
};

/**
 * Read before recording one, so a repeat failure lands in the folder it already
 * has instead of a second spelling of it.
 */
actions.issues = {
  summary: 'every issue, its count, and the rules that failed',
  run() {
    const issues = cases.readIssues();
    out(issueTable(issues));
    if (issues.length) {
      const total = issues.reduce((n, i) => n + i.total, 0);
      out(`\n${issues.length} issue${issues.length === 1 ? '' : 's'}, ${total} case${total === 1 ? '' : 's'}  ${cases.casesDir()}`);
    }
    return 0;
  },
};

module.exports = { summary: 'recorded failures, global and filed by issue', default: 'get', actions };
