/** The prepared SQL the walk runs against the index, and the delete of a transcript that was replaced. */

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
    closeTurn: db.prepare(`UPDATE turn SET last_line = ?, ended_at = ?,
      tool_calls = ?, errors = ? WHERE id = ?`),
    // From the request rows rather than added up as lines arrive: a later line
    // can raise a request's count after its turn closed, even in a later walk.
    turnTokens: db.prepare(`UPDATE turn SET
      input_tokens    = COALESCE((SELECT SUM(input_tokens)    FROM request WHERE turn_id = turn.id), 0),
      output_tokens   = COALESCE((SELECT SUM(output_tokens)   FROM request WHERE turn_id = turn.id), 0),
      thinking_tokens = COALESCE((SELECT SUM(thinking_tokens) FROM request WHERE turn_id = turn.id), 0),
      cache_read      = COALESCE((SELECT SUM(cache_read)      FROM request WHERE turn_id = turn.id), 0),
      cache_write     = COALESCE((SELECT SUM(cache_write)     FROM request WHERE turn_id = turn.id), 0)
      WHERE session_id = ?`),
    turnDuration: db.prepare('UPDATE turn SET duration_ms = ?, messages = ? WHERE id = ?'),
    tool: db.prepare(`INSERT INTO tool_call
      (session_id, turn_id, segment_id, request_id, tool_use_id, name, summary, input, input_bytes, call_line)
      VALUES (?,?,?,?,?,?,?,?,?,?)`),
    request: db.prepare(`INSERT INTO request
      (session_id, turn_id, segment_id, message_id, line, timestamp, model, input_tokens,
       output_tokens, thinking_tokens, cache_read, cache_write)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
      ON CONFLICT(session_id, message_id) DO UPDATE SET
        input_tokens    = MAX(request.input_tokens,    excluded.input_tokens),
        output_tokens   = MAX(request.output_tokens,   excluded.output_tokens),
        thinking_tokens = MAX(request.thinking_tokens, excluded.thinking_tokens),
        cache_read      = MAX(request.cache_read,      excluded.cache_read),
        cache_write     = MAX(request.cache_write,     excluded.cache_write)
      RETURNING id`),
    toolResult: db.prepare(`UPDATE tool_call SET result_line = ?, result_bytes = ?,
      is_error = ?, duration_ms = ? WHERE id = ?`),
    findTool: db.prepare('SELECT id FROM tool_call WHERE session_id = ? AND tool_use_id = ?'),
    touch: db.prepare(`INSERT INTO file_touch
      (session_id, turn_id, segment_id, tool_call_id, line, path, given, type, start_line,
       end_line, total_lines, bytes, confidence, via)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`),
    session: db.prepare(`INSERT INTO session (id, project, machine, cwd, git_branch, version, slug, started_at, ended_at)
      VALUES (?,?,?,?,?,?,?,?,?)
      ON CONFLICT(id) DO UPDATE SET
        machine = excluded.machine, cwd = excluded.cwd, git_branch = excluded.git_branch, version = excluded.version,
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
      (path, session_id, project, type, agent_of, bytes_read, lines_read, inode, size, mtime,
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
 * file was replaced rather than appended to: a shrinking file or a new inode
 * means the byte offset points at the wrong place, and half-correct rows are
 * worse than none.
 */
function forget(db, file, sessionId) {
  db.prepare('DELETE FROM event WHERE transcript = ?').run(file);
  const orphaned = db.prepare('SELECT COUNT(*) AS n FROM event WHERE session_id = ?').get(sessionId);
  if (!orphaned || orphaned.n === 0) {
    for (const table of ['request', 'tool_call', 'file_touch', 'turn', 'segment']) {
      db.prepare(`DELETE FROM ${table} WHERE session_id = ?`).run(sessionId);
    }
    db.prepare('DELETE FROM session WHERE id = ?').run(sessionId);
  }
  db.prepare('DELETE FROM transcript WHERE path = ?').run(file);
}

export { statements, forget };
