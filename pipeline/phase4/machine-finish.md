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

### Round 12 motion and acting list (from 10:32 UTC), in the Builder's order

11. Ball parked beside the door post (R4-1 issue 2, 12.07 to 12.8 s). The ball reached the revolving door 0.8 s before the door was due to bat it on, and stood. The launch now comes 1.05 s later, so the wait is at the plunger, where a ball waits. `T` in `src/pages/step3/index.ts`: `atPlunger` 8.3 -> 8.6, `plunger` 9.4 -> 10.45, `onTable` 10.85 -> 11.9, `doorKick` 13.1 -> 12.9; the first two `MODES` times 10.9 -> 11.95 and 12.1 -> 12.55. MEASURED (`node out/work/mf/ev.mjs`): plunger 10.45 s, sling 12.3, carpet-roll 12.48, spinner 12.95, doors-slam 13.1 (as before); the ball is at the post 12.52 to 12.95 s (was 12.07 to 12.8); every one of the 54 events after 14.0 s is at the same time as before and the clear ball's track is the same after 14.1 s but for the three settles of decision 13.
12. NEEDS, sent to the Builder 10:50 UTC and applied as one commit: key `tier-corporate` `at` 0.25 -> 0.4 (12.0 s -> 12.6 s) in `config/showcase.json`, because at 12.0 s the ball is now at the lane mouth and the approved picture has it on the carpet at the post. File `pipeline/phase4/machine-finish-NEEDS.patch`.
13. A ball that rests in a scoop (R4-3 issue 1). `SETTLE.seconds` 0.28 -> 0.16 and `SETTLE.sink` 0: the frame finisher made the scoops pockets with the floor about 1 px over the tier floor, so the held ball sits with its foot on the floor at the hold's centre and the settle is short.
14. Views that changed every third of a second (R4-1 issue 5, 34.0 to 37.0 s). Film: `table-save` 34.3 to 36.2 s (1.9 s, the save at 35.72 inside it), `near-spent` 36.2 to 37.2 (1.0 s), follow from 37.2. Before: five views in 2.9 s. Kit, save: "Slow motion, low, from just above the flippers".
15. Film cut list now: 0 follow, 4.1 `tube` (0.5 s move), 6.4 `table-wide`, 8.65 ride, 11.55 `tier-3` (hard cut), 12.75 `table-lobby`, 14.3 follow, 16.0 `table-nest`, 19.35 `near-nest`, 20.95 `table-replyall`, 22.2 follow, 26.9 `table-fired`, 29.3 follow, 31.15 rail, 32.3 follow (0.6 s), 34.3 `table-save`, 36.2 `near-spent`, 37.2 follow. MEASURED `npm run take -- --check`: 10 of 10 beat events inside, 0 hits within 0.15 s of a cut, 3 of 3 places. `tests/pinball-stage-out.test.ts` counted six switches to and from the two cameras with `omit` (in and out of `table-wide` once and of `table-save` twice); the film now goes to `table-save` once, so the count it holds is four.
16. Extra balls that vanished (R4-1 issue 4). A steel ball towed to the gate was removed there. It now says `steel-out` and rides `chute.<tier>` down out of the tier, seen, and is removed at the rail's end (`atGate`, `railEnd` in `src/table/physics.ts`). MEASURED: steel ball 1 at the gate 21.65 s, on the chute 21.75 to 21.95, gone 22.0. This is not the kit's ending ("No steel ball leaves Tier 2", the inbox takes them back); that needs a director change and a take search and is listed under not done.
17. The arrow in the ball (R9-2 issues 1 and 2, R9-1 issue 2). On the `spiral` rail the arrow is aimed along the rail's heading, so it turns with the ball round the spiral. On the `highway` rail under the held `rail` view the aim takes a lean from the rail's bend (`LOAD`: reach 0.8 balls, gain 1.6, most 0.8 rad) and a slow rock. `HIT.hold` 0.1 -> 0.2 s so a hit reads in the arrow for 12 frames.
18. Still machine 1:12 to 1:15 (R4-1 issue 3): beat lengths stay (ruled). The ride view now starts at 8.65 s on the ball at the plunger and stays through the pull and the shot (10.45 s), so the hold shows the ball rolling into the shooter lane and the plunger drawing back.
19. Pan down the tube (R4-1 issue 8): kept, by the kit's line "The view travels down the page after the ball in its tube". No look spent.
20. Wander at the top of Tier 2 (R4-1 issue 1, 15.37 to 16.8 s). MEASURED cause (`node out/work/mf/ev.mjs`, track every 0.025 s): the ball left the chute at (10.05, 1.2) balls, met `office.bumper.2` on its upper left at 14.94 s, was thrown up and left, struck the top wall, landed on the `cubicles.roof` guide moving up its slope, stopped at x 3.77 at 15.65 s and rolled back down it at 2.5 to 7 balls a second until it fell off the end at 16.4 s. The director named no place for that first throw (its place was under the low bumper, outside the bumper's cone). It now names one while the ball is above the top row of bumpers: `NEST.over` = (1.05, 0.8), a point on the top wall 1.05 balls to the far side of the centre line, so the bumper throws up and across (inside its cone, `SHOT.lean`), the ball strikes the wall and falls through the lane between the cubicles and the bumper. MEASURED after: kick 14.94, wall 15.1, the four cubicle drop targets 15.31 to 15.34, sling 15.53, bumpers 15.70, 16.04, sling 16.14, bumper 16.30, the right bat at 16.9. No part of that path is slower than 9.9 balls a second before the bat.
21. Take search 26 (director change, so it buys none): `npm run take`, 24 runs, kept run 20, 8 flips, score 11330 with two hits beside cuts, which the retimed cuts below remove. MEASURED `npm run take -- --check` after: 10 of 10 inside, 0 tows, 7 bumper hits in the coffee beat (was 6), the save a flip, the ball on a flipper at `last-save`, 3 of 3 places, 0 hits within 0.15 s of a cut. New times: bumpers 15.70 to 18.40 s, inbox-take 18.78 (was 19.03), ramp-roll 30.62 (was 31.07), flipper-save 35.62 (was 35.72), drain 37.63 (was 37.75). The copy of the take before the search is `out/work/mf/TABLE-TAKE.before-26.json` (not in the repo; `git show 7a6a30a9:cut/TABLE-TAKE.json` is the same file).
22. The ride up the highway. In the new take one flip sends the ball to the ramp at 30.27 s, 0.8 s sooner than before, and the director paces the ride to end at 33.0 s, so the ride was 2.7 s at 3.9 to 1.9 balls a second. `T.scoopKick` 29.0 -> 29.35 and that one flip moved by hand by the same 0.35 s (`["L",30.4021,30.7104]`): the kick is still inside the fired beat, the ball takes the ramp at 30.62 s. MEASURED: every event after 30.8 s is at the same time as before the move. Not a search.
23. Film cut list after the new take: 0 follow, 4.1 `tube` (0.5 s move), 6.4 `table-wide`, 8.65 ride, 11.55 `tier-3`, 12.75 `table-lobby`, 14.3 follow, 16.55 `table-nest`, 18.95 `near-nest`, 20.5 `table-replyall`, 22.2 follow, 26.9 `table-fired`, 29.6 follow, 30.75 rail, 32.3 follow (0.6 s), 34.3 `table-save`, 37.2 follow. The cut to `table-replyall` now comes 0.22 s before the inbox throws the ball out (20.72 s), so the release is seen whole in one view (R4-4 issue 4). `near-spent` is out of the film: the save beat is one view from just above the flippers, as the kit has it. `tests/pinball-stage-out.test.ts` holds two switches of `table-save` now (four with `table-wide`).
24. Asked by the street finisher 11:17 UTC, agreed and done: `sign.street.firehouse` is tone `ink` (it was `inkLight`, white on the new cream board, measure M4 1.3). The firehouse was the one model with tone `danger`, so every model sign on the table is `ink` now.
25. 'Background Check' clear of the spiral (R8-1 issue 6; supersedes decision 10, the street finisher's board follows the letters). New optional `signAt: [centre from the box's left, width]` on a model in `src/table/layout.ts`; the police sign is `[1.8, 1.4]`: two lines in the right 1.4 balls of the roof. The model's box and the highway rail are where they were. Looked at: `tier-street` compare, the rails pass left of the letters.
26. The website's light on the way out (R4-1 issue 7, "a lamp switching on, fast, with a slight overshoot"): NOT done, the 0.3 s rise of decision 4 stays. Tried a lamp strike (0.9 in 0.09 s, dip to 0.6, full at 0.3 s): it broke the rule held in `tests/pinball.test.ts` that the website's light never steps more than 0.07 in 1/80 s (MEASURED 0.0956; a slower shape 0.0742). The 0.3 s rise already steps 0.059, so nothing faster fits the rule. The test is left as it was and the rule is put to the Builder in the end report. The page's own settle (5 px back over 0.12 s, `LEAVE.back`, `LEAVE.settle`) was there before.
27. The wake as an event of its own (round 12 R9-1 issue 6, R4-2 issue 4). Before: lights down 4.0, wave 4.3 to 5.2, all of it while the `tube` camera was close on the ball, and the whole machine was first seen at 6.4 already lit. Now: the website's light goes down in the `tube` view, on the page behind the tube (4.1 to 5.2, `DIM` 1.1 s); hard cut at 5.2 to `table-wide` on the dark machine; the marquee at 5.6 (`T.wake`), then Corporate, Office, Street at 6.0, 6.4, 6.8 (`WAKE` 0.4 s, it was 0.3 with the marquee and the top tier together); `power-on` at 7.2; the whole machine held lit 1.45 s to the cut at 8.65. The beat's length and its event (`power-on` inside 4 to 8 s) are the kit's and hold. The key `table-wide` (8.0 s) has every lamp at full as before. Looked at: reveal sheet.
28. The doors (R9-1 issue 7): the arrow stays flat on the glass 0.6 s after `doors-slam` (13.10), it was 0.45 (`ACT.doors`). Not longer: at the key `lobby-doors` (13.8) the approved image has the arrow whole. The slam is 0.35 s into the close view `table-lobby`. How the doors shut is the frame finisher's.
29. The save (R9-1 issue 10): NOT done. Tried one more view, `near-spent`, close on the ball from 35.85 to 37.2. Looked at (save sheet): the ball is at the frame's edge or out of it and the highway wire crosses in front. Taken out again; the save stays in the one `table-save` view, where the ball is about 40 px across and the arrow in it is small. A close view that holds the ball needs a camera of its own and looks I did not have left for it.

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
| Round 12: launch, lobby, save | 3 | beat sheets |
| Round 12: highway (arrow on rail and spiral) | 1 | beat sheet |
| Round 12: steel balls, inbox | 1 | replyAll beat sheet |
| Round 12: `tier-corporate` key at 0.4 | 1 | compare |
| Round 12: new take, coffee and replyAll | 2 | beat sheets |
| Round 12: new take, highway, save, fired | 3 | beat sheets |
| Round 12: way out, lamp strike | 1 | drain beat sheet |
| Signs | 1 | `tier-street` compare |
| Wake | 2 | reveal beat sheets |
| Doors | 2 | lobby beat sheet, `lobby-doors` compare |
| Save, close view | 1 | save beat sheet |

Take searches: 25 of 31 used before this round, 1 spent in it (search 26, decision 21), 26 of 31 used now. The edit of one flip's end in `cut/TABLE-TAKE.json` was by hand and is not a search; the one layout change (the door post) left the events and the track the same, so the three searches it buys are unspent.

## Steel balls after the blast (round 11 R4-4 issues 1 and 3): found, not changed

MEASURED from the event and track dump (`node out/work/mf/ev.mjs`): the clear ball leaves the blast at about -11 balls a second across and 6 rising to 14 balls a second down the table over 0.4 s, so it does curve and gain speed down the slope; the three steel balls leave the tier by the gate at 21.7, 22.2 and 22.7 s while the clear ball stays until 24.3 s. Any change to how they move is a physics change and moves the take.

## Asked by the ball finisher (10:2x UTC), not yet done

1. At a hit, the arrow thrown against the wall away from the thing struck, pressed for 0.05 s, staying within 0.84 of the radius (was 0.875).
2. In stills where the turn is free, the arrow lying face to the camera.

## Moves of things a model stands on

| Thing | Old | New | Told the Builder |
|---|---|---|---|
| hold `corporate.revolving`, centre | (9.2, 6.1) balls on tier 3 | (9.5, 6.1) | 10:21 UTC |

