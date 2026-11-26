# Recipes: the decision page, the fix round

No new picture file. One texture changed; it is made in code at start from `config.seed`, as before.

## stamp ink cover (alpha picture, in memory only), changed

- Made by: `ink()` in `src/pages/step5/real/stampInk.ts`, from `inkCover(1024, 256, config.seed + 5303)`
- From: the seed, and the fibre heights of the letter
- Prompt or command: none; built when the mark is first made. `npx vitest run tests/decision.test.ts` checks it
- Takes: under 0.3 s
- Why this one: the round 8 notes asked for more varied cover, flecks of bare paper and broken patches. Added to the old cover: slow patches where the rubber did not meet the sheet (a cloud of 58 px, cut high, broken by a cloud of 9 px), and flecks of bare paper (one cell of 4 px in about ninety, round, soft). The ink's colour is a little warmer (`0xbe2110`)
- Size: 1024 by 256 px, 1.33 MB (not changed)
- Date: 2026-11-26

## what is painted, not pictured

The rim, the lip shade, the blue-green of the panel's body and the band of reflection over one readout (`metrics.ts`), the underline of the link, and the shade under the letter are geometry with a strength at each corner. They hold no texture.
