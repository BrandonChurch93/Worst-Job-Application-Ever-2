# The printed floors and the insert windows (`tier-art`)

Owner: the floor artist. Branch `agent/art`. Everything is made by `node assets-src/table/art/make.mjs`; the recipes are in `assets-src/table/art/RECIPE.md`.

## What the approved images show that a quick look misses

1. The corporate floor is almost empty: thin gold hairlines, a few fans of about ten rays with an arc cap, three pinstripes along the shoulders. Its richness is the marble and the reflection of the lamps in the clear coat, not the amount of line.
2. Every insert has a thin metal ring and a dark line round it, and the lens is brightest in its middle and falls off to its own colour at the rim; the picture in it is a dark line, never a light one.
3. The office floor is carpet tile in broad squares of two grey-greens, chequered, and the pale walkway is a wide speckled cream cross: one band down the middle to the drain and one across under the cups. There is little on it: a few clips, sheets and bands, and thin tan keylines along the ball's lanes.
4. The street's road runs through the middle insert to the drain, and its edge lines are solid while its centre line is dashed; the kerbs are a lighter teal band, and the car park lines stop short of the kerb.
5. In all three the print leaves a calm margin round standing things: a keyline a little way off the foot of a model, never a line running under a wall and out the other side.

## Decisions

- The drawn layer is SVG set in balls (20 by 11.25 a tier) and rasterised by sharp. It is the named fallback and is in the machine now. A painted base, when one is kept, goes under it from `assets-src/table/art/painted/<tier>.png`.
- Corporate filler: a sunburst of arcs and rays centred on the doors of the tower, at 40% so the key lines lead. Clear of every standing thing by a mask made from the layout.
- Office: chequered carpet tiles of 2.95 balls in two grey-greens, flecked with short pile marks; a pale speckled walkway 1.7 balls wide down the middle and 1.7 across under the lowest cup, edged with a tan line; a seeded scatter of 6 blank sheets, 4 tabs, 11 clips, 7 bands and 12 pins, each with the shade it would throw. No sheet has writing; rules on a sheet are plain lines. Changed at 15:00 after the Builder's note that the first floor was busier and greener than the approved one.
- Street: the avenue lies on `flat.street.road`; a cross street at v 4.45 to 5.15; zebra crossings and stop lines; two car parks; keep-clear hatching at the firehouse scoop; the rest is paving slabs at 38% under the asphalt's own cracks and grit (painted detail at gain 2.6). The ground is teal navy as in the approved image, not the brighter blue of the first version.
- Common to all: the top lane with chevrons the way the ball runs (to the left), the launch lane with chevrons up the page, lamp surrounds, inlane and outlane chevrons, sling keylines, flipper sweep fans, a star under each post, rings under bumpers, a foot line under each model, keylines round target banks, a panel round each display, a dark line and a keyline round each insert, and a keyline for the label card under each insert (2.04 by 0.74 balls, as the Builder asked).
- Painted bases (image tool, `nano_banana_pro`, one take a floor): material only, no lines. The marble is the corporate floor itself; the carpet and the asphalt lend their light and dark to the drawn ground. The guide was not handed to the tool, because a painted line lands beside the layout. The drawn floors alone remain the fallback: delete `assets-src/table/art/painted/<tier>.png` and run the maker.
- The coverage mask is made by rule (see the recipe): local contrast above a threshold.
- The windows: the three of a tier are one mesh and one drawing, 0.35 px above the plate with a polygon offset, their pictures from three atlases. Unlit a window is dark glass in its colour with a thin dark line picture; lit, its emissive rises from 0.05 to 1.55 with `insert.<id>.v[0]`, carried on a vertex attribute (`wjaGlow`) that a chained `onBeforeCompile` multiplies into the emissive, as `src/shell/real/type.ts` chains its own. The window throws no light itself and takes the lamps' light (`userData.lit`): colours and levels are exported from `src/table/real/art/inserts.ts` for the owner of the lights.
- The base of a floor is dull (roughness 0.9 or more, 0.48 on the corporate floor where the leaf is metal) with specular 0 under a clear coat of 1 whose roughness comes from the coat picture: the ink meets the lacquer, not the air, so the shine is the lacquer's and the leaf's. The room's reflection in the coat is left as it is; the owner of the lights puts the room out.
- 15:43 UTC, under the table's own lights: the corporate coat is 0.2, not 1, and the windows reflect the room at 0.1. MEASURED at `lobby-doors` (`npm run still -- --key lobby-doors --format hd --tier draft --assets web --force`): with the coat at 1 the floor left of the doors was cream, 235 227 211 at pixel 420, 860; with the room's reflection at 0 it was navy; with it at 0.12 a grey haze still lay over the print. The cause is the wide skirt round every lamp in the zone's surround (`src/table/real/lights/surround.ts`, `0.06 * exp(-a * a * 0.08)` at a gain of up to 9): some eight lamps overlap, and a floor seen along its face mirrors their sum. The leaf keeps the whole room, since it is the leaf that should shine. At 15:45 the lights' owner narrowed the skirt (0.012, gain 4 at most) after my note; with the coat back at 1 the floor left of the doors was still an even grey, at 0.3 a soft sheen over navy, so it stands at 0.2: one number in `COAT`. The office and street coats stay at 1: their close keys do not wash out.
- The full set is 8192 wide as the config allows.
- Draw calls: a floor is drawn when its own rectangle is in the camera's view (a `THREE.LOD` subclass whose `update(camera)` the renderer calls before it draws), because the sphere round a plate 1920 by 1080 reaches into the tiers beside it. With the windows in one mesh a tier key draws 2 or 3 things of this part.

## Measured

See the report at the end of this file; every number there names its command.

## Report, first complete version (14:46 UTC, 2026-11-25)

Branch `agent/art`, last commit `ba711dc` (this report added in the commit after it). Looks on `agent/art-looks`.

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
- Asset sets: web 8.01 MB, full 25.54 MB (`du -sb public/assets/table/art assets-full/table/art`); largest file 9.30 MB (`assets-full/table/art/office.webp`, `ls -S -l`). The sources under `assets-src/table/art` are 25.45 MB, nearly all the three painted bases.
- Bare floor (M8's rule, radius 38.4 px, from `--diag coverage` stills read with `bareFloor` of `tools/lib/measure-core.mjs`): corporate 0.0093, office 0.0000, street 0.0001, against a limit of 0.08.
- `npm test`: 989 passed. `npm run build`: built. `npm run bots`: all clear.

UNKNOWN: how the floors look under the table's own lights and with real parts on them; whether the windows' glow survives the grade; the cost of the coat in a film frame.

The three things that still look least real:
1. A grey veil over the dark floors: the coat reflects the bright stand-in room evenly, so the midnight blue reads slate and the marble hardly shows.
2. The stationery of the office is flat print with no offset shade, and the carpet's stripes are too regular.
3. The unlit windows are dull discs: no depth under the lens, no bright rim where the lens meets the floor.
