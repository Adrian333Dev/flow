# Writing a documentation page

A page in a published documentation set. Nobody loads it into a session: a reader arrives from a search or an index, reads it once, and closes it. Every rule `style.md` gives for everything Flow writes still holds. These change it or add to it.

- **Never send the reader away for a definition.** State it in one sentence, then link for the full account. `style.md` → `## 3. One home per fact` routes a fact to one home and a pointer everywhere else, which costs a loaded file nothing and costs this reader the page.
- **No length limit.** `style.md` → `### Only in a loaded file` and `## 9. Transformations` do not apply. Cut a sentence for carrying no information, never for costing space.
- **Open with a table of contents** under a `## Table of contents` heading, one line per heading, in order.
- **Plan what the reader knows on arrival, what they know on leaving, and the path between.** The arrival state decides the first section. Skip it and the page opens in the middle.
- **A link names the page it points at.** Never a position. No *the next page*, no *as shown above*, no numbered filenames. Order lives in the index alone, so inserting a page breaks nothing.
- **Every code fence names a language**, so the reader can tell a file from a command from what a command printed: `md`, `sh`, `json`, `text` for output and trees. A guess beats a bare fence. Ruled by the user 2026-09-16.
- **Update the index in the same edit that adds, renames or drops a page.** The index is the `README.md` in the page's folder, such as `docs/manual/README.md`. A page the index misses is a page nobody finds.
