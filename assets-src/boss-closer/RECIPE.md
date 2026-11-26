# Recipes of the boss closer

Every texture and built asset of the boss that this owner changed or added. All are made in code when the page first needs them. No file is stored. No new texture was added: every new surface is geometry with vertex colours, or a material that reuses a picture another recipe already made.

## glass panes of the verify card and the shield (geometry and materials, no texture of their own)

- Made by: `paneGeometry()`, `rimGeometry()` and `glassKit()` in `src/boss/real/glass.ts`
- From: nothing but numbers: the tables `CARD_PANE`, `SHIELD_PANE`, `RIM`, `CARD_GLASS`, `CLEAR_GLASS`. The frost of the face is the shared 1024 px glass picture of `materials().glassCard`, used again, so it costs no memory
- Prompt or command: `paneGeometry(shape, thick, CARD_PANE)` gives a slab with a bevel whose vertex colours are brighter on the lit runs and darker on the far runs; `rimGeometry(shape, thick, RIM.card, inset)` sweeps a round polished bead round it; `glassKit().card` and `.clear` are alpha blended (through 0.86 and 0.8) and pass through `studio()`
- Takes: 4 renders of `boss-fight` in all for the card, the shield and the arrow together; the numbers of the earlier takes were not written down
- Why this one: the page and the arm are faintly seen through the pane and the rim is a bright line that the room's light runs along, as in `boss-fight.png`. 0 MB of its own.
- Date: 2026-11-26

## cracks of the broken shield (geometry, no texture)

- Made by: `fracture()` in `src/boss/real/glass.ts`, called by `brokenGlass()` in `src/boss/real/body.ts`
- From: nothing but numbers: the lines of `GLASS_CRACKS`, jittered and branched by `hash01` of `src/core/random.ts` with seed 41
- Prompt or command: `fracture(GLASS_CRACKS, SHIELD.tall, 41)` returns three geometries: a bright hairline on the top face, its dark twin on the under face moved by the depth, and a pale sheet between the two
- Takes: 1 of its own after the last owner's even pale lines on the top face
- Why this one: a crack is seen as a bright edge with a dark line beside it and a faint wall between, so it has depth; it stops short of the rim. 0 MB.
- Date: 2026-11-26

## fallen cap (geometry, no texture of its own)

- Made by: `pillGeometry()` in `src/boss/real/pill.ts`
- From: nothing but numbers: `PILL` (33 px tall, 12 rings), ten blisters in `BLISTERS`, three nicks of the rim in `NICKS`, one dent in `DENT`
- Prompt or command: a stadium outline of 288 by 72 px swept through a quarter ellipse, its points then moved by `pillBump()` and pulled in at the nicks; drawn with the shared orange, and a second time with the soot picture of the boss keeper's recipe (512 x 128, 0.33 MB, unchanged) on a lit matte material
- Takes: 2 (flat ash flecks on an unlit skin; then the soot on a lit material so the blisters shade)
- Why this one: the cap that lies on the page is a plump capsule with domed ends, a dent and a chipped rim, and casts a wider shadow than the flat cap did. 0 MB of its own.
- Date: 2026-11-26

## brushing of the plates (data texture, 512 x 128, kept, used deeper)

- Made by: `brushing()` in `src/boss/real/body-kit.ts`, unchanged in size
- From: nothing but numbers, as the boss keeper's recipe says
- Prompt or command: `BRUSH.deep` 0.3 to 0.42; plate tone `0x7b7f85` alive and `0x6c7076` in the wreck; roughness 0.4 to 0.46
- Takes: 5 (darker and smoother, which went near black under this light; `0xa2a6aa`, too pale; `0x8e9296` alive with `0x9a9ea2` in the wreck, paler than the approved steel; then these two)
- Why this one: the plates read as brushed steel slabs in both keys, and the wreck's plates are no longer dark flat shapes with bright rivets. 512 x 128 x 4 bytes = 0.25 MB, 0.33 MB with its mip chain, unchanged.
- Date: 2026-11-26

## gained health (material, no texture)

- Made by: `gainStuff()` in `src/pages/step4/real/health-bar.ts`
- From: a clone of the shared orange through `studio()`, with its own colour as emissive
- Prompt or command: emissive strength `GAIN_GLOW` 1.7, faded out by the page between 1.0 and 1.6 s after Session expired
- Takes: 1
- Why this one: the part of the bar that comes back is seen as a hot piece on the end of the fill, then is the same orange as the rest. 0 MB.
- Date: 2026-11-26

## socket collar and pit (geometry and materials, no texture of their own)

- Made by: `transform.ts` in `src/boss/real/`, the sweep of the ring and of the wall round the hole
- From: nothing but numbers: the profile of the ring (a lip 5.8 px wide that stands 0.6 over the page, a step down to 9.6 below it, then the wall), `PIT`
- Prompt or command: the ring is drawn in the plate steel without its normal and roughness maps; the wall is `0x34312e` with its normal map at 0.3
- Takes: 4 (with the maps, which showed as dots; flat and sunk, which was lost in the dark; a wide ramp, a pale band; then this one)
- Why this one: beside `boss-down.png` it is a thin steel lip with a dark step behind it. 0 MB of its own.
- Date: 2026-11-26

## lying shield (materials, no texture of its own)

- Made by: `src/boss/real/body.ts` with `CLEAR_GLASS` and `deepTone()` of `src/boss/real/glass.ts`
- From: nothing but numbers: opacity mixed to `CLEAR_GLASS.lying` 0.62 and colour to `0x5f8376` as the shield comes to lie flat; pins, rods and tubes hidden from 0.9 of the fall
- Prompt or command: none
- Takes: 2
- Why this one: against the page a clear pane was lost; this reads as green glass with its cracks. It is still a thin sheet where `boss-down.png` shows a thick bar. 0 MB of its own.
- Date: 2026-11-26
