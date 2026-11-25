import fs from 'node:fs'
import { args } from './lib/paths.mjs'
import { addLook, readLooks } from './lib/looks.mjs'

const a = args()
if (a.add) {
  if (!fs.existsSync(a.add)) {
    console.error(`look: no such file ${a.add}`)
    process.exit(1)
  }
  const line = addLook(a.add, a.caption === true || !a.caption ? '' : a.caption, a.by === true || !a.by ? 'builder' : a.by)
  console.log(`look added: ${line.file}`)
} else {
  const looks = readLooks()
  console.log(`${looks.length} looks`)
  for (const l of looks.slice(-10)) console.log(`${l.time} ${l.by} ${l.file} ${l.caption}`)
}
