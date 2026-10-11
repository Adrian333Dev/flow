/**
 * fw-16, 20.5.3: prints the two-part badge in the real terminal, with the progress part on a ladder from darkest to lightest.
 * Run: node lab/mockups/band-ladder.js
 */
const orange = [0xff, 0xb7, 0x03], green = [0x22, 0xc5, 0x5e], terminal = [0x16, 0x19, 0x1d];
const mix = (a, b, share) => a.map((v, i) => Math.round(v + (b[i] - v) * share));
const bg = c => `\x1b[48;2;${c.join(';')}m`, fg = c => `\x1b[38;2;${c.join(';')}m`, reset = '\x1b[0m';
const hex = c => '#' + c.map(v => v.toString(16).padStart(2, '0')).join('');

// A badge: the name on the bright colour in black, then the progress on `dark` in the bright colour.
const badge = (name, progress, colour, dark) =>
  `${bg(colour)}${fg([0, 0, 0])} ${name} ${bg(dark)}${fg(colour)} ${progress} ${reset}`;

// Each rung: the progress part is black with this share of the badge's colour, darkest first.
const rungs = [0, .03, .05, .07, .09, .11, .14];
console.log(`\nThe terminal's own background is ${hex(terminal)}. Rungs 1 to 6 sit darker than it, tinted.\n`);
rungs.forEach((share, i) => {
  const line = [badge('fw-16-flow-redesign', 'designing 27/53', orange, mix([0, 0, 0], orange, share)),
                badge('fw-70-board-keys', 'done ✓', green, mix([0, 0, 0], green, share))].join(' ');
  console.log(` ${i}  ${line}   ${share ? `black + ${share * 100}% colour` : 'pure black'}\n`);
});
const last = mix(mix(terminal, [0, 0, 0], .7), orange, .18);
console.log(` 7  ${badge('fw-16-flow-redesign', 'designing 27/53', orange, last)}   round 11's pick, for comparison\n`);
