---
name: chrome-extension-youtube
description: YouTube-specific extension patterns — key globals (ytInitialPlayerResponse, ytInitialData, ytcfg), yt-page-data-updated signal, caption track selection, InnerTube API access, and SPA navigation handling. Extends chrome-extension-spa.md; read both first. Read when building an extension for YouTube watch pages.
---

> Extends `chrome-extension-spa.md` (which extends `chrome-extension.md`). Read both first.

---

## YouTube's Key Globals

YouTube injects several globals into the main world (`window`) before the page renders. These are only readable via `chrome.scripting.executeScript` (main world injection) — the content script's isolated world cannot access `window.*` of the host page.

| Global | What it contains |
|---|---|
| `ytInitialPlayerResponse` | Video metadata: videoId, title, duration, captions, streaming data, playability status |
| `ytInitialData` | Full page structure: related videos, comments section, description, chapter markers |
| `ytcfg` | YouTube client config: API keys, visitor data, client name/version — needed for InnerTube API calls |

All three are set once on initial page load. On SPA navigation, YouTube replaces them — wait for `yt-page-data-updated` before reading (see below).

---

## The Data-Ready Signal: `yt-page-data-updated`

YouTube fires `yt-page-data-updated` on `document` when the new page's data is loaded into the JS context after SPA navigation. This is the safe moment to read `ytInitialPlayerResponse` and `ytInitialData`.

```typescript
document.addEventListener('yt-page-data-updated', (e) => {
  const detail = (e as CustomEvent<{ pageType?: string }>).detail;
  if (detail?.pageType !== 'watch') return; // only act on video pages
  void ingestor.acquire(location.href);
});
```

**Do not read `ytInitialPlayerResponse` on URL change alone** — the data may still be stale from the previous page at that moment.

---

## YouTube Bridge

`src/main-world/youtube.bridge.ts` — injected into main world via `MwClient`:

```typescript
// IMPORTANT: injected into main world via executeScript — cannot close over imports.
// Self-contained. Read-only. No side effects.
export function readYtPageState(): YouTubePageState | null {
  // ytInitialPlayerResponse is set by YouTube on page load and SPA navigation
  declare const ytInitialPlayerResponse: YtInitialPlayerResponse | undefined;
  declare const ytInitialData: YtInitialData | undefined;

  const videoDetails = ytInitialPlayerResponse?.videoDetails;
  if (!videoDetails?.videoId) return null;

  const chapters = ytInitialData?.playerOverlays
    ?.playerOverlayRenderer?.decoratedPlayerBarRenderer
    ?.decoratedPlayerBarRenderer?.playerBar
    ?.multiMarkersPlayerBarRenderer?.markersMap
    ?.find((m: any) => m.key === 'AUTO_CHAPTERS' || m.key === 'DESCRIPTION_CHAPTERS')
    ?.value?.chapters ?? [];

  return {
    videoId: videoDetails.videoId,
    title: videoDetails.title,
    durationSec: Number(videoDetails.lengthSeconds),
    chapters: chapters.map((c: any) => ({
      title: c.chapterRenderer?.title?.simpleText ?? '',
      startSec: Math.round((c.chapterRenderer?.timeRangeStartMillis ?? 0) / 1000),
    })),
  };
}
```

**Self-containment rule:** all globals must be declared with `declare const`. Do not import types at runtime — use `import type` only at the top of the file; TypeScript strips it, Chrome never sees it.

---

## YouTube Page State Shape

```typescript
export interface YouTubePageState {
  videoId: string;          // stable identifier — key for all backend calls
  title: string;
  durationSec: number;
  chapters: Array<{
    title: string;
    startSec: number;       // chapter start in seconds
  }>;
}
```

`videoId` is the stable key. Use it for all backend lookups and cache keys — never use the URL or title.

---

## Caption Tracks

YouTube exposes caption track metadata in `ytInitialPlayerResponse.captions.playerCaptionsTracklistRenderer.captionTracks`. Each track has:

```typescript
{
  baseUrl: string;         // fetch URL for the VTT/timed-text file
  name: { simpleText: string };
  vssId: string;           // e.g. ".en", "a.en" (auto-generated prefix: "a.")
  languageCode: string;    // e.g. "en"
  isTranslatable: boolean;
  kind?: string;           // "asr" for auto-generated
}
```

**Track selection priority:**
1. Manual captions in the video's original language (no `kind: 'asr'`)
2. Auto-generated captions in the original language (`kind: 'asr'`)
3. Manual captions in any other language
4. Auto-generated in any other language

`vssId` starting with `a.` = auto-generated. Use `kind: 'asr'` as the authoritative signal; `vssId` prefix is a secondary heuristic.

**Fetching the transcript:** `baseUrl` returns a timed-text XML or VTT file depending on query params. Append `&fmt=vtt` for VTT format. The `baseUrl` is session-scoped — re-fetch from `ytInitialPlayerResponse` if it expires (typically after ~6 hours).

---

## SPA Navigation on YouTube

YouTube is the SPA guide's primary reference case. Two signals to use together:

1. **URL observer** → detect navigation intent (URL changes from `/watch?v=A` to `/watch?v=B`)
2. **`yt-page-data-updated`** → detect data readiness (safe to read `ytInitialPlayerResponse`)

```typescript
// navigation intent — URL changed to a watch page
observer.start((href) => {
  if (!href.includes('/watch')) return;
  deactivate();
  // do NOT activate yet — wait for yt-page-data-updated
});

// data ready — safe to read ytInitialPlayerResponse
document.addEventListener('yt-page-data-updated', (e) => {
  const detail = (e as CustomEvent<{ pageType?: string }>).detail;
  if (detail?.pageType !== 'watch') return;
  void activate(location.href);
});
```

Never activate on URL change alone — `ytInitialPlayerResponse` may still contain the previous video's data.

---

## InnerTube API (ytcfg)

YouTube's internal API (InnerTube) requires credentials from `ytcfg`. Read from the main world:

```typescript
declare const ytcfg: { get: (key: string) => unknown } | undefined;

const apiKey = ytcfg?.get('INNERTUBE_API_KEY') as string | undefined;
const visitorData = ytcfg?.get('VISITOR_DATA') as string | undefined;
const clientName = ytcfg?.get('INNERTUBE_CLIENT_NAME') as string | undefined;
const clientVersion = ytcfg?.get('INNERTUBE_CLIENT_VERSION') as string | undefined;
```

`ytcfg` credentials are session-scoped and rotate. Always read fresh on each session — do not cache across page navigations.

---

## What to Avoid

- **Reading `ytInitialPlayerResponse` on URL change** — stale until `yt-page-data-updated` fires.
- **Hardcoding InnerTube API keys** — they rotate; always read from `ytcfg` at runtime.
- **Importing `ytcfg` or `ytInitialPlayerResponse` types as runtime values** — they only exist in the main world; use `declare const` inside bridge functions.
- **Relying on `vssId` prefix alone for caption type detection** — `kind: 'asr'` is authoritative.
- **Using video title or URL as a cache key** — titles are non-unique; URLs contain query params. Use `videoId` only.
