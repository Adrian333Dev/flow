# Pitch: how Flow describes itself in the README and in posts

The marketing conversation of 2026-10-02. It feeds the README rewrite in the sweep, `lab/backlog/before-beta.md` → "Build Flow for a stranger", and the posts the user plans on Reddit and X from the beta on. The rewrite makes the README short, so this file holds the wording and the facts, never the page's layout.

## Approved by the user 2026-10-02

### The README opening

> **Flow is a complete development workflow for Claude Code.** It takes a raw idea and finds every decision the project needs, including the ones you never raised. It researches the open ones, settles each one with you, and tests the design against real cases before any code exists. It cuts the design into tickets, then plans, builds and reviews each one. It carries the work from one session to the next. Everything it learns about your preferences, your tools and its own mistakes goes back into its skills, its rules and a wiki that every project shares. Each project starts with what the last one taught it.

### The GitHub description

> A complete Claude Code workflow: from a raw idea to a researched design, tickets, and planned, built and reviewed code, carried across sessions. Every lesson goes back into its own skills, rules and wiki, so it gets better with use.

The opening works because every clause names a real step. Keep that density in any later edit.

## Agreed: proposed by the agent, never opposed

- **The loop in 3 rows**, for the README or a post:

  ```text
  Design    idea → every decision mapped → researched → settled with you → tested on real cases → design written down
  Build     tickets → plan → build → two-pass review → handoff to the next session
  Improve   preferences, tool knowledge, mistakes → filed into skills, rules and the wiki ↺ the next project
  ```

- **The loop in 1 line, for X**, about 150 characters: `idea → decisions mapped → researched → settled with you → stress-tested → tickets → planned → built → reviewed → lessons into skills, rules & wiki ↺`
- **The wiki claim for posts**: "My second Next.js project started with everything the first one learned about Next.js." It holds because `~/.flow/wiki/<tool>/` keeps each tool's docs, reports and findings, and `/flow:research` and `/flow:execute` read it in every project.
- **The line that leaves the memory category**: "Memory tools remember what went wrong. Flow changes what the agent does next time."
- **"Built and tested on Claude's 5.5 models"**, never "optimized for". No skill or setting is tuned to a model version. What would flip it: something concrete that breaks on older models.

## The status section, still to design

The user rejected the agent's draft on 2026-10-02: 3 short paragraphs, Today, Next and Later, too specific and badly structured for how much the section must hold. The section gets designed during the README rewrite. The facts it must carry:

- **Who it serves today**: one developer. A second person can share a project's tickets through the `flow` branch, and nothing more. No assignees, roles, server, lead's board or tracker connection.
- **Where it runs**: Claude Code only, on Linux, macOS and WSL. Native Windows is out, since every hook is a shell line.
- **Teams**: the top priority after V1. `teams.md` holds the vision.
- **Other agents**: Codex and open-source ones are planned and not prioritized.
- **Today's README contradicts this**: the comparison table's "Claude Code (expanding)" and Status's "multi-agent portability" both read as work in progress. Never carry either into the rewrite.

## Dropped, with why

- **"Memory and leash" as the headline**, dropped by the user: hundreds of agent-memory repos exist, and Flow is a whole workflow.
- **"Most Claude Code tools help you write the code. Flow runs the part around it…"**, dropped by the user: too little information.
- **"A software team's whole process, for one developer and Claude Code"**, dropped by the user: too little information, and Flow does not support teams. Who Flow serves belongs in the status section, never in the pitch.
- **"→ new rules" as the loop's last step**, dropped by the user: too thin. The loop ends on skills, rules and the wiki, drawn as a loop.
- **A GIF or demo video at launch**, dropped by the user: a terminal recording hides what Flow adds. A demo waits until Flow is stable. Posts are text first, on Reddit and X.
