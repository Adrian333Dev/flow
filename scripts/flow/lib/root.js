'use strict';
/**
 * Project root discovery. Commands take no path: they find the project from
 * wherever they were run.
 *
 * `git rev-parse --show-toplevel` rather than a hand-rolled walk up the tree:
 * it already handles worktrees (where .git is a file), submodules and symlinked
 * paths, and it resolves a nested repo to the nearest enclosing one, which is
 * the correct answer.
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { FlowError } = require('./error');

/**
 * A project Flow has been set up in, or a refusal naming the skill that does
 * it. `.flow/` is what /flow:setup-project writes, so its absence means the
 * project was never brought in, and every command reading a ticket, an overlay
 * or a skill list goes through here.
 */
function inFlow(root) {
  if (fs.existsSync(path.join(root, '.flow'))) return root;
  throw new FlowError(`${root} is not a Flow project yet. Type /flow:setup-project to bring it in.`);
}

function projectRoot() {
  const override = process.env.FLOW_PROJECT;
  if (override) {
    const resolved = path.resolve(override);
    if (!fs.existsSync(resolved)) {
      throw new FlowError(`FLOW_PROJECT points at a path that does not exist: ${resolved}`);
    }
    return inFlow(resolved);
  }

  try {
    return inFlow(execFileSync('git', ['rev-parse', '--show-toplevel'], {
      cwd: process.cwd(),
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim());
  } catch (e) {
    if (e instanceof FlowError) throw e;
    throw new FlowError(
      'not inside a git repository, so there is no project root.\n' +
      '  Run flow from inside the project, or set FLOW_PROJECT=/path/to/project.'
    );
  }
}

module.exports = { projectRoot };
