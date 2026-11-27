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
