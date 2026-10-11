// Scratch: draws the 2 frames for question 3, checking every row's width.
const W = 100
const frame = (title, rows) => {
  const inner = W - 2
  const out = ['┌' + ('─ ' + title + ' ').padEnd(inner, '─') + '┐']
  for (const r of rows) {
    if ([...r].length > inner) throw new Error('too wide: ' + r)
    out.push('│' + r.padEnd(inner) + '│')
  }
  out.push('└' + '─'.repeat(inner) + '┘')
  return out.join('\n')
}
const rule = ' ' + '─'.repeat(W - 4) + ' '

const working = frame('working', [
  ' ● Edit(.flow/tickets/fw-16-fast-mode-whole/groundwork/map.md)',
  '   Added 24 lines',
  '',
  ' Question 2 is recorded. Question 3 is below, with 2 drawings.',
  '',
  ' fw-16 Flow redesign · designing 25/46    fw-71 Ticket files · done                    2 issues',
  rule,
  ' >',
  rule,
  ' >> accept edits on · opus 5.5 high   context 155k/1M   5h 9% 4h19m   week 91% 2d   cache 5m',
])

const L = 27
const left = [
  ' ● Edit(.flow/tickets/',
  '   fw-16-fast-mode-whole/',
  '   groundwork/map.md)',
  '   Added 24 lines',
  '',
  ' Question 2 is recorded.',
  ' Question 3 is below,',
  ' with 2 drawings.',
  '',
  '',
  '',
  '',
  '',
  ' fw-16 25/46 · fw-71 done',
]
const right = [
  ' Flow · flow-dev          [1 Board]  2 Session                   [x]',
  '',
  ' In progress',
  ' > fw-16  Flow redesign          designing 25/46',
  '   fw-75  Frontmatter guard      building 2/5',
  ' Next',
  '   fw-94  Research cleanup       todo',
  '   fw-95  Several projects       todo',
  ' Parked',
  '   fw-62  Tool library           waits on fw-16',
  ' Done lately',
  '   fw-71  Ticket files           done today',
  '',
  ' arrows move · Enter opens · 1 2 pages · Esc closes',
]
const split = left.map((l, i) => l.padEnd(L) + '│' + right[i])
const board = frame('board open', [
  ...split,
  rule,
  ' >',
  rule,
  ' >> accept edits on · opus 5.5 high   context 155k/1M   5h 9% 4h19m   week 91% 2d   cache 5m',
])
console.log(working + '\n\n' + board)
