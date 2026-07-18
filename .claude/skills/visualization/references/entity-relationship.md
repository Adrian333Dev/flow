# Entity-relationship (schema) diagrams

Use DBML — not hand-drawn SVG, and not Mermaid either. This is the one diagram type in this skill that isn't rendered by hand or by a general-purpose diagramming syntax; it's rendered by a tool purpose-built for database schemas. Relationship-line routing between freely-placed tables is coordinate math that breaks down past 2-3 well-aligned tables — confirmed by direct test: a hand-rolled SVG version of a 5-table schema produced relationship lines with no arrowheads, lines running straight through column text, and a line clipping back through its own source table. Mermaid's `erDiagram` fixed those structural bugs (real crow's-foot notation, no crossing lines) but the result still looked visually plain/generic — a dedicated DBML viewer is what actually produces a diagram that looks like a real schema tool made it, not a generic auto-layout graph.

```dbml
Table organizations {
  id uuid [pk]
  name text
  plan text
}

Table projects {
  id uuid [pk]
  org_id uuid [ref: > organizations.id]
  name text
  status text
}

Table users {
  id uuid [pk]
  org_id uuid [ref: > organizations.id]
  email text
  name text
}

Table tasks {
  id uuid [pk]
  project_id uuid [ref: > projects.id]
  assignee_id uuid [ref: > users.id]
  title text
  done boolean
}

Table comments {
  id uuid [pk]
  task_id uuid [ref: > tasks.id]
  author_id uuid [ref: > users.id]
  body text
}
```

Relationship syntax — `[ref: <token> table.column]` on the foreign-key column:

| Token | Meaning |
|---|---|
| `>` | many-to-one (this column has many, points to one) |
| `<` | one-to-many |
| `-` | one-to-one |
| `<>` | many-to-many |

Save as a standalone `.dbml` file — not `.html`, not a fenced code block in `.md`; this needs a DBML-aware viewer, not a browser or a Markdown preview. Tell the user to open it in VS Code: if they have the `dbdiagram` extension (dbdiagram.io's official one) installed, it renders live automatically, no extra step. **Never install the extension yourself** — if they don't have it, name it and let them decide whether to install it. No-extension fallback: the same `.dbml` file can be pasted directly into dbdiagram.io.

Past ~15-20 tables, split into multiple `.dbml` files by domain/bounded-context rather than one giant schema — same judgment call as `references/complex-diagrams.md`, just resolved by splitting files since the renderer (not hand-placement) is doing the layout work here.
