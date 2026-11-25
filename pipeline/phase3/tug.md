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

## Fix round 3, 25 November, branch agent/paper

Decisions, numbered on from 46.

46. The pickup, the proud hold and the carry play inside the tug frame. `PAPER_REST` is 640, 678 (it was 1078, 854): the sheet slides in under the drop zone's lower rim, left of the slot. The camera goes in between 20.3 and 21.1 s (it was 20.9 to 21.95), so the crouch at 20.78, the heave at 20.99 and the hold are seen at the size of the tug. At home size the arrow is 17 px tall on a sheet of twelve frames and no pose reads.
47. `RESUME` (script.ts): a wind-up where it stands at 19.9, a strut from 20.04 to 20.42 to the right of where the sheet comes in, an eager tap at 20.5, a crouch at 20.78, the grip at 20.96 on the middle of the sheet's right edge (`hold`), a heave with a hop from 20.99 to 21.07, a dip of 9 px under the weight to 21.14, `proud` from 21.0 with the dust-off at 21.1, the sheet held 34 px up over the grip and 16 px higher off the page (`raise`, `high`, `raised()`) and still until 21.36, a strut to the slot to 21.54, a stop over it, the drop at 21.62 as before.
48. The tug's temper (`TEMPER`): two stamps (a hop and a tap, 22.24 and 24.12) and a wind-up before each haul (22.3, 23.0, 23.76, 24.56). In the film the page no longer sets the state from the amount and no longer flinches at each strain: the flinch read as protecting itself. Nothing is cued in the half second before the key picture at 25.125.
49. Scared is held before the loss: the big bite at 25.22 to 25.5, a start at 25.3 and `scared` from 25.32, the body turned back twice (25.62, 26.06) and held while the sheet stands at 0.61 to 0.655, a small win back to 0.63 at 26.22, then the sheet goes in 0.32 s.
50. The loss is at 26.54 (`TIMES.tugFilm` 4.52, it was 5.06) and the body stays lost until 27.38 (`TIMES.lostFilm` 0.84; live keeps 0.3): thrown back at 26.54, small, low and turned away from 27.0, pale. The shredder takes it at 27.38 as before, so `SHRED` and every time after it stand.
51. The frame's top is 205 px over the slot (it was 191): 14 px less bare page under the machine. No further: at 230 the cursor's pile at 28.2 s is cut by the lower edge.
52. Declined to `/root/acting_closer`: holding the tug frame until 30.25 s. `tests/step1.test.ts` holds the camera at home once the form says the resume was received, and the message would be cut by the frame.

Tests changed, each where a number of mine changed: `tests/step1.test.ts` and `tests/cursor-act.test.ts`, the arms are out for more than 4.4 s (it was 5: the tug is 4.52 s).

53. The held sheet is folded (`FOLD`, `folded`, `fold` in `real/paper.ts`): a ridge from each hand to the mouth where the pull runs, a buckle between them, a dent under each thumb, the free top edge curled up between the hands and the two side edges curled. It is a height field over the solved grid, in step with the bite and the hands, stronger with the pull. Three things are made from it. The grid is moved along its normals by 0.4 of the height (round ridges). The normals turn by 0.4 of its slope. The light of the folds is painted in the sheet's vertex colours (`foldTone`): the slope of the sharp-crested ridges toward the key, 0.75 of it, at most 0.1 lighter and 0.3 darker. Tried and dropped, each rendered and looked at: turning the normals by the full slope of a sharp ridge drew a dark saw edge along the grid's diagonals at both tiers; moving the grid by the full height put the print, which is laid on few points, under the sheet. The four older soft creases (`CREASES`) are kept at 0.45 of their shade: at full they read as smudges beside the new folds.
54. The thumb dents are where `/root/arms_fixer` lays the thumbs (its message of 21:40): 3.5 px inside each side edge, the left 0.1 of the sheet's length under the top corner, the right 0.06. `TUG.hands` is unchanged.
55. The print is finer and lighter: the title ink is 0x606166 (it was 0x2b2a28), the bars 0xa3a4a8 (0x8c8c90) and 0.8 px high (1.1), the lines between them 0.6 px. The title stays 14 px: it is the smallest type the measure allows. The print rides 0.5 px over the sheet (`PRINT_LIFT`, it was 0.12) so no fold comes through it.
56. The frame of the machine (`EAR` in `real/shredder.ts`): an anodised plate (0x8f939a, roughness 0.55, darker than the housing) at each end of the opening, 6.6 px wide, flush with the page (0.36 px proud), a 0.32 px dark seam round it and two socket screws through it. The two panels run between the plates. A plate grows out from the opening's end as the panels part, so nothing shows on the page at rest. The dark line round a panel's foot is 0.4 px (it was 1), a seam and not a border.
57. The strips (`TIP` in `real/shredder.ts`): the free end of each rolls up off the page by 1.3 to 3.9 radians, from 0.4 to 0.62 of its length, each from its own numbers; the twist along a strip is up to 1.3 radians (it was 0.45). A strip is 36 segments (it was 26). The shadow of each is its own: the strips mesh casts. A strip comes out up to 0.17 radians askew (`STRIP.askew` 0.44 in `index.ts`, it was 0.2) and sways up to 0.07 of its length (0.035), so the strips cross.
58. Item 4 is answered in part only. The frame cannot go up or in: the cursor's pile at 28.2 s reaches 143 px under the slot and the frame's lower edge is 144 px under it, and the Builder's note of round 4 and `tests/step1-script.test.ts` hold the frame still between the move in and the move out. What fills the lower part now is the curled strips with their shadows and the two plates.
59. The crease picture is laid on stronger: `normalScale` 0.16 + 0.5 x the sheet's use (it was 0.09 + 0.3). The picture itself is unchanged (512 by 704 px, 1.83 MB). Looked at in the review still: fine light crease lines show across the sheet.
60. The measure at the review tier, on the tree of 26a8455: 8 green, 0 red. M3 for `step1-tug` is 0.8491 (main had 0.8846): the lighter, finer print holds less fine detail than the old heavy print (the title's edges alone lost about half theirs). The region of the sheet holds 11% of the frame's fine detail and the strips 5%. If a later merge brings M3 under 0.8, the lever is `INK.title` in `real/paperStock.ts`.

Still wrong, looked at in the compare of `step1-tug` and the sheets of `step1.resume` and `step1.tug` at the draft tier:

- The sheet is smaller in the frame than the approved one. Its folds now have a dark side and a crest, but the left one is faint and none is a hard crease as in the approved image.
- The title is still the heaviest thing on the sheet: at 14 px it is three quarters of the sheet's width. The approved title is a third of it.
- The strips' rolled ends are short and read as nubs at the film's size.
- The lower fifth of the key frame is bare page.
- At the pickup the grabbing hand crosses the card's rim. The two stamps of the temper are small at the sheet's size.

