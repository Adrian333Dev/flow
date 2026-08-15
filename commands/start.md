---
description: Pick up a ticket and plan it
argument-hint: <ticket-id>
---

!`flow start $1 && flow show $1`

Ticket `$1` is above, and now in `thinking`. Invoke the `execute` skill and start at Phase 1.

`flow` refused instead → say why and stop. It refuses what would break the ticket graph.
