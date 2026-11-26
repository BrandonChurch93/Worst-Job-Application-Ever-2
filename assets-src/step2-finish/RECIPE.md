# Step 2 finish: what is built, and how to build it again

Nothing here is a file. Every texture and every solid of step 2 is made in code when the page is first drawn. The recipes of the earlier owners stand in `assets-src/step2-dial/RECIPE.md`, `assets-src/step2-slot/RECIPE.md` and `assets-src/step2-keeper/RECIPE.md`; this file holds what the finish changed.

## The slot's lever: socket, bent bar and rod (geometry in memory, no file)
Made by: `mount()`, `bentBar()` and `arm()` in `src/pages/step2/real/slot.ts`, placed by `machine()` in `src/pages/step2/index.ts`
From: `SLOT_LOOK.lever` in `src/pages/step2/real/slot.ts`, `SLOT.pivotY`, `SLOT.leverX` and `SLOT.pull` in `src/pages/step2/layout.ts`
Prompt or command: `npm run compare -- --sheet machines --tier draft --format hd`
Takes: 2 draft stills of the sheet, a rod of 6.2 px out of a socket of 11.5 px, and a rod of 7.4 px out of a socket of 14.5 px with a bend of 15 px; the second was kept
Why this one: the lever comes out of a dark socket with a copper ring on the cabinet's side, turns through a quarter bend and runs straight to the knob, as on `references/approved/machines.png`. The knob moves as before
Date: 2026-11-26

## The legends of the reels (geometry in memory, no file)
Made by: `legend()` and `poseLegend()` in `src/pages/step2/real/slot.ts`, with `dataOf()` and `geometryOf()` of `src/shell/real/type.ts`
From: `REEL_TYPE` (48 px) and `YEAR_TYPE` (34 px) in `src/pages/step2/layout.ts`, `SLOT_LOOK.legend` and `SLOT_LOOK.drum` in `src/pages/step2/real/slot.ts`, the style `paper:ink` of the page's type
Prompt or command: `npm run still -- --page step2 --beat step2.slot --at 0.35 --format hd --tier draft`
Takes: 2, every legend at 48 px with the year drawn narrower (the layout's check refused it: the year is wider than its reel), and month and day at 48 px with the year at 34 px drawn 1.16 times as tall; the second was kept
Why this one: the cap of a month or a day is about half the width of its drum and the year is condensed, as approved; a legend away from the payline lies round its drum
Date: 2026-11-26

## The meter's segments (2 textures in memory, geometry in memory, no file)
Made by: `picture()` in `src/pages/step2/real/slot-kit.ts`, called in `own()` of `src/pages/step2/real/crank.ts`; `segment()` in the same file
From: `CRANK_LOOK.pill` (8 px), `pillRound` (5 px), `clear`, `lamp` and `inPill()` in `src/pages/step2/real/crank.ts`
Prompt or command: `npm run compare -- --key step2-crank --tier draft --format hd`
Takes: 2 draft stills; a lamp 5 px over the lens with a reach of 46 px, and a lamp 12 px over it with a reach of 58 px; the second was kept
Why this one: a lens is a thick capsule with a dark wall, a wet line inside its wall on the light's side and a shadow to the lower right; a lit lens has a pale core and an orange wall. The sizes of the two textures are unchanged: 128 by 512 px (0.25 MB, 0.33 MB with its mips) and 64 by 256 px (0.06 MB, 0.08 MB with its mips)
Date: 2026-11-26

## The dial's inner disc, its ring, the wedge of the stop and the lower cap (geometry in memory, no file)
Made by: `innerGeometry()`, `wedge()`, `stopGeometry()` and `hubGeometry()` in `src/pages/step2/real/dial.ts`
From: `DIAL_BODY` in `src/pages/step2/layout.ts`
Prompt or command: `npm run compare -- --key step2-dial --tier draft --format hd`
Takes: 1 draft still of the key and 1 of the sheet
Why this one: the middle is a pale matt disc inside a raised satin ring, the stop is a flat wedge broad at the bezel, the cap is lower and satin, and the dark lines round the base are thinner
Date: 2026-11-26

## The payout mouth of the slot machine

- What: a trough under the cabinet that the coins leave from.
- Made by: `payout()` in `src/pages/step2/real/slot.ts`, in code, from the numbers `SLOT_LOOK.pay`. A rounded bar of the cabinet's frame steel through `studio()`, a dark bed of the window's mouth material, one contact line of the shared gap material.
- Texture: none of its own. 0 px, 0 MB.

## The seat of a meter lens, the crank's cast shade, the bed of the payout tray (geometry and materials in memory, no file)
Made by: `segment()` and `castDisc()` in `src/pages/step2/real/crank.ts`; `payout()` in `src/pages/step2/real/slot.ts`
From: `CRANK_LOOK.seat`, `CRANK_LOOK.cast`, `SLOT_LOOK.pay`
Prompt or command: `npm run compare -- --key step2-crank --tier draft --format hd`, `npm run compare -- --sheet machines`
Takes: 4 draft stills of the crank key for the seat's line (the shared gap, then the part's own grey `0x6f7877`), 2 for the cast shade, 2 of the sheet for the bed
Why this one: the lens sits below a narrow lip and its foot line is soft, the plate's shade falls down and to the right as the key's light asks, the bed is mid grey steel and not a black hole
Texture: none new. The lit lens's picture was repainted at the same size, 64 by 256 px, 0.06 MB (0.08 MB with its mips); the unlit lens's picture is 128 by 512 px, 0.25 MB (0.33 MB with its mips)
Date: 2026-11-26

## The floor of a tray (vertex colour, no texture, no file)
Made by: `trayFloor()` in `src/pages/step2/real/rows.ts`
From: `TRAY.floor` in `src/pages/step2/layout.ts`
Prompt or command: `npm run still -- --key step2-crank --format hd --tier draft`, `npm run still -- --key step2-dial --format hd --tier draft`
Takes: 3 draft stills of the crank key (soak 0.42 over 30 px was too dark all over; soak 0.44 over 13 px kept), 1 of the dial key; then 3 more of the crank key and 1 of the dial key for the long part of the shade (`far` 0.16 over 52 did nothing, 0.24 over 110 was short of approved, 0.32 over 110 kept with soak 0.4, base 1.24, bounce 0.16 over 24, warm 0.035)
Why this one: a shade under the upper and left wall and a lighter far side, as the approved well has
Texture: none. 0 px, 0 MB
Date: 2026-11-26

## The unlit lens's edge (a picture and a material, no file)
Made by: `own()` in `src/pages/step2/real/crank.ts`: the picture `off` drawn by `picture()` and the material `wall` passed through `studio()`
From: `CRANK_LOOK` there: in the picture the dark line inside the rim is 0.12 and the rim's own darkening 0.02; the wall and the seat have the tone 0.86 of the pale glass and give off 0.5 of the tone 0xe9eeec; the foot line is 0xa2aaa8
Prompt or command: `npm run still -- --key step2-crank --format hd --tier draft`, the same at `--tier review`
Takes: 4 draft stills and 1 review still of the crank key (one with the wall painted green to find what the dark outline was)
Why this one: approved's unlit lenses are clear blocks with a light edge all round, not a dark outline
Texture: `off`, 128 by 512 px, 0.25 MB (0.33 MB with its smaller copies), as before
Date: 2026-11-26
