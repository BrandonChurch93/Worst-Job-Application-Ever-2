# slabs, paper, shredder: notes of `/root/slab_maker`

Branch `agent/slabs`. Looks on `agent/slabs-looks`. Files: `src/pages/step1/real/slabs.ts`, `paper.ts`, `paperSolve.ts`, `paperStock.ts`, `shredder.ts`, `shredderShape.ts`, `tests/slabs.test.ts`, `tests/slabs-textures.test.ts`, `assets-src/slabs/RECIPE.md`.

## What the approved images show that a quick look misses

Looked at `references/approved/step1-tug.png` at full size and in two crops (the sheet, the slot), and at `cursor-arms.png`.

1. Highlight: the paper has none. Its brightest facets are the ones tilted to the upper left, and they stay just under paper white; the facets turned away fall to a mid grey that is neutral to cool, never cream. The only speculars in the crop are two dull glints of metal at the ends of the slot.
2. Bevel: the slot's lip is a soft roll about 3 px wide at 1920, an eighth of the slot's depth on the page. The south lip faces the light and is the lightest thing near the slot; the north lip is a thin dark line.
3. Gap: the slot is near black but not black, warm, about 25 to 35 of 255, and it is darkest right under the north lip. Nothing inside it can be read.
4. Edge: the sheet's outline is not a rectangle. The top is gathered in between the hands, the right edge bows and has a dog ear, and the bottom meets the slot on one straight line. The cut edge shows as a hairline lighter than the face where it turns to the light.
5. Shadow and print: the shadow is close, soft and warm grey, widest (about 12 px) where the sheet stands up to the hands and pinched to nothing at the slot; the hands throw their own shadow on the sheet. The title is bold charcoal, the lines are thin grey rules of unequal length, and both change direction at every ridge.

## What is built

- `slabs`: one maker for any size. Geometry from the shape's `w`, `h`, `r` and height: foot chamfer, wall, a broad shoulder bevel of `min(0.42 * depth, 0.16 * min(w, h))` in 12 steps, a slightly crowned face, a dark underside. The label is left to the type maker (the maker answers `null` for text). `v = [seconds since landing, impact]` gives a small settle. `makeSlab(w, h, r, depth)` and `red()` are exported for the boss.
- `paper`: one object for the sheet, its title and its seven rules. `paperSolve.ts` is the solve: a pure function of the numbers, no state. `paperStock.ts` makes the stock: fibre colour picture, crease normal picture, the print's and the strips' materials.
- `shredder`: `shredder-jaw-1` draws the whole cassette, `shredder-jaw-0` is answered with `''`. The first `strip-*` of the list draws every strip as one mesh.

## Decisions

1. The sheet does not stretch. Its free length follows the hands; what is left over goes back into or comes out of the cutters. Slack stands up as an arch (capped at a fifth of the free length); a last pass pulls every edge of the grid back to its paper length, across from the middle and along from the cutters, and that pass is what takes the outline off the rectangle. MEASURED: 11 cases in `tests/slabs.test.ts`, worst edge 2% or less.
2. A sheet held askew goes into the cutters askew: it turns in its own plane (up to 35 degrees) and the roller's crest cuts it on a slant. This keeps it flat where real paper would be flat.
3. Creases are fixed in the paper (22 straight folds from the seed, most of them through the two grips) and grow with `0.05 + bite * (0.4 + 0.9 * amount + 0.25 * pull)`. The grid carries the broad folds, a normal picture baked from the same folds carries the sharp ridges.
4. The title is set by the paper maker from the font outlines through `TypeRegister.set` with the words key `copy:step1.resume.paperTitle`, and laid on the bent grid point by point. `/root/type_setter` was told. While the page still hands the title to the type maker, the type maker's title shows on the flat sheet and the paper's own shows once the sheet is bitten.
5. The rules are printed 3.2 px tall inside the layout's 8 px boxes. The approved image has hairline rules; 8 px bars read as a cartoon of a document. The boxes of the layout are not changed.
6. The cassette comes up through the slot, so it is no wider than the slot: 296 by 23.2. Two rollers of radius 6.6 across the slot, 44 hooked discs each at a pitch of 6, interleaved, turning toward each other. Its top is at `machineMinTop + 2`, as the shape gives it. A chute hangs down its south wall while it travels, swings out when it is up and then reaches south: the strips leave from under it. The stand-in's housing box south of the slot is where the chute ends up.
7. Sequence from one number, `open`: panels part 0 to 0.55, cassette rises 0.45 to 1 (it is up at about 0.86, with a 6% overshoot that settles), chute 0.86 to 1.
8. Red: the shared set has no red yet. `red()` in `slabs.ts` takes `materials().red` the moment it exists and until then makes its own through `studio()`.
9. The housing's brushed aluminium is my own material through `studio()` with the shared aluminium's colour object, because the shared one has no brushing. The rollers' tool steel is my own.
10. Reflection strength is set with `specularIntensity` on the dielectrics (paper, red, the dark inside), as the Builder measured that `envMapIntensity` does nothing here.

## Numbers the page hands over (agreed with `/root/step1_director`, written up by them in `src/pages/step1/NOTES.md`)

- `resume-paper` `v = [lift, bite, amount, pull, lx, ly, rx, ry, vx, vy, hands]` in every beat the paper exists.
- `resume-paper-title` becomes `part: 'paper'`; title and all seven lines are pushed every frame of tug and shredded.
- `shredder-jaw-0` and `shredder-jaw-1`: `v = [open, turn, feed]`, `turn` summed in the step, in radians. The well is at full width from its first frame.
- `strip-<i>`: `v = [u, ink]`; strips leave from `y = SLOT.cy + 44`, z about 8.
- `email-slab*`: `v = [seconds since landing, impact]`.
- Until those land on `main` every maker falls back on what the shapes say today (box, turn, width).

## One more gag with its live way out and its events

Written with `/root/step1_director`. I sent ten steps at 13:56Z; they accepted them, added three (the case in `hint()` and `skip()`, the beat in the test of events, the whole gag inside `live.skipLinkAfterSeconds + 3`) and wrote all thirteen in `pipeline/phase3/step1-script.md`. These are the same thirteen, as they stand there.

1. Name the beat and its event. They live in `config/film.json` and `content/copy.json`, which are frozen for agents: the Builder adds them. Check with `npx vitest run tests/film.test.ts`.
2. In `src/pages/step1/index.ts` add the phase to `type Phase` and its line to `GAG`. Put every number of the gag in one const in `src/pages/step1/script.ts`, next to `TIMES`.
3. Step it in `step()` from the page state only: `s.phase`, `s.phaseTime`, `io.pointer`, `io.pressed`. No clock, no random. Every number the next frame needs goes into the state object, so `save()` and `load()` carry it with no more code. Check: `npx vitest run tests/step1.test.ts -t "save"`.
4. Give it a way out that needs no skill, then the plain timer: `s.mode === 'live' && s.phaseTime >= live.skipLinkAfterSeconds`. If the gag takes the pointer from the player, give it back inside `live.controlTakenMaxSeconds`. The whole gag, timer included, ends inside `live.skipLinkAfterSeconds + 3`.
5. Add its case to `hint()`: where a player should point now, and `down` only on the frame a press helps. Add what it leaves behind to `skip()`: every list emptied, every flag back.
6. Emit each event once: `io.emit('<name>', x, y, hitsCursor)`, at the frame the thing is seen to happen, not when it is decided.
7. Draw it in `shapes()`: stable ids, a `part`, heights from `config.scale.heights`, and the numbers a maker needs in `v`. Write the meaning of each `v` into the table in `src/pages/step1/NOTES.md`. A shape is never grown to show an action: it moves, or a second shape appears.
8. Script the film: add the times to a const in `script.ts`, the moves and the click to `makePlan()`. The test of the next step reads the time of the event.
9. Add the beat and its event to the table `BEATS` in `tests/step1-script.test.ts`. `npx vitest run tests/step1-script.test.ts`: the event must lie inside the beat, 0.25 s either way.
10. `npm run bots`: all three bots must finish the page, the one that does nothing included.
11. Make it real as a `PartMaker` in `src/pages/step1/real/<part>.ts` that reads the shapes by id and their `v`. Its owner registers it. Write the recipe of any texture in `assets-src/<folder>/RECIPE.md`.
12. Look: `npm run sheet -- --beat <beat> --tier draft`, then `npm run still -- --page step1 --beat <beat> --at 0.5 --format hd --tier draft`, and once with `--diag standins`. The twelve frames alone must tell the gag.
13. `npm test && npm run build && npm run bots && npm run measure -- --unit step1`.

For step 11, the maker's half in full:

- `key(s, ctx)` answers a string for a shape the maker builds (the string names what the geometry is built from, so a change of it rebuilds), `''` for a shape it knows and draws nothing for, `null` for a shape it does not know (the stand-in stays).
- `make` runs once and builds geometry and materials; a material only this part has goes through `studio()` of `src/post/studio.ts`.
- `pose(o, s, ctx)` runs every frame and moves things from `s` and `s.v` only. A shape that is solved (the sheet) keeps the numbers it was last solved for and does nothing when they are the same.
- Many equal things are one mesh: the maker of the first shape of a kind owns it and reads the others from `ctx.list` (see the strips in `shredder.ts`).
- A test in `tests/<part>*.test.ts`: the same numbers give the same pose.

## What I learned

- A double sided material takes its lighting side from the triangle's winding, not from the normal you give it: a ribbon whose winding disagrees with its normals renders black.
- `merge` of `src/shell/solids.ts` wants indexed geometry; the cassette's flat shaded parts are joined by a small join of its own.
- Creases that run along the pull cost the sheet no length, creases across it do. So the folds through the grips can be deep and the solve stays inside the paper.

## Tuning looks

Counted in the reports.
