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

## The boss tag (a measure, nothing changed)

MEASURED, stepped, the pack's visitor (`POLISH_DATE_BOSS=/tmp/boss.txt npx vitest run tests/polish-date-boss-measure.test.ts`): the visit ends at 174.12 s. The slab "Field cannot be blank" is cut by the lower edge on 5 pictures, 147.10 to 147.17 s (ticks 8826 to 8830): it is a spent slab leaving downward (state 2), 2.5, 24.6, 48.7, 74.9 and 103.2 px under the edge, centre x 406.9. No slab is cut while flying or lying. A slab "Invalid input" leaves by the left edge from tick 9254.
