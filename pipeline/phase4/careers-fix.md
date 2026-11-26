# Careers page, fix agent, critic round 7

Branch `agent/careers-fix`, from `origin/main` at 4f64ab74. Started 03:49 UTC on 2026-11-26. MEASURED before any change: `npm test` 96 files, 1345 of 1345; `npm run build` green; `npm run bots` "all clear".

## What the approved image shows that a quick look misses (`references/approved/marketing-top.png`, crops at native size and at 3 times)

1. Glass, the side toward the light: there is no opaque bevel. From the outside in: a bright hairline 1 px wide, brighter than the page (237 against 230); a thin dark line at 3 to 4 px (129 to 142); a paler line at 6 to 7 px (158 to 167); then a soft shade that fades into the face over 12 to 18 px. That shade is the edge's own shadow on the page under the slab, seen through it: it is wider on the left edge (gone at 27 px) than on the top edge (gone at 20 px). MEASURED with a profile of 41 px means across each edge.
2. Glass, the far side: the face brightens by about 15 of 255 over the last 15 px, dips 10 at 3 px from the edge, and ends in a white rim 1 to 2 px wide (217 to 220). Outside it the shadow is warm, not grey (131, 128, 112), its core 3 px wide at 118 to 135, and it fades over 12 px with a tail to about 28 px. The build's shadow read 91 to 98, neutral, 5 px wide and gone at 10 px: a hard dark line.
3. Glass, the face: smooth (mean square of the Laplacian 11.8 against the build's 57.4 on the same strip of card 1), with soft blotches 20 to 60 px across, and one fall of light across each card and across the row: 203 at the top left of card 0, 181 at its right, 148 at the right of card 2. The bottoms of the build's cards were 13 to 30 brighter than approved.
4. Medal: the face is brushed in fine arcs that are seen one by one at native size (mean square of the Laplacian on a strip of the face 5304 against the build's 1208), the cone of light is soft and wide, the lobes are round bumps with a warm highlight on the upper left of each and a short dark contact line under the lower right ones, and the rim's highlight is a soft band and not a chrome line.
5. Ticker: the strip is the same glass with the same hairline and warm short shadow, its words are as dark as the page's type (40 of 255 at the darkest 3 percent), and the first and last items stand well inside the strip, with clear glass between them and its ends.

## Point 1, the glass (04:10 UTC)

What changed in `real/perk-cards.ts`:
- `GLASS`: the fields `after`, `rim` and `line` are gone; `fade`, `bend` and `mostSide` are new; `shade`, `exit`, `glint` and `caster` have new values. `SLAB`, `cardGlass`, `slabGeometry`, `groundEdge` keep their names and meanings. The Decision page imports them, so its look changes too and /root is told.
- The light and shade of the ground edge is now two tables read off the approved card (`NEAR`, `FAR`) and one function, `edgeLight(d, facing, reach)`. Toward the light: a bright hairline, then the edge's own shade on the page under the slab. Away from it: the face brightens, dips and ends in a pale rim.
- The face has rings every 2.2 px as far as the shade goes, so the shade is a smooth fall and not three flat bands.
- The glass has a picture, `glassPicture()`: soft clouds and a fine grain, the page seen through frost. Its texture coordinates are pushed outward at the ground edge by `GLASS.bend` px, the little bend at the rim.
- `spill`: a thin warm patch on the page beside the far edges of a resting slab. It is the light that leaves the glass there. It makes the slab's shadow short, warm and soft, as approved has it, without a change to the shared shadow.
- `caster` 6.4: the slab's shadow caster stands a little higher, so its shadow has a tail.

Decision: no real transmission. Phase 3 tried it and it hid the shadows on glass and doubled the draws. The page seen through the glass is drawn into the slab: the grain picture, the shade of the edge, the bend.

MEASURED (`npm run still -- --key marketing-top --format hd --tier review`): 22.8 s, triangles 590378 (582338 before), draw calls 199 (196 before). Profile across the bottom edge of card 0 at x 400, mean of 20 columns: rim 225 at its peak, shadow 119 to 139 for 4 px, 167 at 7 px, 198 at 10 px, 217 at 13 px; approved 216 to 220, 131 to 148, 167 at 9 px, 191 at 13 px, 212 at 19 px. Face samples of card 0: mine 204, 195, 187 across the top against approved 203, 194, 181. Card 2 is still 15 to 20 brighter than approved on its right side.

Looks spent on `perk-cards` in this round: 5 of 40.

Textures: glass picture, 512 by 512 px, 1.0 MB (1.4 MB with its smaller copies). Recipe in `assets-src/careers-fix/RECIPE.md`.

