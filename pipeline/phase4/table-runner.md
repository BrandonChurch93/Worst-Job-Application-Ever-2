# Table runner: notes

Owner of the layout, the physics, the director, the take, the acting in the ball, the machine's cameras, the page's screens, the cuts and the two sheets from 03:50 UTC on 2026-11-26. Starts from `pinball-director.md` and `pinball-stage.md`.

## What the approved images show that a quick look misses

1. Highlight: the clear ball carries one small hard window light at its upper left and a long soft rim along its lower right; the cursor inside is lit as a solid of its own, pale ceramic with a dark side wall, never flat white. On the steel the highlight is a thin line along the top edge of a rail, the faces stay dark.
2. Bevel: the cursor's side wall shows as a dark band about a tenth of its length; the flippers have a black rubber band a fifth of their height under the orange; the apron slabs round over about a tenth of a ball.
3. Gap: the gaps (drain slot, firehouse door, between rail and floor) are near black with a cool bounce, and the floor beside every standing thing is darker than the open floor: each thing sits in its own pool of shade, with its own warm lamp spill.
4. Edge: every close image is shot with the focus on the ball alone. A ball's width in front and two behind are already soft, far lamps are discs. The frame's edge is cut by the picture in every image but `table-wide`: the machine is always larger than the frame.
5. Lens: the eye is always lower than it reads at a quick look. `rail-cam` looks along the wire with the wire dead straight up the centre and the ball a fifth of the width; `last-save` has the whole Street soft behind a ball that is a tenth of the width; `youre-fired` has the house two thirds of the width, seen from its front right corner, the ball a seventh of the width in the door; in all of them the cursor stands upright in the ball, facing the lens, more than half the ball long.

## Point 1: where the machine stood at 04:00 UTC (main 4f64ab7, every key and both sheets at draft, hd)

MEASURED, `npm run compare -- --key <id> --tier draft --format hd` (36 to 46 s each; `loader-page` 22 s), each looked at beside its approved image. The three largest differences of each that are mine:

- `table-wide`: (1) the machine is 76% as wide as approved (near end 1463 px of 1920, approved 1920) at the same height: the eye is too high and too far. (2) the highway is a white arc 5.7 balls high and the garage a pale ring as tall, where approved has a low handrail and a low stack of decks. (3) the near end shows its two end posts 3 balls tall with the apron low between them; approved ends in two flush slabs.
- `loader-page`: (1) the port is 1.1 times the approved size by the config (settled). (2) the cursor in the cup is small and dark, approved has it upright and pale in the ball. (3) no difference of place that is mine: the tube leaves down as approved.
- `tier-corporate`: (1) the camera is straight down by the kit and the image is oblique: not fitted. (2) the boardroom is a short slab at the left wall, approved has a long table with chairs across the upper left. (3) the ladder stands over the right slingshot as a loop; approved runs it as a stair from the right slingshot up to the right wall.
- `lobby-doors`: (1) the ball is 1.6 times its approved size and stands in the middle; approved has it a tenth of the width, right of the centre. (2) the tower takes 45% of the width (approved 80%) and the marquee stands lit behind it. (3) the revolving door stands at the left third and is as tall as the frame; approved has it lower, left, with the eye to the left of the carpet.
- `tier-office`: (1) the ball is at the inserts (10.3, 7.0); approved has it under bumper 3 at (10.5, 6.3). (2) the cursor lies flat, points up left and is cracked; approved is upright, face on, clean. (3) the cubicles and the inbox are a third of their approved size.
- `reply-all`: (1) the eye is higher and further: the cups are 0.75 of their approved width and both rails show. (2) the clear ball is right of bumper 3 with the steel balls behind it toward the inbox, as approved, but all four are 0.7 of the approved size. (3) the cursor is face on (good); the inbox is small.
- `tier-street`: (1) the highway is a tall wide arc that crosses the whole upper field; approved has a low rail. (2) the garage is a ring 3 balls across with nothing in it; approved has decks. (3) the ball is below the firehouse at the flap's foot; approved has it right of the firehouse door.
- `youre-fired`: (1) the bank stands in front of the firehouse's left half and takes a quarter of the frame. (2) the house takes 50% of the width, approved 67%. (3) the ball is 1.3 times its approved size and stands on a pale ring (the scoop's rim), approved has it in the dark doorway.
- `rail-cam`: (1) the eye is on the bend: the wire loops across the lower right and no wire runs up the middle. (2) the ball is right of the centre and half hidden by hoops; a red insert takes the lower left. (3) the cursor lies flat across the view; approved has it upright, pointing up right.
- `last-save`: (1) the ball is 110 px, approved 171 px. (2) the eye is 32 degrees down and near: the far half of the Street is cut off, approved shows the whole tier soft to the far wall. (3) the highway's arc and the garage's ring stand tall across the top.
- sheet `table-map`: (1) the side lanes (lift left, launch and feed right) take 3.25 balls each, so the field is 13.5 of 20 balls wide; approved has the field nearly wall to wall. (2) the highway and the garage as above. (3) the boardroom, the cubicles and the inbox are small.
- sheet `clear-ball`: (1) one scene with three balls where approved is three close panels. (2) the first ball rests on the floor beside a paper clip, not on a flipper. (3) the balls are 0.6 of the approved size in their panel.

## Looks and searches

Tuning looks of this round (40 per part): counted below as they are spent. Take searches: 20 of 25 used at the start.

## Moves of things a model stands on (old to new, tier coordinates in balls)

| Thing | Old | New | Owner told |
| --- | --- | --- | --- |
| `table.spiralTurns` (config, NEEDS patch) | 3 | 2 | street_modeller, lamp_keeper, /root |
| `SPIRAL_TOP` | 5.4 | 4.1 | street_modeller, lamp_keeper |
| Garage height (base 1.3 unchanged) | 4.3 | 3.0 | street_modeller, lamp_keeper |
| Highway end height (`HIGHWAY_TOP`, every point scaled by 4.4 / 5.7) | 5.7 | 4.4 | street_modeller, lamp_keeper, frame_keeper reads it from the rail |
| Cubicles box | [3.25, 2.25, 1.8, 2.15] h 0.7 | [3.25, 2.25, 3.2, 1.85] at 04:08, then [3.25, 2.25, 2.6, 1.85] h 0.7 at 04:25 | office_modeller, lamp_keeper |
| `cubicles.drop` bank | u 5.05, v 2.25 to 4.4 | u 6.45 at 04:08, then u 5.85, v 2.25 to 4.1 | office_modeller |
| `cubicles.roof` guide | (3.25, 1.75) to (5.25, 2.25) | (3.25, 1.45) to (6.65, 2.25), then to (6.05, 2.25) | office_modeller |
| `drain-label` seat | 7 px | 6.3 px (frame_keeper's number) | frame_keeper |
| `apron-card-words` seat | slab + 2 | slab + 1.3 (frame_keeper's number) | frame_keeper |
| Inbox box | [15.2, 3.6, 1.55, 1.2] h 0.9 | [15.2, 3.6, 1.55, 1.45] h 1.15 | office_modeller, lamp_keeper |
| Boardroom box | [3.25, 2.5, 1.2, 1.9] h 0.9 | unchanged (launch lane lets the ball out at u 5.3 and needs u 4.8 to 5.8) | corporate_modeller, /root |

## The play (04:20 UTC)

- The tow to the highway flap is gone. The firehouse kicks the ball down its own side at (1.4, 4) balls a second at 29.0 s (was (10.5, 9) at 28.5 s), the ball rolls down the left inlane onto the left bat, and one flip sends it up into the flap. MEASURED `npm run take -- --check`: ramp-roll at 30.27 s, 10 of 10 events inside their beats, the director brought the ball in 1 time (the inbox at 19.1 s), 7 bumper hits in Coffee, the save a flip, the ball on a flipper at `last-save`, 0 hits beside a cut, placed at 2 of 3 keys (reply-all, tier-street).
- The cut out of `table-fired` moved from 28.8 to 29.3 s so the kick at 29.0 s is seen from the close camera and is 0.3 s clear of the cut.
- The ball on the highway slows as it climbs (the speed falls in a line to 2.2 balls a second at the crest) and gathers speed down the garage (to 8.5 at the foot). Both were one even speed.
- The pull that sets the ball for the `tier-office` key is 14 (was 30, stronger than the slope's 29.4 and seen as a brake).
- Office flash: MEASURED `npm test` (`tests/table-lights-strobe.test.ts`): Coffee 6 flashes in 4 s, most in one second 3, shortest gap 0.346 s; Reply All 4 flashes, most in one second 3, gap 0.400 s.

## Looks and searches (counted)

- Take searches: 21 of 28 (25 and three bought by the layout change). Search 21 ran from 29 s (`--allow 28 --from 29`) and kept run 2.
- Tuning looks: one draft compare per key and sheet at the start (12), counted as one per part in the table below as they are added to.

## Second push (04:37 UTC, 32ba1b7c)

### The take

- The cubicles at 3.2 balls wide held the Coffee rally in the top left corner: MEASURED at the `tier-office` key (17.4 s) the ball sat on the cubicle roof. The box is 2.6 wide now and the bank stands at u 5.85.
- Searches 22 and 23 ran from 15 s (`npm run take -- --allow 28 --from 15 --runs 40`); 23 kept run 27. Searches used: 23 of 28.
- The score of a run in `tools/take.mjs` now pays 300 for a save by a flip, 40 for each Coffee bumper hit up to 8 and takes 60 for each time the director brings the ball in (was 40, 4 and 15), so a search prefers play to tows.
- MEASURED `npm run take -- --check`: 10 of 10 events inside their beats; the director brought the ball in 3 times (the inbox 19.1 s, the Office gate 25.2 s, the firehouse 27.2 s); 4 bumper hits in the Coffee beat; the save a flip; the ball on a flipper at `last-save`; 3 of 3 other keys placed; 0 hits within 0.15 s of a cut; ramp-roll 30.27 s by a flip.
- MEASURED in the whole `npm test` (`tests/table-lights-strobe.test.ts`): Coffee 5 flashes in 4 s, most in one second 2, shortest gap 0.392 s; Reply All 8 in 7 s, most in one second 3, gap 0.400 s.
- `T`: scoopKick 29.0, flapOn 29.4, flapBy 31.2, highwayEnd 33.0 (was 32.7), spiralEnd 34.45 (was 34.6).

### The cameras (old to new, page balls; fov and key times unchanged, no NEEDS patch)

| Camera | Old eye, target | New eye, target |
| --- | --- | --- |
| `table-wide` | as the first owner left it (machine 76% of the frame width) | eye (MID, APRON_Y + 16, 13.3), target (MID, Y2 + 7.25, 3.9) |
| `table-lobby` | ball 1.6 times approved, centred | eye (MID + 0.35, Y0 + 9, -0.5), target (MID - 0.55, Y0 + 5.02, 0.35) |
| `table-replyall` | cups 0.75 of approved | eye (MID, Y1 + 15.34, 12), target (MID, Y1 + 6.6, -2) |
| `table-fired` | house 50% of the width | eye (7.25, Y2 + 7.45, 0.95), target (4.6, Y2 + 3.5, -2) |
| `table-save` | 32 degrees down, ball 110 px | eye (MID, Y2 + 16.7, 4.8), target (MID + 0.15, Y2 + 10.71, -0.5) |
| `rail` | on the bend, beside the ball | 3 balls ahead of the ball along the rail's plan, 2.3 over the higher of the ball and the rail under the eye, target 0.7 over the ball; `LENS.rail` 6 to 9 |

- The three tier cameras are the `home` camera: not fitted.
- The cursor faces the lens in every low camera (`FACE.over` 0.94, `low` 0.82, `turn` 0.9, were 0.766, 0.574, 0.75) and lies flat only under the tier cameras.

### The displays (ball_keeper's list)

- `display.<tier>.score` and `marquee-score` carry `v = [seconds since the score last changed (at most 9), the score before the change]`.
- `display.<tier>.<mode>` carries `v[0]`, seconds since the mode was lit.
- `display.hint` (part `displays`, `v[0]` seconds shown) is drawn only in live play, on the sealed table, in the first 8 s after the ball is on the table and only until the visitor has flipped once. DECISION: the film never shows it.

### Counts

- Take searches: 23 of 28.
- Tuning looks, `table-cameras`: 12 first compares, 10 draft stills (rail-cam 4, last-save 2, youre-fired 2, table-wide 1, lobby-doors 1, reply-all 1; one more of each is the review still): 22 of 40. `table-layout` 0, `table-physics` 0, `director` 0, `acting-pinball` 0 beyond those.
