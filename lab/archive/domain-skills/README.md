# Domain Skills

A collection of domain-specific skills for AI coding agents. Each skill carries knowledge about one field or tool, such as React or Postgres, in the `SKILL.md` format that Claude Code and other agents load.

> [!NOTE]
> **No skill is finished yet.** 3 drafts sit in `drafts/`: `web-pages`, `excalidraw` and `chrome-extension`. Finished skills go in `skills/`.

## Install a skill

```console
$ npx skills add Adrian333Dev/domain-skills --skill <name>
```

Vercel's [skills installer](https://github.com/vercel-labs/skills) puts the skill where your agent reads skills from. With [Flow](https://github.com/Adrian333Dev/flow) installed, the skills are already downloaded: `flow skills on <name>` switches one on.

## Contribute

[Contributing](CONTRIBUTING.md) says whether what you learned is a finding, a page or a whole skill, and the shape each one takes.
