'use strict';
/**
 * Everything Flow puts on a machine, in one list, read by the 2 commands that
 * make it and take it away.
 *
 * `flow install` records every path here in the machine's original before it
 * creates anything, so putting that original back reaches the links that made
 * `flow` typeable in the first place. `flow uninstall` deletes every path here
 * on a machine whose original was never written, which is the only way off for
 * a machine set up before originals existed.
 *
 * The list derives itself wherever it can: the agents and the rules are read
 * off the clone's own folders, so a new file in either reaches both commands
 * by existing. What is left is 6 fixed paths and the names in `~/.local/bin`.
 *
 * 1 of the paths is written by `/flow:setup-machine` rather than by install:
 * the rule file `~/.agents/AGENTS.md`. Install still records it, so whatever
 * was there before Flow is in the original whether or not that skill ever
 * runs.
 *
 * `shared()` is the other half of a machine, and nothing ever deletes it: 2
 * files that are the user's, which Flow adds lines to. An uninstall takes
 * Flow's lines back out and leaves the file where it is.
 *
 * `strip()` and `stripShared()` are the taking off, and they live here beside
 * the list they read rather than inside `flow uninstall`. A test cannot reach
 * anything inside that command: it is behind a word typed at a terminal, on
 * purpose, and a test has no terminal.
 */

const fs = require('fs');
const path = require('path');
const { markdownFiles } = require('./links');
const machine = require('./machine');
const skills = require('./skills');

const show = machine.shorten;

/**
 * The names you type, against the one script both of them run.
 *
 * `fw` is the second name because `flow` is typed all day. `util` and `u`
 * are util's own, made by `util install` from `~/.flow/repos/util/`, which
 * `flow install` runs.
 */
const BIN = {
  flow: path.join('scripts', 'flow', 'flow.js'),
  fw: path.join('scripts', 'flow', 'flow.js'),
};

/**
 * Every path Flow owns on this machine, in the order install creates them.
 *
 * `bin` is `~/.local/bin` or null, matching `flow install --no-bin`: a scratch
 * install writes no typed name, so there is none to record or remove.
 */
function paths(clone, at, { bin = null } = {}) {
  const found = [
    skills.pluginDir(at.agents),
    skills.pluginLink(at.claude),
    ...markdownFiles(path.join(clone, 'agents')).map((f) => path.join(at.claude, 'agents', f)),
    ...markdownFiles(path.join(clone, 'rules')).map((f) => path.join(at.claude, 'rules', f)),
    path.join(at.flow, 'scripts'),
    path.join(at.flow, 'references'),
    path.join(at.flow, 'docs'),
    path.join(at.agents, 'AGENTS.md'),
  ];
  if (bin) for (const name of Object.keys(BIN)) found.push(path.join(bin, name));
  return found;
}

/** The 2 files Flow writes lines into and never owns. */
const shared = (at) => [
  { path: path.join(at.claude, 'settings.json'), what: "Flow's hooks and its permission rules" },
  { path: path.join(at.claude, 'CLAUDE.md'), what: 'the one line importing the rule file' },
];

/**
 * Remove every path Flow owns, for a machine that has no original.
 *
 * Whatever those paths held before Flow is gone, which is the whole reason the
 * original exists. `flow install` writes one on every machine from 2026-09-20
 * on, so this is the way off a machine installed before that.
 */
function strip(clone, at, { bin = null } = {}) {
  const done = [];
  for (const p of paths(clone, at, { bin })) {
    try {
      fs.lstatSync(p);
    } catch {
      continue;
    }
    fs.rmSync(p, { recursive: true, force: true });
    done.push(`removed ${show(p)}`);
  }
  return [...done, ...stripShared(at)];
}

/**
 * Flow's lines out of the 2 files that are the user's: its hooks out of
 * `settings.json`, and the import line out of `CLAUDE.md`.
 *
 * A hook is Flow's when the command it runs names a path inside `~/.flow/`,
 * which every one of Flow's does: they run a script from `.flow/scripts/` or
 * print a file from `.flow/references/`. An event left with no hooks goes, and
 * so does `CLAUDE.md` where the import line was all it held.
 *
 * The permission rules Flow's template carries are left where they are. There
 * is no way to tell one the user chose from one that was merged in, and
 * guessing wrong here takes away a rule that was theirs.
 */
function stripShared(at) {
  const done = [];
  const [settingsFile, claudeRules] = shared(at).map((f) => f.path);

  let live = null;
  try {
    live = JSON.parse(fs.readFileSync(settingsFile, 'utf8'));
  } catch (e) {
    if (e.code !== 'ENOENT') done.push(`${show(settingsFile)} does not parse, so Flow's hooks are still in it`);
  }
  if (live && live.hooks) {
    let taken = 0;
    for (const [event, entries] of Object.entries(live.hooks)) {
      const kept = (entries || [])
        .map((entry) => {
          const hooks = (entry.hooks || []).filter((h) => !String(h.command || '').includes(`.flow${path.sep}`));
          taken += (entry.hooks || []).length - hooks.length;
          return { ...entry, hooks };
        })
        .filter((entry) => entry.hooks.length);
      if (kept.length) live.hooks[event] = kept;
      else delete live.hooks[event];
    }
    if (!Object.keys(live.hooks).length) delete live.hooks;
    fs.writeFileSync(settingsFile, JSON.stringify(live, null, 2) + '\n');
    done.push(`took ${taken} hook${taken === 1 ? '' : 's'} out of ${show(settingsFile)}`);
    done.push(`the rest of ${show(settingsFile)} is yours, Flow's permission rules included`);
  }

  let text = null;
  try {
    text = fs.readFileSync(claudeRules, 'utf8');
  } catch {
    return done;
  }
  const left = text.split('\n').filter((l) => !/^@.*AGENTS\.md$/.test(l.trim())).join('\n');
  if (left.trim() === '') {
    fs.rmSync(claudeRules);
    done.push(`removed ${show(claudeRules)}, which held the import line and nothing else`);
  } else if (left !== text) {
    fs.writeFileSync(claudeRules, left);
    done.push(`took the import line out of ${show(claudeRules)}`);
  }
  return done;
}

/**
 * Remove every link in `dirs` pointing into `~/.flow/`, before that folder
 * goes: a skill from a source, switched on for the machine or a project, and
 * util's names, which link into `repos/util/`. No list names them, since the
 * settings decide which exist, so they are found by where they point.
 */
function unlinkInto(flowHome, dirs) {
  const done = [];
  for (const dir of dirs) {
    let entries = [];
    try {
      entries = fs.readdirSync(dir);
    } catch {
      continue;
    }
    for (const name of entries) {
      const at = path.join(dir, name);
      let target;
      try {
        target = path.resolve(dir, fs.readlinkSync(at));
      } catch {
        continue;
      }
      if (!target.startsWith(flowHome + path.sep)) continue;
      fs.unlinkSync(at);
      done.push(`removed ${show(at)}`);
    }
  }
  return done;
}

module.exports = { BIN, paths, shared, strip, stripShared, unlinkInto };
