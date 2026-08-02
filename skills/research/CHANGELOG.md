# Changelog — research

## 2026-08-03

- External prompt research now names which LLM to hand a prompt to, ranked (Claude → ChatGPT → DeepSeek → Gemini) with the caveat per model. Moved here from the template's `recommended-tools.md`, which is being retired — the ranking is acted on at run time, not browsed.

## 2026-07-23

- `fetch-docs.sh` moved into `scripts/` (catalog convention: executables live in a `scripts/` subfolder). Usage path is now `~/.claude/skills/research/scripts/fetch-docs.sh`.
- Rewritten and widened: fires whenever work depends on an external tool's current behavior — recommending, spec, plan, or implementation — not just before recommendations. Four-rung depth ladder: targeted lookup → current docs via llms.txt → source-code investigation (shallow clone) → landscape research.
- New bundled `fetch-docs.sh`: chained discovery of `llms.txt`/`llms-full.txt` across known locations, rejects HTML error pages, fetches both variants, caches to `tmp/refs/<tool>/` with source URL + fetch date stamps.
- Heavy reading (large doc corpora, cloned repos) now delegated to a cheaper-model subagent via a self-contained brief; the main agent reads only the findings file. `llms-full.txt` is grep-only, never read inline.
- Recording split: refetchable raw material → `tmp/refs/<tool>/` (ignored cache); curated standing references → `docs/refs/` (committed); topical findings → `docs/notes/` as before.
- Initial publish (moved from the agentic-workflow template). Two modes (direct tools / external prompts), recording fallbacks for use outside a brainstorm or spec, zero-lines-read presentation rule for report synthesis.
