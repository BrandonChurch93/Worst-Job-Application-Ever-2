// The whole page of a touch-only device: the message and its type, and nothing of the site.
import { copy } from '../copy'
import { ready } from './glyphs'
import { mountTouchMessage } from './touch'
import css from './touch.module.css'

document.title = copy.site.title
// The window round the page, the bars of a phone on its side and the browser's own bar take the ceramic too, whatever colour scheme the device asks for.
document.documentElement.classList.add(css.device!)
const tone = document.createElement('meta')
tone.name = 'theme-color'
tone.content = getComputedStyle(document.documentElement).backgroundColor
document.head.append(tone)
;(document.getElementById('stage') as HTMLCanvasElement).hidden = true
void ready().then(() => mountTouchMessage(document.getElementById('controls') as HTMLElement))
