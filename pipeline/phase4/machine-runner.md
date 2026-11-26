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

## Moves of things a model stands on

| Thing | Old | New | Why |
| --- | --- | --- | --- |

## Looks, round 12 (limit 40 a part)

| Part | Looks | What |
| --- | --- | --- |
| table-cameras | 26 | 6 baseline compares, 1 tier view by mistake, 5 rail stills looking back, 2 youre-fired compares, 1 last-save compare, 1 rail compare looking ahead, 1 rail still at 32.0 s, 1 rail compare at the new key, 3 `review` stills (rail-cam, youre-fired, last-save), 1 youre-fired compare, 3 last-save compares |
| table-layout | 0 | |
| table-physics | 0 | |
| director | 0 | |
| acting-pinball | 0 | |

## Take searches

- 25 of 31 used when I began. None spent yet.
