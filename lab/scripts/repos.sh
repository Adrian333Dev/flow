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
# lesson the next plan reads. lab/research/compound-engineering.md.
workflows/compound-engineering-plugin  https://github.com/EveryInc/compound-engineering-plugin.git

# 68 agents, 286 skills, and a learning system built on "instincts".
# lab/research/ecc.md.
workflows/ECC                          https://github.com/affaan-m/ECC.git

# An AI task-management system. Read for initialization, the ticket system
# and the workflow shape: lab/backlog/after-v1.md.
workflows/claude-task-master           https://github.com/eyaltoledano/claude-task-master.git

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
# lab/context/compression.md. Its agents/cavecrew-*.md are the model for a
# subagent's fixed output.
skills/caveman                         https://github.com/JuliusBrussee/caveman.git

# 2 NestJS skill sets, the case behind references/knowledge.md's review of
# outside skills. lab/context/skills.md.
skills/claude-skills                   https://github.com/Jeffallan/claude-skills.git
skills/agent-nestjs-skills             https://github.com/Kadajett/agent-nestjs-skills.git

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
