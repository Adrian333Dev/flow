'use strict';
/**
 * A hook's 2 ends: the event Claude Code sends it on stdin, and the JSON it
 * reads back on stdout. Every hook in `hooks/` goes through here, so each one
 * is only the wiring between an event and the library.
 */

const fs = require('fs');

/** The event, or null where stdin holds nothing that parses: a hook run by hand. */
function event() {
  try {
    return JSON.parse(fs.readFileSync(0, 'utf8'));
  } catch {
    return null;
  }
}

/** Whole output, as given: `decision`, `systemMessage` and the rest. */
function reply(payload) {
  process.stdout.write(`${JSON.stringify(payload)}\n`);
}

/** Output under the event that fired, such as `additionalContext` or `permissionDecision`. */
function answer(hookEventName, fields) {
  reply({ hookSpecificOutput: { hookEventName, ...fields } });
}

module.exports = { event, reply, answer };
