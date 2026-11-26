# The shared look, finished (branch `agent/look-finish`, agent `look_finisher`)

Facts are MEASURED (with the command), STATED (with the source) or UNKNOWN. Pixels are of 1920 by 1080 pictures. Helper scripts live in the ignored folder `out/work/look-finish/` (`crop.cjs`, `med.cjs`, `join.cjs`, `three.cjs`, `grainsize.cjs`); they read a PNG with `sharp`. The notes of the owner before me are `pipeline/phase4/shared-look.md`; I start from its last line.

## Start

MEASURED at 11:11 UTC on 9334a125 (`origin/main`), before any change: `npm test` 115 files, 1461 of 1461; `npm run build` exit 0; `npm run bots` "bots: all clear", exit 0.

## What the approved images show that a quick look misses

Read at full size on `step2-rest.png`, `step2-dial.png`, `page-look.png` and `boss-fight.png`, crop by crop.

1. The waiting Continue is not a raised button at all. Its face lies under the page: the page rolls over into the socket as a soft lip some 3 to 4 px wide, the lip is dark and warm on the upper left (the side turned from the lamp) and the brightest thing near it on the lower right, and the cap throws no shadow on the page. The highlight is on the socket, not on the cap.
2. The bevel of a field is two things. An outer ring of satin metal about 3 px wide, light on the lower right and dark on the upper left, and inside it the glass, which is darkest in a band about 6 px under the top edge and lightest along the bottom edge: the glass is a thick pane lit through its far edge, and its tint is green-grey (about 196, 205, 200), not neutral.
3. The gap is brown, never black. Between the page and a sunk cap, and under the lip of a tray, the darkest pixels stand near (70, 60, 50); pure dark outlines are only on the arrow.
4. The arrow's edge is a band, not a line: near-black, about 3 px on an arrow 62 px tall, the same width all round, and the face inside is flat white with no shading across it. Its shadow is a small dark patch to the lower right that touches the body.
5. The page is lighter and warmer than the build and its grain is fine: specks of one or two pixels with a few faint warm flecks, no pebbles. The orange cap stands tall, with a straight side lit as a bright band on the upper left, and the steel caps are dull satin with a dark numeral that reads as stamped.

## A. The waiting Continue

What M4 counts (STATED, read in `tools/lib/measure-core.mjs` `m4` and `src/capture/showcase.ts` `typeContrasts`): every run of type in the page at rest and in each key still, the waiting label among them. The contrast is not read from pixels: it is worked out from the colour of the run's ink material and the colour of the material of the ground under the run, found by a ray. The limit is `layout.minTextContrast`, 4.5. So the approved label, a pale grey of about 200 on a face of (125, 130, 128), stands at about 2.4 and cannot be built. The label is therefore dark grey on pale, as the brief says.

Built:

1. `materials().frosted`: the cap, 0xc2cacd, roughness 0.66, a weak clearcoat, the frost normal map. `materials().socketLip`: the page's own colour without the page's grain, for the lip.
2. `controls.ts`: `isWaiting(shape)` is a shell button whose tone is `metal`. Its socket has no chrome bezel: the page rolls into it as a lip 3.5 px wide and 2.7 deep, and the floor is the dark seal. Its cap tops out 2.4 above the socket floor, 1.6 px under the page, and casts no shadow. The lip does the shading: dark crescent on the upper left, bright line on the lower right, as in the approved image.
3. `type.ts`: a new ground `frost` with one style `frost:ink`, 0x505352 flat, a pale lip ring, set down onto the sunk cap.
4. The old `waiting` material is untouched, because buttons outside the shell (the secondary buttons of the boss page's pop-ups) still wear it and `tests/glass3.test.ts` reads it.

MEASURED:

- Contrast of the label on the cap, from the two colours: 4.68 (limit 4.5). `npm run -s measure -- --unit step2 --tier review` after the change: 8 green, 0 red; M4 80 runs of type, the least contrast 4.62 (the same run as before, not the waiting label); M3 1.0446 (before 1.0534); M5, M6, M9 0 px.
- `tests/shared-look-waiting.test.ts`, 5 tests: the cap lies under the page, it is paler than its label by at least 4.5, the ready cap stands above the page, the waiting socket has no chrome, the label sits on the cap.
- Ready against waiting, looked at in `npm run -s still -- --page step2 --beat step2.continue --at 0.6 --format hd --tier draft`: the ready cap is orange, stands 14 above the page in its chrome bezel and throws a shadow; the waiting cap is pale grey under the page with none. Pressed is the orange cap gone down into the bezel. Three states, three readings.
- The three other keys in draft (`boss-fight`, `marketing-top`, `decision`): nothing moved. The grey secondary buttons of the boss pop-ups are as they were.

Decisions:

- The cap is paler than the approved one (194, 202, 205 against 125, 130, 128). A dark cap needs a light label to be quiet, and a light label on a dark cap that passes 4.5 is the loud white-on-dark the brief rules out. Pale with dark grey ink is the only quiet answer M4 allows.
- The label keeps its weight. A lighter weight would be a second face of type on the page for one word.

Looks used on A: shell 3 (two draft, one review), type 0 (the label was read in the same three), plus 2 state checks in draft counted to shell: 5.

## B. The paper

Measured first, on review stills at 1920 by 1080, approved against the build before any change (`node out/work/look-finish/med.cjs`, `grainsize.cjs`, `bands.cjs`, `hfe.mjs` on the PNG files).

Tone, the median colour of the same bare patch:

| Key and patch | Approved | Build before | Build after |
| --- | --- | --- | --- |
| step2-rest 700,880 200x120 | 218,215,209 | 216,213,207 | 217,213,208 |
| step2-rest 1000,950 200x100 | 216,212,205 | 210,206,201 | not read again |
| boss-fight 1300,180 300x60 | 220,216,210 | 214,211,205 | 215,211,206 |
| decision 1300,180 300x60 | 218,215,208 | 214,211,205 | 215,211,206 |
| marketing-top 700,880 200x120 | 214,210,203 | 213,210,204 | 214,211,205 |

So the tone was never far off: 2 to 6 levels of 255, the build a little darker and a little less warm, most toward the lower right, which is the fall of the key light and not the paper. The paper's colour (0xf2f1ee) is also written in `src/pages/marketing/real/perk-cards.ts`, a file not lent, for the spill on the page, so the colour stays: a change here would show there as a patch. The tone is not changed.

Grain size, the half-width of the autocorrelation of the bare patch after a high pass, in pixels: approved 0.56 to 0.70 across and 0.82 to 1.04 down; build before 0.54 to 0.55 across and 0.82 to 0.85 down. The size was the same: specks of one to two pixels in both.

What did differ, the strength of the grain by band (rms of the difference of two blurs as a percent of the mean, sigma in px):

| Patch | 0 to 0.6 | 0.6 to 1.2 | 1.2 to 2.4 | 2.4 to 4.8 |
| --- | --- | --- | --- | --- |
| approved, four keys | 1.95 to 2.91 | 1.77 to 2.51 | 0.95 to 1.26 | 0.52 to 1.12 |
| build before, four keys | 2.81 to 3.14 | 2.10 to 2.29 | 1.26 to 1.41 | 0.47 to 0.69 |
| build after, four keys | 2.38 to 2.66 | 1.65 to 1.81 | 0.68 to 0.75 | 0.28 to 0.52 |

And the shape, seen in a crop at three times the size: the build had diagonal streaks a few pixels long (the `FIBRE` term of the grain shader, at 14), which is what read as pebbled and grey; the approved image has even specks with no direction.

Built, three numbers of the grain shader in `src/shell/materials.ts` and nothing else (the grain picture and its bytes are the same, so no texture changed): `FIBRE` 14 to 2.5, `HOME_TOOTH` 0.6 to 1, `HOME_GAIN` 0.5 to 0.9. The streaks are gone, the finest specks stay, the bands from 1.2 px up are about half what they were. `HOME_GAIN` only acts from the home camera, so the paper near a close camera is as it was.

M3. M3 is the mean square of the Laplacian of the whole picture against the approved image. The grain was about a third of it on step2-rest (not nearly all of it, as I wrote in the report of pass A: that was wrong). Read with `node out/work/look-finish/hfe.mjs`, the same function M3 calls:

| Key | Before | After | Limit |
| --- | --- | --- | --- |
| step2-rest | 1.0534 | 0.9421 | 0.8 |
| boss-fight | 1.0333 | 0.9342 | 0.8 |
| decision | 0.9272 | 0.8667 | 0.8 |
| marketing-top | 0.7854 | 0.7346 | 0.8 |

marketing-top was red before and is further under after this item alone; the darker ink, next, is what brings it back. A first try with the grain flatter still (`HOME_GAIN` 0.82) left decision at 0.846, so the gain went up to 0.9 to keep a margin.

Looks used on B: light-engine 0, shell 3 (review stills of step2-rest at three settings; the other keys were rendered once each for the pictures).

## The ink (the Builder's item, taken between B and C at 11:34 UTC; it is also the helper text of G)

Asked by `careers_finisher` and ordered by the Builder: the type's ink is lighter than the approved images, and M3 on marketing-top is red.

MEASURED first (`node out/work/look-finish/dark3.cjs <png> x y w h`: the mean of the darkest 3 percent of a row of type, on review stills):

| Row | Approved | Build before | Build after |
| --- | --- | --- | --- |
| step2-rest title | 29,30,29 | 47,45,42 | 36,35,33 |
| step2-rest field label | 28,25,20 | 48,46,43 | 37,36,34 |
| step2-rest subline | 45,42,36 | 93,87,81 | 59,54,49 |
| step2-rest helper | 54,50,44 | 94,89,82 | 60,55,50 |
| decision title | 33,33,33 | 47,45,42 | 36,35,33 |
| marketing-top headline | 31,30,27 | 47,45,42 | 36,35,33 |
| marketing-top nav links | 79,75,69 | 104,99,93 | 74,70,64 |

Built, four numbers in `src/shell/real/type.ts`: `INK` 0x302e2b to 0x201f1d, `INK_SOFT` 0x67625c to 0x3e3933, `INK_ON_GLASS` 0x262827 to 0x1b1d1c, `INK_SOFT_ON_GLASS` 0x484b49 to 0x383b39. No surface is pure black. The ink on metal, on keycaps, on the frosted cap and the light ink are as they were. The soft ink stays a little lighter than the approved sublines so that the two voices of the page stay two.

M3 after B and the ink together (`node out/work/look-finish/hfe.mjs`): marketing-top 0.8309 (0.7854 at the start, 0.7346 after B alone), decision 0.9172, step2-rest 1.0879. M4: a darker ink on a pale ground only raises the contrast; the full measures are run again before the last push.

Looks used: type 1 (three keys at review, one setting).

## The quiet ink (the Builder's finding of 11:46 UTC, ruled at 11:49 UTC)

MEASURED with `dark3.cjs` on marketing-top: the row under the hero button reads 105,99,88 in approved, 94,88,82 before the ink and 60,55,49 after it; the hero subline 89,84,77, 92,87,81 and 59,54,48. On step 2 the approved soft rows are far darker (subline 45,42,36). One soft ink cannot fit both pages, so the page has a third voice: style `page:quiet`, 0x67625c (the soft ink of before), taken only by a run on the page in the regular weight that asks `ink: 'soft'` in its `TypeSpec`. `tests/shared-look-ink.test.ts` holds the three voices and their order. The two runs of the careers page ask for it in `src/pages/marketing/layout.ts` (not my file): `pipeline/phase4/look-finish-NEEDS.patch`, applied as the commit `NEEDS:` on the Builder's word.

## C. The glass of the fields

MEASURED first, the column of pixels down the middle of the first field of step2-rest (`node out/work/look-finish/prof.cjs <png> 1200 304 300 86`, mean colour of each row):

| Place | Approved | Build before | Build after |
| --- | --- | --- | --- |
| under the top edge | 100,107,105 held for 10 px | 114,118,118 for 3 px | 105,111,107 to 130,134,132 over 8 px |
| middle | 182,187,183 | 186,190,188 | 177,182,178 |
| last 6 px above the lower lip | 195,199,194 rising to 208,213,209 | 200,205,203 flat | 195,201,197 rising to 206,211,208 |

So the glass was nearly right in its middle and wrong at its two edges: no band of shade under the top wall and no light along the lower lip, which is why it read flat.

Built: in `src/shell/real/controls.ts` `SOAK_HOLD` 2.5 to 5.5 and `SOAK_DEPTH` 0.32 to 0.4 (the top wall's shade is deeper and holds further in), `GLINT` 0.14 to 0.3 and its reach, now named `GLINT_REACH`, 1.6 to 7 (the lower lip is lit across about 6 px), `RIM` 2.2 to 3 (the satin frame is a third wider). In `src/shell/materials.ts` the sunk glass 0xd0d8d9 to 0xcdd6d5, a hair greener and less blue. A first try at 0xc9d6ce read olive and was thrown out.

Not built: the cards (`glassCard`). Their bevel is drawn by the `slabbed` shader from some forty numbers set by the owner before me; the approved bevel is a paler, wider band, and moving it wants more looks than this pass had time for. The 'Human Verification' card of the boss page is not `glassCard`: it is built from `src/boss/real/glass`, not lent.

Looks used on C: shell 2 (step2-rest at review, two settings).

## D. The arrow's body

The flattened arrow. MEASURED by looking (`npm run -s still -- --page step2 --beat step2.continue --at 0.6 --format hd --tier review`, and `--sheet cursor-damage`): on Continue the pressed arrow had a grey rim, no black contour and a lumpy grey face, where the approved sheet `cursor-damage` shows the flattened arrow with a thin black contour all the way round, a wavy outline and a crazed white face. Cause, read in `src/cursor/model/deform.ts`: `FLAT.over` 0.24 pushed the white face out over its own black rim, and `FLAT.cornerMost` 0.24 rounded the point away.

Built: `FLAT.over` 0.24 to 0 (the face stays inside its rim, so the contour is black in every pressed pose), `FLAT.cornerMost` 0.24 to 0.1 (the point stays a point), `FLAT.wave` 0.14 to 0.1 and `FLAT.lump` 1.3 to 0.7 (the outline still waves and the face still lumps, as approved, but less, so at the film's size it reads as an arrow pressed thin and not as a lump). The crazing was already in the finish and is kept.

The angry arrow (the Builder's item, 11:56Z): the bright yellow flecks in the hot part were the `vein` term of the heat block in `src/cursor/model/material.ts`, a thresholded noise added at 1.5. It is now added at 0.1, so the glow is the smooth run of red, orange and pale yellow the approved sheet has. The heat's reach, the laser's hole and its own `spark` and `fleck` are not touched.

Not built, and why:

- The thinner black side at low cameras (ball_finisher). The side's height is `TOP` 2.3 and `CROWN` 1.76 in `shape.ts`. A lower body moves the shadow of every page and the room the body has in the ball (`tests/cursor-fit.test.ts`), and wants a before and an after of `lobby-doors`, `youre-fired` and `rail-cam`. There was no time left for six review stills and a second round. UNKNOWN whether 2.3 to 1.9 would hold.
- The exhausted arrow's contour (boss_finisher). MEASURED by looking at `references/approved/cursor-acting.png`: the approved Exhausted arrow is melted white with no black contour at all, and the build's follows it. The evidence does not hold, so nothing is changed.
- The outline's shimmer while still (film frames 6370 to 6392). Not looked at: it wants film frames, not stills.

Looks used on D: cursor-body 5 (Continue at review twice, the sheet `cursor-damage` at review, `step2-crank` at review, the sheet `cursor-acting` at draft).

The Builder's ruling on D, 12:12Z: the flattened arrow and the angry arrow are accepted; the exhausted arrow's contour (fa1ae36c) is ruled for the sheet (`kit/02-SUBJECT.md` names the sheet `cursor-acting` as the reference for Exhausted) and the Builder takes that commit back alone at merge 35. I push no revert of my own.

## G. The focus ring

MEASURED first, the column of pixels down through the top edge of the field in focus (`node out/work/look-finish/prof.cjs <png> 1200 596 300 30`, `step2-crank`, approved against the build; the ring's line is at row 612 to 615 in approved and 615 to 617 in the build):

| Place | Approved | Build before | Build after |
| --- | --- | --- | --- |
| 6 px outside the line | 223,212,202 | 233,212,202 | 232,202,187 |
| 3 px outside | 234,204,181 | 246,217,201 | 245,195,168 |
| 1 px outside | 225,160,111 | 252,212,187 | 252,178,128 |
| 2 px inside | 245,212,169 | 202,133,110 | 216,173,131 |
| 6 px inside | 219,173,137 | 155,128,119 | 170,149,128 |

So the halo was as wide as approved's already (about 13 px) but pale: light added to a pale page only makes it paler, never more orange. And inside the well the build was dark red where approved is warm and light.

Built in `src/shell/real/controls.ts`, `focusRing`: a second surface under the glow that multiplies what lies behind it (`HALO_TINT`, 13 px out and 9 px in, strongest at the line), so the paper round the ring is stained orange and not bleached; and the glow that falls inside the well is now a warm cream (`HALO_WELL`) at 0.9, 0.45, 0.18 where it was the ring's own red at 0.5, 0.2, 0.07. The ring's line, its width and the caret are not touched. No texture.

Still short of approved: the well 6 px inside is 170,149,128 against 219,173,137.

Looks used on G: shell 3 (`step2-crank` at review twice, `step2-dial` at review).

## The sharpening of the finished picture (the Builder's item, 12:15Z; `src/post/post.ts` lent for this alone)

Built in `Post`, the pass that runs once after the samples are averaged. Where: after the lens, the glow, exposure, the tone curve and the grade, on the picture as shown (in display values), and before the grain and the dither, so the grain is not sharpened. How: each pixel moves away from the mean of itself and its eight neighbours (weights 4, 2, 1, a blur of about one pixel) by `SHARPEN` 0.4 of the difference, and is held within `SHARPEN_MOST` 0.03 (under 8 levels of 255) of the lightest and the darkest of those nine, so an edge is made steeper but cannot ring. One amount for every page and tier. The flat view is not sharpened. Cost: the tone curve is worked nine times a pixel in that one pass.

MEASURED (`node out/work/look-finish/hfe.mjs <png>`, M3's own energy, review tier, the same commit with and without the change): step2-rest 14724.5 to 22440.8 (against approved 13600.3: ratio 1.083 to 1.650); tier-corporate 12042.2 to 17993.5 (against approved 21296.8: ratio 0.565 to 0.845).

Seen at native size and at four times (`out/work/look-finish/s1/S-zoom.png`): no light or dark line round the type on the page, round the lamps of the corporate tier or round its sign. The paper's grain reads stronger on the page: with the sharpening step2-rest carries 1.65 times approved's fine detail.

MEASURED with the sharpening (`npm run -s measure -- --unit <unit> --only M2,M3,M4 --tier review`): step2 M2 0, M3 1.6038, M4 4.62; marketing M2 0.0001, M3 1.2507, M4 4.62; decision M2 0, M3 1.3979, M4 4.62; boss M3 1.5085, M4 4.62 and M2 RED at 0.0254 against 0.02 on the sheet `boss-stages`. That red is not from the sharpening and not from this branch: the same command on origin/main at 32dd68f8 in a second worktree gives the same 0.0254 of the same 91790 pixels, and my whole measure of boss before the sharpening gave it too. At the start of my work (11:16Z) boss M2 was 0.0089.

## E. The progress row: measured, not built

MEASURED (`prof.cjs <png> 600 150 300 26` on step2-rest; the same on decision and marketing-top by rows darker than 200): the header rule is as thick in the build as in approved (step2-rest: 9 rows against 10; marketing-top: 6 against 5). Its body matches (162 to 173 against 151 to 169). What differs is the dark line along its lower edge: one hard row at 59 to 64 in the build, three soft rows at 86 to 122 in approved. One try: the rule in the satin rail metal (`railSatin`). The body went up to 204 to 211 and the top to 240, both away from approved, and the dark row stayed at 57, so it was taken back. The dark row is the shadow at the rule's foot, not its metal; changing it means changing the shadow of every page, which I did not do at this hour. The buttons, the numerals, the puck and the empty seat of the boss page were not looked at.

Looks used on E: shell 1.

## F. The shell that seals the arrow at the port

Not started. UNKNOWN.

## The end, 12:57Z

The Builder's rulings: A, B, the ink with its quiet voice and the one-line NEEDS, C (fields), the flattened arrow, the angry arrow, G and the sharpening are accepted. The exhausted arrow's contour was ruled for the sheet and taken back by the Builder at merge 35. No new look item is opened after G: E and F go to the open items as written above. A second try at E was looked at and not kept (the rule with a chamfered shoulder: the dark row at its foot went from 51 to 80 against approved's 95 to 122, but its top row went from 192 to 240 against approved's 140 to 190).

Boss M2 was red on main between merge 33 and 32dd68f8 (0.0254 against 0.02, the sheet `boss-stages`), from a change that was not mine; MEASURED on this branch's head 0fd52cb7 after merges 35 and 36: 0.0027, green.

The three things in my part that still look least real:

1. The cards' glass. The bevel is a hard grey band where approved's is a pale wide one, and the card reads as a flat plate with a line round it. Not touched in this pass.
2. The arrow's black edge. It is two to three times as heavy as the approved sheets' thin contour, and at low cameras the black side shows as a slab. It is the body's height and the width of its edge band in `shape.ts`; not touched.
3. The header rule and the progress row. The rule has one hard dark row at its foot where approved has a soft shadow of three rows, and the buttons are nearer mirror chrome than satin steel.

## Looks counted (tuning looks; baseline and three-panel pictures not counted)

| Part | Used | Of |
| --- | --- | --- |
| shell | 15 | 40 |
| type | 2 | 40 |
| light-engine | 2 | 40 |
| cursor-body | 5 | 40 |

