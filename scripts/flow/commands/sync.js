'use strict';
/**
 * `flow sync`: save this machine's `~/.flow/`, bring the other machines' work
 * down, and send the result up.
 *
 * `~/.flow/` is one private git repository, and that repository is the whole
 * of how Flow reaches another machine: the rules, the workflow notes, the
 * study cases, the private skills, the wiki and the tickets that belong to no
 * project all live in it already. A project travels through its own
 * repository, and Flow leaves it alone.
 *
 * Typed, never automatic. The user asked for the smallest version that works,
 * so nothing downloads when a session opens and nothing uploads when a file
 * changes. Both of those are parked in `lab/backlog/beta.md`.
 *
 * A machine on a lower changelog entry than another machine's record syncs
 * nothing until `flow up` brings it level: each machine migrates its own copy,
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
const links = require('../lib/skill-links');
const failures = require('../lib/failures');
const version = require('../lib/version');

const actions = {};

actions.sync = {
  section: 'setup',
  summary: 'save ~/.flow/, bring the other machines\' work down, then send it up',
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
    return 0;
  },
};

module.exports = actions;
