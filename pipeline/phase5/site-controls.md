# Site controls: notes of /root/site_controls (Phase 5)

Parts: `pointer`, `finish-logic`, `interface`. Branch `agent/site-controls`. Every fact is MEASURED (command and number), STATED (read in the code) or UNKNOWN.

## Baseline on `origin/main` a5724fb9, 16:04 to 16:08 UTC

- MEASURED `npm run build`: exit 0.
- MEASURED `npm test`: 119 files, 1479 of 1479 tests.
- MEASURED `npm run bots`: 20 of 20 runs finished, "bots: all clear", longest pointer ignored 3.52 s, flippers 0.00 s, keen 37 of 37 gags.
- Three draft stills kept outside the repo (`../base/stills/`), sha256: `step1-fire` c7252177, `table-wide` 6503c2dd, `boss-fight` 39c4973f.

## First list: what holds on main, rule by rule (16:12 UTC)

### pointer

| Rule | State on main | How |
| --- | --- | --- |
| The system cursor is hidden over the picture, shown over a control | STATED | a check of `node src/ui/site.mjs`; the first run here died on a reload of the dev server before it printed, run again below |
| A little weight, still responsive | does not hold | MEASURED, a stepped 600 px move of the free body, per acting state: time to 90%, overshoot, time to rest: plain 138 ms, 2.5%, 371 ms; confident 133, 4.8%, 483; nervous 242, 0.1%, 388; shocked 113, 5.0%, 417; angry 113, 5.7%, 408; scared 100, 4.6%, 363; proud 158, 3.0%, 413; exhausted 633, 0%, 1050. Five of eight are over 120 ms |
| A click lands where the hero is | does not hold | STATED: the pages test a press against `io.pointer`, the mouse (`src/pages/step1/index.ts` 290, 481, 623, 771; `src/pages/marketing/index.ts` 365) |
| Taken for at most `live.controlTakenMaxSeconds` | holds | MEASURED `npm run bots`: 3.52 s of 8 |
| Handed back with an ease, never a jump, ending on the mouse | holds in part | MEASURED, keen bot, mouse parked 600 px away at 30 places (releases, landings, hits): no step longer than the fastest step of a free move, but half a second after a release the body is 248 px from the mouse when it acts exhausted and 7 px when nervous. Hits by a turret or the boss not measured yet (keen dodges them) |
| Nothing sticks | does not hold | STATED from the listeners of `src/main.ts`: no listener for the window losing the focus; a second button pressed while one is held gives no `pointerdown` (the browser sends a `pointermove`), so the right flipper does not answer while the left button is held, and the `pointerup` that ends such a chord clears one button only; a Shift released while a control has the focus never reaches the page, because the control stops the `keyup` |
| Step 3: the flippers answer within a step | UNKNOWN | left button or left Shift is the left flipper, right button or right Shift the right one (STATED) |

### finish-logic

| Rule | State on main | How |
| --- | --- | --- |
| The four bots finish, G17 | holds | MEASURED `npm run bots` |
| Visitors a to g of the brief | UNKNOWN | no test yet |

### interface

| Rule | State on main | How |
| --- | --- | --- |
| Three controls, keyboard, names | holds in part | STATED: `site.mjs` checks the tab order on the careers page only, where no skip link is due |
| Touch page, nothing else loads | does not hold | STATED: `index.html` loads `src/main.ts`, which imports every page, so the one bundle (5.3 MB) with all six pages is fetched before the device is asked |
| Touch page, the link | holds | STATED `src/ui/touch.ts`: with `links.portfolioWork` empty no link is made |
| Less motion gets the film | STATED | `site.mjs` has the check; run again below |
| Live region | UNKNOWN | STATED: only words under `copy:` that were not on the page at rest are said, each once a step |
| Film bar at 3840 and at its end, the ink at 4.5 to 1 | UNKNOWN | |
| The probe | UNKNOWN | first run died with the same reload |
