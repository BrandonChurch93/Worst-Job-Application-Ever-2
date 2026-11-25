# The tug of war at its true scale

Agent `tug_fixer`, branch `agent/tug`. Started 16:42 UTC.

## What the approved images show that a quick look misses

1. `step1-tug`: the arms carry one long soft highlight down the whole tube and no hard glint, so the rubber reads satin; the hands are smaller than the arrow's tail is wide and sit on the sheet's two top corners with the fingers on its face.
2. `step1-tug`: the sheet is clean white with only two or three broad soft folds; its title is small, bold and turns with the sheet; the lines under it are thin, even and grey, never darker than mid grey.
3. `step1-tug`: the slit is a dark opening about one and a half sheets wide with a bevel of two to three pixels that catches a thin light line on its far lip; the dark inside is deep but not flat black, and the sheet throws a short dense shadow where it goes in.
4. `cursor-arms`: each arm leaves from under the body's edge at the side, never from the face; the shadow under an arm is a dense narrow contact line that widens only where the arm lifts, not a grey trail.
5. `cursor-arms`: the fingers are short rounded sausages with no joints drawn, the wrist hangs relaxed in the idle and waving poses, and the held sheet is small, in front of the arrow, with a hand wrapped over each side edge.

## Decisions

1. The sheet is 64 by 88 page pixels (`PAPER`), with an inset of 5, the title at 14 px (54.4 px wide in a 54 px column), bars 2 px tall. `paperNodes` in `layout.ts` reads the inset, the top and the bar from `PAPER`, so it follows the sheet although its line is not one of the five named: without it the title and the bars stand outside the sheet.
2. The slot is 96 by 10 (`SLOT`), one and a half sheets wide.
3. The cassette keeps its drawn shape. It is built in its own units, for an opening 300 wide, inside a group scaled by `K` = (96 - 2.8) / 296 = 0.315 and raised so that its top stays 32 px above the page (`scale.heights.machineMinTop` + 2, M9). It stands 1.4 px clear of the opening at each end and 1.2 px at each side: that is the dark gap round the unit.
4. The paper's solver keeps its tuning for a sheet 220 wide. `solveSheet` brings what it is asked to that size, solves, and brings the answer back (`DRAWN` in `paperSolve.ts`): the bends and normals are those of the large sheet, seen smaller. The crease picture is made for the drawn size, so its slopes are unchanged.
5. Strips: 20 lanes, 15 of paper and 5 of the cursor's ink, each 3.6 px wide and 30 px long, across 0.94 of the sheet's width.
6. The pile lands at `SLOT.cy + 60`, so the close frame holds the intake, the outlet and the pile together.
7. The camera: see "M3 and the camera" below.
8. Arms: the cuff is gone, the hand is 0.9 of its drawn size (about 14 px), the tube is 4.9 px thick, the rubber is darker. `ARM` in `body.ts` is `rest: 40, strain: 14`, so strain shows at the new reach of 38 to 54 px.
9. `src/cursor/sheets.ts` reads `PAPER` from `src/pages/step1/layout.ts` and the hands' half span from `TUG.hands`: one source.

10. Supersedes 3 and 8 where the numbers differ. The dark gap is 2.2 px at each end and 2 px at each side (`GAP`), so it shows at the 972 px frame. The arms: 5.3 px thick, at most 46 px long, bent at an elbow each to its own side (`ARM.elbow`, a conic curve, so the arm reads as upper arm and forearm and not as a bow or a cable), straight only at full strain; hand 1.05 of its drawn size (about 15 px over the fingers). `ARM` in `body.ts` is `rest: 34, strain: 13, snap: 0.035`; `TUG.reach` is 31 to 47 px, so an arm is about half the arrow long, as in the approved sheet.
11. An arm whose hand is on the far side of the body goes under the body and comes out at the far edge. The approved sheet draws that arm across the white face; the brief says no upper arm over the white face, and the brief is the later word.
12. The sheet's title sits 12 px under the top edge (`PAPER.top`) and the hands are 31 px out from the middle (`TUG.hands`), so the two fists on the top corners leave the word whole.
13. The sheet `cursor-arms` is laid out round step 1's own slot, because the shredder is built at `SLOT` and nowhere else: the fourth pose feeds its sheet to it through `slotShapes()`, the same three shapes the page draws. Five poses 100 px apart, the camera at 3.6 times home, straight on like the other two cursor sheets. The approved sheet is a three quarter view of a standing arrow; the cursor of the site lies in the plane of the page, so the sheet stays straight on (settled by the acting and damage sheets).
14. `step1.resume`: the proud puff and the dust-off play beside the place of the sheet while it slides in (20.4 to 20.96 s), the lift follows at 21.06 s. Held 0.56 s: the sheet is at rest only from 20.86 s and the drop at 21.62 s does not move.
15. In the tug the acting is `angry` until 0.62 of the sheet is gone (it was 0.45), so the key picture at 25.125 s and the peaks before it are angry: red tip and steam come from the acting of that state.

16. Builder's ruling, 17:35Z, supersedes 7 and the last paragraph of "M3 and the camera": the key picture is taken in the close view. `TUG_FRAMES = { wide: 972, key: 620, close: 520 }`; the move in runs from 23.1 to 24.4 s (2.37 s into the beat), 620 px is held through 25.125 s, then a creep to 520 px by 27.0 s. The wide frame keeps its top at page y 250 (the Builder's word: not 196).
17. The frame's top in the close view goes from page y 450 to 508, not 498: at 498 the prompt of the drop zone was cut through its middle. It then drops 18 px between 27.1 and 27.8 s so the pile is clear of the bottom edge.
18. The key pose is a peak of the lean: `TUG_CURVE` has a point at 2.95 s and one at 3.2 s (lean 0.42 and 0.44, strain 25 and 26 px).
19. "The loser stays in the picture": the cursor is never let go to leave the frame. It loses at 27.09 s, is thrown back, and is drawn tip first into the intake in view (`stepShredded` drives it from 70 px above the slot down into it while `s.shred < SHRED.gone`). `SHRED.gone` 0.46, `pile` 0.64, `pileSeconds` 1.14, so about 0.3 s pass with neither the cursor nor its pile on screen. The brief's "holds on intake and outlet while sheet and cursor go through and strips drop" is kept.
20. Strips, supersedes 5: 2.5 px wide in lanes 3.2 px apart (they were 3.6 px in the same lanes, so three touched and fought in depth and read as one grey slat). Each is 0.8 to 1.2 of 42 px long, up to 0.1 radians askew, 0.05 px above its neighbour, flat on the page from 0.4 of its length. The strip's stock has an emissive share of 0.14 for the light paper lets through: without it a strip in the hood's shadow was darker than the page beside it.
21. The bend at the mouth is drawn twice: in the shape (`KNEE`, 16 units of the drawn sheet, about 4.7 px) and as shade in the sheet's vertex colours (`MOUTH`). The shape alone does not show from straight above on a stock this matte.
22. Not done: the thick turned corner of the approved image. The dog ear of the solver is at the left top corner, under the left hand; a larger ear, or one at the right, comes up through the mitt that holds that corner.
23. M3 at the key is red at draft since 16 (0.68, least 0.8), reported to the Builder as red; not worked on, by the Builder's word.
24. When the sheet is lost the arms spring back into the body: the hands run to the shoulders, fast at first, in 0.3 s. Before, the shoulder ends let go and the two arms trailed into the mouth after the sheet: for 0.2 s they were two loose black cables, which the brief forbids, and a cursor with its arms torn off is grimmer than the film is.
25. The cursor leans to one side only, to the right of the slot (`TUG_CURVE`, lean 0.02 to -0.52 rad). With the lean going both ways the tip touched the Browse files chip at the key and covered the word files at 23.7 s. The hauls differ in how far they lean (0.28, 0.42, 0.52, 0.51, 0.36, 0.51) and in strain, so no second repeats; the test of a move of more than 5 px in every second passes with 7.5 px at the least (searched over the leans and strains with the test's own measure).
26. The rubber of the arms and the mitts: sheen 0.8 to 0.25, grain 0.16 to 0.07, roughness 0.66 to 0.6. At the close view the high sheen and the strong grain gave each arm a pale ragged upper edge, a charcoal stroke; now a tube with one soft highlight along it.
27. At the loss the cursor is driven to the mouth and no further (its body centre stops at the slot, it sinks from 0.2 of the way): before, its stem showed below the machine at 27.6 s.
28. The cut edge of the sheet takes 0.8 of the sheet's shade (`MOUTH.edge`). It is thinner than a pixel and faced the light, so it sparkled as a dotted line along the left and top of the sheet at both tiers.
29. The shade of the bend at the mouth a little deeper and wider (`MOUTH.bent` 0.24, `fold` 15, `soft` 7), seen at review tier beside the one before.

## M3 and the camera

MEASURED with `npm run still -- --key step1-tug --format hd --tier draft` and the measure's own `highFrequencyEnergy` against `references/approved/step1-tug.png`, at the key instant 25.125 s, sheet and slot at the new scale:

| frame, px of page wide | top of frame, page y | ratio |
| --- | --- | --- |
| 462 | 506 | 0.49 |
| 760 | 300 | 0.49 |
| 880 | 506 | 0.62 |
| 900 | 290 | 0.68 |
| 972 | 290 | 0.92 |
| 972 | 250 | 1.03 |

Tile by tile at 462 px: the bare page measures 0.2 to 0.3 of the approved image's mean, the glass of the drop zone 0.0 to 0.1, the tiles with the cursor, the sheet and the shredder 1.4 to 5.9. The page surface holds M3 down: at 462 px about 85% of the frame is bare page. The approved image earns its number from the type of the whole form.

So the key picture is taken at 972 px wide with its top at page y 250 (ratio 1.03), and the camera pushes on to 462 px from 25.15 to 26.15 s, holds on the intake and the outlet while the sheet and the cursor go through and the pile lands (28.19 s), drifts down 60 px to keep the pile in, and pulls out from 28.3 to 29.1 s. One move each way, eased.
