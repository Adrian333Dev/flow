'use strict';
/**
 * `flow store`: where this project's tickets live, and the move between the
 * 2 places `lib/tickets/records-place.js` names.
 *
 *   flow store           says where they live, and who reads them
 *   flow store branch    moves them onto the project's `flow` branch
 *   flow store private   moves them into the Flow home, ~/.flow/projects/<name>/
 *
 * The word names where they go, as `flow move`'s last word does. A move never
 * deletes a ticket: one the branch holds and the moving folder lacks refuses.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { out } = require('../lib/cli');
const { FlowError } = require('../lib/error');
const records = require('../lib/tickets/records');
const place = require('../lib/tickets/records-place');
const projects = require('../lib/project');
const settings = require('../lib/settings');
const paths = require('../lib/paths');
const { git } = require('../lib/git');

const show = paths.shorten;

const actions = {};

/** One line saying where the tickets live now, and who reads them. */
function describe(found, project) {
  const name = path.basename(project);
  if (found.type === 'branch') return `${name}'s tickets live on the project's flow branch. Everyone who can read the repository reads them.`;
  if (found.type === 'home') return `${name}'s tickets live in your Flow home, ${show(found.dir)}: private, and carried to your other machines by flow sync.`;
  return `${name}'s tickets live in ${show(found.dir)}, in this clone alone.`;
}

/** From the branch, or a plain folder, to a new Flow home folder. */
function intoHome(at, project, found) {
  const records_ = path.join(project, '.flow');
  const already = place.findFolder(project, at.flow);
  if (already) throw new FlowError(`${show(already)} already holds this project's tickets. Move or delete it first.`);
  const dir = place.newFolder(project, at.flow);
  if (found.type === 'branch') records.commit(project, 'saved before moving to the Flow home');
  place.copyRecords(records_, dir);
  if (found.type === 'branch') {
    const removed = git(project, ['worktree', 'remove', '--force', records_]);
    if (!removed.ok) {
      fs.rmSync(dir, { recursive: true, force: true });
      throw new FlowError(`could not take the flow branch's checkout away from .flow/: ${removed.err}`);
    }
  } else {
    fs.rmSync(records_, { recursive: true, force: true });
  }
  place.link(project, dir);
  place.remember(project, dir);
  const lines = [`moved: ${path.basename(project)}'s tickets now live in ${show(dir)}.`];
  if (found.type === 'branch') {
    lines.push('The flow branch keeps the tickets as they were, here and on the remote, and anyone who read the repository may hold a copy.',
      'To delete it: git branch -D flow, then git push origin --delete flow.');
  }
  return lines;
}

/**
 * From the Flow home, or a plain folder, onto the branch: the one already
 * there where an earlier move left it, a new one otherwise. The branch then
 * holds exactly what moved, so a ticket the branch has and the moved folder
 * lacks would be deleted, and that refuses.
 */
function ontoBranch(at, project, found) {
  const records_ = path.join(project, '.flow');
  const push = records.canPush(project);
  if (!push.ok) throw new FlowError(`the remote refuses a push from this clone, so the branch could never be sent. git said: ${push.why}`);

  let from = found.dir;
  let staged = null;
  if (found.type === 'folder' && from === records_) {
    staged = fs.mkdtempSync(path.join(os.tmpdir(), 'flow-store-'));
    place.copyRecords(records_, staged);
    from = staged;
  }
  const restore = () => {
    git(project, ['worktree', 'remove', '--force', records_]);
    if (staged) {
      place.copyRecords(staged, records_);
      fs.rmSync(staged, { recursive: true, force: true });
    } else {
      place.link(project, found.dir);
    }
  };
  fs.rmSync(records_, { recursive: true, force: true });
  const checked = records.checkOut(project);
  if (!checked.ok) {
    restore();
    throw new FlowError(`could not check out the flow branch at .flow/: ${checked.why}`);
  }
  const moving = new Set(place.ticketFolders(from));
  const lost = place.ticketFolders(records_).filter((n) => !moving.has(n));
  if (lost.length) {
    restore();
    throw new FlowError(`the flow branch already holds tickets that would be deleted: ${lost.join(', ')}. Nothing was changed.`);
  }
  for (const entry of fs.readdirSync(records_)) {
    if (entry !== '.git') fs.rmSync(path.join(records_, entry), { recursive: true, force: true });
  }
  place.copyRecords(from, records_);
  const file = settings.projectFile(project);
  const { repository, ...rest } = settings.read(file);
  if (repository) settings.write(file, rest);
  const lines = [`moved: ${path.basename(project)}'s tickets now live on the project's flow branch, at .flow/.`];
  if (place.addIgnore(project)) lines.push('.gitignore: .flow/ added, waiting for your next commit');
  records.commit(project, found.type === 'folder' ? 'moved from a folder in this clone' : 'moved from the Flow home');
  records.syncLater(project, at.flow);
  // A link to a folder outside the Flow home points at something Flow never made.
  if (staged || found.type !== 'folder') fs.rmSync(from, { recursive: true, force: true });
  lines.push('Everyone who can read the repository reads them once the branch is sent, which starts now.');
  return lines;
}

actions.store = {
  section: 'setup',
  args: '[branch|private]',
  summary: 'where this project\'s tickets live; branch or private moves them there',
  flags: { root: { arg: '<dir>' } },
  run({ positional, flags }) {
    const at = paths.folders(flags.root);
    const [word, ...extra] = positional;
    if (extra.length || (word && !['branch', 'private'].includes(word))) {
      throw new FlowError('usage: flow store [branch|private]');
    }
    const project = projects.projectRoot();
    const found = place.placeOf(project, at.flow);
    if (!word) {
      out(describe(found, project));
      return 0;
    }
    const want = word === 'branch' ? 'branch' : 'home';
    if (found.type === want) {
      out(`${describe(found, project)} Nothing moved.`);
      return 0;
    }
    const lines = want === 'branch' ? ontoBranch(at, project, found) : intoHome(at, project, found);
    out(lines.join('\n'));
    return 0;
  },
};

module.exports = actions;
