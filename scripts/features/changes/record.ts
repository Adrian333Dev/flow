/** The text a finished worker hands its parent: what it changed, as diffs. */

import fs from 'node:fs';
import path from 'node:path';
import * as settings from '../../shared/settings.ts';
import { agentDir, safe, saved, reportedAt, readEvents, listDir } from './session-files.ts';
import { snapshot, changedPaths, diffChunks } from './snapshot.ts';

// Claude Code caps hook output at 10,000 characters and cuts past it.
const LIMIT = 9000;

/**
 * What this worker changed since its last record, as text for the parent.
 * Null when it changed nothing.
 */
function buildRecord(root, dir, agent, type) {
  const folder = agentDir(dir, agent);
  const since = reportedAt(path.join(folder, 'reported'));
  const mine = readEvents(dir, agent).filter((e) => e.end > since);
  const others = listDir(path.join(dir, 'agents'))
    .filter((name) => name !== safe(agent))
    .flatMap((name) => readEvents(dir, name));

  const items : any[] = [];

  const byPath = new Map();
  for (const event of mine) {
    for (const file of event.files) {
      // A command's snapshot also sees what another agent wrote while it ran.
      // A change another agent's own call accounts for exactly is theirs.
      const theirs = event.type === 'command' && others.some((o) => o.start <= event.end && o.end >= event.start &&
        o.files.some((f) => f.path === file.path && f.before === file.before && f.after === file.after));
      if (theirs) continue;
      if (!byPath.has(file.path)) byPath.set(file.path, []);
      byPath.get(file.path).push({ ...file, start: event.start, end: event.end });
    }
  }

  for (const [file, changes] of byPath) {
    const first = changes[0];
    const last = changes[changes.length - 1];
    const shared = others.some((o) => o.start <= last.end && o.end >= first.start && o.files.some((f) => f.path === file));
    if (!shared) {
      if (first.before !== last.after) items.push({ path: file, before: first.before, after: last.after, group: 'own' });
      continue;
    }
    changes.forEach((c, n) => items.push({ path: file, before: c.before, after: c.after, group: `shared-${file}-${n}` }));
  }

  // The safety net: a file that changed during the run with no call behind it.
  const start = settings.read(path.join(folder, 'start.json'));
  fs.rmSync(path.join(folder, 'start.json'), { force: true });
  const startedAt = saved(start.at);
  if (start.at && startedAt > since) {
    const touched = new Set([...mine, ...others].filter((e) => e.end >= startedAt).flatMap((e) => e.files.map((f) => f.path)));
    for (const file of changedPaths(root, start.tree, snapshot(root, dir))) {
      if (!touched.has(file.path)) items.push({ ...file, group: 'unexplained' });
    }
  }

  if (!items.length) return null;
  return render(root, dir, folder, agent, type, mine, items);
}

function render(root, dir, folder, agent, type, mine, items) {
  const sections : any[] = [];
  const groups = [...new Set<string>(items.map((i) => i.group))];
  for (const group of groups) {
    const chunks = diffChunks(root, dir, items.filter((i) => i.group === group));
    if (group === 'unexplained') {
      sections.push({ note: 'Changed while this subagent ran, by no tool call a hook saw: a command left running, an editor, or another tool.', chunks });
    } else if (group.startsWith('shared-')) {
      sections.push({ note: 'Another agent changed this file in the same window. This is one change of this subagent\'s own.', chunks });
    } else {
      sections.push({ note: '', chunks });
    }
  }

  const files = new Set(items.map((i) => i.path));
  const commands = mine
    .filter((e) => e.type === 'command' && e.files.some((f) => files.has(f.path)))
    .map((e) => `- \`${e.command.split('\n')[0].slice(0, 160)}\`: ${e.files.map((f) => f.path + (f.after ? '' : ' (deleted)')).join(', ')}`);

  const head = [
    `Flow's change record for subagent ${agent}${type ? ` (${type})` : ''}. The changes.ts hook built it from what the subagent's own tool calls did to the files, not from its report.`,
    '',
    `${files.size} ${files.size === 1 ? 'file' : 'files'} changed.`,
  ];
  if (commands.length) head.push('', 'Commands that changed files:', ...commands);

  const full = [...head, '', ...sections.flatMap((s) => [s.note, ...s.chunks.map((c) => c.text)].filter(Boolean))].join('\n');
  if (full.length <= LIMIT) return full;

  // Too long for one hook message. The longest diffs shrink to their line
  // counts first, and the whole patch goes to a file the parent can read.
  const patchFile = path.join(folder, `record-${Date.now()}.patch`);
  fs.writeFileSync(patchFile, full);
  const all = sections.flatMap((s) => s.chunks).sort((a, b) => b.text.length - a.text.length);
  const budget = LIMIT - head.join('\n').length - 400;
  let size = all.reduce((n, c) => n + c.text.length, 0);
  for (const c of all) {
    if (size <= budget) break;
    size -= c.text.length;
    c.text = `${c.name}: +${c.added} -${c.removed}, diff left out for length\n`;
    size += c.text.length;
  }
  let body = sections.flatMap((s) => [s.note, ...s.chunks.map((c) => c.text)].filter(Boolean)).join('\n');
  if (body.length > budget) body = `${body.slice(0, budget)}\n…`;
  return [...head, '', `The whole diff is in ${patchFile}.`, '', body].join('\n');
}

export { buildRecord, LIMIT };
