# Project Specification

Add documentation here **before** running `/project-init`.

`/project-init` reads every file in this folder regardless of name or nesting.

---

## Required content

Two dimensions must be covered before init can run. **How you organize and name files is entirely up to you** — single files, multiple files, nested folders, all fine.

### 1. Product bible

A detailed A-Z explanation of what you're building. The agent must be able to understand the product end-to-end from this content alone:

- What it does, who it's for
- Core features and user flows
- V1 scope: what's in, what's explicitly out (non-goals)
- Edge cases that matter

### 2. Tech spec + stack

Detailed technical decisions. Assume you've done your high-level research before init — this captures the result:

- Full library / framework list with versions and rationale
- Architecture decisions, system design, data flow
- Deployment target, runtime, integration points
- Storage, auth, jobs, anything else that shapes the codebase

If either dimension is thin or missing, `/project-init` will refuse to run and tell you what to add.

---

## Examples of valid layouts

- Single files: `product.md` + `tech.md`
- Split by topic: `product/overview.md`, `product/features.md`, `product/v1.md`, `tech/stack.md`, `tech/architecture.md`, `tech/deployment.md`
- Mixed: `bible.md` + `architecture.md` + `data-model.md` + `decisions.md`

Add anything else useful: `data-model.md`, `api.md`, `decisions.md` (ADR log), `roadmap.md`, integration notes, runbooks. Every file is read.

---

## Tips

- The more specific your V1 scope, the better `/project-init` can derive the first milestone.
- Capture **why** behind tech decisions, not just what — prevents relitigating choices later.
- A `roadmap.md` here is welcome — it'll seed `docs/work/roadmap.md` during init.
