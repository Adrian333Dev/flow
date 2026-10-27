import { test } from 'node:test';
import assert from 'node:assert';
import * as query from './query.ts';

const FIELDS = ['label', 'project'];

test('words and field terms are told apart, and a comma inside a value means either', () => {
  assert.deepStrictEqual(query.parse('label:profile,UI cache', FIELDS), [
    { field: 'label', values: ['profile', 'ui'] },
    { field: null, values: ['cache'] },
  ]);
});

test('a word with a colon whose left side is no field stays a word', () => {
  assert.deepStrictEqual(query.parse('https://x.dev note:1 label:', FIELDS), [
    { field: null, values: ['https://x.dev'] },
    { field: null, values: ['note:1'] },
    { field: null, values: ['label:'] },
  ]);
});

test('an empty query has no terms, and has() finds a field', () => {
  assert.deepStrictEqual(query.parse('', FIELDS), []);
  assert.deepStrictEqual(query.parse(undefined, FIELDS), []);
  const terms = query.parse('project:all x', FIELDS);
  assert.ok(query.has(terms, 'project'));
  assert.ok(!query.has(terms, 'label'));
});

test('a matcher needs every term, and one value of a term is enough', () => {
  const tests = {
    word: (r, w) => r.text.includes(w),
    label: (r, v) => r.labels.includes(v),
    project: (r, v) => r.project === v,
  };
  const match = query.matcher(query.parse('label:a,b cache', FIELDS), tests);
  assert.ok(match({ text: 'cache it', labels: ['b'], project: 'x' }));
  assert.ok(!match({ text: 'cache it', labels: ['c'], project: 'x' }));
  assert.ok(!match({ text: 'other', labels: ['a'], project: 'x' }));
  assert.ok(query.matcher([], tests)({ text: '', labels: [], project: 'x' }), 'no terms select everything');
});
