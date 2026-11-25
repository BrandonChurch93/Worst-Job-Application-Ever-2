# Surface: how each texture is made

Nothing here is a file. Every texture of the surface is computed when the page starts, from the seed in `config/` (20261124), by code in `src/shell/materials.ts`. There is no downloaded file, no photo and no generated picture. The same seed gives the same texels on every machine: `tests/surface.test.ts` holds that.

Sizes are of the texture in memory, 4 bytes a texel. The smaller copies the card makes for distance add a third.

| Texture | What it is | Pixels | Megabytes | With smaller copies |
| --- | --- | --- | --- | --- |
| grain | eggshell grain of the ceramic: slopes in red, green, blue; height in alpha | 1024 by 1024 | 4.00 | 5.33 |
| brushed | straight brushing of the aluminium, as slopes | 512 by 512 | 1.00 | 1.33 |
| turned normal | circular brushing of a turned face, as slopes | 256 by 256 | 0.25 | 0.33 |
| turned direction | the direction of that brushing at each point, for the stretched highlight | 256 by 256 | 0.25 | 0.33 |
| total | | | 5.50 | 7.33 |

MEASURED: `npx vitest run tests/surface.test.ts` (the test "holds four pictures made from the seed") gives 5,767,168 bytes, which is 5.50 megabytes.

## grain (1024 by 1024, RGBA, 4.00 MB)
Made by: `grainHeights(size, seed)` and `grainNormalMap(size, seed, strength)` in `src/shell/materials.ts`.
From: the seed, through `Random(seed, 'grain')` of `src/core/random.ts`. One number a texel, blurred with a blur that wraps, so the picture tiles. Three bands are kept, each the difference of two blurs so no slow lumps are left: 0.8 less 1.8 texels (the speckle), 2.4 less 6 texels (the soft swell) and 0.4 less 0.9 texels (the tooth, laid in at `TOOTH` 0.07). Only the low places of the speckle, below 0.7 of its spread (`PIT_FROM`), are kept at full depth as pits; the rest of it is laid in at a fifth. That is what reads as eggshell and not as sand or leather.
Prompt or command: `makeMaterials(config.seed)`; in the shader the picture is read twice, the second time turned 37 degrees and 1.118 times finer, so no repeat shows across a page. Two texels are one page pixel (`GRAIN_PER_PIXEL` 2), so a repeat is 512 page pixels and the picture is never drawn larger than it is, also in the 3840 wide master. When the camera comes nearer than the page's own size the relief falls with the closeness (to the power `CLOSE_FALL` 2.8) and only the finest part of the picture is left as a tooth (`CLOSE_TOOTH` 0.9, easing to `CLOSE_EASE` 0.6 of that by three times): the picture less its own blurred copy, read with a mip bias of 2.
Takes: 290 ms on this machine (MEASURED once under vitest with two bands, 4 cores at 2.9 GHz; with the third band UNKNOWN, not measured again).
Why this one: the approved image has a speckle of 2 to 4 pixels with no direction and no bright spot: small separate pits on a nearly flat face. Slopes alone looked painted on, so the height in alpha also moves the roughness: pits are a little more matt. At one texel a page pixel the grain was soft in the master and in every close view; at two the same picture stays sharp, and the tooth band is what a close view lands on. MEASURED on a clean patch at review tier with one texel a pixel, spread of the grey after taking off a 6 pixel blur: approved 6.4, that build 5.8.
Date: 2026-11-25

## frost (the grain picture again, no memory of its own)
Made by: `grain.clone()` in `makeMaterials`, `src/shell/materials.ts`. It shares the grain's picture on the card, so it adds nothing to the megabytes.
From: the grain picture above.
Prompt or command: laid at 5 repeats in 1024 page pixels with a strength of `FROST` 0.022 on `glass`, `glassThick` and `glassSunk`.
Takes: nothing to make.
Why this one: glass with no slopes at all read as plastic sheet at full size. At this strength no grain can be picked out, the sheen only loses its last hard edge. The first try, coarser and stronger, read as orange peel.
Date: 2026-11-25

## brushed (512 by 512, RGBA, 1.00 MB)
Made by: `brushedHeights(size, seed)` in `src/shell/materials.ts`, turned to slopes by `normalsOf`.
From: the seed, through `Random(seed, 'brushed')`. Each row is one line of brushing: a level of its own and a slow wander along its length, then 14 stray scratches that drift a little off the direction.
Prompt or command: `makeMaterials(config.seed)`; laid at 720 by 420 page pixels a repeat. The material also stretches its highlight across the lines (`anisotropy` 0.72).
Takes: 16 ms (MEASURED, same run).
Why this one: the approved rail and bezels show one broad band of light with fine lines inside it and a few strays. Lines without the stretch gave stripes; the stretch without lines gave satin.
Date: 2026-11-25

## turned normal and turned direction (256 by 256 each, RGBA, 0.25 MB each)
Made by: `turnedMaps(size, seed, strength)` in `src/shell/materials.ts`.
From: the seed, through `Random(seed, 'turned')`: one height for each ring round the centre, smoothed once. The second picture holds the direction of the ring at each texel.
Prompt or command: `makeMaterials(config.seed)`; laid once across the face of a progress button (the face carries coordinates from 0 to 1).
Takes: under 20 ms for the pair (MEASURED as part of `makeMaterials`, 356 ms in all, of which the grain is 290).
Why this one: the approved progress buttons show a bow-tie of light that turns with the face. That needs the highlight stretched along rings, which a straight brushing cannot give. The material reads the room nine times along the ring's direction (`stretched` in `materials.ts`), because the stock stretch only shows on a face seen from the side.
Date: 2026-11-25
