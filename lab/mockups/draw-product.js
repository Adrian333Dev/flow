/** Draws the whole-product diagram for docs/spec/product.md. */
const W = 66, H = 26;
const g = Array.from({ length: H }, () => Array(W).fill(' '));
const put = (r, c, s) => {
  [...s].forEach((ch, i) => {
    if (c + i >= W || r >= H) throw new Error(`off grid at ${r},${c + i}: ${s}`);
    const old = g[r][c + i];
    if (old !== ' ' && old !== ch) throw new Error(`collision at ${r},${c + i}: ${old} vs ${ch}`);
    g[r][c + i] = ch;
  });
};
const box = (r, c, w, lines) => {
  put(r, c, '┌' + '─'.repeat(w - 2) + '┐');
  lines.forEach((l, i) => {
    if (l.length > w - 4) throw new Error(`label too long: ${l}`);
    const pad = l.startsWith('<') ? '  ' + l.slice(1).padEnd(w - 4) : l.padStart(Math.floor((w - 2 + l.length) / 2)).padEnd(w - 2);
    put(r + 1 + i, c, '│' + pad.slice(0, w - 2) + '│');
  });
  put(r + 1 + lines.length, c, '└' + '─'.repeat(w - 2) + '┘');
};
const down = (r1, r2, c) => { for (let r = r1; r < r2; r++) put(r, c, '│'); put(r2, c, '▼'); };
const up = (r1, r2, c) => { put(r1, c, '▲'); for (let r = r1 + 1; r <= r2; r++) put(r, c, '│'); };

box(0, 0, W, ['A CLAUDE CODE SESSION', '', 'Design  ──►  Build  ──►  Improve', '', 'loaded: the rules, Flow\'s skills, the hooks']);
// session ↔ project
down(7, 10, 4); put(7, 6, 'tickets,'); put(8, 6, 'handoffs');
up(7, 10, 18); put(7, 20, 'the ticket'); put(8, 20, 'in work');
// session ↔ machine
down(7, 10, 38); put(7, 40, 'lessons');
up(7, 10, 52); put(7, 54, 'rules,'); put(8, 54, 'skills,'); put(9, 54, 'the wiki');
box(11, 0, 30, ['THE PROJECT', '', '<.flow/: the branch `flow`', '<checked out, its tickets']);
box(11, 36, 30, ['THE MACHINE', '', '<~/.flow/: rules, skills,', '<the wiki, the logs']);
put(17, 14, '▲'); down(18, 19, 14); put(18, 16, 'git, both ways');
put(17, 50, '▲'); down(18, 19, 50); put(18, 52, 'flow sync');
box(20, 0, 30, ['GITHUB', '', '<the project\'s repository,', '<its branch `flow`']);
box(20, 36, 30, ['GITHUB', '', '<the Flow home, one', '<private repository']);

console.log(g.map(r => r.join('').trimEnd()).join('\n'));
