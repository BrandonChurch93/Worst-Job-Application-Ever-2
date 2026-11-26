# Site packs: notes of /root/site_packs (Phase 5)

Branch `agent/site-packs`. The job: `npm run pack -- --phase 5 --round 20 --unit site --role R2|R4|R5|R8`. Every fact is MEASURED (command and number), STATED (read in the code or the kit) or UNKNOWN. Times are UTC of 26 Nov 2026. The machine here has 4 cores and a software renderer; the Builder's class has 2.

## What was there (18:12 to 18:25)

- STATED by the Builder, and MEASURED: `packPlan` had no plan for `site`. `tools/pack.mjs` drew everything from film frames at a tier.
- MEASURED `node tools/still.mjs --page step1 --live high --format hd`: 8.8 s.
- MEASURED one `window.liveRun.state()` (draw and PNG) at the level `high`: about 5.4 s at `formats.hd`, about 3 s at `formats.preview`. The cost is not bound by the pixels alone (STATED: the level has a 4096 shadow map).
- MEASURED one step of a visitor (a real mouse move, `advance(1/60, true)`, `told()`): 17 to 25 ms.
- STATED `src/main.ts`: the stepped site (`?mode=live&clock=steps`) mounts no controls. A still with `interface: true` does.
- MEASURED: the site names its pages `marketing`, `step1` to `step5`; the config's units are `marketing`, `step1`, `step2`, `pinball`, `boss`, `decision`. The plan maps them by the order the visit meets them.

## Files

- `tools/lib/pack-site.mjs` (new): the visitor, the walk, the replay, the moments, the four plans, the drawing.
- `tools/lib/pack-plan.mjs`: `roleOf`, `rolesOf`; `packPlan` takes the roles of `site` from `siteRoles`; `briefFor` drops the lines of other units when the unit is `site` (`siteLines`).
- `tools/lib/pack-build.mjs`: `buildPack` hands the files of the kinds in `SITE_KINDS` to `buildSite`; `controlBoxes` is exported.
- `tools/pack.mjs`: for `site` the cache folder is `out/work/packs/cache/<commit>/live-high/`, `--tier` is refused, the facts of R4 and R5 come from `siteFacts`, and `buildPack` is given every file of the whole pack beside the slice's (`whole`).
- `tests/pack-site.test.ts`: 19 tests.
- `src/main.ts`, 2 lines, by the Builder's word at 18:29 (commit e8f3c569, also as `site-packs-NEEDS.patch`): `told()` gives `hits` (the stage's events with the hit flag, `{name, time, page, x, y}`) and `control` (`pointer` or `flippers`). Read only.

## The visitor

One fixed visitor, the same for R4 and R5 (`VISITOR` and `makeVisitor` in `pack-site.mjs`). It knows only what `told()` tells.

- It goes where the page wants the pointer (`hint`), 11 steps late, no faster than 1500 px a second, with a seeded jitter of 6 px (an LCG with `Math.imul`; no wall clock, no `Math.random`).
- It presses when within 22 px of the place, types a key every 8 steps, turns the wheel by 120 when the place is off the screen, holds the Shift keys as the page asks for the flippers.
- It takes hits: the first time a page tells it to step aside (`hint.dodge`) it does not. It stands where it is, button up, for 120 steps (2 s), and obeys from then on.
- Every act is a real event of the browser driver: `mouse.move`, `mouse.down`, `mouse.up`, `mouse.wheel`, `keyboard.press`, `keyboard.down`, `keyboard.up`. Between steps the site's clock is moved by `advance(1/60, true)`.
- The run uses `assets=web`, what a visitor is served, at `quality=high`.

Two passes. The walk draws nothing and writes `site-run.json` into the cache: every step's facts, the events sent at each step, the gags and the hits with their step. The replay sends the same events again and draws only the steps the sheets need. At every step it holds what the site tells against the run file and stops the build on a difference, so a sheet can never show a second, different visit.

## The run (MEASURED)

The first run of the visitor as it now is (commit e8f3c569 with the tool uncommitted, 18:32 to 18:36; the same numbers again on bee1e63c, see below):

- 10180 steps of 1/60 s, 169.65 s of the site's time, `finished` true, no browser problem, about 4 min of wall time. 37 gags reached, from `marketing.stroll` at step 1 to `decision.reset` at step 10092.
- Events sent: 9691 pointer moves, 94 presses and 94 releases of the left button, 82 wheel turns, 11 presses and 11 releases of a Shift key. No letter key is sent: step 1 takes its text from the keyboard on the page, which the visitor clicks.
- Pages by step: marketing 0 to 620, step1 621 to 2484, step2 2485 to 5510, step3 5511 to 7910, step4 7911 to 9629, step5 9630 to 10148, and the careers page again to 10179. Six turns of 60 steps, the first 591 to 650.
- Hits the site tells of on the arrow: `bolt-hit-cursor` at steps 884 and 940 (the visitor stood from the first `hint.dodge`), `tug-lost` at 2204. `ball-seal` at 5616, `ball-open` at 7812.
- Before the stand rule (18:20, first visitor): 9975 steps, 166.2 s, all gags, and no bolt hit the arrow. The Builder asked for the stand at 18:28.

## The moments of R4, each found from the run

| Moment | How it is found | Step in this run |
| --- | --- | --- |
| Walking the arrow across the careers page | the longest stretch of the first page in which the arrow moves at least 6 px a step while the pointer moves, 24 steps or longer | 41 to 87; the sheet shows 52 to 74 |
| A page turn | the first stretch the site tells `turning` | 591 to 650; three sheets, 585 to 655 |
| A hit on the arrow on step 1 | `told().hits`: the first `bolt-hit-cursor` on step 1, or else `tug-lost` | 884, a bolt |
| The page takes control | the step the site first tells the gag `step1.tug` | 1700 |
| The page gives it back | after that, the first step the arrow moves 0.5 px or more after 30 steps or more of lying dead | 2402 |
| The arrow goes into the ball, the visitor gets the flippers | the first step of step 3 at which `told().control` is `flippers` | 5616 |
| A flipper used with the ball in play | after that, the first step at which the visitor presses a Shift key | 6557 |

Each sheet is 12 consecutive frames, 2 steps apart (30 a second). The walk and the turn show the whole picture. The other five show one fixed window round the place of the arrow at the moment, cut at one pixel for one pixel, as `hit-sheet` does (`hitTileHeight`, `windowRound`).

- STATED `src/pages/*/index.ts`: only step 3 changes `control`; on step 1 it stays `pointer` through the tug of war. So "taken" on step 1 is read from the gag name and "given back" from the arrow itself. That is a reading of mine, not a word of the site.
- STATED: `told().hits` carries every event with the hit flag, bumpers and flashers too. The hit sheet takes `bolt-hit-cursor` by name, and `tug-lost` if no bolt hit the visitor.

## The packs

Sizes: the six stills and the two screens are drawn at `formats.hd` (1920x1080), through the live site's path, level `high`, camera `home`, and shown inside `critics.maxImageLongEdgePx` (1400). The pictures of the run are drawn at `formats.preview` (960x540). Why: a picture of the run costs about 3 s there against about 5.4 s at hd, a tile of a sheet of 12 is 461 px wide, and R4 and R5 together need 180 pictures. At hd the two roles would not fit in about 20 minutes each on 2 cores.

What that costs: the sheets "round the arrow at its real size" are cut from the 960 px picture, one pixel of the sheet for one pixel drawn, which is half the linear size of the hd picture.

### R2, 25 files in 3 sets

- Set A, `set-A-01.png` to `set-A-06.png`: the six judged stills `site:marketing`, `site:step1`, `site:step2`, `site:pinball`, `site:boss`, `site:decision`, in that order.
- Set B (10) and set C (9): the 19 approved keys of `config.keys` in the config's order, from `references/approved/`.
- One function (`juryPicture`) resizes and encodes both kinds. MEASURED: every file is 1400x788, RGB, with the chunks IHDR, pHYs, IDAT, IEND and no other, a judged still and a control alike. No heading, no caption. The brief is the juror's question only, with no line of a pack.
- The key file `out/work/keys/round-020-R2.json` says which file is which and stays out of the pack.

### R8, 9 files in 1 set

- `set-A-01.png` to `set-A-06.png`: "Page N of 6, at rest", each still shown at 73% of its size.
- `set-A-07.png`: the judged still `screen-live`, the careers page with the controls on.
- `set-A-08.png`: the judged still `screen-touch`, the message page for touch devices.
- `set-A-09.png`: one grid of crops at real size: the row with the sound control and the film link; the same row with the skip link offered (step 1 with the controls on); with the film, the button over the picture that starts it, and the film's bar in two crops, its left end and its right end (the bar is 1920 px wide and a tile is 696). The diagnostic menu is not in it.

### R5, 9 files in 1 set

- `set-A-01.png`: the six pages at rest on one sheet.
- `set-A-02.png`, `set-A-03.png`: `screen-live` and `screen-touch`.
- `set-A-04.png` to `set-A-09.png`: "One visitor's visit in order, sheet N of 6, page N of 6", 12 frames spread evenly across each page's part of the run, the halves of the turns at its ends left out.

### R4, 9 files in 1 set

- `set-A-01.png`: the walk. `set-A-02.png` to `set-A-04.png`: the first page turn. `set-A-05.png`: the bolt hit. `set-A-06.png`: control taken. `set-A-07.png`: given back. `set-A-08.png`: the arrow into the ball. `set-A-09.png`: a flipper used on the ball. In the order they happen.

### The briefs

`briefFor` gives each critic its section of kit/07 word for word. For `site`, `siteLines` drops the lines that start "- Pack for a page", "- Pack for `pinball`", "- Pack for `film`", "- For the film:" and "- In the loop's seam sheet". MEASURED in the built briefs: R4 has "Pack for `site`: sheets drawn through the live site's path", R5 has "Pack for `site`" and "For the site:", R8 has "Pack for `site`" and "For the controls of the live site", and none has a line for another unit. The words "live site" in those lines are the kit's own.

### Words

No heading of R5 or R8 says live, bot, render, tier, level, film or frame (a test holds this). The crop grid's captions name "the film" as the visitor's link does. R4's headings say "Consecutive frames", as its brief does.

## Same run on every build (MEASURED)

- The run, MEASURED: walked on e8f3c569, on bee1e63c, on merge 40's tree (28828795) and twice on d498b5ed and once more on ddb8238d, in two working trees. Each time 10180 steps, 169.65 s, finished, 37 gags, no problem told by the browser, the same pages, hits and moments. `site-run.json` is the same file by bytes every time (sha256 7c8e59b98081f86b...). Merge 40 changed the controls, the levels, the loader and the sound, and did not change the visit.
- The six stills and the three screens, MEASURED: byte equal by sha256 between the builds on e8f3c569 and bee1e63c, and the same again on d498b5ed with merge 40 in: nine files, three builds, the same sha256 each time.
- The pictures of the run, first measure, FAILED: of the 109 pictures the sheets of R4 held in both builds, 31 were the same by bytes and 78 differed, every one from step 621 on. The difference was small and all over the picture: 5 pictures compared pixel by pixel differed in 84% to 88% of their pixels by at most 7 of 255 (14 in one).
- The cause, MEASURED: `src/main.ts` counts the pictures it draws (`frame++` in `draw`) and gives that count to the grain and to the lens (`src/post/post.ts`). So the bytes of a picture follow from its step and from how many pictures the browser drew before it. Four sessions of one build drew steps 10, 20, 650, 700 (A), the same again (B), 10, 15, 650, 700 (C) and 10, 650, 700 (D). A and B: all four the same by bytes. C: 650 and 700 the same as in A, though its second picture was of another step. D: 650 and 700 differ from A. The first two builds had drawn their pictures in different company (the cache held some from an earlier plan), so they differed. The visit itself was the same: every step of a replay is held against the run file and the build stops at the first that differs.
- The cure, in the tool: a picture of the run is always drawn as the same one of the whole pack's list of steps (`drawOrder`). A build that lacks a picture draws every step of the list up to it, in order, and keeps each under its step and its place in the list. A slice and a cache half full therefore give the same bytes as a whole build from nothing.
- The pictures of the run, second measure, MEASURED: two builds of R4 on d498b5ed, in two working trees, each from an empty cache, at the same time on a busy machine. 96 of the 108 pictures are the same by sha256 and 8 of the 9 sheets are the same file by bytes. The 12 that differ are one sheet, `set-A-06.png`, the moment control is taken (steps 1690 to 1712). Three of them compared pixel by pixel: 21, 29 and 41 pixels differ, all of them on the arrow itself, by at most 18 of 255. The pictures before and after are the same again.
- UNKNOWN why those 12 differ. It is not the count: both builds drew the same list in the same order. STATED, a guess and no more: while the hands pull, something drawn on the arrow follows from the browser's real time, or from when a piece of code or a picture arrived (`app.loadLater()` is called from `draw`). It is in `src/`, which is not mine, and it is not cured.
- R5's 72 pictures: one build only with the cure in. The second build of R5 is made with the round's packs and its count goes to the Builder with the tars.

## Slices (MEASURED)

- MEASURED: `--role R8 --slice 0/2` writes files 01, 03, 05, 07, 09 into `R8-slice-0-of-2`, and `--slice 1/2` writes 02, 04, 06, 08 into `R8-slice-1-of-2`.
- MEASURED: `--role R4 --slice 0/3` on ddb8238d from an empty cache (its own walk, then the pictures): 216 s, files 01, 04, 07. Each is the same file by bytes as that file of the whole pack built on d498b5ed in the same tree.
- What a slice costs, STATED from `drawOrder`: the stills and the screens are one browser and one picture each, so slices share that work out. A picture of the run is not: to draw the picture a slice needs, the browser must first draw every picture of the whole pack that comes before it, because the count seeds the grain. So N slices of R4 or R5 on N machines do not finish sooner than one whole build; they give the same files. A slice that finds the pictures in the cache draws nothing.

## Gate

- MEASURED `npx tsc --noEmit -p .`: clean on 10e44a5f, the pushed head.
- MEASURED `npm test`, whole, on d498b5ed: 140 files, 1760 tests passed (main's 1741 and the 19 of `tests/pack-site.test.ts`), 334 s beside three pack builds. After d498b5ed came one `timeout` on one screenshot (ddb8238d) and a merge of main that changed `kit/` only (10e44a5f); `tests/pack-site.test.ts` passed 19 of 19 on 10e44a5f. STATED: the whole suite was not run again on 10e44a5f.
- MEASURED, the four packs from the clean commit bee1e63c, 4 cores, software renderer, R4 and R5 two at a time:

| Role | By the tool | Wall | Files | Size |
| --- | --- | --- | --- | --- |
| R8 | 107 s | 1 min 48 s | 9 | 12.8 MB |
| R2 | 9 s, the six stills kept by R8 | 10 s | 25 | 47.8 MB |
| R4 | 454 s | 7 min 34 s | 9 | 19.0 MB |
| R5 | 478 s, the visitor's walk of about 4 min in it | 10 min 51 s | 9 | 15.3 MB |

- MEASURED, again from the clean commit d498b5ed (merge 40 and the cure for the grain in), with a second R4 in a second tree and the whole `npm test` running beside them, so four to five jobs on 4 cores: R2 25 s (28 s wall), R4 760 s (943 s wall, the walk in it), R5 663 s (668 s wall), sizes 47.8, 19.1 and 15.2 MB. R8 FAILED there once: the screenshot of the film's screen ran into the browser driver's 30 s. With `timeout: 240000` on that one call R8 built whole in 99 s (100 s wall). That R8 ran on d498b5ed with the one line not yet committed; it is ddb8238d.
- STATED from those two: on 2 cores a role has about what R4 and R5 had in the first table, and less than they had in the second. Both stay inside 20 minutes. The longest is R4 or R5 when it also has to walk.
- MEASURED on every picture of the four packs: no edge over 1400 px. On one file of each kind: the chunks IHDR, pHYs, IDAT, IEND and no other. pHYs is written by the tool's encoder, as in the other units' packs.
- LOOKED AT, every file of the four packs of d498b5ed: R2's six stills and 19 controls, one size, no heading. R8's six pages, two screens and the grid of crops. R5's six pages on one sheet, two screens and six sheets of the visit; no sheet starts or ends on a page seen edge on. R4: the arrow crossing the three cards; the page falling away and step 1 rising, on three sheets; a bolt's sparks at the arrow and the arrow knocked aside; the hands roping the arrow off the drop zone; the arrow coming out of the slot; the arrow shrinking into the ball; a flipper striking the ball. Each reads without its heading.

## Not done, and what to know

- Not cured: the 12 pictures of the moment control is taken are not the same by bytes on two builds (above). Everything else measured was.
- Not measured: the whole `npm test` on the last pushed head; a second build of R5 with the cure in; a build on a machine with 2 cores.
- A slice does not make the pictures of the run cheaper (above). That would need the live path to seed its grain with the step and not with the count of pictures: a NEED for whoever owns `src/main.ts`, not asked for in round 20.
- "Control taken" and "given back" on step 1 are my readings: the gag `step1.tug`, and the first step the arrow moves again after lying dead. The site's own `control` only changes on step 3.
- The sheets round the arrow are at the real size of the 960 px picture, half the linear size of the hd picture.
- `site-run.json` is not written in one move. Start a second role of the same commit only once the file is there, or let the first role end.
- `pack.mjs` checks `src/` and the like for uncommitted changes, not `tools/`. A change of the tool without a commit reuses the commit's cache.
- The screen with the film waits 2.5 s of real time before its picture; it is used for three crops of R8's grid and for nothing judged by bytes. The dark shape at the left edge of the crop with the start button is the film's own picture under the button.
- Before the visitor stood still for 2 s at the first `hint.dodge`, no bolt hit him. With it, two do.
