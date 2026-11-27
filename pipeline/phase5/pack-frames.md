# The packs' close sheets (agent/pack-frames)

Branch `agent/pack-frames`, from `b3e4f90220158fe00becaa34a91ff4ab2f9d0048`. Files: `tools/lib/pack-site.mjs`, `tests/pack-site.test.ts`, `tests/fix-packs.test.ts`, `tests/pack-frames.test.ts`, and my own scripts `pipeline/phase5/pack-frames-*.mjs` with the recorded rows `pipeline/phase5/pack-frames-rows.json`.

Each fact is MEASURED (command and number), STATED (read in a file) or UNKNOWN.

## How it was (STATED, from `tools/lib/pack-site.mjs` at b3e4f902)

The plan laid the turn and the seat at 1/30 s on whole frames at 24%, the take and the give back at every frame of 60 in a window at 50 to 62%, the key at every frame in a window at 100% drawn at one device pixel of the 960x540 window (so "100%" was two page pixels to one drawn), the drop on the flippers' sheets at 50%, the blow's close sheet in a window fixed on the blow, the save in a window fixed by numbers.

## Decisions

1. 100% means one pixel of the sheet is one pixel of the 1920 by 1080 page. The close runs are drawn in a second replay of the same visit at 2 device pixels a point of the 960x540 window. MEASURED, `node pipeline/phase5/pack-frames-same.mjs /tmp/same`: the first page at rest drawn in the 960x540 window at 2 and in a 1920x1080 window at 1 differ by mean 0.000, greatest 0 of 255 (the same picture). Each close heading says the words in `FULL_WORDS`.
2. Where a run does not fit a sheet at 100%, a sheet holds fewer frames; nothing is scaled and nothing is left out. Seat 6 frames a sheet (4 sheets), take 12 (3), key 12 (2), give back 12 (4), drop 8 (4), blow close 6 (2), save 12 (3).
3. Four sets, each a whole a critic can judge alone: A the pages (walk, turn, seat, hit: 9 files), B the arrow (key, take, give back: 9), C the port (flippers, drop: 6), D the bats (save, flip, close blow: 7). 31 sheets. The Builder's count was A 8, B 10; the seat at 176 px tall is 4 sheets and the key 2, so A 9, B 9. A set is never cut inside a run (`uncut`).
4. The hand's motion is shown one way on every sheet where the critic must tell it from the page's: the mark `M` under a frame in which the visitor moved the mouse since the frame before (turn, seat, key, take, give back). Legend in `MOVE_WORDS`.
5. The seat, close: `SEAT = { before 6, after 14, strip 176, tray [780, 290, 290, 176] }`. Two windows side by side in each frame: the page's head from x 818 to the right edge 1920, y 0 to 176 (the whole step row x 1028 to 1792 and the rule at y 162), and the tray's corner 290 by 176 at x 780, y 290 (the Builder's numbers). 1102 + 8 + 290 = 1400 px. The mark "contact" stands under the step at which the stage seats the page: the new page's first row plus `TURNS.seat` (18). The heading says nothing of the knock's sizes.
6. The take: `TAKEN = { before 6, after 6, rest 1, moves 5, room 40, holder 34, edge 10 }`. From 6 frames before the take (the gag `step1.tug`) to 6 after the arrow arrives: the first step, after it has moved 5 px or more in a step, at which it moves under 1 px. The window is the box of the arrow's places with 40 px round them, the paper over the slot, its holder and the tray's lower right corner with 10 px beyond; it fits a tile of twelve (461 by 278) at 100% in this run. `P` under each frame from the take on.
7. The key: `KEYS = { before 3, after 8, mark 'down', rest 6, spent 78 }`. The visitor stays where it is `rest` steps after it lets a key of the page's keyboard go. The sheet takes the first press whose frames begin `spent` steps or more after the turrets stop (the page goes on to the last name, where `advance()` calls `turrets.retract()`, STATED from `src/pages/step1/index.ts`; or the third bolt hit, which overheats them); 78 steps is the time a bolt at 1500 px a second needs across the page's width. If there is none, the first press, and the heading says "the turrets may fire in these frames". A bolt that misses the arrow is not in the rows (`told().hits` holds hits on the arrow only), so "no bolt lands on that key" can be known only this way.
8. The give back: no change outside my files. `P` under each frame while the page holds the arrow, "follows" under the first frame in which the arrow follows the pointer again (found from the rows: the arrow moves, stands 3 to 60 steps, moves again). The page's release (row 2581 of the old visit, MEASURED by r24_fix_tug) is not in the rows the site tells; the sheet marks the first following frame and the heading carries the page's design in the Builder's words. 7 heading lines, tile 461 by 272.
9. The drop: `DROP = { before 6, after 24, tube 170 }`, hung on the step at which the ball first moves (`moments.leaves`). Window 344 by 594: the collar's ring (330 px), the cup and 170 px of tube under the ring in every frame, with each row's scroll.
10. The close blow: `BLOW.room 8`; the window is the box of the ball (96 px) in every frame of the run with 8 px round it, 461 by 594, 6 frames a sheet.
11. The save: `GATE = { under 20, hole 11.05, wire 8, room 8 }`, `gateWindow()`. The window is laid from the rows: the wire's lowest place in each frame (the mouth's line, or the foot of the ball while it lies in the mouth), 20 px under it if the page's picture goes that far, the posts at the mouth's two sides, both bats' tips. On today's view the page's picture ends at the wire, and the heading says how many px are under it.

## MEASURED

- `npm test` on b3e4f902: 159 files passed, 3 skipped; 1939 tests passed, 3 skipped.
- `node pipeline/phase5/pack-whole-walk.mjs /tmp/run2.json` (the visitor with `KEYS.rest 6`): finished, 10795 steps, 179.92 s, 37 gags, 29 hits, problems 0. 13 presses on the keyboard.
- `node pipeline/phase5/pack-frames-gap.mjs /tmp/sheets/cache 2 $(seq 639 650)`: the dark gap over the page's upper edge 152, 126, 99, 71, 44, 19 px on steps 639 to 644, 0 on 645 (marked "contact"), 0, 0, then 11, 17, 12 px on 648 to 650, 0 on 651, 3 and 3 px on 652 and 653, 0 on 654 to 659. The same numbers r24_fix_hand measured. They are not in the heading: a heading is built from the rows, and the rows do not hold them.
- `npx vitest run tests/pack-frames.test.ts tests/pack-site.test.ts tests/fix-packs.test.ts tests/pack-whole.test.ts`: 4 files, 80 tests passed.

## Scripts

- `pack-frames-look.mjs`: pictures of given steps of a walk at 2 px a point.
- `pack-frames-same.mjs`: the same page drawn both ways, and their difference.
- `pack-frames-gap.mjs`: the height of the dark gap over the page's edge in a row of pictures.
- `pack-frames-sheets.mjs`: the sheets of chosen moments only, from a walk's rows.
- `pack-frames-rows.mjs`: the rows the motion plan reads, cut from a walk, for `tests/pack-frames.test.ts`.
