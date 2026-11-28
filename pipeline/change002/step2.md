# Step 2, change 002: notes of the unit

Branch `agent/b-step2`. Files: `src/pages/step2/*`, `tests/b-step2.test.ts`, the tests of the page named below, `pipeline/change002/step2-*.mjs`.

Each fact is MEASURED (command and number), STATED (said, not measured) or UNKNOWN.

## Third pass: no tray (change note 003 update 5; Builder's mails of 22:56Z and 23:28Z)

Where this section and a later section of these notes differ, this section holds. The later sections describe the tray, which is gone.

### What the page is now

1. Order for each of the three fields: the ordinary field stands alone in the middle of the page, the arrow presses it (`row-open`), the field goes (0.2 s), a hole opens in the bare page and the machine comes up out of it (`stage-in-<name>`), the gag, the machine goes back into the page (`stage-out-<name>`), `field-done`, the next field slides on. No tray, box, card or panel is drawn behind a machine (MEASURED by `tests/b-step2.test.ts`, "shows the field alone and then the machine alone on the bare page").
2. Sizes: the dial 1.5 times (wheel 200 px across as built, 300 on the page, centre 960, 676), the slot machine 1.4 times, the crank with its sign and bars 1.25 times (`STAGE.times`). The line above a machine and the STOP buttons grow with it.
3. The three entrances, each its own (`ENTER.long` 0.84, 0.80, 0.86 s) and the three exits (`ENTER.out` 0.50, 0.46, 0.50 s):
   - Phone: a round hole opens like an iris (`HOLE.iris` 208), the dial comes up through its floor turning one and a quarter turns, hops, settles, and the page closes round it. Out: it drops spinning through the hole, and the iris shuts only once every part of the dial is under the page (MEASURED by `tests/step2-keeper.test.ts`, "shuts the page over the dial and over the slot machine only once each is under it").
   - Date of birth: a hatch slides open, the cabinet rises out of it, its lever swings up, the three STOP buttons pop one after the other. Out: the reels keep the date, the coins are swept into the open hatch and fall in (MEASURED by `tests/step2-fix.test.ts`, "sweeps every coin into the hatch as the machine goes"), the cabinet sinks, the hatch shuts.
   - Volume: no hole. The crank's post pushes up through the page, the ten bars push up in turn, the sign unfolds over about six film frames with a small overshoot. Out: the sign folds, the bars sink in turn, the crank whirls under. Nothing fades.
4. The hole (`pit` in `real/rows.ts`): a lit bevelled lip 5 px wide, a wall that leans in 1.9 px for each px of depth and goes from the page's light at the top to dark at the foot, and a dark floor. It is 26 px deep. MEASURED cause of that depth: the slab's backing plane lies 28 px under the page (`SLAB_THICKNESS` in `src/shell/real/ground.ts`, not this unit's file), and anything deeper is hidden by it; the first hole was 64 deep and showed as a flat black shape.
5. The arrow never stands over an opening hole: as the hole opens it hops back (`SHY` in `script.ts`: to 1235, 452; 628, 436; 850, 400), watches, and steps on once the machine stands.
6. The gags themselves (the fling, the reels and their windows of 400, 320 and 260 ms, the STOP buttons, the coins, the sign, the crank's rule, Continue) are as in the sections below.
7. The slot machine's orange line is cut to short marks at the edges of each reel window, so it does not cross a numeral (Builder's mail of 00:14Z; `L.line.pitch`, `L.line.reach` in `real/slot.ts`).
8. The sound's level (`volume()` of the page) moves in tenths, the bars that are lit, as it did before change 002; the percent in the field and the bars' own rise follow the crank without steps. MEASURED cause: `tests/audio-visit.test.ts` (the sound's, not this unit's) reads the engine's output at each tenth and was red with the level given as it rises.

### Events

All of the list below, and new: `stage-in-phone`, `stage-in-birth`, `stage-in-volume`, `stage-out-phone`, `stage-out-birth`, `stage-out-volume`. Each fires once a visit, live and film (MEASURED by `tests/b-step2.test.ts`, "says when each machine comes out of the page and goes back into it, once each, around its gag").

### The film: 24.9 s, and what is needed outside this unit

`pipeline/change002/step2-NEEDS.patch` (commits whose subject starts `NEEDS:`) changes `config/showcase.json`, which is frozen: step 2 from 21 to 24.9 s; beats `step2.open` 0 to 1.9, `step2.dial` 1.9 to 7.8, `step2.slot` 7.8 to 14.4, `step2.crank` 14.4 to 22.8, `step2.continue` 22.8 to 24.9; key pictures `step2-dial` at 0.293 of its beat (3.63 s, two digits dialled) and `step2-crank` at 0.383 (17.62 s, three bars lit). The Builder takes it at the merge. Every number below was measured with the patch applied to the working copy only; `config/showcase.json` is not in any commit of this branch.

How the film got longer without touching a gag: the script keeps its own clock, and `filmAt` and `scriptAt` in `script.ts` map it to the film's (`LONGER`): 104 steps (0.4333 s) more for the dial's entrance, 0.3867 s for the slot's, 0.1 s before the arrow stamps on the volume field, 0.45 s for the crank's entrance, 1.05 s more of the arrow's hand on the crank, 0.9 s more of cowering and 0.5 s more of lying flat, the last three for the narrator's line 4a (6.25 s from `volume-sign`) and 4b (from `crank-full`, no sooner than 0.3 s after 4a), and 0.05 s before the press of Continue (`CRANKED.even`). Why the last: the unit was 24.85 s, which is 1491 film frames, an odd number, and the film must be a whole number of frames at the preview's 30 a second (MEASURED: `tests/roughcut.test.ts`, `tests/harness-keep.test.ts` and `tests/harness-plan.test.ts` gave "expected 4706 to be 4705.5"). 24.9 s is 1494 frames.

MEASURED with `node pipeline/change002/step2-trace.mjs film`, page seconds: row-open and stage-in-phone 1.887; dial-wind 2.750, 3.271, 4.237; dial-fling 6.017; stage-out-phone 7.292; field-done 7.792; date-key 8.758 to 9.254; stage-in-birth 9.396; lever-pull and reels-spin 10.646; reel-stop 11.246, 11.646, 12.046; date-hit 12.633; coins 12.779; stage-out-birth 13.942; field-done 14.400; row-open, stage-in-volume and volume-sign 14.925; crank-turn 16.325, 16.896, 17.583; crank-runaway 17.583; flatten 20.079; crank-full 21.113; stage-out-volume 22.258; field-done 22.758; peel-up 23.854; button-press 24.296; page turn 24.400. From volume-sign to crank-full 6.188 s. The arrow is hurt for 3.68 s (limit `damageHealSeconds` 4) and control is taken for 2.64 s at most (limit 8).

### The fling on the dial at 1.5 times

MEASURED with `node pipeline/change002/step2-fling.mjs record after` and `compare before after` (before: main, the dial at 1 time). Film, 534 steps each: wheel, x, y, height and scale differ by 0 (x and y from the dial's centre, divided by 1.5); no word of acting, reaction or damage differs; the arrow's angle as drawn (lean and spin added) differs by 0.002052 rad on the first step and by 0 after; lean alone by up to 0.002048 rad on 27 steps, the last of them step 35, with spin the opposite; squash by 0.000916 on the first step.

Cause, MEASURED: the state of the arrow's body when the fling begins, not the fling. Before the fling the arrow hops from hole to hole; on the larger dial the hops are 1.5 times as high and as fast in page px, and the springs of the arrow's lean and squash (`src/cursor/body.ts`, not this unit's file) work in page px. On the last step before the fling the lean's spring is at 0.2521 on main and 0.2482 here. Proof: `node pipeline/change002/step2-fling-state.mjs take <a checkout of main> <file>` writes main's eight spring values on that step; `... give <this repo> <file> same` runs this film to the same step, sets them and records the fling; `step2-fling.mjs compare before same` then gives 0 for wheel, x, y, height, scale, lean, spin and the angle, 0.000293 for squash, nothing over the limit of 0.001, and "the path of the fling is the same".

The dial's entrance is 104 steps longer, a whole number, so the script is read on the same moments as on main; at 0.43 s (103.2 steps) the squash of the first step differed by 0.004988.

### Tests changed or removed in this pass, each by change note 003 update 5 ("no tray, box, card or panel behind any of the three objects") as ruled by the Builder at 22:56Z ("Tests that pin the tray go with the tray")

- `tests/b-step2.test.ts`: the film runs 24.9 s; "shows one field and its stage at a time" is now "shows the field alone and then the machine alone on the bare page: no field, box or tray behind a machine, and one machine at a time" (and it does not ask for a label on the one step a field is done and not yet counted); new "says when each machine comes out of the page and goes back into it, once each, around its gag"; the sign's test reads "as the crank comes out of the page"; the grip's test asks that the grip never passes over the bars, the sign, the line above the machine or the lowest band; the reels' test runs 13 s.
- `tests/step2.test.ts`: the film's length; the states of the page (the state "next field with the last machine's line" is gone, new "never lays the last line of a machine over the field that comes after it"); the order of events with `stage-in-*` and `stage-out-*`; the times of the closed page (1, 8.1, 14.6, 23); "stands on the approved keys" reads the key times from the config; the volume's thresholds and the moved handles' times.
- `tests/step2-dial-acting.test.ts`: the key times (0.95, 3.63, 17.62); reactions are read through `filmAt`; the held reactions follow the arrow's hop off the hole; "moves no event of the page" is now "keeps each event of the page at its time in the longer film".
- `tests/step2-fix.test.ts`: the coins lie "on the bare page above the lowest band"; "draws no coin past the edge of the tray as it shuts" is now "sweeps every coin into the hatch as the machine goes"; three tests read times through `filmAt`; removed "keeps the floor of a tray round at its corners".
- `tests/step2-keeper.test.ts`: "shuts the tray over the sinking slot machine" is now "shuts the page over the dial and over the slot machine only once each is under it"; removed "keeps the shaded wall of a tray lighter than black"; the cursor's step limit is 12 times the dial's factor (MEASURED 16.86 px in one step at 17.983 s, the landing of the crank's throw).
- `tests/step2-dial.test.ts`: "lies under the floor of a field ... until the tray has opened over it" is now "comes up out of the page whole"; "lays its soft shade on the floor ... only when it has risen" reads the standing dial only; "cuts the open tray into the page as a pocket" is now "cuts the hole into the page as a round pocket, as deep as its plan and never wider"; "lights the open field with one ring and one caret" reads the pressed field at 1.9 s; removed "builds the tray as a joint, a rim, a liner, a floor and a shade", "lays the tray's floor in the shade of the wall" and "rolls the rim under the page", new "builds the hole as a lit lip, a wall that darkens to its foot and a dark floor"; the row titles' and the legends' times; "builds a tray on its way open" is now "builds a hole on its way open".
- Removed whole: `tests/polish-date.test.ts`, its helper `tests/polish-date-run.ts`, and the four measuring files that import the helper and are skipped unless asked for (`polish-date-measure`, `polish-date-crank-measure`, `polish-date-pack-measure`, `polish-date-skip-measure`). All of them measure the tray: a spring for each row, the tray's height step by step, the crank parked inside its tray, the dial lying housed under the floor. `tests/polish-date-boss-measure.test.ts` is step 4's and is untouched.

### Not done

- The makers of the tray (`tray`, `trayRim`, `trayFloor` and the rest in `real/rows.ts`, `TRAY` in `layout.ts`) and the crank's parking in its tray (`CRANK_HOME`, `skipHome`, `HOUSED`, `SINK`, `COVER` in `index.ts`) are still in the code. Nothing draws a tray. They were left because the limit was near.
- No sound: the new events have no cue (the Builder spends the credits).

## What the page is now

A. One field at a time (item 12). The page holds `field` (which field is up, 0 to 3), `count` (how many are done) and reports `fields()` as `{ done, total: 3 }`, `done` eased so the rail's fill moves and does not jump. Order: Contact number, Date of birth, Audio volume. One field stands in the middle of the page with its stage (a tray 792 by 372 page px) under it. When its gag is over the tray shuts, the field slides off to the left and the next slides in from the right (0.42 s). The header, its rail, the page's heading and subline stay.

B. The rotary phone (item 6). The dial stands in the middle of its stage at its built size. No line of the dial's code, the fling's code or the script's fling was changed: only `DIAL.cx`, `DIAL.cy` (its place).

C. The date of birth (item 13, decision D3). The field shows `copy:drafts.step2.birth.placeholder`. The visitor types eight digits on the real keyboard (Backspace takes one back). A second press on the field, or 4 s without a key, fills the rest. The typed date is held to what the reels can show (month 01 to 12, day 01 to 31, year 1925 to 2015) and is the visitor's own date. Then the stage opens: three reels, a STOP button under each (`copy:drafts.step2.birth.stop`), the line `copy:drafts.step2.birth.panel` above. The lever pulls itself 0.35 s after the stage stands. Each press of a STOP stops that reel on the legend nearest the middle of its window. All three on the own date: `date-hit`, then 14 coins as before. Anything else: `date-miss`, one coin drops out, the field shows `copy:drafts.step2.birth.missed` and the form goes on. Nothing is asked twice.

D. The volume crank (item 14). The stage holds the crank on the left, a sign 397 by 130 page px with `copy:drafts.step2.volume.sign` in Inter 600 at 56 px on the right, and the ten bars of the level under the sign. `volume-sign` is emitted on the step the stage stands ready, before the crank can be touched: that is the moment for the narrator's line. The level is now a function of the crank's own turning: 0.1 a turn by the visitor's hand, the rest over seven turns of the runaway, and the crank stops on the step the level is full (`crank-full`).

## Second pass: the stage drawn larger (Builder's rulings of 22:27Z)

Where this section and an older line of these notes differ, this section holds.

1. One tray for all three stages: 1100 by 448 page px, x 410 to 1510, y 478 to 926 (was 792 by 372). The field above it is 1100 wide too. The caption panel (x 510 to 1410, y 948 to 1044) is clear of it by 22 px. Continue stays at the bottom right (ruling 2).
2. Each machine is laid out and run at its built size in a stage of its own (the tray divided by the factor) and drawn larger about the tray's upper left corner, on the tray's floor: the dial 1.5 times, the reels and their STOP buttons 1.4 times, the crank, its sign and its bars 1.25 times (`STAGE.times` in `layout.ts`). Why not 1.5 for all: the tray is 448 tall. The dial's wheel (r 100) with its line above it fits at 1.5 (r 150 on the page, centre 960, 736). The reels with the line above and the STOP buttons under them are 320 tall as built, which is 448 at 1.4. The crank's grip sweeps a circle of 175 px radius as built (350 across), which is 437.5 at 1.25 and would be 490 at 1.4.
3. What that gives on the page: the STOP words 28 px (were 20), the line above the reels and the line above the dial 1.4 and 1.5 times their body size, the sign 571 by 175 with its words at 70 px (were 56). MEASURED by looking at the stills of the three stages scaled to 960 by 540 (`out/work/stills/step2-step2_slot-0p35-hd-draft.png`, `step2-step2_crank-0p3-hd-draft.png`): the STOP words, the panel line and the sign are read at that size.
4. How it is done, so that no machine's code changed: the page hands each machine a view of the pointer and the arrow taken back into its stage, and maps out what the machine places, knocks, grounds and emits (`staged` in `index.ts`). The shapes of the open stage are grown as they are drawn (`grown`). The film's waypoints over a machine are given in the stage and mapped out (`on` in `script.ts`). The makers of the three machines read the factor from the shape's id as they did for the sheets (`sheetScale`).
5. Heights. A part's height grows from the tray's floor by the same factor. The arrow's height is unchanged at and under its hover (4), and grows by the factor above it, with a join between (`air` in `scaleOf`): from 4 to 4 + 2(k - 1)12 the slope is k + 0.5, above that the arrow stands over a part as the part stands over the floor. A machine that lies housed in the floor of its tray is let into the floor by what the factor would raise it (`SINK`), so it still lies under the floor of the fields while the tray opens and shuts.
6. The footnote stands under the field at rest (y 488, wrapped to the field's width) and is not drawn from the step a tray opens to the step it has shut: the tray covers where it stood. In the film it is on the page from 0 to 1.887 s, 7.279 to 8.963 s, 13.542 to 14.004 s and from 19.133 s. It can no longer lie under the crank's grip.
7. Thrown by the crank, the arrow lands 34 stage px outside the tray's right edge as before (`AWAY`, page x 1552). It had been written from the crank's hub and would have landed inside the wider tray.
8. The hint for a STOP is given while the own legend comes in (0.44 to 0.2 of a legend before the middle), not for 0.2 either side of the middle: a visitor who follows the hint up to 0.18 s late still stops on it. MEASURED before that change with the site pack's visitor and real pointer events: reel 3 stopped on 1925 for 2015.

## Change note 003: the two lines of the crank

The narrator's line 4a is tied to `volume-sign` and 4b to `crank-full`. Each fires once a visit (MEASURED: `node pipeline/change002/step2-trace.mjs film` and `live`, one line each). The phone and the date of birth have no line. Film times (page s): `volume-sign` 14.417, `crank-full` 17.571, the third `field-done` 19.133, `button-press` 20.425, the page turn 20.5.

What the note asks does not fit in the 21 s of step 2. 4a is 5.6 s, so it ends at 20.017; the crank is full at 17.571, 2.446 s before 4a ends. With 4a over first, 1 s of pause and 2.5 s of 4b, the page could turn at 23.517 at the earliest, 3.017 s after it turns now (2.604 s if `volume-sign` were emitted as the tray starts to open at 14.004). The beats `step2.crank` (14 to 20, its event `flatten` at 16.683) and `step2.continue` (20 to 21) would both be short, the first by 2.446 s if 4a must end before the crank is full. Nothing was stretched: the times are as they were. On the live site the follower of the hint has `volume-sign` at 13.567 and `crank-full` at 16.233, 2.666 s apart.

## Decisions

1. The field stays above its stage and shows what the stage does to it (digits dialled, date typed, percent, the verdict). The brief says the field "leaves" when the visitor is through: it leaves then, with its shut tray.
2. Machines stay at their built size inside a larger tray for the first pass (Builder agreed at 21:4x UTC; a 1.5 times mock of the dial stage is owed after the first pass).
3. Reel windows: how long one legend is the nearest to the middle of the window. Month 400 ms, day 320 ms, year 260 ms (2.5, 3.125 and 3.85 legends a second). Chosen from two visitors with a person's timing, see "The reels" below. The own legend first comes round after 3, 7 and 13 legends (1.2 s, 2.24 s, 3.38 s after the lever), so the three stops can be taken left to right without waiting.
4. A miss pays one coin. STATED: it is the joke of the miss (the machine pays something) and costs no time: the read is 0.59 s and the miss 0.8 s.
5. A visitor who never presses STOP is not kept: after `live.skipLinkAfterSeconds` (20 s) idle the reels stop themselves.
6. The years on the reel are 1925 to 2015, as data in `legends.json`.
7. The lowest 150 page px are kept free of the fields, the stages, the sign, the crank, the STOP buttons and the footnote. The footnote moved up under the stage (y 872 to 915). Continue is still at the bottom right, inside that band (x 1600 to 1792, y 980 to 1040): it is the shell's button place on every page, so it is left for the Builder to rule on.
8. `copy:step2.rows.birth.panel` and `copy:step2.rows.volume.panel` are no longer shown (the first is replaced by the draft panel line, the second by the sign). The keys are still in the locked copy, untouched.
9. In the film the arrow, thrown clear by the crank, now comes back under the sign and not across it (a waypoint in `script.ts`), so it is on the floor when the arm hits it.
10. The film's date is 07 / 23 / 1991 as before; the film's arrow presses each STOP on the step its own legend is in the middle, so the film pays coins.

## Events

Kept: `row-open`, `dial-wind`, `dial-return`, `dial-fling`, `lever-pull`, `reels-spin`, `coins`, `crank-turn`, `crank-runaway`, `flatten`, `peel-up`, `button-press`.

New (each needs a cue from the Builder): `date-key` (a digit typed), `reel-stop` (a STOP pressed, three a visit), `date-hit` (all three on the own date), `date-miss` (not), `volume-sign` (the sign is up, the narrator's line), `crank-full` (the level is full and the crank stops), `field-done` (a field's stage has shut), `field-next` (the next field starts to slide in).

## The film (contract 5)

MEASURED with `node pipeline/change002/step2-trace.mjs film`, page seconds:

| beat | window | its event | at | others in the beat |
| --- | --- | --- | --- | --- |
| step2.open | 0 to 2 | (none) | | row-open 1.887 |
| step2.dial | 2 to 8 | dial-fling | 5.583 | field-done 7.275, field-next 7.279 |
| step2.slot | 8 to 14 | coins | 11.958 | date-key 8.325 to 8.821, row-open 8.963, lever-pull 9.825, reel-stop 10.425, 10.825, 11.225, date-hit 11.813, field-done 13.537, field-next 13.542 |
| step2.crank | 14 to 20 | flatten | 16.683 | row-open 14.004, volume-sign 14.417, crank-runaway 15.175, crank-full 17.571, field-done 19.133 |
| step2.continue | 20 to 21 | button-press | 20.425 | |

No beat is short: every beat's event is inside its window. What is tight: the date is typed in 0.5 s (eight keys at 0.07 s) and the three stops are 0.4 s apart, because the slot beat also has to hold the coins and the arrow's flight from them. The lever moved from 9.37 to 9.82 s, the coins from 11.96 to 11.95 s, the flatten from 16.80 to 16.68 s.

## The reels: can the visitor win

MEASURED with `node pipeline/change002/step2-reels.mjs 300` (300 live visits each, seeded, a new date each visit, presses land 250 ms after the visitor sets off, give or take 60 ms):

- A visitor who knows the order of a reel and sets off 250 ms before its own legend reaches the middle: 287 of 300 paid coins (95.7 %). Reels on the own legend: 100.0 %, 99.0 %, 96.7 %. Every miss was one legend off.
- A visitor who waits until its own legend is the nearest to the middle and only then reacts: 145 of 300 paid coins (48.3 %). Reels on the own legend: 99.0 %, 87.3 %, 54.7 %. Every miss was one legend off.
- No visit of the 600 failed to stop the reels. Mean visit of the page 18.9 s and 19.1 s.

So at 400, 320 and 260 ms a visitor who only reacts wins about one visit in two, one who times the press wins nearly always, and a miss is always the legend next to the own one.

## The fling (item 6)

MEASURED with `node pipeline/change002/step2-fling.mjs record after` and `compare before after`. The baseline (`step2-fling-before.json`) was recorded on dc3296b8 before any change. 534 steps of the fling in the film and 534 on the live site. Each step holds the wheel's angle, the arrow's x and y from the dial's centre on the page divided by the factor the dial is drawn at (1.5), its height taken back through the stage's height map (decision 5 above), squash, lean, spin, scale, acting, reaction and damage. Limit 0.001.

First pass (the dial at its built size, c2e5fdd1): film 0 in everything but 0.000001 rad of spin; live equal from the second step.

Second pass (the dial 1.5 times, its centre at 960, 736):

- Film: x, y, height, wheel, squash, scale: largest difference 0 on all 534 steps. No word of acting, reaction or damage differs. Lean and spin: each differs by at most 0.00205 rad (0.12 degrees) on the first 36 steps (0.15 s) and by less than 0.001 after; lean and spin added differ by 0.00205 on the first step and by less than 0.001 on every step after it.
- Live: x and y within 0.000153. On the first step the height differs by 4.36 and squash by 0.014; from the second step both are equal. Lean and spin differ by at most 0.0182 rad (1.05 degrees) on the first 58 steps (0.24 s); added they differ on the first step only.
- STATED cause of both: the lean the arrow carries into the fling is the shell's answer to how fast the arrow moved on the page just before, and on the larger dial it moves 1.5 times as far in the same time. The fling's own code sets the same turns. The cursor's body is not this unit's file.
- The arrow's height on the page is not the baseline's times 1.5: it is the height map of decision 5 (hover 4 stays 4; the top of the fling, 110.2 as built, is 169.3 on the page).

## The crank: level and turning

MEASURED by `tests/b-step2.test.ts` ("the level rises only on a step the crank turns"): in the film and on a live visit, 0 steps on which the level rose and the crank's angle did not change, and the level ends at 1. Frames: `node pipeline/change002/step2-frames.mjs --show crank`.

The grip and the footnote: MEASURED by the same file, at 720 angles every corner of the grip, mapped to the page, is inside the floor of the tray (410 to 1510, 478 to 926, less the rim), and on every second step of the film the footnote is drawn only on steps no tray is drawn.

## Tests of the page that were changed, and the note line that changed each

- `tests/step2.test.ts`, "has no problems in any state the page can be in": states are now per field (`-here`, value states). Item 12.
- `tests/step2.test.ts`, the copy keys test: the panel lines of birth and volume are gone, the five draft keys are asked for. Items 13, 14.
- `tests/step2.test.ts`, the order of the film's events: the new events are in the order. Items 12, 13, 14.
- `tests/step2.test.ts`, the cue test: the eight new events are exempt until their sounds exist. Builder's mail, point 5.
- `tests/step2.test.ts`, "no tray open at 1, 8.1, 13.9, 20": was a `rest` state, which no longer exists. Item 12.
- `tests/step2.test.ts`, the page's volume at the hand's last turn: 0.3 to one decimal, was to five. Item 14 (the level follows the crank).
- `tests/step2.test.ts`, the knob of the lever is moved at 9.95 s, was 9.35. Item 13 (the lever pulls itself later).
- `tests/step2.test.ts`, the still visitor: gets `date-miss` and no `coins`, was `coins`. Item 13.
- `tests/step2-dial-acting.test.ts`, "moves no event of the page": row-open 8.2 to 8.96, lever-pull 9.37 to 9.82, coins 11.96 to 11.95, flatten 16.8 to 16.68. Items 13, 14.
- `tests/step2-dial.test.ts`, the row titles: each title is read while its own field is up. Item 12.
- `tests/step2-dial.test.ts`, the reel's legends: the windows of time of the opening and the shutting moved. Item 13.
- `tests/step2-fix.test.ts`, the coins lying in the tray: read at 13.06 and 13.1 s, was 13.1 and 13.25. Item 13.
- `tests/polish-date.test.ts`: `OPENING.full` 53 to 54 steps (the tray is 372 tall, was shorter); `VISIT` 3302, 3301, 35869 to 4615, 4615, 37106 steps (one field at a time, the date is typed); `UNDER` (the dial under the page) 96, 48, 4.16 to 83, 37, 1.943704. Item 12.
- `tests/polish-date.test.ts`, removed: the group "a Skip lets the crank's arm come inside its tray before the lift lowers" (11 tests). They drove a visitor who presses the third row at step 400, which is not on the page then, and they pinned the wait for the arm to reach an arc of its turn inside a tray smaller than its sweep. The crank's whole sweep is inside its stage now (item 14, "the crank as the whole stage"); `tests/b-step2.test.ts` holds that for every angle, and the tests of the same file that the arm and grip are inside the floor when the lift lowers still pass.

Second pass, Builder's ruling 3 of 22:27Z ("Size: grow it") under item 12:

- `tests/step2.test.ts`, `step2-dial.test.ts`, `step2-slot.test.ts`, `step2-slot-crank.test.ts`, `step2-keeper.test.ts`, `polish-date.test.ts`: where a test reads a machine's shapes it now reads them as built (`drawBuilt` of `src/pages/step2/index.ts`, the shapes before they are drawn larger) and calls the machine's maker without the page's factor (`plainDial`, `plainSlot`, `plainCrank`). What each test asks of the machine is as it was.
- `tests/step2-slot-crank.test.ts`, "answers the shapes of the sheet as it answers the page": the sheet's shape goes to the maker the page uses, the built shape to the plain one.
- `tests/step2-fix.test.ts`, the coins in the tray, "keeps the arrow at the grip", "stands the tip on the lower right shoulder": read the page as drawn; the distances are the old ones times the stage's factor (80 times 1.4, 52 times 1.25, 6 times 1.5 about the dial's centre on the page).
- `tests/step2-keeper.test.ts`, the meter's picture: at least 3 texels of the picture to a page px of a bar (was 4 to a built px; the bar is 34 wide as built, 42.5 on the page, the picture 128). "never moves the cursor to a grip or onto a machine in one step": across less than 24 times 1.5, up less than 12 times 1.25. MEASURED now: 14.06 up in one step, in the fall of the arrow the crank threw (9.63 before, times 1.25 and the join of decision 5).
- `tests/polish-date.test.ts`: `VISIT` 4600 to 4606 steps (the hand has farther to go); `UNDER` 83, 37, 1.943704 to 97, 47, 4.16 (the dial is under the page for longer in a taller tray; before change 002 it was 96, 48, 4.16); the opening's edge is told to the dial's maker in the dial's own px (the tray's height divided by 1.5).
- `tests/b-step2.test.ts`, the grip and the footnote: rewritten for the page as drawn (see "The crank" above).
