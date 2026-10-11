/**
 * Prints the board's pages in colour, for fw-16 20.5.6 to 20.5.8: run `node lab/mockups/board-colours.js`.
 * Board only, without the conversation strip, so each frame fits the terminal. Every row is
 * checked against its width before printing.
 */
const W = 124, NARROW = 83;

// One Dark, the theme the board draws in, plus the band's 2 badge colours
const C = {
  fg: '#abb2bf', dim: '#5c6370', bright: '#e6e6e6', blue: '#61afef', orange: '#ffb703',
  green: '#22c55e', red: '#e06c75', purple: '#c678dd', yellow: '#e5c07b', cyan: '#56b6c2',
  sel: '#2c313a', edge: '#3e4452',
};
const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)).join(';');
const len = (s) => [...s].length;
const esc = (st = {}, bg) =>
  `\x1b[0m\x1b[38;2;${rgb(C[st.c || 'fg'])}m` + (st.b ? '\x1b[1m' : '') + (st.u ? '\x1b[4m' : '') +
  (bg ? `\x1b[48;2;${rgb(C[bg])}m` : '');

/** One row from [text, style] pieces, padded to the width; refuses a row that overflows. */
function line(segs, width, bg) {
  const w = segs.reduce((n, [t]) => n + len(t), 0);
  if (w > width) throw new Error(`row is ${w} > ${width}: ${segs.map(([t]) => t).join('')}`);
  return segs.map(([t, st]) => esc(st, bg) + t).join('') + esc({}, bg) + ' '.repeat(width - w) + '\x1b[0m';
}
const cut = (s, n) => {
  if (n <= 1) return '';
  if (len(s) <= n) return s;
  const head = [...s].slice(0, n - 1).join('');
  const sp = head.lastIndexOf(' ');
  return (sp > 0 ? head.slice(0, sp) : head).replace(/[,:;]$/, '') + '…';
};
const pad = (s, n) => s + ' '.repeat(Math.max(0, n - len(s)));

// A ticket: { name, fold: 'open'|'shut', tree: '├─'|'└─', where: [text, colour], title, labels, mark, quiet }
function ticketRows(list, width) {
  const prefix = (t) => (t.tree ? 2 + 3 : 2);
  const NW = Math.max(...list.map((t) => prefix(t) + len(t.name)));
  const LW = Math.max(0, ...list.map((t) => len((t.labels || []).join(' '))));
  const WH = 16;
  // The title gives way first: it shortens as the board narrows, and goes below 12 columns
  let TW = width - (3 + NW + 2 + WH + 2 + 2 + LW + 1);
  if (TW < 12) TW = 0;
  const showLabels = true;
  return list.map((t) => {
    const q = t.quiet;
    const segs = [[' '], [t.mark ? '■' : ' ', { c: 'yellow' }], [' ']];
    if (t.tree) segs.push(['  ' + t.tree + ' ', { c: 'dim' }]);
    else segs.push([t.fold === 'open' ? '▾ ' : t.fold === 'shut' ? '▸ ' : '  ', { c: 'dim' }]);
    segs.push([pad(t.name, NW - prefix(t)), { c: q ? 'dim' : 'blue' }], ['  ']);
    const [wt, wc] = t.where || ['', 'fg'];
    segs.push([pad(wt, WH), { c: wc }], ['  ']);
    if (TW) segs.push([pad(cut(t.title, TW), TW), { c: q ? 'dim' : 'fg' }], ['  ']);
    if (showLabels && LW) {
      (t.labels || []).forEach((l, i) => segs.push([(i ? ' ' : '') + l, { c: l === 'urgent' ? 'red' : 'purple' }]));
    }
    return { segs, sel: t.sel };
  });
}

const head = (name, count, c) => ({ segs: [[' '], [name, { c, b: 1 }], ['  ' + count, { c: 'dim' }]] });
const blank = { segs: [] };
const rule = (width) => ({ segs: [['─'.repeat(width), { c: 'edge' }]] });
function tabs(active, right = '') {
  const segs = [[' '], ['FLOW', { c: 'orange', b: 1 }], ['   ']];
  ['1 Board', '2 All tickets', '3 Session'].forEach((p) => {
    const on = p.slice(2) === active;
    segs.push([p[0] + ' ', { c: 'dim' }], [p.slice(2), on ? { c: 'bright', b: 1, u: 1 } : { c: 'dim' }], ['   ']);
  });
  if (right) segs.push([right, { c: 'dim' }]);
  return { segs };
}
// Keys past the width drop from the middle, keeping the last 2 (all keys, close)
function keys(pairs, width = W) {
  const size = (ps) => 1 + ps.reduce((n, [k, w], i) => n + (i ? 3 : 0) + len(k) + 1 + len(w), 0);
  pairs = [...pairs];
  while (size(pairs) > width && pairs.length > 3) pairs.splice(pairs.length - 3, 1);
  const segs = [[' ']];
  pairs.forEach(([k, what], i) => segs.push([(i ? '   ' : '') + k, { c: 'cyan' }], [' ' + what, { c: 'dim' }]));
  return { segs };
}
const boardKeyList = ([['Enter', 'open'], ['s', 'status'], ['l', 'labels'], ['w', 'work on'], ['i', 'insert'],
  ['Alt ↑↓', 'reorder'], ['Tab', 'next group'], ['/', 'search'], ['?', 'all keys'], ['Esc', 'close']]);

function print(title, rows, width) {
  console.log(`\n\x1b[1m${title}\x1b[0m`);
  console.log(esc({ c: 'edge' }) + '┌' + '─'.repeat(width) + '┐\x1b[0m');
  for (const r of rows) console.log(esc({ c: 'edge' }) + '│' + line(r.segs, width, r.sel && 'sel') + esc({ c: 'edge' }) + '│\x1b[0m');
  console.log(esc({ c: 'edge' }) + '└' + '─'.repeat(width) + '┘\x1b[0m');
}

// The tickets, as they are today. fw-14's 3 children are made up: no ticket has children yet.
const inProgress = [
  { name: 'fw-16-flow-redesign', where: ['designing 37/58', 'orange'], title: "Flow redesign: fast by default, flexible per job, visible, and light on the user's reading", labels: ['v1'], sel: 1 },
  { name: 'fw-70-flow-audit-counts', where: ['', 'orange'], title: 'flow audit: correct token counts, context size per request, and a route agents follow', labels: ['v1', 'audit'] },
];
const next = [
  { name: 'fw-81-agent-told-start', title: 'An agent told to start the next ticket hands back the command to type instead of starting it', labels: ['v1', 'urgent'] },
  { name: 'fw-14-build-flows-mods', fold: 'open', where: ['0/3', 'fg'], title: "Build Flow's mods, in the build order the research sets", labels: ['v1', 'mods'] },
  { name: 'fw-99-band-above-prompt', tree: '├─', title: 'The band shows each ticket the session works', labels: ['mods'] },
  { name: 'fw-100-meters-row', tree: '├─', title: "The meters share the permission mode's row", labels: ['mods'] },
  { name: 'fw-101-board-pane', tree: '└─', title: 'The board opens beside the conversation on /board', labels: ['mods'] },
  { name: 'fw-71-ticket-names-files', where: ['0/5', 'fg'], title: 'A ticket names its files, and the agent picks what to read', labels: ['v1'] },
  { name: 'fw-31-handoff-says-where', title: "Handoff says where it wrote, and moves the ticket's status itself", labels: ['v1'] },
  { name: 'fw-74-skill-reading-past', where: ['waits on fw-70', 'red'], title: 'A skill for reading past sessions through flow audit', labels: ['audit'] },
  { name: 'fw-52-every-failure-flow', title: 'Every failure in flow install, flow init and the setup sessions reaches the failure log', labels: ['v1', 'setup'] },
  { name: 'fw-69-setup-form-uninstalls', title: "Machine setup leaves out per-project plugins, and the project's setup offers them", labels: ['v1', 'setup'] },
  { name: 'fw-79-flow-doctor-names', title: 'flow doctor names a synced plugin no setup decided on', labels: ['v1', 'setup'] },
  { name: 'fw-89-update-session-changes', title: "The update session changes Flow's files itself, asking only where a change clashes with the user's", labels: ['v1'] },
  { name: 'fw-90-flow-install-offered', title: 'flow install offered the machine name wsl, where pc-wsl was expected', labels: ['setup'] },
  { name: 'fw-76-home-claim', title: "Home tickets and private projects claim their number before it is shown, like a project's", labels: ['v1'] },
];
const parked = [
  { name: 'after fw-16 ships', fold: 'shut', where: ['27 tickets', 'dim'], title: 'every ticket unrelated to the redesign', labels: ['later'], quiet: 1 },
  { name: 'after V1 ships', fold: 'shut', where: ['6 tickets', 'dim'], title: 'every ticket labelled post-v1', labels: ['post-v1'], quiet: 1 },
];
const done = [
  { name: 'fw-87-apply-migration-runs', where: ['done 1d ago', 'green'], title: 'Setup sessions apply their own form, and a script only records the originals', labels: ['setup'], quiet: 1 },
  { name: 'fw-85-machines-rules-live', where: ['done 2d ago', 'green'], title: "The machine's rules live in one CLAUDE.md: no AGENTS.md and no import line", labels: ['setup'], quiet: 1 },
];

function board(width, n = next) {
  // One width for the name column across every group, so the columns line up down the page
  const all = ticketRows([...inProgress, ...n, ...parked, ...done], width);
  const take = (k) => all.splice(0, k);
  return [
    tabs('Board'), rule(width),
    head('IN PROGRESS', 2, 'orange'), ...take(inProgress.length), blank,
    head('NEXT', 14, 'bright'), ...take(n.length), blank,
    head('PARKED', 33, 'dim'), ...take(parked.length), blank,
    head('DONE RECENTLY', 2, 'green'), ...take(done.length),
    blank, rule(width), keys(boardKeyList, width),
  ];
}

// 1. Board
print('1. Board, the page the board opens on. fw-16 is selected.', board(W), W);

// 2. Board in a 110-column terminal: labels drop, titles shorten
print('2. Board in a 110-column terminal, 83 columns wide: titles shorten first, labels stay', board(NARROW), NARROW);

// 3. s on fw-81: a short list of the 5 statuses opens under the row
{
  const rows = board(W, next.map((t, i) => (i === 0 ? { ...t, sel: 1 } : t)));
  rows[3].sel = 0;
  const pick = [
    ['┌─ status ─────────────┐', 'edge'],
    ['│ ● todo               │', 'fg'],
    ['│   in-progress        │', 'fg'],
    ['│   done               │', 'fg'],
    ['│   parked   asks why  │', 'fg'],
    ['│   dropped  asks why  │', 'fg'],
    ['└──────────────────────┘', 'edge'],
  ];
  const at = 8; // the row under fw-81
  // The list opens under the row and pushes the rest down, covering nothing
  rows.splice(at, 0, ...pick.map(([t, c], i) => ({ segs: [[' '.repeat(5)], [t, { c }]], sel: i === 2 })));
  rows[rows.length - 1] = keys([['↑↓', 'pick'], ['Enter', 'saves: flow edit fw-81 --status in-progress'], ['Esc', 'close']]);
  print('3. s on fw-81: the status list opens under the row', rows, W);
}

// 4. l on fw-81: the labels field, with completion
{
  const rows = board(W, next.map((t, i) => (i === 0 ? { ...t, sel: 1 } : t)));
  rows[3].sel = 0;
  rows.splice(8, 0, { segs: [['     labels  ', { c: 'dim' }], ['v1 urgent ', { c: 'purple' }], ['se', { c: 'bright' }], ['▌', { c: 'bright' }],
    ['tup', { c: 'dim' }], ['      Tab completes   Backspace removes the last   Enter saves', { c: 'dim' }]] },
    { segs: [['             '], ['setup  ', { c: 'purple' }], ['  also: audit  mods  later  post-v1', { c: 'dim' }]] });
  rows[rows.length - 1] = keys([['Tab', 'complete'], ['Enter', 'saves: flow edit fw-81 --labels v1,urgent,setup'], ['Esc', 'close']]);
  print('4. l on fw-81: labels typed, several per ticket', rows, W);
}

// 5. Search: one flat list, each row with its status
{
  const found = ticketRows([
    { name: 'fw-52-every-failure-flow', where: ['todo', 'fg'], title: 'Every failure in flow install, flow init and the setup sessions reaches the failure log', labels: ['v1', 'setup'], sel: 1 },
    { name: 'fw-87-apply-migration-runs', where: ['done 1d ago', 'green'], title: 'Setup sessions apply their own form, and a script only records the originals', labels: ['setup'], quiet: 1 },
    { name: 'fw-57-setup-finds-duplicate', where: ['dropped', 'dim'], title: "Setup finds a duplicate in util's sources and offers to drop it", labels: ['setup'], quiet: 1 },
  ], W);
  print('5. / then "setup fail": one flat list over every ticket', [
    tabs('Board'),
    { segs: [[' / ', { c: 'cyan' }], ['setup fail', { c: 'bright' }], ['▌', { c: 'bright' }], ['      3 of 70   filter words: label: status: waits:', { c: 'dim' }]] },
    rule(W), ...found, blank, rule(W),
    keys([['↑↓', 'move'], ['Enter', 'open'], ['Backspace', 'on an empty search leaves it'], ['Esc', 'close']]),
  ], W);
}

// 6. All tickets: every ticket, flat, sorted by a column
{
  const list = [
    { name: 'fw-98-make-research-wiki', where: ['todo', 'fg'], title: 'Make the research and wiki folders quick for the agent to search and explore', labels: ['later'] },
    { name: 'fw-97-record-every-change', where: ['todo', 'fg'], title: 'A record of every change and command the agent makes, beyond /diff', labels: ['later'] },
    { name: 'fw-96-skill-checks-change', where: ['parked', 'dim'], title: 'A skill that checks a change in the running app, web pages first', labels: ['later'], quiet: 1 },
    { name: 'fw-95-many-projects', where: ['parked', 'dim'], title: 'Run several projects at once, with the user making only the real decisions', labels: ['post-v1'], quiet: 1 },
    { name: 'fw-90-flow-install-offered', where: ['todo', 'fg'], title: 'flow install offered the machine name wsl, where pc-wsl was expected', labels: ['setup'], sel: 1 },
    { name: 'fw-87-apply-migration-runs', where: ['done 1d ago', 'green'], title: 'Setup sessions apply their own form, and a script only records the originals', labels: ['setup'], quiet: 1 },
    { name: 'fw-57-setup-finds-duplicate', where: ['dropped', 'dim'], title: "Setup finds a duplicate in util's sources and offers to drop it", labels: ['setup'], quiet: 1 },
  ];
  const cols = { segs: [[' '.repeat(5)], ['TICKET ▾', { c: 'bright', b: 1 }], [' '.repeat(21)], ['STATUS', { c: 'dim' }], [' '.repeat(12)], ['TITLE', { c: 'dim' }]] };
  print('6. All tickets: every ticket, dropped included, newest first', [
    tabs('All tickets', '70 tickets'), rule(W), cols, ...ticketRows(list, W), { segs: [['    … the list scrolls', { c: 'dim' }]] }, blank, rule(W),
    keys([['Enter', 'open'], ['< >', 'sort column'], ['s', 'status'], ['l', 'labels'], ['i', 'insert'], ['/', 'search'], ['Esc', 'close']]),
  ], W);
}

// 7. Ticket page: Enter on fw-71
{
  const wrap = (s, n) => s.split(' ').reduce((ls, w) => {
    if (len(ls[ls.length - 1] + ' ' + w) > n) ls.push(w); else ls[ls.length - 1] += (ls[ls.length - 1] ? ' ' : '') + w;
    return ls;
  }, ['']);
  const para = "A ticket's own skill runs flow get <id> --files, which prints the ticket plus every file its open block names, whole. In the 5 fw-28 sessions on 2026-10-06 that output ran 30 to 111 KB. It cost an estimated 9 to 29% of each session.";
  const field = (k, v, c = 'fg', k2, v2, c2 = 'fg') => ({ segs: [['   '], [pad(k, 12), { c: 'dim' }], [pad(v, 40), { c }], [pad(k2, 12), { c: 'dim' }], [v2, { c: c2 }]] });
  const box = (on, t) => ({ segs: [['   '], [on ? '[x] ' : '[ ] ', { c: on ? 'green' : 'dim' }], [t, { c: on ? 'dim' : 'fg' }]] });
  const file = (p, what) => ({ segs: [['   '], [pad(p, 54), { c: 'blue', u: 1 }], [what, { c: 'dim' }]] });
  print('7. Ticket page: Enter on fw-71. Backspace goes back, Esc closes.', [
    tabs('Board', 'Board › fw-71-ticket-names-files'), rule(W),
    { segs: [[' '], ['A ticket names its files, and the agent picks what to read', { c: 'bright', b: 1 }]] },
    ...wrap(para, W - 4).map((l) => ({ segs: [[' '], [l, { c: 'fg' }]] })), blank,
    field('status', 'todo', 'fg', 'rank', '4th of 14 next'),
    field('labels', 'v1', 'purple', 'waits on', 'nothing: ready', 'green'),
    field('parent', 'none', 'dim', 'blocks', 'fw-64-flow-get-files', 'blue'), blank,
    head('QUESTIONS', '1 open', 'yellow'),
    box(0, 'Does each reference name a line range where one part of a long file is what matters?'), blank,
    head('TASKS', '0/5', 'bright'),
    box(0, 'Archive --files and the open block to lab/archive/flow-get-files/, with a README naming the commit'),
    box(0, 'flow <id> stays the one way to show a ticket, and the name flow get retires'),
    box(0, '/flow:handoff writes the references section, and nothing writes an open block'),
    box(0, 'home/AGENTS.md, docs/spec/tickets.md and docs/spec/skills.md name the references section'),
    box(0, 'Drop fw-64 once this lands'), blank,
    head('WAITS', '', 'bright'),
    { segs: [['   '], ['fw-71-ticket-names-files', { c: 'blue' }]] },
    { segs: [['   '], ['└─ ', { c: 'dim' }], ['fw-64-flow-get-files', { c: 'blue' }], ['   waits on this: it fixes --files, which this archives', { c: 'dim' }]] }, blank,
    head('FILES', 'Enter opens in VS Code', 'bright'),
    file('.flow/tickets/fw-71-ticket-names-files/ticket.md', 'this ticket'),
    file('scripts/commands/tickets.js', 'the lookup flow <id> runs'),
    file('docs/spec/tickets.md', 'what a ticket holds'),
    file('home/AGENTS.md', 'the rules that name --files'),
    blank, rule(W),
    keys([['↑↓', 'move'], ['Enter', 'change the field or open the file'], ['w', 'work on'], ['i', 'insert'], ['Backspace', 'back'], ['Esc', 'close']]),
  ], W);
}

// 8. Session page: stats and tickets; the changes list waits for fw-97
{
  const stat = (pairs) => ({ segs: pairs.flatMap(([v, k], i) => [[(i ? '      ' : ' ') + v, { c: 'bright', b: 1 }], [' ' + k, { c: 'dim' }]]) });
  const touched = ticketRows([
    { name: 'fw-16-flow-redesign', where: ['designing 39/58', 'orange'], title: 'answered 20.5.6 and 20.5.7, wrote 2 sections' },
    { name: 'fw-71-ticket-names-files', where: ['building 2/5', 'orange'], title: 'ticked 2 tasks' },
    { name: 'fw-90-flow-install-offered', where: ['done', 'green'], title: 'closed' },
    { name: 'fw-102-board-insert-key', where: ['todo', 'fg'], title: 'made' },
  ], W);
  print('8. Session page: stats and the tickets this session touched', [
    tabs('Session', 'since 10:42'), rule(W),
    stat([['38m', 'session'], ['142k', 'context'], ['9%', 'of the 5-hour limit'], ['2%', 'of the week'], ['0', 'compactions']]),
    stat([['17', 'edits in 7 files'], ['23', 'commands'], ['1', 'ticket made'], ['1', 'closed'], ['1', 'issue logged']]),
    blank, head('TICKETS', '4 touched', 'bright'), ...touched, blank, rule(W),
    keys([['↑↓', 'move'], ['Enter', 'open'], ['i', 'insert'], ['Esc', 'close']]),
  ], W);
}
