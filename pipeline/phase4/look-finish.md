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

## Looks counted (tuning looks; baseline and three-panel pictures not counted)

| Part | Used | Of |
| --- | --- | --- |
| shell | 8 | 40 |
| type | 0 | 40 |
| light-engine | 0 | 40 |
| cursor-body | 0 | 40 |

