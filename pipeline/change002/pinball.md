# Unit pinball: notes

Branch `agent/b-pinball`. Owner of this file: the pinball helper.

## For the video unit: where the live fight ends and the film joins

- Event `ball-seal`: the arrow is gone into the port and the two half shells shut. In the film it falls at 3.3 s of step 3 (3.4 s is the scene's own clock `T.seal`, minus the 0.1 s the shut takes). On the live site it falls when the visitor's arrow has lost the fight, whenever that is.
- Before it, the live fight says `vacuum-on` (the pull starts), `vacuum-slip` (each slip toward the port) and `vacuum-lose` (the arrow lets go, 0.25 s before `ball-seal`).
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

## Tests changed

(filled in as they change)
