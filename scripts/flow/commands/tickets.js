'use strict';
/**
 * Everything that acts on a ticket.
 *
 * None of it is spelled `flow tickets ...`. A ticket is what this tool is
 * about, so these sit at the top level and the noun is left out: `flow ls`,
 * `flow build t047`. Only `cases` keeps a group name, being a different thing.
 *
 * The status verbs are generated from the status table rather than written out.
 * Each is the same call into `transition`, so a verb cannot skip a guard, and a
 * status added to the table arrives with its command already working.
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { FlowError } = require('../lib/error');
const { out } = require('../lib/cli');
const { projectRoot } = require('../lib/root');
const store = require('../lib/store');
const graph = require('../lib/graph');
const render = require('../lib/render');
const statuses = require('../lib/statuses');
const records = require('../lib/records');
const ticketHistory = require('../lib/ticket-history');
const ticketSkills = require('../lib/ticket-skills');

function load() {
  const root = projectRoot();
  return { root, tickets: store.readTickets(root) };
}

/** The home place: the tickets in ~/.flow/, which belong to no project. */
function loadHome() {
  const root = store.homeRoot();
  return { root, tickets: store.readTickets(root) };
}

const rel = (root, p) => path.relative(root, p) || p;

/**
 * `flow exp-47` and `flow get exp-47` both land on the same lookup. The first
 * got here because `exp-47` matched no command, which means a mistyped
 * command, `flow buidl exp-47`, arrives here too and would fail with a message
 * about tickets. `unnamed` is passed on that path only, and says what else it
 * tried.
 */
function find(tickets, ref, unnamed) {
  try {
    return store.findTicket(tickets, ref);
  } catch (e) {
    if (unnamed && e instanceof FlowError) {
      throw new FlowError(`${e.message}\n  "${ref}" is not a command either: flow help lists them.`);
    }
    throw e;
  }
}

/**
 * The place a ticket lives, its tickets, and the ticket. The id's word picks
 * the place: `home-4` is read from ~/.flow/ wherever this runs, and anything
 * else from the project this runs in. A project's id missing there may belong
 * to a ticket `flow move` took home, which kept it as `was:`.
 */
function locate(ref, unnamed) {
  const word = store.wordOf(String(ref || '').trim().toLowerCase());
  if (word === store.HOME_WORD) {
    const place = loadHome();
    return { ...place, t: find(place.tickets, ref, unnamed) };
  }

  const place = load();
  try {
    return { ...place, t: find(place.tickets, ref, unnamed) };
  } catch (e) {
    const id = store.normalizeId(ref, place.tickets.prefix);
    const home = id && fs.existsSync(store.ticketsDir(store.homeRoot())) ? loadHome() : null;
    const moved = home && home.tickets.find((t) => t.data.was === id);
    if (moved) return { ...home, t: moved };
    throw e;
  }
}

/** `--body -` reads the whole body from stdin, so creating and filling a ticket is one command. */
function readBody(flags) {
  if (flags.body === '-') {
    let body;
    try {
      body = fs.readFileSync(0, 'utf8');
    } catch {
      throw new FlowError('--body - expects the body on stdin, and nothing was piped in.');
    }
    if (!body.trim()) throw new FlowError('--body - got empty stdin.');
    return body;
  }
  return flags.body == null ? undefined : flags.body;
}

// ---------------------------------------------------------------- moving

/**
 * The one place a status is written. Every verb goes through it.
 *
 * Guards are keyed to where the ticket is coming from, never to where it is
 * going. The entry status varies by type, so a target-status test would let an
 * issue picked up at `building` walk past both refusals. `planning` is guarded
 * as well because groundwork is where children get cut: a parent whose work
 * just moved into its children cannot have a plan written for it until they
 * close.
 */
function transition(t, tickets, root, status, { force, reason, verb }) {
  const from = t.data.status;
  if (from === status) {
    out(`${t.id} is already ${status}.`);
    return 0;
  }

  if (statuses.NEEDS_REASON.has(status) && !reason) {
    throw new FlowError(
      `moving ${t.id} to ${status} needs a reason: in six months it is the only thing that explains the ticket.\n` +
      `  ${verb} --reason "vendor API changes land in Q3, pointless before that"`
    );
  }

  const entering = from === 'todo' || from === 'parked' || status === 'planning';

  // Starting a blocked ticket refuses rather than warns. A warning is a line of
  // text an agent reads past; a non-zero exit is the thing it cannot ignore.
  const unmet = entering ? graph.unmetDeps(t, graph.indexById(tickets)) : [];
  if (unmet.length && !force) {
    throw new FlowError(
      `${t.id} is blocked, deps are not satisfied:\n` +
      unmet.map((u) => `  ${render.blockText(u)}`).join('\n') +
      `\n  Clear those first, or override with: ${verb} --force`
    );
  }

  // The pair to `done` refusing on open children. A parent keeps whatever work
  // no child holds (the wiring, the final suite) and that work runs after
  // they close, so this refuses early rather than at the finish line.
  const openKids = graph.openChildren(tickets, t.id);
  if (entering && openKids.length && !force) {
    throw new FlowError(
      `${t.id} has ${openKids.length} open child ticket${openKids.length === 1 ? '' : 's'}, finish those first:\n` +
      openKids.map((c) => `  ${c.id}  ${c.data.status.padEnd(10)} ${c.data.title}`).join('\n') +
      `\n  Or override with: ${verb} --force`
    );
  }

  // A parent finishing is a judgment about whether the original question got
  // answered. The children finishing is evidence, not proof, so the call stays
  // with the user and this only refuses to make it for them.
  if (status === 'done' && openKids.length && !force) {
    throw new FlowError(
      `${t.id} has ${openKids.length} open child ticket${openKids.length === 1 ? '' : 's'}, its work is theirs:\n` +
      openKids.map((c) => `  ${c.id}  ${c.data.status.padEnd(10)} ${c.data.title}`).join('\n') +
      `\n  Finish those, or close it anyway with: ${verb} --force`
    );
  }

  const before = graph.readyTickets(tickets).map((x) => x.id);
  const revived = from === 'parked' && t.data.reason;

  t.data.status = status;
  // The moment work stopped. Any move back to a live status clears it, because
  // a ticket in flight has no finish to point at.
  t.data.closed = statuses.TERMINAL.has(status) ? store.now() : '';
  // A reason outlives only the status it explains. Carrying "waiting on the Q3
  // API" into a ticket now being built is worse than carrying nothing.
  t.data.reason = reason || '';
  // Where a parked ticket comes back to. Nothing used to store this: revive
  // recomputed the entry status from the type, so a feature parked at
  // `building` came back at `groundwork`: losing two phases, on the command
  // the tool printed for it. The status it left is the only thing that knows.
  t.data.resume = status === 'parked' ? from : '';
  // The code branch is written once, when code work starts on the ticket.
  if (status === 'building' || status === 'review') ticketHistory.claimBranch(t);

  const moved = store.writeTicket(t);
  ticketHistory.append(t, `${from} → ${status}`);
  // A status move is a checkpoint: saved on the `flow` branch now, and sent
  // in the background, so the move never waits on the network.
  records.commit(root, `${t.id}: ${from} → ${status}`);
  records.syncLater(root);
  out(`${t.id}  ${from} → ${status}   ${t.data.title}`);
  if (t.data.reason) out(`      reason: ${t.data.reason}`);
  if (moved) out(`      moved → ${rel(root, moved.to)}`);
  if (revived) out(`      revived, cleared reason: ${revived}`);

  if (unmet.length) {
    out('\nforced past unsatisfied deps:');
    for (const u of unmet) out(`  ${render.blockText(u)}`);
  }

  const ready = graph.readyTickets(tickets).map((x) => x.id);
  const unblocked = tickets.filter((x) => ready.includes(x.id) && !before.includes(x.id));
  if (unblocked.length) {
    out('\nnow ready:');
    out(render.indent(render.ticketTable(unblocked)));
  }

  // The mirror. A move back down the line un-satisfies deps, so work `flow next`
  // was offering stops being workable, and the ticket that moved is not one of
  // them, since leaving `todo` drops it from the ready list on every pickup.
  const blocked = tickets.filter((x) => x.id !== t.id && before.includes(x.id) && !ready.includes(x.id));
  if (blocked.length) {
    out('\nnow blocked:');
    out(render.indent(render.ticketTable(blocked)));
  }
  if (status === 'parked') out(`\nrevive with: flow ${render.reviveVerb(t)} ${t.id}`);
  return 0;
}

// ---------------------------------------------------------------- the board

const actions = {};

actions.ls = {
  section: 'board',
  summary: 'list many, filtered',
  flags: {
    status: { values: statuses.NAMES, arg: '<status>' },
    type: { values: store.TICKET_TYPES, arg: '<type>' },
    parent: { arg: '<id>' },
    unfiled: { bool: true },
  },
  run({ flags }) {
    const { tickets } = load();
    let list = tickets;

    if (flags.status) list = list.filter((t) => t.data.status === flags.status);
    if (flags.type) list = list.filter((t) => t.data.type === flags.type);
    if (flags.parent) {
      const parent = store.requireId(flags.parent, tickets.prefix);
      list = list.filter((t) => t.data.parent === parent);
    }
    // The filing pass runs this first, to get the ids it will sweep. Done only:
    // a dropped ticket's reason is its whole record, and an open one is still
    // producing the material the pass would file.
    if (flags.unfiled) list = list.filter((t) => t.data.status === 'done' && !t.data.filed);

    out(render.ticketTable(graph.rankByStatus(list, tickets), tickets));
    if (list.length) out(`\n${list.length} of ${tickets.length}.`);
    return 0;
  },
};

/**
 * The whole shape, which nothing else shows. `ls` is a flat table with a parent
 * column and `get` is one ticket: the hierarchy that `parent` builds had no
 * renderer at all.
 */
actions.tree = {
  section: 'board',
  summary: 'the shape, nested by parent',
  flags: { parent: { arg: '<id>' }, all: { bool: true } },
  run({ flags }) {
    const { tickets } = load();
    if (!tickets.length) { out('no tickets yet.'); return 0; }

    let pool = tickets;
    if (flags.parent) {
      const top = store.findTicket(tickets, flags.parent);
      pool = [top, ...graph.descendants(tickets, top.id)];
    }

    // Done and dropped collapse into the parent's count by default. A tree
    // carrying every finished ticket is the noise a tree exists to strip.
    const visible = flags.all ? pool : pool.filter((t) => !statuses.TERMINAL.has(t.data.status));
    if (!visible.length) { out('nothing live here: flow tree --all includes done and dropped.'); return 0; }

    out(render.tree(graph.forest(visible), tickets));
    const hidden = pool.length - visible.length;
    out(`\n${visible.length} ticket${visible.length === 1 ? '' : 's'}` +
      (hidden ? `, ${hidden} done or dropped hidden: flow tree --all` : ''));
    return 0;
  },
};

// ---------------------------------------------------------------- one ticket

const RULE = '-'.repeat(60);
const NEXT_LIMIT = 10;

const looksLikePath = (word) =>
  word.includes('/') || word.includes('\\') || word.endsWith('.md') || fs.existsSync(word);

/**
 * The files a document names in its own `open` block, printed under a rule.
 *
 * `util fs open` owns the format, the parse and the merge, because the block is
 * not a ticket format: a handoff, a spec or a loose note carries one on the
 * same terms. What stays here is where Flow runs it from. That command resolves
 * a path beside the document first and then from its working directory, so
 * running it at the repo root against `ticket.md` gives exactly the two bases a
 * ticket needs.
 *
 * `--files-only` because `get` has already printed the ticket by the time this
 * runs. Without the flag the command prints the document too, which is what it
 * should do for anyone opening a document cold.
 */
function loadOpen(file, cwd) {
  let printed;
  try {
    printed = execFileSync('util', ['fs', 'open', '--files-only', file], {
      cwd,
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
    });
  } catch (e) {
    const why = e.code === 'ENOENT'
      ? 'util is not on PATH: install it, then run flow get --files again'
      : String(e.stderr || e.message).trim();
    printed = `unread: util fs open failed, ${why}`;
  }
  out(`\n${RULE}\n${printed.trimEnd()}`);
}

function nextLimit(flags) {
  if (flags.all) return Infinity;
  if (flags.limit === undefined) return NEXT_LIMIT;
  const n = Number(flags.limit);
  if (!Number.isInteger(n) || n < 1) {
    throw new FlowError(`--limit takes a whole number of tickets (got "${flags.limit}")`);
  }
  return n;
}

actions.get = {
  section: 'tickets',
  args: '[<id>|<path>]',
  summary: 'one ticket, or the board with nothing named',
  flags: {
    files: { bool: true },
    limit: { arg: '<n>' },
    all: { bool: true },
  },
  run({ positional, flags, unnamed }) {
    const [first] = positional;

    if (!first) {
      out(render.status(store.readTickets(projectRoot()), nextLimit(flags)));
      return 0;
    }

    if (looksLikePath(first)) {
      if (!fs.existsSync(first)) throw new FlowError(`no file at "${first}".`);
      const abs = path.resolve(first);
      const content = fs.readFileSync(abs, 'utf8');
      out(content.trimEnd());
      loadOpen(abs, process.cwd());
      return 0;
    }

    const { root, tickets, t } = locate(first, unnamed);

    out(render.show(t, tickets, root));
    if (flags.files) {
      loadOpen(t.file, root);
    }
    return 0;
  },
};

/**
 * `flow handoff <id>`: a line in the ticket's `history.md` saying this session
 * handed the work on. `/flow:handoff` runs it after writing `## State`, so the
 * history names every session the work passed through, not only the ones that
 * moved its status.
 */
actions.handoff = {
  section: 'tickets',
  args: '<id>',
  summary: 'note in the ticket\'s history that this session handed it on',
  run({ positional, usage }) {
    const [ref] = positional;
    if (!ref) throw new FlowError(`usage: ${usage}`);
    const { root, t } = locate(ref);
    ticketHistory.append(t, 'handoff');
    records.commit(root, `${t.id}: handoff`);
    out(`${t.id}  handoff noted in ${rel(root, path.join(t.dir, ticketHistory.FILE))}`);
    return 0;
  },
};

/** Why `flow new` made no ticket: the pull or the push behind it failed. */
function notMade(failed) {
  if (!failed.offline) return `no ticket was made: ${failed.why || 'the push failed'}.`;
  return `no ticket was made: the remote did not take it. git said: ${failed.why}\n` +
    'A number is given out only once the remote has it. Fix what git names, or wait until the remote answers, then try again.';
}

/**
 * Undo a new ticket whose push never landed: its groundwork goes back where
 * `--from-groundwork` found it, the folder goes, and the removal is committed,
 * so the branch holds nothing the remote never agreed to.
 */
function takeBack(root, t, fromGroundwork) {
  if (fromGroundwork) store.moveFolder(path.join(t.dir, 'groundwork'), fromGroundwork);
  fs.rmSync(t.dir, { recursive: true, force: true });
  records.commit(root, `${t.id}: taken back, never sent`);
}

actions.new = {
  section: 'tickets',
  args: '"<title>"',
  summary: 'create one',
  flags: {
    type: { values: store.TICKET_TYPES, arg: '<type>' },
    priority: { values: store.TICKET_PRIORITIES, arg: '<level>' },
    parent: { arg: '<id>' },
    deps: { arg: '<id,id>' },
    label: { arg: '<1-3 words>' },
    body: { arg: '<text|->' },
    'from-groundwork': { arg: '<path>' },
  },
  run({ positional, flags, usage }) {
    const title = positional.join(' ').trim();
    if (!title) throw new FlowError(`usage: ${usage} "<title>"`);

    const body = readBody(flags);
    const root = projectRoot();
    // The newest numbers first, so this ticket takes one nobody has pushed.
    // A number is only ever given out where the remote agreed to it, so a
    // pull that fails makes no ticket.
    const pulled = records.pull(root);
    if (!pulled.ok) throw new FlowError(notMade(pulled));
    const tickets = store.readTickets(root);

    const deps = store.toIdList(flags.deps, tickets.prefix);
    for (const d of deps) {
      if (!tickets.some((t) => t.id === d)) throw new FlowError(`--deps names ${d}, which does not exist.`);
    }

    let parent = '';
    if (flags.parent) {
      parent = store.requireId(flags.parent, tickets.prefix);
      if (!tickets.some((t) => t.id === parent)) throw new FlowError(`--parent names ${parent}, which does not exist.`);
    }

    // `--from-groundwork` moves an existing loose groundwork in as this
    // ticket's own, for when the groundwork resolved to exactly one unit of work.
    let fromGroundwork = '';
    if (flags['from-groundwork'] != null) {
      const given = String(flags['from-groundwork']).trim();
      if (!given) throw new FlowError('--from-groundwork expects the path of an existing groundwork folder.');
      fromGroundwork = path.resolve(given);
      if (!fs.existsSync(fromGroundwork) || !fs.statSync(fromGroundwork).isDirectory()) {
        throw new FlowError(`--from-groundwork names ${given}, which is not a folder.`);
      }
      if (!fs.existsSync(path.join(fromGroundwork, 'map.md'))) {
        throw new FlowError(`${given} holds no map.md, so it is not a groundwork folder.`);
      }
      const live = store.ticketsDir(root);
      if (fromGroundwork === live || fromGroundwork.startsWith(live + path.sep)) {
        throw new FlowError(`${given} is inside .flow/tickets/, so it already belongs to a ticket.`);
      }
    }

    let t = store.createTicket(root, {
      title, type: flags.type || 'feature', priority: flags.priority || '',
      parent, deps, tickets, body, fromGroundwork, label: flags.label,
    });

    // Pushed before the id is shown, so nobody ever sees a number change. A
    // refused push means someone took the number first: the ticket is
    // renumbered and pushed again. A push that never lands takes it back.
    const claimed = records.claim(root, t.id);
    if (claimed.id !== t.id) t = store.findTicket(store.readTickets(root), claimed.id);
    if (!claimed.ok) {
      takeBack(root, t, fromGroundwork);
      throw new FlowError(notMade(claimed));
    }

    out(`created ${t.id}  ${t.data.title}`);
    out(`        ${rel(root, t.file)}`);
    out(`        ${rel(root, path.join(t.dir, 'groundwork', 'map.md'))}`);
    if (t.movedFrom) out(`        moved  ${rel(root, t.movedFrom)}/ → groundwork/`);
    if (t.data.priority) out(`        priority: ${t.data.priority}`);
    if (parent) out(`        parent: ${parent}`);
    if (deps.length) out(`        deps: ${deps.join(', ')}`);
    out(`\npick up with: flow ${statuses.VERB_OF[statuses.entryStatusFor(t.data.type)]} ${t.id}`);
    return 0;
  },
};

/**
 * Every field a ticket carries except `status`, which belongs to the verbs.
 * Two spellings for one move meant skills wrote the long one: it was the
 * documented general form, so the surface read as if the verbs did not exist.
 */
actions.edit = {
  section: 'tickets',
  args: '<id>',
  summary: 'change a field',
  flags: {
    title: { arg: '"<title>"' },
    label: { arg: '<1-3 words>' },
    type: { values: store.TICKET_TYPES, arg: '<type>' },
    priority: { values: store.TICKET_PRIORITIES, arg: '<level>' },
    parent: { arg: '<id>' },
  },
  run({ positional, flags, usage }) {
    if (!positional[0]) throw new FlowError(`usage: ${usage} <id> [--title ...] [--type ...]`);

    const { root, tickets, t } = locate(positional[0]);
    const changes = [];

    if (flags.title !== undefined) {
      changes.push(`title: "${t.data.title}" → "${flags.title}"`);
      t.data.title = String(flags.title).trim();
    }
    if (flags.type !== undefined) {
      changes.push(`type: ${t.data.type} → ${flags.type}`);
      t.data.type = flags.type;
    }
    if (flags.priority !== undefined) {
      // `normal` and `""` both clear it: the field goes away rather than
      // storing the default, so an ordinary ticket has no priority line to go stale.
      const priority = store.toPriority(flags.priority);
      changes.push(`priority: ${t.data.priority || 'normal'} → ${priority || 'normal'}`);
      t.data.priority = priority;
    }
    if (flags.parent !== undefined) {
      // Empty clears it: `--parent ""` un-splits a ticket.
      const parent = flags.parent ? store.requireId(flags.parent, tickets.prefix) : '';
      if (parent) {
        if (parent === t.id) throw new FlowError('a ticket cannot be its own parent.');
        if (!tickets.some((x) => x.id === parent)) throw new FlowError(`--parent names ${parent}, which does not exist.`);
        if (graph.wouldOrphan(tickets, t.id, parent)) {
          throw new FlowError(`${t.id} → ${parent} would make ${t.id} its own ancestor.`);
        }
      }
      changes.push(`parent: ${t.data.parent || '-'} → ${parent || '-'}`);
      t.data.parent = parent;
    }

    let renamed = null;
    if (flags.label !== undefined) {
      renamed = store.relabel(t, flags.label);
      changes.push(`label: ${renamed.from} → ${renamed.to}`);
    }

    if (!changes.length) {
      throw new FlowError(
        'nothing to change: pass --title, --label, --type, --priority or --parent.\n' +
        `  Status moves are their own commands: flow build ${t.id}, flow review ${t.id}, flow done ${t.id}.`
      );
    }

    store.writeTicket(t);
    records.commit(root, `${t.id}: ${changes.join('; ')}`);
    out(`${t.id}\n  ${changes.join('\n  ')}`);
    if (renamed) out(`\nfolder → ${rel(root, t.dir)}`);
    return 0;
  },
};

actions.dep = {
  section: 'tickets',
  args: '<id>',
  summary: 'add or remove a dependency',
  flags: { on: { arg: '<id>' }, off: { arg: '<id>' } },
  run({ positional, flags, usage }) {
    if (!positional[0]) throw new FlowError(`usage: ${usage} <id> --on <id> | --off <id>`);
    if (flags.on && flags.off) throw new FlowError('--on and --off are mutually exclusive.');
    if (!flags.on && !flags.off) throw new FlowError(`${usage} needs --on <id> or --off <id>.`);

    const { root, tickets, t } = locate(positional[0]);
    const dep = store.requireId(flags.off || flags.on, tickets.prefix);

    if (flags.off) {
      if (!t.data.deps.includes(dep)) { out(`${t.id} does not depend on ${dep}.`); return 0; }
      t.data.deps = t.data.deps.filter((d) => d !== dep);
    } else {
      if (dep === t.id) throw new FlowError('a ticket cannot depend on itself.');
      if (!tickets.some((x) => x.id === dep)) throw new FlowError(`no ticket ${dep}.`);
      if (t.data.deps.includes(dep)) { out(`${t.id} already depends on ${dep}.`); return 0; }
      if (graph.wouldCycle(tickets, t.id, dep)) {
        throw new FlowError(`${t.id} → ${dep} would close a dependency cycle. Run flow check.`);
      }
      t.data.deps = [...t.data.deps, dep];
    }

    store.writeTicket(t);
    records.commit(root, `${t.id}: deps → [${t.data.deps.join(', ')}]`);
    out(`${t.id}  deps → [${t.data.deps.join(', ')}]`);
    return 0;
  },
};

/**
 * The filing pass marks what it swept. Several ids at once, because sweeping a
 * batch of closed tickets is the normal case, and every id gets stamped,
 * including the tickets that produced nothing worth keeping. A ticket nobody
 * looked at and a ticket that taught nothing are indistinguishable from the
 * outside, so only the mark drains the queue.
 */
actions.file = {
  section: 'tickets',
  args: '<id>...',
  summary: 'stamp today on everything the filing pass swept',
  flags: { force: { bool: true } },
  run({ positional, flags, usage }) {
    if (!positional.length) throw new FlowError(`usage: ${usage} <id>...`);

    const { root, tickets } = locate(positional[0]);
    const stamp = store.today();
    const targets = positional.map((ref) => store.findTicket(tickets, ref));

    for (const t of targets) {
      if (t.data.filed && !flags.force) {
        out(`${t.id}  already filed ${t.data.filed}   ${t.data.title}`);
        continue;
      }
      const previous = t.data.filed;
      t.data.filed = stamp;
      store.writeTicket(t);
      out(`${t.id}  filed ${stamp}${previous ? ` (was ${previous})` : ''}   ${t.data.title}`);
    }

    records.commit(root, `filed ${targets.map((t) => t.id).join(', ')}`);
    const left = tickets.filter((t) => t.data.status === 'done' && !t.data.filed);
    out(left.length
      ? `\n${left.length} closed ticket${left.length === 1 ? '' : 's'} still unfiled: flow ls --unfiled`
      : '\nnothing left unfiled.');
    return 0;
  },
};

/**
 * Dropping is the one destructive edit here, and its damage lands on tickets
 * the user was not thinking about: `deps` is stored on one side only, so
 * killing t047 silently strands whatever depended on it. Bare `drop` therefore
 * refuses while live dependents exist and prints the whole chain first.
 *
 * It is the one status with no verb, for that repair. `flow dropped t047` would
 * be a verb that had to do something no other verb does.
 */
actions.drop = {
  section: 'tickets',
  args: '<id>',
  summary: 'kill it, and repair what depended on it',
  flags: {
    reason: { required: true, arg: '"<why>"', missing: 'dropping needs a reason, nothing else records why the work died.' },
    by: { arg: '<id>' },
    force: { bool: true },
  },
  run({ positional, flags, usage }) {
    if (!positional[0]) throw new FlowError(`usage: ${usage} <id> --reason "<why>"`);
    if (flags.by && flags.force) {
      throw new FlowError('--by and --force are mutually exclusive: one rescues dependents, the other kills them.');
    }

    const { root, tickets, t } = locate(positional[0]);
    const reason = String(flags.reason).trim();

    let replacement = null;
    if (flags.by) {
      const byId = store.requireId(flags.by, tickets.prefix);
      if (byId === t.id) throw new FlowError(`${t.id} cannot replace itself.`);
      replacement = tickets.find((x) => x.id === byId);
      if (!replacement) throw new FlowError(`--by names ${byId}, which does not exist.`);

      // A dropped replacement blocks every dependent forever, which is the
      // exact harm --by exists to prevent. `done` is fine: the edge is
      // satisfied on arrival, so it costs nothing beyond a line of frontmatter.
      if (replacement.data.status === 'dropped') {
        throw new FlowError(
          `--by names ${replacement.id}, which is itself dropped: those dependents could never become ready.\n` +
          '  Pick a live replacement, or drop them too with --force.'
        );
      }

      // `dep` refuses an edge that would close a loop. --by writes the same
      // kind of edge, checked before the drop is written, because a refusal
      // after it would leave the graph half-edited.
      const loops = graph.dependents(tickets, t.id).filter((d) =>
        statuses.LIVE.has(d.data.status) && d.id !== replacement.id && graph.wouldCycle(tickets, d.id, replacement.id)
      );
      if (loops.length) {
        throw new FlowError(
          `re-pointing at ${replacement.id} would close a dependency cycle:\n` +
          loops.map((d) => `  ${d.id} → ${replacement.id} → … → ${d.id}`).join('\n') +
          '\n  Pick a different replacement, or drop them too with --force.'
        );
      }
    }

    const affected = graph.transitiveDependents(tickets, t.id);
    if (affected.length && !flags.by && !flags.force) {
      throw new FlowError(
        `${t.id} has ${affected.length} live dependent${affected.length === 1 ? '' : 's'}, directly or through others:\n` +
        affected.map((d) => `  ${d.id}  ${d.data.status.padEnd(10)} ${d.data.title}`).join('\n') +
        '\n\nLeft alone they can never become ready. Pick one:\n' +
        `  flow drop ${t.id} --reason "${reason}" --by <id>    re-point them at the replacement\n` +
        `  flow drop ${t.id} --reason "${reason}" --force      drop them too`
      );
    }

    const from = t.data.status;
    t.data.status = 'dropped';
    t.data.reason = reason;
    t.data.resume = '';
    t.data.closed = store.now();
    const moved = store.writeTicket(t);
    out(`${t.id}  ${from} → dropped   ${t.data.title}`);
    out(`      reason: ${reason}`);
    if (moved) out(`      moved → ${rel(root, moved.to)}`);

    // --by only matters for tickets that depend on this one *directly*;
    // anything further out keeps working once the near edge is repaired.
    if (replacement) {
      const repointed = [];
      for (const d of graph.dependents(tickets, t.id)) {
        if (!statuses.LIVE.has(d.data.status)) continue;
        const kept = d.data.deps.filter((x) => x !== t.id);
        d.data.deps = [...new Set([...kept, ...(replacement.id === d.id ? [] : [replacement.id])])];
        store.writeTicket(d);
        repointed.push(d);
      }
      out(`\nre-pointed to ${replacement.id} (${replacement.data.title}):`);
      for (const d of repointed) out(`  ${d.id}  deps → [${d.data.deps.join(', ')}]`);
      if (!repointed.length) out('  nothing to re-point.');
      records.commit(root, `${t.id}: dropped, dependents re-pointed to ${replacement.id}`);
      records.syncLater(root);
      return 0;
    }

    if (flags.force && affected.length) {
      out(`\ndropped with it (${affected.length}):`);
      for (const d of affected) {
        d.data.status = 'dropped';
        d.data.reason = `dropped with ${t.id} (${t.data.title}), which it depended on`;
        d.data.resume = '';
        d.data.closed = store.now();
        store.writeTicket(d);
        out(`  ${d.id}  ${d.data.title}`);
      }
    }
    records.commit(root, `${t.id}: dropped`);
    records.syncLater(root);
    return 0;
  },
};

/**
 * Move tickets to another place: `home`, the tickets in ~/.flow/, or the
 * folder of another project. Each takes the next free number there and keeps
 * its old id as `was:`, so the old id still finds it.
 *
 * A dependency or a parent across 2 places could never be resolved, so a
 * ticket linked to one staying behind is refused. Moving the linked tickets
 * together is fine: their links are rewritten to the new ids.
 *
 * The folder moves whole, files git ignores included, so a prototype's
 * installed packages go with it.
 */
actions.move = {
  section: 'tickets',
  args: '<id>... <home|project folder>',
  summary: 'move tickets to ~/.flow/ or another project, each taking a new number there',
  run({ positional, usage }) {
    if (positional.length < 2) throw new FlowError(`usage: ${usage}`);
    const to = positional[positional.length - 1];
    const refs = positional.slice(0, -1);

    const from = locate(refs[0]);
    const moving = refs.map((ref) => store.findTicket(from.tickets, ref));
    const ids = new Set(moving.map((t) => t.id));

    const target = to.toLowerCase() === store.HOME_WORD ? store.homeRoot() : path.resolve(to);
    if (!store.isHome(target) && !fs.existsSync(path.join(target, '.flow'))) {
      throw new FlowError(`${to} is neither home nor a Flow project: no .flow/ in ${target}.`);
    }
    if (path.resolve(store.recordsDir(target)) === path.resolve(store.recordsDir(from.root))) {
      throw new FlowError(`${moving[0].id} already lives there.`);
    }

    const links = [];
    for (const t of moving) {
      for (const d of t.data.deps) if (!ids.has(d)) links.push(`${t.id} depends on ${d}`);
      if (t.data.parent && !ids.has(t.data.parent)) links.push(`${t.id} has parent ${t.data.parent}`);
    }
    for (const other of from.tickets) {
      if (ids.has(other.id)) continue;
      for (const d of other.data.deps) if (ids.has(d)) links.push(`${other.id} depends on ${d}`);
      if (ids.has(other.data.parent)) links.push(`${other.id} has parent ${other.data.parent}`);
    }
    if (links.length) {
      throw new FlowError(
        `a link across 2 places could never be followed:\n${links.map((l) => `  ${l}`).join('\n')}\n` +
        '  Move the linked tickets in the same command, or remove the links first with flow dep and flow edit --parent.'
      );
    }

    const there = store.readTickets(target);
    const prefix = store.prefixOf(target);
    const renamed = new Map();
    for (const t of [...moving].sort((a, b) => store.idNumber(a.id) - store.idNumber(b.id))) {
      const next = store.nextId([...there, ...[...renamed.values()].map((id) => ({ id }))], prefix);
      renamed.set(t.id, next);
    }

    for (const t of moving) {
      const id = renamed.get(t.id);
      const parent = statuses.TERMINAL.has(t.data.status) ? store.archiveDir(target) : store.ticketsDir(target);
      const folder = path.join(parent, `${id}-${store.labelOf(t)}`);
      if (fs.existsSync(folder)) throw new FlowError(`${folder} already exists.`);
      fs.mkdirSync(parent, { recursive: true });
      store.moveFolder(t.dir, folder);
      Object.assign(t, { root: target, dir: folder, dirName: path.basename(folder), file: path.join(folder, 'ticket.md') });
      t.data.was = t.id;
      t.data.deps = t.data.deps.map((d) => renamed.get(d) || d);
      t.data.parent = renamed.get(t.data.parent) || t.data.parent;
      t.data.id = id;
      store.writeTicket(t);
      out(`${t.data.was} → ${id}   ${t.data.title}`);
    }

    const said = [...renamed].map(([a, b]) => `${a} → ${b}`).join(', ');
    records.commit(from.root, `moved away: ${said}`);
    records.commit(target, `moved in: ${said}`);
    records.syncLater(from.root);
    records.syncLater(target);
    // Only a project's own id leads home: from inside a project, an id missing
    // there is looked for among the tickets that moved to ~/.flow/. A ticket
    // left behind that was renumbered from the same id is found first.
    if (store.isHome(target)) {
      const left = store.readTickets(from.root);
      const leads = [...renamed.keys()].filter((old) => !left.some((t) => t.data.was === old));
      if (leads.length) out(`\nthe old id still finds it from the project: flow ${leads[0]}`);
    }
    return 0;
  },
};

// ---------------------------------------------------------------- the verbs

/**
 * One command per status, built from the table. Every refusal lives in
 * `transition`, so these carry no logic of their own beyond naming a target,
 * which is why adding a status to `statuses.js` is the whole cost of adding a
 * status.
 */
for (const s of statuses.VERBS) {
  const needsReason = statuses.NEEDS_REASON.has(s.name);
  actions[s.verb] = {
    section: 'status',
    args: '<id>',
    summary: statuses.DOES[s.verb],
    flags: {
      ...(needsReason
        ? { reason: { required: true, arg: '"<why>"', missing: `${s.verb}ing needs a reason: in six months it is the only thing that explains the ticket.` } }
        : {}),
      force: { bool: true },
    },
    run({ positional, flags, usage }) {
      if (!positional[0]) throw new FlowError(`usage: ${usage} <id>`);
      const { root, tickets, t } = locate(positional[0]);
      return transition(t, tickets, root, s.name, {
        force: flags.force,
        reason: flags.reason ? String(flags.reason).trim() : '',
        verb: `flow ${s.verb} ${t.id}`,
      });
    },
  };
}

// ---------------------------------------------------------------- ticket skills

/**
 * The `/` list's ticket rows follow every write: `lib/ticket-skills.js`. Once
 * per command, after it ran, so a command that refused changes nothing. The
 * project is the one this runs in, and the tickets in ~/.flow/ are always
 * synced, so a move between the two updates both. A failure here never fails
 * the command, whose write already landed.
 */
function syncSkills() {
  let project = null;
  try {
    project = projectRoot();
  } catch {
    // Outside a project: only the tickets in ~/.flow/.
  }
  try {
    ticketSkills.sync({ project });
  } catch (e) {
    process.stderr.write(`flow: the ticket skills were not updated: ${e.message}\n`);
  }
}

const WRITES = ['new', 'edit', 'dep', 'file', 'drop', 'move', ...statuses.VERBS.map((s) => s.verb)];
for (const name of WRITES) {
  const run = actions[name].run;
  actions[name].run = (call) => {
    const code = run(call);
    syncSkills();
    return code;
  };
}

module.exports = { actions, fallback: actions.get, transition };
