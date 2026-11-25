# Recipes: the printed floors of the table

Every picture here is made by one command: `node assets-src/table/art/make.mjs` (options `--tier corporate|office|street`, `--set web|full`, `--only art|inserts|guide`). It reads the places of everything from `src/table/layout.ts` and the seed from `config/showcase.json`. No picture holds a letter, a number or a logo. The web set goes to `public/assets/table/art/`, the full set to `assets-full/table/art/`, under the same names.

## corporate.webp, office.webp, street.webp (colour, the print of a floor)

- Made by: `make.mjs`, from three layers: a tone under everything (`ground()`), an optional painted base (`painted/<tier>.png`, see below), and the drawn layer of `tiers.mjs` set in balls and rasterised by sharp
- From: the layout (walls, lanes, posts, bumpers, slings, flippers, targets, models, displays, lamps, inserts, rails, holds, flats) and the seed
- Prompt or command: `node assets-src/table/art/make.mjs --only art`
- Takes: about 35 s for the web set and 150 s for the full set (MEASURED on the build machine)
- Why this one: a drawn floor is exactly on the layout, so every line answers a part that stands there. Corporate is a sunburst of gold hairlines from the doors of the tower on blue marble; Office is carpet tile of one and a half balls with a pale walkway and loose stationery; Street is an avenue on the layout's road with a cross street, crossings, two car parks and city blocks
- Size: web 4096 by 2304, full 8192 by 4608
- Date: 2026-11-25

## corporate-mask.png, office-mask.png, street-mask.png (data, the coverage mask)

- Made by: `mask()` in `make.mjs`
- From: the finished floor of the same run
- Prompt or command: the rule, never a hand: at 2048 wide, a pixel is printed (245) where its luminance differs from a blur of 9 texels of itself by more than 7 of 255, and flat (10) elsewhere
- Takes: under 1 s each
- Why this one: it says printed where the eye sees a line or an edge of the print, and flat where the print is one tone, with no judgement in it
- Size: 2048 by 1152 in both sets
- Date: 2026-11-25

## corporate-coat.png, office-coat.png, street-coat.png (data, the clear coat)

- Made by: `coat()` in `make.mjs`
- From: the layout: the launch lane, the top lane, the inlanes, the shots from each flipper and the way to the drain
- Prompt or command: green is the roughness of the clear coat as three.js reads it: low everywhere, a little higher with fine scuffs along the lines the ball runs most. Blue holds the same trail by itself for whoever wants it
- Takes: about 2 s each (web)
- Why this one: a played table is dullest where the ball goes; the trail is faint and is only seen where a light is reflected
- Size: web 2048 by 1152, full 4096 by 2304
- Date: 2026-11-25

## inserts-lens.webp, inserts-glow.webp, inserts-relief.png (the nine windows)

- Made by: `insertAtlases()` in `inserts.mjs`
- From: `config.table.inserts`, in its order: cell `index % 3` across, `floor(index / 3)` down. The picture of a cell is chosen by the insert's `picture`
- Prompt or command: `node assets-src/table/art/make.mjs --only inserts`
- Takes: about 1 s
- Why this one: the lens is the window unlit, dark in its own colour; the glow is what it emits when lit, brightest in the middle with the moulded picture dark against it; the relief is the picture and the rings of the lens as heights, for the bump of the surface
- Size: web 1152 square, full 2304 square
- Date: 2026-11-25

## guide/corporate.png, guide/office.png, guide/street.png (not shipped)

- Made by: `guide()` in `tiers.mjs`
- From: the layout
- Prompt or command: `node assets-src/table/art/make.mjs --only guide`
- Takes: under 1 s
- Why this one: a plain line drawing of where every part of a tier stands, to hand to the image tool with the approved key so that a painted base keeps the places
- Size: 1920 by 1080
- Date: 2026-11-25
