'use strict';
/**
 * Study cases on disk. The one part of flow that is not per project.
 *
 *   ~/.claude/flow/study-cases/<issue>/<date>-<slug>.md
 *
 * Filed by issue, never by project: the payoff is seeing one failure three
 * times, and a project folder scatters exactly that. The project is a field.
 *
 * Frontmatter is owned by these commands and the body is written by hand — the
 * same split tickets use. `slugify` and `renderTemplate` are borrowed from
 * store.js rather than copied; nothing else is shared, and cases have no graph.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const frontmatter = require('./frontmatter');
const { FlowError } = require('./error');
const { projectRoot } = require('./root');
const { slugify, renderTemplate } = require('./store');

const CASE_KEYS = ['date', 'project', 'rule', 'status', 'fix'];
const CASE_STATUSES = ['open', 'fixed'];

// FLOW_HOME mirrors FLOW_PROJECT: the default is the installed location, and an
// override exists so the tool can be exercised without writing to it.
const flowHome = () => process.env.FLOW_HOME || path.join(os.homedir(), '.claude', 'flow');
const casesDir = () => path.join(flowHome(), 'study-cases');

const NAME_RE = /^(\d{4}-\d{2}-\d{2})-(.+)$/;

function today() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** The project a case happened in, as a name. Empty outside a repo — a study
 *  case is worth recording wherever it happened, so this never refuses. */
function currentProject() {
  try {
    return path.basename(projectRoot());
  } catch {
    return '';
  }
}

// ---------------------------------------------------------------- reading

function readCases() {
  const root = casesDir();
  const cases = [];
  if (!fs.existsSync(root)) return cases;

  for (const issueEntry of fs.readdirSync(root, { withFileTypes: true })) {
    if (!issueEntry.isDirectory()) continue;
    const issue = issueEntry.name;
    const dir = path.join(root, issue);

    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      // A case is one file. A folder appears only when it carries attachments,
      // and then the case itself is the .md inside it.
      const file = entry.isDirectory()
        ? firstMarkdown(path.join(dir, entry.name))
        : (entry.name.endsWith('.md') ? path.join(dir, entry.name) : null);
      if (!file) continue;

      const name = path.basename(file, '.md');
      const m = name.match(NAME_RE);
      const { data, body } = frontmatter.parse(fs.readFileSync(file, 'utf8'));

      data.date = data.date ? String(data.date).trim() : (m ? m[1] : '');
      data.status = CASE_STATUSES.includes(data.status) ? data.status : 'open';
      data.project = data.project ? String(data.project).trim() : '';
      data.rule = data.rule ? String(data.rule).trim() : '';
      data.fix = data.fix ? String(data.fix).trim() : '';

      cases.push({ issue, name, slug: m ? m[2] : name, file, data, body });
    }
  }

  // Newest first — the recent ones are the ones being worked on.
  cases.sort((a, b) => String(b.data.date).localeCompare(String(a.data.date)) || a.name.localeCompare(b.name));
  return cases;
}

function firstMarkdown(dir) {
  const hit = fs.readdirSync(dir).filter((f) => f.endsWith('.md')).sort()[0];
  return hit ? path.join(dir, hit) : null;
}

/** Issue folders with the numbers that decide whether a new case joins one. */
function readIssues(cases) {
  const root = casesDir();
  const all = cases || readCases();
  const names = fs.existsSync(root)
    ? fs.readdirSync(root, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name).sort()
    : [];

  return names.map((issue) => {
    const mine = all.filter((c) => c.issue === issue);
    return {
      issue,
      total: mine.length,
      open: mine.filter((c) => c.data.status === 'open').length,
      latest: mine.length ? mine[0].data.date : '',
      rules: [...new Set(mine.map((c) => c.data.rule).filter(Boolean))],
      projects: [...new Set(mine.map((c) => c.data.project).filter(Boolean))],
    };
  });
}

/**
 * The whole mechanism rests on one failure having one folder. Two spellings of
 * the same issue split the count and nothing errors, so a near-miss refuses
 * instead. Exact matches never reach here; a genuinely new issue is silent.
 */
function nearMatches(issue, existing) {
  return existing.filter((e) => {
    if (e === issue) return false;
    const [short, long] = e.length <= issue.length ? [e, issue] : [issue, e];
    if (short.length >= 4 && long.includes(short)) return true;
    return editDistance(e, issue) <= 2;
  });
}

function editDistance(a, b) {
  if (Math.abs(a.length - b.length) > 2) return 3; // caller only cares about <= 2
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    for (let j = 1; j <= b.length; j++) {
      row[j] = Math.min(
        prev[j] + 1,
        row[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
    prev = row;
  }
  return prev[b.length];
}

/** Resolves a full name, a slug, or `issue/name`. Partial matches count. */
function findCase(cases, ref) {
  const needle = String(ref || '').trim().replace(/\.md$/, '');
  if (!needle) throw new FlowError('which case? give its slug, or issue/slug.');

  const key = (c) => `${c.issue}/${c.name}`;
  const exact = cases.filter((c) => c.name === needle || c.slug === needle || key(c) === needle);
  if (exact.length === 1) return exact[0];
  if (exact.length > 1) throw new FlowError(ambiguous(needle, exact));

  const partial = cases.filter((c) => key(c).includes(needle));
  if (partial.length === 1) return partial[0];
  if (partial.length > 1) throw new FlowError(ambiguous(needle, partial));

  throw new FlowError(`no study case matching "${needle}".`);
}

const ambiguous = (needle, matches) =>
  `"${needle}" matches ${matches.length} study cases:\n` +
  matches.map((c) => `  ${c.issue}/${c.name}`).join('\n');

// ---------------------------------------------------------------- writing

function createCase({ issue, title, rule, body: given }) {
  const dir = path.join(casesDir(), issue);
  const date = today();
  const slug = slugify(title);
  const name = `${date}-${slug}`;
  const file = path.join(dir, `${name}.md`);
  if (fs.existsSync(file)) throw new FlowError(`${file} already exists.`);

  const data = { date, project: currentProject(), rule: rule || '', status: 'open', fix: '' };
  const body = given != null
    ? String(given).trim() + '\n'
    : renderTemplate('study-case.md', { title: String(title).trim(), issue, date });

  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(file, frontmatter.stringify(data, CASE_KEYS, body));
  return { issue, name, slug, file, data, body };
}

function writeCase(c) {
  fs.writeFileSync(c.file, frontmatter.stringify(c.data, CASE_KEYS, c.body));
}

module.exports = {
  CASE_KEYS, CASE_STATUSES,
  flowHome, casesDir, today, currentProject,
  readCases, readIssues, nearMatches, findCase, createCase, writeCase,
};
