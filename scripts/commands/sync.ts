/**
 * `flow sync`: save this machine's `~/.flow/`, bring the other machines' work
 * down, and send the result up. Typed inside a project, it does the same for
 * the project's tickets.
 *
 * `~/.flow/` is one private git repository, and that repository is the whole
 * of how Flow reaches another machine: the rules, the workflow notes, the
 * study cases, the wiki and the tickets that belong to no project all live in
 * it already. A project's tickets travel on the project's
 * own `flow` branch, and `features/tickets/records.ts` holds how.
 *
 * Both also run by themselves, from `scripts/jobs/records-sync.ts`: after a status
 * move, after a reply once 30 minutes have passed, and at session end. Typing
 * it sends at once.
 *
 * `features/machine/flow-repo.ts` holds the repository, the machine records, the commit
 * named for the machine, and the list of what never travels.
 */

import path from 'node:path';
import { out } from '../shared/cli.ts';
import type { Action } from '../shared/cli.ts';
import * as repo from '../features/machine/flow-repo.ts';
import * as records from '../features/tickets/records.ts';
import * as failures from '../features/logs/failures.ts';
import * as paths from '../shared/paths.ts';

const actions: Record<string, Action> = {};

actions.sync = {
  section: 'setup',
  json: false,
  summary: 'save ~/.flow/ and the project\'s tickets, bring the others\' work down, then send it up',
  flags: { root: { arg: '<dir>', hidden: true } },
  run({ flags }) {
    const at = paths.folders(flags.root);
    const linked = records.linkedAt(process.env.FLOW_PROJECT || process.cwd());
    let result;
    try {
      result = repo.syncHome(at, linked);
    } catch (e: any) {
      // A refusal, such as the same lines changed on 2 machines, is the design working.
      if (/^(could not|git |committed here)/.test(e.message)) {
        failures.record(at.flow, { source: 'sync', what: 'flow sync', job: 'sync ~/.flow', error: e.message });
      }
      // The project's tickets never wait on ~/.flow/.
      syncProject();
      throw e;
    }
    const { came, sent, pushed, renumbered } = result;
    failures.cleared(at.flow, 'sync ~/.flow');
    out(came ? `came down: ${came} file${came === 1 ? '' : 's'}` : 'nothing new came down.');
    if (sent) out(`went up: ${sent}`);
    else if (pushed) out(`went up: ${pushed} commit${pushed === 1 ? '' : 's'} an earlier sync could not send`);
    else out('nothing changed here, so nothing went up.');
    for (const r of renumbered) out(`  ${r.from} is now ${r.to}: another machine took ${r.from} first.`);
    return syncProject();
  },
};

/**
 * The project's `flow` branch, where `flow sync` was typed inside one.
 * FLOW_PROJECT names the project outright, so no walk up from it reaches the
 * folders around it.
 */
function syncProject() {
  const named = process.env.FLOW_PROJECT && path.resolve(process.env.FLOW_PROJECT);
  const root = named ? (records.onBranch(named) ? named : null) : records.projectAt(process.cwd());
  if (!root) return 0;
  const done = records.sync(root, 'saved');
  const name = path.basename(root);
  if (done.ok) {
    out(`${name}'s tickets: ${done.came ? `${done.came} file${done.came === 1 ? '' : 's'} came down` : 'nothing new came down'}, ` +
      `${done.sent ? `${done.sent} commit${done.sent === 1 ? '' : 's'} went up` : 'nothing went up'}.`);
    return 0;
  }
  out(`${name}'s tickets: not sent, ${done.offline ? `the remote did not take them. git said: ${done.why}` : `${done.why}.`}`);
  return 1;
}

export default actions;
