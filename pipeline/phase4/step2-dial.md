# Step 2: rows, dial and acting (agent step2-dial)

Branch `agent/step2-dial`. Looks branch `agent/step2-dial-looks`.

## What the approved images show that a quick look misses

1. `step2-dial.png`: the highlight on the wheel is not a ring but two fans, one toward the upper left and one toward the lower right, and the orange hub carries one soft square of light high on its left shoulder, well off its middle.
2. The bevel that reads as "the bezel" is about 9 px wide and it is a step, not a slope: a rounded outer ring, a thin dark groove, then the wheel a hair lower. Every finger hole has a bright chamfer ring of about 2 px, which is what makes the holes read as cut and not printed.
3. The gap is not black. Inside a hole the plate is cream and its upper left third lies in a soft brown grey shade; the darkest line of the picture is the contact line under the lower left of the bezel and the ring round the foot of the hub.
4. The tray's edge is a thin aluminium lip with round corners (about 14 px) that is bright along the lower right and dark along the upper left inside wall, and the floor is the same frosted glass as the fields, darker in a band under the upper and left walls.
5. The dial's shadow does not stop at the tray: it runs down and right across the floor, climbs the lower lip and lies on the page under the tray. The open field's ring is a pale core with a warm spill on both sides, and the chevron of the open row points up.

## Decisions

- The fields and the trays of the rows are built by the shell's own control maker (`src/shell/real/controls.ts`, read, not changed): a row's field is the same field as step 1's, and a tray is cut and lined the same way (role `machineTray` is handed on as a field). So the rows are in the page's four materials by construction.
- A tray is no longer a `well` in the list. It is a pocket (`pocket: true`, `kind: 'box'`, `r` 14) whose height grows with the row's spring, in whole pixels, so the slab is cut with a rolled lip and round corners.
- The open field's ring is one shape `field-focus` and its caret is `field-caret`, both `part: 'rows'`, both lying inside the pocket. The four boxes `focus-n/s/w/e` and `caret` are gone.
- The dial is one object carried by the shape `dial-wheel`. The shapes `dial-centre`, `dial-stop` and `dial-hole-<k>` stay in the list for the logic and are drawn by that object (key `''`).
- `dial-wheel` carries `v: [angle]`, the wheel's turn in radians, clockwise on the page.
- The dial rises as one body. Before it has risen its wheel stands 1.6 px out of the tray's floor (`DIAL_BODY.rest`), which is under the floor of a field (6 px under the page), its hub and its stop are drawn down into it, and its plate is held 0.4 px over the floor. So while the page parts, nothing of the dial shows outside the tray, and the tray opens on a dial lying in its floor. Then it rises to its 40 px and the hub and the stop come up with it.
- The numerals stay `text` shapes of part `type` with keys `data:step2.dial.<d>`. They lie on the plate, 6.2 px under the wheel's top, and are seen through the holes. When the wheel turns it covers them, as on a real dial.
- The shade inside each hole is painted (one instanced disc per hole, multiplied over the plate, turned with the wheel and always facing the key), because a 5 px wall is under what the shadow map resolves.
- The tray is built in `rows.ts` and no longer by the shell's control maker: a dark joint, an aluminium rim 5.6 px wide, a wall that leans in to the floor, a glass floor in vertex-colour shade, and a painted shade on the wall of the light's side. Fields, the focus ring, the caret and the chevrons are still the shell's.
- Row titles are step 2's own style `ROW_TITLE` (inter-600, 26 px) and their helper lines `ROW_HELPER` (inter-400, 20 px), as in the approved step 2 images; the shared `TYPE.label` is as it was (asked by the Builder at 01:23 UTC).
- The tray's depth is painted, because the config holds its real depth at 8 px and the approved tray reads far deeper: the rim is 5.6 px, the wall leans in over 10 px and is shaded on the light's side (`TRAY.wallShade`), and a second copy of the floor (`TRAY.soak`) is multiplied over the floor and over the words lying on it, 0.5 px up, so the dark band under the upper and left wall is as deep as the approved one whatever the sunk glass's fill light does. Measured on the green channel down the column x 1500 of key `step2-dial`: approved 67, 62, 68, 109, 136, 151, 158 every 10 px from the joint; the build 23, 54, 84, 126, 148, 155, 161 before the last softening.
- The tray's rim is a rolled bead in the shared chrome (critic's note on the crank key: the approved rim is glossy and holds a line of light all round); the wall under it is satin aluminium, painted 0.62 on every side (`TRAY.wallLit`) so the wall that faces the light does not burn out.
- The wheel's face is a copy of the shared turned aluminium with a finer cut and a lighter colour (`turnedFine()` in `dial.ts`): it carries the shared material's shader rules, so it is under the studio's law. The housing is satin aluminium, the wheel's edges and hole rims chrome, the stop steel. The hub is a full dome 17 px tall in the shared orange; before it has come up it lies pressed flat in the wheel (`DIAL_BODY.hubFlat`), an orange disc, and swells into its dome as the body rises; no cream ring shows round it.
- The trays carry `tone: 'glass'`, so the prompt words that lie on a tray's floor are set in the shell's on-glass ink; with the tray's old tone they took the soft page ink and read grey under the painted shade (approved: dark and clear).
- For `/root/slot_maker` (asked 01:57 UTC, done 02:03 UTC): `CRANK.gripH` 40 to 52 (the approved grip is about 88 by 54 px). The grip is a capsule, so its reach round the hub is still 138 px and nothing new is touched in the turn (looked at on the sheet of `step2.crank`).
- The crank and its meter stand 18 px further in (`CRANK.hx` FX + PAD + 73, `segX` with it) and the crank's prompt 12 px further in: the tray's rim and wall take 17 px of the 24 px padding, so the base and the first letter stood against the wall (approved: 48 px and 35 px in from the tray's edge). No event moved in time; the cursor's path in the crank's beat follows `CRANK.hx`.
- The floor's shade holds longer under the wall (`TRAY.soak` 0.85, hold 0.8, reach 8) and is as deep under the left wall as under the upper one (`side` 0.8: the shade is taken from the nearer wall on the light's side, not only along the key's direction). MEASURED on the green channel down x 1500 of key `step2-dial`, every 6 px from the rim: approved 46, 67, 58, 63, 56, 86, 109, 128, 139; build 37, 38, 60, 70, 105, 124, 140, 146, 153. Held 6 px shorter than the approved dial tray because the approved crank tray has a far shorter band and the crank's prompt lies under it.
- The hub is a copy of the shared orange under a harder lacquer (`lacquered()` in `dial.ts`: clearcoat 1, coat roughness 0.03, roughness 0.1, ior 1.9), the same colour, under the shared studio rules: the shared orange gave the dome no clear light, and the approved hub holds one. The shared orange itself is untouched.
- A tray is 250 px tall (was 232), as the approved one (MEASURED on `references/approved/step2-dial.png`, column x 1500: rim at y 395, lower joint at y 645): the dial no longer stands against the lower wall, and the rows under an open tray lie 18 px lower, nearer the approved. The slot machine stands 9 px lower and 12 px further in, so it is centred as before and clear of the wall; its prompt stayed where it was (its gap to the knob 64 to 52). No event moved in time.
- A reel's legend is not drawn while its machine is in the floor (under 0.05 of its rise): on the sheet of `step2.slot` at 13.43 s the three legends lay bare on the tray's floor for a few frames while the tray closed.
- Main was red at 8d230d7 for one test that is not of this part; green again from 3a83a25 (the Builder's fix), merged at 68f9dbf.
- The risen dial lays a soft painted shade on the tray's floor on the side away from the key (`castGeometry()` in `dial.ts`, `DIAL_BODY.cast` 0.62, 22 px away, 44 px of fall-off): the sunk glass is filled with light and held almost nothing of the lamp's shadow, and the approved dial stands in a deep soft one. It lies 0.2 px over the floor, under the plate, and is drawn in under the wheel while the dial lies in the floor.
- The crank's prompt line lies 14 px lower, 37 px under the tray's edge (approved: 33 px), out of the deep part of that band.
- The dial stands 136 px in from the tray's padding (`DIAL.cx` 1160), where the approved image has it.
- The cursor's ground now holds the Continue button's cap: the flat cursor used to slide under the cap and go out of sight for 0.2 s before the peel (seen on the sheet of `step2.continue`).
- For `/root/slot_maker` (asked 00:56 UTC, done 01:00 UTC): `CRANK.gripW` 84, `gripH` 40, new `armW` 24; the crank's reach on the cursor is its own number `CRANK.tip` 126, so no event moved. The hub of the crank went 10 px down (`hy` cy + 156) so the wider grip clears the prompt line. `slot-reel-0..2` carry `v: [position]` in legends. The shape `slot-cabinet` has `height: TOP + 20` and the cursor's ground over the cabinet is `TOP + 20`. On this branch alone, where the cabinet is still a stand-in, the stand-in box covers the reel legends (they lie at `TOP + 14`); the real cabinet has them under its glass.

## Acting (recipe 5)

One word for each beat, and the poses that carry it. Times are seconds of the unit.

| Beat | Word | Poses |
| --- | --- | --- |
| `step2.open` | cocky | stands between the rows till 1.06, strolls to the first field (there 1.62), a decided `tap` at 1.74 that lands on the click at 1.88 |
| `step2.dial` | caught out | `startle` at 1.96 as the row opens under it; `jump` at 3.3 when the wheel snaps home; `anticipate` at 4.13 before the third digit; scared in the whip, shocked at the fling, the page's `recoil` where it lands; nervous and a `doubleTake` at 6.6, held to 7.55 |
| `step2.slot` | wary | `rear` at 8.28 as the second row opens, held to 8.70; draws the knob up 12 px (9.03 to 9.11) before the pull; plain while the reels turn, shocked at 11.0 on the wrong date; the page's `flinch` under the coins, scared, runs to the left column |
| `step2.crank` | temper | `dustOff` at 12.76 where it is safe, angry from 13.36, marches back, `stamp` at 13.9 that drives the third field open at 14.0; shocked at 15.22 when the crank runs away; `cower` at 15.60 where it lands, held to 16.22; angry again and back in at 16.32; flat at 16.80, exhausted |
| `step2.continue` | spent | flat and dragging to the button, peels up at 19.80, plain at 20.28, presses at 20.30 |

- No reaction is used twice in the page: tap, startle, jump, anticipate, recoil, doubleTake, rear, flinch, dustOff, stamp, cower.
- Nothing is cued in the half second before a key picture: 1.0 s (the cursor stands still from 0 to 1.06), 3.2 s (nothing between 1.96 and 3.3), 15.2 s (the shock of the runaway moved from 15.17 to 15.22, the old recoil at 15.20 is gone).
- No event of the page moved. MEASURED by listing the film's events before and after: row-open 1.88, 8.20, 14.00; dial-fling 5.58; lever-pull 9.37; coins 11.96; crank-runaway 15.17; flatten 16.80; peel-up 19.80; button-press 20.30. Only footsteps moved.
- At key `step2-rest` the cursor now stands at (1575, 395), between the first and second rows, where the approved image has it (it stood at (1590, 425), half on the second field).

## Main's red test at 02:09 UTC

- After the merge of `origin/main` at 8d230d7, `tests/glass3.test.ts` fails: "orange: expected 4.570085953127007 to be greater than or equal to 4.6". MEASURED on a clean checkout of `origin/main` 8d230d7 with `npx vitest run tests/glass3.test.ts`: the same failure, so it is main's own (the shared orange and the light type changed there). It is not a file of this part. The commit before the merge, ab2fe46, was green (92 files, 1329 tests). Pushed with the merge and reported to the Builder at once.

## Tray rim and walls at 02:35 UTC

- The tray's wall is the shared `cardSeal` (matt grey), no longer the satin aluminium: under the key the metal burnt white on the right wall and went dark grey on the lower one, where the approved image has both near the floor's tone. The upper and left walls keep their painted shade (`TRAY.wallShade` 0.55, `TRAY.wallLit` 1).
- The rim is 8 px wide (was 5.6) and the joint outside it 0.6 px (was 0.9): the approved rim is a wide soft band and has no black hairline round it.
- The line beside Continue (`note`) takes the row helper style (inter-400 20) in place of the shared 18 px helper: in the approved `step2-rest` it is as large as the row helpers. `TYPE.helper` is unchanged.
- 02:45 UTC: the tray's rim is the shared satin aluminium, no longer chrome: chrome mirrored the dark room as two black edges round one hard line, the approved rim is a soft satin band. The dial's digits are 22 px (were 20): the approved digits are heavier, and there is no bolder cut of the face than inter-600.
- 02:50 UTC: the shade under the upper and left walls reaches further (`TRAY.soak` soak 0.88, hold 1.1, reach 11; was 0.85, 0.8, 8). MEASURED on column x 1500 of key `step2-dial`, green channel every 6 px down from the rim: approved 46 67 58 63 56 86 109 128 139 149 152 158 158, build 52 53 52 55 60 91 115 126 137 145 151 156 159 (before: 46 54 61 72 105 125 140 146 153 157 161 164 165).
