/**
 * Harms 5 and 6, a write into a place that matters: `~/.ssh`, where login
 * keys live, and the few files that can switch the guard off. Everything else
 * under `~/.claude`, `~/.flow` and `~/.agents` runs unchecked: tickets, the
 * wiki, logs, skills and rules steer the agent but cannot disable the guard.
 *
 * `~/.flow/projects/` stays off the list on purpose. A project's `.flow` is a
 * symlink into it and the guard judges real paths, so listing it would ask on
 * every write to a ticket or the inbox.
 */

import path from 'node:path';
import { literal, isInside, pathOf, positionals } from './words.ts';

// Where a write could lock you out or switch this guard off. Each place carries
// what a write there is, for "Write <path> · <what>". The one list.
function protectedPlaces({ root, world }) {
  const home = world.home;
  const off = 'can switch the guard off';
  return [
    [path.join(home, '.ssh'), 'login keys'],
    ...['settings.json', 'settings.local.json', 'plugins', 'dev-mods'].map((f) => [path.join(home, '.claude', f), off]),
    [path.join(root, '.claude', 'settings.json'), off],
    [path.join(root, '.claude', 'settings.local.json'), off],
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

/** Why writing to the absolute path `p`, which the reason names as `shown`, touches a place in `protectedPlaces`, or null. */
function protectedPath(p, shown, ctx) {
  for (const candidate of new Set([p, ctx.world.real(p)])) {
    for (const [place, reason] of protectedPlaces(ctx)) {
      // A project that itself lives in one of these folders may still write to its own files.
      if (isInside(place, ctx.root) && isInside(ctx.root, candidate) && !candidate.startsWith(path.join(ctx.root, '.claude'))) continue;
      if (isInside(place, candidate)) return `Write ${shown} · ${reason}`;
    }
  }
  return null;
}

/** Why writing to what `word` names touches a place listed in `protectedPlaces`, or null. */
function protectedWrite(word, ctx) {
  const p = pathOf(word, ctx);
  return p === null ? null : protectedPath(p, word.raw, ctx);
}

export { writeTargets, protectedPath, protectedWrite };
