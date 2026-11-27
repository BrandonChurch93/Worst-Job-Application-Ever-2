# Change note 002, item 3: the Resume stage

Branch `agent/b-resume`, made from `origin/agent/b-step1` at a5508ada. Files: `src/pages/step1/resume/*` only, behind `makeResume(host: ResumeHost): ResumeStage`; own tests `tests/b-resume.test.ts`, `tests/b-resume-visitors.test.ts`. Every claim below is labelled MEASURED (by a test or a tool run on this tree), STATED (read from code, a brief or a ruling, not run) or UNKNOWN.

## What was built

The user's sequence, in the film and on the live site:

1. The Resume field looks ordinary: the drop zone with its prompt and the Browse files chip, nothing else. (STATED)
2. The arrow presses Browse files: the chip goes down. Event `browse-press`. (MEASURED, tests/b-resume.test.ts)
3. A folder window comes up out of the page beside the drop zone: a small frosted window of this world with a brushed bar, an orange knob, the title "Documents" and one file tile with the sheet and the name "Resume.pdf". Event `folder-open`. The arrow picks the file: the tile goes down and an orange ring lights round it. Event `file-pick`. (MEASURED for the events; the look is seen on proof/resume/film-beat-step1_resume.jpg)
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

All from `content/copy-drafts.json`, none added: `copy.drafts.step1.resume.folderTitle` "Documents", `fileName` "Resume.pdf", `shredderLabel` "SHREDDER". No file under `content/` was edited. (STATED)

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
- Clumsy visitors: stage begun to Browse pressed, least 0.66, middle 1.40, most 2.88 s; folder up to file picked, least 0.74, middle 1.50, most 2.86 s.
- All visitors: Browse pressed to folder up 0.12 s; file picked to the sheet leaving 0.22 s; flight 0.55 s; lying in the drop zone 0.50 s; wind and catch 1.36 s (wind 0.95, catch 0.4); bite to the tug lost 8.02 to 8.62 s; tug lost to the message 3.42 to 3.43 s. Stage begun to the message: least 16.43, middle 18.04, most 34.65 s. An idle visitor is taken through at the film's pace once the skip link is up (20 s).
- The longest the arrow is held from a visitor: 4.24 s (limit 8). The page takes the arrow at the wind, runs it after the sheet to the place the old take started from, and gives it back at the bite, where the arms take over as before.
- The visitor presses Browse files himself (a press on the chip, 26 px of slack, or anywhere in the drop zone) and picks the file himself (the tile, 26 px of slack). The stage's skip still works at any beat.

UNKNOWN: how the stage plays under a real finger on a touch screen; the tests press with the stepped pointer only. The touch page's rules are the stage's own as before (a press lands where the arrow is).

## What is off

1. The live take is not quite as it was (MEASURED, tests/polish-tug2.test.ts and tests/polish-tug3.test.ts). The page now runs the arrow to the place the old take started from (252 px left of the slot and 155 px above it) and lets go at the bite. Three old measures of the take are missed by a little: under the pack's visitor the first three frames of the haul average 13.4 px against the 14.1 px the test asks (1.4 times the last three); the arrow's angle changes more than 4 degrees in a frame on four frames under the pack's visitor (6.49 degrees at the most) and on two frames under the keen bot (6.30 at the most); the strains of the paper no longer fall on the frames the test lists. tests/fix-tug.test.ts, tests/polish-tug.test.ts and tests/polish-tug4.test.ts are green. UNKNOWN: by how many frames the strains moved.
2. The first 0.4 s of the film's tug differ in the arrow's lean, length and sweat, as measured above, because the arrow arrives from a run. The pointer's path, the cues, the curve and the loss are the old ones.
3. The strips of the shredded arrow in the film: one strip is whole after 8.27 frames where tests/polish-tug-strips.test.ts asks 8 or fewer. UNKNOWN why; no line of the strips was changed.
4. The fifth beat (the slot takes the sheet) is 0.400 s on screen, under the half second asked of a beat; it is the old catch, kept.
5. Until the config patch is applied the branch's own film shows the message for 0 s before the page turns.
6. The folder window is not movable and has no close knob that works; a press outside the file does nothing. (STATED)
7. The proof sheets of the film were made before the mend of the ground under Browse files; the clean frame of the drop zone and the live sheet were made after it. In both the arrow stands whole on top of the Browse files chip (MEASURED by looking at the frames; before the mend the ground under the chip was the panel's 12 px and the chip stands 20 px over the page).
8. On the live site the arrow does not chase the sheet across the zone as it does in the film; the page moves it only to the place the take starts from, which for a visitor who waits where the bot waits is no move at all. (MEASURED by looking at `live-keen-step1.jpg`)
9. No sound exists for the five new events. (STATED: the Builder buys them after the first passes)

## Proof

Under `pipeline/change002/proof/resume/`: `film-beat-step1_resume.jpg` (field, press, folder, pick, flight, lying, wind, catch), `film-beat-step1_tug.jpg` (the tug with the plate SHREDDER), `film-beat-step1_shredded.jpg` (the loss, the message, the arrow's moves in the hold, Continue), `clean-resume-drop-zone-1920x1080.jpg`, `clean-shredder-1920x1080.jpg`, `live-keen-step1.jpg`.

What each stands in or on (MEASURED from the draw list, page px):

- The resume drop zone: its own frosted glass panel, box x 128, y 342, 804 by 322, 12 px high, standing on the bare page; Browse files is a capsule on that panel, x 435, y 536, 191 by 50, its top 20 px over the page.
- The shredder: it comes out of the bare page under the drop zone's lower rim, no tray and no box: the slot's well x 755, y 668, 96 by 10 (44 px deep), its lip x 753, y 663, 100 by 4, its cassette x 755, y 668, 96 by 22 (32 px high when up). The plate SHREDDER is orange plastic on the bare page, x 511, y 672, 226 by 52, 8 px high.

## Outside tests that are red (not edited)

With the config patch applied the whole suite gives 31 failed, 2146 passed, 35 skipped of 2212 in 193 files (MEASURED at 22:57Z).

Red before this work, at a5508ada (MEASURED, 6 tests): tests/b-shell-chrome.test.ts (1), tests/b-shell-fields.test.ts (2), tests/pack-site.test.ts R4 (1), tests/polish-hand.test.ts turn 1 (1), tests/site-finish.test.ts "a keen hand through this driver finishes as the keen bot does" (1: 36 gags against 37; the keen bot reaches all three of the stage's gags). tests/cut-of-build.test.ts (2) is red on branches until the Builder runs the cut (STATED by the brief).

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
- tests/polish-keys2.test.ts "holds the same events at the same frames in the film": 284 events against 268; the new events and the later frames.
- tests/polish-tug3.test.ts "the arrow in the tug of the film is as it was": a sum over the frames' numbers and poses; the frames are 90 later and the first 24 differ as measured above.
- tests/polish-tug3.test.ts "moves no event of the tug", "turns no more than the named degrees in a frame ...: visitor" and "...: keen"; tests/polish-tug2.test.ts "the page takes the arrow from the visitor: hauls the arrow in fastest in the first frames and ends with a stop": the live take, item 1 of "What is off".
- tests/polish-tug-strips.test.ts "the film of step 1: each is fed down from the mouth's lower lip at an even pace": item 3 of "What is off".
