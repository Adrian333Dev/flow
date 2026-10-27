/**
 * The query `flow notes` takes as one quoted argument, and the `#` list and the
 * board will take too. Terms are separated by spaces and all must hold:
 *
 *   "label:profile,ui cache"     label profile or ui, and the word cache
 *
 * A term is a word, or `field:value` where the left side is one of the fields
 * the command names. A comma inside a value means either. A word with a colon
 * whose left side is no field stays a word, so `https://x` is searched as text.
 */

interface Term {
  field: string | null;
  values: string[];
}

/**
 * The terms of a query: `{ field, values }`, with `field` null for a word (its
 * one value). Values are lowercased for matching, unless `keepCase`: a date
 * like `2026-10-12T10:00` compares as typed.
 */
function parse(query: unknown, fields: string[], { keepCase = false } = {}): Term[] {
  const terms: Term[] = [];
  const cased = (v: string) => (keepCase ? v : v.toLowerCase());
  for (const raw of String(query ?? '').split(/\s+/).filter(Boolean)) {
    const at = raw.indexOf(':');
    const field = at > 0 ? raw.slice(0, at).toLowerCase() : null;
    const value = field ? raw.slice(at + 1) : '';
    if (field && fields.includes(field) && value) {
      terms.push({ field, values: value.split(',').filter(Boolean).map(cased) });
    } else {
      terms.push({ field: null, values: [cased(raw)] });
    }
  }
  return terms;
}

/** True when some term filters on `field`. */
const has = (terms: Term[], field: string) => terms.some((t) => t.field === field);

/**
 * A test for a record. `tests` holds one function per field and one for words,
 * each `(record, value) => boolean`: `{ word, label, project }`.
 */
function matcher(terms: Term[], tests: Record<string, (record: any, value: string) => boolean>) {
  return (record: any) => terms.every((term) => term.values.some((v) => tests[term.field || 'word'](record, v)));
}

export type { Term };
export { parse, has, matcher };
