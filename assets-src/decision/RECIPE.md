# Recipes: the decision page (wait, letter, stamp, metrics)

Every texture here is made in code at start, from `config.seed`. No file is downloaded, photographed or generated, and none holds a word. Megabytes are for the picture in memory with its smaller copies (width x height x 4 bytes x 4/3).

## letter fibre (colour, in memory only)

- Made by: `stock()` in `src/pages/step5/real/letterStock.ts`, from `fibreHeights(512, config.seed + 5101)`
- From: nothing but the seed, through `hash01` of `src/core/random.ts`
- Prompt or command: none; it is built when the letter is first made. `npx vitest run tests/decision.test.ts` checks it
- Takes: under 0.2 s
- Why this one: about 4200 short bent strands, pale and dark, over three faint clouds and a fine grain. It tiles, one tile is 256 page pixels (2 texels a page pixel at the home camera), and it stays between 84% and 99.2% so the paper is never pure white
- Size: 512 by 512 px, 1.33 MB
- Date: 2026-11-26

## letter tooth (normal picture, in memory only)

- Made by: `stock()` in `src/pages/step5/real/letterStock.ts`, the slopes of the same `fibreHeights`
- From: the seed
- Prompt or command: none; built with the fibre
- Takes: under 0.1 s
- Why this one: the strands that tint the sheet also tip its surface, so the light breaks on the same fibres the colour shows
- Size: 512 by 512 px, 1.33 MB
- Date: 2026-11-26

## stamp ink cover (alpha picture, in memory only)

- Made by: `ink()` in `src/pages/step5/real/stampInk.ts`, from `inkCover(1024, 256, config.seed + 5303)`
- From: the seed, and the fibre heights of the letter, so the ink misses the hollows of the same kind of stock
- Prompt or command: none; built when the mark is first made
- Takes: under 0.2 s
- Why this one: a rubber stamp never prints flat. The cover falls where the block rocked off the sheet (lower left, upper right), in slow clouds of pressure, in the paper's hollows and in pin holes. It lies once over the whole mark and does not tile, 2 texels a page pixel. The word and the border are geometry cut from the font and the layout: the picture holds no letter
- Size: 1024 by 256 px, 1.33 MB
- Date: 2026-11-26
