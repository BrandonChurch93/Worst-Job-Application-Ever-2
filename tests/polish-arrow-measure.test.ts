import fs from 'node:fs'
import { it } from 'vitest'
import { strokeRun, table, visitorRun } from './polish-arrow-run'

const out = process.env.ARROW_OUT
it.skipIf(!out)('prints the arrow under a visitor, a row a frame of 60', () => {
  const visit = visitorRun(16)
  fs.writeFileSync(`${out}-visitor.txt`, table(visit))
  const careers = strokeRun('marketing', [{ to: [300, 640], seconds: 0.25, rest: 0.3 }, { to: [1100, 660], seconds: 0.3, rest: 0.3 }, { to: [500, 620], seconds: 0.2, rest: 0.3 }, { to: [1300, 300], seconds: 0.3, rest: 0.4 }, { to: [900, 700], seconds: 0.15, rest: 0.4 }])
  fs.writeFileSync(`${out}-careers.txt`, table(careers))
  const step1 = strokeRun('step1', [], 0)
  void step1
  const turn = strokeRun('step1', [{ to: [400, 500], seconds: 0.2, rest: 0.3 }, { to: [1200, 520], seconds: 0.3, rest: 0.3 }, { to: [600, 300], seconds: 0.25, rest: 0.4 }], 0)
  fs.writeFileSync(`${out}-step1.txt`, table(turn))
}, 120000)
