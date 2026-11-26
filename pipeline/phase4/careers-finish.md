# Careers page, finisher, before the unit's second critic round

Branch `agent/careers-finish`, from `origin/main` at 9334a125. Started 11:09 UTC on 2026-11-26. MEASURED before any change: `npm test` 115 files green; `npm run build` green; `npm run bots` "all clear".

## What the approved image shows that a quick look misses (`references/approved/marketing-top.png`, crops at native size and at 3 times)

1. The highlight on a glass card sits on its far edges, the bottom and the right: a rim 2 px wide at 217 to 219, with the face rising 10 toward it and dipping 6 just before it. On the right edge 3 px of lit wall (193 to 205) lie between the rim and the shadow, so the slab reads as thick.
2. The two near edges are not alike. The left one is a dark band 17 px wide (140 to 156) that then rises over 10 px. The top one is a dark line only 5 px wide (135 to 170), then a pale line 2 px wide (182), then a light shade (166 to 175) that is gone at 20 px. A card with the same dark band on both reads as a frame.
3. The gap under a card's far edge is not black: its darkest is 128 (bottom) and 114 (right), 5 to 6 px wide, and it fades over about 17 px. The darkest gap in the picture is under the medal's lower right lobes (44 to 61).
4. The medal's edge is a polished lip: every lobe has a warm bright line along its outer edge, on the far side too, and the lobes on the lit side are as bright as the page (210 to 231). Every leaf of the wreath lies in a dark groove all round it and has a bright rib. The ring is one bright line between two dark ones.
5. The medal's face is lit in a narrow bow: bright only from 120 to 180 degrees (212 to 219) and, weaker, from 300 to 330 (152 to 179); the rest is 85 to 110, darker than the band round it.

## Point 1: the issues of round 7 under `marketing-top` that are still true on main (11:20 UTC, sent to /root)

Looked at: `npm run compare -- --key marketing-top --tier review --format hd` and crops of the cards, the medal and the ticker at native size.

- Severe, R1-1 issue 2 (glass), in part. Closed: the body is pale and cool (card 0 face 184,190,185 against 184,189,183). Still true: "heavy dark bevels" on the top edge, the far edges' shadow a hard dark line, cards 1 and 2 a little brighter than approved. Mine.
- Severe, R1-1 issue 3 (arrow), in part: white with a black edge now, still slimmer and upright, shadow longer. Shared cursor.
- Severe, R1-1 issue 1 (orange): closed in colour and finish; issue 11's "black-and-white chrome ring" still true. Shared look.
- Major, R1-1 issues 4 and 14 (medal): dull sectors too bright, leaves flat, scallops without a lip, shadow long. Mine.
- Major, R1-1 issue 12 (glass crops), as issue 2. Mine.
- Major, R1-1 issues 5 and 15 (type weight). Shared type.
- Major, R1-1 issue 8 (shadows): closed for cards and ticker, still true for the buttons and the medal.
- Minor, issues 9 and 10 (nav links, header rule). Shared.
- Closed by what main holds: issues 6, 7 and 16.
