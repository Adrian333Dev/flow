# Research Evaluation Log

Append-only. One entry per research session.

---

## 2026-07-09 — Cloud TTS API Pricing Comparison

**Domain tags:** tts, api-pricing, chrome-extension
**Summary:** Compared ElevenLabs, OpenAI TTS, Azure AI Speech, Google Cloud TTS, and AWS Polly on pricing, native word timestamps, and streaming text input. Key finding: only three providers have native word timestamps (AWS Polly, Azure, ElevenLabs); only ElevenLabs accepts streaming text input. At meaningful scale, all cloud options are more expensive than zero-cost local options.
**Prompts:** See `/home/me/code/projects/agentic-setup/temp/research/tts.md` (first half)

### ChatGPT (web — GPT-5.5, web search) — Cloud TTS pricing + features

**Baseline:**
- Accuracy: 4/5
- Critical coverage: 4/5
- Completeness: 5/5
- Depth: 4/5
- Hallucination risk: low

**Domain-specific:**
- Source recency: 5/5 — cited official pricing pages with URLs; API prices appear current
- Cost modeling: 5/5 — included a practical example (10k cards/month → 12.5M chars/month) with per-provider estimates; immediately usable
- Feature matrix accuracy: 5/5 — streaming text input vs. streaming audio output distinction correctly identified and called out; subtle distinction many responses conflate
- Provider coverage: 5/5 — covered all five providers with consistent structure
- Subscription pricing accuracy: 3/5 — minor misinformation on subscription plan details (not API pricing); didn't affect the decision since we were evaluating API pricing, but indicates some details weren't fully verified

**Verdict:** Strong response for API pricing comparison. Cost modeling and feature matrix were directly applicable. Minor inaccuracy on subscription plan specifics (not the focus of the research, so low impact). API pricing and feature flags were accurate. Would have been safe to act on for the API-level decision.

---

## 2026-07-09 — Open-Source / Local TTS with Word Timestamps

**Domain tags:** tts, open-source, chrome-extension, browser-inference, onnx
**Summary:** Surveyed open-source TTS options runnable client-side or on-device with word-level timestamps for a Chrome MV3 extension. Kokoro emerged as the clear winner — lightweight (82M params, ~85MB Q8), browser-capable via ONNX/WASM, and has a timestamp-enabled ONNX build (`Kokoro-82M-v1.0-ONNX-timestamped`). HeadTTS project validated that phoneme timestamps are accessible in a browser context.
**Prompts:** See `/home/me/code/projects/agentic-setup/temp/research/tts.md` (second half)

### ChatGPT (web — GPT-5.5, web search) — Open-source local TTS survey

**Baseline:**
- Accuracy: 5/5
- Critical coverage: 3/5
- Completeness: 5/5
- Depth: 4/5
- Hallucination risk: low

**Domain-specific:**
- Timestamp discovery (autonomous): 2/5 — initial response correctly identified that Kokoro computes timestamps internally but doesn't expose them via the standard JS API, and suggested workarounds; it did NOT autonomously find the `Kokoro-82M-v1.0-ONNX-timestamped` build. That artifact was found only after user provided a hint about that specific version.
- Timestamp discovery (with prompting): 5/5 — once the specific build was pointed out, the response accurately described it and validated its use
- Browser feasibility assessment: 5/5 — correctly differentiated browser vs. server vs. local deployment; Kokoro ONNX + Transformers.js path clearly identified
- Hardware requirements accuracy: 5/5 — CPU vs. GPU requirements accurate per model
- Recency: 4/5 — newer heavy models (Chatterbox, Fish Speech) correctly positioned as impractical

**Verdict:** Good survey coverage and accurate information, but the critical artifact discovery (`Kokoro-82M-v1.0-ONNX-timestamped`) required user prompting — it was not found autonomously. The initial assessment ("timestamps exist internally but aren't exposed") was partially correct but incomplete. The final accurate picture only emerged after a user hint. For research where finding a specific community artifact is the key deliverable, this is a meaningful gap. Coverage and accuracy on everything else was solid.

---

## 2026-07-09 — Chrome MV3 Extension ONNX Architecture (Prompt 1)

**Domain tags:** chrome-extension, mv3, onnx, browser-inference, architecture
**Summary:** Investigated where ONNX Runtime Web inference should run in a Chrome MV3 extension to keep a large (~85MB) model warm in memory between calls. Answer: offscreen document with reason `WORKERS` (not `AUDIO_PLAYBACK`), spawning a Dedicated Worker that holds the ONNX session. Service worker cannot run ONNX at all due to WASM backend initialization failure. Content script workers tied to tab lifecycle and page origin.
**Prompts:** See `/home/me/code/projects/agentic-setup/temp/research/architecture.md`

### ChatGPT (web) — MV3 ONNX architecture (LLM 1)

**Baseline:**
- Accuracy: 3/5
- Critical coverage: 2/5
- Completeness: 4/5
- Depth: 3/5
- Hallucination risk: medium

**Domain-specific:**
- Production gotcha detection: 2/5 — missed three critical implementation gotchas: (1) WASM/dynamic import() is banned in ServiceWorkerGlobalScope — hard error, not just lifecycle issue; (2) AUDIO_PLAYBACK reason has a 30-second idle timeout — would have caused model unload between plays; (3) CSP requires `wasm-unsafe-eval` — without it WASM initialization fails silently
- Implementation specificity: 3/5 — correct patterns at architectural level but no manifest.json snippets, no CSP directives, no WASM path configuration details
- Lifecycle accuracy: 3/5 — correctly stated offscreen documents don't have the service worker 30s timer, but didn't differentiate between reasons or mention AUDIO_PLAYBACK timeout
- Source quality: 3/5 — referenced Chrome docs and HuggingFace but not the most relevant specific pages

**Verdict:** Got the high-level direction right (offscreen > service worker > content script) and the message routing pattern was correct. However, the three missed gotchas would have caused real implementation failures: the WASM ban in service workers would have produced a cryptic error; the AUDIO_PLAYBACK timeout would have caused intermittent model loss between plays; missing the CSP requirement would have been a mystery build failure. Would need significant verification before acting on this response for implementation.

---

## 2026-07-09 — Chrome MV3 Extension ONNX Architecture (Prompt 2)

**Domain tags:** chrome-extension, mv3, onnx, browser-inference, architecture
**Summary:** Same prompt as above, second model. This response caught all three critical gotchas the first missed, provided manifest.json configuration, named specific existing Kokoro Chrome extensions, and included risk analysis for WebGPU context loss and future offscreen lifetime restrictions.
**Prompts:** See `/home/me/code/projects/agentic-setup/temp/research/architecture.md`

### Claude (version unknown) — MV3 ONNX architecture (LLM 2)

**Baseline:**
- Accuracy: 5/5
- Critical coverage: 5/5
- Completeness: 5/5
- Depth: 5/5
- Hallucination risk: low

**Domain-specific:**
- Production gotcha detection: 5/5 — caught all three critical issues: WASM/import() hard ban in service workers, AUDIO_PLAYBACK 30s idle timeout, CSP `wasm-unsafe-eval` requirement. Also surfaced: WebGPU context loss risk, single offscreen document constraint, extension update teardown behavior, future lifetime restriction risk
- Implementation specificity: 5/5 — provided manifest.json structure, exact API call patterns (`chrome.runtime.getContexts()`, `chrome.offscreen.createDocument()`), WASM path configuration code snippet, multi-threading setup
- Existing pattern discovery: 5/5 — named specific real extensions (chaimantec's Kokoro Chrome extension, Kokoro TTS Engine at webextension.org) confirming the architecture works in production
- Risk analysis: 5/5 — proactively called out future Chrome lifetime restriction risk for offscreen documents and recommended defensive coding patterns
- Source quality: 5/5 — cited specific Chrome developer docs pages and Chromium proposals, not just high-level docs

**Verdict:** Reference-quality response. The WASM/import() ban alone would have saved hours of debugging — it's not mentioned in most architecture guides. The AUDIO_PLAYBACK timeout is a subtle gotcha that would have caused intermittent failures that are hard to reproduce. WebGPU context loss risk was unprompted but directly relevant. This response drove final architectural decisions with zero need for verification on critical claims. Clear winner for browser extension architecture questions.

---

## 2026-07-18 — Claude Code Tooling Ecosystem (MCP / plugins / skills)

**Domain tags:** ai-tooling, mcp, claude-code, agent-skills, ecosystem-research
**Summary:** Surveyed MCP servers, Claude Code plugins, and standalone agent skills (mid-2026) to enrich the template's `recommended-tools.md`, excluding anything that duplicates the in-house workflow. Shared prompt run across four models. Convergent finding: the highest-value additions are capability/integration MCPs + narrow guardrail plugins, NOT more orchestration; and several once-standard tools (official Postgres MCP, Puppeteer MCP) are now archived/unmaintained and must be skipped. Claude alone surfaced the decisive Claude-Code-specific gotcha — GitHub MCP is a net negative here because the `gh` CLI is ~30× cheaper in tokens. Ranking: **Claude > ChatGPT > DeepSeek > Gemini.**
**Prompts:** Single shared prompt, 4 models. Report at `/home/me/code/projects/agentic-setup/temp/research/workflow-enrichment.md`; prompt at `scratchpad/recommended-tools-research-prompt.md`.
**Autonomy:** No mid-research hints given to any model — all ran independently off one prompt. No autonomy penalty.

### ChatGPT (version as labeled; variant unconfirmed) — Tooling ecosystem survey

**Baseline:**
- Accuracy: 4/5
- Critical coverage: 4/5
- Completeness: 5/5
- Depth: 4/5
- Hallucination risk: low-medium

**Domain-specific:**
- Deprecation/maintenance accuracy: 3/5 — did not flag the archived Postgres/Puppeteer reference MCPs that others caught
- Redundancy discipline: 5/5 — explicit exclusion list up front + per-entry overlap caveats; best-articulated framing of "does this duplicate the in-house layer?"
- Install-command accuracy: 3/5 — several entries hand-wave ("install per its current README") instead of a runnable command
- Signal-to-noise / targeting: 4/5 — sensible compact "core + add-when-relevant" baseline; flagged Sequential-Thinking MCP as skip
- Security awareness: 5/5 — strongest on skill provenance/lifecycle security; cited a SWE-skills benchmark arguing most skills add no value (good selectivity argument)

**Verdict:** Excellent structure, completeness, and the sharpest security/selectivity framing of the four. But it missed two concrete gotchas Claude caught — the archived-and-vulnerable Postgres MCP and the GitHub-MCP-vs-`gh` cost problem — and leaned on vague install instructions. Safe to act on directionally; verify install commands. The one unverifiable arXiv citation is a minor hallucination-risk flag.

### Gemini (version unknown) — Tooling ecosystem survey

**Baseline:**
- Accuracy: 3/5
- Critical coverage: 2/5
- Completeness: 4/5
- Depth: 3/5
- Hallucination risk: medium-high

**Domain-specific:**
- Deprecation/maintenance accuracy: 2/5 — no archived-tool flags; recommended likely-wrong npm package names as if current
- Redundancy discipline: 3/5 — respected the exclusion list but over-applied it, wrongly dropping genuinely useful tools (Playwright, Sentry) by conflating a browser-automation *capability* with the debugging *methodology* the template owns
- Install-command accuracy: 2/5 — dubious `npx @figma/mcp-server` / `@stripe/mcp-server` / `@vercel/mcp-server` names; Figma's official is a remote server, not that package
- Signal-to-noise / targeting: 3/5 — some niche picks (n8n, Slack, Docker) with thin justification
- Security awareness: 2/5 — minimal

**Verdict:** Weakest of the four. Riddled with broken `[cite: x.x.x]` citation artifacts (unverifiable, suggests it didn't actually verify), several install commands that would error if run, and a category-confusion that made it discard useful tools. Would need fact-checking on nearly every install line before acting. Did correctly surface the TypeScript LSP plugin and Semgrep, which the others under-weighted.

### DeepSeek Instant — Tooling ecosystem survey

**Baseline:**
- Accuracy: 3/5
- Critical coverage: 3/5
- Completeness: 4/5
- Depth: 3/5
- Hallucination risk: medium

**Domain-specific:**
- Deprecation/maintenance accuracy: 4/5 — the session's single best specific catch: flagged the official Postgres MCP as archived AND carrying a known SQL-injection flaw that bypassed its read-only guarantee. But recommended the outdated `@modelcontextprotocol/server-playwright` package (superseded by `@playwright/mcp`)
- Redundancy discipline: 4/5 — respected exclusions cleanly
- Install-command accuracy: 3/5 — good concrete remote-OAuth endpoints for most MCPs; one clearly outdated Playwright command
- Signal-to-noise / targeting: 2/5 — the skills section is low-signal: dumps generic collections (justjavac, shengyy, @skill-hub) and an irrelevant Metaplex/Solana skill for a TS/React dev — the exact "grab-bag" pattern the task warned against
- Security awareness: 3/5 — strong on the Postgres vuln, light elsewhere

**Verdict:** Usable for its MCP list and quick-reference table, and it produced the sharpest single security catch of the session (archived + injectable Postgres MCP). But the skills section is noise and one install command is stale. Take the MCP picks, ignore the standalone-skills recommendations.

### Claude (version as labeled; variant unconfirmed) — Tooling ecosystem survey

**Baseline:**
- Accuracy: 5/5
- Critical coverage: 5/5
- Completeness: 5/5
- Depth: 5/5
- Hallucination risk: low

**Domain-specific:**
- Deprecation/maintenance accuracy: 5/5 — flagged every relevant deprecation (Postgres MCP, Puppeteer MCP, `server-puppeteer`, old `semgrep/mcp` in favor of Guardian)
- Redundancy discipline: 5/5 — the only response with an explicit "skip — duplicates your template" section (Superpowers, Claude Mem, planning-with-files, ECC harnesses), directly serving the actual ask
- Install-command accuracy: 5/5 — correct current packages (`@playwright/mcp@latest`, official marketplace ids)
- Signal-to-noise / targeting: 5/5 — tight, relevant set; distinguished overlapping tools (DevTools MCP vs Playwright MCP; code-review plugin vs completion-verification skill). Mild over-tailoring to the specific project (Delapse/NestJS) — needs generalizing for a template
- Security awareness: 4/5 — strong deprecation/vuln flags; slightly less explicit than ChatGPT on the "review provenance before install" meta-point

**Verdict:** Best response by a clear margin and directly actionable. The GitHub-MCP-vs-`gh` token-cost gotcha (~30× cheaper via CLI) and the explicit duplicates-your-template skip list are exactly what the task needed and no other model produced either. The only cleanup needed is generalizing its project-specific tailoring; unverifiable star/install counts are the sole minor risk. Would have driven the `recommended-tools.md` rewrite with near-zero verification.

---
## 2026-07-21 — Text Normalization for a Read-Aloud TTS App (Reading Engine C2)

**Domain tags:** tts, text-normalization, nsw-taxonomy, read-aloud
**Summary:** Four models answered the same TN-depth prompt (NSW taxonomy · per-category rules · minimum-viable tier · graceful fallback · SSML · evaluation) for our on-device Kokoro/HeadTTS reader that must preserve source→spoken provenance for word highlighting. Convergent decision: build our own classify→verbalize TN layer in front of HeadTTS, Tier-1 = currency + percent + common abbreviations + Markdown-stripping (mirror the numbers HeadTTS already does for provenance), run TN on RENDERED text. Claude Sonnet 5 was decisively the strongest and uniquely produced the product-critical "drop from audio, not from the alignment map (zero-duration span)" insight and the "." → sentence-boundary → highlight-desync tie-in.
**Prompts:** `docs/work/topics/t01-reading-engine/research/PROMPT-external-A-normalization.md` (prompt + 4 responses inline)
**Autonomy:** No mid-research hints; all four ran off one shared prompt. No autonomy penalty.

### Claude Sonnet 5 (Free) Web Search — TN taxonomy + depth

**Baseline:**
- Accuracy: 5/5
- Critical coverage: 5/5
- Completeness: 5/5
- Depth: 5/5
- Hallucination risk: low

**Domain-specific:**
- Source integrity: 5/5 — load-bearing cites real and correctly used (Sproat 2001 PDF, Stanford LING238, NeMo docs' exact "Street Patrick's Day" example, NVDA `symbols.dic` symbol-level model, espeak-ng #369, Kaggle/Proteno/Riva); 1–2 unverifiable non-load-bearing links (openclaw#12232)
- Product-fit / provenance: 5/5 — only response to engage OUR highlight/seek invariant; the "drop from audio, keep a zero-duration alignment span" insight is exactly right and unique
- Actionable tiering: 5/5 — tier table framed as a "stopping rule", grounded in Polly/Google `say-as` class convergence

**Verdict:** Reference-quality and the single most useful response across both reports. Uniquely tied "." sentence-boundary detection to our sentence-by-sentence streaming (a mis-split "Dr." desyncs highlighting), argued classify/verbalize separability so we can drop only the verbalizer if HeadTTS ever adds SSML, and grounded the fallback policy in real screen-reader precedent (NVDA). Safe to act on with near-zero verification.

### DeepSeek Expert — TN taxonomy + depth

**Baseline:**
- Accuracy: 4/5
- Critical coverage: 3/5
- Completeness: 5/5
- Depth: 4/5
- Hallucination risk: low-medium

**Domain-specific:**
- Source integrity: 3/5 — NeMo/Sparrowhawk/Kaggle real, but a fabricated-looking arXiv id ("Gong et al. 2023", arxiv 2305.12345)
- Product-fit / provenance: 3/5 — acknowledges the source→spoken map but stays generic; no alignment-span insight
- Actionable tiering: 4/5 — sensible whitelist-expand + drop-typographic-noise fallback

**Verdict:** Competent, complete, correctly recommends a WFST/regex classify-expand pipeline and a whitelist fallback. Weaker than Claude on product-specific insight and carries one fabricated citation. Directionally safe; verify the arXiv reference.

### DeepSeek Instant — TN taxonomy + depth

**Baseline:**
- Accuracy: 4/5
- Critical coverage: 3/5
- Completeness: 5/5
- Depth: 4/5
- Hallucination risk: low

**Domain-specific:**
- Source integrity: 4/5 — real systems (NeMo Duplex tagger/decoder, Apple PolyNorm "~40% lower error", Kestrel/Sparrowhawk); fewer direct links, nothing clearly fabricated
- Product-fit / provenance: 3/5 — generic
- Actionable tiering: 3/5 — inflated effort ("8–12 weeks" for Tier 1); fallback = spell-out (weaker than drop-with-span)

**Verdict:** Accurate and thorough with good coverage of modern neural-TN systems, but the effort estimates are off and the spell-out fallback is the less-good choice for a reading app. Take the taxonomy, discount the timelines.

### ChatGPT Deep Research — TN taxonomy + depth

**Baseline:**
- Accuracy: 4/5
- Critical coverage: 3/5
- Completeness: 4/5
- Depth: 3/5
- Hallucination risk: low

**Domain-specific:**
- Source integrity: 3/5 — "references in table: generic rules" tell; Genesys "St.→Street in address mode" is a nice concrete cite, rest hand-wavy
- Product-fit / provenance: 3/5 — generic
- Actionable tiering: 4/5 — clean tiers; fallback = spell-out

**Verdict:** Accurate and readable but the shallowest of the four and notably the shortest despite the "Deep Research" billing. Correct but adds little the others didn't cover better. No fabrications.

---
## 2026-07-21 — Read-Aloud Competitor Teardown (Reading Engine C2)

**Domain tags:** tts, competitor-teardown, read-aloud, highlighting, edge-read-aloud
**Summary:** Four models tore down Edge Read Aloud / Speechify / NaturalReader / ElevenReader / Kokoro-Misaki for highlight-sync, chunking, normalization, and code/table/URL handling. Strong convergence (and agreement with our own local Speechify source teardown): Edge highlights via Azure `WordBoundary` events; real per-word timestamps beat heuristics; sentence-chunk + prefetch for fast first audio; code/tables/URLs are a universal failure = our differentiation opening; word-level click-to-seek is rare (Edge lacks it). IMPORTANT correction the reports missed: several assumed "Kokoro has NO timestamps → must forced-align" — moot for us because we use the timestamped Kokoro build via HeadTTS.
**Prompts:** `docs/work/topics/t01-reading-engine/research/PROMPT-external-B-competitors.md` (prompt + 4 responses inline). Cross-checked against `research/REPORT-local-teardown.md` (our own source teardown = ground truth for Speechify).
**Autonomy:** No mid-research hints. One response (Claude) was first delivered as a truncated "half complete" export; the user re-ran it and the COMPLETE artifact (re-scored 5/5/5/5) turned out to be the strongest of the four — so the batch winner is Claude, with ChatGPT Deep Research the best-calibrated runner-up. Truncation was an export artifact, never a capability signal.

### ChatGPT Deep Research — competitor teardown

**Baseline:**
- Accuracy: 4/5
- Critical coverage: 4/5
- Completeness: 5/5
- Depth: 4/5
- Hallucination risk: low

**Domain-specific:**
- Citation integrity: 4/5 — no fabricated URLs; claims hedged rather than dressed up
- Confidence calibration: 5/5 — consistently marks "inferred / low confidence" on undocumented internals
- Mechanism specificity: 4/5 — Edge WordBoundary, Speechify streaming, NaturalReader AI-filter, ElevenReader alignment all correct
- Ground-truth agreement (vs local teardown): 4/5 — Speechify "presumably timestamps" matches our `speechMarks` finding, appropriately hedged

**Verdict:** Best-calibrated and cleanest B response; strong synthesis and takeaways, honest about what's inferred, no fabrications. The safest B response to act on directly.

### DeepSeek Instant — competitor teardown

**Baseline:**
- Accuracy: 3/5
- Critical coverage: 4/5
- Completeness: 5/5
- Depth: 4/5
- Hallucination risk: medium

**Domain-specific:**
- Citation integrity: 3/5 — names specific artifacts (Speechify "Speech Marks API", ElevenLabs `CharacterAlignmentResponseModel`/`TranscriptViewer`, Edge `range.getBoundingClientRect()`) but some third-party project names look unverifiable (`@baryodev/read-aloud`)
- Confidence calibration: 4/5 — adds explicit confidence notes
- Mechanism specificity: 5/5 — most concrete on the actual API/DOM mechanisms
- Ground-truth agreement: 4/5 — Speech Marks matches our local `speechMarks.chunks` finding

**Verdict:** The most mechanism-specific B response — genuinely useful concrete details — but sprinkled with confident, unverifiable specifics (project names, "sun up→Sunday"/"&" Edge bugs). Take the mechanisms, verify the named projects before citing.

### DeepSeek Expert — competitor teardown

**Baseline:**
- Accuracy: 3/5
- Critical coverage: 4/5
- Completeness: 5/5
- Depth: 4/5
- Hallucination risk: medium-high

**Domain-specific:**
- Citation integrity: 2/5 — a formal [1]–[10] reference list padded with FABRICATED sources: Misaki cited as `github.com/nicholasbrailo/misaki` (real repo is `hexgrad/misaki`), a fabricated `nicholasbrailo/kokoro-onnx`, and an invented StackOverflow Q&A. The dangerous kind: looks rigorous, isn't.
- Confidence calibration: 3/5 — has confidence notes yet states inferred internals as fact
- Mechanism specificity: 4/5
- Ground-truth agreement: 3/5 — overstates Speechify "explicitly skips `<code>`/`<pre>`" as firm+uniform; our source read shows it's only partial (one code path)

**Verdict:** Most detailed-LOOKING B response but the least trustworthy — a rigorous-seeming citation list built partly on fabricated repos and a fake SO link, plus firm claims about Misaki internals contradicted by our local finding that no JS Misaki even exists. Mine it for mechanism ideas; discard its citations wholesale.

### Claude Sonnet 5 (Free) Web Search — competitor teardown (RE-SCORED on complete artifact, 2026-07-21)

> Supersedes the earlier truncated evaluation of this same response. The first export was
> user-flagged "half complete"; the user later re-ran it and replaced the file with the full
> artifact. Scores below are for the COMPLETE artifact (~960 lines, 113 footnoted refs). The
> prior truncated scores (Acc 4 / Crit 2 / Comp 2 / Depth 2) are retained only as a note that a
> visibly-incomplete export must be re-run, never scored as the model's ceiling.

**Baseline:**
- Accuracy: 5/5
- Critical coverage: 5/5
- Completeness: 5/5
- Depth: 5/5
- Hallucination risk: low

**Domain-specific:**
- Citation integrity: 5/5 — 113 numbered, linked footnotes; load-bearing repos correct (`hexgrad/Kokoro-82M`, `rany2/edge-tts`, `Kokoro-FastAPI`, the `misaki` homograph-TODO issue) — the exact org DeepSeek Expert fabricated (`nicholasbrailo/misaki`), Claude got right
- Confidence calibration: 5/5 — every inferred cell explicitly rated High/Medium/Low; a dedicated §5 "what remains genuinely undocumented" instead of papering gaps
- Mechanism specificity: 5/5 — full matrix + per-product narrative + the deepest Edge `WordBoundary` wire-protocol deep-dive of the four (interleaved MP3+JSON frames, 100ns ticks, offset_compensation)
- Ground-truth agreement (vs local teardown): 5/5 — Speechify speech-marks tree + leading/trailing-silence edge cases match our source read exactly; no overstatement
- Product-fit / decisive insight: 5/5 — see verdict; multiple unique, decision-grade findings no other model produced

**Verdict:** The strongest response across BOTH reports, and it flips the batch verdict — with the complete artifact in, Claude wins competitor-teardown too, not just TN. Unique, decision-grade contributions none of the other three produced: (1) the correct resolution of the timestamp question — use Kokoro's **Python-side model-internal duration-predictor output** (already exposed by `Kokoro-FastAPI`'s `/dev/captioned_speech`), NOT forced alignment and NOT the JS/WebGPU chunk-duration heuristic — directly correcting the other three's wrong "Kokoro has no timestamps → must forced-align" premise; (2) hard drift numbers from an academic ebook-sync study (listeners tolerate highlight ~150ms *ahead* but even ~50ms *lag* is perceptible; Syncabook/Afaligner miss the window on 30%+ of sentences, Whisper-align only 6.6% acceptable) → a measured argument to **never** use forced-alignment; (3) the `Kokoro-FastAPI` `---` bug where timestamps silently drop for a whole sentence while audio is fine → proves TN/segmentation can desync highlighting independently of audio and needs its own test suite (couples C2↔C4); (4) concrete, issue-linked Misaki TN failure modes (years, `$` currency, phone numbers, niche-acronym letter-spelling, homograph TODO naming `axes bass bow lead tear wind`); (5) the espeak-ng GPL-contamination licensing flag; (6) real design patterns from adjacent tools (Obsidian Voice toggles, Paper2Audio summarize-don't-narrate) since the market leaders document none. Safe to act on with near-zero verification. Confirms the model-profile pattern: when Claude delivers a complete artifact it is best-in-class on the criterion that matters most (critical coverage).
