import type { Acting, Reaction } from '../../cursor/body'
import type { Pointer } from '../../stage/types'
import { AT, FILM } from './timeline'

type P = { x: number; y: number }
export interface Marks { hand: P; wait: P; spot: P; drop: P; press: P }

interface Key { t: number; x: number; y: number }

export interface Cue { at: number; act?: Acting; react?: Reaction; aim?: number | null }

// The hit of the stamp. It hangs high and draws back (`wind`), falls in four frames, strikes, gives, rebounds once (`rebound` px, over by `reboundSeconds`), rocks and is still.
// Seen from straight above a fall has no travel across the picture, so the block is drawn larger the higher it is: `grow` more at `growOver` px over the sheet.
export const HIT = {
  windSeconds: 0.24, windRise: 30, windTilt: -0.13, fallPower: 1.6, over: 9, give: 2.4, giveSeconds: 0.05, bulge: 5, rock: 0.022, rockSeconds: 0.07, rockRate: 60, landRock: 0.03, dustSeconds: 0.5, dustReach: 90,
  grow: 0.38, growOver: 150, pinch: 0.02, back: { x: -40, y: -66 }, rebound: 20, reboundAt: 0.03, reboundSeconds: 0.1, sheetHop: 5, sheetSeconds: 0.14, carry: 124, shake: 13
} as const

export const grown = (over: number): number => 1 + HIT.grow * Math.min(1.2, Math.max(0, over / HIT.growOver))
export const reboundAt = (age: number): number => (age <= HIT.reboundAt || age >= HIT.reboundAt + HIT.reboundSeconds ? 0 : Math.sin((Math.PI * (age - HIT.reboundAt)) / HIT.reboundSeconds))
export const hopAt = (age: number): number => (age <= 0 || age >= HIT.sheetSeconds ? 0 : Math.sin((Math.PI * age) / HIT.sheetSeconds))

// Struck flat, the cursor sticks to the rubber with its tail out from under the block's edge, rises with the block and is carried off with it.
// Over its place the block shakes once (`shakeX`, `shakeRot`); the cursor is thrown `clear` of it in the first `off` of the way and `up` a little, comes down swaying (`sway` px, `swings` times) until `fall`, skids `skid` px and lies flat: `right` of the block's edge and `down` from its middle. `heal` is the seconds a visitor's arrow then lies flat, peels and fills (the film's is `FILM.heal`). `shade` and `shadeDark` are its soft shade on the page while it is in the air.
export const STUCK = { right: 79, down: 36, heal: 0.78, hang: 110, fall: 0.86, off: 0.15, up: 26, clear: 64, sway: 38, swings: 2.5, float: 10, skid: 18, shakeRot: 0.17, shakeX: 30, shade: 30, shadeDark: 0.62 } as const

// Set down, the stamp is laid on its side, grip away from the reader, a little off square: `turn` about its long axis, `rot` on the page.
export const LIE = { turn: Math.PI / 2, rot: -0.17 } as const

// The wait: the word is nervous. The page turn sets it down at the hand-off place, on the counter. It backs off the counter to the bare glass under it and holds its place there: beads, tremble, gulp.
export const ARRIVE = { look: 0.52, there: 0.86 } as const
// The letter: shocked, then proud, then scared. It starts as the counter spins, does its double take as the sheet lands and holds a tilt toward it; puffs up and holds; dusts itself off; struts to the sheet's corner; and the shadow is on it.
export const HOPE = { spin: 2.03, tilt: 3.06, lean: -0.36, proud: 3.5, dust: 3.94, walk: [4.44, 4.8] } as const
// Under the narrator's line, the kept take, which has a pause before each phrase. The arrow lies flat under the first phrase and peels itself up in the pause after it (`FILM.heal`; the 4 s a damage may last end as the second phrase starts).
// In the pause before the third phrase it dusts itself off (`dust`); on the third it turns to the letter, on edge (`hear`); in the pause before the fourth it draws a breath (`breath`).
// On the fourth, the one that sounds like good news, it puffs up and leans to the letter as it did when the letter fell (`look`); in the pause after it, it hops (`hop`); on the fifth it sags (`sag`).
export const READ = { dust: FILM.dust, hear: FILM.hear, breath: FILM.breath, look: FILM.read, lean: HOPE.lean, hop: FILM.hop, sag: FILM.sag } as const
// The button: the word is beaten. It looks at the one button there is, drags itself there, leans back from it for 0.3 s, rises and drives its tip into it as the line ends.
// The last phrase of the take is 1.73 s long and the press is 0.14 s before its end, so the look comes 0.31 s after the sag and the walk 0.26 s after the look.
export const GIVE = { look: FILM.press - 1.28, walk: [FILM.press - 1.02, FILM.press - 0.41], strike: FILM.press - 0.1 } as const

export const CUES: Cue[] = [
  { at: HOPE.spin, react: 'flinch' },
  { at: HOPE.tilt, aim: HOPE.lean },
  { at: HOPE.proud, aim: null },
  { at: HOPE.dust, react: 'dustOff' },
  { at: READ.dust, react: 'dustOff' },
  { at: READ.hear, act: 'nervous', aim: READ.lean },
  { at: READ.breath, react: 'anticipate' },
  { at: READ.look, act: 'proud', aim: READ.lean },
  { at: READ.hop, react: 'jump' },
  { at: READ.sag, act: 'exhausted', aim: null },
  { at: GIVE.look, react: 'doubleTake' },
  { at: GIVE.strike, react: 'stamp' }
]

function keys(m: Marks): Key[] {
  return [
    { t: 0, x: m.hand.x, y: m.hand.y },
    { t: ARRIVE.look, x: m.hand.x, y: m.hand.y },
    { t: ARRIVE.there, x: m.wait.x, y: m.wait.y },
    { t: HOPE.walk[0], x: m.wait.x, y: m.wait.y },
    { t: HOPE.walk[1], x: m.spot.x, y: m.spot.y },
    { t: FILM.flat, x: m.spot.x, y: m.spot.y },
    { t: FILM.landed, x: m.drop.x, y: m.drop.y },
    { t: GIVE.walk[0], x: m.drop.x, y: m.drop.y },
    { t: GIVE.walk[1], x: m.press.x, y: m.press.y }
  ]
}

const smooth = (u: number): number => u * u * (3 - 2 * u)

export function pointerAt(m: Marks, time: number): Pointer {
  const k = keys(m)
  const down = time >= FILM.press && time < FILM.press + 0.2
  if (time <= k[0]!.t) return { x: k[0]!.x, y: k[0]!.y, down }
  for (let i = 1; i < k.length; i++) {
    const a = k[i - 1]!
    const b = k[i]!
    if (time <= b.t) {
      const u = smooth((time - a.t) / Math.max(1e-6, b.t - a.t))
      return { x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u, down }
    }
  }
  const last = k[k.length - 1]!
  return { x: last.x, y: last.y, down }
}
