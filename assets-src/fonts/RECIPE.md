# Fonts

## public/fonts/inter-400.json, inter-500.json, inter-600.json, inter-display-600.json, inter-display-800.json
Made by: `pipeline/fonts/bake_fonts.py`, with Python 3, fonttools 4.68.0 and uharfbuzz 0.57.0
From: the official Inter 4.1 release archive, https://github.com/rsms/inter/releases/download/v4.1/Inter-4.1.zip , sha256 `9883fdd4a49d4fb66bd8177ba6625ef9a64aa45899767dde3d36aa425756b11e`. The script downloads it into `references/cache/fonts/`, which git ignores, and checks the hash before it reads a byte
Prompt or command: `python3 pipeline/fonts/bake_fonts.py`
Takes: one
Why this one: Inter is the plain, even, modern sans of the approved page images, and its numerals hold at the size of a field label
Date: 2026-11-25

## public/fonts/playfair-700.json, playfair-900.json
Made by: `pipeline/fonts/bake_fonts.py`, with Python 3, fonttools 4.68.0 and uharfbuzz 0.57.0
From: `node_modules/@fontsource/playfair-display/files/` of the pinned package `@fontsource/playfair-display` 5.3.0, the latin files of weights 700 and 900
Prompt or command: `python3 pipeline/fonts/bake_fonts.py`
Takes: one
Why this one: the printed words of the approved machine images are a serif with strong thick and thin strokes, and this family has the weight for a backlit sign
Date: 2026-11-25

## What a baked file holds
`family`, `style`, `weight`, `unitsPerEm`, `ascender`, `descender`, `lineGap`, `capHeight`, `xHeight`, `source`, `licence`, then `glyphs`, one entry per character code with its advance `a` and its outline `p`, and `kern`, for each left character a flat list of right character and adjustment.
An outline is a flat list of numbers in font units with y up: `0 x y` moves, `1 x y` draws a line, `2 cx cy x y` a quadratic curve, `3 c1x c1y c2x c2y x y` a cubic curve, `4` closes the contour.
The site makes every word from these outlines as geometry. No word is ever a picture.
