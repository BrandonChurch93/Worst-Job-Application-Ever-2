# Site controls: notes of /root/site_controls (Phase 5)

Parts: `pointer`, `finish-logic`, `interface`. Branch `agent/site-controls`. Every fact is MEASURED (command and number), STATED (read in the code) or UNKNOWN.

## Baseline on `origin/main` a5724fb9, 16:04 to 16:08 UTC

- MEASURED `npm run build`: exit 0.
- MEASURED `npm test`: 119 files, 1479 of 1479 tests.
- MEASURED `npm run bots`: 20 of 20 runs finished, "bots: all clear", longest pointer ignored 3.52 s, flippers 0.00 s, keen 37 of 37 gags.
- Three draft stills kept outside the repo (`../base/stills/`), sha256: `step1-fire` c7252177, `table-wide` 6503c2dd, `boss-fight` 39c4973f.

## First list: what holds on main, rule by rule (16:12 UTC)

### pointer

| Rule | State on main | How |
| --- | --- | --- |
| The system cursor is hidden over the picture, shown over a control | STATED | a check of `node src/ui/site.mjs`; the first run here died on a reload of the dev server before it printed, run again below |
| A little weight, still responsive | does not hold | MEASURED, a stepped 600 px move of the free body, per acting state: time to 90%, overshoot, time to rest: plain 138 ms, 2.5%, 371 ms; confident 133, 4.8%, 483; nervous 242, 0.1%, 388; shocked 113, 5.0%, 417; angry 113, 5.7%, 408; scared 100, 4.6%, 363; proud 158, 3.0%, 413; exhausted 633, 0%, 1050. Five of eight are over 120 ms |
| A click lands where the hero is | does not hold | STATED: the pages test a press against `io.pointer`, the mouse (`src/pages/step1/index.ts` 290, 481, 623, 771; `src/pages/marketing/index.ts` 365) |
| Taken for at most `live.controlTakenMaxSeconds` | holds | MEASURED `npm run bots`: 3.52 s of 8 |
| Handed back with an ease, never a jump, ending on the mouse | holds in part | MEASURED, keen bot, mouse parked 600 px away at 30 places (releases, landings, hits): no step longer than the fastest step of a free move, but half a second after a release the body is 248 px from the mouse when it acts exhausted and 7 px when nervous. Hits by a turret or the boss not measured yet (keen dodges them) |
| Nothing sticks | does not hold | STATED from the listeners of `src/main.ts`: no listener for the window losing the focus; a second button pressed while one is held gives no `pointerdown` (the browser sends a `pointermove`), so the right flipper does not answer while the left button is held, and the `pointerup` that ends such a chord clears one button only; a Shift released while a control has the focus never reaches the page, because the control stops the `keyup` |
| Step 3: the flippers answer within a step | UNKNOWN | left button or left Shift is the left flipper, right button or right Shift the right one (STATED) |

### finish-logic

| Rule | State on main | How |
| --- | --- | --- |
| The four bots finish, G17 | holds | MEASURED `npm run bots` |
| Visitors a to g of the brief | UNKNOWN | no test yet |

### interface

| Rule | State on main | How |
| --- | --- | --- |
| Three controls, keyboard, names | holds in part | STATED: `site.mjs` checks the tab order on the careers page only, where no skip link is due |
| Touch page, nothing else loads | does not hold | STATED: `index.html` loads `src/main.ts`, which imports every page, so the one bundle (5.3 MB) with all six pages is fetched before the device is asked |
| Touch page, the link | holds | STATED `src/ui/touch.ts`: with `links.portfolioWork` empty no link is made |
| Less motion gets the film | STATED | `site.mjs` has the check; run again below |
| Live region | UNKNOWN | STATED: only words under `copy:` that were not on the page at rest are said, each once a step |
| Film bar at 3840 and at its end, the ink at 4.5 to 1 | UNKNOWN | |
| The probe | UNKNOWN | first run died with the same reload |

## Decisions (each taken without asking, as the brief says)

1. The live hand. Under a visitor the free hero follows the mouse with one gait of its own, `HAND` in `src/cursor/body.ts` (stiff 760, damp 40, top 7500 px/s), whatever state it acts. The acting state still shows in the pose, the hop and the face, not in the lag. The film keeps every gait as it was (`CursorBody.hand` is false there and is not saved). Why: five of the eight gaits were over 120 ms to 90% of a 600 px move, `exhausted` 633 ms.
2. A click lands where the hero is. On the live stage, at a press with the hero free, the page is told the hero's place as the pointer, and that place eases to the mouse over `CLICK_EASE_SECONDS` (0.12 s, `src/stage/stage.ts`) so a drag that starts with the click has no jump. The body itself always follows the true mouse. No page file is changed.
3. The listeners moved out of `src/main.ts` into `src/ui/pointer.ts` (`listenToVisitor`), which takes its window, document and picture as arguments. `main.ts` calls it in one line. The tests drive the same function with a small tree of targets that has the capture and the bubble phase.
4. Buttons and keys. Left button: press, and the left flipper. Right button: the right flipper, never a press. Left and right Shift: the two flippers. Middle, back and forward buttons: nothing (on main the middle button pressed like the left one).
5. Nothing sticks. Every pointer event carries `buttons`: what it does not name is let go. `pointerup`, `pointercancel` and `keyup` are heard in the capture phase, so a release over a control (which stops the bubble) still counts. Window `blur`, a hidden tab and the mouse leaving the window (`mouseout` with no related target) let go of everything. A button still down when the visitor comes back is not a new press: it has to be pressed again.
6. The hit. The 60 px throw of a hit in the step it lands is the hit, not the hand back: the hand back is measured from the step after it. The way back from a shove is capped at `HAND.top`.
7. The tug of war of step 1 is not a hand back place: the hero holds the paper, the shredder pulls it by the paper, `cursor.taken` is false and the hero is not free. It is left out of the "ends on the mouse" rule, by name, in the test.
8. Sound control and play and pause write their shown state at the press itself (finding of /root/site_sound on check A2), not at the next drawn frame.

## pointer, MEASURED after the change

- Weight, `npx vitest run tests/site-pointer.test.ts`: a stepped 600 px move of the live hand, every acting state: 90% in 100 ms, 2.6% past the mark, at rest (within 1 px) in under 350 ms, fastest step 31.25 px. The film's gaits: the eight (t90, rest) pairs are what they were on main.
- Hand back, same file: five runs (keen, clumsy, random, skipper and a keen hand that stands still under the turrets and the boss), the mouse parked 600 px away for half a second at 166 places: every page turn, every release (`step1.shredded`, `step2.dial`, `step2.crank`, the ball, the stamp), every hit that reaches the hero (`slab-drop` of step 1 and of the boss, `bolt-hit`, `coins`), every heal, and a sample every 1.7 s and 2.3 s of the random and skipper runs. Longest step of the hero in those half seconds: 31.25 px, the fastest step of a free move. Farthest from the mouse after half a second where the page did not take it again: 1.4 px.
- Click at the hero: Apply with the hero on it and the mouse 200 px away is pressed; with the mouse on it and the hero 200 px away it is not. A perk card turns when the hero comes onto it. On step 1 six of six presses of a field or a key land with the mouse 200 px to the side.
- Nothing sticks and the flippers: `npx vitest run tests/site-pointer-listeners.test.ts`, 18 tests. Each way to raise a flipper (left button, right button, left Shift, right Shift) moves it in the step after the press and lets it fall in the step after the release. Through a whole keen table the flippers held what the hand asked at every step looked at (every step the hand changed, every twelfth between): 0 late, `longestIgnored.flippers` 0.
- Taken at most 8 s: 3.52 s in all of these runs and in `npm run bots`.

## finish-logic, MEASURED

`npx vitest run tests/site-finish.test.ts tests/site-finish-skip.test.ts tests/site-finish-film.test.ts`: 29 + 35 + 41 tests. Each run is a stage driven through the pointer path of the bots, and each asserts: the careers page after the rejection is reached, inside `live.botMaxSeconds` counted from the careers page; pointer never ignored for more than `live.controlTakenMaxSeconds`; flippers ignored 0 s.

- a. One click and then nothing. Every step ends by itself. One click on Apply and nothing after: rejected and back on the careers page after 464.6 s (step 1 takes 133 s, step 2 149 s, step 3 53 s, step 4 89 s, step 5 28 s). The same from a first click on each later page. 45 s of nothing after the first click on every page, then on: 233 s.
- b. Never clicks. On the careers page nothing happens to this visitor: after 150 s the page is still there, the first cards have opened by themselves, nothing is taken, there is no skip link (the stage offers none on the careers page) and Apply answers the first press. So the way forward on the careers page is the Apply button or the film link, and it needs one press: a visitor who never presses is never rejected. Whether that is enough by the rule "every visitor is rejected" is Brandon's to say; the fix, if wanted, would be in `src/pages/marketing/index.ts` (not mine). Coming in at any step and doing nothing at all, not a move and not a key: every step ends by itself, 452.7 s from step 1. With the keyboard on the skip link only: five skips, finished.
- c. Left button held from the first step of a page to 60 s or the page turn, on each page: finishes. Step 3 with the left flipper up the whole table ends by itself in 52.9 s.
- d. Skip pressed in the step it appears on all five steps: finishes. Skip pressed in the middle of the ending of each of the 33 gags of the five steps (a hand that waits for the link, then plays): the next page comes within 20 s and the run finishes. Where a gag is over before the link is there (the first gags of step 3, which play themselves), the press comes in the step the link appears.
- e. Left for the film at 40 worst moments (the cursor taken in every gag that takes it, each popup, the ball in each seat, the boss mid hit, a slab landing, the tug lost, the dial flinging, the crank running away, the stamp) and back by the film bar: finishes each time. STATED: while the film is on, `src/main.ts` does not step the stage, so the stage sees the mouse run to the film link with nothing held and finds it on the back control at the next step.
- f. Browser back and forward in the middle of each page: the same for the stage, with the mouse out through the top edge. STATED: `popstate` in `src/main.ts` only switches film and live. Not yet driven in a real browser.
- g. A real keyboard through step 1 for 60 s: one `real-keyboard` event, the keyboard rises, no key of the page is pressed, nothing is taken, the skip link is offered and works. 30 s of typing and then the mouse on the page's keys: finishes.
- No hole found: no patch for a page.
