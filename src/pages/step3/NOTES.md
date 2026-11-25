# Step 3, the pinball machine: decisions

Phase 2, engine and blockout. Everything here is a stand-in shape with working logic.

## Where things are

- `src/table/layout.ts`: the machine as data, in balls (one ball is `table.ballPx`). Walls, posts, models, bumpers, slings, targets, inserts, flippers, holds, rails, openings, displays, lamps.
- `src/table/physics.ts`: the `Machine`. One physics world for the three boards, stepped at `sim.stepHz`. No drawing. `save()` holds the world's snapshot as base64 and the rest as plain numbers.
- `src/table/draw.ts`: the stand-in shapes of the machine.
- `src/pages/step3/index.ts`: the page, the director, the cameras, the film script, the sheet.
- `cut/TABLE-TAKE.json`: when each flipper is held in the film. Written by `npm run take`, read by the film script.

## The page, top to bottom (px)

- 0 to 1080: heading, subline, the paragraph `copy:transitions.step3`, the loader port at the right content edge (ring 330, cup 220, centre 1627, 520).
- 1080 to 1464: the marquee, 4 balls tall, as wide as the playfield.
- 1464, 2544, 3624: the three tiers, 1920 x 1080 each, floors at -96, -192, -288.
- 4704 to 4896: the apron, 2 balls deep, with the drain plate, its label and the card.
- 4896 to 5976: the last screen, with the outlet port on the left content edge, the result card and its button.

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

- `tier-1`, `tier-2`, `tier-3`: the home camera moved to the tier, at home's distance from its floor.
- `table-wide`, `table-lobby`, `table-replyall`, `table-fired`, `table-save`: fixed poses, set by eye against the approved images. To be refitted when the models exist.
- `rail`: above and behind the ball, looking a little ahead.
- `film`: a list of times and camera names, blended over 0.6 s.
- The site sets a camera's near plane at 1500 px in front of its target, so a fixed pose keeps its target within 1500 px of the nearest thing it must show. `table-wide` lost the Street tier until its target was moved toward the eye.
- The wells are deep (the Street floor is 288 px down), so a low camera cannot see the flippers. `table-save` is steep for that reason.

- `table-save` shows the whole Street tier from above the apron, so the flippers, the inserts and the drain are in one picture.
- Film order: follow, `table-wide` at 4.2 s, follow at 8.2, `tier-3` at 11.2, `table-lobby` at 13.0, follow at 14.3, `table-replyall` at 20.6, follow at 22.6, `table-fired` at 27.2, follow at 28.8, `rail` at 31.0, follow at 33.0, `table-save` at 34.3, follow at 36.6.
- While the ball is at the plunger or low on the feed rail the follow camera scrolls 2.4 balls further down, so the knob is in the frame.

## What shows the state

- Power on: the marquee title and the score appear, the tiers wake one after the other 0.35 s apart, each tier's inserts flash for 0.6 s, the lamps go from the pocket tone to the light tone and grow. A display shows only when its tier is awake.
- The plunger rod and knob draw back between 8.3 s and 9.4 s and snap forward at the launch.
- Inserts sit at 8.35, 10 and 11.65 balls across (6.2, 7.35 and 6.2 down), clear of the raised flippers, the slings, the revolving door and the third bumper. Their labels are 18 px and stay readable under a raised flipper.
- At the outlet the cursor stands on the port (28 px up, through `cursor.setGround`), lies flattened for half a second, peels up and walks to the button. The film's pointer waits at the outlet until then.

## Sheets

- `table-map`: the machine from above in 1080 x 1920.
- `clear-ball`: three balls on the Office tier: at rest on the left flipper, in flight, flattened beside a bumper.

## Open

- The models are boxes. Signs are type on top of the boxes.
- Lights down and power on change no light yet: the blockout has no dusk.
- The ball's tone `glass` renders opaque in the blockout. That is the shell's view and stays. The cursor is placed at the ball's centre, so the blockout draws it on top of the ball.
- The merge commit `71827b8` has no trailer. It was pushed before this was seen and history is not rewritten.
