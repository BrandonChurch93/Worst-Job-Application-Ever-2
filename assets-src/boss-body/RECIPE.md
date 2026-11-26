# Recipes of boss-body and boss-transform

Both textures are made in code when the page first needs them. No file is stored.

## soot (data texture, 128 x 128, RGBA)

- Made by: `sootPixels()` in `src/boss/real/transform.ts`
- From: nothing but numbers: `hash01` of `src/core/random.ts` and sines of the angle round the centre
- Prompt or command: `sootPixels(128)`, wrapped in a `THREE.DataTexture` by `soot()` in the same file
- Takes: 1
- Why this one: a ragged blot, dense in the middle and broken toward its rim, reads as soot on plastic from straight above. 128 x 128 x 4 bytes = 0.0625 MB, 0.083 MB with its mip chain.
- Date: 2026-11-26

## puff (data texture, 64 x 64, RGBA, used as an alpha map)

- Made by: `puffPixels()` in `src/boss/real/transform.ts`
- From: nothing but numbers: distance from the centre and `hash01`
- Prompt or command: `puffPixels(64)`, wrapped in a `THREE.DataTexture` by `smoke()` in the same file
- Takes: 1
- Why this one: the smoke is balls, and a ball seen from above needs a soft edge. 64 x 64 x 4 bytes = 0.0156 MB, 0.021 MB with its mip chain.
- Date: 2026-11-26
