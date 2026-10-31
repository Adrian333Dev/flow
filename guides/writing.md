# Writing

For everything Flow writes: a skill, a rule file, a ticket, a spec, a page the user reads, a message to the user.

## 1. Read the guides for the file's kind

Before planning, read them in one message:

- **A rule file** (`CLAUDE.md`, `CLAUDE.local.md`, `.claude/rules/`) → `write-loaded-files.md`, `write-rules.md`
- **Any other file an agent loads** (a skill and its `references/`, a command, an agent, a guide, a prompt) → `write-loaded-files.md`
- **A new skill** → `write-loaded-files.md`, `knowledge.md`
- **A spec, `docs/spec/`** → `write-spec.md`
- **A ticket's files** → `write-tickets.md`, and `issue-tickets.md` for a `flow-issue` ticket
- **A wiki page, `~/.flow/wiki/`** → `wiki.md`
- **Anything else**, `docs/manual/` included → nothing more

## 2. Plan the shape first

Name the sections and their order before writing a sentence. Never discover the structure while typing.

Plan the whole file every time you touch it. A pointer to one line is not a scope.

## 3. Markdown

Standard markdown, always: `-` for unordered, `1.` for ordered, `- [ ]` for a checklist. Nest as deep as the material needs. Never invent a layout markdown already has. Default to a list.

- **Every code fence names a language**: `md`, `sh`, `json`, `console` for a command typed with `$ ` and its output, `text` for a tree or output shown without its command. Never `bash` for output: it colours words such as `done` as code, and an apostrophe starts a string. A guess beats a bare fence.
- **Show real output**, copied from a run. Never type an example's output by hand.
- **A page the user reads opens with a table of contents** under a `## Table of contents` heading, one line per heading, in order. Each line ends with a few words after a colon saying what the section holds. An index page is its own table of contents, and gets none.

## 4. Sentences

Three tests. Run them on every sentence that carries a rule, and on every sentence written to the user.

1. **Cover everything past word 2.** Is the direction already right? "Never expose the bookkeeping": yes, at word 1. "Keep the bookkeeping out of the conversation": no. Word 2 says preserve it; word 5 reverses that.
2. **Read the last two words alone.** Do they carry the point? "…the bookkeeping" lands it. "…the conversation" spends the loudest position in the sentence on its most generic word.
3. **Act on it after one read.** Re-reading to find the instruction means rewrite it.

### Where the words go

- **Front-load the polarity and the verb.** `Never`, `Always`, or the verb itself comes before the object.
- **Never make the reader restart.** A sentence meaning one thing at word 3 and the opposite at word 6 has failed, however short it is.
- **End on the point.** Put the specific word last. Endings like "the conversation", "the file", "the process" waste it.
- **Never end on the rejected half.** "Attack it by running it, not by rating it" stresses *rating*. Split it: "Attack it by running it. Rating it finds nothing."
- **Condition left, action right, where a real condition exists.** "To delete the document, click Delete", never "Click Delete if you want to delete the document." Flow's `X → Y` bullets follow it. A rule that always applies has no condition: the verb goes first.

### The verb and the object

- **Finish the verb at the verb.** Split verbs park the meaning behind the object: `keep X out of`, `leave X out`, `hold X back from`. Use `expose`, `print`, `restate`, `delegate`.
- **Put the action in the verb.** "Depth is proportional to the branch" → "Match depth to the branch." Watch for `-tion`, `-ment` and `-ance` propped up by `is`, `make` or `do`.
- **Keep the object short and concrete.** "Read minimal context", not "Read the least that answers the question". Never an abstraction ("the least", "what fits") or a relative clause ("options the user did not bring").
- **Put nothing between the subject and the verb.**

### What kind of sentence

- **Write an action positive. Write a boundary negative.** One negation, at word one, and none of the hidden ones: `unless`, `fail to`, `except`, `other than`.
- **Give the agent a verb it can perform.** "The job is coverage, not fidelity" has none and gets cut. "Never expose the bookkeeping" has one and stays.
- **Put a verb in each half of a contrast.** "Coverage, not fidelity" has none.
- **One idea per sentence.** Split on every `and`, `so`, `then` and dash that joins two.
- **Define anything invented before first use.**
- **Use one word per concept, and the common word.**

## 5. Words

**Say it in the fewest words that keep it clear.** Stop cutting where a sentence would need a second read. Last pass, after the structure is right.

- Digits, not words: `5`, not `five`.
- Name a skill with its slash: `/flow:groundwork`, never `groundwork`.
- Symbols only where clearer than the word. They save nothing: `→`, `·` and an invented abbreviation like `cfg` are each their own token.
- Never use em dashes. Use a period, a comma, a colon, or parentheses. The only ones left are the character itself, listed as a drawing glyph in `/flow:visualize` and as the example check in `write-checks.md`.

## 6. Never cut these

- **A rule.** Compression removes words and duplication, never rules. Cutting rule count is banned as a strategy.
- **The reason, where it decides a case the rule does not name.** A reason that only argues for the rule is cut. A rule needs no argument.
- **One example**, wherever the rule alone is ambiguous. Several examples of one pattern → keep the best one. Going to zero is the riskiest cut there is.
- **Information.** Cut words. A file that drops a load-bearing detail to look short has failed.
