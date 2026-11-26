# Frame finisher: notes

Branch `agent/frame-finish`, from `origin/main` cfd83123. Folders: `src/table/real/frame/`, `hardware/`, `play/`.

## What the approved images show in my parts that a quick look misses

1. The bright metal of the cabinet is one thin continuous land on the top edge, with rounded front corners and a single bevel line; every inner wall under it is a dark navy mirror that carries a row of small warm lamp glints, never a grey face.
2. The apron is two thick cream slabs with soft rounded edges and nothing on them; the only feature is the brass edged serif plaque over a dark drain.
3. The bats are three layers seen from above: orange top, a black rubber band, orange again, with one small dark screw at each end, and they sit on small chrome posts with no pale piece under them.
4. The steel balls in `reply-all` are dark: most of each ball is the dark room, the lamps are two or three small sharp glints, the lower half takes the green of the floor, and no two balls show the same picture.
5. The loader ring is turned aluminium with a deep dark bowl and a highlight that runs round unbroken; the tube leaves through a notch with a lip round it, and each collar throws its own short diagonal shadow that touches the collar.

## Round 12 issues that are mine and still true on main (cfd83123), severe first

Seen in draft stills of `table-wide`, `youre-fired`, `reply-all`, `loader-page` beside the approved images, 10:02 to 10:10 UTC.

1. severe, `table-wide` R1-1 issue 1: "Broad, flat gray metal faces and boxy tier dividers dominate the build". True: near wedges, inner faces of both side rails, top wall, riser faces. (`frame/tier.ts`, `frame/apron.ts`)
2. severe, `last-save` R1-5 issue 4 and `rail-cam` R1-5 issue 1, my share: "dark frame". True in `youre-fired` too: the walls behind the firehouse are pale grey panels where the approved has near black walls with a thin lit rail.
3. major, `tier-street` R1-4 issue 9: "the side rails are wide flat grey panels with rivets". True.
4. major, `tier-corporate` R1-2 issue 9: "outer strips are pale smooth grey", asked "dark navy panels with gold edging". True for the walls (the lamps are the lights folder's).
5. major, `table-wide` R1-1 issue 11 and `clear-ball` issue 18: "bumper tops read as flat ivory discs on beige drums". True in `reply-all`: a shallow dish with a dark rolled rim, no step, no sip hole, cup wall barely seen.
6. major, steel balls in `reply-all` (brief point 3): the three balls read as grey glass with the same ring of highlights on each. True.
7. major, `loader-page` R3-3 issue 1: "The grazing highlight breaks into evenly spaced radial wedges". True. R1-1 issue 5: "inner rim a continuous white line, and the dark dish lacks the target's deep concavity". True. R1-1 issue 7: "the collars wash out nearly white". True. R3-1 issue 2: "the tube reads as an even gray strip ... shadow is broad without a tight contact line". True. `rest-step3` R3-2 issue 5: "no fitting or flange". True.
8. major, `table-wide` R1-1 issue 13 and `tier-street` R1-4 issue 16, `last-save` R1-5 issue 8, `clear-ball` issue 16: "Muted ochre flippers", "no dark rubber edge", "thick white plastic bracket frames". True in `reply-all`: flat amber bat, dark base only at the far edge, pale screw.
9. major, `table-wide` R1-1 issue 14: "dull brown knob and a weakly separated coil in empty-looking gray metal". True.
10. major, `table-wide` R1-1 issue 10 and R8-1 issue 5: "thin white type sits on a busy, bright skyline". True.
11. major, `tier-street` R1-4 issue 15: "the apron is cool grey with large inset panels". True (the signs and displays stay by ruling; the slab tone and shape are mine).
12. major, `tier-street` R3-3 issue 3: "Bright wire ends cross the garage lip and stop in midair". True. `rail-cam` R1-5 issue 6, `last-save` issue 10, `table-wide` issue 12: "thin white angular wireframe". True.
13. minor, `table-map` R3-2 issue 7: "The joints between tiers are plain grey blocks". True.

Not mine, seen while looking: the arrow face is grey in every key (ball finisher); the signs on the street buildings are bold sans on tan (models); the `reply-all` view is far more top down than the approved (machine finisher).

Added after the list was sent:

14. major, last screen, from the machine finisher at 10:16: the drain plaque on `step3-result` wants an edge, a recess, a metal frame like the other hardware and a contact shadow, with the tube seated in a fitting. True. Its left edge can not be lined up with the results panel in my folders: the drain rail and `OUTLET` are not mine to move.
15. round 12 motion, from the Builder, before my own list: R4-3 issue 2, the bumper cap does not move on the frame of contact; R4-3 issue 3, the pocket left of the envelopes tray (the `office.inbox` scoop) stays inert; R4-4 issue 2, nothing is seen to move at the You're Fired seat; R4-4 issue 1 and R9-1 issue 3, the steel balls of the Coffee release read as copies of the clear ball.

16. minor, `tier-street` R1-4 issue 17, from the Builder at 11:19 by way of the street finisher: "a row of pale green fence posts". They are the drop targets before the bank (`play/targets.ts`). True: pale green plates. Now navy enamel plates with a brass edge and a dimmer stone relief.
17. M3, MEASURED 11:11 UTC at draft (`npm run measure -- --unit pinball --only M3 --tier draft --format hd`): 3 of 10 keys red, `rail-cam` 0.51, `youre-fired` 0.71, `tier-corporate` 0.78 against 0.8.

## Looks by part, this round (limit 40 each)

One draft still of a key counts once for each of my parts judged in it.

| part | looks |
| --- | --- |
| table-frame | 32 |
| marquee | 9 |
| loader | 13 |
| table-hardware | 19 |
| lift | 0 |
| flippers | 5 |
| bumpers | 13 |
| targets | 2 |
| ramps | 14 |

## Counts (`npm run counts -- --key table-wide --live low`)

Each cell is draw calls / triangles.

| when | scene calls | table-hardware | table-frame | targets | flippers | loader | bumpers | lift | ramps | marquee |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| before, cfd83123 | 201 | 21 / 31056 | 16 / 11980 | 15 / 23180 | 12 / 27120 | 10 / 15974 | 8 / 41304 | 8 / 10166 | 5 / 20920 | 4 / 1528 |
| first pass, 10:51 UTC | 201 | 21 / 31484 | 16 / 11936 | 15 / 23180 | 12 / 29808 | 10 / 22214 | 8 / 49488 | 8 / 10166 | 5 / 19144 | 4 / 1688 |
| second pass, 11:54 UTC, f8ebae70 | 198 (rows 203) | 21 / 31868 | 16 / 11936 | 15 / 23180 | 12 / 29808 | 10 / 22214 | 8 / 49488 | 8 / 10166 | 5 / 23624 | 4 / 1688 |
| end, 12:24 UTC, 3286ac81 | 198 | 21 / 31868 | 16 / 12116 | 15 / 23180 | 12 / 29808 | 10 / 22214 | 8 / 49488 | 8 / 10166 | 5 / 23624 | 4 / 1528 |

Sum of my rows at the end: 99 calls (99 before), 203992 triangles (183228 before, 20764 more of 30000 allowed).

Tier keys at the end, 12:24 UTC (scene calls / triangles; before my work UNKNOWN, never measured): `tier-street` 107 / 298644, `tier-office` 128 / 351041, `tier-corporate` 110 / 270383.

Draw calls of my folders: 99 before, 99 after. Triangles of my folders: 183228 before, 199108 after, 15880 more against the 30000 allowed.

## Decisions

1. Walls: every upright face of the rails, the risers and the near wedges is deep navy (`METAL`, `RISER`, `LEDGE`, `WALL`). Bright metal is kept to the chamfer lines. The land on top of each rail and the near band are the cabinet's cream enamel (`ENAMEL` in `frame/tier.ts`, `BAND` and `FRONT` in `frame/apron.ts`), as the approved rim is cream all round.
2. Brightness of `table-wide`: the navy walls took the mean to 0.91 of the approved. Cream boxes laid in the paint mesh made it worse (0.83) and were taken out; cream as a vertex tone of the metal mesh brought it to 0.952. The enamel is stepped up on the two far tiers (`FAR` 1, 1.2, 1.38) because the surround there takes only fill light. What is still darker than the approved is the floor between the bats and the bumpers, which is the lamps' to set.
3. Steel balls: a third material in `table-hardware` (`ballOf`), dark mirror steel with a room turned for each ball. It replaces a material, so the draw calls stay the same. The test of the material count now expects 3.
4. Scoop ejector: every scoop hold has a dark housing (fine mesh) and a chrome slug that strikes when the hold lets the ball go. The slug is a morph of the bands mesh, driven from `model.<hold id>` values 1 and 2 by `kickOf`, so it costs no draw call. It is seen at the You're Fired seat (`model.street.firehouse`) and at the inbox pocket (`model.office.inbox`).
5. Bumper cap: on the frame of the strike the lid stands 9 px up at once (`lidJump`), the ring and lid swell (`lidPop`) and the lid rocks (`lidRock`), then settle in 0.3 s.
6. The coarse triangle limit in `tests/table-hardware.test.ts` went from 30000 to 31000 for the ejector housings, inside the brief's allowance.
7. Ramps: three wires each side instead of five, 4.3 px thick, darker chrome; under wires stop 50 px short of the garage end, where a receiver cage of two loops and five uprights stands for the ball to drop through. Cross braces are gone.
8. Marquee title: a dark plate let into the picture behind the title, in a thin bright frame. The picture is cut round the plate so the title sits 0.05 px over it.
9. Loader ring: one turned ring of 240 steps with a flange where the tube leaves; each collar and the tube throw their own tight shadow to the lower right.
10. Drain plaque on the last screen: dark recessed plate, raised lip round the slot, three stepped shadow slabs under the plate. Its place is not changed.
11. Orange stays `MACHINE_ORANGE`; the bats got a lacquer coat, a black band and a dark screw. The pale frames under the bats are gone.

12. Plunger knob: a finish of its own (`FIN.amber`: no metal, a thin coat), and a tone that turns with the face (`Geo.tint`): paler to the lamps, deeper in the shade, so it reads as a bead of amber and not as a muddy mirror. The colour stays `MACHINE_ORANGE`.
13. The near wedges that bring the rails down to the apron are enamelled cream on top like the rail lands; only their upright sides are navy. With them the mean of `table-wide` is 1.006 of the approved.
14. Hoops of the wire track every 160 px instead of 288, and the wire at roughness 0.067: bright core, dark edge.
15. The navy of the walls is polished (roughness 0.1 where the vertex tone is dark, in `aluOf`), so the walls show the lamp rows as small glints as the approved inner channel does; the enamel and the brushed lands keep their soft finish.
16. Title plate: dusk plum (0x2b2236) in a thin dark frame instead of near black in a bright frame.
17. Street drop targets: navy enamel with a brass edge (see issue 16).

18. Tier joints (`table-map` R3-2 issue 7): the chute between tiers is a transfer channel now: a dark pressed floor, two polished runners the ball rides on, dark side walls under a chrome top edge (`hardware/tier.ts` `chute`).
19. Wire track: the chrome is helped by a tone that turns with the wire's face (`SHEEN` in `play/ramps.ts`, through a new optional argument of `Bag.add` in `play/g.ts`): a bright line along the top, darker sides, a little light from below. Tried at 0.3 to 1.8 (read as a white wire with a black outline, taken back) and kept at 0.6 to 1.4.
20. Loader ring tones taken down toward the approved image: face 0x44474b, bowl near black (`CUP`), bright lip kept. The first collar under the ring is 18 px long.
21. Marquee title, M4: MEASURED 11:33 UTC by `stillState` of `table-wide` at draft: "THE DAILY GRIND" contrast 27.1 against what lies under it (was 1.68; least 4.5).
22. Agreed with other owners: told the street finisher where the receiver stands (end of rail `highway`, (14.45, 42.75) balls, radius 58.15 px, up to 110 px over the track line), no answer yet. Told the lamp finisher the mean of `table-wide` and the riser measures, no change asked.

23. Cup lids: the lid is matte now (roughness 0.46, a thin coat) and whiter, the lamp shows through it more evenly; the steel ring under the lid is a thin wire (4.8 px, was 7 px) as in the approved image.
24. Steel balls: the room they show is darker overhead with one long cool strip and a brighter window, and the floor in their lower half is stronger, so that they read as mirrors and not as dark glass.

25. Marquee title, M4 (red at 1.68 on merge 34, the Builder's mail of 11:57Z). Cause, MEASURED: the title shape exists only in the state `on`; a marquee built first on the loader's page had no title to place a plate under, and `whole` does not build it again, so every still read after `loader-page` had the cream letters on the lit picture (ink 1.82 on ground 1.06). Decision: no plate and no band. The letters are dark print (0x17131c, not self-lit) on the lit dusk sky, as the approved image has them. MEASURED 12:01 UTC, `npm run -s measure -- --unit pinball --only M4 --tier draft`: pass, 257 runs in 11 stills, least contrast 4.62 (least 4.5).
26. Front corners: the lands that come down from the side rails to the apron were cream enamel and the brightest large things in `table-wide`. They are dark brushed metal now (`SLOPE` in `frame/apron.ts`).
27. Cup lids, second step (the Builder's mail of 11:59Z): white plastic by material and form only. The steps of the moulding are a shade darker than what faces up (`FORM`), the lamp's light through the lid is cooled to a white (`WELL`, `RIM`). No light added, the lamp's level is the lamp finisher's.
28. Steel balls, second step (mail of 12:05Z): paler overhead, a larger window, larger lamps, the floor's colour strong in the lower half and a dark band at the horizon.
29. Loader cup (mail of 12:08Z): done in decision 20 before the mail, near black dish under a bright lip; seen in my still of `loader-page` at 11:43 UTC.

30. Steel balls, third step: stripes overhead tried and taken back (read as drawn); the room overhead is a soft pale glow round the window, the floor in the lower half fades to dark under the ball.
31. Rail cap (the Builder's mail of 12:16Z: walls keep their height, the rail on top wider and bright). The bright brushed land now takes the upper half of the round face that falls to the lane on the left (`CAP.cuts` of `RAIL.cuts`) and the bank and the shoulders of the cradle on the right; its tone is a neutral bright steel (0xeceae3) and not cream; two fine dark grooves run along each land as an extrusion's die leaves them. The walls under it stay navy.

32. Front lands again (the Builder's mail of 12:25Z): the cap's steel tone at a lower level (0.8), so that the bright band runs round the near corners. MEASURED 12:28 UTC `table-wide` draft: mean 1.029 of approved (the Builder measured 0.994 at final where my draft read 1.004); land 78.7 against cap 143.6 and apron 148.1.
33. Wire sheen and M3 on `rail-cam`: MEASURED 12:25 UTC, the same still with the sheen off reads 0.4046 against 0.4048 with it (mean square of the Laplacian over approved's, my own script, which gave the measure's 0.4048). The sheen is not the cause and stays. By thirds of the picture the two middle cells read 0.09 of approved: there the build is out of focus behind the ball, which is the camera's and the look's.
34. Loader ring (the Builder's mail of 12:29Z): the ring's face from 0x44474b to 0x74777b, its edge to 0x66696d, the bowl's base three times lighter so that it shades from dark to mid grey. Seen in my own `loader-page` still at 12:31 UTC before it was kept.
35. Struck cup at `tier-office` (the Builder's mail of 12:34Z). Cause: the lamp's glow shell stood straight while the lid rocked, so one side of the tilted lid came up through the shell and was drawn without it; the torn edge was the two surfaces crossing. The lid also rocked about a point on the floor, which threw it about 7 px out of its seat. Now the shell takes the lid's own tilt and place, and the lid rocks about its own seat. The glow on the lid was first cut from 1.4 to 0.45, which left the lids at rest grey (171), so it is now 1 and the lamp's level passes through `lidGlow` (2.25 l over 1 + 2.65 l), which holds the lid at rest near white and cannot pass 0.85 on a hit. MEASURED 12:43 UTC on the same box: struck deck 198 to 222, lid at rest 199. MEASURED 12:38 UTC on my `tier-office` draft still, box (850,380,1070,600), brightest channel: lid deck 192 to 220 with the middle brightest, the lid at rest beside it 171; whole picture 27285 pixels at 250 or more before and after, so the rest of them are the lamps' and the chrome's.
36. Steel balls (the Builder's mail of 12:32Z): one step tried at 12:41 UTC, a lower half 1.9 times brighter and warmed by the lamp's colour, and a thin pale rim. Seen in my own `reply-all` still: the lower half stayed a flat grey green and the rim read as a plastic bead, no nearer to approved's chrome. Taken out again; open item.

## Measurements

- MEASURED before: `npm test` 1461 of 1461, `npm run build` built, `npm run bots` all clear, 10:03 to 10:06 UTC.
- MEASURED: one draft compare of `table-wide` 48 s, `youre-fired` 42 s, `reply-all` 43 s, `loader-page` 22 s (`/usr/bin/time npm run compare -- --key K --tier draft --format hd`).
- MEASURED: one draft still of `step3-result` 19.9 s (`npm run still -- --id step3-result --format hd --tier draft`).
- MEASURED 10:49 UTC: mean of `table-wide` draft against the approved image 0.952 (approved 58.5, 55.8, 51.5; build 55.6, 52.8, 49.5; PIL `ImageStat.Stat(image).mean`, sum of the three channels).
- MEASURED 10:48 UTC, before the last two tone edits: `npm test` 1464 of 1464 in 116 files, `npm run build` built, `npm run bots` all clear.
- MEASURED 11:25 UTC: mean of `table-wide` draft 0.995 of the approved with cream wedges and polished navy walls; 1.019 at 11:36 UTC after merge 33 (same command as above).
- MEASURED 11:25 UTC in `table-wide` draft (PIL mean of a box, luma): riser street to office 38.6 against street floor 41.0 to 63.9; riser office to corporate 27.5 against office floor 66.2; left wall 30.7, right wall 44.0. No riser or wall is over 1.2 times the floor beside it.
- MEASURED 11:11 UTC: M3 at draft red on 3 of 10 keys: `rail-cam` 0.51, `youre-fired` 0.71, `tier-corporate` 0.78 (least 0.8).
- MEASURED 11:31 UTC, before the title plate was read by the measure: M4 at draft red on "You're Fired" 1.3 and "Corporate HQ" 4.25 (the models' signs) and on the title 1.68; the title reads 27.1 since.
- MEASURED 10:57 UTC: one review still of `step3-result` 56.4 s.
- MEASURED 11:59 UTC: M3 at draft red on 2 of 10 keys: `rail-cam` 0.40 and `lobby-doors` 0.796 (least 0.8); `youre-fired` and `tier-corporate` pass now. `rail-cam` fell from 0.51 at 11:11 UTC; cause UNKNOWN (my wire sheen or the shared look of merge 34).
- MEASURED 12:09 UTC: mean of `table-wide` draft 1.002 of the approved, with the title's band gone and the front lands at 0.95; the lands went to 0.4 after that still.
- MEASURED 12:21 UTC with the wider bright cap (tone 1.9): mean of `table-wide` draft 1.004 of the approved; riser street to office 39.3 against floor 43.1; riser office to corporate 28.0 against floor 79.8; left wall 22.8. The box of the right wall (1560,560,1640,700) reads 59.4 because the cap's shoulder now lies in it, the wall under it is unchanged.
