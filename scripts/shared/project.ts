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

import fs from 'node:fs';
import path from 'node:path';
import { FlowError } from './error.ts';
import * as git from './git.ts';
import * as paths from './paths.ts';

const override = () => (process.env.FLOW_PROJECT ? path.resolve(process.env.FLOW_PROJECT) : null);

/**
 * git's top folder around `from`, or null outside a repository.
 *
 * Inside `.flow/` itself, git answers with the checkout of the `flow`
 * branch, which is its own top folder. The project is the one around it.
 */
function top(from?: string | null) {
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
function around(from?: string | null, at = paths.folders()) {
  const found = top(from);
  if (!found || found === at.base || path.join(found, '.flow') === at.flow) return null;
  return fs.existsSync(path.join(found, '.flow')) ? found : null;
}

/**
 * The Flow project a command runs in, or a refusal naming the command that
 * brings one in. Every command reading a ticket or a skill list
 * goes through here.
 */
function projectRoot() {
  checkOverride();
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

/**
 * The same, or null where there is no repository or no `.flow/`: a command
 * that can read the home place instead asks this, and one that cannot
 * calls `projectRoot`. A `FLOW_PROJECT` naming a missing path still throws,
 * since that is a mistake and no folder without a project.
 */
function projectRootOrNull() {
  checkOverride();
  const found = top();
  return found && fs.existsSync(path.join(found, '.flow')) ? found : null;
}

function checkOverride() {
  const forced = override();
  if (forced && !fs.existsSync(forced)) {
    throw new FlowError(`FLOW_PROJECT points at a path that does not exist: ${forced}`);
  }
}

export { top, around, projectRoot, projectRootOrNull };
