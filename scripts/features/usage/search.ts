/**
 * `flow search`: which wiki folders and research reports hold what a
 * situation needs, closest first.
 *
 * A wiki folder is ranked by its name, its `index.md`, its page names and its
 * findings' names. A research report is ranked by its topic, its file name and
 * its text. The ranking is the one `flow findings new` checks duplicates with
 * (shared/similarity.ts), so a word only one place holds counts the most.
 */

import fs from 'node:fs';
import path from 'node:path';
import * as similarity from '../../shared/similarity.ts';
import * as paths from '../../shared/paths.ts';
import * as findings from '../findings/findings.ts';
import * as store from '../tickets/store.ts';

interface Hit {
  path: string;
  /** What the place is about: an `index.md`'s first line of text, a report's heading. */
  about: string;
}

const read = (file: string) => {
  try {
    return fs.readFileSync(file, 'utf8');
  } catch {
    return '';
  }
};

const list = (dir: string) => {
  try {
    return fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }
};

/** The first line of a markdown text that says something: a heading or a sentence, past the front matter. */
function firstLine(text: string) {
  const body = text.replace(/^---\n[\s\S]*?\n---\n/, '');
  const lines = body.split('\n').map((l) => l.trim()).filter(Boolean);
  const heading = lines.find((l) => l.startsWith('# '));
  const sentence = lines.find((l) => !l.startsWith('#'));
  return (heading ? heading.slice(2) : sentence || '').slice(0, 120);
}

const spaced = (name: string) => name.replace(/\.md$/, '').replace(/[._-]+/g, ' ');

/** One record per wiki folder. */
function wikiRecords() {
  return findings.subjects().map((subject) => {
    const dir = path.join(findings.wikiDir(), subject);
    const index = read(path.join(dir, 'index.md'));
    const pages = list(dir).filter((d) => d.isFile() && d.name.endsWith('.md') && d.name !== 'index.md').map((d) => spaced(d.name));
    const claims = list(path.join(dir, 'findings')).filter((d) => d.name.endsWith('.md')).map((d) => spaced(d.name));
    const about = (index.split('\n').find((l) => /^[A-Za-z]/.test(l.trim())) || '').trim().slice(0, 120);
    return { title: spaced(subject), text: [index, ...pages, ...claims].join('\n'), hit: { path: `${paths.shorten(dir)}/`, about } };
  });
}

// A report sits in its topic folder or one folder below it. Deeper files are copies a report collected, never reports.
const REPORT_DEPTH = 2;

// A topic shows its closest reports up to here, so one big topic cannot fill the list.
const PER_TOPIC = 3;

// Below this score a place shares only a common word with the search.
const MIN_SCORE = 0.08;

/** Every markdown report under a research folder: `<topic>/<report>.md` and `<topic>/<folder>/<report>.md`. */
function reports(dir: string, topic = '', depth = 0): { file: string; topic: string }[] {
  return list(dir).flatMap((d) => {
    const at = path.join(dir, d.name);
    if (d.isDirectory()) return depth < REPORT_DEPTH ? reports(at, topic || d.name, depth + 1) : [];
    return d.name.endsWith('.md') ? [{ file: at, topic }] : [];
  });
}

/** One record per research report: the Flow home's, and this project's shown from its root. */
function researchRecords(root: string | null) {
  const home = path.join(store.homeRoot(), 'research');
  const here = root ? path.join(store.recordsDir(root), 'research') : null;
  // `.flow/` links into the Flow home, so a project's report shows by the path the agent reads it at.
  const shown = (file: string) => (here && file.startsWith(here) ? path.join('.flow', 'research', path.relative(here, file)) : paths.shorten(file));
  return [...new Set([home, here].filter((d): d is string => !!d))].flatMap((dir) => reports(dir)).map(({ file, topic }) => {
    const text = read(file);
    return { title: `${spaced(topic)} ${spaced(path.basename(file))}`, text, topic, hit: { path: shown(file), about: firstLine(text) } };
  });
}

/** The places closest to `words`, best first, at most 3 reports per topic. */
function search(words: string, root: string | null): (Hit & { score: number })[] {
  const ranked = similarity.rank({ title: words }, [...wikiRecords(), ...researchRecords(root)]).filter((r) => r.score >= MIN_SCORE);
  const perTopic = new Map<string, number>();
  return ranked.filter((r) => {
    const topic = (r.record as { topic?: string }).topic;
    if (!topic) return true;
    perTopic.set(topic, (perTopic.get(topic) || 0) + 1);
    return perTopic.get(topic)! <= PER_TOPIC;
  }).map((r) => ({ ...r.record.hit, score: Number(r.score.toFixed(3)) }));
}

export { search };
