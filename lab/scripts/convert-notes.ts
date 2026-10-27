#!/usr/bin/env node
/**
 * One-time conversion of the notes in the Flow home to name a project by its
 * ticket prefix: `project: global` becomes `home`, and a project's folder name
 * becomes the prefix this machine's registry holds for that folder. Only the
 * `project:` line of a note's header is rewritten, and the file keeps its
 * change time, since a list shows the newest change first. A note already in
 * the new shape changes nothing, so a second run is a no-op.
 *
 *   node lab/scripts/convert-notes.ts [--dry-run] [--map folder=prefix]...
 *
 * A folder the registry does not know is left as it is and named, so
 * `--map flow-dev=fw` can say what it was. Moves to lab/archive/ once the real
 * run is done on every machine.
 */

import fs from 'node:fs';
import path from 'node:path';
import * as notes from '../../scripts/features/notes/notes.ts';
import * as registry from '../../scripts/shared/registry.ts';
import * as store from '../../scripts/features/tickets/store.ts';

/** `folder name → prefix` from the registry, then `--map` pairs on top. */
function prefixesByFolder(extra) {
  const byFolder = {};
  for (const [prefix, folder] of Object.entries(registry.read())) byFolder[path.basename(folder).toLowerCase()] = prefix;
  return { ...byFolder, ...extra };
}

/** The word a note's `project:` should hold, or null where it already does or cannot be told. */
function convertedProject(current, byFolder, prefixes) {
  const word = current.toLowerCase();
  if (word === 'global') return store.HOME_WORD;
  if (word === store.HOME_WORD || prefixes.has(word)) return null;
  return byFolder[word] || null;
}

function main(argv) {
  const dry = argv.includes('--dry-run');
  const extra = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] !== '--map') continue;
    const [folder, prefix] = String(argv[++i]).split('=');
    if (!folder || !prefix || store.badWord(prefix)) {
      process.stderr.write(`--map takes folder=prefix, with a prefix of 2 to 8 lowercase letters (got "${argv[i]}").\n`);
      return 1;
    }
    extra[folder.toLowerCase()] = prefix;
  }

  const byFolder = prefixesByFolder(extra);
  const prefixes = new Set([...Object.keys(registry.read()), ...Object.values(extra)]);
  let changed = 0;
  const unknown = new Map();

  for (const note of notes.readNotes()) {
    const next = convertedProject(note.data.project, byFolder, prefixes);
    if (!next) {
      if (note.data.project !== store.HOME_WORD && !prefixes.has(note.data.project.toLowerCase())) {
        unknown.set(note.data.project, (unknown.get(note.data.project) || 0) + 1);
      }
      continue;
    }
    changed += 1;
    process.stdout.write(`${note.id}: ${note.data.project} → ${next}\n`);
    if (dry) continue;
    const before = fs.statSync(note.file);
    const text = fs.readFileSync(note.file, 'utf8');
    const rewritten = text.replace(/^---\n[\s\S]*?\n---/, (header) => header.replace(/^project:.*$/m, `project: ${next}`));
    fs.writeFileSync(note.file, rewritten);
    fs.utimesSync(note.file, before.atime, before.mtime);
  }

  process.stdout.write(`${dry ? 'would change' : 'changed'} ${changed} note${changed === 1 ? '' : 's'}.\n`);
  for (const [name, count] of unknown) {
    process.stdout.write(`left alone: ${count} note${count === 1 ? '' : 's'} of "${name}", a folder no project here registers. Run again with --map ${name}=<prefix>.\n`);
  }
  return 0;
}

process.exitCode = main(process.argv.slice(2));
