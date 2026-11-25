import fs from 'node:fs'
import { args } from './lib/paths.mjs'
import * as p from './lib/progress.mjs'

const a = args()
const content = () => (a.file ? fs.readFileSync(a.file, 'utf8') : a.text === true ? '' : String(a.text ?? ''))
if (a.set) p.setStatus(a.set, String(a.value))
else if (a.append) p.appendTo(a.append, content())
else if (a.replace) p.replaceBody(a.replace, content())
else if (a.row) p.setRow(a.row, a.first, JSON.parse(a.cells))
else if (a.remove) p.removeLine(a.remove, String(a.prefix))
else if (a.show) console.log(p.sectionBody(a.show))
else console.log('progress: --set KEY --value V | --append SECTION --text T | --replace SECTION --file F | --row SECTION --first CELL --cells JSON | --remove SECTION --prefix P | --show SECTION')
