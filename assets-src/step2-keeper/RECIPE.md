# Step 2 keeper: what is built, and how to build it again

Nothing here is a file. Every texture and every solid of step 2 is made in code when the page is first drawn. The recipes of the first owners stand in `assets-src/step2-dial/RECIPE.md` and `assets-src/step2-slot/RECIPE.md`; this file holds what the keeper changed.

## The unlit meter segment's picture (a texture in memory, no file)
Made by: `picture()` in `src/pages/step2/real/slot-kit.ts`, called in `own()` of `src/pages/step2/real/crank.ts`
From: `CRANK_LOOK.picture` and `inPill()` in `src/pages/step2/real/crank.ts`, `CRANK.segW` and `CRANK.segH` in `src/pages/step2/layout.ts`
Prompt or command: `npm run still -- --key step2-crank --format hd --tier review`
Takes: 2 sizes, 64 by 256 px (0.06 MB, 0.08 MB with its mips) and 128 by 512 px (0.25 MB, 0.33 MB with its mips); the second was kept
Why this one: the first gave 2.3 texels to the page pixel and failed M2 on the sheet `machines`; the second gives 4.6
Date: 2026-11-26

## The meter segment's solids (geometry in memory, no file)
Made by: `segment()` in `src/pages/step2/real/crank.ts`, with `sweep()` and `profile()` of `src/shell/solids.ts`
From: `CRANK_LOOK.pill`, `pillRound`, `wallRings`, `rimTone` in `src/pages/step2/real/crank.ts`
Prompt or command: `npm run measure -- --unit step2 --only M2 --tier review`
Takes: 2, one solid with the picture all over it, and a top with the picture over a plain wall in the tone of the picture's rim; the second was kept
Why this one: a picture laid on from above has no texels on an upright wall, and that wall was every soft pixel M2 counted
Date: 2026-11-26

## The dial's housing, base ring, countersinks, hub foot and sheen (geometry in memory, no file)
Made by: `seatGeometry()`, `housingGeometry()`, `holesGeometry()`, `hubGeometry()`, `hubRingGeometry()`, `glintGeometry()` in `src/pages/step2/real/dial.ts`
From: `DIAL_BODY` in `src/pages/step2/layout.ts`, the shared steel and orange of `src/shell/materials.ts`, `look.key` of `config/showcase.json`
Prompt or command: `npm run still -- --key step2-dial --format hd --tier review`
Takes: 5 review stills of the key; the last was kept
Why this one: the housing reads as a stepped ring, the hub is a bright dome with one soft sheen, the holes have a lip
Date: 2026-11-26

## The tray's walls (vertex colour on geometry in memory, no file)
Made by: `trayWallShade()` and `trayFloor()` in `src/pages/step2/real/rows.ts`
From: `TRAY` and `TRAY_R` in `src/pages/step2/layout.ts`, `look.key.direction` of `config/showcase.json`
Prompt or command: `npm run still -- --key step2-dial --format hd --tier review`
Takes: 2 review stills; the second was kept
Why this one: the upper and left walls show their own tone falling into shade, and the rim above them is mid grey and not white
Date: 2026-11-26

## The slot's lever (geometry in memory, no file)
Made by: `mount()` and `arm()` in `src/pages/step2/real/slot.ts`, placed by `machine()` in `src/pages/step2/index.ts`
From: `SLOT.pivotY` in `src/pages/step2/layout.ts`, `SLOT_LOOK.lever` in `src/pages/step2/real/slot.ts`
Prompt or command: `npm run still -- --sheet machines --format hd --tier review`
Takes: 2 places of the bracket, 62 and 58 px under the cabinet's top; 58 was kept
Why this one: the pulled lever hangs from a bracket at the cabinet's side as on the approved sheet, and the knob's travel is unchanged
Date: 2026-11-26
