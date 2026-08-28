'use strict';
/**
 * `flow open` — the one command behind `/start`.
 *
 * A session that just cleared its context reads everything it needs before its
 * first turn: the ticket, then every file that ticket's `flow-open` block names.
 * One command rather than shell inside `commands/start.md`, for three reasons.
 * The branching is testable Node. The storage format stays private, so changing
 * it touches this file and nothing else. And the decision to skip the files
 * when the id does not resolve lives beside the lookup that failed.
 *
 * Four shapes, and `$ARGUMENTS` reaches all four with no shell in between:
 *
 *   flow open                  the board — what `flow status` prints
 *   flow open t047             the ticket, then its files
 *   flow open t047 build       move it first, then the same
 *   flow open docs/handoff.md  the file, then its files
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { FlowError } = require('../lib/error');
const { out } = require('../lib/cli');
const { projectRoot } = require('../lib/root');
const store = require('../lib/store');
const render = require('../lib/render');
const statuses = require('../lib/statuses');
const tickets = require('./tickets');

const FMERGE = path.resolve(__dirname, '../../fmerge.js');
const NEXT_LIMIT = 10;
const RULE = '-'.repeat(60);

/** A path route needs no repo, so it is decided before anything looks for one. */
const looksLikePath = (word) =>
  word.includes('/') || word.includes('\\') || word.endsWith('.md') || fs.existsSync(word);

/** `src/parser.js:40-120` — fmerge already takes the range, so it passes through whole. */
const splitRange = (spec) => {
  const m = spec.match(/^(.*?)(:\d+-\d+)?$/);
  return { file: m[1], range: m[2] || '' };
};

/**
 * A ticket's block names `plan.md` beside it and `src/parser.js` from the repo
 * root, and both readings are the natural one to write. Each base is tried in
 * turn rather than one being declared correct.
 */
function resolveSpec(spec, bases) {
  const { file, range } = splitRange(spec);
  for (const base of bases) {
    const abs = path.resolve(base, file);
    if (fs.existsSync(abs)) return abs + range;
  }
  return null;
}

/**
 * `--force` is deliberate. Past 2000 lines fmerge returns line counts instead of
 * content, which is right for an exploratory read and wrong here: a resume that
 * swaps the plan for a count is not a resume. The header line is what keeps the
 * cost visible instead of hidden.
 */
function loadRefs(specs, bases, cwd) {
  if (!specs.length) return;

  const found = [];
  const missing = [];
  for (const spec of specs) {
    const abs = resolveSpec(spec, bases);
    if (abs) found.push(abs);
    else missing.push(spec);
  }

  let merged = '';
  if (found.length) {
    try {
      merged = execFileSync(process.execPath, [FMERGE, '--force', ...found], {
        cwd,
        encoding: 'utf8',
        maxBuffer: 64 * 1024 * 1024,
      });
    } catch (e) {
      merged = `flow-open: fmerge failed — ${String(e.stderr || e.message).trim()}\n`;
    }
  }

  const count = `${found.length} file${found.length === 1 ? '' : 's'}`;
  const size = merged ? `, ${merged.split('\n').length} lines` : '';
  out(`\n${RULE}\nflow-open: ${count}${size}`);
  // Named and gone is worth saying out loud. The session carries on without it,
  // and a path that moved is exactly what the next handoff has to fix.
  if (missing.length) out(`missing: ${missing.join(', ')}`);
  if (merged) out(`\n${merged.trimEnd()}`);
}

function openFile(target) {
  if (!fs.existsSync(target)) throw new FlowError(`no file at "${target}".`);
  const abs = path.resolve(target);
  out(fs.readFileSync(abs, 'utf8').trimEnd());
  loadRefs(store.openBlock(fs.readFileSync(abs, 'utf8')), [path.dirname(abs), process.cwd()], path.dirname(abs));
  return 0;
}

function openTicket(ref, verb, flags) {
  const root = projectRoot();
  const all = store.readTickets(root);
  const t = store.findTicket(all, ref);

  if (verb) {
    const hit = statuses.VERBS.find((s) => s.verb === verb);
    if (!hit) {
      throw new FlowError(
        `"${verb}" is not a status — one of: ${statuses.VERBS.map((s) => s.verb).join(', ')}`
      );
    }
    const code = tickets.transition(t, all, root, hit.name, {
      force: flags.force,
      reason: flags.reason ? String(flags.reason).trim() : '',
      verb: `flow open ${t.id} ${verb}`,
    });
    if (code !== 0) return code;
    out('');
  }

  out(render.show(t, all, root));
  // Rendered from the repo root, so every path fmerge prints is one you can
  // hand straight back to a tool. Beside-the-ticket resolution is a writing
  // convenience, never how the path comes out.
  loadRefs(store.openBlock(t.body), [t.dir, root], root);
  return 0;
}

const open = {};

open.open = {
  section: 'board',
  args: '[<id>|<path>] [<status>]',
  summary: 'open a session, or pick a ticket up with everything it needs',
  flags: { force: { bool: true }, reason: { arg: '"<why>"' } },
  run({ positional, flags }) {
    const [first, second] = positional;
    if (!first) {
      out(render.status(store.readTickets(projectRoot()), NEXT_LIMIT));
      return 0;
    }
    return looksLikePath(first) ? openFile(first) : openTicket(first, second, flags);
  },
};

module.exports = open;
