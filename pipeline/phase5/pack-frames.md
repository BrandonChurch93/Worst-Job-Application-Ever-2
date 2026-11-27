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

## The key sheets on the Email field (the Builder's mail of 09:38 UTC)

The fault: press 7 of the walk lies on the last name, where the keys change places after every letter by the page's design (kit/02-SUBJECT.md, "Field by field"). In round 24's B-01 and B-02 the keys fly while the button is held, so the pressed key's way back after the release is not in the sheet.

Decisions:
- The press shown is the first on the Email field whose frames begin `KEYS.home` (32) steps or more after the page goes on to that field and end before the first red slab drops and before the page asks for the resume. STATED from `src/pages/step1/index.ts`: going on from the last name sends the keys home (`goHome()`), a flight and seat of at most 0.515 s (`FLIGHT` crouch 0.035 + ripple 0.17 + jitter 0.02 + seconds 0.2 + seat 0.09), 31 steps. With no such press the rule before stands (the first after the turrets have stopped, else the first), and the heading names the field the press lies on and what the page does to its keys there.
- The heading says: which press, when the page went on to the Email field and how long after it the frames begin, and "By the page's design the keys stay in their seats on the Email field: a pressed key sinks, and comes back up when it is let go". The heading is one line longer (7), the tiles 272 px tall instead of 278.
- No sheet of the shuffle: a close picture costs about 5 s of the build, a sheet of twelve one minute; the Builder asked for it only at no extra build time.
- `pipeline/phase5/pack-frames-key.mjs` reads the pressed key's left edge from the pictures, frame by frame.

MEASURED on round 24's walk (`/tmp/run2.json`), 09:41 to 09:46 UTC:
- `node pipeline/phase5/pack-frames-check.mjs` on it: press 10 of 13 (key A), steps 1476 to 1499; field email; the page goes on to the Email field at step 1420, the frames begin 56 steps after it; they end 227 steps before the first red slab (1726) and 253 before the resume (1752); 0 hits on the arrow in the frames; 0 marks that do not follow the button.
- Trial sheets (`node pipeline/phase5/pack-frames-sheets.mjs /tmp/run2.json /tmp/sheets2 type`), every frame seen at real size: the keys stand in their usual order (2 3 4 5, Tab Q W, Caps Lock A S D, Shift Z X) in all 24 frames and none leaves its seat; no bolt, no turret; key A is dark and smaller under "down", 0:24.67 to 0:24.85, and light again from 0:24.88.
- `node pipeline/phase5/pack-frames-key.mjs /tmp/run2.json /tmp/sheets2/cache`: the key's left edge is at x 527.5 before the press, 531.8 then 533.9 while held; after the release 531.8, 529.5, 526.7, 525.8, 525.8, 526.5, 526.7, 527.5: it goes 1.8 px past its place on the fourth and fifth frame and is back at 527.5 on the eighth, the sheet's last. The rows hold no place of a key, so this is read from the pictures only.

## The key's name and the arrow's red tip (the Builder's mail of 10:04 UTC)

- The heading names the key: `keyAt` finds the seat the press lies in from the page's own key data (`src/pages/step1/keyboard.json`, as `keyBlock` reads it). It is named only for a press taken by the Email rule, where the keys are home. On round 24's walk: A.
- The Builder asked for a clause that the arrow burns from an earlier hit. STATED from the page's files, it is not a burn: a burn heals within `cursor.damageHealSeconds` (4 s; `src/cursor/body.ts`, `hurt`), the walk's last bolt hit the arrow at step 1112 (0:18.53) and the frames begin at 0:24.60. Going on to the Email field the page makes the arrow angry (`src/pages/step1/index.ts`, `advance`: `enter('email')`, `act(io, 'angry')`), and the kit has "Angry: the tip glows red and it vents steam" (kit/02-SUBJECT.md). The heading says that: "On this field the arrow is angry by the page's design: its tip glows red and it vents steam". A test holds both lines against the page's file and the kit.
- The heading has 8 lines now, the tiles are 268 px tall.

## After merge 47 (ce259d65): what the rows of the new visit changed, 10:41 to 10:45 UTC

The first build on the merge commit 9de8c3a8 was stopped after its visit: `pack-frames-check.mjs` on that visit said NOT for the save. Mended, and the recorded rows of the tests cut anew from the new visit (`/tmp/run25.json`, the pack's own).

- The save: the page's view now moves in the run (the rows: 9 px up the page to 1:53.30, then 69 px down to the last frame). The window's foot was set at the wire's lowest place plus 20 px and then rounded down, 19.8 px, and the heading then said the page's own picture ended there, which was untrue. Now the foot is rounded up (20.8 px under the wire, foot 1074 of 1080), and the heading says how the view moves, so that the gate rising in a fixed window is not read as a fault. Window x 730 to 1191, y 802 to 1074; 7 lines, tiles 272 px.
- The drop: the ball now starts slowly (0.3 px in its first step, 5953; then 1.8, 5.0, 7.9). The old rule took a move of 0.5 px or more for the start and named 5954. `LEAVES` 0.05: any move the rows hold. Steps 5947 to 5977, window as in round 24.
- The take: the arrow arrives 5 steps later (1912), so 41 frames on 4 sheets; set B holds 10 sheets.
- The save's kick is at 6814 (6815 before). Seat, key, give back: the same steps; the give back's window moved 3 px down (y 581).

## Round 25's motion pack on d6fe4a6b (src as merge 47, ce259d65), built 10:45 to 11:20 UTC

MEASURED: `npm run -s pack -- --phase 5 --round 25 --unit site --role R4`, exit 0, 32 sheets, "the limit of files took nothing away". `node pipeline/phase5/pack-frames-check.mjs out/work/packs/cache/d6fe4a6b8ed9/live-high/site-run.json`: 15 ok, 0 NOT. The pack is in `out/work/packs/round-025/R4/`, its key in `out/work/keys/round-025-R4.json`; the list with every heading and sha256 is made by `node pipeline/phase5/pack-frames-list.mjs out/work/packs/round-025/R4 out/work/keys/round-025-R4.json`.

- Set A, pages, 9: walk A-01 (0:00.87 to 0:01.23), turn A-02 to 04 (0:09.93 to 0:11.10), seat A-05 to 08 (steps 639 to 659, 0:10.65 to 0:10.98, windows x 818 to 1920, y 0 to 176 and x 780 to 1070, y 290 to 466), bolt A-09 (0:14.88 to 0:15.25).
- Set B, arrow, 10: key B-01, B-02 (steps 1476 to 1499, 0:24.60 to 0:24.98, window x 374 to 835, y 758 to 1026, press 10 of 13, key A, Email field), take B-03 to 06 (steps 1878 to 1918, 0:31.30 to 0:31.97, window x 485 to 946, y 438 to 716), give back B-07 to 10 (steps 2612 to 2658, 0:43.53 to 0:44.30, window x 730 to 1191, y 581 to 853).
- Set C, port, 6: flippers C-01 (1:37.55 to 1:37.92 at 1/30 s), drop C-02 to 05 (steps 5947 to 5977, 1:39.12 to 1:39.62, window x 1455 to 1799, y 292 to 886), C-06 (1:39.17 to 1:39.53 at 1/30 s).
- Set D, bats, 7: save D-01 to 03 (steps 6794 to 6829, 1:53.23 to 1:53.82, window x 730 to 1191, y 802 to 1074), flip D-04, D-05 (2:06.23 to 2:07.00 at 1/30 s), blow D-06, D-07 (steps 7575 to 7586, 2:06.25 to 2:06.43, window x 666 to 1127, y 277 to 871).

What was seen and measured on it:

- The release, B-02, seen frame by frame at real size: key A dark and smaller under "down" to 0:24.85; light again and almost full size at 0:24.87; a touch larger than its seat at 0:24.88; it closes on its seat to 0:24.97. MEASURED `node pipeline/phase5/pack-frames-key.mjs <site-run.json> <cache>`: left edge 527.5 before the press, 531.8 and 533.9 held, after the release 529.5, 524.8, 525.5, 526.5, 526.8, 527.2, 527.5, 527.5. Round 24's build: 531.8, 529.5, 526.7, 525.8, 525.8, 526.5, 526.7, 527.5.
- The seat, A-06: after the contact at step 645 the page's right edge is inside the page again on steps 648, 649, 650 and a little on 652, 653. MEASURED by a reading of the pack's own pictures (the first column from the right at row 100 that is not dark; a throwaway script, not kept): 641 to 644: 1847, 1864, 1881, 1900; 645 to 647: 1920; 648 to 650: 1908, 1901, 1906; 651: 1920; 652, 653: 1916; 654 to 659: 1920. The same numbers on round 24's build (cache 2bacfab4367d), so merge 47 did not change it. Not judged here; reported to the Builder as a thing to look at.
- The save, D-03: after the ball has gone the wire shows as a thin line at 1:53.67 to 1:53.73, as a low rail at 1:53.75 to 1:53.80, a line at 1:53.82. Seen whole, not at real size. Not judged.
- The take, B-06: the arrow leans left in all 5 frames 0:31.90 to 0:31.97 where B-05's last 5 show it upright. Seen whole. Not judged.

## A test of another owner whose numbers the visitor's rest changes: tests/polish-tug2.test.ts

The test came with merge 47. Its list `EVENTS` holds the frames of step 1's events under the pack's visitor (`makeVisitor` of `tools/lib/pack-site.mjs`). The visitor of this branch rests 6 frames after it lets a key go (`KEYS.rest`), so its presses and all that follows them fall on later frames. MEASURED: in a worktree of ce259d65 (the same src and test, main's visitor) `npx vitest run tests/polish-tug2.test.ts` gives 13 passed; on this branch 12 passed and that one failed. Decision: by the rule that such a test is changed only where this work changes a number it holds, `EVENTS` now holds the frames under this branch's visitor (54 entries, 49 before; the tug is lost at 2400, 2340 before) and its comment line says which visitor. Nothing else in the file is changed. Its own commit.

## Round 26's motion pack (branch `agent/pack-frames2`, from d325b790346c989ccc7646c91190e21a78a7b49d), 18:36 to 20:15 UTC of 27 November

The Builder's eight changes of 18:36 UTC and the rulings of 18:44 and 18:51 UTC. Decisions, each mine unless a ruling is named:

- Six sets of 10 sheets, A to F (ruling 18:44): `SET_ORDER` in `tools/lib/pack-site.mjs` is pages, shot, paper, port, tube, bats, and `SETS` names the set of each moment. Each set has its own brief and stands alone.
- Change 1, the ball whole in the window. The save's sheets hold 6 frames a sheet in two rows (`SAVE_PER`), so that their window is tall enough for the ball's whole way after the kick: MEASURED by `node pipeline/phase5/pack-frames-check.mjs RUN.json`, the ball is whole in the window in every frame of every sheet whose subject is the ball, but for the blow at 1/30 at steps 7594 to 7600, in none of which it is whole on the visitor's screen. Ruling 18:51: those sheets show what the screen shows, the heading says only where the window lies and that its upper edge is the upper edge of the visitor's screen. The check's lines on the ball go to the Builder only.
- Change 2, the kit's words. `VIEW_WORDS` quotes `kit/03-METHOD.md` line 397 and stands on every live sheet in whose frames the view's place changes on step 3 (`MACHINE_PAGE`); `INSERT_WORDS` quotes `kit/02-SUBJECT.md` line 320 and `kit/03-METHOD.md` line 300 and stands on every live sheet in whose frames the ball lies over an insert (`overInsert`, from the table's own places of the inserts). The film's sheets carry neither: the film's camera is not the page's view.
- Change 3, the shot. The run's rows do not hold the turrets, so `shotOf` reads the shot back from the hit: the bolt flies at `SHOT.speed` px a second from the muzzle of the turret that the arrow is thrown away from. MEASURED on pictures of steps 858 to 880 drawn at 1920x1080 (`node pipeline/phase5/pack-frames-seat.mjs RUN.json /tmp/hit 858 880`): the left turret's glow swells from step 866, its barrel is thrown back on step 871 and the bolt is out on 872; the hit is step 899. The close sheets run from step 860 (6 before the cock) to 907 at every frame, the turret in a window of its own left of the arrow on its key.
- Change 4, tiers by name: `tierName` gives Corporate, the Office, the Street; the tiers' sheet of the whole-site pack (`tierSheet`) says the names too. `tests/pack-frames.test.ts` holds that no heading has "tier" with a number.
- Change 5, the take: live, steps `taken - 8` to `taken + 12` at 100% (`BITE`); the film, frames 2154 to 2174 in one fixed window of the film's picture (`FILM_RUNS.paper`), the film's camera standing still in those frames (STATED by the film's plan).
- Change 6, the bends: live, the 18 frames round the step at which the ball is nearest each bend (`BEND`), in a window that goes with the page while the view moves and stops at the screen's foot; the film, frames 4258 to 4275 and 4272 to 4286 in fixed windows of the film's picture (`FILM_RUNS.bend1`, `.bend2`). MEASURED on the film's frames 4258 to 4292 drawn for this (`node pipeline/phase5/pack-frames-film.mjs CACHE 4258 4292`): the ball is at the first bend at frame 4265 and at the second at about 4280; from 4267 the film's camera closes in on the ball, so the second run ends at 4286: at 4287 the ball's lower edge is at the foot of the film's picture (seen at real size), and after that the ball alone fills a third of the screen.
- Changes 7 and 8, the view and the launch: whole frames of the screen at 18%, every frame of 60, 20 a sheet in four columns (`VIEW`, `LAUNCH`); under each frame, after its time, the view's place in px as a plain number, and `VIEW_MARK_WORDS` in the heading (ruling 18:44). The view's travel is found from the rows: the first step before the take and the first after the kick at which the place changes.
- The film's sheets (ruling 18:51): kind `site-film-sheet`, drawn by the film's own tool at the film's quickest setting; the heading says `FILM_WORDS`, "film frames drawn with 2 samples a frame, the quickest setting, so the grain is coarser than the finished film's". The Builder ruled the film's shot (frame 1169) out of this pack.
- The rows of the tests (`pipeline/phase5/pack-frames-rows.json`) are cut anew from this build's own visit (d325b790), 1162 rows of 10795: in this visit the view stands still inside the save's frames (it stood 69 px lower at their end in the visit of merge 47), so `tests/pack-frames.test.ts` now says so.
