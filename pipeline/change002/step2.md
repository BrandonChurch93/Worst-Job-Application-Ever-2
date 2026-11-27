# Step 2, change 002: notes of the unit

Branch `agent/b-step2`. Files: `src/pages/step2/*`, `tests/b-step2.test.ts`, the tests of the page named below, `pipeline/change002/step2-*.mjs`.

Each fact is MEASURED (command and number), STATED (said, not measured) or UNKNOWN.

## What the page is now

A. One field at a time (item 12). The page holds `field` (which field is up, 0 to 3), `count` (how many are done) and reports `fields()` as `{ done, total: 3 }`, `done` eased so the rail's fill moves and does not jump. Order: Contact number, Date of birth, Audio volume. One field stands in the middle of the page with its stage (a tray 792 by 372 page px) under it. When its gag is over the tray shuts, the field slides off to the left and the next slides in from the right (0.42 s). The header, its rail, the page's heading and subline stay.

B. The rotary phone (item 6). The dial stands in the middle of its stage at its built size. No line of the dial's code, the fling's code or the script's fling was changed: only `DIAL.cx`, `DIAL.cy` (its place).

C. The date of birth (item 13, decision D3). The field shows `copy:drafts.step2.birth.placeholder`. The visitor types eight digits on the real keyboard (Backspace takes one back). A second press on the field, or 4 s without a key, fills the rest. The typed date is held to what the reels can show (month 01 to 12, day 01 to 31, year 1925 to 2015) and is the visitor's own date. Then the stage opens: three reels, a STOP button under each (`copy:drafts.step2.birth.stop`), the line `copy:drafts.step2.birth.panel` above. The lever pulls itself 0.35 s after the stage stands. Each press of a STOP stops that reel on the legend nearest the middle of its window. All three on the own date: `date-hit`, then 14 coins as before. Anything else: `date-miss`, one coin drops out, the field shows `copy:drafts.step2.birth.missed` and the form goes on. Nothing is asked twice.

D. The volume crank (item 14). The stage holds the crank on the left, a sign 397 by 130 page px with `copy:drafts.step2.volume.sign` in Inter 600 at 56 px on the right, and the ten bars of the level under the sign. `volume-sign` is emitted on the step the stage stands ready, before the crank can be touched: that is the moment for the narrator's line. The level is now a function of the crank's own turning: 0.1 a turn by the visitor's hand, the rest over seven turns of the runaway, and the crank stops on the step the level is full (`crank-full`).

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

MEASURED with `node pipeline/change002/step2-fling.mjs record after` and `compare before after`. The baseline was recorded on dc3296b8 before any change. 534 steps of the fling in the film and 534 on the live site, each step: the wheel's angle, the arrow's x, y, z relative to the dial's centre, squash, lean, spin, scale, acting, reaction, damage.

- Film: largest difference 0 in x, y, z, wheel, squash, lean, scale; 0.000001 rad in spin (the sixth decimal the file is rounded to); no word differs.
- Live: x, y, z are the same from the second step on; on the first step x differs by 0.000162 px, y by 0.000070 px, z by 0.000002. Lean and spin differ by at most 0.000073 rad over the first 120 steps and by 0 after. STATED cause: the arrow reaches the dial along a different path because the dial stands elsewhere, so its body's spring starts the fling 0.00007 rad apart. No word differs.

## The crank: level and turning

MEASURED by `tests/b-step2.test.ts` ("the level rises only on a step the crank turns"): in the film and on a live visit, 0 steps on which the level rose and the crank's angle did not change, and the level ends at 1. Frames: `node pipeline/change002/step2-frames.mjs --show crank`.

The grip and the footnote: MEASURED by the same file, at 720 angles every corner of the grip is above the footnote (y 872) and inside the floor of its tray, and on every second step of the film the drawn grip's corners are above the drawn footnote.

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
