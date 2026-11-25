# Hardware: everything the ball strikes that is not a toy

Owner: hardware. Parts: `table-hardware`, `lift`. Code: `src/table/real/hardware/`. Branch: `agent/hardware`.

## What a quick look at the approved images misses

1. A lane guide is not a bar. It is one polished wire that comes out of the floor through a collar, runs at the height of the ball's lower third and goes back into the floor, and it is seen by one thin glint along its top, not by its colour.
2. Every post has a waist. The rubber sits in the waist, is dull against the bright metal above and below it, and the cap on top differs from tier to tier.
3. The floor round every lane is dotted with small pan head screws on washers, each turned to its own angle. They are what makes the floor read as a thing that was assembled.
4. The lift tube is seen by its two edges and by the lamps under it. What reads as "tube" is the row of thin bright collars with a groove, the wire clamps between them and the turned cup it stands in at the foot of each tier.
5. The plunger is three things and not one: a bright rod, a darker coil that takes no highlight, and one glossy orange knob with a single hot spot. The orange of the elbow is the same orange with the same gloss.

## Decisions

- One material for all hardware in a zone (metal, rubber, plastic). Colour rides on the corners. The finish (clear coat, roughness, metalness) is picked by the texture coordinate from a 16 by 1 table made in code: steel wire, aluminium, brass, rubber, gloss plastic, dark steel, zinc, satin plastic, chrome. So a tier's posts, wires, pockets, brackets, caps, the orange elbow and the orange flap are the same material and the static ones are one drawing.
- Drawings of a tier: static hardware, screws (instanced, fine), small detail (washers, collars at the feet of wires, mould lines, weld beads: fine), the two slingshot bands (one mesh, one morph each), the gate, the plunger's tip (street only), the steel balls (instanced, drawn only when a ball is in the zone). Lift: static (collars, clamps, cup, elbow, door frame), clear tube, screws (instanced, fine), flap. That is ten on the street with its lift, nine on the office tier, eight on the corporate tier, plus the steel balls.
- Apron: one drawing (the plunger with its housing and screws, one morph for the pull). Last screen: three (collars and clamps, clear tube, screws). Four together.
- The clear tube is the frame's: `TUBE` from `src/table/real/frame/loader.ts` and `clearOf` from `src/table/real/frame/mats.ts` are used as they are, so the lift, the drain and the feed are one tube. Collars and clamps are built to the numbers in `pipeline/phase4/frame.md`.
- Slingshot posts end in a flat shoulder 46 px over the floor, 7 px in radius, with no screw of mine in it: the plate and its screws are the tier modeller's. The band sits at 36 px, is 6.4 px thick and its outer face is 11.5 px from the post's centre, which is the radius the layout gives the post.
- The band's kicking side is the one from a to c, as in the physics. It bows a fifth of a ball at 0 s and follows `exp(-38 t) cos(2 pi t / 0.085)`: one overshoot of a fifth of the bow, still at a tenth of a second. Read from `sling.<id>.3`.
- Lane posts: outer face of the ring at 9.6 px, the layout's radius. Caps: a brass finial on the corporate tier, a grey cap with a blue push pin on the office tier, a yellow and black traffic bollard on the street. None is orange.
- Wire guides: 4.8 px in radius (the layout's bar is 5.76 half wide), middle 34 px over the floor. The lane guide and the return rail of a side are one wire with a third leg at the corner. The wire starts 17 px below the lane post so it does not run into it, and stops 22 px short of the flipper's pivot. Roofs are a thinner wire (3.8 px) at 30 px on two feet.
- Outholes and scoops cannot cut the floor, which is not mine. They are a steel lip 4.6 to 5.4 px high with a chamfer worn bright, a wall that falls to 1 px and a dark bottom. A scoop's back is ramped: the wall stays high and lighter on the side the ball leaves by.
- The gate is a wire loop on a pin 7 px over the floor between two brackets. Shut it stands, leaning up the table; open it lies flat down the table. It has no time value in its shape, so it snaps.
- The chutes are a bent channel of zinc plated steel along the layout's rail, 0.56 balls half wide, with walls 15 px high and a bright top edge.
- The plunger lies on the apron at the layout's place for the knob (30 px over the apron). The housing is screwed down at the wall, the rod runs through its bushing over the foot of the lane to a clip, and the spring sits between bushing and clip, so it shortens by the knob's travel (0.7 balls) when pulled. One morph does both. A black rubber tip on a rod stands in the lane at the ball's height and moves by the layout's 0.45 balls.
- Ring after a shot, with no clock: the plunger's overshoot is a function of how far the ball has gone up the launch lane, `8 px * exp(-d / 2) * sin(2 pi d / 1.5)` with d in balls, and only while the pull is 0.
- The lift, tier by tier: a tube lying in the left lane (middle 61 px over the lane's floor) from a turned aluminium cup at 10.55 balls down the tier up to the bend (corporate, office) or to the top wall (street). Collars every 3.4 balls, a clamp half a step from each. At a door the collars stand either side of the opening.
- The bend is a quarter turn of 0.75 balls on the middle line, 66 px in outer radius, glossy orange, with a seam along its back and a flange with five screws at each end.
- A door is a steel frame set on the wall line with a pin under its lintel and a glossy orange flap hung from the pin. It rests leaning 25 degrees into the lane so it reads from above, swings a further 60 degrees when a ball goes through and falls shut as `exp(-4 t) |cos 7 t|`.
- Steel balls: chrome finish of the zone's one material, 24 sides, one instanced mesh per tier with as many instances as there are steel balls in that zone.
- Drain: drawn on the last screen only, from the second point of the layout's rail. In the apron it is under the slab.

## Agreed with other owners

- Tier modellers (3, 2, 1) were told: shoulder of a slingshot post 46 px over the floor, radius 7, no screw of mine on it, band at 36 px, outer face 11.5 px out. Scoops are flush mouths 0.58 balls in radius with nothing of mine above 6 px.
- Frame: the tube's numbers were taken from the frame's notes and its code. No change was asked of the frame.

## Open

See the report to the Builder.
