# Writing a documentation page

A page no session loads: a reader arrives from a search or an index, reads it once, and closes it. Every rule `style.md` gives for everything Flow writes holds. These change or add to it.

- **Write for a reader who knows Claude Code and has never seen this tool.** Assume the basics of AI coding agents and of Claude Code: a session, tokens, `CLAUDE.md`, a skill, `/clear`. Define every term the tool adds in plain words where it first appears, and any Claude Code feature past the basics. Test each line: could that reader say what it does?
- **Never send the reader away for a definition.** `style.md` → `## 3. One home per fact` does not bind a page. State it in one sentence, then link for the full account.
- **Keep a sentence only where it changes what the reader types, sees or decides.** The reader came to use the tool, and needs nothing of how it works inside. Cut how the agent does a job, a file the reader never opens, a reason the reader can act without, a rule the example already shows, a list repeating what the output prints, and a second example showing nothing new.
- **Explain a mechanism the reader meets in full**, such as syncing between computers: what it does, what the reader sees, what goes wrong and how to fix it. The files it keeps for itself stay out.
- **Explain no concept on a reference page.** A reference entry says what a thing does and its options. Where the entry needs a concept, give it one sentence and link the guide page that explains it.
- **Order a page by what the reader needs first.** Everyday things first, rare or destructive ones late, specialist ones last.
- **Expose nothing the reader never types.** A hidden command or flag, test machinery, and a file name the reader never acts on belong in the pages for people changing the tool.
- **Show real output**, copied from a run. Never type an example's output by hand.
- **Open with a table of contents** under a `## Table of contents` heading, one line per heading, in order. Each line ends with a few words after a colon saying what the section holds, so the table of contents alone tells the reader where to go. An index page is its own table of contents, and gets none.
- **Name a heading so a stranger knows what sits under it.** "The parts" names nothing. "What Flow adds to Claude Code" does.
- **Plan what the reader knows on arrival, what they know on leaving, and the path between.** The arrival state decides the first section.
- **A link names the page it points at.** Never a position. No *the next page*, no *as shown above*, no numbered filenames. Order lives in the index alone.
- **Every code fence names a language**: `md`, `sh`, `json`, `console` for a command typed with `$ ` and its output, `text` for a tree or output shown without its command. Never `bash` for output: it colours words such as `done` as code, and an apostrophe starts a string. A guess beats a bare fence.
- **Update the index in the same edit that adds, renames or drops a page.** The index is the `README.md` in the page's folder, such as `docs/dev/README.md`.
