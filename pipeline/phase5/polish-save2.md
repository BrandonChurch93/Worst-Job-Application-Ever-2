# polish-save2: round 25's faults of motion at the live save on the gate

Branch `agent/polish-save2` from `308e96a1`. Times are UTC, 2026-11-27 (the machine's `date -u`). MEASURED means I ran the command given; STATED means I read it; UNKNOWN is said as such. Live play only: in film mode nothing here is reached.

## The scripts

- `node pipeline/phase5/polish-save2-measure.mjs --visitor pack --seed 3 --nth 2 [--before N] [--after N] [--json file]`: a live visit stepped without a browser. For the chosen save it prints one line per frame of 60 from before the take to after the kick: the ball's place and step on the screen, the wire's turn, the top wire's and the pin's place, the screen under the wire's lowest point, the gap of shell and wire, the arrow's heading, the view's scroll and its step. Its last lines hold the sums.
- `node pipeline/phase5/polish-save2-kick.mjs`: the steps from the take to the kick and the ball's state on the kick's step, for five saves, and a hash of them.
- The pictures are made with the gate agent's `pipeline/phase5/polish-gate-shots.mjs` (`--keep <dir>`) and cut with `pipeline/phase5/polish-save-sheet.mjs`.

## What was there (measured first, on `308e96a1`)

MEASURED, `node pipeline/phase5/polish-save2-measure.mjs --visitor pack --seed 3 --nth 2` (the critic's case: take in the frame at page 23.65 s, kick at 23.90 s):

- The landing: the ball's steps on the table per frame from the take were 49.9, 15.2, -14.2, -10.0, -1.1, then under 3.5 px. `SAVE.land` was 8 steps (2 frames): the ball was at its deepest on the first frame and was drawn back from there. It read as a stop and a slow lift, not as a landing.
- The arrow inside turned 146.5 degrees while the ball lay still on the wire (seed 1, save 1: 143.2 degrees).
- The load: the wire went 3.3 px further down after the ball lay on it, and stood 8 frames within 1 px of the deepest. No wind-up to see.
- The wire after the kick: thrown pose 4 frames, then swings about the rest place of -22.4, +13.0, -6.8, +2.1, -2.0 px, each 4.2 frames long, the last of it at 0.56 s (34 frames).
- The view: its step per frame was 0.5, 1.6, 3.0, 4.5, 5.7, 6.6 (take), 6.9, 6.5, 5.8, 5.2, 4.6, 4.1, 3.7, 3.3, 3.0, 2.6, 2.4, 2.1, 1.9, 1.7, 1.5 (kick), 1.3 and on down to 0.1 at 38 frames after the take: a tail of 44 frames, through the hold, the throw and the ring. I found no slide of 35 px and no reverse of 7 px in this case; the Builder took that finding. In a keen visitor's rally (keen, seed 1, 17 to 22 s) the view did go down 35 px, back 19 px and down again, because the room was dropped at once whenever the ball left the gate's reach.
- Screen under the wire's lowest point: 19.3 px at the least in the hold.

## What was done

1. The landing (`src/table/physics.ts`, `SAVE`, `lie()`). The ball falls to the wire and is clamped on it (no step through it). On the touch the wire lets it keep at most `SAVE.hit` 12 balls/s of its speed down the table; from there the ball swings as a damped spring (`swing` 67.3 1/s, `damp` 24.1 1/s) about a place `sag` 0.1 balls under the wire's own place, for `land` 24 steps (6 frames). The wire is drawn on the ball's shell on every step as before (`wireOn`), so the wire gives by the ball's own travel.
2. The load. `wind` is 26 steps, of which the last `still` 14 stand dead still: 12 steps (3 frames) of travel by a cubic from the ball's place and speed at the end of the landing to `ty + back` (0.27, unchanged), then the stand, then `drive` 6 steps (unchanged) and the kick. Before: land 8, wind 42, still 26. The sum is 56 steps as before.
3. The arrow (`src/pages/step3/index.ts`). On `gate-take` the heading the arrow has is kept in `s.lay`, the old sway is ended (`s.sway = -9`, `io.cursor.wobble(0, 1, 0)`), and in `face()` the heading is held by `io.cursor.strike(s.lay[0], dt)` while `machine().taken >= 0`. `src/cursor/body.ts` is untouched. On the kick's step `taken` is -1 again and the `ball-save` handler sets the throw's own strike as before.
4. The wire after the kick (`src/table/draw.ts`, `WIRE`). `decay` 8 to 14, `period` 0.14 to 0.1, `seconds` 0.56 to 14 / 60. `snap` and `hold` are unchanged.
5. The view (`src/pages/step3/index.ts`, `ROOM`). The room's 90 px is a travel of its own, added to the follow: speed gained by 9000 px/s a second up to 720 px/s, braked the same way to a stand on its place. `s.room` holds `[offset px, speed px/s, gone]`, live only. When the ball is struck away before the gate has it, the view stops and stands while the ball is in play in the lower part of the tier (`keep` 5.6 balls or more down it), and goes back by the same travel once the ball is above that or off the tier's floor.

## Measured, after

MEASURED, `node pipeline/phase5/polish-save2-measure.mjs --visitor pack --seed 3 --nth 2 --before 9 --after 40` (take 23.65 s, kick 23.90 s, the same frames as before):

| frame from the take | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| top wire below its pin, px | 0.0 | 12.7 | 16.9 | 13.3 | 9.2 | 8.4 | 9.6 | 12.9 | 19.3 | 23.3 | 23.4 | 23.4 | 23.4 | 23.0 | 8.7 | -26.6 (kick) |
| wire's turn, rad | 0.14 | 0.58 | 0.73 | 0.60 | 0.46 | 0.44 | 0.48 | 0.59 | 0.84 | 1.02 | 1.03 | 1.03 | 1.03 | 1.01 | 0.45 | -0.90 |
| the view's step, px | 12.0 | 12.0 | 10.8 | 8.3 | 5.8 | 3.3 | 0.8 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |

- (a) The landing: the wire gives 16.9 px under the ball from the touch on the frames drawn (the first swing), the ball comes up 9.6 px and settles; the ball's steps on the table per frame are 56.5, 13.0, 4.8, -4.2, -4.5, -0.9, 1.2: no frame at which it stops dead from speed. The gap of shell and wire is 0.00 px from the landing to the kick. A slow ball (`--visitor pack --seed 1 --nth 1`): steps 8.9, 8.4, 7.5, 0.4, -2.8, -1.8, 0.1; it comes up 4.6 px. The landing is over in 6 frames.
- (b) The arrow turns 0.0 degrees from the landing to the kick (before 146.5; seed 1: 143.2 before, 0.0 after). The ball does not roll on the wire, so no turn is owed.
- (c) The wind-up: after the swing the wire with the ball is drawn down 18.4 px (table steps 3.6, 7.7, 5.6, 0.3 over frames 7 to 10; 12 steps of travel), stands 3 frames to the digit (frames 10 to 12, 14 steps), the drive starts in frame 13 and the kick is on frame 15. Slow ball, seed 1: 2.0, 7.3, 7.0, 1.2, then 0, 0, 0, -11.7, kick.
- (d) The wire after the kick, frames from the kick: -0.90 rad for 4 frames, then -0.49, 0.13, 0.33, 0.17, -0.04, -0.10, -0.04, 0.01, 0.01, 0.00. About the rest place the lobes are -22.2, +9.6, -3.4 px; each is under half of the one before; under 1 px from 11 frames after the kick, to the digit at rest from 14 frames. Before: -22.4, +13.0, -6.8, +2.1, -2.0, the last at 34 frames.
- (e) The view: the table above. It eases in over 5 frames before the take (0.3, 2.5, 5.0, 7.5, 10.0, 11.9), runs at 12 px a frame, eases out over 5 frames and stands: no overshoot, no step back, 0.0 px on every frame from 7 frames after the take through the load, the throw and the ring. It goes back from 36 frames after the kick by the same travel. Step to step the speed changes by 0.15 px at most.
- Screen under the wire's lowest point: seed 3 at least 59.3 px in the hold (47.9 px on the frame before the take; 19.3 px before the change). Seed 1: at least 77.4 px.
- The hold's length and the kick: MEASURED, `node pipeline/phase5/polish-save2-kick.mjs` on `308e96a1` and after: the same five kick steps and states, sha256 `f70e33781433fead1e97b4a290ffae1ef603ea9efb78b76effd17dd8757a92e7` both times. The play after a save is the play it was.

## Rule 6 and the Builder's rulings (13:36)

1. `SAVE.land`, `SAVE.wind`, `SAVE.still` were set by round 24's gate agent so that the load reads. The Builder ruled them not contested, with the duty to prove round 24's issue stays answered. Held by `tests/polish-save2.test.ts`: the depth 0.27 and the drive 6; the stand dead still (the same turn of the wire to the last digit on every still step); the kick on the same step with the same state (the hash above); the gap of shell and wire 0.00 px from landing to kick.
2. The stand: the Builder asked for 14 steps if the landing reads in 24. Tried first: land 30, wind 20, still 8 (MEASURED by the measure script: up 9.6 px, then steps of 1.2, 1.1, 0.5 near still, load 5.7, 7.5, 2.5, stand 2 frames). Chosen: land 24, wind 26, still 14. Why, by the numbers: the six further steps of landing in the 30 split were a tail of about 1 px a frame that reads as neither swing nor stand, and the stand of 2 frames was the least allowed; the 24 split ends the landing at its second small swing and gives the stand 3.5 frames. Seen in pictures: the 24 split only. The 30 split was not shot: UNKNOWN in a picture.
3. `WIRE.hold` (4 frames at the thrown pose): MEASURED from `git log -p -S"hold: 1 / 15" -- src/table/draw.ts`: set in `576e8669` ("WIP: the gate takes, holds and kicks the ball at a live save"), the first build of the gate's save, which answered round 23's R4-1 ("Show what ejects the ball from the drain ... so the ejector visibly owns the save"); its comment says the wire "stands there for `hold` seconds as a kicker's coil does". It was set so the thrown wire is seen standing, so by the ruling it stays at 4 frames and only the ring after it changed.
4. The lobes and the edge on pose: the first lobe back (0.33 rad, 1 to 2 frames) still crosses the pose at which the wire is seen edge on (about 0.16 rad of ring on the screen). The later lobes stay on the near side of it: the next lobe toward that side is 0.01 rad. Held by test.
5. The view: approved by the Builder as described. The room stays 90 px.
6. The arrow: approved; `body.ts` untouched; the release on the kick's step is held by test.

## A number changed in another owner's test

`tests/polish-gate.test.ts`: the stand's least length, `frames at the deepest`, from at least 5 frames to at least 3.5 (and the test's title from "five frames of 60 or more" to "three and a half frames of 60 or more"). Nothing else in it; its aims stand.

## Decisions

1. The landing takes its time from the stand, not from the hold's length: the sum stays 56 steps, so no visitor's play changes and the slide agent's table needs no second run by the brief's own rule (the lengths' sum and the kick are equal).
2. The view stands while a struck ball is in the lower part of the tier. This replaces round 24's return at once, which pumped the view in a rally at the bats. It is the same room, kept a little longer; the ball is never out of the picture while it stands (keen, seed 1: the ball's middle is never above y 253 on the screen while the view is lowered).
3. At the take the arrow's old sway is ended. Side effect, MEASURED: where an old sway was still alive at the kick, the throw's strike read -59.8 to -66.4 degrees over four frames before and reads -63.0 on each now; where none was alive (seed 1) it is unchanged at -50.5.

## Open items

- (d) asks for rest by about 9 frames after the kick. The ring is under 1 px from 11 frames and at rest to the digit from 14, because the 4 frames at the thrown pose are kept (ruling 3). The critic's own mark ("rest flat by about 1:53.80" for a kick at 1:53.57) is 14 frames.
- The first lobe back still crosses the edge on pose (1 to 2 thin frames).
- (e) asks for an ease of 4 to 6 frames: the ease in is 5 frames, the ease out 5; in the fastest case the last step (0.8 px) falls in the sixth frame after the take.
- The 30/8 split was not seen in a picture.

## The pictures (not in the repo; sent with the reports)

Made with `node pipeline/phase5/polish-gate-shots.mjs --bot keen --seed 1 --quality high|low --at 21.9 --count 44 --keep <dir>` on `308e96a1` (a worktree) and on this branch, one job at a time; cut with `polish-save-sheet.mjs` and stacked with `polish-save2-pair.mjs`. The case: keen, seed 1, save 1; take in the frame at page 22.017 s, kick at 22.267 s; a fast ball (47 px a frame at the take). In this case the view was lowered already by the rally before it.

What I saw at real size, frames in a row:

- `save-high.png` (18 frames from one before the take to one after the kick, crop 130 by 230 px, unscaled, before above and after below). Before: the ball is at its lowest on the frame after the take, is lifted on the next and then lies in one place on the screen while the whole picture slides up under it (the wire's line climbs about 56 px through the hold); from 22.183 s the arrow turns from tip down through tip left to tip up left before the kick. After: touch at 22.017, down at 22.033, deepest at 22.050, up over 22.067 to 22.117, down again over 22.133 to 22.167 (the load), still from 22.167 to 22.233, the drive at 22.250, thrown at 22.267. The wire lies on the shell on every frame. The arrow keeps its tip down from 22.033 to 22.250; its shading changes over the first frames (the flinch at the take, another owner's, tilts it), its heading does not. The wire's line and the hardware under it stand at one height on every frame; under the wire the dark hardware, the blue band and a lamp are on the screen.
- `wire-high.png` (15 frames from the kick, crop 80 by 52 px, 3 times, before above and after below). Before: thrown pose 4 frames, falls over 2, a double line under the rest place at 22.367 to 22.400, one thin line at 22.417, a raised rail again at 22.433 to 22.483, thin at 22.500: thin line and raised rail in turn. After: thrown pose 4 frames, falls at 22.333, one thin line at 22.350 (edge on), a double line under the rest place at 22.367, one thin line at 22.383 (edge on, on the way back), a little raised at 22.400 and 22.417, and from 22.433 the same rest pose on every frame. So: one pass down, one back, at rest by 10 to 11 frames after the kick; the edge on pose is seen on two frames, not again.

MEASURED for this case, `node pipeline/phase5/polish-save2-measure.mjs --visitor keen --seed 1 --nth 1 --before 4 --after 20`, the view's step per frame from 4 frames before the take: before 1.1, 2.5, 4.0, 5.3, 6.2 (take), 6.6, 6.2, 5.6, 5.0, 4.4, 4.0, 3.5, 3.2, 2.8, 2.5, 2.3, 2.0, 1.8, 1.6, 1.4 (kick), 1.3, 1.1, 1.0, 0.9, 0.8 and on; after 0.0 on every frame (the view stood lowered from 17.1 s). The arrow: before 68.5 degrees turned on the wire, after 0.0. Screen under the wire's lowest point in the hold: before at least 26.0 px, after at least 77.4 px.
- `save-low.png`, `wire-low.png`: the same two sheets at `--quality low`. The motion is the same frame for frame as at `high`: the same seven steps of landing, load, stand and throw, the arrow's heading held, the view standing; the wire thrown 4 frames, thin at 22.350 and 22.383, under the rest place at 22.367, at rest from 22.433.

## Checks

On the branch with `origin/main` at `8a39fcaa` merged in (`1aa6a8e3` and the commits after it), one job at a time, 14:12 to 14:25:

- MEASURED, `npm run still -- --key table-wide --format hd --tier draft --force` (and `last-save`, `tier-street`), then `cmp` with the three stills kept from `308e96a1` before any change: all three byte equal.
- MEASURED, `npm run determinism`: pass, 12 pictures at hd, tier draft, identical across two fresh loads and two orders.
- MEASURED, `npm run bots`: all clear; keen reached every one of the 37 gags on every seed.
- MEASURED, `npm test`: 168 files passed, 11 skipped; 2108 tests passed, 14 skipped; none failed. (On `308e96a1` before any change: 166 files and 2094 tests passed.)
- MEASURED, `npx tsc --noEmit -p .`: clean, no line of output.
- MEASURED, `npx vitest run tests/polish-save2.test.ts tests/polish-gate.test.ts`: 18 of 18 passed.
