# polish-slide: a beat's deadline while the visitor's ball is in play

Branch `agent/polish-slide` from `19c0d013`. Times are UTC, 2026-11-27 (the machine's `date -u`). MEASURED means I ran the command given; STATED means I read it; UNKNOWN is said as such.

## The scripts

- `node pipeline/phase5/polish-slide-live.mjs [--visitor never,pack,keen,clumsy,random,skipper,wander,held,flap,stroke] [--seeds 1,2] [--facts] [--rows --at <page s> --after N]`: visits of the pinball page in Node, the stage's own steps with the page's director, no browser, about 1 s a visit. For each visit it prints the tows the director starts (a tow called outside the machine's own step, not from a gate's mouth) with the bodies the straight line passes through, every stretch a deadline waited, every cut of the bats' power, the devices reached of 7, the longest stretch the ball was off the floor, the longest stretch in which the ball was off the floor or the power was cut, the scene's end and the page's end.
- The visitors: `never` presses nothing; `pack` is the motion pack's visitor (the page's hint, 11 looks late); `keen`, `clumsy` are the site's bots; `random` and `skipper` are the site's bots and skip the scene at 20 s; `wander` is the random bot's flips without its skip; `held` holds both keys down all the time; `flap` presses both keys 4 times a second; `stroke` gives one stroke of 0.15 s every 2 s.
- `node pipeline/phase5/polish-slide-shots.mjs --bot keen --seed 1 --at <page s> --count 24 --every 1 --crop x,y,w,h --out file.png`: a sheet of steps in a row of the live page in the browser with a bot at the flippers, cut out unscaled. Run in a worktree of `19c0d013` it gives the same visitor before the mend.
- Tables: `pipeline/phase5/polish-slide-before.txt` (on `19c0d013`), `pipeline/phase5/polish-slide-after.txt`.

## Decisions

1. Live only, behind `Machine.live`. In film mode `lob()` returns 0 as before, `stay()`, `spent()` and `cut()` do nothing, and every tow of the film is where it was (`!live &&` in front of each deadline's tow).
2. The wait. `stay(at, end, k)` in `direct()`: when the scene's clock reaches a deadline and the ball is in play on that deadline's tier (on the floor, in a gate's mouth, or on an outlane's rail), the clock is held one step under the deadline for as long as that is so. The deadlines that wait: the lobby's end, the inbox, the office gate, the firehouse, the ramp, the street gate. The inbox, the firehouse and the ramp stop waiting 0.3 s, 0.3 s and 0.8 s before the device's own kick (the eject, the scoop's kick, the highway's end), so the lit device is not passed by.
3. Ages while the clock is held (the Builder's ruling 1): the stamps the page ages from the scene's clock (`struck`, `snap`, `scoreAt`, `blow[2]`, `lay[1]`, `sway`) move back with the held clock, so a hit during a wait is set and grows old as at any other time.
4. No director's tow at a deadline in live play, none at all: not to the inbox, the firehouse, the ramp, nor to a gate. The devices stay armed for the whole wait: the save's lob to the lit device (`Machine.mark`) and the gate's pull.
5. The limit, from the table: the scene may spend 5 s of waiting (`SHOT.slide[0]`) before the last resort is allowed, and 8 s in all (`SHOT.slide[1]`), after which no deadline waits. Why 5: over 4 seeds each, the visitors who play by what they see spent at most 2.73 s (`pack`), 0.43 s (`clumsy`), 0.99 s (`stroke`), and `wander` 1.94 to 5.53 s, so two of the four `wander` visits met one short cut (0.23 s and 0.54 s) and no other of them met any; the bot that presses at every chance (`keen`, 6.70 s) and the keys held or flapped blindly (`held`, `flap`) spend it all. Why 8 in all: the scene's end without waiting is at most 41.9 s (MEASURED before), the page leaves 13.65 s after the scene's end for a visitor who does nothing, and the tests of two other owners hold the page to 64 s for such visitors, so the scene must end by 50.3 s. With 6 s of budget one measured visit left at 64.17 s; with 5 s the latest is 62.65 s.
6. The last resort (the Builder's ruling 2 of 00:44): the machine cuts the bats' power. Step by step: (1) the scene's waiting is spent and a gate is open or a device is lit; (2) the ball comes into the bats' reach, 6.6 balls or more down the tier, and no stroke has met it in the last 0.75 s; (3) the power is cut: the bats fall under their own weight in 12 steps with their one low bounce, a press does not lift them, and the tier's lamps flash every 0.34 s for as long as the cut lasts (`Machine.cut`, `dark()`); (4) the ball rolls off the dead bats into the gate's mouth; (5) an open gate takes it; a shut gate's save throws it to the lit device, struck by the machine's own bat (7); (6) the power is back the step the ball is out of the bats' reach again (in the gate, in the save, or above 6.6 balls). Once a cut has begun a stroke cannot end it, since the bats do not move. A ball already in a gate's mouth may be cut at once, whatever the last stroke was: the stroke did not keep it up.
7. The save is seen to be struck (the Builder's mail of 01:01, the critic's two issues on merge 43). What the pack of my first commit showed at the critic's own step (round 23, R4, set-A-09, 1:52.63 to 1:53.00): the ball lies in the gate's mouth under the tips, and leaves it upward with both bats at rest. That is the save's lob of polish-ball, not a tow, and it is what the critic described. Now, in live play only, on the step a save throws the ball out of the mouth the machine swings one bat itself (`Machine.own`, `LIVE.own` 12 steps: 8 up as a visitor's stroke, 4 held, then the bat falls in 12 with its bounce): the left bat when the ball leaves to the right, the right bat when it leaves to the left, so the bat's face looks the way the ball goes. It swings whatever the visitor's keys are and whether or not the power is cut. The machine's stroke is not counted as a stroke that met the ball.
8. Not built: a growing pull to the gate (the earlier recipe's `drag()`) and a magnet that catches and throws. Measured first: raised bats close the mouth (0.98 balls between the raised tips), so no pull gets the ball past a visitor who holds the keys; only the bats' fall does.
9. Left as it is: the lobby's tow to the revolving door before the door's kick (`towTo('corporate.revolving', 18)`, 0.3 s before 12.9 s). It is not at a deadline's wait, it was 0 of the 44 old tows measured before, and in the visits measured after the director starts no tow at all.
10. A test of another owner holds a number my work changes: `tests/site-pointer-listeners.test.ts`, "through a whole table ... the flippers are what the hand asks in the same step: never taken, 0 steps ignored". With the cut and the machine's own stroke, 8 of its samples of a `keen` visit found a bat that was not what the hand asked (MEASURED 01:25, `npm test`: 1 failed, 1858 passed, "expected 8 to be +0"). The cut is the Builder's ruling of 00:44 and the stroke the Builder's mail of 01:01, so the bats are by rule not the hand's for those steps. What I changed in that test, nothing more: the count is split in two, the samples taken while the machine's save says `cut` or `own` (8, held as the number 8) and all the others (0, as before); its title says so. So that the test can tell them apart, `Machine.own` counts one step longer than the bat is driven (set to 13, driven while above 1), and the saved state of every driven step holds a number above 0. Not changed and to be known: the stage's own measure `longestIgnored.flippers` (in `src/stage/stage.ts`, not my file) still reads 0 through a cut, so `npm run bots` does not see the cut; the cut's length is measured by my script and my tests only (longest 1.24 s, the stretch off the floor or cut at most 3.77 s).

## The table, before and after

MEASURED: `node pipeline/phase5/polish-slide-live.mjs` on `19c0d013` (seeds 1,2, file `polish-slide-before.txt`) and `node pipeline/phase5/polish-slide-live.mjs --seeds 1,2,3,4` on this branch (file `polish-slide-after.txt`). `random` and `skipper` skip the scene at 20 s in both and have no tow and no wait.

| visitor | old tows before (seeds 1, 2) | old tows after (seeds 1 to 4) | waited after, s | cuts after: count, longest s | devices after | off the floor or cut at most, s | scene end before, s | scene end after, s | page end after, s |
|---|---|---|---|---|---|---|---|---|---|
| never | 1, 1 | 0, 0, 0, 0 | 0.53 | 0 | 7 of 7 | 3.41 | 41.78 | 42.13 | 55.77 |
| pack | 4, 3 | 0, 0, 0, 0 | 0.95 to 2.73 | 0 | 7 of 7 | 3.36 | 39.11 to 39.38 | 39.83 to 41.60 | 53.48 to 55.25 |
| keen | 3, 3 | 0, 0, 0, 0 | 6.70 | 2, 1.24 | 7 of 7 | 3.36 | 38.27 | 44.97 | 46.75 |
| clumsy | 3, 3 | 0, 0, 0, 0 | 0.43 | 0 | 7 of 7 | 3.36 | 39.07 | 39.31 | 40.96 |
| wander | 3, 1 | 0, 0, 0, 0 | 1.94 to 5.53 | 0 to 1, 0.54 | 7 of 7 | 3.41 | 39.07 to 40.64 | 40.42 to 45.21 | 42.70 to 48.12 |
| held | 4, 4 | 0, 0, 0, 0 | 5.84 | 5, 0.91 | 7 of 7 | 3.77 | 41.88 | 47.25 | 60.90 |
| flap | 5, 5 | 0, 0, 0, 0 | 6.07 to 7.72 | 4 to 6, 0.92 | 7 of 7 | 3.77 | 41.88 to 41.89 | 47.30 to 49.00 | 60.95 to 62.65 |
| stroke | 0, 1 | 0, 0, 0, 0 | 0.70 to 0.99 | 0 | 7 of 7 | 3.37 to 3.41 | 41.45 to 41.85 | 42.30 to 42.58 | 55.95 to 56.23 |

- Old tows: 44 in 20 visits before, 0 in 40 visits after. The director starts no tow at all in the 40 visits after.
- The scene's end: at most 49.00 s after (the rule is 60 s); the page's end at most 62.65 s.
- The longest stretch in which the ball is off the floor or the bats' power is cut: 3.77 s (the rule is 8 s). The longest cut alone: 1.24 s. The cuts of one visit add up to at most 2.96 s.
- A cut on the floor began at the soonest 0.75 s after a stroke that met the ball; 3 cuts in the 40 visits began with the ball already in a gate's mouth.
- Both rules hold for every visitor measured; there is no visitor for whom a choice between them had to be made.

## Checks before the push of 01:41Z

All MEASURED, run one at a time by one script, 01:31:22 to 01:40:34 UTC, on the tree that was pushed:

- The three draft stills (`npm run -s still -- --key <k> --format hd --tier draft --force`, then `cmp` with the ones made on `19c0d013`): step1-fire, table-wide, boss-fight byte equal.
- `npm run -s take -- --check`: 14 lines, `diff` with the output kept from `19c0d013` empty.
- `npm run determinism`: pass, 12 pictures at hd, tier draft, identical across two fresh loads and two orders.
- `npm run bots`: all clear, keen reached every one of the 37 gags on every seed.
- `npm test`: 154 files passed, 1 skipped; 1859 tests passed, 1 skipped; 192.87 s. On `19c0d013`: 153 files, 1851 tests. The 8 more are `tests/polish-slide.test.ts`.
- `npx tsc --noEmit -p .`: 0 lines.
- The pin "leaves the film as it was" in `tests/polish-ball.test.ts`: passes, the file is not edited.

## The pictures

Made with `node pipeline/phase5/polish-slide-shots.mjs`, the built site in a browser at the preview size, visitor `keen`, seed 1, tiles unscaled. I looked at each.

- `before-tow`: `19c0d013`, page 19.05 to 19.43 s, 24 frames in a row. The ball leaves the flippers' area and goes in one straight line at one speed, through the red slingshot, into the inbox's hole. No bat is in the crop.
- `after-wait`: this branch, the same 24 frames. The ball comes down past the blue and the green bumper, lands on the left bat, the bat is seen up under it at 19.27 to 19.28 s, and the ball goes back up between the bumpers. No tow.
- `after-stroke`: this branch, page 37.41 to 37.79 s, 24 frames in a row, the save at the ramp's deadline. Frames 1 to 3: the ball in the gate's mouth, the right bat at rest. Frame 4 (37.458 s): the right bat half way up, the ball about 15 px higher. Frames 5 and 6: the bat fully up, the ball leaving up and to the left. Frames 7 and 8: the bat falling. From frame 9 the bat at rest. The bat's tip is about half a ball's width from the ball on frame 3 and swings up beside it; it does not carry the ball on its face.
- `after-lob`: the same save, every 3 frames, 37.38 to 37.92 s: the ball from the mouth up and left, across the red bumper in frames 6 to 8, to the ramp's foot at the top left in frames 10 to 12.

## Open

- The gate's pull (`PULL.gate`, 40 balls/s2) still has no limit of reach, as in polish-ball.
- Past the 8 s no deadline waits. If the ball were then still in play at a device's kick the device would be missed and the scene would go on without it. In the visits measured this happened 0 times with the budget of 5 s; with a budget of 6 s it happened once (`flap` seed 2, the inbox) before the cut was made to last through a flapping bat.
- A cut shorter than one flash (0.34 s) shows one flash only.
- The second issue of the critic (the visitor's bat flaps while no ball is near) is the pack's visitor pressing by the page's hint 11 looks late, while the ball is already in the mouth. The hint is not in my files; not changed.
- The machine's bat swings beside the ball, which is in the middle of the mouth between the two tips; it does not carry the ball on its face. What the picture shows of it is said in the report.
