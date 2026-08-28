# LLM 1

After reviewing Chrome's current MV3 documentation, Chromium guidance, Hugging Face's latest extension architecture recommendations, and community implementations, the answer is actually much clearer than it was a year ago.

## Executive summary

For a **large ONNX model (~85 MB Kokoro Q8)** that you want to **load once and keep warm**, the architecture I'd recommend is:

```
Service Worker
    │
    │ (routing only)
    ▼
Offscreen Document
    │
    ├── ONNX Runtime Web / Transformers.js
    ├── Model loaded once
    ├── ONNX session stays in memory
    ├── IndexedDB / Cache API
    └── Optional Web Workers
```

Avoid using the service worker for inference. Treat it only as a message router.

---

# 1. Where should ONNX inference actually run?

Let's evaluate every runtime.

---

## Option 1 — Service Worker ❌ (not recommended)

### Advantages

- Extension APIs
- Easy messaging
- Can download/cache model

### Fatal problem

MV3 service workers are **ephemeral**.

Chrome intentionally destroys them after roughly **30 seconds of inactivity**, and when that happens:

- JS heap disappears
- ONNX Runtime disappears
- WASM instance disappears
- model weights disappear
- inference session disappears

Next request means:

```
import ORT
↓

load wasm

↓

open model

↓

deserialize

↓

build graph

↓

warm up

↓

infer
```

That entire cold start repeats.

Chrome explicitly documents this lifecycle. ([Chrome for Developers][1])

For an 85 MB TTS model, this is exactly what you want to avoid.

---

## Option 2 — Offscreen document ✅ (best choice)

This is currently the strongest architecture.

Unlike the service worker, an offscreen document is a **real extension page**.

That means it has:

- DOM
- JS heap
- WASM
- Web Workers
- IndexedDB
- Cache API
- fetch()
- Audio APIs
- WebGPU/WebGL (where available)

Most importantly:

**The ONNX session simply remains in memory.**

Example:

```
create offscreen document

↓

load Kokoro

↓

create ORT session

↓

keep session in global variable

↓

message arrives

↓

run inference

↓

message arrives 10 minutes later

↓

run inference immediately
```

No reload.

No graph rebuild.

No parsing.

Exactly what you want.

---

# 2. Does an offscreen document stay alive?

This is probably the most important question.

## The answer is:

**Usually yes.**

But there are nuances.

Chrome does **NOT** apply the service worker idle timer.

Instead, the lifetime depends on:

- creation reason
- whether Chrome decides the page is still needed
- memory pressure

Chrome documentation states:

> The AUDIO_PLAYBACK reason closes after 30 seconds without audio.

Every other reason **does not have an automatic lifetime limit.** ([Chrome for Developers][2])

For example:

```
reasons: ["WORKERS"]
```

or

```
["BLOBS"]
```

or

```
["DOM_PARSER"]
```

are not subject to a fixed timeout.

---

## Chrome may still terminate it

This is important.

Offscreen documents are **not immortal**.

Chrome may destroy them because of:

- browser shutdown
- extension reload
- memory pressure
- crash

The docs describe them as having a lifecycle separate from the service worker and similar in spirit to MV2 event pages, with user-agent discretion over teardown. ([Chrome for Developers][3])

So your architecture should be:

```
Need inference?

↓

check if offscreen exists

↓

if no:

create

↓

load model

↓

reuse forever
```

rather than assuming it can never disappear.

---

## Can it survive minutes?

Yes.

Hours?

Usually yes.

Across multiple clicks?

Yes.

That's precisely the intended use.

---

# 3. Can a content script worker keep the model warm?

Technically:

Yes.

Practically:

Usually no.

---

Content scripts are tied to the web page.

Lifecycle:

```
Open page

↓

content script starts

↓

worker starts

↓

load model

↓

works

↓

navigate

↓

worker dies

↓

reload page

↓

load model again
```

Every tab gets its own copy.

If user opens:

```
Tab A

Tab B

Tab C
```

You now have

```
3 × 85 MB
```

plus three ONNX runtimes.

Very undesirable.

---

# 4. Can a content-script Web Worker access extension storage?

This question has a subtle answer.

There are three separate things:

## IndexedDB

Yes.

Workers can access IndexedDB.

---

## Cache API

Yes.

Workers have Cache Storage available.

---

## Which origin?

This is the key point.

A worker created from a **content script** does **not** become an extension worker automatically.

Its execution context follows the page environment unless it is an extension resource.

That means if you simply do:

```javascript
new Worker("worker.js");
```

inside a content script, origin and access depend on how that worker is created and packaged.

If instead you create the worker from an **extension URL**, for example:

```javascript
new Worker(chrome.runtime.getURL("worker.js"), { type: "module" });
```

the worker runs from the extension package, giving it extension-origin storage (IndexedDB/Cache Storage for the extension origin) rather than the page's origin. This distinction is crucial if you expect all tabs to share cached model files.

Even then, the worker's lifetime is still bound to the page that created it.

So although storage access is possible, it doesn't solve the persistence problem.

---

# 5. What about running directly inside the content script?

This is the simplest implementation.

Unfortunately it's also the least scalable.

Problems:

Every tab:

- downloads model
- loads WASM
- creates ORT
- keeps separate heap

Memory becomes

```
N tabs

↓

N models
```

If Kokoro occupies ~200–400 MB once expanded into runtime memory, multiple tabs become expensive very quickly.

---

# 6. Can an offscreen document spawn Web Workers?

Yes.

Chrome even has an explicit offscreen creation reason:

```
WORKERS
```

The intended architecture is:

```
Service Worker

↓

Offscreen Document

↓

Worker

↓

ONNX Runtime
```

or simply

```
Service Worker

↓

Offscreen

↓

ONNX Runtime
```

if you don't need another thread. ([Chrome for Developers][2])

---

# 7. Existing projects

## Hugging Face Browser Assistant

This is currently one of the strongest public references.

Their 2026 architecture is:

```
Background service worker

↓

Transformers.js

↓

Side panel UI

↓

Content scripts
```

The service worker coordinates requests while the extension hosts the model and messaging layers. ([Hugging Face][4])

One caveat: this demo targets an interactive assistant, not continuous low-latency TTS, so it doesn't specifically optimize for keeping a large speech model permanently warm across long idle periods.

---

## Chrome documentation

Chrome's own examples increasingly recommend the pattern:

```
Service Worker

↓

ensureOffscreen()

↓

send message

↓

Offscreen performs work
```

This is now the canonical solution for long-running computation outside the service worker lifecycle. ([Chrome for Developers][2])

---

## Community consensus

Across MV3 discussions, developers building heavier AI or media workloads generally converge on:

- service worker = orchestration
- offscreen document = heavy computation
- persistent storage = IndexedDB / Cache API
- message passing between contexts

Community reports also note that while offscreen documents avoid the service worker's 30-second idle eviction, they should still be recreated if Chrome closes them under memory pressure. ([Reddit][5])

---

# 8. Recommended architecture for Kokoro

```
User clicks Voiceover

        │
        ▼

Service Worker
(only routing)

        │
chrome.runtime.sendMessage()

        ▼

Offscreen Document

    if session == null:

        load ONNX Runtime

        load Kokoro model
        from IndexedDB / Cache API

        create InferenceSession

        optional warmup()

        save globally

    inference()

        ▼

return PCM

        ▼

Service Worker

        ▼

Content Script

        ▼

Play audio
```

## Model loading

```
First install

↓

download model

↓

Cache API / IndexedDB

↓

later

↓

memory map

↓

ONNX Session

↓

keep alive
```

Only reload from disk if Chrome destroys the offscreen document.

---

# 9. Final recommendation

For your use case—an **85 MB Kokoro TTS model where eliminating cold-start latency is the priority**—I would design the extension as follows:

- **Service worker:** use only for event handling, message routing, and ensuring the offscreen document exists. Never hold the ONNX session here.
- **Offscreen document:** host the ONNX Runtime Web/Transformers.js engine, load the model once, keep the `InferenceSession` in a module-global variable, and serve all TTS requests from this context.
- **Storage:** keep the model in the extension's **IndexedDB or Cache API** so the initial download happens once, but expect to reconstruct the in-memory session if Chrome ever tears down the offscreen document.
- **Content scripts:** keep them lightweight—UI integration, page interaction, and audio playback—not model execution.
- **Workers:** if inference blocks the offscreen document's main thread, spawn a dedicated Web Worker **from the offscreen document** rather than from a content script, preserving the extension-origin context and keeping the model isolated from page lifecycles.

Among the available MV3 execution contexts today, **an offscreen document hosting ONNX Runtime is the closest equivalent to the persistent background page that MV2 extensions used for long-lived AI models**, while still fitting within Chrome's supported architecture.

[1]: https://developer.chrome.com/docs/extensions/develop/concepts/service-workers/lifecycle?hl=en&utm_source=chatgpt.com "The extension service worker lifecycle  |  Chrome for Developers"
[2]: https://developer.chrome.com/docs/extensions/reference/api/offscreen?utm_source=chatgpt.com "chrome.offscreen  |  API  |  Chrome for Developers"
[3]: https://developer.chrome.com/blog/Offscreen-Documents-in-Manifest-v3/?utm_source=chatgpt.com "Offscreen Documents in Manifest V3  |  Blog  |  Chrome for Developers"
[4]: https://huggingface.co/blog/transformersjs-chrome-extension?utm_source=chatgpt.com "How to Use Transformers.js in a Chrome Extension"
[5]: https://www.reddit.com/r/chrome_extensions/comments/1t8xe0z/a_quick_tip_for_dealing_with_manifest_v3_service/?utm_source=chatgpt.com "A quick tip for dealing with Manifest V3 Service Worker sleeping issues"

# LLM 2

Now I have everything I need to write a comprehensive, deep report. Let me compile it.

---

Here is the full research report.

---

RUNNING KOKORO TTS (ONNX) IN A CHROME MV3 EXTENSION: ARCHITECTURE, LIFECYCLE, AND STORAGE

---

PART 1: THE FOUR CANDIDATE EXECUTION CONTEXTS AND WHY THREE FAIL FOR YOUR USE CASE

Before getting into what works, it helps to understand exactly why each context fails, because the failure modes are different and the reasoning matters when you are designing fallback handling.

THE SERVICE WORKER (BACKGROUND.JS)

Chrome terminates an extension service worker when one of these conditions is met: after 30 seconds of inactivity, when a single request or API call takes longer than 5 minutes to process, or when a fetch() response takes more than 30 seconds to arrive. Any global variables set in the service worker will be lost when it shuts down.

This alone makes the service worker a non-starter for holding an in-memory ONNX InferenceSession. But there is a second, deeper problem that makes it completely impossible regardless of the lifetime issue: the WASM and WebGPU backends that ONNX Runtime Web depends on cannot initialize inside a service worker at all.

The error encountered when trying to use WebGPU or WASM backends inside a ServiceWorker on a Chrome extension is: "no available backend found. ERR: [webgpu] TypeError: import() is disallowed on ServiceWorkerGlobalScope by the HTML specification." This error originates in the InferenceSession backend resolution logic.

The reason is a hard constraint in the service worker spec: dynamic import() is banned in ServiceWorkerGlobalScope. ONNX Runtime Web uses dynamic imports to load its WASM binaries and execution backend modules. There is no workaround for this inside the service worker itself. The feature works by design constraint and not just a Chrome-specific bug.

Even the keepalive hacks that people use to extend service worker lifetime do not fix this — you would still have a worker that cannot load the ONNX backend in the first place.

The Transformers.js team's own recommendation for MV3 is explicit: service workers can be suspended and restarted, so model runtime state should be treated as recoverable and re-initialized when needed. This acknowledgment from the library authors confirms the service worker is not a warm-model host.

CONTENT SCRIPT DIRECTLY

Running inference in the content script itself is technically possible from a JS environment standpoint — content scripts run in a real renderer process and have access to WebAssembly. But there are three layered problems that make it a dead end for your voiceover feature.

First, a content script is tied to the tab's lifecycle. If the user navigates to a new page, the content script is destroyed and any loaded model goes with it. For a voiceover feature triggered by button clicks on YouTube, you are targeting a single-page application, so navigation inside YouTube itself (going from one video to another without a full reload) may or may not destroy the content script depending on how the tab navigation is structured.

Second, and more importantly for your warm-model requirement: if the user closes the tab and reopens it, or navigates away and back, the 85MB model has to be reloaded from scratch. There is no cross-tab persistence. Each tab gets its own independent content script context with its own memory space.

Third, running a heavy WASM workload on the content script's main thread blocks page interaction. You would need to move the inference to a Web Worker spawned from the content script, which leads to the third option below.

CONTENT SCRIPT WEB WORKER

This is where the origin isolation problem becomes critical and often misunderstood.

In a content script within a Chrome extension, Web Workers run in the page's origin, not the extension's origin. This means that a Web Worker packaged with your extension cannot be used directly from a content script. Origin-specific features such as IndexedDB or the FileSystem API will use the web page's origin instead of the extension's origin.

This is a fundamental issue for Kokoro/ONNX. When Transformers.js or kokoro-js loads a model, it caches the model weights to either the Cache API or IndexedDB. If the Worker runs at the page origin (e.g., youtube.com), those caches live in YouTube's storage quota, not in the extension's storage. This means:

The cache is shared with and potentially interfered by the host page. The cached model weights can be cleared by the browser when YouTube's storage is evicted. Chrome's quota manager evicts origins on an LRU basis when disk space is low, and a cached 85MB model sitting under youtube.com's origin is a prime eviction target. The user clearing YouTube's site data will also wipe your model cache. You cannot reliably fetch extension-bundled model files from the Worker because cross-origin extension URL fetches are not possible from a page-origin worker without special workarounds.

Content scripts can access IndexedDB databases at the web page's origin via window.indexedDB, but background, popup, and options scripts each have their own IndexedDB isolated from webpages and content scripts.

Content scripts don't have direct access to the service worker or the Cache API associated with the extension. Background, popup, and options scripts each have their own service worker scope and associated Cache API under the extension origin.

There is a workaround described in old tooling (Rob W's worker_proxy patch, using an iframe to host the worker on the extension origin), but this adds significant complexity, depends on iframe availability on the host page, and gets destroyed if the page removes the iframe. It also ties the worker's lifetime to the tab's lifetime anyway, so you still lose the model on tab close or navigation.

The lifetime problem makes this option worse than offscreen even if you solved the origin isolation: a Worker spawned from a content script lives exactly as long as that content script does — meaning as long as the tab is open and the content script is injected. If the user closes the tab and reopens YouTube, you reload the model. There is no way to share one Worker instance across multiple tabs.

---

PART 2: THE OFFSCREEN DOCUMENT — THE CORRECT CONTEXT

THE BASIC MECHANICS

Since offscreen documents are specifically designed to handle use cases that are not supported in service workers, the lifetime of the page and the permissions it will be granted are separate from that of the extension service worker. The lifetime of an offscreen document is independent of the service worker that created it.

This is the key architectural fact. The offscreen document is a real hidden HTML page running in a real renderer process. It has a full DOM, access to WebAssembly, access to WebGPU (via navigator.gpu), access to the Web Audio API, access to IndexedDB and the Cache API under the extension origin (chrome-extension://your-extension-id), and it is not subject to the service worker spec's import() prohibition.

Unlike service workers that terminate quickly to save resources, offscreen documents can maintain persistent state and perform continuous operations without being visible to the user. Offscreen documents are ideal for persistent data processing, heavy computations requiring consistent access to memory, and audio/video processing requiring continuous operation.

LIFETIME MECHANICS — WHAT ACTUALLY CONTROLS IT

Reasons are set during document creation to determine the document's lifespan. The AUDIO_PLAYBACK reason sets the document to close after 30 seconds without audio playing. All other reasons don't set lifetime limits.

This is the critical decision you need to make at creation time. The reason you declare when calling chrome.offscreen.createDocument() determines the lifetime policy:

If you declare AUDIO_PLAYBACK as the reason, Chrome will terminate the document after 30 idle seconds with no audio playing. This is exactly what you do not want, because it means the model gets dropped between voiceover button clicks that are more than 30 seconds apart.

If you declare any other valid reason — CLIPBOARD, DOM_SCRAPING, WORKERS, LOCAL_STORAGE, or others — the document has no enforced idle timeout. It stays alive until Chrome needs to terminate it for resource reasons or the extension is unloaded.

For all other reasons besides AUDIO_PLAYBACK, the lifetime is unbounded and the page can remain open forever. An offscreen document has been observed staying alive for over 12 hours in testing with only a message listener active.

The practical implication: do not declare AUDIO_PLAYBACK as the reason for your offscreen document. Declare WORKERS (since you need to spawn workers) or DOM_PARSER. Keep the ONNX InferenceSession loaded inside the offscreen document (or inside a Dedicated Worker spawned from it), and use a separate mechanism to actually play the audio. The audio playback itself can happen in the content script or the offscreen document's Web Audio API without needing the AUDIO_PLAYBACK reason to be declared.

THE "TERMINATED IF NO LONGER DOING WORK" CAVEAT

The original Chrome proposal language says offscreen documents will be terminated "if they are no longer doing work." In practice, as of current Chrome versions, the only reason-specific termination policy that has been implemented is the 30-second timeout for AUDIO_PLAYBACK. For other reasons, Chrome has not yet implemented idle-based termination.

The proposal notes that as an ephemeral context, offscreen documents will be terminated if they are no longer doing work, and extension authors should anticipate and prepare to recover from such scenarios.

The Chrome team has acknowledged that over time they expect to add more lifetime restrictions, but they have committed to announcing this ahead of time so developers can prepare. The current state is that non-AUDIO_PLAYBACK documents are essentially long-lived.

This means your architecture should still handle the case where the offscreen document has been terminated between sessions (e.g., Chrome was closed and reopened, or the extension was updated). The pattern is: before sending an inference request, check whether the offscreen document exists via chrome.runtime.getContexts(), and create it if not. Then send the inference request. The model cold-start on first use after Chrome restart is unavoidable, but subsequent same-session calls have zero cold start.

ONLY ONE OFFSCREEN DOCUMENT PER EXTENSION

For implementation ease, the first version of this API only supports a single page per extension per profile at a time. In future versions, this may be relaxed to support multiple pages.

This is a hard constraint. Your extension can only have one offscreen document. If you need it for ONNX inference, it must also handle any other offscreen-specific tasks your extension has (clipboard access, DOM scraping, etc.). Design accordingly.

---

PART 3: WHERE THE MODEL SESSION ACTUALLY LIVES WITHIN THE OFFSCREEN DOCUMENT

You have two sub-options within the offscreen document.

OPTION A: LOAD THE MODEL DIRECTLY IN THE OFFSCREEN DOCUMENT'S MAIN THREAD

The offscreen document is a real browser page. You can import kokoro-js or onnxruntime-web in a script tag and load the ONNX InferenceSession in the page's main JavaScript context. The session object lives as a module-scope singleton in the page.

This is the simplest approach. The session stays alive as long as the offscreen document stays alive. The downside is that running inference on the main thread of the offscreen document blocks that thread during inference. Since this is a hidden page with no visible UI, this does not matter for user experience, but it does mean you cannot do anything else in the offscreen document simultaneously.

OPTION B: SPAWN A DEDICATED WEB WORKER FROM THE OFFSCREEN DOCUMENT

Because the offscreen document runs at the extension's origin (chrome-extension://your-extension-id), any Worker it spawns also runs at the extension's origin. This solves both the origin isolation problem and the threading problem simultaneously.

The Worker has access to the extension's Cache API and IndexedDB. When Transformers.js or kokoro-js downloads and caches the Kokoro model weights, the cache is stored under the extension origin. This cache persists across offscreen document restarts (the offscreen document can be torn down and recreated and the Worker can fetch the model from cache in seconds instead of downloading 85MB again).

The Worker lifecycle is tied to the offscreen document's lifecycle — when the offscreen document is terminated, the Worker is terminated too. But since the offscreen document itself has an unbounded lifetime (given a non-AUDIO_PLAYBACK reason), this is fine.

The manifest.json requires the WORKERS reason to be declared to spawn workers from an offscreen document (Chrome added this reason specifically for this use case).

---

PART 4: MODEL CACHING ACROSS SESSIONS

Even with the offscreen document surviving indefinitely within a Chrome session, Chrome will eventually be closed and reopened, or the extension will be updated. On the next cold start, the offscreen document is created fresh and the ONNX session needs to be initialized again.

The key question is how fast that re-initialization is. There are two costs: fetching the model bytes (85MB for Q8) and loading them into ONNX Runtime.

Fetching is almost free on cold start because Transformers.js and kokoro-js use the Cache API at the extension's origin to store downloaded model weights.

Because models are loaded from the background service worker (or, equivalently, from the extension's origin context), artifacts are cached under the extension origin (chrome-extension://extension-id) rather than per-website origins, which gives one shared cache for the whole extension install.

Transformers.js automatically caches models in IndexedDB. You can check cache status by reading the Cache API keys for 'kokoro' or 'transformers' entries. Clearing those cache keys removes the cached model.

The pattern from existing Kokoro extension implementations is to store model weights in the browser cache under the extension origin on first load, then on subsequent loads (after offscreen document recreation) fetch from cache rather than network. For an 85MB Q8 model, fetching from cache and deserializing into the ONNX session takes a few seconds, not the tens of seconds a network download would take.

Service workers' storage (and by extension, extension origin storage) lasts indefinitely — there is no periodic deletion. Installed storage is only evicted by the Quota Manager when Chrome is using over one-third of the disk or when the system has less than the minimum of 1GB or 1% disk free. When eviction starts, origins are purged on an LRU basis.

An 85MB extension cache is small enough that eviction is very unlikely under normal conditions.

---

PART 5: THE WASM INITIALIZATION PROBLEM IN MV3 AND HOW TO FIX IT

Even with the offscreen document as your context, there is a known MV3-specific gotcha: Transformers.js and onnxruntime-web try to load their WASM binary files from a relative path or CDN URL at runtime. MV3's Content Security Policy blocks remote script fetches.

The problem is that Transformers.js attempts to dynamically load helper modules such as ort-wasm-\*.jsep.mjs and corresponding .wasm files from a CDN at runtime. Manifest V3 CSP blocks those requests. The fix requires three steps: copying those ONNX/WASM helper files into your extension's dist directory during the build, setting env.backends.onnx.wasm.wasmPaths to point to the bundled path using chrome.runtime.getURL('transformers/') in the worker, and adding web_accessible_resources entries in manifest.json for the transformer assets.

Concretely, in your offscreen document or the Worker it spawns, you need to do this before creating any InferenceSession:

import \* as ort from 'onnxruntime-web';
ort.env.wasm.wasmPaths = chrome.runtime.getURL('path/to/wasm/');

And in your manifest.json, you need both the CSP entry and the resource declaration:

"content_security_policy": {
"extension_pages": "script-src 'self' 'wasm-unsafe-eval'; object-src 'self'"
}

"web_accessible_resources": [{
"resources": ["wasm/*", "models/*"],
"matches": ["<all_urls>"]
}]

The 'wasm-unsafe-eval' CSP directive is required for WebAssembly compilation. Without it, WASM initialization fails even with the binaries bundled locally.

For WebGPU, the offscreen document does have access to navigator.gpu, unlike the service worker. This is the reason the Transformers.js + WebGPU pattern routes through offscreen rather than directly through the service worker.

In the service worker, WebGPU is not accessible. The standard workaround is to have the background service worker launch an offscreen document that includes the inference script, where WebGPU is accessible. The background and offscreen scripts can exchange messages between each other.

---

PART 6: EXISTING OPEN-SOURCE PATTERNS AND REAL EXTENSIONS

There are several confirmed working examples that validate the offscreen approach for ONNX inference.

CHAIMANTEC'S KOKORO-TTS CHROME EXTENSION

This extension provides text-to-speech functionality using the Kokoro 82M v1.0 model, bundling ONNX models for offline TTS processing. WebGPU is required for good performance. The extension uses an offscreen document (or background worker) architecture to keep the model warm between TTS requests. This is the closest publicly known example to your exact use case: Kokoro ONNX in a Chrome extension.

KOKORO TTS ENGINE (WEBEXTENSION.ORG)

This extension runs the Kokoro model locally inside a background worker, converting text to speech without any server interaction. It supports CPU, GPU (WebGPU), and WASM backends. The model data is downloaded once and stored in the browser cache for future use. The architecture is a background worker with the inference running inside it and the model cached at the extension origin.

HUGGINGFACE TRANSFORMERS.JS CHROME EXTENSION EXAMPLE

The gemma4-browser-extension demonstrates the architecture where models are loaded once and shared across all tabs, side panels, and content scripts. This is described as crucial because loading multi-gigabyte models repeatedly would be impractical. Service worker lifetime is acknowledged as a constraint, with the note that service workers can stay alive during active ML processing.

This example actually runs inference in the background service worker using a singleton pattern, which works when the active inference keeps the service worker alive via API calls. However, the service worker WASM limitation makes this approach unsuitable for ONNX Runtime Web's WASM backend, so extensions using WebGPU via the offscreen route are more reliable.

The Wei Lu Transformers.js + ONNX Runtime WebGPU Chrome extension example uses this pattern explicitly: background.js is the service worker that acts as the central event handler. To access WebGPU, it launches offscreen.html which includes offscreen.js. In offscreen.js, WebGPU is accessible. The background and offscreen scripts exchange messages.

---

PART 7: MESSAGING ARCHITECTURE BETWEEN CONTENT SCRIPT AND OFFSCREEN DOCUMENT

The communication path in the recommended architecture is:

Content script (button click on YouTube page) sends a message to the service worker via chrome.runtime.sendMessage. The service worker ensures the offscreen document exists (using chrome.runtime.getContexts() to check, then chrome.offscreen.createDocument() if needed), then forwards the message to the offscreen document via chrome.runtime.sendMessage. The offscreen document runs inference and returns the audio buffer back through the same message chain.

Only the chrome.runtime messaging APIs are supported in offscreen documents. The offscreen document's URL must be a static HTML file bundled with the extension.

This means you cannot call chrome.tabs or any other extension API directly from the offscreen document. All orchestration goes through the service worker as a router.

For audio playback specifically: the offscreen document generates the raw audio PCM data (a Float32Array from the Kokoro ONNX model), sends it back to the service worker, which forwards it to the content script, which plays it using the Web Audio API (which is available in content scripts because they run in the tab's renderer process). Alternatively, if you use the offscreen document for inference only, you can encode the audio as a WAV or send it as an ArrayBuffer via postMessage and have the content script decode and play it.

One important note: if you send messages from the offscreen document to the service worker periodically, those messages reset the service worker's idle timer. Messages sent from an offscreen document reset the service worker timers. This means an active offscreen document can incidentally keep the service worker alive, which is useful if you need both the service worker and offscreen document alive simultaneously during inference.

---

PART 8: THE WORKERS OFFSCREEN REASON AND MULTI-THREADING

The chrome.offscreen.Reason.WORKERS reason was added specifically to support spawning Web Workers from an offscreen document. If you want multi-threaded WASM inference (ONNX Runtime Web supports multi-threading when multiple threads are available), you need to:

Declare WORKERS as the reason in createDocument. Spawn a Dedicated Worker inside the offscreen document. Configure the ONNX WASM backend thread count: ort.env.wasm.numThreads = 4 (or whatever is appropriate for your target hardware). Ensure the Cross-Origin-Opener-Policy and Cross-Origin-Embedder-Policy headers are set if using SharedArrayBuffer for multi-threading (required for SharedArrayBuffer, which some WASM implementations use for thread synchronization). For MV3 extensions, this header configuration applies to the extension's service worker scope and is handled differently than for regular web pages.

For Kokoro specifically at Q8 WASM, single-threaded inference is measurable but not catastrophically slow for TTS (it is not a generative LLM). WebGPU would give you 2-10x speedup if the user's hardware supports it.

---

PART 9: THE COMPLETE ARCHITECTURE RECOMMENDATION

Given all of the above, here is the architecture that gives you a warm model across inference calls:

MANIFEST.JSON
Add the "offscreen" permission. Declare web_accessible_resources for the WASM files and model files (if bundled). Add 'wasm-unsafe-eval' to the extension_pages CSP.

BACKGROUND SERVICE WORKER
Acts only as a router. On receiving an inference request from the content script, it calls setupOffscreenDocument() to ensure the offscreen document exists, then forwards the request to the offscreen document via chrome.runtime.sendMessage. Does not hold any model state itself.

OFFSCREEN DOCUMENT
Declared with reason "WORKERS" (and optionally "DOM_PARSER" if needed). Spawns a single Dedicated Worker at startup. The Worker loads and initializes the Kokoro ONNX session once and holds it as a module-scope singleton: let ttsInstance = null. On receiving an init message, loads the model. On receiving a generate message, runs inference and postMessages the audio buffer back. The offscreen document relays results back to the service worker via chrome.runtime.sendMessage.

CONTENT SCRIPT
Listens for user interaction (voiceover button click). Sends the text-to-synthesize to the service worker. Receives the audio ArrayBuffer from the service worker. Uses the Web Audio API to decode and play it.

MODEL STORAGE AND CACHING
The Worker at extension origin has access to the Cache API and IndexedDB under the extension's origin. Kokoro-js / Transformers.js will cache the 85MB Q8 model in this cache automatically on first load. Subsequent offscreen document recreations (after Chrome restarts or extension updates) will fetch from cache in seconds rather than downloading again. Model weights never touch the host page's origin storage.

COLD-START HANDLING
On first use within a session, the offscreen document is created and the Worker loads the model. If the model is cached (Cache API under extension origin), this takes a few seconds. If it is not cached (first install), it takes however long the download takes. Your UI should show a loading indicator. On subsequent uses within the same session, no cold start: the Worker's singleton ttsInstance is already initialized and inference runs immediately.

---

PART 10: REMAINING RISKS AND EDGE CASES

FUTURE OFFSCREEN LIFETIME RESTRICTIONS
The Chrome team has said they intend to add termination policies to offscreen documents over time. The WORKERS/DOM_PARSER reason may eventually get an idle timeout. If this happens, you will need to implement model reload logic (which you should have anyway), and the user will notice a cold start the first time they use the voiceover after a period of inactivity. This is the same UX tradeoff you face today with any stateful extension context.

SINGLE OFFSCREEN DOCUMENT CONSTRAINT
You get one. If another part of your extension also needs offscreen capabilities (clipboard, DOM scraping), you need to multiplex them into the same document and handle multiple message types in the same listener.

EXTENSION UPDATE / RELOAD
When the extension is updated (new version installed), all extension contexts including the offscreen document are torn down. The model session is lost. The next inference call will recreate the offscreen document and reload from cache. This is expected behavior and not a bug.

MEMORY
An 85MB Q8 model loaded into ONNX Runtime Web occupies roughly 85MB of raw weight memory plus the overhead of the WASM heap (ONNX Runtime Web allocates a fixed WASM heap at startup, typically 256MB–1GB depending on configuration). For a TTS model this is workable, but keep in mind that the offscreen document's renderer process is a real Chrome renderer process sharing system memory. On low-memory devices, Chrome's process killer may terminate renderer processes including your offscreen document. Treat the model session as potentially recoverable.

WEBGPU SESSION PERSISTENCE
If you use WebGPU as the execution provider in the offscreen document, the GPU session is even more sensitive to context loss. GPU contexts can be lost when the GPU is reset, when the user locks their screen on some hardware, or when Chrome reclaims GPU resources. ONNX Runtime Web does not currently have automatic GPU context recovery. For a TTS extension where reliability matters more than raw speed, defaulting to WASM with an optional WebGPU path (and graceful fallback on session error) is safer.
