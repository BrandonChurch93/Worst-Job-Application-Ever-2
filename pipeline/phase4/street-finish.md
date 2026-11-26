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
| model-firehouse (`youre-fired`) | 11 |
| model-garage (`tier-street` 11, `table-wide` 10, `last-save` 2, `rail-cam` 1) | 23 |
| model-moms (`last-save` 1, `tier-street` 1) | 2 |

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

## Third pass, 11:55 to 12:35 UTC, in the Builder's order

- Garage. The Builder's look at merge 34 from straight above: a ring of clear rails, not a garage. Decision: the clear rings stay where they are (the inside is the spiral's and the frame owner counts on my inner face), and a grey concrete parking deck stands outside each ring: 24 px out, 6 px thin at the ring and 18 px deep at its edge with a moulded lip, a kerb on top and the bays marked. A slab is cut where the tube of the ball passes (the test that no vertex is in the tube passes), stops short of the stanchions on the right wall, stops short of the police wall below that roof, and none stands in the sector that faces the police station above its roof.
- One more ring and deck went in half a pitch under the rim, so five decks stack evenly. In `table-wide` that deck stood before the sign 'Background Check' (MEASURED on my still: the sign's crop went from 677 board pixels to 68). It is now left open on the side away from the police station, 0.95 rad to each side; the sign is back (ratio 6.13 on the crop 1306 530 1378 552).
- The clear rings show at the sides of the cylinder: a pale sheen and more cover where the plastic turns away from the eye, none where it faces it, so a sign seen through the middle keeps its contrast.
- Windows. Each room takes its level, its warmth and the place of its lamp from `hash01` of its place in the wall; about one in six is dark, about one in three has a blind part way down.
- Mom's house: two lit roof windows on the back slope, the one the tier's camera sees past the board.
- M4, MEASURED with `npm run measure -- --unit pinball --only M4 --tier draft` at 12:17 UTC: red, least contrast 1.68, every failing run is `copy:step3.table.title` (the marquee, not this folder). The measure took 15 s and does not see what stands before a sign, so the signs were also checked on my own stills.
- M3: UNKNOWN from my side. One run was started and stopped, since it renders every still.

- Firehouse parapet: in merge 36's final `youre-fired` the top quarter of the building was one pale stone band. The parapet's outer face is brick now, between a slim stone cornice and the stone coping, as approved's. Seen in my draft still at 12:42 UTC.
- The pale round pad the ball rests on before the firehouse door is not drawn in this folder: `firehouse.ts` draws only the bay floor behind the mouth.
- MEASURED at 12:43 UTC: `npm test` 119 files, 1479 of 1479; build exit 0; bots all clear; `npm run counts -- --key table-wide --live low` and the same at `--key tier-street`: 17 draw calls, 97824 triangles for this folder's parts (baseline 17, 71368; limit 17, 101368). One `review` still of `tier-street`: 73.9 s. One `draft` still: 36 to 52 s by key.

## Left for the next owner

- The garage's slabs are flat grey from the side; approved's read as moulded clear grey plastic with highlights.
- The bank's roof and the row houses are small and plain from above.
- The three tall bank windows look alike.

