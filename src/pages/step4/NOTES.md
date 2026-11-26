# Step 4, Submit: decisions

Unit `boss`, page `step4`. Logic in `src/pages/step4/`, the boss in `src/boss/`, tests in `tests/boss.test.ts`.

## The form

- Left column at x 128, the shell's content line at y 336: the verify card, 680 wide. Inside it one column with even gaps: title, body, the checkbox row (a 44 px box and its label), a rule, and the answer line.
- Before the tick the card ends under the checkbox row and the fine print sits right under it, so the page at rest has no empty band. The layout tree holds both: `verify-card` and `verify-fine` in the state `rest` (the closed card, what the page at rest draws, so the still sits on the tree), and `verify-card-open` with the rule, the answer and `verify-fine-open` in the states `confirmed-film`, `doubt` and `confirmed-live`. On the tick the card opens downward in 0.3 s: for those 0.3 s the closed card, its fine print and the rule that draws itself carry `moved: true`; from then on the open card is drawn from the tree as it stands. The health bar carries `moved: true` while it slides in.
- The answer line holds three texts in the same place, one for each state: `confirmed-film`, `doubt`, `confirmed-live`. In the film the tick is answered with `copy:step4.verify.confirmedFilm`. In the live site it is answered with `doubtLive` for 1.7 s and then `confirmedLive`.
- The fine print is helper text under the card, on the card's left edge.
- Submit is a real shell button, 288 wide, in its socket at the bottom centre of the page (960, 960). It is the control the boss grows out of.
- Once the button has torn loose its socket is a hole, not a control (blockout round 2): a real opening in the page (`well`), a narrow lip 5 below the surface and a pit 150 deep in the darkest tone, so its floor lies in its own shadow. Nothing of it stands above the page. Eight thin cracks of uneven length run out from its rim, two or three bent pieces each, three of them forked.
- The health bar sits where a subline would sit (step 4 has no subline in the copy): the label `copy:step4.bossHealthLabel` and a recessed track with a raised fill, the whole width of the content. It is a layout node with the state `fight`, so the layout check sees it.
- `copy:step4.defeated` is centred under the fallen button, state `down`.
- The three pop-ups stand in one column beside the card, on the card's top line, with even gaps, between the cursor's side of the page and the boss.
- The six error slabs, the three pop-ups with their buttons and the banner are layout nodes in an over layer (state `fight`), so every word is in the type register and the check sees their sizes. They are drawn by the fight where they are in play. The slab words are set at 26 px, the size of a button label, so they can be read in flight.

## The beats

| Gag | Starts | Ends by itself |
| --- | --- | --- |
| `boss.verify` | page start | the box ticks itself after `live.skipLinkAfterSeconds` |
| `boss.unfold` | 1.6 s after the tick in the film. In the live site when the pointer comes to Submit, 2.2 s after the tick at the earliest, and by itself 7 s after the tick (2.2 s if the box ticked itself) | 3.6 s, authored |
| `boss.slabs` | the boss is whole | health 75, or 12 s |
| `boss.popups` | health 75 | health 40, or 14.5 s |
| `boss.lastStand` | health 40 | health 0, or 13.5 s |
| `boss.collapse` | health 0 | 2 s, authored |
| `boss.press` | the button lies on the page | it presses itself after `live.skipLinkAfterSeconds` |

- The fight is a state machine in `src/boss/fight.ts`. It has no drawing code and no library. The longest fight is 12 + 14.5 + 13.5 = 40 s, inside `live.boss.maxSeconds`.
- The boss tires: each phase has a health ceiling that falls to the phase's end in its last seconds. A visitor who does nothing still sees every phase.
- The boss also has a health floor that falls through each phase in 4, 4 and 3 s, so the fastest clicker still sees each phase for that long. The film never touches it.
- One click is one volley of four darts, 0.085 s apart, each worth 0.75, so a click is worth 3 as before (Phase 4: the approved picture shows a stream of darts). A dart leaves the cursor's tip and flies at the boss, so a click anywhere counts. This keeps the fight fair for a wrong pointer and keeps the pointer free at all times: the page never takes control.
- A slab aims at where the cursor was when the cannon wound up (0.45 s before it fires), flies flat and upright with a small tilt so its words stay readable, as in the approved picture, and stops. A hit scorches the cursor, knocks it back and is followed by a dust off. The scorch is the cursor body's own and heals by itself. After a hit the cursor is safe for 1.2 s.
- A pop-up blocks darts. Three clicks (twelve darts) break it; it shows one scorch mark for each click it has taken. A click on one of its buttons closes it at once (event `popup-close`, silent) and fires no dart.
- The last stand: 0.3 s after health 40 the boss emits `session-expired`, raises the banner `copy:step4.errorSlabs.2`, takes 10 health back, then fires faster and raises pop-ups again.
- The banner stands above the boss with a gap, on the content line. The boss holds still under it until it is gone. It comes and goes at its full size with its words on, like the pop-ups.
- In the first phase the boss walks a small loop round the place the approved picture `boss-fight` has it.
- Pop-ups fill their column from the top. A pop-up rises out of the page and sinks back into it at its full size with its words on; a spent slab sinks the same way. Nothing on the page is ever a blank plate.
- A dart is the head of the cursor's arrow, white hot, with a hair thin trail, its light on the paper under it and its shadow beside it. A dart that comes from the left stops on the glass shield (`SHIELD` in `src/boss/plan.ts`: the plane 288 px left of the boss's centre, 118 px up and down); its spark sits on the glass at z 72. Any other dart stops on the body's ellipse. A dart only hurts the boss in the phase it was fired in.
- One attack at a time from the pop-ups on (blockout round 1). A pop-up rises only when no slab is in the air or wound up; a spent slab sinks after 0.7 s in place of 1.5 s, and a slab that lies on the page when a phase changes or a pop-up rises sinks at once. No pop-up rises when one more dart would end the phase. A wind-up in progress is dropped when a phase changes.
- The pop-ups escalate (blockout round 2). They rise in the order second, third, first: the second stands level with the boss, in the line of fire. The gaps between them shrink: 1.8 s, then 1 s. The boss fires no slab in this phase until the third pop-up is up (or 6 s have passed), then winds up 0.3 s after it, and its slabs fly at 1150 in place of 880. So the first shield stands alone, the next come faster, and the third comes with the slab.
- `session-expired` sinks every pop-up and slab, so the banner, the boss and the bar that jumps back are alone on the page. From 0.7 s into the banner the cursor sags (`exhausted`), its "really", and holds it until the banner goes; then it is `angry` again and winds up (`anticipate`). After the banner the boss throws nothing for 2 s. At health 41 the boss is spent: pop-ups and slabs sink and nothing more is thrown.
- The film from 16 to 27 s: the first pop-up at 15.88, alone, shot down with three slow darts by 17.50; the second at 17.68, shot down with three fast darts by 18.31; the third at 18.68, the cursor shoots under it and the bar falls from 75 to 48; the slab at 19.44 hits the cursor at 20.23, shaken off by 22.1; three more darts bring the bar to 40 at 21.89. Banner 22.18 to 23.69, no click from 21.5 to 24.0 while the cursor holds. Then a bare page: 17 darts at gaps that shrink from 0.42 s to 0.095 s while the cursor walks at the boss above the empty socket, never across it. The bar falls 3, 6, 6, 12 and 15 points in the half seconds from 24.25 on.
- From `boss.collapse` on nothing can hit the cursor: slabs, pop-ups and darts are cleared in the same step as `power-down`. `done()` waits for the cursor to be whole.
- `boss-slow` is emitted once, in the live site only, when the fight has run `live.bossSlowSeconds` and the boss is above half its health. The brief says "once at `live.bossSlowSeconds`"; the kit (`kit/03-METHOD.md`, the live site) adds "with the boss above half its health". The kit wins.
- `skip()`: before the button breaks out, the button is pressed in its socket. After that the boss is beaten on the spot, collapses and presses itself. Longest time from skip to the next page, measured in the tests: under `live.controlTakenMaxSeconds`.

## The unfold, with what step 4 has

- Legs: four capsules from under the cap.
- Cannons: the progress buttons of steps 1 and 2 leave the header and fly to the boss. Their places in the header stay empty until the page is left.
- Shield: step 4 has no input field, so a glass plate slides out from under the body to its place in front of the boss.
- Plates: two halves of the button's own socket ring.

## The film

- The pointer path and the clicks are in `src/pages/step4/script.ts`, a pure function of time. Events measured in the film after Phase 4's volley and shield: `checkbox` 3.80 s, `button-crack` 6.11, `unfold` 6.71, first `slab-fire` 9.86, first `popup` 15.92, `session-expired` 22.30, `power-down` 27.23, `button-press` 30.50. Where the lines above give other times for the pop-ups and the banner, they are the Phase 2 times, up to 0.17 s earlier.
- The cursor is hit twice in the film, at 14.13 s and 20.23 s, and is whole again before the collapse.
- After the tick the cursor steps to the right inside the card so the answer under the rule can be read, then goes to press Submit. The button cracks out of its socket as the cursor reaches it.
- During the collapse the cursor drags itself to the lower left of the fallen button, where the approved picture `boss-down` has it. In `boss.press` it drags itself the last steps onto the button's left end and presses there, so the word on the button and the line under it stay readable the whole time.

## Events

Named as the cue where there is one: `checkbox`, `button-crack`, `unfold`, `dart-fire`, `dart-hit`, `slab-fire`, `slab-drop`, `popup`, `power-down`, `button-press`. Without a cue of their own: `session-expired` (the beat's event), `popup-close`, `boss-slow` (the narrator's trigger).

`src/audio/cues.ts` on `main` lists the boss cues since the sound builder's table was merged, so `NEEDS.patch` is gone. In that table `session-expired` plays the `popup` cue, and the narrator's live lines `boss.verify` and `boss.slow` hang on the events `checkbox` and `boss-slow`.

## The cursor's ground

The cursor stands on what is under its tip (`cursor.setGround`): 12 on the verify card and on a raised pop-up, 14 on Submit in its socket, 16 on a slab that has landed and on the fallen button. A slab in flight passes over it.

## Phase 4: the parts made real

Makers: `src/pages/step4/real/boss-weapons.ts`, `health-bar.ts`, `verify-card.ts`. Why each looks as it does is in `pipeline/phase4/boss-fight.md`; how each is made is in `assets-src/boss-fight/RECIPE.md`.

The numbers in `v`:

| Shape | `v` |
| --- | --- |
| `fired-N` | 0: scale while it leaves the mouth (0 to 1 in 0.1 s); it leaves at the mouth's height and comes down to its flying height in 0.26 s. 1: seconds since it landed (9 in flight). 2: seconds in flight (9 once landed) |
| `banner-up` | 0: scale, 1: seconds since `session-expired` |
| `popup-up-N` | 0: how far it is up (0 to 1), 1: clicks it has taken, 2: seconds since it began to sink (9 before) |
| `popup-up-N-button-J` | 0: how far it is up |
| `popup-up-N-chip-M` | 0: the seed of the scorch mark |
| `dart-N` | 0: its first 0.08 s as 0 to 1 (the trail grows out) |
| `spark-N` | 0: its life as 0 to 1 (0.3 s), 1: its number, the seed of its flecks |
| `muzzle-N` | 0: its life as 0 to 1 (0.16 s), 1: its number |
| `health-track` | 0: how far the tray is lifted above its seat, in px (only while it comes in) |
| `health-fill` | 0: the full length of the fill, in px |
| `verify-box` | 0: seconds since the tick |
| `verify-tick` | 0: how much of the stroke is drawn (0 to 1), 1: seconds since the tick |
| `verify-rule` | 0: its full length, in px |

The acting, beat by beat (the word a stranger should say, and what carries it):

| Beat | Word | Poses |
| --- | --- | --- |
| `boss.verify` | doubt | tiptoes in (`nervous`), flinches off the box at 2.72 s, stands off and sweats 3.05 to 3.45 s, winds up 3.36 s, taps 3.72 s so the strike is the tick at 3.8 s, struts off (`confident`), double take at the answer 4.7 s |
| `boss.unfold` | horror | `recoil` and `shocked` on the crack, a jump back, `rear` two frames after the body opens, `cower` under the cannons, `scared` from 2.3 s, then it steels itself at 8.7 s |
| `boss.slabs` | fight | `confident`; a `snap` aside at 11.78 s, two frames after the first slab of the salvo of three is fired; stands its ground and fires through the key |
| `boss.popups` | anger | `angry` from the phase change; the one hit of the film at 20.24 s, knocked back, dust off |
| `boss.lastStand` | really | double take two frames after the banner, sags (`exhausted`) from 0.7 s and holds 0.8 s, then `fume` and `angry` at 1.5 s, and the rush |
| `boss.collapse` | spent | `exhausted`, drags itself to the button and stands 0.9 s |
| `boss.press` | done | gathers itself 29.45 s, climbs on, drops its weight on the button (`stamp` at 30.42 s, flat at 30.5 s) |

The cues the page gives itself (`rear`, `cower`, the double take and the `fume` at the banner) play in the live site too. The others are the film's, in `ACT` of `script.ts`.

The fight after the key was fitted (numbers in `src/boss/plan.ts`): phases end at 51, 25 and 0 percent; a dart does 1.9, 0.56, 0.53 by phase; the first attack is one slab, later attacks of the first phase are salvos of three (0.18 s apart, fanned 0.3 rad); slabs stop before the verify card; the barrels aim at `fight.look`, the cursor's centre eased over 0.25 s, and slabs and flash leave from the mouth `muzzle()` gives. The film's events and the key are in `pipeline/phase4/boss-fight.md`.
