---
name: chrome-extension
description: Base architecture guide for Chrome MV3 extensions — three-world model (content script, service worker, main world), folder structure, cross-world communication via named clients, file naming, and entry point patterns. Read when building or extending any Chrome MV3 extension.
---

> For SPA hosts, also read `chrome-extension-spa.md`. For YouTube specifically, also read `chrome-extension-youtube.md`.

---

## The Core Mental Model: Three Worlds

Chrome MV3 extensions run in three isolated JavaScript contexts. Code in one context cannot call code in another directly — it must pass messages.

| World | Analogy | What it can do |
|---|---|---|
| **Content script** | Frontend client | DOM access, `chrome.storage`, `browser.runtime.sendMessage`, inject UI, `fetch` declared external hosts |
| **Service worker** | Backend server | `chrome.scripting.executeScript`, `chrome.tabs`, `chrome.commands`, all privileged Chrome APIs — short-lived (terminated and restarted by Chrome) |
| **Main world** | External data source | The host page's JS globals (`window`, page-owned variables) — read it, don't own it |

The content script is a **client**. It renders UI, reacts to user interactions, and asks the service worker when it needs a privileged API.

The service worker is a **lean dispatcher**. It owns privileged APIs. Keep it thin — unnecessary routing through it adds latency and a failure surface.

The main world is an **external data source**. Extract state from it; make zero product decisions inside it.

There is usually also a real backend (NestJS, Express, etc.) which the content script calls directly over HTTP — not through the service worker, since content scripts can `fetch` declared external hosts.

---

## Folder Structure

Name folders by **execution world**, not by technical role.

```
apps/extension/
  entrypoints/                    ← WXT wiring only; thin
    background.ts                 ← service worker entry
    [host].content.tsx            ← content script entry per host
    popup/                        ← browser action popup
    settings/                     ← options page
    workbench/                    ← dev testing page (unlisted)
  src/
    content-script/               ← runs in content script world
      [platform]/                 ← platform-specific adapter + ingestor
        __tests__/
      sw.client.ts                ← CS → SW boundary client
    service-worker/               ← runs in service worker world
      message.router.ts
      command.handler.ts
      mw.client.ts                ← SW → main world boundary client
      __tests__/
    main-world/                   ← functions injected into host page's JS context
      [platform].bridge.ts
    shared/                       ← used by both content-script and service-worker
      api.client.ts               ← typed caller for the backend
      env.ts
      logger.ts
      settings.ts
      utils.ts
      __tests__/
    ui/                           ← React components (content-script adjacent)
    dev/                          ← dev-only utilities (never in prod build path)
    styles/
```

### Why world-named folders

- `background/` — MV2 artifact. MV3 uses a service worker.
- `sources/`, `lib/` — opaque; require domain knowledge to interpret.
- `service-worker/`, `content-script/`, `main-world/` — self-documenting to any reader.

### Platform adapter boundary

Platform-specific code belongs inside its own subfolder. Nothing outside that folder should know which platform it's on:

```
content-script/
  [platform]/     ← all platform-specific code lives here
```

The rest of the app consumes generic types (`SourceEvent`, `SourceType`). Adding a new platform = add a new subfolder; nothing else changes.

---

## Cross-World Communication: Named Client Objects

A **named client object at each world boundary**, typed and named to signal exactly what boundary is being crossed.

### The three clients

| Client | File | Direction | Mechanism |
|---|---|---|---|
| `SwClient` | `content-script/sw.client.ts` | CS → SW | `browser.runtime.sendMessage` |
| `MwClient` | `service-worker/mw.client.ts` | SW → main world | `chrome.scripting.executeScript` |
| `ApiClient` | `shared/api.client.ts` | CS → backend | `fetch` over HTTP |

### Why named clients

**Raw `sendMessage` in business logic — invisible boundary:**
```typescript
// boundary is invisible — reader has no idea this leaves the content script
const resp = await browser.runtime.sendMessage({ type: 'read-page-state' });
```

**RPC proxy — boundary completely hidden:**
```typescript
// looks exactly like a local call; tried and reverted — makes the boundary invisible
const state = createRpcClient<PageStateService>('PageStateService');
await state.read();
```

**Named client — boundary is obvious:**
```typescript
// Sw prefix signals: this call leaves the content script
const pageState = await SwClient.readPageState();
```

### SwClient

`src/content-script/sw.client.ts`:

```typescript
// typed client for all content-script → service-worker calls
// CS cannot run executeScript or access chrome.tabs; those require SW privileges
export class SwClient {
  // asks SW to read host page state from the main world; returns null if SW unavailable
  static async readPageState(): Promise<HostPageState | null> {
    type Resp = { ok: boolean; data: HostPageState | null };
    const resp = await browser.runtime.sendMessage(
      { type: 'read-page-state' },
    ) as Resp | undefined;
    return resp?.ok ? resp.data : null;
  }
}
```

Rules:
- One class, all CS→SW methods. New SW operation = new method here.
- Static methods — clients are stateless callers.
- Message type string lives only here. Never repeat it elsewhere.
- Return `null` for "SW unavailable" — never throw. The SW can be killed at any moment.

### MwClient

`src/service-worker/mw.client.ts`:

```typescript
// typed client for all service-worker → main-world calls
// SW uses chrome.scripting.executeScript (unavailable to CS) to inject into the host page's JS context
export class MwClient {
  // injects readHostPageState into the tab's main world; retries on navigation
  static async readPageState(tabId: number): Promise<HostPageState | null> {
    for (let attempt = 0; attempt < 3; attempt++) {
      if (attempt > 0) await new Promise<void>((r) => setTimeout(r, 500));
      try {
        const [result] = await chrome.scripting.executeScript({
          target: { tabId }, world: 'MAIN', func: readHostPageState,
        });
        if (result?.result) return result.result as HostPageState;
      } catch { /* tab may have navigated mid-request; retry */ }
    }
    return null;
  }
}
```

Rules:
- `tabId` comes from `sender.tab?.id` in the message router — MwClient never looks it up itself.
- Retry logic belongs here, not in the router.
- Functions passed as `func:` are serialized by Chrome — they cannot close over imports. All logic must be self-contained.

### ApiClient

Content scripts can call declared external hosts directly. Do not route API calls through the service worker — adds a round trip and a failure surface.

```typescript
// CS calls ApiClient directly — no SW hop needed
await ApiClient.registerSource(body);
```

---

## The Main World Bridge

`src/main-world/[platform].bridge.ts` — functions injected into the host page's JS context.

**Hard constraints:**

1. **Self-contained.** Cannot import anything at runtime. Chrome serializes the function body — `import` statements are not included. Use `import type` only.
2. **Read-only.** Extract page-owned state only. No UI, no LLM calls, no side effects, no product decisions.
3. **No routing logic.** Returns data; the caller decides what to do with it.

```typescript
// IMPORTANT: injected into main world via executeScript — cannot close over imports.
// All logic must be self-contained. Read-only; no side effects.
export function readHostPageState(): HostPageState | null {
  // reads globals from the host page's JS context
  // declare globals with `declare const` — do not import them
}
```

---

## The Message Router

`src/service-worker/message.router.ts` — maps incoming `browser.runtime.sendMessage` calls to handlers.

```typescript
// routes CS→SW messages to typed handlers
const SYNC_HANDLERS: Record<string, (msg: Msg) => void> = {
  'open-settings': handleOpenSettings,
};

const ASYNC_HANDLERS: Record<string, (msg: Msg, sender: Sender, sendResponse: Respond) => void> = {
  'read-page-state': handleReadPageState,
};

export function routeMessage(msg: Msg, sender: Sender, sendResponse: Respond): boolean | undefined {
  if (!msg.type) return;
  const sync = SYNC_HANDLERS[msg.type];
  if (sync) { sync(msg); return; }
  const async = ASYNC_HANDLERS[msg.type];
  if (async) { async(msg, sender, sendResponse); return true; } // true = keep channel open
}
```

Rules:
- Sync handlers: fire-and-forget, return void.
- Async handlers: call `sendResponse` when done; `routeMessage` returns `true` to keep the channel open.
- Each handler is a named function — greppable, stacktrace-legible.
- Router dispatches only. No business logic here.

---

## Entry Points: Thin Orchestration

`entrypoints/` files are the table of contents, not the implementation.

### `background.ts`

```typescript
export default defineBackground({
  type: 'module',
  main() {
    browser.runtime.onMessage.addListener(routeMessage);
    browser.commands.onCommand.addListener(handleCommand);
  },
});
```

No business logic. Wires listeners and delegates immediately.

### `[host].content.tsx`

`main(ctx)` should be ~30 lines — a table of contents of named functions:

```typescript
async main(ctx) {
  const adapter = new PlatformAdapter();
  const state = createState();

  async function activate() {
    await mountUi(ctx, adapter, state);
    attachObservers(adapter, state);
  }

  function deactivate() {
    state.teardowns.forEach((fn) => fn());
    state.teardowns.length = 0;
  }
}
```

**Teardown list pattern** — every listener registered during `activate()` pushes its cleanup:

```typescript
interface CsState {
  readonly teardowns: Array<() => void>;
}

function cleanup(state: CsState, fn: () => void) {
  state.teardowns.push(fn);
}
```

`deactivate()` runs all of them. Prevents leaks on navigation without tracking each listener individually.

**`activate()` and `deactivate()` stay as closures** inside `main(ctx)` — they close over `ctx` (required by WXT's `createShadowRootUi`). Everything else is extracted to module-level named functions.

---

## File Naming

Use a dot suffix only when it names a universally recognized architectural role.

| Suffix | Meaning |
|---|---|
| `.client.ts` | Typed caller across a world boundary |
| `.adapter.ts` | Adapts an external API to an internal interface |
| `.provider.ts` | Concrete implementation of a provider interface |
| `.router.ts` | Routes messages/commands to handlers |
| `.handler.ts` | Handles a specific command type |
| `.bridge.ts` | Extracts data from an execution world we don't own |
| `.filter.ts` | Predicate/gate that accepts or rejects |
| `.selector.ts` | Picks from a set based on priority rules |
| `.types.ts` | Type declarations only |
| `.state.ts` | State shape + factory |
| `.config.ts` | Configuration constants |
| `.mock.ts` | Mock data for dev/test |

Files whose name already describes what they are without a role suffix stay hyphen-case: `video-ingestor.ts`, `caption-provider-chain.ts`.

---

## Classes vs Plain Objects

Export a class when the module is imported by other files:
- Boundary clients (`SwClient`, `MwClient`, `ApiClient`) — static methods
- Domain objects with state — instance methods
- Adapters, observers — instance methods

Plain `const` objects and loose exports are fine for pure utilities in `shared/utils.ts`.

---

## UI in Content Scripts

All injected UI lives inside a Shadow Root via WXT's `createShadowRootUi` with `cssInjectionMode: 'ui'`.

Rules:
- CSS tokens and variables defined on `:host` or a root wrapper inside the shadow tree — never on `:root`.
- No Radix-portal-heavy components (Dialog, Popover, Select, Dropdown) inside injected UI — portals render outside the shadow root and break style isolation.
- Set `z-index` defensively — the host page owns the stacking context.

---

## Service Worker Volatility

The SW is terminated by Chrome when idle and restarted on the next event.

- Never store state in SW module-level variables — lost between events.
- Persist everything in `chrome.storage` or the backend.
- The SW's `onMessage` listener runs from a cold start on every message — must be idempotent.
- Test termination deliberately: DevTools → Application → Service Workers → Stop, then trigger a hotkey. The extension must still work.

**Belongs in SW:** `chrome.scripting.executeScript`, `chrome.tabs.*`, `chrome.commands.onCommand`.

**Does not belong in SW:** API calls to your own backend, business logic, persistent state.

---

## Development Tools

```typescript
if (import.meta.env.DEV) {
  const { initDevConsole } = await import('../src/dev/dev.console');
  initDevConsole({ getState: () => adapter.getState() });
}
```

`__dx` namespace on `window` exposes dev utilities in the browser console.

---

## Full Call Path Example

```
Content Script
  └─ SwClient.readPageState()           [CS → SW via sendMessage]
       └─ message.router → handleReadPageState
            └─ MwClient.readPageState(tabId)   [SW → main world via executeScript]
                 └─ readHostPageState()         [runs in host page's JS context]
                      └─ returns HostPageState | null
```

At every step the boundary is explicit:
- `SwClient.*` → leaves content script
- `MwClient.*` → leaves service worker, enters host page
- `ApiClient.*` → leaves extension, calls backend over HTTP

---

## Checklist: Adding a New SW Operation

1. Add method to `SwClient` in `content-script/sw.client.ts`
2. Add handler function in `service-worker/message.router.ts`
3. Register in `SYNC_HANDLERS` or `ASYNC_HANDLERS`
4. If main world access needed: add method to `MwClient` + function to `main-world/[platform].bridge.ts`
5. Add inline comment at every `SwClient` call site — it looks local but isn't

## Checklist: Adding a New Platform

1. Create `entrypoints/[platform].content.tsx` with appropriate `matches`
2. Create `src/content-script/[platform]/` with platform adapter, navigation observer, ingestor
3. Add bridge functions to `src/main-world/[platform].bridge.ts`
4. `SwClient`, `MwClient`, `shared/`, `ui/` are untouched — they consume generic types

---

## What to Avoid

- **RPC proxy** — makes the boundary invisible
- **API calls routed through SW** — content scripts can `fetch` declared hosts directly
- **State in SW module scope** — terminated and restarted constantly
- **Single-file folders** — adds a navigation hop with no benefit
- **`background/`, `lib/`, `sources/` folder names** — opaque or MV2 artifacts
