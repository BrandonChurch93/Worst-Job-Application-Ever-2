# Fix tug: step 1's tug of war on the live site (round 20 to 21)

Branch `agent/fix-tug`. Files changed: `src/pages/step1/index.ts`, `src/pages/step1/real/shredder.ts`, `src/pages/step1/real/shredderShape.ts`, `tests/fix-tug.test.ts`, `pipeline/phase5/fix-tug-steps.mjs`, this file. `src/cursor/body.ts` is not touched.

## What was wrong, measured on origin/main (dc83c2d0)

- The takeover. At the bite the page called the paper's spring on the arrow at full strength in one step. MEASURED (`tests/fix-tug.test.ts` run on origin/main, a keen hand that stops where it is at the bite): the arrow is drawn 111.9 px and its largest step is 16.46 px; the fastest step of a free move across 111.9 px is 5.89 px.
- The loss. The live path gave the loss `TIMES.lost` 0.3 s where the film has `TIMES.lostFilm` 0.84 s, dropped the arms and tumbled the arrow (`react('recoil')`) on the step of `tug-lost`, and nothing on the page answered.
- The give-back. The page let go on the step the strips had zipped back (`SHRED.end`), with the arrow still in its worn pose and the slot still closing.

## What the page does now (live)

1. The bite. On the step the rollers have the paper (`enter('tug')`) the slot's housing is thrown `JOLT.bite` px down the page and the panel round it (`resume-zone` and what stands on it) `JOLT.panel` of that; both come back along a cubic in `JOLT.seconds` and stop. The same answer is given in the film on the same step.
2. The takeover. The arms grow from the shoulder to the paper over `TAKE.reach`; the paper stays upright until they have it. Only then does the paper's pull on the arrow come on, over `TAKE.pull`.
3. The loss. When the shredder has won (`amount >= 0.9` or 9 s) the page takes the arrow and plays a last pull: `LOSS.pull` seconds, `LOSS.back` px away from the slot, the paper taut. Then the grip goes: `tug-lost` is told on that step, the arrow is drawn long for `LOSS.kick`, the housing and the panel are thrown (`JOLT.lost`). The arrow skids to the slot over `LOSS.skid` with its arms still on the paper. Where it meets the slot the arms go, the housing and the panel are thrown again (`JOLT.meet`) and it goes in with the paper as before. The film's loss keeps its times and events and gets the two answers of the slot.
4. The give-back. When the strips have zipped back the arrow drops its worn pose (`act plain`, pressed short for `GIVE.press`) and stands `GIVE.settle` seconds while the slot closes (`TIDY`). Then the page lets go and the hand-back of the pointer eases it to the mouse.

## Numbers of my own (the kit sets none of them)

In `src/pages/step1/index.ts`: `TAKE`, `LOSS`, `JOLT`, `GIVE`, each with its line. In `src/pages/step1/real/shredder.ts`: `THROWN`.

## Decisions

- `src/cursor/body.ts` is left alone: the ease of the takeover is made in the page, by bringing the pull on over time.
- The slot's answer is carried by the housing shape's own place (`y` against `housingY`), not by a fourth number of `jaw`: `tests/step1-script.test.ts` holds that `jaw` has three numbers and is not changed.
- The bots' hint during the shredding stays at the pile: with the mouse there the hand-back does not send the arrow away from where the visitor goes next.
- `tug-lost` is told on the step the grip goes, 0.22 s after the page takes the arrow, so the pack's sheet round that event shows the last pull before it and the skid after it.
