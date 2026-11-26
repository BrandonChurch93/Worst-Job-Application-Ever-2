// A sheet in panels: how wide each panel is and where it stands, in px of a picture `width` wide.
export interface PanelPlan {
  count: number
  gutter: number
  width: number
  left: number[]
}

export function panelPlan(width: number, count: number, gutter: number): PanelPlan {
  const n = Math.max(1, Math.floor(count))
  const g = n > 1 ? Math.max(0, Math.round(gutter)) : 0
  const w = Math.floor((width - g * (n - 1)) / n)
  const spare = width - (w * n + g * (n - 1))
  const first = Math.floor(spare / 2)
  return { count: n, gutter: g, width: w, left: Array.from({ length: n }, (_, i) => first + i * (w + g)) }
}
