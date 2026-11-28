# Finish: the standing arrow, the power-up, the blast and the last moment

Unit "finish", branch `agent/b-finish`. Files: `src/cursor/stand/*`, `src/boss/finish/{acting,fx,index}.ts`, `tests/b-finish.test.ts`, `pipeline/change002/finish-shots.mjs`, this file and `pipeline/change002/proof/finish/`.
Every number below is marked MEASURED (a run or a render of this branch), STATED (read from code or said by someone, not run by me) or UNKNOWN.

## What the fight helper calls

Import from `src/boss/finish/index` (the bare `src/boss/finish` resolves to the fight helper's `finish.ts`).

- `finishPart(inputOf, levelOf)`: a part for one anchor shape; or `makeFinish()` with `pose(input, light)`, which returns the `FinishState` it drew.
- `finishState(input)`: the pure acting. `state.up` true while the figure is drawn (hide the ordinary arrow for as long). `state.feet` the middle of the feet (a walk starts there). `state.press` 0 to 1: how far the fist has the button down; it goes to 1 in 0.05 s at the press mark and stays 1 (the fist never lifts), so the look helper can hold the button down from it.
- `finishEvents(before, now)`: the moments a sound belongs to between two steps.
- `kneelSpot(button)`: where the feet's middle must be for the fist to land on the button.
- `beamLight(state)`: the beam as the arena's `BeamLight` (line and strength), or null.
- `FinishInput`: `time` (view time), `arrow` (tip of the lying arrow), `power: { at, end? }`, `marks: { arms, stand?, charge, fire, end, walk, kneel, fist, press }`, `charge` and `shot` (0 to 1), `walk: { x, y, walked, pace? }` (feet's middle, px walked), `button` (`buttonAt(view)` of the look), `target` (the fallen boss).

All of it is a function of the marks and the view time. No clock, no random number.

## Decisions

1. The figure is the approved arrow (same body mesh and material, same arms), tip up, standing on its tail, with two legs of the arms' own hose and thickness and two shoes. Lying, it coincides with the pointer, so getting up and lying down start and end on the ordinary arrow.
2. "Upright" for a camera that looks straight down is a rise of the figure's plane about the line of its feet (`STAND.rise`, 0.698 rad, 40 degrees, by the Builder's ruling of about 01:31Z; it was 0.62 rad in the first pass; see `proof/finish/rise-40-60.png`). Height is sold by a long drawn shadow that starts at the shoes, by the head nearer the lens, and by a small light on the face.
3. The long shadow is my own mesh (the engine squashes tall shadows): every shadow-casting piece is drawn a second time, projected onto the ground along the key's direction. While the beam stands it swings to fall away from the hands.
4. The beam is FINISH A (white core, blue edge, thin streaks), not gold; the power-up is the pose sheet's first figure with a gold flame. The hands go back to the hip first (the pose sheet's second figure).
5. Legs exist from standing up to the page turn after the blow and nowhere else (Builder's ruling). After the blow the figure stays, fist on the button; there is no lying down after it. `finish-liedown` is only after the power-up's burst (0.5 s after the power's end).
6. Lengths (Builder, 00:36Z): the moves have their own lengths, the holds take whatever is left between two marks. The rise (0.95 s) starts at `arms` and plays under the charge; a fire mark before it is over quickens what is left to end as the beam leaves. The beam leaves the hands 0.2 s after `fire`. The arms go on dropping through the first step. Knees land 0.4 s after `kneel`, settled at 0.68 s, one breath of 0.6 s, then a hold. Fist: dip 0.1 s, high at 0.42 s, held, drawn back 0.3 s before `press`, lands on `press`. `press` must be in the marks 0.3 s before it happens.
7a. The figure kneels before the button, never on it: `kneelSpot(button)` puts the feet's middle 31 px before the button's near end and 6 px below its middle line (for the look's 226 px button at (960, 650): (816, 656)); the fist lands 27 px in from that end, on the middle line.
7. The walk is counted in px walked, one step per 54 px (six steps on 320 px): long dragging steps, a foot always on the ground, the body dropping onto each foot.
8. The cold beam lights ask for no shadow: the arena draws the pillars' long shadows from `beamLight`, the figure draws its own.
9. What burns is laid over the picture, not added to it (the page is nearly white), with colours above 1 so the finishing pass makes them glow.
10. Second pass (01:14Z to 01:20Z): the ball's light and the three beam lights were about halved (ball 0.12 to 0.62, beam 1.0, 1.1, 0.9 times its opening) so the page does not go white and the arrow's white face holds; the gold round the figure during the charge and the blast is now a crackle of thin gold arcs on the ground that jump 15 times a second (`fx.crackle`, a function of view time), not a smear; the flame is five broad tongues behind eleven to sixteen narrow ones, orange at the edge, yellow white in the middle.
11. The dark puff about 50 px ahead of the hands in the first third of a second of the beam is the look's own smoke on the boss's near corner (it stands in the charge picture too, before any beam); nothing of mine is drawn there (STATED from reading `acting.ts`: my smoke starts at the beam's end, my dust only at the knees and the blow).
12. Third pass (01:33Z to 01:39Z, after the Builder's six faults): the limbs are thick black hose (legs 6.2 px across times the arms' own taper, arms 1.3 times the approved hose), the gloves 1.5 times the approved hand, the shoes 23 by 10 by 16 px. They grow to that with the legs, so the lying figure still coincides with the pointer. The arms' part of this is the NEEDS commit below.
13. One number for the figure's size: `FinishInput.scale` (1 when left out). It grows in about the feet as the legs come out (the lying arrow is always the cursor's own size) and carries the hands, the ball, the flame, the skid, the stride of the walk (54 px times the scale per step), the fist's reach and `kneelSpot(button, scale)`. Not scaled: the beam's width and the smoke puffs' size. Rendered at 1 and, for four pictures, at 1.5 (`report-scale15`).
14. The beam: a narrower white core, a bluer body with a rough edge, and two thin lightning lines along it that jump 18 times a second and show in patches.
15. The button's one point after the blast is (960, 650) (fight helper, 01:39Z); the kneel spot stays (816, 656) for the look's 226 px button.
16. A gripping hand of the standing figure closes to a real fist (02:06Z): the approved grip only curls the fingers a little, which from above read as an open glove. `Arms.clench` (second NEEDS commit) folds them under; the figure sets it as the legs come out. The power-up's two hands and the raised hand before the blow are fists now; the open palms of the fire pose are unchanged (their grip is 0).

## Events (for sounds; this unit makes no sound and spends nothing)

Seconds are counted from the `arms` mark with the Builder's set (charge 0.10, fire 4.12, end 6.25, walk 6.65 for 2.8 s over 320 px, kneel 9.45, fist 10.75, press 11.65). STATED from the marks, not measured in the film.

| event | second | length the sound wants |
| --- | --- | --- |
| `finish-standup` | 0.00 | 0.9 s |
| `finish-charge` | 0.10 | to the fire: 4.2 s in the film, a loop while held on the live site |
| `finish-fire` | 4.32 (fire + 0.2) | 0.4 s crack, then the beam's body to 6.25 (1.93 s) |
| `finish-beam-end` | 6.25 | 0.5 s |
| `finish-step` 1 to 6 | 6.89, 7.36, 7.83, 8.30, 8.78, 9.25 | 0.25 s each |
| `finish-knees` | 9.85 (kneel + 0.4) | 0.35 s |
| `finish-fist` | 10.75 | 0.45 s |
| `finish-press` | 11.65 | 0.6 s |

Power-up, seconds from `power.at`, with `end` = E (3.4 when left out):

| event | second | length |
| --- | --- | --- |
| `finish-standup` | 0.00 | 0.9 s |
| `power-up-rise` | 0.75 | E - 0.75 (2.65 s) |
| `power-up-burst` | E | 0.6 s |
| `finish-liedown` | E + 0.5 | 0.8 s |

`finish-charge`, `finish-fist` and `finish-press` fall on the fight helper's marks of the same names: emit each once.

## NEEDS

Two, both in `src/cursor/act/arms.ts`. The first: `5a618eab` "NEEDS: the arms take a bulk and a glove size" in `src/cursor/act/arms.ts` (the arms' owner): two numbers on `Arms`, `bulk` and `glove`, both 1 by default, so nothing changes anywhere else; the standing figure sets 1.3 and 1.5. No other file outside my own was edited.
A second: `c6bc4a76` "NEEDS: the arms take a clench" in the same file: one number on `Arms`, `clench`, 0 by default, so nothing changes anywhere else.
- Look helper: `buttonAt(view)` gives the button's place; the button is held down from `state.press` (Builder, 00:41Z). Nothing of mine to change.
- Fight helper: wires `finishPart`, hides the ordinary arrow while `state.up`, passes `beam: () => beamLight(state)` to the arena.
- The no-legs rule: `AGENTS.md` line 228 ("The cursor never has ... legs, feet ... Check G12 tests it"). I found no line in `tools/` or `tests/` that reads legs or feet (STATED, by search), so no check should go red; the sentence itself wants re-pinning at the merge.

## Counts (MEASURED in my harness, software GL, `out/work/finish-shots/counts*.json`)

Draw calls of the finish alone (figure, its drawn shadow, what burns):

| moment | film tier | low |
| --- | --- | --- |
| power-up (flame, ring, glow) | 14 | 13 |
| charge (ball, aura) | 15 | 14 |
| blast (beam, flare, aura, skid) | 17 | 16 |
| after (smoke, skid, scuffs) | 14 | 13 |

Triangles of the finish: 31,088 at the film tier (the figure 15,544, drawn twice: once for its shadow), 28,208 at low. Lights asked of the pool: 1 for the face, 1 gold, 1 for the ball, 3 for the beam (none with a shadow), at most 5 at once; the ball's asks for a shadow.
Whole-frame draw calls in the harness (the arena and the look of this branch, not the page): charge 496, blast 334 to 602 by the moment, after 119 at the film tier; charge 285, blast 242, after 94 at low.

## Proof

`pipeline/change002/proof/finish/report-*.png` (each at most 1200 px). Made by `node pipeline/change002/finish-shots.mjs` then `node pipeline/change002/finish-sheets.mjs`, all in my harness (`src/cursor/stand/harness`), not on the real page: the fight helper has not wired `finishPart`.

Third pass (rise 40 degrees, thick limbs, big gloves and shoes, softer lights, crackle, bluer beam), rendered 01:38Z to 01:47Z at 1 sample:
- `report-poses`: the three poses from the side beside `finish-poses.png`, and from straight above.
- `report-rise`: the pose at 40 and at 60 degrees with its shadow, film size and three times.
- `report-stills`: charge, blast and after at 1920 by 1080 beside the three approved pictures.
- `report-strips`: the fire, the fall to the knees and the blow, every frame for twelve, then every second.
- `report-four`: power-up, charge, blast, the fist on Submit.
- `report-fist`: the fist and the blow, larger (tiles twice the width of `report-strips`), rendered 02:06Z to 02:11Z with the fist.
- `report-scale15`: charge, blast, after and the fist on Submit with `scale` 1.5 (`--scale 1.5` on the shots tool), rendered 02:00Z before the fist change.

First pass only, NOT rendered again (thin limbs, rise 35.5 degrees, old flame): `report-getup` (getting up, the power-up's burst, lying down), `report-walk` (the walk), and the fist rows of `report-blow`. The moves in them are the same code as now; the look of the figure in them is out of date.

The harness draws no ordinary arrow in the finish script, so the frame before the `arms` mark in the getting-up strip is empty ground: the page draws the pointer there.

## Size (Builder's fault 6)

- The standing figure is 91.8 px from the soles to the tip in its own plane (STATED: `STAND.tip`, hip 31 px plus 16.5 outline units of 70 / 19 px), about 82 px in the charge's crouch. Seen straight down at a rise of 40 degrees that is 70 px of page (63 px crouched), so 70 film px at 1920 by 1080 with no close view and about 141 film px in the fight helper's 2x close view (STATED, computed; not measured on the real page, which does not draw it yet).
- In `finish-charge.png` and `finish-blast.png` scaled to 1920 wide the figure is about 210 px tall and 300 to 385 px wide (MEASURED by eye on a 600 px copy, give or take 15 percent).
- So with the 2x close view a `scale` of about 1.5 brings the figure to the pictures' size; without the close view about 3. `FinishInput.scale` is the one number; 1 by default. One set of four pictures was made at 1.5 (`report-scale15`): the figure kneels clear of the button and the fist lands on its near end; the walk at 1.5 was not rendered (UNKNOWN).

## Known weak points at the last push

- The fist is new at 02:06Z: seen in `report-fist` and the power-up tile of `report-four` and `report-poses`; the charge, blast, fire and knees pictures were rendered just before it (their hands are open or nearly so, so little changes).
- In the charge the arrow leans so far forward that from straight above its face is narrow.
- The figure is about half the pictures' size until `scale` is set.
- The look's white and orange burst covers Submit during the blast in my harness (the look helper's).
- The beam's lightning is thin and shows in patches; the picture's is heavier.
- `report-getup`, `report-walk` and the fist rows are first pass pictures.

## The shout (Builder, 02:01Z)

- My unit draws no words and makes no sound. No word of the shout is in `src/cursor/stand`, `src/boss/finish` or my pictures, so there is nothing of mine to drop. I did not write to `content/copy-drafts.json`: the line is drawn by the fight helper, and two helpers writing the same draft would collide at the merge (decision of mine; say so if you want it from me).
- From `finish-arms` to `finish-fire`, film: 4.13 s (STATED: `SHOUT.fire` minus `SHOUT.arms` in `src/boss/tune.ts` on `origin/agent/merge55`; the fight helper's 01:30Z film times 48.80 and 52.92 give 4.12). What my figure does inside it (MEASURED at 60 steps a second from `finishState` with those marks): standing at 0.57 s, the ball first seen at 0.45 s, the ball full at 3.78 s, the coil from 4.03 s (STATED: `FIRE.coil`), the beam leaves the hands at 4.33 s, the beam gone at 6.58 s.
- Live: the fire mark is the visitor's. Earliest by your ruling of 00:36Z, 0.2 s after the arms (MEASURED: standing at 0.30 s, no ball at all, the beam leaves at 0.42 s); latest 6 s (STATED: `FINISH.alone` on merge55; MEASURED with that mark: the ball full at 5.62 s, the beam leaves at 6.22 s).
- The span the shout is shown in: the fight helper's, 0.10 s (`SHOUT.beats[0]`) to the fire mark at 4.13 s, about 4.0 s (STATED from his table; I cannot measure his drawing).
- Do six words in one roar sit in it: yes in the film, as I judge it (not measured against a recording). "I have five years of experience" is nine syllables; 4.0 s is 0.45 s a syllable, a slow build. The ball grows through the whole span and is full 0.35 s before the fire mark, so the last word wants to land on the coil and be held through the beam leaving the hands: the roar's end belongs at 4.33 s, 0.2 s after the fire mark, not at it. Nothing needs to move and the unit need not be longer. On the live site an early click cuts the line short: either the words run on over the beam, or the click is held until they are out. That is the fight helper's and yours to choose.
- The flat bar of three bands on the real page: `src/boss/finish.ts` lines 51 to 54 on `origin/agent/merge55` (the fight helper's stand-in: the boxes `finish-blast` and `finish-blast-core`). Nothing outside my own folders calls `finishPart` or `makeFinish` of `src/boss/finish/index` on that branch (MEASURED by `git grep`), so my beam, figure and flame are not on the real page yet.

## The power-up against the pose sheet's "Powering up" figure (decided 7:12 PM MT, change note 004)

- There: fists raised (two fists since 02:06Z), legs apart with bent knees, thick hose, round shoes, a ring of flames on the ground, a gold glow under the feet. Seen in the power-up tiles of `report-poses` and `report-four`.
- Not there: the flame. The sheet's is low, lapping at the feet and the ring with a few thin licks up the sides; mine is a tall fan of tongues behind the whole figure, head high. Still to do: bring the tongues down to knee height, make the ring's flames the main fire, keep two or three thin licks rising past the arms. The fists stand a little wider and lower than the sheet's, level with the head rather than at the shoulders.
- Legs in the power-up and the finish only: that is what the module does (legs exist while `state.up`).

## Runs (MEASURED, with exit codes)

All on this branch after the merge of `origin/main` (b66ff094) at 01:39Z, head `0f7d5f56` (only notes, the shots tool and proof pictures were committed after it):
- `npm run determinism`: EXIT 0 at 01:51Z ("pass, 12 pictures at hd, tier draft, identical across two fresh loads and two orders").
- `npm run bots`: EXIT 0 at 01:52Z ("bots: all clear").
- `npm test`, whole, alone, detached, 01:52Z to 01:58Z (342.7 s): EXIT 1. 43 failed, 2205 passed, 17 skipped of 2265; 12 files failed, 172 passed, 13 skipped of 197. None of the red ones is mine: `tests/b-finish.test.ts` passed 13 of 13 in that run. The red files: `config.test.ts` 26, `boss-closer-acting.test.ts` 3, `boss-fight.test.ts` 3, `cut-of-build.test.ts` 2, `harness-plan.test.ts` 2, `polish-turn2.test.ts` 2, `audio-cues.test.ts` 1, `film-cut.test.ts` 1, `harness-keep.test.ts` 1, `site-finish-film.test.ts` 1, `site-finish.test.ts` 1, `roughcut.test.ts` (the file fails to load). I did not run the whole set on the branch before my work, so "not mine" rests on what they test (the config, the fight's film, the cut list, the page turns' times), not on a before and after (STATED).
- `npx vitest run tests/b-finish.test.ts`: EXIT 0, 13 of 13, at 01:59Z.
- `npx tsc --noEmit -p .`: EXIT 0 at 01:59Z.

Again after the fist change (head `db0b0929`, the last change to any source file):
- `npm test`, whole, alone, detached, 02:11Z to 02:17Z (345.8 s): EXIT 1. 43 failed, 2205 passed, 17 skipped of 2265; the same 43 as the first run (the two lists compared, no difference); `tests/b-finish.test.ts` 13 of 13 in that run.

- `npm run determinism`: EXIT 0 at 02:22Z ("pass, 12 pictures at hd, tier draft, identical across two fresh loads and two orders").
- `npm run bots`: EXIT 0 at 02:22Z ("bots: all clear").
- `npx vitest run tests/b-finish.test.ts`: EXIT 0, 13 of 13, at 02:23Z.
- `npx tsc --noEmit -p .`: EXIT 0 at 02:23Z.
