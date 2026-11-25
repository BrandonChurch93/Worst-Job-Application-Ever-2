# Tier 2, The Office: the models

Owner: the maker of the office models. Branch `agent/office`. Parts: `model-coffee-machine`, `model-cubicles`, `model-inbox`, `model-staplers`.

## What the approved images show in my part that a quick look misses

1. The cubicle walls are warm taupe fabric with a thick, lighter cap, not grey: from above the caps are the brightest lines of the model and the fabric is only seen at an angle. The desks are L shaped and of warm wood laminate, with the monitor at the back edge and its screen toward the player.
2. The coffee machine is bronze brown with a brushed steel plate let into its top, and the sign plate stands on that top at the front. Its lamps are very small: green, yellow and red points, none larger than a screw head.
3. The inbox is not white. It is a beige moulded housing, the envelopes are a heap with corners out over the rim, and about a third of them are manila. The scoop mouth beside it has a bright steel frame, which is the hardware's.
4. The stapler plate is a darker red than the arm and has a rolled rim, the three screws sit on the posts at its corners, and the arm is shorter than the plate. The bright steel of the magazine shows between the arm and the plate because the arm stands open.
5. Seen in `reply-all`, the steel balls leave the scoop beside the inbox, not the tray: the tray only tips toward the scoop. In `table-wide` and `table-map` the four models are small, so each must be told by its outline and colour alone: a grid of taupe cells, a bronze block with a steel top, a beige box of paper, two red triangles.

## Decisions

- One opaque material for the whole tier. Roughness, metalness and clear coat ride on each vertex (`aSurf`), colour on each vertex too, so steel, enamel, fabric and paper share a draw. The material passes once through `lit(studio(material), zone)` and is extended after that by chaining `onBeforeCompile` and the program cache key.
- Fourteen colour draws were allowed and fourteen are used: cubicles 5 (body, fine trim, clear bottles, bezel light, the screws of the whole tier as one instanced mesh), coffee machine 3 (body, clear tank, button rings), inbox 3 (stand, tray, loose envelopes), staplers 3 (bases with plates, two arms). Two of the fourteen are fine meshes, which the low level drops.
- The small trim of every model of the tier (staples, the hinge spring, the grille bars of the drip tray, cup stacks, sugar sticks, the rail and slots of the cup warmer, the gauge, chair bases, keyboards, mugs, lamps, papers, pin boards, leaves) is gathered into the one fine mesh `office.cubicles.trim` (`Kit.fine`, `Kit.takeFine`), so it costs one draw for the tier and is counted as fine. The clear material is drawn in one pass (`forceSinglePass`), otherwise each clear mesh costs two draws.
- Desks, chairs and monitors are merged into the one static mesh of the cubicles instead of being instanced. Three instanced meshes would cost three draws and the tier has fourteen; merged they cost none, and each chair still stands at its own angle. This departs from the brief on purpose.
- The cubicles are two columns of three with an aisle between them, open to the front, so each cell has a real way in. The right column is the mirror image of the left.
- The sign of the coffee machine stands where the type's shape `sign.office.coffee` stands: on two steel brackets from the front of the head, in front of and above the control strip. The row of buttons is on a sloped strip of the top so it is seen from straight above.
- The button rings are green, yellow, red and cool white. No ring is amber: orange belongs to the flippers, the plunger and the lift.
- The staplers are dark crimson (`0x54151c` arm, `0x4a1218` plate), well on the blue side of the machine's orange and darker than it. The plate is a shade darker than the arm, as in the approved image. The arm has a flat top with broad chamfers and is taller at the hinge than at the nose. The base under the arm is brushed steel, as on a desk stapler.
- The stapler plate keeps to the post triangle plus 7 px and its underside is 46 px over the floor, as agreed with the owner of the hardware. The fixing through the plate is mine: a screw at each post, in the tier's instanced mesh of screws.
- The inbox leaves the scoop alone: nothing of it within the hold's radius plus half the clearance, tipped or level (tested).
- The small standing things are placed from things of the layout, not typed in: the water cooler and a spare bottle in the closed sliver between the guide `office.cubicles.roof` and the cubicles, the filing cabinet, the waste bin and the plant on the closed left shoulder below the inlane guide. No ball reaches either floor, so no path is narrowed. A test holds them behind those walls.
- Chair seats are six clear colours (blue, teal, plum, green, grey, navy) on aluminium star bases, so each chair reads as a chair from straight above; keyboards are light grey so they are seen on the desks.
- The pot of the plant is glazed off white, not terracotta, to keep orange off the tier.
- No picture is used: every surface is built. No take was spent.
- Surface grain is made in the one opaque material instead of in pictures: fine fibre grain on soft finishes, long streaks on metal, a weave on cloth and slow smudges in the roughness, all from the position of the point in the model and all faded out by `fwidth` where a pixel is wider than the grain, so nothing shimmers at a distance. It costs no draw and no asset.
- Steel and chrome are mid grey in colour (`0x7d848b` to `0xb4b8bc`): lighter values read as cream paint under the warm lamps of the tier.
- The normals of the cubicle walls lean up (`Kit.up`), so upright cloth takes the light from above as a soft thing does. Without it the walls were dark olive from every camera above them.
- The walls of the cubicles are 5.4 px thick with a round cap wider than the wall, as in the approved image, where the caps are the brightest lines of the model.
- The cubicles cast no shadow of their own: the cells are small and deep, and their own shadow made every cell a black hole. They still take the shadows of the machine.
- Crumpled paper is a faceted ball with flat shaded faces from a seeded stream, not a smooth turned shape.
- Steam is left out: there is no way to make it real inside one opaque material and the budget of draws.

## Motion

- Staplers: the arm of each follows the least of `v[0]` of its three slingshot shapes. Shut in 0.03 s, back in 0.25 s as `1 - exp(-5.2u) cos(1.5 pi u)`, one overshoot of about three in a hundred.
- Inbox: `v` = [held, since in, since out]. Tips 0.36 rad toward the scoop in 0.32 s with a small overshoot, a few loose envelopes and the banded bundle slide 11 px, the tray shivers while a steel ball is near the scoop (from `ctx.time`), and on release it swings back as `exp(-3.4t) cos(11.5t)`: two small swings.

## Lights

- What glows: the four button rings of the coffee machine and one bezel light of one sleeping monitor. Both meshes carry `lightGroup = 'office.windows'` and take their level from `levels(ctx, zone).byName.windows`. No light is created here.

## Notes

- The mirror of a cubicle is made in the builder (`Kit.mirror`), which also turns the winding, so no mesh has a negative scale.
- Triangles and draws are in the report to the Builder, with the commands.
