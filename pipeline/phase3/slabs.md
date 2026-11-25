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

## Fix round

Owner: `/root/keys_fixer`, branch `agent/keys`. It answers the round 3 issues R4-1 #2, R4-2 #1 and #3.

### What a quick look misses

1. A slab that lies across the edge of the deck is cut by the deck's wall in the picture, and a word on it is cut with it.
2. Two slabs that overlap hide each other's label, however little they overlap.
3. A landing that takes 0.2 s between two sheet samples 0.45 s apart is never seen: the evidence of the landing has to last (a pressed key, a pinned row).
4. A slab that fades is read as a badge of the page. A slab that flies off the screen is read as a thing.
5. Enter has to be seen down before the first slab moves, or the slabs have no cause.

### What changed

- One slab an error, never stacked. `slabAim` picks the nearest free place on the deck to the key it answers, with `SLAB_CLEAR` 14 px between slabs and to the deck's edge, so every label is whole for the whole life of the slab.
- Entrance. A slab comes from 900 px above in `SLAB_IN.seconds` 0.05 s (three frames), dips 5 px into what it lands on and settles in 0.08 s.
- What it hits. The keys under a slab are pressed on the landing frame and stay down while it lies there. The tray jolts and the focused field pulses on each landing. Enter bottoms out and is held before the first slab starts.
- The pile is held for `slabLie`, then each slab leaves 0.06 s after the one before: it pops up 100 px in 0.12 s, waits 0.04 s and flies 1900 px sideways off the nearer screen edge in 0.3 s. The keys it pinned spring back as it lifts.
- The page's phase goes to `resume` on time. The slabs stay drawn until 0.46 s after the lift starts (about 0.3 s into `step1.resume`, by then over the deck and the sides only) and are then cleared. `skip()` clears them at once.

### Decisions

1. Slabs never overlap, so the old rule "a later slab lies on an earlier one" is gone. `tests/step1.test.ts` checks a slab's place only while it lies (`slabClear < 0`).
2. The exit is sideways, not up into the camera: a slab that rises toward a straight-down camera only grows, and it would cover the form.
3. A live visitor is not held: the form can be typed while the slabs leave, and `load(save())` continues because the slab's times are in the state.

### Times in the film, MEASURED

By a walk of the film at 240 Hz that prints each change of the pressed keys, the phase and the count of landed slabs: Enter goes down at 17.496 s and is up again by 17.738 s; the slabs land at 18.304, 18.854 and 19.404 s; the lift starts at about 19.66 s; the phase is `resume` at 19.837 s; the slabs are cleared from the state at 20.117 s. By then each has flown 1900 px; the last one is off the screen at about 20.03 s. The Builder accepted this overlap with the start of the tug fixer's window at 18:45Z: over the deck and its sides only, never over the resume field or the slot.

Looked at as draft stills of `step1.email` at 0.650 (the first slab down on Enter, the keys under it pressed) and 0.940 (three slabs, 14 px apart, every label whole).

### Round 5 (round 4's R4-2 #1, #2, #3 and R4-1 #7)

The landing is decision 20 in the "Fix round" of `pipeline/phase3/keyboard.md`: the caps under a slab bottom out on the landing frame, the slab stops with no bounce, and the fall, the moving shadow and the deck's jolt were already there. Looked at as draft stills of `step1.email` at 0.648 (the slab in the air, larger, its shadow off to the lower right) and 0.668 (down, the caps under it pressed and dark).

Not done: R4-1 #7, the hold of 0.3 s and the pull back before a slab leaves. The time a slab lies (`TIMES.slabLie`, 0.25 s) is in the script and is not mine to move, and the slabs must be off before the resume beat, so the leaving was left as the Builder settled it at 19:17Z.

## Fix round 3: the motion

By `/root/keys_motion_fixer`, 2026-11-25. The numbers are in `src/pages/step1/index.ts`. Every MEASURED line names its command.

### 1. The slab's fall (R4-2 issues 2, 3, 4; R9-1 issue 10)

- No hang. A slab is aimed at the old time (`slabDue`) and is not drawn until `SLAB_FALL.seconds` 0.1 s (six frames) before it lands. The landing is at `SLAB_LAND` = `TIMES.slabHang + TIMES.slabFall` = 0.4 s after it is sent, as before. MEASURED by a walk of the film at 240 Hz that prints the events: `slab-drop` at 18.300, 18.850 and 19.400 s of the unit, the times of main.
- The fall starts at `SLAB_FALL.high` 1200 px and is thrown: `fall = high * (1 - u) * (1 + (1 - thrown) * u)`, so it is fast from the first frame and faster at the end. The home camera stands 3062 px off with its near plane 1500 px in front of it, so nothing above about 1500 px is drawn: 1200 px gives a slab about 1.64 times its size in its first frame. Its place leans toward the middle of the screen by `sight` 0.6 of what the height would move it, so it shrinks onto its spot and does not slide in from a side.
- It stops dead. There is no dip and no settle: on the landing frame the slab is at its rest height, the caps under it are at full travel and stay, the caps beside it are tossed from the slab's edge (`SLAB_HOP`: up to 34 px, within 280 px, down again in 0.16 s, less for a wide cap because the look maker tilts a cap in the air), and the deck takes one jolt (`SLAB_FALL.amp` 1.05 times `SHAKE.px`: `tests/step1-script.test.ts` holds it under 6 px).
- The shadow. A caster above `maxZ` 320 of `src/shell/view.ts` is culled by its true place before the shadow pass lowers it, so the shadow showed in the last frame or two only. With `frustumCulled = false` on the slab's two meshes (`real/slabs.ts`, the Builder's proposal) the shadow is in the map through the whole fall. Looked at on the second slab, film frames 1965 to 1970 at draft (`out/work/frames.mjs`): no shadow in the page six frames before the landing, then a wide soft one far off down the light at five and four frames before, closing in under the slab in the last two. The first slab falls at the lower right corner of the page and its shadow falls off the page until the last two frames.

### 2. The hit on the arrow (R4-2 issue 1)

- `THUD = { seconds: 0.17, hold: 0.085, shake: 0.7, hop: 9, reach: 260, toss: 0.1, speed: 6000 }`. On the frame of the flash the struck cap is at full travel, it holds for five frames and is back, past its rest and seated, 0.17 s after the hit. The caps within 260 px hop up to 9 px and are down within 0.143 s. The deck's jolt is 0.7 of a slab's and lasts 0.17 s.
- MEASURED by the same walk, reading every cap's top at 6.0 s: 0 px from rest (main: 1.87 px).
- The hot patch of the strike now lies 0.04 px over the struck cap, under its legend (`STRIKE.over`), and rides up with the cap. Before, it hung 1.5 px over the rest height, over the legend.
- What I learned: with H exactly at rest the reading of type (`typeContrasts`) sent three of its five rays onto a triangle of no area in the cap's top, whose weights sum to 0, and read the cap black: M4 1.14. On main H was still tilted and 1.85 px up at 6.0 s and the rays missed it. The Builder took the two line patch (main e599fbb). With the patch and the hot patch under the legend H reads 10.91.

### 3. The shuffle (R4-1 issue 1)

- `FLIGHT`: launches ripple out from the pressed key over `ripple` 0.17 s by distance (`span` 800 px), each cap is in the air `seconds` 0.2 s, rising over `rise` 0.58 of it while slowing and falling over the rest while speeding up, and stops in one frame into a short seat spring. The deck is kicked once at the launch (`jolt` 4 px) and rings four times as the wave lands (`land` 2.2 px). Caps that do not move stir at the launch and at the landing.
- `SEATED` = crouch + ripple + jitter + seconds = 0.425 s. MEASURED by the walk: the shuffles start at 10.367, 11.004, 11.617, 12.117, 12.667, 13.162, 13.667 and 14.167 s and the next press is never less than 0.495 s later, so every cap is seated before the next press. `s.blocks` is let go only when the last cap is seated.

### 4. Key travel (R4-1 issue 2)

- `stroke`: a pressed cap is half way down or lower on the press frame (`DOWN.first` 0.5, the rest within 0.02 s), at the bottom on the next frame, held to 0.1 s, and springs back past its rest by 0.24 s. Before, it was at the bottom on the press frame. `tests/keys.test.ts` now asks for half travel or lower on the press frame and full travel within three frames.

### 5. The slabs' leaving (R4-1 issue 3)

- `SLAB_OUT = { every: 0.13, pop: 0.07, up: 100, pull: 30, wait: 0.09, fly: 0.15, far: 1900, spring: 0.16 }`. Each slab rises 100 px in 0.07 s while it pulls 30 px back against its way, holds a frame, then flies 1900 px off the nearer side in 0.15 s. A slab is past the edge about 0.13 s into its flight and the next starts its flight 0.13 s after it, so two are not in fast flight in one frame. All three are gone 0.5 s after the lift starts (before: 0.46 s).

### Decisions

1. The landing time, the event times and the press times did not move. Only what is drawn between them did.
2. The slab leaves sideways as before (decision 2 above stands).
3. Item 2 was held out of the first push because it read red in M4; it went in once the cause was known.
