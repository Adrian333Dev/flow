#!/usr/bin/env node
import { readFileSync, existsSync, readdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { homedir, tmpdir } from 'os';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

let config = {
  trigger: { mode: 'threshold', threshold: 90, interval: 10 },
  display: { fields: ['used_pct', 'remaining_pct'] }
};
try {
  config = JSON.parse(readFileSync(join(__dirname, 'config.json'), 'utf8'));
} catch {}

const chunks = [];
for await (const chunk of process.stdin) chunks.push(chunk);
const raw = Buffer.concat(chunks).toString('utf8').trim();

let payload = {};
try { payload = JSON.parse(raw); } catch { process.exit(0); }

const { session_id, hook_event_name = 'PostToolUse', transcript_path, cwd } = payload;
if (!session_id) process.exit(0);

function findJsonl() {
  if (transcript_path && existsSync(transcript_path)) return transcript_path;

  const claudeDir = process.env.CLAUDE_CONFIG_DIR || join(homedir(), '.claude');
  const projectsDir = join(claudeDir, 'projects');

  if (cwd) {
    const encoded = cwd.replace(/\//g, '-');
    const candidate = join(projectsDir, encoded, `${session_id}.jsonl`);
    if (existsSync(candidate)) return candidate;
  }

  try {
    for (const dir of readdirSync(projectsDir)) {
      const candidate = join(projectsDir, dir, `${session_id}.jsonl`);
      if (existsSync(candidate)) return candidate;
    }
  } catch {}

  return null;
}

function getContextUsage(jsonlPath) {
  const lines = readFileSync(jsonlPath, 'utf8').trim().split('\n').filter(Boolean);

  for (const line of [...lines].reverse()) {
    try {
      const entry = JSON.parse(line);
      const msg = entry.message;
      if (msg?.role === 'assistant' && msg?.usage) {
        const u = msg.usage;
        const totalTokens = (u.input_tokens || 0)
          + (u.cache_read_input_tokens || 0)
          + (u.cache_creation_input_tokens || 0);
        const windowSize = config.display?.windowSize
          ?? ((msg.model || '').includes('[1m]') ? 1_000_000 : 200_000);
        const usedPct = Math.min(100, (totalTokens / windowSize) * 100);
        return { totalTokens, windowSize, usedPct, remainingPct: 100 - usedPct };
      }
    } catch {}
  }
  return null;
}

function shouldInject(usedPct) {
  const { mode, threshold = 90, interval = 10 } = config.trigger || {};

  if (mode === 'every') return true;

  if (mode === 'threshold') return usedPct >= threshold;

  if (mode === 'heartbeat') {
    const counterFile = join(tmpdir(), `ctx-pulse-${session_id}.n`);
    let count = 0;
    try { count = parseInt(readFileSync(counterFile, 'utf8')) || 0; } catch {}
    count++;
    try { writeFileSync(counterFile, String(count)); } catch {}
    return count % interval === 0;
  }

  return false;
}

function formatCard(ctx) {
  const fields = config.display?.fields ?? ['used_pct', 'remaining_pct'];
  const parts = [];

  for (const f of fields) {
    if (f === 'used_pct')         parts.push(`${ctx.usedPct.toFixed(1)}% used`);
    if (f === 'remaining_pct')    parts.push(`${ctx.remainingPct.toFixed(1)}% remaining`);
    if (f === 'tokens_used')      parts.push(`${Math.round(ctx.totalTokens / 1000)}k tokens`);
    if (f === 'tokens_remaining') parts.push(`${Math.round((ctx.windowSize - ctx.totalTokens) / 1000)}k remaining`);
  }

  return `[CONTEXT PULSE] ${parts.join(' | ')}`;
}

try {
  const jsonlPath = findJsonl();
  if (!jsonlPath) process.exit(0);

  const ctx = getContextUsage(jsonlPath);
  if (!ctx) process.exit(0);

  if (shouldInject(ctx.usedPct)) {
    process.stdout.write(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: hook_event_name,
        additionalContext: formatCard(ctx)
      }
    }) + '\n');
  }
} catch {
  process.exit(0);
}
