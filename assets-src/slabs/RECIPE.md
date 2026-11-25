# Recipes: slabs, paper, shredder

Every texture here is made in code at start, from `config.seed`. No file is downloaded, photographed or generated, and none holds a word. Megabytes are for the picture in memory with its smaller copies (width x height x 4 bytes x 4/3).

## paper fibre (colour, in memory only)

- Made by: `fibreMap(512, config.seed + 1907)` in `src/pages/step1/real/paperStock.ts`
- From: nothing but the seed, through `hash01` of `src/core/random.ts`
- Prompt or command: none; it is built when the first sheet is made. `npx vitest run tests/slabs-textures.test.ts` checks it
- Takes: under 0.1 s
- Why this one: about 3100 short bent strands, pale and dark, over two faint clouds and a grain of 2%. It tiles, one tile is 108 page pixels (4.7 texels a page pixel, so it holds at the close camera of the tug), and it stays between 80% and 100% grey so the paper is never pure white
- Size: 512 by 512 px, 1.33 MB
- Date: 2026-11-25

## paper creases (normal picture, in memory only)

- Made by: `creaseMap(512, 704, config.seed + 1907, 220, 300, 5)` in `src/pages/step1/real/paperStock.ts`
- From: the 22 folds of `creaseExact` in `paperSolve.ts`, the same folds the grid of the sheet is bent by
- Prompt or command: none; built with the first sheet
- Takes: about 0.2 s
- Why this one: the grid of 35 by 51 points cannot hold a sharp ridge; this picture holds the ridges of the same folds, so shading and shape agree. Its strength follows how hard the sheet has been used
- Size: 512 by 704 px, 1.83 MB
- Date: 2026-11-25

## slab grain (clearcoat normal picture, in memory only)

- Made by: `grainNormalMap(256, config.seed + 71, 1.6)` of `src/shell/materials.ts`, called from `red()` in `src/pages/step1/real/slabs.ts`
- From: the seed
- Prompt or command: none
- Takes: under 0.1 s
- Why this one: a moulded block is never optically flat; a breath of orange peel in the coat breaks the reflection of the lights. It goes away when the shared set brings its own red
- Size: 256 by 256 px, 0.33 MB
- Date: 2026-11-25

## housing brushing (roughness picture, in memory only)

- Made by: `brushing()` in `src/pages/step1/real/shredder.ts`
- From: the seed, through `hash01`
- Prompt or command: none
- Takes: under 0.1 s
- Why this one: lines along the length of the cassette, one row of the picture is one brush line, so the highlight is drawn out across the brushing as on a machined face
- Size: 256 by 256 px, 0.33 MB
- Date: 2026-11-25

Total: 3.82 MB.
