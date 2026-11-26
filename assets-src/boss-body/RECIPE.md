# Recipes of boss-body and boss-transform

Both textures are made in code when the page first needs them. No file is stored.

## soot (data texture, 512 x 128, RGBA)

- Made by: `sootPixels()` in `src/boss/real/transform.ts`
- From: nothing but numbers: `hash01` of `src/core/random.ts`, blended between grid points at three sizes, and one sine along the short side of the cap
- Prompt or command: `sootPixels(512, 128)`, wrapped in a `THREE.DataTexture` by `soot()` in the same file and laid over the cap as a skin of the cap's own geometry
- Takes: 3 (a round blot on a flat disc, then a 256 x 64 skin whose noise showed as squares, then this one)
- Why this one: black and closed at both ends where the cap burned, a ragged edge about a fifth of the way in, flecks beyond it and clean orange in the middle, as in `boss-down.png`. 512 x 128 x 4 bytes = 0.25 MB, 0.33 MB with its mip chain.
- Date: 2026-11-26

## puff (data texture, 64 x 64, RGBA, used as an alpha map)

- Made by: `puffPixels()` in `src/boss/real/transform.ts`
- From: nothing but numbers: `hash01` blended between grid points at two sizes, closed on itself from top to bottom
- Prompt or command: `puffPixels(64)`, wrapped in a `THREE.DataTexture` by `smoke()` in the same file
- Takes: 2 (a round soft dot for smoke made of balls, which read as a chain of discs, then this one)
- Why this one: each wisp is one ribbon that fades at its sides and its top; the streaks slide up along it with `ctx.time` so the smoke rises without a single ball. 64 x 64 x 4 bytes = 0.0156 MB, 0.021 MB with its mip chain.
- Date: 2026-11-26
