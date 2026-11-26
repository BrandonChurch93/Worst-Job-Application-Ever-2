# Careers page, fix round: textures

No file is stored. Every texture below is computed in code from the seed when the page first shows it.

## glass picture (512 by 512 px, RGBA, 1.0 MB, 1.4 MB with its smaller copies)
- Made by: `glassPicture()` in `src/pages/marketing/real/glass-picture.ts`
- From: numbers only (`PICTURE`), `Random(config.seed, 'glass-picture')`
- Prompt or command: `glassHeights(seed)` lays three layers on a tiling grid: soft clouds 60 to 130 px across, blotches 20 to 40 px across, and a grain of one pixel; `glassPicture()` writes them as one grey level round `PICTURE.level`, one texel to one page pixel, repeating
- Takes: 3 sets of amounts; the third is kept (cloud 0.02, blotch 0.01, grain 0.011)
- Why this one: the approved card's face is smooth with soft blotches, and it is what of the page shows through frosted glass; a stronger cloud read as dirt at 3 times
- Date: 2026-11-26

## brushed picture (512 by 512 px, RGBA, 1.0 MB, 1.4 MB with its smaller copies)
- Made by: `brushedPicture()` in `src/pages/marketing/real/medal-picture.ts`
- From: numbers only (`BRUSHED`), `Random(config.seed, 'medal-picture')`
- Prompt or command: `brushedHeights(seed)` gives every ring one pixel wide round the middle its own brightness, adds a fine grain, and lays 2600 arcs of 0.05 to 0.3 of a turn over them, half of them bright and half dark; `brushedPicture()` writes it as one grey level round `BRUSHED.level`, once across the medal's face
- Takes: 6 sets of amounts; the sixth is kept (rings 0.05, arcs 2600 at 0.3, grain 0.03)
- Why this one: the approved medal's brushing is seen stroke by stroke at native size; more and shorter arcs read as noise, two pixel rings as a record's grooves
- Date: 2026-11-26
