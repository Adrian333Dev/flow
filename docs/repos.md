# The cloned repos

`repos/` holds other people's repositories. Flow reads them for ideas and never builds against them,
so git ignores the whole folder and a fresh clone of Flow arrives without it.

`toolbox/` is not one of these. It is a real submodule with an entry in `.gitmodules`, and
`git submodule update --init` restores it.

## Restoring them

    bash scripts/repos.sh

The script clones whatever is missing and leaves whatever is already there, so running it twice is
safe. It reads the entries below, so a repo joins the set by gaining a bullet here.

## What each one is

- **`agent-skills`** — `https://github.com/addyosmani/agent-skills.git`
  A skill collection. The source for `interview-me`, `idea-refine`, and the spec/plan/implement chain
- **`agent-toolkit`** — `https://github.com/softaworks/agent-toolkit.git`
  Skills for deploying on Vercel. The source for `skill-judge`'s rubric, and for the convention that a
  skill calls a script instead of inlining the code
- **`agentmemory`** — `https://github.com/rohitg00/agentmemory.git`
  A memory system carrying `DESIGN.md`, `docs/`, `eval/` and `benchmark/`. Read for what a knowledge
  base looks like as a component
- **`agentskills`** — `https://github.com/agentskills/agentskills.git`
  The Agent Skills specification and its authoring docs. Authoritative on format: `name` up to 64
  characters, `description` up to 1024, `SKILL.md` under 500 lines
- **`browser-harness`** — `https://github.com/browser-use/browser-harness.git`
  The model for rebuilding `debug-web-pages`. Knowledge sits at `domain-skills/<host>/` and the
  navigation call surfaces it, so the agent never decides to look
- **`caveman`** — `https://github.com/JuliusBrussee/caveman.git`
  A context-compression skill, read in full on 2026-08-09. The findings are in
  `lab/context/compression.md`
- **`deepseek-harness`** — `https://github.com/deepseek-ai/deepseek-harness.git`
  DeepSeek's own agent harness, built so that everything is a plugin
- **`mattpocock-skills`** — `https://github.com/mattpocock/skills.git`
  The source for `grilling`, `grill-me`, and the reasoning behind limiting questions. Its `CONTEXT.md`
  plus `docs/` shape is the other thing read here
- **`superpowers`** — `https://github.com/obra/superpowers.git`
  The skill collection Flow is measured against. Its own `skills/writing-skills` folder is where
  skills-as-TDD comes from
- **`TencentDB-Agent-Memory`** — `https://github.com/TencentCloud/TencentDB-Agent-Memory.git`
  A second memory system, shaped as a service. Kept to compare against `agentmemory`

## The two projects

These two are working projects, not reference material. They are evidence of what a real repo looks
like, never a pattern to copy.

- **`Delapse`** — `https://github.com/Adrian333Dev/Delapse.git`
  A Chrome extension in daily development. The project to cite whenever a real case is needed
- **`lumacraft_v2`** — `https://github.com/Adrian333Dev/lumacraft_v2.git`
  Archived. Kept only for comparison against Delapse
