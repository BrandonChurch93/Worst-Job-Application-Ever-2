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

Draft sent to `/root/step1_director` at 13:56Z; their corrections are folded in when they answer (see the end of this file for the state).

1. The beat and the event names exist already in the frozen `config/` and `content/`. Find the beat: `npm run sheet -- --beat <page>.<beat> --tier draft`.
2. In `src/pages/<page>/index.ts` add a phase to the state machine and its line in `GAG`; put its numbers in one const in `script.ts`.
3. Step it in `step(io)` from page state only: no clock, no random outside `src/core/random.ts`; `save()` and `load()` carry every number it holds.
4. Give it a way out that needs no skill (it tires, overheats, lets go), and under it the plain timer: `s.mode === 'live' && s.phaseTime >= live.skipLinkAfterSeconds` plays the ending.
5. Emit each event once, at the moment it happens: `io.emit('<name>', x, y, onCursor)`.
6. Draw it as shapes with stable ids, a `part`, heights from `config.scale.heights`, and hand the maker what moves as `v` numbers (list them in the page's `NOTES.md`): amounts 0 to 1 and summed angles, never a shape that grows to show progress.
7. Script the film's pointer for the beat in `script.ts`. `npm run bots`: keen reaches the gag, skipper gets out.
8. Make it real in `src/pages/<page>/real/<part>.ts` as a `PartMaker`: `key` from the numbers the geometry is built from, `make` once, `pose` moves it from `v` and `ctx.time`; shared materials from `materials()`, own ones through `studio()`.
9. Test that the same numbers give the same pose in `tests/<part>*.test.ts`; then `npm test`, `npm run build`, `npm run bots`.
10. Look: `npm run sheet -- --beat <page>.<beat> --tier draft`; `npm run still -- --page <page> --beat <page>.<beat> --at 0.5 --format hd --tier review --diag standins` lists no stand-in of the part.

## What I learned

- A double sided material takes its lighting side from the triangle's winding, not from the normal you give it: a ribbon whose winding disagrees with its normals renders black.
- `merge` of `src/shell/solids.ts` wants indexed geometry; the cassette's flat shaded parts are joined by a small join of its own.
- Creases that run along the pull cost the sheet no length, creases across it do. So the folds through the grips can be deep and the solve stays inside the paper.

## Tuning looks

Counted in the reports.
