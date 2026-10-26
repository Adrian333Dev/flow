// `flow tickets tree` as it stood in scripts/commands/tickets.js, with the
// `render.tree` it called and that file's `treeNote`. Moved 2026-10-26 by fw-234.

/**
 * The whole shape, which nothing else shows. `ls` is a flat table with a parent
 * column and `get` is one ticket: the hierarchy that `parent` builds had no
 * renderer at all.
 */
actions.tree = {
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

    // Done, dropped and parked collapse into a count by default. A tree
    // carrying every finished ticket, or a row of reasons per parked one, is
    // the noise a tree exists to strip.
    const quiet = (t) => statuses.TERMINAL.has(t.data.status) || t.data.status === 'parked';
    const visible = flags.all ? pool : pool.filter((t) => !quiet(t));
    if (!visible.length) { out('nothing live here (flow tickets tree --all includes parked, done and dropped).'); return 0; }

    out(render.tree(graph.forest(visible), tickets));
    const parked = pool.filter((t) => t.data.status === 'parked').length;
    const hidden = pool.length - visible.length - (flags.all ? 0 : parked);
    const left = flags.all ? [] : [parked ? `${parked} parked` : '', hidden ? `${hidden} done or dropped` : ''].filter(Boolean);
    out(`\n${visible.length} ticket${visible.length === 1 ? '' : 's'}` +
      (left.length ? `, ${left.join(', ')} hidden (flow tickets tree --all)` : ''));
    return 0;
  },
};

// ---------------------------------------------------------------- lib/tickets/render.js

/**
 * The forest, drawn. One line per ticket: the branch, then status and whatever
 * single fact matters most about it: how much of a parent is done, what a
 * blocked ticket waits on, why a parked one was set aside.
 */
function tree(nodes, all) {
  if (!nodes.length) return 'nothing to show.';
  const index = graph.indexById(all);
  const rows = [];

  const walk = (list, prefix, root) => {
    list.forEach((n, i) => {
      const last = i === list.length - 1;
      const t = n.ticket;
      rows.push([
        prefix + (root ? '' : last ? '└── ' : '├── ') + store.nameOf(t),
        t.data.status,
        treeNote(t, all, index),
      ]);
      if (n.children.length) walk(n.children, root ? '' : prefix + (last ? '    ' : '│   '), false);
    });
  };

  walk(nodes, '', true);
  return columns(rows);
}

/**
 * Counted against every ticket, never the visible slice: a parent whose
 * children are all done must still read 3/3 once those children are hidden.
 */
function treeNote(t, all, index) {
  const kids = graph.children(all, t.id);
  if (kids.length) return `${progressOf(t, all)} done`;
  if (t.data.status === 'todo') {
    const unmet = graph.unmetDeps(t, index);
    if (unmet.length) return `blocked by ${unmet.map((u) => u.dep).join(', ')}`;
  }
  return t.data.reason || '';
}
