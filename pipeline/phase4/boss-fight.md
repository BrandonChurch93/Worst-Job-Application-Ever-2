# Boss fight: notes of the build agent `boss_fighter`

Branch `agent/boss-fight`. Parts: `boss-weapons`, `verify-card`, `health-bar`, `acting-boss`.

## What the approved images show that a quick look misses

Looked at `references/approved/boss-fight.png` at full size in crops (health bar left and right, verify card, the darts, the spark, the slabs), beside `boss-down.png`, `boss-stages.png` and `page-look.png`.

1. Highlight. On the health fill the highlight is one soft band along the upper third of the capsule, not a line on its edge; on a red slab it is a narrow bright line on the upper left bevel only, and the face stays matt. The dart has no highlight at all: it is a flat white facet, brighter than the page by a small step, and its light shows as a warm spot on the paper under it, about 30 px wide.
2. Bevel. The glass card's bevel is about 10 px wide and reads as a lighter band inside a thin bright rim of 2 px. The slab's bevel is about 6 px and fully round. The health track's rim is 2 to 3 px of polished metal that rolls into the track; the fill's own shoulder is about 3 px.
3. Gap. Between the fill and the track's rim there is a dark line under 1 px wide, darker below the fill than above it. The track's empty floor is brushed steel two stops darker than the rim, with streaks along its length. Under the checkbox cap the seam is a dark hairline, not a moat.
4. Edge. The checkbox is an orange cap in a thin pale frame that stands a hair above the glass and throws a short shadow to the lower right. The tick is a raised white stroke with round ends, about 5.5 px wide. A slab in flight throws a soft shadow about 25 px to the lower right; a landed slab's shadow touches it.
5. The fight. Each dart is the head of the cursor's arrow, about 26 px long, with a hair thin trail that fades behind it and a small dark shadow about 14 px to the lower right, so it reads as flying above the page. The spark is small: a white core about 10 px, a dozen thin streaks 20 to 50 px long, a few loose flecks, almost no halo.

## Decisions

- One click fires a volley of four darts, 0.085 s apart, so the film has the stream of darts the approved image shows. Each dart does 0.75, so a click still does 3 and the count of clicks per phase is unchanged (9, 12, 17). A pop-up takes 12 darts, which is still three clicks. A dart only hurts the boss in the phase it was fired in. `src/boss/plan.ts`: `DART.volley`, `DART.gap`, `DART.damage`, `POPUP.hp`.
- The film's clicks near the key picture are moved: 12.01 s and 12.37 s (were 11.88 s and 12.54 s), and the cursor's dodge runs 11.5 to 11.95 s (was 11.85 to 12.3 s), so at 12.5 s the cursor stands still, five darts are in the air, the first has just struck, and slab 1 is in flight. The key's time does not move.
- Events after the change, measured in the film: `slab-fire` 9.86 s, `popup` 15.92 s (was 15.88 s), `session-expired` 22.30 s (was 22.26 s), `power-down` 27.23 s (was 27.13 s), `button-press` 30.50 s. All inside their beats with the 0.25 s tolerance.
- The draw list of the weapons is new: one shape for a dart (`dart-N`), one for a spark (`spark-N`), one for a muzzle flash (`muzzle-N`, new), the damage marks of a pop-up are scorch marks. Per frame numbers go through `v`.
- The health track slides in as a tray above the page and seats into its pocket in the last 0.2 s. While it slides it is not a pocket, so the page's slab is not rebuilt each frame.
- The tick is one shape (`verify-tick`), a raised stroke shown up to a point.
- The fill's length changes by moving the two ends of one mesh, in `pose`.
- The glass shield stops darts. Darts that come from the left stop on the plane 288 px left of the boss's centre, for 118 px up and down (`SHIELD` in `src/boss/plan.ts`), and their sparks sit on the glass at z 72. Before, a dart flew through the plate and its spark burned on the body behind it. The plate leans back, so its lower edge is at 296 px and its upper edge at 208 px; 288 px is where a dart at z 30 to 34 meets it.
- Darts fly at z 30 to 34 (`DART_Z`), the height of the cursor's tip when it fires. They pass under the cannon mouths (z 46) and over a landed slab (z 16).
- The body is drawn through `rigOf` in `src/pages/step4/index.ts`: a cast of `fightRig` that passes a sixth argument, `{ flash, hurt }`. `flash` (0 to 1) is the shield's glint when a dart lands, `hurt` (0 to 1) is the soot on the cap as the health falls. A body that takes five arguments ignores it.
- Acting. The film's cues are in `ACT` of `src/pages/step4/script.ts`; the cues that also play live are in `HORROR` and `REALLY_TAKE` of `src/pages/step4/index.ts`. Every cue sits two frames or more after the event it answers, every hold is 0.4 s or longer, and no cue falls in the half second before a key picture (tested in `tests/boss-fight.test.ts`).
- The spark is small and short: a star that bursts for the first 0.08 of its 0.3 s and is gone by the end, a halo, and 14 needle flecks. The approved spark is no bigger than the dart that made it.

## Agreed with `boss_modeller`

- The cannon mouth is 92 px from the cannon's centre along the barrel, at the height the body gives (`MUZZLE` in `src/boss/body.ts`, the modeller's, read by my files since 02:12 UTC; first my own copy at 70 px and z 46, then 92 px and z 48.5, then z 82.5 and z 108.5 as the body grew taller). The muzzle flash is the shape `muzzle-N`, mine, and sits at that mouth.
- The barrels aim. I keep a point in the fight (`look`: the cursor's centre eased over 0.25 s), pass it as `aim` in the sixth argument of `fightRig`, and fire slabs and flash from the same formula the body turns its barrels with: rot = atan2(cy - aim.y, cx - aim.x) held inside 0.7 rad either way, mouth = (cx - 92 cos rot, cy - 92 sin rot). Since 02:12 UTC `muzzle()` in `src/boss/fight.ts` is the modeller's `muzzleAt` with my `look`, so mouth and barrel cannot drift apart; the ease is `LOOK_EASE` in `src/boss/plan.ts`.
- Darts from the left stop on the shield plane above; sparks on the glass at z 60. The shield now stands on the page, its glass from z 10 to z 80 at that plane (it leaned before, and the sparks went from z 72 to 100 to 60 with it).
- I pass `aim`, `flash` and `hurt`.
- The wider stance (`FOOT_OFF`) and the cannons' places (`CANNON_OFF`, soon (-10, 110) either way) come from the modeller's export; the times of the unfold stay.
- Draw calls: the Builder wants 520 or less at high at the key for the two of us together. Told the modeller my share and that both of us merge.

## The key picture fitted (round 2, the Builder's point 1)

The approved picture has the health near 55 percent, three slabs in the air at three heights, a stream of darts and a spark on the glass. The key stays at 12.5 s; the fight changed so that this is what the film has there, and the live fight got the same rules.

- Phases end at 51, 25 and 0 percent of the health (were 75, 40, 0): `THRESHOLD`. Each dart does 1.9, 0.56 and 0.53 in the three phases (`DART.damage`), so the clicks a phase takes stay about as they were. The health can fall no faster than `FLOOR` (3.9, 4, 3 s for a phase) and a still visitor is taken down over `CAPS` (12.5, 14.5, 13 s), so the narrator's `boss-slow` still fires for one who does nothing.
- In the first phase the first attack is one slab ("Field cannot be blank"), every later attack is a salvo of three, 0.18 s apart: the middle one at the cursor, one fanned 0.3 rad above from cannon 0, one below from cannon 1 (`SLAB.salvo`, `salvoGap`, `fan`). The cursor has one lane to step out of, and the tests of fairness and the bots pass unchanged.
- A slab stops before the verify card (`Arena.keep`), so the card's words are never covered.
- A slab is lobbed: it leaves the mouth at the mouth's height, rises to z 112 in 0.12 s to clear the top of the shield (z 80), and is down at its flying height (z 14) after 0.5 s. Before, it flew through the glass. Attacks of the first phase come every 1.4 s (was 1.49), so at the key the last slab of the salvo is clear of the shield.
- The film's clicks in `boss.slabs`: every 0.34 s from 9.82 to 12.3 s, then one at 15.27 s. The snap aside is at 11.78 s, two frames after the first slab of the salvo.
- Events of the film, measured (`npx vitest run` on a scratch test that prints `stage.events`): `checkbox` 3.80, `button-crack` 6.11, `unfold` 6.71, `slab-fire` 9.86, 11.72, 11.90, 12.09, 14.25, 14.43, 14.61, 19.49, `slab-drop` 11.30, 12.73, 12.92, 13.13, 15.07, 15.18, 15.59, 20.24 (this one hits the cursor, the only hit of the film), `popup` 15.93, 17.73, 18.73, `session-expired` 22.30, `power-down` 27.23, `button-press` 30.50, `page-turn` 31.50. All inside their beats.
- At the key (12.5 s): three slabs in flight, five darts on screen, sparks on the glass, the fill at 57.7 percent of its length. Tested in `tests/boss-fight.test.ts`.

## The darts (round 2, the Builder's point 2)

The brief says small hot glints with a long thin tail and a warm pool on the paper; the kit says tiny glowing white arrows. Both are kept: the dart is a white arrowhead 26 px long (was 34) under a small four pointed glint, with one mesh for its two tails (a bright one of 140 px and a hair of 520 px) and a warm pool on the paper where its shadow falls. The pool takes blue and a little green out of the paper (a subtracting blend), because light added to paper that is already near white does not show. Darts fly at z 17 to 21 (was 30 to 34), so the shadow sits close to the dart as in the approved picture. The pool and the dart's own small shadow are one mesh that filters what lies under it (the picture under it times one minus the pool's colour), so it can never make a value below nothing; a subtracting blend did, over a red slab (9 invalid values in one still, 0 now).

## Draw calls (round 2, the Builder's point 3)

MEASURED with `npm run build && npm run counts -- --key boss-fight --format hd --live high`, body on `main` merged in: 628 draw calls before, 328 after. Of the 628, 290 were the shadow passes of two lamps (`emitter-0`, `emitter-1`), six faces each, and 189 were the weapons.

- The renderer has 6 lamps at high, 2 of them with shadows, and a lamp that asks for no shadow still lands in a shadow slot when more than 4 lamps are lit. Five darts, the sparks and a flash made 6 lamps, so every caster of the scene was drawn twelve more times. Now one dart gives off true light (the first of the stream), one spark (the newest, with the heat of all that burn) and each muzzle flash: three lamps at most in the film, so no shadow slot is used at high or at medium (4 lamps, 1 with a shadow). The other darts show their light as the pool on the paper.
- A dart no longer casts a real shadow: its shadow is part of the pool's mesh. A dart is 4 meshes and 4 calls (was 5 meshes and 19 calls).
- My share at the key at high: `boss-weapons` 47 calls, `verify-card` 15, `health-bar` 7. The body is 203.
- A single still reports more (562 for the key at `draft`): after the shadow maps are sized, each lamp with a shadow draws its map once even when it is dark (`needsUpdate` in `src/core/renderer.ts`, `resize`). That is my reading of the code, not a measurement; `counts` draws the scene after it has settled.

## The cursor at `boss-down` (round 2, the Builder's answer of 01:49Z)

The approved key shows a whole arrow with its black edge, lower left of the fallen button. The shared state `exhausted` is the melted cream form with no edge (melt 0.6, right for that state by the approved sheet `cursor-acting`), so the key decides the moment: the page calls `act('plain')` at the power-down and `act('exhausted')` only when the wreck is still, 2 s later (29.23 s in the film, 0.23 s after the key). The film adds a `duck` at 27.31 s, two frames after the power goes. `boss.press` then reads: stands whole, sags, drags itself on, presses. `button-press` stays at 30.50 s. The same two calls play in the live site.

## The health bar (round 2)

Beside the approved picture the bar was thin and its fill a flat strip with a wide white band. The track is 30 px tall (was 26), the fill is 22 px (was 16) and is one round back from edge to crest, 6.4 px high, so the light lies on it as a narrow band and its lower side goes dark; the track's floor is a stop darker. The label is set in the 600 weight at 23 px, as the approved label is heavier than the page's field labels.

## Round 3 (after 01:55 UTC)

- A fired slab grows out of the mouth: for the first 0.1 s its tail end sits at the mouth and the block slides out along its line of flight, then its centre falls back onto the flight path by 0.4 s. Before this it grew from its centre and stood across the barrel.
- The fired slabs and the banner wear the part's own red lacquer (`LACQUER` in `src/pages/step4/real/boss-weapons.ts`), made through `studio()`: colour 0x900808, no specular on the base, clear coat roughness 0.08, environment 1 (first cut: 0x9a0808 with environment 0.4, clean but matt; the haze came from the rough base layer's reflection, so with that off the coat can reflect at full strength and the edges turned to the studio's box of light carry a bright line). Step 1's red (environment 1.05) put a grey veil on the face in this page's stills: MEASURED median of the slab faces at the key (the approved image has 118, 13, 13; step 1's red gave 135, 45, 44; the lacquer gives 119, 25, 25). The geometry is still step 1's `makeSlab`. Tried and dropped: a rougher base with full specular, which showed the crown's facets as creases to the corners.
- The health fill has a flat top with a soft shoulder (`HEALTH.shoulder` 3.4, `HEALTH.crown` 0.3) in place of the round back: the round back carried a broad pale band, the approved fill is flat with a thin light line on its upper edge.
- The checkbox frame is 1.8 px wide and 2 high (was 3 and 2.6): in the still the frame read as a white ring round a small cap. Tried and dropped: a domed cap, which a swept square can only make as a hip roof with four creases.
- After the Builder's change of the shared orange (0xc74c00, reflection cut to a quarter) the fill, the cap of the checkbox and the pop-up buttons lost their pale haze with no change of mine.
- A slab in flight rides with its underside at z 24 (was 14): the darts fly at z 17 and went through the block; now they pass under it.
- Pop-ups stand clear of the shield. The body's shield now covers x - 306 to x - 198 and 236 px of height; the two lower pop-ups ended 46 px under its glass. Each pop-up is now as wide as its own title needs, and the two lower ones end at x 1240 (100 px left of the top one, which sits above the shield at home). In the last phase the top place is not used, since the boss then walks up under it; the banner closes any pop-up still open as before. MEASURED: film events unchanged (popup 15.93, 17.73, 18.73; session-expired 22.30; power-down 27.23; button-press 30.50), from `npx vitest run tests/zz-scratch.test.ts` (local file).
- The health track: its rim is the shared satin aluminium, 2.2 px wide and 0.6 proud (was chrome, 2.6 and 0.9, which read as a white outline), and its floor is a shallow gutter (2 px deeper at the middle than at the walls) in a darker metal (0.15, 0.166, 0.168) with finer brushing, so the shade grades from the upper wall down as in the approved image. MEASURED mean of the empty track in the `boss-down` still: approved 69, 76, 77; before 102, 103, 105; after the colour change 91, 94, 93.
