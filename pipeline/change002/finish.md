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

## Second task (the Builder's mail after the 02:30Z report), five items, each its own commit

Decisions:
17. Size. `SCALE = 1.5` in `src/boss/finish/acting.ts` is the default of `FinishInput.scale` and of `kneelSpot(button, scale)`. With it grow: the figure about its feet (as the legs come out), the hands and the ball's place and size, the beam's width (the beam's shader measures across itself in the figure's own px), the flare at the hands, the smoke, the skid marks and how far the blast shoves the feet (38 px times the scale), the stride (54 px times the scale), the scuffs, the dust, the gold glow on the ground and the two small lights that belong to the figure. Not scaled: the beam's length and its three lights.
18. Kneel spot at 1.5 for the 226 px button at (960, 650): (793, 659). That is `kneelSpot({ x: 960, y: 650, w: 226 })`. The fist lands at x 874, 27 px in from the button's near end, 81 px ahead of the feet. (First it was (800.5, 659), with `KNEEL.clear` 31: see 23.)
19. The blow was a snap in the figure, not the strip's step: the body went down on the fist's own curve (`inCubic` over 0.14 s), which does 32 percent of the whole move in the last frame before the press (STATED, from the curve). Now the fist keeps that curve and lands on the frame of the press; the body is thrown after it from 1 frame before the press to 6 frames after (`LAST.follow` 0.1 s), eased at both ends, at most 21 percent of the move in one frame (STATED, from the curve). The sag over the fist starts when the body is down.
20. Power-up against the pose sheet's "Powering up" figure. While the ring burns (`fx.ring` 1, the power-up only) the fire is low: five broad low flames behind the legs, low tongues along the ground between the shoes, the ring's flames twice as tall as before and wider (the main fire), and three thin licks that rise past the arms (two on the left, one on the right). Without the ring (the charge and the blast) the gold stands round the whole figure as before. The fists are in and up: `POSES.power` hands at (-27, 67) and (29, 70), from (-33, 61) and (36, 63).
21. Fault 2, the fire pose. Seen from straight above only the tilt of the figure's plane changes how much of the white face shows. In `POSES.fire` and `POSES.fireOver` the figure now leans back from the blast (`rise` 0.6: 24 degrees off the ground instead of 40), which shows 91 percent of the face's height instead of 77 (STATED, cosines), the chest is puffed (0.3), and the hands are 14 px lower so the arm that crosses the body crosses the tail, not the middle of the face.
22. The legs rule is pinned in `tests/b-finish.test.ts` ("the legs rule"): at every frame of a 32 s script the figure has no legs, does not stand and is not drawn outside the power-up and the finish; it never stands when the fight gives neither a power-up nor the arms mark; the legs are back in before the power-up hands the arrow back; and no file of `src` outside `src/cursor/stand` and `src/boss/finish` takes the standing figure in. Not pinned: what three.js draws (the figure hides its hose and shoes when `legs` is at most 0.02; that line has no test, STATED).
23. What broke at 1.5 and was mended. Looking at every frame of the knees strip, the figure stood at the end of its walk with its hanging right hand and its front toe on the button's rim. Two changes: `KNEEL.clear` is 36 (was 31), so the kneel spot is 5 px times the size further from the near end (at size 1 it moves from (816, 656) to (811, 656)); and on the walk a hand that hangs ahead of the body is held back to stay `KNEEL.hand` (10 px of the figure) short of the button's near end. Nothing else was seen to break in the walk, the knees, the fist and the blow at 1.5.

### Size (MEASURED)
The figure standing at ease (`out/work/finish-shots/size.png`: the close view x 300 to 1260, y 270 to 810, straight down, alone on the page, 1920 by 1080): its dark pixels (brightness under 70 of 255) span 231 px in height, shoes included, and 284 px in width, hands included. The approved pictures show about 210 px (MEASURED by eye, give or take 15 percent, as before).

### Proof of the second task (all from my harness, size 1.5, the fight's close view where a whole frame is shown)
- `proof/finish/report-t2-walk.png`: the walk (every fourth frame, 44 frames) and the knees. Rendered before the mend of 23: the last walk tiles show the hand on the button's rim. The walk here is short (151 px, two steps), because my script's arrow starts nearer the button than the film's.
- `proof/finish/report-t2-knees.png`: the knees, 34 frames, after the mend of 23: the figure stops clear of the button, then falls.
- `proof/finish/report-t2-fist.png`: the fist, 26 frames. Rendered before the mend of 23 (the figure stands 7.5 px nearer the button than it does now).
- `proof/finish/report-t2-blow.png`: the blow as the first strip showed it (every frame for twelve, then every second). Before the mend of 23.
- `proof/finish/report-t2-blow-near.png`: every frame from 6 before the press to 14 after, after the mend of 23. The fist lands on the 7th tile; the body turns down over tiles 8 to 12.
- `proof/finish/report-t2-power.png`: the pose sheet's "Powering up" figure, the build at a right angle to the figure, the build from straight above.
- `proof/finish/report-t2-fire.png`: the fire pose before and after, both at size 1 so the two can be compared.
- `proof/finish/report-t2-stills.png`: charge, blast and after beside the approved pictures. Rendered before the mend of 23 and before the hands of the "arms stay out" moment were lowered; the charge and the blast are not touched by either.
One sample a frame in the strips (they were three before): edges are rougher than the film's.

### What the pictures of the second task show, as I see them
- Size: 231 film px tall in the close view (MEASURED, see above). The figure reads at the size of the approved pictures.
- Walk, knees, fist, blow at 1.5: every frame of the strips looked at. One fault found and mended (23). The shin and the shoe behind the kneeling figure read as a dark heap rather than as a leg; that was so at size 1 too.
- The blow: the fist lands on the frame of the press; the body turns down over the next five frames. No frame now carries the whole turn.
- Power-up: the fire is low and the ring is the main fire. Against the sheet: my fists are now above the head, the sheet's are at the height of the shoulders with the elbows bent close to the body; my flames are broader and more even than the sheet's thin wisps; the sheet has licks as high as the fists on both sides, mine are short and mostly on the left.
- Fire pose: the face shows more of its height than before, but the gain is small to the eye. The arrow's own outline is narrow, and the arm still crosses it. Fault 2 is eased, not closed.
- Stills at 1.5 in the close view: in the charge the figure is hard to read under the ball and the gold crackle. In the blast the look's white and orange burst over the button hides most of my beam; what shows of the beam is thinner than the approved picture's.

### Draw calls at 1.5 (MEASURED, harness, film tier)
The finish alone: power-up 14, charge 15, blast 17, after 14, knees and blow 14 (13 before the dust). Triangles 31,088. The same as at size 1.

### Runs of the second task (MEASURED, with exit codes)
On head `ca874b5f`, the last change to any source file:
- `npm run determinism`: EXIT 0 at 03:00Z ("pass, 12 pictures at hd, tier draft, identical across two fresh loads and two orders").
- `npm run bots`: EXIT 0 at 03:00Z ("bots: all clear").
- `npx vitest run tests/b-finish.test.ts`: EXIT 0, 17 of 17, at 03:01Z.
- `npx tsc --noEmit -p .`: EXIT 0 at 03:01Z.
- The whole `npm test` was not run again in this task (it takes 6 minutes; the last whole run was on `db0b0929`, EXIT 1, 43 red, none mine by what they test).
Commits of the second task: `8ab57b5d` (size 1.5), `d45017e8` (the blow), then the power-up, the fire pose, the legs test, the tools and notes, and `ca874b5f` (the mend of the kneel spot).

Report of the second task sent to the Builder at 03:02Z with four pictures (report-t2-walk, report-t2-power, report-t2-blow-near, report-t2-fire). The fight helper was told the new default size, the kneel spot (793, 659) and the step count.
Open after it: the power-up's fists stand above the head, the sheet's at the shoulders (suggested hands (-36, 54) and (38, 56), not done); the walk and the fist strips are not re-rendered after the mend of 23; the whole `npm test` was not run on this head.


## Third task (Builder's mail of 03:03Z)

### Decisions
24. The power-up pose to the sheet (item 1). `POSES.power` hands are now `[-30, 50, 7]` and `[32, 52, 7]`: at the height of the shoulders, beside the body. The Builder's suggested hands (-36, 54) and (38, 56) were tried first: with the arms' roots where they were, the hoses arched out over the fists and the arms read as held out to the sides. So the pose has a new field `tuck` (0 to 1; `STAND.tuck` 3.8 outline units): the arms leave the body that much lower, for this pose only, and rise to the fists as on the sheet. Every other pose has `tuck` 0 and is drawn as before. Against the sheet, as I see it: the fists are at the shoulders and close to the body; the sheet's elbows stand further out than mine (my hoses rise in a shallow bow, the sheet's arms have a sharp elbow); my right fist touches the edge of the arrow.
25. The flames to the sheet (item 1). In the power-up the fire is five tall thin wisps (two at each side, 80 to 106 px tall before the size, one low behind the legs), thin short tongues along the ground that are taller toward the sides, and the ring (flames 8 to 13 wide, 10 to 28 tall). No broad fan. Against the sheet: the wisps are thin and reach the fists and over on both sides; the sheet's wisps curl, mine are straight spikes.
26. The power-up fitted to its window (item 2). Cause, MEASURED by reading the fight helper's `src/pages/step4/index.ts` line 192: it gave `power.end` 1.85 s after `at`, my moves up took 1.6 s, so the fists were held 0.25 s. New input `power: { at, until }`: `until` is the view time by which the figure must lie on the page again. The moves (getting up, the dip, the fists up, the burst, lying down) are then played in a share `quick` of their own time so that the fists are held `POWER.held` 1.1 s; never quicker than `POWER.quickest` 0.55 unless the window is shorter than the moves. `powerPlan(pw)` returns `{ quick, end, over }` in seconds after `at`. `power.end` and no end at all work as before; no name the fight calls is changed. For the fight's 3.15 s: quick 0.707, fists in the pose at 1.13 s, held 1.10 s, burst at 2.23 s, lying at 3.15 s (STATED from the formula; that both fists are within half a px of the pose for at least 1.0 s and that the figure lies at `until` is MEASURED by the test "the power-up fitted to a window").
27. The charge and the blast (item 4). Behind the figure the ground is darkened to amber while it charges and fires (`uDark` in the glow), the crackle is thinner and kept off the figure, the ball throws fewer rays. The beam at the hands is core 13 px and glow 30 px half-width before the size (they were 4 and 15).
28. What of the look hides the beam on the real page (STATED from reading `src/boss/look1/fx.ts` on merge55, block "The finishing blast", lines 546 to 566; not tested by switching it off): the stream of `sparks` at the body's middle (8 ticks, HOT at 2.2) and each part's `pop` (a `flash` of colour [0.85, 0.92, 1] at 1.6, HOT `sparks` at 2.4, a SOOT `burst`). Mailed to the fight helper; that file is not touched.
29. The fire pose (item 5): left as it is. No further try was made.

### Proof (all from my harness, not the real page; the strips one sample a frame)
- `proof/finish/report-t3-power.png`: the sheet's "Powering up" figure, the build at a right angle, the build straight down.
- `proof/finish/report-t3-stills.png`: the charge and the blast at 1.5 in the close view beside the approved pictures.
- `proof/finish/report-t3-walk-a.png`, `report-t3-walk-b.png`: the walk after the mend of 23, all 44 frames. The harness's arrow now lies at (520, 500), so the walk is about four steps and the framing is not that of the earlier strips.
- `proof/finish/report-t3-fist.png`: the fist, 26 frames, after the mend.
What they show, as I see them: every frame of the walk and of the fist strip looked at. The hand nearer the button is held back and stays off the button and its rim in every frame, also at the standstill; the fist rises and stays on the screen. In the charge the arrow and its hands read against the amber ground. In the blast the beam is as thick as the approved picture's from the hands on; over the button the look's white and orange burst still covers it.

### Open
- The real page was not rendered by me: whether the fight holds the pose there depends on the fight helper taking `until`.
- The fire pose: fault 2 eased, not closed.
- The whole `npm test` was not run in this task.

### Draw calls (third task)
The finish alone in the power-up at 1.5: 14 draw calls, 31,088 triangles (MEASURED, harness, film tier, on the last pose render). Charge and blast: no mesh was added (the dark ground is a uniform of the glow that was there), so 15 and 17 as before (STATED; the log of that render was not kept).

### Runs of the third task (MEASURED, with exit codes)
On head `5853431c`, the last change to any source file:
- `npx vitest run tests/b-finish.test.ts`: EXIT 0, 20 of 20, at 03:20Z.
- `npx tsc --noEmit -p .`: EXIT 0 at 03:20Z.
- `npm run determinism`: EXIT 0 at 03:25Z ("pass, 12 pictures at hd, tier draft, identical across two fresh loads and two orders").
- `npm run bots`: EXIT 0 at 03:25Z ("bots: all clear").
- The whole `npm test`: not run.
Commits of the third task: `0f4d1075` (the input `until`), `8f7bc9e6` (the pose), `5853431c` (wisps, charge, beam), then the tools, the proofs and these notes.
The fight helper was told at 03:11Z: the input `power: { at, until }`, `powerPlan`, and the part of the look that hides the beam.
