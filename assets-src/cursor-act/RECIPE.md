# Cursor acting, damage and arms

Nothing here is a file. Every shape is made in code when the page loads and one small picture is made from the seed. No file ships for these three parts.

## The rubber grain of the arms (one tiling normal picture, 64 by 64 px, 0.016 MB, 0.021 MB with its smaller copies)
Made by: `grainNormalMap(64, config.seed + 7, 1.6)` of `src/shell/materials.ts`, called once in `src/cursor/act/arms.ts`
From: no input file. The seed `config.seed` and `src/core/random.ts`
Prompt or command: none to run by hand. It is made when the first cursor view is made. To see it: `npm run still -- --sheet cursor-arms --format hd --tier draft`
Takes: one
Why this one: matte black rubber needs a fine tooth so the light off an arm is a soft band and not a hard line, and the shared grain function gives one that tiles and is the same on every run
Date: 2026-11-25

## The arms and hands (geometry only, no picture)
Made by: `makeArms()` in `src/cursor/act/arms.ts`
From: no input file. `ARM` and `HAND` at the top of that file hold every size, all as shares of `cursor.heightPxAt1080`
Prompt or command: none. Each arm is a tube of 22 by 10 segments redrawn each frame from shoulder to hand; each hand is a palm, a cuff ring, three fingers of two joints and a thumb
Takes: 4 looks so far of the 40 allowed
Why this one: thin matte arms with a ring at the wrist and a hand of three fingers and a thumb, as in `references/approved/cursor-arms.png`
Date: 2026-11-25

## Acting and damage (numbers only, no picture)
Made by: `src/cursor/act/feel.ts`, `src/cursor/act/acting.ts`, `src/cursor/act/damage.ts` and the sim in `src/cursor/body.ts`
From: no input file
Prompt or command: none. These parts send numbers to the body and the effects, which draw them
Takes: one
Why this one: see `pipeline/phase3/cursor-act.md`
Date: 2026-11-25
