import { config } from '../config'
import { draw } from './glyphs'
import css from './touch.module.css'
import { word } from './words'

export const portfolioAddress = (): string => config.links.portfolioWork.trim()

// The message takes the focus, so that a screen reader starts at it.
export function mountTouchMessage(host: HTMLElement): { destroy(): void } {
  const page = document.createElement('main')
  page.className = css.page!
  const head = document.createElement('header')
  head.className = css.header!
  const site = document.createElement('p')
  site.className = css.site!
  draw(site, word('title'), 'inter-600', { wrap: true })
  head.append(site)
  const body = document.createElement('section')
  body.className = css.body!
  const title = document.createElement('h1')
  title.className = css.title!
  draw(title, word('touchTitle'), 'inter-display-600', { wrap: true })
  const words = document.createElement('p')
  words.className = css.words!
  draw(words, word('touchBody'), 'inter-400', { wrap: true })
  body.append(title, words)
  const address = portfolioAddress()
  if (address) {
    const link = document.createElement('a')
    link.className = css.link!
    link.href = address
    draw(link, word('touchLink'), 'inter-600', { wrap: true })
    body.append(link)
  }
  page.append(head, body)
  page.tabIndex = -1
  host.append(page)
  page.focus({ preventScroll: true })
  return { destroy: () => page.remove() }
}
