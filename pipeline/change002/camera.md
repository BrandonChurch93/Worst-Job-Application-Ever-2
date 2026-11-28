# Camera: the four views of the finishing blast

Unit "camera", branch `agent/b-camera`, cut from `origin/agent/merge55` at ff31d776. Files: `src/boss/finish/camera.ts`, `src/boss/finish/*`, `src/cursor/stand/*`, the blocks `FINISH` and the camera's in `src/boss/tune.ts`, `view()` and `camera()` in `src/pages/step4/index.ts`, `tests/b-camera.test.ts`, `pipeline/change002/camera-*.mjs`, this file and `pipeline/change002/proof/camera/`.
Every number is MEASURED (a run or a render of this branch), STATED (read in code or said by someone) or UNKNOWN.

## What the low angles lay bare (05:50Z, the scene unchanged, film frame 11040, draft tier, software GL)

Pictures: `proof/camera/asis-front.png` (eye 165 px in front of the feet, 45 px up, field 50 degrees) and `proof/camera/asis-behind.png` (eye 250 px behind and to the back of the figure, 100 px up, field 40 degrees). The camera was handed to the page by a look hook that is not committed.

1. The figure leans back 50 degrees from upright (`STAND.rise` 0.698 rad): from the front its white face is turned to the ceiling and shows as a thin wedge; from behind it is a black lump lying toward the lens.
2. The eight pillars and the two panes are sheared, not upright (`ARENA.lean` 0.5 up the screen and `leanX` -0.26 of their height, in `src/arena/layout.ts`): from a low lens they are slabs that lean 27 degrees and more, all the same way. `pillar.3` (563, 925) leans over a lens that stands in front of the figure and fills the left 40 percent of the frame.
3. Past the page's edge there is nothing: a hard line where the floor ends and a dark ground over it. No far wall, no ceiling.
4. The ball of light is a flat star: its rays lie in one plane and show as a fan from the side.
5. The beam is a flat ribbon parallel to the floor.
6. The gold flames hold from both sides. The floor, its seams with the light under them, the fallen boss and the debris hold.

## What is built (07:06Z, head f0ce65df)

One path, `src/boss/finish/camera.ts`, as numbers in the block `CAMERA` of `src/boss/tune.ts`. The camera is a function of the fight's clock and three marks only (`finish-arms`, the thrust or `finish-fire`, `finish-fire`): no wall clock, no chance. It is given as a rig (the point looked at, the turn round it in degrees, the height of the eye in degrees over the floor, the height of the frame in page px at that point, the field) and the rigs are mixed with a smooth step, so each move starts and ends at rest. The horizon is level by construction (`up` is set from the rig, never rolled).

| view | key (offset of the aim from the feet, turn, height, frame height, field) | film, s after `finish-arms` | film frames |
| --- | --- | --- | --- |
| down to V1 | above to `charge`; the turn runs ahead of the drop (`swing` 2) so that `pillar.3` passes to the right of the figure | 0 to 0.95 | 10818 to 10875 |
| V1 the charge | `charge` `{at [-50, 0, 82], az -120, el -3, tall 195, fov 54}`, a slow push of 8 percent over 6 s | 0.95 to 3.23 | 10875 to 11012 |
| V1 to V2 | a move round the figure's ball side, 88.7 degrees in 0.8 s; it starts 0.9 s before the fire; the point aimed at runs ahead of the turn (`lead` 2) | 3.23 to 4.03 | 11012 to 11060 |
| V2 the fire | `fire` `{at [170, 0, 52], az -208.7, el 7.5, tall 325, fov 50}` | 4.03 to fire + 0.2 | 11060 to 11077 |
| V3 the blast | `blast` `{at [170, 0, 52], az -210.7, el 8.9, tall 400, fov 60}`: pushed back as the beam leaves, a shake of 5 px that dies in 0.22 s | fire + 0.2 to fire + 0.4 | 11077 to 11089 |
| rise | `blast` to the close view from above; the height runs ahead (`lift` 2), the lens narrows late (`lag` 2), the frame is 50 percent wider in the middle of the move (`wide` 0.5) | fire + 0.4 to fire + 0.85 | 11089 to 11116 |
| V4 from above | the close view as before, to the pixel | fire + 0.85 to `boss-gone` (1.28 s of the 2.13 s) and on | 11116 on |

- On the live site the same path: V1 comes as the arms come out and holds as long as the visitor charges; the move to V2 starts at the thrust (or at the fire when there is no thrust before it) and takes 0.55 s; V3, the rise and V4 as in the film, counted from the fire.
- The power-up of line 7: `facing(from, feet, k)` gives the same facing view for any feet; `shotNow()` in `src/pages/step4/index.ts` calls it behind `CAMERA.powerUp`, which is `false`.
- `CAMERA.on` false gives the finish from above as it was.

### What the low angles laid bare, and what was built for each

1. The figure lies back 50 degrees. Built: `StandPose.tip`, radians added to the figure's tilt, `CAMERA.upright` 0.75 times how low the lens is. From above (low 0) it adds nothing.
2. The pillars, panes and the wreck are sheared for the view from above. Built with the Builder's yes (N1): one number 0 to 1, `ArenaOptions.upright`, in the NEEDS commit dcb1ef29; at 0 the arena is as it was (digest of the built geometry in `tests/b-camera.test.ts`).
3. The beam is a flat ribbon. Built: `faceBeam` rolls it toward the eye by how low the lens is; flat at 0.
4. The gold flames are flat cards 3.5 px behind the figure's plane: from behind they hid the black back. Built: the cards go to the far side of the plane from the eye (`backOf`).
5. The figure is a flat cutout with a white face and a black back. Not mended: in the move from the face side to the back the eye crosses its plane. SEEN in `proof/camera/turn.jpg` (film 11036 to 11047, twelve frames in a row): from 11040 on the figure is narrower than its own arm, a dark line with the ball in front of it, and at 11047 it has not yet opened to the back. Straight behind is the same line, so V2 and V3 stand 29 and 31 degrees to the back side of the line of the blast (the Builder: 3/4 from behind is the reading of "behind him"). A cut in place of the move would not show the line; the move is built first, as asked.
6. `pillar.3` (563, 925) stands 190 px in front of the figure, where a lens that faces it would stand. The lens stands 30 degrees to the ball side of straight in front and the pillar is out of the frame in V1.
7. Past the page's edge: dark, nothing built.
8. The shout's panel (`CAPTION.shout` in `src/ui/said.ts`, STATED: upper edge y 96, lower edge at most y 330, in the middle of the screen; the shell helper MEASURED x 748 to 1165 for the last syllable at 240 px at the panel's earlier place, UNKNOWN at the present one) lies where a figure in the middle of the frame has its head. Built: V1 holds the figure low in the frame (its point at y 370 of 1080 in frame 11005, read off the picture), V2 holds it to the right of x 1165. UNKNOWN: the panel and the low views in one picture; my frames are the canvas only.
9. The health bar is a shape of the page above the close view; it is in none of the low frames I looked at.
10. The pane `pane.0` (page x 372, y 350 to 750, 240 px high, 14 thick; `PANES` in `src/arena/layout.ts`) stands 194 px behind the figure, where a lens that goes behind it and then pulls back and up would pass. In the film it is a broken stump by then; on the live site it can be whole. SEEN at 6570b145 in the live strip of the visitor who holds 2 s: one frame was a green wash from edge to edge (the lens inside the pane). Built: the rise goes up before it goes back, and a guard (`clear` in `camera.ts`, numbers `CAMERA.wall` `{x 420, top 600, soft 350}`) holds the eye in front of page x 420 while it is lower than the guard's top by widening the lens and standing nearer, with the frame at the aimed point unchanged. MEASURED in `tests/b-camera.test.ts`: over the film and five live courses the eye is never nearer than 40 px in front of the pane while under its top plus 40 px. What it costs: the field changes by up to 4.26 degrees between two frames in the quick courses (it was 1.44).

## Measures (06:38Z, brought up to f0ce65df at 07:11Z where said)

- Outside the finish, to the pixel. MEASURED: `node pipeline/change002/camera-frames.mjs --frames 9000,10700,10790,10817,11194,11300,11500` on ff31d776 (before any change), on 6570b145 and again on f0ce65df (07:10Z), draft tier, 1920 by 1080, software GL; `compare -metric AE` of each pair: 0 pixels differ in all seven, both times. 10817 is the last frame before `finish-arms`, 11194 the first after `boss-gone`.
- The arena at 0. MEASURED in `tests/b-camera.test.ts`: the digest of the built arena's vertices with `upright` 0 is `{ n: 14721, sum: 61108466.590976 }`, the number taken on dcb1ef29~1 before the patch.
- The film's events. MEASURED in the same test, frames after `boss-fall`: `finish-arms` 60, `finish-fire` 307, `boss-gone` 435, `finish-walk` 459, `finish-kneel` 627, `finish-fist` 705, `finish-press` 759. No event moved.
- Between two frames at 60 a second, the most over the film and five live courses (the test prints it), on f0ce65df: the eye 84.0 px of the page, the line of sight 10.8 degrees, the roll 7.8 degrees, a point of the floor 135.5 px of the 1920 wide picture, the field 4.26 degrees. The named limits in the test: 130 px, 12 degrees, 9 degrees, 140 px, 6 degrees; a step at the two ends of a course 1.5 px. On 6570b145 they were 119.7 px, 10.8, 7.1, 120.4 px, 1.44 with limits 130, 12, 9, 130, 1.5: the guard for the pane cost the field's and the floor point's limit. No cut.
- The split of the burn in the film (fire to `boss-gone` 2.133 s): V2 held to fire + 0.2 s (the beam leaves the hands there, `FIRE.lead`); V3 0.2 to 0.4 s; the rise 0.4 to 0.85 s; from above 0.85 to 2.133 s, which is 1.28 s, 60 percent. First intent was 0.51 s, the second 1.08 s.
- The taking apart, STATED from `GONE` in `src/boss/look1/pose.ts` and the page's `gone2` (the beam reaches the boss 0.298 s after the fire; the shares run over the 1.835 s left): the parts start to leave at fire + 0.34 s (shield), 0.39 and 0.48 (guns), 0.45 and 0.56 (wings), 0.67, 0.78, 0.85, 0.96 (legs), 0.70 (bay), and the hull's seven pieces at 0.81, 0.92, 1.03, 1.14, 1.25, 1.36, 1.47; the button comes down from 1.22 to 1.95. So 9 of the 17 starts fall before the view is from above (fire + 0.85) and 8 after it.
- SEEN in `proof/camera/apart.jpg` (24 frames, fire + 18 to fire + 133, five frames apart): from behind (frames 1 to 3) the boss is whole, then white. In the rise and just after (frames 5 to 8, fire + 0.63 to 0.88 s) leg parts and two plates are in the air over the beam. From above (frames 9 to 13, fire + 0.97 to 1.30 s) three to five grey pieces drift right over the beam's upper edge and fade. From frame 14 (fire + 1.38 s) to the end I can tell no piece leaving: the button, the beam, dust. The hull's pieces go under the white core of the beam, which covers the boss's place from above. So the pieces cannot be counted one by one: what is seen is a handful of parts in about 0.7 s, then 0.75 s in which nothing leaves.

## The live site (strips made 07:11Z to 07:22Z on f0ce65df's code, `node pipeline/change002/camera-live.mjs`)

- The pointer while the lens is low: no input code changed. STATED: during the charge only press and hold is read; from the fire to `boss-gone` the pointer is ignored; the lens is from above again 0.85 s after the fire.
- MEASURED in `tests/b-camera.test.ts`, `stage.longestIgnored.pointer`: 3.304 s for each of the five visitors (holds 2 s and lets go; clicks once; never presses; holds and never lets go; keen bot). Arms to fire 2.308 / 0.3875 / 6.0 / 5.142 / 0.233 s; fire to gone 2.133 s each; seconds with the lens low 3.13 / 1.22 / 6.83 / 5.98 / 1.07.
- SEEN, `proof/camera/live-hold.jpg`: on the way down one picture with a dark grey block over the right third; then the facing view with a fallen pillar and a pale green slab at the left; the thrust; from behind with the beam; the rise with the picture turned; from above. No green wash.
- SEEN, `proof/camera/live-click.jpg`: no facing view. The fire comes 0.39 s after the arms and the way down takes 0.95 s. The same dark block in one picture; then the figure edge on with the beam out; from behind; the rise; from above.
- SEEN, `proof/camera/live-never.jpg`: on the way down a grey block low in the middle of one picture; the facing view for eleven pictures, the first three with no ball and no flames (nothing is lit until the charge begins by itself), then the ball and the ring grow; from behind; the beam; from above.
- The dark block is `pillar.3` (563, 925) where it still stands. MEASURED with a scratch test (the eye against the pillar's column at the eye's height, the lean taken off by how low the lens is): the eye passes 74 px beside it at 0.60 s after the arms, at height 201 of the pillar's 210; 115 px for the visitor who clicks once. Not through it. Not mended.
- Frame time, MEASURED (stepped live site, quality high, 1920 by 1080 backing, software GL, the draw without the PNG): hold, median of 3: from above before the arms 5512 ms, low in the charge 5192 ms, from above after `boss-gone` 4360 ms. Click, median of 3: 5356, 5548, 4434 ms. On 6570b145, hold, median of 7: 5130, 5088, 4324 ms. Low costs 0.94 to 1.04 of the picture from above before it. The numbers of the "never" run are one draw each with tests running beside it and are not a measure.

## Tried and dropped

- 07:21Z: the turn of the rise run ahead of the rest (so that the picture turns while the lens is still low). MEASURED in the test: the most roll between two frames went from 7.8 to 8.9 degrees (ahead by 2) and 9.06 (by 3), and the arrow's feet left the frame. Dropped, nothing committed.

## What is weak, as I see it (07:23Z)

1. The figure is a line for about 8 frames of the move V1 to V2 (film 11040 to 11047). A cut would not show it.
2. The rise turns the picture about its middle, up to 7.8 degrees a frame; at film 11103 the beam points up the frame, 13 frames before it lies as from above.
3. V3: the beam fills about the upper left half of the frame, not the frame.
4. The taking apart cannot be told piece by piece (see Measures).
5. A visitor who fires within 0.95 s of the arms never gets the facing view.
6. `pillar.3` close to the lens for a picture on the way down, where it stands.
7. Past the page's edge is plain dark.
8. In the move, film 11036 to 11039, the arrow's point touches the top edge.
9. The field's step went from 1.44 to 4.26 degrees a frame at most with the guard for the pane.

## What is left (07:23Z)

- The shout's panel and a low view in one picture: UNKNOWN.
- The whole suite on the head (running since 07:22Z).
- The Builder's head of `agent/merge55`, the merge, the pixel check on the merge.
- The power-up's switch (`CAMERA.powerUp`) is off and was never rendered on.

## A fault of mine, 06:53Z to 07:00Z

The commits 0515f0a4, 5bcd5681 and 385399d1 carry `wide: 0.5` at lines 117 and 189 of `src/boss/tune.ts`, which are the blast's width in the fight (65) and the full blast's as drawn (90), not the camera's. A replace run to tune `CAMERA.wide` matched every line that starts with `  wide:`. MEASURED with `npm run cut` on that tree: the event `pillar-break` at film frame 10478 was gone, so the fight before `finish-arms` was changed. 100c30ec puts both lines back: `git diff ff31d776 -- src/boss/tune.ts` removes no line. The Builder was told at 07:01Z and takes 100c30ec or later only. Every picture in `proof/camera/` and the pixel check of 07:10Z were made after the mend.

## Tests of other units (suite of 06:44Z on the tree of that minute, 414 s; the same 17 files run on ff31d776 in a second worktree)

- MEASURED: 45 red of 2413 on my tree, 43 red in the same files on ff31d776. The two that my change turned red:
- `tests/b-finish.test.ts:327` pinned that no file outside `src/cursor/stand` and `src/boss/finish` takes the standing figure in; `src/pages/step4/index.ts` took `feetFor` from `src/cursor/stand/rig`. Mended in 385399d1 without touching the test: the page takes it through `src/boss/finish/camera.ts`. Green.
- `tests/cut-of-build.test.ts:37` pins `cut/` byte for byte to the build. One line of `cut/SHOTS.md` changed: the shot `boss.finish` 10818 to 11513 reads "follows" where it read "holds, shakes". By the Builder's ruling of 07:02Z `npm run -s cut` was run and that one line committed in f0ce65df. Green.
- UNKNOWN: the whole suite on f0ce65df. It was not run again after 06:44Z.

## Second pass (ruling of 07:25Z, answers of 07:51Z; written 08:18Z to 08:40Z)

Marks. MEASURED by `tests/b-camera.test.ts` and `npm run -s cut`: film frames `finish-arms` 10818, `finish-fire` 11065, `boss-gone` 11271 (was 11193), `finish-walk` 11295, `finish-kneel` 11463, `finish-fist` 11541, `finish-press` 11595 (`button-press` in `cut/CUES.md` at 193.258 s). Arms out to the fire 4.117 s, the fire to `boss-gone` 3.433 s (was 2.133). Added: 78 frames, 1.30 s; `SHOUT.gone` 7.56. The film is 12966 frames, 216.1 s. `config/showcase.json` (NEEDS commit 68457ace): boss 71.8 to 73.1 s, the beat `boss.finish` ends at 71.9, `boss.press` runs 71.9 to 73.1. `content/narration-drafts.json` (NEEDS commit, written by `npm run retime`): `boss.finish.0` at 0.00072 to 0.00065.

The lens, seconds from the fire (film): facing view until -0.90; round -0.90 to 0, the plane of the figure crossed at -0.50 to -0.467 under the ball's glare; from behind until +0.80 (the beam leaves the hands at +0.30); rise +0.80 to +1.40; from above, the picture turned to the page's lie until +2.90; `boss-gone` +3.433.

(a) MEASURED: under 30 degrees off the plane in the move, 3 frames (23.0, -1.2, -29.0 degrees), glare 1.00 in each. SEEN in the strip: film 11034 to 11036 the frame is white from edge to edge, 11037 white over two thirds with a faint pale upright line in it.
(b) MEASURED: at the fire the lens stands -57.9 degrees off the plane, at the end of the hold -58.7. The back is a second skin on the body's meshes (`back()` in `src/cursor/stand/figure.ts`), white with a cold rim, shown only to a low lens behind the figure. SEEN: the whole arrow shape, pale blue-white, shaded.
(c) `pillar.3` stands in the frame at the right in the views from behind (answer 2 of 07:51Z). SEEN: its whole width inside the frame from film 11047, its top cut by the top edge, a narrow gap to the arrow, the flames drawn over its left part.
(d) The hold from behind ends 0.80 s after the fire, not 0.6: the beam is out only from +0.30.
(e) The rise ends with the beam running up the frame; the turn from above is at most 1.5 degrees a frame (MEASURED, limit 1.55 in the test). NOT MET: during the rise the picture rolls, and the plane of the figure is crossed once more with no glare (MEASURED: +0.983 s -23.0, +1.000 -14.5, +1.017 -5.5, +1.033 +3.7 degrees, the lens more than half way up).
(f) The pane guard is gone. MEASURED: the field of view changes by at most 1.416 degrees a frame.
(g) `GONE` and `FLY` in `src/boss/look1/pose.ts`: shield first (0.02 to 0.34 of the burn), then guns, wings, legs two and two, the bay, the hull last; `FLY` far 2700 to 500, wide 420 to 560, fan 0.42 to 0.3, least 0.6 to 0.8, so that a group leaves to the side of the beam and stays in the frame.
(h) Live: a press after the arms are out lights the ball at once and is kept; the fire comes when the lens has reached the facing view, held 0.3 s and gone round (0.55 s). STATED from the code: a press at the moment the arms are out fires 1.80 s later (0.95 down, 0.30 held, 0.55 round), the longest for a click. MEASURED: a click 0.3 s after the arms fires 1.796 s after the arms; one who holds 2 s from 0.3 s fires at 2.858 s; nobody 6.004 s; one who holds to the end 5.696 s.
`stage.longestIgnored.pointer` MEASURED 3.833 s for each of the five (was 3.304). The stretch that grew is from the fire to the walk (`ignoring()` in `src/pages/step4/index.ts`: `s.fired >= 0`, then until the end's walk): 3.433 s of burn and 0.4 s, where it was 2.133 and 0.4. For the visitor who fires the moment the arms are out it is the same 3.833 s; his kept press waits 1.80 s before it, answered on screen.
(i) MEASURED: the lens passes no pillar nearer than 127.9 px (limit 120 in the test).
(j) A sphere of dusk about the lens (`dusk` in `src/boss/finish/fx.ts`), its strength the lens's lowness, off from above.

Tests of the boss unit that this pass turns red (not edited):
- `tests/b-boss.test.ts:464` (the table of live visitors, the line `expect(at('finish-fire')[0]! - fall).toBeCloseTo(fires, 1)` at 491): pinned the seconds from the fall to the fire: holds and never lets go 4.83 (now 5.39), holds 1.5 s 2.0 (now 2.55), clicks once 0.7 (now 1.80), presses while the arrow charges by itself 4.2 (now 4.76). The fire waits for the lens by ruling (h).
- `tests/bosslook-pose.test.ts:158` pinned that at 0.5 of the burn the fourth leg is already leaving (`mid.away.legs[3]` over 0); it leaves from 0.58 now, by ruling (g).
- `tests/b-boss.test.ts:698` (twelve spots at the power-up) timed out at 20 s in two runs that shared the machine with a render; alone: UNKNOWN.

The whole suite, once, on cbf9d09e (merge of 7c8c0acf in), MEASURED 08:09Z to 08:28Z beside a render and at low priority, 1108 s: 44 failed of 2425 in 16 files. 11 of them are timeouts of 10 or 20 s (`cut-of-build`, `film-cut`, `polish-tug3`, `polish-tug4` at their hooks; `cursor-fit:151`, `site-backing:15`, `stage:103`, `b-boss:698`, two in `polish-tug-strips`, one more): UNKNOWN whether they are red alone. Not run again.

Pixels outside the finish, MEASURED 08:35Z on dc1793ff in a fresh page, film 9000, 10700, 10790, 10817 against 02b7debb: 0 differing px in each. In the long job of 08:06Z the same four frames, drawn in the same page after the frames of the finish, differed by 905, 14326, 13248 and 25616 px, all at the boss's bay (the cannon's carriage missing): something of the boss's look keeps a state when frames are drawn out of order. UNKNOWN whether 02b7debb does the same; the film is drawn in order.

Seen in the strips (08:14Z to 08:34Z, build of ca1bc098, draft, software GL): the move is the facing view, a white flash of film 11034 to 11036, then the back; the pillar stands white a few px from the arrow's right side through the hold; the beam is out from 11081 and fills the left half; in the rise the horizon tilts and the figure is a thin small wedge at 11121 to 11127; from above I can tell four departures of grey parts, not five, none over the core; live click and live hold give the same order of views, the beam out only from behind on.

Not done in this pass:
- The pillar clear of the arrow (ruling 3 of 08:19Z). The only lens place found: the lens where it stands turned 16.5 degrees toward the boss (pillar's left edge at x 1974 of 1920, feet at x 1696, boss at x 716, -54.4 and -53.2 degrees off the plane). As keys it broke the round (the arrow left the frame on the way, pane clearance 23.8 px); it needs a pan laid over the orbit after the crossing.
- The second crossing of the plane in the rise, and the roll in the rise.
- Five groups each readable from above.
- The dark block close to the lens on the way down on the live click (tile 3 of `proof/camera/live-click.jpg`).
- The warm band of the dusk is not seen in the strips; a dark triangle past the page shows at film 11173 and 11179.
- A mark `finish-rise` (asked 08:33Z): none exists. The rise begins `CAMERA.rise[0]` (0.8 s) after `finish-fire`, film frame 11113.
- The shout's panel with a low view in one picture: not made by me (the shell helper laid it on five frames of da9b0b09).
- The power-up's switch (`CAMERA.powerUp`) is off and was never rendered on.
