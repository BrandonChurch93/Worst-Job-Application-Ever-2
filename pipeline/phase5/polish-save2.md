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
- (c) The wind-up: after the swing the wire with the ball is drawn down 15.0 px on the screen (the top wire from 8.4 to 23.4 px below its pin; the ball's own travel on the table in it is 18.4 px, steps 3.6, 7.7, 5.6, 0.3 over frames 7 to 10; 12 steps of travel), stands 3 frames to the digit (frames 10 to 12, 14 steps), the drive starts in frame 13 and the kick is on frame 15. Slow ball, seed 1: 2.0, 7.3, 7.0, 1.2, then 0, 0, 0, -11.7, kick.
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

## Owed to the Builder's ruling on the first pass (14:33)

The view in a rally, no change made. MEASURED, `node pipeline/phase5/polish-save2-measure.mjs --visitor keen --seed 1 --nth 1 --before 430 --after 200` (page 14.85 to 25.60 s; the tier's own place of the view is scroll 2544.0, reached at 15.65 s):

| page s | the view |
|---|---|
| 15.65 to 17.12 | stands at the tier's place |
| 17.12 to 17.25 | goes down 30.6 px (the ball comes to the gate's reach and is struck away) |
| 17.25 to 19.25 | stands 30.6 px lowered, 2.00 s, the ball in play in the lower part of the tier |
| 19.25 to 19.77 | goes down to 90 px in four pieces (to 40.6, 67.0, 89.8, 90.0 px), with stands of 0.06, 0.03 and 0.08 s between them; never back |
| 19.77 to 22.87 | stands 90 px lowered: 2.25 s in play before the take at 22.02 s, then the save (kick at 22.27 s) and 0.6 s after it |
| 22.87 to 23.08 | goes back to the tier's place, 0.21 s |
| 23.08 to 25.60 | stands at the tier's place |

So the view is lowered for 4.90 s before the take with no save yet (17.12 to 22.02 s), of which it stands 4.25 s. While it is lowered and no save has begun, the ball's middle is never higher than y 473.9 of 1080 on the screen (at 20.37 s). Named as it is: between 19.25 and 19.77 s the way down comes in pieces, because the ball goes in and out of the gate's reach at the bats; no piece goes back.

The arrow's step on the kick's step (the strike's own law, kept by the Builder's ruling; MEASURED with the measure script, the heading on the last frame on the wire and on the kick's frame): pack seed 3 save 2: 120.7 to -63.0 degrees, 176.3 degrees by the shorter way; pack seed 1 save 1: -170.8 to -50.5, 120.3 degrees; keen seed 1 save 1: -151.2 to -50.5, 100.7 degrees.

`view-rally.png` (two whole frames of the live site at half size, keen seed 1, made with `polish-gate-shots.mjs --at 19.0 --count 1` and `--at 20.3667 --count 1`). What I saw: at 19.000 s (30.6 px lowered) the whole tier is on the screen, its upper lamps at the top, the gate's wire at the lower edge, the ball on the blue bumper. At 20.367 s (90 px lowered) the wire, the hole under it and the lamps of the tier below are on the screen; the tier's upper edge and its row of lamps are off the top; the ball is beside the lowest cup, in the upper half of the picture.

The lines changed in another owner's test, all in `tests/polish-gate.test.ts`, in the one test of the load (`describe` "the save at the gate, read at real size"):

- line 56, the test's title: "... and holds it there, dead still, for five frames of 60 or more" to "... for three and a half frames of 60 or more".
- line 65: `expect(held.length / EACH, 'frames at the deepest').toBeGreaterThanOrEqual(5)` to `.toBeGreaterThanOrEqual(3.5)`.

Why: `SAVE.still` went from 26 steps (6.5 frames) to 14 (3.5 frames), the landing's swings taking the steps (the Builder's ruling 2). No other line of that file and no other owner's test is changed.

## Checks on the last merged trees

- With `origin/main` at `4ef92716` (merge 51) merged in (`d22885d5`), 14:26 to 14:37, one job at a time: the three draft stills `cmp` byte equal to those of `308e96a1`; `npm run determinism` pass, 12 pictures; `npm run bots` all clear, keen 37 of 37 gags; `npm test` 169 files passed, 12 skipped, 2116 tests passed, 15 skipped, none failed; `npx tsc --noEmit -p .` clean.
- With `origin/main` at `e2364b9c` (status 153) merged in (`c05f44ef`), 14:40 to 14:52, the same chain: the three stills byte equal; determinism pass, 12 pictures; bots all clear, keen 37 of 37; `npm test` 169 files passed, 12 skipped, 2116 tests passed, 15 skipped, none failed; `tsc` clean.
- With `origin/main` at `5013511c` (status 154) merged in (`08fdc427`), 14:52 to 15:04, the same jobs one at a time: `npm test` 169 files passed, 12 skipped, 2116 tests passed, 15 skipped, none failed; the three stills byte equal; bots all clear, keen 37 of 37; determinism pass, 12 pictures; `tsc` clean, last of all.

# polish-view: the view's way down in a rally is one move

Branch `agent/polish-view` from `94e68b25` (the Builder's second job, 15:10). Nothing more went to `agent/polish-save2`.

## Shown first, before any change (`94e68b25`)

Keen seed 1, 19.200 to 19.850 s, 40 frames in a row, one fixed window of the screen (x 650, y 530, 300 by 200 px, real size) round the pizza bumper, which stands on the floor: `view-before-1.png`, `view-before-2.png` (20 tiles each), made with `node pipeline/phase5/polish-gate-shots.mjs --bot keen --seed 1 --quality high --at 19.2 --count 40 --keep <dir>` and `polish-save-sheet.mjs --crop 650,530,300,200 --cols 4`.

MEASURED, `node pipeline/phase5/polish-save2-measure.mjs --visitor keen --seed 1 --nth 1 --before 430 --after 200`, the lowering in px (scroll less the tier's place 2544.0) for each of the 40 frames from 19.200 s:

30.6, 30.6, 30.6, 31.9, 35.6, 39.4, 40.6, 40.6, 40.6, 40.6, 40.6, 40.7, 42.6, 47.0, 53.8, 60.7, 65.1, 67.0, 67.0, 67.0, 67.0, 67.7, 70.9, 76.5, 83.2, 87.7, 89.7, 89.8, 89.8, 89.8, 89.8, 89.8, 89.8, 90.0, 90.0, 90.0, 90.0, 90.0, 90.0, 90.0.

What I saw in the tiles, frames in a row: the bumper stands in tiles 1 to 3, climbs over 19.250 to 19.300, stands 19.317 to 19.383, climbs over 19.400 to 19.483, stands 19.500 to 19.533, climbs over 19.550 to 19.633, stands from 19.650. It reads as a stutter: three starts in under half a second, each stand 2 to 5 frames.

## The mend

`src/pages/step3/index.ts`, the view's room only: a way down once begun goes to its end (90 px) in that one eased move. The brake and stand part way (the `wait` of the first job) is taken out: the goal is 90 px unless the view is on its way back. The view stands lowered while the struck ball is in the lower part of the tier, and goes back as before once the ball is above that or off the floor.

Decision: the first lowering no longer stops at 30.6 px. At the step the ball is struck away nothing tells the stop at 30.6 px (which then stood 2.00 s) from the stops at 40.6 and 67.0 px (which stood 0.06 and 0.03 s); a rule that does not look ahead cannot keep the one and drop the others. So the move is finished every time.

## Measured, after

Same command. One move from 17.117 to 17.317 s, the lowering per frame: 0.3, 2.8, 7.8, 15.3, 25.3, 37.2, 49.2, 61.2, 71.9, 80.2, 85.9, 89.2, 90.0 (steps 0.3, 2.5, 5.0, 7.5, 10.0, 11.9, 12.0, 12.0, 10.8, 8.3, 5.8, 3.3, 0.8); then 90.0 on every frame to 22.87 s (take 22.02 s and kick 22.27 s as before, so the play is the play it was); back from 22.87 to 23.08 s. From 19.200 to 19.850 s: 90.0 on all 40 frames. Before, the same first lowering was 0.3, 2.8, 7.8, 15.3, 22.8, 27.8, 30.3, 30.6. The view is now lowered 90 px for 4.70 s before the take (17.32 to 22.02 s); before it was 30.6 px for 2.0 s and then 90 px for 2.25 s. The ball's middle is never higher than y 473.9 of 1080 in that time, as before.

The three cases, the view's place (scroll) at the take, at the kick and 0.6 s after the kick, MEASURED with the measure script (`--after 60`) on `94e68b25` and after:

| case | take | kick | 0.6 s after | after the change |
|---|---|---|---|---|
| pack seed 3 save 2 | 2593.2 | 2634.0 | 3227.4 | the same three |
| pack seed 1 save 1 | 2634.0 | 2634.0 | 2633.3 | the same three |
| keen seed 1 save 1 | 2634.0 | 2634.0 | 2632.8 | the same three |

The largest step of the view in one frame is 12.0 px before and after. In the fastest case (pack seed 3) the steps round the take are equal frame for frame (0.3, 2.5, 5.0, 7.5, 10.0, 11.9, 12.0 at the take, 12.0, 10.8, 8.3, 5.8, 3.3, 0.8, 0), so the ease out ends on the same frame.

Test: `tests/polish-save2.test.ts`, "goes down to its place under the gate in one eased move, in a rally at the bats too": the whole 90 px inside 0.3 s with no stand inside it, 14 frames at most, no frame faster than 12.01 px, no step back from there to the take. MEASURED: it fails on `94e68b25` (29.3 px inside 0.3 s) and passes now. No line of another owner's test is changed in this job.

## Pictures, after

`view-pair-1.png`, `view-pair-2.png`: keen seed 1, 19.200 to 19.850 s, all 40 frames of 60, one fixed window (x 725, y 530, 120 by 200 px, the pizza bumper), before above and after below, stacked with `polish-save2-pair.mjs`. What I saw at real size: above, the bumper climbs in pieces (stands tiles 1 to 3, climbs 4 to 6, stands 7 to 12, climbs 13 to 17, stands 18 to 21, climbs 22 to 27, stands from 28); below, the bumper is in one place in all 40 tiles, the place the before row ends in.

`view-after-down.png`: the new way down, 17.083 to 17.350 s, 17 frames in a row, window 650,530 300 by 200. What I saw: the bumper stands in tiles 1 and 2, starts gently at tile 3, climbs fastest round tiles 6 to 9, slows over 10 to 14, stands from tile 15. One move, no stand inside it.

## Owed by the ruling of 15:23

1. The ball while the view is lowered, keen seed 1, MEASURED (the measure command above, the frames with scroll above 2544.05, 17.12 to 23.07 s, 357 frames): the ball's top is never higher on the screen than y 240.1 of 1080, at 22.87 s, after the kick, on the first frame of the way back. Before the take the highest top is y 425.2 at 20.37 s. No frame with the top within 40 px of the top edge. Nothing to mend.
2. The way back, MEASURED, steps per frame 22.87 to 23.07 s: 1.3, 3.8, 6.3, 8.8, 11.2, 12.0, 12.0, 11.7, 9.5, 7.0, 4.5, 2.0, 0.1, then the view stands at 2544.0. One eased move. A way back once begun is latched (the third number of `s.room`): it goes to its end even if the ball drops into the lower part of the tier again. The one thing that ends it early is the ball at the gate again; then the view turns down.
3. The ways down and back over the visitors, MEASURED, `node pipeline/phase5/polish-save2-ways.mjs` (never, pack, keen, clumsy, random, seeds 1 and 2, every step of each visit). The lines are in the table below.
4. The film, MEASURED, `node pipeline/phase5/polish-save2-ways.mjs --film` on `94e68b25` and on this branch: 42 s of the pinball piece, 10080 steps, 0 of them with a room under a gate, and the sha256 of the page's whole state and scroll on every step is df8e74b073a9806643188d59a800c1ff48bffe639211b0c6a9be801fb6004676 on both. The three draft stills are byte equal to the kept ones by `cmp`. No film frame changes: the change is in step 3's live view only, and the room is made only in live play.
5. Rule 6: the brake and stand part way was of polish-save2's own making in round 25. MEASURED: `git log -S"const wait = !low" -- src/pages/step3/index.ts` gives `6e7a883f` (polish-save2, where it came in) and `6f6f64b9` (polish-view, where it went out), no other. Round 24's room (`308e96a1`) went there and back on one 0.13 s ease with no brake and no stand part way; it turned back at once when the ball left the gate, which the rulings of round 25 forbid before a save.

| visit | ways down | starts inside one, before | after | stands part way, before | after | turns back part way, after | ways back, after | of them stood or turned part way | the room and the view on every step, before against after |
|---|---|---|---|---|---|---|---|---|---|
| never seed 1 | 2 | 1 | 1 | 0 | 0 | 0 | 2 | 0 | equal (ae9928ddd82e, ae9928ddd82e) |
| never seed 2 | 2 | 1 | 1 | 0 | 0 | 0 | 2 | 0 | equal (ae9928ddd82e, ae9928ddd82e) |
| pack seed 1 | 1 | 1 | 1 | 0 | 0 | 0 | 1 | 0 | equal (f1b49514b426, f1b49514b426) |
| pack seed 2 | 2 | 1 | 1 | 0 | 0 | 0 | 2 | 0 | equal (9066522a2d4b, 9066522a2d4b) |
| keen seed 1 | 1 | 5 | 1 | 4 | 0 | 0 | 1 | 0 | changed (b5b2555a7dd4, 30ab68115358) |
| keen seed 2 | 1 | 5 | 1 | 4 | 0 | 0 | 1 | 0 | changed (b5b2555a7dd4, 30ab68115358) |
| clumsy seed 1 | 1 | 1 | 1 | 0 | 0 | 0 | 1 | 0 | equal (fc7d74f815f8, fc7d74f815f8) |
| clumsy seed 2 | 1 | 1 | 1 | 0 | 0 | 0 | 1 | 0 | equal (fc7d74f815f8, fc7d74f815f8) |
| random seed 1 | 1 | 1 | 1 | 0 | 0 | 0 | 1 | 0 | equal (2e6c5bbc3b39, 2e6c5bbc3b39) |
| random seed 2 | 1 | 1 | 1 | 0 | 0 | 0 | 1 | 0 | equal (dc5bd749cfc9, dc5bd749cfc9) |

All: 13 ways down, each one move after (largest count of starts 1, 0 stands, 0 turns back part way); 13 ways back, 0 of them stood or turned part way. Before, keen seeds 1 and 2 each had 5 starts and 4 stands inside the one way down (at 30.6, 40.6, 67.0 and 89.8 px). The eight visits of never, pack, clumsy and random have the same room and the same view on every step before and after: in these ten visits the change shows in keen's rally at the bats only.

## Checks, on the tree with `origin/main` merged in (`5419f903`), one at a time

- `npm run determinism`: pass, 12 pictures at hd, tier draft, identical across two fresh loads and two orders.
- `npm run bots`: all clear; keen reached every one of the 37 gags on every seed.
- `npm test`: 169 files passed, 12 skipped; 2117 tests passed, 15 skipped (one more than before: the new test).
- `npx tsc --noEmit -p .`: exit 0, run last.
- The three draft stills (`table-wide`, `last-save`, `tier-street`): byte equal to the kept ones by `cmp`.

`view-after-back.png`: the way back, 22.850 to 23.100 s, 16 frames in a row, window 650,530 300 by 200, shot after the checks. What I saw at real size: the bumper stands in tile 1, goes down gently from tile 2, fastest round tiles 5 to 8, slows over 9 to 13, stands from tile 14. One move, no stand inside it.

# polish-follow: the view does not go back up a tier while the ball rides an outlane rail

Branch `agent/polish-follow` from `297ca7d3` (the Builder's third job, 16:12). Main is not merged into it. Nothing more went to `agent/polish-save2` or `agent/polish-view`.

## The fault, older than round 25

Every outlane rail runs from the outlane's hold 0.85 balls down, 0.2 under the next tier's line, along to the middle and 0.4 back up to the way out, which lies 0.2 over the line. The view's goal for a ball on such a rail was the tier of the ball's place (`tierAt` of its y), so on the last three steps of the ride the goal went back to the tier above, and the view, which was on its way down, stepped back at its cap (17.5 px a step) until the ball was on the chute, where the goal is taken from the rail's name. MEASURED on `297ca7d3` and on `308e96a1` alike (pack seed 1, 24.93 s: steps 13.1, 11.7, -48.3, 15.6, 13.9 px a frame).

## The mend

`src/pages/step3/index.ts`, `target()`, two lines: for a ball on an outlane rail that has gone past the rail's first leg, the place the goal is read from is the rail's lowest point, not the ball's own place. So the goal goes down a tier when the ball dips under the line, as before and on the same step, and does not come back up while the ball is on that rail.

Why this one and not the goal from the rail's name, as a chute has it: the name would start the view's move down 0.04 s sooner on every ride, so every outlane ride would be drawn differently; this way a ride is step for step what it was until the three steps of the fault. No state is added, the view's place at rest on a tier is untouched (a ball on the floor is read as before), and the follow's pace and cap and the room under a gate are not touched.

## Proof

1. The same case, pack seed 1, save 2, frames n -125 to -101 (page 24.73 to 25.13 s), MEASURED, `node pipeline/phase5/polish-save2-measure.mjs --visitor pack --seed 1 --nth 2 --before 130 --after 20`:
   - before, scroll: 3376.9, 3413.0, 3445.2, 3473.9, 3499.7, 3522.6, 3543.1, 3561.5, 3577.9, 3592.5, 3605.6, 3617.3, 3568.9, 3584.5, 3598.4, 3610.9, 3622.0, 3631.9, 3640.8, 3648.7, 3655.8, 3662.1, 3667.8, 3672.9, 3677.4; step: 40.4, 36.1, 32.2, 28.8, 25.7, 23.0, 20.5, 18.3, 16.4, 14.6, 13.1, 11.7, -48.3, 15.6, 13.9, 12.4, 11.1, 9.9, 8.9, 7.9, 7.1, 6.3, 5.7, 5.1, 4.5.
   - after, scroll: 3376.9, 3413.0, 3445.2, 3473.9, 3499.7, 3522.6, 3543.1, 3561.5, 3577.9, 3592.5, 3605.6, 3617.3, 3627.7, 3637.0, 3645.4, 3652.8, 3659.4, 3665.4, 3670.7, 3675.4, 3679.7, 3683.5, 3686.8, 3689.9, 3692.6; step: 40.4, 36.1, 32.2, 28.8, 25.7, 23.0, 20.5, 18.3, 16.4, 14.6, 13.1, 11.7, 10.4, 9.3, 8.3, 7.4, 6.7, 5.9, 5.3, 4.7, 4.2, 3.8, 3.4, 3.0, 2.7. No step of the other sign; the first twelve frames are equal. The take is in the frame at 26.82 s before and after.
2. The sweep, MEASURED, `node pipeline/phase5/polish-save2-jerks.mjs --visitor never,pack,keen,clumsy,random --seeds 1,2,3,4` on `297ca7d3` and on this branch: 20 whole visits, 53757 frames. One-frame jerks (a step of more than 2 px against the step before and the step after): before 1 (pack seed 1, 24.933 s, steps 11.7, -48.3, 15.6, the ball leaving `outlane.office.left` for `chute.office`), after 0. The wider net of the same script (a frame of more than 2 px one way followed by one of more than 2 px the other way) finds what the mend does not touch, older causes, not mended, the first three the same before and after: on the launch rail (steps 2.3, -3.3, in 19 of the 20 visits), on the drain rail (17.3, -2.1 and 12.1, -2.0), under a tow at a gate (-3.8, 28.8; -3.8, 63.8; -5.0, 10.0), and the one below.
3. The other outlane rails, MEASURED, `node pipeline/phase5/polish-save2-lanes.mjs` (the rails' points, and a ride forced on each rail by `Machine.ride` in a visit of the visitor who never moves, so not a ride a visit came to by itself):
   - `outlane.corporate.left` and `.right`: line at 26.50, lowest point 26.70 (tier 1), end 26.30 (tier 0): the end comes back up over the line, as the office's does. Forced ride with the gate spent, frames 24 to 32: before 13.4, 11.9, 10.7, -30.1, -6.4, 13.4, 12.0, 10.7, 9.6 (two frames back); after 13.4, 11.9, 10.7, 9.5, 8.5, 7.6, 6.8, 6.1, 5.4.
   - `outlane.office.left` and `.right`: line at 37.75, lowest 37.95 (tier 2), end 37.55 (tier 1): the same. The right rail has the same points mirrored; no visit of the sweep rode it, and the visitor who never moves has no ball on the office floor with the gate spent, so its spent ride is not shown; the test holds the four rails' points.
   - `outlane.street.left` and `.right`: line at 49.00 (the apron), lowest 49.20, end 48.80: the tier read is 2 all the way, no line is crossed back, the view does not step back (0 px steps on frames 24 to 32, before and after).
4. The film, MEASURED: `node pipeline/phase5/polish-save2-ways.mjs --film` gives sha256 df8e74b073a9806643188d59a800c1ff48bffe639211b0c6a9be801fb6004676 over the 10080 steps of the pinball piece, equal to the line of `94e68b25` by `cmp`. The three draft stills are byte equal to the kept ones by `cmp`. No film frame changes (the same limit as before: state and three stills, not every drawn frame).
5. The test: `tests/polish-save2-follow.test.ts`, two tests: the four upper rails dip under the next tier's line and end above it; in the visit of pack seed 1 the view never steps back while the ball rides the office's left outlane under the line, nor in the 0.4 s after. MEASURED: the second fails on `297ca7d3` (expected -17.5 to be 0) and passes now.
6. The picture is not made. The visitor `pack` is a hand of my measure scripts, stepped without a browser; the built site plays only its own bots, and keen, clumsy and random ride no upper outlane on seeds 1 to 4 (the sweep; the skipper was not swept), so the browser cannot draw this visit. The fault and the mend are shown in numbers only; in drawn frames they are UNKNOWN.

The three cases of polish-view, MEASURED after this change with the measure script: pack seed 3 save 2: 2593.2 at the take, 2634.0 at the kick, 3227.4 0.6 s after; pack seed 1 save 1: 2634.0, 2634.0, 2633.3; keen seed 1 save 1: 2634.0, 2634.0, 2632.8. As before.

## Found, not mended: the view goes a tier down and comes back when a ball rides an upper outlane to a shut gate

MEASURED in a visit that came to it by itself, pack seed 4, on `297ca7d3` and on this branch (a throwaway script printing the scroll on every frame): the ball takes `outlane.office.left` at 22.63 s with the office's gate still shut. From 22.68 s the view goes down toward the street at its cap, 70 px a frame, from 2544.0 to 3611.6 (before) or 3622.6 (after) at 23.07 s, 1068 or 1079 px in 0.42 s; then the ball is taken at the office's gate and the view comes back up at up to 69 px a frame, to within 15 px of its place under the gate (2634.0) by 23.75 s. The cause is the same line: on an outlane rail the goal follows the ball under the line, though with the gate shut the ball is going to be saved on its own tier. The forced rides show the same on the corporate tier (997 px down by frame 27, then back). With this branch the turn comes on the take's step, three steps later than before, and the view is 11 px further down at the turn; nothing else of it changes. A mend would be to keep the goal on the ball's own tier while that tier's gate is shut; it is not done, for it was not ordered.

## Checks, on this branch as pushed (no merge of main), one at a time

- The three draft stills: byte equal to the kept ones by `cmp`.
- `npm run determinism`: pass, 12 pictures at hd, tier draft, identical across two fresh loads and two orders.
- `npm run bots`: all clear; keen reached every one of the 37 gags on every seed.
- `npm test`: 170 files passed, 12 skipped; 2119 tests passed, 15 skipped (the two new tests in one new file).
- `npx tsc --noEmit -p .`: exit 0, run last.
