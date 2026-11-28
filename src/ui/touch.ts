import { draw } from './glyphs'
import css from './touch.module.css'
import { word } from './words'

// The film's review page, where the film plays on a phone too. The one way on from this notice (change note 004, item 13); no other address is linked.
export const FILM_PAGE = 'https://www.perplexity.ai/computer/a/the-worst-job-application-ever-11C.YCwbSEaDnRs_ar70Dw'

// The message takes the focus, so that a screen reader starts at it.
export function mountTouchMessage(host: HTMLElement): { destroy(): void } {
  const page = document.createElement('main')
  page.className = css.page!
  const head = document.createElement('header')
  head.className = css.header!
  const site = document.createElement('p')
  site.className = css.site!
  draw(site, word('title'), 'inter-600', { wrap: true })
  const rule = document.createElement('div')
  rule.className = css.rule!
  rule.setAttribute('aria-hidden', 'true')
  head.append(site, rule)
  const body = document.createElement('section')
  body.className = css.card!
  const title = document.createElement('h1')
  title.className = css.title!
  draw(title, word('touchTitle'), 'inter-display-600', { wrap: true })
  const words = document.createElement('p')
  words.className = css.words!
  draw(words, word('touchBody'), 'inter-400', { wrap: true })
  body.append(title, words)
  const link = document.createElement('a')
  link.className = css.link!
  link.href = FILM_PAGE
  draw(link, word('watchFilm'), 'inter-600', { wrap: true })
  body.append(link)
  page.append(head, body)
  page.tabIndex = -1
  host.append(page)
  page.focus({ preventScroll: true })
  return { destroy: () => page.remove() }
}
