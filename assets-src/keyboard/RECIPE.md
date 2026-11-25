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
- Takes: one. 256 x 256 px, RGBA 8 bit, 0.25 MB, 0.33 MB with its mipmaps. Grey, drawn additively in the flash colour.
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
- From: nothing. A ragged blot of black char with a pit in it, a crust that breaks into flecks, a brown singe that fades over a third of the radius and the faintest lit far wall, all from value noise.
- Prompt or command: none.
- Takes: five over the rounds (a dark blot with a brown ring; a bullet hole with a raised cream rim; a soft pit that read as a black dot; a blot whose singe was too dark to read as brown; this one). 256 x 256 px, RGBA 8 bit, sRGB, 0.25 MB, 0.33 MB with its mipmaps. Each scorch stretches it by its own name.
- Why this one: round 5 read the raised rim as a bright bronze ring. The approved marks are charred black with sooty edges and a brown burn that fades.
- Date: 2026-11-25

## Sheen of the deck

- Made by: `sheen(u, v, config.seed + 307)` in `src/pages/step1/real/keyboard-kit.ts`, written as a tone at every point of the deck's face by `deckGeometry` in `keyboard.ts` after `refine` has split the face until no edge is longer than 40 px.
- From: nothing. Soft upright bands of light, slow value noise across the brushing, a little lighter toward the upper left.
- Prompt or command: none.
- Takes: two. A colour picture of 512 x 256 px was made first and dropped: laid once over a deck of 1560 px it has a third of a texel a pixel and turned measure M2 red. Kept: no picture, 0 px, 0 MB.
- Why this one: the approved steel is not one tone. It has broad upright bands of light, and a flat tone reads as a painted slab.
- Date: 2026-11-25

## Halo

- Made by: `haloPicture()` in `src/pages/step1/real/turret-fx.ts`
- From: nothing. A round falloff, `exp(-r^2 / 0.09)`, that ends at the picture's edge.
- Prompt or command: none.
- Takes: one. 64 x 64 px, RGBA 8 bit, 0.016 MB, 0.02 MB with its mipmaps. Grey, drawn additively: the warm spot where a bolt struck and the glow of a hot muzzle.
- Why this one: the star picture drawn large over a struck cap hid its legend. A hit leaves a small round warmth and nothing with rays.
- Date: 2026-11-25

## Speckle of the cap plastic

- Made by: a clone of the shared grain, `materials().textures[0]`, in `kit()` of `src/pages/step1/real/keyboard-kit.ts`
- From: the shared grain of `src/shell/materials.ts` (owner /root/surface_mason).
- Prompt or command: none.
- Takes: none of its own. The clone shares the pixels of its source, so it adds no memory.
- Why this one: moulded plastic has a fine even speckle and the page already has one.
- Date: 2026-11-25

Total of the pictures of the keyboard and the turrets: 1.54 MB, 2.04 MB with mipmaps.
