#!/usr/bin/env node
/**
 * failures.ts: the PostToolUseFailure and StopFailure hook.
 *
 * Writes one line into the failure log for every failure of something Flow
 * built or chose: an MCP tool, a Flow command or bundled script the agent ran,
 * and an API error that ended a turn. `features/logs/failures.ts` holds which calls
 * count and the line's shape.
 *
 * Claude Code ignores what StopFailure prints, and a line here is never for
 * the agent, so this prints nothing and always exits 0.
 */

import * as failures from '../features/logs/failures.ts';
import * as hook from '../shared/hook.ts';

try {
  const line = failures.fromHook(hook.event());
  if (line) failures.record(undefined, line);
} catch {
  // A log that cannot be written is not a reason to disturb the session.
}
