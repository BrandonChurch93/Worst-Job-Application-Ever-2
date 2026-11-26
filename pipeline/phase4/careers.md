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
