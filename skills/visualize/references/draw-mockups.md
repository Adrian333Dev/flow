# Drawing a screen

Read when the artifact is a screen: a layout frame, a colour preview, or a pane floating over either. `SKILL.md` carries the character set, the connector and container conventions, and proportion — all of it binds here too.

## Mockups — the scale model

A screen mockup is a **model of the real screen**, not a parts list. That is where its value comes from and what the rules below protect.

- **Proportion is real.** The divider sits where it would actually sit. The reader gets density and balance, which is most of what "is this layout any good?" means and exactly what no sentence delivers.
- **Nesting carries hierarchy.** Two depths of box, no legend needed.
- **Real strings, never placeholders.** `Playback speed`, not `<setting>`. Real strings are checkable, reviewable, and they expose a label that doesn't fit.
- **Draw the product's current layout**, not the one you remember. Products move things, and the version in your memory is old.
- **Never invent a divider the real screen does not have.**
- **`youtube-page.md` is the case to measure against** — 150 columns, a 92-wide player at 16:9, sidebar and comments. Proportion and density at full page scale.
- **No "after" without a "before" the reader has seen.** Never ask someone to appreciate a fix to a layout that was never rendered. The current state gets its own verified frame first.

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

For colour, shade, density, elevation, type weight — the dimensions ASCII has no way to express. Budget several internal rounds — this one cannot happen in a minute, and rushing it produces a broken picture. One self-contained file in `tmp/`, opened from disk in a browser. **Not** the Artifact tool, **not** published, no server, no build step.

**Needs the running stack** — real components, real data at volume, motion → build a `/prototype`.

**Never show one variant.** A lone theme gets approved by default. Show two or three, same page, same content.

What makes it cheap — one file, ~200 lines, one round with the user:

- **Full-page realistic scale.** Not swatches, not isolated components. A swatch strip cannot tell you whether a *page* reads calm.
- **Real content.** No lorem, no placeholder labels. Same reason as the frames.
- **Design tokens as named CSS custom properties at the top**, each commented, plus a header comment listing the loud values being replaced. The file then doubles as what gets copied into the real stylesheet.
- **One nine-line theme toggle**, not two files.
- **Static markup with trivial inline `onclick` class flips** — controls feel real without a framework.

## Overlay — a pane above a screen

**When:** something floats above a screen — a modal, a command palette, a dropdown.
**How:** draw the background screen whole and correct first, then clear the band of the pane the overlay covers and draw the overlay into it.
**Failure:** clearing a hole the overlay's own size. The stranded tails of the covered lines read as damage.

```
┌─ flow   skills/visualize/SKILL.md ───────────────────────────────────────────┐
│ ▼ skills              │   1  # Writing a context file                        │
│   ▼ visualize         │   2                                                  │
│     ► refs            │   3  Applies to every markdown an agent reads -      │
│     ► scripts         │   4  skills, CLAUDE.md, workflow docs - and to       │
│       SKILL.md        │   5  prose written for the user.                     │
│   ► execute           │                                                      │
│ ▼ global              │   ┌──────────────────────────────────────────────┐   │
│   ▼ refs              │   │ >  visual                                    │   │
│       writing.md      │   ├──────────────────────────────────────────────┤   │
│       workflow.md     │   │ ► visualize                   skill          │   │
│   ► scripts           │   │   visualize/SKILL.md          file           │   │
│ ► wip                 │   │   visualize/references/             folder         │   │
│                       │   │   Visualize the hook flow     ticket t61     │   │
│                       │   └──────────────────────────────────────────────┘   │
│                       │                                                      │
│                       │  16  Steps first, in order, with the whole           │
│                       │  17  sequence visible before any detail.             │
│                       │  18                                                  │
├───────────────────────┴──────────────────────────────────────────────────────┤
│ ^P palette    ^B tree    ^/ search                writing.md   5:1   md      │
└──────────────────────────────────────────────────────────────────────────────┘
```
