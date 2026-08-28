# Process Flow Workflow

Create linear step-by-step diagrams showing how a process works.

---

## When to Use

- Sequential processes (A → B → C → D)
- Standard operating procedures (SOPs)
- Workflow documentation
- Simple decision flows

---

## Intelligent Flow Analysis

**Before drawing boxes, THINK like a process designer.**

### Step 1: Find the First Step

Ask: "What triggers this process to start?"

| Trigger Type | Example |
|--------------|---------|
| User action | "User submits form" |
| Time-based | "Every Monday at 9am" |
| Event-based | "When inventory drops below threshold" |
| Request | "Customer requests quote" |

**The first step is the trigger, not a precondition.**

### Step 2: Walk Through Sequentially

At each step, ask:
1. "What happens next?" → Add action box
2. "What if something goes wrong?" → Consider decision point
3. "Is there a choice here?" → Add decision diamond
4. "Does this repeat?" → Add loop back

**Stop when:** You reach a terminal state (process complete, error handled, handed off to another process)

### Step 3: Identify Decision Points

**Decision point indicators:**
- "If...then..."
- "Check whether..."
- "Validate..."
- "Approve/Reject"
- Any step with multiple possible outcomes

**Decision point rules:**
- Keep questions simple: Yes/No or True/False
- Be consistent: Yes always goes the same direction (recommend: down or right)
- Every branch must resolve (no dead ends)

### Step 4: Determine Granularity

**Ask: Who is the audience?**

| Audience | Granularity | Step Count |
|----------|-------------|------------|
| Executive/Overview | High-level | 4-6 steps |
| Manager/Process owner | Key decisions | 8-12 steps |
| Worker/Operator | Detailed | 15-20+ steps |
| Training material | Very detailed | Sub-processes |

**Rule:** If your diagram exceeds 12-15 steps on one page, consider:
- Breaking into sub-process diagrams
- Creating a hierarchy (overview → detail)

### Step 5: Handle Complexity

**When to split into sub-processes:**
- A single step represents 3+ actions
- A branch has its own complex logic
- Different people need different detail levels

**When to use parallel branches:**
- Steps can genuinely happen at the same time
- Order doesn't matter between branches
- Both must complete before proceeding

### Step 6: Resolve All Paths

Every decision point must have all paths resolved:
- "Yes" path → leads somewhere
- "No" path → leads somewhere (even if it's "End" or "Error")

**Common resolution patterns:**
- **Converge:** Multiple paths rejoin before continuing
- **Terminate:** Path ends (success or handled error)
- **Loop:** Path returns to earlier step
- **Escalate:** Path hands off to different process

---

## Spacing & Layout Guidelines

### Horizontal Steps

| Steps Per Row | Assessment |
|---------------|------------|
| 4-6 steps | Readable on one screen |
| 7-8 steps | Getting tight |
| 9+ steps | Wrap to next row or split diagram |

### Decision Point Spacing

- Allow room for both branches
- Typical layout: Yes → continue right/down, No → go down/right
- Keep branch labels visible ("Yes", "No", "Approved", "Rejected")

### Parallel Processing

- Align parallel steps vertically
- Show split point clearly
- Show merge point clearly
- Label if needed ("Both complete", "Any one")

### Loops

- Keep loop arrows from crossing other elements
- Label loop condition ("Until approved", "While items remain")
- Consider maximum iterations if relevant

---

## Process

### 1. Gather Information

Ask the user:
- What are the main steps? (4-8 recommended)
- What's the start and end point?
- Any decision points (yes/no branches)?
- Any parallel steps?

### 2. Plan the Layout

Describe the structure:
- "Steps: [Start] → [Step 1] → [Step 2] → [End]"
- "Decision point at [X]: Yes → [Action A], No → [Action B]"
- "Parallel tasks: [Task A] and [Task B] run simultaneously"

### 3. Confirm with User

> "Here's the process flow. Does this capture all the steps?"

### 4. Generate Excalidraw

Use the JSON format from `references/json-format.md`.

---

## Layout Rules

### Basic Spacing

| Element | Value |
|---------|-------|
| Step width | 140px |
| Step height | 60px |
| Horizontal gap | 80px |
| Vertical gap (for branches) | 100px |

### Positioning

**Horizontal layout (left to right):**
- Step 1: X = 100
- Step 2: X = 320 (100 + 140 + 80)
- Step 3: X = 540
- Step 4: X = 760
- Step 5: X = 980

**All steps on same row:** Y = 200

---

## Element Types

### Process Step (Rectangle)
```json
{
  "type": "rectangle",
  "width": 140,
  "height": 60,
  "backgroundColor": "#a5d8ff",
  "strokeColor": "#1971c2",
  "roundness": { "type": 3 }
}
```

### Start/End (Ellipse/Pill)
```json
{
  "type": "ellipse",
  "width": 100,
  "height": 50,
  "backgroundColor": "#b2f2bb",
  "strokeColor": "#2f9e44"
}
```

### Decision (Diamond)
```json
{
  "type": "diamond",
  "width": 80,
  "height": 80,
  "backgroundColor": "#fff3bf",
  "strokeColor": "#fab005"
}
```

---

## Color Scheme

| Element | Background | Stroke |
|---------|------------|--------|
| Start | `#b2f2bb` green | `#2f9e44` |
| Process step | `#a5d8ff` blue | `#1971c2` |
| Decision | `#fff3bf` yellow | `#fab005` |
| End | `#b2f2bb` green | `#2f9e44` |
| Error/Exception | `#ffc9c9` red | `#e03131` |

### Arrows
- Main flow: `#1e1e1e` (near black)
- Alternative path: `#868e96` (gray)

---

## Arrow Patterns (CRITICAL)

**All process flow arrows MUST include `fixedPoint` for clean routing:**
```json
{
  "elbowed": true,
  "roundness": null,
  "startArrowhead": null,
  "endArrowhead": "arrow",
  "lastCommittedPoint": null,
  "startBinding": {
    "elementId": "source-id",
    "fixedPoint": [1, 0.5],
    "focus": 0,
    "gap": 5
  },
  "endBinding": {
    "elementId": "target-id",
    "fixedPoint": [0, 0.5],
    "focus": 0,
    "gap": 5
  }
}
```

### fixedPoint Quick Reference

| Arrow Direction | Start fixedPoint | End fixedPoint |
|-----------------|------------------|----------------|
| Horizontal (→) | `[1, 0.5]` | `[0, 0.5]` |
| Vertical down (↓) | `[0.5, 1]` | `[0.5, 0]` |
| Decision YES (→) | `[1, 0.5]` | `[0, 0.5]` |
| Decision NO (↓) | `[0.5, 1]` | `[0.5, 0]` |
| Loop back (←) | `[0, 0.5]` | `[0, 0.5]` |

### Horizontal Arrow (→)

```json
{
  "id": "arrow-1",
  "type": "arrow",
  "x": 240,
  "y": 230,
  "width": 80,
  "height": 0,
  "elbowed": true,
  "roundness": null,
  "points": [[0, 0], [80, 0]],
  "startBinding": {
    "elementId": "step-1",
    "fixedPoint": [1, 0.5],
    "focus": 0,
    "gap": 5
  },
  "endBinding": {
    "elementId": "step-2",
    "fixedPoint": [0, 0.5],
    "focus": 0,
    "gap": 5
  },
  "startArrowhead": null,
  "endArrowhead": "arrow",
  "lastCommittedPoint": null
}
```

### Vertical Arrow Down (↓)

```json
{
  "id": "arrow-2",
  "type": "arrow",
  "x": 170,
  "y": 260,
  "width": 0,
  "height": 100,
  "elbowed": true,
  "roundness": null,
  "points": [[0, 0], [0, 100]],
  "startBinding": {
    "elementId": "decision-1",
    "fixedPoint": [0.5, 1],
    "focus": 0,
    "gap": 5
  },
  "endBinding": {
    "elementId": "error-step",
    "fixedPoint": [0.5, 0],
    "focus": 0,
    "gap": 5
  },
  "startArrowhead": null,
  "endArrowhead": "arrow",
  "lastCommittedPoint": null
}
```

### Decision Diamond Arrows (YES/NO)

**YES branch (exits right):**
```json
{
  "id": "arrow-yes",
  "type": "arrow",
  "x": 220,
  "y": 240,
  "width": 80,
  "height": 0,
  "elbowed": true,
  "roundness": null,
  "points": [[0, 0], [80, 0]],
  "startBinding": {
    "elementId": "decision-1",
    "fixedPoint": [1, 0.5],
    "focus": 0,
    "gap": 5
  },
  "endBinding": {
    "elementId": "next-step",
    "fixedPoint": [0, 0.5],
    "focus": 0,
    "gap": 5
  },
  "startArrowhead": null,
  "endArrowhead": "arrow",
  "lastCommittedPoint": null
}
```

**NO branch (exits bottom):**
```json
{
  "id": "arrow-no",
  "type": "arrow",
  "x": 180,
  "y": 280,
  "width": 0,
  "height": 60,
  "elbowed": true,
  "roundness": null,
  "points": [[0, 0], [0, 60]],
  "startBinding": {
    "elementId": "decision-1",
    "fixedPoint": [0.5, 1],
    "focus": 0,
    "gap": 5
  },
  "endBinding": {
    "elementId": "fallback-step",
    "fixedPoint": [0.5, 0],
    "focus": 0,
    "gap": 5
  },
  "startArrowhead": null,
  "endArrowhead": "arrow",
  "lastCommittedPoint": null
}
```

### Loop Back Arrow

```json
{
  "id": "arrow-loop",
  "type": "arrow",
  "x": 180,
  "y": 360,
  "width": -200,
  "height": -100,
  "elbowed": true,
  "roundness": null,
  "points": [[0, 0], [-100, 0], [-100, -100], [-200, -100]],
  "startBinding": {
    "elementId": "check-step",
    "fixedPoint": [0, 0.5],
    "focus": 0,
    "gap": 5
  },
  "endBinding": {
    "elementId": "process-step",
    "fixedPoint": [0, 0.5],
    "focus": 0,
    "gap": 5
  },
  "startArrowhead": null,
  "endArrowhead": "arrow",
  "lastCommittedPoint": null
}
```

### Bidirectional Binding Reminder

**Both source AND target must reference each arrow:**
```json
// Source shape
{
  "id": "step-1",
  "boundElements": [
    { "id": "text-1", "type": "text" },
    { "id": "arrow-1", "type": "arrow" }
  ]
}

// Target shape
{
  "id": "step-2",
  "boundElements": [
    { "id": "text-2", "type": "text" },
    { "id": "arrow-1", "type": "arrow" }
  ]
}
```

---

## Common Patterns

### Linear (4 steps)
```
[Start] ──► [Step 1] ──► [Step 2] ──► [End]
```

### With Decision
```
[Input] ──► <Valid?> ──Yes──► [Process] ──► [Output]
                │
               No
                │
                ▼
            [Error]
```

### Parallel Processing
```
           ┌──► [Task A] ──┐
[Start] ──►│               ├──► [Merge] ──► [End]
           └──► [Task B] ──┘
```

### Loop/Cycle
```
[Start] ──► [Process] ──► <Done?> ──Yes──► [End]
                ▲            │
                │           No
                │            │
                └────────────┘
```

---

## Example

**Input:** "User submits form, system validates, if valid process payment, else show error, then send confirmation"

**Layout:**
- Steps: Submit Form → Validate → (decision) → Send Confirmation
- Decision: Valid → Process Payment, Invalid → Show Error
- Both branches converge at Send Confirmation

---

## Output

Save as: `[process-name]-flow.excalidraw`

Example: `order-processing-flow.excalidraw`
