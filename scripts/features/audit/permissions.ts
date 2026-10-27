/**
 * The permission log, counted: `flow audit permissions`.
 *
 * Reads `~/.flow/logs/permissions/<year>-<month>.jsonl`, which the pane in
 * Flow's mod appends to, and never the transcript index. A line holds the
 * source of an ask (`guard`, `rule`, `core`), its headline, and the answer.
 *
 * The target is zero asks in a normal ticket build apart from push and
 * publish. Those are the asks the shipped `permissions.ask` rules raise,
 * read from `home/settings.json` so the list lives once.
 */

import fs from 'node:fs';
import path from 'node:path';
import * as logs from '../logs/logs.ts';
import * as paths from '../../shared/paths.ts';
import * as settings from '../../shared/settings.ts';
import { table } from '../../shared/render.ts';
import { FlowError } from '../../shared/error.ts';

const NAME = 'permissions';
const SOURCES = ['guard', 'rule', 'core'];
const AUTO = 'auto-allow';

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

/** Every line of every month file, split into the ones that parse and a count of the ones that do not. */
function read(home) {
  const dir = path.join(logs.dir(home), NAME);
  if (!fs.existsSync(dir)) {
    throw new FlowError(
      `no permission log at ${paths.shorten(dir)}.\n` +
      '  Flow\'s mod writes it while the mod is loaded, and nothing is logged without it.'
    );
  }
  const lines : any[] = [];
  let skipped = 0;
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.jsonl')).sort()) {
    for (const text of fs.readFileSync(path.join(dir, file), 'utf8').split('\n')) {
      if (!text.trim()) continue;
      let entry: any = null;
      try {
        entry = JSON.parse(text);
      } catch {
        // counted below
      }
      if (entry && typeof entry.source === 'string' && typeof entry.answer === 'string') lines.push(entry);
      else skipped++;
    }
  }
  return { lines, skipped };
}

/** `until` compares by prefix, so `2026-10-12` keeps the whole day. */
function matches(entry, { id, project, since, until }) {
  const at = String(entry.at || '');
  if (id && !String(entry.session || '').startsWith(id)) return false;
  if (project && !String(entry.project || '').includes(project)) return false;
  if (since && at < since) return false;
  if (until && at.slice(0, until.length) > until) return false;
  return true;
}

/** The rules that ask before a push, a save (which pushes) and a publish. */
const targetRules = () =>
  (settings.read(path.join(paths.cloneRoot(), 'home', 'settings.json')).permissions || {}).ask || [];

const tally = (map, key, isAuto) => {
  const row = map.get(key) || { asks: 0, auto: 0 };
  row[isAuto ? 'auto' : 'asks']++;
  map.set(key, row);
};

const when = (at) => `${String(at).slice(0, 10)} ${String(at).slice(11, 16)}`;

/**
 * The counts `flow audit permissions` reads, every row of them: `--limit`
 * cuts the text alone, so `--json` carries the whole list.
 */
function viewData({ home, id, project, since, until }: Record<string, any>) {
  const { lines: all, skipped } = read(home);
  const lines = all.filter((entry) => matches(entry, { id, project, since, until }));
  const asks = lines.filter((entry) => entry.answer !== AUTO);

  const bySource = new Map(SOURCES.map((source) => [source, { asks: 0, auto: 0 }]));
  const byHeadline = new Map();
  for (const entry of lines) {
    tally(bySource, entry.source, entry.answer === AUTO);
    tally(byHeadline, entry.headline || '-', entry.answer === AUTO);
  }
  const headlines = [...byHeadline]
    .sort(([a, x], [b, y]) => y.asks - x.asks || y.auto - x.auto || (a < b ? -1 : a > b ? 1 : 0));

  const exempt = targetRules();
  const outside = asks
    .filter((entry) => !(entry.source === 'rule' && exempt.includes(entry.rule)))
    .sort((a, b) => (String(a.at) < String(b.at) ? -1 : String(a.at) > String(b.at) ? 1 : 0));

  return {
    lines: lines.length,
    skipped,
    asks: asks.length,
    autoAllowed: lines.length - asks.length,
    bySource: [...bySource].map(([source, row]) => ({ source, ...row })),
    byHeadline: headlines.map(([headline, row]) => ({ headline, ...row })),
    outside,
  };
}

/** The text `flow audit permissions` prints. */
function view({ limit = 20, ...options }: Record<string, any>) {
  const { lines, skipped, asks, autoAllowed, bySource, byHeadline: headlines, outside } = viewData(options);

  const out = [
    `permission log: ${plural(lines, 'line')}, ${skipped} skipped (did not parse)`,
    `${plural(asks, 'ask')} · ${autoAllowed} auto-allowed`,
  ];

  if (lines) {
    out.push('', 'BY SOURCE');
    out.push(table(['SOURCE', 'ASKS', 'AUTO-ALLOWED'], bySource.map((row) => [row.source, row.asks, row.auto])));

    out.push('', 'BY HEADLINE');
    out.push(table(['ASKS', 'AUTO', 'HEADLINE'],
      headlines.slice(0, limit).map((row) => [row.asks, row.auto, row.headline])));
    if (headlines.length > limit) {
      out.push(`${limit} of ${headlines.length} headlines shown. --limit ${headlines.length} for all.`);
    }
  }

  out.push('', 'THE TARGET: asks other than push and publish');
  if (!outside.length) {
    out.push('0 asks other than push and publish.');
  } else {
    out.push(`${plural(outside.length, 'ask')} outside the list:`);
    out.push(table(['AT', 'PROJECT', 'SOURCE', 'ANSWER', 'HEADLINE'],
      outside.slice(0, limit).map((e) => [when(e.at), e.project || '-', e.source, e.answer, e.headline || '-'])));
    if (outside.length > limit) out.push(`${limit} of ${outside.length} shown. --limit ${outside.length} for all.`);
  }
  return out.join('\n');
}

export { view, viewData };
