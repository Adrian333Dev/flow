/**
 * How close one record is to others, by the words they share and the labels
 * they share. The filing check of `flow findings new` ranks the findings with
 * it, and `flow tickets new` will rank the tickets with it, so both refuse a
 * near-duplicate the same way.
 *
 * Each record is a bag of terms: its words, and its labels as `label:<name>`.
 * A term weighs more the rarer it is across the records compared (its inverse
 * document frequency), so `typecheck` counts and `the` never does, and a rare
 * label counts more than a common one. Title words count twice, since a title
 * states the claim. The score is the cosine of the 2 weighted bags: 0 shares
 * nothing, 1 is the same text.
 */

// Words that say nothing about a subject. Short words (under 3 letters) are dropped before this list is read.
const STOP = new Set(`
  the and for with that this from into onto than then when where what which who whom whose why how
  are was were been being has have had does did doing not nor but yet its it's itself
  can could would should will shall may might must one two any all each every some none other
  only also just very more most less much many few such same own out off over under again once
  here there now never always still even about after before while until because since though
  your you our ours they them their his her him she use used uses using get gets got make makes made
`.split(/\s+/).filter(Boolean));

const TITLE_WEIGHT = 2;

/** A record to compare: its title, its text and its labels. */
interface Record {
  title?: string;
  text?: string;
  labels?: string[];
}

type Bag = Map<string, number>;

/** A word as compared: lowercase, a plural `s` dropped, so `types` meets `type`. */
const stem = (word: string) => (word.length > 4 && word.endsWith('s') && !word.endsWith('ss') ? word.slice(0, -1) : word);

/** The words of a text that carry a subject. */
function words(text: unknown): string[] {
  return String(text ?? '')
    .toLowerCase()
    .replace(/['’]/g, '')
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length >= 3 && !STOP.has(w) && !/^\d+$/.test(w))
    .map(stem);
}

/** The terms of a record, each with its weight before rarity. */
function bag(record: Record): Bag {
  const terms: Bag = new Map();
  for (const w of words(record.text)) terms.set(w, 1);
  for (const w of words(record.title)) terms.set(w, TITLE_WEIGHT);
  for (const l of record.labels || []) terms.set(`label:${l.toLowerCase()}`, TITLE_WEIGHT);
  return terms;
}

/**
 * A scorer for `target` against `records`: rarity is counted over all of them,
 * the target included, so a word only the target holds weighs the most and
 * matches nothing.
 */
function scorer(target: Record, records: Record[]) {
  const bags = records.map(bag);
  const mine = bag(target);
  const seen = new Map<string, number>();
  for (const b of [...bags, mine]) for (const term of b.keys()) seen.set(term, (seen.get(term) || 0) + 1);
  const total = bags.length + 1;
  // Smoothed, so a word every record shares still counts a little: in a folder of 2, the pair shares every word it shares.
  const rarity = (term: string) => Math.log(1 + total / (seen.get(term) || 1));
  const norm = (b: Bag) => Math.sqrt([...b].reduce((sum, [term, w]) => sum + (w * rarity(term)) ** 2, 0));
  const mineNorm = norm(mine);
  return bags.map((b) => {
    let shared = 0;
    for (const [term, w] of b) {
      const own = mine.get(term);
      if (own) shared += own * w * rarity(term) ** 2;
    }
    const n = mineNorm * norm(b);
    return n ? shared / n : 0;
  });
}

/** `records` closest to `target` first, each with its score; a record sharing nothing is left out. */
function rank<T extends Record>(target: Record, records: T[]) {
  const scores = scorer(target, records);
  return records
    .map((record, i) => ({ record, score: scores[i] }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);
}

export type { Record };
export { words, rank };
