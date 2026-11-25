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
- Painted bases (image tool, `nano_banana_pro`, one take a floor): material only, no lines. The marble is the corporate floor itself; the carpet and the asphalt lend their light and dark to the drawn ground. The guide was not handed to the tool, because a painted line lands beside the layout. The drawn floors alone remain the fallback: delete `assets-src/table/art/painted/<tier>.png` and run the maker.
- The coverage mask is made by rule (see the recipe): local contrast above a threshold.
- The windows: one disc per insert, 0.35 px above the plate with a polygon offset, its picture from three atlases. Unlit it is dark glass in its colour; lit, its emissive rises from 0.05 to 1.55 with `insert.<id>.v[0]`. The window throws no light itself: colours and levels are exported from `src/table/real/art/inserts.ts` for the owner of the lights.
- The base of a floor is dull (roughness 0.9 or more, specular 0.2) under a clear coat of roughness from the coat picture: the print is ink, the shine is the lacquer.
- The full set is 8192 wide as the config allows.

## Measured

See the report at the end of this file; every number there names its command.

## Report, first complete version (14:46 UTC, 2026-11-25)

Branch `agent/art`, last commit `ba711dc`. Looks on `agent/art-looks`.

Done: three printed floors in the machine (drawn layer on the layout, painted material under it), their coverage masks made by rule, the clear coat (one `MeshPhysicalMaterial` a tier through `studio()` and `lit()`, orange peel in the coat's normal, a faint ball trail in the coat's roughness, gold leaf as metal on the corporate floor), nine insert windows with moulded pictures that glow with `insert.<id>.v[0]`, the plainer print under the launch lane and the lift, tests, recipes.

Not done: tuning under the real lights (none yet); the knot and the stack of hats read weakly; the office floor is greener and busier than the approved one; no look at the close keys (`lobby-doors`, `reply-all`, `youre-fired`, `last-save`).

MEASURED (all at `--format hd`, full assets, on the build machine):

| What | Before (part null, main 77d4dc7) | After (ba711dc) | Command |
| --- | --- | --- | --- |
| tier-corporate draft | 7.336 s, 175880 triangles, 653 draw calls | 14.499 s, 176052, 658 | `npm run still -- --key tier-corporate --format hd --tier draft --force` |
| tier-office draft | 7.369 s, 173539, 753 | 16.961 s, 173677, 756 | same with `--key tier-office` |
| tier-street draft | 6.621 s, 206971, 762 | 13.727 s, 207107, 764 | same with `--key tier-street` |
| tier-office review | not measured | 30.541 s, 183593, 809 | `npm run still -- --key tier-office --format hd --tier review --force` |

- With `--assets web` a draft still of tier-corporate took 10.6 s: about 3 s of the added time is the coat's shading over the whole frame and about 4 s is the 8192 wide pictures of the full set.
- Asset sets: web 9.77 MB, full 30.5 MB (`du -sb public/assets/table/art assets-full/table/art`); largest file 9.9 MB (`assets-full/table/art/office.webp`).
- Bare floor (M8's rule, radius 38.4 px, from `--diag coverage` stills read with `bareFloor` of `tools/lib/measure-core.mjs`): corporate 0.0093, office 0.0000, street 0.0001, against a limit of 0.08.
- `npm test`: 989 passed. `npm run build`: built. `npm run bots`: all clear.

UNKNOWN: how the floors look under the table's own lights and with real parts on them; whether the windows' glow survives the grade; the cost of the coat in a film frame.

The three things that still look least real:
1. A grey veil over the dark floors: the coat reflects the bright stand-in room evenly, so the midnight blue reads slate and the marble hardly shows.
2. The stationery of the office is flat print with no offset shade, and the carpet's stripes are too regular.
3. The unlit windows are dull discs: no depth under the lens, no bright rim where the lens meets the floor.
