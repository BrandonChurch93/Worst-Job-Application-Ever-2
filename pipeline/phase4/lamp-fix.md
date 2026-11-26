# lamp-fix: the light in the machine and the printed floors

Agent `lamp_fixer`, parts `table-lights` and `tier-art`, branch `agent/lamp-fix`, from main 997de9fb. Started 2026-11-26 06:55 UTC.
Earlier owners' notes are read, not edited: `lamp-keeper.md`, `table-light.md`, `lights.md`, `art.md`.

Labels: MEASURED (a command was run and its number read), STATED (read in code or a note), UNKNOWN.

## Start

- MEASURED 06:56 to 06:57 UTC on untouched main: `npm test` 102 files, 1390 of 1390 passed; `npm run build` exits 0; `npm run bots` prints "bots: all clear".
- MEASURED: `node assets-src/table/lights/look.mjs --name b0 --keys <all ten>`: one draft still with its pair takes 15.1 to 28.1 s (table-wide 28.1 s, tier keys 15 to 17 s).
- MEASURED: `npm run build && npm run counts -- --key table-wide --live low`: table-lights 8 meshes, 8 calls, 22662 triangles; tier-art 6 meshes, 6 calls, 3534 triangles; 201 draw calls of 300.

## What the approved images show in my part that a quick look misses

1. The light of a close view comes from one side and behind: in `reply-all` and `last-save` every cup, ball and sling throws one long soft shadow toward the lower left, and the floor between things is dim. There is no even glow from above.
2. The floor is not lit by pools. It is a dark mirror: what makes it read as lacquer is the short, warm, sharp picture of each window and lamp standing in it, and a broad dull sheen that breaks on scuffs.
3. An insert is almost nothing: one slim brass ring, a milky lens level with the floor that is brightest in the middle, and fine dark line art. No dark well, no second ring.
4. The Street print is broad: wide teal road bands, thin white lane lines, one dashed centre line. There are no plots or bays in fine line. The Office print is a slate-teal field with a pale cross and a fine speckle, and about six loose things on the whole tier.
5. The lane lamps are warm rectangles that sit in a dark metal channel and are mirrored in its steel wall. The beacon is clear ribbed red plastic with a small white-pink core, a chrome collar, and red light lying on the roof around it.

## Issues of round 11 that are mine and still true on main (b0 stills, 07:00 UTC)

Severe:

- R1-3 issue 2 (`reply-all`, also `tier-office`, `last-save`, `rail-cam`): "lit flat from above with even brightness and pools of lamp glow; -a has a warm oblique key light, so one side is lit and shadows fall long, dark and soft to the lower left". Still true: nothing that stands throws a shadow, share of the frame darker than 24 is 3% in the build and 15% in the approved image.
- R1-4 issue 2 (`tier-street`): "dark technical artwork with fine parking grids, outlined plots and repeating soft pools. The target reads as a deep glossy petrol-blue playfield with broad painted roads, distressed markings, fine irregular wear and crisp warm reflections". Still true.
- R1-1 issue 2 (`table-wide`): "-b is darker, muddier and cooler, with far fewer lit inserts, and the strip of lamps along the inner right wall is missing". Still true: mean 0.84 of approved.
- R1-2 issue 3 (`lobby-doors`), my half: "Cold hard glints and repetitive whitish overhead lamps dominate instead of warm lobby spill. The floor picks up broad white glare". Still true.

Major:

- R1-3 issue 7 (`tier-office`): "coarse, bright green carpet grain with tan felt strips; -a's floor is a smooth, muted slate-teal with a fine speckle, and -b also adds heavy clutter piles". Still true.
- R1-5 issues 7 and 12 (`rail-cam`, `last-save`): "Fine grid art, highly legible road markings and long straight white light streaks dominate"; "fine blue grit over grid-printed road art. The red, white and amber inserts look like intense stepped concentric buttons". Still true.
- R1-4 issue 13, R1-5 issue 20, R1-2 issue 13 (inserts, all tiers): "Heavy concentric black surrounds and broad even gradients make the centers look like recessed instrument dials"; "Several dark and red concentric rims"; "multiple concentric gold bands". Still true.
- R1-4 issue 9, R1-2 issue 6 (lane lamps): "The capsules float in circular cyan halos on open flat lanes; the target has warm, wide rectangular inserts seated into rounded dark metal". Still true.
- R1-2 issue 5 (`tier-corporate` floor): "Oversized dense gold arcs and a prominent stair or grille pattern under the center inserts". Still true.
- R1-4 issue 18, R1-5 issue 17 (beacons), my half: "an evenly luminous ribbed cap with almost no local bloom", no red on the roof. Still true.
- R1-1 issue 12 (sheet `clear-ball`), my half: "green speckled, terrazzo-like grain under flat, even light". Follows the Office floor.

## Brightness on untouched main

MEASURED 07:01 UTC, `node assets-src/table/lights/means2.mjs b0` (whole frame at 960 by 540; mean colour, share darker than 24, share brighter than 200, build over approved in luminance):

| Key | Approved | Build | Ratio |
| --- | --- | --- | --- |
| loader-page | 210,208,203 | 214,211,206 | 1.02 |
| table-wide | 58,56,52, dark 47% | 50,47,43, dark 51% | 0.84 |
| tier-corporate | 61,59,57, dark 36% | 68,66,64, dark 24% | 1.12 |
| lobby-doors | 78,74,70, dark 18% | 73,68,65, dark 26% | 0.92 |
| tier-office | 87,87,77, dark 10% | 89,91,78, dark 1% | 1.04 |
| reply-all | 85,87,81, dark 15% | 90,88,70, dark 3% | 1.01 |
| tier-street | 65,67,64, dark 20% | 71,71,66, dark 19% | 1.06 |
| youre-fired | 58,48,47, dark 32% | 65,57,51, dark 29% | 1.16 |
| rail-cam | 58,59,58, dark 20% | 59,49,44, dark 31% | 0.86 |
| last-save | 85,84,80, dark 16% | 82,76,65, dark 20% | 0.91 |

## Looks

Counted from the first still, by part. Limit 40 a part in this round.

| Time UTC | Part | Stills | What | Running: lights, art |
| --- | --- | --- | --- | --- |
| 07:00 | both | 10 | b0, all ten keys, untouched main (7 booked to lights, 3 tier keys to art) | 7, 3 |
| 07:08 | lights | 3 | k1, head lamps first time: reply-all, tier-office, last-save | 10, 3 |
| 07:10 | lights | 4 | k2, general lamps of the Office down: reply-all, tier-office, last-save, rail-cam | 14, 3 |
| 07:12 | lights | 3 | k3, general lamps of all tiers down, head lamps up: reply-all, last-save, table-wide | 17, 3 |
| 07:14 | lights | 1 | k4, reply-all with the head lamps off, to see what the rest gives alone | 18, 3 |
| 07:23 | art | 4 | a1, new Office and Street floors: reply-all, tier-office, tier-street, last-save | 18, 7 |
| 07:29 | art | 4 | a2, flush inserts, warm lane lamps, no printed halos: tier-office, tier-street, tier-corporate, last-save | 18, 11 |
| 07:33 | lights | 4 | a3, head lamps down a step: tier-corporate, tier-office, tier-street, reply-all | 22, 11 |
| 07:39 | lights | 2 | e1, every lamp of mine off, to see what the page alone gives: tier-street, tier-office | 24, 11 |
| 07:41 | lights | 4 | p1, pools down, head lamps up: tier-street, tier-corporate, tier-office, reply-all | 28, 11 |
| 07:44 | art | 4 | p2, head lamps fall off across the tier, darker lens, wider seat: tier-street, tier-corporate, tier-office, reply-all | 28, 15 |
| 07:49 | lights | 4 | p3, beacon light on the roofs, bluer Street: tier-street, youre-fired, rail-cam, table-wide | 32, 15 |
| 07:55 | both | 4 | m1, light on the riser faces, walls that look across a tier mirrored: youre-fired, last-save (art), table-wide, lobby-doors (lights) | 34, 17 |
| 07:58 | both | 3 | m2, a front's image in the lacquer worked out from the wall itself: youre-fired, lobby-doors (art), table-wide (lights) | 35, 19 |
| 08:01 | both | 3 | m3, riser light and mirror down a step: youre-fired (art), table-wide (lights); one review still of reply-all for its time (lights) | 37, 20 |
| 08:10 | both | 3 | s1, head lamps lower so shadows run longer, Corporate floor thinned: tier-corporate (art), reply-all, tier-street (lights) | 39, 21 |

Round 2 of the critics began at 08:15 UTC, so the count begins again here.

| Time UTC | Part | Stills | What | Running: lights, art |
| --- | --- | --- | --- | --- |
| 08:16 | art | 4 | w1, worn patches in the lacquer: youre-fired, rail-cam, lobby-doors, last-save | 0, 4 |
| 08:17 | art | 2 | w2, the patches stronger: youre-fired, rail-cam | 0, 6 |
| 08:21 | lights | 4 | w3, the night floors keep more of their print along the floor: rail-cam, youre-fired, last-save, lobby-doors | 4, 6 |
| 08:25 | lights | 4 | r1, head lamps weaker on what stands over them: youre-fired, tier-street, tier-corporate, table-wide | 8, 6 |
| 08:27 | lights | 3 | r2, the same from 60 px up, beacon light nearer its beacon: youre-fired, tier-street, tier-office | 11, 6 |

## Decisions

1. Point 2, the side light. Each tier has one bar of warm spots hidden under the cross rail at its head, right of the middle, aimed down the tier: `src/table/real/lights/key.ts`. It is a lamp of the machine: it follows the tier's general lighting and has its own solo name `<zone>.key`. It costs no light of `ctx.light` and no shadow map (`TRUE.shadows` stays 0): the shadows of everything that stands are worked out once per tier from the layout as a height map swept away from the lamps, three times for a soft edge that widens with distance; the balls and the flippers move, so their shadows are worked out in the shader from their places each frame.
2. The pit rails and the sling walls do not throw the head lamps' shadow: the rails would put the whole right side of a tier in the dark, and the sling's body is filled in as one block instead.
3. With the head lamps on, the general lamps of a tier are lower (Corporate 1.45 to 0.8, Office 0.6 to 0.14, Street 1.2 to 0.7) and the soft fill is lower per tier (`SOFT` in `colours.ts`), so a shadow is dark and the head lamps are what shapes a tier. MEASURED with `node assets-src/table/lights/means2.mjs k4 reply-all`: with the head lamps off `reply-all` stands at 0.91 of the approved mean, with them on at 1.26 (k3). The Office floor print is still too light and too green for that light; point 4 takes it down, and the brightness is set after it.
4. Point 3, the Street floor. The grid is gone and the plots are broad faint slabs without outlines; the road lines are wider and brighter, the kerb has no ticks, and 150 fine scratches lie in the lacquer (`wear` in `assets-src/table/art/tiers.mjs`). The reflections of the lamps are shorter and softer: `STREAK` in `hook.ts` (far 2.8 to 1.25, level 2.6 to 2.2, long 3.5 to 2.0).
5. Point 4, the Office floor. Slate teal instead of bright green, cream squares greyer, the carpet strokes replaced by a fine speckle, the clutter thinned to one sheet, one tab, four clips, one band and five dots.
6. Point 5, the inserts. No printed ring and no trim ring: a frosted milky lens with a finer line (9 px in the atlas), the glow brightest in the middle, the lens 0.35 px over the floor with a low dome, and one slim seat of warm metal round it in `lamps.ts` (vertex colour in the mesh that was there, no new draw call).
7. Point 6, the lane lamps. Warm lens, wider than long, in a frame of dark metal; the printed round halos under every lamp are gone from the floors. AGREED with `/root/frame_fixer` at 07:29 UTC: I draw the seat of every lane lamp, they draw none and keep only the edge strips of the lane.
8. Nothing is printed round a lamp or a window on any floor any more: what is round a lamp is metal in `lamps.ts`, what is in a window is the atlas.
9. Brightness after a3, MEASURED with `node assets-src/table/lights/means2.mjs a3`: tier-corporate 1.14, tier-office 1.08, reply-all 1.11, tier-street 1.15 of the approved means. Taking the head lamp of the Street from 1.1 to 0.9 moved its key by 0.01, so what is too bright there is the floor under its own lamps, not the head lamp.
10. MEASURED with every lamp of mine off (`e1`, a line in `pose` that set every colour to nothing, taken out again): tier-street stands at 0.59 and tier-office at 0.47 of the approved mean, and the floors are black. So all the light on a floor is mine, and the brightness of a tier is what the head lamps and the pools add up to.
11. The pools of every lamp are now a share of what they were beside the head lamps (`POOL` in `colours.ts`: Corporate 0.55, Office 0.6, Street 0.5; the flash keeps its whole), and the head lamps fall off across the tier from the corner they stand in to the far corner (`SHADOW.near` 1.5 to `SHADOW.far` 0.22 in `hook.ts`). One side of a tier is lit and the other is dim, which is what the approved tiers show. This is not a general fill: it takes light away.
12. Inserts, second step: the lens is darker toward its rim and the glow falls off faster, so the middle is the bright part; the seat is 6 px wide so it is seen from the tier cameras; a window at rest glows at 0.3 instead of 0.42.
13. Point 8, the beacons. The cover and the bulb in it are meshes of the Street's models (`src/table/real/models/street/index.ts`, `beaconLens`, `beaconReflector`). My half: each beacon has a lamp of its own 20 px over its roof (`BEACON` in `groups.ts`, with the high lamps, which went from 7 to 9), so its red or blue lies on the roof and the sign round it and follows the group `red` or `blue`. No mesh of mine is in the beacon, so no draw call is added. What the owner of the models must do is in Needs.
14. The Street's ground is bluer (`#0a1c30`, `#12304a`) and its head lamps less orange, so the floor stays navy under them instead of going teal.
15. The Builder's riser check. MEASURED on the `table-wide` draft with a mean of luminance over a box of the still (Python, PIL; boxes 820,545 to 1200,585 and 820,330 to 1200,355; the Street's floor 900,620 to 1150,700): before, the riser faces stood at 31.0 and 32.5 of 255 and the Street's floor at 44.4, so the risers were the darkest large shapes. The head lamps point away from the rail they hang under, so nothing of them reached it. Now a wall that looks down the tier within 150 px of the tier's head takes a share of the head lamps' light (`SHADOW.riser` 0.06 in `hook.ts`): the risers stand at 54.9 and 61.8 and the floor at 44.7. This is on the faces as they are on main at 08:00 UTC; when `/root/frame_fixer`'s aluminium is merged the number has to be measured again and `SHADOW.riser` taken down if the faces come out pale.
16. Point 7, the floor as a mirror. The image of a lit front in the lacquer is now worked out from the wall itself: for a place on the floor the ray to the eye is mirrored and followed to the wall's plane, and where it meets the wall between the sill and the top, in a window's column, the floor shows the window's colour (`MIRROR` in `hook.ts`). So the image stands under its wall from every camera, with the wall's own slant, and is gone from straight above, as a mirror's is. Walls that look across a tier have images too: the firehouse's right wall, the police station's left, the bank's right (`side` in `spillsOf`, 4 images to 7). The image is a row of lit columns, not the drawn windows: a true mirror would cost the tier a second drawing of its models.
17. The lacquer mirrors more at middle angles (the square of the angle term instead of the cube), so a lamp and a front show in it from the film's cameras and not only from along the floor.
18. Corporate floor (R1-2 issue 5): the sunburst went from six double rings with up to 96 rays a band to three single rings with 12 and 24 hairlines, so the marble is the floor and the gold is a few lines on it. The fans beside the carpet stay: the approved floor has them.
19. The head lamps stand lower (the height part of their direction 0.5 to 0.38, Office 0.52 to 0.42) and are stronger by the same share, so a shadow runs about 2.6 times the height of what throws it instead of 1.75. MEASURED after it (`means2.mjs s1`): tier-corporate 1.04 with 26% dark, reply-all 0.99 with 8% dark, tier-street 1.03 with 17% dark.
20. A lit window glows at 0.85 instead of 1.05, so its colour stays deep round a bright middle.
21. The lacquer has broad soft patches where it is duller (`WORN` in `make.mjs`, in the coat map of each tier), and where it is duller it gives back a soft sheen of the light that falls there and veils the mirrored lamps and fronts by half (`SHEEN.worn`, `SHEEN.veil` in `hook.ts`). Seen at `rail-cam` and `youre-fired`: the patches are there and faint.
22. The night floors keep more of their print seen along the floor (`DEEP` Corporate 0.2 to 0.35, Street 0.2 to 0.5), so the Street stays blue with its road lines from the low cameras instead of going grey; the Street's head lamps are a little less orange for the same reason. MEASURED (`means2.mjs w3`): rail-cam 0.97, last-save 0.93, lobby-doors 0.92, youre-fired 1.23.
23. `youre-fired` is over its approved mean by more than a tenth and was so on main (1.16). The picture is mostly the firehouse and the pale bank beside it, whose roofs and right walls face the head lamps. Left as it is in this pass; a lower head lamp for what stands high would darken every roof of the tier.
24. The head lamps hang under the cross rail, one ball over the floor, so they cannot light what faces up above them: a top over 60 px takes less of them, a quarter from 100 px up (`SHADOW.roof`). The roofs keep the tier's soft light, the hidden lamps over the low models and the beacons. MEASURED (`means2.mjs r2`): tier-office 0.99, tier-street 1.02, youre-fired 1.21, and r1 tier-corporate 1.03, table-wide 0.88.
25. A window at rest glows at 0.5: at 0.3 the white and amber windows of the Street read grey in `tier-street`.

## Needs

1. For the owner of the Street's models (none until about 07:45 UTC, so said to the Builder): the beacon's cover should be clear ribbed plastic that shows a small bulb, not an evenly glowing dome. In `src/table/real/models/street/mats.ts` the lens could go to a low emissive (about 0.25 of the group's level) with `transmission` or a low opacity and its flutes kept, and the bulb in `beaconReflector` to about 4 times the group's level (`LENS.on` in `src/table/real/lights/colours.ts` is 4.2), taken from `levels(ctx, zone).byName.red` and `.blue` as now. The light on the roof round it is done on my side.
