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

Decision: the jaw keeps its three numbers (`tests/step1-script.test.ts` holds that count, and a fourth number would change the film's record on every frame the slot is drawn). While the panels snap the first number is below zero and says how far through the snap they are; the slot is then held open at `SNAP_FROM` (0.54, in `real/shredderShape.ts`, which `SHUT.down` reads). A slot told to close before it is `SNAP_FROM` open closes the old way from where it is.

MEASURED after, `npx vitest run tests/polish-tug2.test.ts`: closing from row 2575, the panels snap from row 2585 with 0.59 and 0.24 of their gap left, gone at row 2587 (before: `open` at 0 on row 2603); `open` never rises; the tray is thrown 3.00 px on the frame the slot is gone and comes back one way. In the pictures (a picture N shows row N-1; 2585 to 2588): the cassette with the hood folded, the panels half shut over the cassette going down, a slit, gone. No frame shows a black bar. Walked again on the last source commit (`aa92dd90`, label `after2`, 08:59 UTC): the key (pictures 950 to 962), the take (1826 to 1852) and the slot (2580 to 2594) differ from the earlier after walk by the page's grain only (no pixel by more than 24 of 255).

## A key let go (fault 1)

MEASURED before, key P under the visitor: pressed row 939, let go row 954. Sunk by 0.70, 0.289, -0.058, -0.236, -0.243, -0.149, -0.048, -0.002 of its travel on the frames from 953: three frames to its rest height, 1.3 px past it (the slide is 5.5 px for the whole travel), at rest after 8 frames.

Changed where it is made (`RELEASE`, `release()` in `index.ts`, used by `stroke`; the film's keys use the same): up through rest inside `RELEASE.up` (0.034 s), `RELEASE.over` (0.45) of the travel past it, back at rest `RELEASE.settle` (0.084 s) later without crossing rest again. The press, the sound and the event are as they were.

MEASURED after, `npx vitest run tests/polish-tug2.test.ts`: key P let go at row 954; the slide of the cap on the frames from there is 1.59, -2.32, -1.62, -0.92, -0.42, -0.11, 0.00 px (of 5.5 px for the whole travel): above rest on the second frame, 2.3 px past it, at rest on the seventh frame, rest crossed once. Looked at on a 1920 by 1080 picture at 100% (pictures 955 to 958): the pass over rest reads as the cap standing up and to the left of its seat for two frames, and the cap does not look loose.

While it is down the socket's lip is seen at 1920 by 1080 as the pale band about 5 px wide along the top and the left of the dark cap; a try at a shadow line there (the cap's own shadow crossed to that side) did not show in the 1920 by 1080 picture and was taken out again. Nothing changed for the lip.

Not mended: the wisp of smoke over the key at the release is the arrow's own, drawn by the arrow's view, which is not in this piece; and the arrow is the visitor's, it leaves when the visitor moves it.

## The arrow is not hauled before the hands close (asked by the Builder 09:08 UTC)

`tests/fix-tug.test.ts` held that the arrow goes under a tenth of the whole take in the first 0.1 s; that share is now 0.25, because the way in is fast at first. What the old number stood for is pinned in `tests/polish-tug2.test.ts` instead. MEASURED: from the bite to the frame before the hands close the arrow goes 0.68 px from the hand in a frame at the most under the visitor (rows 1823 to 1826) and -0.55 under keen (rows 1220 to 1223), held at 1 px; over those frames it comes 13.1 px nearer the slot where the hand comes 38.4 (keen 18.1 against 32.1), held at no more than 1 px beyond the hand.

## The tray at 1920 by 1080 (asked by the Builder 09:08 UTC)

MEASURED on a walk at 1920 by 1080 of the last source commit, pictures 1833 to 1850: the upper edge of the words on the tray is 0, 0, 0, 0, 5, 4, 4, 3, 2, 2, 2, 1, 1, 1, 0, 0, 0, 0 px below its rest. The table (`zoneY` of rows 1832 to 1849 less 342.00, times `JOLT.panel` 0.75): 0, 0, 0, 0, 5.07, 4.38, 3.74, 3.15, 2.61, 2.12, 1.68, 1.29, 0.96, 0.67, 0.44, 0.25, 0.12, 0.03. Thrown on the arrival, back one way over 13 frames, never above rest, the same at both sizes.

## Left as they are

- Strips (fault 7): MEASURED, 15 strips lie from row 2496 to 2575 and on 60 of 78 frames every strip is exactly where it was the frame before (`npx vitest run tests/polish-tug2.test.ts`); on the others they are drawn back one way. Nothing changed. Six frames in a row are in the pictures.
- The given back arrow (fault 8): decided by the Builder 08:08 UTC, nothing changed. The test pins the stand: 12 frames before the visitor has it the arrow is upright (under 0.1 degrees), at its length, at one height and does not move.
- The tray's drop on the frame the cassette throws the arrow out (row 2557, `CAUGHT.kick`): left. In the pictures it comes on the frame the arrow is thrown out of the hood, so it reads as the tray's own answer to that throw.
- The length going from 1.08 to 1.28 on the frame of the loss (row 2340, `LOSS.long`): the page's own, the same number before and after, not in this piece.

## Numbers in other owners' tests that this work changes

- `tests/fix-tug.test.ts`: the share of the whole take the arrow may have gone in the first 0.1 s after the bite, 0.1 to 0.25. The hands close 0.079 s after the bite and the way in is now fastest in its first frames (asked for in this round); measured 27.3 px of 112.8 px (0.24).
- `tests/polish-keys.test.ts`: the cap's sink on the frame of the release, over 0.4 to over 0.2 (measured 0.289: it is further up after one frame); the furthest past rest, over -0.3 to over -0.5 (measured -0.42).

## Which film frames change (MEASURED 09:23 UTC, on `848967b5`)

How: `pipeline/phase5/polish-tug-filmdiff.ts.txt` copied as `tests/polish-tug-filmdiff.test.ts` into this branch and into a worktree of `b3e4f902`, run on each with `FILMDIFF=<path> npx vitest run tests/polish-tug-filmdiff.test.ts`, then removed. Film frame = unit frame + 840.

- Events: 351 lines on both, byte equal by `cmp`. No event of the film moves.
- The arrow's pose (every number of it, full precision) on each of the 1920 frames of step 1: byte equal by `cmp` to `b3e4f902`.
- Frames of step 1 whose draw list differs: 311 of 1920.
- The keys' own draw (gags `step1.firstName`, `step1.lastName`, `step1.email`), 292 frames: film 1004 to 1012, 1029 to 1036, 1043 to 1050, 1102 to 1118, 1329 to 1337, 1351 to 1358, 1369 to 1376, 1388 to 1395, 1397 to 1405, 1409 to 1416, 1430 to 1437, 1469 to 1476, 1507 to 1514, 1544 to 1551, 1574 to 1581, 1607 to 1614, 1636 to 1644, 1667 to 1674, 1697 to 1704, 1726 to 1733, 1757 to 1764, 1792 to 1827, 1830 to 1904. Nothing but a cap's slide and its legend differs on them.
- The slot's closing (gag `step1.shredded`), 19 frames: film 2680 to 2698.
- No other page's film is touched: the changed code is in `src/pages/step1/**`, and the one changed condition in `body.ts` is false wherever `hand` is unset, which is every film.

Decision by the Builder, 09:23 UTC: the ground a pressed cap gives the arrow that stands on it keeps the rise it had (`footing` in `index.ts`, the old spring), for the film and the visitor alike. With the new release as the ground, the film's arrow was tossed where it still stood on a cap that was let go: MEASURED on the build before, film 1405 to 1415, its height up to 13.9 above what it was and its spin up to 0.44 rad apart (754 frames differed then). No one asked for that; it is out.

Looked at, at 1920 by 1080 and 100%, every frame, before above and after below (`npm run seq -- --first N --last M --tier draft --format hd` on the branch and on `b3e4f902`):

- the film's key P (pressed film 998, let go 1004), film 1000 to 1014: the arrow has left the cap before it is let go and is the same in both rows; the cap is up one frame sooner and stands a little up and left of its seat on 1006 and 1007. (The after row was rendered one commit back; the caps' draw and the arrow's pose on those frames are the same on the last commit, by the film diff.)
- the film's key Y with the arrow standing on it, film 1400 to 1417, after row rendered on `848967b5`: the arrow is the same in both rows on every frame; it slides off the cap's right edge on 1409 to 1411 as before. On no frame is the arrow's foot seen in the cap or the cap seen through the arrow.
- the live site, the visitor's key P with the arrow resting on it, pictures 951 to 965 (after only, `848967b5`): the cap is sunk to 954, up at 955, past its seat at 956, settling 957 to 959; the arrow is drawn over the cap throughout and leaves down and left from 955.

## Stills

MEASURED 08:56 UTC: `npm run still -- --key K --format hd --tier draft` for `step1-fire`, `step1-tug`, `marketing-top`, each then `cmp out/work/stills/key-K-hd-draft.png /tmp/stills-before/key-K-hd-draft.png` against the same stills made on `b3e4f902` before the work. All three are byte equal: `marketing-top` as it must be, and neither step 1 key changed (neither stands on a frame of a key's release or of the slot's closing).

## Checks

Run one at a time on the last source commit `848967b5` (after it only this note changes):

- `npm test`: 160 files passed, 4 skipped; 1952 tests passed, 5 skipped (09:32 UTC). At the start: 159 files passed, 3 skipped; 1939 tests passed, 3 skipped. A run three commits earlier failed in `tests/step1-script.test.ts` (the jaw had four numbers while it snapped); mended in the source, see the decision under the slot.
- `npx vitest run tests/polish-tug2.test.ts`: 13 tests passed, inside the whole run.
- `npm run determinism`: pass, 12 pictures at hd, tier draft, identical across two fresh loads and two orders (09:36 UTC).
- `npm run bots`: all clear, keen reached every one of the 37 gags on every seed (09:37 UTC).
- `npx tsc --noEmit -p .`: clean, exit 0 (09:38 UTC), run last.
- Stills: `step1-fire`, `step1-tug` rendered again and `marketing-top` rendered again with `--force` (without it the tool reuses the 08:56 picture), each byte equal by `cmp` with `/tmp/stills-before/` (09:38 UTC).
- Live events of step 1 under the pack's visitor (49 rows): pinned in `tests/polish-tug2.test.ts`, which passes on `848967b5`. Under the keen bot (31 rows): compared byte equal before and after on an earlier build of this branch; on `848967b5` not compared again, UNKNOWN beyond the bots run.
