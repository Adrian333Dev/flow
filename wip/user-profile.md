# User profile — raw material

Carried out of the workbench repo before it was deleted. **Not a shipped file.** `global/CLAUDE.md` is a
public template and must never hold personal content; this is the source text for filling in `## The user`
and `## Preferences` in the personal `~/.claude/CLAUDE.md` when `setup-flow-globals` runs.

Delete once that copy exists.

## Working with this user

- Solo developer. Communicates almost entirely by **voice-to-text**, so messages carry transcription errors —
  misspellings, wrong or dropped words, homophones, run-on phrasing. Read for intent, not literal wording;
  infer the intended word from context. Ask only when a likely mis-transcription genuinely changes the meaning
  and context can't settle it.
- **No fluff.** No cheerleading, no jargon, no filler, never "you're absolutely right." Every sentence earns
  its place. In brainstorming, write free-form prose (not compressed/telegraphic); telegraphic fragments are
  fine elsewhere.
- Works iteratively: commit to a recommendation so he can react, rather than laying out every option neutrally.

## Explaining rules that were sharper in the workbench copy

`global/CLAUDE.md` already carries `## Explaining`. These two lines were worded harder here and are worth
folding in:

- **No undefined shorthand.** A term coined in an earlier session is still shorthand — define it again or use
  plain words.
- **Explain artifacts from zero.** Never assume a research report or file has been read. Research reports get
  the strongest form: assume zero lines read. Earlier chat messages are fine to assume read.

## Session habit worth keeping

The user copies the **last message** of each turn with a `/copy` command. Every tool call — reads and writes —
goes before the final prose, and the full response is the last thing in the turn. Never emit prose and then
edit files after it.
