'use strict';
// `descendants` from `scripts/lib/tickets/graph.js`, as it stood when `fw-234`
// archived it: `flow tickets tree --parent` kept the ticket and these. The query
// `parent:<id>` now walks up from each ticket with `graph.isUnder` instead.
// `children` is `graph.children`.

/** Children, their children, and so on: what `flow tickets tree --parent` kept. */
function descendants(tickets, id) {
  const found = [];
  const seen = new Set([id]);
  let frontier = [id];
  while (frontier.length) {
    const next = [];
    for (const current of frontier) {
      for (const c of children(tickets, current)) {
        if (seen.has(c.id)) continue;
        seen.add(c.id);
        found.push(c);
        next.push(c.id);
      }
    }
    frontier = next;
  }
  return found;
}

module.exports = { descendants };
