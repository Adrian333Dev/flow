'use strict';
/**
 * Project overlays — what one project adds to a skill it cannot edit.
 *
 * A skill exists once per machine and every project shares that copy, so a
 * project extends one by writing `.claude/flow/overlays/<name>.md`. A skill
 * that can be extended ends with a shell line calling this command, and
 * whatever it prints lands in the body Claude Code loads.
 *
 * Nothing here reads what the file holds. No schema, no keys, no section this
 * command knows about — whatever the overlay says is what the skill gets.
 *
 * `get` is the only action, and the default, so `flow overlays groundwork` is
 * the whole of it. An overlay is written in an editor, and listing them is
 * `ptree .claude/flow/overlays`.
 */

const fs = require('fs');
const path = require('path');
const { FlowError } = require('../lib/error');
const { projectRoot } = require('../lib/root');

const actions = {};

/**
 * Two silences are deliberate, because both are ordinary.
 *
 * No overlay file means the skill reads as though its last line were not
 * there, which is the common case — most skills carry no overlay in most
 * projects. Outside a git repo there is no project to ask, and a skill is
 * invocable anywhere, so throwing there would print an error into a skill
 * body for running in the wrong folder.
 *
 * A file that exists and will not open is neither. That one throws.
 */
actions.get = {
  args: '<name>',
  summary: "print this project's overlay for one skill",
  run({ positional, usage }) {
    const [name, ...extra] = positional;
    if (!name) throw new FlowError(`usage: ${usage} <name>`);
    if (extra.length) throw new FlowError(`${usage} takes one skill name.`);
    if (name.includes('/') || name.includes(path.sep)) {
      throw new FlowError(`"${name}" is a skill name, not a path.`);
    }

    let root;
    try {
      root = projectRoot();
    } catch {
      return 0;
    }

    const file = path.join(root, '.claude', 'flow', 'overlays', `${name}.md`);
    let body;
    try {
      body = fs.readFileSync(file, 'utf8');
    } catch (e) {
      if (e.code === 'ENOENT') return 0;
      throw new FlowError(`${file} exists and could not be read — ${e.message}`);
    }

    process.stdout.write(body.endsWith('\n') ? body : body + '\n');
    return 0;
  },
};

module.exports = { summary: 'what this project adds to a skill', default: 'get', actions };
