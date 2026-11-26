# Pinball stage: cameras, page screens, film cuts, sheets

Agent `pinball_stager`, branch `agent/pinball-stage`. Times UTC.

## What a quick look at the approved images misses

1. Highlight: on the clear ball it is one small soft window high on the left and a thin bright rim low on the right, never a white disc; on the aluminium frame it is a long streak along the inner edge only, the top face stays mid grey.
2. Bevel: the frame's inner edge and the apron slabs carry a rounded bevel about a tenth of a ball wide; it is what catches the light in `table-wide` and `last-save`, the faces do not.
3. Gap: the well between the frame and a playfield, the drain mouth and the garage mouth are near black but never flat: a faint cool bounce stays in them, and the red beacon fills the firehouse mouth in `youre-fired`.
4. Edge: every close image has a shallow focus plane on the ball. Near things (revolving door, apron slabs, the near rail) and far things (the tower, the far buildings) go soft, and far lamps turn into round discs.
5. Lens: the close images are low and near, not high and far. `lobby-doors` sits less than a ball above the carpet with a wide lens, `rail-cam` looks along the wire from just above and behind the ball, `last-save` looks over the apron with the plate at the bottom centre, `table-wide` has the near frame corners in the bottom corners of the picture and darkness beyond the far end.

## Decisions

- 00:40 `table-wide`: solved from the approved image, not fitted by eye. Near frame corners at the bottom corners, far frame end 23% from the top, pitch 25.6 degrees down, lens 43 degrees (at least 39 is needed for the approved near to far ratio of 3.3). Eye `[MID, APRON_Y + 12.4, 11.22]`, target `[MID, APRON_Y - 9.24, 0.85]`.
- 00:50 `table-lobby`: eye 0.65 ball above the floor, 62 degrees off the carpet axis on the right, lens 56. Why off axis: the revolving door (centre v 6.0, radius 0.75) stands on the carpet axis in front of the doors hold (v 5.02), so from the front it covers the ball. From the right the door is the large left foreground and the ball is clear in front of the doors, as approved.
- 00:50 `table-replyall`: centred, 30 degrees from vertical, 20 balls away, lens 30: the whole office tier from the player's end with the flippers at the foot.
- 00:50 `table-fired`: front right of the firehouse, 28 degrees up, 6.2 balls away, lens 35.
- 00:50 `table-save`: 60 degrees down over the apron, lens 40 (was 62). It cannot go lower: the street floor is 3 balls under the apron edge, so a flatter camera loses the flipper tips behind that edge.
- 00:55 `rail`: 3.4 back, 2.85 up, looking 0.85 ahead at ball height, lens 40: the ball at the centre low, the wire running up the middle.
- 00:55 Insert labels dropped. Kit `02-SUBJECT.md`: an insert carries a picture and no words, and the displays show that mode's `insert` and then its `display` line. So `insert-label.<id>` and `insert-plate.<id>` are gone from the page (the owner of the lights asked for the same), and each tier display shows the mode's `insert` name for 0.6 s (`NAME`), then its `display` line. Text `display.<tier>.<mode>.insert`, state `name<mode>`, switched in `draw`.
- The three tier cameras stay the `home` camera moved down the page. Not fitted.

- 01:10 The displays' own part already holds the insert's name and then runs the line, read from the `display.<tier>.<mode>` text alone. So that text stays on for the whole mode and now carries `v[0]`, the seconds since the mode was lit, which that part reads as its clock. `NAME` is 1.5 s, the displays' hold.
- 01:05 Film: a close view is entered by a cut. With the 0.6 s blend the camera was half way into `table-lobby` at `doors-slam`. Reply-all's close view moved from 20.6 to 19.5 s: it sat 0.1 s before the third `ball-drop`.
- 01:05 Shake reads `machine().last` and `steps`: no clock, no random, the same on every run. None in live mode.
- 01:20 `clear-ball`: one low view (home's 20 degree lens from 7.9 balls, to keep the three balls one size), flipper in front of the first ball, the lowest office bumper behind the third. Places computed from the layout.
- 01:20 `table-map`: the page's width fills the frame, tiers and apron, no marquee, displays on the score. The approved map is the three tier images joined inside a frame.
- 01:35 With the engine's lens on: `table-save` 20 to 9, `rail` 16 to 7, `ride` 10 to 7 (the Builder's look at the first stills). `rail` is now steep (59 degrees down) so no wall crosses the top of the frame. `table-fired` moved in to 5.2 balls.

- 01:55 The Builder's two issues. `table-wide` solved again from three marks of the approved image, with the lens angle back at 35 degrees (the far end of the frame is 32% of the width as approved; at 43 it was 28%). `table-lobby` moved from 62 degrees off the carpet's axis to 31, turned 21: head on is not to be had from a low eye, because the revolving door stands on the carpet in front of the ball (the kit puts it there). One glass edge of a wing crosses the ball.
- 01:45 Film on the director's new take: the `rail` cut waits for `ramp-roll` (31.05) at 31.15; the move from `ride` to `tier-3` starts at 10.6 and is over before the first `sling` (11.25).
- 01:58 Apron: the slabs, the card, its words and the drain label stand on the floor of the zone `apron` of `ZONES` (`stood`), so they follow the Builder's ruling that the apron lies at the street floor's height. Done with `stood` and not with a negative top in the node, because the shell's layout reads a negative top as a pit.
- 02:00 Film: the move from `ride` to `tier-3` starts at 10.25 (was 10.6). On the director's take the ball leaves the launch wire at 10.87, in the middle of the move, and the ride camera's heading changed with it: a 0.4 ball jump in one frame.
- 02:05 `rail` (the Builder: look along the wire, low): 2.8 behind and 2.5 above the ball, 36 degrees down, aperture 6. The highway runs east from x 6.9 and the firehouse and the bank stand west of its start, so they are behind the camera on every frame of the ride; ahead are the police station (behind the wire) and the garage (right). No rail of the layout has the firehouse or the bank ahead. A camera ahead of the ball looking back at them was weighed and dropped: the wire climbs 37 degrees, the camera must clear it, and from there the ball covers the wire behind it.
- 02:05 `table-fired` (the Builder: two thirds of the width): 4.8 balls away, 25 degrees down; the firehouse takes 49% (was 45%). A scan of 14000 eyes says 51% to 55% is the most with the ball whole and the beacon in the picture, because the scoop holds the ball 0.55 balls in front of the door. Two thirds needs the ball in the doorway (the director's hold) or a cropped ball.
- 02:30 On merge 14 and the director's 3edf15f (door post at the carpet's left border, a well over the apron). `table-lobby` is head on: on the carpet's line 3.4 balls from the ball, 16 degrees off the building's face, fitted by projection to the approved post, ball, globes and name band. `table-save` is 72 degrees down: the Street tier's near rail stands 3 balls tall between the flippers and the apron, and any flatter view hides the flipper tips behind it (first try at 58 degrees: the rail took a fifth of the picture). `table-wide` needs no change: its marks are on the frame, which did not move; the apron and the Street's flippers are below its line of sight (the well is 3 balls deep, the view 24 degrees down, so the near rail hides 6.7 balls of floor).
- 02:35 `rail` looks back (the Builder's ruling at 02:15: the approved image beats the kit's "a little ahead" here). On the highway the eye rides the wire 3.2 balls ahead of the ball and 1.7 above it and looks back west: bank left, firehouse right behind the ball. Two looks, at the key (31.75 s) and early in the ride (31.3 s): the track in the foreground and the ball's outline do not spoil it, so it is kept. My note of 02:05 that the ball would cover the wire was wrong in its weight: the wire shows through the glass and the foreground track reads as the track. The key would be a better picture earlier in the ride (`at` 0.4 of the beat, 31.3 s): the buildings are nearer; that number is the Builder's.

## Needs sent

- `pipeline/phase4/pinball-stage-NEEDS.patch`: `cameras.table-wide.fovDeg` 35 to 43, `cameras.table-lobby.fovDeg` 35 to 56, `cameras.table-save.fovDeg` 62 to 40. Sent 00:55.
- `src/stage/CONTRACT.md` line 123 still names `insert-label.<insert id>`: the page no longer makes it.
- 01:52 `cameras.table-wide.fovDeg` 43 back to 35 (`pinball-stage-NEEDS.patch`). The Builder takes it into the config with merge 14.

## Told to other owners

- The ball at the doors hold (MID, v 5.02) stands inside the sweep of the revolving door (MID, v 6.0, r 0.75): from the front the door wing crosses the ball.
