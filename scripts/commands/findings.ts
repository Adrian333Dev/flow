/**
 * Findings: what Flow learned, one file per claim (features/findings/), under
 * `flow findings`.
 *
 * `flow findings` lists them, one row each: the path, then the labels. A
 * query narrows by `label:`, `project:` and `wiki:`, and its words rank the
 * rows closest first. `new` files one after the filing check
 * (features/findings/check.ts). `edit` renames one and rewrites its
 * citations, or sets its labels.
 *
 * No `get`: a finding is read with the Read tool, by its path. No `drop`: a
 * false finding is deleted by hand, and git keeps its text.
 */

import { FlowError } from '../shared/error.ts';
import { out, json, readBody } from '../shared/cli.ts';
import type { Action } from '../shared/cli.ts';
import * as paths from '../shared/paths.ts';
import * as query from '../shared/query.ts';
import * as similarity from '../shared/similarity.ts';
import * as store from '../features/tickets/store.ts';
import * as findings from '../features/findings/findings.ts';
import * as check from '../features/findings/check.ts';
import * as citations from '../features/findings/citations.ts';
import type { Finding } from '../features/findings/findings.ts';

const FIELDS = ['label', 'project', 'wiki'];

const MAX_LABELS = 20;

/** The labels a `--label a,b` value names, each checked as a ticket's are. */
function labelsFrom(value: unknown) {
  const labels = store.toLabelList(value).map((l) => l.toLowerCase());
  for (const label of labels) {
    const bad = store.badLabel(label);
    if (bad) throw new FlowError(bad);
  }
  return labels;
}

/** One row: the path, then the labels. */
const row = (f: Finding) => `${paths.shorten(f.file)}${f.data.labels.length ? `   ${f.data.labels.join(', ')}` : ''}`;

const record = (f: Finding, score?: number) => ({
  name: f.name, path: f.file, ...f.place, labels: f.data.labels, updated: f.data.updated,
  ...(score === undefined ? {} : { score: Number(score.toFixed(3)) }),
});

/** Up to `max` rows, then how many more there are. */
function rows(list: Finding[], max: number, more: string) {
  for (const f of list.slice(0, max)) out(`  ${row(f)}`);
  if (list.length > max) out(`  and ${list.length - max} more ${more}`);
}

/** `labels in use: a (3), b (2)`, cut at 20. */
function labelLine(all: Finding[]) {
  const counts = findings.labelCounts(all);
  if (!counts.length) return 'labels in use: none yet';
  const shown = counts.slice(0, MAX_LABELS).map(([l, n]) => `${l} (${n})`).join(', ');
  return `labels in use: ${shown}${counts.length > MAX_LABELS ? `, +${counts.length - MAX_LABELS} more` : ''}`;
}

const listing: Action = {
  args: '[-- "<query>"]',
  summary: 'one row per finding: path, then labels; "label:x project:fw,home wiki:node <words>" narrows it, words rank it',
  query: true,
  run({ query: text }) {
    const terms = query.parse(text, FIELDS);
    const place = (field: string) => terms.filter((t) => t.field === field).flatMap((t) => t.values);
    const projects = place('project');
    const wiki = place('wiki');
    const scoped = projects.length || wiki.length ? { projects, wiki } : {};
    const labelled = query.matcher(terms.filter((t) => t.field === 'label'), { label: (f, v) => f.data.labels.includes(v) });
    const found = findings.read(scoped).filter(labelled);
    const words = terms.filter((t) => !t.field).flatMap((t) => t.values).join(' ');

    if (!words) {
      found.sort((a, b) => b.data.updated.localeCompare(a.data.updated) || a.name.localeCompare(b.name));
      json(found.map((f) => record(f)));
      for (const f of found) out(row(f));
      return 0;
    }
    const ranked = similarity.rank({ title: words }, found.map((f) => ({
      title: f.name.replace(/-/g, ' '), text: f.body, labels: f.data.labels, finding: f,
    })));
    json(ranked.map((r) => record(r.record.finding, r.score)));
    for (const r of ranked.slice(0, check.MAX_ROWS)) out(row(r.record.finding));
    if (ranked.length > check.MAX_ROWS) out(`and ${ranked.length - check.MAX_ROWS} more`);
    return 0;
  },
};

const actions: Record<string, Action> = {};

actions.new = {
  args: '"<title>"',
  summary: 'file one, named for its claim in 4 to 8 words; refused where a finding says nearly the same',
  flags: {
    project: { arg: '<prefix>' },
    wiki: { arg: '<subject>' },
    label: { arg: '<label,label>' },
    body: { arg: '<text|->' },
    force: { bool: true },
  },
  run({ positional, flags, usage }) {
    const [title, ...extra] = positional.map((w) => w.trim());
    if (!title || extra.length) throw new FlowError(`usage: ${usage} "<title>", in quotes`);
    findings.nameOf(title);
    const where = findings.target(flags);
    const draft = { title, body: String(readBody(flags) || ''), labels: labelsFrom(flags.label) };

    const all = findings.read();
    const { close, duplicates } = check.closest(draft, all);
    if (duplicates.length && !flags.force) {
      const lines = duplicates.slice(0, check.MAX_ROWS).map((f) => `  ${row(f)}`).join('\n');
      throw new FlowError(`not filed: ${duplicates.length === 1 ? 'a finding says' : 'findings say'} nearly the same.\n${lines}\n` +
        '  Rewrite it in place. A claim that really differs files with --force.');
    }

    const { finding, index } = findings.create(where, draft);
    const folders = finding.place.wiki ? [] : check.owningFolders(draft);
    json({ finding: record(finding), close: close.map((c) => record(c.finding, c.score)), folders, index });
    out(`filed ${paths.shorten(finding.file)}`);
    if (index) out(`  wrote a stub ${paths.shorten(index)}: fill in what ${finding.place.wiki} is`);
    if (close.length) {
      out('close findings:');
      rows(close.map((c) => c.finding), check.MAX_ROWS, 'close');
    }
    if (folders.length) out(`wiki folders that may own it: ${folders.join(', ')}`);
    out(labelLine([...all, finding]));
    return 0;
  },
};

actions.edit = {
  args: '<name>',
  summary: 'rename one, rewriting every citation of its path, or set its labels',
  flags: {
    title: { arg: '"<claim>"' },
    label: { arg: '<label,label>' },
  },
  run({ positional, flags, usage }) {
    if (!positional[0] || positional.length > 1) throw new FlowError(`usage: ${usage} --title "<claim>" | --label <label,label>`);
    if (flags.title === undefined && flags.label === undefined) throw new FlowError('nothing to change: give --title, --label or both.');
    const finding = findings.find(positional[0]);
    const labels = flags.label === undefined ? undefined : labelsFrom(flags.label);
    const changed: string[] = [];
    let file = finding.file;
    let cited: string[] = [];

    if (flags.title !== undefined) {
      const name = findings.nameOf(String(flags.title).trim());
      if (name !== finding.name) {
        const unique = findings.readAll().filter((f) => f.name === finding.name).length === 1;
        file = findings.rename(finding, name);
        cited = citations.rewrite(finding, name, unique);
        changed.push(`renamed ${finding.name} → ${name}`);
      }
    }
    if (labels) changed.push(`labels: [${finding.data.labels.join(', ')}] → [${labels.join(', ')}]`);
    findings.touch(file, labels, { now: file !== finding.file });

    json({ finding: record(findings.find(file)), citations: cited });
    out(`${paths.shorten(file)}`);
    for (const line of changed) out(`  ${line}`);
    if (cited.length) {
      out(`  citations rewritten in ${cited.length} file${cited.length === 1 ? '' : 's'}:`);
      for (const c of cited) out(`    ${paths.shorten(c)}`);
    }
    return 0;
  },
};

export default {
  summary: 'what Flow learned, one file per claim, in a project, the wiki or ~/.flow',
  list: listing,
  actions,
};
