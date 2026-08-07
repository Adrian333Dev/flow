# Workspace Feature — Design Spec
**Date:** 2026-07-10  
**Status:** Approved

---

## Overview

The Workspace feature transforms Handy's overlay from a transient recording indicator into a persistent, multi-buffer notepad driven by voice. Users maintain multiple named workspaces, dictate into them over time, edit manually between sessions, and paste the full content into a target application when ready.

This is an **opt-in mode**. Users who don't enable it experience zero change to existing behavior.

---

## Section 1: Core Behavior Model

### Workspace Mode Toggle
Workspace mode is a setting the user explicitly enables in Settings. When disabled, the app behaves exactly as today. When enabled:
- Auto-paste is off. Transcribed text goes into the active workspace instead of being immediately pasted.
- The workspace panel opens automatically whenever recording starts.
- The panel can also be opened independently via a dedicated shortcut (without starting recording).

### Shortcut System

| Shortcut | Context | Action |
|---|---|---|
| `Ctrl+Space` (default recording shortcut) | Panel closed | Start recording → open panel |
| `Ctrl+Space` | Panel open, recording active | Stop recording → keep panel open |
| `Ctrl+Space` | Panel open, not recording | Start recording again (appends to active workspace) |
| `Ctrl+Shift+Space` (new, configurable) | Panel closed | Open panel without recording |
| `Ctrl+Shift+Space` | Panel open, not recording | Close panel + paste entire active workspace text into last focused app |
| `Ctrl+Shift+Space` | Panel open, recording active | Stop recording + close panel + paste |
| `Escape` or `×` button | Panel open | Close panel **without** pasting (discard/cancel) |

> Both shortcuts are configurable in Settings like all other Handy shortcuts.

### Switching Workspaces During Recording
When the user switches to a different workspace while recording is active, recording **continues uninterrupted**. All subsequent transcription chunks route to the newly selected workspace. No restart required.

### After Paste
When the panel closes with paste (`Ctrl+Shift+Space`): the active workspace's **text is cleared**, but the workspace tab itself remains. The workspace is ready for the next task.

### Manual Editing
The content area is an editable textarea whenever recording is **not** actively streaming. During live streaming, it is read-only (the model is pushing chunks and edits would conflict). Editing is re-enabled as soon as streaming completes.

---

## Section 2: UI Layout

The workspace panel **extends the existing overlay window** — it is a larger state of the same Tauri window, not a new window. When workspace mode is off, the overlay behaves identically to today.

```
┌───────────┬──────────────────────────────────────────┐
│ GPT Chat  │ So the API should accept a JSON body     │
│ API Draft │ with three fields: model, messages, and  │
│ ● Email   │ an optional system prompt. The response  │
│           │ streams back as server-sent events...    │
│           │                                          │
│           │                                    [copy]│
│ ─────     ├──────────────────────────────────────────┤
│  [+]      │  ~~~waveform~~~              [x cancel]  │
└───────────┴──────────────────────────────────────────┘
```

**Left sidebar:**
- Narrow column listing workspace tabs.
- Active workspace highlighted with a dot indicator.
- Scrollable if many workspaces exist.
- `+` button at the bottom creates a new workspace (auto-named "Draft 1", "Draft 2", etc.). New workspaces are always inserted at the **top** of the list.
- Small `×` appears on hover over a tab to delete it.
- Double-click a tab name to rename it inline.

**Right content area:**
- Shows the full text of the active workspace.
- Editable `textarea` when not streaming; read-only during streaming.
- `[copy]` button in the top-right corner copies the text without pasting or closing the panel.

**Bottom bar:**
- The existing recording indicator (waveform + cancel button) sits unchanged at the bottom of the panel. This is always visible during a recording session.

**Workspace switching:**
- Click a tab in the sidebar to switch.
- `Ctrl+1` / `Ctrl+2` / `Ctrl+3` (etc.) switch by position.
- `Ctrl+Tab` / `Ctrl+Shift+Tab` cycle forward/backward.

---

## Section 3: Data Model & Backend

### Workspace Type
```typescript
type Workspace = {
  id: string          // UUID
  title: string       // "Draft 1", "GPT Chat", user-renamed
  text: string        // full current content
  created_at: number  // Unix timestamp
  updated_at: number  // Unix timestamp
  sort_order: number  // position in sidebar list
}
```

The `active_workspace_id` is stored as a key in the existing app settings (tauri-plugin-store).

### Storage
A new `workspaces` table is added to the existing `history.db` SQLite database via a migration, following the exact same pattern as `HistoryManager`. No new database file.

### WorkspaceManager (`src-tauri/src/managers/workspace.rs`)
A new manager following the `HistoryManager` pattern:

```rust
pub struct WorkspaceManager {
    app_handle: AppHandle,
    db_path: PathBuf,
}
```

Public methods:
- `get_all_workspaces() -> Result<Vec<Workspace>>`
- `create_workspace(title: Option<String>) -> Result<Workspace>` — auto-names if title is None
- `update_workspace_text(id: &str, text: &str) -> Result<Workspace>`
- `rename_workspace(id: &str, title: &str) -> Result<Workspace>`
- `delete_workspace(id: &str) -> Result<()>` — if deleting active workspace, auto-switch to next available
- `clear_workspace_text(id: &str) -> Result<()>` — called after paste

**Initialization guarantee:** On first run the manager auto-creates one workspace named "Draft 1". Deleting a workspace is blocked (command returns an error) if it is the last remaining one — the UI hides the delete button when only one workspace exists.

### New Tauri Commands (`src-tauri/src/commands/workspace.rs`)
- `get_workspaces()` → `Vec<Workspace>`
- `create_workspace(title: Option<String>)` → `Workspace`
- `update_workspace_text(id: String, text: String)` → `Workspace`
- `rename_workspace(id: String, title: String)` → `Workspace`
- `delete_workspace(id: String)` → `()`
- `set_active_workspace(id: String)` → `()`
- `get_active_workspace_id()` → `Option<String>`
- `clear_workspace_text(id: String)` → `()`

### New Event: `WorkspaceUpdatePayload`
Emitted by `WorkspaceManager` on every mutation. Frontend overlay listens and re-renders.

```rust
pub enum WorkspaceUpdatePayload {
    Created { workspace: Workspace },
    Updated { workspace: Workspace },
    Deleted { id: String },
    ActiveChanged { id: String },
}
```

### Hook into `actions.rs`
After transcription finishes, a new branch checks if workspace mode is enabled:
- **Workspace mode on:** append transcribed text to the active workspace via `WorkspaceManager::update_workspace_text`, emit `WorkspaceUpdatePayload::Updated`. Do **not** paste.
- **Workspace mode off:** existing paste behavior, unchanged.

Text chunks from successive recordings are appended to the workspace text separated by a single newline (`\n`). The paste itself (full workspace text → clipboard → active app) happens in a new `WorkspaceAction::deliver()` function triggered by the `workspace_toggle` shortcut when the panel is open.

---

## Section 4: Frontend Architecture

### New Components (`src/overlay/`)

**`WorkspacePanel.tsx`** — Root component for the workspace UI. Renders when workspace mode is enabled and panel is open. Contains:
- `WorkspaceSidebar.tsx` (left column)
- Content area with textarea
- Bottom recording bar (existing overlay elements reused as a sub-component)

**`WorkspaceSidebar.tsx`** — The tab list. Props: `workspaces`, `activeId`, `onSwitch`, `onCreate`, `onDelete`, `onRename`.

**`RecordingOverlay.tsx`** — Unchanged in interface. When workspace mode is off, renders as today. When on, its recording indicator elements are imported and used inside `WorkspacePanel` as the bottom bar.

### State Management in Overlay
The overlay is a separate Tauri window and cannot share the main settings Zustand store. Workspace state is managed with local `useState` inside `WorkspacePanel`:
- On mount: call `get_workspaces()` and `get_active_workspace_id()` to hydrate.
- Listen to `WorkspaceUpdatePayload` events to keep in sync.
- Autosave manual edits: debounced 500ms call to `update_workspace_text` on every keystroke in the textarea.

### New Shortcut Registration
A new binding `workspace_toggle` (default `Ctrl+Shift+Space`) is added to the shortcut system in `shortcut.rs` and `actions.rs`. A new `WorkspaceAction` struct implements `ShortcutAction`. Since this is a single-press toggle (not push-to-talk), only `start()` is used — `stop()` is a no-op. The `start()` handler reads current state and branches:

- Panel closed → open panel
- Panel open + not recording → paste full active workspace text + close panel
- Panel open + recording active → stop recording + paste + close panel

The binding appears in Settings under the shortcuts section so users can remap it.

### Dev Preview Shim
In `WorkspacePanel.tsx`, near the top of the component:

```typescript
const IS_BROWSER = !window.__TAURI_INTERNALS__;

// In useEffect:
if (IS_BROWSER) {
  setWorkspaces([
    { id: '1', title: 'GPT Chat', text: 'Mock content for workspace one...', ... },
    { id: '2', title: 'API Draft', text: '', ... },
    { id: '3', title: 'Email', text: 'Draft email text here.', ... },
  ]);
  setActiveId('1');
  setPanelOpen(true);
}
```

Run `bun run dev`, visit `http://localhost:1420/src/overlay/index.html` in a browser — full hot-reload UI iteration with no Tauri, no mic, no shortcut required.

---

## Implementation Phases

### Phase 1 — Backend Foundation
- `WorkspaceManager` with SQLite migrations
- All Tauri commands registered
- `WorkspaceUpdatePayload` event
- `actions.rs` hook (append to workspace instead of paste)
- `workspace_toggle` shortcut registered (open/close + paste)
- Workspace mode setting added

### Phase 2 — Overlay UI
- `WorkspacePanel.tsx` and `WorkspaceSidebar.tsx`
- Dev preview shim
- State hydration and event listening
- Textarea with autosave debounce
- Streaming read-only lock

### Phase 3 — Keyboard Navigation
- `Ctrl+1/2/3` workspace switching
- `Ctrl+Tab` / `Ctrl+Shift+Tab` cycling
- `Escape` to dismiss without paste

### Phase 4 — Settings Integration
- Workspace mode toggle in Settings
- `workspace_toggle` shortcut visible and remappable in Settings UI

### Phase 5 — Polish
- Rename on double-click
- Simple drag-to-reorder in the sidebar
- Delete confirmation (if workspace has content)
- Smooth open/close animation (panel grows from overlay pill size)
- Empty state for new workspaces ("Press your shortcut to start dictating")

---

## What Does NOT Change
- Audio capture pipeline
- VAD processing
- Whisper / Parakeet inference
- History saving (still happens alongside workspaces — they are independent)
- Settings system (only a new key is added)
- Model management
- All existing shortcuts and their behavior when workspace mode is off
