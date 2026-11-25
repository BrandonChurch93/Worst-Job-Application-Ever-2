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
- Steel: colour 0xe9ecee, roughness 0.16, metalness 0.72. Full metal reads near black in the lit zones (see the frame's notes), so the wire keeps some colour of its own.
- Bracket: one leg of radius 2.6 from the hoop's lowest point to a round foot plate (radius 14, 2.5 thick, two screw heads of radius 3 at 8 either side). Where the hoop is more than a ball up, two legs splayed 30 either side with a thin cross rod between them.

## Agreed with other owners

- tier3_modeller: the wire recipe above.
- tier1_modeller: the garage is a core drum of radius 44 px with a ring beam on the right half. The spiral is an open clear trough that fills radius 53 to 165 px about the garage's middle, walls 4 thick and 33 tall, its floor 3 under the rail's height, from 163 px down to 19 px over three turns. It stands on no legs. Small clear tabs with one screw each reach in to the core drum. I draw the parking dashes on the channel's floor.

## Decisions

- One solid material per tier for all four parts (`matsOf(zone).solid`). Colour rides on each vertex, and so do roughness, metalness and clear coat (the `wjpFinish` attribute, read by three lines added to the physical shader after `studio()` and before `lit()`). Orange plastic, rubber, paper, steel and enamel are one material, so a static group is one drawing.
- One clear material per tier (`matsOf(zone).clear`): no transmission, depth write off, alpha per vertex, raised where the wall turns from the eye and where light shines in it. The clear plastic's own colour is near dark so three turns stacked do not go milky.
- The glow and the clear material are two sided and transparent; `forceSinglePass` keeps each to one drawing (without it three.js draws them twice).
- Drawings: corporate 4 (2 flippers, plates, frame), office 11 (2 flippers, plates, frame, standup, cups, rings, lids, 3 glows), street 9 (2 flippers, plates, frame and spinner posts, spinner flag, track, fine welds and screws, flap, clear spiral).
- Flippers: one shared geometry for all six, mirrored by turning. The body runs from radius 22.5 at the pivot to 15.5 at the tip over the layout's 3 balls, from 7.5 to 40 above the floor on a shaft and bushing. The orange is the site's orange (0xc24400) with a full clear coat. The band is 15 tall, 1.1 proud, with a 0.5 mould line.
- Cups: skirt to radius 84.5 (the stand-in's), cup wall from radius 46 at the foot to 60 at the rim, rim at 90, sleeve from 23 to 74 with 60 flutes, lid of radius 67.5 with its deck at 100 and its raised rim at 107, steel ring resting at 83 just under the lid. The ring and its two rods are one instanced mesh, the lids another. The glow is one additive mesh per cup that follows the lid, the gap under it and the sleeve, with its level from `levels(ctx, zone).byName['bumper.N']`, so each cup flashes alone. It is tinted warmer than the group's colour because paper and a milky lid warm the lamp inside.
- The ring is down in 0.03 s and back by 0.13 s (`ringDown`). The lid jumps 2 to 3 px and rattles for 0.5 s (`lidJump`).
- Drop targets: plates 6 thick, 44 tall, the width of their box less 1.1, in a steel frame with a dark slot, a turned post with a rubber ring at each end and two screws. A plate drops 41.5 in 0.05 s, leaving 2.5 proud of the floor, level with the frame's top. A bank rises when the state of its plates returns to 1. The pictures are moulded relief, not print: a gold chair back, a wire paper clip, a column.
- The standup is a cream disc with a moulded bean on a spring steel leaf, hinged 2.4 above the floor. Struck, it leans 0.3 rad and swings out in 0.6 s (`standupLean`).
- The spinner's axle is 31 above the floor. The flag hangs 4 off the axle, blue enamel with a pale star one side and bare steel the other. It turns 7 times in 1.5 s, slowing all the way, and stops flat (`spinnerTurn`).
- The flap has no time on its shape, only open or shut, so it snaps between its two places.
- The highway's path is a smooth curve through the layout's five points. The first 40 px have no side wires and no hoops, because the hoops would cut the floor there; the flap covers that stretch.
- The spiral ends where its rail ends. The layout puts the ball out there with a speed straight down the page; no exit trough is built because the lowest turn passes over that line.

## What I learned

- Surfaces above the lamps (about 44 px) get only the fill, so tall tops look grey. The cup lids need their glow to read as lit.
- Full metal reads dark in the lit zones. Steel that must read as bright steel needs metalness near 0.7 and a pale colour.
- The spiral's pitch in the layout is half a ball per turn, less than a ball and under `table.minClearanceBalls`. A ball on one turn passes through the turn above it. It looks right from above; from the rail camera it may not.
