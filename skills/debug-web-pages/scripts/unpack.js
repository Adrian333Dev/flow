#!/usr/bin/env node
/*
 * page-capture — unpack (Slice 1)
 * -------------------------------
 * Explodes a downloaded `capture.json` (produced by tools/capture.js) into
 * a bundle directory an agent can read.
 *
 * Usage:
 *   node .claude/skills/debug-web-pages/tools/unpack.js <capture.json> [-o <outDir>]
 *
 *   <capture.json>   path to the file the console snippet downloaded
 *   -o, --out <dir>  base directory for bundles (default: ./captures in the CWD)
 *
 * Produces:  <outDir>/<slug>-<YYYY-MM-DD-HHMMSS>/
 *   README.md  manifest.json  page.html  shadow-and-frames.json  listeners.json
 *   runtime.json  meta/capture.raw.json
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const HERE = path.dirname(fileURLToPath(import.meta.url));
// Bundles are per-investigation artifacts — they belong to the project you're
// debugging, NOT inside this (reusable) skill. Default to ./captures in the CWD;
// override with -o. HERE is kept only for resolving skill-local assets.
void HERE;
const DEFAULT_OUT = path.resolve(process.cwd(), "captures");

function parseArgs(argv) {
  const args = { input: null, out: DEFAULT_OUT };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "-o" || a === "--out") args.out = path.resolve(argv[++i]);
    else if (a === "-h" || a === "--help") args.help = true;
    else if (!args.input) args.input = path.resolve(a);
  }
  return args;
}

function slugify(url) {
  let base = url;
  try {
    const u = new URL(url);
    base = `${u.host}${u.pathname}`;
  } catch {
    /* leave as-is */
  }
  return (
    base
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "page"
  );
}

function stamp(iso) {
  const d = iso ? new Date(iso) : new Date();
  const p = (n) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}-` +
    `${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`
  );
}

function buildManifest(cap, files) {
  return {
    schemaVersion: cap.schemaVersion ?? 1,
    url: cap.url,
    title: cap.title,
    capturedAt: cap.capturedAt,
    backends: [cap.backend].filter(Boolean),
    userAgent: cap.userAgent,
    viewport: cap.viewport,
    metrics: cap.metrics,
    files,
    warnings: cap.warnings ?? [],
    blindSpots: cap.blindSpots ?? [],
  };
}

function renderReadme(cap, files) {
  const m = cap.metrics || {};
  const listTypes = Object.keys(cap.listeners?.byType || {});
  const fw = Object.keys(cap.runtime?.frameworks || {}).filter(
    (k) => k !== "frameworkGlobals" && k !== "youtubeGlobals",
  );
  const lines = [
    `# Capture: ${cap.title || cap.url}`,
    "",
    `- **URL:** ${cap.url}`,
    `- **Captured:** ${cap.capturedAt}`,
    `- **Backend(s):** ${[cap.backend].filter(Boolean).join(", ")}`,
    `- **User agent:** ${cap.userAgent || "—"}`,
    "",
    "## What's here",
    "",
    ...files.map((f) => `- \`${f.path}\` — ${f.desc}`),
    "",
    "## At a glance",
    "",
    `- DOM nodes: ${m.domNodes ?? "?"} (open shadow roots: ${m.openShadowRoots ?? 0}, same-origin iframes: ${m.sameOriginFrames ?? 0}, cross-origin iframes: ${m.crossOriginFrames ?? 0})`,
    `- Listener attachments: ${m.listenerAttachments ?? "?"} across ${listTypes.length} event types: ${listTypes.join(", ") || "—"}`,
    `- Stylesheets: ${m.stylesheets ?? "?"} · Scripts: ${m.scripts ?? "?"} · HTML bytes: ${m.htmlBytes ?? "?"}`,
    `- Detected: ${fw.join(", ") || "none"}`,
    "",
    "## Start here",
    "",
    "- Structure & content (scraping) → `page.html` (lossless light DOM).",
    "- Content inside web components / embeds → `shadow-and-frames.json` (open shadow roots + same-origin iframes; `page.html` can't hold these).",
    "- Behavior / event handling → `listeners.json` (grouped by event type + identical handler; see `blindSpots`).",
    "- Runtime / framework state → `runtime.json`.",
    "",
    "## How to query this bundle",
    "",
    "These files are multi-MB. **Query them — don't read them whole into context.**",
    "",
    "- **`page.html`** — text/attribute lookups with `grep`/`rg` (it's real, newline'd HTML). For structural queries or text extraction, parse it in Node with `cheerio` or `linkedom` and use `querySelectorAll`/`.textContent`. Do NOT try to re-execute the page's own JS against this static file — it expects the live origin and will just error.",
    "- **`shadow-and-frames.json`** — `jq` to list `.[].hostPath` / `.kind`, then treat each `.html` value like `page.html`.",
    "- **`listeners.json`** — `jq` (e.g. `.byType.keydown` for keyboard handlers; `.byNode[\"<css-path>\"]` for one node). Grouped by identical handler, so counts collapse duplicates.",
    "- **`runtime.json` / `manifest.json`** — `jq`.",
    "",
  ];
  if ((cap.warnings || []).length) {
    lines.push("## Warnings", "", ...cap.warnings.map((w) => `- ⚠️ ${w}`), "");
  }
  if ((cap.blindSpots || []).length) {
    lines.push(
      "## Blind spots",
      "",
      ...cap.blindSpots.map((b) => `- ${b}`),
      "",
    );
  }
  return lines.join("\n");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.input) {
    process.stdout.write(
      "Usage: node .claude/skills/debug-web-pages/tools/unpack.js <capture.json> [-o <outDir>]\n",
    );
    process.exit(args.input ? 0 : 1);
  }

  let cap;
  try {
    cap = JSON.parse(await readFile(args.input, "utf8"));
  } catch (e) {
    process.stderr.write(`Failed to read/parse ${args.input}: ${e.message}\n`);
    process.exit(1);
  }

  const dirName = `${slugify(cap.url || "page")}-${stamp(cap.capturedAt)}`;
  const outDir = path.join(args.out, dirName);
  await mkdir(path.join(outDir, "meta"), { recursive: true });

  const files = [
    { path: "page.html", layer: "html", desc: "full light-DOM HTML (outerHTML of <html>) — the lossless source for structure & content" },
    { path: "shadow-and-frames.json", layer: "shadow", desc: "lossless HTML for open shadow roots & same-origin iframes — the content page.html physically can't hold" },
    { path: "listeners.json", layer: "listeners", desc: "event listeners grouped by type + identical handler source, with CSS-path locators" },
    { path: "runtime.json", layer: "runtime", desc: "framework/site detection and runtime notes" },
    { path: "meta/capture.raw.json", layer: "meta", desc: "raw producer output (provenance)" },
  ];

  const manifest = buildManifest(cap, files);

  const writeJson = (rel, obj) =>
    writeFile(path.join(outDir, rel), JSON.stringify(obj, null, 2));

  await Promise.all([
    writeFile(path.join(outDir, "page.html"), cap.html ?? ""),
    writeJson("shadow-and-frames.json", cap.shadowAndFrames ?? []),
    writeJson("listeners.json", cap.listeners ?? {}),
    writeJson("runtime.json", cap.runtime ?? {}),
    writeJson("meta/capture.raw.json", cap),
    writeJson("manifest.json", manifest),
    writeFile(path.join(outDir, "README.md"), renderReadme(cap, files)),
  ]);

  process.stdout.write(`Bundle written: ${outDir}\n`);
  const m = cap.metrics || {};
  process.stdout.write(
    `  ${m.domNodes ?? "?"} nodes · ${m.openShadowRoots ?? 0} shadow roots · ` +
      `${m.listenerAttachments ?? "?"} listeners · ${(cap.warnings || []).length} warning(s)\n`,
  );
}

main();
