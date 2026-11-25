# Cursor model: recipes

Nothing here is a file on disk. The cursor's one texture is made in the browser when the first cursor is built, from the seed in the config. No downloaded file, no photograph, no generated picture, no picture with a word in it.

## cursor detail texture (made at run time, never written to disk)
Made by: `detailData(size, seed)` and `detailTexture()` in `src/cursor/model/texture.ts`, with `hash01` from `src/core/random.ts`
From: `config/showcase.json` (`seed`); no input picture
Prompt or command: `detailTexture()` on first use; the bytes alone: `detailData(512, config.seed)`. The test `the cursor detail texture` in `tests/cursor-model.test.ts` checks that the same seed gives the same bytes
Takes: 1 made, 1 kept
Why this one: one 512 by 512 picture carries all the body and the effects need, so a cursor costs one texture: green and blue are two tiling fields of soft cloud (the grain of stone, the ragged front of char and heat, the blisters of a crust, the breaking up of steam, smoke and dust). Red (how far a point lies from the nearest crack of a tiling web of plates) and alpha (one number for each plate) are still made but no longer read: the cracks of a flattened body are worked out in the shader, since the texture's cracks broke into dashes at page size
Date: 2026-11-25

Size: 512 by 512 pixels, four channels of 8 bits, 1.00 MB, 1.33 MB with its smaller copies. It tiles in both directions. It is shared by every cursor on the page.
