# polish-save: the save of a ball lost between the bats, on the live site

Branch `agent/polish-save` from `664bedb5`. Times are UTC, 2026-11-27 (the machine's `date -u`). MEASURED means I ran the command given; STATED means I read it; UNKNOWN is said as such.

## The scripts

- `node pipeline/phase5/polish-save-measure.mjs [--visitor never,pack,keen,clumsy] [--seeds 1,2] [--after N]`: live visits of the pinball stepped without a browser. For each save it prints the step before and the save's step, the tips of both bats, and from the take to the kick: the steps, the gap of the ball's shell and the drawn wire, the deepest place. Its last line holds the sums.
- `node pipeline/phase5/polish-save-shots.mjs --bot never --seed 1 --at <s> --mouth <px> --count N --every 1 --keep <dir> --crop x,y,w,h --out file.png`: the built site in the browser with a bot's hand, frames 1/60 s apart from the first step after `--at` at which the ball is below `--mouth` px between the bats; `--keep` keeps every whole frame.
- `node pipeline/phase5/polish-save-sheet.mjs --from <dir> --first N --count N --every N --crop x,y,w,h --scale S --cols N --words "..." --out file.png`: cuts a sheet out of kept frames.
- `node pipeline/phase5/polish-slide-live.mjs --seeds 1,2,3,4`: the slide agent's table, run before and after.

## What was there (measured first, on `664bedb5`)

MEASURED, `node pipeline/phase5/polish-save-measure.mjs --visitor never,pack,keen,clumsy --seeds 1,2`: 37 saves in the 8 visits. At every one the ball was put from the mouth to a place 0.37 to 0.50 balls away in one step (its own speed allowed 0.02 to 0.09), with the gate's bar drawn at rest, and one bat of the machine swung at it at all 37: on the save's step the shells of both tips were 0.32 balls or more from the ball's shell.

## Decisions

1. Live only, behind `Machine.live`. In film mode `sense()` saves as before, `take()` and `lie()` are never reached, `Machine.taken` is neither saved nor loaded, the gate's state is `[open]` as before, and the page's `ball-save` handler does only what it did.
2. The gate owns the save. A ball that comes into the mouth of a shut gate (`sense()`), or within `SAVE.reach` of the wire's rest place on the floor (`atGate()`), is taken (`take(k)`: the ball's mode becomes `tow` with `then` `gate:k`, the event `gate-take` is said). From there `lie()` moves it each step by its own speed alone: gravity until it reaches the wire, then a critically damped spring to the rest place (`SAVE.wire` 60 a second up and down, `SAVE.funnel` 50 across) for `SAVE.land` 24 steps, then the rest place draws back `SAVE.back` 0.22 balls over 18 steps and stays there 10 (`SAVE.wind` 28, `SAVE.still` 10), then `SAVE.drive` 4 steps bring it back up to the rest place, and on the next step, at rest on the wire, `kickOut(k)` throws it: `ball-save` is said, the speed is the director's aimed lob when a device is lit (`this.mark`, 20.5 or 21.2 balls a second) or (1.2 either way, 24 up).
3. The wire is drawn on the ball. `draw.ts`, `wireOn(v)`: the exact turn past shut at which the top of the wire loop lies on the ball's shell, so the bar gives under the ball by the ball's own depth and follows it up through the drive until it leaves. `wireOf` is the larger of that and the ring: after `ball-save` the wire is thrown `WIRE.snap` 0.9 rad up the table, held `WIRE.hold` 1/15 s and rung out as a decaying cosine (`WIRE.decay`, `WIRE.period`), at rest after `WIRE.seconds` 0.45 s. The gate's state in live play is `[open, turn]`; the one lent line in `src/table/real/hardware/index.ts` adds the turn to the gate's pose. At rest the turn is 0 and the pose is the same number as before.
4. The machine's own bat does not swing at a save (the Builder's ruling 2). Why: the gate now holds and throws the ball, so a bat has no part in it; MEASURED, the tips' shells are 0.32 balls from the shell of a ball as it leaves the wire, and the ball goes up between them, so a swing would again be a swing beside the ball. `Machine.own` is never set. The slide agent's test of the swing in `tests/polish-slide.test.ts` held what my work removes; it now says no bat swings at a save in either mode.
5. The page answers on the kick's frame with what it has: the flasher or the `flipper-save` cue as before, the page's shake (`HARD['ball-save']`, there before), and in live play the arrow is thrown against its shell as at any blow on the ball (`s.blow`, `s.lay`, `io.cursor.strike`, `io.cursor.press`, `s.snap`, `s.sway`). On `gate-take` the arrow flinches (`io.cursor.react('flinch')`). No new prop, colour or sound. `gate-take` has no cue; `src/audio/cues.ts` is not my file and no test wants it listed (`npm run sound` will name it as an event with no cue). If a kept cue is to hang on it I would use `ball-hit`'s.
6. The length of the hold stays at 24, 28, 10. Tried `SAVE.land 16, wind 24, still 8` to give the play back sooner: the table below got worse (wander seed 2 lost a device and had a cut of 4.02 s, flap seed 4 ended the page at 64.08 s), so it is dropped. The play is chaotic in the hold's length; the numbers kept are the ones measured.
7. A gate that opens while a ball lies on it lets the ball go on down the hole by the old way (seen once in the 8 visits, `never` at page 27.02 s).

## Measured, after

MEASURED 05:21, `node pipeline/phase5/polish-save-measure.mjs --visitor pack,keen,never,clumsy --seeds 1,2`: 33 saves, all by the mouth. From the landing on the wire to the kick the gap of the ball's shell and the drawn wire is -0.00 to 0.00 px. Steps from the take to the kick: 59 to 66 (7.4 to 8.3 sheet frames of 8 steps). In the steps of a save, from the take to the kick's own step, the ball's largest move in one step less what its speed allows: 0.0000 balls. Over the whole of the visits the largest such move is 0.15 balls (keen, page 19.61 s) and 0.06 (pack seed 1, page 21.45 s): both are steps up the table at a bat's blow, floor to floor, not at a save and not mine. The machine's own bat: none at all 33.

## The slide agent's table, before and after

MEASURED, `node pipeline/phase5/polish-slide-live.mjs --seeds 1,2,3,4`.

Before, on `664bedb5` (file kept as `/home/user/keep/slide-before.txt`):

| visitor | old tows (seeds 1 to 4) | waited, s | cuts: count, longest s | devices | off the floor at most, s | scene end, s | page end, s |
|---|---|---|---|---|---|---|---|
| never | 0, 0, 0, 0 | 0.53 | 0, 0.00 | 7 of 7 | 3.41 | 42.13 | 55.77 |
| pack | 0, 0, 0, 0 | 0.95 to 2.73 | 0, 0.00 | 7 of 7 | 3.36 | 39.83 to 41.60 | 53.48 to 55.25 |
| keen | 0, 0, 0, 0 | 6.70 | 2, 1.24 | 7 of 7 | 3.36 | 44.97 | 46.75 |
| clumsy | 0, 0, 0, 0 | 0.43 | 0, 0.00 | 7 of 7 | 3.36 | 39.31 | 40.96 |
| random | 0, 0, 0, 0 | 0.00 to 0.34 | 0, 0.00 | 3 of 7 | 2.16 | 20.32 | 22.98 |
| skipper | 0, 0, 0, 0 | 0.00 | 0, 0.00 | 3 of 7 | 1.20 | 20.32 | 22.98 |
| wander | 0, 0, 0, 0 | 1.94 to 5.53 | 0 to 1, 0.54 | 7 of 7 | 3.41 | 40.42 to 45.21 | 42.70 to 48.12 |
| held | 0, 0, 0, 0 | 5.84 | 5, 0.91 | 7 of 7 | 3.77 | 47.25 | 60.90 |
| flap | 0, 0, 0, 0 | 6.07 to 7.72 | 4 to 6, 0.92 | 7 of 7 | 3.77 | 47.30 to 49.00 | 60.95 to 62.65 |
| stroke | 0, 0, 0, 0 | 0.70 to 0.99 | 0, 0.00 | 7 of 7 | 3.41 | 42.30 to 42.58 | 55.95 to 56.23 |

After, on this branch with `SAVE.land 24, wind 28, still 10`:

| visitor | old tows (seeds 1 to 4) | waited, s | cuts: count, longest s | devices | off the floor at most, s | scene end, s | page end, s |
|---|---|---|---|---|---|---|---|
| never | 0, 0, 0, 0 | 0.95 | 0, 0.00 | 7 of 7 | 3.36 | 42.54 | 56.19 |
| pack | 0, 0, 0, 0 | 1.39 to 2.02 | 0, 0.00 | 7 of 7 | 3.36 | 40.27 to 40.90 | 53.92 to 54.55 |
| keen | 0, 0, 0, 0 | 7.48 | 3, 1.33 | 7 of 7 | 3.57 | 45.75 | 47.40 |
| clumsy | 0, 0, 0, 0 | 2.72 | 0, 0.00 | 7 of 7 | 3.36 | 41.60 | 43.25 |
| random | 0, 0, 0, 0 | 0.00 to 0.91 | 0, 0.00 | 2 of 7; 3 of 7 | 1.95 | 20.32 | 22.98 |
| skipper | 0, 0, 0, 0 | 0.00 | 0, 0.00 | 3 of 7 | 1.01 | 20.32 | 22.98 |
| wander | 0, 0, 0, 0 | 2.99 to 4.99 | 0, 0.00 | 7 of 7 | 3.36 | 41.87 to 43.87 | 43.79 to 46.58 |
| held | 0, 0, 0, 0 | 5.95 | 6, 1.12 | 7 of 7 | 3.57 | 47.33 | 60.98 |
| flap | 0, 0, 0, 0 | 6.64 to 8.00 | 3 to 6, 1.41 | 7 of 7 | 3.57 | 48.23 to 50.28 | 61.88 to 63.93 |
| stroke | 0, 0, 0, 0 | 1.28 to 2.65 | 0, 0.00 | 7 of 7 | 3.36 | 42.21 to 44.25 | 55.86 to 57.90 |

Tried and dropped, `SAVE.land 16, wind 24, still 8` (a shorter hold):

| visitor | old tows (seeds 1 to 4) | waited, s | cuts: count, longest s | devices | off the floor at most, s | scene end, s | page end, s |
|---|---|---|---|---|---|---|---|
| never | 0, 0, 0, 0 | 0.74 | 0, 0.00 | 7 of 7 | 3.36 | 42.34 | 55.99 |
| pack | 0, 0, 0, 0 | 0.46 to 3.13 | 0, 0.00 | 7 of 7 | 3.36 | 38.95 to 42.01 | 52.60 to 55.66 |
| keen | 0, 0, 0, 0 | 7.16 | 2, 1.51 | 7 of 7 | 3.36 | 45.43 | 47.25 |
| clumsy | 0, 0, 0, 0 | 1.86 | 0, 0.00 | 7 of 7 | 3.36 | 40.74 | 42.39 |
| random | 0, 0, 0, 0 | 0.00 to 0.91 | 0, 0.00 | 2 of 7; 3 of 7 | 2.00 | 20.32 | 22.98 |
| skipper | 0, 0, 0, 0 | 0.00 | 0, 0.00 | 3 of 7 | 1.03 | 20.32 | 22.98 |
| wander | 0, 0, 0, 0 | 0.24 to 8.00 | 0 to 4, 4.02 | 6 of 7; 7 of 7 | 3.62 | 38.28 to 47.05 | 42.70 to 60.70 |
| held | 0, 0, 0, 0 | 5.85 | 5, 1.07 | 7 of 7 | 3.62 | 47.22 | 60.87 |
| flap | 0, 0, 0, 0 | 7.16 to 8.00 | 3 to 6, 1.16 | 7 of 7 | 3.62 | 48.76 to 50.42 | 62.41 to 64.08 |
| stroke | 0, 0, 0, 0 | 1.13 to 2.93 | 0, 0.00 | 7 of 7 | 3.36 | 42.48 to 44.53 | 56.13 to 58.18 |


What changed in it: old tows 0 for every visitor before and after. Devices 7 of 7 wherever they were 7 of 7. The `random` visitor, who skips the scene at 20.32 s, reaches 2 of 7 on seeds 2 and 4 where it reached 3 of 7 (the inbox is not reached before it skips; a save now takes about a quarter second longer). Scene ends later by at most 2.29 s (clumsy), the latest scene end is 50.28 s and the latest page end 63.93 s (flap seed 4; before 62.65 s). The longest cut of the bats' power is 1.41 s (before 0.92 s in this table).

## Pictures (looked at by me at real size)

Made with `node pipeline/phase5/polish-save-shots.mjs --bot never --seed 1 --at 17 --mouth 900 --count 46 --every 1 --keep /home/user/shots/after2 ...` on the build of `2c0457c4` (the job was stopped after picture 37, so no times file: picture n is the page's 19.887 s + n/60 s, from a stepped trace of the same visit), then cut with `polish-save-sheet.mjs`. They are not in the repository (pictures of the site are not committed by me); the Builder has them by mail.

- `polish-save-critic.png`: 12 frames 1/30 s apart (pictures 8 to 30), window `812,820,300,260` at real size: the gate wire, both bats' tips and the ball's way up. Frames 1 to 3 the ball comes down between the bats; 4 to 6 it lies on the wire and does not move; 7 to 9 it sinks about 19 px (the wind-up) while the arrow in it rights itself; 10 it has started up; 11 the wire loop stands about 25 px up the table and the ball's shell is about 10 px above it; 12 the ball is a ball's width higher, the wire still up.
- `polish-save-take.png`: pictures 8 to 19, 1/60 s apart, real size: the ball's lower edge reaches the wire at picture 12 to 13 and stays on it.
- `polish-save-kick.png`: pictures 22 to 33, 1/60 s apart, real size: 22 to 25 wound back, 26 driving up, 27 the wire lifted about 8 px with the ball's shell on it, 28 to 30 the wire thrown about 25 px up with the ball leaving at about 30 px a picture, 31 and 32 the wire rings (about 10 px, then about 5), 33 at rest.
- Before: the Builder's own sheet of round 23 (`set-A-08.png`, 1:59.22 to 1:59.58), where the ball is thrown from the mouth with a bat of the machine swinging beside it and the gate below the window. I made no before sheet in my own window in the first pass.


CHECKS

OPEN
