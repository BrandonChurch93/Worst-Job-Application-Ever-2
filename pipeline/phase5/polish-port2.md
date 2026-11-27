# Polish port 2: the port's closing action and the ball's fall down the tube (round 25, set C)

Branch `agent/polish-port2`, from `308e96a1`. Film frame = 4020 + 60 t. Steps are the stage's, 240 a second.

## What the critic saw

1. Major, `set-C-01.png`: the capture read as a loading animation: the arrow stops, two disconnected crescents appear, then the sealed ball.
2. Major, `set-C-04.png`: the drop read as a guided glide: even steps past the collar, the arrow turning evenly, no answer of the tube.

Not mine: the view going down the page with the ball (declined), and the flipper-ready cue (no word, picture or device added at the port).

## Measured before (308e96a1)

Commands: `PORT_TRACE=<file> npx vitest run tests/polish-port.test.ts` and `PORT2_TRACE=<file> npx vitest run tests/polish-port2.test.ts`, both in a worktree of 308e96a1; pictures with `node pipeline/phase5/polish-port2-visitor.mjs --keep <folder>` (the pack's own visitor) and `node pipeline/phase5/polish-gate-shots.mjs --bot never --seed 1 --quality high --at 4.65 --count 50`.

Steps: film seal 553, lock 618, release 796, arrival at the tube's end 2068 (frames 4159, 4175, 4219, 4537). Live with a visitor that never moves, seed 1: 1228, 1293, 1448, 2720. Port middle (1627, 520), ball 96 px, cup 220 px, ring 330 px and 26 px high.

Capture:
- 4154 to 4158 the arrow sinks (z 30.7 to 2.4, squash 1.27 to 0.78). 4159 seal, the ring's first answer.
- Share shut per frame 4159 to 4175: .052 .120 .186 .248 .306 .357 .402 .439 .468 .488 .498 .504 .542 .623 .746 .912 1.
- Seen at real size, 60 a second: for 6 frames after the seal the arrow lies alone in the cup; then 8 frames of two thin arcs about 35 px above and below the middle, touching neither the cup, the ring nor each other; 2 frames folding; then the whole ball. The arrow is seen on every frame. No frame lacks both. Arrow and whole ball from the lock on, 43 frames to the release in the film.
- Lock frame 4175: the ring answers (round 21): 0.034 x 110 px = 3.74 px at the lip for 2 frames, sprung back; the ball is squeezed 0.85.

Cause: `src/table/real/ball/index.ts` and `glsl.ts` drew the open shell as a clamshell hinged at the bottom (1.2 rad by the share open), sunk up to 1.9 radii and faded out under 0.2 shut. From above the halves are edge on.

Drop (film, px a frame down the page): 4219 0; 4220 1.77; 5.03 7.88 10.32 12.36 13.99 15.21 16.03 16.44 16.50 at 4229, the top pace 10 frames after the release; then shrinking to 13.86 by 4259 and 13.86 after. Spin about 0.173 rad a frame, even. No touch at the lip or the first collar (round 24, decision 9: bore 49.4 px, ball 48). The rail `feed` turns at two bends, 574.4 px and 860 px down it (page (1627, 1094) and (1838, 1286)); the ball passed both with no change.

Cause: `lagOf` (round 24) let the ball fall for 9 frames and eased it back to the tube's even pace within 40 frames.

## Rule 6 reading, and the Builder's rulings (13:43 UTC)

- Round 24's `FALL`: not contested. The shadow, the one still frame and the ring opening at the release stay. `tests/polish-gate.test.ts` now asks 39 growing steps after the first instead of nine and no longer asks the tube's pace by frame 41; its title of the next test says 77 frames instead of 40.
- Round 21's view: not contested. `DROP`'s numbers are untouched. `tests/polish-port.test.ts` keeps the heights: the ball passes 640 px of the screen at step 884 (3.683 s, frame 4241, 22 frames after the release; before at 3.5 s it was past it), is past 740 px at 4.0 s (before at 3.8 s). Peak 771.5 px at frame 4265 (before 791 at 4248).
- Round 21's `shutOf`, `LATCH`, `SHELL`: unchanged. Way b kept.
- The jaws: approved; the ball maker's two files are mine this round for the jaw flag only.
- The strikes at the bends: accepted in principle, with the tube's answer built.

## What was done

Drop, `src/pages/step3/index.ts`:
- `FALL = { still: 1/60, top: 46/60, ring: 1/120 }`, `BEND` (the two bends from the rail's own points, and 0.672, the cosine of the first turn).
- `lagOf`: one steady gain from rest to the first bend, where the ball is at its top pace 46 frames after the release. The bend takes the share of the speed that goes into the wall (x 0.672 in one frame). The ball gains again on the slope so that it meets its shadow exactly at the second bend, where it strikes again and has the tube's pace of before.
- The view of before goes on aiming at the shadow (`s.scroll`, `s.sv` are the numbers of before at every step). A second spring with the same `DROP` numbers aims at the drawn ball; what is seen is that one, blended into the first between the meeting and `T.tube + DROP.over`.
- The arrow's roll is driven by the drawn ball's way, not the shadow's.

Tube's answer, `src/table/real/frame/loader.ts`: `KNOCK = { px: 2.6, reach: 150, lead: 1/60, over: 6/60, swing: 5/60 }`. At each strike the tube's wall is pushed 2.6 px at the bend, square to the run the ball goes on with (down left at the first, right at the second), less with distance and nothing 150 px away (the reach was 100 px at first; the live pictures showed under 1 px at the walls, so it was widened at 14:25 UTC); next frames 0.64, -1.26, -0.84, 0.16 px, then rest. The page gives the seconds since each strike as the ring's third and fourth numbers, for those 6/60 s only. The collars do not move. No sound cue added or moved.

Capture, `src/table/real/ball/index.ts`, `glsl.ts`, and the flag in `src/pages/step3/index.ts`:
- While the shell shuts at the port the page adds a seventh number 1 to the ball's `v`. With it the maker draws the halves as two jaws: whole half balls, `JAWS = { wide: 1.2, deep: 1.25, up: 0.3 }`, each on its side of the seam, 1.2 radii apart times the share open, risen out of the cup's floor by the time the shell is 0.3 shut, with no fade and no hinge. Without the flag the maker draws as before.
- The curve is round 21's own: 16 frames, eased to half shut over 11, then the snap over 5. On the lock frame the seam is shut, the ring gives 3.74 px and springs back, the ball is squeezed, and the ball stands 43 frames (film) before the release.

No part, colour, word, sound or device was added.

## Pictures, and what is seen in them at real size

Live, the pack's own visitor (`tools/lib/pack-site.mjs`: `walk`, `momentsOf`, `replay`), every frame of 60, 1920 by 1080 at one px to a px: `node pipeline/phase5/polish-port2-visitor.mjs --keep <folder>` (windows `f-8:22,l-2:66`: 8 frames before the flippers' step to 22 after, 2 before the ball leaves to 66 after). MEASURED: the walk has 10795 steps of 60, the flippers at step 5859 (the seal), the ball leaves at step 5953 (the release is 5952), on both trees. Before on 308e96a1, after on the branch merged with main.

Capture, live, seal +0 to +16, before above and after below (tiles of 186 px around the port):
- Before: seal +0 to +5 the arrow alone in the cup; +6 to +13 two thin arcs far above and below it, touching nothing; +14 and +15 they fold; +16 the whole ball.
- After: +0 the arrow alone; +1 two thin lines (the flat faces of the halves as they break the cup's floor, 1 frame); +2 and +3 two half domes of glass rise out of the floor above and below the arrow, their rims and their thickness seen; +4 to +11 they drift in towards the arrow; +12 to +15 they shut (the snap of round 21's curve); +16 the whole ball, the seam shut. The arrow is seen on every frame, and is drawn over the halves' flat faces on +14 and +15 (it is inside the closing shell). No half dome cuts the cup's wall or the ring on any frame.
- Not as asked, said plainly: the halves come out of the cup's floor; from +4 to +13 they stand free on the floor and touch neither the cup's wall nor the ring. They are half balls with thickness, not thin arcs, but "joined to the cup or its ring until they meet" holds only for their rise through the floor (+1 to +3). Joining them to the wall would need a new part or the shell to start wider than the cup, and was not done.
- The lock (+16): the ring's answer is round 21's `ANSWER`, unchanged, 3.74 px at the lip for 2 frames (MEASURED in `tests/polish-port2.test.ts`, "the lock"). In the tiles of 186 px the ring is outside the crop.

Drop, live, release +0 to +67, before above and after below:
- Before: the ball is at its even pace within 10 frames and glides; the view runs with it from the first frame.
- After: the ball barely moves for the first 8 frames, gathers pace down the straight tube with the view coming after, is at 24.7 px a frame when it meets the first bend at release +47, goes on down the slope at 16.9 px a frame gaining to 21.1, meets the second bend at +62 and goes on at the tube's 13.86.
- First bend, +43 to +51 at real size: the ball comes down the straight twice as fast as before, lands in the bend on +47 and leaves along the slope slower. These live pictures were taken with the tube's answer reaching 100 px: MEASURED on the left wall beside the bend (edge of the wall, page x 1550 to 1600, y 1075 to 1115), the edge stands at x 1584.4 at rest and at 1584.1, 1584.4, 1585.0, 1584.5 on +48 to +51, that is 0.3 to 0.6 px, which I could not see in single frames. The reach was then widened to 150 px (by the falloff 1.9 px at a wall 53 px from the bend's middle instead of 1.2); what that shows is in the film frames below.
- Second bend, +59 to +65: before and after are the same from +62 on; the after ball arrives faster on +59 to +61.

Strike frames for the sound: the ball stands at the first bend on film frame 4265 and at the second on 4280 (MEASURED: `PORT2_TRACE`, steps 980 and 1040, the ball at (1627.0, 1094.4) and (1838.4, 1286.4)); the first slower step is drawn on 4266 and 4281 (I named these two as the strike frames in my first message; the touch is one frame earlier). The tube's answer is drawn on 4265 to 4270 and 4280 to 4285. Live, the pack's visitor: steps 5999 and 6014. No cue was added or moved.

Touch: the ball does not touch the lip or the first collar (STATED, round 24 decision 9: bore 49.4 px, ball 48 px), so no answer is added there. It touches the tube's wall at the two bends, where the rail turns. The collars nearest the bends (page y about 1010 and 1405) do not move.

The arrow's turn: driven by the drawn ball's way down the rail. MEASURED from the trace (`/home/user/keep/cmp.py` on the two `PORT_TRACE` files): at the top pace 0.283 rad a frame for 24.70 px (a ball of 48 px radius rolls 0.515 rad on that), before 0.174 rad for 13.86 px (0.289 rad); at release +1 0.019 rad, of which the arrow already had 0.030 rad a frame before the release (round 24's settle, not the roll). After the first strike the turn falls 0.285, 0.275, 0.263, 0.252 over 4 frames.

## The film

Frames drawn at the draft tier, 1920 by 1080, with their sha256: `node pipeline/phase5/polish-port2-film.mjs --keep <folder> --frames <list>`, before in a worktree of 308e96a1, after on the merged branch.

- Capture, 4159 to 4175, before above and after below: before 4159 to 4163 the arrow alone, 4164 to 4172 two thin arcs, 4173 folding, 4174 and 4175 the whole ball. After: 4159 two thin lines, 4160 and 4161 the half domes rise, 4162 to 4172 they close on the arrow, 4173 nearly shut, 4174 the whole ball, 4175 the lock. The arrow is seen on every frame.
- MEASURED sha256: 4175, 4332, 4537 and 6340 are byte equal before and after. 4159 to 4174 differ (the shell's flag). 4262 to 4270 and 4278 to 4285 differ (the ball, the view, the tube's answer). 6340 is the split at the outlet, drawn without the flag: the maker draws byte equal without it. 4332 and 4537 are a ball frame in the tube after the meeting and the arriving frame.
- First bend, 4262 to 4270 at real size: before the ball is already on the slope at 4262 and glides; after it comes down the straight at 23 to 24.7 px a frame, stands in the bend on 4265 and goes on along the slope at 16.9 px. Second bend, 4278 to 4284: the after ball arrives faster on 4278 to 4280, and from 4281 the two are the same but for the tube's answer.
- The tube's answer in the film (reach 150 px): MEASURED by comparing the frames drawn with reach 100 and with reach 150: 4264 equal, 4265 to 4270 and 4280 to 4285 differ, in a box around the bend only. By eye in single frames at real size I see no tear and no move I can name. Not reported as seen.
- Frames that change, from the per frame compare of the two `PORT_TRACE` takes and the sha256 above: 4159 to 4174 (shell), 4220 to 4280 (the ball's place), 4220 to 4295 (the view), 4265 to 4270 and 4280 to 4285 (the tube). From 4296 on the ball's place and the view are byte equal; the arrow's turn differs under 1e-7 rad from 4296 and is exactly equal from 4528. UNKNOWN: not every frame of 4217 to 4298 was drawn; drawn were 4157 to 4177, 4260 to 4286, 4332, 4537, 4700, 6340, 6344.

Stills, draft tier, hd, `npm run still -- --key <key> --format hd --tier draft --force`, then `cmp` with the ones taken on 308e96a1: `table-wide` byte equal, `last-save` byte equal, `loader-page` byte equal (MEASURED 14:40 UTC, on the merged tree).

## Residue

- The stage's state hash differs from before from step 793 to 2194 and is equal from step 2195 (9.15 s). After the arriving step 2068 only the cursor pose's `bend` differs, by 1.6e-15 falling to 1e-16: the roll's aim feeds a spring in `src/cursor/body.ts`, which is not mine. As pictures, 4332 and 4537 are byte equal.
- The halves are not joined to the cup's wall or the ring (see above).
- The tube's answer is built and measured in steps, not seen by me in a picture.

## Decisions

1. The view follows the drawn ball; the view of before is kept in step and blended back by 4.6 s, so that everything after is the numbers of before.
2. The halves rise from the cup's floor and slide together along the seam's normal; `shutOf`, `LATCH`, `SHELL` untouched.
3. The tube answers at the bends, not a collar: no collar stands at a bend. No sound cue touched.
4. The arrow's roll is driven by the drawn ball, accepting the residue above.
5. `KNOCK.reach` 150 px instead of 100 after the live pictures showed under 1 px at the walls.
6. After pictures are taken on the branch merged with main, before on 308e96a1.

## The ball's step, per frame of 60

film, release at step 796 (film frame 4219). Step = the ball's way on the page between two frames of 60, px; y = the ball's middle on the screen, px; turn = the arrow's turn in that frame, rad.

| frame after release | film frame | step before | step after | y before | y after | turn before | turn after |
|---|---|---|---|---|---|---|---|
| 1 | 4220 | 1.77 | 0.27 | 521.8 | 520.3 | 0.059 | 0.019 |
| 2 | 4221 | 5.03 | 0.81 | 526.7 | 521.1 | 0.098 | 0.027 |
| 3 | 4222 | 7.88 | 1.36 | 534.5 | 522.4 | 0.129 | 0.033 |
| 4 | 4223 | 10.32 | 1.90 | 544.5 | 524.3 | 0.150 | 0.037 |
| 5 | 4224 | 12.36 | 2.44 | 556.4 | 526.8 | 0.164 | 0.040 |
| 6 | 4225 | 13.99 | 2.99 | 569.7 | 529.8 | 0.172 | 0.041 |
| 7 | 4226 | 15.21 | 3.53 | 583.9 | 533.3 | 0.174 | 0.041 |
| 8 | 4227 | 16.03 | 4.07 | 598.8 | 537.4 | 0.174 | 0.042 |
| 9 | 4228 | 16.44 | 4.61 | 613.7 | 542.0 | 0.173 | 0.042 |
| 10 | 4229 | 16.50 | 5.16 | 628.4 | 547.1 | 0.171 | 0.044 |
| 11 | 4230 | 16.49 | 5.70 | 642.7 | 552.8 | 0.169 | 0.046 |
| 12 | 4231 | 16.46 | 6.24 | 656.7 | 558.9 | 0.167 | 0.050 |
| 13 | 4232 | 16.42 | 6.79 | 670.2 | 565.5 | 0.166 | 0.055 |
| 14 | 4233 | 16.36 | 7.33 | 683.3 | 572.5 | 0.166 | 0.060 |
| 15 | 4234 | 16.29 | 7.87 | 695.9 | 580.0 | 0.166 | 0.067 |
| 16 | 4235 | 16.21 | 8.42 | 707.9 | 587.8 | 0.167 | 0.074 |
| 17 | 4236 | 16.12 | 8.96 | 719.3 | 595.9 | 0.168 | 0.081 |
| 18 | 4237 | 16.01 | 9.50 | 730.0 | 604.3 | 0.169 | 0.089 |
| 19 | 4238 | 15.90 | 10.04 | 740.0 | 613.0 | 0.170 | 0.097 |
| 20 | 4239 | 15.78 | 10.59 | 749.2 | 621.9 | 0.171 | 0.105 |
| 21 | 4240 | 15.66 | 11.13 | 757.6 | 631.0 | 0.172 | 0.112 |
| 22 | 4241 | 15.53 | 11.67 | 765.2 | 640.1 | 0.173 | 0.120 |
| 23 | 4242 | 15.39 | 12.22 | 771.8 | 649.3 | 0.173 | 0.127 |
| 24 | 4243 | 15.25 | 12.76 | 777.5 | 658.4 | 0.174 | 0.135 |
| 25 | 4244 | 15.12 | 13.30 | 782.2 | 667.5 | 0.174 | 0.142 |
| 26 | 4245 | 14.98 | 13.84 | 785.9 | 676.4 | 0.174 | 0.149 |
| 27 | 4246 | 14.84 | 14.39 | 788.6 | 685.1 | 0.174 | 0.155 |
| 28 | 4247 | 14.71 | 14.93 | 790.4 | 693.5 | 0.174 | 0.162 |
| 29 | 4248 | 14.59 | 15.47 | 791.1 | 701.6 | 0.174 | 0.169 |
| 30 | 4249 | 14.47 | 16.02 | 790.9 | 709.3 | 0.174 | 0.175 |
| 31 | 4250 | 14.35 | 16.56 | 789.8 | 716.6 | 0.174 | 0.182 |
| 32 | 4251 | 14.25 | 17.10 | 787.8 | 723.5 | 0.173 | 0.189 |
| 33 | 4252 | 14.16 | 17.64 | 785.0 | 729.9 | 0.173 | 0.195 |
| 34 | 4253 | 14.08 | 18.19 | 781.5 | 735.7 | 0.173 | 0.202 |
| 35 | 4254 | 14.01 | 18.73 | 777.4 | 741.1 | 0.173 | 0.208 |
| 36 | 4255 | 13.95 | 19.27 | 772.7 | 746.0 | 0.173 | 0.215 |
| 37 | 4256 | 13.91 | 19.82 | 767.5 | 750.3 | 0.173 | 0.222 |
| 38 | 4257 | 13.88 | 20.36 | 762.0 | 754.2 | 0.173 | 0.229 |
| 39 | 4258 | 13.87 | 20.90 | 756.2 | 757.6 | 0.173 | 0.235 |
| 40 | 4259 | 13.86 | 21.44 | 750.2 | 760.5 | 0.173 | 0.242 |
| 41 | 4260 | 12.70 | 21.99 | 741.6 | 763.1 | 0.174 | 0.249 |
| 42 | 4261 | 13.86 | 22.53 | 731.1 | 765.3 | 0.175 | 0.256 |
| 43 | 4262 | 13.86 | 23.07 | 720.8 | 767.2 | 0.176 | 0.263 |
| 44 | 4263 | 13.86 | 23.62 | 710.9 | 768.8 | 0.177 | 0.270 |
| 45 | 4264 | 13.86 | 24.16 | 701.6 | 770.3 | 0.177 | 0.276 |
| 46 | 4265 | 13.86 | 24.70 | 692.8 | 771.5 | 0.176 | 0.283 |
| 47 | 4266 | 13.86 | 16.94 | 684.6 | 759.0 | 0.176 | 0.285 |
| 48 | 4267 | 13.86 | 17.23 | 677.0 | 746.6 | 0.175 | 0.275 |
| 49 | 4268 | 13.86 | 17.53 | 670.0 | 734.9 | 0.175 | 0.263 |
| 50 | 4269 | 13.86 | 17.82 | 663.7 | 724.0 | 0.174 | 0.252 |
| 51 | 4270 | 13.86 | 18.11 | 658.0 | 714.0 | 0.174 | 0.245 |
| 52 | 4271 | 13.86 | 18.41 | 652.8 | 705.1 | 0.173 | 0.240 |
| 53 | 4272 | 13.86 | 18.70 | 648.2 | 697.2 | 0.173 | 0.237 |
| 54 | 4273 | 13.86 | 19.00 | 644.1 | 690.4 | 0.173 | 0.235 |
| 55 | 4274 | 13.86 | 19.29 | 640.4 | 684.5 | 0.173 | 0.236 |
| 56 | 4275 | 13.86 | 19.58 | 637.3 | 679.5 | 0.173 | 0.236 |
| 57 | 4276 | 13.86 | 19.88 | 634.5 | 675.5 | 0.173 | 0.238 |
| 58 | 4277 | 13.86 | 20.17 | 632.1 | 672.1 | 0.173 | 0.240 |
| 59 | 4278 | 13.86 | 20.47 | 630.0 | 669.5 | 0.173 | 0.243 |
| 60 | 4279 | 13.86 | 20.76 | 628.3 | 667.5 | 0.173 | 0.246 |
| 61 | 4280 | 13.86 | 21.06 | 626.8 | 666.1 | 0.173 | 0.250 |
| 62 | 4281 | 13.73 | 13.88 | 629.8 | 664.2 | 0.180 | 0.254 |
| 63 | 4282 | 13.86 | 13.86 | 633.0 | 662.1 | 0.194 | 0.255 |
| 64 | 4283 | 13.86 | 13.86 | 636.0 | 659.9 | 0.207 | 0.254 |
| 65 | 4284 | 13.86 | 13.86 | 638.8 | 658.0 | 0.216 | 0.251 |
| 66 | 4285 | 13.86 | 13.86 | 641.3 | 656.3 | 0.219 | 0.245 |

live, release at step 1448. Step = the ball's way on the page between two frames of 60, px; y = the ball's middle on the screen, px; turn = the arrow's turn in that frame, rad.

| frame after release | step before | step after | y before | y after | turn before | turn after |
|---|---|---|---|---|---|---|
| 1 | 1.77 | 0.27 | 521.8 | 520.3 | 0.051 | 0.019 |
| 2 | 5.03 | 0.81 | 526.7 | 521.1 | 0.080 | 0.023 |
| 3 | 7.88 | 1.36 | 534.5 | 522.4 | 0.103 | 0.027 |
| 4 | 10.32 | 1.90 | 544.5 | 524.3 | 0.119 | 0.029 |
| 5 | 12.36 | 2.44 | 556.4 | 526.8 | 0.129 | 0.030 |
| 6 | 13.99 | 2.99 | 569.7 | 529.8 | 0.134 | 0.030 |
| 7 | 15.21 | 3.53 | 583.9 | 533.3 | 0.145 | 0.038 |
| 8 | 16.03 | 4.07 | 598.8 | 537.4 | 0.156 | 0.049 |
| 9 | 16.44 | 4.61 | 613.7 | 542.0 | 0.162 | 0.057 |
| 10 | 16.50 | 5.16 | 628.4 | 547.1 | 0.164 | 0.063 |
| 11 | 16.49 | 5.70 | 642.7 | 552.8 | 0.164 | 0.065 |
| 12 | 16.46 | 6.24 | 656.7 | 558.9 | 0.160 | 0.066 |
| 13 | 16.42 | 6.79 | 670.2 | 565.5 | 0.156 | 0.066 |
| 14 | 16.36 | 7.33 | 683.3 | 572.5 | 0.151 | 0.066 |
| 15 | 16.29 | 7.87 | 695.9 | 580.0 | 0.146 | 0.066 |
| 16 | 16.21 | 8.42 | 707.9 | 587.8 | 0.141 | 0.067 |
| 17 | 16.12 | 8.96 | 719.3 | 595.9 | 0.138 | 0.069 |
| 18 | 16.01 | 9.50 | 730.0 | 604.3 | 0.135 | 0.071 |
| 19 | 15.90 | 10.04 | 740.0 | 613.0 | 0.133 | 0.075 |
| 20 | 15.78 | 10.59 | 749.2 | 621.9 | 0.133 | 0.080 |
| 21 | 15.66 | 11.13 | 757.6 | 631.0 | 0.133 | 0.085 |
| 22 | 15.53 | 11.67 | 765.2 | 640.1 | 0.133 | 0.091 |
| 23 | 15.39 | 12.22 | 771.8 | 649.3 | 0.134 | 0.097 |
| 24 | 15.25 | 12.76 | 777.5 | 658.4 | 0.135 | 0.103 |
| 25 | 15.12 | 13.30 | 782.2 | 667.5 | 0.136 | 0.110 |
| 26 | 14.98 | 13.84 | 785.9 | 676.4 | 0.137 | 0.116 |
| 27 | 14.84 | 14.39 | 788.6 | 685.1 | 0.138 | 0.123 |
| 28 | 14.71 | 14.93 | 790.4 | 693.5 | 0.139 | 0.129 |
| 29 | 14.59 | 15.47 | 791.1 | 701.6 | 0.139 | 0.135 |
| 30 | 14.47 | 16.02 | 790.9 | 709.3 | 0.140 | 0.141 |
| 31 | 14.35 | 16.56 | 789.8 | 716.6 | 0.140 | 0.146 |
| 32 | 14.25 | 17.10 | 787.8 | 723.5 | 0.140 | 0.152 |
| 33 | 14.16 | 17.64 | 785.0 | 729.9 | 0.140 | 0.157 |
| 34 | 14.08 | 18.19 | 781.5 | 735.7 | 0.140 | 0.163 |
| 35 | 14.01 | 18.73 | 777.4 | 741.1 | 0.140 | 0.168 |
| 36 | 13.95 | 19.27 | 772.7 | 746.0 | 0.140 | 0.173 |
| 37 | 13.91 | 19.82 | 767.5 | 750.3 | 0.139 | 0.179 |
| 38 | 13.88 | 20.36 | 762.0 | 754.2 | 0.139 | 0.184 |
| 39 | 13.87 | 20.90 | 756.2 | 757.6 | 0.139 | 0.189 |
| 40 | 13.86 | 21.44 | 750.2 | 760.5 | 0.139 | 0.194 |
| 41 | 12.70 | 21.99 | 741.6 | 763.1 | 0.139 | 0.200 |
| 42 | 13.86 | 22.53 | 731.1 | 765.3 | 0.141 | 0.205 |
| 43 | 13.86 | 23.07 | 720.8 | 767.2 | 0.142 | 0.211 |
| 44 | 13.86 | 23.62 | 710.9 | 768.8 | 0.142 | 0.216 |
| 45 | 13.86 | 24.16 | 701.6 | 770.3 | 0.142 | 0.221 |
| 46 | 13.86 | 24.70 | 692.8 | 771.5 | 0.142 | 0.227 |
| 47 | 13.86 | 16.94 | 684.6 | 759.0 | 0.141 | 0.228 |
| 48 | 13.86 | 17.23 | 677.0 | 746.6 | 0.141 | 0.221 |
| 49 | 13.86 | 17.53 | 670.0 | 734.9 | 0.140 | 0.211 |
| 50 | 13.86 | 17.82 | 663.7 | 724.0 | 0.140 | 0.203 |
| 51 | 13.86 | 18.11 | 658.0 | 714.0 | 0.139 | 0.197 |
| 52 | 13.86 | 18.41 | 652.8 | 705.1 | 0.139 | 0.193 |
| 53 | 13.86 | 18.70 | 648.2 | 697.2 | 0.139 | 0.190 |
| 54 | 13.86 | 19.00 | 644.1 | 690.4 | 0.138 | 0.189 |
| 55 | 13.86 | 19.29 | 640.4 | 684.5 | 0.138 | 0.189 |
| 56 | 13.86 | 19.58 | 637.3 | 679.5 | 0.138 | 0.190 |
| 57 | 13.86 | 19.88 | 634.5 | 675.5 | 0.138 | 0.191 |
| 58 | 13.86 | 20.17 | 632.1 | 672.1 | 0.138 | 0.193 |
| 59 | 13.86 | 20.47 | 630.0 | 669.5 | 0.138 | 0.195 |
| 60 | 13.86 | 20.76 | 628.3 | 667.5 | 0.139 | 0.197 |
| 61 | 13.86 | 21.06 | 626.8 | 666.1 | 0.139 | 0.200 |
| 62 | 13.73 | 13.88 | 629.8 | 664.2 | 0.138 | 0.197 |
| 63 | 13.86 | 13.86 | 633.0 | 662.1 | 0.136 | 0.186 |
| 64 | 13.86 | 13.86 | 636.0 | 659.9 | 0.136 | 0.174 |
| 65 | 13.86 | 13.86 | 638.8 | 658.0 | 0.136 | 0.163 |
| 66 | 13.86 | 13.86 | 641.3 | 656.3 | 0.136 | 0.156 |
