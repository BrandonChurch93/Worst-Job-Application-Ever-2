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
30. The lines of text on the sheet a softer grey (`INK.bar` 0x7c7c80 to 0x8c8c90), nearer the approved image's; at the key they still read as lines, seen at review tier. The ticks the strips keep of them are paler with it.
31. An arm is rooted 0.2 of the way in from its shoulder (`ROOT` in `view.ts`, was 0.09). At the key the left arm left the body at the very point of the wing and read as a spike drawn on from the outline; now it comes out from under the edge at its full width.
32. An arm stays at the height of its root for the first 0.15 of its length and rises to the hand over the next 0.55 (`ARM.low`, `ARM.rise`). Before, it rose from the root at once and came up through the white face at the end of the stem (seen at 22.6 s at review tier, six times its size, with `ROOT` at 0.09 and at 0.2).

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

## Round 4 and 5, 25 November, branch agent/tug2

Decisions, numbered on from 32.

33. The arms are hoses on one cubic curve (`ARM` in `src/cursor/act/arms.ts`): 5.6 px thick at rest, 50 px long at rest and never shorter, so a near hand leaves slack. The slack is one loop that bows away from the other arm (`Arms.axis`, set in `view.ts` from the two roots) with a bias up; its height is found by bisection so the arc keeps the hose's length. Under load the hose is straighter and thinner (`thin` 0.12, and the 0.3 power of rest over length), and still curved at the key.
34. The slot stands at the drop zone's lower rim at its right end (`SLOT.cx` at 0.84 of the zone's width, `SLOT.cy` 9 px under the form's lower edge; it was at 0.62 and 30 px under). The sheet lies over the drop zone and goes in at the rim. Answers R8-1 issue 3 and R3-1 issue 6, and keeps the Browse files chip clear.
35. The leans of `TUG_CURVE` are mirrored: the cursor stands up and to the left of the slot, over the sheet, tip up and left. Supersedes 25.
36. The body lies in line with the pull and leans further back with strain (`ARM.lean` 0.35, `ARM.back` 0.45 in `body.ts`; the sign of the old rule was the other way, so the body leaned into the slot).
37. `TUG.reach` rest 43, least 37, most 52.
38. `TUG.least` 21 (was 10): no hand is nearer than 21 px to the slot, so no hand is on the machine while the sheet is held.
39. The camera, by the Builder's note 1 of round 4: one straight move in between 20.9 and 21.95 s, one frame, one straight move out between 28.3 and 29.1 s (`TUG_FRAME`, `CAMERA`, `glide`). The eye goes down one line with one quintic ease on all three coordinates and looks straight down all the way; the point of the page at 520, 703 keeps its place on the screen (a test holds it within 0.01 px). The frame is 620 px of page wide, its top at page y 476, its right edge at 972: it holds the prompt whole (9 px inside the left edge), the chip, the rim, the slot, the machine, the whole cursor at its highest (tip at y 505 at 22.9 s, 90 px of screen inside the frame) and where the pile lands (y 727). 590 px with its top at 514 cut the tip at 22.85 s; a frame closer than 617 px with its top over 490 cuts the prompt's first letters. Supersedes the frames of the ruling of 17:35Z.
40. The sheet takes one soft slanted bend in tone between the hands and the mouth (`BEND` in `paper.ts`) and a deeper shade where it goes in (`MOUTH` 0.36, bent 0.3); the crease picture shows at 0.09 to 0.39.
41. The hands (R9-1 issue 1, R9-2 issues 1 and 2): no sheen, roughness 0.78, a flatter and smaller palm (8.2 by 7.4 px, it was 9.2 by 9.4), three fingers 2.3 px thick set 3 px apart with a splay that stays when shut, a shorter curl (`HAND.curl` 0.5, `knuckle` 0.65) so the fingers lie over the sheet's edge and are seen one by one, and a fist that swells 0.08 and not 0.4. About 14 px long, a fifth of the body. Arms removed: declined by the Builder.
42. The bite comes first (R9-1 issue 9, R9-2 issue 12): the sheet settles on the mouth in the first half of the 0.4 s of the feed, 9 px short, holds, and is jerked down those 9 px in the last 0.11 s (`BITE.jerk`, `settle`, `snap`), so the tug starts with 0.125 of the sheet gone (first row of `TUG_CURVE`, it was 0.05). The cursor has let go at 21.62 and steps up over the sheet's top before the bite (one move of the pointer, 21.65 to 21.97 s), so the arms come out at 22.03 from over the sheet and reach down to it.
43. The machine's shadow (R1-1 issue 2, R3-1 issue 10): the housing, the rollers and the hood no longer cast; a dark block inside the walls, 13 px high, casts in their place (`CAST` in `shredder.ts`), so the shadow stays close round the foot. The dark of the opening round the unit is 1 px wider than the slot (`SEAT`). The stage light is not touched. The strips still cast their own thin shadows.
44. The sheet's creases (R1-1 issue 8, R3-1 on the sheet): four broad creases fixed to the stock (`CREASES` in `paper.ts`), each a line with a darker facet on one side and a lighter one on the other and a shallow valley along it, laid in the vertex colours like the bend, 0.09 to 0.16 of tone, shown while the hands hold the sheet. Seen at review tier at the key beside the frame before: the first strengths (0.04 to 0.075) did not show on a stock this bright.

## Numbers of 25 November (MEASURED)

- `npm run still -- --key step1-tug --format hd --tier draft`: 10.0 to 10.6 s, 676,981 triangles, 310 draw calls.
- `npm run still -- --key step1-tug --format hd --tier review`: 20.5 to 22.0 s.
- `npm run sheet -- --beat step1.tug --tier draft`: 27 to 29 s for 12 frames.
- `npm run measure -- --unit step1 --tier review` on 158dd3d: 8 green, M3 0.9758, 2 min 13 s.
- The key alone at review with the measure's `highFrequencyEnergy`: 1.02 at 590 px with the top at 514, 0.96 at 620 px with the top at 476.
- No new texture: the arms keep the 64 px rubber grain (0.02 MB), the sheet's bend and creases and the machine's caster are geometry and vertex colour.

## Still weak

- The sheet's outline is straight: no buckled silhouette, no uneven edge, no thick turned corner in the tug (the dog ear shows only before the bite).
- The strips are flat ribbons of one tone; no curl or twist.
- At the key the left arm goes under the body for a third of its length, and the lower third of the still frame is bare page.
- Between 27.1 and 27.4 s the arms hang with the hands just over the rim above the machine while they spring back.
- (Decision 45.) `TUG.least` 28, supersedes 38: at 26.4 s with 21 the lower hand of the tilted pair lay at the machine's north edge. The last haul leans 0.15 and not 0.51 (`TUG_CURVE` row 4.6), so the cursor still moves more than 5 px in every second with the longer least hold.
