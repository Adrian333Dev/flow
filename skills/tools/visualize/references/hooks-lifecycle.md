# Hooks lifecycle

Converted from `hooks-lifecycle-dark.svg` (520 x 1228). 113 columns, 97 rows.

Three conventions carry the structure.

**A container's wall is `¦`, its top and bottom edges are dashed.** Every stroke of the border is an
interrupted line, and every solid line in the picture is a connector — the two never read as each other, on
any row. The group is named twice, top-left and bottom-right, which identifies the far edge as belonging to
the same container. Solid `│` walls, alternating `─`/`│` and the wider bar glyphs all failed this test.

**Every return lane is labelled at both ends** — `from X` where it leaves, `to Y` where it lands — so a line
running 40 rows can be picked up at either end without tracing it.

**The spine breaks each container's edge** where it passes through, which says the flow crosses the boundary
rather than stopping at it.

The diagram is also the argument against drawing anything this size: the longest lane runs 77 rows and no
screen shows both of its ends. Where a connector outruns the screen is where the diagram should have split.

```
     ┌────────────────────┐      ┌─────────────────────────────┐
     │       Setup        │ ───► │        Session Start        │ ◄───── from SessionEnd (resumed session) ──────┐
     │      (opt-in)      │      └─────────────────────────────┘                                                │
     └────────────────────┘                     │                                                               │
┌─  EACH TURN  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┐     │
¦    ┌────────────────────┐                     ▼                                                         ¦     │
¦    │     UserPrompt     │      ┌─────────────────────────────┐                                          ¦     │
¦    │     Expansion      │ ◄─── │      UserPromptSubmit       │ ◄──── from Stop / StopFailure ─────┐     ¦     │
¦    │  (slash commands)  │      └─────────────────────────────┘                                    │     ¦     │
¦    └────────────────────┘                     │                                                   │     ¦     │
¦ ┌─  AGENTIC LOOP ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┐     │     ¦     │
¦ ¦                                             ▼                                             ¦     │     ¦     │
¦ ¦                              ┌─────────────────────────────┐                              ¦     │     ¦     │
¦ ¦                              │         PreToolUse          │ ◄─ from TaskCompleted ─┐     ¦     │     ¦     │
¦ ¦                              └─────────────────────────────┘                        │     ¦     │     ¦     │
¦ ¦                                             │                                       │     ¦     │     ¦     │
¦ ¦  ┌────────────────────┐                     ▼                                       │     ¦     │     ¦     │
¦ ¦  │     Permission     │      ┌─────────────────────────────┐                        │     ¦     │     ¦     │
¦ ¦  │       Denied       │ ◄─── │      PermissionRequest      │                        │     ¦     │     ¦     │
¦ ¦  │  (auto-mode deny)  │      └─────────────────────────────┘                        │     ¦     │     ¦     │
¦ ¦  └────────────────────┘                     │                                       │     ¦     │     ¦     │
¦ ¦                                             ▼                                       │     ¦     │     ¦     │
¦ ¦  ┌────────────────────┐      ┌─────────────────────────────┐                        │     ¦     │     ¦     │
¦ ¦  │    Elicitation     │ ───► │      [ tool executes ]      │                        │     ¦     │     ¦     │
¦ ¦  │    (MCP input)     │      └─────────────────────────────┘                        │     ¦     │     ¦     │
¦ ¦  └────────────────────┘                     │                                       │     ¦     │     ¦     │
¦ ¦  ┌────────────────────┐                     ▼                                       │     ¦     │     ¦     │
¦ ¦  │ ElicitationResult  │   ┌───────────────────────────────────┐                     │     ¦     │     ¦     │
¦ ¦  │    (MCP input)     │   │ PostToolUse / PostToolUseFailure  │                     │     ¦     │     ¦     │
¦ ¦  └────────────────────┘   └───────────────────────────────────┘                     │     ¦     │     ¦     │
¦ ¦                                             │                                       │     ¦     │     ¦     │
¦ ¦                                             ▼                                       │     ¦     │     ¦     │
¦ ¦                              ┌─────────────────────────────┐                        │     ¦     │     ¦     │
¦ ¦                              │        PostToolBatch        │                        │     ¦     │     ¦     │
¦ ¦                              └─────────────────────────────┘                        │     ¦     │     ¦     │
¦ ¦                                             │                                       │     ¦     │     ¦     │
¦ ¦                                             ▼                                       │     ¦     │     ¦     │
¦ ¦                           ┌───────────────────────────────────┐                     │     ¦     │     ¦     │
¦ ¦                           │   SubagentStart / SubagentStop    │                     │     ¦     │     ¦     │
¦ ¦                           └───────────────────────────────────┘                     │     ¦     │     ¦     │
¦ ¦                                             │                                       │     ¦     │     ¦     │
¦ ¦                                             ▼                                       │     ¦     │     ¦     │
¦ ¦                              ┌─────────────────────────────┐                        │     ¦     │     ¦     │
¦ ¦                              │         TaskCreated         │                        │     ¦     │     ¦     │
¦ ¦                              └─────────────────────────────┘                        │     ¦     │     ¦     │
¦ ¦                                             │                                       │     ¦     │     ¦     │
¦ ¦                                             ▼                                       │     ¦     │     ¦     │
¦ ¦                              ┌─────────────────────────────┐                        │     ¦     │     ¦     │
¦ ¦                              │        TaskCompleted        │ ──── to PreToolUse ────┘     ¦     │     ¦     │
¦ ¦                              └─────────────────────────────┘                              ¦     │     ¦     │
¦ ¦                                             │                                             ¦     │     ¦     │
¦ └─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  AGENTIC LOOP ─ ─┘     │     ¦     │
¦                                               │                                                   │     ¦     │
¦                                               ▼                                                   │     ¦     │
¦                                ┌─────────────────────────────┐                                    │     ¦     │
¦                                │     Stop / StopFailure      │ ─────── to UserPromptSubmit ───────┘     ¦     │
¦                                └─────────────────────────────┘                                          ¦     │
¦                                               │                                                         ¦     │
└─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ EACH TURN ─ ─┘     │
     No fixed point in the sequence             │                                                               │
                                                ▼                                                               │
     ┌────────────────────┐      ┌─────────────────────────────┐                                                │
     │    Notification    │      │        TeammateIdle         │                                                │
     │      (async)       │      └─────────────────────────────┘                                                │
     └────────────────────┘                     │                                                               │
                                                ▼                                                               │
     ┌────────────────────┐      ┌─────────────────────────────┐                                                │
     │    ConfigChange    │      │         PreCompact          │                                                │
     │      (async)       │      └─────────────────────────────┘                                                │
     └────────────────────┘                     │                                                               │
                                                ▼                                                               │
     ┌────────────────────┐      ┌─────────────────────────────┐                                                │
     │   WorktreeCreate   │      │         PostCompact         │                                                │
     │    (isolation)     │      └─────────────────────────────┘                                                │
     └────────────────────┘                     │                                                               │
                                                ▼                                                               │
     ┌────────────────────┐      ┌─────────────────────────────┐                                                │
     │   WorktreeRemove   │      │         SessionEnd          │ ─────────────── to Session Start ──────────────┘
     │     (teardown)     │      └─────────────────────────────┘
     └────────────────────┘

     ┌────────────────────┐
     │     CwdChanged     │
     │    FileChanged     │
     │   DirectoryAdded   │
     │   (env reactive)   │
     └────────────────────┘

     ┌────────────────────┐
     │ InstructionsLoaded │
     │      (async)       │
     └────────────────────┘

     ┌────────────────────┐
     │   MessageDisplay   │
     │     (display)      │
     └────────────────────┘
```
