import fs from 'node:fs'
import crypto from 'node:crypto'
import { it } from 'vitest'
import { stepHz } from '../src/config'
import { pages } from '../src/pages'
import { filmFlow, filmOptions, ScriptDriver, Stage } from '../src/stage/stage'
import type { DrawList } from '../src/stage/types'

const to = process.env.POLISH_KEYS_FILM

it.skipIf(!to)('writes one line per film frame of step 1 and one per event', () => {
  const s = new Stage({ mode: 'film', flow: filmFlow('step1'), pages, driver: new ScriptDriver(), film: filmOptions('step1') })
  const per = stepHz / 60
  const out: string[] = []
  const ev: string[] = []
  let seen = 0
  let n = 0
  while (s.time < 32) {
    s.advance(1)
    n++
    for (const e of s.events.slice(seen)) ev.push(`${n}\t${e.name}`)
    seen = s.events.length
    if (n % per !== 0) continue
    const list: DrawList = []
    s.page.draw(list)
    const h = crypto.createHash('sha1').update(JSON.stringify(list)).update(JSON.stringify(s.cursor.pose())).digest('hex')
    out.push(`${n / per}\t${(n / stepHz).toFixed(4)}\t${s.page.gag() ?? ''}\t${h}`)
  }
  fs.writeFileSync(to!, out.join('\n') + '\n')
  fs.writeFileSync(to! + '.events', ev.join('\n') + '\n')
})
