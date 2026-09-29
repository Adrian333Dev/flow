'use strict';
/**
 * `flow sync`: save this machine's `~/.flow/`, bring the other machines' work
 * down, and send the result up. Typed inside a project, it does the same for
 * the project's tickets.
 *
 * `~/.flow/` is one private git repository, and that repository is the whole
 * of how Flow reaches another machine: the rules, the workflow notes, the
 * study cases, the private skills, the wiki and the tickets that belong to no
 * project all live in it already. A project's tickets travel on the project's
 * own `flow` branch, and `lib/records.js` holds how.
 *
 * Both also run by themselves, from `scripts/records-sync.js`: after a status
 * move, after a reply once 30 minutes have passed, and at session end. Typing
 * it sends at once.
 *
 * A machine on a lower changelog entry than another machine's record syncs
 * nothing until `flow update` brings it level: each machine migrates its own copy,
 * and a copy in the old shape must never meet one in the new.
 *
 * A pull can bring skill lines written on the other machine, so the links
 * are made to match right after it, the way a session start would.
 *
 * `lib/flow-repo.js` holds the repository, the machine records, the commit
 * named for the machine, and the list of what never travels.
 */

const path = require('path');
const { out } = require('../lib/cli');
const machine = require('../lib/machine');
const repo = require('../lib/flow-repo');
const records = require('../lib/records');
const links = require('../lib/skill-links');
const failures = require('../lib/failures');
const version = require('../lib/version');

const actions = {};

actions.sync = {
  section: 'setup',
  summary: 'save ~/.flow/ and the project\'s tickets, bring the others\' work down, then send it up',
  flags: { root: { arg: '<dir>' } },
  run({ flags }) {
    const at = machine.folders(flags.root);
    const mine = version.applied(path.join(at.flow, 'version'));
    let result;
    try {
      result = repo.sync(at, mine.state === 'ok' ? mine.number : 0);
    } catch (e) {
      // A refusal, such as another machine being ahead, is the design working.
      if (/^(could not|git |committed here)/.test(e.message)) {
        failures.record(at.flow, { source: 'sync', what: 'flow sync', error: e.message });
      }
      // The project's tickets never wait on ~/.flow/.
      syncProject();
      throw e;
    }
    const { came, sent, pushed } = result;
    out(came ? `came down: ${came} file${came === 1 ? '' : 's'}` : 'nothing new came down.');
    if (came) {
      const done = links.apply({ home: at.flow, root: null, claude: at.claude, agents: at.agents });
      if (done.changed.length) out(done.changed.join('\n'));
    }
    if (sent) out(`went up: ${sent}`);
    else if (pushed) out(`went up: ${pushed} commit${pushed === 1 ? '' : 's'} an earlier sync could not send`);
    else out('nothing changed here, so nothing went up.');
    // Home tickets are sent every 30 minutes, not when made, so 2 machines can
    // take one number meanwhile. The one that arrived first keeps it.
    for (const r of records.renumber(at.flow, 'origin/main')) {
      out(`  ${r.from} is now ${r.to}: another machine took ${r.from} first.`);
    }
    return syncProject();
  },
};

/** The project's `flow` branch, where `flow sync` was typed inside one. */
function syncProject() {
  const root = records.projectAt(process.env.FLOW_PROJECT || process.cwd());
  if (!root) return 0;
  const done = records.sync(root, 'saved');
  const name = path.basename(root);
  if (done.ok) {
    out(`${name}'s tickets: ${done.came ? `${done.came} file${done.came === 1 ? '' : 's'} came down` : 'nothing new came down'}, ` +
      `${done.sent ? `${done.sent} commit${done.sent === 1 ? '' : 's'} went up` : 'nothing went up'}.`);
    return 0;
  }
  out(`${name}'s tickets: not sent, ${done.offline ? 'the remote could not be reached' : done.why}.`);
  return 1;
}

module.exports = actions;
