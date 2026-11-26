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
- Prompt or command: two `MeshPhysicalMaterial` through `studio()`: wall `0x3f3c39`, roughness 0.96, grain at 0.7; floor `0x0d0c0c`, roughness 0.95
- Takes: 2 (a wall at `0x55514c` with grain at 1.6, which striped; then this one)
- Why this one: the hole reads as a broken pit with a rough sloped wall down to 58 px and a floor that is near black but not black. 0 MB.
- Date: 2026-11-26

## smoke ring of the muzzle (built geometry, no texture)

- Made by: `ringGeometry()` in `src/pages/step4/real/boss-weapons.ts`
- From: nothing but numbers: 48 parts round, four rings of radius, `hash01` for the thin places
- Prompt or command: `ringGeometry()`, one geometry shared by every flash, each with its own plain material so each can fade alone
- Takes: 2 (a ring 1.8 px above the muzzle, hidden by the slab that leaves through it; then this one 34 px up)
- Why this one: a flat grey ring seen nearly edge on that widens from 24 to 60 px, runs 44 px ahead of the mouth and fades with the flash. 192 triangles, 0 MB of texture.
- Date: 2026-11-26

## glass block of the shield, broken wings, cast plate (built geometry and materials, no texture)

- Made by: `shield()`, `wingParts()`, `cut()` in `src/boss/real/body.ts`; `bossKit()` in `src/boss/real/body-kit.ts`
- From: the shared solids of `src/shell/solids.ts` (`sweep`, `roundedRect`, `plateProfile`) and `cutPlate` of the kit
- Prompt or command: none; made on first use and shared by name
- Takes: 4 on the plate (brushed at 0.2, brushed at 0.05, then no brushing at all), 3 on the glass, 2 on the wings
- Why this one: the plate is cast metal with no brush lines; the shield is a block 22 px thick with a bright bevel band and a darker floor; each wing snaps at one slanted line into two thick pieces at the moment the body splits. 0 MB.
- Date: 2026-11-26
