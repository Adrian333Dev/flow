'use strict';
/**
 * Harm 3, touching shared systems: a deploy or cloud tool doing more than
 * read, a docker push or volume delete, a database drop.
 */

const path = require('path');
const { literal, positionals, flagValue } = require('./words');

// Deploy and cloud tools. Each asks unless one of its words reads and none changes anything.
const SHARED = new Set(['kubectl', 'helm', 'terraform', 'tofu', 'terragrunt', 'pulumi', 'aws', 'gcloud', 'az', 'gh', 'glab',
  'vercel', 'netlify', 'fly', 'flyctl', 'firebase', 'wrangler', 'heroku', 'railway', 'doctl', 'eksctl']);

const READS = new Set(['get', 'list', 'ls', 'describe', 'show', 'status', 'logs', 'log', 'view', 'inspect', 'whoami',
  'version', 'info', 'history', 'diff', 'plan', 'preview', 'validate', 'fmt', 'output', 'dev', 'build', 'serve', 'tail',
  'help', 'pull', 'top', 'explain', 'search', 'events', 'lint', 'template', 'checks', 'watch', 'download', 'clone',
  'checkout', 'init', 'providers', 'graph', 'test', 'emulators:start', 'emulators:exec', 'api-resources',
  'api-versions', 'cluster-info', 'current-context', 'get-contexts']);

const CHANGES = new Set(['deploy', 'delete', 'rm', 'remove', 'destroy', 'apply', 'create', 'up', 'down', 'publish',
  'push', 'set', 'update', 'upgrade', 'install', 'uninstall', 'scale', 'restart', 'promote', 'put', 'patch', 'replace',
  'edit', 'import', 'drain', 'cordon', 'taint', 'exec', 'merge', 'close', 'reopen', 'comment', 'approve', 'rollback',
  'use-context', 'annotate', 'label', 'expose', 'run', 'cancel', 'rerun', 'sync', 'transfer', 'archive', 'fork']);

const SHARED_VALUE_FLAGS = new Set(['-n', '--namespace', '--context', '--cluster', '--kubeconfig', '-l', '--selector',
  '-o', '--output', '-c', '--container', '-f', '--filename', '--profile', '--region', '--project', '--zone', '-R',
  '--repo', '-q', '--jq', '-t', '--template', '-X', '--method', '--query', '-a', '--app', '--config', '-s', '--stack',
  '--scope', '-e', '--env', '--org', '--team', '-H', '--header', '-L', '--limit']);

const VERSION_FLAGS = new Set(['--version', '-v', '-V', '--help', '-h']);

function shared({ program, args }) {
  if (SHARED.has(program)) {
    const r = args.map(literal);
    const words = positionals(args, SHARED_VALUE_FLAGS).map(literal);
    if ((program === 'gh' || program === 'glab') && words[0] === 'api') {
      const method = flagValue(r, ['-X', '--method']);
      const writes = method !== null && !/^GET$/i.test(method);
      const fields = r.some((t) => ['-f', '-F', '--field', '--raw-field', '--input'].includes(t));
      return writes || fields ? `Changes a shared system: ${program} api` : null;
    }
    // A bare `vercel` deploys. Every other tool here prints its help.
    if (!words.length) {
      const harmless = r.length ? r.every((t) => t && VERSION_FLAGS.has(t)) : program !== 'vercel';
      return harmless ? null : `Changes a shared system: ${program}`;
    }
    const reads = words.some((t) => t && (READS.has(t) || /^(get|list|describe|show)-/.test(t)));
    const changes = words.some((t) => t && CHANGES.has(t));
    return reads && !changes ? null : `Changes a shared system: ${program} ${words.filter(Boolean).join(' ')}`;
  }

  if (program === 'docker' || program === 'podman' || program === 'docker-compose') {
    const words = positionals(args, new Set(['-f', '--file', '-p', '--project-name', '-H', '--host', '--context'])).map(literal);
    const r = args.map(literal);
    const volumes = r.includes('-v') || r.includes('--volumes');
    if (words[0] === 'push' || (words[0] === 'image' && words[1] === 'push')) return 'Pushes an image to a registry';
    if (words[0] === 'volume' && ['rm', 'remove', 'prune'].includes(words[1])) return 'Deletes a docker volume and its data';
    if (words[0] === 'system' && words[1] === 'prune' && volumes) return 'Deletes docker volumes and their data';
    if ((program === 'docker-compose' || words[0] === 'compose') && words.includes('down') && volumes) {
      return 'Deletes docker compose volumes and their data';
    }
  }
  return null;
}

/** The text a command reads from its here-docs and here-strings. */
const hereInput = (cmd) => cmd.redirects.map((r) => r.body ?? (r.op === '<<<' && r.target ? r.target.raw : null)).filter((s) => s !== null);

const DATABASES = new Set(['psql', 'mysql', 'mariadb', 'sqlite3', 'mongosh', 'mongo', 'cockroach', 'clickhouse-client', 'redis-cli']);
const WIPE = /\b(drop\s+(table|database|schema|view|index|collection|user|role)\b|truncate\b|dropDatabase\s*\(|\.drop\s*\(|flushall\b|flushdb\b)/i;

function database({ program, args }, cmd) {
  if (DATABASES.has(program)) {
    const fed = [];
    for (let c = cmd.pipeFrom; c; c = c.pipeFrom) fed.push(...c.words.map((w) => w.raw));
    const source = [...args.map((w) => w.raw), ...hereInput(cmd), ...fed].join('\n');
    if (WIPE.test(source)) return 'Drops or wipes database data';
  }
  if (program === 'dropdb' || program === 'dropuser') return `Drops a database with ${program}`;
  const words = positionals(args).map(literal);
  if (program === 'prisma' && ((words[0] === 'migrate' && words[1] === 'reset')
    || args.some((w) => ['--force-reset', '--accept-data-loss'].includes(literal(w))))) {
    return 'Resets the database with prisma';
  }
  if ((program === 'rails' || program === 'rake') && words.some((t) => t && /^db:(drop|reset|purge|schema:load|truncate_all|migrate:reset)/.test(t))) {
    return 'Resets the database with rails';
  }
  if (/^python[\d.]*$/.test(program) && path.basename(words[0] ?? '') === 'manage.py' && ['flush', 'reset_db'].includes(words[1])) {
    return 'Wipes the database with django';
  }
  return null;
}

module.exports = { shared, database, hereInput, VERSION_FLAGS };
