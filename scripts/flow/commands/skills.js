'use strict';
/**
 * Skills — what exists in the clone, and what a session here is shown of each.
 *
 * Every skill outside `drafts/` installs on every machine, as one symlink named
 * for the skill. Nothing is copied, so every project shares one file and an
 * edit is live everywhere at once.
 *
 * `ls` is the only way to find a skill a session is not being shown. Nothing
 * announces a hidden skill and nothing should: the announcement would land in
 * every project, including the ones that turned the skill off.
 *
 * No `add`, `sync`, `new` or `drop`. An external skill used by one project is a
 * folder copied into `<project>/.claude/skills/<name>/` and committed, which
 * needs no command and no list. Writing a Flow skill is writing a file in the
 * clone, and removing one from a project is `skillOverrides`.
 */

const { out } = require('../lib/cli');
const { projectRoot } = require('../lib/root');
const render = require('../lib/render');
const skills = require('../lib/skills');

/** The project, or null where there is none — `ls` works anywhere. */
function maybeRoot() {
  try {
    return projectRoot();
  } catch {
    return null;
  }
}

const actions = {};

actions.ls = {
  summary: 'every skill, and what a session here is shown of it',
  run() {
    const root = maybeRoot();
    const stateOf = skills.states(root);

    const rows = [...skills.catalog().values()].map((s) => {
      if (s.group === skills.DRAFTS) return [s.name, s.group, 'not installed', '-'];
      const { state, setBy } = stateOf(s.name);
      return [s.name, s.group, state, setBy];
    });

    out(render.table(['SKILL', 'GROUP', 'STATE', 'SET BY'], rows));
    if (!root) out('\nNo project here, so nothing overrides the machine.');
    return 0;
  },
};

module.exports = {
  summary: 'what exists in the clone, and what this project is shown',
  default: 'ls',
  actions,
};
