// The spec-first entry, as it stood in mods/flow-session/features/triggers/list.ts (removed 2026-11-03, fw-397).
/** The Flow repo's parts whose changes wait for `docs/spec/product.md`. */
const SPEC_FIRST = /^(?:skills|scripts|docs\/manual|home|project-template)\//
  {
    // Beside the guides: a change to a part of Flow waits for the spec of the whole product.
    id: 'spec-first',
    on: 'response',
    when: (call) => ['Edit', 'Write'].includes(call.tool) && SPEC_FIRST.test(repoPathOf(pathOf(call)) ?? ''),
    send: () => [{ tool: 'Read', path: `${repoRoot()}/docs/spec/product.md` }],
    why: (call) => `Before planning a change to ${nameOf(pathOf(call))}, read the spec of the whole product.`,
    also: true,
  },
