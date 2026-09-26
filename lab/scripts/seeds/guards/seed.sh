#!/usr/bin/env bash
# guards: a board built so that every refusal in flow has a ticket to hit,
# and flow check has faults to find. The commands that refuse are listed at
# the end, for typing by hand.
set -euo pipefail
flow() { node "$FLOW_JS" "$@" >/dev/null; }
folder() { ls -d "$PROJ"/.flow/tickets/"$1"-*; }

# Guard 2, open children: flow plan t001 refuses. Guard 3: flow done t001 refuses.
flow new "A parent with open children" --type feature --label "parent"
flow groundwork t001
flow new "First child, still open" --type feature --parent t001 --label "child one"
flow new "Second child, still open" --type chore --parent t001 --label "child two"

# Guard 1, unmet dependency: flow groundwork t005 refuses while t004 is todo.
flow new "The ticket t005 waits on" --type feature --label "blocker"
flow new "Blocked by a ticket nobody started" --type chore --deps t004 --label "blocked"

# A dropped blocker: t007 depends on t006. flow drop would drop t007 with it,
# so t006 is marked dropped by hand, which is the state flow check exists to find.
flow new "Dropped, and still depended on" --type feature --label "dropped"
flow new "Depends on the dropped one" --type feature --deps t006 --label "orphaned dep"
sed -i 's/^status: todo/status: dropped/' "$(folder t006)/ticket.md"

# Faults flow never writes, put in by hand, for flow check to find.
flow new "Names a dependency that does not exist" --type chore --label "dangling"
sed -i 's/^deps: .*/deps: [t099]/' "$(folder t008)/ticket.md"
grep -q '^deps:' "$(folder t008)/ticket.md" || sed -i '0,/^type:/s//deps: [t099]\ntype:/' "$(folder t008)/ticket.md"
flow new "Carries a status that is not one of the 8" --type feature --label "bad status"
sed -i 's/^status: .*/status: buildng/' "$(folder t009)/ticket.md"

cat > "$PROJ/GUARDS.md" <<'MD'
# What refuses here

Each line is a command that exits 1 on this board, with the guard that fires.

```sh
flow plan t001            # open children: t002 and t003
flow done t001            # done with open children
flow groundwork t005      # unmet dependency: t004 is todo
flow park t002            # reason required
flow check                # t007 depends on dropped t006, t008 names t099, t009 is buildng
```
MD
