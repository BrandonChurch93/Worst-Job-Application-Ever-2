# Step 2, change 002: notes of the unit

Branch `agent/b-step2`. Files: `src/pages/step2/*`, `tests/b-step2.test.ts`, the tests of the page named below, `pipeline/change002/step2-*.mjs`.

Each fact is MEASURED (command and number), STATED (said, not measured) or UNKNOWN.

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
