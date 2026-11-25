const NS = 'http://www.w3.org/2000/svg'

const SHAPES = {
  soundOn: { fill: 'M3 9v6h4l5 4V5L7 9H3z', line: 'M15.5 8.5a5 5 0 0 1 0 7M18 6a8.5 8.5 0 0 1 0 12' },
  soundOff: { fill: 'M3 9v6h4l5 4V5L7 9H3z', line: 'M16 9.5l5 5M21 9.5l-5 5' },
  play: { fill: 'M7 5v14l12-7z', line: '' },
  pause: { fill: 'M7 5h4v14H7zM13 5h4v14h-4z', line: '' },
  back: { fill: '', line: 'M6 6l12 12M18 6L6 18' }
} as const

export type IconId = keyof typeof SHAPES

export function icon(id: IconId): SVGSVGElement {
  const svg = document.createElementNS(NS, 'svg')
  svg.setAttribute('viewBox', '0 0 24 24')
  svg.setAttribute('aria-hidden', 'true')
  svg.setAttribute('focusable', 'false')
  const fill = document.createElementNS(NS, 'path')
  fill.setAttribute('fill', 'currentColor')
  const line = document.createElementNS(NS, 'path')
  line.setAttribute('fill', 'none')
  line.setAttribute('stroke', 'currentColor')
  line.setAttribute('stroke-width', '2')
  line.setAttribute('stroke-linecap', 'round')
  svg.append(fill, line)
  setIcon(svg, id)
  return svg
}

export function setIcon(svg: SVGSVGElement, id: IconId): void {
  if (svg.dataset.icon === id) return
  svg.dataset.icon = id
  svg.children[0]!.setAttribute('d', SHAPES[id].fill)
  svg.children[1]!.setAttribute('d', SHAPES[id].line)
}
