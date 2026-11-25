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
- The loader pulls the cursor in from a distance that grows with time, so a still pointer is sealed about 6 s in.
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

## Needs

- `tests/step2.test.ts` waited 3 s after a skip and then expected the cursor not to be taken. With a real step 3 behind it the keen bot is in the loader by then. `NEEDS.patch` makes that test look at the cursor when step 3 is reached.

## Cameras

- `tier-1`, `tier-2`, `tier-3`: the home camera moved to the tier, at home's distance from its floor.
- `table-wide`, `table-lobby`, `table-replyall`, `table-fired`, `table-save`: fixed poses, set by eye against the approved images. To be refitted when the models exist.
- `rail`: above and behind the ball, looking a little ahead.
- `film`: a list of times and camera names, blended over 0.6 s.

## Open

- The models are boxes. Signs are type on top of the boxes.
- Lights down and power on change no light yet: the blockout has no dusk.
