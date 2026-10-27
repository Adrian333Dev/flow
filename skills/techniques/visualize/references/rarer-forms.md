# Rarer forms

## Timeline / parallel lanes

**When:** concurrency, scheduling, latency, duration: anything where *when*, *how long* or *overlap* is the idea.
**How:** time flows right; one lane per actor; a bar's width is its real duration; annotate the one thing to notice. An elbow from one bar's end to the next bar's start is a dependency. Draw a `today` line only in the gaps between bars, so it reads as a reference, never as data.
**Failure:** structural boxes inside a timeline, or 2 time scales in one picture. Structure and timing are 2 diagrams.

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

**When:** a data model: tables, entities, message shapes, anything with named fields.
**How:** one box per record, its name above a `├──┤` divider and its fields below, left-aligned; cardinality written at the end of the line it describes.
**Failure:** every field of every table. Show the keys and the fields the discussion is about.

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

**When:** 2 representations of one thing that must map onto each other: source and derived, text and time.
**How:** stack the two; vertical alignment *is* the mapping; mark only the interesting correspondence and let the boring 1:1 cases just line up.
**Failure:** 3 or more representations at once. Chain 2 diagrams.

```
ON SCREEN:   ┌───┐ ┌──────┐ ┌────┐ ┌────────┐
             │ I │ │ paid │ │ $5 │ │ today. │
             └───┘ └──────┘ └─┬──┘ └────────┘
                              │  one screen token -> two spoken words
                              ▼
SPOKEN:       "I"   "paid"    "five dollars"   "today"
```
