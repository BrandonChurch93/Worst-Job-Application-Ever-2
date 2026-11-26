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
- The walls of the cubicles are lower (47 px over a 10 px slab) so the desks show from the play camera.
- The monitors lean back and their screens glow a little (group `office.windows`), so each cubicle has one mark that reads from straight above.
- The coffee machine keeps the form the first owner built. It is now bronze enamel with a bright top plate, white cups on the plate, and three small steel panels with small lamps in place of the four large rings.
- The board under `sign.office.coffee` stays where the layout puts the words.

## Asked of others

- `/root/table_runner` (not started when asked; sent through `/root`): a larger box for the inbox and the cubicles, and where the Office floor is free of ball paths for loose paper.
- Lights owner: a hidden lamp or spill over the inbox (15.2 to 16.75, 3.6 to 4.8) and over the cubicles (3.25 to 5.05, 2.25 to 4.4). Glowing things of mine: the screens of the six monitors and the lamps and display of the coffee machine, both in group `office.windows`.
