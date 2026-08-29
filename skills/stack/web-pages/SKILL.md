---
name: web-pages
description: Investigates and experiments on a live web page you do not control. For extension, scraper and userscript work.
---

# Debug Web Pages

Reverse-engineer and experiment on a live page you don't control. **Two modes,
one loop.**

## The loop

**understand → hypothesize → probe → intervene → verify → record what you learned**

Predictability lives in *this loop* — run it every time — **not** in the specific
techniques. Every recipe in this skill is a **starting point, not a menu**: reach
for whatever actually answers the question, invent approaches the docs don't list,
and **when a task keeps failing, change the approach rather than repeat it.** The
knowledge files are a floor, not a ceiling. (Escalation when stuck:
[`knowledge/investigation-patterns.md`](knowledge/investigation-patterns.md).)

## Two modes

- **Capture** — snapshot the page into an offline, queryable **bundle** (full
  HTML, event listeners, shadow DOM, runtime state). Use it to *understand* the
  page without the live tab. → [`knowledge/capturing-and-querying.md`](knowledge/capturing-and-querying.md)
- **Live experiment** — you're in a real tab; I write a console **probe**
  (recon or interception) snippet, you run it and interact, you paste the logs
  back, I iterate. Use it to *test hypotheses and interventions* on the running
  page — things a static snapshot can't answer. → [`knowledge/live-experiments.md`](knowledge/live-experiments.md)

Most real investigations use both: **capture** to map the terrain, **live
experiments** to prove behavior and interventions. I can't drive the browser, so
both modes are a collaborative loop — I write, you run, you paste back, I read.

## Every investigation

- **Before you start:** check [`knowledge/domains/`](knowledge/domains/) for a
  file on this page — it's what we already proved, so you don't re-derive it.
- **When you finish:** append your verified findings to that domain file (or
  create one from [`_TEMPLATE.md`](knowledge/domains/_TEMPLATE.md)) — dated,
  citing the bundle/session. This is how the skill compounds.

## Reference

- [`knowledge/investigation-patterns.md`](knowledge/investigation-patterns.md) —
  how to attack each investigation type, the standing blind spots, and what to do
  when you're stuck.

!`flow overlays web-pages`
