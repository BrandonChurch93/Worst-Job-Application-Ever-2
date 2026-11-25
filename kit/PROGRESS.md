# Progress

The Builder's memory. Read it at the start of every task and after every compaction. Keep every section. Write `none` where there is nothing.

## Status

- Build: in progress
- Phase: 0
- Review: not reached
- Review round: none
- Review round step: none
- Review rounds: 0
- After review step: none
- Budget: running
- Continuations: 0
- Extensions: 0
- Extension step: none
- Site URL: none
- Review page: none
- Repo is private: no. MEASURED 2026-11-25T05:38Z with the repo host's own answer (isPrivate false). `repo.expectPrivate` is true, so the two disagree. The first status said so
- Sound files: not committed, because the repo is public. Recipes, settings, measurements and listener answers are committed as text. The files stay in the workspace and in the published site, and one archive of every kept file is attached with each status that follows new sounds and with the `REVIEW` block. `.gitignore` keeps them out
- Portfolio link: not set

## Latest pictures

The pictures of the newest status, with their captions and the time. Files are in `out/stills/status/`.

Status 1, 2026-11-25T05:40Z, Phase 0.

1. `out/stills/status/01-contact-sheet.jpg`: the approved reference images on one sheet, shown inline to prove the display method. Nothing has been rendered yet.

## Clock

Copied from the last tick of `npm run clock`.

```
clock: phase 0, tick 3 at 2026-11-25T05:47:49Z, allowance: build
time used in this phase: 0.25 h of its box of 3.00 h
time used under the allowance in force: 0.25 h of 36.00 h allowed
time used: 0.25 of 36.00 hours before the review
extra rounds: yes
half point: not reached
box end: not reached
budget report: not due
minutes since the last status: 7
```

## Phases

| Phase | State | Started | Done | Commit | Gate evidence |
| --- | --- | --- | --- | --- | --- |
| 0 Ground truth | in progress | 2026-11-25T05:32Z | | | |
| 1 The rough cut | not started | | | | |
| 2 Engine and blockout | not started | | | | |
| 3 The look lock | not started | | | | |
| 4 The other pages | not started | | | | |
| 5 The whole site, the sound and the review | not started | | | | |
| 6 The films and delivery | not started | | | | |

## Units

| Unit | State | Rounds run | Last scores | Commit | What ended its loop |
| --- | --- | --- | --- | --- | --- |
| `step1` | not started | 0 | | | |
| `pinball` | not started | 0 | | | |
| `boss` | not started | 0 | | | |
| `step2` | not started | 0 | | | |
| `marketing` | not started | 0 | | | |
| `decision` | not started | 0 | | | |
| `site` | not started | 0 | | | |
| `film` | not started | 0 | | | |

States: `not started`, `in progress`, `finished`.

## Workspace record

Measured in Phase 0: OS, cores, memory, disk, Node and npm, the browser and its version, the WebGL2 limits, the image limit, whether agents block, whether a detached process survives, what a sandbox agent can do, the PSNR between VMs.

All MEASURED on 2026-11-25 unless a line says otherwise.

- OS: Ubuntu 26.04.1 LTS, kernel 6.1.155. 2 cores, 7957 MB memory, 20 GB disk with 12 GB free at the start, no graphics card.
- Node v20.20.2, npm 10.8.2. `ffmpeg` and `ffprobe` are present at `/usr/bin` and run (step 6). Python 3 with PIL 13.0.0 and ImageMagick are present.
- Machine boot id at the start: `df551acd-542a-4cfe-8bc6-11afd76c75c3`.
- Browser, WebGL2 limits, image limit, agent tests and PSNR: see the lines added below as each is measured.

## Tool record

What can be called here, and how each thing was done: the inline display method, the image models with their sizes and reference limits, a video model, an image-to-3D model, app hosting, the model families for agents and which can see and hear, the sound endpoints, the narrator's voice and how it was found, what makes it pause, its settings for a slow read, the audio evaluation tool, the prompt screen skill.

Every line says whether it is MEASURED here, STATED by a tool's own description, or UNKNOWN.

- Inline display method. MEASURED 2026-11-25T05:40Z, works. Write one JSON file under `out/work/status/` shaped `{ "lines": [...], "pictures": [{ "caption", "src": "data:image/jpeg;base64,..." }], "links": [...] }`, each picture resized to at most `status.pictureLongEdgePx` on the long edge and saved as JPEG at quality 82. Show it with the inline visualization tool, passing the file as the data source named `gallery` in format json, with the widget code in `tools/assets/status-widget.html`. The widget reads `window.visualization.sources.gallery.data`, prints the lines, shows the pictures in a grid of two columns (one picture takes the full width, a click zooms) and prints the links as text. The same lines are posted as chat text.
- Prompt screen skill. MEASURED: found on the first look in the workspace's skill list. Its name is `org:synthetic-query-typing` ("Render synthetic Computer UI for product-feature videos: query typing, thinking steps, thread results"). A second skill, `hyperframes`, composes video from HTML and is installed.
- Sound access. MEASURED: there is no ElevenLabs connector tool in this workspace. ElevenLabs is reached through a saved credential for `api.elevenlabs.io`, called over plain HTTPS. Account: plan `creator`, status active.
- Narrator voice. MEASURED: found on the first look by listing the account's voices. Name `Worst-Job-Application-Ever`, id `eFAEy5Egqu7dR7KfdpSZ`, category `generated`, saved settings stability 0.5, similarity 0.75, style 0, speed 1.0, speaker boost on. Its own description: male, late 50s, broad Australian accent, deep baritone at full speaking volume, slow wildlife documentary delivery with long pauses, smug, dry and condescending.
- Sound quota. MEASURED 2026-11-25T05:42Z to 05:46Z: the account had 4 credits left of 131000 for this period (130996 used). The period resets on 2026-12-23T20:08Z. The limit cannot be extended from the API (`can_extend_character_limit` false). Calls made:
  - Speech, 39 characters: refused, `quota_exceeded`, 17 credits needed, 4 left.
  - Speech, the one word "Behold.": HTTP 200, an MP3 of 0.60 s, mono 44100 Hz, peak -4.3 dBFS, -18.7 LUFS. This is the one test line. It used 3 credits and left 1.
  - Speech, third try: refused, `quota_exceeded`, 1 credit left.
  - Sound effect, 0.5 s, three tries: each refused in about 0.5 s with `quota_exceeded`, 6 credits needed.
  - So the voice exists and answers, and nothing more can be made until credits are added or the period resets. Under `budget.toolRetryMax` this is recorded and the build goes on. The quota is read again at the start of every phase and before any sound work, and sound work starts the moment calls succeed.
- Speech endpoint. MEASURED: `POST /v1/text-to-speech/<voice id>` with `output_format=mp3_44100_128`. Models the account lists for speech: `eleven_v4`, `eleven_v4_turbo`, `eleven_v3`, `eleven_v3_conversational`, `eleven_multilingual_v2`, `eleven_flash_v2_5`, `eleven_turbo_v2_5`, `eleven_turbo_v2`, `eleven_flash_v2`. The test call named no model, so it used the endpoint's default. UNKNOWN: which model that default is, and how long a call takes for a full line.
- Sound effect endpoint. MEASURED: `POST /v1/sound-generation` exists and answered with a quota refusal. UNKNOWN until credits exist: its shortest and longest length, its cost per second and its time per call. STATED by `AGENTS.md` from another build: about two seconds a call, near full level, a little silence in front.
- Pause mark and slow-read settings. UNKNOWN: the three-way pause test and the speed test need speech calls and could not be made. They are the first thing done when credits exist.
- Audio evaluation tool. MEASURED: it exists and takes one file of at most 20 MB with a prompt. On the 0.6 s test line it wrote down the word correctly ("Behold") and said it had only a transcript and could not hear tone, so its answers about delivery are UNKNOWN for now. A longer test with a sound that is not speech is to follow.
- Other speech tool. STATED: a text to speech tool with stock voices exists. It is not the narrator and is not used for it, because Brandon chose the saved voice.

## Pinned versions

none

## Render budget

Seconds per sample and per picture at each format and tier, the fixed cost of starting a render, the time of one simulated second, the time of a search for a take, and what the films and the loop would take. Updated in Phases 0, 2 and 3. Every new kind of job adds its real time here when it ends.

none

## Judged list

Every judged still and frame, with its unit. Computed as `kit/07-QUALITY-BAR.md` says. Entries are added, never removed.

none

## Look lock

Written in Phase 3: what was learned from study in ten lines, every locked setting, each technique that worked and each that did not, and the six recipes.

none

## Sound

The pause mark and the voice settings in use. For every line and every cue: takes made, which was kept and why, or why none. Which beats were moved to make room for a line. Where the files live.

none

## The pinball machine

The physics library and its test between VMs. The count of standing parts and the bare share each time they are measured. Every search for a take: how long it ran, what it found, when each beat's event fell. Which beats, if any, fell back.

none

## Card

The pick's votes and result, or the scene the config named.

none

## Decisions made by the Builder

One line each: the date, the decision, the reason, and the config key if one was written back.

- 2026-11-25. Sound files are not committed. Reason: the repo was measured public while `repo.expectPrivate` is true, and `AGENTS.md` under "Sound" says what is measured decides.
- 2026-11-25. The ElevenLabs quota is used up (1 credit left of 131000, reset 2026-12-23). Decision: record it, say it in the next status so Brandon can add credits while the build runs, read the quota again at the start of every phase and before sound work, and keep every sound system ready. Sound never blocks. No other voice is picked for the narrator.

## Notes from Brandon

His notes from the thread, the review rounds and the review, in his words, numbered, each with how it was applied.

none

## Probe results

none

## Declined issues

Each with the critic, the round, the issue in the critic's words, and the approved image, stated choice or settled line that it goes against.

none

## Open items

Each with its unit, its severity, the still, the critic's words, what was tried and what to try next. A part that ended on a fallback is listed here with the step of the chain that ended it.

none

## Counts

How much of each limit in the table of `kit/07-QUALITY-BAR.md` has been used.

| What | Used | Limit |
| --- | --- | --- |

## Review items not done

none

## For Brandon to decide

- The ElevenLabs account has 1 credit left of 131000 until 2026-12-23. The narrator and the effects cannot be made until credits are added. If credits appear while the build runs, sound work starts at once. If they do not, the site and the review cut are silent and the first line of the `REVIEW` block says so.

## Running jobs

Each with the command, the range, the log file, the VM, when it started and the time the render budget says it should take.

none

## Running agents

Each with its name, its folders, its branch and its looks branch, when it started, its limit, and what it has pushed.

none

## Rounds

One line per round: its number, the unit, the commit it judges, the parts ticked off, the scores, and what changes next.

none

## Final scores

From the record round.

none

## QA results

Every item of `kit/09-QA-GAUNTLET.md` with its evidence.

none

## Failed QA items

none

## Last report block

The last `REVIEW`, `BUDGET REPORT` or `BUILD COMPLETE` block, word for word.

none

## Push log

none

## Session log

One entry per task: when it started, what state it found, what it did, where it stopped.

- Task 1, started 2026-11-25T05:32:34Z. Found: build not started, references approved (manifest checks out, 19 keys, 8 sheets, no pending round), no addenda. Read AGENTS.md and the kit in its reading order. Began Phase 0.
