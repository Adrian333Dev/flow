#!/usr/bin/env bash
# Clone the reference repositories into repos/, which git ignores.
#
#   bash lab/scripts/repos.sh
#
# Idempotent: a folder already there is left alone, so re-running fills the
# gaps and nothing else.
#
# Dev-only. It ships nowhere, and a machine that installed Flow never runs it.
# The list below is its one home: a repo joins the set by gaining a line, and
# leaves by losing one. Each line names the folder it lands in, grouped by
# what Flow reads it for. Notes say what Flow takes from each, so a clone can
# be dropped without opening it.
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
dest="$root/repos"
mkdir -p "$dest"

found=0 cloned=0
while read -r name url; do
  case "${name:-}" in ''|'#'*) continue ;; esac
  found=$((found + 1))
  if [ -d "$dest/$name" ]; then
    echo "have:    $name"
    continue
  fi
  echo "cloning: $name"
  mkdir -p "$dest/$(dirname "$name")"
  git clone --quiet "$url" "$dest/$name"
  cloned=$((cloned + 1))
done <<'LIST'

# workflows/: whole workflows Flow is compared against.

# The skill collection Flow is measured against. Its own skills/writing-skills
# folder is where skills-as-TDD comes from.
workflows/superpowers                  https://github.com/obra/superpowers.git

# A skill collection. The source for interview-me, idea-refine, and the
# spec/plan/implement chain. A column in the README's comparison.
workflows/agent-skills                 https://github.com/addyosmani/agent-skills.git

# The source for grilling, grill-me, and the reasoning behind limiting
# questions. Its CONTEXT.md plus docs/ shape is the other thing read here.
workflows/mattpocock-skills            https://github.com/mattpocock/skills.git

# The closest competitor on self-improvement: each solved problem becomes a
# lesson the next plan reads. .flow/research/compound-engineering.md.
workflows/compound-engineering-plugin  https://github.com/EveryInc/compound-engineering-plugin.git

# 68 agents, 286 skills, and a learning system built on "instincts".
# .flow/research/ecc.md.
workflows/ECC                          https://github.com/affaan-m/ECC.git

# An AI task-management system. Read for initialization, the ticket system
# and the workflow shape: ticket fw-48.
workflows/claude-task-master           https://github.com/eyaltoledano/claude-task-master.git

# Garry Tan's sprint of 56 skills, the most-starred whole workflow after
# Superpowers and ECC. Per-project learnings, opt-in guard hooks.
# .flow/research/gstack.md.
workflows/gstack                       https://github.com/garrytan/gstack.git

# Claude CodePro, renamed. A paid, closed harness: hooks, memory, a context
# monitor, a spec workflow. The closest to Flow in shape.
# .flow/research/pilot-shell.md.
workflows/pilot-shell                  https://github.com/maxritter/pilot-shell.git

# A hook that fires the right skill from the prompt and blocks the first edit
# until it is read. .flow/research/claude-code-infrastructure-showcase.md.
workflows/claude-code-infrastructure-showcase https://github.com/diet103/claude-code-infrastructure-showcase.git

# skills/: skill sets, and the skill format itself.

# The Agent Skills specification and its authoring docs. Authoritative on
# format: name up to 64 characters, description up to 1024, SKILL.md under 500
# lines.
skills/agentskills                     https://github.com/agentskills/agentskills.git

# Skills for deploying on Vercel. The source for skill-judge's rubric, and for
# the convention that a skill calls a script instead of inlining the code.
# game-changing-features waits on a read for /flow:groundwork's ideas.
skills/agent-toolkit                   https://github.com/softaworks/agent-toolkit.git

# A divergent-ideation engine. Waits on the same read as agent-toolkit.
skills/adhd                            https://github.com/UditAkhourii/adhd.git

# The model for rebuilding /web-pages. Knowledge sits at domain-skills/<host>/
# and the navigation call surfaces it, so the agent never decides to look.
skills/browser-harness                 https://github.com/browser-use/browser-harness.git

# A context-compression skill, read in full 2026-08-09. The findings are in
# .flow/research/compress-ai-context.md. Its agents/cavecrew-*.md are the model for a
# subagent's fixed output.
skills/caveman                         https://github.com/JuliusBrussee/caveman.git

# 2 NestJS skill sets, the case behind references/knowledge.md's review of
# outside skills. docs/spec/skills.md.
skills/claude-skills                   https://github.com/Jeffallan/claude-skills.git
skills/agent-nestjs-skills             https://github.com/Kadajett/agent-nestjs-skills.git

# 28 reasoning skills, with an evaluation that refuses every claim its numbers
# cannot carry. .flow/research/cc-thinking-skills.md.
skills/cc-thinking-skills              https://github.com/tjboudreaux/cc-thinking-skills.git

# tools/: single tools around a session: guards, checkers, memory, replay.

# 2 command guards. Their command test cases can test Flow's guard.
# .flow/research/dippy.md, .flow/research/cc-safety-net.md.
tools/dippy                            https://github.com/ldayton/Dippy.git
tools/cc-safety-net                    https://github.com/kenryu42/cc-safety-net.git

# Every piece of Claude Code's own system prompt, per release.
# .flow/research/claude-code-system-prompts.md.
tools/claude-code-system-prompts       https://github.com/Piebald-AI/claude-code-system-prompts.git

# 3 checkers for rule and skill files. .flow/research/ctxlint.md,
# .flow/research/schliff.md, .flow/research/skil-lock.md.
tools/ctxlint                          https://github.com/ctxlint/Ctxlint.git
tools/schliff                          https://github.com/Zandereins/schliff.git
tools/skil-lock                        https://github.com/skills-lock/skil-lock.git

# Session search and resuming from a past transcript.
# .flow/research/claude-code-tools.md.
tools/claude-code-tools                https://github.com/pchalasani/claude-code-tools.git

# 2 memory tools: Hivemind mines sessions into skills, presence checks "done"
# claims. .flow/research/hivemind.md, .flow/research/presence.md.
tools/hivemind                         https://github.com/activeloopai/hivemind.git
tools/presence                         https://github.com/sara-star-quant/presence.git

# Records a session and replays it on another model.
# .flow/research/orca-replay.md.
tools/orca-replay                      https://github.com/Continuum-AI-Corp/OrcaReplay.git

# A browser page for marking up plans, diffs and pages.
# .flow/research/plannotator.md.
tools/plannotator                      https://github.com/backnotprop/plannotator.git

# harnesses/: the agents' own source.

# The documentation for Codex: every fact Flow has about Codex skills, plugins
# and namespacing came out of its doc comments.
harnesses/codex                        https://github.com/openai/codex.git

# Anthropic's Claude Code repository: its own plugins, such as ralph-wiggum.
harnesses/claude-code                  https://github.com/anthropics/claude-code.git

# DeepSeek's own agent harness, built so that everything is a plugin.
harnesses/deepseek-harness             https://github.com/deepseek-ai/deepseek-harness.git

# lists/: curated lists, for finding what to clone next.

# About 215 hand-picked entries, kept current.
lists/awesome-claude-code              https://github.com/hesreallyhim/awesome-claude-code.git

# Mostly Composio's connectors to outside apps, plus a general skill list.
lists/awesome-claude-skills            https://github.com/ComposioHQ/awesome-claude-skills.git

LIST

echo "$found listed, $cloned cloned"
