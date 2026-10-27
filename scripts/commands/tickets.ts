/**
 * Everything that acts on a ticket: `flow tickets`. The noun typed alone
 * lists, `flow tickets -- "label:ui"` narrows the list, and every other word
 * after it is a verb: `flow tickets get exp-47`, `flow tickets start exp-47`.
 *
 * The actions live in `features/tickets/`, grouped by what they do. This file
 * assembles them and wraps the writes.
 */

import type { Action } from '../shared/cli.ts';
import * as registry from '../shared/registry.ts';
import * as statuses from '../features/tickets/statuses.ts';
import { touched, setWriting } from '../features/tickets/places.ts';
import { listing, labels, check, get } from '../features/tickets/read-actions.ts';
import { writeActions } from '../features/tickets/write-actions.ts';
import { drop, move } from '../features/tickets/drop-actions.ts';
import { statusActions } from '../features/tickets/status-actions.ts';

const actions: Record<string, Action> = { labels, check, get, ...writeActions, drop, move, ...statusActions };

/**
 * A command that wrote a ticket registers the projects it touched
 * (shared/registry.ts). A refusal here never fails the command, whose write
 * already landed.
 */
function registerProjects() {
  for (const root of touched) {
    try {
      registry.register(root);
    } catch {
      // The registry is unwritable: `flow doctor` says so.
    }
  }
}

const WRITES = ['new', 'edit', 'rank', 'file', 'drop', 'move', ...statuses.VERBS.map((s) => s.verb)];
for (const name of WRITES) {
  const run = actions[name].run;
  actions[name].run = (call) => {
    setWriting(true);
    let code;
    try {
      code = run(call);
    } finally {
      setWriting(false);
    }
    registerProjects();
    return code;
  };
}

export { actions };

export default {
  summary: 'the tickets: list, read, create, change and move them',
  list: listing,
  actions,
};
