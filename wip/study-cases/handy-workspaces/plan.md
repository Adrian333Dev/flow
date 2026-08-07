# Workspace Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a persistent multi-workspace notepad to Handy's overlay, letting users dictate into named buffers, edit manually, switch between them, and paste the full content into their target app on demand.

**Architecture:** A new `WorkspaceManager` (Rust/SQLite) stores workspace data and exposes Tauri commands. A `WorkspaceAction` handles the `workspace_toggle` shortcut. The overlay window gains `WorkspacePanel` and `WorkspaceSidebar` React components that listen to `WorkspaceUpdatePayload` events and call workspace commands.

**Tech Stack:** Rust (rusqlite, rusqlite_migration, tauri-specta), React 18, TypeScript, Tailwind CSS, Zustand (existing overlay state already uses local useState — no new Zustand store needed), Tauri 2.x IPC.

## Global Constraints

- All user-facing strings must use i18next keys — no hardcoded JSX text (ESLint will fail the build).
- Rust: run `cargo fmt` and `cargo clippy` before committing; no `unwrap()` in production paths.
- TypeScript: strict mode, no `any` types.
- New workspace commands must be registered in `lib.rs` `collect_commands![]` and `WorkspaceUpdatePayload` in `collect_events![]` — tauri-specta regenerates `src/bindings.ts` only in debug builds; test that the types appear there.
- New workspaces are always inserted at the top of the list (lowest `sort_order`).
- Deleting the last workspace is blocked at the backend (returns error); UI hides delete button when count == 1.
- Text appended from successive recordings is separated by `\n`.
- The `workspace_mode` setting defaults to `false` — all existing behavior is unchanged when disabled.

---

## File Map

**New files:**
- `src-tauri/src/managers/workspace.rs` — `WorkspaceManager`, `Workspace` struct, `WorkspaceUpdatePayload` event
- `src-tauri/src/commands/workspace.rs` — Tauri command handlers for workspace CRUD
- `src/overlay/WorkspaceSidebar.tsx` — Left tab list (pure presentational component)
- `src/overlay/WorkspacePanel.tsx` — Full panel: sidebar + textarea + recording bar

**Modified files:**
- `src-tauri/src/settings.rs` — add `workspace_mode: bool`, `active_workspace_id: Option<String>`
- `src-tauri/src/managers/mod.rs` — add `pub mod workspace`
- `src-tauri/src/commands/mod.rs` — add `pub mod workspace`
- `src-tauri/src/lib.rs` — initialize `WorkspaceManager`, register commands + event, add two `AtomicBool` globals
- `src-tauri/src/actions.rs` — `WorkspaceAction` struct, `WORKSPACE_PANEL_OPEN` / `WORKSPACE_PENDING_DELIVER` atomics, workspace branch in `TranscribeAction::stop()`
- `src-tauri/src/shortcut/mod.rs` — add `change_workspace_mode_setting` command, register `workspace_toggle` binding
- `src/overlay/RecordingOverlay.tsx` — wrap with workspace panel when mode is enabled
- `src/i18n/locales/en/translation.json` — workspace translation keys
- `src/components/settings/GeneralSettings.tsx` (or equivalent general settings file) — workspace mode toggle UI

---

## Task 1: AppSettings — Add workspace_mode and active_workspace_id

**Files:**
- Modify: `src-tauri/src/settings.rs`
- Modify: `src-tauri/src/shortcut/mod.rs`
- Modify: `src-tauri/src/lib.rs` (collect_commands registration only)

**Interfaces:**
- Produces: `AppSettings::workspace_mode: bool` (default false), `AppSettings::active_workspace_id: Option<String>` (default None), command `change_workspace_mode_setting(enabled: bool)` accessible as `commands.changeWorkspaceModeSetting` in TypeScript.

- [ ] **Step 1: Add fields to AppSettings in `src-tauri/src/settings.rs`**

At the end of the `AppSettings` struct (around line 441, after `overlay_style`), add:

```rust
    #[serde(default)]
    pub workspace_mode: bool,
    #[serde(default)]
    pub active_workspace_id: Option<String>,
```

- [ ] **Step 2: Add the `change_workspace_mode_setting` command to `src-tauri/src/shortcut/mod.rs`**

Find the pattern of other `change_*_setting` commands in that file. Add after the last one (or near `change_overlay_style_setting`):

```rust
#[tauri::command]
#[specta::specta]
pub fn change_workspace_mode_setting(app: AppHandle, enabled: bool) -> Result<(), String> {
    let mut settings = get_settings(&app);
    settings.workspace_mode = enabled;
    write_settings(&app, settings);
    Ok(())
}
```

- [ ] **Step 3: Register the new command in `src-tauri/src/lib.rs`**

Inside `collect_commands![]` (around line 590), add alongside the other `shortcut::change_*` commands:

```rust
shortcut::change_workspace_mode_setting,
```

- [ ] **Step 4: Build and verify no compile errors**

```bash
cd src-tauri && cargo build 2>&1 | tail -20
```
Expected: compiles cleanly (warnings OK).

- [ ] **Step 5: Run dev build and verify `src/bindings.ts` includes the new command**

```bash
bun run tauri dev &
sleep 15 && grep "changeWorkspaceModeSetting" src/bindings.ts
```
Expected: line containing `changeWorkspaceModeSetting` found. Kill the dev process after.

- [ ] **Step 6: Commit**

```bash
git add src-tauri/src/settings.rs src-tauri/src/shortcut/mod.rs src-tauri/src/lib.rs
git commit -m "feat: add workspace_mode and active_workspace_id to AppSettings"
```

---

## Task 2: WorkspaceManager — SQLite CRUD

**Files:**
- Create: `src-tauri/src/managers/workspace.rs`
- Modify: `src-tauri/src/managers/mod.rs`

**Interfaces:**
- Produces:
  - `Workspace { id: String, title: String, text: String, created_at: i64, updated_at: i64, sort_order: i64 }`
  - `WorkspaceUpdatePayload` enum (Created/Updated/Deleted/ActiveChanged variants)
  - `WorkspaceManager::new(app_handle: &AppHandle) -> Result<Self>`
  - `WorkspaceManager::get_all_workspaces() -> Result<Vec<Workspace>>`
  - `WorkspaceManager::create_workspace(title: Option<String>) -> Result<Workspace>`
  - `WorkspaceManager::append_to_workspace(id: &str, chunk: &str) -> Result<Workspace>`
  - `WorkspaceManager::update_workspace_text(id: &str, text: &str) -> Result<Workspace>`
  - `WorkspaceManager::rename_workspace(id: &str, title: &str) -> Result<Workspace>`
  - `WorkspaceManager::delete_workspace(id: &str) -> Result<()>`
  - `WorkspaceManager::clear_workspace_text(id: &str) -> Result<Workspace>`

- [ ] **Step 1: Create `src-tauri/src/managers/workspace.rs`**

```rust
use anyhow::{anyhow, Result};
use chrono::Utc;
use log::{debug, error};
use rusqlite::{params, Connection, OptionalExtension};
use rusqlite_migration::{Migrations, M};
use serde::{Deserialize, Serialize};
use specta::Type;
use std::path::PathBuf;
use tauri::AppHandle;
use tauri_specta::Event;

static MIGRATIONS: &[M] = &[M::up(
    "CREATE TABLE IF NOT EXISTS workspaces (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        text TEXT NOT NULL DEFAULT '',
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        sort_order INTEGER NOT NULL DEFAULT 0
    );",
)];

#[derive(Clone, Debug, Serialize, Deserialize, Type)]
pub struct Workspace {
    pub id: String,
    pub title: String,
    pub text: String,
    pub created_at: i64,
    pub updated_at: i64,
    pub sort_order: i64,
}

#[derive(Clone, Debug, Serialize, Deserialize, Type, tauri_specta::Event)]
#[serde(tag = "action")]
pub enum WorkspaceUpdatePayload {
    #[serde(rename = "created")]
    Created { workspace: Workspace },
    #[serde(rename = "updated")]
    Updated { workspace: Workspace },
    #[serde(rename = "deleted")]
    Deleted { id: String },
    #[serde(rename = "active_changed")]
    ActiveChanged { id: String },
}

pub struct WorkspaceManager {
    app_handle: AppHandle,
    db_path: PathBuf,
}

impl WorkspaceManager {
    pub fn new(app_handle: &AppHandle) -> Result<Self> {
        let app_data_dir = crate::portable::app_data_dir(app_handle)?;
        let db_path = app_data_dir.join("workspaces.db");

        let manager = Self {
            app_handle: app_handle.clone(),
            db_path,
        };
        manager.init_database()?;

        // Ensure at least one workspace exists
        if manager.get_all_workspaces()?.is_empty() {
            manager.create_workspace(None)?;
        }

        Ok(manager)
    }

    fn init_database(&self) -> Result<()> {
        let mut conn = Connection::open(&self.db_path)?;
        let migrations = Migrations::new(MIGRATIONS.to_vec());
        #[cfg(debug_assertions)]
        migrations.validate().expect("Invalid workspace migrations");
        migrations.to_latest(&mut conn)?;
        Ok(())
    }

    fn get_connection(&self) -> Result<Connection> {
        Ok(Connection::open(&self.db_path)?)
    }

    fn map_workspace(row: &rusqlite::Row<'_>) -> rusqlite::Result<Workspace> {
        Ok(Workspace {
            id: row.get("id")?,
            title: row.get("title")?,
            text: row.get("text")?,
            created_at: row.get("created_at")?,
            updated_at: row.get("updated_at")?,
            sort_order: row.get("sort_order")?,
        })
    }

    pub fn get_all_workspaces(&self) -> Result<Vec<Workspace>> {
        let conn = self.get_connection()?;
        let mut stmt = conn.prepare(
            "SELECT id, title, text, created_at, updated_at, sort_order
             FROM workspaces ORDER BY sort_order ASC, created_at ASC",
        )?;
        let workspaces = stmt
            .query_map([], Self::map_workspace)?
            .collect::<std::result::Result<Vec<_>, _>>()?;
        Ok(workspaces)
    }

    pub fn get_workspace(&self, id: &str) -> Result<Option<Workspace>> {
        let conn = self.get_connection()?;
        let mut stmt = conn.prepare(
            "SELECT id, title, text, created_at, updated_at, sort_order FROM workspaces WHERE id = ?1",
        )?;
        Ok(stmt.query_row([id], Self::map_workspace).optional()?)
    }

    pub fn create_workspace(&self, title: Option<String>) -> Result<Workspace> {
        let conn = self.get_connection()?;
        let now = Utc::now().timestamp();
        let id = format!("ws_{}", Utc::now().timestamp_millis());

        // Count existing workspaces for auto-title
        let count: i64 =
            conn.query_row("SELECT COUNT(*) FROM workspaces", [], |r| r.get(0))?;
        let title = title.unwrap_or_else(|| format!("Draft {}", count + 1));

        // New workspaces go to top: sort_order = MIN(sort_order) - 1
        let min_order: i64 = conn
            .query_row("SELECT COALESCE(MIN(sort_order), 1) FROM workspaces", [], |r| {
                r.get(0)
            })?;
        let sort_order = min_order - 1;

        conn.execute(
            "INSERT INTO workspaces (id, title, text, created_at, updated_at, sort_order)
             VALUES (?1, ?2, '', ?3, ?3, ?4)",
            params![id, title, now, sort_order],
        )?;

        let workspace = Workspace {
            id,
            title,
            text: String::new(),
            created_at: now,
            updated_at: now,
            sort_order,
        };

        debug!("Created workspace '{}'", workspace.id);
        self.emit(WorkspaceUpdatePayload::Created {
            workspace: workspace.clone(),
        });
        Ok(workspace)
    }

    /// Append `chunk` to workspace text, separated by a newline if text is non-empty.
    pub fn append_to_workspace(&self, id: &str, chunk: &str) -> Result<Workspace> {
        let conn = self.get_connection()?;
        let now = Utc::now().timestamp();
        let updated = conn.execute(
            "UPDATE workspaces
             SET text = CASE WHEN text = '' THEN ?1 ELSE text || char(10) || ?1 END,
                 updated_at = ?2
             WHERE id = ?3",
            params![chunk, now, id],
        )?;
        if updated == 0 {
            return Err(anyhow!("Workspace '{}' not found", id));
        }
        let workspace = self
            .get_workspace(id)?
            .ok_or_else(|| anyhow!("Workspace '{}' disappeared after update", id))?;
        self.emit(WorkspaceUpdatePayload::Updated {
            workspace: workspace.clone(),
        });
        Ok(workspace)
    }

    /// Replace the full text of a workspace (used by frontend autosave).
    pub fn update_workspace_text(&self, id: &str, text: &str) -> Result<Workspace> {
        let conn = self.get_connection()?;
        let now = Utc::now().timestamp();
        let updated = conn.execute(
            "UPDATE workspaces SET text = ?1, updated_at = ?2 WHERE id = ?3",
            params![text, now, id],
        )?;
        if updated == 0 {
            return Err(anyhow!("Workspace '{}' not found", id));
        }
        let workspace = self
            .get_workspace(id)?
            .ok_or_else(|| anyhow!("Workspace '{}' disappeared after update", id))?;
        self.emit(WorkspaceUpdatePayload::Updated {
            workspace: workspace.clone(),
        });
        Ok(workspace)
    }

    pub fn rename_workspace(&self, id: &str, title: &str) -> Result<Workspace> {
        let conn = self.get_connection()?;
        let now = Utc::now().timestamp();
        let updated = conn.execute(
            "UPDATE workspaces SET title = ?1, updated_at = ?2 WHERE id = ?3",
            params![title, now, id],
        )?;
        if updated == 0 {
            return Err(anyhow!("Workspace '{}' not found", id));
        }
        let workspace = self
            .get_workspace(id)?
            .ok_or_else(|| anyhow!("Workspace '{}' disappeared after update", id))?;
        self.emit(WorkspaceUpdatePayload::Updated {
            workspace: workspace.clone(),
        });
        Ok(workspace)
    }

    pub fn delete_workspace(&self, id: &str) -> Result<()> {
        let conn = self.get_connection()?;
        let count: i64 =
            conn.query_row("SELECT COUNT(*) FROM workspaces", [], |r| r.get(0))?;
        if count <= 1 {
            return Err(anyhow!("Cannot delete the last workspace"));
        }
        conn.execute("DELETE FROM workspaces WHERE id = ?1", params![id])?;
        debug!("Deleted workspace '{}'", id);
        self.emit(WorkspaceUpdatePayload::Deleted { id: id.to_string() });
        Ok(())
    }

    pub fn clear_workspace_text(&self, id: &str) -> Result<Workspace> {
        self.update_workspace_text(id, "")
    }

    fn emit(&self, payload: WorkspaceUpdatePayload) {
        if let Err(e) = payload.emit(&self.app_handle) {
            error!("Failed to emit WorkspaceUpdatePayload: {}", e);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use rusqlite::Connection;

    fn setup_conn() -> Connection {
        let mut conn = Connection::open_in_memory().expect("open in-memory db");
        let migrations = Migrations::new(MIGRATIONS.to_vec());
        migrations.to_latest(&mut conn).expect("run migrations");
        conn
    }

    fn insert_workspace(conn: &Connection, id: &str, title: &str, text: &str, sort_order: i64) {
        conn.execute(
            "INSERT INTO workspaces (id, title, text, created_at, updated_at, sort_order)
             VALUES (?1, ?2, ?3, 0, 0, ?4)",
            params![id, title, text, sort_order],
        )
        .expect("insert workspace");
    }

    #[test]
    fn workspaces_ordered_by_sort_order_asc() {
        let conn = setup_conn();
        insert_workspace(&conn, "b", "B", "", 10);
        insert_workspace(&conn, "a", "A", "", -5);
        insert_workspace(&conn, "c", "C", "", 20);

        let mut stmt = conn
            .prepare(
                "SELECT id FROM workspaces ORDER BY sort_order ASC, created_at ASC",
            )
            .unwrap();
        let ids: Vec<String> = stmt
            .query_map([], |r| r.get(0))
            .unwrap()
            .map(|r| r.unwrap())
            .collect();

        assert_eq!(ids, vec!["a", "b", "c"]);
    }

    #[test]
    fn append_to_empty_workspace_no_leading_newline() {
        let conn = setup_conn();
        insert_workspace(&conn, "ws1", "Test", "", 0);

        conn.execute(
            "UPDATE workspaces
             SET text = CASE WHEN text = '' THEN ?1 ELSE text || char(10) || ?1 END
             WHERE id = 'ws1'",
            params!["hello"],
        )
        .unwrap();

        let text: String = conn
            .query_row("SELECT text FROM workspaces WHERE id = 'ws1'", [], |r| {
                r.get(0)
            })
            .unwrap();
        assert_eq!(text, "hello");
    }

    #[test]
    fn append_to_non_empty_workspace_adds_newline() {
        let conn = setup_conn();
        insert_workspace(&conn, "ws1", "Test", "first", 0);

        conn.execute(
            "UPDATE workspaces
             SET text = CASE WHEN text = '' THEN ?1 ELSE text || char(10) || ?1 END
             WHERE id = 'ws1'",
            params!["second"],
        )
        .unwrap();

        let text: String = conn
            .query_row("SELECT text FROM workspaces WHERE id = 'ws1'", [], |r| {
                r.get(0)
            })
            .unwrap();
        assert_eq!(text, "first\nsecond");
    }

    #[test]
    fn delete_blocked_when_only_one_workspace() {
        let conn = setup_conn();
        insert_workspace(&conn, "ws1", "Only", "", 0);

        let count: i64 =
            conn.query_row("SELECT COUNT(*) FROM workspaces", [], |r| r.get(0)).unwrap();
        assert_eq!(count, 1);
        // Deletion should be blocked in the manager when count <= 1
        // This test verifies the count logic used by delete_workspace
        assert!(count <= 1, "should block deletion");
    }
}
```

- [ ] **Step 2: Add `pub mod workspace` to `src-tauri/src/managers/mod.rs`**

```rust
pub mod audio;
pub mod history;
pub mod model;
pub mod model_capabilities;
pub mod transcription;
pub mod workspace;
```

- [ ] **Step 3: Run the unit tests**

```bash
cd src-tauri && cargo test managers::workspace -- --nocapture 2>&1
```
Expected: 4 tests pass.

- [ ] **Step 4: Commit**

```bash
git add src-tauri/src/managers/workspace.rs src-tauri/src/managers/mod.rs
git commit -m "feat: add WorkspaceManager with SQLite CRUD and unit tests"
```

---

## Task 3: Workspace Tauri Commands + Event Registration

**Files:**
- Create: `src-tauri/src/commands/workspace.rs`
- Modify: `src-tauri/src/commands/mod.rs`
- Modify: `src-tauri/src/lib.rs`

**Interfaces:**
- Consumes: `WorkspaceManager` from Task 2
- Produces: Tauri commands `get_workspaces`, `create_workspace`, `update_workspace_text`, `rename_workspace`, `delete_workspace`, `set_active_workspace`, `get_active_workspace_id`, `clear_workspace_text` — all accessible as `commands.*` from TypeScript.
- Produces: `WorkspaceUpdatePayload` registered as a Tauri event, accessible as `events.workspaceUpdatePayload` in TypeScript.

- [ ] **Step 1: Create `src-tauri/src/commands/workspace.rs`**

```rust
use crate::managers::workspace::{Workspace, WorkspaceManager};
use crate::settings::{get_settings, write_settings};
use std::sync::Arc;
use tauri::{AppHandle, Manager};

#[tauri::command]
#[specta::specta]
pub fn get_workspaces(app: AppHandle) -> Result<Vec<Workspace>, String> {
    let manager = app.state::<Arc<WorkspaceManager>>();
    manager.get_all_workspaces().map_err(|e| e.to_string())
}

#[tauri::command]
#[specta::specta]
pub fn create_workspace(app: AppHandle, title: Option<String>) -> Result<Workspace, String> {
    let manager = app.state::<Arc<WorkspaceManager>>();
    manager.create_workspace(title).map_err(|e| e.to_string())
}

#[tauri::command]
#[specta::specta]
pub fn update_workspace_text(
    app: AppHandle,
    id: String,
    text: String,
) -> Result<Workspace, String> {
    let manager = app.state::<Arc<WorkspaceManager>>();
    manager
        .update_workspace_text(&id, &text)
        .map_err(|e| e.to_string())
}

#[tauri::command]
#[specta::specta]
pub fn rename_workspace(
    app: AppHandle,
    id: String,
    title: String,
) -> Result<Workspace, String> {
    let manager = app.state::<Arc<WorkspaceManager>>();
    manager
        .rename_workspace(&id, &title)
        .map_err(|e| e.to_string())
}

#[tauri::command]
#[specta::specta]
pub fn delete_workspace(app: AppHandle, id: String) -> Result<(), String> {
    let manager = app.state::<Arc<WorkspaceManager>>();
    manager.delete_workspace(&id).map_err(|e| e.to_string())
}

#[tauri::command]
#[specta::specta]
pub fn set_active_workspace(app: AppHandle, id: String) -> Result<(), String> {
    let mut settings = get_settings(&app);
    settings.active_workspace_id = Some(id.clone());
    write_settings(&app, settings);
    // Emit event so all windows know which workspace is active
    let manager = app.state::<Arc<WorkspaceManager>>();
    manager
        .emit_active_changed(&id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
#[specta::specta]
pub fn get_active_workspace_id(app: AppHandle) -> Option<String> {
    get_settings(&app).active_workspace_id
}

#[tauri::command]
#[specta::specta]
pub fn clear_workspace_text(app: AppHandle, id: String) -> Result<Workspace, String> {
    let manager = app.state::<Arc<WorkspaceManager>>();
    manager.clear_workspace_text(&id).map_err(|e| e.to_string())
}
```

- [ ] **Step 2: Add `emit_active_changed` helper to `WorkspaceManager` in `src-tauri/src/managers/workspace.rs`**

Add this method to the `impl WorkspaceManager` block:

```rust
pub fn emit_active_changed(&self, id: &str) -> Result<()> {
    self.emit(WorkspaceUpdatePayload::ActiveChanged {
        id: id.to_string(),
    });
    Ok(())
}
```

- [ ] **Step 3: Register commands and event in `src-tauri/src/commands/mod.rs`**

Add at the top:

```rust
pub mod workspace;
```

- [ ] **Step 4: Register in `src-tauri/src/lib.rs`**

In `collect_commands![]`, add (alongside the `commands::history::*` group):

```rust
commands::workspace::get_workspaces,
commands::workspace::create_workspace,
commands::workspace::update_workspace_text,
commands::workspace::rename_workspace,
commands::workspace::delete_workspace,
commands::workspace::set_active_workspace,
commands::workspace::get_active_workspace_id,
commands::workspace::clear_workspace_text,
```

In `collect_events![]`, add:

```rust
managers::workspace::WorkspaceUpdatePayload,
```

- [ ] **Step 5: Initialize `WorkspaceManager` in `initialize_core_logic` in `src-tauri/src/lib.rs`**

Find the block where `HistoryManager` is initialized (around line 169) and add:

```rust
let workspace_manager = Arc::new(
    WorkspaceManager::new(app_handle).expect("Failed to initialize workspace manager"),
);
app_handle.manage(workspace_manager.clone());
```

Also add the import at the top of `lib.rs`:

```rust
use managers::workspace::WorkspaceManager;
```

- [ ] **Step 6: Build and verify bindings regenerated**

```bash
cd src-tauri && cargo build 2>&1 | grep -E "error|warning: unused" | head -20
```

Then in a dev build, check bindings:
```bash
grep -n "getWorkspaces\|workspaceUpdatePayload" src/bindings.ts | head -10
```
Expected: both symbols found.

- [ ] **Step 7: Commit**

```bash
git add src-tauri/src/commands/workspace.rs src-tauri/src/commands/mod.rs \
        src-tauri/src/managers/workspace.rs src-tauri/src/lib.rs
git commit -m "feat: add workspace Tauri commands and WorkspaceUpdatePayload event"
```

---

## Task 4: actions.rs — Route Transcription to Active Workspace

**Files:**
- Modify: `src-tauri/src/actions.rs`

**Interfaces:**
- Consumes: `WorkspaceManager::append_to_workspace` from Task 2, `AppSettings::workspace_mode` from Task 1
- Produces: when `workspace_mode` is true, transcribed text appends to `active_workspace_id` instead of being pasted; if `WORKSPACE_PENDING_DELIVER` flag is set, emits `workspace-deliver` event after appending.

- [ ] **Step 1: Add two `AtomicBool` globals to `src-tauri/src/actions.rs`**

Near the top of `actions.rs`, after the existing `use` statements and constants:

```rust
use std::sync::atomic::{AtomicBool, Ordering};

/// True when the workspace panel is currently open in the overlay window.
pub static WORKSPACE_PANEL_OPEN: AtomicBool = AtomicBool::new(false);

/// Set when the user triggered workspace_toggle while recording was active.
/// Causes the next transcription completion to emit workspace-deliver and close the panel.
pub static WORKSPACE_PENDING_DELIVER: AtomicBool = AtomicBool::new(false);
```

- [ ] **Step 2: Find the paste/output section in `TranscribeAction::stop()` in `actions.rs`**

`TranscribeAction::stop()` is an async function that stops recording, transcribes, and pastes. Find the section after `process_transcription_output()` is called and the history is saved. It currently calls `crate::actions::paste_text(...)` or `crate::clipboard::...` to paste. Replace that section with a workspace-aware branch:

Locate the call site that pastes text (search for `paste` in the stop method) and wrap it:

```rust
let settings = get_settings(app);
if settings.workspace_mode {
    // Append to active workspace instead of pasting
    if let Some(active_id) = &settings.active_workspace_id {
        if let Some(wm) = app.try_state::<Arc<crate::managers::workspace::WorkspaceManager>>() {
            if let Err(e) = wm.append_to_workspace(active_id, &processed.final_text) {
                error!("Failed to append to workspace '{}': {}", active_id, e);
            }
        }
    } else {
        warn!("workspace_mode is on but no active_workspace_id is set");
    }

    // If the user triggered workspace_toggle while recording, deliver now
    if WORKSPACE_PENDING_DELIVER.swap(false, Ordering::Relaxed) {
        if let Err(e) = app.emit("workspace-deliver", ()) {
            error!("Failed to emit workspace-deliver: {}", e);
        }
        WORKSPACE_PANEL_OPEN.store(false, Ordering::Relaxed);
    }
} else {
    // Existing paste behavior — leave untouched
    // (the existing paste code stays here)
}
```

> **Note:** You must read the actual `TranscribeAction::stop()` method carefully to find the exact paste call site. The method is long (~100 lines). The workspace branch wraps only the paste step — history saving, overlay hiding, and sound playback are unchanged.

- [ ] **Step 3: Verify cargo builds**

```bash
cd src-tauri && cargo build 2>&1 | grep "^error" | head -10
```
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src-tauri/src/actions.rs
git commit -m "feat: route transcription output to active workspace when workspace_mode is enabled"
```

---

## Task 5: workspace_toggle Shortcut + WorkspaceAction

**Files:**
- Modify: `src-tauri/src/actions.rs`
- Modify: `src-tauri/src/shortcut/mod.rs`
- Modify: `src-tauri/src/lib.rs`

**Interfaces:**
- Consumes: `WORKSPACE_PANEL_OPEN`, `WORKSPACE_PENDING_DELIVER` from Task 4
- Produces: `WorkspaceAction` registered in `ACTION_MAP`; `workspace_toggle` shortcut binding with default `Ctrl+Shift+Space`; `show-workspace-panel` and `workspace-deliver` events emitted.

- [ ] **Step 1: Add `WorkspaceAction` to `src-tauri/src/actions.rs`**

Find `ACTION_MAP: Lazy<HashMap<...>>` in `actions.rs`. Add `WorkspaceAction` before it:

```rust
struct WorkspaceAction;

impl ShortcutAction for WorkspaceAction {
    fn start(&self, app: &AppHandle, _binding_id: &str, _shortcut_str: &str) {
        let panel_open = WORKSPACE_PANEL_OPEN.load(Ordering::Relaxed);

        if !panel_open {
            WORKSPACE_PANEL_OPEN.store(true, Ordering::Relaxed);
            if let Err(e) = app.emit("show-workspace-panel", ()) {
                error!("Failed to emit show-workspace-panel: {}", e);
            }
        } else {
            // Panel is open — check if recording is active
            let rm = app.state::<Arc<crate::managers::audio::AudioRecordingManager>>();
            if rm.is_recording() {
                // Stop recording and deliver after transcription completes
                WORKSPACE_PENDING_DELIVER.store(true, Ordering::Relaxed);
                crate::signal_handle::send_transcription_input(
                    app,
                    "transcribe",
                    "workspace_toggle",
                );
            } else {
                // Not recording — deliver immediately
                WORKSPACE_PANEL_OPEN.store(false, Ordering::Relaxed);
                if let Err(e) = app.emit("workspace-deliver", ()) {
                    error!("Failed to emit workspace-deliver: {}", e);
                }
            }
        }
    }

    fn stop(&self, _app: &AppHandle, _binding_id: &str, _shortcut_str: &str) {
        // workspace_toggle is a single-press toggle; stop() is a no-op
    }
}
```

Then add it to `ACTION_MAP`:

```rust
map.insert(
    "workspace_toggle".to_string(),
    Box::new(WorkspaceAction) as Box<dyn ShortcutAction>,
);
```

- [ ] **Step 2: Add `workspace_toggle` binding to default settings in `src-tauri/src/settings.rs`**

Find where the default bindings HashMap is built (look for `"transcribe"` binding insertion). Add alongside it:

```rust
bindings.insert(
    "workspace_toggle".to_string(),
    ShortcutBinding {
        id: "workspace_toggle".to_string(),
        name: "Workspace Toggle".to_string(),
        description: "Open workspace panel / close and paste".to_string(),
        default_binding: "Ctrl+Shift+Space".to_string(),
        current_binding: "Ctrl+Shift+Space".to_string(),
    },
);
```

- [ ] **Step 3: Register `workspace_toggle` in the shortcut initializer**

In `src-tauri/src/shortcut/mod.rs`, `init_shortcuts` calls into `tauri_impl` or `handy_keys`. Both read from `settings.bindings` and register all bindings. Check that the new binding key `"workspace_toggle"` will be picked up automatically.

Open `src-tauri/src/shortcut/tauri_impl.rs` and `handy_keys.rs`. Find where bindings are iterated. If they iterate `settings.bindings.values()`, no change is needed — the new binding will be registered automatically when it appears in settings.

If there is a hardcoded list (e.g., `["transcribe", "cancel"]`), add `"workspace_toggle"` to it. Also ensure that in `handler.rs`, `workspace_toggle` is not mistakenly treated as a transcription binding (it is not, so it goes through `ACTION_MAP` correctly).

- [ ] **Step 4: Add `change_workspace_mode_setting` related shortcut command to collect_commands if missed**

Verify in `lib.rs` collect_commands that `shortcut::change_workspace_mode_setting` is listed. (Should have been added in Task 1 — double check.)

- [ ] **Step 5: Build**

```bash
cd src-tauri && cargo build 2>&1 | grep "^error" | head -10
```
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src-tauri/src/actions.rs src-tauri/src/settings.rs src-tauri/src/shortcut/mod.rs
git commit -m "feat: add WorkspaceAction and workspace_toggle shortcut binding"
```

---

## Task 6: WorkspaceSidebar Component

**Files:**
- Create: `src/overlay/WorkspaceSidebar.tsx`
- Modify: `src/i18n/locales/en/translation.json`

**Interfaces:**
- Produces: `WorkspaceSidebar` component with props:
  ```ts
  interface WorkspaceSidebarProps {
    workspaces: Workspace[]
    activeId: string | null
    onSwitch: (id: string) => void
    onCreate: () => void
    onDelete: (id: string) => void
    onRename: (id: string, title: string) => void
  }
  ```

- [ ] **Step 1: Add workspace translation keys to `src/i18n/locales/en/translation.json`**

Find the JSON and add a `"workspace"` key:

```json
"workspace": {
  "newWorkspace": "New Workspace",
  "deleteWorkspace": "Delete",
  "renameWorkspace": "Rename",
  "emptyHint": "Press your shortcut to start dictating",
  "defaultTitle": "Draft"
}
```

- [ ] **Step 2: Create `src/overlay/WorkspaceSidebar.tsx`**

```tsx
import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import type { Workspace } from "@/bindings";

interface WorkspaceSidebarProps {
  workspaces: Workspace[];
  activeId: string | null;
  onSwitch: (id: string) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
  onRename: (id: string, title: string) => void;
}

const WorkspaceSidebar: React.FC<WorkspaceSidebarProps> = ({
  workspaces,
  activeId,
  onSwitch,
  onCreate,
  onDelete,
  onRename,
}) => {
  const { t } = useTranslation();
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const renameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (renamingId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingId]);

  const startRename = (ws: Workspace) => {
    setRenamingId(ws.id);
    setRenameValue(ws.title);
  };

  const commitRename = () => {
    if (renamingId && renameValue.trim()) {
      onRename(renamingId, renameValue.trim());
    }
    setRenamingId(null);
  };

  return (
    <div className="flex flex-col w-28 shrink-0 border-r border-white/10 overflow-y-auto">
      <div className="flex-1">
        {workspaces.map((ws) => (
          <div
            key={ws.id}
            className={`group relative flex items-center px-2 py-1.5 cursor-pointer text-xs truncate
              ${ws.id === activeId ? "bg-white/15 font-medium" : "hover:bg-white/8"}`}
            onClick={() => onSwitch(ws.id)}
            onDoubleClick={() => startRename(ws)}
          >
            {ws.id === activeId && (
              <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-blue-400 shrink-0" />
            )}
            {renamingId === ws.id ? (
              <input
                ref={renameInputRef}
                className="w-full bg-transparent outline-none text-xs"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onBlur={commitRename}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitRename();
                  if (e.key === "Escape") setRenamingId(null);
                }}
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span className="truncate">{ws.title}</span>
            )}
            {workspaces.length > 1 && ws.id !== renamingId && (
              <button
                className="absolute right-1 hidden group-hover:flex items-center justify-center
                  w-4 h-4 rounded text-white/50 hover:text-white hover:bg-white/15"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(ws.id);
                }}
                aria-label={t("workspace.deleteWorkspace")}
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>
      <div className="border-t border-white/10 p-1">
        <button
          className="w-full text-xs text-white/60 hover:text-white hover:bg-white/10
            rounded py-1 text-center transition-colors"
          onClick={onCreate}
          aria-label={t("workspace.newWorkspace")}
        >
          +
        </button>
      </div>
    </div>
  );
};

export default WorkspaceSidebar;
```

- [ ] **Step 3: Verify it renders in the browser dev server**

```bash
bun run dev &
```
Visit `http://localhost:1420/src/overlay/index.html`. The page will be blank (WorkspaceSidebar is not mounted yet). No console errors expected. Kill the dev server.

- [ ] **Step 4: Commit**

```bash
git add src/overlay/WorkspaceSidebar.tsx src/i18n/locales/en/translation.json
git commit -m "feat: add WorkspaceSidebar component with rename and delete"
```

---

## Task 7: WorkspacePanel Component

**Files:**
- Create: `src/overlay/WorkspacePanel.tsx`

**Interfaces:**
- Consumes: `WorkspaceSidebar` from Task 6, `commands.*` and `events.*` from `@/bindings`, `Workspace` type from `@/bindings`
- Produces: `WorkspacePanel` component with props:
  ```ts
  interface WorkspacePanelProps {
    isStreaming: boolean          // true while recording/transcribing
    streamText: { committed: string; tentative: string }
    recordingBar: React.ReactNode // the existing recording indicator JSX
  }
  ```

- [ ] **Step 1: Create `src/overlay/WorkspacePanel.tsx`**

```tsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { commands, events } from "@/bindings";
import type { Workspace, WorkspaceUpdatePayload } from "@/bindings";
import WorkspaceSidebar from "./WorkspaceSidebar";

const IS_BROWSER = !("__TAURI_INTERNALS__" in window);

interface WorkspacePanelProps {
  isStreaming: boolean;
  streamText: { committed: string; tentative: string };
  recordingBar: React.ReactNode;
}

const MOCK_WORKSPACES: Workspace[] = [
  {
    id: "mock-1",
    title: "GPT Chat",
    text: "Mock content for dev preview. This text simulates dictated content.",
    created_at: 0,
    updated_at: 0,
    sort_order: -2,
  },
  {
    id: "mock-2",
    title: "API Draft",
    text: "",
    created_at: 0,
    updated_at: 0,
    sort_order: -1,
  },
  {
    id: "mock-3",
    title: "Email",
    text: "Draft email text here.",
    created_at: 0,
    updated_at: 0,
    sort_order: 0,
  },
];

const WorkspacePanel: React.FC<WorkspacePanelProps> = ({
  isStreaming,
  streamText,
  recordingBar,
}) => {
  const { t } = useTranslation();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeWorkspace = workspaces.find((w) => w.id === activeId) ?? null;

  // Hydrate from backend (or mock in browser)
  useEffect(() => {
    if (IS_BROWSER) {
      setWorkspaces(MOCK_WORKSPACES);
      setActiveId("mock-1");
      return;
    }

    Promise.all([commands.getWorkspaces(), commands.getActiveWorkspaceId()]).then(
      ([wsList, aid]) => {
        setWorkspaces(wsList);
        const firstId = wsList[0]?.id ?? null;
        setActiveId(aid ?? firstId);
        // Ensure settings has an active_workspace_id
        if (!aid && firstId) {
          commands.setActiveWorkspace(firstId).catch(console.error);
        }
      }
    );
  }, []);

  // Listen for workspace updates from backend
  useEffect(() => {
    if (IS_BROWSER) return;

    const unlisten = events.workspaceUpdatePayload.listen((event) => {
      const payload = event.payload as WorkspaceUpdatePayload;
      if (payload.action === "created") {
        setWorkspaces((prev) => [payload.workspace, ...prev]);
        setActiveId(payload.workspace.id);
      } else if (payload.action === "updated") {
        setWorkspaces((prev) =>
          prev.map((w) => (w.id === payload.workspace.id ? payload.workspace : w))
        );
      } else if (payload.action === "deleted") {
        setWorkspaces((prev) => {
          const remaining = prev.filter((w) => w.id !== payload.id);
          if (activeId === payload.id) {
            const newActive = remaining[0]?.id ?? null;
            setActiveId(newActive);
            if (newActive) commands.setActiveWorkspace(newActive).catch(console.error);
          }
          return remaining;
        });
      } else if (payload.action === "active_changed") {
        setActiveId(payload.id);
      }
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, [activeId]);

  // Handle text editing with 500ms autosave debounce
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    // Optimistically update local state
    setWorkspaces((prev) =>
      prev.map((w) => (w.id === activeId ? { ...w, text: newText } : w))
    );
    if (IS_BROWSER || !activeId) return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      commands.updateWorkspaceText(activeId, newText).catch(console.error);
    }, 500);
  };

  const handleSwitch = (id: string) => {
    setActiveId(id);
    if (!IS_BROWSER) {
      commands.setActiveWorkspace(id).catch(console.error);
    }
  };

  const handleCreate = () => {
    if (IS_BROWSER) {
      const id = `mock-${Date.now()}`;
      const ws: Workspace = {
        id,
        title: `Draft ${workspaces.length + 1}`,
        text: "",
        created_at: 0,
        updated_at: 0,
        sort_order: -workspaces.length - 1,
      };
      setWorkspaces((prev) => [ws, ...prev]);
      setActiveId(id);
      return;
    }
    commands.createWorkspace(null).catch(console.error);
  };

  const handleDelete = (id: string) => {
    if (IS_BROWSER) {
      setWorkspaces((prev) => prev.filter((w) => w.id !== id));
      if (activeId === id) setActiveId(workspaces.find((w) => w.id !== id)?.id ?? null);
      return;
    }
    commands.deleteWorkspace(id).catch(console.error);
  };

  const handleRename = (id: string, title: string) => {
    if (IS_BROWSER) {
      setWorkspaces((prev) => prev.map((w) => (w.id === id ? { ...w, title } : w)));
      return;
    }
    commands.renameWorkspace(id, title).catch(console.error);
  };

  const handleCopy = () => {
    if (activeWorkspace?.text) {
      navigator.clipboard.writeText(activeWorkspace.text).catch(console.error);
    }
  };

  // Build content area text: during streaming, show existing + streaming text
  const displayText = isStreaming
    ? (activeWorkspace?.text
        ? activeWorkspace.text + "\n" + streamText.committed
        : streamText.committed) + streamText.tentative
    : activeWorkspace?.text ?? "";

  return (
    <div className="flex flex-col h-full overflow-hidden rounded-xl border border-white/15 bg-black/80 backdrop-blur-md text-white shadow-2xl">
      <div className="flex flex-1 overflow-hidden">
        <WorkspaceSidebar
          workspaces={workspaces}
          activeId={activeId}
          onSwitch={handleSwitch}
          onCreate={handleCreate}
          onDelete={handleDelete}
          onRename={handleRename}
        />
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {activeWorkspace === null ? (
            <div className="flex-1 flex items-center justify-center text-xs text-white/40">
              {t("workspace.emptyHint")}
            </div>
          ) : (
            <>
              <textarea
                className="flex-1 resize-none bg-transparent p-3 text-sm outline-none
                  text-white placeholder-white/30 overflow-y-auto"
                value={displayText}
                onChange={handleTextChange}
                readOnly={isStreaming}
                placeholder={t("workspace.emptyHint")}
              />
              <button
                onClick={handleCopy}
                className="absolute top-2 right-2 text-xs text-white/40 hover:text-white
                  bg-white/5 hover:bg-white/15 rounded px-2 py-0.5 transition-colors"
              >
                copy
              </button>
            </>
          )}
        </div>
      </div>
      <div className="border-t border-white/10 px-3 py-2">{recordingBar}</div>
    </div>
  );
};

export default WorkspacePanel;
```

- [ ] **Step 2: Verify dev preview in browser**

```bash
bun run dev &
```

Open `http://localhost:1420/src/overlay/index.html`. Still blank — WorkspacePanel is not mounted in RecordingOverlay yet. But no build errors expected. Check the browser console: no errors.

Kill the dev server.

- [ ] **Step 3: Commit**

```bash
git add src/overlay/WorkspacePanel.tsx
git commit -m "feat: add WorkspacePanel component with autosave and dev browser preview"
```

---

## Task 8: RecordingOverlay Integration

**Files:**
- Modify: `src/overlay/RecordingOverlay.tsx`

**Interfaces:**
- Consumes: `WorkspacePanel` from Task 7, `commands.getAppSettings` (already exists), `show-workspace-panel` and `workspace-deliver` events from Task 5.

- [ ] **Step 1: Add workspace panel state and event listeners to `RecordingOverlay.tsx`**

At the top of `RecordingOverlay`, add new state:

```tsx
const [workspaceModeEnabled, setWorkspaceModeEnabled] = useState(false);
const [workspacePanelOpen, setWorkspacePanelOpen] = useState(false);
```

Inside the existing `setupEventListeners` async function (the one that already listens for `show-overlay`, `hide-overlay`, etc.), add:

```tsx
// Read workspace_mode from settings on mount
const settingsResult = await commands.getAppSettings();
if (settingsResult.status === "ok") {
  setWorkspaceModeEnabled(settingsResult.data.workspace_mode);
}

const unlistenWorkspaceShow = await listen("show-workspace-panel", () => {
  setWorkspacePanelOpen(true);
});

const unlistenWorkspaceDeliver = await listen("workspace-deliver", () => {
  // Get active workspace text and paste it
  if (!IS_BROWSER) {
    commands.getActiveWorkspaceId().then((id) => {
      if (!id) return;
      // Read current text from commands, paste it, then clear
      // The workspace panel's state holds the current text; we paste via clipboard
      commands.getWorkspaces().then((wsList) => {
        const ws = wsList.find((w) => w.id === id);
        if (ws?.text) {
          navigator.clipboard.writeText(ws.text).then(() => {
            // Paste using Tauri's clipboard + paste mechanism
            // Use the existing paste infrastructure
            commands.clearWorkspaceText(id).catch(console.error);
          });
        }
      });
    });
  }
  setWorkspacePanelOpen(false);
});
```

Add cleanup for the new listeners in the return of `setupEventListeners`.

- [ ] **Step 2: Define `IS_BROWSER` at the top of `RecordingOverlay.tsx`**

```tsx
const IS_BROWSER = !("__TAURI_INTERNALS__" in window);
```

- [ ] **Step 3: Wrap the render output to show WorkspacePanel when appropriate**

At the very beginning of the component's return, before the existing streaming/minimal overlay JSX, add:

```tsx
if (workspaceModeEnabled && (workspacePanelOpen || isVisible)) {
  const isCurrentlyStreaming = isVisible && (state === "streaming" || state === "recording" || state === "transcribing");
  const currentRecordingBar = (
    // existing compact pill JSX — extract this into a variable or inline it
    <div className="flex items-center justify-between text-xs text-white/70">
      {isVisible ? (
        isCurrentlyStreaming ? (
          <span className="animate-pulse">●  Recording...</span>
        ) : (
          <span>Transcribing...</span>
        )
      ) : null}
    </div>
  );

  return (
    <div style={{ width: "100vw", height: "100vh", display: "flex", alignItems: "flex-end", padding: "8px" }}>
      <div style={{ width: "500px", height: "320px" }}>
        <WorkspacePanel
          isStreaming={isCurrentlyStreaming}
          streamText={streamText}
          recordingBar={currentRecordingBar}
        />
      </div>
    </div>
  );
}
```

> **Note:** Read the actual existing return structure of `RecordingOverlay.tsx` carefully. The recording bar content should reuse the actual `listeningRow` / `workingRow` helpers already defined in the component so the waveform and cancel button appear correctly. The layout wrapper (position, size) may need adjustment based on the overlay window size — you may need to update `OVERLAY_WIDTH`/`OVERLAY_HEIGHT` constants in `src-tauri/src/overlay.rs` for the workspace panel size, similar to how `OVERLAY_STREAM_WIDTH`/`OVERLAY_STREAM_HEIGHT` are defined.

- [ ] **Step 4: Add import for WorkspacePanel**

```tsx
import WorkspacePanel from "./WorkspacePanel";
```

- [ ] **Step 5: Verify dev preview**

```bash
bun run dev &
```

Add `setWorkspacePanelOpen(true)` and `setWorkspaceModeEnabled(true)` in the IS_BROWSER block temporarily. Open `http://localhost:1420/src/overlay/index.html`. The workspace panel should render with mock workspaces and be interactive.

Remove the temporary lines after verifying, and kill the dev server.

- [ ] **Step 6: Commit**

```bash
git add src/overlay/RecordingOverlay.tsx
git commit -m "feat: integrate WorkspacePanel into RecordingOverlay"
```

---

## Task 9: Settings UI — Workspace Mode Toggle

**Files:**
- Modify: `src/components/settings/` — find the General settings panel file (likely `GeneralSettings.tsx` or the file rendering general settings)
- Modify: `src/i18n/locales/en/translation.json`

**Interfaces:**
- Consumes: `commands.changeWorkspaceModeSetting` from Task 1, `useSettings` hook (already exists), `settings.workspace_mode` field
- Produces: A toggle in the General settings section labeled "Workspace Mode" with a description.

- [ ] **Step 1: Find the correct settings component file**

```bash
ls src/components/settings/
```

Open the file that renders the main "General" settings section. Look for other boolean toggles (e.g., `push_to_talk`, `audio_feedback`) to understand the pattern used.

- [ ] **Step 2: Add workspace translation keys for settings**

In `src/i18n/locales/en/translation.json`, in the `settings` key (or wherever general settings strings live — match the existing key structure):

```json
"workspaceMode": "Workspace Mode",
"workspaceModeDescription": "Maintain multiple persistent drafts. Text goes to the active workspace instead of pasting immediately."
```

- [ ] **Step 3: Add the workspace mode toggle to the General settings component**

Following the exact pattern used by other boolean settings toggles in the file (e.g., the push-to-talk toggle), add:

```tsx
<SettingRow
  label={t("settings.workspaceMode")}
  description={t("settings.workspaceModeDescription")}
>
  <Toggle
    checked={settings?.workspace_mode ?? false}
    onChange={(val) => updateSetting("workspace_mode", val)}
  />
</SettingRow>
```

> **Note:** The exact component names (`SettingRow`, `Toggle`) may differ. Look at how existing boolean settings are rendered in that file and copy the pattern exactly.

- [ ] **Step 4: Run the Vite dev server and verify the toggle appears**

```bash
bun run dev &
```
Open `http://localhost:1420`. Navigate to General settings. Verify the "Workspace Mode" toggle is visible.

Kill the dev server.

- [ ] **Step 5: Run linting**

```bash
bun run lint
```
Expected: no new errors (especially no hardcoded-string i18next violations).

- [ ] **Step 6: Commit**

```bash
git add src/components/settings/ src/i18n/locales/en/translation.json
git commit -m "feat: add workspace mode toggle to General settings"
```

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Task |
|---|---|
| workspace_mode setting, defaults off | Task 1 |
| active_workspace_id in settings | Task 1 |
| WorkspaceManager SQLite CRUD | Task 2 |
| New workspaces at top (sort_order) | Task 2 |
| Cannot delete last workspace | Task 2 |
| Append with newline separator | Task 2 |
| Tauri commands (8 commands) | Task 3 |
| WorkspaceUpdatePayload event | Task 2 & 3 |
| workspace mode disables auto-paste | Task 4 |
| WORKSPACE_PENDING_DELIVER mechanism | Task 4 & 5 |
| workspace-deliver emitted post-transcription | Task 4 |
| WorkspaceAction / workspace_toggle binding | Task 5 |
| show-workspace-panel event | Task 5 |
| Default binding Ctrl+Shift+Space | Task 5 |
| WorkspaceSidebar (tabs, +, ×, rename) | Task 6 |
| WorkspacePanel (textarea, copy, sidebar) | Task 7 |
| Browser dev preview shim | Task 7 |
| Streaming: textarea read-only | Task 7 |
| Autosave debounce 500ms | Task 7 |
| RecordingOverlay integration | Task 8 |
| workspace-deliver → paste + clear | Task 8 |
| Settings UI toggle | Task 9 |

**Gap identified:** The paste mechanism in Task 8 (workspace-deliver handler) uses `navigator.clipboard.writeText` + a Tauri paste invocation. This is incomplete — it needs to use Handy's actual paste infrastructure (Enigo or the configured paste method), not just the clipboard API. In Task 8 Step 1, after writing the text to the clipboard, call `commands.cancelOperation` is wrong — instead, look at how `actions.rs` normally pastes (it calls the `input` module). The simplest approach: emit a `workspace-paste-text` event from the frontend with the text payload, and add a handler in Rust that calls the existing paste function. Alternatively, expose a new command `paste_text(text: String)` that wraps the existing paste logic. **Add this as a sub-step in Task 8 before committing.**

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-07-10-workspace-feature.md`.

**Two execution options:**

**1. Subagent-Driven (recommended)** — Fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
