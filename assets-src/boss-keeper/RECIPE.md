# Recipes of the boss keeper

Every texture and built asset of the boss that this owner changed or added. All are made in code when the page first needs them. No file is stored.

## soot (data texture, 512 x 128, RGBA), remade

- Made by: `sootPixels()` in `src/boss/real/transform.ts`
- From: nothing but numbers: `hash01` of `src/core/random.ts` blended between grid points at four sizes, five round char spots given as numbers in `CHAR`, six split lines given as numbers in `SPLITS`
- Prompt or command: `sootPixels(512, 128)`, wrapped in a `THREE.DataTexture` by `soot()` in the same file and laid over the cap as a skin of the cap's own geometry
- Takes: 3 (the first owner's flat dark ends that reached a third of the cap each; then char spots with so much grey ash that they read as camouflage; then this one)
- Why this one: the char sits only on the two rounded ends, as in `boss-down.png`; its edge is hard and ragged, loose flakes lie within 16 px of it, thin splits run from it into the clean orange, a soft soot halo fades round it, and inside it are a few grey ash patches and hairlines of bare orange between flakes. 512 x 128 x 4 bytes = 0.25 MB, 0.33 MB with its mip chain.
- Date: 2026-11-26

## puff (data texture, 64 x 64, RGBA, used as an alpha map), kept

- Made by: `puffPixels()` in `src/boss/real/transform.ts`
- From: nothing but numbers, unchanged from the first owner
- Prompt or command: `puffPixels(64)`
- Takes: 1 (kept as it was; only the ribbon that carries it grew wider, curls more at its top and is denser near its foot)
- Why this one: the streaks already slide along the wisp without a single ball. 64 x 64 x 4 bytes = 0.0156 MB, 0.021 MB with its mip chain.
- Date: 2026-11-26

## pit wall and floor (materials, no texture of their own)

- Made by: `pitStuff()` in `src/boss/real/transform.ts`
- From: the page's own grain normal map (`materials().ceramic.normalMap`), shared, so it costs no memory
- Prompt or command: two `MeshPhysicalMaterial` through `studio()`: wall `0x7a746d`, roughness 0.96, grain at 0.7; floor `0x0d0c0c`, roughness 0.95
- Takes: 3 (a wall at `0x55514c` with grain at 1.6, which striped; one at `0x3f3c39`, which read as one black pill; then this one)
- Why this one: the hole reads as a broken pit with a rough sloped wall down to 58 px and a floor that is near black but not black. 0 MB.
- Date: 2026-11-26

## smoke ring of the muzzle (built geometry, no texture)

- Made by: `ringGeometry()` in `src/pages/step4/real/boss-weapons.ts`
- From: nothing but numbers: 48 parts round, four rings of radius, `hash01` for the thin places
- Prompt or command: `ringGeometry()`, one geometry shared by every flash, each with its own plain material so each can fade alone
- Takes: 3 (a ring 1.8 px above the muzzle, hidden by the slab that leaves through it; one 34 px up that was never drawn; then this one, dark smoke at 0.2 grey)
- Why this one: a flat grey ring seen nearly edge on that widens from 24 to 60 px, runs 44 px ahead of the mouth and fades with the flash. 288 triangles, 0 MB of texture. The first ring was wound the wrong way round and so was culled and never drawn; the winding is turned.
- Date: 2026-11-26

## brushing of the hull plates (data texture, 512 x 128, RGBA), new

- Made by: `brushPixels()` in `src/boss/real/body-kit.ts`
- From: nothing but numbers: `hash01` of `src/core/random.ts`, one tone for every row and for every pair and four of rows, a slow drift along each row between 8 grid points, and a sharper scratch on about one row in fourteen
- Prompt or command: `brushPixels()`, wrapped in a `THREE.DataTexture` by `brushing()` in the same file and set as the colour `map` of the plate material, 2.4 texels to a page pixel, repeating
- Takes: 5 (the first owner's normal map on a full metal, which streaked; the same at 0.05; no brushing at all, which the Builder ruled against at 05:07 UTC; a picture at 0.17 depth whose rows were finer than a pixel and so were not seen; then this one at 0.3 depth with rows of one, two and four texels)
- Why this one: fine straight lines along the long axis of every plate, low in contrast, that stay sharp in the `review` tier (measure M2). 512 x 128 x 4 bytes = 0.25 MB, 0.33 MB with its mip chain.
- Date: 2026-11-26

## cut plates of the hull (built geometry and materials)

- Made by: `cutPlate()` and `bossKit()` in `src/boss/real/body-kit.ts`; `crown()`, `wingParts()`, `side()` in `src/boss/real/body.ts`
- From: `THREE.ExtrudeGeometry` over outlines given as numbers
- Prompt or command: none; made on first use and shared by name. Each plate is two solids: the plate itself (`plate`, 0x7c8085, roughness 0.34, full metal, the brushing as its map, anisotropy 0.55) with a chamfer of 2.4 px in two facets, and under it a darker solid (`plateSide`, 0x35373a) that stands 3 px out and ends 3.4 px lower (`EDGE`). `crown()` leans the normals of the top face by a hair (`CROWN`), so the light fades across a plate
- Takes: 6 on the tone (0xb2b6ba, 0x6f7378, 0x62666c, 0x7b7f84, 0x898d92, 0x7c8085), 2 on the edge (one rounded chamfer 5.5 px wide, then the narrow chamfer over the dark step)
- Why this one: each piece reads as a thick cut plate: a bright line at the top edge, a dark side below it, a sheen that fades across the face. 0 MB beyond the brushing.
- Date: 2026-11-26

## wreck of the wings (built geometry)

- Made by: `wingParts()`, `cut()`, `poseFrame()` in `src/boss/real/body.ts`
- From: the wing's own outline, cut at one slanted line
- Prompt or command: none. A half holds the plate, its dark side, its screws and a dark bed; the bright lip round the cap is left out of a half. `HALF_TO` puts the two halves of a wing in one heap, one lying on the other
- Takes: 3 (whole wings; six pieces spread over the page; then two heaps of two)
- Why this one: with the two side plates the wreck shows four dark, thick plate pieces, as the approved image does. 0 MB.
- Date: 2026-11-26

## glass block of the shield (built geometry, one material, the careers page's picture)

- Made by: `shield()` in `src/boss/real/body.ts`, material `glass` in `bossKit()` of `src/boss/real/body-kit.ts`
- From: `slabGeometry`, `SLAB` and `glassOptions` of `src/pages/marketing/real/perk-cards.ts` and `glassPicture` of `src/pages/marketing/real/glass-picture.ts`, imported, not copied
- Prompt or command: `slabGeometry({ kind: 'box', w, h, r }, 22)` for the block, so the shade of the ground edge and the bend near the rim are the careers page's; the material is `glassOptions()` with a grey of its own (0x808c89), roughness 0.2, a full coat, 0.86 opaque, and the same picture laid at 2.4 texels to a page pixel (`blockPicture()`, a clone that shares the image)
- Takes: 5 (three of the earlier clear block with a pale band; the slab at 0x9aa5a3, too pale; then this one)
- Why this one: clear grey glass that darkens what is under it, with the edge's light and shade inside the slab and no milky rim. The picture is the careers page's 512 x 512 one: no new image; if the clone is uploaded a second time it costs 1.33 MB with its mip chain (UNKNOWN whether it is).
- Date: 2026-11-26

## ankle stems of the legs (built geometry)

- Made by: `leg()` in `src/boss/real/body.ts` (`ANKLE`, meshes `stem` and `ball`)
- From: the kit's `lathe`
- Prompt or command: none; a stem 52 px tall on each foot with the ball joint on its top
- Takes: 2
- Why this one: a leg leans about half as much from the light, so the lower pair no longer reads near black. 0 MB.
- Date: 2026-11-26

## halo and pool of the weapons (built geometry, no texture)

- Made by: `glow()` in `src/pages/step4/real/boss-weapons.ts` (`GLOW_RINGS`)
- From: nothing but numbers: rings of a fan with the light in the corners of their faces
- Prompt or command: `glow()`, shared by every spark, muzzle and dart
- Takes: 2 (step 1's 64 px halo picture stretched over up to 230 px, which failed measure M2; then this one)
- Why this one: a soft light with no picture to go soft. 0 MB.
- Date: 2026-11-26

## collar of the pit (material, no texture)

- Made by: `pitStuff()` in `src/boss/real/transform.ts`
- From: numbers only: 0x9a9c9c, roughness 0.6, metalness 0.55; the wall under it is now 0x7a746d
- Takes: 2
- Why this one: a satin ring that does not mirror the room, over a wall that reads as broken stone. 0 MB.
- Date: 2026-11-26
