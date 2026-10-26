#!/usr/bin/env node
// Checks the restart's dialogue builder over recorded windows, with no model call: every message
// the user typed and every reply the agent showed must appear in the built dialogue, word for
// word and in order. Usage: node lab/scripts/check-restart-dialogue.mjs [transcript.jsonl ...]
// With no argument it reads every transcript of this project under ~/.claude/projects.
import { readdirSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { dialogueOf } from '../../mods/flow-session/hooks/dialogue.ts'

const RESTART_TOOL = 'mcp__flow-session__restart'
const folder = join(homedir(), '.claude/projects/-home-me-code-flow-dev')
const files = process.argv.length > 2 ? process.argv.slice(2) : readdirSync(folder).filter((f) => f.endsWith('.jsonl')).map((f) => join(folder, f))

const blocks = (entry) => (typeof entry.message?.content === 'string' ? [{ type: 'text', text: entry.message.content }] : (entry.message?.content ?? []))

/** An entry as the host lists a message: its text blocks joined, its calls, its results. */
function messageOf(entry) {
  const parts = blocks(entry)
  return {
    role: entry.type,
    text: parts.filter((p) => p.type === 'text').map((p) => p.text).join('\n'),
    toolUses: parts.filter((p) => p.type === 'tool_use').map((p) => ({ tool_use_id: p.id, tool: p.name, input: p.input ?? {} })),
    toolResults: parts.filter((p) => p.type === 'tool_result').map((p) => ({ tool_use_id: p.tool_use_id, text: '', isError: false })),
  }
}

/** The user's typed messages and the agent's replies of a window, as the transcript recorded them. */
function expectedOf(window) {
  return window.flatMap((entry) => {
    if (entry.type === 'user') return entry.origin?.kind === 'human' && !entry.isMeta && !blocks(entry).some((p) => p.type === 'tool_result') ? [messageOf(entry).text] : []
    return blocks(entry).filter((p) => p.type === 'text' && p.text.trim()).map((p) => p.text)
  }).filter((text) => text.trim() && !/^<(command-name>|local-command-)/.test(text.trim()))
}

let windows = 0
let missing = 0
for (const file of files) {
  // A transcript line the host padded or cut is not JSON: it holds no message.
  const entries = readFileSync(file, 'utf8').split('\n').filter(Boolean).flatMap((line) => {
    try {
      return [JSON.parse(line)]
    } catch {
      return []
    }
  })
  let window = []
  const close = () => {
    const kept = window.filter((e) => (e.type === 'user' || e.type === 'assistant') && !e.isSidechain)
    window = []
    if (!kept.length) return
    windows++
    const { text } = dialogueOf(kept.map(messageOf), RESTART_TOOL)
    let at = 0
    for (const wanted of expectedOf(kept)) {
      const found = text.indexOf(wanted, at)
      if (found < 0) {
        missing++
        console.log(`MISSING in ${file.split('/').pop()} window ${windows}: ${JSON.stringify(wanted.slice(0, 80))}`)
      } else at = found + wanted.length
    }
  }
  for (const entry of entries) {
    if (entry.type === 'system' && entry.subtype === 'compact_boundary') close()
    else window.push(entry)
  }
  close()
}
console.log(`${windows} windows checked, ${missing} messages missing`)
process.exit(missing ? 1 : 0)
