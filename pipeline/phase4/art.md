# The printed floors and the insert windows (`tier-art`)

Owner: the floor artist. Branch `agent/art`. Everything is made by `node assets-src/table/art/make.mjs`; the recipes are in `assets-src/table/art/RECIPE.md`.

## What the approved images show that a quick look misses

1. The corporate floor is almost empty: thin gold hairlines, a few fans of about ten rays with an arc cap, three pinstripes along the shoulders. Its richness is the marble and the reflection of the lamps in the clear coat, not the amount of line.
2. Every insert has a thin metal ring and a dark line round it, and the lens is brightest in its middle and falls off to its own colour at the rim; the picture in it is a dark line, never a light one.
3. The office floor is carpet tile in large squares whose pile turns a quarter from tile to tile, and the pale walkway is a checker of the same tile in cream, not a painted stripe. The stationery is flat print but drawn with a soft offset shade so it reads as lying there.
4. The street's road runs through the middle insert to the drain, and its edge lines are solid while its centre line is dashed; the kerbs are a lighter teal band, and the car park lines stop short of the kerb.
5. In all three the print leaves a calm margin round standing things: a keyline a little way off the foot of a model, never a line running under a wall and out the other side.

## Decisions

- The drawn layer is SVG set in balls (20 by 11.25 a tier) and rasterised by sharp. It is the named fallback and is in the machine now. A painted base, when one is kept, goes under it from `assets-src/table/art/painted/<tier>.png`.
- Corporate filler: a sunburst of arcs and rays centred on the doors of the tower, at 40% so the key lines lead. Clear of every standing thing by a mask made from the layout.
- Office: tiles of 1.5 balls from the left wall, pile stripes turned a quarter each tile, a pale walkway down the middle and one across, a seeded scatter of blank sheets, tabs, clips, bands and pins. No sheet has writing; rules on a sheet are plain lines.
- Street: the avenue lies on `flat.street.road`; a cross street at v 4.45 to 5.15; zebra crossings and stop lines; two car parks; keep-clear hatching at the firehouse scoop; city blocks fill the rest.
- Common to all: the top lane with chevrons the way the ball runs (to the left), the launch lane with chevrons up the page, lamp surrounds, inlane and outlane chevrons, sling keylines, flipper sweep fans, a star under each post, rings under bumpers, a foot line under each model, keylines round target banks, a panel round each display, a dark line and a keyline round each insert, and a keyline for the label card under each insert (2.04 by 0.74 balls, as the Builder asked).
- The coverage mask is made by rule (see the recipe): local contrast above a threshold.
- The windows: one disc per insert, 0.35 px above the plate with a polygon offset, its picture from three atlases. Unlit it is dark glass in its colour; lit, its emissive rises from 0.05 to 1.55 with `insert.<id>.v[0]`. The window throws no light itself: colours and levels are exported from `src/table/real/art/inserts.ts` for the owner of the lights.
- The base of a floor is dull (roughness 0.9 or more, specular 0.2) under a clear coat of roughness from the coat picture: the print is ink, the shine is the lacquer.
- The full set is 8192 wide as the config allows.

## Measured

See the report at the end of this file; every number there names its command.
