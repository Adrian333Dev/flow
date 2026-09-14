'use strict';
/**
 * Private skills: skills you write yourself, one folder each in
 * `~/.flow/private-skills/`, outside every repository.
 *
 * `add` links one into a project's `.claude/skills/`, or with `--global` into
 * `~/.claude/skills/`, where every session on the machine sees it. A skill that
 * belongs to one repository and its collaborators needs none of this: it is a
 * real folder committed in that repository's `.claude/skills/`.
 *
 * git ignores the links, so each place keeps a list of names. A project keeps
 * `.flow/private-skills.txt`, committed. The machine keeps `global.txt` inside
 * the private folder, which reaches a second machine with that folder's own
 * repository. A bare `add` relinks every name on the list.
 *
 * A private skill takes a name of its own. `add` refuses a name Flow's skills
 * or the domain-skills repository already use, so one link never replaces
 * another. The repository is checked only where `domainSkills` is set.
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

const LIST = 'private-skills.txt';
const COMMAND = 'flow private-skills';

const folder = () => path.join(settings.flowHome(), 'private-skills');

/** The machine as a place to add skills: every session here reads its links. */
function machine() {
  return {
    skillsDir: path.join(skills.configDir(), 'skills'),
    list: path.join(folder(), 'global.txt'),
    where: 'on this machine',
    show: links.shorten,
  };
}

const place = (flags) => (flags.global ? machine() : links.project(projectRoot(), LIST));

/** Why a name may not be a private skill's, or null. */
function nameTaken() {
  const flow = skills.catalog();
  const { dir } = links.domainSetting();
  const domain = dir && fs.existsSync(dir) ? links.readSource(dir) : new Map();
  return (name) => {
    if (flow.has(name)) return `"${name}" is a Flow skill's name. Give the private skill its own.`;
    if (domain.has(name)) return `"${name}" is a domain skill's name. Give the private skill its own.`;
    return null;
  };
}

const GLOBAL = { global: { bool: true } };

const actions = {};

actions.ls = {
  args: '[words...]',
  summary: 'every private skill, or the ones matching every word',
  run({ positional }) {
    const source = folder();
    const rows = links.matching(links.readSource(source), positional);

    if (!rows.length) {
      out(positional.length
        ? `no private skills match "${positional.join(' ')}".`
        : `no skills in ${links.shorten(source)}.\n  Make one: ${links.shorten(source)}/<name>/SKILL.md`);
      return 0;
    }

    const root = links.maybeRoot();
    const places = [root && links.project(root, LIST), machine()].map((p) => p && { ...p, listed: links.readList(p.list) });
    const state = (p, name) => (p ? links.placeState({ name, source, skillsDir: p.skillsDir, listed: p.listed }) : '-');

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
  summary: 'link skills here, or on the machine with --global; no name relinks the list',
  flags: GLOBAL,
  run({ positional, flags }) {
    links.checkNames(positional);
    const source = folder();
    return links.addSkills({
      names: positional,
      source,
      known: links.readSource(source),
      place: place(flags),
      command: COMMAND,
      flag: flags.global ? ' --global' : '',
      refuse: nameTaken(),
    });
  },
};

actions.drop = {
  args: '<name...>',
  summary: 'remove skills from here, or from the machine with --global',
  flags: GLOBAL,
  run({ positional, flags, usage }) {
    if (!positional.length) throw new FlowError(`usage: ${usage} <name...>`);
    links.checkNames(positional);
    return links.dropSkills({ names: positional, source: folder(), place: place(flags) });
  },
};

module.exports = {
  summary: 'skills you write yourself, added to one project or the whole machine',
  default: 'ls',
  actions,
};
