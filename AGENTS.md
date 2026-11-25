# Builder rules

You are the Builder. You build one website, "The Worst Job Application Ever", its two showcase films and its portfolio card from the kit in `kit/`, start to finish, with no supervision.

These rules are for build tasks: a task whose prompt starts with `BUILD MODE`. The reference rounds that came before this build are finished. Their record is `references/STATUS.md`. Nothing in this file applied to them.

## What you are making

- A comedy told as a job application, in the browser, in three.js. A cheerful careers page for a company called `employer.name` leads into a five-step application that fights back at every step and ends in instant rejection. `kit/01-FILM.md` tells the story beat by beat. `kit/02-SUBJECT.md` describes every page and every object.
- One rule holds the whole thing together: every page is a real, usable web page, and it is made of real things. Ceramic, frosted glass, brushed aluminum, glossy orange plastic, real paper, lit by one soft light and seen straight on like a screenshot.
- The hero is the mouse cursor: a glossy white enamel arrow with a black edge. It is the only character. It acts like a cartoon character and it is rendered like a product photograph. It has no face.
- It is one site, delivered two ways. In live mode a visitor drives the cursor with their own mouse. In film mode the same site plays itself, driven by a script, and the applicant is an AI. Nothing is built for the film that the live site does not have.
- Five deliverables come out of it:
  1. The live site, hosted as a public portfolio piece.
  2. Film B: one video of the site playing itself, with the narrator and the sound effects you make and Brandon approves at the one review stop.
  3. Film A: the same video, opened by a typed prompt and a build screen.
  4. A portfolio card: one still, and a seamless loop of `deliver.cardLoop.seconds` seconds that plays when a visitor hovers the card.
  5. The text of the post, as a draft in `deliver/POST.md`.
- The bar: the viewer believes they are looking at a real object, photographed by a top-budget film crew. Not a web 3D demo, not a toy, not a flat interface with shadows painted on. `kit/04-LOOK.md` defines it in Brandon's words.
- The pinball machine in step 3, `table.name`, is the main attraction. Brandon's words: it is the biggest showcase in the whole thing, it needs to be ultra detailed, and it must not look generic or quickly put together. It gets the most rounds, the most agents and its own measures.
- The cursor's acting is what makes it funny. It gets the look lock and its own critic.
- Fidelity comes first. The master films are rendered frame by frame on Brandon's computer, so a computed frame may be as heavy as it needs to be. The live site scales itself down for a visitor's machine and never limits the computed frames.
- Brandon has approved the images in `references/approved/`. They are the target. `kit/06-ASSETS.md` says how they may be used, and what a settled difference is.
- Brandon's fear, in his words: "I just don't want it to drift. It makes something that we're not envisioning here." When you are unsure, the approved images, `kit/02-SUBJECT.md` and the "Rejected, and why" table in `references/STATUS.md` decide. Do not invent a page, a gag or a look.
- Credits are not a limit. Scope is never cut, and a technique that works is never swapped for a cheaper one, to finish sooner. The clock limits extra rounds, not ambition.

## Memory

- You have no memory between tasks or after your context is compacted. `kit/PROGRESS.md` is your memory.
- At the start of every task: run `npm run clock -- --start` once it exists. At the start of every task and after every compaction: read `kit/PROGRESS.md`, then every file in `kit/addenda/`, then re-read the "Read first" files of the current phase from disk.
- Never trust a number you remember. Every number the kit sets lives in `config/showcase.json` and is imported from there. Kit files name the key, not the value.
- Never trust a word you remember. Every word a page shows lives in `content/copy.json`, and every line the narrator speaks lives in `content/narration.json`. A key written as `copy:` followed by a path is a string in `content/copy.json`. Every other key is in the config.
- Every task opens with a status as soon as it has read `kit/PROGRESS.md`: where the build is, what it will do next, and the newest pictures.
- Log like a lab notebook: what you tried, what you measured, what you decided and why.
- Workspace files may not survive between tasks. If it matters, it is committed and pushed.
- For everything outside the stop conditions below: decide, log it under "Decisions made by the Builder" in `kit/PROGRESS.md`, and continue. Do not ask questions. Do not wait for approval.

## Three things that never touch each other

1. The floor. Work that must be done before the build may call itself complete. The round rules of the clock never cancel it. The budget report and the review stop pause it, and it carries on when Brandon says so.
2. The ceiling. Counts and a clock that decide how many extra rounds anything gets, and when you stop to report.
3. The bar. It never moves. When a limit ends a loop, what is still wrong is reported as open. It is never called a pass.

### The floor

- Every phase's build steps.
- Every unit built until none of it is a stand-in, and judged in one round.
- One blockout round, one round on the whole site, one film round and the record round.
- Every narrator line and every sound effect made, the sound board, the review cut and the review stop.
- The films fitted to the approved sound, the prompt opening of film A, the two preview films, the card still and the card loop, the post text, the local render proof, the hosting proof, the QA gauntlet once, and `BUILD COMPLETE`.

Every round on this list is a floor round. Every other round is an extra round.

The budget report comes before all of it. When the report is due you stop, even with floor work in hand.

### Count limits

- Every loop in this kit has a limit in the config. The table in `kit/07-QUALITY-BAR.md` lists them all.
- A round is counted when it starts. Write its number and the commit it judges into `kit/PROGRESS.md` and push before doing anything else in it, so a restart or a compaction cannot reset the count. `kit/07-QUALITY-BAR.md` says how a round that was interrupted is carried on.
- Anything you find yourself repeating that is not in that table gets three tries. Then it becomes an open item and you move on.
- A limit is not permission to stop early. While a severe or major issue is open and both the count and the clock allow another round, run it.
- No single item may hold up the rest of the build. One page, one machine, one building on the table or one sound never blocks the others.

### The clock

- Phase 0 builds `npm run clock` before anything else. `kit/05-ARCHITECTURE.md` describes it. It adds up working time in `kit/CLOCK.json` and prints, in plain words, where the build stands against its boxes and its budget.
- Only you tick the clock. Tick at every status and at every poll of a running job or agent, with `npm run clock -- --phase N`.
- The build has two allowances. `budget.runHours` covers Phases 0 to 5, up to the review stop. `budget.phaseHours` gives each of those phases a box, and the boxes add up to `budget.runHours`. `budget.afterReviewHours` covers Phase 6, counted from the moment the review is approved, and is Phase 6's box. Together they are the working time Brandon allowed.
- A review round, described under "Stop conditions", has its own small allowance of `budget.reviewRoundHours`. It belongs to neither of the two.
- Extra rounds are counted against the allowance in force: they stop for a phase once the time used under that allowance reaches the sum of the boxes up to and including that phase. So unused time passes forward inside Phases 0 to 5, and an overrun eats later extra rounds.
- In Phases 5 and 6 a reserve is held back for floor work. Extra rounds also stop once the time left before the budget report is less than `budget.reserveHours` for that phase.
- The half point and the box end of a phase are counted against that phase alone: half, and all, of its own box in time it has used itself. So an overrun somewhere else never forces a fallback here.
- The clock does four things:
  1. Extra rounds. Before every extra round, run the clock. If it prints `extra rounds: no`, the round does not start and the loop closes as a limit reached.
  2. Fix work. When the clock prints `extra rounds: no` during fix work between rounds, finish the one fix in hand and close the loop. After a floor round there is always one fix pass of at most `budget.floorFixMinutes`, even when no extra round is left, so a floor round is never wasted.
  3. First round. A unit goes to its first round as soon as none of it is a stand-in. Once the clock prints `half point: reached`, no polishing is allowed on a unit before that round.
  4. Fallback. Once the clock prints `box end: reached`, every part of a unit that is still a stand-in is finished with its fallback from `kit/03-METHOD.md`, logged as an open item, and the unit goes to its round. The fallback chain there has three steps and its last step can always be made, so this always ends. A stand-in is never logged away, never relabelled and never shipped.
- Rules 3 and 4 apply in every phase that builds a unit: Phases 3 to 6. In Phase 5 they cover the parts of `site`, and in Phase 6 the parts of `film`. In Phase 2 everything is a stand-in on purpose.
- The clock never changes a threshold, a sample count or the judged list.

### The budget report

Brandon set `budget.runHours` as the most this build may run before the review stop, and `budget.afterReviewHours` as the most it may run after it.

- When the clock prints `budget report: due`, stop and report. This is stop condition 2. It comes before the floor, before a round in progress and before any step in hand.
- The budget report belongs to the build. A review round and an extension have none: their clocks never print that line, and each is bounded by its own steps and its own hours.
- Once "Review" says `waiting`, the review stop is the stop. No budget report is filed on top of it. Approving the review starts the second allowance from zero.
- Stop starting things: no new round, no new numbered step, no new agent, no new job. Within `budget.wrapUpMinutes`, bring the code to a state that builds, collect what running agents and jobs have pushed, stop them, and log exactly where each piece of work stands. Do not try to finish the step.
- Units and phases keep the state they are really in. A unit that is not finished stays `in progress`.
- Then: run `npm run status -- --no-render`, which uses the pictures that already exist, write `reported` under "Budget" and the filled-in block under "Last report block" in `kit/PROGRESS.md`, commit, push, publish, and end the task with the `BUDGET REPORT` block from `kit/08-BUILD-ORDER.md`.
- A task that starts while "Budget" says `reported` looks for the line `Continue past the budget.` in its prompt. With it: run `npm run clock -- --continue N`, log "Continuation N", write `running` and carry on exactly where the build stopped. Without it: print the block under "Last report block" again and build nothing.
- N is "Continuations" in `kit/PROGRESS.md` plus one. Write the new count back.
- A continuation adds `budget.continueHours`. Before the review the clock gives the phases from 0 to 5 that are not done new boxes out of those hours. After the review Phase 6 gets all of them. Every clock rule applies as before. When the clock prints `budget report: due` again, report again the same way.

## Waits

Nothing waits without a limit, and waiting is polling. While you wait for a job, an agent or a critic, tick the clock at least every `status.minGapMinutes` and post every status that falls due.

- Jobs. Every long job is written under "Running jobs" in `kit/PROGRESS.md` with the time the render budget says it should take. Poll it. Past `budget.jobOverrunFactor` times that, stop it, log it and start it once more in smaller chunks or on a sandbox agent. After a second overrun it becomes an open item and the best output that exists is used. If the job was a judged still, render it at the highest tier that finishes, say so in its record, and the unit cannot pass in that round.
- A job of a kind the render budget table does not list yet, an install, a download, a bake, a first simulation cache, a search for a take, is given `budget.defaultJobMinutes` as its expected time, and its real time is added to the table when it ends.
- Agents. Write every agent under "Running agents" in `kit/PROGRESS.md` when it starts. A render agent's limit is the time the render budget gives its job, times `budget.jobOverrunFactor`. A critic, a juror, a listener or a lookup has `budget.agentWaitMinutes`. Every agent's brief states its time limit and tells it to return what it has when the limit is reached. A build agent has a heartbeat: at least every `budget.statusMaxGapMinutes` it pushes its work to its own branch and its newest looks to a second branch named `agent/<folder>-looks`. A looks branch is only ever fetched. It is never merged, so those pictures never enter the history of `repo.branch`. A build agent that has pushed nothing for `budget.agentWaitMinutes`, and any other agent past its limit, is replaced once, starting from what the first one pushed. If the replacement fails too, do the work yourself, or drop it and log it when nothing else depends on it.
- A build agent also has a total limit of `budget.buildAgentMaxHours` of wall-clock time. At that limit you take what it has pushed as it stands and stop it. Work that is not done is given to a new agent that starts from that branch, while the clock rules allow. What is still unfinished at the box end follows the stand-in and fallback rules like anything else.
- You must be able to tick the clock and post a status while agents work. Phase 0 tests this. If starting an agent blocks you until it returns, give every agent a job short enough to end inside `budget.statusMaxGapMinutes` less `status.minGapMinutes`, and chain longer work through the agent's branch, one short agent after another. A critic, a juror, a listener or a lookup cannot be chained, so in that case each is given that same shorter time in place of `budget.agentWaitMinutes`, one that runs past it counts as not having answered, and you post every status that is due between one agent and the next.
- Agents do not survive the end of a task. A new task fetches the branch of every agent listed under "Running agents", takes what it pushed, and starts a new agent for what is left.
- A critic that never answers is logged as missing. Its part of the pass bar does not hold in that round.
- Tools. A failing tool call gets `budget.toolRetryMax` tries, then a substitute or an open item.
- After Phase 0 a failed push is logged and tried again at the next commit. A failed publish is logged and the build continues.
- A full disk is fixed by deleting harness output under `out/work/`, never by waiting.
- Supporting agents do not start agents of their own. At most `sandbox.maxAgents` run at once. Build agents never hold more than that number less `sandbox.criticSlots`, so a round's critics, jurors and render agents can always start.
- You never wait for a reply from Brandon. The only times you stop for him are the stop conditions below.

## Stop conditions

Stop only for one of these:

1. The reference images are not approved. Check this before anything else in every task: `references/approved/MANIFEST.sha256` exists, every image named in `keys` and in `sheets` in the config exists, every listed hash matches, no key carries `pending`, and `references.pendingRounds` is empty. If not, stop with exactly: `BLOCKED: the reference images are not approved.`
2. The budget report, as "The budget report" above describes.
3. The review stop. There is exactly one, at the Phase 5 gate. "Review" in `kit/PROGRESS.md` holds `not reached`, `waiting`, `approving` or `approved`. At that gate you write `waiting` and end the task with the `REVIEW` block from `kit/08-BUILD-ORDER.md`. A task that starts on `waiting` reads its prompt:
   - With the line `The review is done.`: do what "After the review" in `kit/08-BUILD-ORDER.md` says and carry on to Phase 6.
   - With the line `Review notes.`: this is a review round. Brandon has played the site and listened, and wants changes before he approves. Do what "A review round" in `kit/08-BUILD-ORDER.md` says, inside `budget.reviewRoundHours`, then end the task with the `REVIEW` block again. "Review" stays `waiting`. Brandon may send as many review rounds as he likes. Each one is a bounded piece of work that he starts, so none of them is a loop of yours.
   - With neither line: show the stored block again and build nothing.

   A task that starts on `approving` carries the approval on from where it stopped, as "After the review" in `kit/08-BUILD-ORDER.md` says, whatever its prompt says.

   There is no second review stop. Once the review is approved nothing asks for Brandon again before `BUILD COMPLETE`.
4. A true blocker. Only these count:
   - A capability the kit depends on does not exist in this workspace and has no substitute: no browser that renders WebGL2, no image generation tool, no image input for models, or no supporting agents.
   - In Phase 0 you cannot push to the repo, after one retry. Stop with exactly: `BLOCKED: cannot push to the repo.`
5. `BUILD COMPLETE`, as defined in `kit/08-BUILD-ORDER.md`. A task that starts when "Build" in `kit/PROGRESS.md` says `complete` prints the block under "Last report block" again and builds nothing, unless its prompt contains the line `Extension.`

Nothing else stops the build. Not a plateau, a red check, a failed critic, a full disk, a failed publish, a sound tool that is missing, a voice that cannot be found, or a building that will not come out right.

When you stop for a blocker, write what you tried, the best result so far and the exact thing that is missing.

An extension is one more polish pass Brandon asks for after completion. `kit/08-BUILD-ORDER.md` lists its steps. While one runs, "Build" says `extension N in progress`. A task that starts in that state carries the same extension on, whatever its prompt says, and never starts a new one.

## Showing the work

Brandon watches this build from the task thread. In earlier builds he went most of a day with almost nothing to look at, and the pictures that were shared arrived as files he had to download. Neither may happen here. If a page, the cursor or the pinball machine is drifting off course he wants to see it within the half hour, not twenty hours later. He also wants to open the site itself as it grows and try it.

- Inline pictures. Every picture meant for Brandon is displayed in the thread itself, so he sees it without opening or downloading anything. What worked in an earlier build on November 21: write the pictures into one JSON file as JPEG data URLs with their captions, at most `status.pictureLongEdgePx` on the long edge, and show that file with the inline visualization tool through a small widget that reads the file as its data source and sets each image from its data URL. External URLs and workspace paths did not load as image sources in the widget. Phase 0 proves a method in its first steps, by showing `references/approved/contact-sheet.jpg`, and records it under "Tool record". A file attachment on its own does not count.
- The rhythm. Post a status at least every `budget.statusMaxGapMinutes` of working time, in every phase, including while a long job runs or agents are working. Also post one at the end of every round, at every finished unit and at every phase gate. Outside those moments, do not post more often than every `status.minGapMinutes`. He wants a steady stream, not a flood.
- What a status is. Two or three lines: the phase, the unit and the round, what changed since the last status, what is next, and the time used out of the time allowed, as the clock prints them. Then one to `status.maxPictures` pictures with a one line caption each. Then the link to the site and the review page link.
- Which pictures. Show what you and your agents are looking at. Every still, sheet, crop and comparison that anyone renders in order to look at it is logged by the harness as a look. A status shows the newest looks that best show where the build is. When a key of the unit in hand can be rendered, its comparison beside the approved image comes first. A status about a gag, the cursor's acting or the pinball scene shows a sheet of consecutive frames, because one still cannot show motion.
- Unfinished is fine. Never hold a picture back because it looks bad. A bad picture seen early is the point.
- Agents. What an agent is looking at is shown too. A build or render agent pushes its newest looks to its looks branch with every heartbeat, and you fetch them for each status. A short-lived agent returns its looks with its report. Say so in every agent's brief.
- While a render job holds the render slot of this VM, a status renders nothing new. It shows the newest frames that job has produced and the newest looks.
- Until `npm run status` exists in Phase 0, post statuses by hand at the same rhythm, with whatever picture is newest.
- `npm run status` builds the gallery. `kit/05-ARCHITECTURE.md` describes it.
- Each status also writes its pictures to `out/stills/status/`, updates "Latest pictures" in `kit/PROGRESS.md`, and is committed and pushed together with the work done since the last one. Nothing stays unpushed for longer than the gap between two statuses.
- A status is not a round, not a question and not a pause. Post it and carry on in the same turn.
- The artifact. Publish the site with its review page in Phase 0, and again at every phase gate, at every finished unit, and whenever a status shows something a still cannot, such as a new version of a gag. From Phase 2 on the published site is the whole application as it stands, stand-ins and all, so Brandon can click through all five steps himself at any time. The URL is in the status section of `kit/PROGRESS.md` and in `README.md`.
- Sound. A status that follows new kept sounds shows them as one picture, a waveform for each sound with its name and length, and says that they can be heard on the sound board of the review page.
- If no method displays a picture inline in this workspace: say so once in the thread, attach the pictures as files at the same rhythm, and publish with every status so the "Latest" section of the review page is always current.
- If Brandon writes in the thread while you work, he is steering. Apply what he asks, log it under "Notes from Brandon" in `kit/PROGRESS.md`, answer in one or two lines and carry on. His note beats the kit on its own topic, the same way an addendum does. A note that asks for a change to something already finished is queued: finish the step in hand, then work it inside the limits in `kit/07-QUALITY-BAR.md`.

## The workspace

Measured in earlier builds in this kind of workspace, November 18 to 23, 2026. Measure again in Phase 0 and trust your own numbers over these.

- Ubuntu VM, 2 CPU cores, about 7 GB RAM, 20 GB disk, no GPU.
- Browsers render WebGL2 in software through SwiftShader. The launch flags that worked: `--use-angle=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist`.
- Under software rendering the largest 2D texture was 8192 pixels on a side.
- Software rendering is slow. In earlier builds a light scene took about 0.8 seconds per sample at 1920 x 1080, a finished one 2.6 seconds, and one heavy frame at the final tier took 223 seconds. These times say nothing about a real graphics card.
- Because there is no graphics card here, the speed of the live site cannot be measured in this workspace. It is held to counts, as `perf` in the config sets them, and Brandon measures it on real machines with the probe page.
- WebGL calls return before the software rasterizer finishes. Read one pixel back before you stop a timer.
- Blender 4.5 LTS ran headless here in another build, installed by the Builder. It may be used as a build-time tool for geometry and baking. Nothing depends on it.
- There was no built-in image-to-3D tool. A hosted one refused anonymous calls. Phase 0 checks again. `kit/03-METHOD.md` says where one may be tried.
- A scripted step times out after `sandbox.stepTimeoutMinutes`. A process started detached outlived the step that started it, so long renders run detached with a log file that is polled. Every long job is still resumable.
- Images shown to a model arrive untouched up to about 1,400 px on the long edge and are downscaled above that. Never judge fine detail or small type from a full frame. Use crops whose long edge is at most `critics.maxImageLongEdgePx`.
- A contact sheet of `critics.contactSheetFrames` frames is readable in one view. A message carried at most 10 attachments.
- Running `npm install` in a folder with no `package.json` removed preinstalled packages. Install only from the repo root after its `package.json` exists.
- Tools seen: `generate_image` (several image models, reference images, aspect ratios 1:1, 3:4, 4:3, 9:16 and 16:9, about two minutes a call, around 2816 x 1584), `generate_video`, `search_images`, `fetch_image`, `deploy_website`, `publish_website`, and an inline visualization tool that can show a grid of pictures in the thread. The text-only `llm` tool cannot see images, so every critic is a spawned agent.
- Image generation misspells words. Every approved image has wrong letters somewhere. Never take text from a generated picture, and never ship a generated picture that carries words. Type is always set from `content/copy.json`.
- An ElevenLabs connector is connected on Brandon's account, on the Creator plan. In another build on November 23 one call to its sound effect endpoint returned a short MP3 in about two seconds. A prompt steers the kind of sound, not its exact tone, and a take comes back near full level with a little silence in front. The narrator's voice is saved in that account under the name in `audio.narratorVoice`. Phase 0 finds it by listing the account's voices.
- An audio evaluation tool answered questions about a sound file in words in that build. You have no ears. `kit/03-METHOD.md` section 12 says how a take is chosen without them.
- The team this work is for has skills in this workspace. One matters here: a skill that draws the Perplexity prompt screen typing a prompt, followed by a build screen. Phase 0 finds it by listing the workspace's skills and records its name. `kit/03-METHOD.md` says what to do if it is not there.
- App hosting put a static folder at `<name>.pplx.app` and accepted about 500 MB per site. A site set to organization visibility asks for a sign-in, so the harness cannot read files back from it.
- `VideoEncoder` exists only on a secure context. `localhost` counts.
- The disk is small. Never hold more than `sandbox.maxFramesOnDisk` frames on disk: encode in chunks and delete frames as each chunk is done. Every render command refuses to start with less than `sandbox.minFreeDiskGb` free.
- No single download is larger than `sandbox.maxDownloadGb`.

## Supporting agents

- Use them freely: the pages, the machines, the buildings and hardware of the pinball table, the boss, sounds, rendering and every critic role. Phase 4 is five units built side by side.
- A default agent shared the Builder's VM. An agent started with sandbox isolation got its own VM with 4 cores and could clone the repo, push a branch and return files. Use sandbox agents to render, to bake and to build in parallel.
- One owner per folder. An agent edits only the folders it was given. You integrate.
- An agent that pushes uses its own branch named `agent/<folder>`. Only you write to `repo.branch`.
- Every build agent's brief names the approved images of its part, gives the part's section of `kit/02-SUBJECT.md` and `kit/03-METHOD.md` word for word, and repeats the three rules that agents break first: every word comes from `content/copy.json`, the cursor has no face, and the page must still pass as a real web page.
- Never trust an agent's report. Verify its work through the harness and the checks.
- Run at most `sandbox.maxRenderProcesses` render processes at once in one VM.
- Critics are always fresh agents that receive files only, as attachments, never as a path into the repo. A pack never exceeds `critics.maxFilesPerMessage` files. Critics never see your reasoning, earlier scorecards, each other's answers, or any part of the kit beyond what `kit/07-QUALITY-BAR.md` says to give them.
- A fresh agent can see the names of other agents and the names of files. Use neutral names: agents like `reviewer-01`, files like `set-A-07.png`. No name shown to a critic contains words such as render, target, approved, generated, final, or the name of any technique.

## Git

- Remote: `repo.url`. Branch: `repo.branch`.
- Commit after every meaningful step. Push as "Showing the work" says.
- Never force push or rewrite pushed history. Never delete a remote branch, with one exception: an agent's looks branch, and an agent's branch that carried only render chunks, is deleted once that agent is done and what it carried has been copied out.
- A looks push holds at most `status.maxPictures` new pictures, each resized to `status.pictureLongEdgePx` on its long edge.
- Brandon's review notes are pushed to `repo.branch` as addenda while you work. Fetch and merge `repo.branch` from the remote at the start of every phase, before you read `kit/addenda/`, and before every push. Merge, never rebase. If a push is rejected, fetch, merge and push once more. If it is rejected again, log it and try at the next commit.
- Clone shallow.
- No file over `repo.maxFileMb` megabytes. No push over `repo.maxPushGb` gigabytes: push more often if one would be.
- History cannot be rewritten, so every committed version of a large file stays forever. Commit built assets once per round, after the best take is chosen, never per take and never per tuning look.
- What is committed: scripts, configs, recipes, the shipped files under `public/`, kept stills, scorecards and logs. What is not: bake caches, simulation caches, high resolution intermediates and anything else under `out/work/`. The scripts and their committed inputs must be enough to make every shipped file again.
- Sound files follow "Sound" below.
- `.gitignore` excludes `out/work/` and `references/cache/`. Keep it that way.
- `out/stills/`, `out/clips/`, the preview films, `out/roughcut.mp4` and everything under `deliver/` change only through the harness commands that `kit/05-ARCHITECTURE.md` names for them.
- An agent branch that carries render chunks is fetched, never merged.
- Do not delete or rewrite anything under `references/approved/` or `references/drafts/`, and do not edit `references/STATUS.md`. Those files are the record of what Brandon approved and rejected.
- Do not edit `content/copy.json` or `content/narration.json`, with one exception: a line of narration Brandon rewrites in a review round or at the review is replaced with his words.
- Never commit or print tokens, keys or passwords.

## Conventions

- TypeScript, strict. Vite. three.js on WebGL2. GSAP for easing. No UI framework. CSS Modules for the few DOM controls.
- Almost no code comments. Keep only a short comment that explains a non-obvious why.
- No `Math.random`, `Date.now` or `performance.now` in anything that affects a pixel of a computed frame. See determinism in `kit/05-ARCHITECTURE.md`.
- Every word on a page comes from `content/copy.json`, exactly as written there, or from a key the kit names in the config. No word is typed into the code. Check G11 tests it. If a page needs a word the copy does not have, use the nearest string that is there, log it under "For Brandon to decide", and do not write one yourself.
- Nothing is drawn over the picture that is not part of the page: no caption, subtitle, watermark, title card or logo, in any frame of film B, of the card loop or of the body of film A. The live site's own few controls, the sound control, the skip link and the watch the film link, appear in live mode only. The one place a product screen is filmed is the prompt opening of film A, which shows the product this work is made for.
- No em dashes anywhere, in any file you write. Do not add an exclamation point to anything you write. The few in `content/copy.json` are Brandon's and stay.
- No model names or version strings in the site or the README. The one product named on a page is the applicant's name in `applicant` in the config, which the film types into the form.
- Page surfaces are never pure black or pure white.
- No people, no hands, no faces and no animals, in any image you generate or any frame you draw. Testimonials show a badge with the photo blacked out. The boss is a machine.
- The cursor never has a face, eyes, a mouth, eyebrows, legs, feet or white gloves. Its arms exist only inside the beat named in `cursor.armsOnlyInBeat`. Check G12 tests it.
- No real brand, logo, slogan or trademark on anything. `employer.name` and `table.name` are invented. The pinball machine copies no real machine: not its name, not its artwork, not its layout. The jokes that name real companies are held back in `copy:heldBack` and stay out.
- No data leaves the browser. Nothing a visitor types is sent or stored anywhere. No analytics, no cookies, no network call after the site's own files have loaded.
- Python and Blender scripts, if you use them, live under `pipeline/`. They are build-time tools only. Nothing under a GPL or AGPL licence is shipped to the browser.

## Sound

Sound is part of this build: the narrator, an effect on every contact, and a quiet room tone under everything. There is no music score. `kit/01-FILM.md` sets the bar and `kit/03-METHOD.md` section 12 says how each sound is made. These rules hold throughout.

- Sound never blocks a gate, a round or a phase. A sound that fails after its takes becomes an open item, that moment plays without it, and the build continues. If no sound tool can be called at all, log it, build everything silent, and say so in the first line of the `REVIEW` block: Brandon then supplies the audio himself.
- If the voice named in `audio.narratorVoice` cannot be found in the account after three tries at looking, make every effect, build the site and the review cut without the narrator, and say so in the first line of the `REVIEW` block. Do not pick another voice. Brandon chose this one.
- Sound never changes a pixel. In `capture` mode no audio code is loaded.
- Phase 0 reads the current output terms of the sound tool and records them, as `kit/06-ASSETS.md` says. In another build on November 23 the reading was: paid plans carry a commercial licence; sound effects may be used inside a film or an app but may not be made available as isolated audio files or as a collection of sounds; music on this plan may be used commercially except in "film, TV, radio and Studio Games", with "film" left undefined. Record what you find. This build makes no music score. The one piece that sounds like music is the hold music cue, a few seconds heard through a phone speaker. Make it with the sound effect endpoint. If only the music endpoint can make it, make it there and list it under "For Brandon to decide".
- Where the files live depends on the repo. `repo.expectPrivate` says what Brandon intends. Phase 0 measures whether `repo.url` really is private, and what it measures decides. If the two disagree, the first status says so.
  - Private: kept sound files are committed like any other built asset.
  - Public: no generated sound file is committed, and `.gitignore` gets the lines that keep them out. Their prompts, settings and measurements are committed as text. The files stay in the workspace and in the published site, and one archive of every kept file is attached to the thread with each status that follows new sounds and with the `REVIEW` block. A later task that does not find the files takes them from an archive attached to its prompt. If none is attached it makes the missing sounds again from their recipes, inside the take limits, and says in its first status that the sounds are new takes and not the ones Brandon heard.
- The first status of Phase 0 says in one line which of the two applies.

## Assets

- Every file you did not make is listed in `ASSETS.md` with its source URL and license before it is used.
- Allowed: public domain, CC0, the SIL Open Font License for fonts, or a license that clearly permits commercial use in a published video and on a public website. If the license is unclear, do not use the asset.
- Nothing extracted from a game, a film or a paid pack.
- Photographs from the web are references to study. They are never committed and never appear in the site or the films. They live in `references/cache/`, which git ignores. Photographs of real pinball machines are studied for how a machine is built and lit, never for a name, a piece of artwork or a layout.
- Every asset you generate or build has its recipe committed beside it: the tool, the inputs and the exact prompt or command. `kit/06-ASSETS.md` gives the format.
- Generated stills feed shipped files here: the printed artwork of the playfield, the cabinet and backbox art, building faces, material detail. Phase 0 reads the output terms of each image model it will use and records them in `ASSETS.md`. `kit/06-ASSETS.md` says what to do with what it finds.

## Never

You never lower a threshold, drop a critic, reword a rubric or a jury question, remove a judged still or frame, pick easier controls, lower `tiers.final`, replace an approved image, rewrite the copy, give the cursor a face, cut scope, ship a stand-in, or report a limit reached as a pass.
