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
