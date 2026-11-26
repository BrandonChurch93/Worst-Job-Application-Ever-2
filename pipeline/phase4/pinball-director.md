# The pinball machine: layout, physics, director, take, acting in the ball

Parts `table-layout`, `table-physics`, `director`, `acting-pinball`. Branch `agent/pinball-director`.

## What I see in the approved images that a quick look misses

1. The flippers are capsules about 0.8 of a ball thick at the pivot and 0.55 at the tip, not bars. A dark rubber band runs round the whole edge and is about one eighth of the thickness wide. The highlight is one thin line along the upper long edge, never on the flat top.
2. The slingshots stand low and wide: their lower corner is less than one ball above the flipper pivot, and the three posts at the corners carry the band clear of the plate, so there is a dark gap one fifth of a ball wide between band and plate.
3. The three inserts lie in a shallow arc just above the flipper tips, the middle one lowest, each 1.25 balls across with a metal ring about one tenth of its radius wide. The light is in the lens, strongest in the middle, and the ring catches one small highlight at the upper left.
4. The gap between the flipper tips is dark to the bottom: no floor colour shows in the mouth, and the edge of the floor there is a thin gold line, not a wall.
5. The side lanes are narrow: an outlane and an inlane together take about one tenth of the playfield's width on each side, the guides are thin wires, and the lamps in the lanes sit on the floor between them, small and warm.

## Decisions

- Flippers: `FLIP` radius 0.2 to 0.4 at the pivot, new `tip` 0.26, pivot v 8.8 to 8.95 (the approved pivot sits at about 8.95). The collider is the same capsule: a ball at the pivot, a ball at the tip and the two flanks. `FLIP_REACH` 2.74 is the pivot to the tip ball's centre; `length` 3 stays the full bat.
- Slingshots 0.1 to 0.15 lower: (6.05, 5.4), (6.05, 7.0), (7.3, 7.35) to (6.05, 5.55), (6.05, 7.05), (7.35, 7.45). Lower than that the lane under them falls below the 1.25 clearance, with the thicker bat taken off.
- Inserts lower and wider apart: (8.35, 6.2), (10, 7.35), (11.65, 6.2), radius 0.55 to (8.3, 7.1), (10, 8.0), (11.7, 7.1), radius 0.62.
- Inlane floor (4.65, 8.0) to (6.5, 8.62) became (4.65, 8.05) to (6.45, 8.5); the shoulder edge starts at (6.45, 9.45), was (6.5, 9.1).
- The mouth between the flippers is sensed at v 10.35, half width 1.7 (was v 10.95, half 1.2), only for a ball moving down. From there the ball rolls to the hole at v 11.05. This ended balls wedged under a returning bat.
- The columns `COLS` are not changed. The right side cannot shrink while the feed tube (1.25) stands beside the launch lane (1.5), a one sided change breaks the symmetry about 10, and the frame makers' files and tests hold the numbers. STATED: the playfield is 3.25 to 16.75 where the approved image reads about 2.4 to 17.9.
- Launch: the ball leaves the top lane with `out` (4.55, 3) (was (0, 5)), lands on the left slingshot and is thrown to the revolving door. At the key `tier-corporate` (12.0 s) it stands on the carpet, as approved.
- Feed tube (asked by `pinball_stager`): the straight part runs to `MARQUEE_Y + 0.15`, the bend ends at `MARQUEE_Y + 2.15` (were -0.6 and +1.4), so no bend shows on the first screen.
- Physics, kicks: a bumper throws at 18 balls a second or nine tenths of the ball's speed, the greater; a slingshot adds 12. Bat: bounce 0.3, grip 0.4.
- Physics, aim: the director names a place (`aim`) and a bumper or a slingshot throws the clear ball in the arc that lands there, when that arc leaves the face inside its cone. Otherwise the face throws straight. The director names a place for flips too (`shot`): a bat that began its stroke under the ball ends it by sending the ball there. No trigonometry: the arc is solved with square roots.
- A target on the bat's own side is behind its slingshot, so the shot is a lob (9 balls a second on average) that clears it.
- Holds: a ball that enters a scoop or a kicker settles in 0.28 s with one small hop. No sink: the models have no hole.
- The lifts are shut while the director runs (`on.lifts` false): a ball at a lift door is turned back. A lift ride in the last beats cost two tows.
- The firehouse kicks the ball out to the right and up (8.5, -2.5), over the slingshot. The old kick (5, 6) ran it into the slingshot's back and down the outlane. The doors drop the ball straight (0.3, 6).
- Director: pulls are weak now (door 12, scoops 30, only within 2.2 balls); the ball gets to its places by thrown arcs. Tows are the last moment only.
- Director times moved: `inboxOn` 18.3 to 17.9, `streetOpen` 37.3 to 36.9, the door tow from 0.6 s to 0.3 s before the kick; new `save` 35.6 (the hint asks for no flip before it in the Save beat, so the key `last-save` at 35.59 s shows the ball on the bat).
- Events: `carpet-roll` once when the ball first rolls on the carpet, `inbox-take` and `firehouse-take` when the ball enters each scoop.
- Acting: one state per situation, set once a step (`mood`), so no state fights another. Hits press the cursor flat for 0.5 s (bumper), 0.7 s (kick, save) or 1.6 s (the doors: pressed until they open, then it peels). The cursor leans where the ball goes (`knock` by 0.3 of the ball's speed).
- `tools/take.mjs`: the replay now stops on the exact step of the key `last-save`; before, it looked only every quarter second and never saw 35.59 s.

## Take searches

Kept take before: 4 of 4. Bought since, three for each change:
- layout (flippers, slingshots, lanes, mouth): searches 5, 6, 7.
- physics (bat shape, kicks, shots): searches 8, 9, 10.
- physics and layout (thrown arcs, launch exit): searches 11, 12. One left (13).

MEASURED, `npm run take -- --check` after search 12: 10 of 10 events inside their beats, 1 tow (was 3), 8 bumper hits in Coffee, the save a flip, the ball on a flipper at `last-save`.

## Old and new numbers for things a model stands on

| thing | old | new |
|---|---|---|
| flipper pivot v | 8.8 | 8.95 |
| flipper radius, tip | 0.2, 0.2 | 0.4, 0.26 |
| slingshot left | (6.05, 5.4) (6.05, 7.0) (7.3, 7.35) | (6.05, 5.55) (6.05, 7.05) (7.35, 7.45) |
| inserts | (8.35, 6.2) (10, 7.35) (11.65, 6.2) r 0.55 | (8.3, 7.1) (10, 8.0) (11.7, 7.1) r 0.62 |
| inlane floor | (4.65, 8.0) to (6.5, 8.62) | (4.65, 8.05) to (6.45, 8.5) |
| shoulder edge start | (6.5, 9.1) | (6.45, 9.45) |
| feed tube bend | MARQUEE_Y - 0.6 to + 1.4 | MARQUEE_Y + 0.15 to + 2.15 |
