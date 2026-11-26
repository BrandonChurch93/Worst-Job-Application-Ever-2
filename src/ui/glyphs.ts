import { hasFont, loadFont } from '../shell/metrics'
import css from './glyphs.module.css'
import { outline, spaceOf } from './outline'

const SVG = 'http://www.w3.org/2000/svg'
const asked = new Map<string, Promise<boolean>>()

export function needFont(name: string): Promise<boolean> {
  if (hasFont(name)) return Promise.resolve(true)
  let p = asked.get(name)
  if (!p) {
    p = loadFont(name).then(
      () => true,
      () => false
    )
    asked.set(name, p)
  }
  return p
}

function picture(name: string, text: string, tabular: boolean): SVGSVGElement {
  const o = outline(name, text, tabular)
  const svg = document.createElementNS(SVG, 'svg')
  svg.setAttribute('viewBox', `0 ${-o.top} ${o.width} ${o.top - o.bottom}`)
  svg.setAttribute('aria-hidden', 'true')
  svg.setAttribute('focusable', 'false')
  svg.setAttribute('class', css.glyphs!)
  svg.style.width = `${o.width / o.unitsPerEm}em`
  svg.style.height = `${(o.top - o.bottom) / o.unitsPerEm}em`
  svg.style.verticalAlign = `${o.bottom / o.unitsPerEm}em`
  const path = document.createElementNS(SVG, 'path')
  path.setAttribute('d', o.d)
  svg.append(path)
  return svg
}

export interface Drawn { wrap?: boolean; tabular?: boolean }

// The words stay in the page as text for a reader that does not see; the eye gets the same outlines the stage draws.
export function draw(el: HTMLElement, text: string, name: string, how: Drawn = {}): void {
  if (el.dataset.drawn === `${name}:${text}`) return
  if (!hasFont(name)) {
    el.textContent = text
    delete el.dataset.drawn
    void needFont(name).then((ok) => {
      if (ok && el.textContent === text) draw(el, text, name, how)
    })
    return
  }
  try {
    const said = document.createElement('span')
    said.className = css.said!
    said.textContent = text
    const parts: Node[] = [said]
    if (how.wrap) {
      const words = text.split(' ').filter((w) => w.length > 0)
      words.forEach((w, i) => {
        const svg = picture(name, w, false)
        if (i + 1 < words.length) svg.style.marginRight = `${spaceOf(name)}em`
        parts.push(svg)
        if (i + 1 < words.length) parts.push(document.createElement('wbr'))
      })
    } else parts.push(picture(name, text, how.tabular === true))
    el.replaceChildren(...parts)
    el.dataset.drawn = `${name}:${text}`
  } catch {
    el.textContent = text
  }
}

const FACES = ['inter-400', 'inter-500', 'inter-600', 'inter-display-600']

// Resolves when the outlines the interface draws its words from have loaded or have failed to. Never rejects.
export function ready(): Promise<void> {
  return Promise.all(FACES.map((name) => needFont(name))).then(() => undefined)
}
