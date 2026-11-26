# Recipes of boss-body and boss-transform

Both textures are made in code when the page first needs them. No file is stored.

## soot (data texture, 512 x 128, RGBA)

- Made by: `sootPixels()` in `src/boss/real/transform.ts`
- From: nothing but numbers: `hash01` of `src/core/random.ts`, blended between grid points at three sizes, and one sine along the short side of the cap
- Prompt or command: `sootPixels(512, 128)`, wrapped in a `THREE.DataTexture` by `soot()` in the same file and laid over the cap as a skin of the cap's own geometry
- Takes: 5 (a round blot on a flat disc, then a 256 x 64 skin whose noise showed as squares, then a 512 x 128 skin with soft flecks that read as rust, then four burnt holes of which one sat on the word, then this one)
- Why this one: black and closed at both ends where the cap burned, a ragged edge about a fifth of the way in, hard black flecks within 26 px of it, three burnt holes with grey ash at their rims outside the word, and clean orange in the middle, as in `boss-down.png`. It shows only once `hurt` passes 0.8. 512 x 128 x 4 bytes = 0.25 MB, 0.33 MB with its mip chain.
- Date: 2026-11-26

## puff (data texture, 64 x 64, RGBA, used as an alpha map)

- Made by: `puffPixels()` in `src/boss/real/transform.ts`
- From: nothing but numbers: `hash01` blended between grid points at two sizes, closed on itself from top to bottom
- Prompt or command: `puffPixels(64)`, wrapped in a `THREE.DataTexture` by `smoke()` in the same file
- Takes: 3 (a round soft dot for smoke made of balls, which read as a chain of discs, then streaks from 20 to 240 that broke the wisp into dashes, then this one from 95 to 255)
- Why this one: each wisp is one ribbon that fades at its sides and its top; the streaks slide up along it with `ctx.time` so the smoke rises without a single ball. 64 x 64 x 4 bytes = 0.0156 MB, 0.021 MB with its mip chain.
- Date: 2026-11-26
