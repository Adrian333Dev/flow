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
const { table } = require('../lib/render');

/**
 * The index that decides where a new case goes. One line per type, because it
 * is read before every create: the rules are here because "is my failure this
 * one?" is answered by the rule that failed far more often than by the name.
 */
function typeTable(types) {
  if (types.length === 0) return 'no types yet: the first study case creates one.';
  return table(
    ['TYPE', 'CASES', 'OPEN', 'LATEST', 'RULES'],
    types.map((t) => [t.type, t.total, t.open, t.latest || '-', t.rules.length ? t.rules.join('; ') : '-'])
  );
}

function caseTable(list) {
  return table(
    ['DATE', 'STATUS', 'CASE', 'RULE', 'PROJECT'],
    list.map((c) => [c.data.date || '-', c.data.status, c.slug, c.data.rule || '-', c.data.project || '-'])
  );
}

const actions = {};

/**
 * The type is the folder, and the folder is the whole mechanism: 3 cases of
 * one failure only add up while they share a name. So `--type` is required, it
 * is slugified rather than trusted, and a near-miss refuses.
 */
actions.new = {
  args: '"<title>"',
  summary: 'record one',
  flags: {
    type: { required: true, arg: '<type>', missing: '--type names the type of failure, not this instance of it. See the ones that exist: flow cases' },
    rule: { arg: '"<rule>"' },
    body: { arg: '<text|->' },
    force: { bool: true },
  },
  run({ positional, flags, usage }) {
    const title = positional.join(' ').trim();
    if (!title) throw new FlowError(`usage: ${usage} "<title>" --type <type>`);

    const type = store.slugify(flags.type);
    const names = cases.readTypes().map((t) => t.type);

    if (!names.includes(type)) {
      const near = cases.nearMatches(type, names);
      if (near.length && !flags.force) {
        throw new FlowError(
          `"${type}" is close to a type that already exists:\n` +
          near.map((n) => `  ${n}`).join('\n') +
          '\n\nOne failure, one folder: a second spelling splits the count and nothing errors.\n' +
          `  Reuse it:           flow cases new "${title}" --type ${near[0]}\n` +
          `  A new type, really: flow cases new "${title}" --type ${type} --force`
        );
      }
    }

    const body = readBody(flags);
    const c = cases.createCase({ type, title, rule: flags.rule, body });
    out(`created ${c.type}/${c.name}`);
    out(`        ${c.file}`);
    if (c.data.project) out(`        project: ${c.data.project}`);
    if (c.data.model) out(`        model: ${c.data.model}${c.data.effort ? `, effort ${c.data.effort}` : ''}`);
    if (c.data.rule) out(`        rule: ${c.data.rule}`);
    if (body == null) out('\nPaste the artifact in now, verbatim. The analysis waits.');
    return 0;
  },
};

/**
 * The group's default, so bare `flow cases` and `flow cases <type>` both reach
 * it. Bare is the index read before every create. `--status` filters one
 * type's cases, and refuses in the bare form rather than being ignored.
 */
actions.ls = {
  args: '[<type>]',
  summary: 'every type with its counts, or the cases of one type',
  flags: {
    status: { values: cases.CASE_STATUSES, arg: '<status>' },
  },
  run({ positional, flags, usage }) {
    const [name, ...extra] = positional;
    if (extra.length) throw new FlowError(`${usage} takes one type.`);

    if (!name) {
      if (flags.status) throw new FlowError('--status filters the cases of one type: flow cases <type> --status open');
      const types = cases.readTypes();
      out(typeTable(types));
      if (types.length) {
        const total = types.reduce((n, t) => n + t.total, 0);
        out(`\n${types.length} type${types.length === 1 ? '' : 's'}, ${total} case${total === 1 ? '' : 's'}  ${cases.casesDir()}`);
      }
      return 0;
    }

    const type = store.slugify(name);
    if (!cases.readTypes().some((t) => t.type === type)) {
      throw new FlowError(`no type "${name}". See the ones that exist: flow cases`);
    }

    const all = cases.readCases().filter((c) => c.type === type);
    const list = flags.status ? all.filter((c) => c.data.status === flags.status) : all;
    if (!list.length) {
      out(`no ${flags.status ? `${flags.status} ` : ''}cases in ${type}.`);
      return 0;
    }

    out(caseTable(list));
    out(`\n${flags.status ? `${list.length} of ${all.length}` : list.length} in ${type}.`);
    return 0;
  },
};

actions.get = {
  args: '<ref>',
  summary: 'show one in full',
  run({ positional, usage }) {
    if (!positional[0]) throw new FlowError(`usage: ${usage} <ref>`);
    const c = cases.findCase(cases.readCases(), positional[0]);
    out(`${c.type}/${c.name}   ${c.data.status}`);
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
        out(`${c.type}/${c.name} is already fixed by ${c.data.fix || '-'}.`);
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
    out(`${c.type}/${c.name}\n  ${changes.join('\n  ')}`);

    const stillOpen = cases.readCases().filter((x) => x.type === c.type && x.data.status === 'open');
    if (stillOpen.length) out(`\n${stillOpen.length} still open in ${c.type}.`);
    return 0;
  },
};

module.exports = { summary: 'recorded failures, global and filed by type', default: 'ls', actions };
