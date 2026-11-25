# Step 4, Submit: decisions

Unit `boss`, page `step4`. Logic in `src/pages/step4/`, the boss in `src/boss/`, tests in `tests/boss.test.ts`.

## The form

- Left column at x 128, the shell's content line at y 336: the verify card, 680 wide. Inside it one column with even gaps: title, body, the checkbox row (a 44 px box and its label), a rule, and the answer line.
- The answer line holds three texts in the same place, one for each state: `confirmed-film`, `doubt`, `confirmed-live`. In the film the tick is answered with `copy:step4.verify.confirmedFilm`. In the live site it is answered with `doubtLive` for 1.7 s and then `confirmedLive`.
- The fine print is helper text under the card, on the card's left edge.
- Submit is a real shell button, 288 wide, in its socket at the bottom centre of the page (960, 960). It is the control the boss grows out of.
- The health bar sits where a subline would sit (step 4 has no subline in the copy): the label `copy:step4.bossHealthLabel` and a recessed track with a raised fill, the whole width of the content. It is a layout node with the state `fight`, so the layout check sees it.
- `copy:step4.defeated` is centred under the fallen button, state `down`.
- The six error slabs, the three pop-ups with their buttons and the banner are layout nodes in an over layer (state `fight`), so every word is in the type register and the check sees their sizes. They are drawn by the fight where they are in play.

## The beats

| Gag | Starts | Ends by itself |
| --- | --- | --- |
| `boss.verify` | page start | the box ticks itself after `live.skipLinkAfterSeconds` |
| `boss.unfold` | 1.6 s after the tick in the film, 2.8 s in the live site | 3.6 s, authored |
| `boss.slabs` | the boss is whole | health 75, or 12 s |
| `boss.popups` | health 75 | health 40, or 14.5 s |
| `boss.lastStand` | health 40 | health 0, or 13.5 s |
| `boss.collapse` | health 0 | 2 s, authored |
| `boss.press` | the button lies on the page | it presses itself after `live.skipLinkAfterSeconds` |

- The fight is a state machine in `src/boss/fight.ts`. It has no drawing code and no library. The longest fight is 12 + 14.5 + 13.5 = 40 s, inside `live.boss.maxSeconds`.
- The boss tires: each phase has a health ceiling that falls to the phase's end in its last seconds. A visitor who does nothing still sees every phase.
- One click is one dart. A dart leaves the cursor's tip and flies at the boss, so a click anywhere counts. This keeps the fight fair for a wrong pointer and keeps the pointer free at all times: the page never takes control.
- A slab aims at where the cursor was when the cannon wound up (0.45 s before it fires), flies along its long axis and stops. A hit scorches the cursor, knocks it back and is followed by a dust off. The scorch is the cursor body's own and heals by itself. After a hit the cursor is safe for 1.2 s.
- A pop-up blocks darts. Three darts break it. A click on one of its buttons closes it at once (event `popup-close`, silent) and fires no dart.
- The last stand: 0.3 s after health 40 the boss emits `session-expired`, raises the banner `copy:step4.errorSlabs.2`, takes 10 health back, then fires faster and raises pop-ups again.
- From `boss.collapse` on nothing can hit the cursor: slabs, pop-ups and darts are cleared in the same step as `power-down`. `done()` waits for the cursor to be whole.
- `boss-slow` is emitted once, in the live site only, when the fight has run `live.bossSlowSeconds` and the boss is above half its health. The brief says "once at `live.bossSlowSeconds`"; the kit (`kit/03-METHOD.md`, the live site) adds "with the boss above half its health". The kit wins.
- `skip()`: before the button breaks out, the button is pressed in its socket. After that the boss is beaten on the spot, collapses and presses itself. Longest time from skip to the next page, measured in the tests: under `live.controlTakenMaxSeconds`.

## The unfold, with what step 4 has

- Legs: four capsules from under the cap.
- Cannons: the progress buttons of steps 1 and 2 leave the header and fly to the boss. Their places in the header stay empty until the page is left.
- Shield: step 4 has no input field, so a field-sized plate slides in from the right edge of the page.
- Plates: two halves of the button's own socket ring.

## The film

- The pointer path and the clicks are in `src/pages/step4/script.ts`, a pure function of time. Events measured with `npx vitest run tests/boss.test.ts`: `checkbox` 3.80 s, `button-crack` 6.11, `unfold` 6.71, first `slab-fire` 9.86, first `popup` 16.20, `session-expired` 22.10, `power-down` 27.34, `button-press` 30.50.
- The cursor is hit twice in the film, at 14.07 s and 19.60 s, and is whole again before the collapse.

## Events

Named as the cue where there is one: `checkbox`, `button-crack`, `unfold`, `dart-fire`, `dart-hit`, `slab-fire`, `slab-drop`, `popup`, `power-down`, `button-press`. Without a cue: `session-expired` (the beat's event), `popup-close`, `boss-slow` (the narrator's trigger).

`src/audio/cues.ts` does not list the boss cues yet. `NEEDS.patch` adds them.
