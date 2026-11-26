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

## Findings of the Builder, 16:51 UTC

1. Flipper chord. Already held by decision 5. Added the case as the Builder wrote it (left down, right down, left up, right up, and the mirror) to `tests/site-pointer-listeners.test.ts`, 19 tests. In a browser, with two real mouse buttons on the stepped site (`node src/ui/hands.mjs chord`): five pictures, none, left, both, right, none, the bats stand as held in each.
2. A press with the arrow still on its way. Decision 2. In the browser (`node src/ui/hands.mjs press`): mouse on Apply, arrow 1036 px away, press: the page stays. The same press with the arrow arrived: step 1.
3. The row over the header. At 1920 by 1080 the row is y 14 to 46 and the header starts below 56. On a small picture the row keeps its least size (14 px type) and overlapped the header. Decision 9.

## Decisions, continued

9. The row on a small picture (`fit()` in `src/ui/interface.ts`). Where the row no longer ends above the 56 unit strip, it stands above the picture if the window has room there (`data-row="above"`, pale ink on the dark band), else it stays and gets the pale capsule (`data-row="over"`). MEASURED `node src/ui/hands.mjs row`: strip at 1920 by 1080, above at 520 by 900, over at 700 by 380, and a real click on the film link opens the film at all three.
10. The live region (`src/ui/said.ts`). Every message of a step is written once, in the order it came on the page, as the text of the copy. One message has the region to itself for `SAY` (0.6 s and 0.03 s a letter, at most 3 s) before the next is written, so a display that changes fast does not flood a voice. What still waits when the step ends is written together at once, so nothing is lost. `messagesOf()` (what a message is) moved from `main.ts` into the same file, unchanged in what it picks. MEASURED `npx vitest run tests/site-controls-said.test.ts`, 8 tests: keen and clumsy 68 messages in 57 writes, skipper 38 in 31, the latest write 8.7 s (skipper 10.5 s) after its message came.
11. The sound controls look for the sound every 250 ms by themselves (`SOUND_LOOK_MS`), so they appear and change without a drawn frame (finding of /root/site_sound).
12. A link answers Space as well as Enter (`press()` in `src/ui/interface.ts`): a link takes Enter by itself, Space was not heard.
13. The touch page loads nothing of the site. `src/ui/boot.ts` is the first module: a touch-only device that asks for the live site gets `src/ui/message.ts` (the message and its type), every other visitor gets `src/main.ts`, each by `import()`. Until the site's module has run, `window.showcase.ready` waits for it, so a tool that asks for it right after the page loads still gets the site. Needs two changes outside my files, in `pipeline/phase5/site-controls-NEEDS.patch`: `index.html` loads `/src/ui/boot.ts`, and `loadFont` moves from `src/shell/type.ts` (which pulls in the drawing library) to `src/shell/metrics.ts` (which does not), `type.ts` still exports it.
14. Ruled by the Builder at 17:16Z: on step 3, while the table is played with the flippers, a mouse button pressed in the dark band beside the picture moves its flipper and is never a press. A press on a control stays the control's own. On every other page a press in the band is nothing. `src/ui/pointer.ts` keeps the band's buttons apart from the picture's (`beside`), three tests in `tests/site-pointer-listeners.test.ts`.
15. Browser runs on the wired site are slow on a machine without a graphics card: MEASURED with `out/work/dbg.mjs` at 1920 by 1080, level high, 18 drawn frames in 72 s. The wired site moves the stage at most 0.1 s per drawn frame (`src/main.ts`, not mine), so the 20 s before the skip link take 200 frames. The run for the skip link (`node src/ui/hands.mjs skip`) therefore keeps the window at 1920 by 1080 CSS px and sets the device pixel ratio to 0.5 and the level to low. The layout, the mouse and the click are the same.
16. Open, for Brandon: a visitor who never presses Apply on the careers page stays there (ruled by the Builder at 17:16Z: no change).

## Names typed in code, for Brandon (interface g)

These are names for a screen reader and labels of the probe. They are in code, not in `content/copy.json`. They stay until Brandon moves or changes them.

- `src/ui/names.ts`: sound "Sound", play "Play", position "Position in the film", back "Back to the application".
- `src/probe/labels.ts`: title "Probe", running "Measuring", median "median fps", slowest "slowest 1% fps", frames "frames", card "Graphics card", screen "Screen", window "Window", browser "Browser", pick "The site would pick", unknown "not reported", failed "did not run", copy "Copy", copied "Copied", again "Run again".

## Decisions, after 17:45 UTC

17. Tab is always the browser's own (`src/ui/pointer.ts`). Before, Tab pressed on the page or the picture while a page takes typing was held back and handed to the page as a key. No page reads a key called Tab, so on steps 1 and 4 a keyboard visitor could not reach the film link or the skip link. Found by `node src/ui/hands.mjs skip`: four Tabs, focus on the body four times.
18. The mode and the film bar are shown at the press of the film link and of the back control (`showMode`, `showFilm` in `src/ui/interface.ts`), not at the next drawn picture. On a machine that draws a picture in seconds the bar came seconds after the click and the position read 50, the default of a range input, until the first picture of the film.
19. The row and the bar are placed again once every resize listener has run (`setTimeout(place, 0)`), because the picture gets its new size in a listener of `src/main.ts` that may run after the interface's.
20. `src/ui/site.mjs` waits for what it wants to see with a limit of 180 s and never for a fixed time. Its step 1 run uses the device pixel ratio 0.5 and the level low, as decision 15.
21. The touch page with no address in `links.portfolioWork` draws no link: the heading, "We're sorry." and the sentence. With an address it draws the link.
22. The film bar stays 56 CSS px at every window size. At 3840 by 2160 and a device pixel ratio of 1 that is 2.6% of the height. Left so: the kit sets no other number, and `/root/site_levels` fits the picture to 56.

## interface, MEASURED on the wired site (18:00 to 18:20 UTC)

- `node src/ui/looks.mjs motion touch history`: 14 of 14 checks hold. Touch page: 22 requests on the dev server, 9 on the built site, none under `src/pages`, no asset, no sound, none from another host. Less motion: the film at 0, the back control leads to the live site, `?mode=live` gives the live site. History: film link, browser back, forward, back control, browser back: the mode and the address change together, the page is loaded once.
- `node src/ui/looks.mjs keys bar ink`: Tab order on the careers page and in the bar, ring solid 2px rgb(196, 70, 15), Enter and Space on the film link and the back control. Bar 56 px at 1280 by 720 and at 3840 by 2160, below the picture, the same box after the film has ended. Ink at 1920 by 1080: page 6.01 and 6.02 to 1, pale capsule 8.23 and 8.00 to 1.
- `node src/ui/hands.mjs skip`: a real click on the skip link at 1920 by 1080 CSS px reaches step 2.
- `node src/ui/site.mjs --shots` (18:17 to 18:24 UTC, 1280 by 720): "32 of 32 checks hold". The film starts by itself: at the click the control says playing and the position is 0, it is 1 after 8.8 s.

## Decisions, after 18:25 UTC

23. The sound control in the film's bar is hidden only where the site has no sound (kit A11): the interface shows it while `sound.available()` holds. MEASURED with `out/work/dbg2.mjs` on `?mode=film`: shown before any press, hidden 1.5 s after the first key. Cause in this checkout: `public/audio` holds `index.json` only (the sound files are not in git, `.gitignore` line 21), `decodeAudioData` fails on what the server gives for `/audio/room-tone.flac`, so the sound's state becomes silent at the first press. It is not hidden by the end of the film. `node src/ui/looks.mjs bar` checks it: at the end the control is in the bar where the sound files are in the build and hidden where they are not.
