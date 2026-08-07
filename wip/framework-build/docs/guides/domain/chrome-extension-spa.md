---
name: chrome-extension-spa
description: SPA host patterns for Chrome MV3 content scripts — navigation detection, two-signal pattern (URL change + data-ready event), activate/deactivate lifecycle, and teardown list. Extends chrome-extension.md; read that first. Read when the host page is a Single Page Application.
---

> Extends `chrome-extension.md`. Read that first.

---

## The SPA Navigation Problem

Normal browser navigation fires `load` events and creates a new document. SPAs don't. A user navigating from one video to another, one course to another, one article to another — the URL changes but the page JS context stays alive. Your content script stays alive too, with all its listeners still attached to the old state.

Two consequences:
1. You need to detect navigation yourself.
2. You need to tear down old state and activate fresh state on each navigation.

---

## Detecting Navigation

SPAs change the URL via `history.pushState` / `history.replaceState` — these don't fire `popstate`. Observe the URL with a `MutationObserver` on `document.title` (changes on every SPA navigation) or a `PerformanceObserver` on navigation entries, or poll `location.href` on a short interval.

```typescript
// polls for URL changes — SPA hosts never fire real browser navigation events
class NavigationObserver {
  private lastHref = location.href;
  private interval: ReturnType<typeof setInterval> | null = null;

  start(onNavigate: (href: string) => void): () => void {
    this.interval = setInterval(() => {
      if (location.href !== this.lastHref) {
        this.lastHref = location.href;
        onNavigate(location.href);
      }
    }, 500);
    return () => this.stop();
  }

  stop() {
    if (this.interval) clearInterval(this.interval);
    this.interval = null;
  }
}
```

URL change = navigation intent. It does not mean host page data is ready.

---

## Waiting for Host Page Data

URL change and data readiness are separate signals. The host SPA may fire a custom event when the new page's data is loaded into its JS context — check the host's event system:

```typescript
// host-specific data-ready signal — replace with the event the platform fires
document.addEventListener('[platform]-page-ready', (e) => {
  const detail = (e as CustomEvent<{ pageType?: string }>).detail;
  if (!isTargetPage(detail)) return;
  void ingestor.acquire(location.href);
});
```

If no such event exists, observe the DOM for a stable element that appears only after data loads (a title, a content container). Never rely on a fixed timeout.

**Two-signal pattern:**
- URL observer → navigation intent (activate/deactivate cycle)
- Data-ready event → safe to read host page state

---

## Activate / Deactivate Lifecycle

Each SPA navigation is a new session. Tear down completely on navigate-away; activate fresh on navigate-in.

```typescript
async main(ctx) {
  const observer = new NavigationObserver();
  const adapter = new PlatformAdapter();
  const state = createState();

  async function activate(href: string) {
    if (!isTargetUrl(href)) return;
    await mountUi(ctx, adapter, state);
    attachDataReadyListener(adapter, state);
    attachVideoListeners(adapter, state);
  }

  function deactivate() {
    state.teardowns.forEach((fn) => fn());
    state.teardowns.length = 0;
  }

  const stopObserver = observer.start((href) => {
    deactivate();
    void activate(href);
  });

  ctx.onInvalidated(stopObserver);
  await activate(location.href); // initial load
}
```

---

## Teardown List

Every listener registered during `activate()` registers its own cleanup:

```typescript
interface CsState {
  readonly teardowns: Array<() => void>;
}

function cleanup(state: CsState, fn: () => void) {
  state.teardowns.push(fn);
}

// usage inside activate()
const handler = () => ingestor.acquire(location.href);
document.addEventListener('[platform]-page-ready', handler);
cleanup(state, () => document.removeEventListener('[platform]-page-ready', handler));
```

`deactivate()` runs all teardowns in one pass. No need to track each listener individually.

---

## Session Lifecycle

A session = one target page visit. Define clearly when it starts and ends:

| Event | Session action |
|---|---|
| URL matches target pattern | Start session — activate |
| URL changes to non-target | End session — deactivate |
| URL changes to another target page | End old session → start new session |
| Tab closed | End session |
| Page unload | End session — `ctx.onInvalidated` |

Do not persist session-specific state across sessions in v1. Session state belongs in memory (or `chrome.storage.session`) — not `chrome.storage.local`.

---

## Service Worker Awareness of Navigation

The SW is stateless and short-lived — it cannot track which page the user is on. If SW operations depend on the current page's URL or tab context:

- Pass the `tabId` and current URL in every message from the content script
- Never infer state from previous SW invocations — assume cold start every time

```typescript
// always include tabId and href — SW may have been restarted since last call
static async readPageState(): Promise<HostPageState | null> {
  return browser.runtime.sendMessage({
    type: 'read-page-state',
    tabId: await getCurrentTabId(),
    href: location.href,
  });
}
```

---

## What to Avoid

- **Listening to `popstate`** — SPAs use `history.pushState`; `popstate` only fires on back/forward navigation.
- **Fixed timeouts as data-ready signals** — fragile under slow connections and background tabs.
- **Reusing listeners across sessions** — always remove and re-add on each activate/deactivate cycle.
- **Assuming the SW knows which page the user is on** — it doesn't; pass context in every message.
