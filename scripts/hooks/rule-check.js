#!/usr/bin/env node
'use strict';
/**
 * rule-check.js: the PreToolUse hook on Edit and Write.
 *
 * One hook, one script, every check. Recording, warning and blocking are the
 * same check at the same moment, and each check's own `tier` field decides
 * which of the three happens. No hook per rule, and no second script that only
 * warns.
 *
 * `lib/checks/judge.js` judges the edit. This file is the wiring.
 *
 * A warning the agent must read goes in `additionalContext`.
 * `permissionDecisionReason` reaches Claude only on a deny; on an allow it goes
 * to the terminal and nowhere else, so a warning written there is a warning
 * nobody acts on.
 *
 * It never returns "allow". guard.js takes the same line: a hook that only ever
 * denies or stays quiet cannot widen what the permission system already
 * allows, so a bug here fails safe.
 *
 * Unlike guard.js, a throw here falls through silently. guard.js is the last
 * thing standing between the agent and git, so it fails closed. This file
 * measures writing habits, and breaking every edit in the session over a bug in
 * one check would cost far more than the counts are worth.
 */

const { judge } = require('../lib/checks/judge');
const hook = require('../lib/hook');

try {
  const call = hook.event();
  const said = call && judge(call);
  if (said) hook.answer('PreToolUse', said);
} catch {
  // Silence is the whole point. See the note at the top of the file.
}
