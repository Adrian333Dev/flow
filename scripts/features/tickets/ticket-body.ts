/**
 * What a ticket folder holds beside `ticket.md`: the plan, the groundwork map,
 * reports, decisions and `context.md`, and the counts read from the checklists
 * in them and in the body.
 */

import fs from 'node:fs';
import path from 'node:path';
import { idNumber } from './ids.ts';
import type { Ticket } from './types.ts';

/**
 * Whether this ticket has a plan, and how far it got.
 *
 * `flow` used to report `4/9` in every list, which put a regex over
 * hand-written prose into the daily views and read zero whenever a plan was
 * shaped any other way. The count is back in `flow tickets get <id>` alone. There it
 * answers the question a session picking the ticket up actually has: is the
 * plan written, and is it finished, and it is counted at read time, so it
 * cannot drift from the file the way a stored number would. A plan with no
 * checkboxes reports no count at all rather than `0/0`.
 */
const planFile = (t) => path.join(t.dir, 'plan.md');
const hasPlan = (t) => fs.existsSync(planFile(t));

// `1. [ ] **Add the config table**` is a step. Anything indented under it is a
// sub-check the build added, which `execute` says explicitly in the format it
// writes, so the left margin is what separates the two.
const STEP = /^ {0,3}(?:\d+[.)]|[-*])\s+\[([ xX])\]/;

function planSteps(t) {
  return hasPlan(t) ? countBoxes(fs.readFileSync(planFile(t), 'utf8'), STEP) : null;
}

/**
 * Ticked and total, over one file's checkboxes.
 *
 * A commented-out box is not a box. Both templates carry their example inside
 * an HTML comment, so counting the raw file makes an untouched map read
 * `1/4 answered` and a ticket nobody has opened look half worked.
 */
function countBoxes(text, pattern) {
  const boxes = text.replace(/<!--[\s\S]*?-->/g, '')
    .split('\n').map((l) => l.match(pattern)).filter(Boolean);
  if (!boxes.length) return null;
  return { done: boxes.filter((m) => m[1] !== ' ').length, total: boxes.length };
}

/**
 * The groundwork map, and how many of its questions are answered.
 *
 * Counted at read time like the plan's steps, and counted at every indent: a
 * group is a question at the coarse level and the branches under it are the
 * questions themselves, so the honest total is every box on the map. What the
 * line is for is one thing, whether groundwork closed, and that is the count
 * reaching its own total.
 */
const mapFile = (t) => path.join(t.dir, 'groundwork', 'map.md');
const hasMap = (t) => fs.existsSync(mapFile(t));

const QUESTION = /^\s*(?:\d+[.)]|[-*])\s+\[([ xX])\]/;

function mapQuestions(t) {
  return hasMap(t) ? countBoxes(fs.readFileSync(mapFile(t), 'utf8'), QUESTION) : null;
}

/**
 * Reports written into the ticket, one per thing answered. A folder rather than
 * a single `report.md` for the reason `groundwork/` is a folder: you cannot
 * know at the start whether a ticket answers one question or three. Unlike
 * `groundwork/` it appears on first write, because a report's location never
 * moves: it just may not exist.
 */
const mdFiles = (dir) => (fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith('.md')).sort() : []);
const reportFiles = (t) => mdFiles(path.join(t.dir, 'reports'));

/** Decision files beside `ticket.md`, on a ticket made before `context.md`: `decisions/<subject>.md`. */
const decisionFiles = (t) => mdFiles(path.join(t.dir, 'decisions'));

/** The sections beside the index, one per handle in `ticket.md`, edited in place. */
const CONTEXT = 'context.md';

/** The `##` headings of `context.md`, in file order, or null where the ticket has none. */
function contextSections(t) {
  const file = path.join(t.dir, CONTEXT);
  if (!fs.existsSync(file)) return null;
  return fs.readFileSync(file, 'utf8').split('\n').filter((l) => /^## /.test(l)).map((l) => l.slice(3).trim());
}

/** The text under `## <heading>` up to the next `##` heading, or null where the ticket has none. */
function section(body, heading) {
  const lines = String(body).split('\n');
  const start = lines.findIndex((l) => l.trim() === `## ${heading}`);
  if (start === -1) return null;
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((l) => /^## /.test(l));
  return (end === -1 ? rest : rest.slice(0, end)).join('\n');
}

const countSection = (t, heading, pattern) => {
  const text = section(t.body, heading);
  return text === null ? null : countBoxes(text, pattern);
};

/** The ticket's own `## Questions`, counted at every indent as the map was. */
const questionCount = (t) => countSection(t, 'Questions', QUESTION);

/** The ticket's own `## Tasks`: steps at the left margin, never the sub-checks under them. */
const taskCount = (t) => countSection(t, 'Tasks', STEP);

/**
 * The line of the first open box in `text`, counted from 1, or null. With a
 * heading, only the lines under `## <heading>` count. Commented-out lines are
 * skipped, as in `countBoxes`.
 */
function firstOpenLine(text: string, pattern: RegExp, heading?: string): number | null {
  let inside = heading === undefined;
  let commented = false;
  for (const [at, line] of text.split('\n').entries()) {
    if (heading !== undefined && /^## /.test(line)) inside = line.trim() === `## ${heading}`;
    if (commented || line.includes('<!--')) commented = !line.includes('-->');
    else if (inside && pattern.exec(line)?.[1] === ' ') return at + 1;
  }
  return null;
}

/** The handles of the open questions: `- [ ] 1.2: …` is `1.2`, the heading of its section in `context.md`. A question with no handle has none. */
function openHandles(t: Ticket): string[] {
  const text = section(t.body, 'Questions')?.replace(/<!--[\s\S]*?-->/g, '') ?? '';
  return text.split('\n')
    .map((line) => /^\s*(?:\d+[.)]|[-*])\s+\[ \]\s+`?([^\s:`]+)`?:/.exec(line)?.[1])
    .filter((handle): handle is string => handle !== undefined);
}

/**
 * What a reader needs to open the ticket where the work is: the line in
 * `ticket.md` of the first open task and of the first open question, the
 * handles of the open questions, and the groundwork map's count and first open
 * line on a ticket made before `## Questions`. Lines are file lines, the
 * frontmatter included.
 */
function openWork(t: Ticket) {
  const file = fs.readFileSync(t.file, 'utf8');
  const map = hasMap(t) ? fs.readFileSync(mapFile(t), 'utf8') : null;
  const count = map === null ? null : countBoxes(map, QUESTION);
  return {
    firstOpen: { task: firstOpenLine(file, STEP, 'Tasks'), question: firstOpenLine(file, QUESTION, 'Questions') },
    openQuestions: openHandles(t),
    map: count && { ...count, line: firstOpenLine(map as string, QUESTION) },
  };
}

/**
 * Ticks, or clears, the line in `parent`'s `## Tasks` that starts with the
 * child's number: `- [ ] fw-127: …`. The word is ignored, so a project that
 * changed its prefix keeps its tick-offs. A line that only mentions the id
 * further along belongs to another child. Changes `parent.body` and returns
 * 'changed', 'same' where the box already matched, or 'missing' where no line
 * starts with the number.
 */
function tickTask(parent, childId, done) {
  const lines = parent.body.split('\n');
  const start = lines.findIndex((l) => l.trim() === '## Tasks');
  if (start === -1) return 'missing';

  const line = new RegExp(`^(\\s*(?:[-*]|\\d+[.)])\\s+\\[)([ xX])(\\]\\s+[*\`]*[a-z]{2,8}-${idNumber(childId)}(?![\\w-]))`);
  for (let i = start + 1; i < lines.length && !/^## /.test(lines[i]); i++) {
    const m = lines[i].match(line);
    if (!m) continue;
    if ((m[2] !== ' ') === done) return 'same';
    lines[i] = lines[i].replace(line, `$1${done ? 'x' : ' '}$3`);
    parent.body = lines.join('\n');
    return 'changed';
  }
  return 'missing';
}

export { CONTEXT, hasPlan, planSteps, hasMap, mapQuestions, reportFiles, decisionFiles, contextSections, questionCount, taskCount, openWork, tickTask };
