import { describe, expect, test } from 'claude-code/testing'
import type { ClientPointerEvent } from 'claude-code'

import Badge, { type BadgeProps } from './badge'

const PROPS: BadgeProps = {
  id: 'fw-9',
  name: 'fw-9-x',
  status: ' BUILD 1/2',
  colour: '#ffb703',
  dark: '#26241b',
  lit: '#ffc021',
  darkLit: '#3b3219',
  ink: '#000000',
}

type Node = { type: string; props: Record<string, unknown>; children: unknown[] }

/** A surface that records the pointer listener, the state and the posts, and draws plain nodes. */
function surface() {
  const made = {
    state: undefined as { hot: boolean } | undefined,
    posts: [] as unknown[],
    pointer: undefined as ((event: ClientPointerEvent) => void) | undefined,
  }
  const Text = (props: { children?: unknown } & Record<string, unknown>): Node => {
    const { children, ...rest } = props
    return { type: 'Text', props: rest, children: [children].flat() }
  }
  const api = {
    elements: { Text },
    get state() {
      return made.state
    },
    setState: (next: { hot: boolean }) => {
      made.state = next
    },
    onPointer: (fn: (event: ClientPointerEvent) => void) => {
      made.pointer = fn
      return () => undefined
    },
    post: (data: unknown) => made.posts.push(data),
  }
  return { made, api: api as never }
}

/** The colours of the badge's parts: the left corner, the name, the status fill. */
const colours = (tree: unknown) => {
  const parts = ((tree as Node).children as Node[]).flat() as Node[]
  const corner = parts.find((part) => part.children[0] === '▐')
  const name = parts.find((part) => part.children[0] === PROPS.name)
  const status = parts.find((part) => part.children[0] === PROPS.status)
  return { corner: corner?.props.color, name: name?.props.backgroundColor, status: status?.props.backgroundColor }
}

describe('the badge', () => {
  test('draws plain text in the badge colours', () => {
    const { api } = surface()
    expect(colours(Badge(PROPS, api))).toEqual({ corner: PROPS.colour, name: PROPS.colour, status: PROPS.dark })
  })

  test('lightens while the pointer is over it, and returns when it leaves', () => {
    const { made, api } = surface()
    Badge(PROPS, api)
    made.pointer?.({ type: 'enter', x: 3, y: 0 })
    expect(colours(Badge(PROPS, api))).toEqual({ corner: PROPS.lit, name: PROPS.lit, status: PROPS.darkLit })
    made.pointer?.({ type: 'leave', x: 3, y: 0 })
    expect(colours(Badge(PROPS, api)).name).toBe(PROPS.colour)
  })

  test('a left click posts the ticket id; another button posts nothing', () => {
    const { made, api } = surface()
    Badge(PROPS, api)
    made.pointer?.({ type: 'up', x: 3, y: 0, button: 'right' })
    made.pointer?.({ type: 'down', x: 3, y: 0, button: 'left' })
    const clicks = () => made.posts.filter((post) => 'open' in (post as object))
    expect(clicks()).toEqual([])
    made.pointer?.({ type: 'up', x: 3, y: 0, button: 'left' })
    expect(clicks()).toEqual([{ open: 'fw-9' }])
  })

  test('the wave colours each letter of the name', () => {
    const { api } = surface()
    const letters = [...PROPS.name].map((_, i) => `#00000${i % 10}`)
    const tree = Badge({ ...PROPS, letters }, api) as unknown as Node
    const drawn = (tree.children as Node[]).flat().filter((part) => part.props.backgroundColor === PROPS.colour && part.children[0] !== '▐')
    expect(drawn.map((part) => part.props.color)).toEqual(letters)
  })
})
