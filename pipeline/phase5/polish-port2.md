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
