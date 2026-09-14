'use strict';
/**
 * Domain skills: skills from the `domain-skills` repository, installed into one
 * project at a time.
 *
 * A domain skill carries knowledge about one field or tool, such as React. It
 * never installs on the machine, because its description would then load in
 * every session there, React in a Python project included. `add` links it into
 * `<project>/.claude/skills/<name>`, so only the project using it pays.
 *
 * A link rather than a copy, so a merge into the repository reaches every
 * project that installed the skill the moment the clone is pulled.
 *
 * git ignores the link, since it holds this machine's path and would load
 * nothing anywhere else. So `add` and `drop` also keep `.flow/domain-skills.txt`,
 * committed, one name per line, and a bare `add` links every name on it. That
 * is how a second machine, a fresh clone or a new worktree gets them back.
 *
 * The repository is found through `domainSkills` in `~/.flow/settings.json`: the
 * path to the clone's `skills/` folder. `flow private-skills` reads it too, to
 * refuse a name the repository already uses.
 */

const fs = require('fs');
const { out } = require('../lib/cli');
const { FlowError } = require('../lib/error');
const { projectRoot } = require('../lib/root');
const render = require('../lib/render');
const links = require('../lib/skill-links');

const LIST = 'domain-skills.txt';
const COMMAND = 'flow domain-skills';

/** The repository's `skills/` folder, or a refusal saying what to set. */
function repoSkills() {
  const { file, set, dir } = links.domainSetting();
  if (!set) {
    throw new FlowError(
      `no domainSkills in ${file}, so there is no repository to read.\n` +
      '  Set it to the skills folder of your clone: "domainSkills": "~/code/domain-skills/skills"'
    );
  }
  if (!fs.existsSync(dir)) {
    throw new FlowError(`domainSkills in ${file} points at ${dir}, which does not exist.`);
  }
  return dir;
}

const actions = {};

actions.ls = {
  args: '[words...]',
  summary: 'every skill in the repository, or the ones matching every word',
  run({ positional }) {
    const repo = repoSkills();
    const root = links.maybeRoot();
    const rows = links.matching(links.readSource(repo), positional);

    if (!rows.length) {
      out(positional.length ? `no domain skills match "${positional.join(' ')}".` : `no skills in ${repo}.`);
      return 0;
    }

    const place = root && links.project(root, LIST);
    const listed = place ? links.readList(place.list) : [];
    const here = (name) => (place ? links.placeState({ name, source: repo, skillsDir: place.skillsDir, listed }) : '-');

    out(render.table(['SKILL', 'HERE', 'DESCRIPTION'], rows.map((s) => [s.name, here(s.name), s.description])));
    if (!root) out('\nNo project here, so nothing is added anywhere.');
    return 0;
  },
};

actions.add = {
  args: '[name...]',
  summary: 'link skills into this project; with no name, every skill it lists',
  run({ positional }) {
    links.checkNames(positional);
    const place = links.project(projectRoot(), LIST);
    const repo = repoSkills();
    return links.addSkills({ names: positional, source: repo, known: links.readSource(repo), place, command: COMMAND });
  },
};

actions.drop = {
  args: '<name...>',
  summary: 'remove skills from this project',
  run({ positional, usage }) {
    if (!positional.length) throw new FlowError(`usage: ${usage} <name...>`);
    links.checkNames(positional);
    const place = links.project(projectRoot(), LIST);
    return links.dropSkills({ names: positional, source: repoSkills(), place });
  },
};

module.exports = {
  summary: 'skills from the domain-skills repository, added to one project',
  default: 'ls',
  actions,
};
