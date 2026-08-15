#!/usr/bin/env node
// description: Filtered directory tree, with each entry's own description printed beside it.
//
// Usage: ptree [path] [--depth N] [--except pattern]
//   --depth N      Limit output depth (default: unlimited)
//   --except pat   Exclude by name, folder name, or glob — repeatable
//                  Examples: --except __tests__  --except .github  --except "*.md"

const fs = require("fs");
const path = require("path");

const HIDDEN = [
  "node_modules", ".git", "dist", "build", ".next", ".turbo", "__pycache__",
  ".cache", "coverage", "out", ".svelte-kit", "temp", ".venv", "vendor", "tmp",
  ".info",
];

const CAP = 60;          // characters of description shown before the ellipsis
const WINDOW = 50;       // lines of head scanned for the marker
const HEAD_BYTES = 8192; // read per file, whatever its size — cost tracks file count only

const BINARY = /\.(png|jpe?g|gif|webp|svg|ico|pdf|zip|gz|tgz|mp4|mp3|wav|woff2?|ttf|eot|lock)$/i;

// A line counts as a comment when it opens with one of these. Nothing else is scanned,
// which is what keeps a SQL column named `description` out of the results.
const COMMENT = /^\s*(\/\/+|#+|\/\*+|\*+|<!--+|--+|;+|%+)\s?/;

// ─── arguments ───────────────────────────────────────────────────────────────

const argv = process.argv.slice(2);
let target = ".";
let maxDepth = Infinity;
const except = [];

for (let i = 0; i < argv.length; i++) {
  if (argv[i] === "--depth") maxDepth = Number(argv[++i]);
  else if (argv[i] === "--except") except.push(argv[++i]);
  else if (!argv[i].startsWith("-")) target = argv[i];
}

const globToRe = (g) =>
  new RegExp("^" + g.replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*/g, ".*").replace(/\?/g, ".") + "$");

const excluded = [...HIDDEN.map((n) => globToRe(n)), ...except.map(globToRe)];
const hidden = (name) => excluded.some((re) => re.test(name));

// ─── reading a description ───────────────────────────────────────────────────

function head(file) {
  try {
    const fd = fs.openSync(file, "r");
    const buf = Buffer.alloc(HEAD_BYTES);
    const n = fs.readSync(fd, buf, 0, HEAD_BYTES, 0);
    fs.closeSync(fd);
    return buf.subarray(0, n).toString("utf8").split("\n").slice(0, WINDOW);
  } catch {
    return [];
  }
}

// Strip the comment punctuation and any block closer, leaving the text itself.
const bare = (line) => line.replace(COMMENT, "").replace(/(-->|\*\/)\s*$/, "").trim();

function fromComment(lines) {
  for (let i = 0; i < lines.length; i++) {
    if (!COMMENT.test(lines[i])) continue;
    const m = /^description:\s*(.+)$/i.exec(bare(lines[i]));
    if (!m) continue;

    // Keep taking comment lines until the paragraph ends — a blank comment line, the
    // end of the block, or a line that is no longer a comment. Later paragraphs are
    // about something else and never belong to the description.
    const parts = [m[1]];
    for (let j = i + 1; j < lines.length; j++) {
      if (!COMMENT.test(lines[j])) break;
      const t = bare(lines[j]);
      if (!t) break;
      parts.push(t);
    }
    return parts.join(" ");
  }
  return null;
}

// Markdown is the exception: frontmatter carries no comment syntax, and `description`
// is the key Claude Code already requires in a skill's frontmatter.
function fromFrontmatter(lines) {
  if (lines[0]?.trim() !== "---") return null;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === "---") return null;
    const m = /^description:\s*(.*)$/i.exec(lines[i]);
    if (!m) continue;

    const value = m[1].trim();
    if (value && !">-|".includes(value)) return value;

    // A folded or literal block: the text sits on the indented lines below.
    const parts = [];
    for (let j = i + 1; j < lines.length; j++) {
      if (!/^\s+\S/.test(lines[j])) break;
      parts.push(lines[j].trim());
    }
    return parts.join(" ");
  }
  return null;
}

function describeFile(file) {
  if (BINARY.test(file)) return null;
  const lines = head(file);
  return file.endsWith(".md") ? fromFrontmatter(lines) || fromComment(lines) : fromComment(lines);
}

// A folder describes itself, in a file it carries, so the description survives a rename.
function describeFolder(dir) {
  try {
    const info = fs.readFileSync(path.join(dir, ".info"), "utf8").split(/\n\s*\n/)[0];
    if (info.trim()) return info.trim();
  } catch { /* no .info — fall through to the README */ }

  for (const name of ["README.md", "readme.md"]) {
    const file = path.join(dir, name);
    if (!fs.existsSync(file)) continue;
    const marked = describeFile(file);
    if (marked) return marked;
    const first = head(file).find((l) => l.trim() && !l.startsWith("#") && !l.startsWith("---"));
    if (first) return first.trim().replace(/^description:\s*/i, "");
  }
  return null;
}

// One sentence at most, one line at most. Both bounds always apply, so a runaway
// comment that happens to open with the marker can never flood the tree.
function clip(text) {
  const line = text.replace(/\s+/g, " ").trim();
  const stop = line.search(/\.(\s|$)/);
  const sentence = stop > -1 ? line.slice(0, stop + 1) : line;
  return sentence.length <= CAP ? sentence : sentence.slice(0, CAP - 1).trimEnd() + "…";
}

// ─── walking and printing ────────────────────────────────────────────────────

const out = [];
let dirs = 0;
let files = 0;

function walk(dir, prefix, depth) {
  if (depth > maxDepth) return;

  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }

  const rows = entries
    .filter((e) => !hidden(e.name))
    .sort((a, b) => Number(b.isDirectory()) - Number(a.isDirectory()) || a.name.localeCompare(b.name))
    .map((e) => {
      const full = path.join(dir, e.name);
      const isDir = e.isDirectory();
      return {
        full,
        isDir,
        label: isDir ? e.name + "/" : e.name,
        desc: isDir ? describeFolder(full) : describeFile(full),
      };
    });

  // Siblings align together, so one deep name never pushes the whole tree right.
  const width = Math.max(0, ...rows.filter((r) => r.desc).map((r) => r.label.length));

  rows.forEach((row, i) => {
    const last = i === rows.length - 1;
    row.isDir ? dirs++ : files++;
    out.push(prefix + (last ? "└── " : "├── ") +
      (row.desc ? row.label.padEnd(width) + "   // " + clip(row.desc) : row.label));
    if (row.isDir) walk(row.full, prefix + (last ? "    " : "│   "), depth + 1);
  });
}

if (!fs.existsSync(target)) {
  console.error(`ptree: no such path — ${target}`);
  process.exit(1);
}

out.push(target);
walk(target, "", 1);
out.push("", `${dirs} ${dirs === 1 ? "directory" : "directories"}, ${files} ${files === 1 ? "file" : "files"}`);
console.log(out.join("\n"));
