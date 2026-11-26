# Decision, the fix round after round 8

Branch `agent/decision-fix`. Pictures in `looks/decision-fix/` of branch `agent/decision-fix-looks`.

## What the approved image shows that a quick look misses

1. Highlight: the glass has no broad glare. Its light is a thin bright line along the top and left lips and a second thin line inside each readout's rim; the faces between are even, blue-green, and a little darker than the page.
2. Bevel width: the lip of the panel is about 14 px wide at 1920 and rounded, and the lip of a readout about 9 px. Neither is a sharp chamfer; both roll from the bright line into the body.
3. Gap darkness: between the cover and the readout faces there is a narrow dark seam on the lower and right inner walls only, far lighter than ink. The gap between the stamp's rubber and the page is the darkest thing on the page after the type.
4. Edge: the letter has a clean bright upper and left edge with no grey line round it, and its only shade is a warm soft one under the lower right corner. The stamp's block has a worn darker line along the bottom of its red wall, not a metal collar.
5. Places: the top of the letter and the top of the panel are one line. The mark sits low in the letter's right corner, the stamp lies under the middle of the glass, and the cursor stands right of it, a little below the stamp's middle.

## Decisions

- The sheet lies square (`SHEET_ROT = 0`). The turn of 0.012 rad put its top edge off the panel's line and its paragraphs off one left edge; both are asked for (11, 12).
- The wait panel has its own top, 52 px under the two columns, and keeps its height (`WAIT`). No new word or control.
- The columns are 560 tall, so the button's middle is at y 952 and the link's at 1036. The underline is flat printed ink 3 px under the link's words, made by `metrics.ts` (role `underline`); it was a metal rule with height and so threw a shade.
- Seen from straight above a fall has no travel across the picture: at a camera distance of about 3060 px a rise of 150 px grows the block by 5 %. So the block is drawn larger the higher it is (`HIT.grow`, 38 % at 150 px), and it hangs up and left of the mark (`HIT.back`), on the side the light comes from, so that the fall has travel in the picture in every frame and its shadow is on the letter's corner and on the arrow before it.
- The stamp's times are whole frames of 30 a second (`timeline.ts`): in 4.57 to 4.87, hang to 5.30 with the draw-back in its last 0.24 s, fall 5.30 to 5.43 (four frames), contact at 5.433, rebound in the next frame, held to 5.70, lifted straight up to 5.97, carried to 6.40, set down by 6.63. The stamp's motion now runs past the end of the letter's beat (6.0); the event `stamp` is inside it.
- The arrow is struck with its tip under the block's lower edge, so its stem is in sight outside the edge. `STUCK` stays in this form: the arrow rises and travels with its tip under the rubber and its stem out, comes off as the block slows, flies on to the right and lands flat beside the block (6.50). If the sheet does not show this to a stranger it goes back to flat on the letter; see the report.
- The peel is its own action after the panel has filled and the button has risen, with nothing else moving (7.16 to 7.53): the key picture at 7.2 must hold the flat arrow and the counted figures, so the peel cannot come before the figures.
- The acting states are set by the page in both modes (nervous, shocked at the sheet's fall, proud at 3.5, scared with `rear` at the shadow, exhausted after the peel); the film adds the flinch, the held tilt, the dusting, the look at the button and the strike.

## Looks spent (40 a part)

