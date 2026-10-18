/**
 * badge.tsx: one badge of the band, drawn by the engine as a `Client` region.
 *
 * A `Button` inverts under the pointer and no prop switches that off, so the badge is plain
 * text here, and this module takes the pointer itself: the badge lightens while the pointer is
 * over it, and a left click posts `{ open: <ticket id> }` to the mod's `ui.message` hook, where
 * the board will open.
 */
import type { ClientModule } from 'claude-code'

export type BadgeProps = {
  /** The ticket id, posted on a click. */
  id: string
  name: string
  status: string
  /** The badge's colour, and the status part's fill, at rest and under the pointer. */
  colour: string
  dark: string
  lit: string
  darkLit: string
  /** The colour of each letter of the name while the wave runs; absent, the name is `ink`. */
  letters?: string[]
  ink: string
}

type State = { hot: boolean }

const Badge: ClientModule<BadgeProps, State> = (props, surface) => {
  const { Text } = surface.elements
  const hot = surface.state?.hot ?? false
  // A later call replaces the listener, so it always holds the props of this draw.
  surface.onPointer((event) => {
    if (event.type === 'enter' || event.type === 'leave') surface.setState({ hot: event.type === 'enter' })
    else if (event.type === 'up' && event.button === 'left') surface.post({ open: props.id })
  })
  const colour = hot ? props.lit : props.colour
  const dark = hot ? props.darkLit : props.dark
  const name = props.letters
    ? [...props.name].map((letter, i) => (
        <Text key={`n${i}`} color={props.letters?.[i] ?? props.ink} backgroundColor={colour}>
          {letter}
        </Text>
      ))
    : [
        <Text key="name" color={props.ink} backgroundColor={colour}>
          {props.name}
        </Text>,
      ]
  return (
    <Text>
      <Text color={colour}>▐</Text>
      {name}
      <Text color={colour} backgroundColor={dark}>
        {props.status}
      </Text>
      <Text color={dark}>▌</Text>
    </Text>
  )
}

export default Badge
