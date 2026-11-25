# Type

The part `type` ships no picture and no built file. Every word is geometry made at run time from the font outlines that `assets-src/fonts/RECIPE.md` already covers.

## Textures of the part `type`
Made by: nothing: there are none
From: nothing
Prompt or command: none
Takes: none
Why this one: a word that is a picture goes soft at 3840 and shimmers when small. Outlines stay sharp at every size
Date: 2026-11-25

Size: 0 by 0 px, 0 MB.

## The geometry of a run (made in the browser, never stored)
Made by: `setRun` in `src/shell/real/type.ts`, with three 0.187
From: `public/fonts/inter-400.json`, `inter-500.json`, `inter-600.json`, `inter-display-600.json`, `playfair-700.json`, `playfair-900.json`, and the words of `content/copy.json` as the layout hands them over
Prompt or command: `npm run still -- --id rest-step1 --diag type` shows every run that was made
Takes: one for each run, kept until its words change
Why this one: one fill and one or two narrow shoulder rings for each glyph give a sharp edge, an even weight and a real lit or shadowed side without any texture
Date: 2026-11-25
