/**
 * `flow search`: the wiki folders and research reports closest to a
 * situation (features/usage/search.ts). `flow visit`, hidden: the
 * flow-session mod counts a read inside one of them (features/usage/usage.ts).
 */

import { FlowError } from '../shared/error.ts';
import { out, json } from '../shared/cli.ts';
import type { Action } from '../shared/cli.ts';
import { projectRoot, projectRootOrNull } from '../shared/project.ts';
import { search } from '../features/usage/search.ts';
import * as usage from '../features/usage/usage.ts';

const MAX_ROWS = 10;

const actions: Record<string, Action> = {};

actions.search = {
  section: 'knowledge',
  args: '-- "<words>"',
  summary: 'the wiki folders and research reports closest to a situation, one line each',
  query: true,
  run({ query: words }) {
    if (!words?.trim()) throw new FlowError('say what to look for: flow search -- "<words>"');
    const hits = search(words, projectRootOrNull());
    json(hits);
    if (!hits.length) {
      out('nothing in the wiki or the research folders shares these words.');
      return 0;
    }
    for (const h of hits.slice(0, MAX_ROWS)) out(`${h.path}${h.about ? `   ${h.about}` : ''}`);
    if (hits.length > MAX_ROWS) out(`and ${hits.length - MAX_ROWS} more`);
    return 0;
  },
};

actions.visit = {
  hidden: true,
  args: '<folder>',
  summary: 'count a read inside a wiki folder or a research topic, for the ticket given or the project',
  flags: { ticket: { arg: '<id>' } },
  run({ positional, flags }) {
    const [folder] = positional;
    if (!folder || !/^(research:)?[\w.-]+$/.test(folder)) throw new FlowError('usage: flow visit <wiki-folder|research:topic> [--ticket <id>]');
    const file = usage.add(projectRoot(), folder, flags.ticket);
    json({ folder, file });
    return 0;
  },
};

export default actions;
