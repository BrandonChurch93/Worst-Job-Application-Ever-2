import { config } from '../config'
import css from './touch.module.css'
import { word } from './words'

export const portfolioAddress = (): string => config.links.portfolioWork.trim()

export function mountTouchMessage(host: HTMLElement): void {
  const page = document.createElement('main')
  page.className = css.page!
  const head = document.createElement('header')
  head.className = css.header!
  const site = document.createElement('p')
  site.className = css.site!
  site.textContent = word('title')
  head.append(site)
  const body = document.createElement('section')
  body.className = css.body!
  const title = document.createElement('h1')
  title.className = css.title!
  title.textContent = word('touchTitle')
  const words = document.createElement('p')
  words.className = css.words!
  words.textContent = word('touchBody')
  body.append(title, words)
  const address = portfolioAddress()
  if (address) {
    const link = document.createElement('a')
    link.className = css.link!
    link.href = address
    link.textContent = word('touchLink')
    body.append(link)
  }
  page.append(head, body)
  host.append(page)
}
