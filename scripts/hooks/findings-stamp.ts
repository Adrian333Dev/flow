#!/usr/bin/env node
/**
 * findings-stamp.ts: the PostToolUse hook that sets `updated` on a finding
 * after an `Edit` or a `Write` in a findings folder, so the date says when
 * the claim last changed, whoever changed it. `flow findings` stamps its own
 * writes.
 *
 * Any error stays silent: a missed stamp costs a date, a broken hook costs
 * every edit.
 */

import * as hook from '../shared/hook.ts';
import * as findings from '../features/findings/findings.ts';

try {
  const call = hook.event();
  const file = call?.tool_input?.file_path;
  if (file && findings.isFindingFile(file)) findings.touch(file);
} catch {
  // see the header
}
