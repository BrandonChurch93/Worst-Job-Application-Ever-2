// The names of the controls that show no word: what assistive technology reads for an icon.
// content/copy.json has no word for them. This list is kept as short as it can be, for Brandon to approve.
export const names = {
  sound: 'Sound',
  play: 'Play',
  position: 'Position in the film',
  back: 'Back to the application'
} as const

export type NameId = keyof typeof names
