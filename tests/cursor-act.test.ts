import { describe, expect, it } from 'vitest'
import { config, stepHz } from '../src/config'
import { ACTING, CursorBody, DAMAGE, REACTIONS, STRIPS, gatheredAt, pileAt, restPose, type CursorPose, type Damage, type Place } from '../src/cursor/body'
import { restLook, type CursorLook } from '../src/cursor/contract'
import { actingLook } from '../src/cursor/act/acting'
import { damageLook } from '../src/cursor/act/damage'
import { FEEL } from '../src/cursor/act/feel'
import { pages } from '../src/pages'
import { filmFlow, filmOptions, ScriptDriver, Stage } from '../src/stage/stage'

const heal = config.cursor.damageHealSeconds
const home = { x: 600, y: 500 }
const quiet = (): void => {}
const hands: [Place, Place] = [{ x: 560, y: 590, z: 27 }, { x: 650, y: 590, z: 27 }]
const body = (): CursorBody => {
  const b = new CursorBody()
  b.reset(home.x, home.y)
  return b
}
const run = (b: CursorBody, seconds: number, arms = false, each?: (p: CursorPose, i: number) => void): void => {
  for (let i = 0; i < Math.round(seconds * stepHz); i++) {
    b.step(home, quiet, arms)
    if (each) each(b.pose(), i)
  }
}
const look = (p: CursorPose): CursorLook => {
  const out = restLook(1.5)
  actingLook!(p, out)
  damageLook!(p, out)
  return out
}
const whole = (l: CursorLook): boolean =>
  l.body.holes.length === 0 && l.body.strips === null && l.body.flat === 0 && l.body.char === 0 && l.body.seam === 0 && l.body.crack === 0 && l.body.peel === 0 && l.effects.smoke.length === 0

describe('damage', () => {
  it.each(DAMAGE)('%s is healed inside the heal window and shows on the way', (kind) => {
    const b = body()
    b.hurt(kind)
    let marked = 0
    let last = -1
    run(b, heal - 2 / stepHz, false, (p) => {
      if (!p.damage.length) return
      if (!whole(look(p))) marked++
      const w = p.wounds.find((d) => d.kind === kind)
      if (w) {
        expect(w.at).toBeGreaterThanOrEqual(last)
        last = w.at
      }
    })
    expect(marked).toBeGreaterThan(stepHz)
    const p = b.pose()
    expect(p.damage).toEqual([])
    expect(p.wounds).toEqual([])
    expect(p.strips).toBeNull()
    expect(whole(look(p))).toBe(true)
  })

  it('every kind at once, and hurt again and again, is still healed inside the window', () => {
    const b = body()
    for (const kind of DAMAGE) b.hurt(kind)
    run(b, heal / 2)
    for (const kind of DAMAGE) b.hurt(kind, heal)
    run(b, heal / 2 - 2 / stepHz)
    expect(b.pose().damage).toEqual([])
    expect(whole(look(b.pose()))).toBe(true)
  })

  it('nothing switches back: the hole closes, the char fades, the flat body refills', () => {
    const at = (kind: Damage, u: number) => look(restPose(0, 0, { damage: [kind], healing: u })).body
    expect(at('burn', 0.3).holes[0].r).toBeGreaterThan(2)
    expect(at('burn', 0.3).holes[0].glow).toBeLessThan(at('burn', 0.05).holes[0].glow)
    expect(at('burn', 0.8).holes[0].r).toBeLessThan(at('burn', 0.6).holes[0].r)
    expect(at('burn', 1).holes).toEqual([])
    expect(at('scorched', 0.7).char).toBeLessThan(at('scorched', 0.3).char)
    expect(at('scorched', 0.7).char).toBeGreaterThan(0)
    expect(at('flattened', 0.3).flat).toBeGreaterThan(0.9)
    expect(at('flattened', 0.6).peel).toBeGreaterThan(0)
    expect(at('flattened', 0.9).flat).toBeLessThan(at('flattened', 0.7).flat)
    expect(at('flattened', 0.9).stretch).toBeGreaterThan(1)
    expect(at('reassembled', 0.5).seam).toBe(1)
    expect(at('reassembled', 0.9).seam).toBeLessThan(1)
  })

  it('a burn is placed by the knock that came with it, and never off the body', () => {
    const b = body()
    b.hurt('burn')
    b.knock(900, 0, 380)
    b.step(home, quiet, false)
    const left = b.pose().wounds[0]
    const c = body()
    c.hurt('burn')
    c.knock(-900, 0, 380)
    c.step(home, quiet, false)
    expect(left.x).toBeLessThan(c.pose().wounds[0].x)
    const d = body()
    d.hurt('burn', 2, { x: home.x + 4000, y: home.y - 4000 })
    const far = d.pose().wounds[0]
    expect(Math.hypot(far.x - 4.3, far.y - 9.4)).toBeLessThanOrEqual(2.1 + 1e-9)
  })
})

describe('strips', () => {
  it('a pile is the same for the same seed and another for another seed', () => {
    for (const t of [0.1, 0.45, 2]) {
      expect(pileAt(config.seed, t)).toEqual(pileAt(config.seed, t))
      expect(pileAt(config.seed, t)).not.toEqual(pileAt(config.seed + 1, t))
    }
    expect(pileAt(config.seed, 2)).toHaveLength(STRIPS)
    expect(gatheredAt(config.seed, 0.5)).toEqual(gatheredAt(config.seed, 0.5))
  })

  it('the pile comes to rest on the page, each strip on its own layer', () => {
    const a = pileAt(7, 2)
    expect(a).toEqual(pileAt(7, 3))
    expect(new Set(a.map((p) => p.z)).size).toBe(STRIPS)
    for (const p of a) {
      expect(p.z).toBeGreaterThan(0)
      expect(p.tilt).toBe(0)
    }
  })

  it('two bodies with the same seed shred into the same pile, and a second shredding differs from the first', () => {
    const piles = [0, 1].map(() => {
      const b = body()
      b.setSeed(99)
      b.hurt('shredded', 0.45)
      run(b, 0.45)
      const first = b.pose().strips
      run(b, 2)
      b.hurt('shredded', 0.45)
      run(b, 0.45)
      return [first, b.pose().strips]
    })
    expect(piles[0]).toEqual(piles[1])
    expect(piles[0][0]).not.toBeNull()
    expect(piles[0][0]).not.toEqual(piles[0][1])
  })

  it('reassembly: the strips stand out of line, snap true, and the body is one piece with a seam that fades', () => {
    const b = body()
    b.hurt('shredded', 0.45)
    run(b, 0.45)
    b.hurt('reassembled', 0.8)
    const seen: string[] = []
    const mark = (s: string): void => {
      if (seen[seen.length - 1] !== s) seen.push(s)
    }
    run(b, 0.8 + 2 / stepHz, false, (p) => {
      const l = look(p).body
      if (l.strips) mark(l.strips.some((s) => Math.abs(s.rot) > 0.2) ? 'pile' : 'askew')
      else mark(l.seam > 0 ? 'seam' : 'whole')
    })
    expect(seen).toEqual(['pile', 'askew', 'seam', 'whole'])
  })

  it('a shredding left alone reassembles by itself', () => {
    const b = body()
    b.hurt('shredded', 0.6)
    run(b, 0.6 + 2 / stepHz)
    expect(b.pose().damage).toEqual(['reassembled'])
    run(b, heal)
    expect(b.pose().damage).toEqual([])
    expect(b.pose().strips).toBeNull()
  })
})

describe('arms', () => {
  it('never exist where they are not allowed, whatever is asked', () => {
    const b = body()
    b.setArms(true, hands)
    run(b, 1, false, (p) => {
      expect(p.arms).toBe(false)
      expect(p.hands).toBeNull()
      expect(p.sprout).toBe(0)
    })
  })

  it('sprout with an overshoot, close their hands, and are gone the step they are not allowed', () => {
    const b = body()
    b.setArms(true, hands)
    let top = 0
    run(b, 0.6, true, (p) => {
      expect(p.arms).toBe(true)
      top = Math.max(top, p.sprout)
    })
    expect(top).toBeGreaterThan(1.02)
    expect(b.pose().sprout).toBeCloseTo(1, 2)
    expect(b.pose().grip[0]).toBeGreaterThan(0.9)
    b.step(home, quiet, false)
    expect(b.pose().arms).toBe(false)
    expect(b.pose().hands).toBeNull()
  })

  it('torn off, they trail for a moment inside the beat and for no time outside it', () => {
    const b = body()
    b.setArms(true, hands)
    run(b, 0.6, true)
    b.setArms(false)
    let shown = 0
    run(b, 1, true, (p) => {
      if (p.arms) shown++
    })
    expect(shown).toBeGreaterThan(0)
    expect(shown / stepHz).toBeLessThanOrEqual(0.3 + 1 / stepHz)
    const c = body()
    c.setArms(true, hands)
    run(c, 0.6, true)
    c.setArms(false)
    run(c, 0.2, false, (p) => expect(p.arms).toBe(false))
  })

  it('in the film of step 1 the arms are in the tug and nowhere else, sprouted and strained', () => {
    const stage = new Stage({ mode: 'film', flow: filmFlow('step1'), pages, driver: new ScriptDriver(), film: filmOptions('step1') })
    const tug = config.film.beats.find((b) => b.id === config.cursor.armsOnlyInBeat)!
    let inside = 0
    let strain = 0
    let sprout = 0
    for (let i = 0; i < Math.round(31.45 * stepHz); i++) {
      stage.advance(1)
      const c = stage.cursor.pose()
      if (c.arms) {
        inside++
        strain = Math.max(strain, c.strain)
        sprout = Math.max(sprout, c.sprout)
        expect(c.hands).not.toBeNull()
        expect(stage.pageTime).toBeGreaterThanOrEqual(tug.from)
        expect(stage.pageTime).toBeLessThan(tug.to)
      } else expect(c.hands).toBeNull()
    }
    expect(inside / stepHz).toBeGreaterThan(5)
    expect(sprout).toBeGreaterThan(1.02)
    expect(strain).toBeGreaterThan(0.3)
    expect(stage.cursor.damaged).toBe(false)
  })
})

describe('acting', () => {
  it('a state is eased in, not switched', () => {
    const b = body()
    run(b, 0.1)
    b.act('exhausted')
    b.step(home, quiet, false)
    expect(b.pose().feel.melt).toBeLessThan(0.1)
    run(b, 3)
    expect(b.pose().feel.melt).toBeCloseTo(FEEL.exhausted.melt, 2)
  })

  it.each(ACTING)('%s gives a look inside the ranges the body takes', (state) => {
    const l = look(restPose(0, 0, { acting: state }))
    expect(l.body.stretch).toBeGreaterThanOrEqual(0.45)
    expect(l.body.stretch).toBeLessThanOrEqual(1.5)
    for (const k of ['puff', 'tremble', 'pale', 'heat', 'melt'] as const) {
      expect(l.body[k]).toBeGreaterThanOrEqual(0)
      expect(l.body[k]).toBeLessThanOrEqual(1)
    }
    expect(Math.abs(l.body.bend)).toBeLessThanOrEqual(1)
  })

  it.each(REACTIONS)('%s winds up or strikes a pose, then settles past rest and back', (name) => {
    const b = body()
    run(b, 0.2)
    b.react(name)
    let far = 0
    let crossings = 0
    let side = 0
    run(b, 2.5, false, (p) => {
      const d = p.squash - 1
      far = Math.max(far, Math.abs(d), Math.abs(p.lean))
      const now = Math.abs(d) < 0.002 ? 0 : Math.sign(d)
      if (now !== 0 && side !== 0 && now !== side) crossings++
      if (now !== 0) side = now
    })
    expect(far).toBeGreaterThan(0.04)
    expect(crossings).toBeGreaterThan(0)
    expect(b.pose().squash).toBeCloseTo(1, 2)
    expect(b.pose().reaction).toBeNull()
  })

  it('a nervous cursor gulps now and then, tip to tail', () => {
    const b = body()
    b.act('nervous')
    const seen: number[] = []
    run(b, 4.2, false, (p) => {
      if (p.gulp >= 0) seen.push(p.gulp)
    })
    expect(seen.length).toBeGreaterThan(stepHz * 0.5)
    expect(Math.max(...seen)).toBeLessThanOrEqual(1)
    const c = body()
    run(c, 4.2, false, (p) => expect(p.gulp).toBe(-1))
  })
})

describe('the same again', () => {
  it('load(save()) carries on exactly, with strips, arms and feeling in flight', () => {
    const a = body()
    a.act('angry')
    a.setArms(true, hands)
    run(a, 0.3, true)
    a.hurt('burn')
    a.knock(300, -200, 380)
    a.react('recoil')
    a.hurt('shredded', 0.45)
    run(a, 0.2, true)
    const b = new CursorBody()
    b.load(a.save())
    expect(b.pose()).toEqual(a.pose())
    a.hurt('reassembled', 0.6)
    b.hurt('reassembled', 0.6)
    a.setArms(false)
    b.setArms(false)
    for (let i = 0; i < stepHz * 3; i++) {
      a.step(home, quiet, i < 100)
      b.step(home, quiet, i < 100)
      if (i % 37 === 0) expect(b.pose()).toEqual(a.pose())
    }
    expect(b.save()).toEqual(a.save())
  })

  it('two runs give the same poses', () => {
    const once = (): CursorPose[] => {
      const b = body()
      const out: CursorPose[] = []
      b.act('scared')
      b.hurt('flattened')
      run(b, 1, false, (p, i) => {
        if (i % 24 === 0) out.push(p)
      })
      return out
    }
    expect(once()).toEqual(once())
  })
})
