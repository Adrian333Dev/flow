# Hivemind

Read 2026-10-04 from `repos/tools/hivemind/`. About 1,600 stars, Apache 2.0, by Activeloop. A shared memory for a team's agents: every session's prompts and tool calls go to Activeloop's cloud database, Deeplake, and a worker turns repeated patterns into `SKILL.md` files every teammate gets.

**A skill is judged by the user's next message.** When the agent uses a skill, a hook opens a window. The user's next prompt counts as the verdict on that skill, and a worker weighs it.

## Against Flow

Flow keeps everything on the user's machines and a private GitHub repository. Hivemind sends every session to a cloud service, which Flow's design rules out.

## What Flow could take

Nothing new. Flow's capture already files a correction about a skill against that skill: `home/AGENTS.md` → `## Capture`, the `skill: <name>` header.
