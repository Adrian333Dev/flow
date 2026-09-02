'use strict';
/**
 * The reader. It walks the transcripts Claude Code already writes and fills
 * the index from them.
 *
 * Nothing here intercepts anything. There is no hook, no wrapper and no
 * recorder in any path — `~/.claude/projects/<project>/<session>.jsonl` exists
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

const fs = require('fs');
const os = require('os');
const path = require('path');
const files = require('./files');

const NL = 0x0a;

// The opening text of a turn, kept long enough to recognise and short enough
// that a thousand of them still print.
const PROMPT_CHARS = 400;

// ---------------------------------------------------------------- finding

/**
 * Every transcript under the projects directory, session files and subagent
 * files alike. A subagent gets its own transcript beside its parent's, and it
 * is indexed as its own session so a query can ask what a subagent did.
 */
function findTranscripts(root) {
  const found = [];
  if (!fs.existsSync(root)) return found;

  for (const project of fs.readdirSync(root, { withFileTypes: true })) {
    if (!project.isDirectory()) continue;
    const dir = path.join(root, project.name);

    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isFile() && entry.name.endsWith('.jsonl')) {
        found.push({
          path: path.join(dir, entry.name),
          project: project.name,
          sessionId: entry.name.replace(/\.jsonl$/, ''),
          kind: 'session',
          agentOf: null,
        });
        continue;
      }
      if (!entry.isDirectory()) continue;

      const subagents = path.join(dir, entry.name, 'subagents');
      if (!fs.existsSync(subagents)) continue;
      for (const agent of fs.readdirSync(subagents)) {
        if (!agent.endsWith('.jsonl')) continue;
        found.push({
          path: path.join(subagents, agent),
          project: project.name,
          sessionId: agent.replace(/\.jsonl$/, ''),
          kind: 'subagent',
          agentOf: entry.name,
        });
      }
    }
  }

  return found.sort((a, b) => a.path.localeCompare(b.path));
}

// ---------------------------------------------------------------- lines

/**
 * Yields one complete line at a time with the byte offset it started at,
 * beginning at `from`. Splitting on the newline byte is safe on UTF-8: 0x0a
 * never appears inside a multi-byte sequence.
 *
 * A trailing fragment is not yielded and not counted. The file is being
 * appended to right now in the session that is running, and half a JSON object
 * is not an event yet.
 */
function* readLines(file, from) {
  const fd = fs.openSync(file, 'r');
  try {
    const size = fs.fstatSync(fd).size;
    const chunk = Buffer.allocUnsafe(1 << 20);
    let carry = Buffer.alloc(0);
    let offset = from;

    while (offset < size) {
      const read = fs.readSync(fd, chunk, 0, chunk.length, offset);
      if (read <= 0) break;
      let buffer = carry.length ? Buffer.concat([carry, chunk.subarray(0, read)]) : Buffer.from(chunk.subarray(0, read));
      const base = offset - carry.length;
      let start = 0;
      let at;
      while ((at = buffer.indexOf(NL, start)) !== -1) {
        yield { offset: base + start, bytes: at - start, text: buffer.toString('utf8', start, at) };
        start = at + 1;
      }
      carry = Buffer.from(buffer.subarray(start));
      offset += read;
    }
  } finally {
    fs.closeSync(fd);
  }
}

// ---------------------------------------------------------------- helpers

const text = (v) => (typeof v === 'string' ? v : v == null ? null : JSON.stringify(v));

// A Write call carries the whole file in its input, so storing every input
// whole copies the repository into the index. The full text is one line range
// away in the transcript; what the index is for is finding which call to open.
const INPUT_CHARS = 4000;
const capped = (s) => (s && s.length > INPUT_CHARS ? s.slice(0, INPUT_CHARS) + ' …' : s);

/** The first words a turn opened with, whatever shape the message took. */
function promptText(message) {
  if (!message) return null;
  const content = message.content;
  if (typeof content === 'string') return content.slice(0, PROMPT_CHARS);
  if (!Array.isArray(content)) return null;
  const parts = [];
  for (const block of content) {
    if (block && block.type === 'text' && block.text) parts.push(block.text);
  }
  return parts.length ? parts.join('\n').slice(0, PROMPT_CHARS) : null;
}

/**
 * Where a turn came from. Claude Code writes `promptSource` for a typed or
 * queued prompt and nothing at all for a slash command, so the command is read
 * out of the text it inserted.
 */
function turnSource(e, opening) {
  if (e.isCompactSummary) return 'compact';
  if (e.promptSource) return e.promptSource;
  if (opening && opening.includes('<command-name>')) return 'command';
  if (e.isMeta) return 'meta';
  return null;
}

/**
 * One name per file, so the same file read twice counts twice.
 *
 * `Read` reports an absolute path and `cat backlog.md` reports a relative one,
 * and left alone the index holds `backlog.md` and
 * `/home/me/code/flow/backlog.md` as two different files. Every event carries
 * the directory it ran in, which is what resolves the second into the first.
 */
function absolute(file, cwd) {
  if (!file) return file;
  if (path.isAbsolute(file)) return path.normalize(file);
  if (file.startsWith('~/')) return path.join(os.homedir(), file.slice(2));
  return cwd ? path.resolve(cwd, file) : file;
}

/** A one-line handle for a tool call, so a listing reads without opening the input. */
function summarise(name, input) {
  if (!input || typeof input !== 'object') return null;
  const first =
    input.command || input.file_path || input.notebook_path || input.pattern ||
    input.query || input.url || input.path || input.prompt || input.skill;
  return typeof first === 'string' ? first.replace(/\s+/g, ' ').slice(0, 200) : null;
}

function resultBytes(result) {
  if (result == null) return null;
  if (typeof result === 'string') return Buffer.byteLength(result);
  try {
    return Buffer.byteLength(JSON.stringify(result));
  } catch {
    return null;
  }
}

/** The user line that carries a tool result names the call it answers. */
function toolResultBlocks(message) {
  const content = message && message.content;
  if (!Array.isArray(content)) return [];
  return content.filter((b) => b && b.type === 'tool_result');
}

// ---------------------------------------------------------------- writing

function statements(db) {
  return {
    event: db.prepare(`INSERT INTO event
      (session_id, transcript, line, offset, bytes, uuid, parent_uuid, type, subtype,
       timestamp, turn_id, segment_id, sidechain, model)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`),
    segment: db.prepare(`INSERT INTO segment (session_id, ordinal, first_line, started_at)
      VALUES (?,?,?,?)`),
    segmentStart: db.prepare('UPDATE segment SET started_at = ? WHERE id = ? AND started_at IS NULL'),
    closeSegment: db.prepare(`UPDATE segment SET last_line = ?, ended_at = ?, ended_by = ?,
      trigger = ?, pre_tokens = ?, post_tokens = ?, dropped_tokens = ?, compact_ms = ?,
      turns = ? WHERE id = ?`),
    turn: db.prepare(`INSERT INTO turn
      (session_id, segment_id, prompt_id, ordinal, first_line, started_at, source, prompt)
      VALUES (?,?,?,?,?,?,?,?)`),
    closeTurn: db.prepare(`UPDATE turn SET last_line = ?, ended_at = ?, input_tokens = ?,
      output_tokens = ?, thinking_tokens = ?, cache_read = ?, cache_write = ?,
      tool_calls = ?, errors = ? WHERE id = ?`),
    turnDuration: db.prepare('UPDATE turn SET duration_ms = ?, messages = ? WHERE id = ?'),
    tool: db.prepare(`INSERT INTO tool_call
      (session_id, turn_id, segment_id, tool_use_id, name, summary, input, input_bytes, call_line)
      VALUES (?,?,?,?,?,?,?,?,?)`),
    toolResult: db.prepare(`UPDATE tool_call SET result_line = ?, result_bytes = ?,
      is_error = ?, duration_ms = ? WHERE id = ?`),
    findTool: db.prepare('SELECT id FROM tool_call WHERE session_id = ? AND tool_use_id = ?'),
    touch: db.prepare(`INSERT INTO file_touch
      (session_id, turn_id, segment_id, tool_call_id, line, path, given, kind, start_line,
       end_line, total_lines, bytes, confidence, via)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`),
    session: db.prepare(`INSERT INTO session (id, project, cwd, git_branch, version, slug, started_at, ended_at)
      VALUES (?,?,?,?,?,?,?,?)
      ON CONFLICT(id) DO UPDATE SET
        cwd = excluded.cwd, git_branch = excluded.git_branch, version = excluded.version,
        slug = COALESCE(excluded.slug, session.slug),
        started_at = MIN(COALESCE(session.started_at, excluded.started_at),
                         COALESCE(excluded.started_at, session.started_at)),
        ended_at   = MAX(COALESCE(session.ended_at, excluded.ended_at),
                         COALESCE(excluded.ended_at, session.ended_at))`),
    // Only what a transcript states outright. Tokens are left out on purpose:
    // a cost-state line exists in 9 of the 51 sessions on this machine, and
    // the turn sums cover all 51 from the same usage blocks.
    cost: db.prepare(`UPDATE session SET cost_usd = ?, lines_added = ?, lines_removed = ?,
      duration_ms = ?, api_ms = ?, tool_ms = ? WHERE id = ?`),
    counts: db.prepare(`UPDATE session SET
      events = (SELECT COUNT(*) FROM event WHERE session_id = session.id),
      turns = (SELECT COUNT(*) FROM turn WHERE session_id = session.id),
      segments = (SELECT COUNT(*) FROM segment WHERE session_id = session.id),
      tool_calls = (SELECT COUNT(*) FROM tool_call WHERE session_id = session.id),
      errors = (SELECT COUNT(*) FROM tool_call WHERE session_id = session.id AND is_error = 1),
      input_tokens  = (SELECT SUM(input_tokens)  FROM turn WHERE session_id = session.id),
      output_tokens = (SELECT SUM(output_tokens) FROM turn WHERE session_id = session.id),
      cache_read    = (SELECT SUM(cache_read)    FROM turn WHERE session_id = session.id),
      cache_write   = (SELECT SUM(cache_write)   FROM turn WHERE session_id = session.id)
      WHERE id = ?`),
    bookmark: db.prepare(`INSERT INTO transcript
      (path, session_id, project, kind, agent_of, bytes_read, lines_read, inode, size, mtime,
       open_turn, open_seg, open_prompt, indexed_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
      ON CONFLICT(path) DO UPDATE SET
        bytes_read = excluded.bytes_read, lines_read = excluded.lines_read,
        inode = excluded.inode, size = excluded.size, mtime = excluded.mtime,
        open_turn = excluded.open_turn, open_seg = excluded.open_seg,
        open_prompt = excluded.open_prompt, indexed_at = excluded.indexed_at`),
    readBookmark: db.prepare('SELECT * FROM transcript WHERE path = ?'),
  };
}

/**
 * Throws away everything derived from one transcript. Only reached when the
 * file was replaced rather than appended to — a shrinking file or a new inode
 * means the byte offset points at the wrong place, and half-correct rows are
 * worse than none.
 */
function forget(db, file, sessionId) {
  db.prepare('DELETE FROM event WHERE transcript = ?').run(file);
  const orphaned = db.prepare('SELECT COUNT(*) AS n FROM event WHERE session_id = ?').get(sessionId);
  if (!orphaned || orphaned.n === 0) {
    for (const table of ['tool_call', 'file_touch', 'turn', 'segment']) {
      db.prepare(`DELETE FROM ${table} WHERE session_id = ?`).run(sessionId);
    }
    db.prepare('DELETE FROM session WHERE id = ?').run(sessionId);
  }
  db.prepare('DELETE FROM transcript WHERE path = ?').run(file);
}

// ---------------------------------------------------------------- walking

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
  // again, totals and all — otherwise an appended tail opens a second segment
  // where the conversation had one, and nothing about the output looks wrong.
  let segmentTurns = segment == null ? 0
    : db.prepare('SELECT turns FROM segment WHERE id = ?').get(segment).turns || 0;
  let promptId = resumed ? mark.open_prompt : null;
  let head = null;                    // the newest line carrying session metadata
  let firstAt = null;                 // and the two timestamps that bound the walk
  let lastAt = null;
  let bytesRead = from;
  let added = 0;

  const tools = new Map();            // tool_use_id -> tool_call row id, this run
  const turnTotals = { input: 0, output: 0, thinking: 0, cacheRead: 0, cacheWrite: 0, calls: 0, errors: 0 };
  const resetTotals = () => Object.keys(turnTotals).forEach((k) => { turnTotals[k] = 0; });

  if (turn != null) {
    const carried = db.prepare(`SELECT input_tokens, output_tokens, thinking_tokens, cache_read,
      cache_write, tool_calls, errors FROM turn WHERE id = ?`).get(turn);
    if (carried) {
      turnTotals.input = carried.input_tokens || 0;
      turnTotals.output = carried.output_tokens || 0;
      turnTotals.thinking = carried.thinking_tokens || 0;
      turnTotals.cacheRead = carried.cache_read || 0;
      turnTotals.cacheWrite = carried.cache_write || 0;
      turnTotals.calls = carried.tool_calls || 0;
      turnTotals.errors = carried.errors || 0;
    }
  }

  const closeTurn = (at, when) => {
    if (turn == null) return;
    stmt.closeTurn.run(at, when, turnTotals.input, turnTotals.output, turnTotals.thinking,
      turnTotals.cacheRead, turnTotals.cacheWrite, turnTotals.calls, turnTotals.errors, turn);
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
        const usage = (e.message && e.message.usage) || {};
        turnTotals.input += usage.input_tokens || 0;
        turnTotals.output += usage.output_tokens || 0;
        turnTotals.thinking += (usage.output_tokens_details && usage.output_tokens_details.thinking_tokens) || 0;
        turnTotals.cacheRead += usage.cache_read_input_tokens || 0;
        turnTotals.cacheWrite += usage.cache_creation_input_tokens || 0;

        for (const block of (e.message && e.message.content) || []) {
          if (!block || block.type !== 'tool_use') continue;
          const input = text(block.input);
          const id = Number(stmt.tool.run(entry.sessionId, turn, segment, block.id || null,
            block.name || null, summarise(block.name, block.input), capped(input),
            input ? Buffer.byteLength(input) : null, line).lastInsertRowid);
          if (block.id) tools.set(block.id, { id, name: block.name, input: block.input });
          turnTotals.calls += 1;
        }
      }

      // --- what came back, and which files it moved
      if (e.type === 'user' && e.toolUseResult !== undefined) {
        const blocks = toolResultBlocks(e.message);
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
          stmt.toolResult.run(line, resultBytes(e.toolUseResult), isError, duration, call.id);
          if (isError) turnTotals.errors += 1;
        }

        if (call && call.name) {
          const where = e.cwd || (head && head.cwd) || null;
          for (const t of files.fromToolCall({ name: call.name, input: call.input, result: e.toolUseResult })) {
            stmt.touch.run(entry.sessionId, turn, segment, call.id, line, absolute(t.path, where),
              t.path, t.kind, t.start ?? null, t.end ?? null, t.total ?? null, t.bytes ?? null,
              t.confidence, t.via);
          }
        }
      }

      // --- content that reached context with no tool call at all
      if (e.type === 'attachment') {
        const where = e.cwd || (head && head.cwd) || null;
        for (const t of files.fromAttachment(e.attachment)) {
          stmt.touch.run(entry.sessionId, turn, segment, null, line, absolute(t.path, where),
            t.path, t.kind, t.start ?? null, t.end ?? null, null, t.bytes ?? null,
            t.confidence, t.via);
        }
      }

      if (e.type === 'system' && e.subtype === 'turn_duration' && turn != null) {
        stmt.turnDuration.run(e.durationMs ?? null, e.messageCount ?? null, turn);
      }

      // --- cost is cumulative and rewritten as the session runs; the last wins
      if (e.type === 'cost-state') {
        const began = e.startTime ? new Date(e.startTime).toISOString() : null;
        stmt.session.run(entry.sessionId, entry.project, (head && head.cwd) || null,
          (head && head.gitBranch) || null, (head && head.version) || null,
          (head && head.slug) || null, began, null);
        stmt.cost.run(e.totalCostUSD ?? null, e.totalLinesAdded ?? null,
          e.totalLinesRemoved ?? null, e.totalDuration ?? null, e.totalAPIDuration ?? null,
          e.totalToolDuration ?? null, entry.sessionId);
      }
    }

    // The file ends the last turn and the last segment. What ended the session
    // — /clear, a logout, closing the terminal — is not written anywhere in
    // it, so `end` is as much as the transcript can say.
    const lastTurn = turn;
    const lastSegment = segment;
    closeTurn(line, lastAt || null);
    if (segment != null) {
      stmt.closeSegment.run(line, lastAt || null, 'end', null, null, null, null, null,
        segmentTurns, segment);
    }

    stmt.session.run(entry.sessionId, entry.project, (head && head.cwd) || null,
      (head && head.gitBranch) || null, (head && head.version) || null,
      (head && head.slug) || null, firstAt, lastAt);
    stmt.counts.run(entry.sessionId);

    stmt.bookmark.run(entry.path, entry.sessionId, entry.project, entry.kind, entry.agentOf,
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
 * rather than printing: what to say about a run belongs to the command.
 */
function indexAll(db, root, { project = null, onFile = null } = {}) {
  const stmt = statements(db);
  const all = findTranscripts(root).filter((t) => !project || t.project.includes(project));
  const result = { files: 0, skipped: 0, lines: 0, events: 0, sessions: new Set() };

  for (const entry of all) {
    const one = indexTranscript(db, stmt, entry);
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

module.exports = { indexAll, indexTranscript, findTranscripts, readLines, statements };
