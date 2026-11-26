# Decision (step 5): notes of the build agent `decision_maker`

Branch `agent/decision`, looks on `agent/decision-looks`. Parts: `wait`, `letter`, `stamp`, `metrics`, `acting-decision`.

## What the approved image shows that a quick look misses

Read from `references/approved/decision.png` at full size, crop by crop.

1. The letter. The highlight is the sheet itself: it is the brightest surface in the frame, a hair brighter and cooler than the page, with a fine fibre mottle and no gloss at all. The cut edge is crisp, with no deckle to speak of. The gap is a hairline of near black at the right and bottom edge, and outside it a soft shade about 10 to 20 px wide that is gone by 30 px. The lower right corner is lifted by a pixel or two, which only shows as the shade growing wider there.
2. The stamp mark. Two lines, a heavy outer one about 7 px and a fine inner one about 2.5 px, 5 px apart, both with round corners, turned about 8 degrees up at the right. The ink is not flat: the paper's tooth shows through as pin holes, one end is paler where the block rocked off, and the edge is soft by under a pixel. The red is close to #c2332b where the ink is full.
3. The stamp block. The highlight is a broad soft box along the upper left shoulder, never a point, and the top face is a shade darker than the shoulder. The round of the edge is wide, about a quarter of the height. Under the lacquered body is a dark pad with a black gap line above it. The shadow is long and soft and falls to the lower right, darkest at the contact.
4. The metrics panel. A slab of frosted grey green glass with a corner round of 24 px. A thin bright line runs all the way round the rim, the bevel inside it is about 10 to 14 px wide and lighter at the lower right. The three readouts are pillows of the same glass, each with its own bright inner rim and a soft shade inside the upper left edge. The type is dark charcoal, the numerals heavy.
5. The button and the cursor. The button is an orange capsule in a chrome bezel with a dark gap between them, the highlight a soft band along the upper edge. The cursor is white enamel with a dark edge and hairline cracks, and its shadow is soft and short.

## Decisions

- Brief against image, the stamp. The brief says "wooden grip on a block". The approved image shows one lacquered red body, grip and block alike, on a dark pad. The image is what the critics hold the frame against, so the grip and the block are red lacquer and the pad is the shared rubber. The view is straight on from above, as settled. Told to `/root` in the first report.
- The stamp block keeps the size the layout gives it (it must cover the mark and the cursor beside it). The image shows a shorter block seen from the side. Sizes come from the layout, not from an image.
- The mark's word `letter-stamp` is now of part `stamp` in `layout.ts`, so the stamp's maker sets it in red ink with the same cover as the border. Its words still come from `copy:step5.letter.stamp`. The four bar shapes stay in the draw list: the maker draws the whole double border from `letter-mark-top` and answers `''` for the other three.
- The digits of the wait display, `wait-value` and `wait-count`, are now of part `wait`: they are lamps behind the smoked glass, not print on a surface. Their words still come from the copy and from `runtime:step5.waitValue`.
- The glass of the wait panel, the metrics panel and the three readouts is the shared card of `src/shell/real/controls.ts`, called through its exported maker, so the page keeps one glass.
- The contact shade of the letter is painted (a soft ring under the sheet that fades as the sheet leaves the page). A sheet 1 px thick throws no shadow the lamps can resolve. While the sheet falls the lamps' own shadow carries it.
- The lacquer of the stamp is the part's own material through `studio()`: the shared red reads pale and chalky on a face this large.
- The hit of the stamp has four parts, all in `HIT` of `script.ts`: the block draws back and leans for 0.24 s, falls with a rising speed, the rubber gives 1.5 px and the block rocks for about 0.3 s, and paper dust leaves from under its edges for 0.62 s. The times of the page's events are not moved.
- Dust is one more shape, `stamp-dust`, that exists only for 0.62 s after the hit. Its motes are placed by `hash01` from the seed, so a frame is the same on every machine.
- The acting has one word a beat: worried, hope, frozen, beaten. The times are in `PACE`, `HOPE` and `GIVE` of `script.ts`. The stand of 0.9 s at the start is there because the page is still turning in.
- The grip is wider than the first layout gave it (0.54 by 0.6 of the block) and its top is a rounded bar with a 3 px crown, so that the lamps leave a broad highlight on it when it is seen from straight above.
- The sheet in the air read grey beside the page (about 205 against 234 in 8 bit). It now carries a light of its own that grows with its height and is zero when it rests: `AIR` in `letter.ts`.
- The glass of the metrics panel is darker and flatter than in the approved image. It is the shared card, which is not mine to change. Told to `/root`.
