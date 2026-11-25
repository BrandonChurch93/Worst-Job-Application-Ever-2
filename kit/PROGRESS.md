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

Status 3, 2026-11-25T06:17Z, Phase 0.

1. `out/stills/status/01-physics-test.jpg`: The physics test: six balls for ten seconds at 240 steps a second, with three bumpers and a flipper. The same hash came back from Node, from the browser and from a second VM.

## Clock

Copied from the last tick of `npm run clock`.

```
clock: phase 0, tick 12 at 2026-11-25T06:35:15Z, allowance: build
time used in this phase: 1.04 h of its box of 3.00 h
time used under the allowance in force: 1.04 h of 36.00 h allowed
time used: 1.04 of 36.00 hours before the review
extra rounds: yes
half point: not reached
box end: not reached
budget report: not due
minutes since the last status: 17
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
- Browser and WebGL2. MEASURED by `npm run caps` at 06:08Z, written to `config/webgl-caps.json`. Chrome for Testing 147.0.7727.15, headless, with software rendering (flags `--use-angle=swiftshader` `--enable-unsafe-swiftshader` `--ignore-gpu-blocklist`). Renderer string: ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero) (0x0000C0DE)), SwiftShader driver). WebGL 2.0 (OpenGL ES 3.0 Chromium). Limits: largest texture 8192, largest renderbuffer 8192, 6 draw buffers, 4 samples of built-in antialiasing, 32 texture units in a fragment shader, 4096 fragment uniform vectors. So the 3840 by 2160 master fits in one target here.
- Float targets. MEASURED: an RGBA16F target is not complete without an extension, and is complete with `EXT_color_buffer_float` and with `EXT_color_buffer_half_float`. An RGBA32F target is complete with `EXT_color_buffer_float`. The accumulator asks for `EXT_color_buffer_float` first, then `EXT_color_buffer_half_float`, and has an 8 bit path for a machine with neither.
- Extensions. 30 are present here and 20 of them are portable by the public table in `references/terms/webgl-extensions.json`. Present here and not portable, so used only behind a test: `EXT_conservative_depth`, `EXT_disjoint_timer_query_webgl2`, `NV_shader_noperspective_interpolation`, `OES_sample_variables`, `OES_shader_multisample_interpolation`, `OVR_multiview2`, `WEBGL_clip_cull_distance`, `WEBGL_multi_draw`, `WEBGL_polygon_mode`, `WEBGL_stencil_texturing`. Portable by the table and not present under software rendering here: `OES_texture_half_float_linear`, `EXT_texture_norm16`.
- Detached process. MEASURED 06:10:33Z to 06:11:01Z: a process started detached in one scripted step (`(set -m; cmd >log 2>&1 &)`) wrote a line every two seconds for 28 s after that step had returned at 06:10:34Z, and ended by itself. So a long render can run detached and be polled, and it is never left running without a line under "Running jobs".
- Physics between machines. MEASURED 06:09Z here and 06:12Z on a fresh sandbox VM by `npm run physics:test` (`tools/physics-test.mjs`, scene in `tools/lib/physics-sim.mjs`): ten seconds, 2400 steps at 240 a second, six balls, three bumpers, guides, a flipper swung on a schedule and nudges on a schedule, every number a literal with no trigonometry. The hash covers every ball's place, turn and speed four times a second across the whole ten seconds, so it covers the path and not only where the balls came to rest. Hash `0c856ed2607acbace5ae9117b5f9998da51172cf808cab1f7a0fd49d1f126365`, and the library's own snapshot of the world `28135597ff7d6d0d3257e6970918190d52cbae4563c4ff8bed4011841408e830`. Equal in Node run twice, equal in Node and in the browser, on this VM (2 cores) and on the sandbox VM (4 cores, its own clone at commit `09594e4`, `npm ci` in 3 s with no browser download). Both VMs report the same processor model, Intel Xeon at 2.90 GHz, so this proves two machines of one kind. A different processor is UNKNOWN here; the library's build is the one its makers state is the same on every machine. First try passed, so the library is `@dimforge/rapier2d-deterministic-compat` 0.21.0 and the named fallback is not needed. UNKNOWN and expected to differ, as `kit/05-ARCHITECTURE.md` says: Brandon's machine has another browser build, and the pinball take is checked there before a long render.

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
- Image models that can be called. STATED by the tool's own description, with one size MEASURED: two OpenAI image models (the tool names them `gpt_image_2_6_flare` and `gpt_image_2_6_sunburst`), up to 5 reference pictures each; two Google image models (`nano_banana_2_1`, `nano_banana_pro`), up to 14 reference pictures each; one ByteDance image model (`seedream_5`), up to 10 reference pictures, MEASURED in an earlier round of this project to return 2816 by 1584. UNKNOWN until a call is made in this build: the largest size the OpenAI and Google models return. Each generated picture's size is measured when it is made and written into its row of `ASSETS.md`.
- Video models. STATED: five can be called (`veo_3_1_fast`, `veo_3_1`, `seedance_2_0`, `seedance_2_5`, `minimax_h3`). The build does not use them: every frame of the films is rendered from the site itself.
- Image to 3D. MEASURED by looking through the tool list: there is no tool that turns a picture into a model. Every model is built by script, as `kit/03-METHOD.md` says.
- App hosting. STATED: a publish tool takes a built folder and gives one public address that stays the same when published again. The largest site it accepts is UNKNOWN until the first publish in step 17, and is measured then and at every publish after it.

## Pinned versions

All MEASURED on 2026-11-25 from `package.json` and `package-lock.json` after a clean `npm install`. Every version is exact and `.npmrc` sets `save-exact`.

| Package | Version | What it is for | Licence |
| --- | --- | --- | --- |
| `three` | 0.187.0 | The renderer, `WebGLRenderer` on WebGL2. The registry's `latest` on this day | MIT |
| `@types/three` | 0.187.0 | Types for it | MIT |
| `gsap` | 3.15.1 | Easing | GSAP standard licence, free for this use |
| `@dimforge/rapier2d-deterministic-compat` | 0.21.0 | The pinball physics, first try. See the physics test below | Apache-2.0 |
| `vite` | 8.3.8 | The build | MIT |
| `typescript` | 7.0.2 | Type checking, strict | Apache-2.0 |
| `vitest` | 4.1.12 | Unit tests | MIT |
| `playwright-core` | 1.59.1 | Drives the headless browser already in the workspace. It never downloads a browser | Apache-2.0 |
| `sharp` | 0.35.5 | Harness only: resizing, crops, comparison images, PSNR | Apache-2.0 |
| `@types/node` | 20.19.25 | Types for the harness | MIT |
| `@fontsource/playfair-display` | 5.3.0 | Source of the Playfair Display font files. Build time only | OFL-1.1 |
| Inter 4.1 (not a package) | 4.1 | Source of the Inter font files: the official release archive, sha256 `9883fdd4a49d4fb66bd8177ba6625ef9a64aa45899767dde3d36aa425756b11e`. Build time only | OFL-1.1 |
| fonttools (Python, build time) | 4.68.0 | Reads the outlines in `pipeline/fonts/bake_fonts.py` | MIT |
| uharfbuzz (Python, build time) | 0.57.0 | Reads the kerning between every pair in the same script | Apache-2.0 |

- Browser: Chrome for Testing 147.0.7727.15, the headless shell build already in this workspace at `~/.cache/ms-playwright/chromium_headless_shell-1217/`. `playwright-core` 1.59.1 names revision 1217 as its own browser, so driver and browser match and nothing is downloaded. `tools/lib/browser.mjs` finds it, or takes a path from `WJA_BROWSER`. A second browser, Chromium 156.0.8078.48 at `/opt/pplx-chromium/chrome`, is in the workspace and is not used by the harness.
- Node v20.20.2, npm 10.8.2, ffmpeg 8.0.1.
- Decision: `vitest` is 4.1.12 and not 5.1.1. Version 5.1.1 states that it needs Node 22 or newer and this workspace has Node 20. It ran one test here, but a tool run outside what it states it supports is a risk the build does not need. 4.1.12 states Node 20 and Vite 8.
- Decision: `.npmrc` sets `legacy-peer-deps`. MEASURED: without it npm 10.8.2 stops with an internal error ("Cannot read properties of null (reading 'edgesOut')") while it works out the optional peer packages of `vitest`. With it a clean install takes 6 s and gives 54 folders. The lock file is committed.
- three.js migration notes read on 2026-11-25 at https://github.com/mrdoob/three.js/wiki/Migration-Guide for 184 to 187, and what each means here:
  - 187: PMREM environment maps are now built on cube render targets and `CubeUVReflectionMapping` is gone. Reflections look slightly different from older releases. The build never used the older look, so nothing to change, and the scene's environment is made through `PMREMGenerator` only.
  - 187: `WebGLRenderer.setViewport()` and `setScissor()` no longer scale by pixel ratio when a render target is bound. The accumulator sets its targets' sizes in real pixels and keeps the pixel ratio at 1 in `capture`, so one number means one pixel everywhere.
  - 187: the renderer uses `WeakRef` and `FinalizationRegistry` inside. Both exist in every browser the site supports. The page still releases what it leaves by calling `dispose()` itself.
  - 187: `MeshPhysicalMaterial.iridescenceThicknessRange` is now two numbers, minimum and maximum. Use those.
  - 186: `Object3D` has a `dispose()` method. Our own object types call `super.dispose()`.
  - 186: `Source` is now `TextureSource`.
  - 185: `Object3D.updateWorldMatrix()` honours `matrixWorldNeedsUpdate`. Where a matrix is written by hand with `matrixAutoUpdate` off, set that flag.
  - 185: in WebGL shader chunks `inverseTransformDirection()` is replaced by `transformNormalByInverseViewMatrix()` and `transformDirectionByInverseViewMatrix()`. Our own shader code uses the new names.
- Type families:
  - Inter, for every word of the site's interface and pages. SIL Open Font License 1.1. Chosen because the approved page images show a plain, even, modern sans with open shapes, and Inter's numerals and punctuation hold at the small sizes of field labels.
  - Playfair Display, weights 700 and 900, for the signs and the marquee of the pinball machine. SIL Open Font License 1.1. Chosen after looking at `references/approved/table-wide.png` and `tier-office.png`: the machine's printed words are a serif with strong thick and thin strokes, and this family has the weight for a backlit sign.
  - A dot matrix face is added only if the machine's displays fall back from built dots to type. Until then none is in the repo.
  - Decision, 2026-11-25: type is baked to JSON outlines at build time by `pipeline/fonts/bake_fonts.py`, and the site reads only those files. MEASURED: `opentype.js` 2.0.0 threw on one of Inter's feature tables and does not read kerning that sits in extension lookups, which is where Inter keeps it. The baked files hold each glyph's outline, its advance and every kerning pair as the shaping engine itself gives them (checked: "To" -160, "AV" -147, "Yo" -179 font units). `opentype.js` and `@fontsource/inter` were removed. Nothing that ships depends on Python.
  - Baked files, in `public/fonts/`: `inter-400.json`, `inter-500.json`, `inter-600.json`, `inter-display-600.json` (373 glyphs each, with the infinity sign, the arrow and the check mark the copy uses), `playfair-700.json`, `playfair-900.json` (213 glyphs each), and the two licence texts. About 190 KB each, 44 to 50 KB compressed. Listed in `ASSETS.md` under "Third-party files". Recipe: `assets-src/fonts/RECIPE.md`.

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

Each with its name, its folders, its branch and its looks branch, when it started, its limit, and what it has pushed.

- `harness_test_writer`, a build agent in its own sandbox VM. Files: `tests/` and `tools/review.mjs`. Branch `agent/tests`, no looks branch (it returns one look with its report). Started 2026-11-25T06:27Z, limit 35 minutes. Job: the unit tests for the clock and for startup validation, and the review page builder. Pushed so far: nothing.

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
