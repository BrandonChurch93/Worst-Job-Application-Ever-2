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

Tube's answer, `src/table/real/frame/loader.ts`: `KNOCK = { px: 2.6, reach: 100, lead: 1/60, over: 6/60, swing: 5/60 }`. At each strike the tube's wall is pushed 2.6 px at the bend, square to the run the ball goes on with (down left at the first, right at the second), less with distance and nothing 100 px away; next frames 0.64, -1.26, -0.84, 0.16 px, then rest. The page gives the seconds since each strike as the ring's third and fourth numbers, for those 6/60 s only. The collars do not move. No sound cue added or moved.

Capture, `src/table/real/ball/index.ts`, `glsl.ts`, and the flag in `src/pages/step3/index.ts`:
- While the shell shuts at the port the page adds a seventh number 1 to the ball's `v`. With it the maker draws the halves as two jaws: whole half balls, `JAWS = { wide: 1.2, deep: 1.25, up: 0.3 }`, each on its side of the seam, 1.2 radii apart times the share open, risen out of the cup's floor by the time the shell is 0.3 shut, with no fade and no hinge. Without the flag the maker draws as before.
- The curve is round 21's own: 16 frames, eased to half shut over 11, then the snap over 5. On the lock frame the seam is shut, the ring gives 3.74 px and springs back, the ball is squeezed, and the ball stands 43 frames (film) before the release.

No part, colour, word, sound or device was added.
