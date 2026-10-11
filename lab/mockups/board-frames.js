// Draws the board frames for fw-16 20.5.6 to 20.5.8. Docked at 151 columns: conversation 26, board 124.
const LEFT = 26, BOARD = 124, ROWS = 34;

const fit = (s, n, where) => {
  if ([...s].length > n) throw new Error(`${where}: "${s}" is ${[...s].length} > ${n}`);
  return s + ' '.repeat(n - [...s].length);
};
const cut = (s, n) => {
  if ([...s].length <= n) return s;
  const head = [...s].slice(0, n - 1).join('');
  return head.slice(0, head.lastIndexOf(' ')).replace(/[,:;]$/, '') + '…';
};
const cols = (...parts) => parts.map(([s, n]) => fit(cut(s, n), n, s)).join('');

// One ticket row: marker 3, name 31, where it stands 17, title 61, labels 12 = 124
const row = (mark, name, word, title, labels = '') =>
  cols([mark, 3], [name, 31], [word, 17], [title, 59], ['  ' + labels, 14]);

const rule = '─'.repeat(BOARD);
const header = (pages, hint) => cols([' FLOW   ' + pages, 60], [' '.repeat(63 - [...hint].length) + hint, 64]);

const strip = [
  ' ● Read(ticket.md)', '   └ Read 70 lines', '', ' ● The board now holds', '   the agreed list.', '',
];
const stripBottom = [' +2 tickets', '─'.repeat(LEFT), ' >', '─'.repeat(LEFT), ' ►► accept edits on'];

function frame(title, board, left = strip, bottom = stripBottom) {
  // 1b. Search: / turns the header into a search box, the rows narrow as each letter is typed
const search = [
  cols([' FLOW   [Tickets]   All   Session', 60], ['', 64]),
  cols([' / label:setup fail▌', 70], ['3 of 52  ·  label: status: waits:  ·  Esc clears', 54]),
  rule,
  ' NEXT  2',
  row(' ▸ ', 'fw-52-every-failure-flow', '', 'Every failure in flow install, flow init and the setup sessions reaches the failure log', 'v1 setup'),
  row('   ', 'fw-69-setup-form-uninstalls', '', "Machine setup leaves out per-project plugins, and the project's setup offers them", 'v1 setup'),
  '',
  ' DONE RECENTLY  1',
  row('   ', 'fw-87-apply-migration-runs', 'done 1d ago', 'Setup sessions apply their own form, and a script only records the originals', 'setup'),
];
const searchFrame = ['1b. Search: / on the Tickets page, typed "label:setup fail"', '┌' + '─'.repeat(BOARD) + '┐',
  ...search.map(r => '│' + fit(r, BOARD, 'search') + '│'), '└' + '─'.repeat(BOARD) + '┘'].join('\n');

// 4. The insert key: i on fw-71's row, the board staying open; the conversation's prompt before and after
const before = ['─'.repeat(LEFT), ' > the badge text should', '   come from', '─'.repeat(LEFT)];
const after = ['─'.repeat(LEFT), ' > the badge text should', '   come from fw-71-ticket-', '   names-files ▌', '─'.repeat(LEFT)];
const pair = [cols(['BEFORE', 30], ['AFTER i ON fw-71', 30])];
for (let i = 0; i < 5; i++) pair.push(fit(before[i] ?? '', LEFT, 'before') + '    ' + fit(after[i] ?? '', LEFT, 'after'));
const insertFrame = ['4. Insert: i on a ticket row or page puts its folder name at the cursor', ...pair].join('\n');

const out = [`${title}`, '┌' + '─'.repeat(LEFT + 1 + BOARD) + '┐'];
  for (let i = 0; i < ROWS; i++) {
    const l = i < left.length ? left[i] : i >= ROWS - bottom.length ? bottom[i - (ROWS - bottom.length)] : '';
    const b = board[i] ?? '';
    out.push('│' + fit(l, LEFT, 'left') + '│' + fit(b, BOARD, 'board ' + i) + '│');
  }
  out.push('└' + '─'.repeat(LEFT + 1 + BOARD) + '┘');
  const w = [...out[1]].length;
  out.slice(1).forEach((r, i) => { if ([...r].length !== w) throw new Error(`row ${i} width ${[...r].length}`); });
  return out.join('\n');
}

const keys = ' ↑↓ move   Space marks   Enter opens   a actions   i inserts into the prompt   / searches   Tab next page   Esc closes';

// 1. Tickets page
const tickets = [
  header('[Tickets]   All   Session', '/ search'),
  rule,
  ' IN PROGRESS  2',
  row(' ▸ ', 'fw-16-flow-redesign', 'designing 37/58', "Flow redesign: fast by default, flexible per job, visible, and light on the user's reading", 'v1'),
  row('   ', 'fw-70-flow-audit-counts', '', 'flow audit: correct token counts, context size per request, and a route agents follow', 'v1 audit'),
  '',
  ' NEXT  14, in rank order',
  row('   ', 'fw-81-agent-told-start', '', 'An agent told to start the next ticket hands back the command to type', 'v1 urgent'),
  row('   ', 'fw-14-build-flows-mods', '0 of 3 done', "Build Flow's mods, in the build order the research sets", 'v1 mods'),
  row('   ', '  fw-99-band-above-prompt', '', 'The band shows each ticket the session works'),
  row('   ', '  fw-100-meters-row', '', "The meters share the permission mode's row"),
  row('   ', '  fw-101-board-pane', '', 'The board opens beside the conversation on /board'),
  row('   ', 'fw-71-ticket-names-files', '', 'A ticket names its files, and the agent picks what to read', 'v1'),
  row('   ', 'fw-31-handoff-says-where', '', "Handoff says where it wrote, and moves the ticket's status itself", 'v1'),
  row('   ', 'fw-74-skill-reading-past', 'waits on fw-70', 'A skill for reading past sessions through flow audit', 'audit'),
  row('   ', 'fw-52-every-failure-flow', '', 'Every failure in flow install, flow init and the setup sessions reaches the failure log', 'v1 setup'),
  row('   ', 'fw-69-setup-form-uninstalls', '', "Machine setup leaves out per-project plugins, and the project's setup offers them", 'v1 setup'),
  '   … 7 more, Enter on this line lists them',
  '',
  ' PARKED  33, by reason',
  row('   ', 'after fw-16 ships', '27 tickets', 'every ticket unrelated to the redesign', 'later'),
  row('   ', 'after V1 ships', '6 tickets', 'parked with the label post-v1', 'post-v1'),
  '',
  ' DONE RECENTLY  3',
  row('   ', 'fw-87-apply-migration-runs', 'done 1d ago', 'Setup sessions apply their own form, and a script only records the originals', 'setup'),
  row('   ', 'fw-85-machines-rules-live', 'done 2d ago', "The machine's rules live in one CLAUDE.md: no AGENTS.md and no import line", 'setup'),
  row('   ', 'fw-78-setup-reads-machine', 'done 2d ago', 'Setup reads the machine through one script, and the agent works from its list', 'setup'),
];
while (tickets.length < ROWS - 2) tickets.push('');
tickets.push(rule, keys);

// 2. Ticket page, opened with Enter on fw-71
const field = (mark, name, value) => cols([mark, 3], [name, 12], [value, 47]);
const ticket = [
  header('Tickets › fw-71-ticket-names-files', 'Esc back to the list'),
  rule,
  ' A ticket names its files, and the agent picks what to read',
  '',
  field(' ▸ ', 'status', 'todo') + field('   ', 'rank', '4th of 14 next'),
  field('   ', 'labels', 'v1') + field('   ', 'waits on', 'nothing: ready'),
  field('   ', 'parent', 'none') + field('   ', 'blocks', 'fw-64-flow-get-files'),
  '',
  ' QUESTIONS  1 open',
  '   [ ] Does each reference name a line range where one part of a long file is what matters?',
  '',
  ' TASKS  0 of 5 done',
  '   [ ] Archive --files and the open block to lab/archive/flow-get-files/, with a README naming the commit',
  '   [ ] flow <id> stays the one way to show a ticket, and the name flow get retires',
  '   [ ] /flow:handoff writes the references section, and nothing writes an open block',
  '   [ ] home/AGENTS.md, docs/spec/tickets.md and docs/spec/skills.md name the references section',
  '   [ ] Drop fw-64 once this lands',
  '',
  ' WAITS',
  '   fw-71-ticket-names-files       todo',
  '   └ fw-64-flow-get-files         todo      waits on this: it fixes --files, which this archives',
  '',
  ' FILES',
  '   scripts/commands/tickets.js         the lookup flow <id> runs',
  '   docs/spec/tickets.md                what a ticket holds',
  '   docs/spec/skills.md                 what each skill reads',
  '   home/AGENTS.md                      the rules that name --files',
];
while (ticket.length < ROWS - 2) ticket.push('');
ticket.push(rule, ' ↑↓ move   Enter changes the field   a actions   i inserts into the prompt   Esc back');

// 3. Action menu on 2 marked tickets, drawn over the Tickets page
const menu = [
  '┌─ 2 marked: fw-81, fw-31 ──────────────────────────────┐',
  '│                                                       │',
  '│ ▸ Work on these       sends "work on fw-81 and fw-31" │',
  '│   Insert names        puts both into the prompt       │',
  '│   Status              todo  in-progress  parked  …    │',
  '│   Move in order       ↑↓ shows where, Enter saves     │',
  '│   Labels              type to pick or add             │',
  '│   Waits on            pick a ticket                   │',
  '│   Parent              pick a ticket                   │',
  '│                                                       │',
  '├───────────────────────────────────────────────────────┤',
  '│ runs: flow edit fw-81 fw-31 …        Enter · Esc      │',
  '└───────────────────────────────────────────────────────┘',
];
const marked = tickets.map((r, i) => (i === 7 || i === 13) ? ' ■' + r.slice(2) : i === 3 ? '  ' + r.slice(2) : r);
const withMenu = marked.map((r, i) => {
  const m = i - 17;
  if (m < 0 || m >= menu.length) return r;
  return ' '.repeat(34) + fit(menu[m], BOARD - 34, 'menu');
});
withMenu[ROWS - 1] = ' ↑↓ move   Enter picks   Esc closes the menu';

// 5. Session page
const change = (mark, path, stat, note = '') => cols([mark, 5], [path, 74], [stat, 12], [note, 33]);
const session = [
  header('Tickets   All   [Session]', 'Enter shows the diff'),
  rule,
  ' THIS SESSION   since 10:42, 38 minutes',
  ' 17 edits in 7 files, +212 −64    23 commands    1 ticket made    1 issue logged',
  '',
  ' TICKETS  3 touched',
  row('   ', 'fw-16-flow-redesign', 'designing 39/58', 'answered 20.5.6 and 20.5.7, wrote 2 sections'),
  row('   ', 'fw-71-ticket-names-files', 'building 2/5', 'ticked 2 tasks'),
  row('   ', 'fw-102-board-insert-key', 'todo', 'made'),
  '',
  ' CHANGES  7 files, newest first',
  '   in this project',
  change(' ▸   ', 'scripts/lib/tickets/store.js', '+31 −9', '4 edits'),
  change('     ', 'scripts/commands/tickets.js', '+12 −30', '2 edits'),
  change('     ', 'docs/spec/tickets.md', '+12 −4', '1 edit'),
  "   in Flow's files, outside this project",
  change('     ', '.flow/tickets/fw-16-flow-redesign/groundwork/map.md', '+48 −6', '3 edits'),
  change('     ', '.flow/tickets/fw-102-board-insert-key/ticket.md', 'new +22', 'made by flow new'),
  change('     ', '~/.flow/wiki/claude-code/findings/mod-runs-tools-and-fills-prompt-box.md', 'new +18'),
  change('     ', '.flow/inbox.md', '+2', '1 edit'),
  '',
  ' ── scripts/lib/tickets/store.js ' + '─'.repeat(BOARD - 33),
  '   83    // The folder name: the id, then words naming the goal',
  '   84  − const LABEL_WORDS = 3;',
  '   84  + const SLUG_WORDS = 3;',
  '   85  + function slugFrom(title, slug) {',
  '   86  +   if (slug) return slugify(slug);',
  '   87  +   return words(title).slice(0, SLUG_WORDS).join("-");',
  '   88  + }',
  '   … 27 more lines, ↓ scrolls',
];
while (session.length < ROWS - 2) session.push('');
session.push(rule, ' ↑↓ move   Enter shows the diff   Tab next page   Esc closes');

// 1b. Search: / turns the header into a search box, the rows narrow as each letter is typed
const search = [
  cols([' FLOW   [Tickets]   All   Session', 60], ['', 64]),
  cols([' / label:setup fail▌', 70], ['3 of 52  ·  label: status: waits:  ·  Esc clears', 54]),
  rule,
  ' NEXT  2',
  row(' ▸ ', 'fw-52-every-failure-flow', '', 'Every failure in flow install, flow init and the setup sessions reaches the failure log', 'v1 setup'),
  row('   ', 'fw-69-setup-form-uninstalls', '', "Machine setup leaves out per-project plugins, and the project's setup offers them", 'v1 setup'),
  '',
  ' DONE RECENTLY  1',
  row('   ', 'fw-87-apply-migration-runs', 'done 1d ago', 'Setup sessions apply their own form, and a script only records the originals', 'setup'),
];
const searchFrame = ['1b. Search: / on the Tickets page, typed "label:setup fail"', '┌' + '─'.repeat(BOARD) + '┐',
  ...search.map(r => '│' + fit(r, BOARD, 'search') + '│'), '└' + '─'.repeat(BOARD) + '┘'].join('\n');

// 4. The insert key: i on fw-71's row, the board staying open; the conversation's prompt before and after
const before = ['─'.repeat(LEFT), ' > the badge text should', '   come from', '─'.repeat(LEFT)];
const after = ['─'.repeat(LEFT), ' > the badge text should', '   come from fw-71-ticket-', '   names-files ▌', '─'.repeat(LEFT)];
const pair = [cols(['BEFORE', 30], ['AFTER i ON fw-71', 30])];
for (let i = 0; i < 5; i++) pair.push(fit(before[i] ?? '', LEFT, 'before') + '    ' + fit(after[i] ?? '', LEFT, 'after'));
const insertFrame = ['4. Insert: i on a ticket row or page puts its folder name at the cursor', ...pair].join('\n');

const out = [
  frame('1. Tickets page, the default when the board opens', tickets),
  searchFrame,
  frame('2. Ticket page: Enter on fw-71', ticket),
  frame('3. Action menu: a, with fw-81 and fw-31 marked by Space', withMenu),
  insertFrame,
  frame('5. Session page: every change this session made, in place of /diff', session),
].join('\n\n');
require('fs').writeFileSync(__dirname + '/board-frames.txt', out + '\n');
console.log('ok');
