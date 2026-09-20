'use strict';
/**
 * `flow contribute`: one pull request per skill, through gh.
 *
 * A fake `gh` sits first on PATH, so no test reaches GitHub. It logs every
 * call with its input to a file, and answers from what the test set: whether
 * the caller can push, and which skills the repository holds.
 */

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { project, write, run } = require('./helpers/scratch');

const FAKE_GH = `#!/usr/bin/env node
const fs = require('fs');
const args = process.argv.slice(2);
const input = args.includes('--input') ? fs.readFileSync(0, 'utf8') : '';
fs.appendFileSync(process.env.FAKE_GH_LOG, JSON.stringify({ args, input }) + '\\n');
const repo = 'Adrian333Dev/domain-skills';
const skills = process.env.FAKE_GH_SKILLS.split(',');
const reply = (body) => { process.stdout.write(JSON.stringify(body)); process.exit(0); };
const call = args.filter((a) => a !== '--input' && a !== '-').join(' ');
if (call === 'api repos/' + repo) reply({ default_branch: 'main', permissions: { push: process.env.FAKE_GH_PUSH === 'yes' } });
if (call === 'api -X POST repos/' + repo + '/forks') reply({ full_name: 'stranger/domain-skills' });
let m = call.match(/^api repos\\/[^/]+\\/domain-skills\\/contents\\/skills\\/([^/]+)$/);
if (m && skills.includes(m[1])) reply({});
if (/^api repos\\/[^/]+\\/domain-skills\\/git\\/ref\\/heads\\/main$/.test(call)) reply({ object: { sha: 'abc123' } });
if (/^api -X POST repos\\/[^/]+\\/domain-skills\\/git\\/refs$/.test(call)) reply({});
if (/^api -X PUT repos\\/[^/]+\\/domain-skills\\/contents\\//.test(call)) reply({});
if (call === 'api -X POST repos/' + repo + '/pulls') reply({ html_url: 'https://github.com/' + repo + '/pull/' + JSON.parse(input).title.length });
process.stderr.write('HTTP 404: Not Found');
process.exit(1);
`;

/** A project with findings waiting for react and postgres, and a fake gh. */
function setup(name, { push = false, skills = 'react,postgres' } = {}) {
  const dir = project(name);
  const bin = path.join(dir, 'bin');
  write(bin, 'gh', FAKE_GH);
  fs.chmodSync(path.join(bin, 'gh'), 0o755);
  const log = path.join(dir, 'gh.log');
  const root = path.join(dir, 'project');
  write(root, '.flow/findings/react/hydration-mismatch-from-server-date-formatting.md', '---\nskill: react\n---\nReact 19.1.\n');
  write(root, '.flow/findings/react/use-effect-runs-twice-in-strict-mode.md', '---\nskill: react\n---\nReact 19.1.\n');
  write(root, '.flow/findings/postgres/vacuum-skips-tables-with-open-transactions.md', '---\nskill: postgres\n---\nPostgres 17.\n');
  write(root, '.flow/findings/a-finding-not-yet-filed.md', 'still in the inbox\n');
  const flow = (env = {}) => run('flow/flow.js', ['contribute'], {
    cwd: root,
    env: {
      ...process.env,
      PATH: `${bin}${path.delimiter}${process.env.PATH}`,
      FLOW_PROJECT: root,
      FLOW_HOME: path.join(dir, 'flow-home'),
      FAKE_GH_LOG: log,
      FAKE_GH_PUSH: push ? 'yes' : 'no',
      FAKE_GH_SKILLS: skills,
      ...env,
    },
  });
  const calls = () => (fs.existsSync(log) ? fs.readFileSync(log, 'utf8').trim().split('\n').map((l) => JSON.parse(l)) : []);
  return { dir, root, flow, calls };
}

/** What gh was sent on every call matching the pattern, read without its `--input -`. */
const bodyOf = (calls, pattern) => calls
  .filter((c) => pattern.test(c.args.filter((a) => a !== '--input' && a !== '-').join(' ')))
  .map((c) => JSON.parse(c.input));

test('someone who cannot push gets a fork, and each skill gets its own pull request', () => {
  const { root, flow, calls } = setup('contribute-fork');

  const result = flow();
  assert.strictEqual(result.code, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /postgres: 1 sent, https:\/\/github\.com\/Adrian333Dev\/domain-skills\/pull\//);
  assert.match(result.stdout, /react: 2 sent, https:\/\/github\.com\//);

  const all = calls();
  assert.ok(all.some((c) => c.args.join(' ') === 'api -X POST repos/Adrian333Dev/domain-skills/forks'));
  const pulls = bodyOf(all, /\/pulls$/);
  assert.deepStrictEqual(pulls.map((p) => p.title), ['Findings for postgres', 'Findings for react']);
  assert.match(pulls[1].head, /^stranger:findings\/react-\d{8}T\d{6}$/);
  assert.strictEqual(pulls[1].base, 'main');

  const files = bodyOf(all, /-X PUT repos\/stranger\/domain-skills\/contents\/skills\/react\/findings\//);
  assert.strictEqual(files.length, 2, 'both react findings land on the fork');
  assert.strictEqual(Buffer.from(files[0].content, 'base64').toString(), '---\nskill: react\n---\nReact 19.1.\n');

  assert.ok(!fs.existsSync(path.join(root, '.flow/findings/react')), 'a sent folder is deleted');
  assert.ok(!fs.existsSync(path.join(root, '.flow/findings/postgres')));
  assert.ok(fs.existsSync(path.join(root, '.flow/findings/a-finding-not-yet-filed.md')), 'a finding outside a skill folder is not waiting to be sent');
});

test('someone who can push gets no fork, and the branch lives in the repository', () => {
  const { flow, calls } = setup('contribute-owner', { push: true });

  const result = flow();
  assert.strictEqual(result.code, 0, result.stdout + result.stderr);
  const all = calls();
  assert.ok(!all.some((c) => c.args.join(' ').endsWith('/forks')));
  assert.match(bodyOf(all, /\/pulls$/)[0].head, /^findings\/postgres-\d{8}T\d{6}$/);
  assert.strictEqual(bodyOf(all, /-X POST repos\/Adrian333Dev\/domain-skills\/git\/refs$/).length, 2);
});

test('a skill the repository does not hold keeps its findings, and the rest still go', () => {
  const { root, flow } = setup('contribute-missing', { skills: 'react' });

  const result = flow();
  assert.strictEqual(result.code, 1);
  assert.match(result.stdout, /postgres: not sent, so its findings stay in \.flow\/findings\/postgres\/\.\n\s+gh api repos\/Adrian333Dev\/domain-skills\/contents\/skills\/postgres failed: HTTP 404/);
  assert.match(result.stdout, /react: 2 sent/);
  assert.ok(fs.existsSync(path.join(root, '.flow/findings/postgres/vacuum-skips-tables-with-open-transactions.md')));
  assert.ok(!fs.existsSync(path.join(root, '.flow/findings/react')));
});

test('nothing waiting sends nothing, and a missing gh says so', () => {
  const { root, flow, calls } = setup('contribute-empty');
  fs.rmSync(path.join(root, '.flow/findings/react'), { recursive: true });
  fs.rmSync(path.join(root, '.flow/findings/postgres'), { recursive: true });

  const empty = flow();
  assert.strictEqual(empty.code, 0);
  assert.match(empty.stdout, /nothing to send/);
  assert.deepStrictEqual(calls(), [], 'gh is never called with nothing to send');

  write(root, '.flow/findings/react/one.md', '---\nskill: react\n---\n');
  const nowhere = path.join(root, 'no-bin');
  fs.mkdirSync(nowhere);
  const missing = flow({ PATH: nowhere });
  assert.strictEqual(missing.code, 1);
  assert.match(missing.stderr, /gh is not on PATH/);
  assert.ok(fs.existsSync(path.join(root, '.flow/findings/react/one.md')));
});
