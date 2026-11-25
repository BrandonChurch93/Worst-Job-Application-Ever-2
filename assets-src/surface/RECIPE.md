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
From: the seed, through `Random(seed, 'grain')` of `src/core/random.ts`. One number a texel, blurred with a blur that wraps, so the picture tiles. Three bands are kept, each the difference of two blurs so no slow lumps are left: 0.8 less 1.8 texels (the speckle), 2.4 less 6 texels (the soft swell) and 0.4 less 0.9 texels (the tooth, laid in at `TOOTH` 0.07). Only the low places of the speckle, below 0.7 of its spread (`PIT_FROM`), are kept as pits (`PIT_DEPTH` 1); the rest of it is laid in at a fifth. That is what reads as eggshell and not as sand or leather.
Prompt or command: `makeMaterials(config.seed)`; in the shader the picture is read twice, the second time turned 37 degrees and 1.118 times finer, so no repeat shows across a page. Two texels are one page pixel (`GRAIN_PER_PIXEL` 2), so a repeat is 512 page pixels and the picture is never drawn larger than it is, also in the 3840 wide master. When the camera comes nearer than the page's own size the relief falls with the closeness (to the power `CLOSE_FALL` 2.8) and only the finest part of the picture is left as a tooth (`CLOSE_TOOTH` 0.9, easing to `CLOSE_EASE` 0.6 of that by three times): the picture less its own blurred copy, read with a mip bias of 2.
Takes: 290 ms on this machine (MEASURED once under vitest with two bands, 4 cores at 2.9 GHz; with the third band UNKNOWN, not measured again).
Why this one: the approved image has a speckle of 2 to 4 pixels with no direction and no bright spot: small separate pits on a nearly flat face. Slopes alone looked painted on, so the height in alpha also moves the roughness: pits are a little more matt. At one texel a page pixel the grain was soft in the master and in every close view; at two the same picture stays sharp, and the tooth band is what a close view lands on. MEASURED on a clean patch at review tier with one texel a pixel, spread of the grey after taking off a 6 pixel blur: approved 6.4, that build 5.8.
Date: 2026-11-25

Fix round, 2026-11-25: for the page the pits are laid at `PAGE_PITS` 0.16 and the soft swell at `PAGE_COARSE` 0.07 (they were 0.45 and 0.2), the strength on the ceramic is `PAGE_GRAIN` 0.04, and up close the fine readings carry `CLOSE_TOOTH` 2.85. Why: the critics read the coarser grain as stucco; the approved page has a tooth one to two pixels wide and no lumps. Size and megabytes are unchanged.

Round 5, 2026-11-25: the soft swell is `PAGE_COARSE` 0.03 and the tone mottle `MOTTLE` 0.015; at home the shader reads the picture a third time, 0.6 times as fine, at `HOME_TOOTH` 2; `CLOSE_TOOTH` 3.1 holds between 2.9 and 3.25 times closer than home and `SHEET_TOOTH` 0.4 holds elsewhere up close. Why: the critics read the page as cool, cloudy at home and coarse on the close sheets; MEASURED spread of a clean patch, home 6.23 against the approved 6.54, cursor sheet 2.49 against 2.95. Size and megabytes are unchanged.

## frost (the grain picture again, no memory of its own)
Made by: `grain.clone()` in `makeMaterials`, `src/shell/materials.ts`. It shares the grain's picture on the card, so it adds nothing to the megabytes.
From: the grain picture above.
Prompt or command: laid at 5 repeats in 1024 page pixels with a strength of `FROST` 0.022 on `glass`, `glassThick` and `glassSunk`. `glassCard` has its own readings, see the slab below.
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

## slab of the glass card (no picture of its own, no memory of its own)
Made by: `slabbed(material, grain, brushed, key)` in `src/shell/materials.ts`, on `glassCard`; the place of each point on its card is laid into the geometry by `placed()` in `src/shell/real/controls.ts`.
From: the grain picture (1024 by 1024, 4.00 MB) and the brushed picture (512 by 512, 1.00 MB) above, read again. Nothing is added to the megabytes.
Prompt or command: `makeMaterials(config.seed)`. The grain is read five times: under the slab at the page's own two texels a page pixel, shifted 26 px along the slope of the face (the page's tooth, bent at the bevel); twice far larger and blurred (the cloud, 3 percent of the colour); at 3.0 and at 2.3 texels a page pixel, turned 35 degrees (the frost, strength 0.034, less at home than up close). The brushed picture is read once, turned 20 degrees, at strength 0.007 (hairline polishing marks). Bright points are where the height of one fine reading stands 0.3 over the other.
Takes: nothing to make.
Why this one: the card of the third round read as an opaque grey panel with sandpaper on it. Glass that is frosted shows three things at once: what lies under it, softened; its own slow unevenness; and a tooth too fine to pick out at home. The first frost, at 7.1 texels a page pixel, was lost in the 8 samples a pixel of the review tier (M3 0.56); at 2.3 alone it read as pebbled bathroom glass (M3 0.79); at 3.0 with a little of 2.3 it is fine and holds (M3 0.885).
Date: 2026-11-25
Later the same day: in a close view the bright points are faded out and the slopes lowered, and the page's fine reading (4 texels a page pixel, less its own blurred copy) is laid on the matt light at 0.19. Why: slopes under a low key sparkle in the coat and read as grit; a tooth in the matt light reads as satin. M3 0.851.
After round 4: the slab's shade follows the approved card as measured patch by patch: a pool of light from the upper left (0.15 across, 0.22 up the light's half), the band toward the light darker down the side and along the top to the right, the far bands held light, a glow inside the far side (0.6 over 18 px), a bright line on the outer 2 px, round-cornered shade inside the dashed line. Slow cloud 0.014, tooth 0.235. No picture added or changed.
