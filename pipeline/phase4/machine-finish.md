# Machine finish (round 12 to 13)

Owner of this note: build agent `machine_finisher`. Branch `agent/machine-finish`. Started 10:02 UTC, limit 13:02 UTC.

## What the approved pictures hold (looked at before any change)

1. Highlight: in `tier-office` and `reply-all` every orange bat carries one long soft strip of light along its upper edge, and the steel balls each carry one small hot window, so the eye finds the bats and the balls first.
2. Bevel: the rails, the lane guides and the inserts all end in a narrow bright lip over a dark gap, so no metal face meets the carpet as a flat edge.
3. Gap: both bats rest in a shallow mirrored V with a clear gap between the tips, and the ball sits just under the lowest cup; the row of steel balls runs from the ball to the inbox with gaps of about half a ball.
4. Edge: in `reply-all` the whole perimeter of the tier is in frame: the left lift tube with its orange elbow, the far rail with its lamps, the right lane, and the shoulders under the bats.
5. `lobby-doors` is a low near portrait: the ball on the red carpet in front of the gold doors, the brass post of the revolving door left of it and standing on the carpet edge, a globe each side, the tower leaving the top of the frame.

## Baseline on `origin/main` cfd83123 (MEASURED)

| Check | Command | Result |
|---|---|---|
| Tests | `npm test` | 115 files, 1461 passed, exit 0 |
| Build | `npm run build` | exit 0 |
| Bots | `npm run bots` | `bots: all clear`, exit 0 |
| Take | `npm run take -- --check` | 10 of 10 beat events inside, 0 tows, 0 hits within 0.15 s of a cut |

## Point 1: what is mine and still true on main (looked at 10:06 to 10:12 UTC, draft)

Severe first, in the critic's words.

1. R1-3 issue 6, severe, `tier-office`: "The flippers point in almost the same direction, breaking the shallow mirrored V". MEASURED on main: flip state at 17.4 s is `[0, 1]`, the right bat is up (take flip `R 17.1896 to 17.5146`).
2. R1-3 issue 2, severe, `reply-all`: "framed closer and higher over the active field: the left elbow and outer rails are cut away and the foreground shoulder construction falls out of frame".
3. R9-1 issue 7 of round 11, major, beat `pinball.reveal`: "the arrow is not on screen for the whole beat". Frames 4324 to 4498 were one held wide view with the ball a speck in the feed tube.
4. R8-1 issue 3, major, `step3-result`: "the copy fills only the left half of a full-width panel, so the right half is a dead grey slab".
5. R3-2 issue 2, major, `step3-result`: "the glass is a flat opaque grey panel. None of the paper texture shows through it". The slab is the shell's `glassCard` (`src/shell/real/controls.ts`, the Builder's); this page only places it.
6. R3-2 issue 3 and R8-1 issue 2, major, `step3-result`: "a flat white rectangle with no thickness, and the dark capsule on it looks pasted on". Drawn by `drain(z)` in `src/table/real/hardware/index.ts` (`z.id === 'last'`), the frame finisher's. Found with `--diag ids`. Sent to `/root/frame_finisher` at 10:17 UTC.
7. R1-2 issue 10, major, `lobby-doors`: "the door's post stands at the left edge of the carpet with its blades sweeping off onto the bare floor".
8. R4-4 issues 1 and 3 of round 11, steel balls after the blast.
9. R8-1 issue 6, minor: "the spiral ramp cuts across the sign, and its first letters crowd the building edge".
10. R4-2 issue 8 of round 11, the way out: "the page comes in grey and brightens to cream". On main the last screen arrived at dusk and was lit 0.67 s after the ball entered the drain. It is the page's ceramic ground under the website's light, and the level of that light is `website()` in `src/pages/step3/index.ts`.

Not mine: R8-1 issue 7 and R8-2 issue 2 (the words on the display: `displays/`), R3-1 issue 1 (the look of the steel balls: `hardware/`), R1-1 issue 15 and R1-3 issues 19 and 20 (the look of the arrow in the ball: the shared cursor body), R3-2 issue 8 (the socket of the Continue button: the shell).

## Decisions

1. Flippers at `tier-office` (R1-3 issue 6). The first right flip of the take ended at 17.5146 s, so the right bat was up at the key (17.4 s). It now ends at 17.3146 s: `["R",17.1896,17.3146]` in `cut/TABLE-TAKE.json`, edited by hand. The ball is in the bumper nest then and that bat touches nothing. MEASURED with a dump of every event and every sixth step of the run (`out/work/mf/ev.mjs`): all 67 events at the same times, the track identical; flip state at 17.4 s `[0, 0]`. `npm run take -- --check`: 10 of 10 inside, 0 tows, 0 hits beside a cut. No search spent. The key's `at` does not move.
2. `reply-all` (R1-3 issue 2). `table-replyall` was eye `[MID, Y1 + 15.34, 12]`, target `[MID, Y1 + 6.6, -2]`; it is eye `[MID, Y1 + 18.3, 13.6]`, target `[MID, Y1 + 5.9, -2]`: further back and lower, pitch 51 degrees where it was 58. The lift tube and its orange elbow, the far rail with its lamps, the right lane and the shoulders with the display are in frame. `fovDeg` stays 30, so no NEEDS patch.
3. Result card (R8-1 issue 3). The card was `RIGHT - 560` = 1232 px wide round a 720 px column of copy. It is 816 px wide (48 + 720 + 48), so the copy fills it. Its left edge stays at 560 px: the outlet port (330 px ring at x 293) stands in the content column on this screen, as the loader port stands right of it on the first. The slab's material is the shell's and the plaque is the frame finisher's (see point 1, items 5 and 6).
4. The way out (R4-2 issue 8 of round 11, film frames 6300 to 6539). The website's light now comes up in `LEAVE.up` (0.3 s) from the moment the ball enters the drain, and the move to the last screen starts when it is up, so the page arrives at one tone. Kit: "The machine dims. The website's light comes up. The ball rolls out of the outlet port".
5. Reveal (R9-1 issue 7 of round 11). New camera `tube`: it rides the feed tube half a ball outside the ball and 2.7 balls ahead of it, looking back up the page and across the machine, so the arrow is large in the ball while the marquee and the tiers light behind it. Film: `follow` to 4.1 s, eased into `tube` over 0.5 s, hard cut to `table-wide` at 6.2 s (it has `omit`), held through the key at 8.0 s, `ride` at 8.05 s as before. The arrow on the feed rail is `nervous` until the machine wakes (4.3 s), `shocked` until 0.45 s after power-on, then `scared`. The landing at the plunger stays at 8.3 s in the launch beat: the key `table-wide` at 8.0 s has the ball in the tube. The eye stays inside the page's right edge (x 19.7 of 20 balls) and the lens turns 40 degrees off the tube, so the edge of the page slab is not in frame.
6. Revolving door (R1-2 issue 10). The hold's centre moved from x 9.2 to 9.5 balls: the post stands 0.3 balls inside the carpet. It is not centred on the carpet: the ball is 1 ball wide on a carpet 1.6 wide and has to pass the post. MEASURED: events and track identical to main, no search spent.
7. `tests/pinball.test.ts`, "continues exactly after load(save())": 60 s limit, nothing it checks changed.

8. Bumper hits (round 11, frames 4878 to 5040). Kit, beat `pinball.coffee`: "`tier-2`, then ball height inside the cluster". New camera `table-nest`, eye `[MID, Y1 + 12.4, 0.5]`, target `[MID, Y1 + 6.4, -1.4]`, lens 40 degrees (the `rail` entry), a hard cut. It stands at the bats, half a ball over the floor, and looks up the tier at the three cups. The film holds `tier-2` from 14.3 s to 16.0 s (the drop from the chute) and `table-nest` from 16.0 s to 19.35 s, so all six bumper hits (16.51 to 18.91 s) are seen from ball height with the arrow about 60 px tall in the frame. MEASURED: `npm run take -- --check`, "hits within 0.15 s of a cut of the film: 0", 10 of 10 beats inside. Looked at: `npm run sheet -- --beat pinball.coffee --tier draft`.
9. Film cut list after decisions 5 and 8: 0 follow, 4.1 `tube` (0.5 s move), 6.2 `table-wide`, 8.05 ride, 10.25 `tier-3` (0.6 s), 13.0 `table-lobby`, 14.3 follow, 16.0 `table-nest`, 19.35 `near-nest`, 20.95 `table-replyall`, 22.2 follow, 26.9 `table-fired`, 29.3 follow, 31.15 rail, 32.3 follow (0.6 s), 34.3 `table-save`, 34.8 `near-spent`, 35.45 `table-save`, 36.6 follow.
10. 'Background Check' sign under the spiral ramp (R8-1 issue 6): not moved. MEASURED on the `tier-street` draft still: the sign runs along the front of the police station from x 14.35 to 16.7 balls, and the two rails of the highway cross its first 0.9 balls. To clear it the ramp would have to end 0.9 balls further left, and its end is fixed by the spiral it feeds (garage centre 15.2 less radius 0.75). The station cannot move right (it meets the lift column at 16.75) and the three tier cameras are ruled. The sign's place on the front is set in `src/table/real/models/street/index.ts` (not mine): it wants to sit on the right 1.4 balls of the front, or on the roof edge. Sent to the Builder.

## Looks spent (draft unless said), by part

| Part | Looks | What |
|---|---|---|
| Point 1, baseline | 6 | 3 compares, reveal sheet, result still, drain sheet |
| Flippers at `tier-office` | 1 | compare |
| `reply-all` camera | 3 draft, 1 review | compares |
| Result screen | 2 | still, ids diagnostic |
| Reveal, `tube` camera | 5 stills, 1 sheet | |
| Way out | 1 | drain sheet |
| Bumper hits, `table-nest` | 2 | coffee sheet before and after |
| Places | 2 | `lobby-doors` and `tier-street` compares |

Take searches: 25 of 31 used before this round, 0 spent in it. The edit of one flip's end in `cut/TABLE-TAKE.json` was by hand and is not a search; the one layout change (the door post) left the events and the track the same, so the three searches it buys are unspent.

## Steel balls after the blast (round 11 R4-4 issues 1 and 3): found, not changed

MEASURED from the event and track dump (`node out/work/mf/ev.mjs`): the clear ball leaves the blast at about -11 balls a second across and 6 rising to 14 balls a second down the table over 0.4 s, so it does curve and gain speed down the slope; the three steel balls leave the tier by the gate at 21.7, 22.2 and 22.7 s while the clear ball stays until 24.3 s. Any change to how they move is a physics change and moves the take.

## Asked by the ball finisher (10:2x UTC), not yet done

1. At a hit, the arrow thrown against the wall away from the thing struck, pressed for 0.05 s, staying within 0.84 of the radius (was 0.875).
2. In stills where the turn is free, the arrow lying face to the camera.

## Moves of things a model stands on

| Thing | Old | New | Told the Builder |
|---|---|---|---|
| hold `corporate.revolving`, centre | (9.2, 6.1) balls on tier 3 | (9.5, 6.1) | 10:21 UTC |

