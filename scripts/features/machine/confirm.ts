/**
 * Questions put to the person at the terminal, for `flow install` and
 * `flow init`. The terminal is `/dev/tty` rather than stdin, so a pipe, a
 * heredoc and `yes |` all miss it, and an agent's commands, which have none,
 * take the fallback: an install with no answers still has work to do.
 */

import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { FlowError } from '../../shared/error.ts';

/**
 * True where a terminal is attached, so there is somebody to ask.
 *
 * `flow install` asks the machine's name, and signs `gh` in, only when this
 * says yes. With nobody at the keyboard, a test included, the name is the
 * offered one, and a `gh` signed out stops the install.
 */
function hasTerminal() {
  try {
    fs.closeSync(fs.openSync('/dev/tty', 'r'));
    return true;
  } catch {
    return false;
  }
}

/**
 * One typed line, or `fallback` for an empty one. Ask `hasTerminal()` first:
 * with no terminal this returns the fallback without asking anything.
 *
 * `shown` is the answer Enter takes, printed after the question in dim text
 * that the first key typed erases. Pass '' where the question already names
 * it, as `(y/N)` does. Dim text needs the terminal to hand over each key as it
 * is pressed, so `stty` switches that on and the `finally` puts it back. The
 * terminal's own Ctrl+C would kill the process before that runs, so `-isig`
 * hands Ctrl+C over as a key too. Where `stty` fails, or colour is off, the
 * answer shows as `(shop)` and the line is read as typed.
 */
function ask(question, fallback, shown = fallback) {
  let tty;
  try {
    tty = fs.openSync('/dev/tty', 'r');
  } catch {
    return fallback;
  }
  try {
    const saved = shown && dims() ? stty(tty, ['-g']) : null;
    if (saved && stty(tty, ['-icanon', '-echo', '-isig', 'min', '1']) !== null) {
      try {
        return keys(tty, question, shown) || fallback;
      } finally {
        stty(tty, [saved]);
      }
    }
    process.stdout.write(shown ? `${question}(${shown}) ` : question);
    const buffer = Buffer.alloc(1);
    let typed = '';
    while (fs.readSync(tty, buffer, 0, 1, null) === 1 && buffer[0] !== 10) typed += buffer.toString();
    return typed.trim() || fallback;
  } finally {
    fs.closeSync(tty);
  }
}

/** Whether dim text shows: a terminal, colour not switched off. */
function dims() {
  return Boolean(process.stdout.isTTY) && !('NO_COLOR' in process.env) && process.env.TERM !== 'dumb';
}

/** Run `stty` on the terminal. Its output trimmed, or null where it failed. */
function stty(tty, args) {
  try {
    return execFileSync('stty', args, { stdio: [tty, 'pipe', 'ignore'], encoding: 'utf8' }).trim();
  } catch {
    return null;
  }
}

/** Read one key at a time, drawing the line, with `shown` dim while nothing is typed. */
function keys(tty, question, shown) {
  const hint = () => process.stdout.write(`\x1b[2m${shown}\x1b[0m\x1b[${shown.length}D`);
  process.stdout.write(question);
  hint();
  const buffer = Buffer.alloc(1);
  let typed = Buffer.alloc(0);
  for (;;) {
    if (fs.readSync(tty, buffer, 0, 1, null) !== 1) break;
    const b = buffer[0];
    if (b === 10 || b === 13 || b === 4) break;
    if (b === 3) {
      process.stdout.write('\n');
      throw new FlowError('Stopped.');
    }
    if (b === 127 || b === 8) {
      if (!typed.length) continue;
      let cut = typed.length - 1;
      while (cut > 0 && (typed[cut] & 0xc0) === 0x80) cut--;
      typed = typed.subarray(0, cut);
      process.stdout.write('\b \b');
      if (!typed.length) hint();
      continue;
    }
    if (b === 27) {
      fs.readSync(tty, buffer, 0, 1, null);
      if (buffer[0] === 91) while (fs.readSync(tty, buffer, 0, 1, null) === 1 && (buffer[0] < 64 || buffer[0] > 126));
      continue;
    }
    if (b < 32) continue;
    if (!typed.length) process.stdout.write('\x1b[K');
    typed = Buffer.concat([typed, Buffer.from([b])]);
    process.stdout.write(Buffer.from([b]));
  }
  process.stdout.write(typed.length ? '\n' : `\x1b[K${shown}\n`);
  return typed.toString().trim();
}

export { hasTerminal, ask };
