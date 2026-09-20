'use strict';
/**
 * Domain skills: skills from the `domain-skills` repository, added to one
 * project, or to the whole machine when one earns it.
 *
 * A domain skill carries knowledge about one field or tool, such as React.
 * `add` links it into `<project>/.claude/skills/<name>`, so only the project
 * using it pays for its description. `--global` links it into
 * `~/.claude/skills/<name>` instead, where every session on the machine loads
 * that description, React inside a Python project included. The command says
 * that cost out loud and links it anyway: the repository also holds skills
 * about a tool the user works with everywhere, and which ones those are is
 * decided one skill at a time.
 *
 * A link rather than a copy, so a merge into the repository reaches every
 * project that installed the skill the moment the clone is pulled. The clone
 * pulls itself when a session opens, which `lib/skills-update.js` holds.
 *
 * git ignores the link, since it holds this machine's path and would load
 * nothing anywhere else. So `add` and `drop` also keep a list of names, one per
 * line, and a bare `add` links every name on it. A project keeps
 * `.flow/domain-skills.txt`, committed with the project. The machine keeps
 * `~/.flow/domain-skills.txt`, which travels in `~/.flow/`'s own repository.
 * That is how a second machine, a fresh clone or a new worktree gets them back.
 *
 * The repository is found through `domainSkills` in
 * `~/.flow/settings.local.json`: the path to the clone's `skills/` folder. It
 * sits in the local file because a path belongs to one machine.
 * `flow private-skills` reads it too, to refuse a name the repository already
 * uses.
 */

const fs = require('fs');
const path = require('path');
const { out } = require('../lib/cli');
const { FlowError } = require('../lib/error');
const { projectRoot } = require('../lib/root');
const render = require('../lib/render');
const settings = require('../lib/settings');
const skills = require('../lib/skills');
const links = require('../lib/skill-links');

const LIST = 'domain-skills.txt';
const COMMAND = 'flow domain-skills';
const COST = 'Every session on this machine now loads that description, in a project the skill has nothing to do with too.';

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

/** The machine as a place to add skills: every session here reads its links. */
function machine() {
  return {
    skillsDir: path.join(skills.configDir(), 'skills'),
    list: path.join(settings.flowHome(), LIST),
    where: 'on this machine',
    show: links.shorten,
  };
}

const place = (flags) => (flags.global ? machine() : links.project(projectRoot(), LIST));

const GLOBAL = { global: { bool: true } };

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

    const places = [root && links.project(root, LIST), machine()].map((p) => p && { ...p, listed: links.readList(p.list) });
    const state = (p, name) => (p ? links.placeState({ name, source: repo, skillsDir: p.skillsDir, listed: p.listed }) : '-');

    out(render.table(
      ['SKILL', 'HERE', 'GLOBAL', 'DESCRIPTION'],
      rows.map((s) => [s.name, state(places[0], s.name), state(places[1], s.name), s.description])
    ));
    if (!root) out('\nNo project here, so HERE is empty.');
    return 0;
  },
};

actions.add = {
  args: '[name...]',
  summary: 'link skills into this project, or onto the machine with --global',
  flags: GLOBAL,
  run({ positional, flags }) {
    links.checkNames(positional);
    const repo = repoSkills();
    return links.addSkills({
      names: positional,
      source: repo,
      known: links.readSource(repo),
      place: place(flags),
      command: COMMAND,
      flag: flags.global ? ' --global' : '',
      note: flags.global ? COST : '',
    });
  },
};

actions.drop = {
  args: '<name...>',
  summary: 'remove skills from this project, or from the machine with --global',
  flags: GLOBAL,
  run({ positional, flags, usage }) {
    if (!positional.length) throw new FlowError(`usage: ${usage} <name...>`);
    links.checkNames(positional);
    return links.dropSkills({ names: positional, source: repoSkills(), place: place(flags) });
  },
};

module.exports = {
  summary: 'skills from the domain-skills repository, added to one project or the whole machine',
  default: 'ls',
  actions,
};
