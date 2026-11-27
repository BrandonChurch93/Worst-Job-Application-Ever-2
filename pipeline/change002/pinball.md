# Unit pinball: notes

Branch `agent/b-pinball`. Owner of this file: the pinball helper.

## For the video unit: where the live fight ends and the film joins

- Event `ball-seal`: the arrow is gone into the port and the two half shells shut. In the film it falls at 3.3 s of step 3 (3.4 s is the scene's own clock `T.seal`, minus the 0.1 s the shut takes). On the live site it falls when the visitor's arrow has lost the fight, whenever that is.
- Before it, the live fight says `vacuum-on` (the pull starts), `vacuum-slip` (each slip toward the port) and `vacuum-lose` (the arrow lets go, 0.34 s before `ball-seal`).
- After `ball-seal` nothing of the scene depends on the visitor until the result card.

## Events

Kept as they were: `ball-seal`, `tube-run`, `lights-down`, `power-on`, `plunger`, `sling`, `carpet-roll`, `spinner`, `doors-slam`, `tier-fall`, `drop-target`, `bumper`, `flasher`, `inbox-take`, `ball-drop`, `firehouse-take`, `scoop-kick`, `ramp-roll`, `spiral`, `flipper`, `flipper-save`, `drain`, `ball-open`.

New:
- `strike:<id>:<n>`: the clear ball struck the thing `<id>` of the layout (`office.bumper.3`, `office.sling.left`, `street.bank.drop.2`, `office.rail` for a dead wall in the frenzy). `<n>` is how hard: 1 soft, 2 hard, 3 in the frenzy. One for every strike, beside the old event of the same strike.
- `loot`: a strike threw coins or paper out.
- `frenzy-on`, `frenzy-off`: the frenzy starts and ends (17.5 s and 19.8 s of step 3 in the film).
- `vacuum-on`, `vacuum-slip`, `vacuum-lose`: see above.

## Sounds asked of the Builder

| name | what | seconds |
| --- | --- | --- |
| `vacuum-roar` | the port drawing: a heavy shop vacuum winding up and holding | 3.0 |
| `vacuum-slip` | a short squeal of a thing dragged over a desk | 0.35 |
| `vacuum-gulp` | the arrow goes in: a wet thump and the tone of the motor dropping | 0.5 |
| `pin-bumper` | a pop bumper: solenoid crack and bell | 0.25 |
| `pin-sling` | a slingshot: dry rubber snap | 0.2 |
| `pin-target` | a drop target going down: clack | 0.25 |
| `pin-bell` | a single score bell | 0.4 |
| `pin-coins` | a burst of coins on a hard floor (stand-in: `coins`) | 0.9 |
| `pin-frenzy` | the frenzy as one bed: bells and pops too fast to count, rising | 2.4 |
| `pin-kick` | a scoop throwing the ball out (stand-in: `scoop-kick`) | 0.3 |

## Decisions

1. D-P1. The frenzy is film only and lives on the office tier between 17.5 s and 19.8 s: every cup and slingshot throws the clear ball at 36 balls a second (the table's other throws are 12 and 18), each throw aimed at the next place of a fixed round, and a ball that comes off a dead wall slower than 0.8 of that is thrown again. Numbers in `src/pages/step3/strikes.ts` (`FRENZY`).
2. D-P2. A strike does not raise the flash of the whole tier. The tier's flash is already held shallow because it can rise five times a second (`tests/table-lights-strobe.test.ts`); the frenzy strikes 13 times a second, so its light is a small warm light at the strike, sparks, a ring on the floor and the cup's own lamp, not a flash of the picture.
3. D-P3. Coins come out of the cups, the bank's targets, the spinner and the firehouse's kick; paper comes out of the cubicles, the boardroom, the sticky notes and the inbox. In the frenzy every strike throws coins.
4. D-P4. The hold in the inbox before the reply-all is cut from 1.6 s to about 0.1 s (`T.inboxOn` 17.9 to 19.8, `T.inboxBy` 19.1 to 20.3): the time went to the frenzy.

5. D-P5. The fight with the port is one rule for the film and the live site (`src/pages/step3/vacuum.ts`, `VAC`): the arrow is held a share of the way from the hand to the port, and the share grows by parts: dragged, digs in, slips, claws back, slips again, hangs on the rim, gone. With a hand that does nothing it lasts 2.3 s. On the live site a hand that pulls away wins back up to 0.3 of the way and slows the fight's clock, so it lasts at most 2.3 / (1 - 0.55) = 5.1 s; what it won is lost at each slip. The visitor cannot win: the port always takes the arrow.
6. D-P6. The fight is acted with the body the cursor has, no arms (agreed by the Builder): the tip points away from the port, the body is stretched by the pull and squashed when it digs in, it trembles on the rim, and the cursor's own states give the rest: `nervous` (sweat) while it digs in and on the rim, `angry` (heat and steam) while it claws back, `shocked` at each slip, `scared` (pale) in the second slip. No state of the cursor has sweat and heat at once, so the clawing back shows heat and no sweat.
7. D-P7. The pull is drawn at the port by `src/table/real/frame/suction.ts` (`DRAW`): 120 dark streaks of dust that spiral into the port and three rings of air that close on it, and the port's own light rises with the pull. They are dark because the page is light and a glow does not show on it. The page's heading, subline and intro slide up to 64 px toward the port and tip (`LEAN`).
8. D-P8. In the film the camera pushes in on the port for the fight (`PUSH`, from 0.7 s over 1.5 s) so that the arrow is large enough to be read; the old view was the whole page with the arrow about 40 px high.
9. D-P9. The seal moved from 2.3 s to 3.3 s inside the beat `pinball.seal` (0 to 4 s) to give the fight 2.3 s. The tube run after it is 0.55 s shorter: `T.tube` 3.3 to 3.95, `T.lightsDown` 4.1 to 4.35, `T.wake` 5.6 to 5.7, `T.powerOn` 7.2 to 7.3. No beat of `config/showcase.json` moved; every beat event is inside its beat.
10. D-P10. Fewer holds. The inbox hold: D-P4. The firehouse hold was 1.7 s to 3.4 s (the ball could be taken from 25.98 s and was kicked at 29.35 s); now the firehouse opens at 27.0 s, the ball is taken at 27.62 s and kicked at 28.61 s, a hold of 1.0 s, and until 27.0 s the ball is shot at the bank's targets. The cut to the close view `near-nest` at 18.95 s is gone: the frenzy is one run in one camera.
11. D-P11. Signs: every building's name plate is larger (`SIGN.px` 22 to 32; bank 16 to 20; police 27 on a wider plate; the house in the outlane 16 to 18; the drain's label 18 to 22, the widest that fits between the two slabs of the apron). The words are the locked copy `step3.table.buildings.*`.
12. D-P12. The kept take `cut/TABLE-TAKE.json` is not searched again in the first pass: replayed with the new scene (`npm run take -- --check`) every one of the 10 beat events falls inside its beat and no hit is within 0.15 s of a cut.

## Tests changed

- `tests/polish-port.test.ts`, by D-P9 and D-P5: `WAS` (the list of the take's events) is written again with the new events and times; the pull, the sink and the shutting of the halves are read 1.0 s later (2.0 to 3.02, 2.2 to 3.2, 2.3 to 3.3); the run down the screen is read from the new release (3.3 to 3.95, 3.7 to 4.35, and its low point at 4.85 in place of 4.0, its rise by 5.3 in place of 4.3); the view's step a frame is under 30 px in place of 26 (the tube is run 0.55 s faster; from 4.8 s the film is in the camera `tube`, which does not use the page's scroll); `WAS_SCROLL` is the scroll at 6 s of the new run, 1692.0208 in place of 2011.0711; the roll in the feed tube is read from 4.1 to 4.85 in place of 3.35 to 4.2.
