# pack-whole: the packs of round 24

Branch `agent/pack-whole`, from `664bedb5`. Owner of this note: the fix agent of the packs. Every fact is MEASURED (the command is given), STATED (read in a file) or UNKNOWN.

## What was read and measured first

- How the plan made sheets from runs (STATED, `tools/lib/pack-site.mjs` at `664bedb5`, `motionPlan`): a moment was a run of `count x sheets` frames two steps apart; when the files passed `critics.maxFilesPerMessage` the plan cut runs down to one sheet in a fixed order, wrote a line into `limitTook` and left the heading as it was.
- `limitTook` of round 23 (MEASURED: `node pipeline/phase5/pack-whole-walk.mjs /tmp/run-base.json` on `664bedb5`, then the old plan on that run): "turn: sheet 1 of 2 of its run (0:10.43 to 0:10.80)", "flippers: its second run, the ball leaves the port (1:38.55 to 1:38.92)", "save: sheet 2 of 2 of its run (1:59.62 to 1:59.98)". Three headings said more than their frames held.
- The page turn in steps (STATED `src/stage/stage.ts`, `src/stage/turn.ts`; MEASURED in the rows, turning 597 to 656, the new page from 627): 30 steps to leave, 30 to arrive. From the page on its edge: seated at step 18, pressed flat 2 steps, a knock of 8 degrees for 4 steps and one of 2 degrees for 3, the slab flat from step 27, the loose things quiet from step 31. The visitor's pointer first moves at step 41 (row 668).
- Between two tiers of the machine (STATED `src/pages/step3/index.ts`; MEASURED in the rows by `fallsOf`): a camera's travel, no cut. The page's scroll eases to the next tier while the ball rides the chute. Tier 1 to 2: steps 6588 to 6631 (44 steps, scroll 1464 to 2535 px). Tier 2 to 3: 46 steps (7182 to 7227 with the old visitor, 7423 to 7468 with the new). No frame of the visit holds the whole machine: one tier fills one screen.
- The save on `664bedb5`: the page tells of no `ball-save` as a hit, so the save is read from the ball's path; `gate-take` and `ball-save` are read from the hits when the page says them.

## Decisions

1. Nothing is taken away. `motionPlan` returns groups: one group while one message holds the sheets, else `pages` (walk, turn, hit, key, taken, given back) and `machine` (the seal, the ball port, the stroke, the save). A set is cut only between runs. `limitTook` stays in `pack.json`, empty, and `tools/pack.mjs` prints it, and prints for each set its files in order with their headings.
2. Every heading starts "Consecutive frames, 1/30 s apart," and is made from the sheet's own frames: which sheet of how many, which frames of the run, the times of its first and last frame.
3. The turn: one run from `TURNS.lead` (2) steps before the old page moves to `TURNS.still` (4) frames after the last thing on the new page has stopped (`TURNS.quiet`, 31 steps after the edge). Here 36 frames on 3 sheets. Each sheet says what it holds, from the rows: the old page flat, swinging away, the edge and its time, the closing, the seat and its time, the stop and its time, how many frames come after the stop, and that the pointer does not move, only where the rows show it still.
4. The save: found by the page's words (`ball-save`, `flipper-save`, with `gate-take` for the take) or by the path: the ball was low in the mouth (`SAVE.low`, 10.3 ball widths down the tier, within `SAVE.across` of the middle) the step before, and three steps later it is out of the mouth higher up the same tier. A blow of a bat on a ball over the bat is no save any more (with the new visitor the old finder took five strokes for saves, see below). The run starts 4 frames before the take and ends 4 or more after the kick, on 1 or 2 sheets. One fixed window (`saveWindow`): centred on the middle, lower edge on the tier's floor, the tile at 100% when the gate and both bats at rest and raised fit with half a ball round them (they do), smaller only when they do not. The heading: "as the machine saves a ball lost between the bats, one fixed window on the mouth, its gate and both bats at N% of its size", then when the ball is low in the mouth and when it goes back up, then the legend of L and R. Nothing of what strikes or throws.
5. The key: under each frame `down` while the page has the visitor's button down (picture i is the page before the events of step i, so it shows the button of row i - 1). The run starts 3 frames before the press and ends 4 or more after the release. The heading says from which frame to which the button is held, and a second press inside the run is said too. The hit sheet says "the visitor presses no button and no key in these frames" only when `handsOff` finds no button, no flipper and no key in its rows.
6. The flippers: the visitor of round 23 pressed 11 steps after the page's cue, as it does everything. Now it presses a flipper `FLIPS.reactSteps` (2) steps after the cue and holds it `FLIPS.holdSteps` (10) steps at least. Both sheets of the stroke say so in numbers. The stroke shown is one pressed with the ball within the bat's reach when the run holds one.
7. The tiers, for R5: one sheet after the visit's sheet of the machine page, the tenth file. For each fall of the camera from a tier to the next, 6 whole frames at one even step, here 12 steps (0.20 s): 10 steps would end before the travel does (it is 44 and 46 steps long), so the step is the least even number that puts the first frame one step before the travel and the last after its end. The heading names the frames and the times of the travel and nothing else.
8. `MACHINE`, `REACH`, `TURNS`, `FLIPS`, `KEYS`, `TIERS`, `FALLS`, `SAVE` are numbers of the pack, each named in `tools/lib/pack-site.mjs` with a line saying what it is. `tests/pack-whole.test.ts` holds `MACHINE` and `TURNS` against `src/table/layout.ts` and `src/stage/turn.ts`. `MACHINE.gateV` (10.55) and `MACHINE.pinV` (11.10) are the new save's numbers as the Builder gave them (STATED); on `664bedb5` the old save puts the ball at the same 10.55.
9. No change outside my files. No `NEEDS` patch.

## What the first pictures showed, and what was changed for it

MEASURED: `npm run -s pack -- --phase 5 --round 24 --unit site --role R4` at `8bd32318`, exit 0, 560 s, 14 files in two sets; every sheet looked at.

- The turn, sheet 3 of 3: the heading said "The visitor's pointer does not move in these frames", and in the frames the arrow travels from the middle of the page to the left from 0:10.97. Both are true: in the rows the visitor's pointer lies at (360.7, 472) until step 668, and the page holds its arrow at (960, 540) through the turn and lets it run to the pointer from step 658, the frame of the stop. The heading now tells the two apart: "The visitor does not move the mouse in these frames, the page's arrow moves from 0:10.97".
- The hit sheet: its rows hold no button, no flipper and no key of the visitor (`handsOff` true), and in the frames 0:14.98 to 0:15.05 the key under the arrow lies pressed after the bolt's hit. "no key is pressed in these frames" read false against the picture, so the heading now says what the rows know: "the visitor presses no button and no key in these frames".
- The key sheets: the key under the arrow is down in the first frame marked `down` (0:15.68) and up again by 0:15.82, while the button is held until 0:15.88: the page's key is a short dip, not a hold. A bolt hits the arrow at 0:16.10 inside the run and the key under it dips with no button held. The heading now says the hit with its time.
- The save: the ball sinks under the tier's floor before the old save throws it back (its lower edge at 11.46 ball widths, the floor at 11.25), and the window's lower edge lay on the floor, so the ball was cut in the frame 2:17.98. The window's lower edge now goes down to the ball's lowest edge in the run and a quarter ball more. It is still one window for the whole run.

## The flipper presses of the pack's visitor (point 4 and 6)

MEASURED: `node pipeline/phase5/pack-whole-walk.mjs RUN.json` then `node pipeline/phase5/pack-whole-presses.mjs RUN.json`.

| visitor | presses in the machine | ball within the bat's reach on the step of the press | followed by a blow of the bat on the ball |
| --- | --- | --- | --- |
| round 23 (cue + 11 steps) | 10 | 1 | 2 |
| round 24 (cue + 2 steps, held 10) | 14 | 10 | 14 |

Round 23: the two blows were at step 7006 (left, pressed within reach, the flipper held 1 step) and 7876 (right, pressed 0.37 ball outside the reach); the other eight presses were 0.41 to 2.54 ball widths from the reach and met nothing. The log's line was right: the visitor pressed late.
Round 24: the four presses outside the reach are 0.15 to 0.64 ball widths from it (the page's cue reaches a little past the bat's reach). The stroke shown: step 6906, right bat, pressed at 6905 with the ball 2.36 ball widths along the bat and within its reach, held 10 steps, the ball's speed changes by 98.4 px a step.
The round 24 visitor keeps the ball in play longer: the machine page is 2820 steps (2500 before), the visit 10799 steps (10474), and the machine saves once (six times before).

## Tests

`tests/pack-site.test.ts`, `tests/fix-packs.test.ts` (changed where the plan changed: sets, the turn, the save, the key, the limit), `tests/pack-whole.test.ts` (new): a heading and its frames agree; nothing is taken from a run; every set within the limit; a run never cut by the end of a set; the save's window holds the gate and both bats in every row of a recorded run (`pipeline/phase5/pack-whole-rows.json`, cut by `pack-whole-rows.mjs` from the walk); the key's marks follow the button in the recorded rows; the tiers' sheet; the visitor at the flippers; the pack's numbers against the page's files.
