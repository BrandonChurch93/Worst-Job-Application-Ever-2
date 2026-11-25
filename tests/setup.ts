import fs from 'node:fs'
import path from 'node:path'
import { FONTS, registerFont } from '../src/shell/metrics'

for (const name of FONTS) registerFont(name, JSON.parse(fs.readFileSync(path.join('public', 'fonts', `${name}.json`), 'utf8')))

const { preparePages } = await import('../src/pages')
await preparePages()
