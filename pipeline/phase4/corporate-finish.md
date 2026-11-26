# Corporate and Office models, the finisher

Branch `agent/corporate-finish`, from `origin/main` 9334a125. Started 11:09 UTC on 2026-11-26. The notes of the owners before me are `corporate-models.md`, `corporate.md`, `office-models.md` and `office.md`.

## Before any change (MEASURED 11:11 UTC)

- `npm test`: 115 files, 1461 of 1461 tests. `npm run build`: built. `npm run bots`: all clear, keen reached every one of the 37 gags on every seed.
- `npm run build && npm run counts -- --key table-wide --live low`, the rows of my folders (meshes, colour, shadow, calls, triangles):

| part | meshes | colour | shadow | calls | triangles |
| --- | --- | --- | --- | --- | --- |
| model-hq | 4 | 4 | 1 | 5 | 12154 |
| model-beach | 3 | 3 | 1 | 4 | 9859 |
| model-boardroom | 2 | 2 | 2 | 4 | 8220 |
| model-revolving-door | 2 | 2 | 1 | 3 | 4008 |
| model-ladder | 1 | 1 | 1 | 2 | 9888 |
| model-wedges | 1 | 1 | 1 | 2 | 4844 |
| model-notes | 1 | 1 | 0 | 1 | 924 |
| model-staplers | 3 | 3 | 3 | 6 | 7356 |
| model-inbox | 3 | 3 | 2 | 5 | 4364 |
| model-cubicles | 3 | 3 | 0 | 3 | 12355 |
| model-coffee-machine | 1 | 1 | 1 | 2 | 6628 |

Corporate: 21 calls, 49897 triangles. Office: 16 calls, 30703 triangles. Whole frame at the lowest level: 201 calls against 300. My budget: 37 calls, 110600 triangles.
- One `draft` still of `tier-corporate`: 42.7 s, 463 draw calls, 608485 triangles in the whole frame.

## What a quick look at the approved images misses, in my part

1. The tower's roof in `tier-corporate` is a closed slab of brushed steel with a raised rim and cut corners, and the name plate lies on it: no glass roof, no hall seen from above. What says "tower" from above is the lit front that leans into view under the roof.
2. Behind the tower's glass in `lobby-doors` there are back walls: each bay shows a ceiling with two or three lamp panels and then a lit wall a room's depth in. Nothing is seen through to the far side, which is why it reads as a building and not a frame.
3. The band is far lighter than the letters on it and its brushing is fine and even, with a bright bevel top and bottom: the letters stand in a shallow panel a tone darker than the band's rim.
4. The boardroom table is nearly black brown with one long warm highlight, the chairs are black with a thin grey rim light, and the only colour in the corner is the row of pale lit targets at its foot. The notes are flat squares of a soft butter yellow lying on the floor, each turned a little, each with a darker lower edge.
5. In the Office every model is darker than the floor's pale cross: the coffee machine is dark bronze with a cream cup in a black bay, the tray is beige with a black square mouth in its own front, the cubicle walls are grey brown with nearly black screens. The pale things are only the lids of the cups and the envelopes.

## The issues of round 12 that are my folders' and still true on main (looked at 11:13 to 11:16 UTC in three `draft` comparisons)

Severe and major first, in the critics' words.

1. R1-2 issue 5 (tower): "a bare grey metal frame with exposed ceiling light strips and no glass". True: in `lobby-doors` the eye goes through clear glass to bright slab edges and ceilings; from above the roof is a glass lantern over rings of lamps.
2. R1-2 issue 3 (boardroom): "a small orange plastic desk with green chairs and olive footrests, no lamps". True: the walnut reads orange, the notes at its foot read as olive footrests.
3. R1-2 issue 4 (notes): "the four yellow sticky notes ... are missing". True in effect: the three leaves are there (no stand-in) but come out olive and small at the foot of the boardroom.
4. R1-2 issue 2 and measure M4 (sign band): letters at 4.25 against the band. True: the band is mid grey steel under dark letters.
5. R1-2 issue 11 (carpet): "a glossy ribbed cord with visible ridges and streaky shine". True.
6. R1-2 issue 10 (revolving door off the carpet). True on main today; the layout moves it in the next merge.
7. R1-3 issues 13 and 14 (coffee machine): "a pale flat metal lid, rows of pale dots and a large bold white plaque". True.
8. R1-3 issues 15 and 16 (tray): "a rounded bin ... a separate conspicuous circular black receptacle". True: the black ring beside it is the hold of the layout and the frame's ejector, the tray itself is rounded.
9. R1-3 issues 17 and 18 (staplers): "a rounded bar inset on a thin triangle". True.
10. R1-3 issues 25 and 26 (cubicles): "a single bright board of uniform framed square cells". True: the caps are pale cream and the floor inside is pale.
11. R1-3 issue 9 and 10 (paper clusters on the lower shoulders). True: eleven sheets in the two corners.
12. R1-2 issue 13 (beach, minor): "a tilted flat brown slab ... a flat green star, with washed-out sea". True.
13. R1-2 issue 14 (wedges, minor): "flat dull grey with hard dark crack lines". True.

Not my folders, named in the same groups: the hourglass insert unlit (R1-2 issue 7, the floors), the walls and lamp rows (R1-2 issue 9), the red pool under the ball (R1-2 issue 8, lights or ball), the letters of the sign (R1-2 issue 2, type and draw), the arrow (R1-2 issue 12, R3-1 issue 3), the carpet print of the Office floor (R3-1 issue 4, R3-3 issue 5), the cups of the bumpers, the display with one glyph (R8-1 issue 7).

## Looks

Counted from the first still, by part. A still that shows several parts counts one for each part changed in it.

| part | looks |
| --- | --- |
| tower, band, carpet (hq) | 3 |
| notes | 3 |
| boardroom | 3 |
| beach | 2 |
| wedges | 2 |
| coffee machine | 2 |
| letter tray | 2 |
| staplers | 1 |
| cubicles and loose paper | 1 |

The stills behind the counts: 11:21 `tier-corporate` and `lobby-doors`; 11:24 the same two; 11:27 and 11:29 `tier-office`; 11:30 `lobby-doors` and `tier-corporate` on the tree with merge 33 in it.

## What was done, in the order of the brief

1. Notes (R1-2 issue 4). Three leaves on the three targets of the layout and a fourth that has come off and lies on the floor past the row, all of one butter yellow, each with a curled corner and a short dark shade under it, no word on any. They are lit through the tier's glowing material so that they read yellow in the dim corner.
2. Band (M4). A pale satin plate let into the band in a thin polished frame. MEASURED on my `draft` still of `lobby-doors` at 11:24, `node out/work/tmp/contrast.cjs out/work/stills/key-lobby-doors-hd-draft.png 860 375 500 75`: letters mean relative luminance 0.0200, plate beside them 0.5911, ratio 9.16 (was 4.25 by the Builder's measure).
3. Tower. Each floor has a room's depth of carpet and desks behind the glass and then the lit wall of the core, dim at the floor and lit under the ceiling, with dark doors; nothing is seen through to the far side. The glass is denser and blue green, with five slanting streaks of the room's light on the front. The roof is closed: a steel coping, a deck of pavers, two air handlers with fans, the lift house, pipes, vents, a cable tray and a row of lit roof lights.
4. Boardroom. A dark walnut table, three brass lamps on it with a warm pool under each, black chairs in two rows. No orange in it.
5. Carpet. No ribs: a fine grid of tufts whose tones run into each other, each leaning a little its own way, in a deeper crimson.
6. Beach and wedges. A lounger of blue and pale stripes on its legs, fronds in two layers with the upper ones lighter, the sea brighter and nearer. The wedges are whiter, the veins soft and grey, and a warm lit lip runs under each slab.
7. Coffee machine. Darker bronze all over, a bronze top in place of the pale steel lid, three small coloured cups on it in place of six white ones, dark control plates with the small coloured lamps, a service bay with cheeks and a valance, a cup with a handle on a saucer in the bay, a smaller cream plate under the word.
8. Letter tray. Squared corners, beige, the frame of the mouth moulded in the tray's own beige with no steel bars and no screws, envelopes laid square to each other with a darker shade under each.
9. Staplers. A flatter, wider red paddle with a quiet highlight over dark hardware with a plated channel, on a foot of brushed steel with a chrome edge and a warm lit lip under it.
10. Cubicles. Grey brown partitions ten px taller with darker caps, a deeper shade at their feet, nearly black screens, desks of several warm woods, dark chairs. Six loose things taken off the lower shoulders (nine and six before, six and three now) and the sheets that stay are greyer.

## Decisions

- The tower has core walls and no open hall: the approved image shows a lit wall a room's depth behind the glass.
- The roof is a closed deck with the plant of a tower on it, not a glass lantern.
- The layout has three note targets. The fourth note is a loose leaf on the floor, placed from the last target of the row, so nothing of the layout moves.
- The notes, the pools under the boardroom lamps, the fourth note and the warm lips of the wedges are built into the one glowing mesh of the tower: no draw call more.
- The band's plate is a satin face, not a mirror, so that its tone does not hang on what it reflects and the measure holds from every camera.
- The warm lip under the staplers is in the tier's one glowing mesh, which the cubicles hold.
- The black ring beside the tray is the hold of the layout and the frame's ejector: not mine, left alone.
- `tests/table-corporate.test.ts`: the triangle limits of the tier went up with the new parts, and the test of the tower's box leaves out the glowing mesh, which now also holds the boardroom's pools and the loose note.
