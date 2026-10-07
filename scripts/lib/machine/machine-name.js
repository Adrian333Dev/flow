'use strict';
/**
 * The name `flow install` offers a machine: what sort of computer it is, and
 * the system it runs, `pc-wsl` or `laptop-ubuntu`. A Mac is offered its model
 * name instead, `macbook-pro`, which says both. A name another machine's
 * record already holds gets a number, `macbook-pro-2`.
 *
 * The sort of computer is the chassis type the firmware reports, read with no
 * root: `/sys/class/dmi/id/chassis_type` on Linux. WSL has no such file, so
 * Windows is asked through PowerShell, which takes under a second. A type
 * nothing reports, such as a cloud server's "Other", leaves the system alone
 * as the name. A Mac's model is the `Model Name:` line of `system_profiler
 * SPHardwareDataType`, since `sysctl hw.model` says only `Mac14,2` on newer
 * ones. No such line leaves `mac`.
 *
 * `FLOW_MACHINE_DEFAULT` replaces the whole guess, for the tests: a run that
 * asked PowerShell on every scratch install would take minutes.
 */

const fs = require('fs');
const { spawnSync } = require('child_process');

/** SMBIOS chassis types, grouped into the 3 words a name uses. */
const LAPTOP = [8, 9, 10, 11, 14, 30, 31, 32];
const DESKTOP = [3, 4, 5, 6, 7, 13, 15, 16, 24, 35, 36];
const SERVER = [17, 23, 28];

/** `laptop`, `pc`, `server`, or null for a type that says none of them. */
function typeOf(number) {
  if (LAPTOP.includes(number)) return 'laptop';
  if (DESKTOP.includes(number)) return 'pc';
  if (SERVER.includes(number)) return 'server';
  return null;
}

const read = (file) => {
  try {
    return fs.readFileSync(file, 'utf8');
  } catch {
    return '';
  }
};

/** `wsl`, `mac`, or the Linux distribution's own short id, such as `ubuntu`. */
function system() {
  if (process.platform === 'darwin') return 'mac';
  if (process.platform !== 'linux') return process.platform;
  if (/microsoft/i.test(read('/proc/version'))) return 'wsl';
  const id = read('/etc/os-release').match(/^ID="?([^"\n]+)"?$/m);
  return id ? id[1] : 'linux';
}

/** The sort of computer, or null where nothing says. */
function type(sys) {
  if (sys === 'wsl') {
    const asked = spawnSync('powershell.exe',
      ['-NoProfile', '-Command', '(Get-CimInstance Win32_SystemEnclosure).ChassisTypes'],
      { encoding: 'utf8', timeout: 10000 });
    return typeOf(Number((asked.stdout || '').trim().split(/\s+/)[0]));
  }
  return typeOf(Number(read('/sys/class/dmi/id/chassis_type').trim()));
}

/** The model in `system_profiler SPHardwareDataType` output, `macbook-pro`, or null. */
function macModel(text) {
  const line = String(text).match(/^\s*Model Name:\s*(.+)$/m);
  return line && clean(line[1]) ? clean(line[1]) : null;
}

/** This machine's name before any clash: `pc-wsl`, `macbook-pro`, or `ubuntu` where the type is unknown. */
function base() {
  if (process.env.FLOW_MACHINE_DEFAULT) return process.env.FLOW_MACHINE_DEFAULT;
  const sys = system();
  if (sys === 'mac') {
    const asked = spawnSync('system_profiler', ['SPHardwareDataType'], { encoding: 'utf8', timeout: 10000 });
    return macModel(asked.stdout || '') || 'mac';
  }
  const sort = type(sys);
  return sort ? `${sort}-${sys}` : sys;
}

/** The first of `start`, `start-2`, `start-3` no name in `taken` holds. */
function suggest(taken, start = base()) {
  if (!taken.includes(start)) return start;
  let n = 2;
  while (taken.includes(`${start}-${n}`)) n++;
  return `${start}-${n}`;
}

/** A typed name as a name can be: lowercase letters, digits and dashes. Empty where none are left. */
const clean = (raw) => String(raw).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

module.exports = { typeOf, system, macModel, base, suggest, clean };
