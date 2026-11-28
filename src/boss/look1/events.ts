import { FALL, FORM, GONE, TURRET } from './pose'

// On which moment of the look each event must land, and how long its sound may be.
// `at` is a share of boss.form or boss.turret where the event belongs to a stage, else the field of the view that starts it. Seconds are for the live site's 2.9 s forming and 1.6 s turret beat.
export const EVENTS = {
  'break-out': { on: 'form', at: FORM.launch, seconds: 0.17, sound: 1.4, note: 'the button leaves the socket; the crack runs before it from form 0' },
  'body-clamp': { on: 'form', at: FORM.press[1], seconds: 0.58, sound: 0.5, note: 'the hull closes on the button in the air and presses it' },
  'body-land': { on: 'form', at: FORM.land, seconds: 0.99, sound: 0.9, note: 'he lands on the slab on his belly' },
  'leg-stomp': { on: 'form', at: [FORM.legs[0] + FORM.legTime, FORM.legs[1] + FORM.legTime, FORM.legs[2] + FORM.legTime, FORM.legs[3] + FORM.legTime], seconds: [1.8, 2.03, 2.26, 2.49], sound: 0.35, note: 'each foot comes down' },
  'turret-rise': { on: 'turret', at: TURRET.hatch[0], seconds: 0.03, sound: 1.25, note: 'the hatch slides, then the cannon climbs; the sound runs to the lock' },
  'turret-lock': { on: 'turret', at: 1, seconds: 1.6, sound: 0.7, note: 'the fight fires it when turret reaches 1; the cannon comes down on its rest at turret 0.94 (0.10 s before) and the kick, sparks and ring run 0.16 to 0.5 s from there, past turret 1 when the view carries boss.lockedAt' },
  'bullet-fire': { on: 'guns[i].firedAt', at: 0, seconds: 0, sound: 0.3, note: 'flash for 0.07 s, kick for 0.25 s' },
  'shield-glance': { on: 'shield.glancedAt', at: 0, seconds: 0, sound: 0.35, note: 'the glass flashes for 0.3 s' },
  'boss-heal': { on: 'healedAt', at: 0, seconds: 0, sound: 0.6, note: 'a pulse over the hull for 0.6 s' },
  'big-tell': { on: 'big.tell', at: 0, seconds: 0, sound: 1.6, note: 'a rising charge as long as the tell; it must end on big-fire' },
  'big-fire': { on: 'big.firedAt', at: 0, seconds: 0, sound: 1.5, note: 'the beam stands 0.3 s, the recoil 0.45 s, heat and smoke 1.2 s' },
  'turret-off': { on: 'beaten', at: FALL.off[0], seconds: 0, sound: 0.9, note: 'the cannon is blown off over beaten 0 to 0.4 (0.4 s of the 1.0 s fall), the glass bursts from 0.05' },
  'boss-fall': { on: 'beaten', at: FALL.drop[1], seconds: 0.7, sound: 0.8, note: 'the body drops from beaten 0.3 and hits the ground on its belly at 0.7; dust and a short settle follow' },
  'finish-fire': { on: 'gone', at: 0, seconds: 0, sound: 2.1, note: 'the parts are torn off down the beam from gone 0.02; the hull comes apart in seven pieces from gone 0.28; the beam and its light are drawn by the finish' },
  'boss-gone': { on: 'gone', at: 1, seconds: 2.13, sound: 1, note: 'the last piece is out of the picture by gone 0.98; the button, its rim, four torn plates, a claw, a bent plate and two bolts stay' },
  'button-down': { on: 'gone', at: GONE.button[1], seconds: 1.92, sound: 0.4, note: 'the bare button is on the ground at gone 0.9; the fight sounds it later, at boss-gone + 1.4 s, when the look shows nothing new' },
  'finish-press': { on: 'pressedAt', at: 0, seconds: 0, sound: 0.3, note: 'the button goes down under the fist in 0.07 s and stays down while the fist is on it; it springs back only from boss.releasedAt' }
} as const
