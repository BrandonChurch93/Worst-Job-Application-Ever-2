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
| tower, band, carpet (hq) | 12 |
| notes | 3 |
| boardroom | 5 |
| beach | 2 |
| wedges | 9 |
| coffee machine | 2 |
| letter tray | 3 |
| staplers | 4 |
| cubicles and loose paper | 1 |

The stills behind the counts. First pass: 11:21 `tier-corporate` and `lobby-doors`; 11:24 the same two; 11:27 and 11:29 `tier-office`; 11:30 `lobby-doors` and `tier-corporate` on the tree with merge 33 in it. Second pass: 11:36 `tier-office` (staplers); 11:40 `lobby-doors` and `tier-corporate` (tower); 11:42 `tier-corporate` (wedges, carpet) and `tier-office` (staplers); 11:44 `tier-corporate` (roof, wedges) and `lobby-doors` (tower); 11:46, 11:48 and 11:49 `tier-corporate` (wedges); 11:47 `lobby-doors` (band); 11:53 `tier-corporate` at `final` (all of the tier, counted for the tower and the wedges); 11:56 `tier-corporate` (boardroom, wedges); 11:59 `tier-corporate` and `lobby-doors` (roof, hall); 12:01 `tier-corporate` (boardroom, roof); 12:02 `tier-office` (tray, staplers); 12:03 `lobby-doors` (hall); 12:04 `tier-office` (staplers) and `lobby-doors` (hall).

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

## After the first pass (MEASURED 11:34 to 11:37 UTC, on the tree with merge 33 in it, commit 522854d5)

- `npm test`: 116 files, 1466 of 1466 tests. `npm run build`: built. `npm run bots`: all clear, keen reached every one of the 37 gags on every seed.
- `npm run counts -- --key table-wide --live low`, my rows (calls, triangles), before and after:

| part | calls before | calls after | triangles before | triangles after |
| --- | --- | --- | --- | --- |
| model-hq | 5 | 5 | 12154 | 35246 |
| model-beach | 4 | 4 | 9859 | 9859 |
| model-boardroom | 4 | 4 | 8220 | 9252 |
| model-revolving-door | 3 | 3 | 4008 | 4008 |
| model-ladder | 2 | 2 | 9888 | 9888 |
| model-wedges | 2 | 2 | 4844 | 4844 |
| model-notes | 1 | 1 | 924 | 924 |
| model-staplers | 6 | 6 | 7356 | 7708 |
| model-inbox | 5 | 5 | 4364 | 4041 |
| model-cubicles | 3 | 3 | 12355 | 12284 |
| model-coffee-machine | 2 | 2 | 6628 | 7392 |

Corporate: 21 calls (21 before), 74021 triangles (49897). Office: 16 calls (16), 31425 triangles (30703). Together 37 calls and 105446 triangles against 37 and 110600. Whole frame at the lowest level: 199 calls against 300.
- No asset file in either folder: 0 MB in `assets-src`, `public/assets` and `assets-full` for `table/corporate` and `table/office`.
- Band, on the `draft` still of `lobby-doors` after the merge: letters 0.0201, plate 0.6070, ratio 9.37.
- Fine detail by the formula of M3 (`node out/work/tmp/m3.mjs <still> <approved>`, which calls `highFrequencyEnergy` of `tools/lib/measure-core.mjs`) on my `draft` stills: `tier-corporate` 0.785, `lobby-doors` 0.811, `tier-office` 1.012. The judged number is taken at the `final` tier, which I did not render.
- The revolving door after merge 33: its post and foot stand wholly on the carpet in `tier-corporate` and `lobby-doors`; the carpet's width was not changed.

A fault of mine: the merge commit 7452e955 (of `origin/main` at 11:36 UTC, records only) went out with git's own message and without the trailer. It is pushed and I do not rewrite history; every merge after it carries the trailer.

## Second pass (11:40 to 12:10 UTC)

What the Builder sent at 11:40, 11:57 and 11:58 came first, in the Builder's order.

1. Roof of the tower (Builder, a). The deck is now small pavers of brushed steel, three to a bay, with dark joints. In the middle of it lies the glass roof of an atrium in a steel curb: through it the lit galleries of the floors, the darker well and a lit patch at its foot, under a grid of dark glazing bars with small lamps along both sides. A second row of lit roof lights stands behind the plant. All of the light is in the tower's one glowing mesh.
2. Wedges (Builder, b). The stone went from near white to a grey white (`MARBLE` 0.82, 0.98, 1.5 to 0.14, 0.165, 0.245, since the lamp under the lip and the tier's light lift it a long way), its finish from polished stone to satin so that it does not mirror the lamps as a white field, and the veins are darker, more of them and of three weights: six main veins with branches, three broad faint clouds and sixteen hairlines.
3. The doorway (Builder). The hall behind the doors is lit: its floor at twice the level it had and its back wall from 0.2 at the floor to 0.62 under the ceiling, so that the panes of the doors show a warm lit room. The two slanting streaks on each door leaf are narrower and fainter.
4. Boardroom (Builder, c). The wood is darker and the pools under the lamps smaller and less bright, so that the top reads as wood. At each place lies what a meeting leaves: a sheet or two, a dark pad and a brass pen, none square to the edge.
5. Letter tray (Builder, b of 11:58). Seventeen envelopes in the two heaps that hop (thirteen before), turned every way and not only by quarter turns, and the heap stands three px higher in the tray so that it comes over the rim.
6. Tower glass and core walls. The five painted streaks on the front glass are gone. The core walls are dimmer (0.016 at the floor to 0.12 under the ceiling, from 0.03 to 0.2), more bays have a dark timber panel with a lit strip over it, and dark cross walls run out from the core to the desks at about every second bay, so that each floor reads as rooms with depth.
7. Band. The plate is a mid brushed steel grey (`PLATE` 0.56, 0.585, 0.63, from 0.78, 0.8, 0.84) as the Builder allowed. MEASURED on the `draft` still of `lobby-doors`, 11:48 and again 12:03: letters 0.0135, plate 0.4480, ratio 7.84.
8. Carpet. The tones of the tufts differ more (0.7 to 1.3 of the red, from 0.84 to 1.16) and the tufts are a little larger (`PILE.step` 4.3 from 3.4), which gave back the triangles the roof and the rooms took.
9. Staplers. The body is fuller at the hinge and tapers to the nose, with a rounder shoulder and a smaller highlight. The foot is a chrome edge under a darker brushed plate. A red plate was tried at 12:02 and thrown out: it read as a red triangle, not as a stapler on a foot.

Decisions of the second pass:

- The Builder ruled at 11:40 that the plate stays pale with dark flat letters and that the change to raised letters on blue steel is not begun. It is a difference from the approved image, listed by the Builder.
- The cups of the Office are bumpers and belong to `src/table/real/play/bumpers.ts`: not mine, by the Builder's word at 11:59.
- The roof shows an atrium roof although the floors under it have core walls: from above the eye wants light in the middle of the largest plain area of the key, and a real tower may have both.

Fine detail by the formula of M3:

| still | tier | ratio |
| --- | --- | --- |
| `tier-corporate` before the second pass | draft | 0.785 |
| `tier-corporate` at 11:53 (commit 0edbdd10) | final | 0.554 |
| `tier-corporate` at 12:01 | draft | 0.868 |
| `lobby-doors` at 12:03 | draft | 0.824 |
| `tier-office` at 12:02 | draft | 1.080 |

The `final` tier softens the picture: the same tree gave 0.822 at `draft` and 0.554 at `final`. By area (`node out/work/tmp/region.mjs <still> <approved>`), the roof, the wedges and the carpet were each under the approved image's fine detail at `final`, and so were the frame, the top and the bottom of the picture, which are not my parts.

After the second pass (MEASURED 12:05 to 12:08 UTC on the tree with merge 34 in it): `npm test` 117 files, 1472 of 1472; `npm run build` built; `npm run bots` all clear, keen reached every one of the 37 gags on every seed. `npm run counts -- --key table-wide --live low`, my rows (calls, triangles): hq 5, 33162; beach 4, 9859; boardroom 4, 9252; revolving door 3, 4008; ladder 2, 9888; wedges 2, 5900; notes 1, 924; staplers 6, 8120; inbox 5, 4272; cubicles 3, 12284; coffee machine 2, 7392. Corporate 21 calls and 72993 triangles, Office 16 calls and 32068 triangles, together 37 calls and 105061 triangles against 37 and 110600. Whole frame at the lowest level: 198 calls against 300.

## Third pass (12:10 to 12:20 UTC)

- Wedges against the approved crop: the stone a step paler again (`MARBLE` 0.2, 0.235, 0.35), the veins thin, crisp and dark with more branches and more wander, the soft halo round each vein cut to one narrow band.
- Carpet: tufts a little smaller (`PILE.step` 3.8), each leaning more its own way (0.13) and each a hair lighter or darker than its neighbours (0.1). A grain of 0.2 was tried at 12:14 and thrown out: close to the doors it read as a board of squares.
- Atrium roof: wider (168 px), fourteen bays of glazing bars by four, fifteen lamps along each gallery.
- Staplers: the base under the arm is red enamel, a little wider than the arm, as the approved image has it; the hinge cheeks stay dark.
- Looks: 12:13 `tier-corporate` (wedges, carpet, roof) and `lobby-doors` (carpet); 12:15 `tier-office` (staplers); 12:16 `tier-corporate` (wedges, carpet); 12:17 `lobby-doors` (carpet). Counts by part now: hq 16, wedges 11, staplers 5; the others as in the table above. One more `final` still of `tier-corporate` at 12:09 (hq, wedges: counted in these).
- MEASURED 12:17 to 12:20 UTC: `npm test` 117 files, 1472 of 1472; build built; bots all clear. Counts: hq 35418, wedges 6192, the other rows as after the second pass; Corporate 21 calls and 75541 triangles, Office 16 and 32068, together 37 and 107609 against 37 and 110600; frame 198 of 300.
- MEASURED fine detail by M3's formula: `tier-corporate` 0.876 at `draft` (12:16); 0.581 at `final` on 65ca2758 (12:12, 191.8 s). `lobby-doors` 0.824 at `draft`, band ratio 7.84.
- What `final` takes away, from a `draft` and a `final` still of nearly the same tree (`node out/work/tmp/bands.mjs`): strong edges lose 44 percent of their energy, weak edges and texture 5 percent; pixels beside something bright lose 48 percent, beside mid tones 25 percent, in the dark 11 percent. By area the loss is even. So it is the hard edges of lit and bright things that the `final` tier softens. Told to the Builder at 12:15.
- By area at `final` on 65ca2758 (`node out/work/tmp/region.mjs`), build against approved: roof 0.00148 against 0.00155, wedges 0.00101 against 0.00159, carpet 0.00028 against 0.00089, beach 0.00071 against 0.00083; outside my folders, frame left 0.00110 against 0.00223, frame right 0.00105 against 0.00335, top strip 0.00059 against 0.00188, bottom 0.00254 against 0.00435.

## Fourth pass (12:21 to 12:30 UTC)

- Tower front against the approved crop: heavier steel (mullions 4.4 px wide and 6 deep on the front, 2.6 on the sides, floor bands 6.4 high), brighter ceiling lamps (1.2 from 0.85) and desk lamps, so that the floors read as lit rooms behind a steel frame.
- Revolving door: the clamps that hold the glass at the post are slimmer (3.8 high, 4.6 out from the post) with smaller screws; close to the doors they read as cubes before.
- Looks: 12:24 and 12:25 `lobby-doors` (tower, door), 12:26 `tier-corporate` (tower), 12:21 `tier-corporate` at `final`. Counts by part now: hq 20, revolving door 2, wedges 12.
- MEASURED 12:26 to 12:29 UTC: `npm test` 117 files, 1472 of 1472; build built; bots all clear. Counts: Corporate 21 calls and 75541 triangles, Office 16 and 32068, together 37 and 107609 against 37 and 110600; frame 198 of 300.
- MEASURED fine detail by M3's formula at `draft`: `lobby-doors` 0.869, `tier-corporate` 0.862; band ratio 7.84. At `final` on 491ee42b (12:24): `tier-corporate` 0.587.
- The Builder's word at 12:25: the `final` number is not to be chased with stronger grain; a mild sharpening of the finished picture is with `look_finisher`.

## Fifth pass (12:30 to 12:36 UTC)

From the Builder's comparison at 12:30 of the `final` still of bf173faf.

- Carpet: a darker woven border (the first and last two rows of tufts at 0.42 of the field) and a sheen that grows toward the doors (0.82 of the field at the far end, 1.57 at the doors).
- Atrium: the galleries under the glass roof brighter (0.8), the well and its foot lit, the gallery lamps at 1 to 1.5, the roof lights a step up, so that lit floors read through the glass roof.
- Boardroom: a lighter walnut (0.125, 0.056, 0.026) so that the long table reads as wood beside the dark room. The table is not longer: its place and size come from the layout.
- Looks: 12:30 `tier-corporate` (carpet, atrium, boardroom), 12:31 `lobby-doors` (carpet). Counts by part now: hq 22, boardroom 6.
- MEASURED 12:32 to 12:34 UTC on the tree with main merged in (e7e68fbe) and these changes: `npm test` 119 files, 1479 of 1479; build built; bots all clear, keen reached every one of the 37 gags on every seed. Counts: Corporate 21 calls and 75541 triangles, Office 16 and 32068, together 37 and 107609 against 37 and 110600; frame 198 of 300.
- MEASURED fine detail by M3's formula at `draft`: `tier-corporate` 0.855, `lobby-doors` 0.867; band letters 0.0118 on a plate of 0.4480, ratio 8.05.

