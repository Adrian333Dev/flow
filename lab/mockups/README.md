# Mockups

Drawings made with `/flow:visualize` while designing Flow, kept as samples for the ASCII engine (`docs/spec/drawing.md` → `### The engine`). Nothing here is installed, tested or loaded. Each script builds its drawing row by row and checks every row's width, which is the engine's job by hand. Run one with `node lab/mockups/<file>.js`.

- **`board-frames.js`** writes `board-frames.txt`: 5 frames of the board docked beside the conversation at 151 columns. The frames are the tickets page with grouped lists and a tree, a ticket page, an action menu over marked rows, the insert key, and the session page with diffs. fw-16, 20.5.6 to 20.5.8.
- **`board-colours.js`** prints the board's pages in terminal colour, at 124 columns and at a narrow 83, without the conversation. The version the user approved on 2026-10-11.
- **`screens.js`** writes `screens.txt`: the band above the prompt, the meters row and the board pane, at several widths. fw-16, 20.5.2.
- **`q3-frames.js`** prints 2 frames of 100 columns, side by side panes for one design question.
- **`band-ladder.js`** prints the two-part ticket badge in the terminal, its progress part on a ladder of shades from dark to light. fw-16, 20.5.3.
- **`band-colours.html`** is round 8 of the badge's colour preview in a browser, drawn cell by cell as a terminal draws.
- **`draw-product.js`** prints the whole-product diagram of `docs/spec/product.md` on a 66 by 26 grid, with a check for anything drawn off the grid.
- **`rules-drawing.txt`** is a flow diagram of how a rule check runs: boxes, arrows with labels, and a return path.

Rebuilt 2026-10-11 from Claude Code's transcripts and file backups after `tmp/` scratch deletes, except `board-colours.js`, `band-colours.html` and `screens.txt`, which were never deleted. More finished drawings sit in `skills/tools/visualize/references/`.
