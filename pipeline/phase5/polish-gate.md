# The save at the gate and the ball's first frames out of the port

Branch `agent/polish-gate`, on `agent/polish-save-wire` (merged at 305e5bf3). Owner of this note: the fix agent of round 24 for the gate. Every number below is MEASURED with the command beside it, or marked STATED or UNKNOWN.

## What was measured before any change (305e5bf3)

- `npm test`: 159 files passed, 3 skipped; 1940 tests passed, 3 skipped. MEASURED.
- The save, `node pipeline/phase5/polish-gate-measure.mjs --visitor never,pack --seed 1` (never seed 1 takes at page 20.07 s on tier 1, pack seed 1 at 17.35 s, the same numbers): ball 97.5 px wide; take to kick 16 frames of 60; the wire's top goes 23.3 px down the screen (14.5 px after the ball lies on it) and is 1 frame at its deepest; the wire's lowest point lies 0.1 to 8.7 px below the screen's edge in 5 frames of the load; 10.7 px of screen under the wire at rest; after the kick the wire swings +7.4, -2.0, +0.6 px; gap of shell and wire 0.00 px. MEASURED.
- The drop, `PORT_TRACE=<file> npx vitest run tests/polish-port.test.ts`: the ball's first step out of the port is 13.86 px per frame of 60, the pace it keeps. MEASURED.

## Decisions

1. Depth of the load: `SAVE.back` 0.27 ball widths (before 0.22). A third of the ball's width (`back` 0.4) was built and shot first: at real size the wire's lower bar lies about 10 px inside the shell and cuts its outline in every frame of the hold, and the axle crosses the ball at its middle. By the Builder's rule of 08:15 UTC that depth is out. At 0.27 the wire's top goes 27.9 px down the screen (0.29 of the ball's 97.5 px), so the asked third is not met. STATED: the Builder's word that the third was a means.
2. The save keeps its step. The ball is taken on the step it was, is kicked on the step it was (16 frames after the take) with the state it had. The load's time is found inside those 16 frames (56 steps of 240): landing 8 steps (before 24), winding 42 of which the last 26 are dead still (6.5 frames; before 10 steps with the ball still creeping), drive 6 (before 4). The drive is 6 steps and not 8 because `tests/polish-save.test.ts` (another owner's) asks that on the step before the kick the ball already goes up at 0.75 of the kick's speed or more; at depth 0.27 a drive of 8 steps gave 0.63.
3. `WAS` in `src/table/physics.ts`: the old save's place of the ball is carried as a shadow (in the lying ball's `s` and `speed`), only so that a gate that opens under a loaded ball lets it down on the step it did before. Without it one visitor (wander seed 4) got a cut 0.85 s longer.
4. The wire's recoil: `WIRE.decay` 8, `period` 0.14, `seconds` 0.56 in `src/table/draw.ts`, and the ring is faded to nothing at `seconds` so the wire ends dead on its rest.
5. The live view's lower margin: `ROOM = { px: 90, stay: 0.6 }` in `src/pages/step3/index.ts`. Only on the live page, only on tiers 0 and 1 (the street's view ends at the page's end), only while a ball in play heads down between the bats' tips, lies on the gate or was thrown less than 0.6 s ago. It moves only the target of the view; the view's own follow (rate dt/0.15) does the moving. No state is kept. Film views read no such target.
6. The drop: the ball in the port's cup keeps a shadow that runs today's pace from the step of the release. The seen ball is the shadow minus a lag: still for one frame, then steps that grow over 9 frames to 1.19 of the pace, then a cosine back to the pace; at 40 frames the lag is zero and the ball is the shadow. The page's scroll, the arrow's roll and the tube's events follow the shadow, so they are today's.
7. `FALL.over` is 40/60 s and not longer. With 110/60 s (top step 15.3 px, the largest shrink 0.02 px per frame) the arrow's turn differed from today's by up to 2.4e-6 rad from film frame 4332 until 4527, because the ball was not yet its shadow at the tube's first bend (frame 4260). That breaks "from 4332 nothing differs", so the shorter one stands. It is one number.
8. The seen release: the port's own ring opens by `LET.wide` 0.04 of its width with the dip the ring already has for its answer (`dipOf`), and its rim takes the light it already takes when it answers (`flashOf`). It begins half a frame before the frame in which the ball takes its first step. No new part, no new lamp.
9. The ball does not touch the tube's lip on its way in (STATED, from the cup's and the tube's widths in `src/table/layout.ts`; in the pictures the shell passes inside the lip). No change of speed or spin was added.
10. Two numbers were changed in `tests/polish-save.test.ts` (another owner's test), because this work changes what they hold: the block "lies still" now reads the dead still steps at the end of the load (at `rest + back`), where it read the end of the landing (at `rest`); the tail that is followed after a kick went from 120 to 160 steps, since the wire now rings 0.56 s (135 steps).

## Not mended, and open

- The asked travel of a third of the ball's width: 27.9 px of 32.5. See decision 1.
- The posts of the gate: they are static geometry of the tier (`src/table/real/frame/tier.ts`), not in my files. Their tone is as it was.
- The wire at rest against the floor: see the measures below. The gate's own tone at rest is the film's too, so it was left.
- While the ball lies in the load the view still eases down by 2 to 3 px per frame (the end of its follow).

## What is measured after

The save, `node pipeline/phase5/polish-gate-measure.mjs --visitor never,pack --seed 1` (both visitors the same numbers):

- (a) Room: 41.8 px of screen under the wire's lowest point in the frame before the take, 48.1 px or more through the load (before: 10.7 px at rest, and the wire 0.1 to 8.7 px under the screen's edge in the load). The ball's lower edge at its lowest is at y 1027.2 of 1080. The view goes down from 4 frames before the take, by 7.3, 8.8, 7.9, 7.1, 6.3, 5.6, 5.0 px per frame and less after; it goes back from 0.6 s after the kick by the same steps.
- (b) Load: the wire's top goes 27.9 px down the screen (19.2 px after the ball lies on it), 0.29 of the ball's 97.5 px. 6.5 frames dead still on the table (26 steps of 240, the same turn of the wire to the last digit: `tests/polish-gate.test.ts`), 8 frames within 1 px of the deepest on the screen. Gap of shell and wire 0.00 px from the landing to the kick.
- (c) Throw: the wire comes up with the ball on it by 10.0 px in the drive's first frame and 23.8 px into the frame of the kick (gap 0.00 px in both), then 19.4 px more past its rest with the ball gone (gap 0.00 px in each), and the ball leaves in the frame of the kick, the same frame as before.
- (d) Recoil: the wire passes its rest by 22.3 px, then swings +12.6, -6.6, +2.4, -1.8 px about its rest; three swings after the first are over 2 px.
- (e) Brightness (luma 0 to 255, mean of columns x 893 to 906 of the 1920 by 1080 shot, `/home/user/shots/after-high`): at rest the wire's lit row 191 against the floor beside it 125 (+66), its other rows 135 to 157 (+10 to +32). In the load (frame at 20.300 s) the wire's lower bar 152 against the hole beside it 10 to 25 (+127 or more), the axle 154 to 176 against the floor above it 103 to 108 (+46 or more). The posts: their face 70 to 88, the floor beside 125 (-37 to -55), their lit edge 136 to 152 against the dark beside it 10 (+126 or more). Before, the wire's lit row 182 against the floor beside it 123 to 129 (+53 or more); in the load it was under the screen's edge.
- The kick's state and the 40 steps after it are byte equal to the before's for six ways into the gate (`tests/polish-gate.test.ts` holds the film's machine events by sha256).
- Slide table, `node pipeline/phase5/polish-slide-live.mjs --seeds 1,2,3,4`: see the checks below.

The drop, `PORT_TRACE=/home/user/keep/after/trace.json npx vitest run tests/polish-port.test.ts` against the same on 305e5bf3: 39 of 2520 rows differ, film frames 4219 to 4257, and only in the ball's `y`, `z` and `ball`; scroll, turn, x and events are equal in every row; from frame 4258 on every row is byte equal. The ring opens in frame 4219 with the ball still. The ball's step down the page, px per frame of 60:

| film frame | before | after | (trace's ring, s) |
|---|---|---|---|
| 4218 | 0.00 | 0.00 | 0.7250000000000361 |
| 4219 | 13.86 | 0.00 | 0.7416666666667036 |
| 4220 | 13.86 | 1.77 | 0.758333333333371 |
| 4221 | 13.86 | 5.03 | 0.7750000000000385 |
| 4222 | 13.86 | 7.88 | 0.791666666666706 |
| 4223 | 13.86 | 10.32 | 0.8083333333333735 |
| 4224 | 13.86 | 12.36 | 0.825000000000041 |
| 4225 | 13.86 | 13.99 | 0.8416666666667085 |
| 4226 | 13.86 | 15.21 | 0.858333333333376 |
| 4227 | 13.86 | 16.03 | 0.8750000000000435 |
| 4228 | 13.86 | 16.44 | 0.891666666666711 |
| 4229 | 13.86 | 16.50 | 0.9083333333333785 |
| 4230 | 13.86 | 16.49 | 0.925000000000046 |
| 4231 | 13.86 | 16.46 | 0.9416666666667135 |
| 4232 | 13.86 | 16.42 | 0.958333333333381 |
| 4233 | 13.86 | 16.36 | 0.9750000000000485 |
| 4234 | 13.86 | 16.29 | 0.991666666666716 |
| 4235 | 13.86 | 16.21 | 1.0083333333333835 |
| 4236 | 13.86 | 16.12 | 1.025000000000051 |
| 4237 | 13.86 | 16.01 | 1.0416666666667185 |
| 4238 | 13.86 | 15.90 | 1.058333333333386 |
| 4239 | 13.86 | 15.78 | 1.0750000000000535 |
| 4240 | 13.86 | 15.66 | 1.091666666666721 |
| 4241 | 13.86 | 15.53 | 1.1083333333333885 |
| 4242 | 13.86 | 15.39 | 1.125000000000056 |
| 4243 | 13.86 | 15.25 | 1.1416666666667235 |
| 4244 | 13.86 | 15.12 | 1.158333333333391 |
| 4245 | 13.86 | 14.98 | 1.1750000000000584 |
| 4246 | 13.86 | 14.84 | 1.191666666666726 |
| 4247 | 13.86 | 14.71 | 1.2083333333333934 |
| 4248 | 13.86 | 14.59 | 1.225000000000061 |
| 4249 | 13.86 | 14.47 | 1.2416666666667284 |
| 4250 | 13.86 | 14.35 | 1.258333333333396 |
| 4251 | 13.86 | 14.25 | 1.2750000000000634 |
| 4252 | 13.86 | 14.16 | 1.291666666666731 |
| 4253 | 13.86 | 14.08 | 1.3083333333333984 |
| 4254 | 13.86 | 14.01 | 1.325000000000066 |
| 4255 | 13.86 | 13.95 | 1.3416666666667334 |
| 4256 | 13.86 | 13.91 | 1.358333333333401 |
| 4257 | 13.86 | 13.88 | 1.3750000000000684 |
| 4258 | 13.86 | 13.87 | 1.3916666666667359 |
| 4259 | 13.86 | 13.86 | 1.4083333333334034 |
| 4260 | 11.28 | 11.28 | 1.4250000000000704 |

The first step is 1.77 px, the first nine steps each longer than the one before (to 16.50 px in frame 4229), then the step shrinks by at most 0.14 px per frame back to 13.86 px. On the live page the release is at page 6.017 s (never seed 1); measured on the shots by the best vertical shift of the ball's box: 0, 0, 5, 8, 10 px in the frames after it, where the before has 14, 14, 14, 14, 14.

Stills, `npm run still -- --key <key> --format hd --tier draft --force` and `cmp` against the same of 305e5bf3: `table-wide` equal, `last-save` equal, `loader-page` equal.
