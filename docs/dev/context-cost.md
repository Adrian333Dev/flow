# What costs context

Every rule Flow writes into `CLAUDE.md` is paid for on every session, so it is worth knowing which shortenings buy something and which only look like they do. Most of the obvious ones buy nothing. This page says which, and how confident each answer is.

A **token** is the unit the model is billed and budgeted in. It is not a character and not a word: common English words are usually one token each, and rarer strings split into several.

## Table of contents

- [How to measure](#how-to-measure)
- [What does not save tokens](#what-does-not-save-tokens)
- [What does save tokens](#what-does-save-tokens)
- [How confident each answer is](#how-confident-each-answer-is)

## How to measure

**`/context` in a live session is the measurement you already have.** It lists the memory files that loaded and what each one cost. That is the authoritative number for a whole file, it is free, and it is the one to check before and after a rewrite.

It cannot compare two phrasings of one sentence. For that you need per-string counts, and there are two routes:

- **Anthropic's token counting endpoint**, `POST /v1/messages/count_tokens`, which needs an API key. This is the only authoritative per-string answer, because Claude's tokenizer is not published.
- **A rough estimate from the file itself**, which is enough for every decision on this page:

```bash
f=home/CLAUDE.md
echo "chars/4 = $(( $(wc -c < $f) / 4 ))   words*4/3 = $(( $(wc -w < $f) * 4 / 3 ))"
```

The two estimates bracket the real number. Markdown full of backticked paths tokenizes worse than prose, so take the higher one.

## What does not save tokens

**Digits do not beat words.** `1` is one token and `one` is one token. Writing `5 rules` instead of `five rules` changes nothing in the budget. Pick whichever reads better.

**Symbols do not beat words.** `&` is one token and `and` is one token. `→` and `·` are each their own token. `references/style.md` §6 already bans symbols where the word works, and the token argument does not rescue them.

**Abbreviations usually cost more, not less.** A common word is a single token because it is in the vocabulary; an invented short form is not, so it splits. `config` is one token and `cfg` is likely two. Shortening a word you made up is the one compression that reliably backfires, and it costs readability at the same time.

**Em dashes are a style rule, not a token rule.** `home/CLAUDE.md` carried 31 of them and removing all 31 saved about 31 tokens, under 1% of the file. Strip them because `style.md` §6 says to and because they hide two ideas inside one sentence, never because of the budget.

## What does save tokens

**Articles and filler cost one token each, and there are hundreds of them.** In `home/CLAUDE.md` on 2026-09-06: 116 `the` and 111 `a`, so 227 tokens in articles alone against roughly 3,600 for the file. Around 6%. Adding `it`, `is`, `to`, `of` and `that` gets to roughly 440, of which perhaps half can go without losing meaning.

That is real, and it is also the least durable saving on this page, because the words grow back with the next rule written. Cut them inside the writing pass on a section already being rewritten. A sweep of its own is not worth the churn.

**Paths cost several tokens each, every time they appear.** Every segment and separator tokenizes separately, so `~/.flow/references/style.md` is not one token and repeating it in six bullets pays six times. Naming a file once and referring to it by a short name afterwards is a genuine saving, and it reads better.

**Deleting a rule beats rewording thirty.** One bullet removed from an always-loaded file is worth more than every article in the section around it. Merging duplicated rules into one home is the same move at a larger scale. Nothing else on this page comes close.

## How confident each answer is

Claude's tokenizer is not published, so nothing here is measured against it directly.

- **Measured on disk:** the character, word, article and em dash counts, all reproducible with the command above.
- **From Anthropic's documentation:** that `/context` reports per-file token cost, and that `count_tokens` is the authoritative per-string route.
- **Derived from how byte-pair tokenizers work:** that common words are one token, that digits and short symbols are one token, and that invented abbreviations split. These hold across every BPE vocabulary and are safe to plan against, but a specific pair worth arguing over should be checked with `count_tokens` rather than assumed.
