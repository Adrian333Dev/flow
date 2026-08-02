/*
 * page-capture — console snippet (Slice 1)
 * ---------------------------------------
 * PASTE THIS INTO THE DEVTOOLS CONSOLE on the page you want to capture.
 * (It must run in the *console*: it uses getEventListeners(), which only
 *  exists in the DevTools command-line API — a normal injected page script
 *  cannot call it.)
 *
 * It gathers: metadata, full HTML, grouped event listeners, lossless HTML for
 * OPEN shadow roots + same-origin iframes (the content page.html physically
 * can't hold), and light framework detection — then downloads one `capture.json`.
 *
 * Next: run `node .claude/skills/debug-web-pages/tools/unpack.js ~/Downloads/capture.json`
 * to explode it into a bundle directory (writes ./captures/<slug>-<ts>/).
 */
(() => {
  const SCHEMA_VERSION = 1;
  const FN_SOURCE_CAP = 2000; // truncate very long (minified) handler sources

  const warnings = [];
  const blindSpots = [
    "closed shadow roots are not traversable via the console backend",
    "listeners on non-DOM EventTargets (XHR, WebSocket, AudioContext, custom) are not found by the tree walk",
    "artifacts are sampled across a few ms of a live, mutating page — a handful of listeners.json node paths may not resolve in page.html (see design doc: 'inherent skew')",
  ];

  const hasGEL = typeof getEventListeners === "function";
  if (!hasGEL) {
    warnings.push(
      "getEventListeners() unavailable — snippet was not run in the DevTools console; listeners were skipped.",
    );
  }

  // --- small helpers -------------------------------------------------------

  const djb2 = (str) => {
    let h = 5381;
    for (let i = 0; i < str.length; i++) h = (h * 33) ^ str.charCodeAt(i);
    return (h >>> 0).toString(16);
  };

  const truncate = (s, cap) =>
    typeof s === "string" && s.length > cap
      ? s.slice(0, cap) + `…[+${s.length - cap} chars]`
      : s;

  const fnSource = (fn) => {
    let s;
    try {
      s = String(fn);
    } catch {
      s = "[unstringifiable handler]";
    }
    return truncate(s, FN_SOURCE_CAP);
  };

  const byteLen = (s) => {
    try {
      return new TextEncoder().encode(s).length;
    } catch {
      return s.length;
    }
  };

  // CSS-ish path segment for one element, relative to its siblings.
  const segment = (el) => {
    const tag = el.tagName ? el.tagName.toLowerCase() : "?";
    if (el.id) return `${tag}#${CSS.escape ? CSS.escape(el.id) : el.id}`;
    const parent = el.parentNode;
    if (!parent || !parent.children) return tag;
    const sameTag = Array.prototype.filter.call(
      parent.children,
      (c) => c.tagName === el.tagName,
    );
    if (sameTag.length <= 1) return tag;
    const idx = sameTag.indexOf(el) + 1;
    return `${tag}:nth-of-type(${idx})`;
  };

  // --- listener collection -------------------------------------------------

  const byType = {}; // type -> Map(groupKey -> entry)
  const byNode = {}; // path -> Set(type)
  let listenerAttachments = 0;

  const recordListeners = (path, target) => {
    if (!hasGEL) return;
    let map;
    try {
      map = getEventListeners(target);
    } catch {
      return;
    }
    if (!map) return;
    for (const type of Object.keys(map)) {
      for (const l of map[type]) {
        listenerAttachments++;
        const src = fnSource(l.listener);
        const flags = `${l.useCapture ? "C" : "B"}${l.passive ? "P" : ""}${l.once ? "O" : ""}`;
        const groupKey = djb2(`${type}|${flags}|${src}`);
        if (!byType[type]) byType[type] = new Map();
        let entry = byType[type].get(groupKey);
        if (!entry) {
          entry = {
            handlerHash: djb2(src),
            source: src,
            useCapture: !!l.useCapture,
            passive: !!l.passive,
            once: !!l.once,
            nodes: [],
          };
          byType[type].set(groupKey, entry);
        }
        entry.nodes.push(path);
        (byNode[path] = byNode[path] || new Set()).add(type);
      }
    }
  };

  // --- DOM walk ------------------------------------------------------------
  // We still walk the whole tree, but we DON'T emit a (redundant, lossy) node
  // tree. The walk exists to: (1) record listeners with CSS-path locators,
  // (2) discover shadow roots / same-origin iframes and capture them as
  // lossless HTML, (3) count nodes. page.html already holds the light DOM
  // losslessly; shadowAndFrames holds exactly what page.html can't.

  let elementCount = 0;
  let openShadowRoots = 0;
  let sameOriginFrames = 0;
  let crossOriginFrames = 0;
  const shadowAndFrames = []; // { hostPath, kind, origin?, mode?, src?, html?, note? }

  const walk = (el, path) => {
    elementCount++;
    recordListeners(path, el);

    // Open shadow root: capture its serialized HTML (page.html cannot), then
    // descend to find listeners + nested shadow roots inside it.
    if (el.shadowRoot) {
      openShadowRoots++;
      shadowAndFrames.push({
        hostPath: path,
        kind: "shadow",
        mode: "open",
        html: el.shadowRoot.innerHTML,
      });
      walkChildren(el.shadowRoot, path, " >> ");
    }

    // Same-origin iframe: capture the inner document as HTML and descend.
    if (el.tagName === "IFRAME") {
      let doc = null;
      try {
        doc = el.contentDocument;
      } catch {
        doc = null;
      }
      if (doc && doc.documentElement) {
        sameOriginFrames++;
        shadowAndFrames.push({
          hostPath: path,
          kind: "iframe",
          origin: "same-origin",
          src: el.getAttribute("src") || null,
          html: doc.documentElement.outerHTML,
        });
        walk(doc.documentElement, `${path} >>iframe>> html`);
      } else {
        crossOriginFrames++;
        shadowAndFrames.push({
          hostPath: path,
          kind: "iframe",
          origin: "cross-origin",
          src: el.getAttribute("src") || null,
          note: "cross-origin iframe — internals not accessible (browser security boundary)",
        });
      }
    }

    walkChildren(el, path, " > ");
  };

  const walkChildren = (root, parentPath, sep) => {
    const children = root.children || [];
    for (const child of children) {
      walk(child, `${parentPath}${sep}${segment(child)}`);
    }
  };

  // --- light framework / site detection ------------------------------------

  const detectFrameworks = () => {
    const f = {};
    try {
      if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__ !== undefined) f.react = true;
      if (document.querySelector("[data-reactroot], #root, #__next")) f.reactLikeRoot = true;
      if (window.__VUE__ !== undefined || document.querySelector("[data-v-app]")) f.vue = true;
      if (window.ng !== undefined || window.getAllAngularRootElements) f.angular = true;
      if (window.ytcfg || window.ytInitialData) {
        f.youtube = true;
        f.youtubeGlobals = [
          window.ytcfg && "ytcfg",
          window.ytInitialData && "ytInitialData",
          window.ytInitialPlayerResponse && "ytInitialPlayerResponse",
        ].filter(Boolean);
      }
      f.frameworkGlobals = Object.keys(window).filter((k) =>
        /^(__|ng|yt|React|Vue|angular)/.test(k),
      );
    } catch (e) {
      warnings.push(`framework detection error: ${e && e.message}`);
    }
    return f;
  };

  // --- assemble ------------------------------------------------------------
  // Serialize the HTML ONCE, right next to the walk, to minimise skew between
  // page.html and the listener/path data, and to keep byte counts consistent.

  const html = document.documentElement.outerHTML;
  walk(document.documentElement, "html");
  recordListeners("window", window);
  recordListeners("document", document);

  const listeners = {
    blindSpots,
    byType: Object.fromEntries(
      Object.entries(byType).map(([type, map]) => [
        type,
        [...map.values()].map((e) => ({
          handlerHash: e.handlerHash,
          source: e.source,
          useCapture: e.useCapture,
          passive: e.passive,
          once: e.once,
          nodeCount: e.nodes.length,
          nodes: e.nodes,
        })),
      ]),
    ),
    byNode: Object.fromEntries(
      Object.entries(byNode).map(([p, set]) => [p, [...set]]),
    ),
  };

  const capture = {
    schemaVersion: SCHEMA_VERSION,
    backend: "console-snippet",
    url: location.href,
    title: document.title,
    capturedAt: new Date().toISOString(),
    userAgent: navigator.userAgent,
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
      dpr: window.devicePixelRatio,
    },
    html,
    shadowAndFrames,
    listeners,
    runtime: { frameworks: detectFrameworks() },
    metrics: {
      domNodes: elementCount,
      openShadowRoots,
      sameOriginFrames,
      crossOriginFrames,
      listenerAttachments,
      distinctListenerTypes: Object.keys(byType).length,
      stylesheets: document.styleSheets.length,
      scripts: document.scripts.length,
      htmlBytes: byteLen(html),
    },
    warnings,
    blindSpots,
  };

  // --- deliver: download capture.json --------------------------------------

  const json = JSON.stringify(capture);
  const blob = new Blob([json], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "capture.json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);

  // eslint-disable-next-line no-console
  console.log(
    "%c[page-capture]%c downloaded capture.json",
    "color:#4ea1ff;font-weight:bold",
    "color:inherit",
    {
      url: capture.url,
      metrics: capture.metrics,
      warnings: capture.warnings,
    },
  );
  return capture.metrics;
})();
