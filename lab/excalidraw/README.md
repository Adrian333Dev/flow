# Excalidraw — three third-party skills, kept for evaluation

Carried out of the workbench repo 2026-08-07, verbatim, before it was deleted. **None of these is a Flow
skill.** They are other people's work, kept here so the diagram question can be decided against real
material instead of memory. Nothing here is installed, symlinked, or referenced by anything in `flow/`.

Two of the three do the same job; the third does the opposite one.

| Folder | Source | What it does |
|---|---|---|
| `coleam00-diagram-skill/` | [coleam00/excalidraw-diagram-skill](https://github.com/coleam00/excalidraw-diagram-skill) | **Creates** `.excalidraw` JSON, and is the only one that can turn it into a picture — `references/render_excalidraw.py` plus an HTML template and a `pyproject.toml`. Opinionated: diagrams should "argue visually", colours centralized in `references/color-palette.md`. |
| `excalidraw-free/` | standalone skill, no upstream clone | **Creates** diagrams too, but pure markdown guidance, no renderer. Its value is the three named workflows — `mind-maps.md`, `swimlane.md`, `process-flow.md` — and `references/json-format.md`, which documents the file format directly. |
| `agent-toolkit-excalidraw/` | [softaworks/agent-toolkit](https://github.com/softaworks/agent-toolkit) | **Reads** existing `.excalidraw` files without destroying context. Different problem entirely: the JSON is 4k–22k tokens per file at under 10% signal, so it forces every read through a subagent. Relevant only if diagrams start arriving from outside. |

## The open question

`skills/explain/SKILL.md` currently rules: *"No SVG, no mermaid, no HTML for structure"* — ASCII is the
default because it renders instantly in chat, in a file, and in a diff, and because explanation fires
constantly mid-brainstorm on roughly a one-minute budget. SVG was killed on cost, measured: about ten
minutes and ~80k tokens per diagram.

**Excalidraw was never evaluated against that ruling and is not covered by it.** It is a different
mechanism — generate JSON, render separately — so it needs its own verdict rather than inheriting SVG's.
The question is whether any of it beats an ASCII frame at the moment of use, given that an `.excalidraw`
file still has to be rendered or opened before anyone can look at it.

If one of these ever does become a live Flow skill, it moves to `skills/` and gets symlinked like the rest.
Until that decision is made, it stays here and dies with `lab/`.
