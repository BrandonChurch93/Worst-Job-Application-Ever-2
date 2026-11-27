# Careers page (unit `marketing`), change 002 and change note 003

Branch `agent/b-careers`. Every item below is MEASURED (the command and the number), STATED (written by a person, or read in code and not run) or UNKNOWN.

## What is built

- The page of `references/approved-002/careers-page.png` as a flat white website on the site's stage, in `src/pages/marketing/*`. Eight sections: top (navigation, hero, awards, ticker), benefits, staff quotes, questions, comparison, process, closing call, footer.
- `careersLayout()` height 5633 px at 1920 wide (the picture is 5357; the 276 more is the second row of quotes). Section tops: 0, 1080, 2170, 2916, 3566, 4586, 5216, 5538. Scroll range 0 to 4553. MEASURED: printed from `careersLayout()` in a test run.
- The film's opening on this page: 18 s from the first frame to the press of the last Apply, in two settings, see "The opening".

## Decisions

1. Flat white on the stage: the white sheet is drawn unlit at 251.6 (MEASURED: mean of a 40 by 40 px patch of the draft still of the first screen, with sharp). Nothing in `src/post/` or the ground was changed.
2. One type scale, Inter: `T` in `layout.ts`. Display 82 (headline), 72 (the benefits heading), 56 (the closing call), 44 (the other section headings), 32, 24, 20, 16, 14: nine sizes. Headline and headings in Inter Display 800, baked to `public/fonts/inter-display-800.json` (183588 bytes, sha256 starts 9bc2142f6987a04c; MEASURED with `wc -c` and `sha256sum`), one entry `'inter-display-800'` added to `FONTS` at `src/shell/metrics.ts:15`.
3. Every word is a key of `content/copy.json`. Cases where the picture's word is not in the copy are under "Words".
4. Cards: face with icon, title, promise and the fine print small. The pointer on a card flips it to the back with the fine print large. It flips back when the pointer is clear of the card by `LEAVE`. Events `card-flip` and `card-flip-back`.
5. Apply is live from the first frame in the navigation, the hero and the closing call. Each runs the press (wind-up 0.36 s, jump 0.42 s, `button-press` on landing, hold 0.7 s) and the page turns into step 1.
6. The ticker is one band from the left edge to the right edge of the website at every width.
7. Six staff quotes in two rows of three.
8. The awards keep their fine print, small, under each.
9. The comparison ticks are drawn as in the picture: green box ticks in the right column.
10. The build's own arrow at its real size.
11. The variant `rejected` stays: `step5.closing` in the footer, the ticker repeats `marketing.tickerAfterRejection`.
12. No sound is made here. Event names kept exactly: `step`, `card-flip`, `button-press`.
13. The page has its own navigation; `chrome()` returns `{ header: 0 }`.
14. Scroll and cost: see "Scroll and cost".

## Events

`step` (the arrow, while it moves faster than 180 px a second on the page), `card-flip`, `card-flip-back` (new in change 002), `button-press`, `page-turn` (the stage's, at the unit's last half second).

## The opening (change note 003)

All numbers stand in one object, `OPENING` in `src/pages/marketing/script.ts`: `total` 18, `key` 2.4, `line` 13.75, `after` 1.25, `ramp` 0.45, `places` (salary, badge, lol, ghosting, button), and for `A` and `B` the `scrollFrom` and for each place `{ hold, slow }`. `use` picks the setting ('B' by default); the URL query `&opening=a` or `&opening=b` overrides it.

MEASURED by printing `careersOpening('A')` and `careersOpening('B')` in a test run (page px, seconds):

| | A | B |
|---|---|---|
| Line 1 (22 words at 1.6 a second, silent stand-in) | 0 to 13.75 | 0 to 13.75 |
| Hold at the top | 0 to 13.75 | 0 to 3.0 |
| Scroll | 13.75 to 16.45, 2.70 s | 3.0 to 16.45, 13.45 s |
| Speed between stops | 2024 px/s (33.7 px a frame at 60) | 597 px/s (9.9 px a frame at 60) |
| "Competitive Salary" fine print | no slowing | 4.99 to 6.29, 1.30 s at 72 px/s |
| "[STATUS: Badge still doesn't work]" | no slowing | 8.11 to 9.11, 1.0 s at 72 px/s |
| "Responds to Applications", "lol" | no slowing | 12.47 to 13.47, 1.0 s at 72 px/s |
| Step five, "Professional Ghosting" | no slowing | 14.43 to 15.43, 1.0 s at 72 px/s |
| The last button and the line under it | stands 16.45 to 18.0, 1.55 s | stands 16.45 to 18.0, 1.55 s |
| Press of Apply (`button-press`) | 18.0 | 18.0 |
| Turn into step 1 (`page-turn`) | 18.75 | 18.75 |
| End of the unit | 19.25 | 19.25 |

- A stop eases over 0.45 s down to 12 percent of the speed and up again; the page never stands still before the bottom.
- In B the arrow rides down the page with the scroll, stands on the salary card at its stop (the card turns: `card-flip` 4.79 s, `card-flip-back` 6.52 s, MEASURED in the simulation at 240 steps a second), then by the badge line, the "lol" cell, the fifth step and the button. It goes down a lane at x 150 between the salary card and the badge so no other card turns.
- `button-press` 17.979 s on `final-cta-cap`, `page-turn` 18.750 s: MEASURED in `tests/careers-acting.test.ts`.
- In B line 1 ends at 13.75 s, at the end of the "lol" stop. The last 4.25 s have no voice.
- In A no card turns: the page passes the cards at 2024 px/s. So the beat `marketing.perks` has no `card-flip` in its window in A, and with `OPENING.use` set to 'A' two of my tests fail by design ("keeps each beat and its event inside its window" in `tests/marketing.test.ts`, "flips one card in the film" in `tests/careers-fix.test.ts`). MEASURED: `npx vitest run tests/marketing.test.ts tests/careers-*.test.ts` with `use: 'A'`, 2 failed of 37. The tests pin the default, B.
- The turn at the bottom: while the page turns, the stage draws only the screen on show as a slab. A sheet of the website that reaches above the screen (the comparison's, by 987 px at scroll 4553) is now cut to the screen for those frames (`Paint.keep` in `real/flat.ts`, the sheet's key in `real/careers-page.ts`), so it does not hang over the slab. MEASURED in `tests/careers-real.test.ts` (the cut sheet's upper edge is at the scroll). A card or a line of type that straddles the screen's edge is not cut: at scroll 4553 none does. On the live site a press of Apply at another scroll can leave a card or a line across the edge for the half second of the turn: STATED, not looked at.

## NEEDS (outside my files)

- `pipeline/change002/careers-NEEDS.patch`, `config/showcase.json` only, on my branch as three commits whose subjects start `NEEDS:` (f6dc52fb, f8da3707, e63c73fa): unit `marketing` 14 to 19.25 s; beats `marketing.stroll` 0 to 3 (`step`), `marketing.perks` 3 to 7 (`card-flip`), `marketing.ticker` 7 to 16.45 (no event), `marketing.apply` 16.45 to 19.25 (`page-turn`); key `marketing-top` at beat `marketing.stroll`, share 0.8 (2.4 s). `plannedSeconds` and `maxSeconds` are not touched. The Builder accepted the patch at 22:44Z and repoints the key's picture.
- STATED from `tools/gate.mjs:306-308`: the gate says marketing 19.25 s is more than `unitTuneFraction` 0.2 from its planned 14 s. The film by the units list is 158.25 s of at most 165.
- Font recipe, two lines for the Builder to add at the shell merge: in `pipeline/fonts/bake_fonts.py` `FONTS`, `('inter-display-800', 'inter', 'extras/ttf/InterDisplay-ExtraBold.ttf', 'Inter Display', 'ExtraBold', 800),`; and the file name `inter-display-800.json` in the heading of `assets-src/fonts/RECIPE.md` and in the fonts row of `ASSETS.md:241`.
- `content/narration.json`: when line 1 of note 003 stands at `marketing.stroll`, `marketing.perks` must be empty, or the site's content check stops the start (it did on d0a8b8bd with the old two lines). STATED by the Builder: it is so on `agent/script-003`.

## Differs from the picture on purpose

Contrast (the Builder's ruling of 21:50: every run of type 4.5 to 1 against what lies under it; fills as in the picture). MEASURED with the WCAG formula on the colours named:

| Pair | Picture | Mine |
|---|---|---|
| Orange type on white (kickers, links, quote roles, table words) | e97832 on white, 2.95 | b65821 on white, 4.63 |
| Orange type on the peach pill | e97832 on ffedd9, 2.64 | aa521e on ffedd9, 4.64 |
| White label on the Apply button (navigation, hero, closing) and on the step discs | white on e97832, 2.83 | white on be5418, 4.56 (the fill is deeper, the site's own orange button pair) |
| Grey small type on the hero glow | 6b7280 | 5c636f, 4.81 at the glow's centre |

Other:

- The page is 276 px taller: six quotes in two rows (decision 7); the picture has three.
- The awards carry their fine print (decision 8); the picture has none.
- Type: Inter in one scale of eight sizes; the picture's sizes vary by a few px from section to section.
- Staff quotes have no quotation marks and the fine print has no "* " in front: the copy has neither.
- The fine print is on the face of a card, small (decision 4); the picture's face has it too but the back is not in the picture.
- A card flips by a flat squash about its upright middle, with its shadow.
- The questions are closed rows; nothing opens.
- The wreaths of the awards are simpler: 8 leaves a side.
- One hero glow, an ellipse with a flat middle (`GLOW`); the picture's glow is a little stronger at its lower edge.
- The arrow is the build's own, at its real size (decision 10).
- The compare command shows the arrow at its start place in each tile it stitches.

Seen in the crops and not meant, to mend in the polish pass (type scale):

- Lead lines under headings: mine 3d3934, the picture's a little lighter (its darkest 1 percent of pixels in the hero subline is 65,61,56; mine 51,47,42. MEASURED with sharp on both pictures).
- Staff quotes: the picture's quote and role are about 22 px and its bracket notes are in a typewriter face about 16 px; mine 20 px and Inter 14.
- Process: the picture's step titles sit on one line where mine wrap ("Find Our Job Posting"), and its step text is about 20 px; mine 16.
- Closing call: the picture's heading is about 54 px and its text 24; mine 44 and 20.
- The picture's arrow is about one and a half times the build's and stands on the button's right end.

Crops, mine left and the picture right: `node pipeline/change002/careers-differences.mjs` writes `out/work/careers/careers-differs-<name>.jpg` for type-headline, cursor-button, glow, awards, navigation, benefits-heading, cards, quotes, table, steps, closing. It reads the pictures of the two other commands.

## Words

- Hero pill: the picture's pill line is `marketing.ticker.8` in the copy ("Voted #1 by Ourselves™. Three Years Running"); used from there.
- Hero subline: `marketing.hero.sublineLong`, the two-line form the picture shows.
- Keys of `marketing` not shown: `hero.subline` (the short form), the answers of the questions (rows stay closed), `footer` lines the picture does not have. UNKNOWN: a word-by-word check of the picture against the copy beyond the eight section pictures I looked at.

## Commands

- `node pipeline/change002/careers-page.mjs`: draws the whole page as one tall picture 1920 wide (`out/work/careers/careers-page.png`), lays it beside the approved one (`careers-page-beside.jpg`) and cuts the eight sections (`careers-section-N-name.jpg`, mine left, approved right). Prints triangles and draw calls of each tile.
- `node pipeline/change002/careers-proof.mjs [--only top,film,apply,card,ticker,cost] [--setting a|b]`: the proof pictures in `out/work/careers/`.
- `node pipeline/change002/careers-differences.mjs`: the crops of the on-purpose differences beside the picture.
- `npm run film -- --unit marketing --tier draft --format preview`: the opening as a film (setting by `OPENING.use`).
- Tests: `npx vitest run tests/marketing.test.ts tests/careers-*.test.ts`.

## Scroll and cost

- The stage scrolls a page by its own `scroll()`: the page reports its height and its scroll, the stage moves the camera down the page. A page of 5633 px is one layout; its parts are built once and stay in the scene. STATED from reading the stage; the count below is MEASURED.
- MEASURED (`window.showcase.countParts` on the draft still of the first screen): 316422 triangles, 103 draw calls. The low level's limits in the config are 700000 triangles and 300 draw calls.
- Per tile down the page and the time of a frame at `quality=low`: NOT MEASURED YET (`careers-page.mjs` prints the first, `careers-proof.mjs --only cost` the second).

## Tests of other units that this change breaks

NOT LISTED YET: the whole `npm test` has not run since the opening changed.

## Mine to tell the Builder (his to mend)

- Key `marketing-top` in `config/showcase.json`: its picture is still `references/approved/marketing-top.png`.
- `tools/assets/approved-boxes.json:183`: boxes of the old first screen.
- The four judged stills of the page (`rest-marketing` scroll 0, `marketing-perks` 0.25, `marketing-proof` 0.5, `marketing-foot` 1; `config/showcase.json` lines 472 to 475): the page is another page now and is taller.
- The settled list of the key.

## What is left

- The type sizes named under "Seen in the crops and not meant".
- The cost at the low level, per tile and per frame.
- The list of other units' tests.
- The turn into step 1 from the bottom of the page: looked at in the film only.
