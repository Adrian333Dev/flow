import { FlowError } from '../../shared/error.ts';
import type { Action } from '../../shared/cli.ts';
import * as statuses from './statuses.ts';
import { locate } from './places.ts';
import { transition } from './transition.ts';
import { activityFrom } from './write-actions.ts';

/**
 * One command per status, built from the table. Every refusal lives in
 * `transition`, so these carry no logic of their own beyond naming a target,
 * which is why adding a status to `statuses.ts` is the whole cost of adding a
 * status.
 */
const statusActions: Record<string, Action> = {};

for (const s of statuses.VERBS) {
  const needsReason = statuses.NEEDS_REASON.has(s.name);
  statusActions[s.verb] = {
    args: '<id>',
    summary: statuses.DOES[s.verb],
    flags: {
      ...(s.name === 'in-progress' ? { activity: { arg: '<word>' } } : {}),
      ...(needsReason
        ? { reason: { required: true, arg: '"<why>"', missing: `${s.verb}ing needs a reason: in six months it is the only thing that explains the ticket.` } }
        : {}),
      force: { bool: true },
    },
    run({ positional, flags, usage }) {
      if (!positional[0]) throw new FlowError(`usage: ${usage} <id>`);
      const activity = activityFrom(flags.activity);
      const { root, tickets, t } = locate(positional[0]);
      return transition(t, tickets, root, s.name, {
        activity,
        force: flags.force,
        reason: flags.reason ? String(flags.reason).trim() : '',
        verb: `flow tickets ${s.verb} ${t.id}`,
      });
    },
  };
}

export { statusActions };
