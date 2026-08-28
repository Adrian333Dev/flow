#!/usr/bin/env node
/**
 * merge-files — Merge files/folders into a single LLM-friendly output streamed to stdout.
 *
 * Each file becomes a fenced code block: ```lang path/to/file
 * Consecutive blank lines are collapsed to one.
 * If total output exceeds 2000 lines, prints a warning with per-file line counts instead.
 * Pass --force to bypass the limit.
 *
 * Usage: node docs/commands/merge-files.js [options] <path1> [path2] ...
 *
 * Options:
 *   --ext ts,tsx,md    Include only files with these extensions (comma-separated)
 *   --except pattern   Exclude files matching this glob (repeatable)
 *   --force            Output even if over the 2000-line limit
 *
 * Paths can be files, folders (recursive), or shell-expanded globs. Run from project root.
 *
 * TODO: --strip-comments opt-in flag (risky for TS: @ts-ignore, declare const, type comments)
 */

const fs = require('fs');
const path = require('path');

const LINE_LIMIT = 2000;

const EXT_TO_LANG = {
  '.ts': 'typescript', '.tsx': 'tsx',
  '.js': 'javascript', '.jsx': 'jsx', '.mjs': 'javascript', '.cjs': 'javascript',
  '.md': 'markdown', '.mdx': 'mdx',
  '.json': 'json', '.css': 'css', '.scss': 'scss',
  '.html': 'html', '.sql': 'sql', '.py': 'python',
  '.sh': 'shell', '.yaml': 'yaml', '.yml': 'yaml',
};

const DEFAULT_EXCLUDE_SEGMENTS = new Set([
  '.git', 'node_modules', 'dist', '.turbo', '__pycache__',
  'temp', 'tmp', '.tmp', '.temp', '.venv', 'vendor',
]);

const ASSET_EXTENSIONS = new Set([
  '.gif', '.png', '.jpg', '.jpeg', '.webp', '.ico', '.bmp', '.tiff',
  '.mp3', '.wav', '.ogg', '.m4a', '.flac', '.aac',
  '.mp4', '.webm', '.mov', '.avi', '.mkv',
  '.woff', '.woff2', '.ttf', '.otf', '.eot',
  '.pdf', '.zip', '.tar', '.gz', '.7z', '.rar',
]);

const EXCLUDED_BASENAMES = new Set(['.DS_Store', 'Thumbs.db', 'desktop.ini']);

function matchesGlob(relPath, pattern) {
  const p = pattern.trim();
  if (!p) return false;
  if (!p.includes('*')) {
    // exact path match, or any path segment (catches both basenames and folder names)
    return relPath === p || relPath.split('/').includes(p);
  }
  const reStr = p
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*/g, '\x00')
    .replace(/\*/g, '[^/]*')
    .replace(/\x00/g, '.*');
  return new RegExp('^' + reStr + '$').test(relPath);
}

function walkDir(dirPath, dirRel, seen, result) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const e of entries) {
    const rel = dirRel ? `${dirRel}/${e.name}` : e.name;
    if (e.isDirectory()) {
      if (!DEFAULT_EXCLUDE_SEGMENTS.has(e.name)) walkDir(path.join(dirPath, e.name), rel, seen, result);
    } else if (e.isFile() && !seen.has(rel)) {
      seen.add(rel);
      result.push(rel);
    }
  }
}

function collectFiles(pathArgs) {
  const cwd = process.cwd();
  const seen = new Set();
  const result = [];
  for (const arg of pathArgs) {
    const resolved = path.resolve(cwd, arg);
    if (!fs.existsSync(resolved)) {
      process.stderr.write(`Warning: skipping missing path: ${arg}\n`);
      continue;
    }
    const stat = fs.statSync(resolved);
    if (stat.isFile()) {
      const rel = path.relative(cwd, resolved).replace(/\\/g, '/');
      if (!seen.has(rel)) { seen.add(rel); result.push(rel); }
    } else if (stat.isDirectory()) {
      const dirRel = path.relative(cwd, resolved).replace(/\\/g, '/');
      walkDir(resolved, dirRel, seen, result);
    }
  }
  return result.sort();
}

function applyFilters(files, extList, exceptPatterns) {
  return files.filter((rel) => {
    if (EXCLUDED_BASENAMES.has(path.basename(rel))) return false;
    const ext = path.extname(rel).toLowerCase();
    if (ASSET_EXTENSIONS.has(ext)) return false;
    if (extList.length > 0 && !extList.includes(ext)) return false;
    if (exceptPatterns.some((p) => matchesGlob(rel, p))) return false;
    return true;
  });
}

function collapseBlankLines(content) {
  return content.replace(/\n(\s*\n){2,}/g, '\n\n');
}

function countLines(str) {
  return str.split('\n').length;
}

function parseArgs() {
  const args = process.argv.slice(2);
  const pathArgs = [];
  const extList = [];
  const exceptPatterns = [];
  let force = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--ext' && args[i + 1]) {
      extList.push(...args[++i].split(',').map((e) => {
        const t = e.trim();
        return t.startsWith('.') ? t : '.' + t;
      }).filter(Boolean));
    } else if (args[i] === '--except' && args[i + 1]) {
      exceptPatterns.push(args[++i]);
    } else if (args[i] === '--force') {
      force = true;
    } else if (!args[i].startsWith('--')) {
      pathArgs.push(args[i]);
    }
  }

  return { pathArgs, extList, exceptPatterns, force };
}

function main() {
  const { pathArgs, extList, exceptPatterns, force } = parseArgs();

  if (pathArgs.length === 0) {
    process.stderr.write(
      'Usage: node docs/commands/merge-files.js [--ext ts,tsx] [--except pattern] [--force] <path1> [path2] ...\n'
    );
    process.exit(1);
  }

  const allFiles = collectFiles(pathArgs);
  const files = applyFilters(allFiles, extList, exceptPatterns);

  if (files.length === 0) {
    process.stdout.write('No files matched after filtering.\n');
    return;
  }

  const entries = files.map((rel) => {
    const fullPath = path.resolve(process.cwd(), rel);
    const raw = fs.readFileSync(fullPath, 'utf8');
    const content = collapseBlankLines(raw.trimEnd());
    const lang = EXT_TO_LANG[path.extname(rel).toLowerCase()] ?? '';
    const opener = lang ? `\`\`\`${lang} ${rel}` : `\`\`\` ${rel}`;
    const block = `${opener}\n${content}\n\`\`\``;
    return { rel, block };
  });

  const totalLines = entries.reduce((sum, e) => sum + countLines(e.block), 0);

  if (totalLines > LINE_LIMIT && !force) {
    const lines = [
      `Output too large: ${totalLines} lines (limit ${LINE_LIMIT}). Use --force to output anyway.\n`,
      'Files:',
    ];
    for (const e of entries) {
      const lc = countLines(e.block);
      lines.push(`  ${String(lc).padStart(5)} lines  ${e.rel}`);
    }
    lines.push(`\n  Total: ${totalLines} lines`);
    process.stdout.write(lines.join('\n') + '\n');
    return;
  }

  process.stdout.write(entries.map((e) => e.block).join('\n\n') + '\n');
}

main();
