import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { GLASS_DOOR, glassBends, setGlass } from '../src/core/levelGlass'

const ball = readFileSync(new URL('../src/table/real/ball/index.ts', import.meta.url), 'utf8')

describe('the door the level uses to tell the ball whether it bends', () => {
  it('is still listened to by the ball, on the window, under the same name', () => {
    expect(ball).toContain(`window.addEventListener('${GLASS_DOOR}'`)
    const line = ball.split('\n').find((l) => l.includes(`addEventListener('${GLASS_DOOR}'`))!
    expect(line).toMatch(/Object\.assign\(\s*debug\s*,\s*\(e as CustomEvent\)\.detail\s*\)/)
  })

  it('reaches the uniform that bends: the ball still reads `bend` of what the door wrote', () => {
    expect(ball).toMatch(/bend:\s*boolean/)
    expect(ball).toMatch(/uBend!\.value\s*=\s*debug\.bend\s*\?\s*1\s*:\s*0/)
  })

  it('says through that door exactly what the level asks', () => {
    const said: { type: string; detail: unknown }[] = []
    const target = { dispatchEvent: (e: Event) => (said.push({ type: e.type, detail: (e as CustomEvent).detail }), true) }
    if (typeof CustomEvent === 'undefined') return
    setGlass('frosted', target)
    setGlass('refracting', target)
    setGlass(null, target)
    expect(said).toEqual([
      { type: GLASS_DOOR, detail: { bend: glassBends('frosted') } },
      { type: GLASS_DOOR, detail: { bend: true } },
      { type: GLASS_DOOR, detail: { bend: true } },
    ])
    expect(glassBends('frosted')).toBe(false)
  })
})
