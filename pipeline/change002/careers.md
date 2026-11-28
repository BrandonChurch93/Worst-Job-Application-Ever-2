# Careers page (unit `marketing`), change 002 and change note 003

Branch `agent/b-careers`. Every item below is MEASURED (the command and the number), STATED (written by a person, or read in code and not run) or UNKNOWN.

## What is built

- The page of `references/approved-002/careers-page.png` as a flat white website on the site's stage, in `src/pages/marketing/*`. Eight sections: top (navigation, hero, awards, ticker), benefits, staff quotes, questions, comparison, process, closing call, footer.
- `careersLayout()` height 5366 px at 1920 wide since change note 004 item 8 (the picture is 5357); scroll range 0 to 4286. Before that 5679 px and 0 to 4599: the 322 more was the second row of quotes. MEASURED: printed from `careersLayout()` in a test run.
- The film's opening on this page: 18 s from the first frame to the press of the last Apply, the turn half a second later, the unit 19.0 s. See "The opening".

## Decisions

1. Flat white on the stage: the white sheet is drawn unlit at 251.6 (MEASURED: mean of a 40 by 40 px patch of the draft still of the first screen, with sharp). Nothing in `src/post/` or the ground was changed.
2. One type scale, Inter: `T` in `layout.ts`. Display 82 (headline), 72 (the benefits heading), 56 (the closing call and the process heading), 44 (the other section headings), 32, 24, 20, 16, 14: nine sizes. Headline and headings in Inter Display 800, baked to `public/fonts/inter-display-800.json` (183588 bytes, sha256 starts 9bc2142f6987a04c; MEASURED with `wc -c` and `sha256sum`), one entry `'inter-display-800'` added to `FONTS` at `src/shell/metrics.ts:15`.
3. Every word is a key of `content/copy.json`. Cases where the picture's word is not in the copy are under "Words".
4. Cards: face with icon, title, promise and the fine print small. The pointer on a card flips it to the back with the fine print large. It flips back when the pointer is clear of the card by `LEAVE`. Events `card-flip` and `card-flip-back`.
5. Apply is live from the first frame in the navigation, the hero and the closing call. Each runs the press (wind-up 0.36 s, jump 0.42 s, `button-press` on landing, hold 0.7 s) and the page turns into step 1.
6. The ticker is one band from the left edge to the right edge of the website at every width.
7. Six staff quotes in two rows of three. Overruled by change note 004 item 8: three, in one row.
8. The awards keep their fine print, small, under each.
9. The comparison ticks are drawn as in the picture: green box ticks in the right column.
10. The build's own arrow at its real size.
11. The variant `rejected` stays: `step5.closing` in the footer, the ticker repeats `marketing.tickerAfterRejection`.
12. No sound is made here. Event names kept exactly: `step`, `card-flip`, `button-press`.
13. The page has its own navigation; `chrome()` returns `{ header: 0, caption: 980 }`: no header of the shell, and a caption's lower edge at y 980 (the Builder's ruling), above the ticker on the first screen.
14. Scroll and cost: see "Scroll and cost".
15. The hint on the live site leads over the first card until the ticker beat begins and a quarter second more, then to the hero's Apply (7de4cdd8). Without it a keen visitor went straight to Apply and missed two gags.
16. The label stays on a pressed Apply: the darker pill shown while the cap is down lay over the label; it lies under the cap's face now (`real/apply-button.ts`, b13d25f9).
17. One opening in the script (the owner's pick), no second setting (b13d25f9).
18. The unit is 19.0 s: `OPENING.after` 1.0, the turn at 18.5 (the Builder's word, 23:42Z).
19. Type pass after the owner's pick: the promise on a card 24 (was 20), the process heading 56 (was 44), each staff role under its own quote and each row of quote cards as tall as its tallest card (was one height for all six, the role at one line for all). The page keeps its height of 5679 and the opening's five scroll stops keep their px (983, 1913, 3800, 4191, 4599. MEASURED by printing `careersOpening()` before and after), so the film's scroll is to the frame what the owner approved. The badge line stands 28 px higher on the screen at its stop, and 50 px of white stand under the staff footnote.
20. The arrow's second gathering, 0.2 s before the turn, is out of the page's cues (the Builder's word, 00:36Z, from the shell helper's measure: it stood the arrow upright in film frames 1135 to 1139). The cues are: gather, jump, press, startle on the turn. Seen after it in film frames 1130 to 1142 (`node pipeline/change002/careers-proof.mjs --only frames --from 1130 --to 1142`): the arrow lies at its usual slant in every frame from 1130 to 1139.

## Events

`step` (the arrow, while it moves faster than 180 px a second on the page), `card-flip`, `card-flip-back` (new in change 002), `button-press`, `page-turn` (the stage's, at the unit's last half second, 18.5 s).

## The opening (change note 003)

One opening, the one the owner picked on 27 November from the two previews ("opening B", 18 s). All numbers stand in one object, `OPENING` in `src/pages/marketing/script.ts`: `total` 18, `key` 2.4, `line` 13.75, `after` 1.0, `ramp` 0.45, `places` (salary, badge, lol, ghosting, button), `scrollFrom` 3 and for each place `{ hold, slow }`. There is no second setting in the script and no URL switch.

MEASURED by `tests/careers-acting.test.ts`, the one test file that pins the stops within 0.03 s, the press and the turn (page px, seconds):

| | |
|---|---|
| Line 1 (22 words at 1.6 a second, silent stand-in) | 0 to 13.75 |
| Hold at the top | 0 to 3.0 |
| Scroll | 3.0 to 16.45, 13.45 s |
| Speed between stops | 603 px/s (10.0 px a frame at 60) |
| "Competitive Salary" fine print | 4.98 to 6.28, 1.30 s at 72 px/s |
| "[STATUS: Badge still doesn't work]" | 8.08 to 9.08, 1.0 s at 72 px/s |
| "Responds to Applications", "lol" | 12.49 to 13.49, 1.0 s at 72 px/s |
| Step five, "Professional Ghosting" | 14.41 to 15.41, 1.0 s at 72 px/s |
| The last button and the line under it | stands 16.45 to 18.0, 1.55 s |
| Press of Apply (`button-press`) | 18.0 |
| Turn into step 1 (`page-turn`) | 18.5 |
| End of the unit | 19.0 (1140 film frames, 570 preview frames) |

- The unit ends at 19.0 s by the Builder's word of 23:42Z (the owner asked for the short end and no padding). The rule for every unit: its seconds times 30 is a whole number. The first form was 19.25 s, which gave the film 4747.5 preview frames.
- A stop eases over 0.45 s down to 12 percent of the speed and up again; the page never stands still before the bottom.
- The arrow rides down the page with the scroll, stands on the salary card at its stop (the card turns: `card-flip` 4.79 s, `card-flip-back` 6.52 s, MEASURED in the simulation at 240 steps a second), then by the badge line, the "lol" cell, the fifth step and the button. It goes down a lane at x 150 between the salary card and the badge so no other card turns.
- Line 1 ends at 13.75 s, at the end of the "lol" stop. The last 4.25 s of the 18 have no voice.
- The press in the half second before the turn: the cap sinks over 0.09 s, stays down 0.3 s and is back up by 0.48 s after the press. MEASURED by looking at twelve stills of the button at full size (`node pipeline/change002/careers-proof.mjs --only press`, `out/work/careers/careers-press-large.jpg`, b13d25f9): up at 18.03, down and darker with its label on it from 18.08 to 18.38, up again at 18.44 and 18.49. So the half second shows the button going down and coming up.
- The turn at the bottom: while the page turns, the stage draws only the screen on show as a slab. A sheet of the website that reaches above the screen (the comparison's, at the bottom scroll) is cut to the screen for those frames (`Paint.keep` in `real/flat.ts`, the sheet's key in `real/careers-page.ts`), so it does not hang over the slab. MEASURED in `tests/careers-real.test.ts` (the cut sheet's upper edge is at the scroll). A card or a line of type that straddles the screen's edge is not cut: at the bottom scroll none does. On the live site a press of Apply at another scroll can leave a card or a line across the edge for the half second of the turn: STATED, not looked at.
- At the turn the arrow leaves the pressed button and rises to the "Current wait time" pill (18.55 s on). The Builder ruled it a fault of the shell's hand over, the shell helper mends it; nothing in my script is changed for it.

Opening A, out of the film's path, numbers kept here only (MEASURED at 22e224dd, when the script had both): hold at the top 0 to 13.75; scroll 13.75 to 16.45, 2.70 s, at 2044 px/s (34.1 px a frame at 60) with no slowing; stands on the last button 16.45 to 18.0; press 18.0. No card turns at that speed. Its preview is `out/work/careers/careers-film-A-8d450757.mp4` (578 frames at 30, made when the unit was 19.25 s).

## NEEDS (outside my files)

- `pipeline/change002/careers-NEEDS.patch`, `config/showcase.json` only, on my branch as four commits whose subjects start `NEEDS:` (f6dc52fb, f8da3707, e63c73fa, a57b5afc): unit `marketing` 14 to 19 s; beats `marketing.stroll` 0 to 3 (`step`), `marketing.perks` 3 to 7 (`card-flip`), `marketing.ticker` 7 to 16.45 (no event), `marketing.apply` 16.45 to 19 (`page-turn`); key `marketing-top` at beat `marketing.stroll`, share 0.8 (2.4 s). `plannedSeconds` and `maxSeconds` are not touched. The Builder accepted the patch at 22:44Z and repoints the key's picture.
- STATED from `tools/gate.mjs:306-308`: the gate says marketing 19 s is more than `unitTuneFraction` 0.2 from its planned 14 s. The film by the units list is 158 s of at most 165.
- Font recipe, two lines for the Builder to add at the shell merge: in `pipeline/fonts/bake_fonts.py` `FONTS`, `('inter-display-800', 'inter', 'extras/ttf/InterDisplay-ExtraBold.ttf', 'Inter Display', 'ExtraBold', 800),`; and the file name `inter-display-800.json` in the heading of `assets-src/fonts/RECIPE.md` and in the fonts row of `ASSETS.md:241`.
- `content/narration.json`: when line 1 of note 003 stands at `marketing.stroll`, `marketing.perks` must be empty, or the site's content check stops the start (it did on d0a8b8bd with the old two lines). STATED by the Builder: it is so on `agent/script-003`.

## Differs from the picture on purpose

Contrast (the Builder's ruling of 21:50: every run of type 4.5 to 1 against what lies under it; fills as in the picture). MEASURED with the WCAG formula on the colours named:

| Pair | Picture | Mine |
|---|---|---|
| Orange type on white (kickers, links, quote roles, table words) | e97832 on white, 2.95 | b65821 on white, 4.63 |
| Orange type on the peach pill | e97832 on ffedd9, 2.64 | aa521e on ffedd9, 4.64 |
| White label on the Apply button (navigation, hero, closing) and on the step discs | white on e97832, 2.83 | white on be5418, 4.56 (the fill is deeper, the site's own orange button pair) |
| Grey small type on the hero glow | 6b7280 | 5c636f, 4.81 at the glow's centre |

Other:

- The page is 9 px taller than the picture (5366 against 5357): the cards are 27 px taller each (see "Change note 004 item 8"). Three quotes in one row as in the picture.
- The awards carry their fine print (decision 8); the picture has none.
- Type: Inter in one scale of ten sizes (30 for the card titles and 32 for a card's back came with change note 004); the picture's sizes vary by a few px from section to section.
- Staff quotes have no quotation marks and the fine print has no "* " in front: the copy has neither.
- The fine print is on the face of a card at 24 px in the grey of small type; the picture's is black. The back is not in the picture.
- A card flips by a flat squash about its upright middle, with its shadow.
- The questions are closed rows; nothing opens.
- The wreaths of the awards are simpler: 8 leaves a side.
- One hero glow, an ellipse with a flat middle (`GLOW`); the picture's glow is a little stronger at its lower edge.
- The arrow is the build's own, at its real size (decision 10).
- The compare command shows the arrow at its start place in each tile it stitches.

Seen in the crops and not meant, and still there (type):

- Lead lines under headings: mine 3d3934, the picture's a little lighter (its darkest 1 percent of pixels in the hero subline is 65,61,56; mine 51,47,42. MEASURED with sharp on both pictures).
- Staff quotes: the picture's quote and role are about 22 px and its bracket notes are in a typewriter face about 16 px; mine 20 px and Inter 16. The scale has 20 and 24; at 24 the quotes run to five lines in a card 408 wide.
- Card titles, small print and step titles: settled by change note 004 item 8, see that section.
- The promise line of a card: mine 24 px, the picture's cap is 19 px high, which is about 26 px of Inter. Not named in the decision and left.
- The picture's arrow is about one and a half times the build's and stands on the button's right end.

Crops, mine left and the picture right: `node pipeline/change002/careers-differences.mjs` writes `out/work/careers/careers-differs-<name>.jpg` for type-headline, cursor-button, glow, awards, navigation, benefits-heading, cards, quotes, table, steps, closing. It reads the pictures of the two other commands.

## Words

- Hero pill: the picture's pill line is `marketing.ticker.8` in the copy ("Voted #1 by Ourselves™. Three Years Running"); used from there.
- Hero subline: `marketing.hero.sublineLong`, the two-line form the picture shows.
- Keys of `marketing` not shown: `hero.subline` (the short form), the answers of the questions (rows stay closed), `footer` lines the picture does not have. UNKNOWN: a word-by-word check of the picture against the copy beyond the eight section pictures I looked at.

## Commands

- `node pipeline/change002/careers-page.mjs`: draws the whole page as one tall picture 1920 wide (`out/work/careers/careers-page.png`), lays it beside the approved one (`careers-page-beside.jpg`) and cuts the eight sections (`careers-section-N-name.jpg`, mine left, approved right). Prints triangles and draw calls of each tile.
- `node pipeline/change002/careers-proof.mjs [--only top,film,apply,press,turn,card,ticker,cost]`: the proof pictures in `out/work/careers/`.
- `node pipeline/change002/careers-differences.mjs`: the crops of the on-purpose differences beside the picture.
- `npm run film -- --unit marketing --tier draft --format preview`: the opening as a film.
- Tests: `npx vitest run tests/marketing.test.ts tests/careers-*.test.ts`.

## Scroll and cost

- The stage scrolls a page by its own `scroll()`: the page reports its height and its scroll, the stage moves the camera down the page. A page of 5679 px is one layout; its parts are built once and stay in the scene, and what is off the screen is not drawn. STATED from reading the stage; the counts below are MEASURED.
- MEASURED per screen by the renderer's own count (`node pipeline/change002/careers-page.mjs`, draft tier, after the type pass):

| scrolled | triangles | draw calls |
| --- | --- | --- |
| 0 px | 220288 | 66 |
| 1080 px | 265994 | 84 |
| 2160 px | 232428 | 59 |
| 3240 px | 129478 | 52 |
| 4320 px | 183611 | 54 |
| 4599 px (bottom) | 181226 | 47 |

  The low level's limits in the config are 700000 triangles and 300 draw calls.
- MEASURED at the low level (`node pipeline/change002/careers-proof.mjs --only cost`, `quality=low`, this machine's software renderer, so only the ratio counts): first screen 2846 ms a frame, wheeled down to the cards 3157 ms, while wheeling 1200 px 3088 ms a frame; step 1 at rest for comparison 3804 ms. The page costs less than step 1.
- UNKNOWN: milliseconds on a real graphics card.
- The count command leaves the renderer unable to draw the next still in the same session (`o.render is not a function`), so the page command counts each screen in a session of its own. The cause is outside my files.

## Tests of other units that this change breaks

MEASURED at f9a7b76e (the last commit that changes the source, with `origin/main` 5ee40d5a merged; unit 19.0 s, turn at 18.5 s), the whole `npm test`: 15 files failed, 163 passed, 13 skipped; 33 tests failed, 2161 passed, 17 skipped; 276.0 s. The same 33 with the same messages at e80848bc, and at b13d25f9 before the type pass (there the cut list gave 1014 events). Before this work: 176 files passed, 2177 tests. None of the 15 files is mine and none is touched. At f8b9221e (unit 19.25 s) it was 40 tests in 18 files: the 7 of `tests/harness-plan.test.ts`, `tests/harness-keep.test.ts` and `tests/roughcut.test.ts` were the half preview frame and are green at 19.0 s.

The third column is the test's own message: the value it sees now comes first, the value it pinned comes after "to be", "to equal" or the comparison.

Causes:

- F: a film frame or second written into the test. The page before step 1 is 19 s and was 14, so every frame after it is 300 later at 60 a second (150 at 30), and the first turn is at 18.5 s, was 13.5.
- L: the live site under a bot. The bots leave the careers page on another step and from another place (keen: step 2310 at 960, 247; was step 2445 at 358, 472. MEASURED at 7de4cdd8), so what follows on step 1 falls on other frames.
- P: the page itself is another page. The cards are below the first screen, the ticker is the page's width, the arrow stands on a flat sheet at the turn.
- H: the page has a `chrome()` now (`{ header: 0, caption: 980 }`).
- C: `cut/CUTLIST.json` is the list of the old film; `npm run cut` writes the new one (977 events and 9180 frames there; 1013 events and 9480 frames now).

| file and line | what it pinned | now, and what it was | cause |
| --- | --- | --- | --- |
| `tests/b-shell-chrome.test.ts:24` | leaves every page of the build as it was: none says anything of the header, and the frame holds what the page drew | marketing: expected [Function chrome] to be undefined | H |
| `tests/cut-of-build.test.ts:37` | are, byte for byte, what this build gives: run npm run cut and commit cut/ when this fails | expected [ ...(3) ] to deeply equal [ ...(3) ] | C |
| `tests/cut-of-build.test.ts:58` | is read from the committed cut list and carries the sum of that file | the mix is refused: cut/CUTLIST.json is not the list this build gives now (it holds 977 events and 20 lines; the build gives 1013 events and 20 lines; ... | C |
| `tests/film-cut.test.ts:136` | matches cut/CUTLIST.json in its frame counts when the file exists | expected 9180 to be 9480 | C |
| `tests/pack-hit.test.ts:80` | gives the machine its own sheets: the save and the rail in consecutive frames, the way in and the way out | expected 4320 to be 4158 | F |
| `tests/polish-arrow.test.ts:135` | comes over in at most 12 degrees a frame, goes a little past flat and settles back over the last frames, never in one | expected 0 to be greater than or equal to 28 | P |
| `tests/polish-hand.test.ts:141` | turn 1: while the tray under the arrow hops on the seat the arrow is drawn hopping with it, and the tray never rises through it | expected 0 to be greater than 8 | P |
| `tests/polish-hand.test.ts:163` | turn 1: with the view's jolt the arrow is carried with the page on the seat by no more than CARRY, and lies still after | expected 5.789494302915496 to be less than or equal to 2.5 | P |
| `tests/polish-hand.test.ts:302` | the film's first turn: the arrow is lifted to the hand over place and handed over there | expected [ ...(9) ] to deeply equal [ ...(9) ] | F, P |
| `tests/polish-keys.test.ts:55` | stays at the bottom on every frame the button is held, and before this work it rose 9 frames sooner | expected 3 to be greater than 9 | F |
| `tests/polish-keys.test.ts:62` | springs back on the release: at its neighbours height within three frames, a short overshoot, at rest inside nine | expected 1 to be less than 1 | F |
| `tests/polish-keys.test.ts:172` | has them back within a few frames, so the arrow thrown back is what is seen after | expected 5.520352756810257 to be less than 3.995868414771729 | F |
| `tests/polish-keys2.test.ts:76` | shows it on the live site, frame by frame of the shot the visitor is hit by | expected [] to include 'bolt-fire' | L |
| `tests/polish-keys2.test.ts:102` | goes 1500 px a second on the same line on the live site: 28 frames from the muzzle to the arrow | expected 840 to be 870 | L |
| `tests/polish-keys2.test.ts:138` | holds the same events at the same frames on the live site | expected 201 to be 178 | L |
| `tests/polish-keys2.test.ts:161` | throws the caps round the strike outward for two frames, the near ones more than the far ones, and has them back in five | f: expected 0 to be greater than 3 | F |
| `tests/polish-keys2.test.ts:174` | jolts the deck on the frame of the hit and stills it inside eleven frames | expected 0.15805014531485995 to be greater than 2.5 | F |
| `tests/polish-keys2.test.ts:183` | presses no key, as round 23 ruled, and leaves no key hot that the bolt did not strike | g on 898: expected 0.9479166666666641 to be +0 | F |
| `tests/polish-keys2.test.ts:194` | is at its bottom on the second frame, stands eleven frames, and is over its seat for five frames after it is let go | expected [ +0, +0 ] to deeply equal [ 0.71, 1 ] | F |
| `tests/polish-keys2.test.ts:214` | throws the barrel back inside a sleeve that stays where it stands at rest, so no more of its rear end shows over the dome | expected 0.9285714285714095 to be +0 | F |
| `tests/polish-keys2.test.ts:260` | shades the sunk cap along its upper and left edges and darkens the bed round its seat, and neither is there at rest | expected 1 to be less than or equal to 0.76 | F |
| `tests/polish-sharp-shadow.test.ts:66` | had the shadow on in the film while the ball was in the tube, and has it off there now | expected [ 4565, 4836 ] to deeply equal [ 4265, 4536 ] | F |
| `tests/polish-tape.test.ts:92` | sets no part of a run past an end of the window on any step of the first 60 s of the live page | expected 96 to be greater than 1000 | L, P |
| `tests/polish-tape.test.ts:101` | does so on every step of the film frames 0 to 839 | expected 29 to be greater than 1000 | P |
| `tests/polish-tug-strips.test.ts:130` | the live site, bot clumsy: each is fed down from the mouth's lower lip at an even pace, a fifth of it or less at first, and no strip is hurried to its fall | expected 8.08585378903477 to be less than or equal to 8 | L |
| `tests/polish-tug-strips.test.ts:130` | the live site, bot keen: each is fed down from the mouth's lower lip at an even pace, a fifth of it or less at first, and no strip is hurried to its fall | expected 8.44127009194044 to be less than or equal to 8 | L |
| `tests/polish-tug2.test.ts:72` | turns and shortens the arrow by a little each frame, never by a swap between two frames | expected 0.13532813472378846 to be less than or equal to 0.13 | L |
| `tests/polish-tug2.test.ts:146` | springs up past its rest height by the second frame, passes it once, and is at rest by a named frame | expected 1 to be less than 1 | L |
| `tests/polish-tug2.test.ts:193` | moves no event of step 1 to another frame | expected [ '683 keyboard-rise', ...(59) ] to deeply equal [ '713 keyboard-rise', ...(53) ] | L |
| `tests/polish-tug3.test.ts:89` | leaves the arrow to rest after its arrival, then answers each strain a frame after the hands are jerked: keen | hands, frame 1197: expected -0.13199999999997658 to be greater than or equal to 2 | L |
| `tests/polish-tug4.test.ts:79` | stands the named frames and is drawn up on the frame the visitor has it: keen | expected 1.0294117647058816 to be greater than or equal to 1.04 | L |
| `tests/polish-turn2.test.ts:187` | turns five pages by the clock, at 13.5, 45.5, 66.5, 108.5 and 140.5 s, and a sixth on step 36181 | expected [ 18.5, 50.5, 71.5, 113.5, 145.5 ] to deeply equal [ 13.5, 45.5, 66.5, 108.5, 140.5 ] | F |
| `tests/polish-turn2.test.ts:223` | holds every value of the stage equal to before on every step from the seat on, the angle through the leaving half apart, and nothing else differs before the seat | expected [ [ 1111, 1139, 29 ], ...(5) ] to deeply equal [ [ 811, 839, 29 ], ...(5) ] | F |

## Mine to tell the Builder (his to mend)

- Key `marketing-top` in `config/showcase.json`: its picture is still `references/approved/marketing-top.png`.
- `tools/assets/approved-boxes.json:183`: boxes of the old first screen.
- The four judged stills of the page (`rest-marketing` scroll 0, `marketing-perks` 0.25, `marketing-proof` 0.5, `marketing-foot` 1; `config/showcase.json` lines 472 to 475): the page is another page now and is taller.
- The settled list of the key.

## Change note 004 item 8 (Brandon through Partner, 7:12 PM MT; branch `agent/b-careers2` from 004819fb)

His decision: keep the deeper orange; card titles about 30 px and small print about 24 px; step titles 22 to 24 px; three staff quotes as in his picture; the rest left as built.

What is built, `src/pages/marketing/layout.ts`:

- Card title: Inter 600 at 30 px (`T.card`), its top 132 px under the card's top as in the picture.
- Card small print: Inter 400 at 24 px with 28 px from line to line, 24 px under the promise, in the grey of small type (5c636f) as before.
- Card: 354 px tall, not the picture's 327, and 20 px of room at each side, not 30. Why: at 24 px in Inter the small print takes three lines on four cards of eight, with 20 px of room at the sides and with 16 px too (the picture's face is narrower and gets every card into two lines, or one line of promise and three of small print). Two lines of promise and three of small print end 1 px above the lower edge of a 327 px card. Not shrunk: the card grew by one line, 27 px, and the lower row and all under it moved down 54 px (`CARD.grow`).
- The back of a card: Inter 400 at 32 px (`T.back`), so it is still larger than the face. The cards flip back when the pointer leaves, as before (`tests/careers-fix.test.ts`).
- Step titles: Inter 600 at 24 px (`T.strong`). The upper end of his 22 to 24: the picture's cap is 19 px, which is more than 24 px of Inter gives (17). They do not touch: see the numbers below.
- Quotes: items 0, 1 and 3 of `marketing.testimonials.items` (`QUOTE.shown`), one row, each card 408 wide, from x 323 to 1598, all of one height. Items 2, 4 and 5 stay in `content/copy.json` and are not laid.
- Decision: the promise line stays 24 px (the picture's is about 26). It was not named.
- Decision: the type scale has ten sizes now, not nine; `tests/careers-finish.test.ts` says at most ten.

MEASURED on `out/work/careers/careers-page.png` (the page drawn 1920 wide by `node pipeline/change002/careers-page.mjs`) against `references/approved-002/careers-page.png`, rows or columns of ink darker than 120 of 255:

| What | Built | Picture |
|---|---|---|
| Page | 1920 by 5366 | 1920 by 5357 |
| Card title, cap of the U of "Unlimited PTO" | y 1491 to 1511, 21 px | y 1491 to 1512, 22 px |
| Card title, width of "Unlimited PTO" | 203 px | 182 px |
| Card small print, cap of the first P | y 1609 to 1624, 16 px | y 1610 to 1626, 17 px |
| Card small print, lines of the first card | 3, their ink from y 1608 to 1685 | 2, from y 1609 to 1658 |
| Card, top to bottom | 1359 to 1713 (354) | 1359 to 1686 (327) |
| Step title, cap of the F of "Find Our Job Posting" | 17 px | 19 px |
| Step titles, widths of the five | 239, 234, 160, 216, 252 | 233, 231, 156, 213, 247 |
| Step titles, least room between two | 31 px (1 and 2), then 34 px (4 and 5) | 37 px, then 39 px |

STATED (the numbers of the layout, not read off a picture): the type sizes 30, 24, 24 and 32 px; the 28 px from line to line; the quotes' place.

The opening: no number of `OPENING` changed. The plan fits itself to the page: one speed between the stops so that the page stands at the bottom at 16.45 s.

| | Before (page 5679) | Now (page 5366) |
|---|---|---|
| Way to scroll | 4599 px | 4286 px |
| Speed between stops | 602.59 px a second | 561.58 px a second |
| The stops, px scrolled | 983, 1913, 3800, 4191, 4599 | 996, 1967, 3487, 3880, 4286 |
| Salary card held | 4.98 to 6.28 s | 5.12 to 6.42 s |
| Badge note held | 8.08 to 9.08 s | 8.41 to 9.41 s |
| lol held | 12.49 to 13.49 s | 12.39 to 13.39 s |
| Professional Ghosting held | 14.41 to 15.41 s | 14.36 to 15.36 s |
| `card-flip` | 4.771 s, frame 286 | 4.900 s, frame 294 |
| At the bottom | 16.45 s | 16.45 s |
| `button-press`, `page-turn` | 18.000 s, 18.500 s | 18.000 s, 18.500 s |

The phrases of line 1 under the holds (1.6 words a second, by the site's own rule in `src/audio/standin.ts`): the salary card under "Desperately hoping" and "to pay their rent." before and now; the badge under "to pay their rent." for its first 0.05 s and then "Poor fool." before, under "Poor fool." now, and 0.04 s into "They must have forgotten"; lol under "it is 2026." before and now.

The film's frames carry no caption panel: the panel is an HTML element of the live site, made with the sound (`src/ui/said.ts`), and a frame of the film is the canvas. The twelve frames are sent with the phrase on at each time written beside them.

`npm run cut` writes `cut/CUES.md`, `cut/CUTLIST.json` and `cut/SHOTS.md` anew (the arrow's steps and the card's flip on this page move; 1464 events, not 1466). Those are the Builder's: the difference is in `pipeline/change002/careers-cut-NEEDS.patch` and `cut/` is left as it was.

The whole suite, `npx vitest run`, MEASURED at 02:42Z: 59 red in 26 files on this branch, 57 red in 25 files at 004819fb (run in a second work tree of that commit). The two more are both in `tests/cut-of-build.test.ts`, which wants `cut/` made again; with the patch laid on, that file is 21 of 21 green.

Pictures: `node pipeline/change002/careers-change.mjs` (needs `careers-page-before.png`, the page as it was at 004819fb, beside `careers-page.png` in `out/work/careers/`) writes `careers-change-cards.png`, `-steps.png`, `-quotes.png`; `node pipeline/change002/careers-proof.mjs --only opening` writes `careers-opening-1.jpg` to `-3.jpg`.

## What is left

- Type: see "Seen in the crops and not meant".
- UNKNOWN: the cost on a real graphics card.
- The arrow's rise at the turn (the shell helper's).
