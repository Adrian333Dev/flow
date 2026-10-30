/** The `flow doctor` checks of what Flow keeps: background-job issues, registered projects, the tickets, and the clone's submodules. */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import * as failures from '../logs/failures.ts';
import * as store from '../tickets/store.ts';
import * as worktrees from '../tickets/worktrees.ts';
import * as paths from '../../shared/paths.ts';
import * as registry from '../../shared/registry.ts';
import * as settings from '../../shared/settings.ts';
import { git } from '../../shared/git.ts';
import { count } from './doctor-install.ts';

/**
 * The open issues: a job that runs with nobody watching, such as a ticket
 * sync, whose last run failed. The next run that
 * works clears one by itself, so each line stays until its cause is fixed.
 */
function checkIssues(at) {
  const problems = failures.open(at.flow).map((issue) => {
    const times = issue.count === 1 ? 'failed' : `failed ${issue.count} times`;
    const error = String(issue.error || '').split('\n')[0];
    return `${issue.job.split(os.homedir()).join('~')}: ${times} since ${issue.since.slice(0, 16).replace('T', ' ')}. ${error}`;
  });
  return { name: 'issues', problems, summary: 'every job running in the background worked last time' };
}

/**
 * The projects this machine knows (shared/registry.ts), read and never scanned
 * for: a registered path that is gone, a prefix two folders both claim, a line
 * whose folder changed its `ticketPrefix`, and the project around you missing
 * from the list. `current` is that project, or null.
 */
function checkProjects(at, current) {
  const map = registry.read(at.flow);
  const listed = registry.projects(at.flow).filter((p) => p.prefix !== store.HOME_WORD);
  const problems : string[] = [];

  for (const p of listed) {
    if (!p.exists) {
      problems.push(`${p.prefix} is registered at ${paths.shorten(p.folder)}, which is gone: a ticket-writing command in the moved folder updates the line`);
    } else if (fs.existsSync(path.join(p.folder, '.flow')) && store.prefixOf(p.folder) !== p.prefix) {
      problems.push(`${paths.shorten(p.folder)} is registered as "${p.prefix}", but its ticketPrefix is now "${store.prefixOf(p.folder)}": a ticket-writing command in it updates the line`);
    }
  }

  if (current && fs.existsSync(path.join(current, '.flow'))) {
    const prefix = store.prefixOf(current);
    const named = Boolean(settings.read(settings.projectFile(current)).ticketPrefix);
    const holder = registry.holder(prefix, current, at.flow);
    if (holder) {
      problems.push(`this folder's prefix "${prefix}" is held by ${paths.shorten(holder)}: set ticketPrefix in ${paths.shorten(path.join(current, '.flow', 'settings.json'))} to another word`);
    } else if (named && !registry.registeredAs(current, at.flow)) {
      problems.push(`this folder (prefix "${prefix}") is not in the list: a ticket-writing command here adds it`);
    }
  }

  const notes = problems.length
    ? [`registered: ${listed.map((p) => `${p.prefix} ${paths.shorten(p.folder)}`).join(', ') || 'none'}`]
    : [];
  const pairs = Object.entries(map).map(([prefix, folder]) => `${prefix} ${paths.shorten(folder)}`);
  return { name: 'projects', problems, notes, summary: pairs.length ? pairs.join(', ') : 'none registered yet' };
}

/**
 * The project's tickets, for any still in the format from before `ticket.md`
 * stood alone: a folder named with more than its id, a `groundwork/map.md` that
 * is the empty template, a title that is one of the ticket's own labels. Also
 * a ticket's worktree left behind after its ticket closed or was deleted.
 */
function checkTickets(root) {
  if (!root) return { name: 'tickets', skipped: 'not inside a Flow project' };
  let tickets;
  try {
    tickets = store.readTickets(root);
  } catch (e: any) {
    // A project with no ticket prefix, or a ticket file that does not parse,
    // must not take the machine's report down with it.
    return { name: 'tickets', problems: [`the tickets could not be read: ${e.message.split('\n')[0]}`] };
  }
  const problems : string[] = [];
  for (const t of tickets) {
    if (t.dirName !== store.folderName(t.id)) {
      problems.push(`${t.dirName} is in a folder not named by its number: rename the folder to ${store.folderName(t.id)}`);
    }
    const map = path.join(t.dir, 'groundwork', 'map.md');
    if (fs.existsSync(map) && emptyMap(fs.readFileSync(map, 'utf8'))) {
      problems.push(`${t.id} holds a groundwork/map.md that is only the empty template: delete it`);
    }
    if (t.data.labels.includes(t.data.title)) {
      problems.push(`${t.id} is titled "${t.data.title}", a label and no name: flow tickets edit ${t.id} --title "<up to 4 words>"`);
    }
  }
  for (const { folder, why } of worktrees.leftover(root, tickets, store.prefixOf(root))) {
    problems.push(`${folder} is left over, ${why}: git worktree remove ${folder}, which refuses while it holds uncommitted work`);
  }
  return { name: 'tickets', problems, summary: `${count(tickets.length, 'ticket', 'tickets')} in the current format` };
}

/** True for a map with the empty template's comment and nothing else but headings. */
function emptyMap(text) {
  return /Empty until this ticket is picked up/.test(text) &&
    !text.replace(/<!--[\s\S]*?-->/g, '').replace(/^#.*$/gm, '').trim();
}

/**
 * The clone: where its submodules sit.
 *
 * Every line is a note. A submodule off its gitlink is somebody mid-work in
 * util, and the clone still runs.
 */
function checkClone(clone) {
  const notes : string[] = [];
  const parts : string[] = [];

  const rows = git(clone, ['submodule', 'status']).raw.split('\n').filter(Boolean);
  const said = {
    '+': (name) => `${name} sits at a commit this clone does not point at, so a fresh clone gets a different one`,
    '-': (name) => `${name} is not checked out, so nothing under it can be read`,
    U: (name) => `${name} has a merge conflict`,
  };
  let off = 0;
  for (const row of rows) {
    const found = /^([-+U ])\S+ (\S+)/.exec(row);
    if (!found || found[1] === ' ') continue;
    off++;
    notes.push(`${said[found[1]](found[2])}: git submodule update --init updates them`);
  }
  parts.push(`${count(rows.length - off, 'submodule', 'submodules')} on the commit this clone points at`);

  return { name: 'clone', problems: [], notes, summary: parts.join(', ') };
}

export { checkIssues, checkProjects, checkTickets, checkClone };
