# Changelog

What changed in how Flow behaves, newest first. One entry per change: a rule added, removed or reversed, a mode added, a mechanism replaced. A rename, a path fix or a sweep over references is never an entry.

**An entry is numbered, and the number is the version.** They count up from 1, and the date in the heading says when the change landed. A machine keeps the number of the last entry it applied in `~/.flow/version`, and a migration on that machine is every entry above that number. There are no version numbers of the `1.4.2` sort: Flow is a clone you pull, not a package anyone installs.

**An entry that moves something on an installed machine names its guide**, `upgrades/12.md`. The entry stays short, because a user reads it. The guide holds every path that moves and how, because the session `flow up` opens reads that. `upgrades/README.md` holds the shape.

**Entry 2 waits for the first machine.** An entry is read by a machine that already has Flow and has fallen behind, and no machine has Flow yet.

## 1, 2026-09-20

Flow's first shipped state. A machine set up from here starts with everything built before this date, so nothing above it is written down as a change.
