# Swimlane Diagram Workflow

Create cross-functional diagrams showing WHO does WHAT in a process.

---

## When to Use

- Multiple participants (2-4 roles/teams/systems)
- Cross-functional handoffs between departments
- Clarifying responsibilities in a process
- Team workflows and SOPs

---

## Intelligent Process Analysis

**Before drawing lanes, THINK like a process analyst.**

### Step 1: Define Scope First

Ask yourself:
- Where does this process START? (The trigger event)
- Where does it END? (The deliverable or outcome)
- What is OUTSIDE the scope? (Adjacent processes to exclude)

**Scope statement format:** "This process covers [TRIGGER] through [OUTCOME], performed by [ACTORS]."

### Step 2: Identify Actors (Who Does What?)

Use these three questions for each step:
1. **Who gets the work next?** (The obvious handoff)
2. **How does it get there?** (Email? System? Meeting? Automatic?)
3. **Who *really* gets it next?** (Hidden actors: approvers, reviewers, systems)

**Common hidden actors to look for:**
- Approval systems (often automated)
- Notification systems
- Quality checks / reviewers
- Exception handlers
- Managers who need to sign off

### Step 3: Decide Lane Count

| Scenario | Recommended Lanes | Notes |
|----------|-------------------|-------|
| Simple handoff (2 parties) | 2 lanes | Or use process flow instead |
| Standard workflow | 3-5 lanes | Most common |
| Cross-departmental | 5-7 lanes | Maximum readable |
| More than 7 actors | Split diagrams | Create multiple swimlanes |

**Rule:** If you have 2 or fewer lanes, a swimlane is overkill. Use a simple process flow.

**Rule:** More than 7 lanes becomes visually cluttered. Split into sub-processes.

### Step 4: Map the Flow

For each step, determine:
- **WHO** owns this step (which lane)
- **WHAT** action is taken (verb + noun: "Review Application")
- **WHERE** it goes next (same lane or handoff)

**Handoff identification:**
- Every arrow that crosses a lane boundary is a handoff
- Handoffs are where delays, errors, and confusion happen
- Consider labeling cross-lane arrows ("Approved" / "Rejected")

### Step 5: Perspective Check

Before finalizing, verify:
- Is this ONE process, not multiple? (Don't mix unrelated workflows)
- Is the perspective consistent? (All from user view OR all from system view)
- Would a newcomer understand who does what?
- Are all actors actually needed? (Remove lanes with only 1 step if possible)

---

## Spacing & Complexity Guidelines

### Steps Per Lane

| Steps in Lane | Assessment |
|---------------|------------|
| 1-3 steps | Normal, readable |
| 4-5 steps | Getting complex |
| 6+ steps | Consider breaking into sub-process |

### Horizontal Spread

| Total Steps | Assessment |
|-------------|------------|
| 4-6 steps across | Readable on one screen |
| 7-8 steps across | Tight but workable |
| 9+ steps across | Split into phases or sub-diagrams |

### Parallel vs. Sequential

- **Same column, different lanes:** Steps happen simultaneously
- **Sequential columns:** Steps depend on each other
- If two steps in different lanes can happen at the same time → align vertically

---

## Process

### 1. Gather Information

Ask the user:
- What are the roles/participants? (2-4 recommended)
- What are the main steps in the process?
- Who is responsible for each step?
- Where are the handoffs between roles?

### 2. Plan the Layout

Describe the structure:
- "Title: [Process Name]"
- "Lanes (top to bottom): [Role 1], [Role 2], [Role 3]"
- "Flow: [Task A] → [Task B] → handoff to Role 2 → [Task C]..."

### 3. Confirm with User

> "Here's the swimlane layout. Does this capture the flow correctly?"

### 4. Generate Excalidraw

Use the JSON format from `references/json-format.md`.

---

## Layout Rules

### Canvas Setup
- Width: **2000-2400px total** (generous horizontal space)
- Height: 140px per lane + 80px header area

### Lane Structure

| Component | Width | Height |
|-----------|-------|--------|
| Lane header (sidebar) | 120px | 120px |
| Lane content area | remaining | 120px |
| Task boxes | 120px | 55px |
| **Gap between phases** | **100-120px** | - |

### Positioning

**Lane Y positions (120px per lane):**
- Lane 1: Y = 80 (after title)
- Lane 2: Y = 200 (80 + 120)
- Lane 3: Y = 320 (200 + 120)
- Lane 4: Y = 440 (320 + 120)

**Task X positions (250px spacing for breathing room):**
- Phase 1: X = 180
- Phase 2: X = 430
- Phase 3: X = 680
- Phase 4: X = 930
- Phase 5: X = 1180
- Phase 6: X = 1430
- Phase 7: X = 1680
- Phase 8: X = 1930

**Total width:** ~2100px (header 140px + 8 phases × 250px + margin)

---

## Color Scheme

### Lane Headers (solid, bold)

| Lane | Header Color | Background Tint |
|------|--------------|-----------------|
| 1 | `#9c27b0` purple | `#f3e5f5` |
| 2 | `#66bb6a` green | `#c8e6c9` |
| 3 | `#ff9800` orange | `#ffe0b2` |
| 4 | `#29b6f6` cyan | `#b3e5fc` |

Header text: `#ffffff` (white)

### Task Boxes

- Background: `#b3e5fc` (light cyan)
- Stroke: `#0288d1` (darker cyan)
- Text: `#1e1e1e` (near black)

### Arrows

- Same-lane: `#9e9e9e` (gray), solid
- Cross-lane: `#9e9e9e` (gray), solid

---

## Arrow Intelligence System (CRITICAL - READ COMPLETELY)

**This section teaches Claude HOW TO THINK about arrows, not just mechanics.**

### Phase 1: Analyze Flow Logic BEFORE Drawing

**Step 1: Create Activity Position Map**

Before ANY arrows, map every activity's position:

```
| Activity ID | Actor (Lane) | Phase (Column) | X Position | Y Position |
|-------------|--------------|----------------|------------|------------|
| task-c1 | Customer (Lane 1) | INQUIRY (Col 1) | 180 | 100 |
| task-o1 | Owner (Lane 2) | INQUIRY (Col 1) | 180 | 260 |
| task-c2 | Customer (Lane 1) | DISCOVERY (Col 2) | 380 | 100 |
```

**Step 2: Determine Arrow Relationships**

For EACH connection, answer:
1. **Source activity** → **Target activity**
2. **Same lane or different lane?**
3. **Same phase or different phase?**
4. **What is the LOGICAL direction?** (handoff down, response up, continuation right)

**Step 3: Classify Each Arrow**

| Classification | When | Edge Pattern |
|----------------|------|--------------|
| **HORIZONTAL** | Same lane, different phase | Right → Left |
| **VERTICAL DOWN** | Different lane (lower), same phase | Bottom → Top |
| **VERTICAL UP** | Different lane (higher), same phase | Top → Bottom |
| **L-SHAPE** | Different lane AND different phase | See routing rules |

---

### Phase 2: Edge Selection Rules

**The Golden Rule: Arrows should take the SHORTEST clean path.**

#### Horizontal Arrows (Same Lane)
- Source exits: **RIGHT edge** `[1, 0.5]`
- Target enters: **LEFT edge** `[0, 0.5]`
- Path: Straight horizontal line

#### Vertical Down Arrows (Handoff to lower lane, same column)
- Source exits: **BOTTOM edge** `[0.5, 1]`
- Target enters: **TOP edge** `[0.5, 0]`
- Path: Straight vertical line

#### Vertical Up Arrows (Response to higher lane, same column)
- Source exits: **TOP edge** `[0.5, 0]`
- Target enters: **BOTTOM edge** `[0.5, 1]`
- Path: Straight vertical line

#### L-Shape Arrows (Different lane AND different column)

**Decision Tree:**

```
Is target to the RIGHT of source?
├── YES: Is target BELOW source?
│   ├── YES → Route: DOWN first, then RIGHT
│   │         Start: BOTTOM [0.5, 1], End: LEFT [0, 0.5]
│   └── NO → Route: RIGHT first, then UP
│            Start: RIGHT [1, 0.5], End: BOTTOM [0.5, 1]
└── NO (target is LEFT): Is target BELOW source?
    ├── YES → Route: DOWN first, then LEFT
    │         Start: BOTTOM [0.5, 1], End: RIGHT [1, 0.5]
    └── NO → Route: LEFT first, then UP (rare - rework)
             Start: LEFT [0, 0.5], End: BOTTOM [0.5, 1]
```

---

### Phase 3: Elbow Arrow Mechanics

**All swimlane arrows use elbow routing (90-degree turns).**

#### Required Arrow Properties

```json
{
  "elbowed": true,
  "roundness": null,
  "lastCommittedPoint": null
}
```

#### Points Array Calculation

**Straight Horizontal:**
```json
"points": [[0, 0], [width, 0]]
```

**Straight Vertical:**
```json
"points": [[0, 0], [0, height]]
```

**L-Shape (2 segments = 3 points):**
```json
// Down-then-right: go down halfway, then right
"points": [[0, 0], [0, midY], [width, midY], [width, height]]

// Right-then-down: go right halfway, then down
"points": [[0, 0], [midX, 0], [midX, height], [width, height]]
```

**Calculating midpoint for L-shapes:**
- `midX = width / 2` (horizontal midpoint)
- `midY = height / 2` (vertical midpoint)

---

### Phase 4: Avoiding Arrow Collisions

**Problem:** Multiple arrows crossing the same space.

**Solutions:**

#### 1. Offset fixedPoint for parallel arrows

When 2+ arrows exit the same edge of a box, offset their positions:

| Arrow # | fixedPoint Offset |
|---------|-------------------|
| 1st arrow | `[0.5, 1]` (center) |
| 2nd arrow | `[0.3, 1]` (left of center) |
| 3rd arrow | `[0.7, 1]` (right of center) |

#### 2. Stagger L-shape midpoints

When multiple L-shapes cross:
- 1st arrow: midpoint at 40%
- 2nd arrow: midpoint at 60%

#### 3. Prefer vertical over diagonal

If you can route vertically within the same column, do that instead of an L-shape.

---

### Phase 5: Pre-Generation Checklist

**Before writing any arrow JSON, verify:**

- [ ] I know the source activity's exact position (x, y, width, height)
- [ ] I know the target activity's exact position
- [ ] I've determined: same lane or different lane?
- [ ] I've determined: same phase or different phase?
- [ ] I've selected the correct edge pattern (see Phase 2)
- [ ] I've calculated the arrow's starting x, y position
- [ ] I've calculated the points array for the path
- [ ] I've set `elbowed: true` and `roundness: null`
- [ ] Both shapes have this arrow in their `boundElements` array

---

### Complete Arrow Templates

#### Template 1: Horizontal (Same Lane, Next Phase)

```json
{
  "id": "arrow-horizontal",
  "type": "arrow",
  "x": 320,
  "y": 130,
  "width": 60,
  "height": 0,
  "strokeColor": "#868e96",
  "strokeWidth": 2,
  "strokeStyle": "solid",
  "roughness": 0,
  "opacity": 100,
  "groupIds": [],
  "frameId": null,
  "elbowed": true,
  "roundness": null,
  "boundElements": [],
  "points": [[0, 0], [60, 0]],
  "startBinding": {
    "elementId": "source-task",
    "fixedPoint": [1, 0.5],
    "focus": 0,
    "gap": 5
  },
  "endBinding": {
    "elementId": "target-task",
    "fixedPoint": [0, 0.5],
    "focus": 0,
    "gap": 5
  },
  "startArrowhead": null,
  "endArrowhead": "arrow",
  "lastCommittedPoint": null
}
```

#### Template 2: Vertical Down (Handoff to Lower Lane)

```json
{
  "id": "arrow-down",
  "type": "arrow",
  "x": 250,
  "y": 160,
  "width": 0,
  "height": 100,
  "strokeColor": "#868e96",
  "strokeWidth": 2,
  "strokeStyle": "solid",
  "roughness": 0,
  "opacity": 100,
  "groupIds": [],
  "frameId": null,
  "elbowed": true,
  "roundness": null,
  "boundElements": [],
  "points": [[0, 0], [0, 100]],
  "startBinding": {
    "elementId": "source-task",
    "fixedPoint": [0.5, 1],
    "focus": 0,
    "gap": 5
  },
  "endBinding": {
    "elementId": "target-task",
    "fixedPoint": [0.5, 0],
    "focus": 0,
    "gap": 5
  },
  "startArrowhead": null,
  "endArrowhead": "arrow",
  "lastCommittedPoint": null
}
```

#### Template 3: Vertical Up (Response to Higher Lane)

```json
{
  "id": "arrow-up",
  "type": "arrow",
  "x": 250,
  "y": 260,
  "width": 0,
  "height": -100,
  "strokeColor": "#868e96",
  "strokeWidth": 2,
  "strokeStyle": "solid",
  "roughness": 0,
  "opacity": 100,
  "groupIds": [],
  "frameId": null,
  "elbowed": true,
  "roundness": null,
  "boundElements": [],
  "points": [[0, 0], [0, -100]],
  "startBinding": {
    "elementId": "source-task",
    "fixedPoint": [0.5, 0],
    "focus": 0,
    "gap": 5
  },
  "endBinding": {
    "elementId": "target-task",
    "fixedPoint": [0.5, 1],
    "focus": 0,
    "gap": 5
  },
  "startArrowhead": null,
  "endArrowhead": "arrow",
  "lastCommittedPoint": null
}
```

#### Template 4: L-Shape Down-Right (Handoff to Lower Lane, Later Phase)

```json
{
  "id": "arrow-l-down-right",
  "type": "arrow",
  "x": 250,
  "y": 160,
  "width": 200,
  "height": 160,
  "strokeColor": "#868e96",
  "strokeWidth": 2,
  "strokeStyle": "solid",
  "roughness": 0,
  "opacity": 100,
  "groupIds": [],
  "frameId": null,
  "elbowed": true,
  "roundness": null,
  "boundElements": [],
  "points": [[0, 0], [0, 80], [200, 80], [200, 160]],
  "startBinding": {
    "elementId": "source-task",
    "fixedPoint": [0.5, 1],
    "focus": 0,
    "gap": 5
  },
  "endBinding": {
    "elementId": "target-task",
    "fixedPoint": [0.5, 0],
    "focus": 0,
    "gap": 5
  },
  "startArrowhead": null,
  "endArrowhead": "arrow",
  "lastCommittedPoint": null
}
```

#### Template 5: L-Shape Right-Up (Response to Higher Lane, Later Phase)

```json
{
  "id": "arrow-l-right-up",
  "type": "arrow",
  "x": 320,
  "y": 290,
  "width": 130,
  "height": -160,
  "strokeColor": "#868e96",
  "strokeWidth": 2,
  "strokeStyle": "solid",
  "roughness": 0,
  "opacity": 100,
  "groupIds": [],
  "frameId": null,
  "elbowed": true,
  "roundness": null,
  "boundElements": [],
  "points": [[0, 0], [65, 0], [65, -160], [130, -160]],
  "startBinding": {
    "elementId": "source-task",
    "fixedPoint": [1, 0.5],
    "focus": 0,
    "gap": 5
  },
  "endBinding": {
    "elementId": "target-task",
    "fixedPoint": [0, 0.5],
    "focus": 0,
    "gap": 5
  },
  "startArrowhead": null,
  "endArrowhead": "arrow",
  "lastCommittedPoint": null
}
```

---

### Quick Reference: fixedPoint Values

| Edge | fixedPoint | Use When |
|------|------------|----------|
| RIGHT center | `[1, 0.5]` | Horizontal flow to next phase |
| LEFT center | `[0, 0.5]` | Receiving horizontal flow |
| BOTTOM center | `[0.5, 1]` | Handoff down to lower lane |
| TOP center | `[0.5, 0]` | Receiving from upper lane |
| BOTTOM left | `[0.3, 1]` | Multiple arrows exiting bottom |
| BOTTOM right | `[0.7, 1]` | Multiple arrows exiting bottom |

---

### Common Mistakes to Avoid

1. ❌ **Connecting left-to-left or right-to-right** - Arrows should flow through, not bounce
2. ❌ **Using diagonal for cross-lane** - Always use vertical + L-shape, not diagonal
3. ❌ **Missing `elbowed: true`** - Without this, arrows curve instead of 90°
4. ❌ **Using `roundness: { "type": 2 }`** - Must be `null` for elbow arrows
5. ❌ **Forgetting bidirectional binding** - Both shapes must list the arrow
6. ❌ **Wrong edge for handoff** - Handoffs go BOTTOM→TOP, not RIGHT→LEFT

---

## Element Order (Important!)

Generate elements in this order:
1. Pool container (outer border)
2. Lane backgrounds (colored rectangles)
3. Lane separator lines
4. Lane header boxes
5. Lane header text (rotated 270°)
6. Task boxes with labels
7. Arrows (same-lane first, then cross-lane)

---

## Example

**Input:** "Customer submits form → Sales reviews → Sales approves → System sends email → Customer gets access"

**Parsing:**
- Actors: Customer, Sales, System
- Steps: 5 total
- Handoffs: Customer→Sales, Sales→System, System→Customer

**Layout:**
- Title: "CUSTOMER ONBOARDING"
- Lanes: Customer, Sales, System
- Flow: Submit Form → Review → Approve → Send Email → Get Access
- Handoffs: Customer→Sales (after submit), Sales→System (after approve), System→Customer (email triggers access)

---

## Output

Save as: `[process-name]-swimlane.excalidraw`

Example: `customer-onboarding-swimlane.excalidraw`
