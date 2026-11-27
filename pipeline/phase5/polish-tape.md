# The tape of the careers page stays in its window

Branch `agent/polish-tape`, made from `agent/polish-turn2` d7388ff3. Times are UTC, read with `date -u`.

## 1. The fault

In the turn from the careers page into step 1 the tail of a tape run stands in ink on the dark backing right of the page (live frames 20 to 27 of the turn, film frames 829 to 837). Found in the turn job, `pipeline/phase5/polish-turn2.md` section 13.

## 2. The cause

`src/pages/marketing/index.ts`, `ticker()`: a run that had begun inside the window but did not end in it was pushed as a text with a box of 2 px at its true x, left aligned (and a run that was leaving, right aligned from its true end). The maker of type sets the whole line from there. Nothing cut it: the part outside the window lay under the page's slab, and the part past the page's edge at x 1920 (or left of x 0) lay in the open, outside the picture at rest and in sight when the page turns away.

MEASURED before the change (a stepped probe of the film's marketing unit, every step of 14 s): at the steps printed (one in 60) a run reached 420 px right of the window's right end (x 1774) and 216 px left of its left end (x 146), that is to x 2194 and x -70. The largest over all steps was not kept.

## 3. The two ways

- Way 1, do not draw a run until it lies whole in the window: NOT taken. It would pop. MEASURED: the runs are 223 to 489 px wide (15 lines), the solid frost over each end of the window is 190 to 276 px long (it changes with the page's time). A run of 432 px would first be drawn with its head 258 px into the clear glass, all at once.
- Way 2, cut the run at the window's end: taken. The text shape could not cut at its width (read in `src/shell/real/type.ts`, `dataOf`: the shape's width only places the line), so the type spec gains `cut`.

## 4. What was changed

- `src/stage/types.ts` (another owner's, in the `NEEDS:` commit): `TypeSpec.cut?: boolean`.
- `src/shell/real/type.ts` (another owner's, in the `NEEDS:` commit): `cutLine()`, and `dataOf` sets a cut run only as far as its box is wide, in whole glyphs from the end it is aligned to; the maker's key holds the cut. A run without `cut` goes the way it went: no other text of the site is touched.
- `src/pages/marketing/index.ts`, `ticker()` and a helper before it (`cutOf`, `CUT_HEAD`, `CUT_TAIL`, `CUT_INK`): a crossing run gets a box from its head to the last glyph that ends 3 px inside the window's right end (coming in), or from the first glyph that begins 3 px inside the left end to its tail (leaving). The 3 px are for the ink that stands outside a glyph's own width (MEASURED 1.52 px on the first run that failed a check with 1.5 px of room, `ticker-3-run` at step 1682; the largest was not looked for, and 3 px passes on every step tested). A run is whole only when it lies 3 px inside both ends. Where no glyph fits yet the run is not pushed.
- The words: the line still comes from `content/copy.json` by its key; the cut keeps the line's first or last glyphs in their places (tested). The order and the speed of the tape are untouched.
- The patch for the two files of other owners: `pipeline/phase5/polish-tape-NEEDS.patch`.

## 5. Lines changed in tests of other owners

The two tests held the number 2 as the mark of a crossing run (its box was 2 px wide). A crossing run's box is now as wide as its part in the window, so the mark is the `cut` of its type.

- `tests/careers-fix.test.ts`, "shows whole items in the middle of the ticker at rest and at the key, with the same clear glass on both sides of them": `d.w > 2` to `d.type?.cut !== true` (the whole runs), `d.w === 2` to `d.type?.cut === true` (the crossing runs, which the test wants under the solid frost).
- `tests/marketing.test.ts`, "keeps the tape inside its window: a run that crosses an edge keeps its box centre in the well, so the page hides the rest": `if (r.w === 2) crossing++` to `if (r.type?.cut === true) crossing++`.

Nothing else in them is changed; what they ask of the runs (whole runs centred, crossing runs under the solid frost, every box centre in the well) holds as before.

## 6. What was drawn, and how

Before is d7388ff3 in a second tree, after is this branch; both built fresh. Film: `npm run -s seq -- --first A --last B --tier draft --format hd --force`. Live: `node pipeline/phase5/polish-turn2-live.mjs OUT 1 14 30 high` (the turn into step 1 starts at the visitor's step 597; pictures of steps 583 to 627). Stills: `npm run -s still -- --key KEY --tier draft --format hd --force`. Compared with `cmp`, `polish-turn2-same.mjs` and `polish-tape-sheet.mjs diff|where`. Sheets: `polish-tape-sheet.mjs strip|end|turn`, in `out/work/polish-tape/`.

## 7. What must not change: MEASURED

- Stills `key-marketing-top`, `key-step1-fire`, `key-step2-rest`: each byte equal before and after (`cmp`).
- Film frames with no cut run in the list, 54, 55, 390, 391, 560, 561: each byte equal.
- Film frames 654 to 665, the careers page at rest with a cut run under the frost on every one (frame 654: `ticker-4-run` in a box from x 1613 to 1766, cut at its head; `ticker-14-run` from x 155 to 329, cut at its tail): 654 and 656 to 665 byte equal. Frame 655: 6 pixels differ, at x 1918 to 1919, y 1016 to 1018. Before, one dark pixel (138 against 201) stood at the picture's right edge, the old tail seen at the edge of the page itself; after it is gone.
- Live steps 583 to 600 (14 at rest, then the first 4 of the turn): byte equal. Step 627 (step 1 arriving): byte equal.
- No pixel inside the strip differs on any frame at rest. The cut lies about 180 px under the solid frost (a run first shows near x 1585, the cut is at x 1766 or further right), so it is not seen as an edge.
- Seen at real size and at three times: `strip-live.png` (steps 583 to 594, x 1420 to 1620, y 1006 to 1032 at three times, before left, after right): the bracket and the A of the next run slide out from under the frost a little further on every picture, alike on both sides. `strip-film.png` (654 to 665, the same cut): the run's last words move left on every frame, the first stroke of the next run shows faintly from frame 663 on, alike on both sides. `end-film.png` (654 and 655, the strip's right end x 1392 to 1792, y 990 to 1048 at three times, before above, after below): the glass runs unbroken to the rounded end in all four, no edge and no letter under the frost. No run pops in.

## 8. The mend: MEASURED and seen

- Live, the turn into step 1: steps 601 to 626 differ (14 to 737 pixels a picture), in the rows of the strip right of the page (x up to 1919) and on some pictures also left of it (x from 184). `turn-live.png` (steps 616 to 625, frames 19 to 28 of the turn, x 1380 to 1920 at real size, before above, after below): before, "(For Your Safety)" stands in dark ink on the backing right of the page on all ten; after, the backing is bare on all ten.
- Film: frames 827 to 839 differ (289 to 1210 pixels a frame, x 1677 to 1919, from 836 also from x 183 on the left). `turn-film.png` (829 to 837): before, "Status: Yes (" stands on the backing on 831 to 836; after, bare.
- The arriving half of the turn back to the careers page (the film's sixth turn, variant rejected), frames 9075 to 9095 in a row: 19 have no pixel that differs. 9081 and 9085 differ in 9 pixels each, a 3 by 3 spot at x 1910, y 821 and at x 1864, y 927: before, one dark pixel (122 against 171) stood in the frosted end of the strip; after it is gone. No tail stands on the backing in the arriving half, before or after: the page comes up from lying flat, as wide as the picture. `arrive-film.png` (9079 to 9088): the pairs are alike.

## 9. Which film frames change

- The draw list: the careers page is drawn on 944 of the film's 9180 frames (0 to 839 and 9076 to 9179). On 879 of them the list holds a cut run (817 heads, 446 tails), so the list differs from before on those: the crossing run's box is as wide as its part in the window where it was 2 px, and its type holds `cut`. On 65 frames (49 to 60, 377 to 404, 548 to 572) no run is cut. `pipeline/phase5/polish-tape-list.ts.txt` is the count (run as a test).
- The pictures, of the 52 frames drawn in both trees: byte equal on 654, 656 to 665, 54, 55, 390, 391, 560, 561, 9075 to 9080, 9082 to 9084, 9086 to 9095 (36 frames); not equal on 655 (6 pixels), 827 to 839 (the tail on the backing), 9081 and 9085 (9 pixels each).
- Where the list changes and nothing can be seen to change: the cut run lies under the solid frost, which lets nothing through, so the picture is the same to the bit. The three small differences (655, 9081, 9085) are single dark pixels of the old tail that are gone.
- Not drawn: the other frames of 0 to 839 and 9096 to 9179. UNKNOWN for them; from the above a frame at rest is expected equal or to lose a single pixel of the old tail, and the frames of a turn's leaving half (810 to 839) to lose the tail.
