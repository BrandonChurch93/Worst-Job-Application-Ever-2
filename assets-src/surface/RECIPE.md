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
From: the seed, through `Random(seed, 'grain')` of `src/core/random.ts`. One number a texel, blurred three ways with a blur that wraps, so the picture tiles: 0.55 texels (the speckle), 1.1 texels (the pits) and 4 texels (the slow swell). The low side of the speckle is pressed down and the high side flattened, which is what reads as eggshell and not as sand.
Prompt or command: `makeMaterials(config.seed)`; in the shader the picture is read twice, the second time turned 37 degrees and 1.118 times finer, so no repeat shows across a page. One texel is one page pixel.
Takes: 290 ms on this machine (MEASURED, one run under vitest, 4 cores at 2.9 GHz).
Why this one: the approved image has a speckle of 2 to 4 pixels with no direction and no bright spot. Slopes alone looked painted on, so the height in alpha also moves the roughness: pits are a little more matt.
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
Why this one: the approved progress buttons show a bow-tie of light that turns with the face. That needs the highlight stretched along rings, which a straight brushing cannot give.
Date: 2026-11-25
