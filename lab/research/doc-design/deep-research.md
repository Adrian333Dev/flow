# What Actually Makes Developer Documentation Good: An Evidence-Grounded Report

## TL;DR
- The documentation sites developers name most often — Stripe, Django, PostgreSQL, MDN, PHP, Rust, the Arch Wiki — win on **complete, runnable examples and layered depth**, not on visual polish or framework compliance; the most consistent praise across a decade of Hacker News threads is "examples that actually run."
- **Diátaxis is the dominant vocabulary but a minority practice**: in JetBrains' 2022 Django Developers Survey only 3% of respondents reported adopting it and 81% reported no explicitly adopted information architecture at all — the framework helps writers reason more than it demonstrably helps readers navigate.
- For your case — a solo-maintained config/rules/agent-behavior tool — the evidence points to a **reference-heavy, one-page-per-rule structure with exhaustive option tables, one full annotated example config, doctested snippets, precedence/troubleshooting pages, and a short blunt rationale section**, not a four-quadrant Diátaxis rebuild.

## Key Findings

**1. The praise is remarkably consistent across a decade of threads, and it is about content, not chrome.** The same names recur in every "best docs" Ask HN thread; the stated reason is almost always working examples, completeness, and layered depth.

**2. Diátaxis is contested even among technical writers.** It is the de facto shared language, adopted publicly by Django, Canonical/Ubuntu, Cloudflare, and Gatsby, but measured adoption is low and practitioners publicly describe forcing content into quadrants "like a square peg in a round hole."

**3. The empirical evidence on what fails is clear and stable.** Aghajani et al. (ICSE 2019) mined 878 documentation artifacts into a taxonomy of 162 issue types; content problems (correctness, completeness, up-to-dateness) were the predominant category at 55%. Uddin & Robillard (2015) surveyed 323 developers: the three severest problems were ambiguity, incompleteness, and incorrectness.

**4. Config/workflow tools do something the general advice underweights: exhaustive, machine-organized reference.** ESLint's one-page-per-rule structure, Prettier's deliberately tiny options list, and the AGENTS.md/CLAUDE.md conventions all optimize for lookup and for being read by machines.

**5. Executable documentation is the one anti-drift technique with a real mechanism; the evidence for most other freshness practices is testimony, not measurement.**

**6. Rationale/"why" pages are widely published, but there is thin measured evidence anyone reads them** — though for a solo dev the author is the future reader, which changes the calculus.

## Details

### Section 1 — The documentation sites people rate highest, and where the reputation comes from

I prioritized recurring mentions in cited developer discussion over my own judgment.

**Stripe (stripe.com/docs) — payments API/SaaS.** The most-cited "gold standard." Source of reputation: it is the reflexive answer in developer forums — a Team Blind thread titled "im in awe of how good stripes documentation is," and Mintlify's founder wrote "Ask any developer which company has the best documentation and you'll hear the same answer: Stripe." The reputation is contested: in that same Blind thread a commenter replied "Really? I found it repetitive and a little confusing," and apidog's analysis notes Stripe's "focus on the 'happy path'... can sometimes leave gaps in edge cases or advanced scenarios." Stripe is an API/library case, not a config-tool case — relevant for tone, not structure.

**Django (docs.djangoproject.com) — web framework.** Recurs in multiple Ask HN threads. The most-upvoted explanation (HN item 17399340): "The thing I love about Django's documentation is the layering. From beginner tutorial through to high level overviews of the subsystems, through to detailed usage... through to API level docs, through to the source code — all of it is there, and all linked together well." Django matters because it is the origin of Diátaxis (Daniele Procida was a core Django developer).

**PostgreSQL (postgresql.org/docs) — database.** Cited repeatedly and specifically praised for version coverage: one HN commenter noted docs are kept "back to 7.2 available" and that developers read Postgres docs to understand *other* databases.

**PHP (php.net/manual) — language.** An "underrated gem" per HN item 41538743: individual pages per function, clear examples, explicit input/return types, excellent quick search, and historically the user-contributed notes at the bottom of each page. Directly contrasted against Python's thinner `str.find` page.

**MDN (developer.mozilla.org) — web platform.** Described as "consistently excellent" and "a gem for new learners."

**Arch Wiki (wiki.archlinux.org) — Linux distro/config.** Praised for "how to configure" content reusable across distros. This is the closest genre match to your tool — configuration documentation — and its reputation rests on task-focused, copy-pasteable config guidance.

**Others recurring with concrete praise:** Wolfram Language reference (inline-runnable examples), HAProxy (plain-text config manual with all options in one file — directly relevant), Rust (the Book plus doctested std docs).

**Contested reputations to note plainly:** Apple and MSDN are repeatedly named as *bad* despite scale ("My god, look at Apple. Where's the documentation on macOS"). SalesForce OCAPI is called "some of the worst I've ever seen." Python's standard-library docs draw mixed reactions. Fame is not uniform approval, and "famously good" sites have specific documented weak spots.

**Survey evidence is thinner than the anecdote.** There is no widely-cited standalone "best docs" ranking in the Stack Overflow Developer Survey or State of JS. The strongest survey datapoint is the JetBrains Django Developers Survey 2022, which measures *practices*, not site rankings. Treat the site list as **strong, convergent anecdote** (many independent threads agreeing) rather than measured ranking.

### Section 2 — How the highest-rated sites are structured

**Django.** Top-level split: Tutorial (ordered, multi-part, read start-to-finish) / Topic guides (conceptual "how things work") / Reference (exhaustive, landed-on via search) / How-to guides (task recipes). Navigation is a sidebar plus a comprehensive index. The landing page routes first-timers explicitly to "first steps"/the tutorial. Pages are long and deeply cross-linked. Background/conceptual material lives in "Topic guides," deliberately separated from how-to recipes — Diátaxis in its birthplace.

**ESLint (eslint.org/docs) — the key structural exemplar for you.** Top nav is organized by *audience progression*: **Use ESLint / Extend ESLint / Integrate ESLint / Contribute to ESLint / Maintain ESLint** (verbatim: "Intended for end users..." / "Intended for people who wish to extend ESLint..." / "Intended for people who wish to create integrations..."). Under "Use," a dedicated **Configure ESLint** cluster breaks configuration into ~10 pages (Configuration Files, Configure Rules, Configure Plugins, Configure a Parser, Combine Configs, Ignore Files, Debug Your Configuration, Configuration Migration Guide). The **Rules Reference** is one page per rule, grouped by type, with emoji metadata (recommended, fixable, frozen, deprecated). This one-page-per-rule pattern is so standardized that `eslint-doc-generator` auto-generates it and enforces section consistency.

**Prettier (prettier.io/docs) — the minimalist counterpoint.** Flat structure: Install → Options → CLI → Configuration File → Ignoring Code → Plugins → API, plus a separate **Rationale** page and **Technical Details**. Prettier deliberately ships few options — the docs state the rationale is "to remove many of the discussions and choices around code style." For a config tool, Prettier proves a *short* options list is itself a documentation strategy.

**PHP / PostgreSQL.** Reference-first, one-page-per-entity (function/statement), designed to be landed on from a search engine rather than read in order. Postgres keeps every version's tree live. Both use sidebar + index.

**General pattern across exemplars:** reference pages are search-landing targets (short-to-medium, self-contained); tutorials are the only read-in-order content; conceptual material is separated from tasks; navigation is sidebar + index, not one or the other. Depth is typically 2–3 levels, not deeper.

### Section 3 — Whether Diátaxis survives contact with reality

**What it is:** four documentation types — tutorials (learning), how-to guides (task), reference (information), explanation (understanding) — by Daniele Procida (diataxis.fr), created ~2020 out of Django.

**Who adopted it publicly:** Django, Canonical/Ubuntu, Cloudflare ("our north star for information architecture"; "when we weren't sure where a new piece of content should fit in, we'd consult the framework"), Gatsby ("our go-to resource throughout the project"), plus Python's docs team voted to adopt it. Testimonials on diataxis.fr claim adoption in "hundreds of documentation projects."

**The contrarian measured datapoint:** JetBrains' Django Developers Survey 2022 asked about information architecture. Result: **81% reported "No explicitly adopted information architecture,"** and only **3% reported Diátaxis** (1% DITA; 27% "Formal documentation review") — this in the very community that birthed the framework. *(Note: the 3% Diátaxis figure is confirmed against the published survey; the 81% figure appears as the "No explicitly adopted information architecture" answer in JetBrains' published results.)* Adoption of the *vocabulary* vastly exceeds adoption of the *practice*.

**Published critiques and modifications:**
- Fabrizio Ferri-Benedetti (Passo.uno; Splunk senior staff writer) called documentation frameworks a "cargo cult," saying on The Not-Boring Tech Writer podcast: "the framework says you don't have to follow these to the letter, but of course they all follow this to the letter... reality is much more complex than this." He confirmed he did *not* build "a thing for each Diátaxis type" for his own docs.
- "Content by MFE" describes adapting Diátaxis for support content and finding herself "forcing certain articles into the framework like a square peg in a round hole," concluding "this won't work for everything" and that its real value is forcing writers to think, not the literal quadrants.
- The counter-position that users don't care about quadrants is explicit in these accounts: it is a *writer's* tool. Even the pro-Diátaxis HN thread's top comment praises it for a *writing* realization — "You don't have to say everything exactly once" — not a reader-navigation win.

**What it costs:** ClickHelp published a case study describing a "massive project of restructuring and rewriting our whole documentation." The framework's own recommended path is incremental (fix one page at a time), which itself signals that a full rebuild is expensive.

**Verdict:** Diátaxis survives as a *thinking tool* for writers. It is weakly supported as something *readers* notice or that measurably improves outcomes — ClickHelp's "measurably improved outcomes" claim is self-reported with no metrics. For a solo dev, adopting the four *distinctions* (don't mix a tutorial with reference) is cheap and sound; adopting the four *sections* as rigid top-level nav is unjustified overhead.

### Section 4 — What makes documentation rated badly

**Measured / empirical evidence:**

- **Aghajani et al., "Software Documentation Issues Unveiled," ICSE 2019** (878 artifacts mined from mailing lists, Stack Overflow, issues, PRs; taxonomy of 162 issue types). Four top-level categories with their share of artifacts: **Information Content ("What") 55%** (correctness, completeness, up-to-dateness) — the predominant category; **Information Content ("How") 29%** (maintainability, readability, usability, usefulness); **Tool Related 15%**; **Process Related 9%** (shares exceed 100% because artifacts can raise multiple issues). The dominant failure mode is *content*: wrong, missing, or outdated information.
- **Aghajani et al., ICSE 2020 ("Software Documentation: The Practitioners' Perspective")** surveyed 146 practitioners on which issues matter. Top-rated: **Clarity/readability (88%)**, missing documentation for a new feature (69%), missing install/deploy/release docs (68%), faulty tutorials (65%), erroneous code examples (59%), code-documentation inconsistency (59%). Key nuance: only a small subset of the 162 catalogued issues were rated important — practitioners care about a focused set, mostly clarity + completeness + correct examples.
- **Uddin & Robillard, "How API Documentation Fails," IEEE Software 2015** (two surveys totaling 323 professional developers; 179 documentation units analyzed). The three severest problems: **ambiguity, incompleteness, incorrectness.** Also documented: fragmentation as a major usability failure ("I find really difficult to use, where you have to have 10s of clicks through links to find the information you need").

**Anecdote / opinion (labeled as such):** HN threads and vendor blogs (Mintlify) add: marketing copy in docs, mixing content types, no way to tell which version a page describes, bad or missing search, over-reliance on autogenerated stubs. Consistent with the empirical findings but testimony, not measurement.

**The convergence is the signal:** independent mining studies, developer surveys, and forum anecdote all land on the same top complaints — **incorrect, incomplete, or ambiguous content, plus examples that don't run.** Visual design, framework compliance, and "tone" appear in none of the empirical top-issue lists.

### Section 5 — Configuration-heavy and agent/workflow tools specifically

**Does the general advice transfer?** Partly. Completeness, correct examples, and clarity transfer directly. But config tools add genre-specific patterns the general advice underweights:

- **One-page-per-rule / per-option reference** (ESLint). Each rule gets its own URL, correct/incorrect config examples, and metadata flags. Optimized for search-landing and for linking from error messages.
- **Exhaustive option tables with default values.** For a config tool, the reference *is* the product.
- **Deliberately small option surfaces as strategy** (Prettier: minimize options "to remove... discussions and choices around code style").
- **All-options-in-one-file** (HAProxy configuration manual) — praised on HN as "refreshingly simple."
- **Annotated full example config files, "recipes"/cookbook sections, and migration guides** (ESLint ships a Configuration Migration Guide).
- **Precedence/merge-order and "why didn't my config apply" troubleshooting** — the highest-value pages for config tools, because config bugs are silent.

**Documenting things read by both humans and LLM agents (thin evidence — flagged):**

- **AGENTS.md** (agents.md, now stewarded under the Linux Foundation's agentic ecosystem): plain Markdown, no required schema. Common sections observed across repositories: project overview, build/test commands, code style, testing instructions, security notes, commit/PR rules. Guidance: keep it short (root file ~20–30 lines; nested files supported, nearest to the edited code wins).
- **Anthropic CLAUDE.md** (code.claude.com/docs/en/memory): read at the start of every session; hierarchy of enterprise / project / user memory. Recommended content: "build commands, conventions, project layout, 'always do X' rules." Anthropic notes adding "IMPORTANT" or "YOU MUST" improves adherence, and that specific + concise instructions are followed more consistently. Path-scoped rules live in `.claude/rules/*.md` (with a `paths:` glob); reusable capabilities in `.claude/skills/SKILL.md`.
- **llms.txt** (llmstxt.org, Jeremy Howard/Answer.AI): a curated Markdown index of your docs for agents, with an optional `/llms-full.txt` concatenation. Adopted by Expo, Mintlify, Stripe, and Vercel.

**Where the evidence is genuinely thin — say so plainly:** There is essentially no independent, peer-reviewed evidence that llms.txt improves agent outcomes today. Google's John Mueller wrote on Reddit: "AFAIK none of the AI services have said they're using llms.txt, and you can tell when you look at your server logs that they don't even check for it" — corroborated by an Ahrefs study of 137,000 sites finding 97% of llms.txt files received zero traffic (May 2026). SE Ranking's analysis of ~300,000 domains found **no statistically significant correlation** between having an llms.txt file and AI citation frequency (removing it from their predictive model *improved* accuracy), with only 10.13% of domains carrying the file and just 1 of the 50 most-AI-cited domains using it. Google's May 2026 AI-optimization guidance explicitly says llms.txt is not needed for its AI features — while Anthropic recommends it and Chrome's Lighthouse added an agentic-browsing audit for it. So: **llms.txt is cheap to generate and endorsed by some agent vendors, but its measured payoff is unproven and contested.** AGENTS.md efficiency figures circulating (median runtime/token reductions) come from vendor blogs citing preprints; treat as indicative, not established.

### Section 6 — Staying current as documentation grows

**Techniques actually practiced:**
- **Executable documentation / doctests** — Rust (`cargo test` compiles and runs every fenced example in doc comments; the design intent, per the Rust docs: "if the code changes, the docs break. If the docs break, the build fails"), Python doctest, Go example tests, mdBook test, Deno doc tests.
- **Docs-in-the-same-PR policies and CI gates** — Stripe's rule: "A feature isn't shipped until its documentation is written, reviewed, and published." The JetBrains Django survey found 13% of teams answered "Code will not be merged without relevant documentation."
- **Generated reference from source/schema** — auto-generated rule/option reference (eslint-doc-generator).
- **CODEOWNERS/named doc owners, link checkers, "last reviewed" metadata, staleness bots, doc bug bashes** — widely described in practitioner writing.

**What the evidence supports:**
- **Doctests have a real causal mechanism**: the example is compiled/run in CI, so drift produces a failing build. This is the one technique where the anti-drift property is structural, not procedural.
- **Co-evolution research supports *why* forcing functions are needed.** Fluri, Würsch, Giger & Gall (extending their 2007 MSR paper "Do Code and Comments Co-Evolve?") found that in six of eight systems, code and comments co-evolve in about 90% of cases — *but* API changes and comments do not co-evolve; they "are re-documented in a later revision." In other words, docs drift by default unless a mechanism forces synchrony.
- **Detection tooling exists** (Tan, Wagner & Treude 2024, "Detecting Outdated Code Element References in Software Repository Documentation"; "Wait, wasn't that code here before?" ICSME 2023), which corroborates that staleness is pervasive enough to warrant automated detection.

**Where it's only testimony:** The effectiveness of CODEOWNERS, "last reviewed" dates, staleness bots, and bug bashes rests on practitioner reports, not controlled measurement. No study shows that freshness dates reduce reader errors. State it plainly: the *only* freshness practice with a mechanistic guarantee is testing the docs (doctests/snippet tests); everything else is process discipline whose payoff is asserted, not measured.

### Section 7 — Publishing reasoning (ADRs, RFCs, "why" pages)

**Real examples and how they're structured:**
- **ADRs (Michael Nygard's format, adr.github.io):** short, per-decision records with Context / Decision / Consequences (positive and negative). Variants: Tyree/Akerman (heavier), MADR.
- **RFCs/proposals:** Rust RFCs, Python PEPs, Kubernetes KEPs, TC39 proposals, React RFCs — longer, with motivation, alternatives considered, drawbacks, and unresolved questions.
- **"Why"/philosophy pages:** Go's FAQ ("Why does Go not have X"), which bluntly explains, e.g., the omitted ternary operator ("The longer if-else form is clearer. A language, they argued, needs only one conditional control flow construct"); Tailwind's utility-first rationale (Adam Wathan reframes the objection as "think about dependency direction," not "separation of concerns"); Prettier's Rationale page; the Rails Doctrine; Zig's Zen.

**Structure that recurs:** decision + the context that forced it + the alternatives rejected + the consequences/trade-offs. Go's FAQ is the model for a solo dev: a flat list of "why not X" answers, each 1–3 paragraphs, blunt.

**Evidence on whether readers use them (mixed, and honestly thin):**
- ADR *adoption* is measured and inconsistent: a large Mining-Software-Repositories study of 900+ GitHub repos (Buchgeher et al.) found ADRs present but far from universal. Ding et al.'s survey of ~2000 OSS projects found architectural rationale is "rarely recorded due to the tension between documentation overhead and agile development."
- The core structural finding: **the cost of writing rationale is paid immediately by the author, while the benefit accrues to future maintainers** — a misalignment that keeps ADR adoption "inconsistent." For a solo dev the misalignment is *internal*: you are the future maintainer, which is the strongest case for writing rationale (you will forget why).
- Whether readers *read* published rationale: the documentation-log-analysis study (Nam, Macvean, Myers & Vasilescu, CHI 2024; page-view logs for 100,000+ users across four cloud services) found which pages users visit correlates with prior experience and predicts future API adoption — but it did not isolate rationale/"why" pages, so there is **no clean measured answer** to whether "why" pages get read. This is a genuine evidence gap.

## Three findings that contradict common documentation advice

1. **"Adopt Diátaxis" is oversold.** The community that invented it barely uses it as structure (3% adoption; 81% no formal IA in the JetBrains Django 2022 survey), and working technical writers publicly call rigid framework-following a "cargo cult." The four *distinctions* are useful; the four-section rebuild is not evidence-backed for most projects.

2. **Examples aren't a "nice to have" bonus — they are the primary documentation, and the top complaint is that they don't run.** Common advice treats prose explanation as the core and examples as garnish. The empirical top issues (Aghajani; Uddin & Robillard) are incorrect/incomplete content and erroneous code examples; the loudest HN sentiment is "examples are the best documentation." Doctested examples beat prose you can't verify.

3. **Beautiful docs are a weak predictor of good docs.** Stripe's fame is design-forward, but every empirical study of *what fails* lists content correctness, completeness, and clarity — never aesthetics. Meanwhile famously "beautiful" corporate docs (Apple, MSDN, SalesForce OCAPI) are repeatedly named worst. Polish is neither necessary nor sufficient.

*(Bonus contrarian:* **llms.txt, despite the hype, has no measured payoff and Google says nothing reads it** — SE Ranking found removing it *improved* citation-prediction accuracy; Ahrefs found 97% of such files get zero traffic. Resist treating it as mandatory.)*

## Recommendations — Five structural decisions for your case (solo dev, config/rules/agent-behavior tool)

**1. Make the reference a one-page-per-rule / one-entry-per-behavior tree, not a Diátaxis four-quadrant site.**
*Deciding reason:* Your tool is defined by its rules and config options; the empirical top failure is incomplete/incorrect content, and config users land from search or from an error message on a *specific* rule. ESLint's one-page-per-rule model is purpose-built for exactly this and is auto-generatable — which matters when you maintain it alone.

**2. Ship one complete, annotated, end-to-end example config file — and make it your quickstart landing target.**
*Deciding reason:* "Examples are the best documentation" is the single most consistent developer sentiment, and "no complete working example" plus "missing prerequisites" are recurring failure modes; one runnable full config eliminates both at once.

**3. Test every example in CI (doctest/snippet-test your config and rule examples).**
*Deciding reason:* Doctests are the *only* anti-drift technique with a structural guarantee — the build fails when docs drift — and co-evolution research shows docs drift by default without a forcing function. As a solo maintainer you cannot rely on review discipline; automate it.

**4. Write a short, blunt "Why it works this way" page in Go-FAQ style (decision + rejected alternative + consequence), plus a config-precedence/merge-order page and a "why didn't my rule apply" troubleshooting page.**
*Deciding reason:* For config tools, silent non-application is the highest-cost user failure, and for a solo dev the author *is* the future maintainer — the usual cost/benefit misalignment of rationale disappears, so the payoff is maximal and the audience (you) is guaranteed.

**5. Add AGENTS.md/CLAUDE.md-style machine-readable rules and a generated llms.txt, but keep them thin and treat them as low-cost bets, not priorities.**
*Deciding reason:* Your tool's behaviors are read by agents, and the emerging cross-tool convention (short, imperative, "always do X" rules, ~20–200 lines) is cheap to add and directly on-genre — but the measured payoff of llms.txt is unproven and contested, so invest minutes, not days.

**Benchmarks that would change these:** If usage analytics show a substantial share of readers arriving at conceptual pages rather than reference/troubleshooting, invest more in explanation. If independent (non-vendor) measurement emerges that agents fetch llms.txt and it improves task success, promote recommendation 5. If you gain co-maintainers, add docs-in-PR CI gates and CODEOWNERS (recommendation 3 currently substitutes automation for review headcount).

## Caveats
- The "best docs" list is strong, convergent **anecdote** (many independent HN threads), not a survey ranking; no major developer survey ranks documentation sites head-to-head.
- Empirical documentation research skews toward **API/library** docs (Uddin & Robillard; Aghajani). Findings about content correctness and examples transfer cleanly to config tools; findings about API-reference navigation transfer only partially.
- The **81%** Django-survey figure and the **3%** Diátaxis figure are drawn from JetBrains' published 2022 Django Developers Survey results; the 3% is independently confirmed. The two figures answer different survey questions (information-architecture adoption vs. named frameworks), so read them as complementary, not additive.
- The agent-docs area (AGENTS.md, CLAUDE.md, llms.txt) is **new and under-measured**. Vendor guidance and preprint figures dominate; independent peer-reviewed evidence is largely absent, and specific contested claims are flagged above.
- Several "adoption" and "measurably improved" claims (ClickHelp, Diátaxis testimonials, AGENTS.md efficiency numbers) are **self-reported by interested parties** without published metrics; these are labeled as testimony throughout.