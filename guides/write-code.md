# Write code

## Structure

- **`follow-the-project-layout`** Put a new file where files like it already live: read the layout first. A layout the project already uses, and a file its framework fixes in place, win over this guide.
- **`group-by-feature`** Give each area of the code one folder, with its tests in a `tests/` folder inside it. A file a framework or a caller expects in place stays there and holds only the call into the feature. Grouped by kind, one change spreads across many folders.
- **`split-a-long-file`** Past about 500 lines, split a file along one idea. A suggestion, never a limit: a file that still reads in one pass stays whole.

## Code

- **`reuse-before-writing`** Search the project for a helper before writing one, then call it. A second copy drifts from the first.
- **`comment-only-why`** Comment only to give a reason, a finding or a trap. The code already says what it does.
