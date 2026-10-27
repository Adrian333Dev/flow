/**
 * Groups: a label with a card. The card, `.flow/groups/<label>.md`, gives the
 * label a rank and a park state. Carrying the label is membership, so a ticket
 * holds no field for it, and deleting the card turns the group back into a
 * plain label. `flow-issue` is a group with no file.
 *
 *   ---
 *   title: post-v1
 *   rank: 1000
 *   parked: After release 1 of the Flow redesign
 *   group_by: label
 *   ---
 *
 * A parked group holds every open ticket carrying its label, whatever its other
 * labels. The ticket's file keeps its status; `store.statusOf` reads it as
 * `parked`, so no list, query or `--json` record shows it as workable.
 */

import fs from 'node:fs';
import path from 'node:path';
import * as frontmatter from '../../shared/frontmatter.ts';
import { toRank } from './fields.ts';
import type { Ticket } from './types.ts';

/** A card as read. `id` and `data.rank` are the shape `rank.place` takes, so a group is ranked by the tickets' own code. */
interface Group {
  id: string;
  label: string;
  file: string;
  body: string;
  builtIn: boolean;
  data: { title: string; rank: number | ''; parked: string; group_by: string };
}

const CARD_KEYS = ['title', 'rank', 'parked', 'group_by'];

// `group_by: label` lets the board split a group by its tickets' other labels:
// `flow-issue` tickets by their type label, `rework-loop` or `wrong-tool`.
const BUILT_IN: Record<string, Group['data']> = {
  'flow-issue': { title: 'flow-issue', rank: '', parked: '', group_by: 'label' },
};

const groupsDir = (records: string) => path.join(records, 'groups');

function card(records: string, label: string, data: Group['data'], body = '', builtIn = false): Group {
  return { id: label, label, file: path.join(groupsDir(records), `${label}.md`), body, builtIn, data };
}

/** Every group of a place: its cards, and the built-in ones no card overrides. `records` is the place's `.flow/` folder. */
function readGroups(records: string): Group[] {
  const found = new Map<string, Group>();
  for (const [label, data] of Object.entries(BUILT_IN)) found.set(label, card(records, label, { ...data }, '', true));

  const dir = groupsDir(records);
  if (fs.existsSync(dir)) {
    for (const name of fs.readdirSync(dir)) {
      if (!name.endsWith('.md')) continue;
      const label = name.slice(0, -3).toLowerCase();
      const { data, body } = frontmatter.parse(fs.readFileSync(path.join(dir, name), 'utf8'));
      const base = BUILT_IN[label];
      found.set(label, card(records, label, {
        title: data.title ? String(data.title).trim() : label,
        rank: toRank(data.rank),
        parked: data.parked ? String(data.parked).trim() : '',
        group_by: data.group_by ? String(data.group_by).trim() : base?.group_by || '',
      }, body));
    }
  }
  return [...found.values()].sort((a, b) => a.label.localeCompare(b.label));
}

/** Writes the card, making `.flow/groups/` where it is missing. A built-in group gets its file here. */
function writeGroup(g: Group) {
  fs.mkdirSync(path.dirname(g.file), { recursive: true });
  fs.writeFileSync(g.file, frontmatter.stringify(g.data, CARD_KEYS, g.body));
  g.builtIn = false;
}

const hasRank = (g: Group) => typeof g.data.rank === 'number';

/** The ranked groups, first first. Only these reorder a list: an unranked group leaves the order alone. */
const ranked = (groups: Group[]) =>
  groups.filter(hasRank).sort((a, b) => (a.data.rank as number) - (b.data.rank as number) || a.label.localeCompare(b.label));

/** The labels on `t` that are groups. */
const groupsOf = (t: Ticket, groups: Group[]) => groups.filter((g) => t.data.labels.includes(g.label)).map((g) => g.label);

/** The first parked group among `t`'s labels, or ''. */
function holder(t: Ticket, groups: Group[]) {
  return groups.find((g) => g.data.parked && t.data.labels.includes(g.label))?.label || '';
}

export type { Group };
export { CARD_KEYS, BUILT_IN, groupsDir, card, readGroups, writeGroup, hasRank, ranked, groupsOf, holder };
