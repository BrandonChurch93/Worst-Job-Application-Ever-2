# fix-flipper: the ball off a flipper on the live site

Branch `agent/fix-flipper`. Times are UTC, 2026-11-26. No file under `src/` is changed in this pass.

## Decisions

- A "step" in the brief is read as a visitor's step of the pack tool (1/60 s, 4 steps of the physics). Case (b) is measured both ways: let go after 6 visitor steps (b) and after 6 physics steps (b2). The sheet of case (b) is drawn at visitor steps, since that is what a picture of the live site is.
- The scripts read the built logic through `tools/lib/logic.mjs` and, for the browser, the pack tool's own visitor (`makeVisitor`, `VISITOR`, `LEVEL` of `tools/lib/pack-site.mjs`). Nothing of the site is changed by them.
- `fix-flipper-drawn.py` needs Python with OpenCV, which is in the VM and is not an npm package. It is a measuring tool only.
- Reading: honest physics at the bat. No mend is made in `src/table/physics.ts` or `src/table/real/play/flippers.ts`. What the critic saw is made by the director's shot and the bumper's throw, which the film's take plays too; that goes to Brandon in plain words.

## The scripts

- `node pipeline/phase5/fix-flipper-measure.mjs [--rows]`: the bare `Machine`, right bat of the office tier, cases a, b, b2, c, c2, d. Output kept in `fix-flipper-measure.txt`.
- `node pipeline/phase5/fix-flipper-live.mjs --phase 0 [--json file]`: the live stage of step 3 in Node with the pack visitor's press (the hint, 11 visitor steps, the key), every step of the physics printed.
- `node pipeline/phase5/fix-flipper-sheet.mjs --name critic --frames 24 --lead 3 [--hold 6]`: the live site in the browser, 24 consecutive visitor steps round the visitor's first press, one picture a step, with the page's own place of the ball.
- `node pipeline/phase5/fix-flipper-compose.mjs --name critic`: the same window of every picture at real size, 6 to a sheet.
- `python3 pipeline/phase5/fix-flipper-drawn.py critic /tmp/live0.json`: the drawn ball (circle found in the picture) and the drawn bat (axis of its orange body) beside the sim's place and angle at that step.

## What the sim does (MEASURED)

Units: balls (96 px), steps of 1/240 s, the slope's pull 29.4 balls/s2 = 0.1225 balls/s a step. Angles: 90 deg is up the table, 180 deg is level to the left.

`node pipeline/phase5/fix-flipper-measure.mjs` (the bare machine, no director):

| case | before | after the first contact | in touch | leaves toward | clear of the bat |
|---|---|---|---|---|---|
| a, pressed and held | 4.51 | 29.76 | 17 steps | 91 deg | the pull is 0.1225 in 247 of 250 steps, the 3 others are a bumper |
| b, let go after 6 visitor steps | 4.51 | 29.76 | 17 steps | 91 deg | 0.1225 in 250 of 253 steps |
| b2, let go after 6 physics steps | 4.51 | 27.08 | 7 steps | 119 deg | 0.1225 in 66 of 68 steps |
| c, bat up, ball falls on the tip (5 places) | 6.37 to 6.74 | 1.41 to 2.95 | 4 to 8 steps | along the line from the tip to the ball | 0.1225 in every free step |
| d, bat at rest, ball rolls down it | 0.12 | 6.53 | 167 steps, 9.0 balls/s2 along the bat | -151 deg, into the gap | 0.1225 in 34 of 35 steps |

A real ball, one line each:

- a: thrown up the table at about the speed of the bat under it and a little more, clear of the bat in a few thousandths of a second. The sim differs: the ball's speed is held at the cap of 30 balls/s, so the bat catches it up and carries it the whole stroke (17 steps), and it slides from 1.87 to 3.17 balls along the bat while it rides.
- b: the same strike, since the stroke is over (17 steps) before the key is let go (24 steps); only what the ball meets on its way back changes. The sim does this.
- b2: a short tap throws the ball as hard as the bat moved while it pushed. The sim: 27.08 balls/s after 7 steps in touch.
- c: a low bounce off the rubber, a third to a half of the speed back, then it rolls off the tip. The sim: 0.22 to 0.44 of the speed back, then rolls off or settles on the raised flank.
- d: rolls down the bat gaining 8.3 (rolling) to 12.4 (sliding) balls/s2 and drops off the tip. The sim: 9.0 balls/s2.

`node pipeline/phase5/fix-flipper-live.mjs --phase 0` (the live stage with its director, the pack visitor's press):

| step | what | speed before | speed after |
|---|---|---|---|
| 4185 | the key; first step of the stroke, ball 5.1 balls/s on the bat | 5.1 | 25.1 |
| 4190 to 4198 | carried by the bat at the cap | 30.00 | 30.00 |
| 4201 | the stroke ends, event `shot:right`: the director sets the velocity toward its shot, the low bumper 1.4 balls above | 29.76 | 18.80, at (-5.04, -18.11) |
| 4211 | event `bumper:office.bumper.3`: the bumper throws it out at its set speed (the larger of 18 and 0.9 of the speed in), leaned toward the director's `aim` under the bumper | 17.74, at (-5.04, -17.01) | 18.00, at (5.84, 17.03), down at the raised bat |
| 4223 | the ball meets the round of the raised tip | 19.28, at (5.84, 18.37) | 9.64, at (-8.83, -3.87): 24 deg above level, to the left |
| 4224 on | free flight | sideways -8.83 every step | down the slope +0.1225 every step |

At step 4223 the speed back along the line of contact is 7.14 of 19.1 (0.375, the mean of the bat's 0.3 and the ball's 0.45). The ball carries spin taken on the stroke (rim speed -14.54 balls/s); the contact turns part of it into speed along the tip (rim speed -6.69 after), about 4.25 balls/s. Without the spin the ball would leave at about 7.3 balls/s, 54 deg above level.

## The picture and the sim (MEASURED)

`node pipeline/phase5/fix-flipper-sheet.mjs --name critic --frames 24 --lead 3`, then `python3 pipeline/phase5/fix-flipper-drawn.py critic /tmp/live0.json`:

- The place of the ball the page reports is the Node sim's place at the same step in all 24 pictures (to 0.1 px).
- The circle found in the picture sits 0.7 to 8.7 px from the sim's place at that step (the finder's error on a glass ball with a shadow). One visitor step of lag would be 14 to 55 px in these pictures.
- The drawn bat's angle is within 0.8 deg of the sim's angle at that step in all 24 pictures (13.5 against 13.1 on the first picture of the stroke, 24.9 against 25.0 at rest, -24.2 against -25.0 raised).
- So the picture is the sim's step. It does not lag.
- After the tip contact (pictures 14 to 24) the ball's drawn step is -14.1 px sideways every picture, and its step up the table goes -5.6, -4.8, -4.0, -3.2, -2.4, -1.6, -0.9, -0.1, +0.7, +1.5, +2.3 px: 0.78 px more every picture, which is the slope's pull (29.4 x 96 / 3600).

## Reading

Honest at the bat. The second deflection is the contact with the round of the raised tip, with the bat's and the ball's own bounce and grip, and the slope pulls every step after it. It reads as a level peel because the ball leaves the tip at 9.6 balls/s only 24 deg above level, so the slope needs 8 pictures (0.13 s) to turn it, and in that time it rises only 0.25 balls.

Two things in the sequence are not contact physics, and neither sits in the lines of the bat:

1. The director's strike (`strike()` of `src/table/physics.ts`, called at the end of the stroke with the `shot` set by `direct()` of `src/pages/step3/index.ts`): 29.76 to 18.80 balls/s in one step, aimed at the low bumper 1.4 balls above the tip.
2. The bumper's set throw of 18 balls/s, leaned toward the director's `aim`, back at the raised bat 10 steps later (`aimed()` and `kick()` of `src/table/physics.ts`, the `aim` set by `direct()`).

Strike, bumper and tip contact all fall inside 38 steps (0.16 s, 10 pictures). The film's take plays the same director and the same machine, so a change to either would move the film's take; the machine cannot tell a visitor's press from the film's without a flag set from `src/pages/step3/index.ts`, which is not a file of this piece. No mend in this pass.

## Case (b) in the live site (MEASURED)

`node pipeline/phase5/fix-flipper-live.mjs --phase 0 --hold 6` (Node) and `node pipeline/phase5/fix-flipper-sheet.mjs --name case-b --frames 24 --lead 3 --hold 6` (the browser; the page's place of the ball equals the Node place in all 23 pictures the Node rows cover, the drawn bat is within 0.8 deg):

- The stroke, the strike (29.76 to 18.80 at step 4201) and the bumper's throw (18.00 at step 4211) are the same as with the key held.
- The key is let go at step 4209; the bat is back at rest at step 4225, before the ball comes down.
- Step 4247: the ball lands on the flank of the bat at rest: in (5.84, 21.31) 22.10 balls/s, out (-10.93, -3.36) 11.44 balls/s, 17 deg above level to the left. Spin rim speed -14.54 before, -8.26 after.
- After that: sideways -10.93 every step, down the slope +0.1225 every step.

Sheets: `node pipeline/phase5/fix-flipper-compose.mjs --name case-b --cx 1070 --cy 780 --w 290 --h 440 --cols 4 --rows 2 --out b` (three sheets of 8, real size) and `--name critic --cx 1025 --cy 678 --w 290 --h 356 --cols 4 --rows 3 --from 7 --to 18 --out held` (the held press, pictures 7 to 18).

## What goes to Brandon in plain words

The ball off the flipper is the machine's own physics and the picture shows the machine's own step. What reads as a sideways peel is this: the flipper sends the ball at a bumper that sits a ball and a half above its tip, the bumper throws it straight back within a twentieth of a second, and the ball skids off the flipper at a shallow angle with the spin the stroke gave it. To change that, the shot the director asks for (or where that bumper throws the ball) would have to change, and the film's take plays the same shot, so the film's take would move with it.

## Checks before the first push (MEASURED)

- `npm test`: 140 files, 1764 tests passed.
- `npm run bots`: "bots: all clear".
- `npm run still -- --key <step1-fire|table-wide|boss-fight> --format hd --tier draft --force`, then `cmp` against the three made on `origin/main` before any work: byte equal, all three.
- `npm run determinism`: "determinism: pass, 12 pictures at hd, tier draft, identical across two fresh loads and two orders".
- `npx tsc --noEmit -p .`: exit 0, no output.

## For Brandon, in plain words: the director's set shot

1. On the live site a visitor's stroke does not send the ball where the bat alone would. When a bat starts its stroke under the ball, the machine ends that stroke by sending the ball to the place the director has named for that moment (`strike()` of `src/table/physics.ts`, the place set by `direct()` of `src/pages/step3/index.ts`). In the measured stroke (MEASURED, `node pipeline/phase5/fix-flipper-live.mjs --phase 0`): the bat alone had the ball at 29.76 balls/s nearly straight up the table, and the set shot made it 18.80 balls/s toward the low bumper 1.4 balls above the bat's tip, which threw it back onto the raised tip 22 steps of the physics (0.09 s) later.
2. The director's set shots of the visit, in the order of the page's clock (STATED, read from `direct()`; either bat sends them, whichever began its stroke under the ball):

| when (page seconds) | tier | aimed at | speed, balls/s |
|---|---|---|---|
| until 12.6 (then towed) | lobby | the stand of the revolving door (`corporate.revolving`), with a pull of 12 within 2.2 balls | 13 |
| until 17.9, and again 20.72 to 23.3 | office | the low bumper (`office.bumper.3`) | 17 |
| 17.9 to 19.1 (then the ball is towed there until 20.72) | office | the inbox scoop (`office.inbox`), with a pull of 30 within 2.2 balls | 21 |
| from 23.3 | office | none: the bumpers and slings lean the ball to the gate's mouth, and from 24.3 a pull of 40 draws it to the gate | none |
| until 27.2 (then towed) | street | the mouth of the firehouse (`street.firehouse`), with a pull of 30 within 2.2 balls | 21 |
| 29.35 to 31.2 (then towed) | street | the start of the highway ramp | 21 |
| 34.45 to 35.9 | street | a spot 1.2 balls right of the middle, 2.2 balls down the street tier (the save) | 19 |

A shot to a far place on the ball's own side from low on the tier is lobbed at 9 balls/s instead.

## The ball over the left lamp window after the stroke (the Builder's question of 21:18)

MEASURED, `node pipeline/phase5/fix-flipper-live.mjs --phase 3 --after 170 --json /tmp/live3long.json`, then `node pipeline/phase5/fix-flipper-insert.mjs /tmp/live3long.json` (the same for phase 0), and `node pipeline/phase5/fix-flipper-near.mjs` for what stands nearest:

- The yellow disc is not a bumper. It is the lamp window `office.insert.1` (a slice of pizza, radius 0.62, at 8.3, 7.1 of the office tier). The machine has no body there: `src/table/physics.ts` does not read `table.inserts`. The three bumpers of the office tier are at (8.9, 3.2), (11.1, 3.2) and (10, 5.1); the ball's centre is 3.7 to 4.9 balls from the left one's centre in these steps (the two radii are 0.5 and 0.75).
- The ball rolls over the window from the right (phase 3: 9.8 to 10.9 balls/s, visitor steps +20 to +26 after the key), meets the corner post of the left slingshot (`office.sling.post.left.c`, radius 0.12, at 7.35, 7.45) once, at step 4292 (phase 3) or 4297 (phase 0): 10.86 to 6.54 balls/s (phase 3), 10.18 to 5.67 (phase 0), about half the speed back along the line of contact, spin -14.73 to -10.93. Then it rolls back over the lower side of the window at 6.5 to 9.7 balls/s (phase 3, until visitor step +34) or 5.7 to 7.8 (phase 0, past visitor step +36).
- Nothing kicks because nothing there kicks: a window has no body, and the slingshot kicks only when the ball is within 0.56 balls of its face (the line between its end posts); at the corner post the ball's centre is 0.62 from that line's end, held off by the post itself. No rest time and no sensor is in play. No event is told because the machine tells none for a post.
- The director does not steer the ball there: in every step between visitor steps +18 and +40 but the one at the post, the ball's velocity changes by the slope's pull alone (0.1225 down the slope, 0 sideways). From 17.9 s the director's pull toward the inbox is set (30, reach 2.2 balls), and the ball is 6.9 to 7.3 balls from it.
- The window is lit for two reasons, both in the drawing and neither a touch: its mode is on since 15 s of the page (`MODES`, mode 0), and a window answers the ball's nearness (`near()` in `src/table/real/lights/levels.ts`, line 94: the level rises as the ball's edge comes within 0.55 balls of the window and is full with the ball deep over it).

Reading: honest physics. What may read as a ball stuck to a bumper is a ball rolling over a flat lit window after a slow bounce off a slingshot post.
