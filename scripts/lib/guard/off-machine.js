'use strict';
/**
 * Harm 2, sending things off the machine: curl or wget sending data, a copy
 * to another host, ssh.
 */

const { literal, expand, positionals, flagValue, rsyncDestination } = require('./words');

const LOCAL = /^(https?:\/\/)?(localhost|127(\.\d+){3}|0\.0\.0\.0|\[::1\]|[\w.-]+\.localhost|host\.docker\.internal)(:\d+)?([/?#]|$)/i;
const WRITE_METHOD = /^(POST|PUT|PATCH|DELETE)$/i;

/** The first host the command names that is off this machine, else null. With no address found, "another machine". */
function offMachine(args, ctx) {
  const texts = args.map((w) => expand(w, ctx) ?? w.raw);
  const addresses = texts.filter((t) => /^[a-z][\w+.-]*:\/\//i.test(t) || /^[\w-]+(\.[\w-]+)+(:\d+)?(\/|$)/.test(t) || LOCAL.test(t));
  if (!addresses.length) return 'another machine';
  const away = addresses.find((t) => !LOCAL.test(t));
  return away ? away.replace(/^[a-z][\w+.-]*:\/\//i, '').replace(/[/?#].*$/, '') : null;
}

const remoteSpec = (w) => /^[^/\s:]+:/.test(literal(w) ?? '') || /^rsync:\/\//.test(literal(w) ?? '');
const hostOf = (w) => literal(w).replace(/^rsync:\/\//, '').split(/[:/]/)[0];

function network({ program, args }, ctx) {
  const r = args.map(literal);

  let sends = false;
  if (program === 'curl') {
    sends = r.some((t) => t && (/^--(data|data-\w+|form|form-string|upload-file|json)(=|$)/.test(t) || /^-[a-zA-Z]*[dFT]/.test(t)))
      || WRITE_METHOD.test(flagValue(r, ['-X', '--request']) ?? '');
  }
  if (program === 'wget') {
    sends = r.some((t) => t && /^--(post-data|post-file|body-data|body-file)/.test(t)) || WRITE_METHOD.test(flagValue(r, ['--method']) ?? '');
  }
  if (['http', 'https', 'xh', 'xhs'].includes(program)) {
    const pos = positionals(args).map(literal);
    sends = WRITE_METHOD.test(pos[0] ?? '') || pos.some((t) => t && /^[\w.[\]-]+(:=|=(?!=)|@)/.test(t));
  }
  if (sends) {
    const host = offMachine(args, ctx);
    if (host) return `Sends data to ${host}`;
  }
  if (program === 'scp') {
    const dest = positionals(args, new Set(['-P', '-i', '-o', '-F', '-c', '-l', '-S', '-J'])).pop();
    if (dest && remoteSpec(dest)) return `Copies files to ${hostOf(dest)}`;
  }
  if (program === 'rsync') {
    const dest = rsyncDestination(args);
    if (dest && remoteSpec(dest)) return `Syncs files to ${hostOf(dest)}`;
  }
  if (program === 'sftp') return 'Opens a file transfer with another machine';
  if (program === 'ssh' && !r.every((t) => t === '-V' || t === '-G')) return 'Connects to another machine over ssh';
  return null;
}

module.exports = { network };
