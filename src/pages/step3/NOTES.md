# Step 3, the pinball machine: decisions

Phase 2, engine and blockout. Everything here is a stand-in shape with working logic.

## Where things are

- `src/table/layout.ts`: the machine as data, in balls (one ball is `table.ballPx`). Walls, posts, models, bumpers, slings, targets, inserts, flippers, holds, rails, openings, displays, lamps.
- `src/table/physics.ts`: the `Machine`. One physics world for the three boards, stepped at `sim.stepHz`. No drawing. `save()` holds the world's snapshot as base64 and the rest as plain numbers.
- `src/table/draw.ts`: the stand-in shapes of the machine.
- `src/pages/step3/index.ts`: the page, the director, the cameras, the film script, the sheet.
- `cut/TABLE-TAKE.json`: when each flipper is held in the film. Written by `npm run take`, read by the film script.

## The page, top to bottom (px)

- 0 to 1080: the first screen, laid out as `loader-page.png`. Heading, subline and the paragraph `copy:transitions.step3` in the left column (wrap 600, three lines of 34), the loader port at the right content edge (ring 330, cup 220, centre 1627, 520: its right edge is the content edge 1792). The feed tube leaves the port's foot and runs straight off the bottom of the screen.
- 1080 to 1464: the marquee, 4 balls tall, as wide as the playfield.
- 1464, 2544, 3624: the three tiers, 1920 x 1080 each, floors at -96, -192, -288.
- 4704 to 4896: the apron, 2 balls deep: two ceramic slabs, the drain plate between them with `copy:step3.table.buildings.drain`, and the card `copy:step3.table.apronCard` on the right slab.
- 4896 to 5976: the last screen. The outlet port stands on the left content edge (its left edge is 128), the result card and its button share one left edge at 560 and the card ends on the right content edge.
- No word stands on or beside an insert. The kit: an insert carries a picture and no words. The name of a mode's insert and its line are shown by the display of its tier: the page gives the text `display.<tier>.<mode>` (the line, state `mode<mode>`) with `v[0]` the seconds since the mode was lit, and the text `display.<tier>.<mode>.insert` (the name, state `name<mode>`) for the first 1.5 s (`NAME`, the hold of the displays).

## The tier

- Columns in balls: left rail 0 to 1.55, lift tube 1.55 to 3.05, playfield 3.25 to 16.75, launch lane 16.95 to 18.45, right rail with the feed tube 18.45 to 20.
- Flippers 3 balls long, tips 1.5 balls apart. Outlanes 1.4 balls wide. Every listed opening clears `table.minClearanceBalls`.
- The lower corners are solid shoulders. They carry the display on the right and the houses.
- The garage, the ladder and the highway stand on supports and are not obstacles on the floor.

## The ball

- On a floor it is a body in the physics world. On a rail, in a hold or towed it is moved by the machine and its body is switched off.
- Speed on a floor is capped at 30 balls a second.
- A ball that leaves a tier any other way than its exit is put into that tier's exit and the machine reports `escape`. `npm run paths` counts those.

## The director

- One clock for film and live. In the film it equals the unit's time. In live it waits at 2.4 s until the ball is sealed, then runs the same script.
- Each beat has a place the ball must reach, a pull towards it and a last moment. At the last moment the ball is towed there. So every beat event falls in its beat whatever the flippers do.
- Each tier's exit is closed until that tier's beats are over. A ball that reaches a closed exit is kicked back up the middle.
- `bumper` is emitted for the applicant's ball during the Coffee beat only. Bumper hits at other times and hits by steel balls emit `flasher`.
- `flipper-save` is emitted when a flipper is pressed with the ball over it during the Save beat. If nobody flips, the kick from the closed exit emits it once.
- The loader pulls the cursor in from a distance that grows with time, so a still pointer is sealed about 6 s in. It does not pull in the first 0.8 s, while the page is still arriving.
- `skip()` puts the ball on the drain rail and plays the ending. Without a press the result card moves on after `live.idleSeconds`.

- After the doors open they stay open: the ball is flattened once.

## The paths test

- `npm run paths` drops 48 seeded balls on each tier, half with the flippers played for 15 s and then left alone, and sends one ball down every rail. Every gate is open and Mom's hatch works.
- A rail's entry and exit must name a hold, an opening or a rail of the layout, and the rail must pass within one ball of it.
- A ball that is still on the table after 45 s counts as a problem.
- First try: 12 problems. Two were balls the test had dropped inside the solid shoulders under the flippers. Ten were balls a perfect flipper player kept alive past the time limit by way of the revolving door. Second try, with the drops kept out of the shoulders and the player stopping after 15 s: all clear.

## The take

- `npm run take` runs one search of 24 seeded players. A player presses a flipper when the table's hint says the ball is over it, with a hold time, a delay, a rest time and a chance to let it pass, all drawn from the seed. The flips of the best run are written to `cut/TABLE-TAKE.json`.
- A run is kept only if every beat event is inside its beat. Among those the score prefers fewer balls brought in by the director, a save made by a flip and more bumper hits.
- The state of a search is kept in `out/work/take-search.json`, so a stopped search goes on where it stopped. After `quality.takeSearchMaxRuns` searches the command only replays the kept take.
- All three searches are used. Search 1 ran with a fault in the hint for the right flipper and kept 3 flips. Search 2 ran after the fix and kept run 8 with 10 flips. Search 3 found nothing better.
- Search 4 was allowed by the Builder (10:03 UTC) for one thing: the key `last-save` at 35.5 s must show the ball caught by a flipper. `npm run take -- --allow 4 --from 34` keeps the eight flips before 34 s as they were and searches only the flips after. A run earns more when the ball is on a flipper at 35.5 s. Kept: run 5, 9 flips, the last one the right flipper at 35.53 s.
- For this the ball leaves the spiral 0.4 s later (`T.spiralEnd` 34.2 to 34.6). What moved: `flipper-save` 35.12 s to 35.53 s, `drain` 38.52 s to 37.88 s. The other eight events did not move. All ten are inside their beats.
- `npm run take -- --check` also says whether the ball is on a flipper at the key.

## Needs

- `tests/step2.test.ts` waited 3 s after a skip and then expected the cursor not to be taken. With a real step 3 behind it the keen bot is in the loader by then, and at 17 s it has already left step 2. `NEEDS.patch` makes that test look at the cursor when step 3 is reached, and only when the skip was made on step 2. It is on this branch as three commits whose subjects start with `NEEDS:` (`e6bdc26`, `dc75257`, `49f63e7`), because the first two were not enough. Do not merge a commit of this branch before `49f63e7`.

## Cameras

Lengths in balls, page coordinates, z up from the page surface. `look(name, eye, target)` builds a pose; the lens is `cameras.<name>.fovDeg`.

- `tier-3`, `tier-2`, `tier-1`: the home camera moved down the page to the tier, at home's distance from its floor, home's lens, sharp edge to edge. Not fitted. `tier-1` is 0.95 balls lower and 5% further so the apron edge is in the frame.
- `table-wide`, lens 43: eye (MID + 0.35, APRON_Y + 12.4, 11.22), target (MID + 0.35, APRON_Y - 9.24, 0.85). Solved from the approved image: near frame corners in the bottom corners, far frame end 23% from the top, 25.6 degrees down. The 0.35 to the right takes in the launch lane and the feed tube, which make the machine wider on the right than the approved one.
- `table-lobby`, lens 56: eye (MID + 2.65, Y0 + 6.43, -0.35), target (MID - 0.13, Y0 + 5.31, 0). 0.65 ball above the Corporate floor, from the right of the carpet. From the front the revolving door (on the carpet axis, in front of the doors hold) covers the ball.
- `table-replyall`, lens 30: eye (MID, Y1 + 16.35, 15.4), target (MID, Y1 + 6.3, -2). The whole Office tier from the player's end, 30 degrees from straight down.
- `table-fired`, lens 35: eye (7.25, Y2 + 7.68, 0.06), target (4.8, Y2 + 3.75, -2.3). Front right of the firehouse, 27 degrees down, 5.2 balls away. The approved image has the ball inside the garage mouth; in the build the scoop lies half a ball in front of the building, so the ball stands before the mouth.
- `table-save`, lens 40: eye (MID, Y2 + 13.4, 6.05), target (MID, Y2 + 8.6, -2.26). Over the apron, 60 degrees down. Not flatter: the Street floor is 3 balls under the apron edge and a flatter view loses the flipper tips behind it.
- `rail`, lens 40: 1.9 behind the ball along its rail, 3.9 above it, looking at a point 1.0 ahead and 1.0 under the ball: 59 degrees down, so the floor fills the frame and the tier's side wall stays out of it (the highway runs across the tier, the wall is 6.5 balls ahead). The heading is the chord of the rail from 1.6 behind the ball to 2.2 ahead. The point it follows is a smoothed copy of the rail (seven samples 0.4 apart, weights 1 2 3 4 3 2 1), never the raw path.
- `ride`: the rail camera's rule up the launch lane, 0.7 behind and 2.6 above at the plunger with a 76 degree lens, opening to 3.4 behind, 3.4 above and 40 degrees over the first 7 balls.
- The lens: every close camera (`LENS`) carries `focus`, the distance in page px from the eye along the view axis to the centre of the cursor's ball on that frame (`table-wide`: to its target), and `aperture`, the width of the opening in page px. Blur circle on screen in px = aperture x |d - focus| / d x (H / 2 / tan(fov / 2)) / focus. Apertures, tuned on pictures with the engine's lens: `table-wide` 8, `table-lobby` 7, `table-replyall` 12, `table-fired` 10, `table-save` 9, `rail` 7, `ride` 7. The tier cameras and `follow` carry none.
- Shake: the film camera's target is pushed sideways on a hard hit (`HARD`: bumper, sling, doors-slam, scoop-kick, plunger, ball-hit, drop-target, mom-save, ball-save). It reads the machine's own table of last events and its step count, so it is a pure function of the state. Size 0.6% of the frame's height for a hit of weight 1, 23 Hz, gone by half its size every 0.06 s, nothing after 0.5 s, never more than 0.9% of the height. Live mode has no shake: the visitor is aiming.
- The film (`FILM`: time, camera, seconds of move). A close view is entered by a cut, never a blend: a blend was half way through its move on the hit. Two moves only: `ride` to `tier-3` (0.6 s, the ball arrives on the table) and `rail` to `follow` (0.6 s). No cut within 0.15 s of a hit: `tests/pinball-stage.test.ts`.

| At (s) | Camera | Why there |
| --- | --- | --- |
| 0 | follow | the seal and the tube, the view goes down the page with the ball |
| 4.2 | `table-wide` | lights down at 4.0, power on at 5.2: the wake is seen whole |
| 8.5 | `ride` | the ball is on the plunger from 8.3, launched at 9.4 |
| 10.6 | `tier-3` | the ball is in the top arc of the launch lane; the move (0.6 s) is over before the first `sling` (11.25) |
| 13.0 | `table-lobby` | 0.3 s before `doors-slam` (13.31) |
| 14.3 | follow | the doors have opened (14.1), the flippers are needed |
| 19.5 | `table-replyall` | the ball is in the inbox (`inbox-take` 19.0), before the first `ball-drop` (20.8) |
| 22.2 | follow | the multiball is in play |
| 27.2 | `table-fired` | the ball is in the firehouse, the `scoop-kick` is at 28.5 |
| 28.8 | follow | after the kick |
| 31.15 | `rail` | the ball is on the highway wire from `ramp-roll` (31.05); a cut before it would jump when the ball takes the wire |
| 32.3 | follow | a move of 0.6 s up to the home view, over before the spiral (32.7) |
| 34.3 | `table-save` | the ball comes down to the flippers, `flipper-save` at 35.6 |
| 36.6 | follow | the drain and the way out |

- Live mode: the view is `follow`, the tier camera of the tier the ball is on, travelling in `live.pinball.tierTravelSeconds`. No close view in live mode yet.
- The site sets a camera's near plane 1500 px in front of its target, so a fixed pose keeps its target within 1500 px of the nearest thing it must show.
- While the ball is at the plunger or low on the feed rail the follow camera scrolls 2.4 balls further down, so the knob is in the frame.

## What shows the state

- Power on: the marquee title and the score appear, the tiers wake one after the other 0.35 s apart, each tier's inserts flash for 0.6 s, the lamps go from the pocket tone to the light tone and grow. A display shows only when its tier is awake.
- The plunger rod and knob draw back between 8.3 s and 9.4 s and snap forward at the launch.
- Inserts sit at 8.35, 10 and 11.65 balls across (6.2, 7.35 and 6.2 down), clear of the raised flippers, the slings, the revolving door and the third bumper. Their labels are 18 px and stay readable under a raised flipper.
- At the outlet the cursor stands on the port (28 px up, through `cursor.setGround`), lies flattened for half a second, peels up and walks to the button. The film's pointer waits at the outlet until then.

## Sheets

- `table-map`: straight above, 1080 x 1920, the page's full width across the frame (20 balls), from 0.35 balls above Tier 3 down into the apron. The marquee is not in it: the approved map is the three tiers and the apron inside the frame.
- `clear-ball`: three balls on the Office tier in one close, low view with the lens of `table-fired`, left to right as the approved sheet has them: at rest on the left flipper (`nervous`, the sweat is the cursor's), in flight half a ball above the floor (`scared`), pressed on the lowest bumper (`shocked`, `flattened`). The places are computed from the flipper's pivot and the bumper's centre, so they follow the layout. The approved sheet is three separate pictures side by side; a sheet has one view, so this is one picture.

## Open

- The models are boxes. Signs are type on top of the boxes.
- Lights down and power on change no light yet: the blockout has no dusk.
- The ball's tone `glass` renders opaque in the blockout. That is the shell's view and stays. The cursor is placed at the ball's centre, so the blockout draws it on top of the ball.
- The merge commit `71827b8` has no trailer. It was pushed before this was seen and history is not rewritten.

## Round 1 measures (10:40 to 10:55 UTC)

- M4: each insert label now lies on a paper plate 3 px above the tier floor, dark ink, the same in every state of the insert. MEASURED: least contrast 5 against 4.5.
- M7 places: a table event is emitted at the point of the page plane that the camera of that step sees the ball through, not at the ball's own x and y. The tier floors lie one to three balls under the page plane and the stage places an event at height 0, so the plain x and y landed up to 769 px from the ball in the picture (scoop-kick under the rail camera blend). A height in `io.emit` would be the clean fix: that is the stage's.
- M7 changes: every bumper strike calls `cursor.react('flinch')`; the scoop kick, a steel ball striking the cursor's ball and the gate save call `cursor.react('recoil')`. The doors keep `hurt('flattened')` and `act('shocked')`. The ball's path does not read the cursor: `npm run take -- --check` is unchanged.
- Parts: flags `model-coffee-machine`, `model-moms` (the register's names). New flags on stand-ins: `model-revolving-door` (glass disc and post), `model-ladder` (the ladder rail), `model-notes` (the three standups), `model-wedges`, `model-staplers`, `model-road-signs` (the slings of tier 3, 2, 1). `npm run parts -- --check` exits 0.
- Live run on main 89fe48f in the repo's headless browser at 1280 by 720: the alternating left click and right Shift reached step 4 in 205 s of wall time (software drawing), 257 flips, no page error. A second run held each input for 0.6 s on the Corporate tier and compared pictures: left Shift and the left button move the left flipper, right Shift and the right button move the right flipper.

## Blockout round 1, the six camera issues (11:05 to 11:25 UTC)

1. Launch: a new film camera `ride` from 8.5 s to 11.0 s. It is the rail camera's rule (behind the ball along the chord of its rail) with its own distances: 0.8 balls behind and 4.4 above while the ball waits on the plunger, opening to 3.4 behind and 3.4 above over the first 7 balls of the lane. One move, no tier view inside the beat.
2. Rail: the rail camera now hands back to the home camera at 32.2 s (was 33.0), before the ball enters the spiral, so at 32.83 s the frame is the tier from home with every sign whole. The key `rail-cam` (31.75 s) is unchanged.
3. Lobby: `table-lobby` is low again, from the south-east: eye (MID + 3.6, 8.9, 1.3), target (MID + 0.1, 4.5, 0.6). The ball is at the doors with the right door post clear, the revolving door to its left; the tower runs out of the top as in the approved image. The revolving door's glass disc is drawn at radius 0.45 so it does not cover the ball. Differs still: the left door post stands behind the revolving door's post; the Corporate HQ sign is on the roof of the box and is not seen from this low.
4. Save: `table-save` eye (MID, 13.8, 6.9), target (MID, 7.7, -3). It cannot be lower: the tier floor lies 3 balls under the page, and a lower eye loses the flippers behind the apron edge. The frame holds both flippers, the ball, the slings, the three inserts, Mom's Basement and the Unemployment Office plate whole, and ends above the apron card's words.
5. Tier 1: `tier-1` is the home camera 0.95 balls lower and 5% further, so the apron edge and the Unemployment Office plate are in the frame. MEASURED M6: 3.75 px from the cursor's size, 6 allowed. The note of `cameras.tier-1` in the config still says "the tier filling the frame": told to the Builder.
6. Map: the frame runs from 0.3 balls above the marquee to 2.6 balls under the apron line with a 4% margin, and the parts of the feed and drain tubes that leave the machine are left out of the map.

## Blockout round 2, the six issues (11:55 to 12:20 UTC)

1. Save: `table-save` eye (MID, Y2 + 12.4, 3.1), target (MID, Y2 + 7.9, -2.26), lens 62 degrees (config, was 35). The eye is 3.1 balls above the page, was 6.9. Both flippers and the ball are large in the lower middle, the Unemployment Office plate lies on the bottom edge. The right flip is at 35.527 s: at 0.53 of the beat (35.59 s) the flipper is up with the ball on it, at 0.5 it has not struck yet. The key `last-save` wants `at` 0.53: told to the Builder. The well is 3 balls deep, so the view stays about 50 degrees down: lower loses the resting flippers behind the apron edge.
2. Lobby: the doorway of Corporate HQ is drawn: a dark opening, two leaves and a paper plate above with `copy:step3.table.buildings.hq`. The leaves stand open, square to the face, until `doors-slam` (13.31 s) and are shut after it (state field `shut`). Drawn only, no collider. `table-lobby` eye (MID + 3.25, Y0 + 10.65, 0), target (MID + 0.15, Y0 + 4.6, 0.5): on the carpet, the tower leaves the top of the frame. The key `lobby-doors` (13.8 s) is after the slam, so it shows the leaves shut behind the ball. The revolving door's post overlaps the ball's left edge: it stands where `settled` puts it.
3. Wide: the marquee board stands up, turned 55 degrees on its lower edge, with a stand under it. Title and score are the same layout text, stood up with the board. `table-wide` eye (MID, APRON_Y + 20, 17.5), target (MID, APRON_Y - 6.43, 3.3): the board is whole above the tower. `table-map` still holds the whole machine with the board inside the frame.
4. Street card: the follow camera's scroll on tier 1 is the tier's top plus 0.95 balls (`STREET`), the same as `tier-1`, so the commentary card is whole in both with about one ball under it. MEASURED M6: 3.75 px, 6 allowed.
5. Rail: the ball was on the highway rail at 31.75 s, but the ramp was drawn as one wire under the ball. The highway and the ladder are now drawn as two rails 0.36 balls to each side of the path with cross ties. Drawn only: the collider and the path are as they were.
6. Launch: `ride` is 0.7 balls behind and 2.6 above the page at the plunger, looking 0.95 balls ahead with a 76 degree lens, opening to 3.4 behind, 3.4 above, 2.5 ahead and 40 degrees over the first 7 balls of the lane. The lens of the pose is set in code (`wide`), not in the config. The lane runs up the frame from the first frame of the hold.
