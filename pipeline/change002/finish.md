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
2. "Upright" for a camera that looks straight down is a rise of the figure's plane about the line of its feet (`STAND.rise`, 0.62 rad now; the Builder chooses between 40 and 60 degrees from `proof/finish/rise-40-60.png`). Height is sold by a long drawn shadow that starts at the shoes, by the head nearer the lens, and by a small light on the face.
3. The long shadow is my own mesh (the engine squashes tall shadows): every shadow-casting piece is drawn a second time, projected onto the ground along the key's direction. While the beam stands it swings to fall away from the hands.
4. The beam is FINISH A (white core, blue edge, thin streaks), not gold; the power-up is the pose sheet's first figure with a gold flame. The hands go back to the hip first (the pose sheet's second figure).
5. Legs exist from standing up to the page turn after the blow and nowhere else (Builder's ruling). After the blow the figure stays, fist on the button; there is no lying down after it. `finish-liedown` is only after the power-up's burst (0.5 s after the power's end).
6. Lengths (Builder, 00:36Z): the moves have their own lengths, the holds take whatever is left between two marks. The rise (0.95 s) starts at `arms` and plays under the charge; a fire mark before it is over quickens what is left to end as the beam leaves. The beam leaves the hands 0.2 s after `fire`. The arms go on dropping through the first step. Knees land 0.4 s after `kneel`, settled at 0.68 s, one breath of 0.6 s, then a hold. Fist: dip 0.1 s, high at 0.42 s, held, drawn back 0.3 s before `press`, lands on `press`. `press` must be in the marks 0.3 s before it happens.
7. The walk is counted in px walked, one step per 54 px (six steps on 320 px): long dragging steps, a foot always on the ground, the body dropping onto each foot.
8. The cold beam lights ask for no shadow: the arena draws the pillars' long shadows from `beamLight`, the figure draws its own.
9. What burns is laid over the picture, not added to it (the page is nearly white), with colours above 1 so the finishing pass makes them glow.

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

None committed. No file outside my own was edited.
- Look helper: `buttonAt(view)` gives the button's place; the button is held down from `state.press` (Builder, 00:41Z). Nothing of mine to change.
- Fight helper: wires `finishPart`, hides the ordinary arrow while `state.up`, passes `beam: () => beamLight(state)` to the arena.
- The no-legs rule: `AGENTS.md` line 228 ("The cursor never has ... legs, feet ... Check G12 tests it"). I found no line in `tools/` or `tests/` that reads legs or feet (STATED, by search), so no check should go red; the sentence itself wants re-pinning at the merge.
