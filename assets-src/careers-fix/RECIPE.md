# Careers page, fix round: textures

No file is stored. Every texture below is computed in code from the seed when the page first shows it.

## glass picture (1024 by 1024 px, RGBA, 4.0 MB, 5.3 MB with its smaller copies)
- Made by: `glassPicture()` in `src/pages/marketing/real/glass-picture.ts`
- From: numbers only (`PICTURE`), `Random(config.seed, 'glass-picture')`
- Prompt or command: `glassHeights(seed)` lays three layers on a tiling grid: soft clouds 50 to 110 px across, blotches 16 to 33 px across, and a grain of about one page pixel; `glassPicture()` writes them as one grey level round `PICTURE.level`, `PICTURE.lay` (2.4) texels to one page pixel, repeating every 427 page pixels
- Takes: 4 sets of amounts; the fourth is kept (cloud 0.012, blotch 0.008, grain 0.011, 2.4 texels to a page pixel)
- Why this one: the approved card's face is smooth with soft blotches, and it is what of the page shows through frosted glass; a stronger cloud read as dirt at 3 times. The fourth take is the third laid finer: at one texel to a page pixel the measure M2 counted 14 to 42 hundredths of the textured pixels as soft, at 2.4 it counts 0.0001
- Date: 2026-11-26

## brushed picture (1024 by 1024 px, RGBA, 4.0 MB, 5.3 MB with its smaller copies)
- Made by: `brushedPicture()` in `src/pages/marketing/real/medal-picture.ts`
- From: numbers only (`BRUSHED`), `Random(config.seed, 'medal-picture')`
- Prompt or command: `brushedHeights(seed)` gives every ring 2.7 texels wide round the middle its own brightness, adds a fine grain, and lays 900 strokes over them, each 2 texels wide and 38 to 300 texels long, round a middle that strays up to 190 texels from the disc's own, so that they cross; a bright stroke is twice as strong as a dark one; `brushedPicture()` writes it as one grey level round `BRUSHED.level`, once across the whole medal, rim and face, which is 2.7 texels to a page pixel on a medal 380 px wide
- Takes: 11 sets of amounts; the eleventh is kept (rings 0.045, 900 strokes at 0.15, dark strokes at 0.45 of that, grain 0.05)
- Why this one: the approved medal's brushing is seen stroke by stroke at native size, and its strokes cross; strokes that are all round one middle read as a record's grooves, 9000 of them read as noise and took the type under them below the contrast M4 asks (3.66 against 4.5), dark strokes as strong as the bright ones did the same (4.36)
- Date: 2026-11-26
