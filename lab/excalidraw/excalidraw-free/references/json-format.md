# Excalidraw JSON Format Reference

This reference contains everything needed to generate valid `.excalidraw` files.

---

## Document Structure

Every `.excalidraw` file must have this structure:

```json
{
  "type": "excalidraw",
  "version": 2,
  "source": "https://excalidraw.com",
  "elements": [],
  "appState": { "gridSize": null, "viewBackgroundColor": "#ffffff" },
  "files": {}
}
```

---

## CRITICAL: Fields to OMIT

**Never include these fields** - they cause loading issues:

- `angle`
- `seed`
- `version`
- `versionNonce`
- `index`
- `isDeleted`
- `updated`
- `link`
- `locked`
- `autoResize`

**Note:** `elbowed` IS valid for arrows - see Arrow Elements section.

---

## Element Types

### Rectangle (Box/Shape)

```json
{
  "id": "shape-1",
  "type": "rectangle",
  "x": 100,
  "y": 100,
  "width": 150,
  "height": 60,
  "strokeColor": "#1e1e1e",
  "backgroundColor": "#a5d8ff",
  "fillStyle": "solid",
  "strokeWidth": 2,
  "strokeStyle": "solid",
  "roughness": 0,
  "opacity": 100,
  "groupIds": [],
  "frameId": null,
  "roundness": { "type": 3 },
  "boundElements": [
    { "id": "text-1", "type": "text" },
    { "id": "arrow-1", "type": "arrow" }
  ]
}
```

### Ellipse (Circle/Oval)

```json
{
  "id": "ellipse-1",
  "type": "ellipse",
  "x": 100,
  "y": 100,
  "width": 80,
  "height": 80,
  "strokeColor": "#1e1e1e",
  "backgroundColor": "#ffccbc",
  "fillStyle": "solid",
  "strokeWidth": 2,
  "strokeStyle": "solid",
  "roughness": 0,
  "opacity": 100,
  "groupIds": [],
  "frameId": null,
  "roundness": { "type": 2 },
  "boundElements": []
}
```

### Diamond (Decision Point)

```json
{
  "id": "diamond-1",
  "type": "diamond",
  "x": 100,
  "y": 100,
  "width": 80,
  "height": 80,
  "strokeColor": "#f9a825",
  "backgroundColor": "#fff9c4",
  "fillStyle": "solid",
  "strokeWidth": 2,
  "strokeStyle": "solid",
  "roughness": 0,
  "opacity": 100,
  "groupIds": [],
  "frameId": null,
  "roundness": { "type": 2 },
  "boundElements": []
}
```

---

## Text Elements

Text can be standalone or inside a shape (container).

### Text Inside a Shape (RECOMMENDED)

```json
{
  "id": "text-1",
  "type": "text",
  "x": 125,
  "y": 115,
  "width": 100,
  "height": 25,
  "text": "My Label",
  "fontSize": 16,
  "fontFamily": 1,
  "textAlign": "center",
  "verticalAlign": "middle",
  "strokeColor": "#1e1e1e",
  "backgroundColor": "transparent",
  "fillStyle": "solid",
  "strokeWidth": 1,
  "strokeStyle": "solid",
  "roughness": 0,
  "opacity": 100,
  "groupIds": [],
  "frameId": null,
  "roundness": null,
  "boundElements": [],
  "containerId": "shape-1",
  "originalText": "My Label",
  "lineHeight": 1.25
}
```

**CRITICAL:**
- `containerId` must reference the shape's ID
- The shape's `boundElements` must include this text: `{ "id": "text-1", "type": "text" }`

### Standalone Text

Same as above but with `"containerId": null`

### Font Families

| Value | Font |
|-------|------|
| 1 | Virgil (hand-drawn) |
| 2 | Helvetica |
| 3 | Cascadia (monospace) |

---

## Arrow Elements

### Elbow Arrow (RECOMMENDED)

Use elbow arrows for clean, professional diagrams. They route with 90-degree turns.

```json
{
  "id": "arrow-1",
  "type": "arrow",
  "x": 250,
  "y": 130,
  "width": 100,
  "height": 0,
  "strokeColor": "#1e1e1e",
  "backgroundColor": "transparent",
  "fillStyle": "solid",
  "strokeWidth": 2,
  "strokeStyle": "solid",
  "roughness": 0,
  "opacity": 100,
  "groupIds": [],
  "frameId": null,
  "roundness": null,
  "boundElements": [],
  "elbowed": true,
  "points": [[0, 0], [100, 0]],
  "startBinding": {
    "elementId": "shape-1",
    "fixedPoint": [1, 0.5],
    "focus": 0,
    "gap": 5
  },
  "endBinding": {
    "elementId": "shape-2",
    "fixedPoint": [0, 0.5],
    "focus": 0,
    "gap": 5
  },
  "startArrowhead": null,
  "endArrowhead": "arrow",
  "lastCommittedPoint": null
}
```

**CRITICAL for elbow arrows:**
- `elbowed`: **MUST be `true`** for 90-degree routing
- `roundness`: Set to `null` for elbow arrows (not `{ "type": 2 }`)
- `fixedPoint`: **REQUIRED** - Array `[x, y]` specifying exact edge position (see below)
- `gap`: Use 5 for stable binding
- `lastCommittedPoint`: Set to `null`
- `points`: Just start and end - Excalidraw calculates the elbow path

### fixedPoint Values (CRITICAL)

The `fixedPoint` array `[x, y]` controls which edge and position the arrow connects to:

| Edge | fixedPoint | Description |
|------|------------|-------------|
| Right edge, center | `[1, 0.5]` | Arrow exits/enters right side |
| Left edge, center | `[0, 0.5]` | Arrow exits/enters left side |
| Top edge, center | `[0.5, 0]` | Arrow exits/enters top |
| Bottom edge, center | `[0.5, 1]` | Arrow exits/enters bottom |
| Right edge, top | `[1, 0.25]` | Arrow at upper right |
| Right edge, bottom | `[1, 0.75]` | Arrow at lower right |

**Pattern:** `x` controls horizontal (0=left, 0.5=center, 1=right), `y` controls vertical (0=top, 0.5=middle, 1=bottom)

### Straight Arrow (Alternative)

For diagonal or direct connections:

```json
{
  "id": "arrow-2",
  "type": "arrow",
  "x": 250,
  "y": 130,
  "width": 100,
  "height": 50,
  "strokeColor": "#1e1e1e",
  "backgroundColor": "transparent",
  "fillStyle": "solid",
  "strokeWidth": 2,
  "strokeStyle": "solid",
  "roughness": 0,
  "opacity": 100,
  "groupIds": [],
  "frameId": null,
  "roundness": { "type": 2 },
  "boundElements": [],
  "points": [[0, 0], [100, 50]],
  "startBinding": {
    "elementId": "shape-1",
    "focus": 0,
    "gap": 8
  },
  "endBinding": {
    "elementId": "shape-2",
    "focus": 0,
    "gap": 8
  },
  "startArrowhead": null,
  "endArrowhead": "arrow"
}
```

### Arrowhead Options

| Value | Description |
|-------|-------------|
| `null` | No arrowhead |
| `"arrow"` | Standard arrow |
| `"dot"` | Circle/dot |
| `"bar"` | Perpendicular bar |
| `"triangle"` | Filled triangle |

---

## Decision Diamond Arrows (YES/NO Flows)

Diamonds typically have TWO outgoing arrows. Here's how to route them cleanly with `fixedPoint`:

### Diamond with YES (right) and NO (down) branches

```json
// YES arrow - exits RIGHT side of diamond
{
  "id": "arrow-yes",
  "type": "arrow",
  "x": 680,
  "y": 340,
  "width": 70,
  "height": 0,
  "elbowed": true,
  "roundness": null,
  "points": [[0, 0], [70, 0]],
  "startBinding": {
    "elementId": "diamond-1",
    "fixedPoint": [1, 0.5],
    "focus": 0,
    "gap": 5
  },
  "endBinding": {
    "elementId": "next-task",
    "fixedPoint": [0, 0.5],
    "focus": 0,
    "gap": 5
  },
  "startArrowhead": null,
  "endArrowhead": "arrow",
  "lastCommittedPoint": null
}

// NO arrow - exits BOTTOM of diamond
{
  "id": "arrow-no",
  "type": "arrow",
  "x": 640,
  "y": 380,
  "width": 0,
  "height": 60,
  "elbowed": true,
  "roundness": null,
  "points": [[0, 0], [0, 60]],
  "startBinding": {
    "elementId": "diamond-1",
    "fixedPoint": [0.5, 1],
    "focus": 0,
    "gap": 5
  },
  "endBinding": {
    "elementId": "fallback-task",
    "fixedPoint": [0.5, 0],
    "focus": 0,
    "gap": 5
  },
  "startArrowhead": null,
  "endArrowhead": "arrow",
  "lastCommittedPoint": null
}
```

**Key fixedPoint values for diamonds:**
- YES arrow: `startBinding.fixedPoint: [1, 0.5]` (exits right), `endBinding.fixedPoint: [0, 0.5]` (enters left)
- NO arrow: `startBinding.fixedPoint: [0.5, 1]` (exits bottom), `endBinding.fixedPoint: [0.5, 0]` (enters top)

### Adding YES/NO Labels

Create standalone text elements near each arrow:

```json
{
  "id": "label-yes",
  "type": "text",
  "x": 695,
  "y": 320,
  "text": "YES",
  "fontSize": 12,
  "containerId": null
}
```

---

## CRITICAL: Bidirectional Binding

**This is the #1 reason arrows don't connect in Claude-generated diagrams.**

Arrows must be bound in BOTH directions:

### Step 1: Arrow references the shapes

```json
{
  "id": "arrow-1",
  "startBinding": { "elementId": "shape-1", "focus": 0, "gap": 5 },
  "endBinding": { "elementId": "shape-2", "focus": 0, "gap": 5 }
}
```

### Step 2: BOTH shapes reference the arrow

```json
// shape-1 (source)
{
  "id": "shape-1",
  "boundElements": [
    { "id": "text-1", "type": "text" },
    { "id": "arrow-1", "type": "arrow" }
  ]
}

// shape-2 (target)
{
  "id": "shape-2",
  "boundElements": [
    { "id": "text-2", "type": "text" },
    { "id": "arrow-1", "type": "arrow" }
  ]
}
```

**If you miss either direction, the arrow won't connect properly when you move shapes.**

---

## Arrow Position Calculation

The arrow's `x` and `y` should be at the **edge** of the source shape, not the center.

### Horizontal Arrow (Left → Right)

```
Source: x=100, y=100, width=150, height=60
Target: x=350, y=100, width=150, height=60

Arrow:
  x = 100 + 150 = 250  (right edge of source)
  y = 100 + 30 = 130   (vertical center of source)
  width = 100          (gap to target: 350 - 250 = 100)
  height = 0           (horizontal arrow)
  points = [[0, 0], [100, 0]]
```

### Vertical Arrow (Top → Bottom)

```
Source: x=100, y=100, width=150, height=60
Target: x=100, y=250, width=150, height=60

Arrow:
  x = 100 + 75 = 175   (horizontal center)
  y = 100 + 60 = 160   (bottom edge of source)
  width = 0            (vertical arrow)
  height = 90          (gap to target: 250 - 160 = 90)
  points = [[0, 0], [0, 90]]
```

### Diagonal Arrow

```
Source: x=100, y=100, width=150, height=60
Target: x=350, y=250, width=150, height=60

Arrow:
  x = 250              (right edge of source)
  y = 130              (vertical center of source)
  width = 100          (horizontal distance)
  height = 120         (vertical distance)
  points = [[0, 0], [100, 120]]
```

---

## Binding Properties

| Property | Description |
|----------|-------------|
| `elementId` | ID of the connected shape |
| `fixedPoint` | **REQUIRED** - Array `[x, y]` specifying exact edge position |
| `focus` | Position along edge (-1 to 1, 0 = center) - secondary to fixedPoint |
| `gap` | Pixels between arrow and shape edge (use 5) |

### fixedPoint - The Key to Clean Arrows

**This is the #1 fix for messy arrows.** The `fixedPoint` array explicitly tells Excalidraw which edge and position to use.

**Common fixedPoint patterns:**

| Flow Direction | Start fixedPoint | End fixedPoint |
|----------------|------------------|----------------|
| Left → Right (horizontal) | `[1, 0.5]` | `[0, 0.5]` |
| Top → Bottom (vertical) | `[0.5, 1]` | `[0.5, 0]` |
| Diagonal down-right | `[1, 0.5]` | `[0, 0.5]` |
| Decision YES (right) | `[1, 0.5]` | `[0, 0.5]` |
| Decision NO (down) | `[0.5, 1]` | `[0.5, 0]` |

### Multiple Arrows from Same Shape

When multiple arrows exit the same edge, offset the `y` value:

| Arrow | fixedPoint | Position |
|-------|------------|----------|
| First arrow | `[1, 0.3]` | Upper right |
| Second arrow | `[1, 0.5]` | Center right |
| Third arrow | `[1, 0.7]` | Lower right |

### Best Practices for Clean Arrow Routing

1. **Always include `fixedPoint`** - This is required for predictable binding
2. **Use `gap: 5`** for elbow arrows
3. **Set `lastCommittedPoint: null`** for all arrows
4. **Match fixedPoint to flow direction** (see table above)
5. **Include `elbowed: true`** for 90-degree routing

---

## Roundness Types

| Element | Roundness |
|---------|-----------|
| Rectangle | `{ "type": 3 }` |
| Ellipse | `{ "type": 2 }` |
| Diamond | `{ "type": 2 }` |
| Arrow (straight) | `{ "type": 2 }` |
| Arrow (elbow) | `null` |

---

## Spacing Guidelines

| Element | Recommended |
|---------|-------------|
| Shape width | 120-180px |
| Shape height | 50-70px |
| Horizontal gap between shapes | 80-120px |
| Vertical gap between shapes | 80-120px |
| Arrow gap | 5px |

---

## Validation Checklist

Before outputting the `.excalidraw` file:

**Shapes & Text:**
- [ ] All forbidden fields omitted (angle, seed, version, versionNonce, index, isDeleted, updated, link, locked, autoResize)
- [ ] Every text has `containerId` pointing to its shape (if inside a shape)
- [ ] Every shape with text has that text in `boundElements`

**Arrows (CRITICAL):**
- [ ] Every arrow has `startBinding` and `endBinding`
- [ ] **Every binding has `fixedPoint` array** (e.g., `[1, 0.5]` for right edge)
- [ ] Every binding has `focus: 0` and `gap: 5`
- [ ] Source shape's `boundElements` includes the arrow
- [ ] Target shape's `boundElements` includes the arrow
- [ ] Arrow `x`, `y` positioned at edge of source shape
- [ ] Arrow `points` correctly calculated for distance
- [ ] Arrow `width` and `height` match the points array
- [ ] **Elbow arrows have `"elbowed": true` and `"roundness": null`**
- [ ] **All arrows have `"lastCommittedPoint": null`**

**fixedPoint Quick Reference:**
- Horizontal (left→right): start `[1, 0.5]`, end `[0, 0.5]`
- Vertical (top→down): start `[0.5, 1]`, end `[0.5, 0]`
- Multiple from same edge: offset y (0.3, 0.5, 0.7)
