# Recipes: keyboard and turrets

Every picture here is made in code when the page starts. No file is downloaded and none is stored in the repository.

## Brushed metal normal picture

- Made by: `brushedNormalMap(512, config.seed + 301, 1.6)` in `src/pages/step1/real/keyboard-kit.ts`
- From: nothing. Four layers of straight lines along x, each row with its own values from `hash01` of `src/core/random.ts`, turned into a normal picture that tiles.
- Prompt or command: none. It is built by `kit()` on first use.
- Takes: one. 512 x 512 px, RGBA 8 bit, 1.0 MB, 1.33 MB with its mipmaps. Used by the deck, the hatch lids and every turned part.
- Why this one: the grain has to run along the length of the deck and stay sharp under the highlight band, and one picture serves the flat plate (1024 px a tile along the grain, 256 across) and the turned parts (round the axis).
- Date: 2026-11-25

## Muzzle flash star

- Made by: `starPicture(config.seed + 401)` in `src/pages/step1/real/turret-fx.ts`
- From: nothing. A hot core, nine thin rays of unequal length and direction from `hash01`, a faint haze.
- Prompt or command: none. It is built by `fx()` on first use.
- Takes: one. 128 x 128 px, RGBA 8 bit, 0.06 MB, 0.08 MB with its mipmaps. Grey, drawn additively in the flash colour.
- Why this one: the approved flash is a star of thin unequal rays and not a round glow. The glow round it is left to the post chain.
- Date: 2026-11-25

## Puff of steam or smoke

- Made by: `puffPicture(config.seed + 402)` in `src/pages/step1/real/turret-fx.ts`
- From: nothing. A soft disc with a ragged edge from two layers of value noise. The shape is in the green channel, which is what an alpha picture reads.
- Prompt or command: none.
- Takes: one. 64 x 64 px, RGBA 8 bit, 0.016 MB, 0.02 MB with its mipmaps. Used by the steam of an overheated turret and the smoke of a scorch.
- Why this one: a puff is always soft and always small in the frame, so 64 px is enough, and one picture turned and scaled by a seed gives puffs that differ.
- Date: 2026-11-25

## Scorch mark

- Made by: `scorchPicture(config.seed + 403)` in `src/pages/step1/real/turret-fx.ts`
- From: nothing. A charred middle with a ragged edge, a brown ring that thins out, a few specks, all from value noise.
- Prompt or command: none.
- Takes: one. 128 x 128 px, RGBA 8 bit, sRGB, 0.06 MB, 0.08 MB with its mipmaps. Each scorch turns and stretches it by its own name.
- Why this one: the approved scorch is irregular and has a brown ring. A plain dark disc reads as a sticker.
- Date: 2026-11-25

## Speckle of the cap plastic

- Made by: a clone of the shared grain, `materials().textures[0]`, in `kit()` of `src/pages/step1/real/keyboard-kit.ts`
- From: the shared grain of `src/shell/materials.ts` (owner /root/surface_mason).
- Prompt or command: none.
- Takes: none of its own. The clone shares the pixels of its source, so it adds no memory.
- Why this one: moulded plastic has a fine even speckle and the page already has one.
- Date: 2026-11-25

Total of my own pictures: 1.14 MB, 1.52 MB with mipmaps.
