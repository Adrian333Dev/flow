'use strict';
/**
 * Harm 4, changing the machine outside the project: a global install, a
 * scheduled job or background service, killing programs by name. Also every
 * write into a protected place: ~/.ssh, a shell startup file, the global git
 * settings, and the setup of Claude Code and Flow, which harm 5 covers.
 */

const path = require('path');
const { literal, isInside, pathOf, positionals } = require('./words');
const { VERSION_FLAGS } = require('./shared-systems');

function inVirtualEnv(programText, ctx) {
  return Boolean(ctx.world.env('VIRTUAL_ENV') || ctx.world.env('CONDA_PREFIX')) || /(^|\/)\.?venv\//.test(programText);
}

function machine({ program, args, programText }, ctx) {
  const r = args.map(literal);
  const words = positionals(args).map(literal);
  const global = r.some((t) => ['-g', '--global', '--location=global'].includes(t));

  if (['npm', 'pnpm', 'yarn', 'bun'].includes(program)) {
    if (global && ['install', 'i', 'add', 'in', 'isntall', 'update', 'up', 'upgrade', 'link', 'ln', 'remove', 'rm', 'uninstall', 'un'].includes(words[0])) {
      return `Installs globally with ${program}, outside this project`;
    }
    if (program === 'yarn' && words[0] === 'global') return 'Installs globally with yarn, outside this project';
  }

  const pipModule = /^python[\d.]*$/.test(program) && r[0] === '-m' && r[1] === 'pip';
  if (/^pip[\d.]*$/.test(program) || pipModule) {
    const verb = pipModule ? literal(args[2]) : words[0];
    const rest = pipModule ? args.slice(3).map(literal) : r;
    if (['install', 'uninstall'].includes(verb)) {
      if (rest.includes('--user')) return 'Installs with pip into your user folder, outside this project';
      if (!rest.some((t) => ['--target', '-t', '--prefix', '--root', '--dry-run'].includes(t)) && !inVirtualEnv(programText, ctx)) {
        return 'Installs with pip outside a virtual environment';
      }
    }
  }
  if (program === 'uv' && ((words[0] === 'pip' && r.includes('--system')) || (words[0] === 'tool' && ['install', 'upgrade'].includes(words[1])))) {
    return 'Installs with uv, outside this project';
  }
  if (program === 'pipx' && !['list', undefined].includes(words[0]) && !r.every((t) => VERSION_FLAGS.has(t))) {
    return 'Installs or runs a package with pipx, outside this project';
  }
  if ((program === 'cargo' || program === 'go' || program === 'gem') && words[0] === 'install') return `Installs globally with ${program}, outside this project`;
  if (program === 'gem' && words[0] === 'uninstall') return 'Uninstalls a gem, outside this project';
  if (program === 'brew' && words.length && !['list', 'ls', 'info', 'search', 'config', 'doctor', 'outdated', 'deps', 'leaves', 'home', 'desc', 'uses', 'help'].includes(words[0])) {
    return `Changes this machine: brew ${words[0]}`;
  }

  if (program === 'crontab' && !r.includes('-l')) return 'Changes your scheduled jobs';
  if (program === 'systemctl' && words.length && !['status', 'show', 'list-units', 'list-unit-files', 'list-timers', 'list-sockets', 'is-active', 'is-enabled', 'is-failed', 'cat', 'help'].includes(words[0])) {
    return `Changes a background service: systemctl ${words[0]}`;
  }
  if (program === 'launchctl' && words.length && !['list', 'print', 'print-disabled', 'help', 'version', 'blame'].includes(words[0])) {
    return `Changes a background service: launchctl ${words[0]}`;
  }
  if (program === 'pkill' || program === 'killall') return `Stops programs by name with ${program}`;
  return null;
}

// Where a write could lock you out, change every shell, or switch Flow and this guard off.
// Each place carries what a write there is, for "Writes into <path>, <what>".
function protectedPlaces({ root, world }) {
  const home = world.home;
  const setup = "Claude Code's or Flow's setup, which could switch the guard off";
  const startup = 'a shell startup file';
  return [
    [path.join(home, '.ssh'), 'where your login keys live'],
    [path.join(home, '.claude'), setup],
    [path.join(home, '.flow'), setup],
    [path.join(home, '.agents'), setup],
    [path.join(root, '.claude', 'settings.json'), setup],
    [path.join(root, '.claude', 'settings.local.json'), setup],
    [path.join(home, '.gitconfig'), 'your global git settings'],
    [path.join(home, '.config', 'git'), 'your global git settings'],
    ...['.bashrc', '.bash_profile', '.bash_login', '.bash_logout', '.profile', '.zshrc', '.zprofile', '.zshenv', '.zlogin', '.config/fish']
      .map((f) => [path.join(home, f), startup]),
  ];
}

/** The words a command writes to, beyond its redirects. */
function writeTargets({ program, args }) {
  const r = args.map(literal);
  const pos = (valueFlags) => positionals(args, new Set(valueFlags));
  switch (program) {
    case 'tee':
      return pos([]);
    case 'cp':
    case 'mv':
    case 'install':
    case 'ln': {
      const t = r.indexOf('-t');
      if (t >= 0 && args[t + 1]) return [args[t + 1]];
      const words = pos(['-S', '--suffix', '-m', '--mode', '-o', '--owner', '-g', '--group']);
      return program === 'mv' ? words : words.slice(-1);
    }
    case 'sed':
    case 'gsed': {
      if (!r.some((t) => t && (/^-[^-]*i/.test(t) || t.startsWith('--in-place')))) return [];
      const scripted = r.some((t) => ['-e', '-f', '--expression', '--file'].includes(t));
      const words = pos(['-e', '-f', '--expression', '--file', '-l']);
      return scripted ? words : words.slice(1);
    }
    case 'perl':
      return r.some((t) => t && /^-[a-zA-Z]*i/.test(t)) ? pos(['-e', '-E', '-M', '-I', '-m']) : [];
    case 'truncate':
      return pos(['-s', '--size', '-r', '--reference']);
    case 'chmod':
    case 'chown':
    case 'chgrp':
      return pos(['--reference']).slice(1);
    case 'dd': {
      const target = args.find((w) => (literal(w) ?? '').startsWith('of='));
      return target ? [{ ...target, parts: [literal(target).slice(3)] }] : [];
    }
    default:
      return [];
  }
}

/** Why writing to `word` touches a place listed in `protectedPlaces`, or null. */
function protectedWrite(word, ctx) {
  const p = pathOf(word, ctx);
  if (p === null) return null;
  for (const candidate of new Set([p, ctx.world.real(p)])) {
    for (const [place, reason] of protectedPlaces(ctx)) {
      // A project that itself lives in one of these folders may still write to its own files.
      if (isInside(place, ctx.root) && isInside(ctx.root, candidate) && !candidate.startsWith(path.join(ctx.root, '.claude'))) continue;
      if (isInside(place, candidate)) return `Writes into ${word.raw}, ${reason}`;
    }
  }
  return null;
}

module.exports = { machine, writeTargets, protectedWrite };
