# Writing a documentation page

A page no session loads: a reader arrives from a search or an index, reads it once, and closes it. Every rule `style.md` gives for everything Flow writes holds. These change or add to it.

- **Never send the reader away for a definition.** `style.md` → `## 3. One home per fact` does not bind a page. State it in one sentence, then link for the full account.
- **Keep a sentence only where the reader would get something wrong without it.** The reader came to use Flow, not to read about it. Cut a rule the example already shows, a list repeating what the output prints, and a second example showing nothing new.
- **Open with a table of contents** under a `## Table of contents` heading, one line per heading, in order. Each line ends with a few words after a colon saying what the section holds, so the table of contents alone tells the reader where to go.
- **Plan what the reader knows on arrival, what they know on leaving, and the path between.** The arrival state decides the first section.
- **A link names the page it points at.** Never a position. No *the next page*, no *as shown above*, no numbered filenames. Order lives in the index alone.
- **Every code fence names a language**: `md`, `sh`, `json`, `console` for a command typed with `$ ` and its output, `text` for a tree or output shown without its command. Never `bash` for output: it colours words such as `done` as code, and an apostrophe starts a string. A guess beats a bare fence.
- **Update the index in the same edit that adds, renames or drops a page.** The index is the `README.md` in the page's folder, such as `docs/dev/README.md`.
