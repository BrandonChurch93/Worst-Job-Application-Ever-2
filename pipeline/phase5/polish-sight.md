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
- (c) The moves: 52 on the street in the 20 visits, 25 up and 26 back (one back has no up: the ball of pack seed 1 comes to the street by the outlane and the chute and the view arrives at the upper place). Easing in: the first frame at full pace is the 5th or the 6th of the move. Steps of the lift in one move up (keen seed 1, frames 1766 to 1778): 0.1, 2.3, 5.3, 8.3, 11.2, 12.0, 12.0, 12.0, 11.2, 8.4, 5.6, 2.7, 0.3 px; in the move back (frames 1789 to 1800): 1.5, 4.5, 7.5, 10.5, 12.0, 12.0, 12.0, 11.6, 9.1, 6.3, 3.4, 0.7 px. The page's scroll on the first frame of that move up steps 0.2 px the other way (the follow's last closing on the tier) and then goes up. Largest step back inside a move: 0.00 px. Moves that turned round before their end: 0. `node pipeline/phase5/polish-save2-jerks.mjs --visitor never,pack,keen,clumsy,random --seeds 1,2,3,4`: one-frame jerks 0 before and 0 after; turns of the wider net 31 before and JERKS_AFTER after.
- (d) Two places, one move between them. For each trip of the ball above the bats' line (115 trips): at most one move up and at most one back, on all 115. On the 83 frames on which the ball comes back to the bats' line the lift is 0 on all 83, and the view is at 3708.8 to 3715.2 (the 3708.8 is the follow still closing on the tier after the ball came down the chute, as before the mend). On all 4103 frames with the ball on the street's floor at 7.0 balls or lower the lift is 0, and the view's place on those frames is the same as before the mend to 0 px (largest difference 0). With the lift on, the view is never below 3715.2 and never above 3623.5 once it has come to the tier (3623.5, not 3624.0: the follow under it was 0.5 px short of 3715.2 when the move began). MEASURED, `node pipeline/phase5/polish-sight-wire.mjs --at 3715.2,3624,3623.47` (the wire as `polish-gate-measure.mjs` lays it, at rest): at 3715.2 the wire's lowest point is at y 977.9 of 1080 with 102.1 px of screen under it and the bats' lowest point at y 909.9; at 3624 the wire's lowest point is at y 1069.3 with 10.7 px of screen under it and the bats' lowest point at y 1002.6 with 77.4 px under it; at 3623.47 the wire has 10.1 px under it. So at the upper place both bats and the wire are whole on the screen, and the screen under the wire is 10.7 px, the same as the two upper tiers have at rest (`polish-gate.md` line 39: 10.7 px at rest); it is not round 24's 65 px, which `ROOM` gives on tiers 0 and 1 for a take. An earlier line of these notes gave 73.5 px: that was taken at the mouth's line and not at the wire's pin, and was wrong. On the Street a take happens with the view at 3715.2 as before: the ball is never on the wire with the lift on, since the lift is 0 from the bats' line down.
- (e) Lobby and office: no frame of a clear ball on the floor is cut before or after, so nothing is changed there.
- No flutter is not held. Of the 38 times between one move's end and the next one's start, 18 are under 0.5 s: 10 from a move up to the move back (the least 0.167 s) and 8 from a move back to the next move up (the least 0.150 s, keen seed 1, frames 1859 to 1869). All 18 are the keen hand's rally: a ball struck from the bats at 31 balls a second is at the upper wall in 18 frames and back at the bats' line in 43, and the hand strikes it again at once. With two places, and the view back at 3715.2 before the bats are needed, the view cannot rest half a second at either end of such a trip. What I would change, if the ruling on the street's own place allowed it: let the view stay up through a rally (come back only when the ball is caught or lies below the bats' line for 0.5 s). The bats and the wire are whole on the screen at the upper place too. That needs Brandon's word, since the approved framing has the view at 3715.2 while the ball is in the lower part.

## The play and the film (MEASURED)

- `node pipeline/phase5/polish-sight-play.mjs` on a worktree of cb8755c4 and on the branch: the 20 lines are equal (`diff`), so the ball's path and the machine's events are the same on every step of every visit. keen seed 1: 10644 steps, 88 events, `bd651929...8a3643`; clumsy seed 1: 9589 steps, 67 events, `f7a46a3d...3cadf0`.
- `node pipeline/phase5/polish-sight-play.mjs --film` on both: 10080 steps, 0 with the street's lift, `5c1cf655...5542bf` on both. `node pipeline/phase5/polish-save2-ways.mjs --film` (the page's whole state on every step) on both: `b1480a4f...ef0bfe` on both (run before the last change of the law, which is live only).
- The three draft stills: STILLS

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

PICTURES

## Checks

CHECKS

## Open items

- Rule 6, contested, not changed: the ball on the office's outlane with the gate shut is 77.9 px under the screen's lower edge for 28 frames (round 25, `polish-shut`, the view's goal on a shut outlane in `target()`).
- The rally: 18 of 38 times between two moves of the street's view are under 0.5 s (see After).
- The launch (A), the open gate's hole (C), the chute's top after an open outlane (8 frames, 8.7 px) and the steel balls stand as measured.
