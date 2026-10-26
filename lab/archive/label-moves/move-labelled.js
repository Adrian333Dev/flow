'use strict';
// From scripts/commands/tickets.js before fw-149, with the two actions that called it.
// It leans on the file's transition(), load(), records, statuses and out().

/**
 * Moves every ticket carrying `label` that `pick` selects, with one commit and
 * one send: a set put off together is one act, and a commit per ticket would
 * bury the log. A ticket whose move refuses stays where it was, and the rest
 * go on. A label no ticket carries is no error, since labels are free: the
 * labels in use are listed, so a typo shows.
 */
function moveLabelled(label, { pick, targetOf, reason, verb, noun, none }) {
  const { root, tickets } = load();
  const name = String(label).trim().toLowerCase();
  const picked = tickets.filter((t) => t.data.labels.includes(name) && pick(t));
  if (!picked.length) {
    const used = [...new Set(tickets.flatMap((t) => t.data.labels))].sort();
    out(`${none(name)}${used.length ? ` Labels in use: ${used.join(', ')}.` : ''}`);
    return 0;
  }

  const refused = [];
  for (const t of picked) {
    try {
      transition(t, tickets, root, targetOf(t), { reason, verb: `flow ${verb} ${t.id}`, batch: true });
    } catch (e) {
      if (!(e instanceof FlowError)) throw e;
      refused.push(`  ${t.id}  ${e.message.split('\n')[0]}`);
    }
  }

  const moved = picked.length - refused.length;
  const count = `${moved} ticket${moved === 1 ? '' : 's'}`;
  if (moved) {
    records.commit(root, `label ${name}: ${noun} ${count}`);
    records.syncLater(root);
  }
  out(`\n${noun} ${count} labelled ${name}${reason ? `: ${reason}` : ''}`);
  if (refused.length) {
    out(`\nrefused (${refused.length}):`);
    for (const r of refused) out(r);
  }
  return refused.length ? 1 : 0;
}


// ---- in the park action's run(), before the single-ticket path:

      if (s.name === 'parked' && flags.label) {
        if (positional.length) throw new FlowError('give a ticket id or --label, not both.');
        return moveLabelled(flags.label, {
          pick: (t) => statuses.OPEN.has(t.data.status) && t.data.status !== 'parked',
          targetOf: () => 'parked',
          reason: String(flags.reason).trim(),
          verb: 'park',
          noun: 'parked',
          none: (name) => `no open ticket carries ${name}.`,
        });
      }

/**
 * The pair to `park --label`: every parked ticket carrying the label goes back
 * to the status it left, which `park` stored as `resume`.
 */
actions.revive = {
  section: 'status',
  summary: 'bring back every parked ticket with a label, each to where it stopped',
  flags: { label: { required: true, arg: '<label>' } },
  run({ flags }) {
    return moveLabelled(flags.label, {
      pick: (t) => t.data.status === 'parked',
      targetOf: (t) => (t.data.resume === 'in-progress' ? 'in-progress' : 'todo'),
      reason: '',
      verb: 'revive',
      noun: 'revived',
      none: (name) => `no parked ticket carries ${name}.`,
    });
  },
};
