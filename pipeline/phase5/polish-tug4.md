# Polish, the tug, round 4: the crease before the grab, and the arrow parked after the drop

Branch `agent/polish-tug4`, from `agent/polish-tug3` at `eb567cdf` (which holds `origin/main` at `308e96a1`). Every number is labelled MEASURED (read from the stepped stage or from drawn frames in this work), STATED (taken from the Builder, the critic or the code) or UNKNOWN. Frames are 60 a second. A "row" is a step of the visit under the pack's visitor; picture N of a walk shows row N-1.

## What was asked

Three issues of the round 25 critic, set B, on step 1 (pack clock, STATED):

1. set-B-05, 0:31.75 to 0:31.88 (pictures 1905 to 1913): the arrow and paper hold nearly the same pose for three frames, then step up together.
2. set-B-03, 0:31.40 to 0:31.48 (pictures 1884 to 1888): the paper abruptly creases while the hands are still next to the arrow.
3. set-B-09, 0:43.93 to 0:44.07 (pictures 2636 to 2644): the arrow stays parked after the drop despite mouse movement, and the first frame of control is almost identical.

Rulings of the Builder, 13:07 UTC (STATED): issue 2 mended live and in the film, the bite, the sheet's jerk, the tray's throw and the start value of Phase 3 decision 42 untouched; issue 1 accepted as read, the near stillness between the arrival and the first answer CONTESTED and not changed; issue 3 mended live only, the film byte equal, the ease of 0.44 s kept; the release 7 frames sooner was approved on my word that no round had set it, which was wrong (see issue 3).

## Issue 2: the crease before the grab

Cause (MEASURED, read in `src/pages/step1/index.ts` and in the rows): the sheet's shape carries a number for its held look, `v[10]`. It was set to 1 on the step the tug begins (row 1883, the event `arms-out`), four steps before the hands close (arms out 0.12, 0.40, 0.67, 0.87, 0.99 of their length on rows 1883 to 1887; hands closed on row 1887). In the film it was 1 from film frame 2162, with the arms at 0.02, 0.25, 0.54, 0.78, 0.94, 1.02 on 2162 to 2167.

The mend, in `src/pages/step1/index.ts` only: the tug keeps a number `held` that is 0 until the hands are on the sheet and then rises to 1 over `TAKE.crease` (0.05 s, three steps). `v[10]` is that number, with a floor of `TAKE.bare` (0.001) so the sheet keeps the place it had. Nothing else of the sheet is touched.

After (MEASURED in rows): live `v[10]` is 0.001 on rows 1883 to 1886, then 0.167, 0.5, 0.833, 1.0 on rows 1887 to 1890. Rows 1883 to 1889 differ from before in that one number only; the sheet's box, its turn, the hands and the arrow are equal to before on every row. Film: `v[10]` is 0.001 on 2162 to 2166, 0.333 on 2167, 0.667 on 2168, 1 from 2169.

Seen in pictures (frames in a row, before above, after below, real size): live, the sheet shows no crease on pictures 1884 to 1887 while the hands travel; the crease comes in on pictures 1888 to 1891 with the hands on the corners. Film, the creased look is absent on 2162 to 2166 and comes in on 2167 and 2168 with the hands on the sheet.

What is left open, said plainly:

- Live, the sheet still drops on picture 1884, the frame the arms come out: its top edge at page x 790 goes from y 593 to y 606 (MEASURED in pixels; 593 to 609 before), with the tray thrown 8 px. That is the bite and the sheet's jerk, which the ruling keeps. So the sheet's pose is not wholly still through the reach; only the creased look waits for the hands.
- Film, the sheet still turns to -11.74 degrees on film frame 2162, before the hands reach it (MEASURED). I tried the film waiting for the grip: the film's arrow is carried by the sheet's pull from the tug's first frame, so that changed the arrow's pose on 93 film frames, 2162 to 2263, by up to 40 degrees at 2190 (MEASURED). That is past the take, so by the ruling's fall back only the creased look waits in the film and the turn stays.
- A first live version kept the sheet in its place before the bite while the hands travelled (commits `bb436274`, `b81b2dfd`). In pictures the sheet then stood still while the mouth and tray were thrown under it, or rode them and then jumped on the grab. It also moved the sheet's jerk, which the ruling keeps. Taken out in `c29560aa`.

The Builder's question, the tray put back 5.0 px in one frame on the grab (picture 1888, MEASURED): it is a decision of round 24, not a leftover. `ANSWER = { grab: -9, stop: 7 }` and `jolt(Math.max(0, joltNow() + ANSWER.grab))` in `src/pages/step1/index.ts`; `pipeline/phase5/polish-tug2.md` point 3 ("on the step the hands close the tray, still thrown by the bite, is put back at its rest"), made for the fault "The tray answered the bite only". So it is contested and stays.

## Issue 1: the hold, then the step up together

No change (ruled CONTESTED for the stillness; the hold and step not found). MEASURED in rows 1900 to 1915, equal before and after: the arrow's tip moves 13.7, 17.2, 18.9, 16.7, 11.3, 5.6, 1.5, 1.3, 2.1, 1.6, 1.2, 0.6, 0.1, 0.2, 0.3, 0.6 px a step; the arrow turns 9.1, 6.7, 3.4, 1.6, 0.4, -0.6, -1.4, -1.8, -2.0, -2.0, -1.8 degrees a step from row 1903 to 1913; the sheet turns 5.7, 4.9, 2.7, 0.8, -0.3, -0.8, -0.7, -0.5, -0.3, -0.1 degrees a step on rows 1903 to 1912. No two rows are equal and no step is larger than the one before it once the arrival ends. The tray is thrown 5.1 px on picture 1897 and is at rest by 1911 (MEASURED in pixels). The near stillness of rows 1912 to 1923 is the rest of `HEAVE.rest` (0.615 s, round 3), logged as an open item by the Builder.

## Issue 3: parked after the drop

Before (MEASURED in rows): the arrow is down and at its length on row 2622; the pack's visitor moves the mouse 25 px a step from row 2629; control is back on row 2641. The arrow stands 19 steps, 12 of them under a moving mouse. Its first moves are 0.02, 0.30, 1.16, 2.69 px, so the first frame of control looks like the last frame of the stand.

Rule 6, and a mistake of mine: the stand is set by `CAUGHT.beat` 0.4, from commit `fc10b9ba` in the round of the keys, on the Builder's ruling there (`pipeline/phase5/polish-keys.md` point 8: "the stand before the visitor has the arrow again keeps the numbers of the earlier fixes ... the arrow stands 20 frames after the throw. A first pass of this work had a stand of 4 frames ... that is undone"). `tests/polish-keys.test.ts` (at least 18 still frames) and `tests/fix-tug.test.ts` (settled for 0.3 s before the mouse has it) hold it. In my first message of this round I told the Builder that no round had set those steps. That was wrong; I had read only the rounds of the tug. A first pass (commit `bb436274`) released the arrow 7 steps sooner (`CAUGHT.beat` 0.28) and those two tests failed in the whole `npm test`. The sooner release is CONTESTED and was taken out in `a12572c8`; no test of another owner was changed. `GIVE.back` 0.44 (round 22) and the stand of at least 12 (round 24) are contested as well and stay.

The mend that stays, live only, in `src/pages/step1/index.ts`: on the step of the release and the one after, the arrow is drawn up toward `GIVE.wake` (1.12 of its length) over `GIVE.woke` (0.034 s) and then let go; the body's own spring brings it back. This is the critic's second way, a pose on the exact handoff frame.

After (MEASURED in rows): control is back on row 2641, as before. Length 1.059, 1.118, 1.094, 1.052, 1.023, 1.013, 1.021 on rows 2641 to 2647 (before 1.000, 1.000, 0.981, 0.958, 0.957, 0.973, 1.004). The arrow's moves are equal to before on every row (0.02, 0.30, 1.16, 2.69, 4.95, 7.78, 11.11 px on rows 2641 to 2647; no snap to the mouse). 23 rows from 2641 to 2673 differ from before, in the length only. `button-press` stays on row 2679, `tug-lost` on 2400, `strips-zip` on 2556, and the visit has the same 2041 rows: no event moved.

Seen in pictures (2637 to 2650, before above, after below, real size): the arrow's drawn height is 69 px on pictures 2638 to 2641, then 73, 77, 75, 71, 70, 69 px on 2642 to 2647 (MEASURED in pixels; before 69, 69, 67, 65, 65, 66). The stretch goes up over two frames and comes back over four, so by measure it is not a one frame pop. It is small: 4 px of 69 on the handoff frame, 8 px on the next. Whether it reads as the arrow coming alive is the Builder's call from the picture.

What is left open, said plainly: the arrow still stands 19 steps (0.32 s) after it is down, 12 of them while the pack's visitor is already moving the mouse. That part of the critic's issue is not mended, because the stand is a ruling of an earlier round. The first three frames of control still move less than 1.2 px, because the ease of 0.44 s is contested; the stretch is the only thing that marks the handoff.

## The film

Changed film frames, from the film diff (`pipeline/phase5/polish-tug-filmdiff.ts.txt`, the shapes and poses of each frame of step 1, before `eb567cdf`, after this work): 2162, 2163, 2164, 2165, 2166, 2167, 2168 (MEASURED). In each only the sheet's `v[10]` differs. Nothing differs outside them. The event lists are byte equal, so no sound event and no step of the script moved. The arrow's poses are unchanged (`FILM_POSES` in `tests/polish-tug3.test.ts` still passes). Film frames 2160 to 2171 were drawn before and after at the draft tier and looked at in a row.

UNKNOWN: the key stills and the full film were not rendered again in this round; the claim rests on the film diff of shapes and on the twelve drawn frames.

## Tests

`tests/polish-tug4.test.ts` (new, mine): the sheet takes its held look only once the arms are at 0.9 of their length, by degrees over 2 to 4 frames, live under two visitors and in the film; the given back arrow stands at least 12 frames, is drawn at least 1.04 of its length on the frame the visitor has it and 1.1 within two, is within 0.03 of its length six frames on, and goes off by degrees. `tests/polish-tug4-measure.test.ts` writes the rows (`POLISH_TUG4_TABLE=/tmp/x`). No test of another owner was changed in this round. Before this round, on `agent/polish-tug3`, the pin of my own `tests/polish-tug3.test.ts` was mended to count from the step the arms come out (merge 50 had moved the visit by 60 steps).

## Commands

- Rows: `POLISH_TUG4_TABLE=/tmp/x npx vitest run tests/polish-tug4-measure.test.ts`
- Live pictures: `POLISH_FORMAT=hd node pipeline/phase5/polish-tug4-shots.mjs walk LABEL 1880-1892 2632-2650`
- Pairs: `node pipeline/phase5/polish-tug4-pair.mjs BEFORE_DIR AFTER_DIR FIRST COUNT LEFT TOP W H COLS OUT`
- Film frames: `npm run -s seq -- --first 2158 --last 2173 --tier draft --force`
- Film diff: copy `pipeline/phase5/polish-tug-filmdiff.ts.txt` to `tests/polish-tug-filmdiff.test.ts`, run it with `FILMDIFF=/tmp/x`, remove it.
