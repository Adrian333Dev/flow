# Browser tooling — `debug-web-pages` and `browser-harness`

**Status: deferred to after Flow's V1.** Decided 2026-08-12. Nothing changes now; `debug-web-pages` stays exactly as it is. This file exists so the reasoning survives until the work happens.

## The two things

**`debug-web-pages`** — Flow's own skill, `skills/debug-web-pages/`, 1,299 lines across 12 files. It reverse-engineers a live web page you do not control: how it works, what handles a key press, whether you can intercept it.

**`browser-harness`** — a third-party tool from the browser-use team, 16.5k stars, catalogued in `toolbox/browser.md` and cloned at `repos/browser-harness/`. It connects an agent straight to a running Chrome over CDP. The agent clicks, types, navigates and reads the page itself. Roughly 1k lines of core, plus 18 mechanics files and a self-growing store of site-specific knowledge.

## Why this came up

`browser-harness` is not a bigger version of `debug-web-pages`. It removes the constraint `debug-web-pages` was built around.

That skill says so in its own words: *"I can't drive the browser, so both modes are a collaborative loop — I write, you run, you paste back, I read."* Everything in it follows from that. You paste `capture.js` into the DevTools console, download `capture.json`, run `unpack.js` to get a queryable bundle. Every live experiment is a round trip through the user: agent writes a probe, user runs it, user pastes logs back.

With `browser-harness` installed, the agent has a browser. The round trip is gone.

## The verdict — split the skill, keep the method

`debug-web-pages` holds three separate things and they have three different fates.

- **The transport — `scripts/capture.js` (301 lines) and `scripts/unpack.js` (190 lines).** Dead. Everything `capture.js` pulls out through the DevTools console — event listeners, shadow DOM, runtime state — `browser-harness` reaches through raw CDP, which it exposes directly as `cdp("Domain.method", ...)`.
- **The context discipline** — *"bundle files are multi-MB. Query them, never read them whole into context."* Keep. It matters more with a live browser, not less, because CDP output is unbounded. `browser-harness` says the same thing in one clause: *"filter in Python before printing (it is thousands of nodes)."*
- **The investigation method** — `understand → hypothesize → probe → intervene → verify → record`, plus the probe craft: gate early and narrowly, log the state that proves the outcome, one variable per probe, reload between attempts. **Keep all of it.** `browser-harness` has no equivalent. That repo is a mechanics manual — how to click, how to handle an iframe, how to connect. It carries no method for working out how a page works.

So `debug-web-pages` drops from 1,299 lines to roughly 150 and becomes a method skill standing on `browser-harness` as the mechanism. That is Flow's own disjointness rule: the general skill owns the method, the tool owns the specifics.

## The overlap to resolve at the same time

Both accumulate site knowledge. `debug-web-pages` writes `knowledge/domains/<page>.md` by hand at the end of an investigation. `browser-harness` writes `agent-workspace/domain-skills/<host>/`, surfaced automatically on navigation and gated behind `BH_DOMAIN_SKILLS=1`.

Theirs is better engineered. Two stores of the same facts drift, so `knowledge/domains/` folds into theirs. Only one file exists today, `youtube-watch.md`, so the migration is small.

## Why it waits

**The platform blocks it** (stated 2026-08-16). Flow runs on Windows under WSL, and driving a browser from there — Playwright, or Chrome over CDP — hits more problems than it is worth fighting. The user moves to Linux in **two to three weeks**, and expects to be on it before this work starts. Nothing here is scheduled before that move.

`browser-harness` also needs Python 3.12, `uv`, and a Chrome launched with remote debugging plus a permission click the user makes by hand. Flow installs nothing until the workflow is finished, and that rule is not being bent for this.

Until it is installed, `capture.js` is the only thing that works. **Nothing gets deleted before the install.** Deleting the transport first would leave a skill that cannot do anything.

## When it is time

1. Install `browser-harness` and register its skill.
2. Rewrite `skills/debug-web-pages/SKILL.md` around the loop and the probe craft, pointing at `browser-harness` as the driver.
3. Delete `scripts/capture.js`, `scripts/unpack.js`, and `knowledge/capturing-and-querying.md` — the whole capture-bundle mode.
4. Move `knowledge/domains/youtube-watch.md` into the harness's domain-skills store.
5. Re-check `DESIGN.md`, `ROADMAP.md` and `MAINTAINING.md` — 490 lines describing an architecture that will no longer exist.
6. Decide whether the skill keeps its name. It stops being about pages you cannot drive.
