# polish-ball: the ball after a visitor's stroke, and the stroke

Branch `agent/polish-ball`. Times are UTC, 2026-11-26. The notes are filled in as the work goes; the last report is at the end.

## The script

- `node pipeline/phase5/polish-ball-live.mjs [--press hint|never|always] [--rows] [--facts] [--nth N] [--before 20] [--after 150]`: the live stage of step 3 in Node with the page's director; `hint` presses as the pack's visitor does (the page's hint, 11 visitor steps late). Prints the run's facts and, with `--rows`, every step of the physics round the nth press.

## Decisions

- The switch is `Machine.live` in `src/table/physics.ts`, set by `direct()` each step from the page's mode (`mc.live = live`), false after every build of the machine. It is saved with the machine only when it is on, so the film's saved state is the same text as before.
- Live stroke: 8 steps up (`LIVE.up`), 12 steps down (`LIVE.down`), one bounce of a tenth of the stroke (5 degrees) over 10 steps at rest (`LIVE.bounce`, `LIVE.back`). The bounce is a parabola, no sine, so it is the same on every machine.
- Live speed limit: 36 balls/s (`LIVE.max`). A limit of 30 was not what held a visitor's shot back (30 crosses the tier: 21.7 is enough from the bat to the top wall); the set shot at the end of the stroke was. With an 8 step stroke the bat's face moves 26 balls/s for every ball of length from the pivot, so without a limit a ball at the tip leaves at 99 balls/s (MEASURED). 36 is 58 px a frame at 1920 wide, under the ball's own width of 96 px, so two consecutive frames of the ball still overlap.
- Live: `strike()` does nothing. No set shot replaces a visitor's stroke.
- Live: the pull under the low bumper that waits for the film's key (`PULL.key`) is off. It is a pull at no device.
- Live: a bumper or a slingshot leans its throw to the director's place only within 45 degrees of the contact's normal (`SHOT.cone` 0.7, the film's `SHOT.lean` 0.3 is 72 degrees). At 20 degrees (0.94) the lobby's slingshot no longer finds the revolving door and one more tow is needed (MEASURED, three runs), so 0.7.
- Tried and taken out again: a strong magnet at the device (60 balls/s2, any reach or 3.5 balls) for 0.4 or 0.9 s before the deadline's tow. In the three measured runs it delivered 1 of 11 deadlines and the tow came anyway, later. So the deadline's tow stays as it is on main. This is open and is said to the Builder.
- The bat's drawing (`src/table/real/play/flippers.ts`) is not changed: it reads the sim's angle of the same step (`flipper.<id>` v[0]), with no easing (STATED from the code; fix-flipper measured the drawn bat within 0.8 degrees of the sim's step).

## Second commit: what the first pack showed, and the deadlines

The pack of f7701533 (round 22, R4, sheets set-A-09 and set-A-10): the stroke meets the ball and the ball is two ball widths up one frame later. Then, for 18 frames (1:52.45 to 1:53.02), the ball drifts down and left over the blue and the green lamp at about 20 px a frame. In the sim (MEASURED): the right slingshot replaced 31.9 balls/s by a set throw of 12.0, an arc to the film's waiting place by the low bumper.

- Live: a slingshot that throws to the director's place throws at 0.9 of what came in, never under its own 12 (`physics.ts`, the sling's line). The film keeps 12.
- Live: the film's waiting-place aims in the office (`NEST.sling`, `NEST.under`, `NEST.over`) are off. Bumpers and slingshots throw along their normals there.
- Live: the ball save at a shut gate lobs the ball to the director's device (`Machine.mark`, set by `direct()`): the inbox at 20.5 balls/s on the high arc, the firehouse at 21.2 on the high arc, the ramp at 20 on the low arc (`SHOT.inbox`, `SHOT.fire`, `SHOT.flap`: speed, arc, how long before the deadline the last lob may start, how long after the deadline a lob in flight is waited for). The hole is one place, so each lob is one path; the speeds are the middle of what delivered in the sim (inbox 20.4 to 20.6, firehouse 21.05 to 21.35 and 21.8 to 22, ramp 19.4 to 20.6). The low arc to a scoop meets the tip of a bat at rest (MEASURED, 27 degrees off upright), so the scoops get the high one.
- Live: from 0.9 s before the last lob may start (`SHOT.sink`), the gate's pull (`PULL.gate`, 40 balls/s2, the one main uses when a gate is open) brings the ball to the gate, where the save lobs it. It is off while a lob flies and within 2.2 balls of the device.
- Live: the tow at the deadline waits for a lob in flight (`SHOT.air` 1.4 s at most, and never past the deadline plus the device's own limit: inbox 0.85 s, firehouse 1.2 s, ramp 0.5 s), so the beat's device still has the ball before its kick.
- MEASURED over 12 visits (`--press never|hint|always`, `--phase 0..3`): tows to a device 0,0,0,0 never pressed; 3,1,1,1 with the hint's visitor; 1,1,2,2 pressed all the time. On main: 3 a visit never pressed and with the hint's visitor, 2 pressed all the time.

## Open

- A visitor who keeps the ball in play past a deadline still gets the tow: 16 balls/s, constant, straight to the device, through what is in the way, 0.1 to 0.7 s. In one measured visit it began 0.13 s after the visitor's own stroke (hint, phase 0, 19.10 s).
- The gate's pull has no limit of reach. It is an acceleration toward the gate, not a constant speed, but it is not at a device's mouth.
- The slow roll down a bat at rest (4.5 to 5.1 balls/s, gaining 6.5 balls/s2) is what the sim does with a ball that lands softly on the bat; nothing holds it. Not changed.
- The hint's first press can come while the ball is in the gate's mouth (hint, phase 0, step 4165): the page's hint is not in my files.
