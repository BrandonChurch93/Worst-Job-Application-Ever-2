# Play: the parts that play

Owner: play. Parts: `flippers`, `bumpers`, `targets`, `ramps`. Code: `src/table/real/play/`. Branch: `agent/play`.

## What a quick look at the approved images misses

1. A flipper is not an orange bar. Its side is orange above and below a matte black band that stands a hair proud, its top is flat with a soft shine, a chrome screw sits over the pivot, and the whole bat stands off the floor on a pale shaft so there is a line of shadow under it.
2. The cups are lit from inside. The lid is brightest in its middle and falls off to its rim, the sleeve glows a copper brown just under the lid, and a thin chrome ring hugs the lid's lower edge. A second bright ring lies on the floor round the skirt.
3. The highway is not two rods. Each side has two wires, one the ball rolls on and one that keeps it in, with U hoops hanging under them at even steps and upright legs down to small plates on the floor.
4. The drop targets read as a row of small pale plates with a dark gap between each pair and a dark slot under them. The gap and the slot are what make them five plates and not one strip.
5. The spiral is seen by its edges. The floor of the channel is nearly not there; the rims are bright lines, one above the other, and the things behind it show through undimmed.

## The wire (one recipe for the highway and the ladder)

Agreed with tier3_modeller, who builds the ladder. All numbers are page pixels (96 px is one ball). They are `TRACK` in `src/table/real/play/ramps.ts`.

- Wire radius 2.6, 8 sides (6 where no key image comes close).
- The ball rolls on two wires 34.56 either side of the path, their middles 11 above the rail's height (the rail's height is the ball's lowest point).
- Two side wires 53.76 either side, 40 above the rail's height.
- Hoops: wire radius 2.2, an arc of radius 55.4 about the ball's middle, 104 degrees either side of straight down, so its lowest point is 7.4 under the rail's height. One every 2 balls on the highway (1.5 is fine for the ladder's rungs).
- Weld bead: a flattened ball of radius 3.4 (1.25, 1.25, 0.8) at every crossing of a hoop and a wire, in a fine mesh.
- Steel: colour 0xf4f6f8, roughness 0.1, metalness 0.9, no clear coat. Full metal reads near black in the lit zones, because the studio's reflection is dim. My solid material gives a metal four times the studio's reflection at full metal (one line added to the shader, scaled by the vertex's metalness), so the wire shows bright streaks and dark sides like chrome. A material without that line should stay at metalness 0.5 to 0.8 with a pale colour.
- Support: a trestle under a hoop. Two legs, each welded under one of the wires the ball rolls on, spread outward by a tenth of their height (20 px at most) to a round foot plate each (radius 14, 2.5 thick, two screw heads of radius 3 at 8 either side). Leg radius 3 up to one ball, 3.6 up to 2.5 balls, 4.2 above that, tapering to four fifths at the top, with a collar at the foot and a weld bead at the top. A rung of radius 2.3 joins the legs at every ball of height, and the tall trestles have a cross brace below the lowest rung. No trestle stands where either foot would be within 1.25 balls and 16 px of the openings `street.police.foot`, `street.inlane.right` or `street.outlane.right`.

## Agreed with other owners

- tier3_modeller: the wire recipe above.
- tier1_modeller: first agreed for the old layout (a core drum inside the trough). After the Builder's new layout of 17:28 UTC the garage is a round frame outside the trough, 1.525 balls from the middle. My trough: clear width 1.25 balls (the width of the opening `street.spiral.turn`), walls 4 thick and 33 tall with a rolled lip 3.6 tall to 137 px from the middle, its floor 3 under the rail's height, three turns from 5.4 balls down to 1.5, then a straight tail to its open end 1.3 balls over the right inlane. A clear newel of radius 12 stands in the middle from the lowest turn to the top and does not reach the floor. Round the helix the newel is the trough's inner wall; the trough has an inner wall of its own only on its two straight ends. Their frame is concrete from 137.3 px (inner face) to 146.4 px, with 16 columns and four ring beams. Clear tabs reach out from my wall to 137.3 px at every quarter turn, where a column stands. Nothing of mine stands on the floor under the garage.

## Decisions

- One solid material per tier for all four parts (`matsOf(zone).solid`). Colour rides on each vertex, and so do roughness, metalness and clear coat (the `wjpFinish` attribute, read by three lines added to the physical shader after `studio()` and before `lit()`). Orange plastic, rubber, paper, steel and enamel are one material, so a static group is one drawing.
- One clear material per tier (`matsOf(zone).clear`): no transmission, depth write off, alpha per vertex, raised where the wall turns from the eye and where light shines in it. The clear plastic's own colour is near dark so three turns stacked do not go milky.
- The glow and the clear material are two sided and transparent; `forceSinglePass` keeps each to one drawing (without it three.js draws them twice).
- Drawings: corporate 4 (2 flippers, plates, frame), office 11 (2 flippers, plates, frame, standup, cups, rings, lids, 3 glows), street 9 (2 flippers, plates, frame and spinner posts, spinner flag, track, fine welds and screws, flap, clear spiral).
- Flippers: one shared geometry for all six, mirrored by turning. The body runs from radius 22.5 at the pivot to 15.5 at the tip over the layout's 3 balls, from 7.5 to 40 above the floor on a shaft and bushing. The orange is the site's orange (0xc24400) with a full clear coat. The band is 15 tall, 1.1 proud, with a 0.5 mould line.
- Cups: the numbers are `CUP` in `bumpers.ts`. A steel plate with a groove on the floor, a dark skirt to radius 74.5, the cup wall from radius 46 at the foot to 58 at the rim, a kraft sleeve from 22 to 68 with 60 flutes, a matte lid of radius 76 with its deck at 100 and its raised rim at 108, the steel ring resting at 89 round the lid's lower edge. The lid is matte with no clear coat: a glossy lid read as glazed china. The skirt is dark so the cup and its ring stand out from the floor. The ring and its two rods are one instanced mesh, the lids another. The glow is one additive mesh per cup that follows the lid, the gap under it and the sleeve, with its level from `levels(ctx, zone).byName['bumper.N']`, so each cup flashes alone. Inside the raised rim it is tinted warm (1, 0.8, 0.52) because paper and a milky lid warm the lamp inside; the rim itself stays near white.
- The ring is down in 0.03 s and back by 0.13 s (`ringDown`). The lid jumps 2 to 3 px and rattles for 0.5 s (`lidJump`).
- Drop targets: plates 6 thick, 44 tall, the width of their box less 1.1, in a steel frame with a dark slot, a turned post with a rubber ring at each end and two screws. A plate drops 41.5 in 0.05 s, leaving 2.5 proud of the floor, level with the frame's top. A bank rises when the state of its plates returns to 1. The pictures are moulded relief, not print: a gold chair back, a wire paper clip, a column.
- The standup is a cream disc with a moulded bean on a spring steel leaf, hinged 2.4 above the floor. Struck, it leans 0.3 rad and swings out in 0.6 s (`standupLean`).
- The spinner's axle is 31 above the floor. The flag hangs 4 off the axle, blue enamel with a pale star one side and bare steel the other. It turns 7 times in 1.5 s, slowing all the way, and stops flat (`spinnerTurn`).
- The flap has no time on its shape, only open or shut, so it snaps between its two places.
- The highway's path is a smooth curve through the layout's eight points. The first 40 px have no side wires and no hoops, because the hoops would cut the floor there; the flap covers that stretch.
- The trough starts under the end of the highway, at the height of the helix's first point, with a closed back, and stops one point before the rail's end, because the last piece of the rail is the ball's fall to the inlane.
- The last four balls of the highway have no post: every place under them is nearer than 1.25 balls to the gap at the police station's foot. The track's end lies inside the mouth of the trough.
- The trestles are not in the physics. A ball on the floor can pass through a leg. The Builder owns the physics and has this on the list.
- No parking dashes on the trough's floor: seen from above, with the newel in the middle, they read as the ticks of a clock face. The approved image has a plain clear trough.
- The trough's floor has alpha 0.035, its walls 0.09 and its lip 0.78, so the turns show by their lips and things behind stay clear. Light that falls on a clear wall adds to its alpha only where the wall already shows.

## What I learned

- Surfaces above the lamps (about 44 px) get only the fill, so tall tops look grey. The cup lids need their glow to read as lit.
- Full metal reads dark in the lit zones. Steel that must read as bright steel needs metalness near 0.7 and a pale colour.
- The spiral's pitch in the first layout was half a ball per turn. I told the Builder, who changed the layout to 1.3 balls a turn at 17:28 UTC. Reading every place from `railOf` meant the rebuild was the supports and the trough's ends, not the path.
