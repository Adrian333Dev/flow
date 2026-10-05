'use strict';
/**
 * Harm 6, reading a secret into the conversation: a private key, a cloud or
 * GitHub login, a `.env` file. Whatever a command prints lands in the
 * transcript, which goes to the model's servers.
 *
 * A command naming a secret asks, unless its program only looks at the file
 * or uses it without printing it, such as `ls`, `chmod`, `ssh` or `source`.
 * A `<` from a secret always asks. The file tool's reads come through
 * `secretRead()`.
 */

const path = require('path');
const { literal, expandAll, positionals, isInside } = require('./words');

// Under the home folder: a folder whose every file is a secret, or one file.
const HOME_FOLDERS = ['.ssh', '.aws', '.gnupg', '.azure', '.config/gcloud'];
const HOME_FILES = ['.kube/config', '.docker/config.json', '.config/gh/hosts.yml', '.npmrc', '.pypirc',
  '.claude/.credentials.json', '.codex/auth.json'];
// Inside ~/.ssh, the files holding no secret.
const SSH_PUBLIC = /(\.pub|^known_hosts(\.old)?|^authorized_keys|^config)$/;
// Secret wherever they sit.
const NAMES = new Set(['.env', '.netrc', '.git-credentials', 'id_rsa', 'id_dsa', 'id_ecdsa', 'id_ed25519']);
const ENV_EXAMPLE = /^\.env\.(example|sample|template|dist)$/;

// Programs that use a file without printing what it holds.
const QUIET = new Set(['ls', 'stat', 'test', '[', 'file', 'wc', 'du', 'touch', 'chmod', 'chown', 'rm', 'unlink', 'shred',
  'mv', 'cp', 'ln', 'mkdir', 'realpath', 'readlink', 'basename', 'dirname', 'find', 'echo', 'printf', 'source', '.',
  'ssh', 'scp', 'sftp', 'rsync', 'ssh-add', 'ssh-keygen', 'ssh-copy-id', 'docker', 'docker-compose']);
// The git commands that print a file's content.
const GIT_PRINTS = new Set(['show', 'diff', 'blame', 'log', 'grep', 'cat-file']);

/** Whether the file at `p` holds secrets. */
function isSecret(p, home) {
  const base = path.basename(p);
  if (NAMES.has(base) || /^\.env[*?[]/.test(base)) return true;
  if (base.startsWith('.env.') && !ENV_EXAMPLE.test(base)) return true;
  const rel = path.relative(home, p);
  if (rel.startsWith('..') || path.isAbsolute(rel)) return false;
  if (HOME_FILES.includes(rel)) return true;
  const folder = HOME_FOLDERS.find((f) => rel.startsWith(`${f}/`));
  return Boolean(folder) && !(folder === '.ssh' && SSH_PUBLIC.test(base));
}

/** The path as the user would write it: from the folder the command runs in, else from `~`. */
function shown(p, ctx) {
  if (ctx.dir && isInside(ctx.dir, p) && p !== ctx.dir) return path.relative(ctx.dir, p);
  return isInside(ctx.world.home, p) ? `~/${path.relative(ctx.world.home, p)}` : p;
}

/** The reason to ask before `word` is read, or null. */
function secretWord(word, ctx) {
  for (const t of expandAll(word, ctx) ?? []) {
    if (!path.isAbsolute(t) && ctx.dir === null) continue;
    const p = path.resolve(ctx.dir ?? '/', t);
    if (isSecret(p, ctx.world.home) && !ctx.world.isDir(p)) return `Reads ${shown(p, ctx)}, a file of secrets, into the conversation`;
  }
  return null;
}

function secrets({ program, args }, ctx) {
  if (QUIET.has(program)) return null;
  if (program === 'git' && !GIT_PRINTS.has(literal(positionals(args)[0]))) return null;
  for (const w of positionals(args)) {
    const reason = secretWord(w, ctx);
    if (reason) return reason;
  }
  return null;
}

/** The reason to ask before the file tool reads `file`, or null. */
function secretRead(file, cwd, world) {
  const p = path.resolve(cwd, file);
  if (!isSecret(p, world.home) || world.isDir(p)) return null;
  return `Reads ${shown(p, { dir: path.resolve(cwd), world })}, a file of secrets, into the conversation`;
}

module.exports = { secrets, secretWord, secretRead };
