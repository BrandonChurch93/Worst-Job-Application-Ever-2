# Polish date: a row of step 2 is never shown open and empty

Branch `agent/polish-date`, from `b3e4f902`. Owner of `src/pages/step2/**` for this round. Times are UTC, read with `date -u`.

## The fault

The story critic, pack frame 1:02.93: the Date of birth panel is open on an empty sage floor, the slot is not there.

## Measured before any change (b3e4f902)

The stage runs 240 steps a second (`config.sim.stepHz`); a picture of 60 a second is 4 steps.

MEASURED, stepped stage, no browser, no pack: `POLISH_DATE_TABLE=/tmp/date-before.txt npx vitest run tests/polish-date-measure.test.ts`. Steps counted from the row's first opening step:

| row | tray past a tenth | tray at full height | first machine part drawn | machine whole | row takes the hand | open by more than a tenth and no machine |
| --- | --- | --- | --- | --- | --- | --- |
| 1 Phone, dial | +6 | +53 | +0 | +97 | +99 | 0 steps |
| 2 Date of birth, slot | +6 | +53 | +45 | +97 | +99 | 39 steps opening (0.163 s), 29 shutting (0.121 s) |
| 3 Volume, crank | +6 | +53 | +45 | +97 | +99 | 39 steps opening, 29 shutting |

- The same for the order 1, 2, 3 (3302 steps on the page), the order 3, 2, 1 (3301), the rows that open themselves after `live.skipLinkAfterSeconds` (35869) and the film's stage (48000).
- No code path of `src/pages/step2` reads the level (`rg -n "quality|level" src/pages/step2`: none), so `medium` and `low` run the same steps.
- MEASURED in pictures, `node pipeline/phase5/polish-date-live.mjs walk before-2 2 high` (the built site, level `high`, 1920 by 1080, every picture of 60): the pictures 0.050 to 0.167 s after the press show the tray open with nothing in it; the hint line is printed at 0.150 s, the slot stands at 0.183 s.
- MEASURED, the pack's own visitor, stepped (`POLISH_DATE_PACK=/tmp/pack-before.txt npx vitest run tests/polish-date-pack-measure.test.ts`): row 2 starts to open at 62.82 s and is open and empty on 10 pictures, 62.83 to 62.98 s. The critic's 1:02.93 is one of them (tray 197 px, lift 0). The machine is whole at 63.20 s.
- MEASURED, the film, frames in a row (`node pipeline/phase5/polish-date-film.mjs film-before 2 3250 30` and `... 3 3598 30`, draft tier, hd): the film has the same fault. Row 2: frames 3254 to 3262 open and empty, the slot faint at 3263, standing at 3264. Row 3: frames 3602 to 3610 open and empty, the crank faint at 3611, standing at 3612.

## The cause (STATED from the code)

`src/pages/step2/index.ts`: `openRow` sets `lift = 0`; `step()` lets the lift grow only while `phase === 'opening' && spring[i] >= 0.9` (`s.lift += dt / 0.25`); `machine()` and `overMachine()` scaled every part by `smooth(lift)`; the makers do not draw a part under 0.02 of its height (`rise()` in `src/real/slot-kit.ts`). So the slot and the crank had no height until their tray was nine tenths open. The dial never had the fault: `dialTop` does not go under `DIAL_BODY.rest`, so it lies in the floor and the tray uncovers it. No asset is waited for, no level of detail, no click.

## The change

`src/pages/step2/index.ts` only:

- `HOUSED = 0.022`: the slot and the crank lie in the floor of their trays at this share of their height while the tray opens over them and while it shuts, as the dial does, and rise from there on the same steps as before (`risen()`, used by `machine()` and `overMachine()`). At lift 1 the value is exactly 1.
- The lift, the spring, the phases and the cursor's ground are not touched, so no step of the opening moves.
- `SUNK` is gone and the maker draws a reel's legend from 0.02 of the cabinet's height, as it draws the reel (`src/pages/step2/real/slot.ts`): the housed reels carry their digits (variant B, decided by the Builder at 08:23 UTC; see The two variants).

Why 0.022 and not more. The first try was 0.07. The picture showed the reels through the pocket of the field below: the floor of a field is at -6 (`scale.heights.field`), the floor of a tray at -8, and the field below passes over the machine's place as the tray opens. The slot's knob is 78 above the tray's floor, so it stays under the field's floor up to 0.0256; the makers draw from 0.02. 0.022 puts the knob's top at -6.28 and the cabinet at 1.28 px (the dial rests at 1.6 px).

## Decisions

1. Staging: housed in the floor and uncovered by the tray, as the dial is. No new prop, no new colour.
2. The housing holds while the tray shuts too (Builder: yes, 07:50).
3. The film gets the same housing (Builder's decision, 07:50). Bounds: no beat time, no event and no cursor path moves.
4. The dial is left as it is (Builder: yes).
5. The cursor's ground (`ground()`) still reads `smooth(lift)`: changing it would move the cursor's height in the film. During the rise the ground is at most 0.022 of a part's height under the drawn top (1.7 px at the knob).
6. The hint line of a tray is printed when the tray is nine tenths open (`panel` in `states()`), as on the dial's row. Not changed.

## Measured after the change

- MEASURED, stepped, `POLISH_DATE_TABLE=/tmp/date-after.txt npx vitest run tests/polish-date-measure.test.ts`: every row, in the orders 1, 2, 3 and 3, 2, 1, the rows that open themselves and the film's stage: tray past a tenth +6, tray full +53, first machine part drawn +0, machine whole +97, row takes the hand +99; open by more than a tenth with a part not drawn on 0 steps. The visits are 3302 and 3301 steps long, as before.
- MEASURED, the pack's own visitor, stepped (`POLISH_DATE_PACK=/tmp/pack-after.txt npx vitest run tests/polish-date-pack-measure.test.ts`): 0 pictures with a tray open and its machine not drawn (before: 10 opening and 8 shutting on row 2, 10 and 7 on row 3). At 1:02.93 the tray is 197 px open and the slot lies at 0.022 of its height. The machine is whole at 63.20 s, as before.
- MEASURED in pictures, `node pipeline/phase5/polish-date-live.mjs walk after-2 2 high`: the slot's cabinet is uncovered by the field from 0.033 s after the press and rises from 0.167 s; nothing shows through the pocket of the field that slides over it. That walk was made on variant A (50e21f01), where the reels are blank until 0.167 s and carry their digits from 0.183 s; `walk B-2 2 high` on variant B shows the digits on the reels from the first picture a reel face is uncovered.
- MEASURED, the three draft stills `step2-dial`, `step2-crank`, `table-wide` at hd: byte equal by `cmp` to the ones made before the change.

## The film

MEASURED with `pipeline/phase5/polish-date-filmdiff.ts.txt`, copied as `tests/polish-date-filmdiff.test.ts` into the branch and into a worktree of b3e4f902, run with `FILMDIFF=<file> npx vitest run tests/polish-date-filmdiff.test.ts`, the copies removed after. One line for each of the 9180 film frames of the six units (page, gag, a hash of the draw list, a hash of the cursor's pose) and one line for each event.

- Events: byte equal by `cmp`, 977 lines, base, A and B.
- Cursor pose: equal on 9180 frames. Gag and page: equal on 9180 frames.
- Draw list, base to A: 96 frames differ, all of step 2: 3253 to 3276 (row 2 opens), 3548 to 3571 (row 2 shuts), 3601 to 3624 (row 3 opens), 3814 to 3837 (row 3 shuts). No frame of another page differs.
- Draw list, A to B: 22 frames differ, 3253 to 3263 and 3561 to 3571. B changes no frame beyond A's 96.

## The two variants

- A (50e21f01): the test of 48ae1fb4 in `tests/step2-dial.test.ts` stood as written, so no legend was in the draw list while the cabinet was 2 px tall or less. Seen in pictures: the uncovered reels are blank for 9 film frames, the digits come on in one frame (3264) and go off in one frame (3561) while the cabinet stands whole.
- B (6c9bfdad, the branch): the legends are drawn on the housed reels. Decided by the Builder at 08:23 UTC on the sheets of both. The premise of that test changed (the slot lies housed in the tray's floor, it does not sink out of sight), so the test is rewritten in two parts: a legend is in the draw list only while its own reel and the cabinet are drawn by their makers; the legend lies inside its reel's face and on its top. The old window, 13.2 to 13.7 s, is the shutting of row 2 in the film and is kept; the opening, 8.1 to 8.7 s, is added.

## The shutting on the live site

`node pipeline/phase5/polish-date-live.mjs shut LABEL ROW LEVEL OPENING [AT]`: one row is pressed and left alone until it shuts. A first visit without pictures finds the sixtieth on which the tray is shut; a second visit shoots the last 30 pictures before it. MEASURED: row 2 shuts 1420 sixtieths after the hand leaves, row 3 1392.

- Row 2, levels high and low, pictures at real size: the slot stays in the tray and the digits stay on the reels until the Date field's lower part covers them, 11 to 8 sixtieths before the tray is shut. The Volume field passes below with a plain pocket: nothing of the slot is seen through it at either level.
- Row 3, level high: the hub and the lit bars lie in the floor and the page covers them from below, 13 to 10 sixtieths before shut. The crank ends its run with the arm pointing down across the tray's lower rim: at 15 and 14 before shut the arm and grip overhang the rim while still risen, at 13 and 12 the housed arm ends at the rim, under the page.
- On the last pictures of a shutting (row 3: 9 to 5 before shut; row 2: 6 and 5) the strip of tray still open is bare floor, because the machine's place is already under the page: a tray shuts from below upward. The stepped test counts a machine as drawn, not as in view.

## Seen on the other pictures of 08:40 to 08:50 UTC

- The housed state at real size (`node pipeline/phase5/polish-date-housed.mjs`, 0.133 s from the press, levels high and low): the cabinet with its reels and digits, the coin arm and the plate lie flat in the floor; the crank's hub, arm and grip lie flat, the bars unlit as outlines. The tray's rim runs unbroken. High and low differ a little in the shadows only (bytes of the crop differing by more than 8 levels: 17342 of 598000 for the slot, 21848 for the crank; mean 1.15 and 1.46 levels).
- Across the start of the rise (0.150 to 0.233 s, level high): the shadow widens a little each picture; no part appears or jumps.
- The crank's hint line is absent at 0.133 s and whole at 0.150 s, and gone in one picture at the shutting: as before the change (the line is not touched; on film frame 3610 before and after alike). The grip lies over part of that line in the whole state too.
- Row 3 shutting, live, levels high and low: at 15 and 14 sixtieths before shut the crank's arm points down and the grip's tip lies over the tray's lower rim while the crank is still risen. Whether the base does the same there is UNKNOWN (no base shutting of row 3 was shot live). The film's shutting ends with the arm pointing up and does not show it.
- Row 1 opening, live: faint rings (the dial's outline) show on the page and on the two fields below the tray on its first three pictures, on the base pictures and after the change alike. Not changed: the dial stays.
- Row 3 in the film: before, no machine in the open tray on frames 3602 to 3610 (the hint line alone on 3610); after, the grip is seen from 3603 and the hub from 3605; at the shutting the grip stays until the field covers it (3832).

## The film's rendered frames

A rendered frame differs one frame wider than the draw list, because the film blurs a moving edge over the steps to the next frame. The soft band at a moving field's edge (about 12 px) is on the frames before the change too; with the change the cabinet and the digits are seen faintly through it on the frames where the edge passes over them (3256, 3562 to 3564).

## The crank's arm at the shutting (asked 08:56 UTC)

What the code did and does at a shutting (STATED from `src/pages/step2/index.ts`; MEASURED by `POLISH_DATE_CRANK=/tmp/crank.txt npx vitest run tests/polish-date-crank-measure.test.ts`, live orders 1 2 3 and 3 2 1 and the film alike): the run is over, 97 steps pass, then the lift lowers over 60 steps (15 pictures), the same 60 the rise takes. The tray starts to shut 45 steps into the lowering (lift 0.25, `COVER`) and is shut 100 steps after the lowering began. The lowering runs from 25 to 10 sixtieths before shut. The picture 14 to 13 before shut is steps 44 to 48: the crank stands at 0.19 and 0.12 of its height, the arm's upper face passes the page's level there (z +0.5 to -2.6) and the grip's one picture later. So the lowering was there; only the arm was wrong: a live run ended at any angle, and at most angles arm and grip overhang the tray's lower rim (the hub stands 76 px above the tray's lower edge, the grip reaches 173 px from the hub).

The mend, live only: a full crank coasts down as before (same speed law, the run over on the same step), but the arm turns by a share of that speed (`homeward`), so that it comes to rest inside `CRANK_HOME`: the arc round the resting angle in which every corner of arm and grip lies `CRANK_CLEAR` (8 px) inside the tray's edge, MEASURED -1.07 to -0.5 rad (the film's run ends at -0.9025, inside it). The arc ends at `HOME_LOW`, -0.5 rad: with the arm lower (it fits to +0.22) the grip is the first thing the shutting tray covers, at 12 before shut, while the crank still stands at 0.07 of its height (seen on a first sheet with the arm level, not kept); up to -0.5 the grip lies above 157 px of the tray, which the shutting edge reaches on the step the lift is at 0.

- The share is 1 where the run would end in the arc anyway; else it brings the arm to the nearer end of the arc, forward or back, in the same time. From the full speed of 42 rad/s the natural coast is 8.3 rad, so the share lies between 0.66 and 1.34.
- The arm is steered only on a step on which it cannot strike the cursor (`BLOW_REACH`: the cursor already struck, or taken, or 70 or more high, or farther from the hub than the arm reaches, or the speed 6 or less). Else the blow would fall on another step, or not at all: with the steering unguarded the stepped visitor was not struck and the visit grew from 3302 to 3365 steps (MEASURED, then mended). After a blow the crank has a fifth of its speed, and steered it is still slower than before the blow.
- Not mended: a cursor that stays within the arm's reach, low, and is never struck until the speed is under 6: the arm is steered only from there and may then turn faster than it did (at most 6 rad/s times about 4.7). I found no visitor who does it. The visitor who presses Skip while the crank runs was not mended here and is mended in 75b736f0 (see the Skip's section below).
- MEASURED after: the run is over on steps 2883 and 729 (orders 1 2 3 and 3 2 1) as before, the tray shut on 3080 and 926 as before; the visits 3302 and 3301 steps as before (`npx vitest run tests/polish-date.test.ts`, 39 tests).
- The film: draw lists and events byte equal to the commit before (6c9bfdad) on all 9180 frames and 977 events (the filmdiff test, `cmp`).
- Stepped test (`tests/polish-date.test.ts`, the crank lies inside its tray before it goes down into it): on the step the lift begins to lower every corner of the drawn arm and grip is inside the tray's floor (the tray's box less its rim of 3.4): bots keen and clumsy, a visitor who lets go of the crank at each of 8 angles and waits for it to run away, the film. Bots random and skipper skip the page before they open the crank's row (0 shuttings, MEASURED, held in `SHUTS`).
- Row 2: the lever's knob travels from y 559.4 to 747.7 in a tray from 543 to 793, 16 px inside at the nearest: it cannot stand over the rim (MEASURED from the layout's numbers). The same test holds the cabinet, lever, mount and payout inside the floor at the lowering for four visitors. The coins are not parts of the machine: one is dropped from the picture as the tray's edge reaches it, as before.

## The boss tag (a measure, nothing changed)

MEASURED, stepped, the pack's visitor (`POLISH_DATE_BOSS=/tmp/boss.txt npx vitest run tests/polish-date-boss-measure.test.ts`): the visit ends at 174.12 s. The slab "Field cannot be blank" is cut by the lower edge on 5 pictures, 147.10 to 147.17 s (ticks 8826 to 8830): it is a spent slab leaving downward (state 2), 2.5, 24.6, 48.7, 74.9 and 103.2 px under the edge, centre x 406.9. No slab is cut while flying or lying. A slab "Invalid input" leaves by the left edge from tick 9254.

Live (asked 08:23 UTC), MEASURED in pictures: `FIND=10,60 node pipeline/phase5/polish-date-boss.mjs boss3 8922 9700 407 970 400 240` (level high, 1920 by 1080; a picture every 10 sixtieths until a slab shows, then every sixtieth round its leaving). The slab lies at about 407, 891 and starts to slide down on sixtieth 9090 of the visit; the lower edge cuts it on 9113 to 9116 (the letters on 9114 and 9115); gone on 9117. It leaves whole, as a plate sliding down off the screen. The live visit is 286 sixtieths behind the stepped one by then; why is UNKNOWN. A live picture of the boss page costs about 5.6 s at level high. Nothing changed in `src/pages/boss/**`.

MEASURED by `cmp` of rendered frames, hd, draft tier, before (b3e4f902, /tmp/wt-base) against after (variant B), made with `node pipeline/phase5/polish-date-film.mjs LABEL ROW FIRST COUNT`:

- Row 2 opening: 3250, 3251 equal; 3252 to 3276 differ; 3277 equal.
- Row 2 shutting: 3545, 3546 equal; 3547, 3548 differ; 3549 to 3555 not rendered after the change (UNKNOWN); 3556 to 3571 differ; 3572 equal.
- Row 3 opening: 3599 to 3602 equal; 3603 to 3614 differ; 3615 to 3621 not rendered after the change (UNKNOWN); 3622 to 3624 differ; 3625 equal.
- Row 3 shutting: 3811, 3812 equal; 3813, 3814 differ; 3815 to 3821 not rendered after the change (UNKNOWN); 3822 to 3832 differ; 3833 to 3838 equal.
- So the rendered frames that change are 3252 to 3276, 3547 to 3571, 3603 to 3624 and 3813 to 3832, taking the frames not rendered as changed. The draw lists differ on 3253 to 3276, 3548 to 3571, 3601 to 3624 and 3814 to 3837 (96 frames); events (977) and cursor (9180 frames) are equal.
- The arm's way home and the Skip's way home change no film frame: draw lists and events byte equal to variant B by `cmp`.

## The hint line of an open row (asked 09:30 UTC, not changed)

The line "Rotate the crank clockwise..." goes in one frame at the shutting because `states()` in `src/pages/step2/index.ts` gives `panel` only while `s.spring[s.open] > 0.9` (line 909 at 75b736f0), and the prompts of all three rows carry `states: ['volume-panel']` and its fellows in `src/pages/step2/layout.ts` (lines 140, 161, 167). The same rule shows and hides the line of rows 1 and 2 and the film uses it, so a change would alter film frames at all six openings and shuttings. Left as it is; for the open list as minor.

## Row 1's rings (cause named, not mended)

- What is seen, live, MEASURED on pictures (`rings-live-high-a.png`, walk `after-1`): no rings before the press; dotted single pixel arcs at the dial's place on the page and on the fields below on 0, 1 and 2 sixtieths after the press, perhaps a trace on 3, none later. They end because by then the tray's opening has passed over the dial, not because the cause ends. High, medium and low all show them (`rings-levels.png`).
- The film does not have them: film frames 2874 (the press) to 2881, hd, draft, `node pipeline/phase5/polish-date-film.mjs film-rings 1 2872 12`, seen at 1.5x and 2874 to 2877 at 2x (`rings-film.png`, `rings-film-2x.png`): plain page and plain fields under the opening tray.
- The pass: the live picture's multisampled target. `src/app.ts` line 44 `LIVE_MULTISAMPLES = 4` and line 124 `multisamples: o.capture ? 0 : LIVE_MULTISAMPLES`; the target is made in `src/core/accumulator.ts` lines 47 and 48. A capture (the film, the stills) has none. MEASURED on pictures of the same sixtieth in a scratch copy (`rings-cause.png`): four samples, rings; the same with `ms=0`, no rings on the page or the fields.
- Which thing: the dial's own solid body. One thing off at a time (`rings-offs-1.png`, scratch flags in `real/dial.ts`, `node pipeline/phase5/polish-date-rings.mjs LABEL LEVEL TICKS OFF...`): the whole dial off or its body off, no rings; the wheel off, the inner rings go and the outer stays; shades, cast shade, glint, seat, plate, stop, ring, hub off, the rings stay. Not shadows: with the dial throwing none and taking none the rings stay (`rings-offs-2.png`). The gap matters: the body 0.5 lower, the inner rings go from the field; 1.5 lower, the outer ring stays in the field; 6 lower, the field is clean and a trace stays on the page (`rings-offs-3.png`).
- Why (my reading, not proved): the housed dial is not made low, it sinks. `pose` in `src/pages/step2/real/dial.ts` line 467 sets `kept.body.position.z = top - H`, so under the page stand walls of the full height `B.tall` straight under the camera, each covering next to no area. With four samples a pixel some samples fall on such a wall, and its depth there, worked out from a slope that is all but endless, comes out in front of the page. The slot and the crank are scaled to 0.022 of their height, so their walls are that much lower and show nothing. The stepped page here is drawn by the browser of this machine; whether a visitor's graphics card draws the same dots is UNKNOWN.
- A mend that lies in my files, tried in the scratch copy on one picture only (`rings-cause.png`, third strip): the body pressed flat while housed (`kept.body.scale.z = 0.05`, its top held at `top`). Page clean, rings gone from the field; one short dash and one dot stay in the field, the part that draws them not named. Not made: it changes how the housed dial is built, the film frames of row 1's opening and shutting would have to be shot before and after, and that could not be pushed with pictures and green checks by the hour set. Outside my files the other mend is the multisampling itself (`src/app.ts`), not mine to change.

## Skip pressed while the crank runs (09:22 to 09:41 UTC)

- The stepped live page mounts no interface, so it has no Skip to press. The walk `node pipeline/phase5/polish-date-live.mjs skip LABEL 3 high 1325 40` ran in a scratch copy (/tmp/wt-scratch, never committed) whose src/main.ts adds `skip: () => mouse.pulse({ skip: true })` to window.liveRun, the call the link makes.
- Before (ec6c20d4), MEASURED on pictures `skip-3-0.png`, `skip-3-16.png`: Skip 1325 sixtieths after the row's press, the arm straight down (turn 1.51 rad, 28 rad a second). From the Skip to 0.183 s the crank stands still with the arm's end and the grip under the lower rim and the page; at 0.200 s the hint line and the arm stub go in one picture. Stepped: `POLISH_DATE_SKIP=/tmp/skip.txt POLISH_DATE_SKIP_AT=5700 npx vitest run tests/polish-date-skip-measure.test.ts`: closing on 5701, angle frozen at 64.342, outside the floor on all 100 steps to shut.
- Cause: on a Skip the open row went to closing at once and `stepCrank` is not called while skipping, so the arm stayed where the Skip caught it.
- Mend (the Builder's word, 09:34 UTC): the Skip block of `src/pages/step2/index.ts` lets the arm go home first (`skipHome`, `SKIP_HOME = { least: 14, soft: 0.6 }`, `crankHome`). Nothing else of the Skip changes.
- MEASURED, `POLISH_DATE_SKIP_EVERY=5 POLISH_DATE_SKIP=/tmp/skip-after.txt npx vitest run tests/polish-date-skip-measure.test.ts`, a Skip on every 5th step of the crank's own run (138 Skips, page steps 5202 to 5892): before, 89 of them left the arm outside the floor on the step the lift begins to lower, after 0. The lowering begins 1 step after the Skip before, at most 95 after. The page is left 280 steps after the Skip before, 280 to 374 after: at worst 94 steps later in this run. The bound by arithmetic is 98 steps (5.713 rad at 14 rad a second).
- Tests in `tests/polish-date.test.ts` (50 pass): a Skip with the running arm in each of eight eighths of its turn, a Skip with the arm left at rest outside the arc by the visitor's hand (it starts from rest), a Skip before the crank is touched (the lift lowers on the next step, as before). On ec6c20d4 seven of these fail (MEASURED in the scratch copy).
- The film: draw lists byte equal to B on 9180 frames and events byte equal (`cmp /tmp/film-skip.txt /tmp/film-new.txt`, `cmp` of the `.events` files), made with `pipeline/phase5/polish-date-filmdiff.ts.txt`.
- For the log: on the lowering step the tray's edge first passes the crank's lowest edge (step 50 of the lowering, lift 0.167) the crank's highest point is at z -1.58, 1.58 under the page's plane (the step before the edge moves, step 44, it is at +5.16 and the edge has not moved; step 48: +0.41, the edge at y 930, the crank's lowest edge at y 921).

## The four checks on the src of 75b736f0 (09:53 to 10:04 UTC, one at a time, no browser job beside them)

- `npm run determinism`: pass, 12 pictures at hd, tier draft, identical across two fresh loads and two orders.
- `npm run bots`: "bots: all clear"; keen reached every one of the 37 gags on every seed.
- `npm test`: 160 test files passed, 8 skipped (168); 1989 tests passed, 8 skipped (1997); 220 s. Five of the skipped files are my measures, which run only when asked.
- `npx tsc --noEmit -p .`: exit 0, no output, last of all.
