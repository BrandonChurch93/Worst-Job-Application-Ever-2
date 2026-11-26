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
| table-frame | 13 |
| marquee | 3 |
| loader | 4 |
| table-hardware | 6 |
| lift | 0 |
| flippers | 3 |
| bumpers | 3 |
| targets | 0 |
| ramps | 3 |

## Counts (`npm run counts -- --key table-wide --live low`)

Each cell is draw calls / triangles.

| when | scene calls | table-hardware | table-frame | targets | flippers | loader | bumpers | lift | ramps | marquee |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| before, cfd83123 | 201 | 21 / 31056 | 16 / 11980 | 15 / 23180 | 12 / 27120 | 10 / 15974 | 8 / 41304 | 8 / 10166 | 5 / 20920 | 4 / 1528 |
| first pass, 10:51 UTC | 201 | 21 / 31484 | 16 / 11936 | 15 / 23180 | 12 / 29808 | 10 / 22214 | 8 / 49488 | 8 / 10166 | 5 / 19144 | 4 / 1688 |

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

## Measurements

- MEASURED before: `npm test` 1461 of 1461, `npm run build` built, `npm run bots` all clear, 10:03 to 10:06 UTC.
- MEASURED: one draft compare of `table-wide` 48 s, `youre-fired` 42 s, `reply-all` 43 s, `loader-page` 22 s (`/usr/bin/time npm run compare -- --key K --tier draft --format hd`).
- MEASURED: one draft still of `step3-result` 19.9 s (`npm run still -- --id step3-result --format hd --tier draft`).
- MEASURED 10:49 UTC: mean of `table-wide` draft against the approved image 0.952 (approved 58.5, 55.8, 51.5; build 55.6, 52.8, 49.5; PIL `ImageStat.Stat(image).mean`, sum of the three channels).
- MEASURED 10:48 UTC, before the last two tone edits: `npm test` 1464 of 1464 in 116 files, `npm run build` built, `npm run bots` all clear.
