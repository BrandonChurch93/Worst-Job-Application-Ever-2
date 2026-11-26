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

## Textures

None of my own so far. Every surface uses the shared pictures of `materials()`.
