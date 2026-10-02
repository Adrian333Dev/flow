'use strict';
/**
 * Which project a command or a hook is in. Commands take no path: they find
 * the project from wherever they were run.
 *
 * git's top folder rather than a hand-rolled walk up the tree: it already
 * handles worktrees (where .git is a file), submodules and symlinked paths,
 * and it resolves a nested repo to the nearest enclosing one, which is the
 * correct answer. A Flow project is that folder holding a `.flow/`.
 *
 * FLOW_PROJECT names the project folder outright, with no git asked, which is
 * how a test points a command at a scratch project that is no repository.
 */

const fs = require('fs');
const path = require('path');
const { FlowError } = require('./error');
const git = require('./git');
const paths = require('./paths');

const override = () => (process.env.FLOW_PROJECT ? path.resolve(process.env.FLOW_PROJECT) : null);

/**
 * git's top folder around `from`, or null outside a repository.
 *
 * Inside `.flow/` itself, git answers with the checkout of the `flow`
 * branch, which is its own top folder. The project is the one around it.
 */
function top(from) {
  if (!from && override()) return override();
  const found = git.top(from || process.cwd());
  if (!found) return null;
  const around = path.dirname(found);
  if (path.basename(found) === '.flow' && fs.existsSync(path.join(found, '.git'))) return around;
  return found;
}

/**
 * The Flow project around `from`, or null. The home folder is never one: its
 * `.flow/` is the machine's, so a session opened anywhere under it would
 * otherwise read the global settings as a project's.
 */
function around(from, at = paths.folders()) {
  const found = top(from);
  if (!found || found === at.base || path.join(found, '.flow') === at.flow) return null;
  return fs.existsSync(path.join(found, '.flow')) ? found : null;
}

/**
 * The Flow project a command runs in, or a refusal naming the command that
 * brings one in. Every command reading a ticket, an overlay or a skill list
 * goes through here.
 */
function projectRoot() {
  if (override() && !fs.existsSync(override())) {
    throw new FlowError(`FLOW_PROJECT points at a path that does not exist: ${override()}`);
  }
  const found = top();
  if (!found) {
    throw new FlowError(
      'not inside a git repository, so there is no project root.\n' +
      '  Run flow from inside the project, or set FLOW_PROJECT=/path/to/project.'
    );
  }
  if (fs.existsSync(path.join(found, '.flow'))) return found;
  throw new FlowError(`${found} is not a Flow project yet. Type flow init to bring it in.`);
}

module.exports = { top, around, projectRoot };
