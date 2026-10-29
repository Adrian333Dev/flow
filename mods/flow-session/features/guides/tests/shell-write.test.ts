import { describe, expect, test } from 'claude-code/testing'
import { CODE_EXTENSIONS, filesWritten } from '../shell-write'

describe('filesWritten', () => {
  test('finds the files of an in-place sed or perl', () => {
    expect(filesWritten(`sed -i 's/^- \\[ \\] fw-274:/- [x] fw-274:/' .flow/tickets/316/ticket.md .flow/tickets/204/ticket.md`)).toEqual([
      '.flow/tickets/316/ticket.md',
      '.flow/tickets/204/ticket.md',
    ])
    expect(filesWritten(`cd w && sed -i.bak -e 's/a/b/' docs/manual/restart.md`)).toEqual(['docs/manual/restart.md'])
    expect(filesWritten(`perl -pi -e 's/a/b/' scripts/commands/settings.ts`)).toEqual(['scripts/commands/settings.ts'])
    expect(filesWritten(`git ls-files | xargs sed -Ei 's/a/b/' a.ts`)).toEqual(['a.ts'])
    expect(filesWritten(`FOO=1 sed --in-place 's/a/b/' x.md`)).toEqual(['x.md'])
  })

  test('finds the file of a script that writes', () => {
    const python = ["python3 - <<'EOF'", "p='.flow/tickets/321/ticket.md'", 's=open(p).read()', "open(p,'w').write(s.replace('a','b'))", 'EOF'].join('\n')
    expect(filesWritten(python)).toEqual(['.flow/tickets/321/ticket.md'])
    const node = ["cat > /tmp/fw274-edit.mjs <<'EOF'", "const f = 'features/usage/visits.test.ts'", 'fs.writeFileSync(f, s)', 'EOF', 'node /tmp/fw274-edit.mjs'].join('\n')
    expect(filesWritten(node)).toEqual(['/tmp/fw274-edit.mjs', 'features/usage/visits.test.ts'])
    expect(filesWritten(`python3 -c "from pathlib import Path; Path('a/b.py').write_text('x')"`)).toEqual(['a/b.py'])
  })

  test('finds nothing in a command that only reads', () => {
    expect(filesWritten(`grep -rn "sed -i\\|python3" home/CLAUDE.md`)).toEqual([])
    expect(filesWritten(`grep -rn "sed -i" home/CLAUDE.md`)).toEqual([])
    expect(filesWritten(`sed -n '1,5p' a.ts`)).toEqual([])
    expect(filesWritten(`perl -ne 'print if /x/' a.md`)).toEqual([])
    expect(filesWritten(['python3 - <<EOF', "print(open('a.md').read())", 'EOF'].join('\n'))).toEqual([])
    expect(filesWritten(`node -e "console.log(require('./a.js'))"`)).toEqual([])
    expect(filesWritten(`echo "fs.writeFileSync is not run" > notes.md`)).toEqual([])
    expect(filesWritten('git commit -m "fix a.ts"')).toEqual([])
  })

  test('a write to a file with no known extension finds no file', () => {
    expect(filesWritten(`sed -i 's/a/b/' package.json`)).toEqual([])
  })

  test('lists the code extensions once each', () => {
    expect(new Set(CODE_EXTENSIONS).size).toBe(CODE_EXTENSIONS.length)
    expect(CODE_EXTENSIONS).toContain('ts')
    expect(CODE_EXTENSIONS).not.toContain('md')
  })
})
