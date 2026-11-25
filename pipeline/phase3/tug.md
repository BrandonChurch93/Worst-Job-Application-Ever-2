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
