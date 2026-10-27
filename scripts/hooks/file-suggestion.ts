#!/usr/bin/env node
/**
 * `fileSuggestion`: the list of paths Claude Code shows after `@`, one per
 * line on stdout. `features/file-suggestion/file-suggestion.ts` says how it is found and kept
 * fast, and this file is the wiring. `--build <root>` is the detached walk
 * a keystroke starts.
 */

import { suggest, rebuild } from '../features/file-suggestion/file-suggestion.ts';
import * as hook from '../shared/hook.ts';

if (process.argv[2] === '--build') {
  rebuild(process.argv[3]);
} else {
  // No query is the bare `@`: the newest files.
  const query = String((hook.event() || {}).query || '');
  const shown = suggest(process.env.CLAUDE_PROJECT_DIR || process.cwd(), query);
  if (shown.length) process.stdout.write(shown.join('\n') + '\n');
}
