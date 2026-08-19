#!/usr/bin/env node
// description: Character grid for drawing an ASCII diagram by coordinate. Asserts on every write.
//
// Usage, from a generator script in tmp/:
//   const { Canvas, write } = require("../scripts/canvas.js");
//   const k = new Canvas(76, 13);
//   k.container(0, 0, 12, 66, "EACH TURN");
//   k.box(2, 8, 30, ["PreToolUse"]);
//   write("tmp/out.md", "Title", "One line of blurb.", k);

class Canvas {
  constructor(w, h) {
    this.W = w;
    this.H = h;
    this.g = Array.from({ length: h }, () => Array(w).fill(" "));
  }

  // Write one character. Refuses to leave the grid, and refuses to overwrite a
  // different character unless it is listed in `over` — that is the overlap check.
  put(r, c, ch, over = "") {
    if (!(r >= 0 && r < this.H && c >= 0 && c < this.W))
      throw new Error(`off canvas (${r},${c}) ${ch}`);
    const cur = this.g[r][c];
    if (!(cur === " " || cur === ch || over.includes(cur)))
      throw new Error(`collision (${r},${c}): ${ch} would overwrite ${cur}`);
    this.g[r][c] = ch;
    return this;
  }

  // "\0" in `t` means leave that cell alone.
  text(r, c, t, over = "") {
    [...t].forEach((ch, i) => {
      if (ch !== "\0") this.put(r, c + i, ch, over);
    });
    return this;
  }

  hl(r, c0, c1, ch = "─", skip = [], over = "") {
    for (let c = c0; c <= c1; c++) if (!skip.includes(c)) this.put(r, c, ch, over);
    return this;
  }

  vl(c, r0, r1, ch = "│", skip = [], over = "") {
    for (let r = r0; r <= r1; r++) if (!skip.includes(r)) this.put(r, c, ch, over);
    return this;
  }

  // rows: strings, or null for a ├───┤ divider. Returns [lastRow, lastCol].
  box(r0, c0, w, rows, align = "center", edge = "─") {
    const c1 = c0 + w - 1;
    const r1 = r0 + rows.length + 1;
    this.put(r0, c0, "┌").put(r0, c1, "┐").put(r1, c0, "└").put(r1, c1, "┘");
    this.hl(r0, c0 + 1, c1 - 1, edge);
    this.hl(r1, c0 + 1, c1 - 1, edge);
    this.vl(c0, r0 + 1, r1 - 1);
    this.vl(c1, r0 + 1, r1 - 1);
    const inner = w - 2;
    rows.forEach((t, i) => {
      const r = r0 + 1 + i;
      if (t === null) {
        this.put(r, c0, "├", "│").put(r, c1, "┤", "│");
        this.hl(r, c0 + 1, c1 - 1, "─", [], " ");
      } else {
        const n = [...t].length;
        if (n > inner) throw new Error(`row too wide for box: ${t}`);
        this.text(r, c0 + 1 + (align === "center" ? Math.floor((inner - n) / 2) : 1), t);
      }
    });
    return [r1, c1];
  }

  // Horizontal run with the label centred inside it — `── to PromptSubmit ──`.
  // Throws when the label does not fit, which is the defect a reread never catches.
  run(r, c0, c1, label, ch = "─") {
    const tag = ` ${label} `;
    const n = [...tag].length;
    const span = c1 - c0 + 1;
    if (n > span) throw new Error(`label "${label}" needs ${n} cols, run is ${span}`);
    const s = c0 + Math.floor((span - n) / 2);
    this.hl(r, c0, s - 1, ch);
    this.hl(r, s + n, c1, ch);
    return this.text(r, s, tag);
  }

  // Dashed edges, ¦ walls, named top-left and bottom-right. gaps: cols the edges skip.
  container(r0, c0, r1, c1, name, gaps = []) {
    this.put(r0, c0, "┌").put(r0, c1, "┐").put(r1, c0, "└").put(r1, c1, "┘");
    const tag = ` ${name} `;
    const n = [...tag].length;
    const tl = c0 + 3;
    const bl = c1 - 3 - n;
    for (let c = c0 + 1; c < c1; c++) {
      if ((c - c0) % 2 === 0 || gaps.includes(c)) continue;
      if (!(c >= tl && c < tl + n)) this.put(r0, c, "─");
      if (!(c >= bl && c < bl + n)) this.put(r1, c, "─");
    }
    this.text(r0, tl, tag).text(r1, bl, tag);
    this.vl(c0, r0 + 1, r1 - 1, "¦");
    this.vl(c1, r0 + 1, r1 - 1, "¦");
    return this;
  }

  clear(r0, c0, r1, c1) {
    for (let r = r0; r <= r1; r++)
      for (let c = c0; c <= c1; c++) this.g[r][c] = " ";
    return this;
  }

  out() {
    return this.g
      .map((r) => r.join("").replace(/\s+$/, ""))
      .join("\n")
      .replace(/\n+$/, "");
  }
}

function write(path, title, blurb, canvas) {
  const body = canvas.out();
  require("fs").writeFileSync(path, `# ${title}\n\n${blurb}\n\n\`\`\`\n${body}\n\`\`\`\n`);
  const rows = body.split("\n");
  const cols = Math.max(...rows.map((x) => [...x].length));
  console.log(`${path.padEnd(26)} ${String(rows.length).padStart(3)} rows  ${String(cols).padStart(3)} cols`);
}

module.exports = { Canvas, write };
