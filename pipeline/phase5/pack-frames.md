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
11. The save: `GATE = { under 20, hole 11.05, wire 8, room 8 }`, `gateWindow()`. The window is laid from the rows: the wire's lowest place in each frame (the mouth's line, or the foot of the ball while it lies in the mouth), 20 px under it if the page's picture goes that far, the posts at the mouth's two sides, both bats' tips. On today's view the ball's foot at its lowest lies on the foot of the page's picture (the rows: 1080.3 of 1080) and the wire that leans on the ball is out of the picture; the heading says so (`gateWords`). MEASURED on the picture of step 6798, the gate at rest: the wire's two rails lie on rows 1062 to 1067, its line by the layout at 1060.8, so `wire` 8 holds them.

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

## The round 24 pack on 2bacfab4 (src = b3e4f902), what the sheets show

`npm run -s pack -- --phase 5 --round 24 --unit site --role R4`: exit 0, 08:33:31 to 09:08:21 UTC. 31 sheets, sets A 9, B 9, C 6, D 7; limitTook, leftOut and missing empty. Every sheet seen whole (my viewer shows a 1400 px sheet at about 80%); real-size cuts where said.

- A-01 walk: twelve whole frames at 24%, the arrow crosses the cards.
- A-02 to A-04 turn: M under 0:09.93 to 0:10.13, none after; the old page swings away, the new page stands on its edge at 0:10.47 and closes; A-04 has no M and its heading says the visitor does not move the mouse and the page's arrow moves from 0:10.97.
- A-05 to A-08 seat, close (real-size cuts of A-05 frames 3 to 6 and A-06 frames 1 to 6): the dark gap over the page's upper edge shrinks frame by frame; "contact" stands under 0:10.75 and that frame has no gap; the five knobs and the rule under them are whole in each frame; the right edge slants in on 0:10.80 to 0:10.83. The tray corner beside it: MEASURED on the pictures (mean grey right of the tray's edge, x 946 to 986, y 340 to 440 of the page): 229 to 230 on steps 641 to 644, 218 on 645 (contact), 211 to 218 across the strip on 646 and 647, 220 to 227 on 648, 229 and 227 on 649 and 650, 217 to 222 from 651, 218 at rest from 654.
- A-09 hit: the bolt hits the arrow on the key G at 0:14.98, 50%.
- B-01, B-02 key (real-size cut): key O; "down" under 0:22.17 to 0:22.35; the key sinks, then leaps away from the arrow; no turret and no bolt in any frame (a round shut hatch stands right of the keys); M under the frames while the button is held (the hand trembles a few px) and none under the six frames after the release.
- B-03 to B-05 take (real-size cut): P from 0:31.40; the arrow at the button, both arms growing to the paper, the paper bends and leaves the slot, the arrow goes after it; holder and tray corner in every frame. The button's left end is cut by the window.
- B-06 to B-09 give back (real-size cut): P to 0:44.03, "follows" under 0:44.05, M under every frame from 0:43.68.
- C-01, C-02 flippers, 50%: the arrow goes into the cup and the ball closes round it; the ball leaves the port.
- C-03 to C-06 drop (real-size cut): the collar's ring, the cup and the tube with two bands whole in every frame; the ball still to 1:39.20, moving from 1:39.22.
- D-01 to D-03 save (real-size cut): both bats' tips, the posts and the wire; the ball's foot touches the picture's lower edge at 1:53.48.
- D-04, D-05 flip, 27%: L under 2:06.33 to 2:06.47.
- D-06, D-07 close blow (real-size cut): the ball whole in all twelve frames; the bat is down on 2:06.32 and up on 2:06.33.

Faults of this build's headings, mended after it: the take said the arrow "has come to rest (0:31.78, from where it moves under 1 px a frame)", the rows hold 1.20, 1.73 and 1.10 px on three of the six frames after; the save said the picture "ends 0 px under the wire's lowest place", the wire under the ball is out of the picture.

- `pack-frames-check.mjs`: for one recorded visit, from the rows alone, whether each close run holds what its heading says.
- `pack-frames-list.mjs`: the sets of a built pack with each heading, and the sha256 of every file.

MEASURED 09:27 UTC: the visit the pack recorded for itself (`out/work/packs/cache/2bacfab4367d/live-high/site-run.json`) holds the same 10795 rows and the same moments as my walk `/tmp/run2.json`. `node pipeline/phase5/pack-frames-check.mjs` on it: 14 lines ok, 0 NOT.
