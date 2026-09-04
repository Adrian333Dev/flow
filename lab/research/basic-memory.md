# basic-memory

3.8k stars. Markdown files with wikilinks as a knowledge graph. The file is the source of truth; SQLite is a derived index. MCP server for search and retrieval. Local-first with optional cloud sync. AGPL-3.0.

## Core mechanism — structured markdown as the knowledge format

Every note is a plain markdown file with three parts:

### 1. YAML frontmatter

```yaml
---
title: Coffee Brewing Methods
type: note
tags: [coffee, brewing]
permalink: coffee-brewing-methods
---
```

Standard fields (title, type, tags, permalink, schema) plus arbitrary custom metadata. Permalink is the stable identifier — survives file moves.

### 2. Observations (categorized facts)

```markdown
- [method] Pour over provides more flavor clarity than French press
- [technique] Water temperature at 205°F extracts optimal compounds #brewing
- [preference] Ethiopian beans work well with lighter roasts (personal experience)
```

Syntax: `- [category] content #tag (context)`. The category is required, tags and context are optional. Repeated categories represent array-like fields. Checkboxes, markdown links, and bare wikilinks in list items are excluded from observation parsing.

### 3. Relations (knowledge graph edges)

```markdown
- relates_to [[Coffee Bean Origins]]
- requires [[Proper Grinding Technique]]
- contrasts_with [[Tea Brewing Methods]]
```

Syntax: `- relation_type [[Target Entity]]`. Common types: implements, depends_on, relates_to, extends, part_of, contains. Inline wikilinks in prose create implicit `links_to` relations. Forward references resolve when the target is created.

## Schema validation — Picoschema

Optional schemas define expected structure:

```yaml
schema:
  name: string, full name
  role?: string, job title
  works_at?: Organization, employer
  expertise?(array): string, areas of knowledge
```

Schemas map to observation and relation syntax: `name: string` → `[name] value`, `works_at?: Organization` → `works_at [[Target]]`. Validation modes: `warn` (default) or `strict` (blocks sync). Schema inference analyzes existing notes to suggest schemas based on observation frequency.

## Architecture

- **Files are truth.** Changes to files automatically update the knowledge graph in the database. SQLite is a derived cache, rebuilt silently when pages change.
- **`memory://` URLs.** Every note is addressable by permalink, title, or path. Pattern matching supported (`memory://auth*`).
- **MCP server.** Search (full-text + semantic), read/write notes, canvas views for graph visualization.
- **Optional semantic search.** Cross-encoder reranking for vector and hybrid results. Not required — FTS5 works at personal scale.

## What matters for Flow

### The observation syntax is the right granularity

`[category] content #tag (context)` captures a single fact with its classification, topics, and supporting detail. It is both human-readable and machine-parseable. For Flow's knowledge types: `[incident] symptom/cause/fix/prevention`, `[convention] naming rule`, `[decision] architecture choice with rationale`. The syntax works without any infrastructure — it is just markdown.

### Files as truth, database as cache

Flow already uses markdown files as the source of truth for skills, rules, and references. A knowledge base that follows the same pattern — markdown files with a derived index — fits naturally. No migration path needed, no new infrastructure, and Git provides version history.

### Wikilinks create a navigable graph

Relations between knowledge items (`[[Target]]`) let the agent follow connections: "this convention exists because of this incident," "this decision supersedes that one." Flow's existing cross-references (skill references, context files) use file paths; wikilinks would add semantic relationships.

### Schema validation catches drift

As the knowledge base grows, schemas ensure notes follow the expected structure. For Flow, this could enforce that every incident record has a cause and a fix, every convention has an example, every decision has a rationale. Strict mode could gate on commit.

### The infrastructure is too heavy for Flow's starting point

basic-memory is an MCP server with an async Python stack, database migrations, cloud sync, and a commercial SaaS layer. Flow needs the format ideas (observation syntax, wikilinks, schemas), not the infrastructure. The format can be adopted without the MCP server.
