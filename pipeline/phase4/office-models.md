# Office models, phase 4

Owner: `/root/office_modeller`. Branch `agent/office-models`. Parts: `model-inbox`, `model-cubicles`, `model-staplers`, `model-coffee-machine`.

## What the approved images show

1. Cubicles: six open boxes in two rows of three, warm beige cloth walls with pale thick caps, a dark floor inside, a pale wood L desk at the back with a dark monitor, a keyboard, loose white paper and a swivel chair. The inner faces are lit in `reply-all`.
2. Coffee machine: a bronze brown enamel body with round corners, a brushed steel top plate, a small white sign plate, a control band of three small steel panels with tiny green, yellow and red lamps and one small lit display, two group heads, a paper cup with a sleeve under the left and a cup under the right, a drip tray with a grille.
3. Inbox: one cream moulded box with thick round walls, heaped with white envelopes that show their V flaps, and a dark square mouth with a bright steel frame low in its wall. Steel balls line up at the mouth in `reply-all`. It is bright, about rgb(200,190,165), and the envelopes are near white.
4. Staplers: a glossy red round top arm with one long highlight, a chrome magazine in the gap, a darker red base plate with screws, over the lit white sling base with its posts.
5. Everything in the approved Office is larger and brighter than the build was: cubicles about 3.6 by 2.6 balls, inbox about 2.9 by 1.95, coffee machine about 2.2 by 1.9.

## Counts before (MEASURED on 1101091)

`npm run build && npm run counts -- --key table-wide --live low`

| part | meshes | colour | shadow | calls | triangles |
| --- | --- | --- | --- | --- | --- |
| model-staplers | 3 | 3 | 3 | 6 | 6380 |
| model-inbox | 3 | 3 | 2 | 5 | 5308 |
| model-coffee-machine | 3 | 3 | 1 | 4 | 7780 |
| model-cubicles | 3 | 3 | 0 | 3 | 11740 |

Folder: 18 calls, 31208 triangles. Whole frame: 207 draw calls against a limit of 300.

## Decisions

- The mouth of the inbox is in the wall on the side of the hold (west today): the hold `office.inbox` lies west of the box and the kick out goes west. The wall there is a slanted chute, so the framed mouth shows from straight above and from `reply-all`.
- The envelopes do not tip any more. The upper two layers of the heap hop when the ball goes in, shiver while the steel balls pour, and hop lower when the ball is sent on.
- Lift. My models stand far from every lamp of the tier and came out much darker than approved (the cream of the inbox at about rgb(110,100,70)). The solid material of the zone now gives back a share of the tier's own general level, `levels(ctx, zone).general`, stronger on faces that look up, none on metal. It is one number per vertex (`Kit.lift`), costs no draw call and no lamp, and goes dark with the tier. The lights owner is asked for a hidden lamp or spill over the inbox and the cubicles; when there is one the lift comes down.
- The cubicle farm follows the box of the layout: three across and two deep where the box is wider than deep, two across and three deep where it is not (today). No aisle: the approved image has none.
- The walls of the cubicles are 54 px over a 10 px slab, inside the 0.7 balls of the layout, in a warm grey beige (about 0xa69b86) under pale caps. The caps take more of the lift than the cloth, so the tops stand out from the walls. Each cubicle has a band of shade on the carpet at the foot of its walls (`FOOT`), painted in the vertex colours.
- The monitors lean back and their screens glow a little (group `office.windows`), so each cubicle has one mark that reads from straight above. The screens are a dim blue (0.07, 0.11, 0.19): brighter ones read as toy blocks.
- The coffee machine keeps the form the first owner built. It is now bronze enamel with a bright top plate, white cups on the plate, and three small steel panels with small lamps in place of the four large rings.
- The board under `sign.office.coffee` stays where the layout puts the words.
- Loose paper. Three sheets, a folder, two envelopes, two paper clips and a rubber band lie in the right lower corner of the Office (behind `office.inlane.floor.right`, right of `office.shoulder.step.right`, above the display), the mirror of the corner where the cabinet, the bin and the plant stand. `loose()` in `cubicles.ts` gives their places from the lower post of the right stapler's plate, and the test holds each 0.08 balls clear of every segment and post of the tier and off the display. Nothing lies beside the inbox or the coffee machine yet: the hold and the foot opening are there, and the runner has not said where that floor is free.
- One glowing mesh (`office.glow`) and one clear mesh (`office.clear`) for the whole tier, in the root of the cubicles: the screens with the lamps of the coffee machine, the bottles with its tank. Two draw calls fewer than before.
- The sheets carry a few grey rules, not letters. `/root` (04:14 UTC): this is inside rule one.
- Shade in the heap. No lamp of the tier throws a shadow between the envelopes, so each envelope carries one dark flat sheet just under it, pushed 2 by 3 px to one side (`SHADE`). It reads as the shade one envelope lays on the next. Same mesh, no draw call.
- The tray has thicker walls (14 px) and its inner faces darken toward the bed.
- The long highlight of the stapler arms is partly baked: the two shoulder rings of the arm's section are lighter in the vertex colours (`SHEEN`), stronger on one side, and the top of the arm is crowned so the lamps also draw a real one.
- The hop from straight above. A lift of 20 px changes the home camera's picture by less than one part in a hundred, so the two heaps also swell (`HOP.swell`), turn (`HOP.turn`) and slide a little as they hop. The test holds that they come back to rest exactly.
- The chute keeps its slope when the tray grows taller (`CHUTE.tall`).
- The top plate of the coffee machine is brushed mid steel, so the white cups stand out on it.
- Lamps over my models. The lights owner put two high hidden lamps in (merge 22), one over the inbox and one over the cubicles, and widened the Office wide lamps. With them and my old lift the envelopes burnt out (MEASURED on a `draft` still of `tier-office`: the brightest tenth of the inbox at rgb(237,234,222)). All lift now passes through one number, `FILL = 0.45` in `kit.ts`. MEASURED after: the brightest tenth of the inbox at rgb(211,207,193) in `tier-office` and rgb(204,201,189) in `reply-all`; of the cubicles at rgb(188,183,166) and rgb(183,175,160). The lights owner has the numbers and needs no trim.
- The tray follows its box. With the box at 1.15 balls high the body is tall, so it has a foot step all round (`TRAY.step`) and a steel card holder with a blank card on its front (`CARD`). The card carries no words: there are none for it in `content/copy.json`.
- The furniture of a cubicle is drawn for a cell of 82.2 by 66 px and grows or shrinks with the cell of the layout between 0.85 and 1.3 (`FIT`), so a wider or narrower farm stays full.
- The screws of the farm sit on the caps, where the partitions cross the long walls, not on the slab.
- The stapler from straight above. The arm, the base and the plate were three reds that ran together. The arm is now 2.8 px narrower on each side than the steel base, so a steel edge shows on both sides of it, and the base lays a dark band on the plate (`SIDE`).
- The tray is full to its walls. Under the two heaps that hop lies a still layer of 13 envelopes just under the rim (`FILL_LAYER`), in the mesh of the tray, so no bed shows round the heaps from straight above. The test that holds the inbox inside its box caught the first version of it 1.6 px outside, and the spread was taken in.
- The hop was looked at in two `draft` stills of the beat `pinball.replyAll`, at 0.082 (the ball at the hold, the heap at rest) and at 0.098 (the heap larger, turned and pushed aside). It reads from straight above.
- The left lower corner. The cabinet, the bin and the plant stood on a wide black floor. Two sheets, a folder, an envelope and two paper clips now lie round them (`spill()` in `cubicles.ts`, placed from the lower post of the left stapler's plate), inside the floor the runner gave as free (u 4.7 to 6.4, v 8.6 to 10.3). The test holds each 0.08 balls clear of every segment and post and off the three standing things.
- Loose paper lies 0.7 px over the floor at the least: at 0.2 px a tilted sheet cut into the floor at one corner.

## Counts after (MEASURED on d27f182b, with main at b62bc72b)

`npm run build && npm run counts -- --key table-wide --live low` (the rows are the same for `tier-office` and `reply-all`)

| part | meshes | colour | shadow | calls | triangles |
| --- | --- | --- | --- | --- | --- |
| model-staplers | 3 | 3 | 3 | 6 | 7356 |
| model-inbox | 3 | 3 | 2 | 5 | 3313 |
| model-coffee-machine | 1 | 1 | 1 | 2 | 6628 |
| model-cubicles | 3 | 3 | 0 | 3 | 12297 |

Folder: 16 calls (18 before), 29594 triangles (31208 before). Whole frame: `table-wide` 192, `tier-office` 126, `reply-all` 140 draw calls against a limit of 300 (207, 144, 158 before).

## Answers

- `/root/table_runner` (04:10 UTC by its clock): inbox box becomes [15.2, 3.6, 1.55, 1.45] h 1.15, not wider (the lane to the right inlane needs 1.25 balls); the hold stays at (14.6, 4.35), beside the tray. Cubicles box becomes [3.25, 2.25, 3.2, 1.85] h 0.7, drop bank at u 6.45. Free floor: the right lower corner (x 13.6 to 15.3, v 8.6 to 10.3), the left shoulder (u 4.7 to 6.4, v 8.6 to 10.3) and the strips between a wall and its lamp row. Everything between v 4.5 and 8 is ball path. These boxes reach me through `main`.
- `/root/table_runner` (later): the cubicles box becomes [3.25, 2.25, 2.6, 1.85] with the drop bank at u 5.85, on its branch at 3b9bb50d. The farm is still three across there (the box is wider than deep). Not looked at until it is in `main`.
- `/root/lamp_keeper` (04:36 UTC by its clock): two high lamps, power 0.75, follow the boxes of the inbox and the cubicles and the `general` group.
- `/root` (04:14 UTC): the right lower corner of the Office floor is mine.
- One mistake of mine, 04:05 UTC: I tried a local edit of `src/table/layout.ts` to preview the new boxes. The file is frozen for me; the attempt was stopped before it ran and nothing was changed. I do not preview boxes that are not in `main`.

## Asked of others

- `/root/table_runner` (sent 03:50 UTC): inbox box [14.0, 3.6, 2.75, 1.5] h 1.15 with the hold in its front left corner, or at least h 1.15 and 0.3 deeper; cubicles box [3.25, 2.25, 3.2, 2.15] with `cubicles.drop` at about u 6.5; and where the Office floor is free of ball paths for loose paper. Answered, see above.
- `/root/lamp_keeper` (sent 03:50 UTC): a hidden lamp or spill over the inbox (15.2 to 16.75, 3.6 to 4.8) and over the cubicles (3.25 to 5.05, 2.25 to 4.4). Glowing things of mine: the screens of the six monitors and the lamps and display of the coffee machine, both in group `office.windows`.
