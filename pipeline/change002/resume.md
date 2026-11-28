# Change note 002, item 3: the Resume stage

Branch `agent/b-resume`, made from `origin/agent/b-step1` at a5508ada. Files: `src/pages/step1/resume/*` only, behind `makeResume(host: ResumeHost): ResumeStage`; own tests `tests/b-resume.test.ts`, `tests/b-resume-visitors.test.ts`. Every claim below is labelled MEASURED (by a test or a tool run on this tree), STATED (read from code, a brief or a ruling, not run) or UNKNOWN.

## What was built

The user's sequence, in the film and on the live site:

1. The Resume field looks ordinary: the drop zone with its prompt and the Browse files chip, nothing else. (STATED)
2. The arrow presses Browse files: the chip goes down. Event `browse-press`. (MEASURED, tests/b-resume.test.ts)
3. A folder window comes up out of the page beside the drop zone: a small frosted window of this world with a brushed bar, an orange knob, the title "Documents" and one file row, the sheet at its left and the name "Resume.pdf" beside it. Event `folder-open`. The arrow picks the file: the row goes down and an orange ring lights round it. Event `file-pick`. (MEASURED for the events; the look is seen on proof/resume/film-beat-step1_resume.jpg)
4. The sheet leaves the folder (event `paper-slide`, the old name kept), flies in a low arc into the drop zone and lies there (event `slot-in`); the folder window sinks back into the page. (MEASURED for the events)
5. Wind catches it: streaks cross the drop zone, the sheet shivers, lifts, swings and is carried to the slot under the drop zone (event `wind-gust`). The machine comes up as the wind starts, with an orange plastic plate beside the slot that says "SHREDDER" (34 px type on the page; it is the largest word in the tug frame). (MEASURED for the event; the plate is seen on proof/resume/film-beat-step1_tug.jpg)
6. The slot takes the sheet (0.4 s, as before) and only then `shredder` and `arms-out` fire and the tug of war runs. The tug's curve, its cues, its loss, the strips and the mend are the old code, untouched. (STATED: no line of the tug, the loss or the strips was changed; see "What is off" for what the first half second of the tug shows)
7. The drop zone says "Resume received. Please re-enter all information manually." Event `resume-received`, once, on the step the message shows, in the film and on the live site; a skip of the stage does not emit it (accepted by the Builder, 22:44Z). (MEASURED: one event in the film; 200 of 200 live visitors got exactly the events in order)
8. Film only, by the Builder's ruling of 22:44Z: the message is held 5.5 s (`HOLD` in script.ts, one number). In it the arrow drags itself off the slot as before, looks up at the message, goes up under it and sags, then trudges to Continue and presses it. No new machine and no new word. (MEASURED with the config patch below)

## New events and wanted sound lengths

| Event | When | Wanted length |
| --- | --- | --- |
| `browse-press` | the chip is pressed | 0.15 s |
| `folder-open` | the folder window comes up | 0.35 s |
| `file-pick` | the file tile is picked | 0.2 s |
| `slot-in` | the sheet lands in the drop zone | 0.3 s |
| `wind-gust` | the wind takes the sheet | 0.9 s |
| `resume-received` | the message shows (narrator line 3 hangs on it) | none: the narrator's line |

Kept: `paper-slide` (now the sheet leaving the folder), `shredder`, `arms-out`, `paper-strain`, `tug-lost`, `strips-zip`, `shredder-stop`. Accepted by the Builder at 22:15Z. (STATED)

## Words on screen

All from `content/copy-drafts.json`, none added, no file under `content/` edited. (STATED) Where each stands (MEASURED from the film's draw list, page px):

| Word | Key | Stands on | Box of the words | Shown |
| --- | --- | --- | --- | --- |
| "Documents" | `copy.drafts.step1.resume.folderTitle` | the brushed bar of the folder window (bar x 1012, y 358, 736 by 72; window x 1000, y 346, 760 by 262, on the bare page right of the drop zone, 130 px over Continue) | x 1078, y 378, 243 by 32 | from `folder-open` until the window sinks, 20.96 to 21.87 s in the film |
| "Resume.pdf" | `copy.drafts.step1.resume.fileName` | the file row in the folder window (row x 1028, y 452, 704 by 132; the sheet x 1056, y 474, 64 by 88), right of the sheet on its middle line, y 518 | x 1148, y 502, 253 by 32 | with the window |
| "SHREDDER" | `copy.drafts.step1.resume.shredderLabel` | the orange plate on the bare page left of the slot (plate x 511, y 672, 226 by 52) | x 533, y 686, 182 by 25 | from the wind until the machine sinks after the message |

The folder window was made larger, not longer, by the Builder's word of 23:19Z: 760 px wide where it was 500, its two words 32 px high where they were 19 and 17 (type 44 px), the tile 304 by 202; the seconds are the same. I chose the larger window over a nearer camera because the live site has no camera, and the film's camera would have had to go in and out again inside 0.9 s before its one move to the tug. The sheet in the tile keeps its real size, 64 by 88, so it is small beside its name. (MEASURED for the boxes, STATED for the reason)

By the Builder's word of 23:31Z the tile is now one row across the window, as a file list shows a file: 704 wide inside the 736 of the bar, the sheet at its left, the name to its right on the sheet's middle line, the orange ring round the whole row (x 1021, y 445, 718 by 146). The window is 262 high where it was 338, since the name no longer stands under the sheet. Both words are 32 px high as before and every event is on the step it was on. The sheet that is picked is the sheet that flies: one box, 64 by 88, no scale. I set the row beside the tile in my own frames 2 and 3 and keep the row: the glass right of the tile is gone and the name is read in one line with its sheet. In the film the arrow's tip stands on the sheet, 8 px left of its middle and 4 px over it, so that it does not cover the name. (MEASURED for the boxes and the events; STATED for the judgment)

Words that were there before and are unchanged: "Resume", "Drag and drop your resume here", "Browse files", "Resume" on the sheet, "Resume received. Please re-enter all information manually."

What stands on the drop zone's panel and what does not (STATED from the boxes above): the folder window, its tile and ring, the plate and the slot stand on the bare page. The sheet lies on the panel for 0.25 s (film) and the wind's streaks cross over it; neither is fixed to the panel, both are placed by page px and would lie on and cross the bare page if the panel went.

## Needs outside my folder

`pipeline/change002/resume-NEEDS.patch` (config/showcase.json only, the Builder's to apply): film.units step1 32 to 37.5; beats step1.resume 20 to 23.5, step1.tug 23.5 to 29.75, step1.shredded 29.75 to 37.5. plannedSeconds and maxSeconds are not touched. Until it is applied the branch's film still turns the page at 31.500 s, on the step the message shows, and the arrow's moves in the hold are not made (each move is written only if it ends before the turn).

The outside tests that are red are listed at the end with the reason for each.

## Measurements

### The film (MEASURED by tests/b-resume.test.ts with the config patch applied; seconds of the step 1 unit, 240 steps a second, 60 frames a second)

| Moment | Second | Step |
| --- | --- | --- |
| the drop zone is first drawn | 20.342 | 4882 |
| `browse-press` | 20.850 | 5004 |
| `folder-open` | 20.954 | 5029 |
| `file-pick` | 21.500 | 5160 |
| `paper-slide` | 21.621 | 5189 |
| `slot-in` | 22.075 | 5298 |
| `wind-gust` | 22.321 | 5357 |
| `shredder`, `arms-out` (the bite) | 23.525 | 5646 |
| `strips-zip` | 30.671 | 7361 |
| `resume-received` | 31.500 | 7560 |
| `button-press` (the film's arrow on Continue) | 36.692 | 8806 |
| `page-turn` | 37.000 | 8880 |

How long each of the five beats is on screen in the film:

| Beat | From | To | Seconds | Frames |
| --- | --- | --- | --- | --- |
| the ordinary field | 20.342 | 20.850 | 0.508 | 31 |
| the folder window (Browse pressed to file picked) | 20.850 | 21.500 | 0.650 | 39 |
| the sheet into the drop zone (picked, flies, lies) | 21.500 | 22.321 | 0.821 | 49 |
| the wind | 22.321 | 23.125 | 0.804 | 48 |
| the slot takes it, then the bite | 23.125 | 23.525 | 0.400 | 24 |

No beat of the first four is under 0.5 s; the fifth is the old 0.4 s catch by the slot, which was not mine to change. (MEASURED)

The shift: the bite is 1.500 s later than before change note 002, 360 steps, 90 frames at 60 a second (old step 5286, second 22.025; new step 5646, second 23.525). Everything from the bite to `resume-received` is later by the same 1.500 s. (MEASURED)

The old key picture's moment (25.125 s of the unit, 0.44 of the sheet eaten) now occurs at 26.625 s of the unit. (STATED: 25.125 plus the measured shift; `CAMERA.key` in script.ts still says 25.125 and the still's time is not mine to change)

Arms are shown from 23.533 to 28.337 s, inside the beat step1.tug of the patch (23.5 to 29.75). (MEASURED)

The message stands 5.496 s on a still page before the page turns, from 31.504 to 37.000 s. Narrator line 3: 5.5 s of it fall inside step 1 before the turn starts and 6.0 s before the unit ends at 37.5 s. Without the config patch: 0 s before the turn and 0.5 s before the unit ends. (MEASURED for the stand; STATED for the sums)

The film's tug against the old one, frame by frame from `arms-out` for 271 frames, each 90 frames later (MEASURED by a comparison with the tree at a5508ada): the arrow's place differs by 0.35 px at the most; its lean, length and feel differ in the first 24 frames (0.4 s) because it now arrives from a run after the sheet, nervous, where it used to arrive carrying the sheet, proud: lean 0.225 before and -0.101 now on the first frame, length 1.126 and 0.935, sweat 0 and 0.93 fading to 0.03 by frame 24. From frame 30 on every value is equal to three decimals, to the last frame.

### The live site (MEASURED by tests/b-resume-visitors.test.ts: 200 seeded visitors, keen until the stage, then 165 clumsy, 10 idle, 25 wandering)

- 200 of 200 get through to "Resume received" without a skip: 165 of 165 clumsy, 10 of 10 idle, 25 of 25 wandering.
- Clumsy visitors: stage begun to Browse pressed, least 0.66, middle 1.40, most 2.88 s; folder up to file picked, least 0.74, middle 1.45, most 2.52 s.
- All visitors: Browse pressed to folder up 0.12 s; file picked to the sheet leaving 0.22 s; flight 0.55 s; lying in the drop zone 0.50 s; wind and catch 1.36 s (wind 0.95, catch 0.4); bite to the tug lost 8.02 to 8.62 s; tug lost to the message 3.42 to 3.43 s. Stage begun to the message: least 16.36, middle 17.83, most 34.65 s. An idle visitor is taken through at the film's pace once the skip link is up (20 s).
- The longest the arrow is held from a visitor: 4.24 s (limit 8). The page takes the arrow at the wind, runs it after the sheet, and gives it back 0.55 s before the bite; the tug then takes it as before. The page's own hold in the wind is 0.80 s (STATED: the wind's 0.95 s less its last 0.15 s, since the arrow is given back 0.55 s before the bite and the catch is 0.4 s). The 4.24 s is the tug's (MEASURED); whether the old stage held the arrow for the same 4.24 s I did not measure (UNKNOWN).
- The visitor presses Browse files himself (a press on the chip, 26 px of slack, or anywhere in the drop zone) and picks the file himself (the row, 704 by 132, 26 px of slack). The stage's skip still works at any beat.

UNKNOWN: how the stage plays under a real finger on a touch screen; the tests press with the stepped pointer only. The touch page's rules are the stage's own as before (a press lands where the arrow is).

## What is off

1. The live take is not the old one frame for frame (MEASURED at 00:24Z, tests/polish-tug.test.ts, tests/polish-tug2.test.ts and tests/polish-tug3.test.ts). The page takes the arrow at the wind, runs it after the sheet and gives it back on the step the tug begins, over a blend of 0.3 s (item 8). In the old take the arrow was free in the visitor's hand at the bite; now it stands by the slot and the paper takes it from the page's hold. What differs:
   - tests/polish-tug.test.ts "reaches before it grabs": the body leans 0.037 rad toward the paper by the time the hands close, where the test asks more than 0.05. The arms and the hands are as asked (0.18, 0.47, 0.73, 0.91 of their length after 1 to 4 frames, closed 0.079 s after the bite). Green before this change. (MEASURED)
   - tests/polish-tug2.test.ts "hauls the arrow in fastest in the first frames and ends with a stop", for the pack's visitor and for the keen bot: the haul is slow and even, not fastest at first (visitor 0.4, 2.6, 2.2, 2.8, 2.1, 3.1, 2.7, 0.9, 3.7, 1.1 px nearer the slot a frame; keen 3.2, 2.8, 3.4, 3.5, 3.2, 2.9, 2.5, 2.0, 1.6, -2.0), because the arrow already stands near the slot (under the keen bot it has 36 px to go), not out at the mouse. The keen bot's case was green before this change. (MEASURED)
   - tests/polish-tug3.test.ts "turns no more than the named degrees in a frame ...: visitor": three frames over 4 degrees (5.64 and 11.53 the first two). The same test for the keen bot is green now; it was red with the run back. (MEASURED)
   - tests/polish-tug3.test.ts "moves no event of the tug": the list of strains by frame differs from the old one. (MEASURED that it differs; which frames, not read again after this change: UNKNOWN)
   - A shorter blend makes it worse: with 0.1 s seven tests of these are red, with 0.5 s six, another one among them. 0.3 s is kept. (MEASURED)
   - The pack visitor's haul from rest (the Builder's third point of 23:55Z) is not built. With the one hold the haul no longer starts at the visitor's mouse at all, so the old first frame of 15.8 px cannot come back by a change to the haul alone. (STATED)
   tests/fix-tug.test.ts and tests/polish-tug4.test.ts are green. The other way the Builder named, a chase capped at about 120 px with the give back before the bite, keeps tests/polish-tug.test.ts green and leaves a short way back; it is not built, because the one hold stays under the limit.
2. The first 0.4 s of the film's tug differ in the arrow's lean, length and sweat, as measured above, because the arrow arrives from a run. The pointer's path, the cues, the curve and the loss are the old ones. From frame 46 after the bite to the 460th every value of the arrow's pose is within 0.001 of the old one, through the shredding. (MEASURED) Tried at 00:17Z and not kept: a cue that makes the arrow proud 0.48 s before the bite, as the old arrow was when it carried the sheet. With it the feelings are equal from the first frame (lean off by 0.024 rad for 0.326, sweat by 0.014 for 0.93), but the squash is off by 0.169 at the first frame and about 0.06 through frame 18, and the arrow is 1.6 px off at the first frame; equal from frame 30 for 45. It was not judged by frames before and after in the time there was, so the script is as it was. (MEASURED for the numbers)
3. The strips of the shredded arrow in the film: tests/polish-tug-strips.test.ts asks that the middle of no strip goes more than 8 page px in a film frame; in the strips' first frame the sixth strip's middle goes 8.27 px. The cause is found (MEASURED at 23:58Z, with the test's own measure run three ways on this tree and once on the tree at a5508ada):
   - The feed is the old one. The strips are born on the same step of the frame (step 7088, 360 after the old 6728, both 0 of 4), and the arrow's pose on that step and the nine after it is equal to the old one in every digit printed: place, lean, squash, bend, and the share fed out (0, 1/32, 2/32 and so on). The share of the strip that is drawn is 0.120 on its first step and 0.278 a frame on, before and after. The feed's speed did not go up.
   - With the body's tremble taken out, the sixth strip's middle goes 7.78 px in that frame, before and after alike. That is the feed alone.
   - The arrow is scared and trembles (tremble 0.7), and the tremble in src/cursor/model/deform.ts is a sum of sines of the absolute clock (83.1, 131.7, 97.3, 149.9 and 71.9 radians a second). It shakes the strips with the body. At the old clock (28.033 s) the shake took 0.85 px off that frame's stride: 6.93 px. At the new clock (29.533 s) it adds 0.49 px: 8.27 px. Drawing this tree's strips with the clock set 1.5 s back gives the old row to two decimals (6.93, 5.93, 6.24, 6.03).
   - So the strip is not born longer than the paper fed, and the cause is where the tremble's phase falls, not the strips and not my timing of the feed. The live clumsy bot's case went red and green by the same phase. (STATED)
   - The mend, by the Builder's ruling of about 00:05Z, in a commit of its own that starts "NEEDS:" (src/cursor/model/deform.ts and src/cursor/model/body.ts, outside my folder): a strip takes none of the body's shake at its birth and takes it up by degrees as it comes out, the whole of it once it is free of the mouth (the share is the strip's own `out`, 0 to 1 over the 2/15 s the mouth feeds it). The shake's clock is not touched, and a body with no strip under the hood is drawn by the same sums as before (the shake is multiplied by 1). Neither the limit nor a second is changed.
   - After the mend (MEASURED at 00:08Z with the test's own measure; the most any strip's middle goes in a film frame over the first second, limit 8): the film 7.87 px with the clock as it is, 7.77 px with the clock 1.5 s back, 7.84 px with it 1.5 s forward, 7.78 px with no tremble; the live clumsy bot 7.66, 7.73, 7.71 and 7.71 px. Before the mend: the film 8.27 px as it is and 6.93 px 1.5 s back. In all eight cases the most is the first frame. I did not try every phase of the clock; in the first frame a strip now takes an eighth of the shake at the most. (MEASURED for the numbers, STATED for the last sentence)
   - Eight film frames in a row from the strips' birth (unit seconds 29.533 to 29.650, draft tier, cut out round the mouth and doubled): `strips-mouth-before.jpg` and `strips-mouth-after.jpg`. The two sets differ by 92 to 690 picture points a frame of 2,073,600 at a 4 percent threshold; the half pixel is not to be seen by eye, the measure above is the proof. (MEASURED)
4. The fifth beat (the slot takes the sheet) is 0.400 s on screen, under the half second asked of a beat; it is the old catch, kept.
5. Until the config patch is applied the branch's own film shows the message for 0 s before the page turns.
6. The folder window is not movable and has no close knob that works; a press outside the file does nothing. (STATED)
7. The proof sheets of the film were made before the mend of the ground under Browse files; the clean frame of the drop zone and the live sheet were made after it. In both the arrow stands whole on top of the Browse files chip (MEASURED by looking at the frames; before the mend the ground under the chip was the panel's 12 px and the chip stands 20 px over the page).
8. On the live site the arrow runs after the sheet as in the film, and the page holds it in one hold from the wind to the bite (the Builder's word of 00:19Z, his first way): from 0.21 s into the wind it runs, slow at first, on a path bent 16 px, toward the film's place by the slot (96 px left of the slot and 176 px above it), is outrun, stands there while the slot takes the sheet, and is given back on the step the tug begins, when the paper has it by the hands. It does not run back to the mouse before the arms come out. Under the keen bot the arrow goes from x 551, y 518 to x 707, y 497 (157 px) and stands; after the bite the old code of the tug hauls it to x 743, y 503. The hold by the stage's own measure: 1.36 s from the wind to the bite, under the keen and the clumsy bot alike; the longest hold of a run is still the 4.24 s after the tug is lost (limit 8). In the tug between the two the arrow is not held: the visitor pulls, as before. From the wind to the give back after the loss, the tug counted in, it is 14.0 s under the keen bot; the stage does not count the tug as a hold because the visitor's hand is heard in it. tests/site-pointer.test.ts passes (the place of the give back lies in the gag step1.tug, which that test names as held by the paper); the stage's tests pass; 200 of 200 visitors through. Frames every 0.1 s from 0.27 s into the wind: `live-chase-before-keen.jpg` (no chase, the tree before 00:04Z), `live-chase-after-keen.jpg` (the chase with the run back, the commit of 00:04Z, replaced), `live-chase-onehold-keen.jpg` (as it stands). The price is in the tests of the old live take, item 1. (MEASURED at 00:24Z)
9. No sound exists for the five new events. (STATED: the Builder buys them after the first passes)

## Proof

Under `pipeline/change002/proof/resume/`: `film-beat-step1_resume.jpg` (field, press, folder, pick, flight, lying, wind, catch), `film-beat-step1_tug.jpg` (the tug with the plate SHREDDER), `film-beat-step1_shredded.jpg` (the loss, the message, the arrow's moves in the hold, Continue), `clean-resume-drop-zone-1920x1080.jpg`, `clean-shredder-1920x1080.jpg`, `live-keen-step1.jpg`.

One clean film frame of each stage at 1920 by 1080, home camera, draft tier, with the config patch applied (MEASURED seconds of the unit):

| File | Stage | Second |
| --- | --- | --- |
| `clean-1-browse-1920x1080.jpg` | the arrow presses Browse files | 20.90 |
| `clean-2-folder-open-1920x1080.jpg` | the folder window is up | 21.20 |
| `clean-3-file-picked-1920x1080.jpg` | the file is picked, ring lit | 21.56 |
| `clean-4-slot-1920x1080.jpg` | the sheet lies in the drop zone | 22.20 |
| `clean-5-wind-1920x1080.jpg` | the wind carries it; the plate is up | 22.75 |
| `clean-6-shredder-label-1920x1080.jpg` | the slot has it, beside the plate SHREDDER | 23.40 |
| `clean-7-arms-1920x1080.jpg` | the arms, the tug | 24.50 |

In the film itself the camera moves in from 22.38 s; these stills are taken from the home camera so that the whole page is seen. (STATED)

What each stands in or on (MEASURED from the draw list, page px):

- The resume drop zone: its own frosted glass panel, box x 128, y 342, 804 by 322, 12 px high, standing on the bare page; Browse files is a capsule on that panel, x 435, y 536, 191 by 50, its top 20 px over the page.
- The shredder: it comes out of the bare page under the drop zone's lower rim, no tray and no box: the slot's well x 755, y 668, 96 by 10 (44 px deep), its lip x 753, y 663, 100 by 4, its cassette x 755, y 668, 96 by 22 (32 px high when up). The plate SHREDDER is orange plastic on the bare page, x 511, y 672, 226 by 52, 8 px high.

## Outside tests that are red (not edited)

On the tree of the commit 5e171b29 (the one hold on the live site, the mend of the strips, the file as one row), with the config patch applied: `npx tsc --noEmit -p .` EXIT 0. `npm run determinism` EXIT 0: pass, 12 pictures identical across two fresh loads and two orders (MEASURED, 00:25Z to 00:30Z). `npm test` EXIT 1: 31 failed, 2148 passed, 35 skipped of 2214 in 193 files, 17 files red (MEASURED, 00:30Z to 00:34Z): 8 red before this work, 5 by the unit's growth, 18 by this stage, listed below. `npm run bots` EXIT 1: all 20 runs finish (keen and clumsy with no skip, 36 of 37 gags; pointer ignored 4.24 s at the most), one problem named: keen never reaches the gag step1.lastName, which config/showcase.json lists and no file under src/ holds since a5508ada (MEASURED at 00:35Z; not this stage's: the Builder says at 23:55Z that the gag goes at the merge).

Red before this work, at a5508ada (MEASURED, 8 tests with the two of the cut): tests/b-shell-chrome.test.ts (1), tests/b-shell-fields.test.ts (2), tests/pack-site.test.ts R4 (1), tests/polish-hand.test.ts turn 1 (1), tests/site-finish.test.ts "a keen hand through this driver finishes as the keen bot does" (1: 36 gags against 37; the keen bot reaches all three of the stage's gags). tests/cut-of-build.test.ts (2) is red on branches until the Builder runs the cut (STATED by the brief).

Red by the unit's growth to 37.5 s, green without the config patch (MEASURED, 5 tests): tests/film-cut.test.ts "matches cut/CUTLIST.json in its frame counts" (9510 frames against 9180), tests/pack-hit.test.ts "gives the machine its own sheets" (frame 4350 against 4158), tests/polish-sharp-shadow.test.ts "had the shadow on in the film while the ball was in the tube" (frames 4595, 4866 against 4265, 4536), tests/polish-turn2.test.ts "turns five pages by the clock" (13.5, 51, 72, 114, 146 s against 13.5, 45.5, 66.5, 108.5, 140.5) and "holds every value of the stage equal to before".

Red by this stage (MEASURED, 18 tests; the reason is STATED from reading each test unless a number is given):

- tests/step1-script.test.ts "keeps the cursor, the hands and the slot well inside the frame all through the tug": counts the tug's steps up to a fixed second; 882 counted, more than 1080 asked. Pins the old seconds.
- tests/step1-script.test.ts "empties the form a field at a time before it says the resume was received": reads up to 31 s; the form is empty at 31.5 s now. Pins the old seconds.
- tests/step1-script.test.ts "hangs strips of paper under the hood from the first bite ... frames them at the key picture": reads the strips at 25.125 s; that moment is at 26.625 s now. Pins the old second.
- tests/step1-script.test.ts "moves straight in to one frame ... stands dead still there from before the first bite": asks the camera to stand before 22.03 s; it stands at 23.3 s, before the new bite at 23.525 s. Pins the old second.
- tests/step1-script.test.ts "draws the upload glyph above the prompt of the drop zone until the resume is received": asks the message by 31 s. Pins the old second.
- tests/step1.test.ts "shows no word that is not a key, at any moment of the film or of a live run": reads the film up to 31.4 s and asks to have seen the message. Pins the old second.
- tests/step1.test.ts "shows arms only in the tug, never takes the pointer for long, and hands a whole cursor over": asks a whole cursor at 31.45 s; the arrow is whole at 31.685 s now. With the patch the arms are inside the beat.
- tests/step1.test.ts "fights the tug in every second": counts the tug's steps up to 28.2 s; 1122 counted, more than 1200 asked. Pins the old second.
- tests/step1.test.ts "lands the reset at least 1.4 s before the page turns": reads up to 32 s; the turn is at 37 s with the patch, and the hold is 5.5 s.
- tests/step1.test.ts "the Continue button is drawn light while the form is empty at rest and dark once the form can be sent": asks the dark button at 30.2 s; it is dark from 31.5 s. Pins the old second.
- tests/cursor-act.test.ts "in the film of step 1 the arms are in the tug and nowhere else": pins the old seconds of the arms.
- tests/polish-keys2.test.ts "holds the same events at the same frames in the film": 283 events against 268; the new events and the later frames.
- tests/polish-tug3.test.ts "the arrow in the tug of the film is as it was": a sum over the frames' numbers and poses; the frames are 90 later and the first 24 differ as measured above.
- tests/polish-tug3.test.ts "moves no event of the tug" and "turns no more than the named degrees in a frame ...: visitor"; tests/polish-tug2.test.ts "hauls the arrow in fastest in the first frames and ends with a stop" for the visitor and for the keen bot; tests/polish-tug.test.ts "reaches before it grabs ...": the live take, item 1 of "What is off".
- tests/polish-tug-strips.test.ts is green since the mend of the strips (item 3 of "What is off"): 5 passed, 1 skipped.

## The 31 red tests, one table (for pinning at the merge)

MEASURED from the run of `npm test` at 00:30Z to 00:34Z on the tree of 5e171b29 with the config patch (unit 37.5 s). "Reads now" is what the failing line received; "asks" is what it expected. Causes: OLD is red at a5508ada before this work; UNIT is red only by the unit's growth of 5.5 s; SHIFT is the stage's 1.5 s later bite and the 5.5 s hold; LIVE is the one hold on the live site. The step 1 helper's cut of 2.1 s (eca20421) will move every film second and frame below again; the numbers hold for this tree only. The columns "Reads now" and "Asks" are MEASURED from the run's log; the column "Cause" and the words in brackets are STATED from reading each test, and the seconds in brackets were measured earlier this night on the same film times, not again in this run.

| # | File | Test | Cause | Reads now | Asks |
|---|------|------|-------|-----------|------|
| 1 | tests/b-shell-chrome.test.ts | leaves every page of the build as it was: none says anything of the header | OLD | step1: a list of 24 that differs | the old list of 24 |
| 2 | tests/b-shell-fields.test.ts | leaves every page of the build as it was: none reports fields | OLD | step1 has a `fields` function | undefined |
| 3 | tests/b-shell-fields.test.ts | draws a page with a rail that reports nothing, null, or no fields at all as 0 of 1 | OLD | another rail string for null | the old string |
| 4 | tests/pack-site.test.ts | R4: a key of the page keyboard at every step | OLD | false | true |
| 5 | tests/polish-hand.test.ts | turn 1: while the tray under the arrow hops on the seat | OLD | 0 | more than 8 |
| 6 | tests/site-finish.test.ts | a keen hand through this driver finishes as the keen bot does | OLD (the gag step1.lastName is listed and not built) | 36 gags | 37 |
| 7 | tests/cut-of-build.test.ts | the files of cut/ are, byte for byte, what this build gives | OLD (cut/ not run on the branch) | 3 files differ | run `npm run cut` |
| 8 | tests/cut-of-build.test.ts | the plan a mix is laid by is read from the committed cut list | OLD (same) | the build gives 940 events and 20 lines; event 36 is step at frame 903 | cut/CUTLIST.json: 977 events, event 36 at frame 905 |
| 9 | tests/film-cut.test.ts | matches cut/CUTLIST.json in its frame counts | UNIT | 9510 frames in the build | 9180 on disk |
| 10 | tests/pack-hit.test.ts | gives the machine its own sheets | UNIT | frame 4350 | 4158 |
| 11 | tests/polish-sharp-shadow.test.ts | had the shadow on in the film while the ball was in the tube | UNIT | frames 4595, 4866 | 4265, 4536 |
| 12 | tests/polish-turn2.test.ts | turns five pages by the clock | UNIT | 13.5, 51, 72, 114, 146 s | 13.5, 45.5, 66.5, 108.5, 140.5 s |
| 13 | tests/polish-turn2.test.ts | holds every value of the stage equal to before on every step from the seat on | UNIT | frame pairs 3061/3089, 4321/4349, 6841/6869, 8761/8789 (the first, 811/839, as before) | 2731/2759, 3991/4019, 6511/6539, 8431/8459 |
| 14 | tests/step1-script.test.ts | keeps the cursor, the hands and the slot well inside the frame all through the tug | SHIFT (counts up to a fixed second) | 882 steps | more than 1080 |
| 15 | tests/step1-script.test.ts | empties the form a field at a time before it says the resume was received | SHIFT (reads up to 31 s; empty at 31.5 s) | '11', '10' | '11', '10', '00' |
| 16 | tests/step1-script.test.ts | hangs strips of paper under the hood from the first bite ... frames them at the key picture | SHIFT (reads at 25.125 s; that moment is at 26.625 s) | 0.104 | more than 0.15 |
| 17 | tests/step1-script.test.ts | moves straight in to one frame 590 px of page wide ... stands dead still there from before the first bite | SHIFT (the bite is at 23.525 s) | camera stands from 23.3 s | before 22.03 s |
| 18 | tests/step1-script.test.ts | draws the upload glyph above the prompt of the drop zone until the resume is received | SHIFT (asks the message by 31 s; it shows at 31.5 s) | false | true |
| 19 | tests/step1.test.ts | shows no word that is not a key, at any moment of the film or of a live run | SHIFT (reads the film up to 31.4 s) | step1.resume.received not seen | seen |
| 20 | tests/step1.test.ts | shows arms only in the tug, never takes the pointer for long, and hands a whole cursor over | SHIFT (asks a whole cursor at 31.45 s; whole at 31.685 s) | arms at 31.45 s: true | false |
| 21 | tests/step1.test.ts | fights the tug in every second | SHIFT (counts up to 28.2 s) | 1122 steps | more than 1200 |
| 22 | tests/step1.test.ts | lands the reset at least 1.4 s before the page turns | SHIFT (reads up to 32 s; the turn is at 37 s, the hold 5.5 s) | -32.5 | at least 1.4 |
| 23 | tests/step1.test.ts | the Continue button is drawn light while the form is empty at rest and dark once the form can be sent | SHIFT (asks the dark button at 30.2 s; dark from 31.5 s) | 'metal', 'ink' | 'accent', 'inkLight' |
| 24 | tests/cursor-act.test.ts | in the film of step 1 the arms are in the tug and nowhere else | SHIFT (pins the old seconds of the arms; arms from 23.525 s to 31.685 s) | true | false |
| 25 | tests/polish-keys2.test.ts | holds the same events at the same frames in the film | SHIFT and the new events | 283 events | 268 |
| 26 | tests/polish-tug3.test.ts | the arrow in the tug of the film is as it was | SHIFT (frames 90 later; the first 24 poses differ) | sum 3c7f089aa9df | 3fd04e799d7e |
| 27 | tests/polish-tug3.test.ts | the arrow at a strain of the paper, live: moves no event of the tug | LIVE | strains at frames 139 and 356 after the bite; the other nine lines as before | 138 and 355 |
| 28 | tests/polish-tug3.test.ts | turns no more than the named degrees in a frame ...: visitor | LIVE | frame 1915: 5.64, 1928: 11.53, 1929: 6.04 degrees | none over the named degrees |
| 29 | tests/polish-tug2.test.ts | the page takes the arrow from the visitor: hauls the arrow in fastest in the first frames and ends with a stop | LIVE | fastest frame of the haul is frame 8 (0.4, 2.6, 2.2, 2.8, 2.1, 3.1, 2.7, 0.9, 3.7, 1.1 px a frame) | frame 2 or sooner |
| 30 | tests/polish-tug2.test.ts | the page takes the arrow from the keen: hauls the arrow in fastest in the first frames and ends with a stop | LIVE | fastest frame is frame 3 (3.2, 2.8, 3.4, 3.5, 3.2, 2.9, 2.5, 2.0, 1.6, -2.0 px a frame) | frame 2 or sooner |
| 31 | tests/polish-tug.test.ts | reaches before it grabs: ... the body leans toward the paper as they go | LIVE | lean 0.0369 rad (hands close 0.079 s after the bite; arms 0.18, 0.47, 0.73, 0.91) | more than 0.05 |

Film moments of this tree to pin from (MEASURED, unit seconds, steps of 240 a second): browse-press step 5004 (20.850 s), folder-open 5029 (20.954), file-pick 21.500, slot-in 22.075, wind-gust 5357 (22.321), bite with shredder and arms-out 5646 (23.525), resume-received 7560 (31.500), page turn 8880 (37.000). Live, keen bot: wind 18.975 s, bite 20.333 s, the hold after the loss 28.733 to 32.971 s.

## The release at the bite, mended (branch agent/b-resume2, from agent/merge55 at afbf7ec5)

Asked by the Builder at 04:52Z. All numbers MEASURED between 04:52Z and 05:07Z unless labelled otherwise; the pack's own visitor on the live path, frames of 60 a second, the grab at frame 1801.

What the eye saw before (`proof/resume/live-release-before-visitor.jpg`, frames 1798 to 1831 at real size, the pointer's true place in magenta): a wobble. The arrow stood at x 707.3, y 497.0, the pointer lay at x 550, y 520; on the release the arrow swung down and left to x 669.6, y 556.4 at frame 1814 and tipped over, then was flung up and right after the hand to x 749.1, y 502.0 at frame 1824. The same numbers came out of the browser run and of the stepped stage.

The cause: the page gave the arrow back on the step the tug began while the hand that follows the hint still lay where the page had taken the arrow, 157 px away, so the arrow went to where the arms' pull and that left hand meet, and back when the hand came after.

The mend, three parts, all in src/pages/step1/resume/index.ts and all on the live path only:

1. While the page holds the arrow the hint is the place where the arrow will stand, so a hand that follows the hint finds the arrow in it at the bite and nothing is thrown.
2. A hand within 24 px of the arrow at the bite gets it at once, as before. A hand left elsewhere gets it when it has moved 14 px, or half a second after the bite, and its pull comes in over 0.34 s; until then the arms haul the arrow from where it stands (`LEFT`).
3. The live arrow stands 180 px left of the slot and 190 px above it (x 623.4, y 483.0), not at the film's place 96 left and 176 above. It is outrun 80 px into its run for 157 px. STATED reason: from the film's place the paper has 36 px to haul the arrow in, which reads as a twitch and is under the 60 px that tests/fix-tug.test.ts asks of the takeover; from here it hauls it 84 px in one go. Tried and measured: 150 and 200 (haul 75 px, the lean in the reach 0.046 rad, under the floor of 0.05) and 215 and 172 (haul 96 px, lean 0.060, three turns over 4 degrees under the keen bot); 180 and 190 kept (lean 0.053).

What the eye sees now (`proof/resume/live-release-after-visitor.jpg`, the same frames and window): a tug that begins. The arrow stands with the pointer on its tip; the arms reach the paper; the paper hauls the arrow in, x 623.4, y 483.0 to x 680.7, y 538.0 at frame 1812, its distance to the slot falling from 233 px to 147 px and rising by 5.2 px at the most after (145.4 to 150.6); the hand goes up to pull and the arrow goes after it to x 746.8, y 503.7 at frame 1824, leaning back against the paper. It still tips to 23 degrees while the hand goes up (frames 1815 to 1821) and is upright again by 1827; that is the hand's own move.

A hand that follows no hint (a visitor of the stepped stage whose pointer stays on the file row at x 1100, y 518): the arrow stays the page's for 0.5 s after the bite, the arms haul it from x 623, y 483 to x 692, y 549, then the hand's pull comes in over 0.34 s and the arrow goes to x 948, y 579, where that hand asks it. 258 px in about 0.3 s: by degrees, but it is not a short way. A real hand moves, and gets the arrow 14 px into its move.

Control taken: wind to bite 1.37 s (frames 1719 to 1801); with a hand left behind, 0.5 s more, 1.87 s in all; the longest of a run is the 4.24 s after the tug is lost for the keen and the clumsy bot and for the 200 seeded visitors, and 4.27 s for one seed of the random bot (where in its run: UNKNOWN, not looked for) (limit 8).

The film path: not changed by a frame. How it is known: every changed line is under `!film` or in `hint()`, which the film does not ask (STATED from reading); `npm run cut` on the mended tree writes cut/ with no byte changed (`git status --short cut` empty); the sum of the film tug's frames in tests/polish-tug3.test.ts is 6716d2638880 before and after the mend. That test is red at the head of agent/merge55 already (it asks 61d3d7851401) and is not this mend's.

Outside tests, not edited. At the head of agent/merge55: tests/polish-tug.test.ts "reaches before it grabs" (0.037 for 0.05), tests/polish-tug2.test.ts "hauls the arrow in fastest in the first frames and ends with a stop" for the visitor (fastest frame 8) and the keen bot (frame 3), tests/polish-tug3.test.ts "leaves the arrow to rest after its arrival ...: visitor" (2.41 degrees at frame 1831 for 2). With the mend:

- green: tests/polish-tug.test.ts "reaches before it grabs" (lean 0.053), tests/polish-tug2.test.ts for the keen bot, tests/polish-tug3.test.ts "leaves the arrow to rest ...: visitor", and tests/fix-tug.test.ts, tests/polish-tug4.test.ts, tests/site-pointer.test.ts, tests/step1.test.ts, tests/step1-script.test.ts as before.
- still red, on another line: tests/polish-tug2.test.ts "hauls the arrow in fastest in the first frames and ends with a stop" for the visitor. The fastest frame is the third now (4.1, 13.0, 13.1, 12.3, 10.9, 10.0, 8.4, 7.6, 6.5, 1.5 px a frame), which line 84 asks; line 85 asks the first three frames to average more than 1.4 times the three before the last, and reads 10.07 against 10.52. The first frame is slow because the haul starts from rest.
- red by the mend: tests/polish-tug3.test.ts "turns no more than the named degrees in a frame ...: keen": frame 1228: 4.05 and 1229: 5.10 degrees, 4 asked.

Not done: the whole suite and determinism were not run on this branch (not asked, and no time in the half hour); the stay-put hand above was measured on the stepped stage, not looked at in frames; frames 1795 to 1797 and 1832 to 1835 are left out of the strips to keep them at real size under 1.15 megapixels (the arrow stands still in them: MEASURED from the rows of the run).
