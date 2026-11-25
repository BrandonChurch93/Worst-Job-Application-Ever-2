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

Status 2, 2026-11-25T06:00Z, Phase 0.

1. `out/stills/status/01-reading-test.jpg`: The reading test given to one fresh agent per model family. At 1400 px every family read numerals 5 to 7 px tall, and larger pictures arrived downscaled.
2. `out/stills/status/02-sound-test-take.jpg`: The one narrator take the quota allowed: the word Behold in the saved voice, 0.60 s. A test, not a kept sound.

## Clock

Copied from the last tick of `npm run clock`.

```
clock: phase 0, tick 6 at 2026-11-25T06:00:57Z, allowance: build
time used in this phase: 0.47 h of its box of 3.00 h
time used under the allowance in force: 0.47 h of 36.00 h allowed
time used: 0.47 of 36.00 hours before the review
extra rounds: yes
half point: not reached
box end: not reached
budget report: not due
minutes since the last status: 0
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
- Image limit. MEASURED 2026-11-25T05:50Z to 05:58Z with six test pictures of numbered rows of fine type, long edges 800, 1200, 1400, 1600, 2000 and 2800 px (`pipeline/phase0/image_limit.py`, scored against the truth file by `pipeline/phase0/image_limit_score.py`). The builder sees a 1400 px picture untouched and reads 5 px numerals in it. A 1600, 2000 or 2800 px picture arrives about 1430 px wide, measured from the printed ruler, and its 2 px line pattern turns flat grey from 2000 px up. So 1400 px is the longest edge that arrives untouched, `critics.maxImageLongEdgePx` stays 1400, and detail is shown with crops, never with a bigger picture.
- Image limit by model family, same pictures given as attachments to fresh sandbox agents. Smallest numeral height read correctly at 1400 px: GPT 5 px, GLM 5 px, Kimi 5 px, Claude 6 px, Grok 7 px. At 2800 px the same agents read only 7 to 12 px, so a larger picture gives a critic less, not more. No agent gave a wrong reading in place of "cannot read". The agent started on Gemini read 5 px.
- Agents and polling. MEASURED 05:51Z to 05:54Z: starting an agent returns at once, and twelve were started in under a minute. The clock was ticked at 05:51:25Z and 05:53:59Z while they worked, and one agent told to wait two minutes answered at 05:53:32Z after starting at 05:51:22Z. Reports arrive as messages between the builder's own steps. Status 2 was posted while agents were still working. So agents do not block, and the shorter agent time of `AGENTS.md` is not needed.
- Sandbox agent. MEASURED 05:51Z to 05:52Z with one fresh sandbox agent (commit `0d73b75` on branch `agent/phase0-probe`, file `pipeline/phase0/sandbox-probe.md`). Its VM: 4 cores, 7957 MB memory, 25 GB disk with 18 GB free, the same OS, Node, npm, ffmpeg and browser folders as this VM, its own boot id. It cloned the repo in 2.4 s, pushed a branch without force, and returned a 2 s H.264 video as a message attachment that this VM could open and probe. One thing a committing agent must do first: set git user name and email in its clone, because a fresh VM has none.

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
- Other speech tool. STATED: a text to speech tool with stock voices exists. It is not the narrator and is not used for it, because Brandon chose the saved voice.
- Model families for agents. MEASURED by starting one fresh sandbox agent on each: GPT, Gemini, Claude, GLM, Kimi and Grok start. DeepSeek is listed but refused to start, so there are six families.
- Which families see. MEASURED with the image limit pictures: GPT, Claude, GLM and Kimi read the pictures themselves. Grok answered correctly but said it cannot see pixels itself and reported what a file viewing tool told it, so it is not used as a critic of pictures unless the others run out. The agent started on Gemini read 5 px.
- Which families hear. MEASURED with a 9 s test file of a spoken line, three knocks and a rising tone: no family hears a sound file directly. Every agent that answered said it cannot take in audio. Listening is done with the audio evaluation tool and with measurements.
- Terms read on 2026-11-25, each by a supporting agent that kept every quote with its source, and each quote checked by script against the fetched page: `references/terms/images-openai.md`, `images-google.md`, `images-bytedance.md`, `images-perplexity.md`, `sound-elevenlabs.md`, `hosting-vercel.md`, and the table of WebGL extension support `webgl-extensions.json` with its notes in `webgl-extensions.md`. What they say is in `ASSETS.md` under "Generated images" and "Generated sounds".
- Hosting limits (`host.name`, free plan), STATED by the provider's pages read on 2026-11-25, quotes in `references/terms/hosting-vercel.md`:
  - What the static file limit counts: the total size of the source files uploaded when deploying with the command line tool, 100 MB on the free plan. It is not a limit on one file and not a limit on the build's output. UNKNOWN: whether it applies to a build made from a Git repository.
  - No page states a largest size for a build's output or for one served file. Nearby: 10 GB of deployment storage across kept deployments, 64 GB of build disk.
  - Build: at most 45 minutes, on 2 cores with 8 GB of memory. Build cache at most 5 GB.
  - Files: 15000 source files for a command line upload, no upper limit on output files.
  - Data transfer: 100 GB a month and one million requests. Past that the free plan's sites are paused.
  - Use: the free plan is for personal or non-commercial use. UNKNOWN: whether a portfolio piece shown by a company employee counts.
  - Cache lifetimes are set in `vercel.json` under `headers`, with a `source` pattern and a `Cache-Control` value.
  - What this means for `host.maxShippedMb`: nothing found says 95 MB is too high or too low. The key is unchanged.

- Audio evaluation tool. MEASURED 2026-11-25T05:46Z and 05:59Z. It exists and takes one file of at most 20 MB with a prompt. On the 0.6 s test line it wrote the word down correctly. On a 7.9 s test file of a spoken line, three knocks and a rising tone, asked three times: the words were right three times, the direction of the tone was right three times, and it said it heard the sounds that are not speech. It counted the knocks as 4, 3 and 3, and the times and the length it gave were wrong and changed from run to run (it said 9 s and 11 s). So it hears speech and other sounds, it can say what a sound is and which way a pitch moves, and its counts and times are not trusted. Counts, times, lengths and levels are measured by script. A short answer needs a high token limit, or it comes back cut off.
- Gemini as a critic. MEASURED: the agent started on the Gemini model answered the picture test well (5 px numerals at 1400 px) and named itself as a Claude model. Which model answered is UNKNOWN. A critic's family is recorded as the model it was started on, with this caveat.

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
- 2026-11-25. New pictures that feed shipped files are made with the OpenAI image models where they can do the job. Reason: no model's terms clearly allow both uses, and ownership of output is stated most plainly for those models. Nothing approved is swapped or made again.
- 2026-11-25. `critics.maxImageLongEdgePx` stays 1400. Reason: measured, 1400 px arrives untouched and larger pictures are downscaled to about 1430 px.

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
- The approved images were made with `seedream_5`. Its maker's terms do not clearly allow outputs in a published video or on a public website, and they do not forbid it. The workspace's list of third-party models has no row for that maker, so which terms reach those pictures is unknown. The build uses the approved images as the kit says. Nothing waits on this. Details: `ASSETS.md`, "Generated images".
- The free plan of `host.name` is worded for personal or non-commercial use. Whether this portfolio piece fits that is for you to judge before it goes live there. Details: `references/terms/hosting-vercel.md`, section 6.

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
