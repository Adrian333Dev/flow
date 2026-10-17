import { describe, expect, test } from 'claude-code/testing'
import { tokenize, type Piece } from './tokenize'

const typed = (pieces: Piece[]) => pieces.map((p) => `${p.type}:${p.text}`)
const lines = (command: string) => tokenize(command).map(typed)
const rejoin = (command: string) => tokenize(command).map((pieces) => pieces.map((p) => p.text).join(''))

describe('tokenize', () => {
  test('a plain command is one plain piece', () => {
    expect(lines('npm test')).toEqual([['plain:npm test']])
  })

  test('colours a loop: control words, a string, a comment', () => {
    const command = 'for f in *.md; do\n  echo "$f" # show it\ndone'
    expect(lines(command)).toEqual([
      ['control:for', 'plain: f ', 'control:in', 'plain: *.md', 'control:;', 'plain: ', 'control:do'],
      ['plain:  echo ', 'string:"$f"', 'plain: ', 'comment:# show it'],
      ['control:done'],
    ])
  })

  test('operators are control, and a word after one may be a keyword', () => {
    expect(lines('a && b | c > out.txt')).toEqual([
      ['plain:a ', 'control:&&', 'plain: b ', 'control:|', 'plain: c ', 'control:>', 'plain: out.txt'],
    ])
    expect(lines('make; if true; then echo ok; fi')[0]).toContain('control:fi')
  })

  test('a keyword used as an argument stays plain', () => {
    expect(lines('echo done in for')).toEqual([['plain:echo done in for']])
  })

  test('a # inside a word is no comment', () => {
    expect(lines('echo a#b')).toEqual([['plain:echo a#b']])
  })

  test('a quote left open runs into the next line', () => {
    expect(lines("echo 'one\ntwo' x")).toEqual([
      ['plain:echo ', "string:'one"],
      ["string:two'", 'plain: x'],
    ])
  })

  test('a backslash keeps a quote from closing a double string', () => {
    expect(lines('echo "a \\" b" c')).toEqual([['plain:echo ', 'string:"a \\" b"', 'plain: c']])
  })

  test('a here-doc body is a string, and its closing line is a control word that ends it', () => {
    const command = "cat <<'EOF' > f.txt\nfor # \"x\n#!/bin/sh\nEOF\nls && pwd"
    const result = lines(command)
    expect(result[1]).toEqual(['string:for # "x'])
    expect(result[2]).toEqual(['string:#!/bin/sh'])
    expect(result[3]).toEqual(['control:EOF'])
    expect(result[4]).toContain('control:&&')
  })

  test('a commit message in a here-doc is the string between the command and EOF', () => {
    const command = "git commit -q -F - <<'EOF'\nsubject line\n\nbody && more\nEOF\ngit status"
    const result = lines(command)
    expect(result[0]).toContain('control:<<')
    expect(result.slice(1, 4)).toEqual([['string:subject line'], [], ['string:body && more']])
    expect(result[4]).toEqual(['control:EOF'])
    expect(result[5]).toEqual(['plain:git status'])
  })

  test('a continued line does not start a new command', () => {
    expect(lines('npm run \\\n  for')).toEqual([['plain:npm run \\'], ['plain:  for']])
  })

  test('an empty command and empty lines hold no pieces', () => {
    expect(tokenize('')).toEqual([[]])
    expect(tokenize('a\n\nb')[1]).toEqual([])
  })

  test('joining each line gives the line back', () => {
    const commands = [
      'git push origin main',
      'for f in a b; do\n  gzip "$f" # pack\ndone',
      "cat <<-EOF\n\tbody\n\tEOF\necho 'it'",
      'rm -rf "$DIR"/* && echo "gone" || true',
      'echo "open\nstill open" ; ls',
      'while read l; do echo $l; done < in.txt',
    ]
    for (const command of commands) expect(rejoin(command)).toEqual(command.split('\n'))
  })
})
