/**
 * Findings: the one store of what Flow learned, one markdown file per claim.
 * A finding lives where its subject lives, in one of 3 homes:
 *
 *   <project>/.flow/findings/<claim>.md      a fact of one project
 *   ~/.flow/wiki/<subject>/findings/<claim>.md   a fact about a tool or a field
 *   ~/.flow/findings/<claim>.md              anything else: the user, a machine
 *
 * The third is the Flow home's own project folder, so `--project home` names
 * it the way it names the home's tickets and notes.
 *
 * The file name is the claim in 4 to 8 words, and the folder is the scope, so
 * the file repeats neither: its header holds `labels` and `updated` alone,
 * and its text states the claim first.
 *
 *   ---
 *   labels: [machine-setup]
 *   updated: 2026-10-21 14:05
 *   ---
 *
 *   The laptop runs WSL 2 on Windows 11 ...
 */

import fs from 'node:fs';
import path from 'node:path';
import * as frontmatter from '../../shared/frontmatter.ts';
import * as paths from '../../shared/paths.ts';
import * as registry from '../../shared/registry.ts';
import { projectRootOrNull } from '../../shared/project.ts';
import { FlowError } from '../../shared/error.ts';
import * as store from '../tickets/store.ts';
import * as records from '../tickets/records.ts';

const KEYS = ['labels', 'updated'];

const TITLE_WORDS = { min: 4, max: 8 };

// A wiki folder takes a repository's name, so a dot is allowed: `next.js`, `backlog.md`.
const SUBJECT = /^[a-z0-9][a-z0-9._-]*$/;

/** Where a finding lives: a project's folder, by prefix (`home` for ~/.flow), or a wiki subject's. */
type Place = { project: string; wiki?: undefined } | { wiki: string; project?: undefined };

interface Finding {
  name: string;
  file: string;
  place: Place;
  data: { labels: string[]; updated: string };
  body: string;
}

const wikiDir = () => path.join(paths.flowHome(), 'wiki');

/** The findings folder of a project root: `.flow/findings/`, or `~/.flow/findings/` for the home. */
const projectDir = (root: string) => path.join(store.recordsDir(root), 'findings');

const subjectDir = (subject: string) => path.join(wikiDir(), subject, 'findings');

/** `updated`'s value: the local date and the minute. */
function stamp() {
  return store.now().slice(0, 16);
}

/** True for a file inside a findings folder of any home: the stamp hook's test. */
function isFindingFile(file: string) {
  const dir = path.dirname(path.resolve(file));
  if (!file.endsWith('.md') || path.basename(dir) !== 'findings') return false;
  const parent = path.dirname(dir);
  return path.basename(parent) === '.flow'
    || path.resolve(parent) === path.resolve(paths.flowHome())
    || path.resolve(path.dirname(parent)) === path.resolve(wikiDir())
    || path.resolve(path.dirname(parent)) === path.resolve(paths.flowHome(), 'projects');
}

function readOne(file: string, place: Place): Finding {
  const { data, body } = frontmatter.parse(fs.readFileSync(file, 'utf8'));
  return {
    name: path.basename(file, '.md'),
    file,
    place,
    data: {
      labels: store.toLabelList(data.labels).map((l) => l.toLowerCase()),
      updated: data.updated ? String(data.updated).trim() : '',
    },
    body: body.trim(),
  };
}

function readDir(dir: string, place: Place): Finding[] {
  let names: string[];
  try {
    names = fs.readdirSync(dir);
  } catch {
    return [];
  }
  return names
    .filter((n) => n.endsWith('.md') && !n.startsWith('.'))
    .map((n) => readOne(path.join(dir, n), place));
}

/** The wiki subjects on this machine, whether or not they hold findings yet. */
function subjects(): string[] {
  try {
    return fs.readdirSync(wikiDir(), { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort();
  } catch {
    return [];
  }
}

/** The project roots a set of words names: `here`, `home`, `all` or a prefix. A prefix this machine does not know is refused. */
function projectRoots(words: string[]) {
  const roots = new Map<string, string>();
  const here = projectRootOrNull();
  for (const word of words) {
    if (word === 'all') {
      for (const p of registry.projects()) if (p.exists) roots.set(p.prefix, p.folder);
      if (here) roots.set(store.prefixOf(here), here);
    } else if (word === 'here') {
      if (here) roots.set(store.prefixOf(here), here);
    } else if (word === store.HOME_WORD) {
      roots.set(store.HOME_WORD, store.homeRoot());
    } else {
      const folder = here && store.prefixOf(here) === word ? here : registry.read()[word];
      if (!folder) throw new FlowError(`no project on this machine has the prefix "${word}". flow doctor lists them.`);
      roots.set(word, folder);
    }
  }
  return roots;
}

/**
 * The findings of the places named. With neither list, the default: this
 * project's, the home's and every wiki folder's, which is what a session in
 * this project may need. Another project's are read only on request.
 */
function read({ projects, wiki }: { projects?: string[]; wiki?: string[] } = {}): Finding[] {
  const both = !projects && !wiki;
  const found: Finding[] = [];
  for (const [prefix, root] of projectRoots(both ? ['here', store.HOME_WORD] : projects || [])) {
    found.push(...readDir(projectDir(root), { project: prefix }));
  }
  const wanted = both || wiki?.includes('all') ? subjects() : wiki || [];
  for (const subject of wanted) found.push(...readDir(subjectDir(subject), { wiki: subject }));
  return found;
}

/** Every finding this machine holds: every project's, the home's and the wiki's. */
const readAll = () => read({ projects: ['all'], wiki: ['all'] });

const realPath = (file: string) => {
  try {
    return fs.realpathSync(file);
  } catch {
    return path.resolve(file);
  }
};

/** The finding a ref names: its path, or its file name without `.md` where only one finding has it. */
function find(ref: unknown) {
  const given = String(ref ?? '').trim();
  if (!given) throw new FlowError('name a finding: its file name without .md, or its path.');
  const all = readAll();
  if (given.includes('/')) {
    const hit = all.find((f) => realPath(f.file) === realPath(paths.expandHome(given)));
    if (!hit) throw new FlowError(`${given} is no finding.`);
    return hit;
  }
  const name = given.replace(/\.md$/i, '').toLowerCase();
  const hits = all.filter((f) => f.name === name);
  if (!hits.length) throw new FlowError(`no finding "${given}". Give the whole file name without .md, or its path; the list is flow findings.`);
  if (hits.length > 1) throw new FlowError(`${hits.length} findings are named ${name}: give the path.\n${hits.map((f) => `  ${paths.shorten(f.file)}`).join('\n')}`);
  return hits[0];
}

/** The refusal for a title outside 4 to 8 words, or null. */
function badTitle(title: string) {
  const count = title.split(/\s+/).filter(Boolean).length;
  if (count >= TITLE_WORDS.min && count <= TITLE_WORDS.max) return null;
  return `"${title}" is ${count} word${count === 1 ? '' : 's'}: a finding's title is its claim in ${TITLE_WORDS.min} to ${TITLE_WORDS.max} words, such as "plugin test runs no typecheck".`;
}

/** The file name a title makes: every word kept, since the name is the claim. */
function nameOf(title: string) {
  const bad = badTitle(title);
  if (bad) throw new FlowError(bad);
  return store.slugify(title, Infinity);
}

/** The folder and place `new` writes to: `--wiki <subject>` or `--project <prefix>`, one of them. */
function target({ wiki, project }: { wiki?: string; project?: string }): { dir: string; place: Place; root: string } {
  if (wiki !== undefined && project !== undefined) throw new FlowError('a finding has one home: give --wiki or --project, not both.');
  if (wiki !== undefined) {
    const subject = String(wiki).trim().toLowerCase();
    if (!SUBJECT.test(subject)) throw new FlowError(`"${wiki}" cannot be a wiki folder: use the tool's repository name or a field's plain name, such as next.js or text-to-speech.`);
    return { dir: subjectDir(subject), place: { wiki: subject }, root: store.homeRoot() };
  }
  if (project === undefined) {
    const here = projectRootOrNull();
    throw new FlowError(
      'say where the finding belongs, since a finding lives where its subject lives:\n' +
      `  --project ${here ? store.prefixOf(here) : '<prefix>'}   a fact of this project\n` +
      '  --wiki <subject>  a fact about a tool or a field, in its wiki folder\n' +
      `  --project ${store.HOME_WORD}    anything else: the user, a machine, a way of working`
    );
  }
  const [[prefix, root]] = projectRoots([String(project).trim().toLowerCase()]);
  return { dir: projectDir(root), place: { project: prefix }, root };
}

function write(f: Pick<Finding, 'file' | 'data' | 'body'>) {
  fs.mkdirSync(path.dirname(f.file), { recursive: true });
  fs.writeFileSync(f.file, frontmatter.stringify(f.data, KEYS, f.body));
}

/** A wiki folder's `index.md`, where it has none: the folder's name and a line saying what is missing. */
function stubIndex(subject: string) {
  const file = path.join(wikiDir(), subject, 'index.md');
  if (fs.existsSync(file)) return null;
  fs.writeFileSync(file, `# ${subject}\n\nNo page yet: what ${subject} is, and the version in use, go here.\n`);
  return file;
}

/** Writes a new finding under the lock of the place it goes to. A name already taken is refused. */
function create({ dir, place, root }: ReturnType<typeof target>, { title, labels, body }: { title: string; labels: string[]; body: string }) {
  const name = nameOf(title);
  const made = records.locked(root, () => {
    const file = path.join(dir, `${name}.md`);
    if (fs.existsSync(file)) return { ok: false, why: `${paths.shorten(file)} exists: rewrite it in place, or state the new claim differently` };
    const finding = { name, file, place, data: { labels, updated: stamp() }, body: String(body || '').trim() };
    write(finding);
    const index = place.wiki ? stubIndex(place.wiki) : null;
    return { ok: true, finding, index };
  });
  if (!made.ok) throw new FlowError(`no finding was made: ${made.why}.`);
  return made as { ok: true; finding: Finding; index: string | null };
}

/**
 * Sets `updated` to now on a finding file, and its labels where given, keeping
 * every other line. A label change alone passes `now: false`: `updated` dates
 * the claim, and labels are no part of it.
 */
function touch(file: string, labels?: string[], { now = true } = {}) {
  const { data, body } = frontmatter.parse(fs.readFileSync(file, 'utf8'));
  if (labels) data.labels = labels;
  if (now || !data.updated) data.updated = stamp();
  fs.writeFileSync(file, frontmatter.stringify(data, KEYS, body));
}

/** Moves a finding to a new name in its folder, and returns the new path. A name taken is refused. */
function rename(finding: Finding, name: string) {
  const to = path.join(path.dirname(finding.file), `${name}.md`);
  const moved = records.locked(rootOf(finding.place), () => {
    if (fs.existsSync(to)) return { ok: false, why: `${paths.shorten(to)} exists: merge the 2 findings by hand` };
    fs.renameSync(finding.file, to);
    return { ok: true };
  });
  if (!moved.ok) throw new FlowError(`not renamed: ${moved.why}.`);
  return to;
}

/** The labels on `findings` with how many carry each, the most used first. */
function labelCounts(findings: Finding[]) {
  const counts = new Map<string, number>();
  for (const f of findings) for (const l of f.data.labels) counts.set(l, (counts.get(l) || 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

/** The root a place syncs under: its project, or the Flow home for the home and the wiki. */
function rootOf(place: Place) {
  if (place.wiki || place.project === store.HOME_WORD) return store.homeRoot();
  const [[, root]] = projectRoots([place.project!]);
  return root;
}

export type { Finding, Place };
export {
  KEYS, wikiDir, subjectDir, projectDir, subjects, readDir, read, readAll, find, badTitle, nameOf, target, create,
  touch, rename, stamp, isFindingFile, labelCounts, rootOf,
};
