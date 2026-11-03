
describe('spec-first', () => {
  const ROOT = '/code/flow'
  const PRODUCT = `${ROOT}/docs/spec/product.md`
  const withRepo = (run: () => void) => {
    setLinks(ROOT, [{ from: ROOT, to: '' }, { from: '/h/.flow/repos/flow', to: '' }, { from: '/h/.flow/references', to: 'references' }])
    try {
      run()
    } finally {
      setLinks('', [])
    }
  }

  test("an edit of a Flow part waits for product.md, beside the entry's own guides", () =>
    withRepo(() => {
      const plan = planFor([edit(`${ROOT}/home/CLAUDE.md`)], new Set())
      expect(plan.held).toEqual([0])
      expect(sent(plan)).toEqual(['references/guides/writing.md', 'references/guides/write-loaded-files.md', 'references/guides/write-rules.md', PRODUCT])
      expect(plan.added[3]!.header).toBe(`${HEADER} Before planning a change to CLAUDE.md, read the spec of the whole product.`)
      expect(sent(planFor([edit(`${ROOT}/scripts/flow.ts`)], new Set(['read:references/guides/write-code.md'])))).toEqual([PRODUCT])
    }))

  test('a whole read of product.md, through any link, lets the edit run', () =>
    withRepo(() => {
      const keys = windowKeys([
        { content: [{ type: 'tool_use', id: 'a', name: 'Read', input: { file_path: '/h/.flow/repos/flow/docs/spec/product.md' } }] },
        { content: [{ type: 'tool_result', tool_use_id: 'a' }] },
      ])
      expect(planFor([edit(`${ROOT}/scripts/flow.ts`)], new Set([...keys, 'read:references/guides/write-code.md'])).held).toEqual([])
    }))

  test('a read, the spec itself, the guides and another project wait for nothing', () =>
    withRepo(() => {
      expect(sent(planFor([read(`${ROOT}/scripts/flow.ts`)], new Set(['read:references/guides/write-code.md'])))).toEqual([])
      expect(sent(planFor([edit(`${ROOT}/docs/spec/rules.md`)], new Set(['read:references/guides/writing.md', 'read:references/guides/write-spec.md'])))).toEqual([])
      expect(sent(planFor([edit('/h/.flow/references/guides/writing.md')], new Set(['read:references/guides/writing.md', 'read:references/guides/write-loaded-files.md'])))).toEqual([])
      expect(sent(planFor([edit('/other/scripts/a.ts')], new Set(['read:references/guides/write-code.md'])))).toEqual([])
    }))

  test('a shell write into a Flow part waits for product.md too', () =>
    withRepo(() => {
      expect(sent(planFor([bash(`sed -i 's/a/b/' ${ROOT}/scripts/a.ts`)], new Set(['read:references/guides/write-code.md'])))).toEqual([PRODUCT])
    }))
})
