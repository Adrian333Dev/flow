// Draws 20.5.2's screen frames row by row and checks every row's width.
const pad = (s, w) => {
  if ([...s].length > w) throw new Error(`row over ${w}: "${s}"`);
  return s + ' '.repeat(w - [...s].length);
};
const frame = (w, rows, notes = {}) => {
  const out = ['┌' + '─'.repeat(w) + '┐'];
  rows.forEach((r, i) => {
    const line = r === '-' ? '├' + '─'.repeat(w) + '┤' : '│' + pad(r, w) + '│';
    out.push(line + (notes[i] ? '  ◄ ' + notes[i] : ''));
  });
  out.push('└' + '─'.repeat(w) + '┘');
  return out.join('\n');
};

// Frame A: 100 columns, working, 2 subagents.
const a = [
  ' ● Read(scripts/lib/tickets/store.js)',
  '   └ Read 212 lines',
  '',
  ' ● 2 agents launched',
  '',
  ' [ fw-16-flow-redesign | designing 36/56 ]  [ fw-71-ticket-names-files | building 2/5 ]   2 issues',
  ' * Working… (1m 12s · esc to interrupt)',
  '-',
  ' > ',
  '-',
  ' ►► accept edits on │ opus 5.5 high │ context 142k │ 5h 38% │ week 81% 2d4h │ cache 47m',
  ' ● main',
  '   Read sessions 8 to 11      haiku 5.5   2m10s   48k',
  '   Check the diff panel       sonnet 5.5  0m40s   12k',
];
console.log(frame(100, a, {
  5: "Flow's band: a click opens the board",
  6: "Claude Code's notice row",
  8: 'prompt',
  10: "Claude Code's mode, then Flow's meters",
  11: "Claude Code's agent panel",
  12: "rows styled by Flow's plugin",
}));
console.log();

// Frame B: 151 columns, the board docked beside a 26-column transcript.
const T = 26, B = 151 - T - 1;
const left = [
  ' ● Edit(map.md)', '   └ Added 4 lines', '', ' ● Now the board…', '',
  ...Array(16).fill(''),
  ' +2 tickets', '-', ' > ', '-', ' ►► accept edits on',
];
const right = [
  ' FLOW   1 Board   2 Session                                         Enter opens · p parks · d done · Esc closes',
  '-',
  ' IN PROGRESS',
  ' ▸ fw-16-flow-redesign            designing 36/56   Flow redesign: fast by default, flexible per job, visible',
  '   fw-71-ticket-names-files       building 2/5      A ticket names its files, and the agent picks what to read',
  '',
  ' NEXT, IN RANK ORDER',
  '   fw-70-audit-token-counts       todo              flow audit: correct token counts, context size per request',
  '   fw-81-agent-starts-next        todo              An agent told to start the next ticket hands back the command',
  '   fw-31-handoff-says-where       todo              Handoff says where it wrote, and moves the status itself',
  '   fw-52-failures-reach-log       todo              Every failure in flow install and init reaches the failure log',
  '   fw-90-machine-name-wsl         todo              flow install offered the machine name wsl, not pc-wsl',
  '   … 9 more',
  '',
  ' PARKED',
  '   after V1 ships                 24 tickets        Enter lists them',
  '   post-v1                        6 tickets',
  '',
  ' DONE RECENTLY',
  '   fw-98-research-quick-search    done 2h ago       The research and wiki folders made quick to search',
  '   fw-73-creativity-skill         done yesterday    A creativity skill for groundwork',
  ...Array(5).fill(''),
];
if (left.length !== right.length) throw new Error(`left ${left.length} right ${right.length}`);
const w = T + 1 + B;
const rowsB = left.map((l, i) => {
  if (l === '-' && right[i] === '-') return '-';
  const L = l === '-' ? '─'.repeat(T) : pad(l, T);
  const R = right[i] === '-' ? '─'.repeat(B) : pad(right[i], B);
  return L + '│' + R;
});
console.log(frame(w, rowsB));
console.log();

// Frame C: the board's Session page, same pane.
const c = [
  ' FLOW   1 Board   2 Session                                         Enter opens · p parks · d done · Esc closes',
  '-',
  ' THIS SESSION   started 10:42 · 3 tickets touched · 1 closed',
  '',
  ' ▸ fw-16-flow-redesign            designing 36/56   answered 20.5.2 · wrote 2 sections in map.md',
  '   fw-71-ticket-names-files       building 2/5      ticked 2 tasks',
  '   fw-99-diff-panel-flow-files    todo              created',
  '   fw-90-machine-name-wsl         done              closed',
  '',
  " FLOW'S FILES CHANGED, outside this project's git",
  '   ~/.flow/wiki/claude-code/findings/diff-panel-scope.md                   new',
  '   ~/.flow/CLAUDE.md                                                       edited',
  '   .flow/tickets/fw-16-fast-mode-whole/groundwork/map.md                   edited',
  '   .flow/inbox.md                                                          edited',
];
console.log(frame(B, c));
