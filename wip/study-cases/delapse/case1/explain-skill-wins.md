# Explain-skill wins

Things the `explain` skill produced that worked unusually well. Counterpart to
`explain-skill-issues.md`. Append newest first. **Documentation only — no directives.** These are
records of what happened and what made it land, kept so the skill itself can be improved later.

---

## 2026-07-25 — ASCII "scale model" frames for a UI layout proposal

**Where:** the m28 admin/control-panel brainstorm. The task was to propose a page layout (left nav rail
+ content pane) after two earlier failures: proposing UI in prose (logged as Case 3 in
`shit-explanation.md`), and an ASCII frame whose borders drifted out of alignment (logged in
`explain-skill-issues.md`).

**What was produced:** two box-drawing frames — a full-page overview and a detail table — inside a
prose explanation. User reaction: "completely next level… absolutely great… it just makes visualizing
mockups much easier." Files: `temp/m28-wireframe.txt`.

The overview frame:

```
┌────────────────────────────────────────────────────────────────────────────────┐
│  DELAPSE - control panel                                                       │
├──────────────────────┬─────────────────────────────────────────────────────────┤
│                      │                                                         │
│  SETTINGS            │  Playback                                               │
│                      │  How a card interrupts the video.                       │
│  > Playback          │                                                         │
│    Panels            │  ┌───────────────────────────────────────────────────┐  │
│    Appearance        │  │                                                   │  │
│    Shortcuts         │  │  Auto-pause when a card appears            [x]    │  │
│                      │  │                                                   │  │
│  DEVELOPER           │  │  Pause timing                                     │  │
│                      │  │    (*) immediately    ( ) when the card is ready  │  │
│    Pipeline          │  │                                                   │  │
│    Faults            │  └───────────────────────────────────────────────────┘  │
│    Data              │                                                         │
│    Status            │  ┌───────────────────────────────────────────────────┐  │
│                      │  │                                                   │  │
│                      │  │  Resume when the card closes                      │  │
│                      │  │    (*) always          ( ) only if we paused      │  │
│                      │  │                                                   │  │
│                      │  └───────────────────────────────────────────────────┘  │
│                      │                                                         │
└──────────────────────┴─────────────────────────────────────────────────────────┘
```

### What made it work

1. **The frame is a scale model of the real screen, not a parts list.** The outer border is the page,
   one interior divider is the rail/pane seam, and its position carries the actual proportion — the
   rail is visibly narrow, the pane visibly wide. A reader gets density and balance, which is most of
   what "is this layout good?" means, and which no sentence delivers.

2. **Nested boxes at two depths carried hierarchy with no legend.** Page frame → setting cards inside
   the pane. Containment was read instantly; nothing had to be explained about it.

3. **Real content inside the boxes, not placeholders.** Actual section names (`Playback`, `Panels`,
   `Faults`), actual control labels (`Auto-pause when a card appears`), actual enum choices
   (`(*) immediately  ( ) when the card is ready`). Real strings are checkable and reviewable;
   `[toggle]` / `<setting>` are not, and also hide the fact that a label may not fit.

4. **Widget vocabulary restricted to pure ASCII.** `[x]` / `[ ]` for toggles, `(*)` / `( )` for radios,
   `>` for the active rail row, `v` for a dropdown caret. The prettier glyphs that were the first
   instinct — `●  ▌  ▸  ▾  ■  ━  ·` — are East-Asian-Ambiguous width and can render two columns wide,
   which silently shifts every column to their right and reproduces exactly the misalignment defect
   from the previous session. The frame characters themselves (`─ │ ┌ ┐ └ ┘ ├ ┤ ┬ ┴`) were kept because
   they are conventional and were already in use without trouble.

5. **Split into overview + detail instead of one dense picture.** The page frame answered one question
   ("what is the navigation model"), a second small table answered another ("what does the one
   redesigned section look like"). Neither needed a legend.

6. **An explicit statement of what the medium cannot carry.** The explanation said outright that ASCII
   conveys structure only — no color, shade, or density — so the palette decision stayed a named,
   separate step instead of being faked or silently skipped. The reader knew exactly which parts they
   were being asked to judge.

7. **Alignment was verified programmatically, not by eye.** Both frames were written to a temp file,
   then checked with `awk` for two properties: every line the same character length, and the same
   border character at each fixed column index from top to bottom. Because `awk` counts characters
   (not bytes) in a UTF-8 locale, this works directly on box-drawing output. This step — not more
   careful drafting — is what made the alignment actually correct instead of approximately correct.

### Cost observation (raised by the user)

It took roughly five internal rounds to reach the finished output: reading the workflow/override docs,
loading the skill, drafting, writing the temp file, and **two** verification passes — the first
verification used the wrong column indices (1-based vs 0-based confusion about where the divider sits),
reported false failures, and had to be re-run. Wall time and credit use were noticeably above a plain
prose reply.

The user's verdict: worth it, "no big deal," but recorded here because the same result should be
reachable in fewer rounds.
