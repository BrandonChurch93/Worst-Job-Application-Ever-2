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
- The arrow is struck with its tip under the block's lower edge, so its stem is in sight outside the edge. It rises and travels with its tip under the rubber and its stem out (`STUCK`); how it leaves the block is set out below.
- The peel is its own action after the panel has filled and the button has risen, with nothing else moving (7.16 to 7.53): the key picture at 7.2 must hold the flat arrow and the counted figures, so the peel cannot come before the figures.
- The acting states are set by the page in both modes (nervous, shocked at the sheet's fall, proud at 3.5, scared with `rear` at the shadow, exhausted after the peel); the film adds the flinch, the held tilt, the dusting, the look at the button and the strike.

- After the Builder's note of 06:34: the carried arrow stays, and the release is the event. Over its place the block gives one sharp shake (`AT.shake`, frames 128 to 133 of the letter's phase); in the middle of it the flat arrow is thrown clear of the block's edge (`STUCK.off`), the block is set down (133 to 140), and the arrow comes down after it over 15 frames with two and a half sways, its own soft shade apart from it on the page and closing on it (`fallShade` in `stamp.ts`, a plain overlay as the dust is), then skids 18 px and lies still (frame 152, 7.07 s). The key at 7.2 holds it flat at the approved place.
- The cursor is not drawn larger while it is in the air: its size never changes. What the camera gives at 150 px of height is about 5 %.
- The rebound is three frames (`HIT.rebound` 20 px over 0.1 s) and the letter's far corners lift 13 to 15 px over 0.14 s.
- The block's width at rest is the mark's width plus 4 px, the least a block can be that printed the mark. Approved's block is narrower than its own mark (0.155 against 0.2 of the picture's width), so the block here stays about a third wider than approved's; its middle is at approved's place. The mark is set in 68 px (was 62) and is as wide as approved's.
- Ink: a dense red (0xc2241c) with fine dry speckle and paper flecks, no large pale patches; the frame is a line of 8 px and a line of 2.6 px. This took the measure of fine detail (M3) from 0.7647 to 0.8051.
- The readout lips and the panel paint carry the glass picture's coordinates, so M2 reads 0 soft pixels.
- The flat arrow's spread is the cursor's (`FLAT.wide` in `src/cursor/model/deform.ts`): `decision-fix-NEEDS.patch` holds the one line, not run.
- The second hurt at the landing lasts 0.78 s, so the film's look at the button is at 7.88 and the walk 8.29 to 8.9.

## Looks spent (40 a part)

Counted as renders looked at for tuning, a sheet or a montage as one.

- stamp (hit, lift, release, block, ink): 17
- letter (paper shade, corners, places): 6
- metrics (glass paint, lips, readout type, underline): 7
- wait (panel place, counter glare): 2
- acting-decision (beat sheets): 3
