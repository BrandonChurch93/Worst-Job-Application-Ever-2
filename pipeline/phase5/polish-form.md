# polish-form: the rhythm of step 1's three fields (stopped at 20:01 UTC, 2026-11-27)

Stopped by the Builder before the first pass: Brandon's change note cuts the Last name field and makes each field a stage of its own. What stands here is the measures and a WIP state of the code. Nothing below was judged.

## How the rows were read

`python3 pipeline/phase5/polish-form-rows.py <png> 990 1110 1250 1750 <y0> <y1>` on a 1920 by 1080 picture. Luminance of each row. A pocket is a run of 30 or more rows whose mean over x 1250 to 1750 (no type there) differs from the paper by more than 14. Ink of type is a run of 5 or more rows whose darkest pixel over x 990 to 1110 (the start of the labels and of the helper) is under 130, outside the pockets. Rows are the first and the last row of each run. That band holds no descender of the helper, so a helper's foot is its baseline.

In the layout tree a text node's box is its cap box: `y` is the cap's top, `y + cap` the baseline. MEASURED with `block()`: label (22 px) cap 16.0, helper (18 px) cap 13.1, value (26 px) cap 18.9.

## MEASURED, the approved pictures

| picture | group | label ink | pocket | helper ink |
| --- | --- | --- | --- | --- |
| step1-fire | First name | 303 to 319 | 332 to 388 | 395 to 405 |
| step1-fire | Last name | 430 to 445 | 455 to 511 | |
| step1-fire | Email | 547 to 564 | 573 to 631 | |
| page-look | Full name | 344 to 363 | 380 to 437 | |
| page-look | Phone number | 481 to 499 | 517 to 574 | |
| page-look | Email | 616 to 635 | 653 to 709 | |
| step1-tug | Full name | 344 to 363 | 380 to 438 | |
| step1-tug | Phone number | 480 to 499 | 516 to (not clean) | |
| step1-tug | Email | 615 to 634 | 651 to (not clean) | |

From them, in clear rows between two things:

- step1-fire: label foot to its own pocket 12, 9, 8. Helper 6 under its pocket and 24 over the next label. Email label 35 under the pocket above. Pocket 57 tall. Step of the pockets 123 then 118, of the labels 127 then 117 (not even in the approved picture either).
- page-look: label foot to its own pocket 16, 17, 17 (the labels' rows hold an ascender or a descender). Label 43 and 41 under the pocket above. Pocket 58 tall. Step of the pockets 137 then 136.
- step1-tug: label foot to its own pocket 16, 16, 16. Phone number label 41 under the pocket above. Step of the pocket tops 136 then 135. The feet of the two lower pockets run into the paper and its shadow and are not read.
- In every one a label is 2.4 to 4 times nearer its own pocket than the thing above it.

## MEASURED, the build at a1403854 (draft still of the key `step1-fire`, hd)

| group | label ink | pocket (layout tree) | helper ink |
| --- | --- | --- | --- |
| First name | 305 to 321 | 342 to 406 | 419 to 432 |
| Last name | 452 to 467 | 488 to 552 | |
| Email | 563 to 579 | 600 to 664 | |

The picture stands about one row over the layout tree's numbers. Pocket rims read in the picture at 342, 487 and 599. Label foot to its own pocket: 20, 19, 19 clear rows. Helper: 14 under its pocket, 19 over the Last name label. Email label: 12 under the pocket above, so nearer the field above than its own. Step: 146 then 112 (ink 147 then 111). The focus ring's glow reaches about 5 px outside the pocket.

## Rule 6 reading (STATED from `git log -p -L15,19:src/pages/step1/layout.ts` and the notes)

Not contested. `FIELD_GAP` 20 with the helper on the label's row (af80fc95, blockout); 16 with `HELPER_ROOM` 28 (734916f1); 12 with 34 (0beae242, decision 1 of `pipeline/phase3/step1-script.md`: "`FIELD_GAP` went from 16 to 12 so the form still ends above the note and the deck"). All three are build steps of Phases 2 and 3, none a fix for a critic's round. Round 22's summary lists the rhythm as open, not mended.

## What the arithmetic showed

With the label 36 over its pocket, the field 64 tall, the first label at 306 and the note 10 clear of the deck (form's foot at most 677), the gap between groups is at most 35. A helper needs its drop, 13 of cap and more than 20 to the next label. So no setting with the label at 36 puts the Last name label nearer its own pocket than the helper. The label has to come nearer its pocket, as in step1-fire.

## The WIP state of the code (b0d87ad0), not finished and not to be merged as it stands

- `field()` in `src/shell/parts.ts` takes `labelRise` and `helperDrop`. Left out, the label stands at `y` and the helper 14 under the pocket, as before. Whether the careers page is byte equal was not run.
- `src/pages/step1/layout.ts`: `LABEL_RISE` 26, `HELPER_DROP` 8, `FIELD_GAP` 44, step 134. `FIELD_Y` stays the pocket's top less 36 (296, 430, 564), because `script.ts` adds 36 to it. Labels at 306, 440, 574, pockets at 332, 466, 600, helper at 404. The form's foot stays 664, so the slot, the note and `PAPER_REST` do not move.
- It lifts the First name pocket and the drop zone's top by 10 px, which the brief's list of pictures that may change did not hold. `src/pages/step1/NOTES.md` line 8 would be out of date.
- MEASURED on a draft still of this setting: labels 305 to 321, 440 to 455, 573 to 589; helper 403 to 416; pocket rims 332, 465, 599. Label foot to its own pocket 10; helper 8 under its pocket and 23 over the next label; Email label 44 under the pocket above.
- The other setting tried, 28, 8 and 41 (step 133), MEASURED: labels 305 to 321, 439 to 454, 571 to 587; helper 405 to 418; pocket rims 334, 466, 599. Label foot 12 over its pocket, 6 px clear of the focus glow (4 px at 26); helper 20 over the next label.

## Run and not run

- Run on a1403854 before any change: `npm ci`, `npm run build`, `npm test` alone: 176 files passed and 13 skipped, 2177 tests passed and 17 skipped (19:50 to 19:55 UTC).
- Not run on the WIP: `npm test`, `npx tsc --noEmit -p .`, `npm run determinism`, `npm run bots`, `npm run measure`, the `cmp` of the four draft stills. No test was written. No frames in a row were drawn.
