# Fix: the last screen of step 3 (branch `agent/fix-result`)

## What each thing was (found before any change)

- The plate with the cone: `drain()` in `src/table/real/hardware/apron.ts`. A zinc plate with a long dark slot stood on the page and the tube rose out of the slot.
- The ghostly tube: the same `drain()`, a tube swept along the rail `drain`, whose height runs from 1.2 to 0.4 of a ball under the page, so half the tube was sunk in the page and it had no shadow and no collars.
- The floating bright ring: the end collar of that tube at the middle of the outlet port.
- The card: the shell's glass card (`card()` in `src/shell/real/controls.ts`), given no corner radius by the page, so its corner was 0.6 px.

## Decisions

1. The file that drew the port's plate and the drain tube is `src/table/real/hardware/apron.ts`. Approved by the Builder at 20:19Z for `drain()` only. `drain()` now returns nothing to draw; `hardware/index.ts` (not mine) still calls it and builds empty meshes.
2. The tube of the last screen is built by the feed tube's own code in `src/table/real/frame/loader.ts`: same wall, same collars, same material, same shadow rows on the page. The mesh is named `loader.drain.last`, so the list of `loader.tube.*` zones in `tests/table-frame.test.ts` holds.
3. Where the tube meets the page: a closed turned cap (`RISER`) on the centre line, 86 px under the apron's lower edge, because the drain of the apron above is on the centre line. Where it meets the port: a slot in the port's ring with a seat collar, as the feed tube leaves the loader port in approved `loader-page`.
4. The rail `drain` in `src/table/layout.ts` is frozen and runs under the page. The page draws the ball, the cursor and the eyes on the tube's middle line (`drainWay`) while the ball rides that rail past the cap. Nothing of the machine's play changes: the stage's ball, its times and events are the same.
5. No clamps on the last screen's tube and its shadow rows are thrown along the lamp's direction: rows laid square to the tube crossed inside the bend and folded the shadow.
6. Card: corner radius 24 (`CARD_R`), the radius of step 5's two panels `wait-panel` and `metrics` (step 1 uses 20, step 4 22, marketing 28). Rise: 0.4 s (`RISE`), the card's height and the button's cap grow from 3 px to the kit's heights (12 and 14), words riding on top.
7. The header and the progress row are not added to this screen.
8. Point 4, the first screen. Approved `loader-page.png`: the feed tube runs straight off the lower edge with its collars, its shadow beside it down to the edge. Build: the tube starts its bend toward the marquee about 40 px above the lower edge and its shadow folds there, leaving a pale wedge with a hard diagonal edge at the lower right of the tube. Not mended. Tried: the shadow rows of the first zone keep the straight tube's direction down to the edge (one line in `loader.ts`). MEASURED: that changed `loader-page` in 9785 pixels (x 1670 to 1850, y 989 to 1080) and also `table-wide` in 127 pixels (x 1189 to 1245, y 191 to 199, largest difference 7 of 255), because the camera of `table-wide` sees the lower end of that shadow beside the marquee. `table-wide` must not change, so the line was taken out again. The bend itself is set by the rail `feed` in `src/table/layout.ts` (the corner at `MARQUEE_Y + 0.15`), which is not mine and which `table-wide` also shows.
9. The apron's drain slot. Emptying `drain()` took away the tube seen through the slot under the drain plate (film frame of `pinball.drain` at 0.22, rows 800 and below). `drain()` draws that tube again from the old path, its first 10 points (`UNDER`): the straight run through the apron and the first bend, under the page from the apron's edge on. No plate.
10. `tests/machine-runner-arrow.test.ts` (not mine) measured the arrow against the saved machine ball. On the rail `drain` past the cap the ball as drawn is lifted into the tube, so the test failed. NEEDS patch, approved by the Builder at 20:39Z: the arrow is measured against the ball as drawn, and a new check holds the drawn ball to the machine's ball within 0.01 px at every step outside that stretch.

## Numbers that are mine

- `RISER` in `loader.ts`: the cap's sizes in px.
- `CARD_R`, `RISE`, `RISER_S` in `src/pages/step3/index.ts`.
