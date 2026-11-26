# machine-runner, round 12

Branch `agent/machine-runner`, from `origin/main` 997de9fb. Looks branch `agent/machine-runner-looks`.

## The approved images in five lines

- Highlight: small, warm, clustered pin lights on glass and chrome, never one square window; long soft warm streaks only on round chrome.
- Bevel: every edge is rounded and catches a thin line of light; the arrow has a deep continuous charcoal side under an ivory face.
- Gap: parts stand apart with a dark, tight contact shadow between them; nothing floats and nothing is fused.
- Edge: the machine ends in a low satin steel rim, the focus falls off fast behind and before the ball, far things are soft discs of light.
- Camera: close keys are low and near (a portrait of one thing with open blue floor round it); the wide key is one long field inside the rim.

## Baseline, MEASURED 06:57 UTC before any change

- `npm test`: 102 files, 1390 of 1390. `npm run build`: exit 0. `npm run bots`: all clear.
- One draft still with its comparison (`npm run compare -- --key <k> --tier draft --format hd`): rail-cam 40 s, youre-fired 43 s, last-save 49 s, table-wide 48 s, lobby-doors 46 s, reply-all 44 s.

## Point 1: framing issues of round 11 still true on main 997de9fb (looked at 07:00 to 07:08 UTC)

- `rail-cam` (R1-5 1, R1-5 2): still true. The build "looks across the channel": the eye is ahead of the ball looking back, the wire leaves the bottom corners as two blurred bars, a warning triangle and a red insert fill the left, the firehouse and the bank stand together on the right, nothing on the left. The approved "looks straight down a continuous, centered chrome channel into a softly lit street".
- `youre-fired` (R1-4 3): still true. "Looks down from higher up and centers the action amid the bank, a foreground rail and a busy upper edge": the bank stands before the left of the firehouse front and takes the left third, a wire ramp crosses the lower right, the firehouse is seen 34 degrees off its front where the approved is about 54 degrees off, lower, with the firehouse over the right two thirds.
- `last-save` (R1-5 3, 4, 9, 18): still true. "The rail climbs diagonally out of the image" and the garage "is cut off and dominates that corner"; no "recessed black throat" shows under the plaque, the plaque sits on the bottom edge on a pale fascia; the ticker is cut at the right ("Wearing"); the bank stands before the firehouse; houses fill the outlanes.
- `table-wide` (R1-1 1, 3, 4; R8-1 2): still true. "A stack of steep tiers walled by tall black risers": the side walls show as 3 ball deep dark wells, the machine takes 60% of the width at its near edge where the approved fills the frame from corner to corner, the wire ramp is "tall, oversized" and crosses the Office tier, the marquee is "a smaller, thinner strip set higher", no page and no port in the picture.
- `lobby-doors` (R1-2 2): still true, and worse since 1ff6ad41. "The tall tower has a visible roof against extensive black space", the marquee and a silver band stand behind it, "giant partial floor inserts and silver rails crowd the foreground". The approved is "an entrance portrait with the facade filling the top and clear carpet and dark floor at the bottom".
- `reply-all`: the round 11 file names no framing issue for it. Seen beside the approved: the view is flatter (side rails barely converge), the display is cut at the right foot ("The dreaded !"), the balls stand up by the cups where the approved has them in a row under bumper 3, and the arrow stands up in the ball like a dart ("crumpled 3D shard", R1-3 4) where the approved lies flat.

### The four unjudged commits of the last owner

- 6df43642, rail camera turned to look back: wrong against the approved image. Replaced in point 2.
- 1ff6ad41, lobby camera higher: wrong, it brought the roof, the black and the marquee in. Lowered again in point 6.
- c7e0da1a, last save aimed lower: the card's words did leave the foot, kept as an aim, but the eye is still too high for the throat and the low arc. Refitted in point 4.
- 35ca7f7d, apron card on the left slab: right by the kit (02-SUBJECT line 371), kept.

## Decisions

- 07:03 UTC, with `/root/frame_fixer` (it asked which number and when): I answered `table.tierStepBalls` 1 to 0.5. Withdrawn at 07:06 UTC on the Builder's ruling of 07:05Z: both `tierStepBalls` and `topFloorDepthBalls` stay 1, they are heights off the page and the config's ("When files disagree", kit/00-README.md; "One scale", kit/02-SUBJECT.md), and only Brandon changes a number the kit sets. Nothing was changed, no trial was run, no patch was written. The time goes to `rail-cam`, `youre-fired` and `last-save`.

- 07:13 UTC, Builder's ruling: in the machine `flattened` is raised by the HQ doors alone. Done in `event()`: steel balls, bumpers, flippers, slings and the drop set `struck` and the reaction `recoil` only. On a hit the arrow is thrown to the inside wall on the far side from the hit, holds there, and comes off as the ball rolls on. Held by `tests/machine-runner-arrow.test.ts`.
- 07:20 UTC, the arrow inside the glass (point 8). MEASURED with `out/work/mr/probe.mjs` over the take: before, the arrow's outline reached 82.6 px from the ball's centre (nervous, `duck`, 19.43 s) and 42.5 to 42.7 px at rest; the bore is 42 px, the limit agreed with `/root/ball_fixer` is 40 px. Now 39.8 px with no damage and 40.4 px while flattened by the doors. How: `director-arrow.ts` finds the posed outline's enclosing circle and the page places the cursor so that circle is centred in the glass; the stretched states are not used in the glass (`shocked` 1.2, `confident` 1.12, `proud` 1.18, `angry` 1.03 play as `scared`, `plain`, `plain`, `nervous`), and the reactions `duck`, `doubleTake`, `jump` play as `cower` and `flinch`. A 70 px arrow at stretch 1.2 is 87 px corner to corner, more than the 84 px bore. This differs from the ruling's "shocked and the recoil stay as acting": recoil stays, the hit plays as `scared` with `recoil` and the throw to the wall. Told /root.
- 07:25 UTC, the doors: the kit's flattening spreads the body wider than the arrow, so the test holds 42 px while the doors' damage shows (MEASURED 40.4 px) and 40 px at every other step.
- 07:30 UTC, `rail` camera looks ahead along the wire, not back. Kit line 420: "`rail` is fixed above the ball while it rides a wire ramp. It looks down and a little ahead". The key's settled note: which buildings pass below, and on which side, follows the layout. MEASURED by projection (`node out/work/mr/proj.mjs 31.2,31.5,31.7,32.0,32.25 rail`): looking back the wire falls 34 degrees to the flap and ends at 60% of the frame's height, and the bank and the firehouse both stand west of the wire's start, so they cannot flank it. Ahead, at 32.0 s the police station stands left of the wire and the garage's spiral right. Key `rail-cam` `at` 0.4 to 0.556 (31.3 s to 32.0 s), NEEDS patch.
- 07:15 UTC, refitted 07:52 UTC after the `review` still (the firehouse took 44% of the width where the approved has 66%): `youre-fired` eye (8.1, Y2+6.45, 0.25) target (4.45, Y2+3.75, -1.95), the firehouse 52% of the width. The bank stands before the left of the firehouse front; that is the layout (R1-2 issue 23 asks for the bank as a lower frontage there), and moving it would close the left outlane. Not moved.
- 07:22 UTC, refitted 07:58 UTC after the `review` still (it looked 40 degrees down, the approved about 25): `last-save` eye (MID-0.15, Y2+19.5, 3.5) target (MID, Y2+8.5, -2.2), 27 degrees down. The apron card and the display both stay whole, so the view cannot come as near as the approved. The key is at 35.59 s. The highway ramp is 4.4 balls tall, so from this camera at 40 degrees it is a tall arch that leaves the top, not the approved's low arc. The throat's shape is `/root/frame_fixer`'s.
- 07:10 UTC, with `/root/ball_fixer`: the glass never magnifies the arrow; the test limit is 40 px; faults of the glass are its, the arrow's attitude and damage are mine. At `youre-fired` the arrow lies tip up left (about 10 o'clock) as approved.
- 07:20 UTC, with `/root/frame_fixer`: the floors stay; it lowered its cross rail top over the lower floor from 152 px to 130 px; no layout value touched.
- 07:45 UTC, sheet `clear-ball`, third ball: no damage, `scared` with `recoil`, the arrow seated against the wall away from the cup. The three panels with gutters are not built yet.
- 08:13 UTC, shapes told of time: `loader.ring` and `outlet.ring` carry `v: [seconds since the arrow was taken or the ball came home]`; `ball.clear` carries `v = [share closed, seconds since closed, sweat, strength, angle, since]`. Strength comes from the change of the ball's velocity over one step in plane mode: 0 under 3.6 balls a second, 1 at 14.6; none on a rail or in a hold.
- 08:20 UTC, two close cameras that pan after the ball with a lag of 0.25 s: `near-nest` (17.0 to 20.95 s) and `near-spent` (34.8 to 35.45 s). Both reached with `--camera film` only: they are not in `config/showcase.json`, so they use home's lens.
- 08:22 UTC, the doors: the leaves swing shut over 0.15 s from the spinner so they are shut at the slam (13.30 s). The camera's shake at the slam lowered 1.3 to 0.5 so the jamb and the carpet stay steady.
- 08:24 UTC, the cut to the cup moved 27.2 to 26.9 s so the arrival is seen. The five 0.1 s flips of the take are held 0.2 s; MEASURED `node out/work/mr/ev.mjs` diffed against the list before: identical.
- 08:25 UTC, the rail camera follows a low-pass of the ball's arc (0.4 s), so the ball moves through the frame.
- 08:31 UTC, acting on hits: at each plane contact of strength 0.3 or more, `strike` lays the arrow across the hit axis and `press(0.66)`, both held 0.1 s (6 film frames); `wobble` after hits of 0.9 or more. Brace at the plunger, alarm before the copies pour, catch and shiver in the cup, kick, lip of the spiral, dizzy in the spiral.
- 08:31 UTC, stretch presses (launch, kick-out, alarm) are not used in the ball: with them the arrow leaves the 40 px glass. Squash presses and strikes are used instead.
- 08:44 UTC, `seal(true, true)` is used, as the Builder said. `middleOf` centres the bare outline; MEASURED with `npx vitest run tests/machine-runner-arrow.test.ts` and the view's rule alone: plain 40.40 px, exhausted 42.53, scared with flinch 45.34 to 46.12. So the page adds only the small rest: the centre of the acted outline less the centre the view uses (`berth(..., true)`), with no extrapolation. With it the worst is 40.37 px (flattened, limit 42) and under 40 everywhere else. The Builder said at 08:45 that the view will measure the acted outline itself; when that is merged the rest is dropped and the mirrored test follows the new rule.
- 08:44 UTC, the swap `SHORT` (confident, shocked, angry, proud drawn as shorter states in the ball) stays until the view fits the arrow itself: true states MEASURED 41.3 to 45.4 px.
- 08:46 UTC, the way in: MEASURED `node out/work/mr/proj.mjs 4.2,4.37,5.4,8 none`: the film camera's eye is the same at every step from 4.2 to 8.05 s, so it is one cut and a hold already. Two draft stills at 4.4 and 5.4 s show what changes: the lights go down and the tiers power on. Nothing changed.
- 08:47 UTC, the way out: from the step the ball enters the drain wire the page makes one move of 0.55 s to its last scroll (eased in, firm stop, 5 px back over 0.12 s), and the lights come up over 0.3 s after it has landed. MEASURED `node out/work/mr/proj.mjs`: the eye is still from 38.47 s, the ball reaches the seal at 38.75 s, `ball-open` 38.94 s; events identical.
- 08:47 UTC, the loader: a squash held 0.1 s at touchdown, a lean away from the vent held 0.32 s, a pull in, the arrow struck and pressed as the shell closes, then a flinch held 0.45 s. The wait is counted on the page's clock: `s.t` stops at 2.4 s until the seal, which left the live page waiting for ever (caught by `tests/pinball.test.ts`, fixed before any push).
- 08:48 UTC, sheet `clear-ball`: three panels, gutter 21. The first two balls stand on the Street tier (on the left flipper with sweat 1, and in flight). The third stands at the Office tier's lowest white cup, at `cup.r + 0.5` (touching, as ball_fixer asked at 08:54), pressed with strength 0.6 (its word of 09:01: strength 1 is the film's one frame, not a held picture): the white cups are on the Office tier only, and the Builder said the part touched matters more than the floor.
- 08:55 UTC, `step3-result`: the paragraph's measure 1040 to 720 px, two even lines; seen in a draft still at 41.5 s.
- 08:56 UTC, `table-lobby` (key `lobby-doors`): eye height 0.8 to 1.3 balls, so it looks 12.4 degrees down (was 5.9) and the carpet with the ball's shadow is in the picture, as ball_fixer asked. Seen in a draft compare. The tower is still small beside approved: the model is a narrow box, the camera's distance and lens are unchanged.
- 09:00 UTC, the way in, on the Builder's word of 08:58 (calm it, overlap, no frame darker than half, over in about 1.2 s): the tiers begin to wake at 4.3 s (`T.wake`), 0.3 s apart and 0.3 s each, so the third is full at 5.2 s, the step the website's light reaches dusk. Before: the wake began at 5.2 s and ended at 6.25 s. The event `power-on` stays at 5.2 s; the kit's line 12 gives the order and no duration. `tests/pinball.test.ts` line 195 looked at the wave 0.5 s after `T.powerOn`; it looks 0.5 s after `T.wake` now, since the wave moved.
- 09:08 UTC, the fitting view (main a3f57091) taken up: the page places the sealed body on the ball's middle and nothing more (`io.cursor.place(px(b.x), px(b.y), px(b.z) - 1)`), `berth` gives only how far back toward the wall the body may sit, the swap of acting states is gone (confident, shocked, angry and proud play as themselves). `tests/machine-runner-arrow.test.ts` now asks the view's own measure: `sealedFit(pose, time).r` at most `boreRoom(tremble)` at every step, the body within 1.5 px of the ball's middle, and a list (empty) of poses the glass holds under 0.93 outside the doors' damage. MEASURED with `node out/work/mr/off.mjs`: the only holds under 1 in the take are shocked with flattened 0.903 (the doors) and confident 0.999; the body sits at most 1.10 px from the saved ball (35.73 s, the flipper's strike; 0.32 px in the feed tube), which is the ball's last nudge in the step after the body is placed.
- 09:18 UTC, `near-nest` tried closer (eye 10.5 and 12 balls up in place of 15, measured by projection only, no render): the ball is 12 to 13.7 of 100 across in place of 9.6, but the bumper hit at 18.91 s and the inbox's take at 19.02 s sit at 6 to 10 of 100 from the top edge, the ball cut by the frame, because the camera trails the ball by 0.25 s. Put back: a cut never hides a hit. The camera stays at 15.
- 09:16 UTC, R9-1 issue 7 (the arrow in the reveal beat) is not done. The ball reaches the plunger at 8.3 s, 0.3 s after the beat ends, and the key `table-wide` sits at the beat's last frame, so a landing inside the beat needs the event `at-plunger` moved about 1 s and the key's camera changed: both are the Builder's.
- 09:16 UTC, one run of the whole checks on the merge of main 5429fcf2 timed out in `tests/pinball.test.ts` (continues exactly after load(save()), 20.8 s against 20 s) while four stills were rendering beside it. Run again with nothing beside it before the push.
- 09:22 UTC, R9-2 issue 1 (the white smear after the bumper hit at film frame 5010): three draft film stills at 16.525, 16.56 and 16.61 s, 1.5, 3.4 and 6.2 film frames after the contact of 16.51 s, show one squashed pose held through all three, the arrow whole inside the glass against the wall away from the bumper. Under the straight-down tier camera it is turned about a third away from the lens there, so it reads grey and short, not white and long.
- 09:26 UTC, an earlier cut to `ride` for the ball's way down the feed tube was looked at by numbers only and left: the tube runs at the page's height (z 0) down x 19.15 until 8.0 s and only then dives to the plunger lane at z -3, so the plunger's camera does not see it come; a camera for the tube would be a new fitted camera with no time left to judge it at review.
- 09:30 UTC, the two close cameras judged once at review: `near-nest` at 17.37 s (78.9 s, 562080 triangles, 382 draw calls) the arrow whole in the glass under the bumper, the ball about a tenth of the frame's width; `near-spent` at 35.1 s (60.4 s, 408314, 333) the drooped arrow fills the ball over the right flipper. Counts at the key reply-all, draft, hd: `npm run counts -- --key reply-all --format hd --tier draft` 176 draw calls and 495367 triangles in one drawing of the scene (assets web); `node out/work/mr/tex.mjs --key reply-all --tier draft` 730.5 MB of textures on pinball in the asset set full (338.0 assets, 329.2 render targets, 63.3 not seen; 60 of 63 counted).

## Moves of things a model stands on

| Thing | Old | New | Why |
| --- | --- | --- | --- |

## Looks, round 12 (limit 40 a part)

| Part | Looks | What |
| --- | --- | --- |
| table-cameras | 39 | 6 baseline compares, 1 tier view by mistake, 5 rail stills looking back, 2 youre-fired compares, 1 last-save compare, 1 rail compare looking ahead, 1 rail still at 32.0 s, 1 rail compare at the new key, 3 `review` stills (rail-cam, youre-fired, last-save), 1 youre-fired compare, 3 last-save compares, near-nest at 17.35 s, near-spent at 36.85 and 35.1 s, doors-swing at 13.23 s, last-save again, lobby-doors compare at 12.4 degrees down, 1 lobby-doors at review after the eye went up (146.7 s), 1 lobby-doors at draft with the fitting view, 3 film stills with the true states (near-nest 17.48 s, ride 8.6 s, near-spent 35.1 s), near-nest at 17.37 s and near-spent at 35.1 s at review |
| clear-ball sheet | 2 | three panels, first draft; third ball at `cup.r + 0.5` |
| page | 2 | loader-caught at 2.76 s, result at 41.5 s |
| table-layout | 0 | |
| table-physics | 0 | |
| director | 7 | ride-brace at 9.2 s, wayin at 4.4 and 5.4 s, the calmer way in at 4.4, 4.7, 5.0 and 5.3 s |
| acting-pinball | 5 | near-nest struck pose at 17.37 s, alarm in the inbox at 20.5 s, the bumper hit of 16.51 s at 16.525, 16.56 and 16.61 s |
| keys after merge 30, asked by the Builder, not tuning | 5 | table-wide, reply-all, youre-fired, rail-cam, last-save at draft |

## Take searches

- 25 of 31 used when I began. None spent yet.

## Where it stands at the end, 09:35 UTC

- Green head: ff195187 (main 180755e9 merged). `npm test` 115 files, 1461 of 1461; build built; take check every one of the 10 beat events inside its beat, hits within 0.15 s of a cut 0; paths all clear; bots all clear; the events of the take the same as the baseline (`node out/work/mr/ev.mjs`).
- Take searches spent by this agent: 0. Layout and physics untouched this round.
- Not done: R9-1 issue 7 (the arrow in the reveal beat), the steel balls after the blast (R4-4 issues 1 and 3, physics, not started), stills points 5 (`table-wide`, rails low), 9 (the launch ride's wall) and 10 (`rest-step3`, the port reads as a control), a closer `near-nest`.
- Least real, by where it is seen: the reveal beat, film frames 4260 to 4500, where the ball is a speck in the feed tube and the arrow does nothing a viewer can see; the bumper hits under the straight-down tier camera, film frames 4878 to 5040 (the hit at 5011), where the ball is 5.1 of 100 across and the pressed arrow reads grey and short; the key `lobby-doors` (film frame 4848), where the camera stands straight on and higher than approved's low three-quarter view and the headquarters reads as a small glass box behind the ball.
