# Research prompt 1 — Curating a skill *library* (not authoring one skill)

Paste everything below the line into an external LLM with web search enabled (ChatGPT with search, Gemini Deep Research, Perplexity, Claude with web search).

---

I am building a personal library of "agent skills" — the open SKILL.md format (a folder with a `SKILL.md` file containing YAML frontmatter `name` + `description` and markdown instructions, optionally bundling `scripts/`, `references/`, `assets/`). Skills are loaded by coding agents (Claude Code, Cursor, Codex, opencode, Goose, and others) via progressive disclosure: only name+description are in context at startup, the body loads when the skill triggers.

I am a solo developer. My library will grow to 20–50+ skills over time, of two kinds:

1. **Process skills** — how to work: brainstorming, research, planning, executing, debugging, explaining.
2. **Knowledge skills** — what I know about a specific tool, framework, or domain (e.g. "everything I've learned about NestJS", "how our LLM provider fallback works"). These *accumulate facts over months*, appended to as I learn things.

**I already have thorough material on how to author a single skill** — Anthropic's skill-authoring best practices, the agentskills.io skill-creation docs (best practices, evaluating skills, optimizing descriptions, using scripts), Anthropic's `skill-creator` skill, and two community skill-authoring skills. **Do not spend your answer restating single-skill authoring advice** (be concise, use progressive disclosure, write a triggering description, keep SKILL.md under 500 lines, etc.). I know all of that.

What I cannot find good material on is everything that happens **after you have more than a handful of skills**. That is what I want you to research.

## Questions

**A. Boundaries and altitude.** When a new piece of knowledge arrives, how do you decide which skill owns it? Specifically: is there published guidance, or observed practice in real skill libraries, on choosing the *altitude* of a skill — a narrow tool-specific skill vs. a broad concept skill? What happens to knowledge that sits at the seam between two tools (e.g. "how Prisma behaves inside a NestJS module")? Is duplication across skills ever correct, or is one-home-plus-pointers the consensus?

**B. Splitting and merging.** What are the observed signals that a skill has grown too big and should split, or that two skills overlap and should merge? Are there any empirical findings (evals, benchmarks, postmortems) about what happens to trigger accuracy and output quality when a library contains many similar skills?

**C. Description collision at scale.** All published guidance on writing descriptions optimizes ONE skill in isolation. With 30 skills, descriptions compete — the agent must pick between them. Is there any research or practitioner experience on: how selection degrades as the catalog grows; whether descriptions should be written *differentially* (explicitly bounding against sibling skills); whether there is a practical ceiling on how many skills an agent can select among reliably?

**D. Pruning and staleness.** What criteria do real maintainers use to delete or rewrite skill content? How do people handle knowledge that was true six months ago and is now wrong (framework version changes, deprecated APIs)? Any conventions for dating, sourcing, or expiring facts inside a skill?

**E. Growing knowledge skills.** For skills that accumulate facts over time rather than describing a fixed procedure: what internal organization survives growth? Flat notes, topic files, dated entries, per-instance caches? Are there real examples of long-lived, frequently-appended skills I can look at?

**F. Prior art.** Point me to actual public skill libraries with 15+ skills that show evidence of deliberate curation (not just a dumping ground), and to any written maintenance philosophy their authors published. Include repository URLs. Also include any blog posts, talks, or discussions specifically about *maintaining* a skill collection over time.

## Output format

- Answer section by section (A–F). Skip nothing; if a section has genuinely no published material, say so explicitly and say what practitioners appear to do instead.
- Distinguish clearly between **documented guidance** (cite the source with a URL), **observed practice** (name the repo/library and what it actually does), and **your own inference**. Label inference as inference.
- Prefer concrete examples over principles. If you claim a signal exists for splitting a skill, show a skill that split.
- End with a short list of the strongest, most surprising findings — the things that would change how someone designs a curation process.
- Do not pad. If a question has a thin answer, give the thin answer.
