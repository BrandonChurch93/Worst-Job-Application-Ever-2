# frame-fix: notes of the round 12 frame, hardware and play pass

Branch `agent/frame-fix`, from `origin/main` 997de9fb. Folders: `src/table/real/frame/`, `hardware/`, `play/`.

## What a quick look misses in the approved images (my parts)

1. The rim is one low, wide land of brushed aluminium that runs right round the machine with rounded front corners. It is lighter than everything inside it, and nothing dark stands above it.
2. All steel is thin and round. A rail is a wire, not a bar: its highlight is one hot line with the lamp colours beside it, and the dark side is nearly black.
3. The orange is a moulded plastic with a wet top edge: one long highlight along the shoulder of the bat, a black rubber stripe at mid height, a small chrome screw at each end.
4. The shooter lane is open. The spring is seen, the rod is seen, the knob sits inside the rim.
5. The loader's tube comes out of a notch in the ring, with a collar at the join and a soft shadow to the lower right. The bowl is plain: no rings of dots, no screws.

## Round 11 issues that are my folders' and still true at 997de9fb, severe first

MEASURED by looking at the five draft stills beside the approved images, 06:58 to 07:02 UTC (`npm run compare -- --key <key> --tier draft --format hd`).

1. R1-1 issue 1, severe, `table-wide`. "its front corners open onto dark wood-grain side panels with gaps", "a stack of steep tiers walled by tall black risers". Still true: the two near ends of the side rails are tall dark ribbed slabs with a wood-like grain, the cross rails are black walls. Mine: the side panels, the rail ends, the cross rails' look. Layout's: the depth of the tiers. The camera is not mine.
2. R1-1 issue 4, severe, `table-wide`. "a smaller, thinner strip set higher above a dark louvred box", "title is set in heavy outlined yellow letters". Still true: the louvred box under the sign, the heavy title. The title's face is the shape's (layout), its colour and weight in the picture are mine.
3. R1-1 issue 8, major, `table-wide`. "the ball floats in a black-walled glass tube high on the right wall, the spring is missing, and the plunger is a black rod with an orange knob jutting out beside a dark wood panel". Still true.
4. R1-1 issue 16, major, `table-wide`. "-b caps it with a heavy black disc". Still true: the lock tube's near end is a dark ribbed disc.
5. R1-5 issue 6, major, `rail-cam`. "rails and ties look gray and segmented, with broad flat runs and visible junctions". Still true: the wires are grey-blue and thick, the hoops are flat.
6. R1-5 issue 10 and 14, major, `last-save`; R1-2 issue 12, major, `tier-corporate`. "flat mustard-orange with dull gray hardware", "two dull disks and a visible seam across the top", "conspicuous square-section guides beside them". Still true: the bat has no highlight along its shoulder, the two screws are large dull discs, the rubber band is hardly seen from above.
7. R1-5 issue 9 and 18, major, `last-save`. "the hole barely reads below its label", "a guardrail cuts across the approach". Still true: the drain is a small slot in a bezel.
8. R1-5 issue 19 and R3-3 issue 3, major, `last-save`. "flat light gray with a straight embossed stripe, hard edge and regular pebbled finish". Still true: the slabs are even pale grey with an inlaid line.
9. R1-1 issue 13 and 14, R3-3 issue 8, R3-2 issue 2, major, `loader-page` and `step3-result`. "a bowl with dashed rings and screws", "opaque vertical stripes inside it and almost no shadow", "the tube where it meets the ring has no collar or join", "laid over the rim in projection rather than seated in it". Still true, all four. The arrow in the ball is `/root/ball_fixer`'s.
10. R1-1 issue 15, major, `loader-page` crops. "fewer collars, grey bars inside the tube and dark blocks at the bend". Still true.
11. R8-1 issue 1, severe, `rest-step3`. "The intake looks like an illustration". Mine as ruled: the port has to read as the control without a word.
12. R1-2 issue 14, major, `tier-corporate`. "The elbow is dull yellow-brown and the tube resembles blue-gray vertical linework". Still true on the lift's elbows.
13. R3-3 issue 4, major, `tier-corporate`. "no rubber ring around the posts and no kicker hardware". The ring is drawn but pale (0xdcd8cc) so it is not read as rubber. Still true.
14. R1-1 issue 5 and R3-3 issue 9, major and minor, `table-wide`. "open grey-rimmed cups with an orange-brown fill, like coffee cups". Still true in the wide still.
15. R1-5 issue 15, major, `last-save`; R1-1 issue 17, major. Sling plates: the plate, its print and its shoe are the model folders' (`models/street/things.ts`). Mine are the posts and the ring. Told to /root.
16. R1-2 issue 6, major, `tier-corporate`. "rather than a discrete dark rail channel with inset rectangular lamp windows". The lane trim is mine, the lamps are `/root/lamp_fixer`'s.
17. R1-1 issue 3, severe, `table-wide`. "a tall, oversized wireform ramp". The ramp's path and height are the layout's; its wire thickness and finish are mine.

Not mine, left: R1-1 issue 2 (light), 6, 7, 18 (models), 9 (crop), R3-1 issue 5 (floor art), every ball and arrow issue, every camera issue.

## Looks, by part, from the first still

| part | looks | what |
| --- | --- | --- |
| table-frame | 2 | compare table-wide, compare tier-street (baseline) |
| loader | 1 | compare loader-page (baseline) |
| ramps | 1 | compare rail-cam (baseline) |
| flippers | 1 | compare last-save (baseline) |

## Decisions

## Measured
