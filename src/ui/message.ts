// The whole page of a touch-only device: the message and its type, and nothing of the site.
import { copy } from '../copy'
import { ready } from './glyphs'
import { mountTouchMessage } from './touch'

document.title = copy.site.title
;(document.getElementById('stage') as HTMLCanvasElement).hidden = true
void ready().then(() => mountTouchMessage(document.getElementById('controls') as HTMLElement))
