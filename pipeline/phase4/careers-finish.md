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

## Point 2: M3 on `marketing-top`

Command: `npm run -s measure -- --unit marketing --only M3 --tier review`. MEASURED before any change (9334a125): 0.7854. After the medal and the glass, MEASURED at 11:45 UTC with `npm run -s measure -- --unit marketing --only M2,M3,M4 --tier review`: M3 0.8011 (least allowed 0.8), M2 largest soft share 0.0001, M4 least contrast 4.61 (least 4.5). There is no margin in M3 from my parts alone; `/root/look_finisher` reports 0.8309 for the darker ink on its own branch (STATED).

Where the gap was, by region of the picture (my own script on the same measure, the mean square Laplacian of luminance against the approved image; whole picture: approved 19614, mine 15405 at the start): the type is about two thirds of it (headline, the nav, the ticker's words, the cards' titles and promises, the medal's words), the medal's leaves and its lip most of the rest, the cards' edges a little. The type's ink is a shared look, not mine: I sent the numbers to `/root/look_finisher` and did not touch it.

What was added, each a thing the approved image holds:

- Medal, the leaves: each leaf is pressed with a dark groove all round it and a rib along it (`leaf()` and `pressed()` of `careers-solids.ts`, `MEDAL_LOOK.pressed`).
- Medal, the lobes: a polished lip along the outer edge of every lobe, bright on the far side too (`MEDAL_LOOK.lip`), and the ring round the face has its ridge and its groove (`ridge`, `groove`).
- Medal, the face: the bow of light is narrower (`axis`, `narrow`), so the dull sectors are darker than the band round them. The face under the words stays where M4 needs it (`rim: 1.02, cap: 0.26, capFrom: 0.6`): with `rim: 0.94, cap: 0.3` M4 fell to 4.44 on `copy:marketing.awards.items.1.from` and I put it back.
- Glass, the top edge: its own table (`NEAR_TOP`): a dark line 5 px wide, a pale line, then a light shade, where the left edge keeps its wide dark band. `edgeLight` took a fourth argument for it.
- Glass, the far edges: the wall on the far side is lit and turned up (`GLASS.wall`, `wallUp`), so the hard dark line is gone; the gap under them is lighter and fades further (`SPILL.rings`). This cost M3 about 0.007 and is kept because it is what the approved image shows.

Not done to raise the number: nothing was added that the approved image does not hold. No noise, no sharpening, no grain.

## Point 3: the issues of R1 still true, mine

- R1-1 issues 4 and 14 (medal): leaves flat, scallops without a lip, dull sectors too bright: worked, crops `pair-medal.jpg` (approved, before, after) in the looks branch. Still true after: the bow's two edges are harder than the approved image's; my leaves are a little larger and darker in outline than the approved ones; the shadow's length is the kit's and stays.
- R1-1 issues 2 and 12 (glass): heavy top bevel, hard dark line under the far edges: worked, crop `pair-glass.jpg`. Edge profiles of the first card against the approved image (luminance, 1 px steps, outward): top edge mine 236,182,151,144,136,139,162,177,184,174,166 against 226,170,151,150,135,149,182,183,175,171,166. Still true after: the approved image has a brighter thin rim along the left edge than mine.
- The bow of light on the medal ended on two hard edges (about 1 and 7 o'clock): the dull side of `sheen()` now starts from the bow with no step (`c * (2 + c)`). MEASURED after: M3 0.8014, M4 4.61.
- Cards 1 and 2 a little bright against the approved: worked (`FALL`, `fallAt`, `darker` of `perk-cards.ts`). The glass's colour falls evenly with the page's x, in the resting slab and in the turning one alike, so a card does not change as it starts to turn (looked at on the sheet of `marketing.perks`). Face colours, approved against mine, lower part of each card: 179.5,184.9,180.5 against 180.3,186.3,181.3; 165.6,172.4,167.6 against 167.7,173.7,168.9; 147.5,155.5,150.6 against 148.7,154.1,149.8 (before: 182,188,183; 174,181,176; 160,165,161).
  What it costs: the type on darker glass has less contrast, and M3 is mostly type. MEASURED on this branch alone: M3 0.7857 (red), M4 4.61. MEASURED on a trial merge of `origin/agent/look-finish` at 979389dd (the darker ink), not committed: M3 0.8177, M4 4.62, M2 0.0001. So this commit needs the shared ink to be on main with it.
- The medal's flange (the flat band outside the body) was near white on the side away from the light; the approved band is mid grey there with one thin bright lip. Worked (`polished()`, `MEDAL_LOOK.flat`, `MEDAL_LOOK.ridge` as a pair, the lip's window narrowed, a second thin lip at the top of the rim). The band by twelve sectors of 30 degrees, luminance, approved against mine: 109 100 105 122 183 189 123 99 93 112 135 147 against 111 97 108 142 193 155 112 94 99 132 152 145 (before: 132 110 114 140 184 151 116 106 121 162 190 176). MEASURED after, `npm run -s measure -- --unit marketing --only M2,M3,M4 --tier review`, this branch alone: M3 0.7941, M4 4.61, M2 0.0001. Still true after: the approved flange is darker yet and has a warm edge; the sector at 150 degrees is 34 levels under.
- The far edges of the cards (asked by /root at 12:16Z): the approved card has a short bright bow in the corner turned away from the light, and a far rim about 2 px wide; mine had a rim of 1 px and no bow. Worked (`GLASS.spark`, `GLASS.sparkAt`, the first rows of `FAR`). First try put the bow 14 px in, where the corner's rings have closed to a point, and it showed as a round spot; at 8.6 px in it is a bow as in the approved image. Bottom edge of card 0, outward, approved against mine at the rim: 206 217 219 165 against 200 214 227 195. Still true after: the approved wall beyond the rim is a warm band about 3 px wide, mine about 2 px and cooler. `slabGeometry` is shared with the Decision page: /root told.
- Tried and withdrawn: the same fall on the ticker's tape, frost and rim. The right end of the strip came to 136,140,136 against approved 132,137,131 (146,150,146 without), but M4 fell to 3.92 on `copy:marketing.ticker.4`, a run under the frost at the right end. The ticker is as it was.

## Point 4: the acting, read from the four sheets as a stranger would (draft tier, 11:30 UTC)

- `marketing.stroll`: "an arrow comes down the left margin and walks along under the first card". Reads as a walk in; fine.
- `marketing.perks`: "the arrow stands under each card, the card turns over, at the first it leans away, then it goes on". Reads as the kit says.
- `marketing.ticker`: "the arrow stands under the third card, then runs up across that card to the button". The least like the kit: it crossed the open card. Fixed.
- `marketing.apply`: "the arrow stands by the button, hops on it, the button goes down, the page tips over". Reads as the kit says.

The fix: from under the third card it goes round it (`ROUND` of `script.ts`, `marks.round` of `index.ts`): a step aside to the right margin, up the margin, along above the cards to the lane, then to the stand as before. `VISITS[2].leave` went from 8.9 to 8.86 and the stand by the button from 10.4 to 10.44, both inside what `tests/careers-acting.test.ts` holds (I added `round` to that test's marks, nothing else). `tests/careers-finish.test.ts` holds that the tip is never inside a card nor on the medal on that walk. MEASURED in that test: the tip's least distance from the third card is 22 px beside it (with `round` 40 px out; it is now 50) and 41 px above it. No event of the film moved: card-flip 498, 1180, 1684, button-press 3007.

## Point 5: the cards' glass without its type at 2:31.70

Not reproduced. MEASURED on this branch at 11:36 and 11:45 UTC: `npm run sheet -- --beat decision.reset --tier draft` shows the titles and promises on the three cards in the frame at 2:31.70 (frame 9102) and in the frames on each side; and a run of every frame from 9084 to 9116 in one session (`window.showcase.renderFilmFrame`, draft tier, my script) counts the dark pixels of the first and second cards' titles in each frame: from 9086 on never under 324 and 501, so no frame of that run lacks them. The page's draw list holds the texts at every step (STATED by the owner before me, and `states()` of `index.ts` gives `shut` or `open` for every card that is not turning). So the cause is not in my files as far as I can find; whether it was a thing of the build before, or comes only now and then when a frame is rendered after a jump, is UNKNOWN.

## Decisions

- The ink of the type, the weight of the type and the header's rule are left to the shared look; numbers sent to `/root/look_finisher`.
- The far wall of the glass was made lighter though it cost M3: the approved image comes first.
- The walk round the card takes the right margin, since the gap between two cards (34 px) is narrower than the arrow.
- No new texture: `assets-src/careers-finish/RECIPE.md` says so.
- One merge commit of mine, 767f46bb, was made without the trailer by mistake (a plain `git merge origin/main`) and was pushed before I saw it. It is not rewritten. Every commit after it carries the trailer.

## Looks, counted by part

- `careers-page` (medal): 3 draft stills, 11 review stills.
- `perk-cards` (glass): 9 review stills, 1 sheet of `marketing.perks` for the turning card.
- `ticker`: 1 review still (the fall, withdrawn).
- `acting-marketing`: 5 sheets (the four beats, and the ticker again after the fix).
- Judged stills looked at once each at draft, `marketing-perks` and `marketing-proof`: 2.
- Not of a part: 1 compare before, 2 compares after, 1 sheet of `decision.reset`, 1 run of 33 film frames for point 5.
