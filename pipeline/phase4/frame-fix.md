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

Counted at 09:33 UTC. One still that shows several parts is counted on the part it was rendered for. The limit is 40 a part.

| part | looks | what |
| --- | --- | --- |
| table-frame | 28 | 2 baseline compares, 8 table-wide stills (rail ends, risers, marquee, title), 2 last-save stills for the shoulder blades, 9 table-wide stills for the dark risers, 7 stills of tier-corporate, tier-office, tier-street and reply-all for the five means |
| marquee | 0 | seen in the table-wide stills, counted there |
| table-hardware | 4 | table-wide stills for the spring, the tier block, the pocket and the lane guides |
| lift | 0 | seen in the table-wide stills, counted there |
| loader | 28 | 1 baseline compare, 17 loader-page draft stills, 1 review still, 4 page stills of the port's answer at 0.57 to 0.63 of pinball.seal, 5 loader-page stills for the soft rim and the collars |
| flippers | 8 | last-save stills, tier-office (2) and tier-corporate after the wire change |
| bumpers | 4 | table-wide crops, 2 tier-office stills for the lids |
| targets | 0 | |
| ramps | 12 | 1 baseline compare, 10 rail-cam stills for the wires, 1 table-wide |

## Decisions

1. No layout value is changed and no part is moved. `table.tierStepBalls` and `table.topFloorDepthBalls` stay 1, as ruled at 07:05Z.
2. The side rails' tops stay at the page's height through the street tier: the feed tube lies on the right rail at height 0 until y 47.95 balls, and a lower rail would leave the tube in the air. The south ends fall over the apron only, as one brushed aluminium wedge down to the low front rim, with no gap between rail and slab.
3. The cross rail's top over the lower floor is 130 px (was 152 px): `WALL.seg` 34 over the one ball riser. Told to `/root/machine_runner`. The test of the lift lane's housing in `tests/table-frame.test.ts` now asks for `BALL * 1.25` (was 1.5).
4. The riser's face is the frame's brushed aluminium, lit by the tier's light, and takes the floor's reflection (`under: 1.8`, `wall: 0.8` in `aluOf`). Where the feed tube dives, the pocket's floor and end cap are aluminium too.
5. The marquee's louvred box is gone: an aluminium stand and beam carry the sign. The title's print is one cream ink (`0xf1e8d2`), its letters come from `content/copy.json` through the shape as before.
6. The lock tube ends in a clear dome on a chrome foot. The plunger shows its spring in an open steel lane. Hardware steel takes the floor's reflection from below (`under: 1.7`): that is what stopped the spring, the housing and the tier block reading black.
7. The loader costs fewer drawings than before (3, was 4 on loader-page): the clamp screws and the bowl are lathes in the ring's metal mesh, the breathing rim and both soft shadows are drawn in the tube's own material by vertex colour, and the metal casts no real shadow.
8. The port reads as the control by depth, a rim of light that breathes over 4.6 s between 0.25 and 0.95, and a tube seen to lead away. The rim is warm white, not orange: the one orange of the page stays the progress button. No word and no labelled button, as the brief declines it.
9. Bumpers are a white domed cap over a copper drum with chrome bands and a metal skirt. The sip hole and the seam of the old cup are gone.
10. Flippers stay `MACHINE_ORANGE`, now glossy, with black rubber and small chrome screws. Rubber rings of posts and kickers are black.
11. Point 8, agreed with `/root/lamp_fixer` in one message: the lamps' seats are drawn in `lights/lamps.ts`, so the frame draws no seat or ring under a lane lamp, only the lane's edge strips, and keeps the lane's floor dark and glossy between them.
12. Sling plates (yellow printed face, chrome shoe, bolt heads) are in the model folders: left, told to /root.
13. The last-save camera ends just under the plaque, so the new drain throat is not in that picture. The camera is `/root/machine_runner`'s: told to /root.
14. Push b644545b went out before the whole test had run on that merge (the merge brought `src/pages/step5/*` and `tests/decision-fix.test.ts`). The whole test right after it was green, 1393 of 1393. Since then the whole test runs after the merge and before the push.

15. The port's answer (R4-3 issue 1) and the outlet's (R4-2 issue 2) are agreed with `/root/machine_runner`: `loader.ring` and `outlet.ring` carry `v: [seconds since the contact]`, 9 before it and capped at 9. The frame reads it in `loaderPose`: the ring is drawn in by 3.4 percent for two frames and rings out over about 0.3 s (`dipOf`), the rim of light flashes and fades in 0.075 s (`flashOf`). No z move: a dip in z sank the bowl under the page. `tests/table-frame-answer.test.ts` holds it.
16. The outlet in zone `last` has a rim of light of its own (mesh `loader.light.last`), at rest at the low level and not breathing: only the page's port breathes.
17. On the page the tube carries three collars to a step by the port, as approved does; lower down the step stays as it was.
18. Lane guide wires are 3.1 px in radius (were 4.8) and the roof wires 2.7 (were 3.8). Ramp wires are 3.1.
19. Ramp wires read as chrome through two new options of `frame/steel.ts`: `thin`, one long white line on mirror wire (roughness under 0.075 only, so a flat chrome screw is not a white disc), and `spark`, how much of the coloured lane sparks stay. The rows of lamps fade where they are closer than about two pixels on screen: that was the banding on the hoops. That fade is in every material that uses the steel, the corporate models' too; it removes only what could not be resolved.
20. Flippers: `MACHINE_ORANGE` (0xc48004) above and below a 10 px rubber band, as approved shows; one chrome pivot screw, no tip stud. The orange reads darker than approved's in the tier stills: the colour is fixed and the light is `/root/lamp_fixer`'s, so it is left.
21. The shoulder guides beside the bats are thin steel blades (4.8 px, were 11.5) on slim posts: a real machine's lane guide is a strip on edge, and the thick bars read as square section.
22. The wire gate across each tier's exit stays: it is the page's `gate.<tier>` and it moves. R1-5 issue 18 names it; whether it should show in last-save is `/root/machine_runner`'s camera and `/root`'s call.
23. The lift's elbows and the plunger's knob stay `MACHINE_ORANGE`; they read dull amber under the tier's light. Left for the same reason as 20.

24. Ruling 09:06Z, risers. The vertical faces between floors are a dark anodised tone (`RISER` 0.2, 0.208, 0.22 and the ledge 0.15, 0.155, 0.165 in `frame/tier.ts`); the two strike strips on the cross rail's face are gone, since they were the bright band; the thin top edges of the rails stay bright aluminium. `table.tierStepBalls` and `table.topFloorDepthBalls` stay 1.
25. The frame's aluminium gives back less of the room: `under` 0.9 (was 1.8), `wall` 0.35 (was 0.8), `ceiling` 0.7 (was 1), `panel` 0.95 (was 1.3) in `frame/mats.ts`. This is my metal, not a lamp: no value of `light.ts` or of the lamps' folder is touched.
26. Bumper lids (ruling 09:06Z): the lid is a lathe with a rolled rim, a groove and a raised deck, and the glow falls with the form (rim 0.6, groove 0.2 to 0.26, deck 0.54 to 0.84), so the lid reads from straight above without a lamp change.
27. The port's hard white line (ruling 08:58Z) is now three falling steps of light (0.62, 0.34, 0.14) set 0.6 px inside the well's lip; the collars on the tube are shaded round by height.
28. The wire gate stays as ruled; its wire was not thinned in this round: UNKNOWN whether a thinner one reads better.
29. The outlet's answer in zone `last` was built and tested but never rendered in a page still: UNKNOWN how it looks.

## Measured

All at 1e39deca unless said. Commands as written.

- `npm test`: 103 files, 1393 of 1393 passed (07:50 UTC). `npm run build`: built. `npm run bots`: "bots: all clear".
- Draft still, `npm run still -- --key <key> --format hd --tier draft --force`: table-wide 43.0 to 51.3 s (last 46.5 s), last-save 43.4 s, loader-page 17.9 to 20.7 s.
- Review still, `npm run still -- --key loader-page --format hd --tier review --force`: 27.6 s rendered, 31 s by the clock (07:53 UTC).
- Draw calls and triangles, `npm run build && npm run counts -- --key <key> --live low`, at 997de9fb then now:

| key | scene calls | part | calls | triangles |
| --- | --- | --- | --- | --- |
| table-wide | 201 to 201 | table-hardware | 21 to 21 | 30368 to 31056 |
| | | table-frame | 16 to 16 | 11732 to 12020 |
| | | targets | 15 to 15 | 23180 to 23180 |
| | | flippers | 12 to 12 | 33216 to 28656 |
| | | loader | 10 to 10 | 13966 to 15406 |
| | | bumpers | 8 to 8 | 48192 to 37848 |
| | | lift | 8 to 8 | 9868 to 10166 |
| | | ramps | 5 to 5 | 18680 to 18680 |
| | | marquee | 4 to 4 | 2168 to 1528 |
| tier-corporate | 111 to 110 | table-frame | 9 to 9 | 8375 to 8395 |
| | | flippers | 5 to 5 | 13840 to 11940 |
| | | loader | 4 to 3 | 3696 to 3382 |
| | | bumpers | 2 to 2 | 17556 to 14304 |
| tier-office | 126 to 126 | table-hardware | 16 to 16 | 26252 to 26596 |
| | | bumpers | 8 to 8 | 48192 to 37848 |
| | | flippers | 7 to 7 | 19376 to 16716 |
| | | lift | 6 to 6 | 7172 to 7470 |
| | | loader | 3 to 3 | 4432 to 4768 |
| tier-street | 108 to 108 | table-hardware | 19 to 19 | 28432 to 29120 |
| | | table-frame | 13 to 13 | 9666 to 9954 |
| | | flippers | 6 to 6 | 16608 to 14328 |
| | | lift | 3 to 3 | 2822 to 3120 |
| | | loader | 2 to 2 | 4352 to 4520 |
| last-save | 122 to 122 | loader | 4 to 4 | 5712 to 6216 |
| loader-page | 64 to 63 | loader | 4 to 3 | 6798 to 6790 |

  All six keys counted again at 1e39deca, 07:54 to 07:56 UTC. Triangles of my folders in table-wide: 191370 to 178540, so 12830 fewer. No key has more draw calls than before, in the scene or in any of my parts.
- Riser luminance in the table-wide draft (PIL, mean of the grey crop): street to office riser face 111.0 and 121.3, office to corporate riser 105.9, left side rail's inner face 89.3, right side rail's inner face 96.0, near wedges 128.5 and 126.8, front rim 94.5. The riser is not the darkest large shape.
- Asset sets, `du -sb`: `public/assets/table/frame` 65310 bytes (0.062 MB), `assets-full/table/frame` 142746 bytes (0.136 MB). There is no `table/hardware` or `table/play` set. No asset was changed.

### After 1e39deca

- `npm test` at f4fc2f8d (08:39 UTC): 111 files, 1438 of 1438 passed. Build built, bots all clear.
- Draft stills: rail-cam 44.1 to 45.8 s, table-wide 43.8 to 44.8 s, tier-corporate 42.9 s, tier-office 40.5 to 41.4 s, last-save 51.4 to 54.1 s (its camera stands further back since main ed3c50c4 and later), page stills of pinball.seal about 20 s.
- The port's answer live: four page stills at 0.57, 0.6, 0.61, 0.63 of pinball.seal. At 0.6 the rim carries a halo and the ring is drawn in; at 0.61 it is back.
- Counts at f4fc2f8d, 08:43 to 08:45 UTC, same command. table-wide scene 201; loader 10 calls 15686 triangles; ramps 5 calls 20920; all other rows as in the table above. tier-corporate 110. tier-office 126. tier-street 108. loader-page 63, loader 3 calls 7070. last-save 189: its camera now shows the whole lower machine, so it is not the 122 of the baseline; each of my parts there has as many calls as in table-wide or fewer (hardware 20, frame 16, targets 15, flippers 12, loader 9, bumpers 8, lift 8, ramps 5, marquee 3).
- Triangles of my folders in table-wide at f4fc2f8d: 181060, so 10310 fewer than the 191370 of the baseline.

### After ab79cbfd, at the last commit of this round

- `npm test` (09:29 to 09:31 UTC): 115 files, 1461 of 1461 passed. `npm run build`: built. `npm run bots`: "bots: all clear".
- The five means by the lamps' tool, `cp out/work/stills/key-<key>-hd-draft.png out/work/lights/fg-<key>.png; node assets-src/table/lights/means2.mjs fg table-wide,tier-corporate,tier-office,tier-street,reply-all` (09:29 UTC): table-wide 0.99, tier-corporate 1.05, tier-office 1.04, tier-street 1.06, reply-all 1.00. Before the riser change table-wide was 1.15 by the same tool.
- Riser against floor in the table-wide draft still, grey means of boxes (`python3 /tmp/meas.py`, boxes x0 y0 x1 y1 in the 1920 wide still): riser between street and office (712, 550, 927, 585) 49.1; street floor (1020, 672, 1115, 752) 42.4, so 1.16 by my box and 0.85 against the lamps' floor figure of 58. Riser between office and corporate (672, 325, 927, 365) 34.9; office floor (806, 403, 860, 430) 64.4, so 0.54. Left side wall's inner face 76.6. Near wedges 120.4 and 119.5.
- Draft stills: table-wide 46.4 s, tier-corporate 44.8 s, tier-office 43.0 s, tier-street 38.7 s, reply-all 41.4 s.
- Counts, `npm run build && npm run counts -- --key <key> --live low` (09:32 to 09:34 UTC). table-wide scene 201: table-hardware 21 calls 31056 triangles, table-frame 16 and 11980, targets 15 and 23180, flippers 12 and 27120, loader 10 and 15974, bumpers 8 and 41304, lift 8 and 10166, ramps 5 and 20920, marquee 4 and 1528. Every part has the calls it had at 997de9fb. Triangles of my folders in table-wide: 183228, so 8142 fewer than the baseline's 191370.
- tier-corporate 110, tier-office 126, tier-street 108, last-save 189: no part of mine has more calls than at f4fc2f8d. loader-page scene 65 (was 63): the loader's row is 3 calls as before, 7358 triangles; the two new calls are in rows that are not mine.
- Asset sets, `du -sb`: `public/assets/table/frame` 65310 bytes (0.062 MB), `assets-full/table/frame` 142746 bytes (0.136 MB). No set for hardware or play.

## The three least real things left, for the successor

1. The cabinet reads as a deep pit: tall side walls and the two near wedges stand high over the street floor (keys `table-wide`, `last-save`). The steps are the layout's; within my files the next move is the wedges' and side walls' tone and a lower inner lip.
2. The orange parts (bats, lift elbows and doors, plunger knob) read dull amber, not approved's bright moulded orange (keys `tier-corporate`, `tier-office`, `tier-street`, `table-wide`). `MACHINE_ORANGE` is fixed; the next move is the gloss and the rim light of `ORANGE_LOW` and of the lift's elbow material.
3. The ramp's wires and trestles are still busier and greyer than approved's four clean chrome wires, and the spiral reads as a drum (keys `rail-cam`, `tier-street`, `table-wide`). After that: the bumper lids' deck is still flat next to approved's cups (`tier-office`) and the port's ring is flatter than approved's polished ring (`loader-page`).
