# Careers page, fix round: textures

No file is stored. Every texture below is computed in code from the seed when the page first shows it.

## glass picture (512 by 512 px, RGBA, 1.0 MB, 1.4 MB with its smaller copies)
- Made by: `glassPicture()` in `src/pages/marketing/real/glass-picture.ts`
- From: numbers only (`PICTURE`), `Random(config.seed, 'glass-picture')`
- Prompt or command: `glassHeights(seed)` lays three layers on a tiling grid: soft clouds 60 to 130 px across, blotches 20 to 40 px across, and a grain of one pixel; `glassPicture()` writes them as one grey level round `PICTURE.level`, one texel to one page pixel, repeating
- Takes: 3 sets of amounts; the third is kept (cloud 0.02, blotch 0.01, grain 0.011)
- Why this one: the approved card's face is smooth with soft blotches, and it is what of the page shows through frosted glass; a stronger cloud read as dirt at 3 times
- Date: 2026-11-26
