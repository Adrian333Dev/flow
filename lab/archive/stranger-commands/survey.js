'use strict';
/**
 * `flow survey`: every place Claude Code reads its setup from, as plain text.
 *
 * Both setup sessions start from it, and the user can run it to see exactly
 * what setup saw. It changes nothing, so it runs before setup finishes, where
 * the machine's setup session needs it. `lib/machine/survey.js` does the
 * reading, and says why it reads what it reads.
 *
 * `--root` reads a scratch machine in place of the home folder, the same as
 * `flow install --root`, for the tests.
 */

const path = require('path');
const { out } = require('../lib/cli');
const paths = require('../lib/paths');
const survey = require('../lib/machine/survey');

const actions = {};

actions.survey = {
  section: 'setup',
  anywhere: true,
  summary: 'list every place Claude Code reads its setup from, and whether each is on',
  flags: {
    project: { arg: '<folder>' },
    root: { arg: '<dir>', hidden: true },
  },
  run({ flags }) {
    const at = paths.folders(flags.root);
    const result = flags.project ? survey.project(at, path.resolve(flags.project)) : survey.machine(at);
    out(survey.render(result));
    return 0;
  },
};

module.exports = actions;
