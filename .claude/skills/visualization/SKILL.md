---
name: visualization
description: "Decide whether a response needs a visual at all, then produce the right one: lightweight text-tree/prose formats for code flow and logic (no files), standalone SVG diagrams for flowcharts, architecture, comparisons, and conceptual illustrations, a DBML file for schemas/ERDs, or an HTML/CSS mockup for UI. Use this skill whenever asked to visualize, diagram, illustrate, draw, chart, map out, mock up, or 'show' a process, pipeline, architecture, comparison, concept, schema, or UI — or whenever a written explanation would clearly land better with an accompanying visual. Always read this skill before hand-writing any diagram, mockup, or ASCII flow; freehand output is what causes overlapping boxes, arrows through text, clipped canvases, and reaching for a visual when text would have worked."
---

# Visualization

Decides whether a response needs a visual, and if so, produces the right kind — lightweight text for code/logic, a standalone SVG diagram for flows/architecture/comparisons, a DBML file for schemas, or an HTML/CSS mockup for UI. This is a distilled version of the design system behind Claude.ai's inline diagram tool, adapted to run standalone, folded together with this project's own text-format and UI-mockup conventions.

The reason freehand visual output usually looks bad isn't lack of ability — it's lack of *constraints*: no enforced spacing math, no box-sizing check before placing text, no consistent color system, and no gate on whether a visual was even the right call. This skill is those constraints, written down.

## Step 0 — does this need a visual at all?

Plain text first — establish vocabulary, surface trade-offs, before committing to any visual. Only escalate past text when a written explanation genuinely won't land as well: a spatial relationship, a side-by-side comparison, a UI's actual look.

This gate applies when *you're* deciding whether to add a visual on your own initiative. If the user explicitly asked for a diagram, mockup, or visual, skip straight to Step 1 — that request already is the judgment call.

If text suffices, use one of the formats in `references/text-formats.md` — zero file overhead, nothing further needed.

**Working process, regardless of format chosen:**
- If the user corrects your mental model mid-visual, stop generating and re-read whatever design/context docs exist before continuing — don't keep drawing on a wrong premise.
- After feedback on a visual, fix every issue at once in the next pass, not one round-trip per issue.
- Do not assume the reader knows the domain. Before describing how something works, establish what it *is* in one plain-language sentence. Labels inside diagrams should be self-evident to someone seeing the concept for the first time — if a label requires prior knowledge to parse, shorten or rephrase it.

## Step 1 — which kind of visual

Route on the verb the user actually used, not just the subject:

| They said | Draw |
|---|---|
| "what's the flow / what are the steps / walk me through the process" | **Flowchart** — sequential boxes, top-down or left-right |
| "what's the architecture / what's inside X / how is this organized" | **Structural** — nested containers, things inside things |
| "compare X vs Y / which approach should I use / option A or option B" | **Comparison** — two+ parallel columns, see `references/advanced-patterns.md` |
| "how does X actually work / explain X / give me intuition for X" | **Illustrative** — a spatial metaphor, not boxes-and-arrows. The ambitious choice — don't default to a flowchart out of safety. |
| "draw the schema / ERD" | **Entity-relationship** — DBML, not hand-drawn SVG and not Mermaid; a dedicated DBML viewer draws real crow's-foot notation and routes every line, instead of hand-placed coordinates or a generic graph-layout renderer. See `references/entity-relationship.md`. |
| "show me a mockup / what would this look like / design this screen / compare these UI states" | **UI mockup** — HTML/CSS, not SVG. See `references/ui-mockups.md`. Applies to any UI markup request, not just comparisons. |

Don't mix families in one diagram. If a request genuinely needs both an intuition and a precise reference (e.g. "explain attention AND show me the architecture"), make two diagrams with a paragraph between them, not one diagram trying to do both jobs.

## Before you start — plan when the topic has layers

When the topic has multiple layers (what something *is*, how it's structured, how information flows through it), don't jump straight to a diagram. Pause to answer: what does the reader not know yet? What concept must land before the next will make sense? Is this one diagram, or a sequence of text and diagrams?

This should take a paragraph, not a formal spec. The goal is only to avoid producing a diagram before understanding what mental model is being built.

If triggered from a brainstorming or code-explanation context, that conversation already signals which concepts are new — use it rather than re-deriving from scratch.

The pattern that works: short text establishing what a thing IS → diagram showing structure or flow → bridging text → next diagram. A single large diagram trying to cover everything at once almost always fails.

## Output workflow (SVG diagrams)

Once Step 1 says this is a flowchart / structural / comparison / illustrative diagram (entity-relationship is DBML, not SVG — see `references/entity-relationship.md` instead):

1. Work out the layout on paper first: list every box, compute its width from its longest line of text, then compute x/y coordinates before writing a single line of SVG. This single step prevents 90% of bad diagrams.
2. Read `references/svg-diagrams.md` for the base template (stylesheet + background rect + arrow marker, all inside `<svg>`), hard rules, and the flowchart/structural/illustrative recipes — paste the template verbatim, don't reconstruct it from memory.
3. Write one standalone `.svg` file — no HTML wrapper.
4. Save it to the project directory (or wherever the user is working) as `<descriptive-name>.svg`. Tell the user they can open it directly in VS Code or a browser — don't just print the code into chat.
5. For genuinely large or repetitive diagrams (10+ boxes, grids, generated from data), write a small script that computes coordinates rather than hand-typing dozens of numbers — see "Scripting large diagrams" in `references/svg-diagrams.md`.

For anything beyond a single linear flow or simple containment diagram — side-by-side comparisons, branching outcomes, legends, callouts — read `references/advanced-patterns.md` before starting. That's the stuff that makes a diagram look considered instead of generic, and it's exactly what was missing from earlier attempts.

For a large system diagram — 12+ nodes, three or more branches, a background/parallel process, anything that needs to converge multiple paths back into one — read `references/complex-diagrams.md` before starting. It also covers the most important judgment call at this scale: when to keep building one diagram versus when to stop and split into several. Getting that call wrong is the single biggest reason large diagrams turn into unreadable noise.

(UI mockups have their own workflow — copy the template, fill in scenarios, one-shot rules — all in `references/ui-mockups.md`. Entity-relationship has its own workflow too, in `references/entity-relationship.md`. Neither reads `references/svg-diagrams.md`.)

## Before calling it done — checklist

- Confirmed a visual was actually warranted (Step 0), not reached for automatically
- Correct diagram family chosen per Step 1, and its recipe file actually read (not improvised)
- For SVG diagrams specifically: every hard rule in `references/svg-diagrams.md` checked
- File saved and the user told where to open it — don't just dump the diagram into the chat reply
