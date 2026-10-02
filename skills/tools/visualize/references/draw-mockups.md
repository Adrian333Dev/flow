# Drawing a screen

Every rule in `SKILL.md` binds here too.

## Mockups: the scale model

**A screen mockup models the real screen**, never a parts list.

- **Proportion is real.** The divider sits where it would actually sit.
- **Nesting carries hierarchy.** 2 depths of box, no legend needed.
- **Real strings, never placeholders.** `Playback speed`, not `<setting>`.
- **Draw the product's current layout**, not the one you remember.
- **Never invent a divider the real screen does not have.**
- **`youtube-page.md` is the case to measure against**: 150 columns, a 92-wide player at 16:9, sidebar and comments. Proportion and density at full page scale.
- **No "after" without a "before" the reader has seen.** Draw the current state, verified, first.

```
┌──────────────────────────────────────────────────────────┐
│  Settings                                           [x]  │
├───────────────────┬──────────────────────────────────────┤
│                   │                                      │
│  General          │   Playback speed                     │
│  Playback         │   [ 1.0x ]  [ 1.25x ]  [ 1.5x ]      │
│  Voices           │                                      │
│  ─────────────    │   Skip silence          (*) on       │
│  Developer        │                         ( ) off      │
│                   │                                      │
└───────────────────┴──────────────────────────────────────┘
```

## HTML previews

For colour, shade, density, elevation, type weight. Budget several internal rounds. One self-contained file in `tmp/`, opened from disk in a browser. **Not** the Artifact tool, **not** published, no server, no build step.

**Needs the running stack**: real components, real data at volume, motion → build a `/flow:prototype`.

**Never show one variant.** Show 2 or 3, same page, same content.

One file, ~200 lines, one round with the user:

- **Full-page realistic scale.** Not swatches, not isolated components.
- **Real content.** No lorem, no placeholder labels.
- **Design tokens as named CSS custom properties at the top**, each commented, plus a header comment listing the loud values being replaced.
- **One 9-line theme toggle**, not two files.
- **Static markup with trivial inline `onclick` class flips**: controls feel real without a framework.

## Overlay: a pane above a screen

**When:** something floats above a screen: a modal, a command palette, a dropdown.
**How:** draw the background screen whole and correct first, then clear the band of the pane the overlay covers and draw the overlay into it.
**Failure:** clearing a hole the overlay's own size, which strands the tails of the covered lines.

```
┌─ flow   skills/tools/visualize/SKILL.md ─────────────────────────────────────┐
│ ▼ skills              │   1  # Writing a context file                        │
│   ▼ tools             │   2                                                  │
│     ▼ visualize       │   3  Applies to every markdown an agent reads -      │
│       ► references    │   4  skills, CLAUDE.md, workflow docs - and to       │
│       ► scripts       │   5  prose written for the user.                     │
│         SKILL.md      │                                                      │
│   ► phases            │   ┌──────────────────────────────────────────────┐   │
│ ▼ references          │   │ >  visual                                    │   │
│     style.md          │   ├──────────────────────────────────────────────┤   │
│     workflow.md       │   │ ► visualize                   skill          │   │
│ ► scripts             │   │   visualize/SKILL.md          file           │   │
│ ► tmp                 │   │   visualize/references/             folder   │   │
│                       │   │   Visualize the hook flow     ticket t61     │   │
│                       │   └──────────────────────────────────────────────┘   │
│                       │                                                      │
│                       │  16  Steps first, in order, with the whole           │
│                       │  17  sequence visible before any detail.             │
│                       │  18                                                  │
├───────────────────────┴──────────────────────────────────────────────────────┤
│ ^P palette    ^B tree    ^/ search                  SKILL.md   5:1   md      │
└──────────────────────────────────────────────────────────────────────────────┘
```
