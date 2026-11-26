# Fix tug: step 1's tug of war on the live site (round 20 to 21)

Branch `agent/fix-tug`. Files changed: `src/pages/step1/index.ts`, `src/pages/step1/real/shredder.ts`, `src/pages/step1/real/shredderShape.ts`, `tests/fix-tug.test.ts`, `pipeline/phase5/fix-tug-steps.mjs`, `pipeline/phase5/fix-tug-pair.mjs`, this file. `src/cursor/body.ts` is not touched.

## What was wrong, measured on origin/main (dc83c2d0)

- The takeover. At the bite the page called the paper's spring on the arrow at full strength in one step. MEASURED (`tests/fix-tug.test.ts` run on origin/main, a keen hand that stops where it is at the bite): the arrow is drawn 111.9 px and its largest step is 16.46 px; the fastest step of a free move across 111.9 px is 5.89 px.
- The loss. The live path gave the loss `TIMES.lost` 0.3 s where the film has `TIMES.lostFilm` 0.84 s, dropped the arms and tumbled the arrow (`react('recoil')`) on the step of `tug-lost`, and nothing on the page answered.
- The give-back. The page let go on the step the strips had zipped back (`SHRED.end`), with the arrow still in its worn pose and the slot still closing.

## What the page does now (live)

1. The bite. On the step the rollers have the paper (`enter('tug')`) the slot's housing is thrown `JOLT.bite` px down the page, the cassette slips in its seat (`THROWN` in `real/shredder.ts`) and the panel round it (`resume-zone` and what stands on it) moves `JOLT.panel` of that; both come back along a square curve in `JOLT.seconds` and stop. The same answer is given in the film on the same step.
2. The takeover. The arms grow from the shoulder to the paper over `TAKE.reach`; the paper stays upright until they have it. Only then does the paper's pull on the arrow come on, over `TAKE.pull`. The held paper leans at most `TAKE.lean` from upright wherever the arrow stands (the pull on the arrow keeps its true line), so it no longer lies folded flat when the arrow is far to the side.
3. The loss. When the shredder has won (`amount >= 0.9` or 9 s) the page takes the arrow and plays a last pull: `LOSS.pull` seconds, `LOSS.back` px away from the slot, the paper taut. Then the grip goes: `tug-lost` is told on that step, the arrow is drawn long for `LOSS.kick`, the housing and the panel are thrown (`JOLT.lost`). The arrow skids to the slot over `LOSS.skid` with its arms still on the paper. Then the hands ride the last of the paper into the mouth over `LOSS.feed` and the arrow is drawn `LOSS.sink` px after it. On the step the paper is in, the arms go (the kit allows arms only in the tug's gag), the housing and the panel are thrown again (`JOLT.meet`) and the arrow goes in through the mouth as it did before this pass. No `cower` and no `recoil` tumble.
4. The give-back. When the strips have zipped back the arrow drops its worn pose (`act plain`, pressed short for `GIVE.press`, let back to its length by the page over `GIVE.rise`) and stands `GIVE.settle` seconds while the slot closes (`TIDY`). Then the page lets go and the hand-back of the pointer eases it to the mouse.

The film keeps its own path, step for step: `hands`, the pull and `tugCurve` are computed as before, the grip at the entry of the tug is kept, and the film's times and events are untouched. The film gets only the slot's answer: at the bite, at its lost moment and on the step the arrow goes in.

## Numbers of my own (the kit sets none of them)

In `src/pages/step1/index.ts`: `TAKE`, `LOSS`, `JOLT`, `GIVE`, each with its line. In `src/pages/step1/real/shredder.ts`: `THROWN`.

## Decisions

- `src/cursor/body.ts` is left alone: the ease of the takeover is made in the page, by bringing the pull on over time.
- The slot's answer is carried by the housing shape's own place (`y` against `housingY`), not by a fourth number of `jaw`: `tests/step1-script.test.ts` holds that `jaw` has three numbers and is not changed.
- The bots' hint during the shredding stays at the pile: with the mouse there the hand-back does not send the arrow away from where the visitor goes next.
- `tug-lost` is told on the step the grip goes, 0.22 s after the page takes the arrow, so the pack's sheet round that event shows the last pull before it and the skid after it.
- The arms cannot stay on while the arrow goes in: the stage allows arms only while the gag is `step1.tug` (`config.cursor.armsOnlyInBeat`). So the paper is fed in with the hands on it inside the tug's gag, and the arms go on the step the gag changes.
- No test of another owner is changed. No word is added.

## Measured (second pass)

`npx vitest run tests/fix-tug.test.ts` (a keen hand that stops where it is at the bite, 240 steps a second):

- Takeover: the arrow is drawn 116.7 px, its largest step is 2.90 px; the fastest step of a free move across 116.7 px is 6.15 px. On origin/main the same test gives 111.9 px, 16.46 px against 5.89 px.
- The held paper leans 0.600 rad from upright at most.
- Loss: the last pull lasts 0.221 s; the skid and the feed 0.521 s over 140.3 px; the largest step is 2.08 px against 7.39 px for a free move across the same distance. Arms on every step from the taking to the step the paper is in.
- Give-back: held 3.88 s in all (origin/main 3.10 s; `live.controlTakenMaxSeconds` 8 s); 0.000 px a step in the 0.3 s before the mouse has it; the largest step after is 5.57 px.

Pictures (`node pipeline/phase5/fix-tug-steps.mjs walk after3`, the pack's own visitor, every second step of 60 a second, preview size; `fix-tug-pair.mjs` lays them beside origin/main's): marks resume 1367, tug 1494, `tug-lost` 2011, shredded 2042.

- Bite, step 1494: the paper's top edge is about 7 px lower than at 1492, the panel about 4 px, the cassette about 3 px; back by 1498.
- Takeover, 1496 to 1516: arms grow 1496 to 1500, the paper held leaning 1502 to 1510, it swings upright with the arrow 1510 to 1516. The arrow's own way from the Browse button is the visitor's mouse going to the hint.
- Loss, 2006 to 2058: thrown slot at 2012, skid with arms 2012 to 2032, the paper fed in under the hands 2034 to 2040, arms gone and the slot and the panel thrown at 2042, the arrow cut off by the mouth 2044 to 2056, gone at 2058.
- Give-back, 2202 to 2246: worn arrow to 2214, back to its shape 2216 to 2224, stands to 2236 while the slot shuts, follows the mouse from 2238.

## Open

- Step 2040 to 2042: the arms are there in one picture and gone in the next (short by then). The stage takes the arms off on the step the gag stops being `step1.tug`.
- Step 2042: the panel is thrown about 9 px and its edge covers the upper part of the slot for that one picture; by 2044 it is 3 px.
- The last pull back is 20 px of page (10 px at preview size) and small in the picture.
- What the film shows at the moment of the give-back was not looked at: UNKNOWN.

## Checks on the second pass (commit 4f68f93f, read 21:00 UTC)

- MEASURED `npm run stills` at draft then `cmp`: `step1-fire`, `table-wide`, `boss-fight` byte equal to the ones made before.
- MEASURED `npm run determinism`: pass, 12 pictures at hd, tier draft, identical across two fresh loads and two orders.
- MEASURED `npm run gate -- --phase 5 --only G12`: pass, 9180 frames read, 37 beats, 35 of 35 events inside the beat, arms only in step1.tug.
- MEASURED `npm run bots`: all clear.
- MEASURED `npm test`: 141 files, 1767 tests passed.
- MEASURED `npx tsc --noEmit -p .`: clean.
