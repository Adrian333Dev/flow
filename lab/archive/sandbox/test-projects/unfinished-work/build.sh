#!/usr/bin/env bash
# unfinished-work: a ticket at every status a handoff can leave, each with a ## State
# and an open block, plus a loose file with a handoff beside it. For testing
# /flow:handoff, /flow:start and the pickup in every phase skill.
set -euo pipefail
flow() { node "$FLOW_JS" "$@" >/dev/null; }
folder() { ls -d "$PROJ"/.flow/tickets/"$1"-*; }
state() { cat >> "$(folder "$1")/ticket.md"; }

flow new "At groundwork, 2 questions walked" --type feature --label "at groundwork"
flow groundwork exp-1
cat > "$(folder exp-1)/groundwork/map.md" <<'MD'
# At groundwork, 2 questions walked: groundwork

- [x] 0: Which file holds the setting?
- [x] 1: Read on start, or on every call?
- [ ] 2: What a missing file means

## 0: Which file holds the setting?

`config.json` beside the command. One file, read by `src/config.js` and nothing else.

## 1: Read on start, or on every call?

On every call. The file is small, and a long-running process that caches it would miss an edit.
MD
state exp-1 <<'MD'

## State

Now: questions 0 and 1 are settled and written. Question 2 is open: the user leans to "a missing file is an empty config", and has not said so.

```open
groundwork/map.md
src/config.js
```
MD

flow new "At planning, the plan half written" --type feature --label "at planning"
flow plan exp-2
cat > "$(folder exp-2)/plan.md" <<'MD'
# At planning, the plan half written: plan

## Now

`src/config.js` reads `config.json` and returns it parsed. Nothing validates it.

## Steps

1. [ ] **Validate the shape**: `src/config.js`
       Check: `node --test tests/config.test.js`
MD
state exp-2 <<'MD'

## State

Now: the plan has step 1 and needs step 2, the error message, before it is shown. The user has not seen it.

```open
plan.md
```
MD

flow new "At building, step 2 of 3" --type feature --label "at building"
flow plan exp-3
flow build exp-3
cat > "$(folder exp-3)/plan.md" <<'MD'
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
state exp-3 <<'MD'

## State

Now: step 1 passes. Step 2 is half written: `cli.js` parses `set` and never calls the write.

Found: `config.json` is gitignored, so the check in step 2 leaves nothing behind.

```open
plan.md
src/cli.js:8-20   # where step 2 stopped
```
MD

flow new "At review, waiting on the user" --type chore --label "at review"
flow plan exp-4
flow build exp-4
flow review exp-4
state exp-4 <<'MD'

## State

Now: every step is checked and the suite passes. Waiting on the user's notes.

Found: the suite takes 4 seconds because `config.test.js` writes to disk 30 times. Still true after this ticket closes, so it goes to `docs/context/tests.md` before this section is deleted.

```open
plan.md
```
MD

flow new "Parked at building" --type feature --label "parked"
flow plan exp-5
flow build exp-5
flow park exp-5 --reason "waits on the config shape in exp-1"
state exp-5 <<'MD'

## State

Now: step 1 of 2 passes. Step 2 reads the config shape, which exp-1 has not settled.

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
