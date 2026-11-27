# polish-turn2: the first frames of a page turn

Branch `agent/polish-turn2`, from `origin/main` 308e96a1. Times are UTC, 27 Nov 2026, read with `date -u`.

The fault (round 25, R4 critic, set A, major, `set-A-02.png`, 0:10.23 to 0:10.30): the old page darkens while it is still frontal and flat, then is at a high angle at once. Wanted: the page tips before it dims.

Files edited: `src/stage/turn.ts`. One line outside my files, in `src/core/renderer.ts`: it is `pipeline/phase5/polish-turn2-NEEDS.patch` and the commit `NEEDS:` a2721ff4. `src/stage/stage.ts` and `src/stage/panels.ts` are not edited.
Tests: new `tests/polish-turn2.test.ts`. No test of another owner is changed.
Scripts: `polish-turn2-live.mjs` (pictures of the live site through a turn), `polish-turn2-measure.mjs` (the table from pictures), `polish-turn2-sheet.mjs` (before above, after below), `polish-turn2-same.mjs` (which pictures are equal byte for byte).

## 1. Before anything was changed

MEASURED on 308e96a1 at 13:22: `npm ci`, `npm run build`, `npm test`: 166 files passed, 10 skipped; 2094 tests passed, 11 skipped.

How the pictures are made:
- Live: `node pipeline/phase5/polish-turn2-live.mjs OUT 1 4 30 high`, the built site in a browser at 1920 by 1080, `mode=live&clock=steps`, the pack's visitor, one picture every 1/60 s from 4 frames before the turn's first step. The turn into step 1 starts at the visitor's step 597.
- Film: `npm run seq -- --first 806 --last 860 --tier draft --format hd --force`. The turn into step 1 starts at frame 810 (13.5 s), the new page is in from frame 840, the seat is frame 858.
- The before pictures come from a worktree of 308e96a1 with the same scripts.
- Table: `node pipeline/phase5/polish-turn2-measure.mjs -4 <pictures>`. The face is the mean of a plain patch of the careers page (x 840 to 1240, y 450 to 536), 0 to 255.

## 2. The cause

STATED, read in the code:
- Nothing fades or veils the page. The angle of the slab is `leaveTurn` (`src/stage/turn.ts`), and the lights go round the slab by `lightTurn(angle)` in `src/core/renderer.ts`: for a face turning from the key, by the whole angle.
- The key (`look.key.direction`, -0.65, 0.6, 0.36) stands 22 degrees over the page. Its share on the face is cos a - 1.67 sin a: 0.94 at 2 degrees, 0.47 at 17, nothing from 31. At 17 degrees the page is foreshortened by 4 percent, at 31 by 14 percent. So the face was dark before the tilt could be read.
- The curve itself stalled: the lean of 0.89 degrees came back to flat by frame 3 and the slab then stood for two frames (steps of 0.14 and 0.13 degrees) before the swing.
- `JOLT` is the camera's knock on the step of the seat (`joltAt(settle)`), it does nothing at takeoff. The wind-up of the takeoff is `TURN.windUp` and `TURN.lean`.

## 3. What was changed

1. `leaveTurn` (`src/stage/turn.ts`). Same 30 frames, same `TURN.windUp` 0.12, `TURN.lean` 1.6 degrees as the most, `TURN.power` 2.2, and `leaveSpeed()` the same number, so the arriving half is equal to the last bit. New: `TURN.back` (8 degrees a wind-up: the slab is at the lean's deepest by frame 1 and holds it for frame 2) and `TURN.start` 0.264 (the swing starts with the speed the lean comes back at, so nothing stalls between the two).
2. `leaveLight` (`src/stage/turn.ts`, read by `lightTurn` in `src/core/renderer.ts` through the NEEDS patch): for a face turning from the key the lights go round by `36 * (1 - exp(-(angle / 40)^2))` degrees. Next to nothing while the slab starts (0.09 degrees at 2), never more than the slab has turned, 36 degrees at the end. The face turning toward the key (the arriving half, `TOWARD`, round 21) is as it was.

The first map tried was angle squared over a quarter turn (commit a2721ff4). MEASURED on the live site it kept the face lit to 42 degrees and then dropped it by 42 of 255 in one frame (frame 24), more than the 30.5 of before. The Builder's ruling of 13:43 (2c) forbids a step larger than today's largest, so the map was changed (commit 376a5d45) to one that takes the key off evenly.

## 4. Rule 6

- `TURN.windUp`, `TURN.lean`, `TURN.power`: set in the build (662509ed), not for a round. Kept as they are; the curve between them is new. The Builder's ruling of 13:43: approved, not contested.
- Rounds 21 to 24 (the seat, `land`, `held`, `knocks`, `JOLT`, `SHIVER`, `TOWARD`, the step row, the arrow): not touched. `tests/stage-turn.test.ts` and `tests/polish-turn.test.ts` are unchanged and pass.
- The lights on a leaving page: round 21 left the leaving half as it was (`fix-turn.md` 8.2). The Builder's ruling of 13:43: approved as a `NEEDS:` commit, not contested.

## 5. Decisions

1. Point (b) of the brief with a lean: the first step is the lean (under 1.5 degrees, backward), the signed steps never shrink from frame 1 to frame 30, and "no step more than twice the one before" holds from the frame the slab passes flat (frame 4). The Builder's ruling of 13:43 accepts this reading.
2. The lean is as deep as it was. First try: `TURN.back` 8 degrees a wind-up, the lean at 1.34 and 1.32 degrees on frames 1 and 2. Seen at three times on the upper edge of the page (live and film): the backing over the head of the page was 2 px for two frames (film: 1, 2, 1 px on the frames of the turn's first step, 1 and 2), where before it was 1 px. What stands on the page moved by 1 to 2 px. So the deeper lean read as a dark line on the upper edge and not as a lean. Decided: `TURN.back` 4.5, the lean 0.83 and 0.94 degrees on frames 1 and 2 (before 0.89 and 0.70), at its deepest 0.97 (before 0.93). The wind-up is kept, held one frame longer, and runs into the swing with no stall. It is not made larger.
3. The map of the lights: see 3.2. Chosen among maps tried in numbers against the face read from the before pictures: the one whose largest step of the face is smallest and that never turns the lights further than the slab.
4. The second turn shown: step 1 to step 2 (the arrow rides the page), film frames 2730 to 2778, the live visitor's second turn.
5. Pictures: the sheets are made by `polish-turn2-sheet.mjs` into `out/work/polish-turn2/` (not kept in the repo, as with the earlier rounds' sheets). Whole frames at half size are 960 by 540 each, so sixteen of them before and after do not fit 1200 px: the mailed pictures are the cuts at real size and single frames at half size.

## 6. Not possible without a new device

- A shadow of the slab under its lifted edge: behind the page there is the unlit backing and nothing for a shadow to fall on (`kit/03-METHOD.md` line 49).
- A side of the slab over the head of the page in the first 18 frames: the leaving edge that shows a side is the upper one, and it is out of the picture until the slab is at about 20 degrees.
- What is there at the foot (MEASURED, see 7.4): in the film the slab's side stands as a grey band between the face and the gap, 1 px from frame 4 growing to 7 px at frame 20 (before: 1 px from frame 6, 3 px at frame 16). On the live site it is 1 px or less. It is not drawn larger: that would need the slab made thicker, which is `config/` and the method, not this piece.
- The Builder's ruling of 13:43 (3): accepted as not possible, logged as open.

## 7. MEASURED after the change, the turn into step 1

Commands: `node pipeline/phase5/polish-turn2-live.mjs OUT 1 4 30 high` in each tree (before: a worktree at 308e96a1), `npm run -s seq -- --first 806 --last 860 --tier draft --format hd --force` in each tree, then `node pipeline/phase5/polish-turn2-measure.mjs -4 FILES`. Whole tables: `polish-turn2-before.txt`, `polish-turn2-after.txt`.

### 7.1 The table

Face: mean of a bare patch of paper, 0 to 255. Rest is 215.1 live and 217.5 in the film. The key's share is cos(a) - 1.67 sin(a) of the angle the lights go round by, floored at 0. Shadow reach: px from the right card's rim to where its shadow is at half its depth; 0 where the depth is under 0.03. Frames 29 and 30: the patch no longer lies on the face (the slab is edge on).

| frame | angle before | angle after | key share before | key share after | lights round after, deg | live face before | live face after | live step before | live step after | film face before | film face after | film step after | shadow reach before | shadow reach after | shadow depth after |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 0 | 0.00 | 0.00 | 1.000 | 1.000 | 0.00 | 215.1 | 215.1 | -0.0 | -0.0 | 218.2 | 218.3 | 0.8 | 9 | 9 | 0.43 |
| 1 | -0.89 | -0.83 | 1.026 | 1.024 | -0.83 | 216.9 | 216.9 | 1.8 | 1.8 | 219.4 | 219.4 | 1.1 | 9 | 9 | 0.42 |
| 2 | -0.70 | -0.94 | 1.020 | 1.027 | -0.93 | 216.4 | 216.7 | -0.5 | -0.2 | 218.7 | 219.3 | -0.1 | 8 | 9 | 0.43 |
| 3 | -0.13 | -0.48 | 1.004 | 1.014 | -0.48 | 215.4 | 215.9 | -1.0 | -0.8 | 217.8 | 218.3 | -1.0 | 7 | 8 | 0.43 |
| 4 | 0.01 | 0.36 | 1.000 | 1.000 | 0.00 | 214.8 | 215.0 | -0.6 | -0.9 | 217.5 | 217.7 | -0.6 | 9 | 8 | 0.43 |
| 5 | 0.14 | 1.29 | 0.996 | 0.999 | 0.04 | 214.6 | 215.1 | -0.2 | 0.1 | 217.3 | 217.8 | 0.1 | 9 | 8 | 0.42 |
| 6 | 0.46 | 2.28 | 0.987 | 0.997 | 0.12 | 214.0 | 215.3 | -0.6 | 0.2 | 215.9 | 216.8 | -1.0 | 10 | 9 | 0.40 |
| 7 | 0.99 | 3.36 | 0.971 | 0.993 | 0.25 | 213.1 | 214.5 | -0.9 | -0.7 | 214.8 | 217.0 | 0.2 | 9 | 8 | 0.42 |
| 8 | 1.75 | 4.55 | 0.949 | 0.986 | 0.46 | 211.1 | 214.4 | -2.0 | -0.1 | 213.5 | 216.9 | -0.1 | 10 | 8 | 0.41 |
| 9 | 2.74 | 5.88 | 0.919 | 0.978 | 0.77 | 208.5 | 214.2 | -2.6 | -0.2 | 211.4 | 216.3 | -0.6 | 12 | 9 | 0.40 |
| 10 | 3.98 | 7.35 | 0.882 | 0.965 | 1.20 | 206.2 | 213.5 | -2.3 | -0.7 | 208.3 | 215.5 | -0.8 | 11 | 9 | 0.40 |
| 11 | 5.48 | 8.99 | 0.836 | 0.948 | 1.77 | 202.4 | 211.9 | -3.8 | -1.6 | 204.6 | 214.1 | -1.3 | 13 | 10 | 0.40 |
| 12 | 7.25 | 10.82 | 0.782 | 0.925 | 2.54 | 198.2 | 210.1 | -4.2 | -1.8 | 200.2 | 212.7 | -1.5 | 13 | 10 | 0.39 |
| 13 | 9.28 | 12.84 | 0.718 | 0.896 | 3.52 | 192.0 | 208.1 | -6.2 | -2.0 | 194.1 | 210.3 | -2.3 | 16 | 10 | 0.38 |
| 14 | 11.59 | 15.07 | 0.645 | 0.858 | 4.77 | 186.4 | 205.3 | -5.6 | -2.9 | 187.7 | 207.3 | -3.0 | 19 | 13 | 0.36 |
| 15 | 14.19 | 17.53 | 0.561 | 0.811 | 6.29 | 177.7 | 201.9 | -8.7 | -3.4 | 178.8 | 203.1 | -4.2 | 23 | 13 | 0.37 |
| 16 | 17.07 | 20.24 | 0.467 | 0.754 | 8.13 | 167.8 | 196.5 | -9.9 | -5.4 | 169.0 | 198.3 | -4.8 | 30 | 14 | 0.34 |
| 17 | 20.25 | 23.19 | 0.361 | 0.687 | 10.28 | 153.4 | 191.1 | -14.4 | -5.4 | 156.0 | 191.7 | -6.6 | 43 | 18 | 0.32 |
| 18 | 23.72 | 26.41 | 0.245 | 0.609 | 12.72 | 137.8 | 184.3 | -15.5 | -6.7 | 139.6 | 184.6 | -7.1 | 78 | 20 | 0.29 |
| 19 | 27.50 | 29.91 | 0.118 | 0.521 | 15.42 | 117.3 | 174.9 | -20.5 | -9.5 | 117.6 | 176.0 | -8.6 | 95 | 27 | 0.25 |
| 20 | 31.58 | 33.69 | 0.000 | 0.426 | 18.29 | 86.8 | 164.1 | -30.5 | -10.8 | 91.0 | 166.0 | -9.9 | 0 | 31 | 0.24 |
| 21 | 35.97 | 37.78 | 0.000 | 0.328 | 21.25 | 80.1 | 153.0 | -6.6 | -11.0 | 79.5 | 154.5 | -11.6 | 0 | 51 | 0.21 |
| 22 | 40.67 | 42.19 | 0.000 | 0.230 | 24.16 | 78.0 | 138.4 | -2.1 | -14.6 | 78.3 | 140.5 | -13.9 | 0 | 87 | 0.12 |
| 23 | 45.70 | 46.92 | 0.000 | 0.138 | 26.90 | 75.7 | 123.1 | -2.3 | -15.4 | 76.5 | 127.6 | -12.9 | 0 | 72 | 0.08 |
| 24 | 51.04 | 51.98 | 0.000 | 0.055 | 29.35 | 73.9 | 103.9 | -1.8 | -19.2 | 74.8 | 111.2 | -16.4 | 8 | 0 | 0.01 |
| 25 | 56.71 | 57.39 | 0.000 | 0.000 | 31.40 | 71.7 | 88.3 | -2.3 | -15.6 | 72.6 | 97.4 | -13.8 | 0 | 0 | 0.00 |
| 26 | 62.70 | 63.16 | 0.000 | 0.000 | 33.02 | 69.1 | 82.1 | -2.6 | -6.2 | 70.5 | 89.9 | -7.5 | 0 | 0 | 0.01 |
| 27 | 69.02 | 69.29 | 0.000 | 0.000 | 34.21 | 67.2 | 81.7 | -1.9 | -0.4 | 69.0 | 85.9 | -4.0 | 0 | 0 | 0.00 |
| 28 | 75.68 | 75.80 | 0.000 | 0.000 | 35.01 | 64.2 | 81.4 | -3.0 | -0.3 | 67.0 | 85.4 | -0.6 | 0 | 0 | 0.00 |
| 29 | 82.67 | 82.70 | 0.000 | 0.000 | 35.50 | 79.3 | 99.2 | 15.1 | 17.8 | 128.7 | 146.7 | 61.3 | 0 | 0 | 0.00 |
| 30 | 90.00 | 90.00 | 0.000 | 0.000 | 35.77 | 33.6 | 33.6 | -45.6 | -65.5 | 54.0 | 54.0 | -92.7 | 0 | 0 | 0.00 |

### 7.2 Against the points of the brief

- (a) Under 2 degrees the face is as bright as at rest: frames 4 and 5 (0.36 and 1.29 degrees) read 215.0 and 215.1 live against 215.1 at rest, 217.7 and 217.8 in the film against 217.5. The lean frames 1 to 3 read +1.8, +1.6, +0.8 live (the page leans to the key by under 1 degree). The first frame darker than rest by more than 3 is frame 11 at 8.99 degrees (211.9); before it was frame 8 at 1.75 degrees (211.1). MET.
- (b) Steps of the angle, frames 1 to 8: -0.83, -0.11, +0.46, +0.84, +0.93, +0.99, +1.08, +1.19. The first is under 1.5. Signed, none is smaller than the one before, to frame 30 (step 7.30). From frame 4 (the slab passes flat) no step is more than twice the one before: the largest ratio is 0.84 / 0.46 = 1.83 into frame 4, then 1.11 and less. MET in the reading the Builder accepted. Before: 0.14, 0.13, 0.32, 0.53, 0.76, a stall of two frames at flat and then steps that grow by 2.4 times.
- (c) The gap at the foot opens from frame 5 (2 px) and grows every frame: 4, 6, 9, 12, 16, 20, 26, 33, 41, 51, 62 px to frame 16 (before: 0 until frame 6, 3 px at frame 8, 49 at frame 16). The slab's side at the foot: see 7.4. A shadow under the lifted edge: NOT MET, not possible (section 6). "Only as far as its angle to the light explains": withdrawn by the Builder at 13:43; the lights now go round by less than the slab at every angle.
- (d) The wind-up is kept: the lean is 0.83 and 0.94 degrees on frames 1 and 2 (before 0.89, 0.70), deepest 0.97 between frames, and it returns through flat between frames 3 and 4 with no stall. Not made deeper: decision 2.

### 7.3 The Builder's duties (c) and (d)

- The largest step of the face between two frames in a row (slab under 76 degrees): live -19.2 into frame 24, before -30.5 into frame 20. Film -16.4 into frame 24, before -26.6 into frame 20. Smaller than today's largest in both.
- The shadow of the right card: reach 9 px at rest, 10 at frame 11, 20 at frame 18, 31 at frame 20, 51, 87, 72 at frames 21 to 23, and by frame 24 its depth is 0.01 (gone). Its depth falls from 0.43 to 0.08 with ripples of 0.01 to 0.02 (0.40 to 0.42 into frame 7, 0.36 to 0.37 into frame 15) and no larger rise. The largest step of the reach is +36 into frame 22 at depth 0.12; before it was +35 into frame 18 at depth 0.20 (reach 78, then 95, gone at frame 20). The card does not jump or slide: its rim x moves by 1 to 3 px a frame through frame 23 (before 1 to 6), its middle y by steps that grow from 1 px at frame 5 to 12 px at frame 23 with none smaller than the one before by more than 1 (the columns `card rim x`, `card middle y`).

### 7.4 The slab's side at the foot

Read as the rows between the gap and the face that stand 8 or more under the face (a python read of the same pictures, columns x 900 to 1020). Film after, frames 4 to 20: 1, 1, 1, 1, 2, 1, 1, 2, 2, 3, 3, 4, 4, 4, 4, 6, 7 px. Film before, frames 6 to 16: 1, 1, 1, 1, 1, 1, 1, 2, 3, 3, 3. Live, before and after: 0 or 1 px. Where the face is dark (after frame 20) the read cannot tell side from face.

## 8. Which frames change

- Stepped, no browser (`tests/polish-turn2.test.ts`): the whole film's stage run with the old curve and the new, compared on every step. Changed frames: 811 to 839, 2731 to 2759, 3991 to 4019, 6511 to 6539, 8431 to 8459 (29 each). Seats at 858, 2778, 4038, 6558, 8478. Every other frame of the stage equal.
- Drawn, the turn into step 1 (`node pipeline/phase5/polish-turn2-same.mjs BEFORE AFTER`): film frames 806 to 809 byte equal, 810 to 839 not equal, 840 to 860 byte equal. Frame 810 changes as well as 811 to 839 because the shutter of 180 degrees gathers the half frame after it. Live: steps 593 to 597 equal, 598 to 626 (frames 1 to 29) not equal, 627 (frame 30) equal.
- So in pictures a turn's changed frames are START to START + 29: 810 to 839, 2730 to 2759, 3990 to 4019, 6510 to 6539, 8430 to 8459. The first is the turn's first, the last lies 19 frames before the seat (START + 48). The arriving half (START + 30 on) is equal.

## 9. Pictures seen at real size

Sheets: `node pipeline/phase5/polish-turn2-sheet.mjs BEFORE AFTER live|film FIRST out/work/polish-turn2/NAME`.

- `live1-edge.png`, `film1-edge.png` (frames 1 to 16, the foot at the left, real size, before above, after below). Before: the page stays seated and greys over frames 9 to 16; the gap is a hair until frame 10. After: the gap under the foot opens at frame 5 and grows every frame; the paper holds its rest light through frame 12 and is a little dimmer by frame 16. In the film the slab's side is a thin grey line along the foot from frame 4. The button on the page rides up with it, no jump.
- `live1-lean.png`, `film1-lean.png` (frames 0 to 3 at three times, the upper edge). Live: a dark line of 1 px over the head on frames 1, 2 and 3 (before: frames 1 and 2). Film: a dark line of 1 px on frames 1 and 2 and a fainter one on frame 3 (before: darker on frame 1, faint on frame 2). It reads as a hairline, the same as before, one frame longer. The lean itself (things on the page moving by 1 px) is not seen as a lean at real size.
- `live1-whole-08.png`, `-12`, `-16` (whole frames at half size). At frame 12 before, the page is flat and greyed; after, it is plainly tipped (26 px of backing under the foot) and as light as at rest.
- The arrow and the button, frames 0 to 15 at real size: they ride the page, no pop. The right card, frames 11 to 26: its shadow lengthens and fades, no pop.
- Not my piece, seen before and after alike: the words "(For Your" stand on the dark backing right of the page in live frames 22 to 26 of the turn into step 1.

## 10. The live site at the low level, the stills

- Low level (`node pipeline/phase5/polish-turn2-live.mjs OUT 1 2 20 low`, pictures 960 by 540), read against the high level of the same frames by the gap under the foot and a patch of bare paper: the gap is 1, 2, 3, 4, 6, 8, 10, 13, 16, 20, 25, 31 px at frames 5 to 16 where the high level has 2, 4, 6, 9, 12, 16, 20, 26, 33, 41, 51, 62 (half, as the picture is half), and the patch reads within 0.8 of the high level on every frame from 2 before the turn to frame 20 (at frame 16: 203.3 against 203.0). Seen: frame 12 at the low level is the same picture as at the high level, tipped and light. The low level takes the same path.
- Draft stills made before the change and after it, `cmp`: `key-step1-fire-hd-draft.png` byte equal, `key-step2-rest-hd-draft.png` byte equal.

