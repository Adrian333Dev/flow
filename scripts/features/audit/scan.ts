/**
 * The reader. It walks the transcripts Claude Code already writes and fills
 * the index from them.
 *
 * Nothing here intercepts anything. There is no hook, no wrapper and no
 * recorder in any path: `~/.claude/projects/<project>/<session>.jsonl` exists
 * whether Flow is installed or not, and this file only ever opens it for
 * reading.
 *
 * Three rules the shape of the data forced:
 *
 * - **Order by file position, never by timestamp.** One session resumed in two
 *   terminals interleaves its messages into a single transcript, and the
 *   timestamps then run backwards while the file stays correct.
 * - **A turn is bounded by promptId, which only user lines carry.** No
 *   assistant line has one, so a turn runs from a user line bearing a new
 *   promptId to the next such line.
 * - **A session is keyed by id, not by file.** `/cd` moves storage mid-session,
 *   so one session id can own transcripts under two project folders.
 *
 * Reading resumes from a byte offset. Transcripts only grow, so the second run
 * over a 61 MB file reads whatever was appended since the first.
 */

import fs from 'node:fs';
import * as files from './files.ts';
import { findTranscripts, readLines } from './transcripts.ts';
import { text, capped, promptText, turnSource, absolute, summarise, resultBytes, toolResultBlocks } from './transcript-fields.ts';
import { statements, forget } from './statements.ts';

/**
 * Walks one transcript from where the last run stopped, and returns what it
 * added. Every insert happens inside one transaction: a run interrupted
 * halfway leaves the bookmark where it was, and the next run redoes the file
 * rather than double-counting half of it.
 */
function indexTranscript(db, stmt, entry) {
  const stat = fs.statSync(entry.path);
  const mark = stmt.readBookmark.get(entry.path);

  const replaced = mark && (Number(mark.inode) !== stat.ino || stat.size < mark.bytes_read);
  if (replaced) forget(db, entry.path, entry.sessionId);

  const from = replaced || !mark ? 0 : mark.bytes_read;
  if (stat.size === from && mark) return { lines: 0, skipped: true };

  const resumed = !replaced && !!mark;
  let line = resumed ? mark.lines_read : 0;
  let segment = resumed ? mark.open_seg : null;
  let turn = resumed ? mark.open_turn : null;

  let segmentOrdinal = db.prepare('SELECT COUNT(*) AS n FROM segment WHERE session_id = ?')
    .get(entry.sessionId).n;
  let turnOrdinal = db.prepare('SELECT COUNT(*) AS n FROM turn WHERE session_id = ?')
    .get(entry.sessionId).n;

  // Every walk closes the turn and the segment it stopped inside, because the
  // rows have to be readable between runs. The next walk picks the same two up
  // again, totals and all: otherwise an appended tail opens a second segment
  // where the conversation had one, and nothing about the output looks wrong.
  let segmentTurns = segment == null ? 0
    : db.prepare('SELECT turns FROM segment WHERE id = ?').get(segment).turns || 0;
  let promptId = resumed ? mark.open_prompt : null;
  let head: any = null;                    // the newest line carrying session metadata
  let firstAt = null;                 // and the two timestamps that bound the walk
  let lastAt = null;
  let bytesRead = from;
  let added = 0;

  const tools = new Map();            // tool_use_id -> tool_call row id, this run
  const turnTotals = { calls: 0, errors: 0 };
  const resetTotals = () => Object.keys(turnTotals).forEach((k) => { turnTotals[k] = 0; });

  if (turn != null) {
    const carried = db.prepare('SELECT tool_calls, errors FROM turn WHERE id = ?').get(turn);
    if (carried) {
      turnTotals.calls = carried.tool_calls || 0;
      turnTotals.errors = carried.errors || 0;
    }
  }

  const closeTurn = (at, when) => {
    if (turn == null) return;
    stmt.closeTurn.run(at, when, turnTotals.calls, turnTotals.errors, turn);
    resetTotals();
    turn = null;
  };

  const openSegment = (at, when) => {
    segmentOrdinal += 1;
    segmentTurns = 0;
    segment = Number(stmt.segment.run(entry.sessionId, segmentOrdinal, at, when).lastInsertRowid);
  };

  db.exec('BEGIN');
  try {
    for (const raw of readLines(entry.path, from)) {
      bytesRead = raw.offset + raw.bytes + 1;
      line += 1;

      let e;
      try {
        e = JSON.parse(raw.text);
      } catch {
        continue;                     // a truncated line is not an event
      }
      if (!e || typeof e !== 'object') continue;

      if (e.cwd || e.version || e.gitBranch) head = e;
      if (e.timestamp) {
        if (!firstAt) firstAt = e.timestamp;
        lastAt = e.timestamp;
      }
      if (segment == null) openSegment(line, e.timestamp || null);
      else if (e.timestamp) stmt.segmentStart.run(e.timestamp, segment);

      // --- a compaction ends the segment it sits in, and opens the next one
      if (e.type === 'system' && e.subtype === 'compact_boundary') {
        const meta = e.compactMetadata || {};
        closeTurn(line, e.timestamp || null);
        stmt.closeSegment.run(line, e.timestamp || null, 'compact', meta.trigger || null,
          meta.preTokens ?? null, meta.postTokens ?? null, meta.cumulativeDroppedTokens ?? null,
          meta.durationMs ?? null, segmentTurns, segment);
        stmt.event.run(entry.sessionId, entry.path, line, raw.offset, raw.bytes, e.uuid || null,
          e.parentUuid || null, e.type, e.subtype || null, e.timestamp || null, null, segment,
          e.isSidechain ? 1 : 0, null);
        added += 1;
        openSegment(line + 1, null);
        promptId = null;
        continue;
      }

      // --- a new promptId opens a turn; tool results carry the current one
      if (e.type === 'user' && e.promptId && e.promptId !== promptId) {
        closeTurn(line - 1, e.timestamp || null);
        promptId = e.promptId;
        turnOrdinal += 1;
        segmentTurns += 1;
        const opening = promptText(e.message);
        turn = Number(stmt.turn.run(entry.sessionId, segment, promptId, turnOrdinal, line,
          e.timestamp || null, turnSource(e, opening), opening).lastInsertRowid);
      }

      const model = e.type === 'assistant' ? (e.message && e.message.model) || null : null;
      // An attachment names its kind inside the attachment, where every other
      // event names it in `subtype`. Copying it up is what lets one query ask
      // what entered context, whatever route it took.
      const subtype = e.subtype || (e.attachment && e.attachment.type) || null;
      stmt.event.run(entry.sessionId, entry.path, line, raw.offset, raw.bytes,
        e.uuid || null, e.parentUuid || null, e.type || null, subtype,
        e.timestamp || null, turn, segment, e.isSidechain ? 1 : 0, model);
      added += 1;

      // --- what the assistant spent, and what it called
      if (e.type === 'assistant') {
        // Every line of a reply carries its usage, and the largest count wins. A
        // reply opening with thinking writes its first line mid-stream, a few
        // output tokens in, and a later copy of a reply can carry all zeros.
        const usage = (e.message && e.message.usage) || {};
        const messageId = (e.message && e.message.id) || null;
        const thinking = (usage.output_tokens_details && usage.output_tokens_details.thinking_tokens) || 0;
        const request = Number(stmt.request.get(entry.sessionId, turn, segment, messageId, line,
          e.timestamp || null, model, usage.input_tokens || 0, usage.output_tokens || 0, thinking,
          usage.cache_read_input_tokens || 0, usage.cache_creation_input_tokens || 0).id);

        for (const block of (e.message && e.message.content) || []) {
          if (!block || block.type !== 'tool_use') continue;
          const input = text(block.input);
          const id = Number(stmt.tool.run(entry.sessionId, turn, segment, request, block.id || null,
            block.name || null, summarise(block.name, block.input), capped(input),
            input ? Buffer.byteLength(input) : null, line).lastInsertRowid);
          if (block.id) tools.set(block.id, { id, name: block.name, input: block.input });
          turnTotals.calls += 1;
        }
      }

      // --- what came back, and which files it moved
      // A result a mod wrote into the window, such as a restart's reads, has the
      // block alone and no `toolUseResult`.
      const blocks = e.type === 'user' ? toolResultBlocks(e.message) : [];
      if (e.type === 'user' && (e.toolUseResult !== undefined || blocks.length)) {
        const useId = blocks.length ? blocks[0].tool_use_id : null;
        const isError = blocks.some((b) => b.is_error) ? 1 : 0;
        let call = useId ? tools.get(useId) : null;
        if (!call && useId) {
          const row = stmt.findTool.get(entry.sessionId, useId);
          if (row) call = { id: row.id, name: null, input: null };
        }
        const duration = e.toolUseResult && typeof e.toolUseResult === 'object'
          ? e.toolUseResult.durationMs ?? null : null;
        if (call) {
          const result = e.toolUseResult !== undefined ? e.toolUseResult : blocks[0].content;
          stmt.toolResult.run(line, resultBytes(result), isError, duration, call.id);
          if (isError) turnTotals.errors += 1;
        }

        if (call && call.name) {
          const where = e.cwd || (head && head.cwd) || null;
          for (const t of files.fromToolCall({ name: call.name, input: call.input, result: e.toolUseResult })) {
            stmt.touch.run(entry.sessionId, turn, segment, call.id, line, absolute(t.path, where),
              t.path, t.type, t.start ?? null, t.end ?? null, t.total ?? null, t.bytes ?? null,
              t.confidence, t.via);
          }
        }
      }

      // --- content that reached context with no tool call at all
      if (e.type === 'attachment') {
        const where = e.cwd || (head && head.cwd) || null;
        for (const t of files.fromAttachment(e.attachment)) {
          stmt.touch.run(entry.sessionId, turn, segment, null, line, absolute(t.path, where),
            t.path, t.type, t.start ?? null, t.end ?? null, null, t.bytes ?? null,
            t.confidence, t.via);
        }
      }

      if (e.type === 'system' && e.subtype === 'turn_duration' && turn != null) {
        stmt.turnDuration.run(e.durationMs ?? null, e.messageCount ?? null, turn);
      }

      // --- cost is cumulative and rewritten as the session runs; the last wins
      if (e.type === 'cost-state') {
        const began = e.startTime ? new Date(e.startTime).toISOString() : null;
        stmt.session.run(entry.sessionId, entry.project, entry.machine || null, (head && head.cwd) || null,
          (head && head.gitBranch) || null, (head && head.version) || null,
          (head && head.slug) || null, began, null);
        stmt.cost.run(e.totalCostUSD ?? null, e.totalLinesAdded ?? null,
          e.totalLinesRemoved ?? null, e.totalDuration ?? null, e.totalAPIDuration ?? null,
          e.totalToolDuration ?? null, entry.sessionId);
      }
    }

    // The file ends the last turn and the last segment. What ended the session
    // (/clear, a logout, closing the terminal) is not written anywhere in
    // it, so `end` is as much as the transcript can say.
    const lastTurn = turn;
    const lastSegment = segment;
    closeTurn(line, lastAt || null);
    if (segment != null) {
      stmt.closeSegment.run(line, lastAt || null, 'end', null, null, null, null, null,
        segmentTurns, segment);
    }

    stmt.session.run(entry.sessionId, entry.project, entry.machine || null, (head && head.cwd) || null,
      (head && head.gitBranch) || null, (head && head.version) || null,
      (head && head.slug) || null, firstAt, lastAt);
    stmt.turnTokens.run(entry.sessionId);
    stmt.counts.run(entry.sessionId);

    stmt.bookmark.run(entry.path, entry.sessionId, entry.project, entry.type, entry.agentOf,
      bytesRead, line, stat.ino, stat.size, Math.round(stat.mtimeMs), lastTurn, lastSegment,
      promptId, new Date().toISOString());

    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }

  return { lines: line - (resumed ? mark.lines_read : 0), events: added, skipped: false };
}

/**
 * Every transcript, filtered to a project when one is named. Returns a summary
 * rather than printing: what to say about a run belongs to the command. Every
 * session read is tagged with `machine`, since a transcript names none.
 */
function indexAll(db, root, { project = null, machine = null, onFile = null }: { project?: string | null; machine?: string | null; onFile?: ((entry: any, one: any) => void) | null } = {}) {
  const stmt = statements(db);
  const all = findTranscripts(root).filter((t) => !project || t.project.includes(project));
  const result = { files: 0, skipped: 0, lines: 0, events: 0, sessions: new Set() };

  for (const entry of all) {
    const one = indexTranscript(db, stmt, { ...entry, machine });
    result.sessions.add(entry.sessionId);
    if (one.skipped) result.skipped += 1;
    else {
      result.files += 1;
      result.lines += one.lines;
      result.events += one.events || 0;
    }
    if (onFile) onFile(entry, one);
  }

  return result;
}

export { indexAll };
