#!/usr/bin/env bash
# Clone the reference repositories into repos/, which git ignores.
#
#   bash lab/scripts/repos.sh
#
# Idempotent: a folder already there is left alone, so re-running fills the
# gaps and nothing else.
#
# Dev-only. It ships nowhere, and a machine that installed Flow never runs it.
# The list below is its one home — a repo joins the set by gaining a line, and
# leaves by losing one. Notes say what Flow took from each, so a clone can be
# dropped without opening it.
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
  git clone --quiet "$url" "$dest/$name"
  cloned=$((cloned + 1))
done <<'LIST'

# A skill collection. The source for interview-me, idea-refine, and the
# spec/plan/implement chain.
agent-skills            https://github.com/addyosmani/agent-skills.git

# Skills for deploying on Vercel. The source for skill-judge's rubric, and for
# the convention that a skill calls a script instead of inlining the code.
agent-toolkit           https://github.com/softaworks/agent-toolkit.git

# A memory system carrying DESIGN.md, docs/, eval/ and benchmark/. Read for
# what a knowledge base looks like as a component.
agentmemory             https://github.com/rohitg00/agentmemory.git

# The Agent Skills specification and its authoring docs. Authoritative on
# format: name up to 64 characters, description up to 1024, SKILL.md under 500
# lines.
agentskills             https://github.com/agentskills/agentskills.git

# The model for rebuilding /web-pages. Knowledge sits at domain-skills/<host>/
# and the navigation call surfaces it, so the agent never decides to look.
browser-harness         https://github.com/browser-use/browser-harness.git

# A context-compression skill, read in full 2026-08-09. The findings are in
# lab/context/compression.md.
caveman                 https://github.com/JuliusBrussee/caveman.git

# DeepSeek's own agent harness, built so that everything is a plugin.
deepseek-harness        https://github.com/deepseek-ai/deepseek-harness.git

# The source for grilling, grill-me, and the reasoning behind limiting
# questions. Its CONTEXT.md plus docs/ shape is the other thing read here.
mattpocock-skills       https://github.com/mattpocock/skills.git

# The skill collection Flow is measured against. Its own skills/writing-skills
# folder is where skills-as-TDD comes from.
superpowers             https://github.com/obra/superpowers.git

# A second memory system, shaped as a service. Kept to compare against
# agentmemory.
TencentDB-Agent-Memory  https://github.com/TencentCloud/TencentDB-Agent-Memory.git

# Read 2026-08-29 and spent. A divergent-ideation engine that gave nothing.
adhd                    https://github.com/UditAkhourii/adhd.git

# Read 2026-08-29 and spent. Gave 1 rule of 10: say what now works, in
# concrete terms.
i-have-adhd             https://github.com/ayghri/i-have-adhd.git

LIST

echo "$found listed, $cloned cloned"
