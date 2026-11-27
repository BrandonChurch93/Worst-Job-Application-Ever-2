import { FORM, TURRET } from './pose'

// On which moment of the look each event must land, and how long its sound may be.
// `at` is a share of boss.form or boss.turret where the event belongs to a stage, else the field of the view that starts it. Seconds are for the live site's 2.9 s forming and 1.6 s turret beat.
export const EVENTS = {
  'break-out': { on: 'form', at: FORM.launch, seconds: 0.17, sound: 1.4, note: 'the button leaves the socket; the crack runs before it from form 0' },
  'body-clamp': { on: 'form', at: FORM.press[1], seconds: 0.58, sound: 0.5, note: 'the hull closes on the button in the air and presses it' },
  'body-land': { on: 'form', at: FORM.land, seconds: 0.99, sound: 0.9, note: 'he lands on the slab on his belly' },
  'leg-stomp': { on: 'form', at: [FORM.legs[0] + FORM.legTime, FORM.legs[1] + FORM.legTime, FORM.legs[2] + FORM.legTime, FORM.legs[3] + FORM.legTime], seconds: [1.8, 2.03, 2.26, 2.49], sound: 0.35, note: 'each foot comes down' },
  'turret-rise': { on: 'turret', at: TURRET.hatch[0], seconds: 0.03, sound: 1.25, note: 'the hatch slides, then the cannon climbs; the sound runs to the lock' },
  'turret-lock': { on: 'turret', at: TURRET.lock, seconds: 1.28, sound: 0.7, note: 'the cannon comes down on its rest; the kick is on this frame' },
  'bullet-fire': { on: 'guns[i].firedAt', at: 0, seconds: 0, sound: 0.3, note: 'flash for 0.07 s, kick for 0.25 s' },
  'shield-glance': { on: 'shield.glancedAt', at: 0, seconds: 0, sound: 0.35, note: 'the glass flashes for 0.3 s' },
  'boss-heal': { on: 'healedAt', at: 0, seconds: 0, sound: 0.6, note: 'a pulse over the hull for 0.6 s' },
  'big-tell': { on: 'big.tell', at: 0, seconds: 0, sound: 1.6, note: 'a rising charge as long as the tell; it must end on big-fire' },
  'big-fire': { on: 'big.firedAt', at: 0, seconds: 0, sound: 1.5, note: 'the beam stands 0.3 s, the recoil 0.45 s, heat and smoke 1.2 s' },
  'turret-off': { on: 'beaten', at: 0, seconds: 0, sound: 1.2, note: 'the cannon is blown off over the first 0.35 of beaten (0.7 s), the shield bursts at 0.05' }
} as const
