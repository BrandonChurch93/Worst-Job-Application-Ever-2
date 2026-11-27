# Polish tug 2: a key let go, the take, the slot after the give back (step 1, live site)

Branch `agent/polish-tug2` from `b3e4f902`. Files changed: `src/pages/step1/index.ts`, `src/pages/step1/real/shredder.ts`, `src/pages/step1/real/shredderShape.ts`, one condition in `src/cursor/body.ts`, `tests/polish-tug2.test.ts`, `tests/polish-tug2-run.ts`, `tests/polish-tug2-measure.test.ts`, `pipeline/phase5/polish-tug2-shots.mjs`, this note; one number each in `tests/fix-tug.test.ts` and two in `tests/polish-keys.test.ts` (named below).

How things were measured. Stepped, no browser: `POLISH_TUG2_TABLE=/tmp/m/NAME npx vitest run tests/polish-tug2-measure.test.ts` writes a row for each frame of 60 of step 1 under the pack's own visitor and under the keen bot. Pictures: `node pipeline/phase5/polish-tug2-shots.mjs walk LABEL 933-968 1815-1864 2520-2612` walks the live site at quality high under the pack's visitor (960 by 540; `POLISH_FORMAT=hd` for 1920 by 1080) and keeps every frame of the spans. Picture N shows table row N-1. Rows are frames of the visit from its start, 60 a second.

## The take (faults 2, 3, 4)

MEASURED before, visitor (bite at row 1823, 30.400 s; keen bot at row 1220):

- Arms: 0.12, 0.39, 0.67, 0.87, 0.99, 1.04 of their length on rows 1823 to 1828. Left as it is (agreed with the Builder 08:08 UTC).
- The turn the critic saw is not a swap of the drawn angle. Lean plus spin changes 8.1 degrees a frame at the most and the tail's lag (which turns the tail 0.85 rad at 1) 0.19 a frame. What goes in one frame is the drawn length: 1.207, 0.911, 0.639, 0.597 on rows 1846 to 1849, then held short for 15 frames. Cause: `MOVE.land` in `body.ts` kicks the length each time the arrow's speed falls through `MOVE.off`; under a hand, with the visitor's follow spring against the page's haul, it falls through it again and again.
- The way in: 2.2, 5.2, 7.7, 10.1, 12.9, 16.7, 18.5, 16.8, 13.8, 11.3, 9.4, 10.2, 12.5, 13.8, 14.1 px a frame from row 1824, slow first, then even, no stop.
- The tray answered the bite only (12 px, gone by row 1837).

What was changed, live only (the film path of `stepTug` is not touched):

1. `body.ts`: the stop kick is off while a visitor's arrow has its arms out: `if (now < MOVE.off && before >= MOVE.off && !(this.hand && s.arms)) s.squashV -= MOVE.land`. This is the one line of `body.ts` changed; `agent/polish-hand` adds `TAIL` to the same file, so the two branches meet there in a merge.
2. `index.ts`, `WAY`, `STOP`, `ANSWER`, `TAKE.haul` 0.2 to 0.15: from the step the hands close the page carries the arrow in over `TAKE.haul` seconds, `WAY.first` of the even pace at first and `WAY.last` at the end, to where the arms' pull and the visitor's hand balance. On the step after, what is left of its pace is taken out, it is thrown `STOP.back` px a second the other way, held for `STOP.still` seconds, and its length is pressed from `STOP.from` to `STOP.low` over `STOP.dip` seconds; the body's own spring takes the length up again.
3. The answer, with what is there: on the step the hands close the tray, still thrown by the bite, is put back at its rest (`ANSWER.grab`), on the step the arrow arrives it is thrown `ANSWER.stop` px and comes back. The paper swings from the grab as before.

MEASURED after, `npx vitest run tests/polish-tug2.test.ts`:

- visitor: the angle changes 9.4 degrees a frame at the most, the length 0.115, the shortest length in the 24 frames from the bite is 1.078 (before 0.597).
- visitor way in from the grab (row 1827) to the stop (row 1836): 15.4, 20.6, 19.6, 17.1, 14.4, 13.0, 11.0, 9.3, 11.0, 2.7 px nearer the slot a frame. Keen: 11.3, 14.1, 13.9, 13.3, 12.4, 11.1, 9.6, 8.1, 6.6, 1.9.
- tray: row 1826 to 1827 it goes from 346.92 to 342.00 (the grab), row 1835 to 1836 from 342.00 to 347.07 (the arrival), then back one way by row 1850.
- length over the stop, rows 1835 to 1843: 1.281, 1.214, 1.099, 1.078, 1.115, 1.169, 1.224, 1.270, 1.298.
- the rest of the tug, rows 1850 to 2339: the length changes 0.091 a frame at the most (before 0.133), least 0.840 (before 0.597).
- where the arms let go (row 2389): the length is 0.883, 0.882, 0.882 on rows 2388 to 2390, the same numbers as before; the page's own sets of the length on rows 2340, 2371, 2527, 2557, 2560 are the same numbers as before.

After the stop the visitor's pointer goes off at 25 px a frame (rows 1835 to 1842) and the arrow follows it round on its arms, 4 to 19 px a frame, as far from the slot as before (146 to 151 px). That is the visitor's hand, not the page's haul.

## The slot after the give back (faults 5, 6)

MEASURED before: `open` 1 to 0 on rows 2575 to 2603, 29 frames; in the pictures the cassette is down by 2586, a black bar 2587 and 2588, the pale panels 2589 to 2594, an outline fading 2595 to 2604.

Changed where it is made (`SHUT` in `index.ts`, `poseCassette` in `real/shredder.ts`, `gapLeft` in `real/shredderShape.ts`), so the film shares it: the hood folds and the cassette starts down as before; at `SHUT.down` of the travel the two panels snap shut over it in `SHUT.snap` seconds, the cassette going down under them, the end plates drawn in with them; on the step they meet the slot is gone and the tray is thrown `SHUT.kick` px and comes back.

MEASURED after, `npx vitest run tests/polish-tug2.test.ts`: closing from row 2575, the panels snap from row 2585 with 0.59 and 0.24 of their gap left, gone at row 2587 (before: `open` at 0 on row 2603); `open` never rises; the tray is thrown 3.00 px on the frame the slot is gone and comes back one way. In the pictures (a picture N shows row N-1; 2585 to 2588): the cassette with the hood folded, the panels half shut over the cassette going down, a slit, gone. No frame shows a black bar.

## A key let go (fault 1)

MEASURED before, key P under the visitor: pressed row 939, let go row 954. Sunk by 0.70, 0.289, -0.058, -0.236, -0.243, -0.149, -0.048, -0.002 of its travel on the frames from 953: three frames to its rest height, 1.3 px past it (the slide is 5.5 px for the whole travel), at rest after 8 frames.

Changed where it is made (`RELEASE`, `release()` in `index.ts`, used by `stroke`; the film's keys use the same): up through rest inside `RELEASE.up` (0.034 s), `RELEASE.over` (0.45) of the travel past it, back at rest `RELEASE.settle` (0.084 s) later without crossing rest again. The press, the sound and the event are as they were.

MEASURED after, `npx vitest run tests/polish-tug2.test.ts`: key P let go at row 954; the slide of the cap on the frames from there is 1.59, -2.32, -1.62, -0.92, -0.42, -0.11, 0.00 px (of 5.5 px for the whole travel): above rest on the second frame, 2.3 px past it, at rest on the seventh frame, rest crossed once. Looked at on a 1920 by 1080 picture at 100% (pictures 955 to 958): the pass over rest reads as the cap standing up and to the left of its seat for two frames, and the cap does not look loose.

While it is down the socket's lip is seen at 1920 by 1080 as the pale band about 5 px wide along the top and the left of the dark cap; a try at a shadow line there (the cap's own shadow crossed to that side) did not show in the 1920 by 1080 picture and was taken out again. Nothing changed for the lip.

Not mended: the wisp of smoke over the key at the release is the arrow's own, drawn by the arrow's view, which is not in this piece; and the arrow is the visitor's, it leaves when the visitor moves it.

## Left as they are

- Strips (fault 7): MEASURED, 15 strips lie from row 2496 to 2575 and on 60 of 78 frames every strip is exactly where it was the frame before (`npx vitest run tests/polish-tug2.test.ts`); on the others they are drawn back one way. Nothing changed. Six frames in a row are in the pictures.
- The given back arrow (fault 8): decided by the Builder 08:08 UTC, nothing changed. The test pins the stand: 12 frames before the visitor has it the arrow is upright (under 0.1 degrees), at its length, at one height and does not move.
- The tray's drop on the frame the cassette throws the arrow out (row 2557, `CAUGHT.kick`): left. In the pictures it comes on the frame the arrow is thrown out of the hood, so it reads as the tray's own answer to that throw.
- The length going from 1.08 to 1.28 on the frame of the loss (row 2340, `LOSS.long`): the page's own, the same number before and after, not in this piece.

## Numbers in other owners' tests that this work changes

- `tests/fix-tug.test.ts`: the share of the whole take the arrow may have gone in the first 0.1 s after the bite, 0.1 to 0.25. The hands close 0.079 s after the bite and the way in is now fastest in its first frames (asked for in this round); measured 27.3 px of 112.8 px (0.24).
- `tests/polish-keys.test.ts`: the cap's sink on the frame of the release, over 0.4 to over 0.2 (measured 0.289: it is further up after one frame); the furthest past rest, over -0.3 to over -0.5 (measured -0.42).

## Which film frames change (MEASURED 08:39 UTC)

How: `pipeline/phase5/polish-tug-filmdiff.ts.txt` copied as `tests/polish-tug-filmdiff.test.ts` into this branch and into a worktree of `b3e4f902`, run on each with `FILMDIFF=<path> npx vitest run tests/polish-tug-filmdiff.test.ts`, then removed. Film frame = unit frame + 840.

- Events: 351 lines on both, byte equal by `cmp`. No event of the film moves.
- Frames of step 1 that differ: 754 of 1920.
- The keys (gags `step1.firstName`, `step1.lastName`, `step1.email`), from the release of each typed key: film 1004 to 1014, 1016 to 1188, 1329 to 1530, 1536 to 1564, 1574 to 1581, 1607 to 1614, 1636 to 1644, 1667 to 1674, 1697 to 1704, 1726 to 1929, 1933 to 1942, 1945 to 1966, 1972 to 2012, 2017, 2019 (735 frames; 292 of them in the keys' own draw). The arrow stands on the cap it types, so its pose differs by a little for the frames after each release as well.
- The slot's closing (gag `step1.shredded`): film 2680 to 2698 (19 frames).
- No other page's film is touched: the changed code is in `src/pages/step1/**`, and the one changed condition in `body.ts` is false wherever `hand` is unset, which is every film.

## Stills

STILLS

## Checks

CHECKS
