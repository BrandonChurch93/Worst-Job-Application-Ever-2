# 09 · QA gauntlet

The final acceptance list. Run every item on the frozen build in Phase 6 and write its evidence under "QA results" in `kit/PROGRESS.md`: a command and its output, a file, or a still.

The gauntlet runs at most `quality.gauntletMaxPasses` times. An item that still fails after the last pass is listed under "Failed QA items" with what was tried, and the build completes. `kit/08-BUILD-ORDER.md` Phase 6 steps 19 and 20 say what a fix may change.

## The live site

1. The published address opens the careers page in `live` mode. The system cursor is hidden over the page and the hero follows the mouse. Evidence: a sheet from `npm run sheet -- --live`.
2. The careers page scrolls from its first screen to its footer. Every perk card shows its fine print when the cursor touches it. The ticker runs. The Apply button turns the page to step 1.
3. Step 1 plays as `kit/02-SUBJECT.md` says: the keyboard stands on its deck above the page, it types into each field, a real keyboard is ignored and shows `copy:step1.keyboardNote`, a name needs `live.step1.minChars` characters, a hit removes the last letter, the turrets overheat after `live.step1.hitsBeforeTurretsOverheat` hits, the email is accepted after the slabs, the tug of war is always lost, and the form shows `copy:step1.resume.received`.
4. Step 2 plays as `kit/02-SUBJECT.md` says: one row is open at a time, the rows can be done in any order, each machine lands its one hit, the crank sets the site's volume, and Continue wakes only when all three are done.
5. Step 3: the cursor is pulled into the loader port and sealed in the clear ball, the view goes down the page to the machine, both mouse buttons and both Shift keys work the flippers on the next frame, the view is the tier the ball is on, every beat of the machine happens in order from the top tier to the bottom, the scene ends in the Unemployment Office for a visitor who never touches a flipper, the ball opens at the outlet port, and the result card shows `copy:step3.result`.
6. Step 4: the checkbox answers with the live lines, the fight has `live.boss.phases` phases, the cursor cannot die, the boss is beaten within `live.boss.maxSeconds` whatever the visitor does, and the button can be pressed only once it is down.
7. Step 5: the wait, the letter, the stamp and the metrics play, "Your Time" shows the time this visitor took, and Accept Rejection is the only way on. It returns to the careers page with the ticker showing `copy:marketing.tickerAfterRejection` and the footer showing `copy:step5.closing` and the credit.
8. Every bot finishes on every seed. Evidence: G17 on the frozen build, with the table `npm run bots` prints.
9. On each step the skip link appears after `live.skipLinkAfterSeconds` and plays that step's ending. The watch the film link plays film mode from any page.
10. A touch-only device gets the message page with the words of `copy:live.touchOnly`, and the link to `links.portfolioWork` if that key is set. A visitor whose system asks for less motion is offered the film with playback controls. Evidence: the `screen-touch` still, and a still of the offer.
11. No sound starts before the first click. The sound control mutes and unmutes. With the sound files removed, the site runs silent and hides the control. Evidence: sound checks A1, A2, A4 and A11.
12. The site picks a level of `live.quality` by itself and can be forced to each level from the `M` menu. `?mode=probe` runs to its end and gives its block of text. During a whole bot run the page makes no network request except for its own files and stores nothing. Evidence: the request log of that run.

## The picture

13. No stand-in is loaded on any page, in any frame of either film or in the loop. Evidence: G13 is green with every part covered, `info().standIns` is empty, and the `standins` view of every judged still and frame shows no flagged pixel.
14. Every key and every sheet has a comparison image under `out/stills/`, rendered from the frozen build at the `final` tier.
15. Every judged still and frame on the list in `kit/PROGRESS.md` exists with a record that matches the frozen build.
16. Measures M1 to M10 were run on the frozen build and their numbers are in the record round's scorecard. No part is off its size or its height in `scale`, and no mechanism is sunk below the page. Evidence: M9, and the `height` view of each page at rest.
17. The words are right. Evidence: G11 is green, and a fresh agent that is given native-size crops of every page at rest and the text of `content/copy.json` reports no word that is misspelled, missing, added or cut off.
18. No DOM control, caption, watermark, title or logo is in any frame of film B, in the loop, or in a still without `interface`. Evidence: G5, and one look at the sheets across the whole film.
19. No person, hand, face, animal or real brand appears in any judged still or frame, and the cursor has no face, eyes, mouth, legs or gloves in any of them. Evidence: one look at every judged still, and the R3 and R9 answers of the record round.
20. From `home`, nothing shows round a page and nothing is blurred or tilted. Evidence: M1, and the six rest stills.
21. The light falls off smoothly across the ceramic in every rest still. Evidence: a crop of each at four times size, with no steps.

## The cursor and the story

22. The story holds on the frozen build: the beats run in order, each beat's event falls inside it, the arms exist only in `cursor.armsOnlyInBeat`, the cursor is one size in every frame, and every kind of damage heals inside `cursor.damageHealSeconds`. Evidence: G12.
23. Every hit lands on the cursor. Evidence: M7 for every beat of the film.
24. Each beat reads. Evidence: the `reads` of R9 in the record round beside what each beat is meant to show. A beat that did not read is listed in the `BUILD COMPLETE` block.
25. One sheet of consecutive frames across each beat of the final film is under `out/stills/`.
26. On the pages the film's camera only moves straight in and straight out. Evidence: `filmState` across each page outside the pinball scene shows the camera's direction unchanged.

## The pinball machine

27. Every tier is crowded and every ball path works. Evidence: M8 and M10 on the frozen build and the output of `npm run paths`, with each tier's count of standing parts and bare share in the `BUILD COMPLETE` block.
28. The machine carries everything `kit/02-SUBJECT.md` lists for each tier: every model with its sign from `copy:step3.table.buildings`, the nine inserts of `table.inserts`, a display on every tier that shows the lines of `copy:step3.table.modes`, the apron card, and the name on the marquee. In every pinball still the ball is a clear ball with the cursor solid inside it. Evidence: the three tier stills, `table-wide` and the build's `table-map`, with the `type` view of each.
29. The take holds. Evidence: `npm run take -- --check` on the frozen build shows every pinball beat's event inside its beat, give or take `film.beatToleranceSeconds`, or the beats that fell back are listed.
30. The machine copies no real machine and no game. Evidence: `quality.jury.jurors` fresh agents are each given the three tier stills and `table-wide` and asked only whether this is an existing pinball machine or pinball video game and, if so, which. Their answers are logged. If two or more name the same one, it is a failed item.

## The films, the sound and the card

31. Film B's preview exists as `export.files.previewB`, has the frame count of the cut list at `film.previewFps`, and carries sound if any sound exists. Evidence: `ffprobe`.
32. Film A's preview exists as `export.files.previewA`: the opening, then film B unchanged. The opening shows the prompt in `intro.prompt` typed at a readable speed, the reasoning level set to `intro.reasoningLevel`, the send, and the build screen with `intro.title` and every line of `intro.steps`. Evidence: `ffprobe`, and the sheet across the opening.
33. Frame 0 of film B is a finished picture with the cursor already moving. Evidence: frame 0, and `filmState` of frames 0 and 6 showing the cursor in two places.
34. The lengths hold. Evidence: G7.
35. `cut/CUES.md` lists every beat, every event with its cue and every narrator line by time and frame, and the sound is in sync. Evidence: A9.
36. The final mix measures within one unit of `audio.filmLoudnessLufs` and peaks at or under `audio.truePeakDb`. Made twice, it is byte equal. Evidence: A6 and A7.
37. Every kept sound has its record and its row in `ASSETS.md`, no cue or line went over its take limit, and every narrator line says its words. Evidence: A5, A8 and A10.
38. `deliver/` holds the card loop, its web copy and the card still. The still is the loop's frame 0. Evidence: D6.
39. The loop's frame one past the last is pixel-identical to frame 0. Evidence: G14 on the frozen build.
40. The cursor and the thing it is up against stay inside a centred 4:3 crop and a centred square crop in every loop frame. Evidence: `loopState` for every frame.
41. `deliver/POST.md` holds its three parts. Evidence: D7.
42. `npm run render:local -- --proof` ran on the frozen build and both of its files pass `ffprobe`. Evidence: D3.

## Hosting and the machine

43. `npm run hostcheck` on the frozen build is inside every limit in `host`. Evidence: G16.
44. A clean clone builds with nothing but the repo's packages, and `dist/` holds no file from `assets-full/`, `audio/`, `references/`, `out/`, `pipeline/` or `scorecards/`.
45. `vercel.json` and `.vercelignore` exist and name the build command, the output folder and the ignored folders.
46. The site needs only what `config/webgl-caps.json` marks portable. Evidence: G10.
47. Texture memory and counts are inside their limits for every page and every level. Evidence: G15.
48. `npm run determinism` passes on the frozen build. Evidence: G3.

## The repo

49. `README.md` holds: what this is, the site's address, how to play it, the commands for the local render starting with the test, the steps to deploy, where the sound files are, and the credits.
50. `ASSETS.md` lists every third-party file with its source and license, the terms read for the image tools and the sound tool, and a row for every kept sound.
51. No tracked file is over `repo.maxFileMb`, no secret is tracked, `references/approved/` still matches its manifest, and `content/copy.json` still matches `content/MANIFEST.sha256`. Evidence: G9.
52. Every phase is marked `done`, every unit `finished` with what ended its loop, and "Open items", "Declined issues", "Review items not done" and "For Brandon to decide" are up to date in `kit/PROGRESS.md`.
