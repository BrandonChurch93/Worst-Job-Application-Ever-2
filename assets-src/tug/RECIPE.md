# Recipes: the tug (paper, shredder, arms)

Every texture here is made in code at start, from `config.seed`. No file is downloaded, photographed or generated, and none holds a word. Megabytes are for the picture in memory with its smaller copies (width x height x 4 bytes x 4/3).

## paper fibre (colour, in memory only)

- Made by: `fibreMap(512, config.seed + 1907)` in `src/pages/step1/real/paperStock.ts`
- From: nothing but the seed, through `hash01` of `src/core/random.ts`
- Prompt or command: none; it is built when the first sheet is made. `npx vitest run tests/slabs-textures.test.ts` checks it
- Takes: under 0.1 s
- Why this one: short bent strands, pale and dark, over two faint clouds and a grain of 2%. It tiles. One tile is 54 page pixels (`STOCK.fibreTile`), 9.5 texels a page pixel, so on the 64 by 88 px sheet it holds at the close camera of the tug (4.2 screen pixels a page pixel at hd). It stays between 80% and 100% grey so the paper is never pure white
- Size: 512 by 512 px, 1.33 MB
- Date: 2026-11-25

## paper creases (normal picture, in memory only)

- Made by: `creaseMap(512, 704, config.seed + 1907, 220, 302.5, 5)` in `src/pages/step1/real/paperStock.ts`
- From: the folds of `creaseExact` in `paperSolve.ts`, the same folds the grid of the sheet is bent by. The folds are solved at the drawn size (220 px wide) and the sheet is that shape at 64 / 220 of the size
- Prompt or command: none; built with the first sheet
- Takes: about 0.2 s
- Why this one: the grid of the sheet cannot hold a sharp ridge; this picture holds the ridges of the same folds, so shading and shape agree. Its strength follows how hard the sheet has been used (`normalScale` 0.04 to 0.16), so the sheet at rest is clean stock
- Size: 512 by 704 px, 1.83 MB
- Date: 2026-11-25

## housing brushing (roughness picture, in memory only)

- Made by: `brushing()` in `src/pages/step1/real/shredder.ts`
- From: the seed, through `hash01`
- Prompt or command: none
- Takes: under 0.1 s
- Why this one: lines along the length of the cassette, one row of the picture is one brush line, so the highlight is drawn out across the brushing as on a machined face
- Size: 256 by 256 px, 0.33 MB
- Date: 2026-11-25

## rubber grain of the arms (normal picture, in memory only)

- Made by: `grainNormalMap(64, config.seed + 7, 1.6)` of `src/shell/materials.ts`, called from `parts()` in `src/cursor/act/arms.ts`
- From: the seed
- Prompt or command: none
- Takes: under 0.05 s
- Why this one: moulded matte rubber is never smooth; a fine grain breaks the sheen along the tube and over the mitt so the black holds a shape under the key light and never reads as a drawn line. It repeats 2 by 5 along an arm
- Size: 64 by 64 px, 0.02 MB
- Date: 2026-11-25

Total: 3.51 MB.
