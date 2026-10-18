#!/usr/bin/env node
/**
 * agent-rows.js: restyles each row of Claude Code's agent panel (the `subagentStatusLine` setting).
 * Reads { columns, tasks } on stdin and prints one {"id","content"} line per row:
 * what the agent does, its model and effort, time running, tokens.
 */

const MINUTE = 60

// Copied from hooks/meters.ts (MODEL_COLOURS, EFFORT_COLOURS): this file is plain Node and cannot import TypeScript.
const MODEL_COLOURS = [
  [/opus/, '#f2440c'],
  [/sonnet/, '#d97757'],
  [/haiku/, '#eaa98a'],
  [/fable/, '#14b8a6'],
]
const EFFORT_COLOURS = [
  [/^low$/, '#8b9bb4'],
  [/^medium$/, '#60a5fa'],
  [/^high$/, '#ff4d94'],
  [/^xhigh$/, '#dc2626'],
  [/^max$/, '#ff1744'],
  [/^ultra/, '#a855f7'],
]
// The context turns amber from 100k and red past 150k, the wrap-up mark of the meters.
const WARN_TOKENS = 100000
const BAD_TOKENS = 150000

const GREEN = '32'
const AMBER = '33'
const RED = '31'

const paint = (code, text) => (text ? `\x1b[${code}m${text}\x1b[0m` : '')
const rgb = (hex) => `38;2;${parseInt(hex.slice(1, 3), 16)};${parseInt(hex.slice(3, 5), 16)};${parseInt(hex.slice(5, 7), 16)}`
const pick = (table, text) => table.find(([pattern]) => pattern.test(text))?.[1]

const pad = (text, width) => (text.length > width ? `${text.slice(0, width - 1)}…` : text.padEnd(width))

// `claude-opus-5-5[1m]` as `opus 5.5`, as the meters show it.
const modelName = (id) =>
  id
    .replace(/\[.*\]$/, '')
    .replace(/^claude-/, '')
    .replace(/-(\d+)-(\d+)(?:-\d{8})?$/, ' $1.$2')
    .replace(/-/g, ' ')

// A start time in seconds or milliseconds since the epoch.
function elapsed(start, now) {
  if (!start) return ''
  const seconds = Math.max(0, Math.round((now - (start < 1e12 ? start * 1000 : start)) / 1000))
  return seconds >= MINUTE ? `${Math.floor(seconds / MINUTE)}m ${String(seconds % MINUTE).padStart(2, '0')}s` : `${seconds}s`
}

const tokenCode = (tokens) => (tokens > BAD_TOKENS ? RED : tokens >= WARN_TOKENS ? AMBER : GREEN)

/** The model, then the effort when the agent has its own, each in its meter colour. Padded to `width` cells. */
function modelCell(task, width) {
  const name = task.model ? modelName(task.model) : ''
  const effort = typeof task.effort === 'string' ? task.effort : ''
  const modelColour = pick(MODEL_COLOURS, task.model || '')
  const effortColour = pick(EFFORT_COLOURS, effort.toLowerCase())
  const shown = name + (effort ? ` ${effort}` : '')
  const painted = (modelColour ? paint(rgb(modelColour), name) : name) + (effort ? ` ${effortColour ? paint(rgb(effortColour), effort) : effort}` : '')
  return painted + ' '.repeat(Math.max(0, width - shown.length))
}

const input = JSON.parse(require('fs').readFileSync(0, 'utf8') || '{}')
const columns = input.columns || 120
const now = Date.now()
const descriptionWidth = Math.max(16, Math.min(40, columns - 60))

for (const task of input.tasks || []) {
  const tokens = task.tokenCount || 0
  const content = [
    pad(task.description || task.name || task.type || '', descriptionWidth),
    modelCell(task, 18),
    pad(elapsed(task.startTime, now), 8),
    paint(tokenCode(tokens), `${Math.round(tokens / 1000)}k`),
  ].join('  ')
  process.stdout.write(`${JSON.stringify({ id: task.id, content })}\n`)
}
