# Recipes: the printed floors of the table

Every picture here is made by one command: `node assets-src/table/art/make.mjs` (options `--tier corporate|office|street`, `--set web|full`, `--only art|inserts|guide`). It reads the places of everything from `src/table/layout.ts` and the seed from `config/showcase.json`. No picture holds a letter, a number or a logo. The web set goes to `public/assets/table/art/`, the full set to `assets-full/table/art/`, under the same names.

## corporate.webp, office.webp, street.webp (colour, the print of a floor)

- Made by: `make.mjs`, from three layers: a tone under everything (`ground()`), an optional painted base (`painted/<tier>.png`, see below), and the drawn layer of `tiers.mjs` set in balls and rasterised by sharp
- From: the layout (walls, lanes, posts, bumpers, slings, flippers, targets, models, displays, lamps, inserts, rails, holds, flats) and the seed
- Prompt or command: `node assets-src/table/art/make.mjs --only art`
- Takes: about 35 s for the web set and 150 s for the full set (MEASURED on the build machine)
- Why this one: a drawn floor is exactly on the layout, so every line answers a part that stands there. Corporate is a sunburst of gold hairlines from the doors of the tower on blue marble; Office is broad chequered carpet tile in two grey-greens with a wide pale walkway cross and a little loose stationery; Street is an avenue on the layout's road with a cross street, crossings, two car parks and faint paving
- Size: web 4096 by 2304, full 8192 by 4608
- Date: 2026-11-25

## corporate-mask.png, office-mask.png, street-mask.png (data, the coverage mask)

- Made by: `mask()` in `make.mjs`
- From: the drawn design of the same run: the flat tone of the floor with every drawn layer on it. The painted material and the grain are left out, because marble veins and carpet pile are not printed marks
- Prompt or command: the rule, never a hand: at 2048 wide, a pixel is printed (245) where its luminance differs from a blur of 9 texels of itself by more than 7 of 255, and flat (10) elsewhere
- Takes: under 1 s each
- Why this one: it says printed where the eye sees a line or an edge of the print, and flat where the print is one tone, with no judgement in it
- Size: 2048 by 1152 in both sets
- Date: 2026-11-25

## corporate-coat.png, office-coat.png, street-coat.png (data, the clear coat)

- Made by: `coat()` in `make.mjs`
- From: the layout: the launch lane, the top lane, the inlanes, the shots from each flipper and the way to the drain
- Prompt or command: green is the roughness of the clear coat as three.js reads it: low everywhere, a little higher with fine scuffs along the lines the ball runs most. Blue is the metal of the print, as three.js reads metalness: on the corporate floor the gold lines, found by rule (red above blue by more than 24 of 255, full at 74), and nothing on the other two
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

## painted/corporate.png, painted/office.png, painted/street.png (the painted bases, not shipped as they are)

- Made by: the image tool, model `nano_banana_pro` (Nano Banana Pro), one take each, 2752 by 1536, with the approved key of the tier as the one reference picture (`references/approved/tier-corporate.png`, `tier-office.png`, `tier-street.png`) for the colour of the material
- From: the approved key of the tier. The guide was not handed over: the base holds material only, because a line the tool paints lands beside the layout, and the drawn layer puts every line exactly on it
- Prompt or command: each prompt is the line of its floor followed by the common ending.
  - corporate: "A single polished slab of deep midnight-blue marble, the same dark navy as the floor between the gold lines in the reference image. Subtle natural veining in slightly lighter blue with a few faint grey-gold threads, soft cloudy mottling, thin veins wandering in varied directions, calm and dark overall."
  - office: "Grey-green commercial office carpet, short dense loop pile, the same muted sage grey-green as the carpet floor in the reference image. One even field of carpet with no seams and no pattern, tiny fibres, very slight natural mottling and a few barely visible lighter worn patches."
  - street: "Dark blue-black asphalt, the same deep navy blue as the road surface in the reference image. Fine aggregate, a few hairline cracks, two or three faint tar-sealed seams, subtle worn lighter patches, tiny pale specks of stone. No road markings at all."
  - common ending: "Perfectly flat surface seen exactly straight from above, like a flatbed scan. Evenly lit, no shadows, no highlights, no reflections, no vignette. No objects, no parts, no lines, no borders, no frame, no perspective. No text, no letters, no numbers, no logos. The material fills the whole image edge to edge. The image shows an area about half a metre wide, so the texture is fine and small in scale."
- Takes: 1 of 6 for each floor, each kept. Each was looked at whole and in crops for letters, numbers and marks: none found
- Why this one: corporate is the floor itself under the gold (its own brightness, saturation 1.18): real veins and clouding that a noise cannot give. Office and street lend only their light and dark (an overlay round mid grey, gain 1.5 and 2.6) to the drawn ground, so the pile and the grit are real and the tones stay those of the print
- Size: 2752 by 1536, 6.4, 10.5 and 9.3 MB
- Date: 2026-11-25
