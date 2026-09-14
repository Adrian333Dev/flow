'use strict';
/**
 * `flow contribute`: sends this project's waiting findings to the
 * `domain-skills` repository, one pull request per skill.
 *
 * A finding waits in `.flow/findings/<skill>/`. `/file-findings` moves it there
 * on a yes and runs this command, which deletes each file once its pull request
 * is open. A failed send leaves the files where they are for the next run.
 *
 * The pull request is never merged. `/fold` reads every open one for a skill,
 * rewrites the skill, and closes each with a comment saying what went in. So
 * the open pull requests are the queue, readable from any machine, and 2
 * findings sharing a file name never meet in git.
 *
 * Everything goes through `gh api`, with no checkout, so the only setup is
 * `gh auth login`: no git identity, no push credentials, and the everyday clone
 * is never touched. Someone who cannot push to the repository gets a fork
 * first, since a pull request's branch has to live where its author can write.
 * Asking GitHub for a fork that already exists returns the existing one.
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { out } = require('../lib/cli');
const { FlowError } = require('../lib/error');
const { projectRoot } = require('../lib/root');

const REPO = 'Adrian333Dev/domain-skills';

/** gh's parsed JSON output, or a message saying which call failed and why. */
function gh(args, body) {
  const result = spawnSync('gh', args, {
    encoding: 'utf8',
    input: body === undefined ? undefined : JSON.stringify(body),
  });
  if (result.error && result.error.code === 'ENOENT') {
    throw new FlowError('gh is not on PATH, and flow contribute sends through it: https://cli.github.com');
  }
  if (result.status !== 0) {
    const said = (result.stderr || result.stdout || '').trim();
    throw new FlowError(`gh ${args.filter((a) => a !== '--input' && a !== '-').join(' ')} failed: ${said}`);
  }
  return result.stdout.trim() ? JSON.parse(result.stdout) : {};
}

/** A synchronous wait, for a fork GitHub is still creating. */
function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

/** Every skill folder under `.flow/findings/` holding at least one finding. */
function waiting(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => ({
      skill: e.name,
      folder: path.join(dir, e.name),
      files: fs.readdirSync(path.join(dir, e.name)).filter((f) => f.endsWith('.md')).sort(),
    }))
    .filter((b) => b.files.length)
    .sort((a, b) => a.skill.localeCompare(b.skill));
}

/**
 * Where the branch goes: the repository itself for someone who can push to it,
 * their fork for everyone else.
 */
function target() {
  const repo = gh(['api', `repos/${REPO}`]);
  if (repo.permissions && repo.permissions.push) {
    return { name: REPO, head: (branch) => branch, base: repo.default_branch, fresh: false };
  }
  const fork = gh(['api', '-X', 'POST', `repos/${REPO}/forks`]);
  const owner = fork.full_name.split('/')[0];
  return { name: fork.full_name, head: (branch) => `${owner}:${branch}`, base: repo.default_branch, fresh: true };
}

/** The commit a new branch starts from. A fork just asked for can take a few seconds to exist. */
function startingPoint(to) {
  const tries = to.fresh ? 5 : 1;
  for (let i = 1; ; i++) {
    try {
      return gh(['api', `repos/${to.name}/git/ref/heads/${to.base}`]).object.sha;
    } catch (e) {
      if (i >= tries) throw e;
      sleep(2000);
    }
  }
}

/** One skill's findings as one pull request. Returns its address. */
function send(batch, to) {
  const { skill, folder, files } = batch;
  gh(['api', `repos/${REPO}/contents/skills/${skill}`]);

  const stamp = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15);
  const branch = `findings/${skill}-${stamp}`;
  gh(['api', '-X', 'POST', `repos/${to.name}/git/refs`, '--input', '-'],
    { ref: `refs/heads/${branch}`, sha: startingPoint(to) });

  for (const file of files) {
    gh(['api', '-X', 'PUT', `repos/${to.name}/contents/skills/${skill}/findings/${file}`, '--input', '-'], {
      message: `Finding for ${skill}: ${file}`,
      content: fs.readFileSync(path.join(folder, file)).toString('base64'),
      branch,
    });
  }

  const pull = gh(['api', '-X', 'POST', `repos/${REPO}/pulls`, '--input', '-'], {
    title: `Findings for ${skill}`,
    head: to.head(branch),
    base: to.base,
    body: [
      `${files.length} finding${files.length === 1 ? '' : 's'} for \`${skill}\`, sent by \`flow contribute\`:`,
      '',
      ...files.map((f) => `- \`${f}\``),
      '',
      'A finding is never merged. The maintainer checks it, folds it into the skill, and closes this pull request with what went in.',
    ].join('\n'),
  });
  return pull.html_url;
}

const actions = {};

actions.contribute = {
  section: 'share',
  summary: 'send the findings waiting in .flow/findings/<skill>/ to domain-skills, one pull request per skill',
  run() {
    const dir = path.join(projectRoot(), '.flow', 'findings');
    const batches = waiting(dir);
    if (!batches.length) {
      out('nothing to send: no finding waits in .flow/findings/<skill>/.');
      return 0;
    }

    const to = target();
    let failed = 0;
    for (const batch of batches) {
      if (!/^[a-z0-9][a-z0-9-]*$/.test(batch.skill)) {
        out(`${batch.skill}: not a skill name, so its findings stay.`);
        failed++;
        continue;
      }
      try {
        const url = send(batch, to);
        for (const file of batch.files) fs.rmSync(path.join(batch.folder, file));
        if (!fs.readdirSync(batch.folder).length) fs.rmdirSync(batch.folder);
        out(`${batch.skill}: ${batch.files.length} sent, ${url}`);
      } catch (e) {
        if (!(e instanceof FlowError)) throw e;
        out(`${batch.skill}: not sent, so its findings stay in .flow/findings/${batch.skill}/.\n  ${e.message}`);
        failed++;
      }
    }
    return failed ? 1 : 0;
  },
};

module.exports = actions;
