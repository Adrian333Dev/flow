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
  Build     tickets → plan → build → review → handoff to the next session
  Improve   preferences, tool knowledge, mistakes → filed into skills, rules and the wiki ↺ the next project
  ```

- **The loop in 1 line, for X**, about 150 characters: `idea → decisions mapped → researched → settled with you → stress-tested → tickets → planned → built → reviewed → lessons into skills, rules & wiki ↺`
- **The wiki claim for posts**: "My second Next.js project started with everything the first one learned about Next.js." It holds because `~/.flow/wiki/<tool>/` keeps each tool's docs, reports and findings, and `/flow:research` and `/flow:execute` read it in every project.
- **The line that leaves the memory category**: "Memory tools remember what went wrong. Flow changes what the agent does next time."
- **"Built and tested on Claude's 5.5 models"**, never "optimized for". No skill or setting is tuned to a model version. What would flip it: something concrete that breaks on older models.

## The README, approved by the user 2026-10-03

The user threw out the pass 5 README below the loop: "terrible marketing". 6 drafts followed, and the user approved the sixth: "This is clearly better." `README.md` holds the result: warning, Install, a 10-row comparison table, Coming next, Documentation. No Features section: round 5 merged it into the table.

**Set by the user:**

- **The README is the pitch**, "like a resume": it has to convince a stranger, "without over hyping something, without any bullshit". The opening paragraph and the loop are the bar for the rest.
- **`two-pass review` became `review`** in the loop: the reader can't tell what the 2 passes are.
- **The comparison table stays**, rewritten to show where Flow is ahead: "glancing at that table, they would get a lot of clear ideas".
- **Never a small feature alone**, in the table or in Features. A live meter, a handoff or a guard joins the bigger row it belongs to.
- **Plain words**: "pre-mortem" and "prior art" were rejected as terms many readers don't know.
- **The section is called `Features`**, short and dense with capabilities, written as a pitch.
- **Status carries no unbuilt feature as a lack**: never "no assignees, no roles". Never a timeline either, such as "2 to 3 weeks". The user cares whether Flow is ready and what it does, never the stages to V1.
- **A warning says Flow is under development and not ready for use.** At the beta the warning's text changes, and at V1 it goes.
- **Coming next names the trackers** under teams: GitHub Issues, GitHub Projects and others. The mods line links Claude Code's mods docs and says what mods bring.
- **Install sits above the comparison table.**
- **Features merge into the table**: every capability where Flow leads becomes a row or part of one.
- **A comparison cell is one compressed line, never an explanation.** It says what Flow does, never how it works step by step: no `flow next`, no rule IDs, no blocking level, no Next.js example.
- **Every row name says what it compares** to a stranger: "Every computer" became `Multi-machine sync`, "Machinery" `Hooks and guardrails`.
- **The ticket row names the CLI**: a CLI is proof, "one place for all your work" only a promise.
- **Self-improvement starts at capture**, the step that files each correction and lesson as you work.
- **Skill management leads with replacing Vercel's `npx skills`.**

**Agreed, proposed by the agent and never opposed:**

- The warning box sits under the loop, so "not ready" shows before any feature or the install line.
- Where Flow runs moves into Install: Linux, macOS and WSL, built and tested on Claude's 5.5 models.
- Coming next, in order: mods, teams, other agents and models.
- **The table claims only what works today.** GitHub Issues stays in Coming next, and Rule enforcement never says "every rule", since Flow ships 1 check and most rules have none.
- **"Nothing is ever lost" stays off Long sessions**: a handoff keeps what the next session needs, not the conversation. Tickets are never lost, so the promise sits on Task tracking.
- **Plan, build, review and debug get no row**: Superpowers matches Flow there, so a row shows a tie.
- **mattpocock/skills gets "A project glossary" under Self-improvement**: its `domain-modeling` skill writes `CONTEXT.md` as you design.

**Dropped, with why:**

- **The pass 5 "What makes it different" list**: a whole line for the shell guard, and nothing on the ticket system.
- **The 3 stages to V1 in Status**: worth knowing for the author, worthless to the reader.
- **"Working with you" as a table row**: its cells said nothing a reader could picture. Rules replaced it.
- **`flow audit` and study cases as selling points**: they serve whoever maintains Flow, not most users.
- **A Features section beside the table**, dropped by the user: it repeated the table.
- **A Memory row**: Self-improvement and Multi-machine sync already say it.
- **`/flow:visualize`, the status line and groundwork's bending of each part**: each small alone, and the docs keep them.

**Where Flow runs**: Claude Code only, on Linux, macOS and WSL. Native Windows is out, since every hook is a shell line. Never carry "Claude Code (expanding)" or "multi-agent portability" into the README: both read as work in progress.

## Dropped, with why

- **"Memory and leash" as the headline**, dropped by the user: hundreds of agent-memory repos exist, and Flow is a whole workflow.
- **"Most Claude Code tools help you write the code. Flow runs the part around it…"**, dropped by the user: too little information.
- **"A software team's whole process, for one developer and Claude Code"**, dropped by the user: too little information, and Flow does not support teams. Who Flow serves belongs in the status section, never in the pitch.
- **"→ new rules" as the loop's last step**, dropped by the user: too thin. The loop ends on skills, rules and the wiki, drawn as a loop.
- **A GIF or demo video at launch**, dropped by the user: a terminal recording hides what Flow adds. A demo waits until Flow is stable. Posts are text first, on Reddit and X.
