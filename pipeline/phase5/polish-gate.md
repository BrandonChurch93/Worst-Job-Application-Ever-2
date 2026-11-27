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
5. The live view's lower margin: `ROOM = { px: 90, stay: 0.6, ease: 8 / 60, lead: 0.1, calm: 2, near: 0.6 }` in `src/pages/step3/index.ts`. Only on the live page, only on tiers 0 and 1 (the street's view ends at the page's end). It moves only the target of the view, by `px` times a smooth curve (3r^2 - 2r^3, no speed at its start and at its end) of a share `r` that runs from 0 to 1 over `ease` (8 frames of 60) and back the same way; the view's own follow (rate dt/0.15) does the moving. The share is kept in the page's state as `room`, only on the live page and only while it is not zero. Film views read no such target.
   - The line that knows the ball is lost is `atGate()`: the ball is in play, between the mouth's sides, not going up faster than `calm` (2 a second), and its place `lead` (0.1 s) ahead at its speed now is below the bats' tips at rest, both down the table and across it (`Math.abs(b.x + b.vx * ROOM.lead - MID) < MOUTH.half`). Once the way down has begun it holds while the ball is within `near` (0.6 of a ball) above the tips, so a ball that dribbles on the tips does not turn the view about. From the take on and until `stay` (0.6 s) after the kick it is true.
   - A ball struck back after the way down began (it goes up faster than `calm`): the target turns back on the same curve from where it is. A ball heading for a bat's tip does not begin it (the place ahead across the table). MEASURED with `node pipeline/phase5/polish-gate-miss.mjs --visitor never,pack --seeds 1,2`: the way down began 7 times, a take followed 7 times. Before the place ahead across the table was asked, each of those four visits had one way down of 3.0 px and back with no take (a ball the left bat's tip turned away); before `near`, pack seed 2 had one of 25.7 px.
   - What gives: a ball thrown straight down the mouth at 51 px a frame (pack seed 3, save 2, page 23.65 s) is known lost only 6 frames before the take. There the wire's lowest point is 19.3 px above the screen's edge in one frame (the frame after the take) and 32 px or more in every other frame of the load; the ball's lower edge is at y 1060.8 of 1080 at its lowest, whole on screen. A longer `lead` would move the first save's frames, which are the ones in the pictures.
   - `fall` (the drop's shadow) is in the page's state only while the fall runs, so the state's shape in the film is the one of before (`tests/polish-ball.test.ts` holds it by hash).
6. The drop: the ball in the port's cup keeps a shadow that runs today's pace from the step of the release. The seen ball is the shadow minus a lag: still for one frame, then steps that grow over 9 frames to 1.19 of the pace, then a cosine back to the pace; at 40 frames the lag is zero and the ball is the shadow. The page's scroll, the arrow's roll and the tube's events follow the shadow, so they are today's.
7. `FALL.over` is 40/60 s and not longer. With 110/60 s (top step 15.3 px, the largest shrink 0.02 px per frame) the arrow's turn differed from today's by up to 2.4e-6 rad from film frame 4332 until 4527, because the ball was not yet its shadow at the tube's first bend (frame 4260). That breaks "from 4332 nothing differs", so the shorter one stands. It is one number.
8. The seen release: the port's own ring opens by `LET.wide` 0.04 of its width with the dip the ring already has for its answer (`dipOf`), and its rim takes the light it already takes when it answers (`flashOf`). It begins half a frame before the frame in which the ball takes its first step. No new part, no new lamp.
9. The ball does not touch the tube's lip on its way in (STATED, from the cup's and the tube's widths in `src/table/layout.ts`; in the pictures the shell passes inside the lip). No change of speed or spin was added.
10. Two numbers were changed in `tests/polish-save.test.ts` (another owner's test), because this work changes what they hold: the block "lies still" now reads the dead still steps at the end of the load (at `rest + back`), where it read the end of the landing (at `rest`); the tail that is followed after a kick went from 120 to 160 steps, since the wire now rings 0.56 s (135 steps).

## Not mended, and open

- The asked travel of a third of the ball's width: 27.9 px of 32.5. See decision 1.
- The posts of the gate: they are static geometry of the tier (`src/table/real/frame/tier.ts`), not in my files. Their tone is as it was.
- The wire at rest against the floor: see the measures below. The gate's own tone at rest is the film's too, so it was left.
- The 20 px of screen under the wire for a ball known lost under 6 frames before the take: 19.3 px in one frame. See decision 5.

## What is measured after

The save, `node pipeline/phase5/polish-gate-measure.mjs --visitor never,pack --seed 1` (both visitors the same numbers):

- (a) Room: 69.8 px of screen under the wire's lowest point in the frame before the take, 73.1 px in the frame of the take, 65.4 px or more through the load (before: 10.7 px at rest, and the wire 0.1 to 8.7 px under the screen's edge in the load). The ball's lower edge at its lowest is at y 1015.7 of 1080. The view goes down from 13 frames before the take by 0.6, 1.6, 3.1, 4.4, 5.8, 6.6, 6.9, 6.5, 5.8, 5.2, 4.6, 4.1, 3.8 px per frame, 3.3 in the frame of the take, 0.6 in the frame before the kick; it goes back from 52 frames after the take by 0.1, 0.7, 2.0, 3.4, 4.8, 6.0, 6.7, 6.9, 6.3, 5.7 px per frame and less after, and stands on its rest (2544.0) 122 frames after the take. No step differs from the one before by more than 1.5 px. Other saves, the least px under the wire in the load: never seed 1 save 2: 50.6; pack seed 2 save 2: 68.8, save 3: 77.3; pack seed 3 save 2: 19.3 (decision 5); pack seed 4 save 2: 304.2 (the view was still on its way from the tier above), save 3: 122.8; on the street 78.6. Never seed 1 save 3 and pack seed 3 save 3 are gates that open under the ball; the ball goes down a tier and is taken there. The per frame table is below.
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

The view at the first save, `node pipeline/phase5/polish-gate-measure.mjs --visitor never --seed 1 --before 14 --after 125` (n is frames of 60 from the take; the kick is n 16; the view's step is the change of the page's scroll, px, read to 0.1; the screen is 1080 px high):

| n | page s | view step px | ball x | ball y | ball lower edge | wire lowest y | px under it | event |
|---|---|---|---|---|---|---|---|---|
| -13 | 19.85 | +0.6 | 962.0 | 845.6 | 894.4 | 1068.8 | 11.2 |  |
| -12 | 19.87 | +1.6 | 973.0 | 873.8 | 922.5 | 1067.1 | 12.9 |  |
| -11 | 19.88 | +3.1 | 983.9 | 901.4 | 950.1 | 1064.1 | 15.9 |  |
| -10 | 19.90 | +4.4 | 994.9 | 928.3 | 977.0 | 1059.6 | 20.4 |  |
| -9 | 19.92 | +5.8 | 981.1 | 931.2 | 980.0 | 1053.8 | 26.2 |  |
| -8 | 19.93 | +6.6 | 965.0 | 932.5 | 981.2 | 1047.2 | 32.8 |  |
| -7 | 19.95 | +6.9 | 948.8 | 934.2 | 983.0 | 1040.3 | 39.7 |  |
| -6 | 19.97 | +6.5 | 936.6 | 935.8 | 984.5 | 1033.8 | 46.2 |  |
| -5 | 19.98 | +5.8 | 943.3 | 934.0 | 982.8 | 1028.0 | 52.0 |  |
| -4 | 20.00 | +5.2 | 950.0 | 933.6 | 982.4 | 1022.8 | 57.2 |  |
| -3 | 20.02 | +4.6 | 956.7 | 934.6 | 983.4 | 1018.1 | 61.9 |  |
| -2 | 20.03 | +4.1 | 963.4 | 936.8 | 985.5 | 1014.0 | 66.0 |  |
| -1 | 20.05 | +3.8 | 970.1 | 940.4 | 989.1 | 1010.2 | 69.8 |  |
| 0 | 20.07 | +3.3 | 971.3 | 945.1 | 993.9 | 1006.9 | 73.1 | gate-take |
| 1 | 20.08 | +2.9 | 967.6 | 951.1 | 999.9 | 1004.0 | 76.0 |  |
| 2 | 20.10 | +2.7 | 964.5 | 954.6 | 1003.4 | 1005.5 | 74.5 |  |
| 3 | 20.12 | +2.3 | 962.6 | 951.4 | 1000.1 | 1002.3 | 77.7 |  |
| 4 | 20.13 | +2.1 | 961.5 | 949.3 | 998.0 | 1000.2 | 79.8 |  |
| 5 | 20.15 | +1.9 | 960.8 | 953.8 | 1002.5 | 1004.6 | 75.4 |  |
| 6 | 20.17 | +1.7 | 960.5 | 961.4 | 1010.1 | 1010.9 | 69.1 |  |
| 7 | 20.18 | +1.5 | 960.3 | 966.9 | 1015.6 | 1014.6 | 65.4 |  |
| 8 | 20.20 | +1.3 | 960.2 | 966.7 | 1015.5 | 1013.9 | 66.1 |  |
| 9 | 20.22 | +1.2 | 960.1 | 965.4 | 1014.1 | 1012.7 | 67.3 |  |
| 10 | 20.23 | +1.1 | 960.0 | 964.4 | 1013.1 | 1011.6 | 68.4 |  |
| 11 | 20.25 | +1.0 | 960.0 | 963.4 | 1012.1 | 1010.7 | 69.3 |  |
| 12 | 20.27 | +0.8 | 960.0 | 962.5 | 1011.2 | 1009.8 | 70.2 |  |
| 13 | 20.28 | +0.8 | 960.0 | 961.7 | 1010.5 | 1009.0 | 71.0 |  |
| 14 | 20.30 | +0.7 | 960.0 | 961.0 | 1009.8 | 1008.4 | 71.6 |  |
| 15 | 20.32 | +0.6 | 960.0 | 948.7 | 997.5 | 998.9 | 81.1 |  |
| 16 | 20.33 | +0.5 | 962.2 | 925.5 | 974.2 | 983.7 | 96.3 | ball-save |
| 17 | 20.35 | +0.5 | 971.0 | 893.5 | 942.2 | 983.2 | 96.8 |  |
| 18 | 20.37 | +0.5 | 979.9 | 862.4 | 911.1 | 982.8 | 97.2 |  |
| 19 | 20.38 | +0.3 | 988.7 | 832.1 | 880.9 | 982.4 | 97.6 |  |
| 20 | 20.40 | +0.4 | 997.6 | 802.6 | 851.4 | 982.0 | 98.0 |  |
| 21 | 20.42 | +0.3 | 1006.4 | 774.0 | 822.8 | 981.7 | 98.3 |  |
| 22 | 20.43 | +0.3 | 1015.2 | 746.2 | 795.0 | 982.0 | 98.0 |  |
| 23 | 20.45 | +0.2 | 1024.1 | 719.2 | 768.0 | 989.5 | 90.5 |  |
| 24 | 20.47 | +0.2 | 1032.9 | 693.0 | 741.8 | 988.6 | 91.4 |  |
| 25 | 20.48 | +0.2 | 1041.7 | 667.7 | 716.5 | 982.0 | 98.0 |  |
| 26 | 20.50 | +0.2 | 1050.6 | 643.2 | 692.0 | 980.6 | 99.4 |  |
| 27 | 20.52 | +0.2 | 1059.4 | 619.5 | 668.2 | 980.5 | 99.5 |  |
| 28 | 20.53 | +0.1 | 1068.2 | 596.6 | 645.4 | 980.3 | 99.7 |  |
| 29 | 20.55 | +0.1 | 1077.1 | 574.5 | 623.2 | 980.2 | 99.8 |  |
| 30 | 20.57 | +0.2 | 1085.9 | 553.2 | 602.0 | 980.1 | 99.9 |  |
| 31 | 20.58 | +0.1 | 1094.7 | 532.8 | 581.5 | 980.0 | 100.0 |  |
| 32 | 20.60 | +0.0 | 1103.6 | 513.1 | 561.9 | 979.9 | 100.1 |  |
| 33 | 20.62 | +0.1 | 1112.4 | 494.3 | 543.0 | 979.8 | 100.2 |  |
| 34 | 20.63 | +0.1 | 1121.2 | 476.2 | 525.0 | 979.7 | 100.3 |  |
| 35 | 20.65 | +0.1 | 1130.1 | 459.0 | 507.8 | 979.7 | 100.3 |  |
| 36 | 20.67 | +0.0 | 1138.9 | 442.6 | 491.4 | 979.6 | 100.4 |  |
| 37 | 20.68 | +0.1 | 1147.8 | 426.9 | 475.6 | 979.6 | 100.4 |  |
| 38 | 20.70 | +0.0 | 1156.6 | 412.1 | 460.9 | 979.5 | 100.5 |  |
| 39 | 20.72 | +0.1 | 1165.4 | 398.1 | 446.9 | 979.5 | 100.5 |  |
| 40 | 20.73 | +0.0 | 1174.3 | 384.9 | 433.6 | 979.4 | 100.6 |  |
| 41 | 20.75 | +0.0 | 1183.1 | 372.4 | 421.1 | 979.4 | 100.6 |  |
| 42 | 20.77 | +0.1 | 1191.9 | 360.8 | 409.6 | 979.4 | 100.6 |  |
| 43 | 20.78 | +0.0 | 1200.8 | 350.0 | 398.8 | 979.3 | 100.7 |  |
| 44 | 20.80 | +0.0 | 1209.6 | 340.0 | 388.8 | 979.3 | 100.7 |  |
| 45 | 20.82 | +0.0 | 1218.4 | 330.7 | 379.4 | 979.3 | 100.7 |  |
| 46 | 20.83 | +0.0 | 1227.3 | 322.3 | 371.1 | 979.3 | 100.7 |  |
| 47 | 20.85 | +0.1 | 1236.1 | 314.7 | 363.4 | 979.3 | 100.7 |  |
| 48 | 20.87 | +0.0 | 1244.9 | 307.8 | 356.6 | 979.3 | 100.7 |  |
| 49 | 20.88 | +0.0 | 1253.8 | 301.8 | 350.6 | 979.2 | 100.8 |  |
| 50 | 20.90 | +0.0 | 1262.6 | 296.6 | 345.4 | 979.2 | 100.8 |  |
| 51 | 20.92 | +0.0 | 1271.4 | 292.1 | 340.9 | 979.2 | 100.8 |  |
| 52 | 20.93 | -0.1 | 1280.3 | 288.6 | 337.4 | 979.3 | 100.7 |  |
| 53 | 20.95 | -0.7 | 1289.1 | 286.5 | 335.2 | 980.1 | 99.9 |  |
| 54 | 20.97 | -2.0 | 1298.0 | 286.5 | 335.2 | 982.0 | 98.0 |  |
| 55 | 20.98 | -3.4 | 1306.8 | 288.7 | 337.4 | 985.4 | 94.6 |  |
| 56 | 21.00 | -4.8 | 1315.6 | 293.1 | 341.9 | 990.3 | 89.7 |  |
| 57 | 21.02 | -6.0 | 1324.5 | 299.6 | 348.4 | 996.3 | 83.7 |  |
| 58 | 21.03 | -6.7 | 1333.3 | 307.6 | 356.4 | 1003.0 | 77.0 |  |
| 59 | 21.05 | -6.9 | 1342.1 | 316.5 | 365.2 | 1009.9 | 70.1 |  |
| 60 | 21.07 | -6.3 | 1347.9 | 328.0 | 376.8 | 1016.2 | 63.8 |  |
| 61 | 21.08 | -5.7 | 1351.7 | 341.3 | 390.1 | 1021.9 | 58.1 |  |
| 62 | 21.10 | -5.0 | 1357.3 | 353.7 | 402.4 | 1026.9 | 53.1 |  |
| 63 | 21.12 | -4.5 | 1367.7 | 362.1 | 410.9 | 1031.5 | 48.5 |  |
| 64 | 21.13 | -4.0 | 1376.9 | 369.6 | 418.4 | 1035.5 | 44.5 |  |
| 65 | 21.15 | -3.6 | 1385.0 | 376.2 | 424.9 | 1039.1 | 40.9 |  |
| 66 | 21.17 | -3.2 | 1391.8 | 382.0 | 430.8 | 1042.3 | 37.7 |  |
| 67 | 21.18 | -2.9 | 1397.5 | 387.1 | 435.9 | 1045.2 | 34.8 |  |
| 68 | 21.20 | -2.6 | 1402.0 | 391.4 | 440.1 | 1047.8 | 32.2 |  |
| 69 | 21.22 | -2.3 | 1405.4 | 394.9 | 443.6 | 1050.1 | 29.9 |  |
| 70 | 21.23 | -2.0 | 1407.6 | 397.8 | 446.6 | 1052.1 | 27.9 |  |
| 71 | 21.25 | -1.9 | 1408.6 | 400.0 | 448.8 | 1054.0 | 26.0 |  |
| 72 | 21.27 | -1.6 | 1408.6 | 401.7 | 450.4 | 1055.6 | 24.4 |  |
| 73 | 21.28 | -1.5 | 1408.6 | 403.2 | 451.9 | 1057.1 | 22.9 |  |
| 74 | 21.30 | -1.3 | 1408.6 | 404.5 | 453.2 | 1058.4 | 21.6 |  |
| 75 | 21.32 | -1.1 | 1408.6 | 405.7 | 454.4 | 1059.5 | 20.5 |  |
| 76 | 21.33 | -1.1 | 1408.6 | 406.8 | 455.6 | 1060.6 | 19.4 |  |
| 77 | 21.35 | -0.9 | 1408.6 | 407.7 | 456.4 | 1061.5 | 18.5 |  |
| 78 | 21.37 | -0.8 | 1408.6 | 408.6 | 457.4 | 1062.3 | 17.7 |  |
| 79 | 21.38 | -0.8 | 1408.6 | 409.3 | 458.1 | 1063.1 | 16.9 |  |
| 80 | 21.40 | -0.6 | 1408.6 | 410.0 | 458.8 | 1063.8 | 16.2 |  |
| 81 | 21.42 | -0.6 | 1408.6 | 410.6 | 459.4 | 1064.4 | 15.6 |  |
| 82 | 21.43 | -0.6 | 1408.6 | 411.1 | 459.9 | 1064.9 | 15.1 |  |
| 83 | 21.45 | -0.4 | 1408.6 | 411.6 | 460.4 | 1065.4 | 14.6 |  |
| 84 | 21.47 | -0.5 | 1408.6 | 412.0 | 460.8 | 1065.8 | 14.2 |  |
| 85 | 21.48 | -0.3 | 1408.6 | 412.4 | 461.1 | 1066.2 | 13.8 |  |
| 86 | 21.50 | -0.4 | 1408.6 | 412.8 | 461.6 | 1066.5 | 13.5 |  |
| 87 | 21.52 | -0.3 | 1408.6 | 413.1 | 461.9 | 1066.8 | 13.2 |  |
| 88 | 21.53 | -0.2 | 1408.6 | 413.4 | 462.1 | 1067.1 | 12.9 |  |
| 89 | 21.55 | -0.3 | 1408.6 | 413.6 | 462.4 | 1067.3 | 12.7 |  |
| 90 | 21.57 | -0.2 | 1408.6 | 413.8 | 462.6 | 1067.5 | 12.5 |  |
| 91 | 21.58 | -0.2 | 1408.6 | 414.0 | 462.8 | 1067.7 | 12.3 |  |
| 92 | 21.60 | -0.2 | 1408.6 | 414.2 | 462.9 | 1067.9 | 12.1 |  |
| 93 | 21.62 | -0.1 | 1408.6 | 414.3 | 463.1 | 1068.0 | 12.0 |  |
| 94 | 21.63 | -0.2 | 1408.6 | 414.5 | 463.2 | 1068.2 | 11.8 |  |
| 95 | 21.65 | -0.1 | 1408.6 | 414.6 | 463.4 | 1068.3 | 11.7 |  |
| 96 | 21.67 | -0.1 | 1408.6 | 414.7 | 463.4 | 1068.4 | 11.6 |  |
| 97 | 21.68 | -0.1 | 1408.6 | 414.8 | 463.6 | 1068.5 | 11.5 |  |
| 98 | 21.70 | -0.1 | 1408.6 | 414.9 | 463.6 | 1068.6 | 11.4 |  |
| 99 | 21.72 | +0.0 | 1408.6 | 415.0 | 463.8 | 1068.7 | 11.3 |  |
| 100 | 21.73 | -0.1 | 1408.6 | 415.1 | 463.9 | 1068.7 | 11.3 |  |
| 101 | 21.75 | -0.1 | 1408.6 | 415.1 | 463.9 | 1068.8 | 11.2 |  |
| 102 | 21.77 | +0.0 | 1408.6 | 415.2 | 463.9 | 1068.9 | 11.1 |  |
| 103 | 21.78 | -0.1 | 1408.6 | 415.2 | 463.9 | 1068.9 | 11.1 |  |
| 104 | 21.80 | +0.0 | 1408.6 | 415.3 | 464.1 | 1069.0 | 11.0 |  |
| 105 | 21.82 | -0.1 | 1408.6 | 415.3 | 464.1 | 1069.0 | 11.0 |  |
| 106 | 21.83 | +0.0 | 1408.6 | 415.3 | 464.1 | 1069.0 | 11.0 |  |
| 107 | 21.85 | +0.0 | 1408.6 | 415.4 | 464.1 | 1069.1 | 10.9 |  |
| 108 | 21.87 | -0.1 | 1408.6 | 415.4 | 464.1 | 1069.1 | 10.9 |  |
| 109 | 21.88 | +0.0 | 1408.6 | 415.4 | 464.1 | 1069.1 | 10.9 |  |
| 110 | 21.90 | +0.0 | 1408.6 | 415.5 | 464.2 | 1069.1 | 10.9 |  |
| 111 | 21.92 | +0.0 | 1408.6 | 415.5 | 464.2 | 1069.2 | 10.8 |  |
| 112 | 21.93 | +0.0 | 1408.6 | 415.5 | 464.2 | 1069.2 | 10.8 |  |
| 113 | 21.95 | -0.1 | 1408.6 | 415.5 | 464.2 | 1069.2 | 10.8 |  |
| 114 | 21.97 | +0.0 | 1408.6 | 415.5 | 464.2 | 1069.2 | 10.8 |  |
| 115 | 21.98 | +0.0 | 1408.6 | 415.5 | 464.2 | 1069.2 | 10.8 |  |
| 116 | 22.00 | +0.0 | 1408.6 | 415.6 | 464.4 | 1069.2 | 10.8 |  |
| 117 | 22.02 | +0.0 | 1408.6 | 415.6 | 464.4 | 1069.2 | 10.8 |  |
| 118 | 22.03 | +0.0 | 1408.6 | 415.6 | 464.4 | 1069.3 | 10.7 |  |
| 119 | 22.05 | +0.0 | 1408.6 | 415.6 | 464.4 | 1069.3 | 10.7 |  |
| 120 | 22.07 | +0.0 | 1408.6 | 415.6 | 464.4 | 1069.3 | 10.7 |  |
| 121 | 22.08 | +0.0 | 1408.6 | 415.6 | 464.4 | 1069.3 | 10.7 |  |
| 122 | 22.10 | -0.1 | 1408.6 | 415.6 | 464.4 | 1069.3 | 10.7 |  |
| 123 | 22.12 | +0.0 | 1408.6 | 415.6 | 464.4 | 1069.3 | 10.7 |  |
| 124 | 22.13 | +0.0 | 1408.6 | 415.6 | 464.4 | 1069.3 | 10.7 |  |

The low level, `node pipeline/phase5/polish-gate-shots.mjs --bot never --seed 1 --quality low --at 20.05 --count 20` on 305e5bf3 and on this branch: see the report's picture.
