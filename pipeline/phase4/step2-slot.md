# Step 2: the slot machine and the crank

Owner: step2-slot. Branch `agent/step2-slot`. Files: `src/pages/step2/real/slot*.ts`, `crank*.ts`, `tests/step2-slot*.test.ts`, `assets-src/step2-slot/`.

## What the approved images show that a quick look misses

Read from `references/approved/step2-crank.png` and `machines.png` at full size, in crops of the crank, the meter and the cabinet.

1. Highlight. On the crank's bezel and hub the light is not a spot: it is a narrow bow tie through the centre, the mark of a face turned on a lathe. On the grip it is a soft band along the upper left long edge. On the reels it is a broad band across the middle that falls to dark grey toward the top and the bottom of the window, which is what makes them drums and not cards.
2. Bevel. The bezel's rim is a polished chamfer about 3 px wide on a 55 px radius, brighter than the face. The hub's chamfer is about 2 px. The arm's edges are under 1.5 px and only the upper left one is bright. The cabinet's frame is about 26 px wide and has two steps: a flat brushed outer face, then a slope down to the glass.
3. Gap. The hub sits in a dark ring about 2 px wide, near 0x2a, never black. The screws are dark crosses in countersunk heads. Between the reels the gap is about 10 px of near black brown, and the window is dark for 6 to 8 px inside the frame before the drum begins.
4. Edge. An unlit meter pill is clear glass: a light line about 2 px wide all round its rim and a darker core, standing on a short shadow to the lower right. A lit pill is yellow white at its centre line and falls to orange at the rim, and it spills orange light about 15 px over the tray. The bezel's lower right rim picks up orange from the grip.
5. The lever. Its arm is a round polished rod with one bent elbow coming out of a block on the cabinet's side, not a flat bar. The knob is a matt orange ball with a broad soft highlight to the upper left, and its shadow is the longest and softest in the picture. An orange hairline crosses the three reels at their middle, with a small pin in each gap.

## Decisions

1. Kit file `slot-kit.ts` holds what both parts use: `lathe`, `loft`, `fuse`, `picture`, `normalsFrom`, `rise`.
2. A machine rises by its height: every object is built at its full height and its z is scaled by the share of the height the page sends. Below 2% it is hidden and throws nothing.
3. The crank's arm is wider at the hub than the page's capsule (21 against 16 px) and tapers to 16 at the grip, because a forged crank arm has an eye round its shaft. Its length and its place are the page's.
4. Meter segments are 9.5 px tall and not the 20 px the page gives (lit: 11.4 and not 26). At 20 px a pill throws a shadow longer than the gap to its neighbour and the row reads as a fence. The approved image shows shallow glass. The floor and the footprint are the page's.
5. The meter's light: at most 4 lamps, never a shadow lamp. The lit segments are split in up to 4 groups and the middle segment of each group gives the group's light, with the power of all its segments. Ten lit segments cost 4 of the 6 lamps.
6. The cabinet's frame stands 12 px higher than the page says (top at 50 and not 38). The page puts the legends at 44, above its own cabinet, and a window with real glass needs the frame and the glass above what is read through it: drum crest at 42, pay line at 42.75, legend at 44 (the type maker's, untouched), glass at 46.2, frame at 50. Asked of the dial maker: nothing has to change for this to work. If the cursor is ever seen to cut the frame, `slot-cabinet` should go to `TOP + 20`.
7. `slot-window` and `slot-reel-0..2` answer `''`: the cabinet's object draws the well, the drums, the pay line and the glass. `coin-N` answers `''`: the payout's object draws all coins as one instanced mesh, read from `ctx.list` by the payout's own tag, so the sheet's coins and the page's never mix.
8. The legends stay with the type maker, flat at 44. The drum under them has a radius of 62 px, so a legend 31 px off the middle floats 8 px above the drum. Under glass and seen from above it is not seen as floating.
9. The drums are lit as things in a deep well and not by the key: their shade toward the top and the bottom is painted in vertex colours, their normals are flattened to 40% up the page, and they throw no shadow (they take the frame's). With true normals the key at its low angle left the lower third black with a slanted edge.
10. The lever. The page moves the knob 96 px down toward a fixed pivot and keeps its height, which no rigid lever can do. It is built as a rod that slides through a swivelling barrel in the mount: the rod runs from the barrel (height 28) to under the ball (height 52) and is as long as the page's capsule needs. Seen from above it reads as a lever swinging toward the eye.
11. The knob is a ball 44 px across pressed to 28 px high: the page's heights, so the cursor that holds it stays on top of it.
12. A coin tumbles by its own numbers: the lean is `sin(1.3 rot + 2.4 n + 0.045 z)` times 1.05 rad, times how far it is off the page (full at 14 px). On the page it lies flat. A leaning coin is lifted so its low edge never goes under the height the page gives.
13. The glass is drawn after the type (`userData.order` 800000, the sheen 800001), below the overlays and the cursor.
14. Gold for the coins. It is the one colour outside the page's grey, white and orange, and it is on screen only for the two seconds of the payout.
