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
3. Creases are fixed in the paper (34 straight folds from the seed plus 8 short ones fanning from the two grips, each with a sharp ridge and soft flanks) and grow with `abuse = 0.05 + bite * (0.3 + 0.5 * amount + 0.2 * pull) + (1 - bite) * 0.5 * pull * hands`, as `0.4 + 1.5 * abuse` px (3.4 at first: beside the approved sheet the folds were too deep and the rules ran wavy). The grid carries the broad folds, a normal picture baked from the same folds carries the sharp ridges.
4. The title is set by the paper maker from the font outlines through `TypeRegister.set` with the words key `copy:step1.resume.paperTitle`, and laid on the bent grid point by point. `/root/type_setter` was told. While the page still hands the title to the type maker, the type maker's title shows on the flat sheet and the paper's own shows once the sheet is bitten.
5. The rules are printed 1.5 px tall inside the layout's 8 px boxes, of seven different lengths, with one more of the same weight between each two (round 3: two weights read as drawn by hand). The approved image has hairline rules; 8 px bars read as a cartoon of a document. The boxes of the layout are not changed.
6. The cassette comes up through the slot, so it is no wider than the slot: 296 by 23.2. Two rollers of radius 6.6 across the slot, hooked discs 4.2 wide at a pitch of 8, each turned an eighth of a tooth from the last, of dull ground steel, interleaved, turning toward each other. Its top is at `machineMinTop + 2`, as the shape gives it. A chute hangs down its south wall while it travels, swings out when it is up and then reaches south: the strips leave from under it. The stand-in's housing box south of the slot is where the chute ends up.
7. Sequence from one number, `open`: panels part 0 to 0.55, cassette rises 0.45 to 1 (it is up at about 0.86, with a 6% overshoot that settles), chute 0.86 to 1.
8. Red: the slabs keep their own, by the Builder's word (a shared red does not go into `materials()` today; the one that is there, 0xc22a1e, is paler and is not used). For the boss, the numbers of `red()` in `slabs.ts`: colour 0xa00d0b (sRGB), roughness 0.46, metalness 0, specularIntensity 0.4, clearcoat 1, clearcoatRoughness 0.09, clearcoat normal picture `grainNormalMap(256, config.seed + 71, 1.6)` at repeat 1/90 and scale 0.035, passed through `studio()`. The underside is 0x4a0f0c, roughness 0.7. `red()` and `makeSlab(w, h, r, depth)` are exported.
9. The housing's brushed aluminium is my own material through `studio()` with the shared aluminium's colour object, because the shared one has no brushing. The rollers' tool steel is my own.
10. Reflection strength is set with `specularIntensity` on the dielectrics (paper, red, the dark inside), as the Builder measured that `envMapIntensity` does nothing here.
11. The hood is a piece of rolled sheet, an arc of radius `len / turn`, not a flat plate: only a curved face shows a band of light. A second piece slides out round the same circle from under it. The sheet metal's thickness lies under the face that is seen: when it lay over it, the hood stood in its own shadow, and since the reflection is dimmed in shadow (the light's law of 4aacf2b) it went near black.
12. The fed sheet is taut exactly when the middle of the hands is `300 * (1 - amount) - 34` px from the slot's centre (the director's reach): 16 px of margin and 18 px counted as fed past the crest. Nearer than that it is slack. Slack deepens the folds first (up to 1.6 times), evened across the columns, and only what is left stands up as an arch.
13. Past the crest the sheet turns straight down into the nip on a radius of 1.3 px. A wrap round the roller's own radius is smaller than a cell of the grid and showed as teeth.
14. The fed sheet throws its shadow from 1.6 px under its face (a depth material of its own on the sheet), and the rows by the crest take the light of the row 2.5 cells above: a sheet that leans away from the key otherwise shades itself in teeth along the crest.
15. The hands are taken in either order (sorted along the sheet's own width), and `v[0]` is read as a height: 21 lies on the cassette, 35 is carried.
16. Any shape with id `resume-paper:<name>` is a sheet of its own with the same maker (asked for by `/root/cursor_actor`). With `bite` 0 it is the flat box held at `z0 + 5` between the two hands.
17. The corner by the left grip is a dog ear: an isometric fold along a straight line, then the length pass. It turns with `max(bite, pull * hands)`.
18. Strips: ribbons 7.6 wide, one mesh. A quad that is turned over has its winding swapped, so its normal faces up: otherwise the shadow's normal bias pushes it under the page and it renders dark.
19. The fibre picture tiles every 108 page px (4.7 texels a page px). At 150 the edge pixels of the sheet, of its rules and of its title counted as soft in M2 at the tug's close camera (MEASURED: 0.0226 to 0.0257 before, 0.0141 for the unit after, `npm run measure -- --unit step1`).
20. The slab's landing: a rock of 0.028 rad on its long axis at 52 rad/s that dies with the square of the impact. It stays under 1 px at the face's edge because the label is laid flat by the type maker. The fall, the stop and what jumps beside it are the page's (`slabZ` in `src/pages/step1/index.ts`).
21. The two panels that close the slot do not go under the page. They come up 4.1 px out of the slot and slide apart to lie on the page north and south of it, 3.6 px thick, so the opened slot reads as opened (the Builder's word at 15:32: the panels drawn apart with their thickness showing). A flush slit is declined, by M9 and "Things come out of the page".
22. Cutters: steel 0xa2a6ad at roughness 0.32, each disc an eighth of a tooth on from the last. At a turn of 0.618 of a tooth the row read as noise.
23. Strips hang from the bite on: the director sends `u` from the amount eaten (0.30 to 0.34 at the key still), asked for by me after the Builder's note.

24. The stock is 0xe9eaed, not paper white. MEASURED beside the approved still (mean of the sheet's pixels): approved median 204 with the page at 219; mine was 240 at 0xf1f2f5 and read blown, about 221 at 0xdadbde and read grey; 0xe9eaed with decision 25 is the one kept. Its median was not measured after the last change: UNKNOWN.
25. The sheet's normals are drawn 45% toward its mean normal where they differ from it by less than about 45 degrees (`level` in `paperSolve.ts`). Paper scatters light through its body, so a slow bend barely changes its tone; without this the folds shaded as smoke. The ear and the sharp folds keep their own normals; the geometry, the outline and the shadows are untouched.
26. The first row past the crest lies on the crest line itself, so the last cell before the crest stays in the sheet's plane; the rows by the crest take the mean light of the 15 by 4 cells above them, not of one cell. This took the grey teeth off the line where the sheet meets the roller.
27. Strips are bent, not faceted: each ring takes the mean normal of the two faces that meet on it. What a paper strip keeps of a rule is one pale tick a segment long. A strip leaves the hood at the height the page gives it and its free end comes down to 1.2 px over the page, so its shadow meets it at the tip (round 3, issue 3).
28. Seat (round 3, issue 2): a dark tile 1.1 px wider than the slot all round lies in the slot's mouth while the cassette is up, and each panel has a dark foot 1.1 px wide where it lies on the page. This is a drawn opening, not a cut one: the well itself is `/root/surface_mason`'s to cut.

## Round 3, what was not reached

- The hood still stands over unbroken page grain south of the slot and throws a broad shadow on it. Not changed: it is the chute the strips leave from, and it must stay above the page (M9). A fix agent could shorten it or cut the page's well under it (surface_mason's file).
- The dark foot round the panels reads as a drawn outline at the close camera. A real seat is a well in the page with a rolled lip, as in the approved slit.
- The folds of the sheet are soft shading only; the approved sheet has a few crisp crease lines. The crease normal picture is at `0.06 + 0.22 * abuse`; raising it brought the satin look back, so the crisp lines want a narrower ridge in `creaseMap`, not a higher scale.
- Strips with the director's push (214288c on `agent/step1-script`, not on main when I stopped) were looked at only in a scratch merge, at the key still. Their shadows were not checked frame by frame.
- `npm run compare`, `npm run crops` and the four sheets were last run one commit before the round 3 changes (on 5903615), not after.

## Agreed with other owners

- `/root/step1_director`: `lx, ly` is the screen left hand; hands 128 px apart; reach `300 * (1 - amount) - 34`, least 24; amount 0.05 at the bite, 0.44 at the key still, 0.72 at 4.3 s, gone at 5.06 s; lean at most 0.34 rad; `open` is 1 from the feed; the eaten title and lines are parked at z -30 with `v = [1]` and the paper maker prints its own. Strips `v = [u, ink]`: paper strips hang in a heap 56 px under the hood and are drawn back when the phase is `received`; ink strips go to a pile 176 px under the slot. Proposed to the director, theirs to take: a dead stop of the slab with one rebound of about 1.2 px inside 0.06 s, and neighbours that jump 3 to 5 px, later with distance.
- `/root/cursor_actor`: a sheet held by two hands with no slot is `[z0, 0, 0, pull, lx, ly, rx, ry, 0, 0, 1]`; the maker reads only the sheet's shape and `shredder-jaw-1`; the held edge is at `z0 + 5`, creases are flattened within 22 px of the grip line, a hand 4 px above is enough.
- `/root/surface_mason`: the slot's wells are theirs to cut; the `shredder` maker draws the cassette from the well up.

## Where the brief and the approved picture differ

- The approved `step1-tug` has a flush dark slit the sheet goes into. The kit and the brief ask for a mechanism that comes up. Built: the cassette. Told to the Builder.

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
- Bare metal has no diffuse light, so wrong normals or a face in its own shadow go unseen until something in the light's law reads them. Check a metal part's normals and shadow with a dielectric on it once.
- A soft texture in M2 is counted on half covered edge pixels too: a picture needs 2 texels a screen pixel at the closest camera, not 1.
- A shadow map cannot tell a thin sheet from the sheet beside it at a grazing light: give the sheet a caster that lies under its face.
- Creases that run along the pull cost the sheet no length, creases across it do. So the folds through the grips can be deep and the solve stays inside the paper.

## Tuning looks

Of 40 each: slabs 9, paper 40, shredder 20 (counted by the stills looked at while tuning that part). The paper's are used up.
