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
