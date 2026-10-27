/**
 * The filing check `flow findings new` runs before it writes: is this claim
 * filed already, and does a wiki folder own its subject?
 *
 * It ranks the findings by shared words and rare labels (shared/similarity.ts)
 * and reads findings only, never wiki pages or reports. 2 bars, tuned on
 * 153 findings (2026-10-27): the fw-205 / fw-207 pair, one lesson filed twice
 * 14 minutes apart, scores 0.54. A finding's closest neighbour scores 0.19 at
 * the median, and 0.30 at the top tenth.
 *
 *   below RELATED          nothing printed
 *   RELATED to DUPLICATE   written, the close rows printed
 *   DUPLICATE and above    refused until --force
 */

import fs from 'node:fs';
import path from 'node:path';
import * as similarity from '../../shared/similarity.ts';
import * as findings from './findings.ts';
import type { Finding } from './findings.ts';

const RELATED = 0.25;
const DUPLICATE = 0.45;

const MAX_ROWS = 20;
const MAX_FOLDERS = 3;

interface Draft {
  title: string;
  body: string;
  labels: string[];
}

/** The findings at or past the lower bar, closest first, and the ones past the higher. */
function closest(draft: Draft, all: Finding[]) {
  const ranked = similarity.rank({ title: draft.title, text: draft.body, labels: draft.labels }, all.map((f) => ({
    title: f.name.replace(/-/g, ' '), text: f.body, labels: f.data.labels, finding: f,
  })));
  const close = ranked.filter((r) => r.score >= RELATED);
  return {
    close: close.map((r) => ({ finding: r.record.finding, score: r.score })),
    duplicates: close.filter((r) => r.score >= DUPLICATE).map((r) => r.record.finding),
  };
}

/**
 * Up to 3 wiki folders that may own the claim: first the ones whose name is
 * among its words, then the ones whose `index.md` shares enough of them.
 */
function owningFolders(draft: Draft) {
  const mine = new Set(similarity.words(`${draft.title} ${draft.body}`));
  const subjects = findings.subjects();
  const named = subjects.filter((s) => {
    const parts = similarity.words(s.replace(/[._-]/g, ' '));
    return parts.length > 0 && parts.every((p) => mine.has(p));
  });
  const indexes = subjects.filter((s) => !named.includes(s)).map((s) => {
    const file = path.join(findings.wikiDir(), s, 'index.md');
    return { subject: s, text: fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '' };
  }).filter((x) => x.text);
  const byIndex = similarity.rank({ title: draft.title, text: draft.body }, indexes)
    .filter((r) => r.score >= RELATED)
    .map((r) => r.record.subject);
  return [...named, ...byIndex].slice(0, MAX_FOLDERS);
}

export { RELATED, DUPLICATE, MAX_ROWS, closest, owningFolders };
