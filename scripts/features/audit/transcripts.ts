/** Finding Claude Code's transcripts, and reading one a complete line at a time. */

import fs from 'node:fs';
import path from 'node:path';

const NL = 0x0a;

/**
 * Every transcript under the projects directory, session files and subagent
 * files alike. A subagent gets its own transcript beside its parent's, and it
 * is indexed as its own session so a query can ask what a subagent did.
 */
function findTranscripts(root) {
  const found : any[] = [];
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
          type: 'session',
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
          type: 'subagent',
          agentOf: entry.name,
        });
      }
    }
  }

  return found.sort((a, b) => a.path.localeCompare(b.path));
}

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

export { findTranscripts, readLines };
