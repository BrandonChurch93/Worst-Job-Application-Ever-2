# Street models: second owner's notes

Branch `agent/street-models`, made from `origin/main` (3a83a25, then merged up). Folder `src/table/real/models/street/`. The first owner's notes are `street.md`: read here, not edited. Where this file says something else, this file holds.

## What the approved images show in my part that a quick look misses

1. The firehouse roof is not dark. It is a pale grey deck inside a lighter stone parapet, with small grey units on it and the red of the beacon pooled on the deck. The sign is a cream plate with a thin gilt line that stands on the front edge of the parapet.
2. The mouth of the firehouse is wide and low, with round upper corners, in a pale stone frame that takes nearly half of the front. Inside it is black, with red on its jambs and on the rim of its floor. Each course of brick catches light on its upper edge and the mortar is darker than the brick.
3. The garage is pale concrete, not a cage: stacked solid decks that are bright on top with dark gaps between them, piers with ribs outside, and the clear trough on top.
4. The bank has a flat grey roof inside a stone parapet, four stout fluted columns with warm light behind them, and steps. The houses have brown, slate and dull red roofs, plaster or brick walls and one lit window each: none is a saturated toy colour.
5. Mom's Basement is a small white house with a brown roof, and its sign is a plate on its front, not a board over its roof. The road signs are yellow plates with black chevrons, each with a bright wire rim round it.

## Baseline (MEASURED at ce822d7 before any change)

- `npm test`: 92 files, 1330 tests passed. `npm run build`: built. `npm run bots`: all clear.
- `npm run build && npm run counts -- --key table-wide --live low`: whole frame 216 draw calls, 473936 triangles. My rows (draw calls, triangles): model-firehouse 6 (5 colour, 1 shadow), 50106; model-road-signs 4, 2740; model-moms 3, 2982; model-police 2, 1108; model-bank 1, 4038; model-garage 1, 1120; model-houses none at low (its screws are fine detail). Folder: 17 calls, 62094 triangles. The budget is therefore 17 calls and 92094 triangles.
- `npm run build && npm run counts -- --key tier-street --live low`: the same rows; whole frame 117 calls, 272030 triangles.
- One draft still: `npm run still -- --key tier-street --format hd --tier draft` 31.9 s; `youre-fired` 40.7 s; `last-save` 29.4 s.

## Asked of the director (02:35 UTC), answered 02:37 UTC

- Firehouse and police station 2 balls tall instead of 1.5: yes, their 633c2d9a. Until it is on main the same two lines are on my branch as the commit `NEEDS: ...` (`street-models-NEEDS.patch`).
- A smaller spiral: no (the trough is `SPIRAL.r` + 0.625 balls and the pitch is the least clearance). `SPIRAL.frame` could come from 1.525 to 1.45 if asked: not asked, my wall needs its 0.095 ball.
- The houses beside the bank and under the garage: no, every place there is crossed by a ball. They stay in the two lower shoulders.

## Decisions

- The mouth of the firehouse is the bay of the layout to the pixel: u 4.4 to 5.7, 103 px high (a ball and 7 px), round upper corners of 16 px, 0.55 ball deep. The bay ends 4.2 px from the building's right corner, so the right jamb of the stone frame is the corner pier itself.
- The stone frame is part of the one painted mesh now and does not shake: stone does not shake. The door rattles in its tracks instead. The draw call that the frame had is the red light of the bay (`street.firehouse.bay`, group `street.red`, the same material as the beacon's reflector).
- The door is two panels that hang in the head of the mouth. `doorOf` keeps its numbers (0.86 at rest, 0.95 up); the travel is 114 px, so at rest about 5 px of the door's foot show under the stone and on a held ball it is gone. A door lower than that would stand in the ball.
- Brick: the mortar is darker than the brick, each brick is lighter along its upper edge and darker at its foot, and the relief is deeper. A brick is 10 by 4.2 px with a joint of 0.8 px (`wja-studio-street-paint-12`): smaller bricks were noise at the size of `tier-street`.
- No plinth under the front: the bay's floor is level with the street.
- The bay's red is nine steps of vertex colour on the one glow material, level `0.0012 + 0.04 * t^3.2` from the floor to the head, so it is nearly black at the floor and brightest under the lamp at the head. Its material takes `0.6 + 2.7 * red` from `levels(ctx, zone)`, so the bay is a dull red at rest and full on a held ball.
- Beacons: the dome is larger (radius 25 px, 35 px high, 24 flutes, on a base ring of radius 31) and has its own lens patch `wja-studio-street-lens-2` that makes the middle that faces the eye bright and the rim deep, since the stager saw a flat pale red. A wire cage was tried and taken off: from above it read as a crosshair over the dome.
- Roofs: `roofDeck` of `kit.ts` lays the decks of the firehouse, the police station and the bank: grey felt (`TONE.deck` 0x77828d) in strips 27 px wide with a dark lap between them and a gutter round it, inside a parapet with a pale cap (`TONE.cap` 0xc3c9cf), so the cap reads against the deck from straight above. The stone of the firehouse is 0x959da5.
- Windows: the lit panes are amber (`[0.64, 0.41 + 0.07 warm, 0.15 + 0.11 warm]` times the window's own level), not near white: beside approved the first ones were pale yellow. The small houses' and Mom's windows are brighter in turn, so each has one that reads as lit.
- The police station's storeys scale with its new height (`k0 = top / 144`).
- The bank has two tall lit windows behind its columns, beside the doors. It cannot grow: the hold of the scoop is at (5.05, 3.9) and the drop bank at u 4.25.
- The garage. The layout holds it to a frame of radius 1.525 balls from 1.3 to 5.6 balls up, and the ball's tube takes everything inside radius 132 px, so no deck can be built inside: what I own is the wall ring from 137 to 146 px. It is now concrete (0x9aa5b0, which reads pale under its seven lamps; 0xc6c9c9 and 0xb7c2ce burnt out to cream): full bands 0.44 ball high at every half pitch that climb with the spiral, eight piers (twelve was a cage), and a lit strip under each band every third segment. It cannot be the low spiral of the approved image under this layout.
- Garage lamps: `garageLamps(z)` gives seven fittings on arms 0.5 ball outside the wall, an iron head with a lit underside. Upper row, z 516 px, at tier (u, v) (16.63, 4.02), (13.77, 6.88), (16.63, 6.88); lower row, z 290 px, at (16.63, 4.02), (13.77, 4.02), (13.77, 6.88), (16.63, 6.88). Poles on the roof were tried first and stood over the layout height, so they became arms under the rim.
- Houses: muted roofs (brown, slate, dull red) and plaster or brick walls, darker grass, no red mailbox. Mom's roof is brown (0x5b3026). The rolled wire rim of a road sign is 1.7 px and pale (0xe4e7ea).
- `tests/table-street-models.test.ts`: no vertex of the firehouse stands in a ball at the hold, at the front edge or at the back of the bay; the door is clear of it at rest and on a held ball; the garage lamps hang inside the layout height and outside the ball's tube.

- Surfaces (`wja-studio-street-paint-15`): cast stone (kind 6) is smooth with a little slow tone, not grit, and has few streaks; the relief of every kind fades where a face is seen nearly edge on, which took the sparkle of dots off the firehouse's side wall in `youre-fired`; concrete has broad stains, not fine streaks.
- The bay's side walls fall off in four steps to the back, so the red is on the jambs and the back is nearly black.
- The bank's columns are fluted deeper (0.17) and the wall behind them is a shade darker than the columns, so they stand off it.

## The garage after 04:10 UTC

`/root/table_runner` agreed to two turns of the spiral instead of three (`table.spiralTurns` 3 to 2, their `NEEDS:` commit): top 5.4 to 4.1 balls, the garage 4.3 to 3.0 balls high on its 3.05 ball width, base, box, `SPIRAL.r` and `SPIRAL.frame` as they were. Nothing in this folder holds a number of the spiral: the wall, its piers, its lit strips and its lamps are built from `SPIRAL`, the model's box and the two rails. LOOKED AT in a trial with the config changed and not kept: it builds, lower, with the same bands.

## Asked of other owners

- Lighter, 02:53 and 02:57 UTC: the bay spill's place is right (half width 0.65 balls); seven warm sources of `street.windows` at the garage lamp places above. Answered 03:17 UTC: in on `agent/table-light` 1cee53b as `highOf`, upper row power 0.45 reach 2.8 balls, lower row 0.55 reach 3.2 balls. The places are typed in there, not read from `garageLamps`: if one moves, tell the lighter or the Builder. LOOKED AT by me in a trial merge that was not kept: the wall reads as pale concrete with lit decks in `last-save` and `tier-street`.
- Stager, 03:08 UTC: the firehouse's numbers (mouth u 4.4 to 5.7, 103 px open, head at 113 px, parapet top 192 px, beacon at (4.5, 2.75), dome 180 to 233 px) and a lens that takes the whole house. Answered 03:09 UTC: `table-fired` on `agent/pinball-stage` b6c6d66.
- The matt red on the floor before the bay in `youre-fired` is not from this folder: the bay mesh is inside the mouth and gives no light.
