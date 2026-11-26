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

## Looks counted (tuning looks; baseline and three-panel pictures not counted)

| Part | Used | Of |
| --- | --- | --- |
| shell | 5 | 40 |
| type | 0 | 40 |
| light-engine | 0 | 40 |
| cursor-body | 0 | 40 |

