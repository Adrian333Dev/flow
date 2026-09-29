#!/usr/bin/env bash
# broken-board: a board built so that every refusal in flow has a ticket to hit,
# and flow check has faults to find. The commands that refuse are listed at
# the end, for typing by hand.
set -euo pipefail
flow() { node "$FLOW_JS" "$@" >/dev/null; }
folder() { ls -d "$PROJ"/.flow/tickets/"$1"-*; }

# Guard 2, open children: flow plan exp-1 refuses. Guard 3: flow done exp-1 refuses.
flow new "A parent with open children" --type feature --label "parent"
flow groundwork exp-1
flow new "First child, still open" --type feature --parent exp-1 --label "child one"
flow new "Second child, still open" --type chore --parent exp-1 --label "child two"

# Guard 1, unmet dependency: flow groundwork exp-5 refuses while exp-4 is todo.
flow new "The ticket exp-5 waits on" --type feature --label "blocker"
flow new "Blocked by a ticket nobody started" --type chore --deps exp-4 --label "blocked"

# A dropped blocker: exp-7 depends on exp-6. flow drop would drop exp-7 with it,
# so exp-6 is marked dropped by hand, which is the state flow check exists to find.
flow new "Dropped, and still depended on" --type feature --label "dropped"
flow new "Depends on the dropped one" --type feature --deps exp-6 --label "orphaned dep"
sed -i 's/^status: todo/status: dropped/' "$(folder exp-6)/ticket.md"

# Faults flow never writes, put in by hand, for flow check to find.
flow new "Names a dependency that does not exist" --type chore --label "dangling"
sed -i 's/^deps: .*/deps: [exp-99]/' "$(folder exp-8)/ticket.md"
grep -q '^deps:' "$(folder exp-8)/ticket.md" || sed -i '0,/^type:/s//deps: [exp-99]\ntype:/' "$(folder exp-8)/ticket.md"
flow new "Carries a status that is not one of the 8" --type feature --label "bad status"
sed -i 's/^status: .*/status: buildng/' "$(folder exp-9)/ticket.md"

cat > "$PROJ/GUARDS.md" <<'MD'
# What refuses here

Each line is a command that exits 1 on this board, with the guard that fires.

```sh
flow plan exp-1            # open children: exp-2 and exp-3
flow done exp-1            # done with open children
flow groundwork exp-5      # unmet dependency: exp-4 is todo
flow park exp-2            # reason required
flow check                # exp-7 depends on dropped exp-6, exp-8 names exp-99, exp-9 is buildng
```
MD
