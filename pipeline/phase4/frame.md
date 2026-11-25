# Frame: the body of the machine

Owner: frame. Parts: `table-frame`, `marquee`, `loader`. Code: `src/table/real/frame/`. Branch: `agent/frame`.

## What a quick look at the approved images misses

1. The outer rail is not one grey bar. It is a bright brushed extrusion with a dark hair of a gap between it and the border of the page, and a lower ledge on the side of the lane.
2. The rails show the row of lamps as a row of glints along their length. The metal is read by what it reflects, not by its own colour.
3. The housing of the marquee is a stepped double bezel: a bright outer frame, a dark inner step, and the display sits in a dark seat of its own under the title.
4. The apron is a slab with a soft bevel standing a little above the page, and the plate at the drain is a small brushed plate with four screws and a warm edge.
5. The collars of the clear tube are thin bright turned rings with a groove, and the tube is seen mostly by its edges and by what shines in it, not by a tint.

## The clear tube (one spec for the feed, drain and lift tubes)

Written by frame, who started first. All numbers are page pixels (96 px is one ball, 27 mm). They are the `TUBE` object in `src/table/real/frame/loader.ts`.

- Outer radius 59.5 (the stand-in's), wall 4.5, so the bore is 55 and the ball clears it by 7 all round.
- Two shells, the outer facing out and the inner facing in, 24 sides. Front faces only.
- Material: `clearOf(zone)` in `src/table/real/frame/mats.ts`. A physical material with no transmission, colour 0xdfe8ea, roughness 0.06, clearcoat 1, opacity 0.05, depth write off, render order 3. A shader line added after `studio()` and before `lit()` raises the alpha where the wall turns away from the eye (power 2.2, 0.5) and where light shines in it (0.22 of the mean of the outgoing light).
- Collars: turned aluminium, 22 long, outer radius 66, a groove 4.8 wide and 1.6 deep in the middle, a 2 px chamfer at each end, two screws on top 0.5 rad either side of the crown. They stand every 3.4 balls measured along the whole tube from its start, so a tube cut at a zone edge has them where one piece would.
- Saddle clamps: a strap 9 wide and 2.4 thick over the top half of the tube, legs down to the surface, a small foot with one screw each side. They stand half a step from each collar, only where the tube lies level and near a surface.
- The tube is cut at each zone edge and built in each zone with that zone's own material.

## Decisions

- The lit zones give metal only the light of the lamps and a dimmed reflection of the studio, so full metal reads near black from above. The frame's aluminium is the page's brushed aluminium (same grain picture, same anisotropy) with metalness 0.72 and roughness 0.36 and a lighter base, so it takes the lamps' light as the approved rails do. Colour rides on the corners, so brass, dark and bright aluminium are one drawing.
- A tier is four drawings: metal, paint (border ceramic, dark gaps, bezel, laminate, kerb, enamel), wear strips of bright steel, and one instanced mesh of screws. Budget is eight.
- The border of the page (0.15 balls) is continued down both sides of each well as ceramic with a 1.2 px dark gap to the rail, because the well spans the whole width of the page.
- The left rail: 3 px chamfers, a channel 34 wide and 3 deep along its top with a screw every 1.5 balls, a ledge 18 wide and 7 lower on the lane side, one joint with a 1.4 px gap at 5.6 balls.
- The right rail is a cradle. The feed tube's middle is half a ball above the page, so its lowest 11.5 px lie in a round bed of radius 62.5 cut along the rail's top. Lands of 27 px either side carry the screws.
- On the street tier the feed tube dives to the plunger over the last 1.65 balls. There the right rail is an outer wall and a dark pocket.
- The lane walls (60 tall) are built in the lengths `table.segs` gives, so every opening of the layout is an opening of the wall. On the top tier the launch wall is open from the top wall to 0.62 balls below where the `launch` rail crosses it: that is the throat. A corner block cut to a circle of radius 2 balls (centre 0.3 balls left of the playfield's right wall, 2 balls under the top wall) turns the launch lane into the top lane. It clears the ball's path by 0.69 balls or more.
- The right top corner of tiers 2 and 1 has a fillet of radius 0.5 balls, the largest that a ball in the square corner of the physics never enters.
- The cross rail between two tiers is two halves that meet at the zone edge: 0.12 balls of the tier above (56 tall) and 0.3 balls of the tier below (to the same top). The chute's throat is cut through the lower half 0.75 balls either side of the middle, the mouth through the upper half 1.2 balls either side. The step of the floor under it is a dark aluminium riser.
- The foot of the street tier is a wall up to the page with a tunnel 122 px tall for the drain.
- The shoulders are not solid blocks. The approved images show floor there with models on it, and the layout stands houses and the display on the floor inside them. Each shoulder is a rim of wall along the layout's segments (`shoulder.step`, `shoulder.edge`, `mouth.side`, `outlane.side`) with turned posts where the lengths meet. The right one holds a dark seat 6 px wide and 35 tall round the display's box. The left one carries a small bright plate with enamel pips: three on the top tier, two in the middle, one on the street.
- Tier trim: a 2.4 px line of brass let into the top of the lane walls, the top wall and the shoulder edges (top tier); a strip of grey laminate 10.4 wide on the lane walls (middle tier); a painted kerb 7 wide and 9 tall at the foot of the lane walls, black and yellow between 5.3 and 6.9 balls down the tier (street). No road sign's place is given to the frame, so the black and yellow stands beside the lane guides. If the owner of the road signs puts one elsewhere, these two numbers move.
- Marquee: everything is built flat in the board's own frame (across, up the board, out of the face) and turned once by `BOARD.turn`. The face is at 0, where the title is set. Outer frame 20 wide and 15 proud, inner dark step 7 wide and 6 proud, housing 46 deep, a strip 15 taller along the top for 18 lamp lenses, 9 screws along the foot of the frame and 4 down each side, a hinge of 7 knuckles under the foot, 12 pairs of vents in the back. The foot is a 9 px plate with 18 bolts, four braces and a beam under the hinge.
- The face is the code-drawn skyline (`skyline.ts`), 1296 by 336, drawn by rule from the seed with no letter in it: a dusk sky, three depths of buildings, windows lit warm below 34 px, white to 92 px and cold gold above, a row of warm street lamps along the foot. The city is low under the title (62 px) and tall at both ends. It is the picture and its own glow map. No generated picture is shipped yet.
- The pocket for the main display is a dark seat 472 by 68 centred 88 px above the foot of the face.
- Apron: the two slabs are the page's own ceramic material, 16 tall with a 3.2 bevel and 10 px corners. The card is paper under a clear cover 12 px larger all round on four turned spacers with four screws. The drain plate is a brushed plate with a brass edge and four screws, and under it a turned ring with a dark round throat.
- Loader: the port and the outlet are a turned ring with a chamfered outer edge, a groove with eight screws, a chamfered lip and a cup with a dark throat.

## For the owner of the lights

- The marquee's face is the mesh `marquee.face.marquee` with `userData.lightGroup = 'marquee.panel'` and `material.userData.lit = true`. Its emissive level is `0.05 + 1.1 * level('panel')`.
- The lamp lenses of the marquee are the instanced mesh `marquee.lenses.marquee`, 18 of them, along the top strip of the frame, with the same group. Emissive level `2.0 * level('panel')`, colour `MARQUEE_PANEL`.
- The lane lamps stand in the floor of the lanes, so the rails carry no lens recess.

## Found, not the frame's to mend

- The `launch` rail climbs in a straight line through each tier, so a ball in the launch lane lies under the floor plate of the middle and top tiers for most of its way.
- The lift rails do the same in the lift lane.
