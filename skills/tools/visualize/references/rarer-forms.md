# Rarer forms

Three diagram forms that fire seldom enough to live outside `SKILL.md`. Each carries the three lines that
define it, then the drawing.

## Timeline / parallel lanes

**When:** concurrency, scheduling, latency, duration — anything where *when*, *how long* or *overlap* is the idea.
**How:** time flows right; one lane per actor; a bar's width is its real duration; annotate the one thing to notice.
**Failure:** structural boxes inside a timeline, or two time scales in one picture. Structure and timing are two diagrams.

Length carries the quantity here: one column is one day, and a bar is as wide as the work is long. The elbow after `write spec` is a dependency — parser cannot start until spec ends. The `today` line is drawn only in the gaps between bars, which is what makes it read as a reference rather than as data — no new glyph needed, and none available.

```
                 Aug 19      Aug 26      Sep 02      Sep 09      Sep 16      Sep 23
                 │           │           │           │           │           │
                                               │
 write spec      ━━━━━━━━━━━┐
                            │                  │
 build parser               └━━━━━━━━━━━━━━━━━━━━━━━
                                               │
 build codegen                           ━━━━━━━━━━━━━━━━━━━━━━━
                                               │
 review                                                          ━━━━━━━━━━━
                                               │
 ship                                                                        ━━━
                                               │
                                             today
```

## Record boxes

**When:** a data model — tables, entities, message shapes, anything with named fields.
**How:** one box per record, its name above a `├──┤` divider and its fields below, left-aligned; cardinality written at the end of the line it describes.
**Failure:** every field of every table. Show the keys and the fields the discussion is about.

Four tables, three relationships. Each box carries its own rows behind a `├──┤` divider, so the header reads as a name and the rest reads as fields. Cardinality sits at the end it describes: one user, many orders. `orders` and `products` reach each other only through `order_items`, which is what the two vertical hops say.

```
┌──────────────────────────┐                  ┌────────────────────────────┐
│ users                    │                  │ orders                     │
├──────────────────────────┤                  ├────────────────────────────┤
│ id           uuid  PK    │1 ────────────── *│ id           uuid  PK      │
│ email        text        │                  │ user_id      uuid  FK      │
│ created_at   timestamptz │                  │ total_cents  int           │
└──────────────────────────┘                  │ placed_at    timestamptz   │
                                              └────────────────────────────┘
                                                            │ 1
                                                            │
                                                            │ *
┌──────────────────────────┐                  ┌────────────────────────────┐
│ products                 │                  │ order_items                │
├──────────────────────────┤                  ├────────────────────────────┤
│ id           uuid  PK    │1 ────────────── *│ order_id     uuid  FK      │
│ sku          text        │                  │ product_id   uuid  FK      │
│ price_cents  int         │                  │ qty          int           │
└──────────────────────────┘                  └────────────────────────────┘
```

## Aligned axes

**When:** two representations of one thing that must map onto each other — source and derived, text and time.
**How:** stack the two; vertical alignment *is* the mapping; mark only the interesting correspondence and let the boring 1:1 cases just line up.
**Failure:** three or more representations at once. Chain two diagrams.

```
ON SCREEN:   ┌───┐ ┌──────┐ ┌────┐ ┌────────┐
             │ I │ │ paid │ │ $5 │ │ today. │
             └───┘ └──────┘ └─┬──┘ └────────┘
                              │  one screen token -> two spoken words
                              ▼
SPOKEN:       "I"   "paid"    "five dollars"   "today"
```
