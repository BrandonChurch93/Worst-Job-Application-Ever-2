# 08 · Build order

Work the phases in order. A phase ends when every line of its gate is met and logged with evidence. Then commit, push, publish, post the status and start the next phase without waiting. The one place the build waits for Brandon is the review stop at the end of Phase 5.

How a gate line is met:

- A line that asks for something to be published or pushed is met when it was done, or when the failure is logged. After Phase 0 neither one holds the build.
- A line that names a loop is met when its pass bar holds or its limit was reached. Reaching a limit means logging what is open.
- A line that names a machine check is met when the check is green, or when it has been logged as a severe open item after `quality.gateFixMaxAttempts` attempts. G13 is the exception: it is met only when it is green. A stand-in is ended with its fallback, as `kit/07-QUALITY-BAR.md` says, never logged.
- A line that names a deliverable check is met when it is green, or when it has been logged as a failed item after three tries.
- A line about sound is met when the sound exists, or when the log says why it does not. Sound never holds a gate.

Every loop below has a limit in `kit/07-QUALITY-BAR.md`. The clock rules and the budget report are in `AGENTS.md`. Post a status at least every `budget.statusMaxGapMinutes`, whatever step you are in.

| Phase | What it is | Units |
| --- | --- | --- |
| 0 | Ground truth | |
| 1 | The rough cut | |
| 2 | Engine and blockout: the whole site playable on placeholders | |
| 3 | The look lock | `step1`, with the page, the type, the light and the cursor |
| 4 | The other pages | `pinball`, `boss`, `step2`, `marketing`, `decision` |
| 5 | The whole site, the sound and the review | `site` |
| 6 | The films and delivery | `film` |

## Before Phase 0, in every task

1. Check stop condition 1 in `AGENTS.md`: the reference images are approved.
2. Read `AGENTS.md` and `kit/00-README.md`.
3. Fetch and merge `repo.branch`. Read `kit/PROGRESS.md` and every file in `kit/addenda/`.
4. If `npm run clock` exists, run `npm run clock -- --start`.
5. Look at "Build", "Review", "Review round" and "Budget" in `kit/PROGRESS.md`, in this order:
   - "Build" says `complete`: follow stop condition 5 in `AGENTS.md`.
   - "Build" says `extension N in progress`: carry that extension on from the step after "Extension step", as "Extensions" below describes. Skip the rest of this list.
   - "Review" says `approving`: carry the approval on from the step after "After review step", as "After the review" below describes, whatever the prompt says. Skip the rest of this list.
   - "Review round" says `round N in progress`: carry that review round on from the step after "Review round step", as "A review round" below describes. If this task's prompt holds notes that are not yet logged, add them to the round's items first. If it holds the line `The review is done.`, close the round at once: put back the kept takes and the mix of the last `REVIEW` block he was sent, because those are what he heard and approved, do the round's step 7 without ending the task, with the round's unfinished items listed under "Review items not done", and then do "After the review" with this prompt. Skip the rest of this list.
   - "Review" says `waiting`: read the prompt. With the line `The review is done.`, do "After the review" below. With the line `Review notes.`, do "A review round" below. With neither, show the block under "Last report block" again and build nothing.
   - "Budget" says `reported`: follow "The budget report" in `AGENTS.md`.
   - Otherwise tick the clock for the current phase. If it prints `budget report: due`, go straight to "The budget report" in `AGENTS.md`. Start nothing first.
6. Post the status that opens the task. In the very first task there is nothing to show yet: its opening status is the one in Phase 0 step 4, and steps 1 to 3 come before it. If those three steps take longer than `budget.statusMaxGapMinutes`, post two lines of text by hand.
7. If a phase is already in progress, continue it. Never redo a phase marked `done`. Check "Rounds" for a round that was interrupted, "Running jobs" for jobs to pick up or restart, and "Running agents" for branches to fetch and work to hand to new agents.

## Phase 0 · Ground truth

Read first: `AGENTS.md`, `kit/00-README.md`, `kit/05-ARCHITECTURE.md`, `kit/06-ASSETS.md`, `config/showcase.json`.

Steps:

1. Write `in progress` under "Build" in `kit/PROGRESS.md` and push it to `repo.url`. If the push fails, retry once. If it still fails, stop as `AGENTS.md` says.
2. Create `package.json` at the repo root before installing anything.
3. Build `npm run clock` and `npm run look`. Run `npm run clock -- --start` and tick. From here on, every status and every poll ticks the clock.
4. Prove the inline display. Show `references/approved/contact-sheet.jpg` in the task thread so that it is visible without opening or downloading a file. Record the method under "Tool record". If no method works, record that and follow the fallback rule in "Showing the work" in `AGENTS.md`. Measure whether `repo.url` is private. Post this as the first status, with one line that says where the sound files will live, as "Sound" in `AGENTS.md` asks.
5. Record the workspace: OS, cores, memory, disk, Node and npm versions, the browser and its exact version, and the WebGL2 limits and extensions under software rendering. Write them to `config/webgl-caps.json`, with the extensions every target browser has marked `portable`.
6. Confirm `ffmpeg` and `ffprobe` run. If either is missing, install a static build through npm.
7. Test, with an agent whose whole job is to wait two minutes and answer, whether you can tick the clock and post a status while an agent you started is still working. Record the result. If you cannot, follow the short agent rule in "Waits" in `AGENTS.md` for the whole build. Test whether a detached process outlives a scripted step. Test whether a sandbox agent can clone the repo, return a video file as an attachment and push a branch.
8. Measure the image limit: view a test image with fine numbered marks and find the longest edge that arrives without being downscaled. If it is smaller than `critics.maxImageLongEdgePx`, lower that key.
9. Record what you can call: the image models, the largest size each returns and how many reference images each accepts; whether a video model and an image-to-3D model can be called; app hosting and the largest site it accepts; the model families available for supporting agents, which of them can see images and which can hear sound.
10. Record the sound tools, as `kit/03-METHOD.md` section 12 says: find the voice named in `audio.narratorVoice`, find what makes it pause, find the settings for a slow read, and make one test line and one test effect, with the listener's answers about each. If a call fails after `budget.toolRetryMax` tries, record that and go on.
11. List the skills of this workspace and record the name of the prompt screen skill, as `kit/03-METHOD.md` section 13 says. Three tries at looking.
12. With supporting agents, read the output terms of each image model you will use and of the sound tool, and the hosting provider's current limits, and record them as `kit/06-ASSETS.md` and the hosting section of `kit/05-ARCHITECTURE.md` say.
13. Decide the three.js version as `kit/05-ARCHITECTURE.md` says. Pick the physics library and prove with a ten second test that the same input gives the same state on this VM and on a sandbox VM. Three tries, with a different library or build each time. If none passes, the table's physics is its named fallback from `kit/03-METHOD.md` section 10, your own solver, from the start. Pick the two type families and record their licences. Pin every version.
14. Scaffold the site: config and content import and validation, seeded random, sampler, accumulator, the asset loader, the stage with its sim steps and one driver, the frame interface with the stand-in list, and `capture` mode. Put a spike scene in it to measure with: a ceramic slab with one glass field, one orange button in a socket, one line of type and a plain arrow, under the key light with soft shadows.
15. Build the harness commands `still`, `crops`, `compare`, `determinism`, `gate`, `caps`, `budget`, `status`, `keep` and `review`.
16. Measure the render budget on the spike scene: seconds per sample at each format, and the fixed cost of starting a render. Render one still on this VM and on two sandbox VMs and log the PSNR of each pair. Write the table.
17. Publish the build with its review page. Record the URL in `kit/PROGRESS.md` and `README.md`.
18. Post a status with the spike still beside the approved `page-look` image, shown inline.

Statuses are due from step 4 on, at the rhythm in `AGENTS.md`, whatever step you are in.

Gate:

- A push has succeeded.
- G1, G2, G3, G4, G8, G9 and G10 are met.
- The workspace record, the tool record with the voice, the pause mark and the prompt screen skill, the terms that were read, the hosting limits, the pinned versions and the render budget table are in `kit/PROGRESS.md`.
- The inline display method is recorded, or the log says none exists.
- Whether the repo is private is recorded.
- The polling test, the physics test between VMs and the PSNR between VMs are logged.
- The clock has ticks, and statuses have been posted since step 4.
- The site is published, or the log says why it could not be.

## Phase 1 · The rough cut

Read first: `kit/01-FILM.md`, the rough cut section of `kit/05-ARCHITECTURE.md`, `config/showcase.json`.

Steps:

1. Build `npm run animatic` and make `out/roughcut.mp4`.
2. Look at one frame from every beat. Confirm the order and the lengths against `film.units` and `film.beats`.
3. Commit and push. Run `npm run review` and publish, so the rough cut plays at `<url>/review.html`.
4. Post a status with two frames of it shown inline and the review page link. Say that the rough cut is made from the approved images with no sound, that it exists so Brandon can judge the order and pace of the film, and that the build is continuing.
5. Continue without waiting.

Gate:

- D1 is met.
- The rough cut is pushed, on the review page, and a status was posted.

## Phase 2 · Engine and blockout

Read first: `kit/01-FILM.md`, `kit/02-SUBJECT.md`, sections 1, 2, 10, 12, 14, 15 and 16 of `kit/03-METHOD.md`, sections 4, 8 and 9 of `kit/04-LOOK.md`, `kit/05-ARCHITECTURE.md`, the checks, judged list, packs and R4 blockout sections of `kit/07-QUALITY-BAR.md`, and "Rejected, and why" in `references/STATUS.md`.

The whole site can be played from the careers page to the rejection, the whole film plays, and the bots finish, before anything is made to look real. Everything in this phase is a stand-in except the layouts, the words, the timing, the rules of each gag, the cameras and the places of the controls.

Steps:

1. Build the shared engine: the stage, the four drivers, events, checkpoints, the `home` camera, the sample and post chain, and the diagnostic views.
2. Write the layout tree of all six pages. Draw every part as a flat grey box at its place and height, with its real words from the copy in a plain system face. Create `parts/PARTS.json` with every part as `stand-in`, and record the file hash of each as it stands now.
3. Give the cursor a stand-in: a flat arrow that follows the pointer with weight and squashes when it stops.
4. Build every gag as a working state machine on stand-in shapes, with its live way out: the keyboard that types, turrets that fire, keys that shuffle, slabs that drop, the tug of war as one number, the three rows and their machines, the checkbox and the boss with its health and its three phases, the wait, the letter and the stamp. Build the page turn.
5. Build the pinball table's stand-in: a flat board with the layout of the approved `table-top` image as colliders and plain shapes, the physics library running, the flippers, the director with every beat's entry and deadline. Run `npm run take` for a first take.
6. Build the film: a script for every beat that reaches the beat's event on time, the film's cameras with every pinball shot of `kit/01-FILM.md`, `npm run cut`, `film` mode, and a stand-in for film A's opening that has the right length. Build `loop` mode with a closed script for the first entry of `deliver.cardLoop.candidates`.
7. Build the live site: `live` mode, the pointer, the three DOM controls, the message page for touch devices, the offer for reduced motion, the levels of quality and how the site picks one, the menu on the `M` key, and the probe page.
8. Build `npm run bots` and run it.
9. Build the sound side: `npm run sound`, `npm run mix`, the site's sound engine, and the table of events to cues. Spend the first take of every line under `film` in `content/narration.json`, because the length of the voice sets the pace of the film. Move beat times inside their limits where a line needs the room, and log each move. Spend the first takes of `room-tone`, `step`, `key-press`, `bolt-fire`, `slab-drop`, `bumper`, `flipper`, `stamp` and `page-turn`, so the site and the blockout film carry sound from the start.
10. Build the remaining harness commands, including `npm run render:local`.
11. Write `cut/SHOTS.md`: for every beat, the camera, its move, the start and end framing, and for the pinball shots the lens and the focus.
12. Measure the render budget again on this scene and update the table.
13. Write the judged list into `kit/PROGRESS.md`.
14. Run the first blockout round: machine checks, then R4 blockout. It is a floor round. If its pass bar does not hold, fix what it raised. Run a second round only if the count and the clock allow, up to `quality.blockoutMaxRounds`.
15. From the final build of this phase: render the blockout film at the `draft` tier in `formats.preview` with the sound that exists, run `npm run render:local -- --proof` for film B, then `npm run keep -- --film`.
16. Publish and post the status with the sheets across the whole film, the six page layouts on one sheet, and the link to the site, saying that the whole application can be clicked through now.

Gate:

- G1 to G12, G14, G17 and G18 are met.
- R4 blockout scores at least `quality.blockoutPass` with no severe issue open, or its limit was reached.
- Every issue the blockout critic raised that is still open is under "Open items", marked as carried to the phase that will settle it.
- The judged list is in `kit/PROGRESS.md`.
- D2 and D3 are met. The blockout preview is committed.
- A visitor can play the stand-in site from the careers page through all five steps to the rejection from the published URL, or from a local copy if publishing is not available here. The film plays in `film` mode. The loop plays in `loop` mode.
- Every film line of the narrator has a first take, or the log says why not.

## Phase 3 · The look lock

Read first: `kit/02-SUBJECT.md`, `kit/03-METHOD.md`, `kit/04-LOOK.md`, `kit/06-ASSETS.md`, `kit/07-QUALITY-BAR.md`, and `references/STATUS.md`.

Prove every shared technique on one page before anything is spread across the others: the surface, the type, the materials, the light, the grade, and the cursor with its acting, its damage, its arms and its effects. The unit is `lookLockUnit` in the config: `step1`. Its keys are `step1-fire` and `step1-tug`. Its sheets are `page-look`, `cursor-acting`, `cursor-damage` and `cursor-arms`.

Steps:

1. Study before building. Look at the approved images of this unit at full size, crop by crop. Search for photographs of the real things the page is made of: matte ceramic under a low light, frosted glass lying on a surface, brushed aluminum, glossy moulded plastic buttons, a keyboard photographed from above. Study at most `assets.maxStudySources` sources in the whole build, and leave a third of them for the pinball table. Write what you learned in ten lines under "Look lock".
2. Start supporting agents in parallel, one owner per folder:
   - The surface, the header and progress bar, and the materials.
   - The type.
   - The light, the shadows and the post chain.
   - The cursor's body and its effects.
   - The cursor's acting, its damage and its arms.
   - The keyboard and the turrets.
   - The slabs, the paper and the shredder.
   - Step 1's script: the acting of its seven beats.
   - Sound: the remaining takes of step 1's cues.
3. Start the table team now as well, because the pinball machine needs the most time: agents for the playfield artwork, the cabinet and backbox, the hardware, the flippers, bumpers, targets and ramps, the buildings, and the lights. They follow `kit/03-METHOD.md` section 10, beginning with its study step. Their work is Phase 4 work begun early. Its rounds come in Phase 4. If agent slots are short, step 1 comes first until its first round has started, and the table comes first after that.
4. Integrate. Fit the `home` camera and `cameras.home.fovDeg` against `step1-fire`. Set the light, the tone curve and the grade against it and against `page-look`. These become the defaults for everything.
5. Work the acting. Render a sheet across each of the seven beats and across each acting state and each kind of damage, and look at them as a stranger would. Work on them for at most `quality.gateFixMaxAttempts` cycles of change and look for each. What is still weak after that goes to the round as it is. Publish, so Brandon can play step 1.
6. Measure the render budget, the texture memory and the counts, and update the table.
7. Send `step1` to its first round as soon as nothing its stills show is a stand-in. Then run rounds with the measures and R1, R2, R3, R4, R8 and R9 on its judged stills and sheets until the pass bar holds, `quality.lookLockMaxRounds` is reached, or the clock ends the loop.
8. From the final build of this phase: `npm run compare` for the two keys and the four sheets, then `npm run keep`.
9. Write "Look lock" in `kit/PROGRESS.md`: every locked setting; each technique that worked and each that did not; and the recipe, as numbered steps with commands, for making one more page from its layout tree, one more control in each of the four materials, one more mechanism that rises out of the page, one more gag with its live way out and its events, one more beat of acting, and one more kind of damage. Phase 4's agents work from those recipes.
10. Commit the built assets. Run `npm run review` and publish.
11. Mark `step1` `finished` in the "Units" table with the commit and what ended its loop. Then run `npm run gate -- --phase 3`, check every line of the gate below and log the evidence. Mark Phase 3 `done`, push, and post the status with the two comparison images, the acting sheet beside its approved sheet, and one sheet across the tug of war.

Gate:

- The machine checks are met, with G13 and G15 covering `step1`.
- The pass bar holds for `step1`, or its limit was reached.
- Comparison images are committed for the two keys and the four sheets.
- "Look lock" is written, with the six recipes.
- The table team's branches are listed under "Running agents" with what each has pushed.

## Phase 4 · The other pages

Read first: `kit/01-FILM.md`, `kit/02-SUBJECT.md`, `kit/03-METHOD.md`, `kit/04-LOOK.md`, `kit/06-ASSETS.md`, `kit/07-QUALITY-BAR.md`, the "Look lock" section of `kit/PROGRESS.md`, and every file in `kit/addenda/`.

Finish the units in `buildOrderAfterLookLock`. Build them side by side with supporting agents. Build agents take at most `sandbox.maxAgents` less `sandbox.criticSlots` of the slots, so critics, jurors and render agents can always start. You integrate each unit, run its checks and its critics, and decide when it is finished.

The pinball machine is the main attraction. It gets its agents first, it gets `quality.pinballMaxRounds` rounds where the others get `quality.maxRoundsPerUnit`, and when two units are ready for a round at once its round runs first.

Each agent owns its folders and nothing else. Change the split if the work calls for it, and log it.

| Unit | Agents | Each owns |
| --- | --- | --- |
| `pinball` | The table team from Phase 3, carried on: the artwork; the cabinet and backbox; the hardware; flippers, bumpers, targets and ramps; one for every two buildings; the lights and the light show. Now also one for the physics and the director, one for the cameras, and one for the page of step 3, the rise, the sinking and the script | Its folder under `src/table/`, or `src/pages/step3/`, and its parts under `public/assets/`, `assets-full/` and `assets-src/` |
| `boss` | One for the card and the health bar, one for the body, one for the transform and the defeat, one for the weapons, the fight and the script | Its part of `src/boss/` or `src/pages/step4/`, and its assets |
| `step2` | One for the rows, one for each machine, one for the script | Its part of `src/pages/step2/`, and its assets |
| `marketing` | One for the first screen with its cards, ticker and button, one for the sections below it, one for the script | Its part of `src/pages/marketing/`, and its assets |
| `decision` | One for the wait and the letter, one for the stamp and the metrics, one for the script | Its part of `src/pages/step5/`, and its assets |
| Sound, beside the units | One | `audio/`, `public/audio/` |

For each unit:

1. Build every part by its method in `kit/03-METHOD.md` and its recipe from "Look lock". Each agent tunes inside `assets.maxTuningLooksPerPart`, pushes its looks with every heartbeat, and stops when its part is built.
2. Integrate the unit. Fit it to its keys: the layout first, then the light, then the parts. Fit each key's camera and its `at`.
3. Work its beats in film mode and its gags in live mode, with a bot driving, inside `quality.gateFixMaxAttempts` cycles of change and look for each beat.
4. Send the unit to its first round as soon as nothing its stills show is a stand-in. Then run rounds with the unit's measures and the critics the table in `kit/07-QUALITY-BAR.md` gives it until the pass bar holds, its round limit is reached, or the clock ends the loop.
5. From the unit's final build: `npm run compare` for its keys and sheets, then `npm run keep`.
6. Mark the unit `finished` in the "Units" table of `kit/PROGRESS.md` with the commit and what ended its loop.
7. Commit its built assets, push, run `npm run review`, publish and post the status for that unit with its comparison images and one sheet of its best gag.

For `pinball`, in addition:

1. Before integration, put the table's parts together on the playfield and render `table-top` and `table-player` beside their approved images. Count the standing parts and run M8. A table that is not yet crowded goes back to the hardware and building agents before anything else is tuned.
2. Fit the eight table cameras to their keys.
3. Once the layout of the colliders is final, run `npm run take`, for at most `quality.takeSearchMaxRuns` searches. A later change to the layout or the physics buys the same number of searches once more.
4. Write the light show's score against the take's events.
5. Its rounds judge the scene as film mode plays it and as the live site plays it, with sheets of both.

The sound agent, while the pages are built:

1. Makes every remaining cue in `audio.sfx`, with its variants, inside `audio.maxTakesPerCue`, each chosen as `kit/03-METHOD.md` section 12 says.
2. Makes every line under `liveOnly` in `content/narration.json`, and any film line that still has no kept take, inside `audio.narratorMaxTakesPerLine`.
3. Posts, through you, a status with the waveform sheet whenever a batch is kept.

Clock rules 3 and 4 in `AGENTS.md` apply to every unit here, and in the same way to `site` in Phase 5 and to `film` in Phase 6. Once the clock prints `half point: reached`, a unit with no stand-in left goes to its round at once. Once it prints `box end: reached`, every part that is still a stand-in is finished with its fallback and its unit goes to its round.

Gate:

- The machine checks are met, with G13 and G15 covering all six pages.
- Every page unit is marked `finished`: its pass bar held, or its limit was reached.
- A comparison image is committed for every key and every sheet.
- `cut/TABLE-TAKE.json` exists and `npm run take -- --check` is logged, or the log says which beats fell back.
- Every cue and every line has a kept take or an open item.

## Phase 5 · The whole site, the sound and the review

Read first: sections 12, 14, 15 and 16 of `kit/03-METHOD.md`, "Rules for the live site" in `kit/02-SUBJECT.md`, "Sound" in `kit/01-FILM.md`, the hosting, probe and review page sections of `kit/05-ARCHITECTURE.md`, `kit/07-QUALITY-BAR.md`, and "Open items" in `kit/PROGRESS.md`.

Steps:

1. Remove every stand-in path that is left in the six pages.
2. Go through the live site once as a visitor would, from the careers page to the rejection and back: scroll the careers page, touch every perk card, type a name, take hits, lose the tug of war, work each machine in a different order, play the table with the flippers, fight the boss, accept rejection. Then again doing as little as possible, and again using every skip link. Use `npm run sheet -- --live` to see what a visitor sees. Fix what is wrong in one pass. What is not fixed by the end of that pass is an open item.
3. Finish sound in the site: `npm run sound -- --pack`, the loops, the levels, the narrator's rules for the live site, the crank setting the volume. Run the sound checks.
4. Fit the web asset set to `host`. Set the loading order. Run `npm run hostcheck`. Write `vercel.json` and `.vercelignore`.
5. Run the first round on `site`: machine checks, then R2, R4, R5 and R8. It is a floor round. From this round on G13 covers every part outside the `film` unit, so the interface, the pointer, the sound engine, the levels of quality and the finishing logic must be finished by now: one that is still a stand-in is finished first, by its method, or by its fallback after three failed tries at the method or once the clock has printed `box end: reached`. Run more rounds only while the count and the clock allow, up to `quality.siteMaxRounds`.
6. Work the open items from every unit, worst first, with the pinball machine's items ahead of the others at the same severity, for up to `quality.polishMaxRounds` polish rounds. Every polish round is an extra round: start one only while the clock allows. In each round fix a batch, then run the measures and the critics that raised those issues on the stills they touch. After a change to a shared system, check each finished unit as "Freshness" in `kit/07-QUALITY-BAR.md` says.
7. If a second browser engine can be driven here, load the site in it and keep a still. Three tries, then log it.
8. Fit the film to the voice: move each beat inside its limits so every kept line has its room, then `npm run cut`, `npm run simcache` and `npm run take -- --check`. If a pinball beat moved and the take no longer holds it, search again inside `quality.takeSearchMaxRuns`. Then `npm run mix` for the review mix. A line or a cue with no kept take is left out of the mix and named in the `REVIEW` block.
9. Make the review cut: render film B with `npm run film -- --review`, split across sandbox agents, at the highest tier that fits `sandbox.reviewCutMaxHours`, and never below `draft`, and join it with the review mix. If no sound exists, make it silent. Run `npm run keep -- --film`.
10. Render every key and every judged still of `site` again from this build, with the stills split across sandbox agents, run `npm run compare` for the keys, and run `npm run keep`. Make the sheet of the six pages with `npm run sheet -- --pages` and one sheet across the pinball scene, so both exist as looks for the `REVIEW` block.
11. Run `npm run review` and publish.
12. Mark `site` `finished` in the "Units" table with the commit and what ended its loop. Run `npm run gate -- --phase 5` and log the evidence. Tick the clock one last time for this phase. If it prints `budget report: due`, file the budget report and stop there: the review stop comes after the continuation.
13. Otherwise mark Phase 5 `done`, write `waiting` under "Review" and the filled-in `REVIEW` block under "Last report block", commit and push. From this moment no budget report is filed and the build's clock is not ticked again until the review is approved.
14. End the task with the `REVIEW` block, as "REVIEW" below describes. Its pictures come from `npm run status -- --no-tick --no-render --sounds`.

Gate:

- The machine checks are met, including G15, G16, G17 and G18.
- The pass bar holds for `site`, or its limit was reached, and `site` is marked `finished`. The polish rounds ran to their count or to the clock.
- D4 is met.
- The site, the probe, the film in `film` mode and the review page open from the published URL, or the log says why not.

Steps 13 and 14 come after the gate.

## A review round

A task whose prompt contains the line `Review notes.` and that finds "Review" at `waiting` does this. So does a task that finds "Review round" at `round N in progress`, starting at the step after "Review round step".

After each step, write its number under "Review round step" in `kit/PROGRESS.md` and push.

1. Before anything else, in one commit: N is "Review rounds" plus one, write `round N in progress` under "Review round" and `1` under "Review round step", and copy Brandon's notes under "Notes from Brandon" as numbered items of review round N, in his words. Push. Tick with `npm run clock -- --review-round N`. Every status in the round ticks the same way, and statuses fall due at the same rhythm as in a phase.
2. Sort the items: a narrator line to reword or to say again, a sound effect to change, a level in the mix, a change to how something looks or moves, a change to how the site plays, or a decision on something listed under "For Brandon to decide". Post a status that lists the items as you understood them and the order you will work them in. It is not a question.
3. Work the sound items. A line he rewrites is replaced in `content/narration.json` with his words exactly, and gets up to `audio.narratorMaxTakesPerLine` takes. A line or a cue he wants said or made differently gets up to its limit of new takes, with his words added to its direction or its prompt, chosen as before. Mix again. Keep the kept takes and the mix of the last `REVIEW` block he was sent beside the new ones until this round's own block has been posted.
4. Work the picture and site items, the ones he stressed first. A change to a finished unit gets rounds on that unit inside `quality.maxRoundsPerUnit` for this request. None is a floor round: each starts only while the round's clock prints `extra rounds: yes`.
5. When the items are done, or the clock prints `extra rounds: no`: finish the one fix in hand and list what is left under "Review items not done".
6. If any picture in the film changed, make the review cut again, once, and the sheet of the six pages with it. If only sound changed, join the existing picture with the new mix. Run `npm run bots` again if anything about how the site plays changed. Run `npm run review` and publish. The block's pictures come from `npm run status -- --review-round N --no-render --sounds`.
7. Write N under "Review rounds": the round's own number, not one more than what is there. Write `none` under "Review round" and clear "Review round step". Write the `REVIEW` block again under "Last report block", with one line added at its top: what review round N changed and what it did not. Commit, push, and end the task with that block.

A review round never approves the review, never starts Phase 6 and never files a budget report. "Review" stays `waiting`.

## After the review

A task whose prompt contains the line `The review is done.` and that finds "Review" at `waiting` does this before anything else. So does a task that finds "Review" at `approving`, starting at the step after "After review step".

After each step, write its number under "After review step" in `kit/PROGRESS.md` and push.

1. Before anything else, in one commit: write `approving` under "Review" and `1` under "After review step". Copy his notes under "Notes from Brandon" as numbered review items, in his words. Whatever he pasted from the probe goes under "Probe results". If the prompt has a `Portfolio link:` line with an address, write that address to `links.portfolioWork` in the config. An attached archive of the build's own sounds is unpacked to where the kept sounds live, and is not committed while the repo is public. Push.
2. Run `npm run clock -- --review` and write `running` under "Budget".
3. Sort the review items: a change to a page, a change to the film, a change to the sound, a change to how the site plays, or a decision on something listed under "For Brandon to decide".
4. If the probe shows a level of `live.quality` falling short of its `minFps` on one of his machines, lower what that level draws, by the ladder in `kit/04-LOOK.md`, and log the new numbers.
5. Post a status that lists the review items as you understood them and the order you will work them in, and says whether the portfolio link is set. It is not a question. Write `approved` under "Review" and `done` under "After review step", push, and carry on with Phase 6.

A task that starts with "Review" at `approved` carries on from Phase 6. It does not need the notes again.

A review item is never a reason for a second stop. One that cannot be done inside the limits is logged and listed in the `BUILD COMPLETE` block.

## Phase 6 · The films and delivery

Read first: `kit/01-FILM.md`, sections 12, 13 and 17 of `kit/03-METHOD.md`, the local render and hosting sections of `kit/05-ARCHITECTURE.md`, `kit/07-QUALITY-BAR.md`, `kit/09-QA-GAUNTLET.md`, and "Notes from Brandon" and "Open items" in `kit/PROGRESS.md`.

Steps:

1. Work the review items, the ones Brandon stressed first. A sound item is worked as step 3 of a review round says. A change to a finished unit gets rounds on that unit inside `quality.maxRoundsPerUnit` per request. None is a floor round: each starts only while the clock allows. When the clock prints `extra rounds: no`, finish the fix in hand and list what is left under "Review items not done".
2. Fit the film one last time: move each beat inside its limits so every kept line has its room, then `npm run cut`. Replace the film's part of the judged list. Run `npm run simcache` and `npm run take -- --check`, and search for a take again if a pinball beat no longer holds, inside `quality.takeSearchMaxRuns`.
3. Fit the film to the new cut list: every script, every camera push, every pinball shot. Render the sheets across the whole film and look at every beat.
4. Mix the final sound: `npm run mix -- --final`, for film B and for film A.
5. Make the opening of film A, as `kit/01-FILM.md` and `kit/03-METHOD.md` section 13 say. Mark the `opening` part by how it was made. Render a sheet across it and check that each typed word can be read on the frame it appears.
6. Finish the card: run the pick if `deliver.cardLoop.scene` is `auto`, build the loop for that scene as `kit/03-METHOD.md` section 17 says, and check its seam with G14.
7. Write `deliver/POST.md`, a draft of the post for Brandon to edit, in three parts under three headings: one plain opening sentence; a short run of what a reader can do with it, three or four lines; and the text of a reply that carries the link, with the link left as a blank. No em dashes, no exclamation points, no hashtags.
8. Run the first round on `film`: machine checks, the measures, `npm run stress`, then R2, R4, R5, R6, R7 and R9. It is a floor round. From this round on G13 covers every part there is, so the opening and the loop must be finished by now: one that is still a stand-in is finished first, by its method, or by its fallback after three failed tries at the method or once the clock has printed `box end: reached`. Run more rounds only while the count and the clock allow, up to `quality.filmMaxRounds`.
9. Mark `film` `finished` in the "Units" table with the commit and what ended its loop. Then freeze the build: nothing under `src/`, `public/`, `assets-full/`, `config/` or `content/` changes from here on except to fix a machine check or a failed QA item.
10. Render every judged still, every judged frame and every comparison image from the frozen build, with the work split across sandbox agents.
11. Run the record round, as `kit/07-QUALITY-BAR.md` defines it. Write the scores into `kit/PROGRESS.md` as the final scores.
12. Render the preview films: film B in `formats.hd` at `film.previewFps` with the final mix, one chunk for each page, split across sandbox agents, at the highest tier whose wall-clock time the render budget says fits in `sandbox.previewFilmMaxHours`, and never below `draft`. Film A is the opening's chunk joined in front of it. Make their `formats.preview` copies with `npm run film -- --from-hd`, then run `npm run keep -- --film`. Put the `formats.hd` films on the review page and attach them to the final message. If `deliver.sandboxMaster` is true, also render the masters here at the `final` tier and share them in the final message.
13. Render the card loop with `npm run loop`, inside `sandbox.cardLoopMaxHours`, and run `npm run keep -- --deliver`.
14. Run `npm run render:local -- --proof`.
15. Run `npm run bots` and `npm run hostcheck` on the frozen build.
16. Write `cut/CUES.md`: every beat, every event with its cue, and every narrator line, by time and frame.
17. Write `README.md`: what this is, the site's address here, how to play it, how to render film B, film A and the loop on a Mac with `npm run render:local`, starting with the test, how to deploy it to `host.name`, where the comparison images and scorecards are, where the sound files are and what to do if a clean clone has none, and the list of third-party credits from `ASSETS.md`.
18. Run `npm run review` and publish the final build.
19. Run every item in `kit/09-QA-GAUNTLET.md` and record the evidence. If an item fails, fix it, do step 20, and only then run the gauntlet again, for at most `quality.gauntletMaxPasses` passes in all. A second pass and a second record run are extra: they happen only while their counts and the clock allow. When they are not allowed, make only fixes that change no pixel, and list every other failing item under "Failed QA items" with the fix it would need. The scores in the `BUILD COMPLETE` block must always be the scores of the build that is delivered. Item 13 is the one exception: a stand-in found there is always finished with its fallback chain and the stills it touches are rendered again, as floor work. If no record run is left for it, the `BUILD COMPLETE` block names that part and says the final scores were taken before it changed.
20. If a fix in step 19 changed anything under `src/`, `public/`, `assets-full/`, `config/` or `content/`: render the judged stills and frames it touched again, run `npm run compare` for their keys, run `npm run keep`, and run the record round again, for at most `quality.recordRoundMaxRuns` runs in all. If the fix changed what a film or the loop shows, render the affected chunks again, once, join them, make the `formats.preview` copies again, and run `npm run keep -- --film --deliver`. In every case run `npm run determinism`, `npm run bots`, `npm run render:local -- --proof` and `npm run hostcheck` again, once, so their evidence comes from the build that is delivered, then `npm run review` and publish.
21. Write `complete` under "Build" and the filled-in `BUILD COMPLETE` block under "Last report block" in `kit/PROGRESS.md`. Commit and push.

Gate:

- The machine checks are met, including G7, G12, G14, G16 and G17.
- The pass bar holds for `film`, or its limit was reached.
- D2, D3, D5, D6 and D7 are met.
- Every item in `kit/09-QA-GAUNTLET.md` has its evidence in `kit/PROGRESS.md`. An item that still fails after the last pass is listed under "Failed QA items" with what was tried.

## REVIEW

At the end of Phase 5, and at the end of every review round, end the task with exactly this block, filled in. Above it, show inline up to `status.maxPictures` pictures: the six pages at rest on one sheet, one sheet across the pinball scene, one sheet of the cursor's acting, and the waveform sheet of the sounds. If the repo is public, attach the archive of every kept sound, as "Sound" in `AGENTS.md` says.

```
REVIEW
This is the one stop. The whole site is built and you can play it. The film is cut to a first pass of the sound. Nothing is rendered for delivery until you approve it.
Play it: <url>
Go straight to a step: <url>?step=1 to <url>?step=5
Review page, where everything plays: <url>/review.html
Listen first: the Sound board on the review page. The review cut plays there with sound, and every narrator line and every effect can be played on its own.
Narrator: <the voice found by name, or the reason it could not be used>. Lines with no usable take: <list, or "none">
Effects with no usable take: <list, or "none">
Watch the film as the site plays it: <url>?mode=film
Measure speed on your own machines, if you like: <url>?mode=probe
Time used: <hours> of <hours allowed>
Units: <for each of the seven built so far: passed, or the limit that ended it>
The pinball machine: <standing parts counted>, <rounds run>, <its last scores>, the take <holds every beat, or which beats fell back>
Open items: <count, and the worst five with their unit>
Parts finished with a fallback: <list, or "none">
For Brandon to decide: <list, or "none">
Portfolio link for the touch message: <set, or "not set. Put it on the Portfolio link line of the approval prompt">
Sound files: <"committed to the repo" or "held back because the repo is public: the archive is attached">
What happens next is yours:
- To change a line, a sound or anything you see, as many times as you like: send the review notes prompt from kit/10-KICKOFF.md.
- When the site and the sound are right: send the approval prompt from kit/10-KICKOFF.md. The films are then finished and nothing stops again.
```

## BUILD COMPLETE

When the Phase 6 gate is met, end the task with exactly this block, filled in, and show inline above it the six pages at rest on one sheet, the card still, one sheet across the pinball scene from the final film, and one frame of the opening of film A:

```
BUILD COMPLETE
The site: <url>
Review page: <url>/review.html
Watch film B: <url>?mode=film
Watch film A: <url>?mode=film&which=a
Preview films: out/, and the larger ones attached
Length: film B <seconds>, film A <seconds>. <If either is over the standard limit of X, say so: it needs an account that can post longer video>
Sound: <the narrator's voice, the number of lines and cues kept, and how the mix was levelled>
The opening of film A: <made with the team's skill, by name, or made without it>
Card: deliver/, scene <key>, chosen by <the pick, with its votes, or the config>
Post draft: deliver/POST.md
Masters: render them on a Mac with the commands in README.md, starting with the test
Deploy: the steps are in README.md
Side by side: out/stills/
Scorecards: scorecards/
Time used: <hours before the review> of <hours allowed>, <hours in review rounds>, <hours after> of <hours allowed>
Rounds run: <number>
Units: <for each of the eight: passed, or the limit that ended it>
Final scores: R1 <lowest key and its score>, R2 <pass or fail, with the failing units>, R3 <lowest>, R4 <lowest, and the pinball scene's own score>, R5 <site>, <film>, R6 <n>, R7 <n>, R8 <lowest>, R9 <lowest, and how many beats did not read>
Measures: M4 <smallest type in page pixels>, M8 <standing parts, and the bare share>
Bots: <runs finished of runs made, and the slowest run>
Size: <megabytes shipped> of <limit>, first load <megabytes> of <limit>
Open items: <list with the unit and still of each, or "none">
Review items not done: <list, or "none">
Declined issues: <list with the reason for each, or "none">
Failed QA items: <list, or "none">
Parts finished with a fallback: <list with the step of the chain that ended each, or "none">
For Brandon to decide: <list, or "none">
What I would improve next: <one to three lines>
```

## BUDGET REPORT

When "The budget report" in `AGENTS.md` applies, end the task with exactly this block, filled in, and show up to `status.maxPictures` pictures of where the build is inline above it: the six pages on one sheet as they stand, and the newest comparison images.

```
BUDGET REPORT
Time used: <hours> of <hours allowed>
Review page: <url>/review.html
Play what exists: <url>
Phase: <current phase and step>
Phases done: <list>
Units: <for each: finished and how, in progress and its last scores, or not started>
Still to do: <every remaining phase and step, in order, with the floor work marked>
Open items so far: <count, and the worst three>
Credits used so far: <the figure, if this workspace shows one, or "not shown here">
What I would do next: <one to three lines>
To continue: send the continue prompt from kit/10-KICKOFF.md
```

## Extensions

An extension is one more polish pass Brandon asks for after completion. It starts when a task's prompt contains the line `Extension.` and "Build" says `complete`. It carries on when a task starts and "Build" says `extension N in progress`.

After each step below, write its number under "Extension step" in `kit/PROGRESS.md` and push. A task that carries an extension on starts at the step after that number and never repeats a finished one.

1. Write `extension N in progress` under "Build" in `kit/PROGRESS.md`, where N is one more than "Extensions". Copy any notes Brandon put in the prompt under "Notes from Brandon", in his words. Push. Tick the clock with `--extension N`. Statuses in an extension tick with `--extension N` too.
2. Unfreeze. Apply the notes logged in step 1. A line or a sound he names gets up to its limit of new takes. Then run up to `quality.polishMaxRounds` polish rounds, worst open item first, as Phase 5 step 6 describes. Start a round only while the extension's clock prints `extra rounds: yes`.
3. Freeze the build.
4. Render every judged still, judged frame and comparison image from the frozen build.
5. Run the record round once.
6. Do Phase 6 steps 4 and 12 to 18 once: the final mix, the preview films, the loop, the proof, the bots and the host check, the cues, the README, the review page and the publish.
7. Run the QA gauntlet once. An item that fails is fixed if the fix changes no pixel. Otherwise it is listed under "Failed QA items". There is no second pass and no second record round in an extension.
8. Write N under "Extensions": the extension's own number, not one more than what is there. Clear "Extension step", write `complete` under "Build" and the new block under "Last report block", commit, push, and end with the `BUILD COMPLETE` block.

An extension has no budget report and no review stop. When its clock prints `extra rounds: no`, finish the one fix in hand and go to step 3.
