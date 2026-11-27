# polish-sight: the ball in play whole on the visitor's screen at the pinball machine

Branch `agent/polish-sight` from `cb8755c4` (merge 54). Times are UTC, 2026-11-27 (the machine's `date -u`). MEASURED means I ran the command given; STATED means I read it; UNKNOWN is said as such. Live play only: in film mode nothing here is reached. The brief named the piece `polish-view`; that name was taken on origin, so everything of this piece is named `polish-sight`.

## The measure

- `node pipeline/phase5/polish-sight-measure.mjs [--visitor never,pack,keen,clumsy,random] [--seeds 1,2,3,4] [--margin 8] [--json dir]`: 20 live visits stepped without a browser, every frame of 60 (53757 frames, 31489 of them from the launch to the drain). The ball's shell on the screen is the sphere's two tangent lines from the view's eye. It prints every stretch of frames on which a ball's shell is not whole inside the screen less `--margin` px, and with `--json` it writes one row a frame (the view's place, the ball's place, speed and box).
- The measure against the browser, MEASURED on four pictures of the starting commit at `high` (keen seed 1, page 29.650, 29.667, 29.767, 29.783 s): the shell's upper edge as computed (14.8, -22.3, -9.0, 9.0 px) lies on the shell's edge in the picture to about 1 px.
- `node pipeline/phase5/polish-sight-moves.mjs <dir of rows>`: the view's moves on the street counted from those rows.
- `node pipeline/phase5/polish-sight-play.mjs [--film]`: the play of each visit as one hash (every ball's mode, rail, hold, place and speed and every event on every step of the machine), and with `--film` the film's pinball take (the view's place, its floor and the page's scroll on every step).
- `node pipeline/phase5/polish-sight-sheet.mjs`, `polish-sight-hand-shots.mjs`: the sheets and the pictures of the hand's visit (see Pictures).

## Before, on cb8755c4 (MEASURED, margin 0)

The clear ball is not whole on 734 frames in 72 stretches:

- A, the launch: 20 stretches, one in every visit, 221 frames, 11 or 12 each, upper edge, deepest 58.9 px. The ball rides the launch rail at 30 balls a second to the lobby's top and the view is still on its way there.
- B, the street's floor: 21 stretches in 13 visits, 396 frames, longest 30, upper edge, deepest 73.2 px. The view stands at 3715.2 and a ball struck up the tier is cut whenever its middle is less than 1.63 balls down the tier. This is the fault the brief is about.
- C, the hole of an open gate: 28 stretches, 59 frames, 1 to 3 each, lower edge, deepest 35.6 px.
- D, the office's left outlane: with the gate shut (pack seed 4) 28 frames, lower edge, 77.9 px; with the gate open (pack seed 1) 3 frames, lower edge, 42.6 px, and then 27 frames, upper edge, 104.1 px, on the chute's top above the street.
- On the lobby's and the office's floors: 0 frames. Least room 42.4 px (lobby) and 13.2 px (office).
- The steel balls of Reply All: 51 stretches, 1067 frames. Not this piece.

## The mend

`src/pages/step3/index.ts`: `SIGHT`, one more field in what `target()` gives back (`street`, the ball's height down the street when the goal is the street's, live play only), and one block in the lines that carry `s.scroll` toward the goal, with its state `s.sight` (the lift in px, its speed, and whether it is on its way up or up).

The live view of the street has two places: its own, 3715.2, and the tier's upper edge, 91.2 px higher (3624). The 91.2 px are `STREET` (0.95 balls), which is not changed. One eased move goes from one to the other, by the travel the room under a gate has: speed gained by `gain` 10800 px/s a second up to `pace` 720 px/s (12 px a frame), slowed the same way, no step back, no tail.

It is a lead, not a smoothed copy of the ball. A copy that is smoothed lags: a ball struck at 31 balls a second is at the tier's upper wall 18 frames after the stroke, and a view that has to be eased cannot be there in time if it starts from where the ball is now. So the view reads where the ball will be:

- Up: when the ball is above the bats' line (`bats` 7.0 balls down the tier) and will rise above `up` 2.6 balls. A rising ball is read at the top of its flight under the floor's own slope (its height less speed squared over twice `GRAVITY`), so a weak stroke that turns round at 3.5 balls moves nothing. A falling ball is read `lead` 0.2 s ahead at its own speed.
- Back: when the ball, read 0.2 s ahead, is below `down` 4.5 balls, or when it is at the bats' line.
- Between 2.6 and 4.5 the view stays where it is. That band is what keeps it from hunting.
- A falling ball's height is counted from where the view stands on its way to the tier. A ball that comes down the office's chute is followed down by the view, so the view goes to 3715.2 in the one move it was making, with no stop at 3624 on the way.

The view feeds no physics; the mend reads the ball and writes only the view.

## After (MEASURED)

`node pipeline/phase5/polish-sight-measure.mjs --margin 8 --json /tmp/ps/after3` and `node pipeline/phase5/polish-sight-moves.mjs /tmp/ps/after3`:

- (a) The clear ball on a tier's floor, all 20 visits, with 8 px beyond its shell: street 8083 frames, 0 not whole, least room at the upper edge 19.7 px (keen seed 1, frame 2603, the ball at the wall, the view at 3624.0); office 8958 frames, 0, least 13.2 px; lobby 1241 frames, 0, least 42.4 px. Before: 396 frames cut on the street.
- (b) On a rail: see What is not mended.
- (c) The moves: 52 on the street in the 20 visits, 26 up and 26 back (25 of the moves up begin while the ball is above the bats' line on the street's floor; the 26th is pack seed 1, frames 1471 to 1483, where the ball comes to the street by the open outlane and the chute and the lift grows inside the view's rush from the office to the street, so the view arrives at the upper place). While the room under a gate is not 0 (70 frames with the street's state alive, all 20 visits) the lift and its speed are 0 on all 70: no move of mine starts, stops or turns inside a way down or a way back at a gate. Easing in: the first frame at full pace is the 5th or the 6th of the move. Steps of the lift in one move up (keen seed 1, frames 1766 to 1778): 0.1, 2.3, 5.3, 8.3, 11.2, 12.0, 12.0, 12.0, 11.2, 8.4, 5.6, 2.7, 0.3 px; in the move back (frames 1789 to 1800): 1.5, 4.5, 7.5, 10.5, 12.0, 12.0, 12.0, 11.6, 9.1, 6.3, 3.4, 0.7 px. The page's scroll on the first frame of that move up steps 0.2 px the other way (the follow's last closing on the tier) and then goes up. Largest step back inside a move: 0.00 px. Moves that turned round before their end: 0. `node pipeline/phase5/polish-save2-jerks.mjs --visitor never,pack,keen,clumsy,random --seeds 1,2,3,4`: one-frame jerks 0 and turns of the wider net 31 before; after, 0 and 31 on the first law of this branch (commit 25cf7918). NOT RUN on the last law (commit 6de3edbc and later): the work was stopped first.
- (d) Two places, one move between them. For each trip of the ball above the bats' line (115 trips): at most one move up and at most one back, on all 115. On the 83 frames on which the ball comes back to the bats' line the lift is 0 on all 83, and the view is at 3708.8 to 3715.2 (the 3708.8 is the follow still closing on the tier after the ball came down the chute, as before the mend). On all 4103 frames with the ball on the street's floor at 7.0 balls or lower the lift is 0, and the view's place on those frames is the same as before the mend to 0 px (largest difference 0). With the lift on, the view is never below 3715.2 and never above 3623.5 once it has come to the tier (3623.5, not 3624.0: the follow under it was 0.5 px short of 3715.2 when the move began). MEASURED, `node pipeline/phase5/polish-sight-wire.mjs --at 3715.2,3624,3623.47` (the wire as `polish-gate-measure.mjs` lays it, at rest): at 3715.2 the wire's lowest point is at y 977.9 of 1080 with 102.1 px of screen under it and the bats' lowest point at y 909.9; at 3624 the wire's lowest point is at y 1069.3 with 10.7 px of screen under it and the bats' lowest point at y 1002.6 with 77.4 px under it; at 3623.47 the wire has 10.1 px under it. So at the upper place both bats and the wire are whole on the screen, and the screen under the wire is 10.7 px, the same as the two upper tiers have at rest (`polish-gate.md` line 39: 10.7 px at rest); it is not round 24's 65 px, which `ROOM` gives on tiers 0 and 1 for a take. An earlier line of these notes gave 73.5 px: that was taken at the mouth's line and not at the wire's pin, and was wrong. One arrival puts the view above its upper place with the lift on: pack seed 1, the ball down the open outlane and the chute; the view comes down from the office and passes 3611.1 on frame 1512 and 3612.5 on frame 1513 with the ball on the street's floor at 0.92 and 0.99 balls down, and on those 2 frames the wire's lowest point is 2.3 and 0.9 px under the screen's edge (`polish-sight-wire.mjs --at 3611.1`); the wire is whole on the screen from frame 1514, where before the mend it was whole from frame 1494 (view 3617.3). On the Street a take happens with the view at 3715.2 as before: the ball is never on the wire with the lift on, since the lift is 0 from the bats' line down.
- (e) Lobby and office: no frame of a clear ball on the floor is cut before or after, so nothing is changed there.
- No flutter is not held. Of the 38 times between one move's end and the next one's start, 18 are under 0.5 s: 10 from a move up to the move back (the least 0.167 s) and 8 from a move back to the next move up (the least 0.150 s, keen seed 1, frames 1859 to 1869). All 18 are the keen hand's rally: a ball struck from the bats at 31 balls a second is at the upper wall in 18 frames and back at the bats' line in 43, and the hand strikes it again at once. With two places, and the view back at 3715.2 before the bats are needed, the view cannot rest half a second at either end of such a trip. What I would change, if the ruling on the street's own place allowed it: let the view stay up through a rally (come back only when the ball is caught or lies below the bats' line for 0.5 s). The bats and the wire are whole on the screen at the upper place too. That needs Brandon's word, since the approved framing has the view at 3715.2 while the ball is in the lower part.

## The play and the film (MEASURED)

- `node pipeline/phase5/polish-sight-play.mjs` on a worktree of cb8755c4 and on the branch: the 20 lines are equal (`diff`), so the ball's path and the machine's events are the same on every step of every visit. keen seed 1: 10644 steps, 88 events, `bd651929...8a3643`; clumsy seed 1: 9589 steps, 67 events, `f7a46a3d...3cadf0`.
- `node pipeline/phase5/polish-sight-play.mjs --film` on both: 10080 steps, 0 with the street's lift, `5c1cf655...5542bf` on both. `node pipeline/phase5/polish-save2-ways.mjs --film` (the page's whole state on every step) on both: `b1480a4f...ef0bfe` on both (run before the last change of the law, which is live only).
- The three draft stills: NOT RUN on this branch (the run was in the queue when the work was stopped); UNKNOWN whether they are byte equal.

## What is not mended, and why

- A, the launch: ruled at 17:08 to go before round 26's critics as it is; not touched. After: the same 20 stretches (261 frames at margin 8, longest 14, deepest 66.9 px; 221 frames and 58.9 px at margin 0).
- C, the hole of an open gate: not in this pass by the Builder's ruling of 19:24. On those 60 frames (margin 8) the ball's middle is not under the floor's level: its lowest point is 0.0 to 1.3 px under the floor and its middle 46.7 to 48.0 px above it. The ball lies on the hole on the tier's floor at the screen's lower edge and has only begun to sink.
- D with the gate shut (pack seed 4, frames 1358 to 1385, 28 frames, 77.9 px under the lower edge): contested by rule 6. Round 25, `polish-shut` (merge 54), made the view stand still while a ball rides a shut outlane; keeping the ball whole there would move the view in that ride. Not changed. Open item for Brandon.
- D with the gate open (pack seed 1): 3 frames at the lower edge, 42.6 px, as before (the first frames of the ride, before the goal goes down). On the chute's top the ball was cut for 27 frames by up to 104.1 px; after the mend for 8 frames by up to 8.7 px at the upper edge (10 frames, 16.7 px at margin 8). The lead cannot take this to 0: on those frames the ball is on the outlane's end and the chute's top, 0.2 balls above the street's upper edge and above its floor's level, and with the view at its upper place the ball there is still cut. A third, higher place would be needed, or a later goal on the ride, and that goal is the line of round 25. Left.
- The steel balls of Reply All: outside this piece; 49 stretches, 1076 frames at margin 8 after (51 and 1067 at margin 0 before; the same balls, the other margin).

## Decisions

1. A lead, not a smoothed copy (above).
2. `STREET` (blockout round 2, 196233d6) is not changed; the upper place is the tier's upper edge, which is `STREET` higher.
3. The band: up at 2.6, back at 4.5. A lead of 0.25 s gave one trip with two moves up in the offline trial and 0.3 s gave five; 0.2 s gives none in the 20 visits.
4. `gain` 10800, not the room's 9000: with 9000 the first frame at full pace was the 6th or 7th, outside the 4 to 6 the brief sets.
5. A rising ball is read at the top of its flight, not 0.2 s ahead: 0.2 s ahead sent the view up for strokes that turned round at 3.5 balls (80 moves in the 20 visits, the least time between two 0.033 s); the flight's top gives 52 moves.
6. A falling ball is counted from where the view stands: without it the view stopped at 3624 on its way down with the ball from the office and then went on to 3715.2, two moves for one.
7. The tests allow the follow under the lift 2 px short of its place (`SETTLE`): the follow closes on the tier by a share a step and is 1.7 px short at most 60 frames after the ball came to the tier.

## Tests

`tests/polish-sight.test.ts`, stepped, no browser, the keen and the clumsy hand, seed 1: the clear ball on a tier's floor whole with 8 px beyond its shell on every frame; on the street the lift between 0 and 91.2 and the view between its two places, the lift 0 whenever the ball is at 7.0 balls or lower; every move eased in over 4 to 6 frames with no step back; the play's hash of both visits equal to cb8755c4's; the film's view on every step of the machine's take equal to cb8755c4's.

## Pictures

Stopped by the Builder at 20:01 UTC (Brandon's change of plan: the playable view is replaced by a film). The pictures below existed then; they are outside the repo, sent with the last report. The launch's second sheet and the launch's sheets as a whole were not made (14 pictures of frames 623 to 636 were taken, not laid out, not looked at).

- `stroke-all.png` (keen seed 1, frames 1759 to 1803, the whole screen small and the ball's own crop at real size under each, before above and after below), looked at in five parts at real size. Before: the ball is whole to frame 1778, cut by the screen's upper edge on frames 1779 to 1785 (most at 1781, where dark red, the ground beyond the screen, takes about the upper 73 px of the crop) and whole again from 1786; the view stands at 3710.7 to 3715.2. After: the ball is whole in all 45 cells; the small screens show the table go down from 1767 to 1778 and come back from 1789 to 1800; on 1780 to 1782 a pale band, the tier's upper wall, lies over the ball at the crop's top.
- `strip-up.png` (after, frames 1767 to 1778, real size, the whole screen high, 100 px wide round the ball): the ball climbs from the screen's lower third to about 110 px under its upper edge and is whole in every cell; the ramp's rails pass over it on 1770 to 1773; under it the bats come whole into the lower part of the cells from 1774 and stand 77 px over the lower edge at the end.
- `strip-back.png` (after, frames 1789 to 1800): the ball comes down under the ramp's rails, whole in every cell, while the screen goes back down the table.
- `shut-low.png` (pack seed 4, frames 1358 to 1384, every second frame, the screen's lower 400 px at real size, the lower edge yellow, the shell as measured a white outline; the hand's pointer played into the browser, the page's scroll equal to the stepped visit to 0.0000 px): on 1358 the ball is 20.8 px under the edge with its arrow in sight; from 1360 to 1382 only the upper 20 to 30 px of the shell are in sight as it rides the shut outlane along the lower edge (77.9 px under at 1372); on 1384 it comes up again (48.5 px under). The view stands at 2544.0 on all 14. Not changed, rule 6.

The view's place per frame on the stroke (keen seed 1, before and after):

| frame | page s | ball, balls down the street | view before | view after | step after | shell's upper edge before, px | after, px |
|---|---|---|---|---|---|---|---|
| 1759 | 29.333 | 8.07 | 3710.7 | 3710.7 | 0.5 | 641.5 | 641.5 |
| 1760 | 29.350 | 8.42 | 3711.1 | 3711.1 | 0.5 | 675.4 | 675.4 |
| 1761 | 29.367 | 8.78 | 3711.6 | 3711.6 | 0.4 | 710.1 | 710.1 |
| 1762 | 29.383 | 9.15 | 3712.0 | 3712.0 | 0.4 | 745.7 | 745.7 |
| 1763 | 29.400 | 8.52 | 3712.3 | 3712.3 | 0.3 | 683.7 | 683.7 |
| 1764 | 29.417 | 8.00 | 3712.6 | 3712.6 | 0.3 | 633.2 | 633.2 |
| 1765 | 29.433 | 7.50 | 3712.9 | 3712.9 | 0.3 | 583.5 | 583.5 |
| 1766 | 29.450 | 7.00 | 3713.1 | 3713.0 | 0.2 | 534.6 | 534.7 |
| 1767 | 29.467 | 6.51 | 3713.4 | 3711.0 | -2.0 | 486.6 | 488.9 |
| 1768 | 29.483 | 6.03 | 3713.6 | 3706.0 | -5.1 | 439.3 | 447.0 |
| 1769 | 29.500 | 5.55 | 3713.7 | 3697.9 | -8.1 | 392.9 | 409.0 |
| 1770 | 29.517 | 5.09 | 3713.9 | 3686.9 | -11.0 | 347.2 | 374.7 |
| 1771 | 29.533 | 4.63 | 3714.0 | 3675.0 | -11.9 | 302.4 | 342.1 |
| 1772 | 29.550 | 4.18 | 3714.1 | 3663.1 | -11.9 | 258.4 | 310.3 |
| 1773 | 29.567 | 3.74 | 3714.3 | 3651.3 | -11.9 | 215.2 | 279.3 |
| 1774 | 29.583 | 3.30 | 3714.4 | 3640.2 | -11.1 | 172.8 | 248.3 |
| 1775 | 29.600 | 2.88 | 3714.5 | 3631.8 | -8.3 | 131.5 | 215.6 |
| 1776 | 29.617 | 2.47 | 3714.5 | 3626.3 | -5.5 | 91.4 | 181.2 |
| 1777 | 29.633 | 2.08 | 3714.6 | 3623.7 | -2.6 | 52.6 | 145.2 |
| 1778 | 29.650 | 1.69 | 3714.7 | 3623.5 | -0.2 | 14.8 | 107.6 |
| 1779 | 29.667 | 1.31 | 3714.7 | 3623.5 | 0.1 | -22.3 | 70.6 |
| 1780 | 29.683 | 0.94 | 3714.8 | 3623.6 | 0.1 | -58.6 | 34.3 |
| 1781 | 29.700 | 0.80 | 3714.8 | 3623.6 | 0.0 | -72.9 | 20.0 |
| 1782 | 29.717 | 0.95 | 3714.9 | 3623.7 | 0.0 | -58.1 | 34.8 |
| 1783 | 29.733 | 1.11 | 3714.9 | 3623.7 | 0.0 | -42.5 | 50.4 |
| 1784 | 29.750 | 1.28 | 3714.9 | 3623.7 | 0.0 | -26.2 | 66.7 |
| 1785 | 29.767 | 1.45 | 3715.0 | 3623.8 | 0.0 | -9.0 | 83.9 |
| 1786 | 29.783 | 1.64 | 3715.0 | 3623.8 | 0.0 | 9.0 | 101.9 |
| 1787 | 29.800 | 1.83 | 3715.0 | 3623.8 | 0.0 | 27.7 | 120.6 |
| 1788 | 29.817 | 2.03 | 3715.0 | 3623.8 | 0.0 | 47.3 | 140.2 |
| 1789 | 29.833 | 2.24 | 3715.0 | 3625.3 | 1.5 | 67.7 | 159.0 |
| 1790 | 29.850 | 2.45 | 3715.1 | 3629.9 | 4.5 | 88.9 | 175.6 |
| 1791 | 29.867 | 2.68 | 3715.1 | 3637.4 | 7.5 | 110.8 | 189.9 |
| 1792 | 29.883 | 2.91 | 3715.1 | 3647.9 | 10.5 | 133.6 | 202.0 |
| 1793 | 29.900 | 3.15 | 3715.1 | 3659.9 | 12.0 | 157.2 | 213.3 |
| 1794 | 29.917 | 3.40 | 3715.1 | 3671.9 | 12.0 | 181.5 | 225.5 |
| 1795 | 29.933 | 3.66 | 3715.1 | 3683.9 | 12.0 | 206.7 | 238.4 |
| 1796 | 29.950 | 3.93 | 3715.1 | 3695.6 | 11.7 | 232.6 | 252.5 |
| 1797 | 29.967 | 4.20 | 3715.1 | 3704.7 | 9.2 | 259.4 | 270.0 |
| 1798 | 29.983 | 4.48 | 3715.1 | 3711.0 | 6.3 | 286.9 | 291.1 |
| 1799 | 30.000 | 4.77 | 3715.1 | 3714.4 | 3.4 | 315.2 | 315.9 |
| 1800 | 30.017 | 5.07 | 3715.2 | 3715.2 | 0.7 | 344.4 | 344.4 |
| 1801 | 30.033 | 5.38 | 3715.2 | 3715.2 | 0.0 | 374.3 | 374.3 |
| 1802 | 30.050 | 5.69 | 3715.2 | 3715.2 | 0.0 | 405.0 | 405.0 |
| 1803 | 30.067 | 6.01 | 3715.2 | 3715.2 | 0.0 | 436.5 | 436.5 |

The view's place per frame on the launch as it is today (keen seed 1; equal before and after):

| frame | page s | ball | view | step | shell's upper edge, px | lower edge to the screen's, px |
|---|---|---|---|---|---|---|
| 623 | 10.400 | held plunger 0:33.00 | 3854.4 | 0.0 | 732.5 | 249.6 |
| 624 | 10.417 | held plunger 0:33.00 | 3854.4 | 0.0 | 732.5 | 249.6 |
| 625 | 10.433 | held plunger 0:33.00 | 3854.4 | 0.0 | 732.5 | 249.6 |
| 626 | 10.450 | held plunger 0:33.00 | 3854.4 | 0.0 | 732.5 | 249.6 |
| 627 | 10.467 | rail launch 0:32.61 | 3877.7 | 23.3 | 670.9 | 311.4 |
| 628 | 10.483 | rail launch 0:32.09 | 3893.2 | 15.5 | 604.5 | 377.9 |
| 629 | 10.500 | rail launch 0:31.57 | 3901.7 | 8.5 | 545.2 | 437.3 |
| 630 | 10.517 | rail launch 0:31.05 | 3904.0 | 2.3 | 492.2 | 490.3 |
| 631 | 10.533 | rail launch 0:30.53 | 3900.7 | -3.3 | 444.8 | 537.7 |
| 632 | 10.550 | rail launch 0:30.01 | 3892.4 | -8.2 | 402.4 | 580.0 |
| 633 | 10.567 | rail launch 0:29.49 | 3879.8 | -12.7 | 364.6 | 617.8 |
| 634 | 10.583 | rail launch 0:28.97 | 3863.1 | -16.6 | 330.8 | 651.6 |
| 635 | 10.600 | rail launch 0:28.45 | 3842.9 | -20.2 | 300.5 | 681.7 |
| 636 | 10.617 | rail launch 0:27.93 | 3819.6 | -23.4 | 273.5 | 708.7 |
| 637 | 10.633 | rail launch 0:27.41 | 3793.4 | -26.2 | 249.4 | 732.7 |
| 638 | 10.650 | rail launch 0:26.89 | 3764.7 | -28.7 | 227.9 | 754.2 |
| 639 | 10.667 | rail launch 0:26.37 | 3733.7 | -31.0 | 208.6 | 773.4 |
| 640 | 10.683 | rail launch 0:25.85 | 3700.7 | -33.0 | 191.4 | 790.6 |
| 641 | 10.700 | rail launch 0:25.33 | 3665.9 | -34.8 | 176.0 | 805.9 |
| 642 | 10.717 | rail launch 0:24.81 | 3629.5 | -36.4 | 162.3 | 819.6 |
| 643 | 10.733 | rail launch 0:24.29 | 3591.7 | -37.8 | 150.0 | 831.9 |
| 644 | 10.750 | rail launch 0:23.77 | 3552.6 | -39.1 | 137.1 | 844.3 |
| 645 | 10.767 | rail launch 0:23.25 | 3512.3 | -40.3 | 122.6 | 857.6 |
| 646 | 10.783 | rail launch 0:22.73 | 3471.0 | -41.3 | 108.9 | 870.1 |
| 647 | 10.800 | rail launch 0:22.21 | 3428.8 | -42.2 | 97.9 | 880.4 |
| 648 | 10.817 | rail launch 0:21.69 | 3385.7 | -43.0 | 90.0 | 888.1 |
| 649 | 10.833 | rail launch 0:21.17 | 3342.0 | -43.8 | 85.2 | 893.3 |
| 650 | 10.850 | rail launch 0:20.65 | 3297.6 | -44.4 | 83.3 | 896.0 |
| 651 | 10.867 | rail launch 0:20.14 | 3252.5 | -45.0 | 80.2 | 899.5 |
| 652 | 10.883 | rail launch 0:19.62 | 3207.0 | -45.5 | 76.6 | 903.3 |
| 653 | 10.900 | rail launch 0:19.10 | 3161.0 | -46.0 | 73.4 | 906.6 |
| 654 | 10.917 | rail launch 0:18.58 | 3114.6 | -46.4 | 70.6 | 909.6 |
| 655 | 10.933 | rail launch 0:18.06 | 3067.8 | -46.8 | 68.0 | 912.3 |
| 656 | 10.950 | rail launch 0:17.54 | 3020.7 | -47.1 | 65.8 | 914.7 |
| 657 | 10.967 | rail launch 0:17.02 | 2973.3 | -47.4 | 63.8 | 916.8 |
| 658 | 10.983 | rail launch 0:16.50 | 2925.6 | -47.7 | 62.0 | 918.7 |
| 659 | 11.000 | rail launch 0:15.98 | 2877.7 | -47.9 | 60.4 | 920.4 |
| 660 | 11.017 | rail launch 0:15.46 | 2829.6 | -48.1 | 58.9 | 921.9 |
| 661 | 11.033 | rail launch 0:14.94 | 2781.3 | -48.3 | 57.7 | 923.2 |
| 662 | 11.050 | rail launch 0:14.42 | 2732.8 | -48.5 | 56.5 | 924.4 |
| 663 | 11.067 | rail launch 0:13.90 | 2684.2 | -48.6 | 55.5 | 925.5 |
| 664 | 11.083 | rail launch 0:13.38 | 2635.4 | -48.8 | 54.6 | 926.5 |
| 665 | 11.100 | rail launch 0:12.86 | 2586.5 | -48.9 | 53.8 | 927.3 |
| 666 | 11.117 | rail launch 0:12.34 | 2537.5 | -49.0 | 48.7 | 931.5 |
| 667 | 11.133 | rail launch 0:11.82 | 2488.4 | -49.1 | 42.5 | 936.6 |
| 668 | 11.150 | rail launch 0:11.30 | 2439.3 | -49.2 | 36.2 | 941.7 |
| 669 | 11.167 | rail launch 0:10.78 | 2369.3 | -70.0 | 55.4 | 922.2 |
| 670 | 11.183 | rail launch 0:10.26 | 2299.3 | -70.0 | 76.9 | 900.9 |
| 671 | 11.200 | rail launch 0:9.74 | 2229.3 | -70.0 | 100.7 | 877.8 |
| 672 | 11.217 | rail launch 0:9.22 | 2159.3 | -70.0 | 125.9 | 853.6 |
| 673 | 11.233 | rail launch 0:8.70 | 2089.3 | -70.0 | 147.8 | 832.1 |
| 674 | 11.250 | rail launch 0:8.18 | 2022.6 | -66.6 | 166.0 | 814.2 |
| 675 | 11.267 | rail launch 0:7.66 | 1963.1 | -59.5 | 176.6 | 803.8 |
| 676 | 11.283 | rail launch 0:7.14 | 1909.9 | -53.2 | 180.6 | 799.9 |
| 677 | 11.300 | rail launch 0:6.62 | 1862.4 | -47.5 | 178.7 | 802.0 |
| 678 | 11.317 | rail launch 0:6.10 | 1819.9 | -42.5 | 171.6 | 809.3 |
| 679 | 11.333 | rail launch 0:5.58 | 1782.0 | -37.9 | 159.7 | 821.2 |
| 680 | 11.350 | rail launch 0:5.06 | 1748.1 | -33.9 | 143.7 | 837.3 |
| 681 | 11.367 | rail launch 0:4.54 | 1717.8 | -30.3 | 123.9 | 857.1 |
| 682 | 11.383 | rail launch 0:4.02 | 1690.8 | -27.1 | 100.8 | 880.1 |
| 683 | 11.400 | rail launch 0:3.50 | 1666.6 | -24.2 | 74.8 | 906.1 |
| 684 | 11.417 | rail launch 0:2.98 | 1645.0 | -21.6 | 46.1 | 934.8 |
| 685 | 11.433 | rail launch 0:2.46 | 1625.7 | -19.3 | 15.1 | 965.7 |
| 686 | 11.450 | rail launch 0:1.94 | 1608.5 | -17.2 | -18.1 | 998.7 |
| 687 | 11.467 | rail launch 0:1.50 | 1593.1 | -15.4 | -45.2 | 1025.8 |
| 688 | 11.483 | rail launch 0:1.23 | 1579.3 | -13.8 | -58.1 | 1038.6 |
| 689 | 11.500 | rail launch 0:1.09 | 1567.1 | -12.3 | -58.9 | 1039.5 |
| 690 | 11.517 | rail launch 0:1.05 | 1556.1 | -11.0 | -51.1 | 1031.8 |
| 691 | 11.533 | rail launch 0:1.05 | 1546.3 | -9.8 | -40.9 | 1021.6 |
| 692 | 11.550 | rail launch 0:1.05 | 1537.5 | -8.8 | -31.8 | 1012.6 |
| 693 | 11.567 | rail launch 0:1.05 | 1529.7 | -7.8 | -23.6 | 1004.5 |
| 694 | 11.583 | rail launch 0:1.05 | 1522.7 | -7.0 | -16.4 | 997.3 |
| 695 | 11.600 | rail launch 0:1.05 | 1516.4 | -6.3 | -9.9 | 990.9 |
| 696 | 11.617 | rail launch 0:1.05 | 1510.8 | -5.6 | -4.1 | 985.1 |
| 697 | 11.633 | rail launch 0:1.05 | 1505.8 | -5.0 | 1.1 | 980.0 |
| 698 | 11.650 | rail launch 0:1.05 | 1501.4 | -4.5 | 5.7 | 975.4 |
| 699 | 11.667 | rail launch 0:1.05 | 1497.4 | -4.0 | 9.8 | 971.3 |
| 700 | 11.683 | rail launch 0:1.05 | 1493.8 | -3.6 | 13.5 | 967.7 |
| 701 | 11.700 | rail launch 0:1.05 | 1490.7 | -3.2 | 16.8 | 964.4 |
| 702 | 11.717 | rail launch 0:1.05 | 1487.8 | -2.8 | 19.8 | 961.5 |
| 703 | 11.733 | rail launch 0:1.05 | 1485.3 | -2.5 | 22.4 | 958.9 |
| 704 | 11.750 | rail launch 0:1.05 | 1483.0 | -2.3 | 24.7 | 956.5 |
| 705 | 11.767 | rail launch 0:1.05 | 1481.0 | -2.0 | 26.8 | 954.5 |

## Checks

Stopped at 20:01 UTC before the checks of the last tree. MEASURED before the stop: `npx vitest run tests/polish-sight.test.ts` 5 passed (on commit 6de3edbc; the source is not changed since); the play hash and the film hash as given above. NOT RUN on this branch: `npm run determinism`, `npm run bots`, the whole `npm test`, `npx tsc --noEmit -p .`, the three draft stills, the jerks sweep on the last law, the merge of `origin/main`.

## Open items

- Rule 6, contested, not changed: the ball on the office's outlane with the gate shut is 77.9 px under the screen's lower edge for 28 frames (round 25, `polish-shut`, the view's goal on a shut outlane in `target()`).
- The rally: 18 of 38 times between two moves of the street's view are under 0.5 s (see After).
- The launch (A), the open gate's hole (C), the chute's top after an open outlane (8 frames, 8.7 px) and the steel balls stand as measured.
