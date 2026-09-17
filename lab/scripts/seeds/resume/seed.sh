#!/usr/bin/env bash
# resume: a ticket at every status a handoff can leave, each with a ## State
# and an open block, plus a loose file with a handoff beside it. For testing
# /flow:handoff, /flow:start and the pickup in every phase skill.
set -euo pipefail
flow() { node "$FLOW_JS" "$@" >/dev/null; }
folder() { ls -d "$PROJ"/.flow/tickets/"$1"-*; }
state() { cat >> "$(folder "$1")/ticket.md"; }

flow new "At groundwork, 2 questions walked" --type feature --label "at groundwork"
flow groundwork t001
cat > "$(folder t001)/groundwork/map.md" <<'MD'
# At groundwork, 2 questions walked: groundwork

- [x] 0: Which file holds the setting?
- [x] 1: Read on start, or on every call?
- [ ] 2: What a missing file means

## 0: Which file holds the setting?

`config.json` beside the command. One file, read by `src/config.js` and nothing else.

## 1: Read on start, or on every call?

On every call. The file is small, and a long-running process that caches it would miss an edit.
MD
state t001 <<'MD'

## State

Now: questions 0 and 1 are settled and written. Question 2 is open: the user leans to "a missing file is an empty config", and has not said so.

```open
groundwork/map.md
src/config.js
```
MD

flow new "At planning, the plan half written" --type feature --label "at planning"
flow plan t002
cat > "$(folder t002)/plan.md" <<'MD'
# At planning, the plan half written: plan

## Now

`src/config.js` reads `config.json` and returns it parsed. Nothing validates it.

## Steps

1. [ ] **Validate the shape**: `src/config.js`
       Check: `node --test tests/config.test.js`
MD
state t002 <<'MD'

## State

Now: the plan has step 1 and needs step 2, the error message, before it is shown. The user has not seen it.

```open
plan.md
```
MD

flow new "At building, step 2 of 3" --type feature --label "at building"
flow plan t003
flow build t003
cat > "$(folder t003)/plan.md" <<'MD'
# At building, step 2 of 3: plan

## Now

`src/config.js` reads and validates. Nothing writes.

## Steps

1. [x] **The write**: `src/config.js`
       Check: `node --test tests/config.test.js`
2. [ ] **The `set` command**: `src/cli.js`
       Check: `node src/cli.js set name value && cat config.json`
3. [ ] **The README**: `README.md`
       Check: `set` appears in the example block
MD
state t003 <<'MD'

## State

Now: step 1 passes. Step 2 is half written: `cli.js` parses `set` and never calls the write.

Found: `config.json` is gitignored, so the check in step 2 leaves nothing behind.

```open
plan.md
src/cli.js:8-20   # where step 2 stopped
```
MD

flow new "At review, waiting on the user" --type chore --label "at review"
flow plan t004
flow build t004
flow review t004
state t004 <<'MD'

## State

Now: every step is checked and the suite passes. Waiting on the user's notes.

Found: the suite takes 4 seconds because `config.test.js` writes to disk 30 times. Still true after this ticket closes, so it goes to `docs/context/tests.md` before this section is deleted.

```open
plan.md
```
MD

flow new "Parked at building" --type feature --label "parked"
flow plan t005
flow build t005
flow park t005 --reason "waits on the config shape in t001"
state t005 <<'MD'

## State

Now: step 1 of 2 passes. Step 2 reads the config shape, which t001 has not settled.

```open
plan.md
```
MD

flow new "Cut from the spec, never picked up" --type feature --label "from spec" --body - <<'MD'
# Cut from the spec, never picked up

`config get <name>` prints one value, and exits 1 with the name when it is missing.

## Done when

`node src/cli.js get name` prints the value, and `get nope` exits 1 printing `nope`.
MD

mkdir -p "$PROJ/notes"
cat > "$PROJ/notes/pricing.md" <<'MD'
# Pricing

3 tiers or 2. The draft below argues for 2.

## Draft

Free: 100 records. Paid: unlimited, one price. A middle tier splits the paid users without adding a reason to upgrade.
MD
cat > "$PROJ/notes/handoff.md" <<'MD'
# Handoff: pricing

First action: read the draft in `pricing.md` and write the counter-case for 3 tiers under it, 5 lines at most. The user asked for both cases side by side before deciding.

Now: the 2-tier case is written. The 3-tier case is not.

```open
pricing.md
```
MD
