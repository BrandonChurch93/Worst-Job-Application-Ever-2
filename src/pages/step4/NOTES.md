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
- One click is one dart. A dart leaves the cursor's tip and flies at the boss, so a click anywhere counts. This keeps the fight fair for a wrong pointer and keeps the pointer free at all times: the page never takes control.
- A slab aims at where the cursor was when the cannon wound up (0.45 s before it fires), flies flat and upright with a small tilt so its words stay readable, as in the approved picture, and stops. A hit scorches the cursor, knocks it back and is followed by a dust off. The scorch is the cursor body's own and heals by itself. After a hit the cursor is safe for 1.2 s.
- A pop-up blocks darts. Three darts break it. A click on one of its buttons closes it at once (event `popup-close`, silent) and fires no dart.
- The last stand: 0.3 s after health 40 the boss emits `session-expired`, raises the banner `copy:step4.errorSlabs.2`, takes 10 health back, then fires faster and raises pop-ups again.
- The banner stands above the boss with a gap, on the content line. The boss holds still under it until it is gone. It comes and goes at its full size with its words on, like the pop-ups.
- In the first phase the boss walks a small loop round the place the approved picture `boss-fight` has it.
- Pop-ups fill their column from the top. A pop-up rises out of the page and sinks back into it at its full size with its words on; a spent slab sinks the same way. Nothing on the page is ever a blank plate.
- A dart is a small arrow with a short trail, the stand-in for the kit's tiny cursor dart.
- One attack at a time from the pop-ups on (blockout round 1). A pop-up rises only when no slab is in the air or wound up; a spent slab sinks after 0.7 s in place of 1.5 s, and a slab that lies on the page when a phase changes sinks at once. No pop-up rises when one more dart would end the phase. A wind-up in progress is dropped when a phase changes.
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

- The pointer path and the clicks are in `src/pages/step4/script.ts`, a pure function of time. Events measured with `npx vitest run tests/boss.test.ts`: `checkbox` 3.80 s, `button-crack` 6.11, `unfold` 6.71, first `slab-fire` 9.86, first `popup` 15.88, `session-expired` 22.18, `power-down` 27.06, `button-press` 30.50.
- The cursor is hit twice in the film, at 14.13 s and 20.23 s, and is whole again before the collapse.
- After the tick the cursor steps to the right inside the card so the answer under the rule can be read, then goes to press Submit. The button cracks out of its socket as the cursor reaches it.
- During the collapse the cursor drags itself to the lower left of the fallen button, where the approved picture `boss-down` has it. In `boss.press` it drags itself the last steps onto the button's left end and presses there, so the word on the button and the line under it stay readable the whole time.

## Events

Named as the cue where there is one: `checkbox`, `button-crack`, `unfold`, `dart-fire`, `dart-hit`, `slab-fire`, `slab-drop`, `popup`, `power-down`, `button-press`. Without a cue of their own: `session-expired` (the beat's event), `popup-close`, `boss-slow` (the narrator's trigger).

`src/audio/cues.ts` on `main` lists the boss cues since the sound builder's table was merged, so `NEEDS.patch` is gone. In that table `session-expired` plays the `popup` cue, and the narrator's live lines `boss.verify` and `boss.slow` hang on the events `checkbox` and `boss-slow`.

## The cursor's ground

The cursor stands on what is under its tip (`cursor.setGround`): 12 on the verify card and on a raised pop-up, 14 on Submit in its socket, 16 on a slab that has landed and on the fallen button. A slab in flight passes over it.
