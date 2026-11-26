# Street models: finish notes

Owner: street-finish. Branch `agent/street-finish`. Parts: `model-firehouse`, `model-police`, `model-bank`, `model-garage`, `model-houses`, `model-moms`, `model-road-signs`.

## What the approved images show in my part that a quick look misses

1. The sign plates are cream enamel with a thin gilt edge and dark letters, and they stand upright on the front edge of the parapet: the plate is brighter than anything else on the roof but it is matte, with no glare under the words.
2. The beacon is a deep red ribbed dome whose outline stays smooth, with a small hot core, on a chrome ring; its red lies pooled on a pale grey roof deck round it.
3. The brick is uneven from brick to brick, the mortar is darker than the brick and reads as depth, and the windows sit well back behind grey stone surrounds and mullions.
4. The garage is stacked clear tiers on grey posts with dark gaps between the tiers, and it stands beside the police station, not over its front.
5. The houses are tiny gabled rows with red roofs and one lit window each, standing just above the slingshots; the bank shows four columns with warm light behind them.

## The r12 issues that are mine and were still true at 9334a125

Seen on my own `youre-fired` and `tier-street` drafts at 11:15 UTC.

- R1-4 3 (severe): the garage read as one pale concrete ring. Mine: the ring. The wires inside it like spokes are the spiral of the frame owner.
- R1-4 17: the glowing grid panel on the roofs was my `roofLight`. The pale green posts in front of the bank are the drop targets `bank.drop` of `play/`, not mine.
- M4 `youre-fired` 1.3: the sign type was tone `inkLight` on a pale board. M4 reads the vertex colour of the first surface under the type against the fill of the type. machine_finisher agreed to tone `ink` for `sign.street.firehouse`.
- Beacon: a faceted pink dome that blew out, with a turning reflector, on a dull ring.
- 'Background Check': the board was there but the words did not sit on a plate that read as one.
- Houses: dark hip and gable roofs with no light to be seen from above, on a kerbed strip of grass.
- Bank: no plate under it.
- M3 `youre-fired` 0.4942, `tier-street` 0.7485: brick flat and even, windows shallow.

## Baseline, MEASURED on 9334a125

- `npm test`: 115 files, 1461 of 1461.
- `npm run build`: exit 0. `npm run bots`: all clear.
- `npm run build && npm run counts -- --key table-wide --live low`, my rows (draw calls, triangles): model-firehouse 6, 50144; model-road-signs 4, 3076; model-moms 3, 2982; model-police 2, 2276; model-garage 1, 8120; model-bank 1, 4770; model-houses 0, 0. Folder: 17 draw calls, 71368 triangles. Budget: 17 draw calls, 101368 triangles.
- `npm run still -- --key youre-fired --format hd --tier draft`: 43.2 s.

## Looks, by part, from my first still

| Part | Looks |
| --- | --- |
| model-firehouse (`youre-fired`) | 8 |
| shared tier (`tier-street`), counted against model-garage | 7 |

## Decisions

- Sign boards: one maker, `board()` in `kit.ts`, for all four models. Cream enamel `0xefe8d6` as a paint kind of its own (`KIND.enamel`): flat, near matte, no clear coat, with a small light of its own in the paint shader (0.2 of its colour) so the plate does not fall to khaki in the dim of the tier. The material itself has no emissive colour, so the zone hook lights it and M4 reads its cream. Gilt bezel 1.25 px wide in the metal bucket. The board is placed, sized and turned by the sign shape of the layout, so it stands where the letters are.
- Beacon: the turning reflector is gone. A dome of 160 segments with 32 soft ribs and smooth normals along its outline, a small bulb inside it, and the hot core is drawn in the lens shader from the distance of the eye's ray to the bulb, so it stays a small core through the ribs. The firehouse bulb is merged into the red bay lamp mesh, which frees one draw call for the clear decks of the garage. Neither beacon turns now.
- Garage: the concrete ring beams are clear moulded decks on steel hoops, the posts are grey gloss steel outside the ring, the rim is post grey. The ring keeps its radii (inner face 9.1 px inside `SPIRAL.frame`) and the opening where the tube and the wire receiver cross, as agreed with frame_finisher. Toward the police station (58 degrees to each side of the line between the two centres) nothing of the garage stands higher than that station's roof plus 0.3 balls, so the station's front and its sign are clear of my ring from straight above. What still lies over them in `tier-street` is the clear trough and the wires of the frame owner.
- Roof lights: taken out. One plain hatch with a felt lid on each roof.
- Houses: all six roofs are gabled and dull red, each with one lit roof window on a slope, to be seen from straight above. Each row stands on a brushed steel plate screwed to the floor. Hedges, bush and grass are gone.
- Bank: a steel plate under its base.
- Brick: more spread from brick to brick, a few pale bricks, deeper and darker mortar, soot and bloom.

## After the first pass, MEASURED at 11:39 UTC on the merge of origin/main 37c2e908

- `npm test`: 116 files, 1466 of 1466. `npm run build`: exit 0. `npm run bots`: all clear.
- `npm run build && npm run counts -- --key table-wide --live low`, my rows (draw calls, triangles): model-firehouse 5, 47536; model-road-signs 4, 3076; model-moms 3, 2982; model-garage 2, 10672; model-police 2, 8640; model-bank 1, 10340; model-houses 0, 0. Folder: 17 draw calls (17 before), 83246 triangles (71368 before, 11878 more of the 30000 allowed).
- Sign contrast on my own still, `python3 signlum.py out/work/stills/key-youre-fired-hd-draft.png 1030 188 1140 235` (a crop inside the firehouse board round the word; Otsu split, edge pixels dropped; relative luminance from sRGB): letters 0.0342, board 0.5269, ratio (board + 0.05) / (letters + 0.05) = 6.85.
- `npm run still -- --key youre-fired --format hd --tier draft`: 38.7 s. No asset file: 0 MB in `public/assets/table/street/`, `assets-full/table/street/`, `assets-src/table/street/`.

## Second pass, MEASURED at 11:49 UTC

- `npm test`: 116 files, 1466 of 1466. `npm run build`: exit 0. `npm run bots`: all clear.
- `npm run build && npm run counts -- --key table-wide --live low`, my rows (draw calls, triangles): model-firehouse 5, 50538; model-road-signs 4, 3076; model-moms 3, 2982; model-garage 2, 10692; model-police 2, 8640; model-bank 1, 10780; model-houses 0, 0. Folder: 17 draw calls, 86708 triangles (15340 more of the 30000 allowed).
- Sign contrast, same crop of my `youre-fired` draft still: letters 0.0319, board 0.4792, ratio 6.46.

Decisions of the second pass:

- Roofs, as the Builder asked after the first pass: the decks of the firehouse and the police station lie 20 and 18 px under the parapet top (12 and 10 before) and the inner face of the parapet is darker. `roofWorks()` in `kit.ts` adds cross laps and patches in the felt, a lead upstand, joints in the cap, two drains, a pipe on blocks and a conduit. The felt paint has stains and dust in the shader. Each beacon stands on a round kerb 9 px high, so it keeps its height over the parapet.
- Windows: the frame and the glazing bars stand in front of the pane with a gap behind them, the reveals are deeper (5.5 px by default, 6 on the firehouse front) and darker, the bars heavier.
- Chrome ring: the bands a polished ring shows (dark under the bead, a dark line at the horizon, bright over it) are in its vertex colours, since the one metal material of the folder is too rough to mirror the room and a second material would cost a draw call.
- Bank: a plain pediment on the cornice over the columns, three lamps in the porch ceiling, brighter tall windows.
- The board's own light is 0.14 of its colour (0.2 in the first pass), since the police board read too white in `tier-street`.
