# Careers page, phase 4

Branch `agent/careers`, from `origin/phase4-base`, with `origin/main` merged in.

## What the approved image shows that a quick look misses

1. Perk card: the highlight is not on the face. It is a thin bright line along the inside of the top and left bevel, and a second thin bright line along the bottom edge where the light leaves the slab. The face itself is an even, pale sea-green grey.
2. Perk card: the bevel is 10 to 12 px wide at 1920, far wider than the slab is high. Under the left and bottom edges there is a dark contact line about 1 px wide, and then a soft shadow that falls down and to the right.
3. Apply button: the cap is not lit evenly. A broad soft box of light lies along its upper edge and the lower third is a darker orange. Round it runs a polished ring about 5 px wide, and between ring and cap a gap about 3 px wide that is almost black.
4. Medallion: about 32 round lobes with sharp valleys on the rim, then a flat band, then a ring with two grooves, then a face brushed in circles with a cone of light across it. About 24 pressed leaves, each with a rib, stand in a wreath well inside the ring. The type is dark and sits in the metal.
5. Ticker: a strip with round ends, the same glass as the cards, words inside it. Its edge shows the same two bright lines as a card, so the glass has real thickness. The brief asks for a window cut into the page with the tape under glass, lit from inside: the window keeps the round ends and the glass, and the tape lies below it.

## Decisions

- The turning perk card is one shape, `perk-i-slab`, built round its middle with both faces ground to the same bevel, so it looks the same from above at rest, shut or open. The two plates `-slab-front` and `-slab-back` are gone. The words and the rule that ride it are named `perk-i-slab-<n>`, so the type maker finds the glass under them and prints them as it does at rest.
- The well under a turning card is dark (`tone: 'dark'`). A seal of grey rubber stays in the mouth of the well while the slab turns and squares the well's corners off to the card's round ones.
- The ticker's window is a pocket with round ends (`ticker-window`, kind `tickerWindow`, 6 deep) that the ground cuts by itself. The rectangular well `ticker-well` is gone. The tape is cut to the same round ends.
- The apply button's cap is built once at its resting height and a press moves it down in `pose`. Its key holds no height, so a press builds nothing.
- Shapes whose shell control is already right for the page (rule, step rail, step buttons, the waiting field, resting cards) are handed to the shell's `controls` maker, so the careers page and the form pages are one family.

- The perk cards have their own glass (`cardGlass()`): the shared `glassCard` of the form pages rendered a grey of about 174, 179, 179 where the approved card face is about 189, 194, 190 and greener. The light and shade of the ground edge (the dark near bevel, the bright line where it meets the face, the bright far edge) are vertex colours of the slab, so the resting and the turning card are the same solid and no texture is needed.
- A ring of the slab further in than the corner's radius keeps square corners. Before that, the rings folded over themselves and the folded triangles cast a bow-tie of shadow on the turning face (seen in the sheet of `marketing.perks` at 2.53 s and 4.70 s).
- The medallion is 356 px (the approved one measures about 351 px at 1920), its middle 52 px left of the right margin's medal place, as in the approved image. Its metal is its own (`medalFace()`, `medalMetal()`), darker than the shared satin aluminium, because the approved face is a mid grey of about 140 with one cone of light and the shared material gave about 205.
- The title on a medal is 31 px on a 190 px measure, so the hero's breaks as in the approved image: "Excellence / in Synergy".
- The acting keeps the film times of Phase 2. One word per beat: stroll "strolling", perks "reading, then caught out", ticker "pleased with itself", apply "takes a run at it".

## Differences between the brief and the kit, told to the Builder

- Ticker: the approved image shows a strip of glass with round ends lying on the page with the words in it. The brief asks for a window cut into the page with the tape running under glass, lit from inside. Built: the window (the brief), with the round ends and the glass of the approved strip.
- Apply button: the cap is the shell's `controls` cap with the shared orange, as the brief asks. In the key still it reads about 175, 90, 60 where the approved cap reads about 213, 99, 41 (MEASURED by pixel reads at x 200, y 444 to 500 of both pictures). The orange is the shared material, not mine to change.

## Textures

None of my own so far. Every surface uses the shared pictures of `materials()`.

## 01:23 UTC, the Builder's answers, and what followed

- STATED by `/root`: the ticker is the glass strip of the approved image ("When words and an approved image disagree, the image wins", `kit/04-LOOK.md` line 10). Built: the cards' slab lying on the page with a corner radius of 16, hollow over a channel 2.4 deep that the tape and its words run in; the page hides the words past the channel's ends, the ground edge of the strip hides the channel's walls. No bezel, no sleeve, no light from inside.
- The strip's corner radius is 16 and not the cards' 28: the strip is 58 high, and with 28 it would be round ended, which the approved strip is not.
- The cards' corner radius goes from 22 to 28, measured on the approved image (about 27 px).
- The turning card has a material of its own, because the colour of the face that is up follows the turn (`even()` in `perk-cards.ts`): a frosted slab is lit through its body, so its face must not flare when it tilts toward the light. Its shadow is thrown by the print in its middle.
- The ground edge is laid in as light and shade of the glass itself (vertex colour), and the faces of the bevel lean very little (0.03), because with the key 21 degrees above the page a lean of 0.12 changed the bevel's light by a sixth and undid the shade.
- A slab's shadow on the page is thrown by a foot 2.2 high inside the glass: the approved cards throw a short soft shadow, and the whole slab (12 high) threw one 30 px long.

## 01:43 UTC, the Builder's second list

- The cards' ground edge is set by numbers read off the approved image (mean of 40 px along each edge of card 0): on the light's side a dark band of about 145 against a face of 200, then a ramp of 14 px up to the face; on the far side the face rises by about 15 toward the edge and ends in a bright line of 221; the shadow on the page is darkest at 4 px (111 to 128) and gone at about 22 px. `GLASS` in `perk-cards.ts` holds them: shade 0.27, after 0.6, exit 1.4, rim 1.8, caster 4.2. MEASURED on my draft still: 152 on the light's side, 204 to 212 on the far side, face 191 against 187.
- The gap between the cards goes from 40 to 34 and the cards are 531 wide, as approved.
- The medal: 380 across (approved 382), centre at 1559, 350; a flat flange cut in 30 round lobes (`flange()` in `careers-solids.ts`) in place of the round rope; the face carries the two bright and two dull sectors of turned metal as vertex colour (`sheen()`), 0.45 deep; the wreath is 12 leaves a side in the face's darker metal. The measure M4 sets the limit: with the face at 0x7e8183 and a sheen of 0.55 the type on the medals read 4.0 against 4.5; at 0x8a8d8f and 0.45 the least contrast of the unit is 4.69.
- The nav button stays the shell's button, 72 high. I made it 58 high as approved has it, and M9 failed ("nav-cta-cap: its height on the page: [58] against 72 within 2"), so I took it back. A smaller nav button needs a size of its own in `config/` and in the measure, which are the Builder's.
- The fine print on the cards asks for `ink: 'soft'`.
- The ticker's runs are cut 18 px in from the strip's ends (`TICKER.clip`), inside the hollow, so the 2 px box of a run that crosses an end lies where the words are seen; M4 read 1.17 for a run whose box lay under the ground edge.

## 02:05 UTC (Builder's clock)

- The well under a turning card is now the page's own ceramic (`tone: 'page'`), not `dark`. MEASURED by eye on the sheet of `marketing.perks` (samples 2.53 s and 4.70 s) and on stills at 0.06 and 0.088 of the beat: the dark well read as a black hole under the card, the darkest thing on the page; in ceramic it reads as a tray routed into the page with the slab's shadow in it. This replaces the line "The well under a turning card is dark" above.
- The words of a perk card sit lower, by the approved image: side margin 36, the open title 46 below the card's top, the promise 30 below the title. MEASURED beside approved (`references/approved/marketing-top.png`, crop 100 to 1300 by 600 to 1080): title, promise, rule and fine print now lie within about 4 px of the approved lines.
- The acting, by recipe 5 (`script.ts`, `tests/careers-acting.test.ts`). Decisions: the double take is a step back (42 right, 34 down) held from 2.76 to 3.4 with the `shocked` state lasting 0.8 s, then `proud` in its corner from 3.56 to 4.0; the admiring stand on the last card is 8.0 to 8.95 so the dust off (0.9 s) ends before the walk; the cursor is at its stand from 10.4, 0.6 s before the key; the crouch is cued at 11.02 and the bound back at 11.38, so the two do not overlap (before, `jump` at 11.2 cut into `anticipate` from 11.0). MEASURED (`npx vitest run tests/careers-acting.test.ts`): `card-flip` at steps 505, 1034, 1522 and `button-press` at step 3065, the same steps as before the change.
- The face of a turning slab that is turned from the light: `GLASS.most` 2 to 4.4. MEASURED by eye on the still at 0.45 of `marketing.perks`: the under face read about 95 against 190 at rest and looked like a black plate; it now reads as grey glass turned from the light.

## 02:15 UTC, the Builder's answers and what followed

- The well under a turning card stays `tone: 'page'` (agreed by the Builder at 02:15Z).
- The exports `cardGlass`, `slabGeometry`, `groundEdge`, `SLAB`, `GLASS` of `real/perk-cards.ts` are held stable: `decision_maker` imports them.
- The ticker never shows a cut run. The ends of the strip are frosted through (`frosted()` in `real/ticker.ts`: the tape's own stuff over the words, alpha by vertex, solid at the end and thinning to nothing over `TICKER.gap` less 6 px), and at the key's moment the tape is set so that the whole items that fit lie centred in the clear middle (`leadOf()` in `index.ts`). The frost reaches to one gap before the first whole item, so its neighbours are under it. The tape's type is the regular weight at 20 px and the gap is 40, by the approved image. MEASURED by eye on the key still beside approved: four whole items, none cut, the same four as approved.
- The medal, nearer approved: the wreath stands further out (119) with smaller leaves (27 by 11.5, 2.6 high) in the face's own metal, so the words have room and the leaves are raised and catch the light; the lobes are 12 deep. A medal whose title takes three lines wraps its second run at 170 so it stays clear of the wreath (seen at scroll 0.25: "Quarterly Internal Survey" ran under the leaves).

## 02:35 UTC, the glass and the badge photograph

- The glass carries a faint frost: the shared page grain as its normal map at 0.024 (`GLASS.grain`). MEASURED by eye on the key still: at 0.07 the face read as pebbled plastic, at 0.024 it breaks the flat face a little as the approved glass does. No texture of my own.
- The blacked out photograph on a staff badge is a glossy print (roughness 0.66, a thin clear coat), colour 0x232527: it now takes a little of the studio's light, a different amount on each card of the row, where it was the same flat near black square six times.
