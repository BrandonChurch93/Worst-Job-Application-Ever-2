# 05 · Architecture

## Stack

- Vite, TypeScript strict, three.js on WebGL2, GSAP for easing. No UI framework. CSS Modules for the few DOM controls.
- Vitest for unit tests.
- A headless browser driver for the harness. Use the one that works with the browser already in this workspace, and pin that browser's version. It must not download a browser when the repo's packages are installed.
- `ffmpeg` and `ffprobe` for films, loops, sound and checks.
- One physics library for the pinball machine, picked and pinned in Phase 0 as `kit/03-METHOD.md` section 10 says.
- Optional build-time tools under `pipeline/`: headless Blender and Python, for geometry and baking. Nothing that ships depends on them being installed.
- three.js: on the day this kit was written, 2026-11-24, the package registry listed 0.184.0 as the latest release, and type definitions for a newer one existed. In Phase 0 take the newest stable release, read its migration notes for `WebGLRenderer`, pin it and record it in `kit/PROGRESS.md`. Pin every other version too.
- One render path: three.js `WebGLRenderer` on WebGL2, in every mode, on every machine. No WebGPU path and no path tracer. The critics judge pictures rendered in software here, visitors see the site on their own graphics cards, and the masters are rendered on Brandon's. All of them run the same shader code.

## Folders

```
config/showcase.json     every number, the units, beats, cameras, keys, sheets, sounds
content/                 copy.json and narration.json. Brandon's words. Read only
src/
  main.ts
  config.ts              typed import of the config, validated at startup
  copy.ts                typed import of the copy and the narration, validated at startup
  core/                  renderer, accumulator, sampler, seeded random, tiers, quality, asset loader
  stage/                 the stage: sim steps, events, checkpoints, the drivers
  shell/                 the surface, header, progress bar, layout tree, type, materials, page turn
  cursor/                body, acting, damage, arms, effects
  pages/<page>/          marketing, step1, step2, step3, step4, step5: layout, parts, gags, script
  table/                 the pinball machine: layout, frame, marquee, loader, art, hardware, lift, displays, ball, models/, lights, physics, director, cameras
  boss/                  the boss: body, transform, weapons, the fight
  film/                  the timeline, the film cameras, the opening, the card loop
  audio/                 the sound engine and the table of events to cues
  ui/                    the DOM controls, the touch message
  post/                  tone curve, grade, glow, grain, dither
  capture/               the frame interface
  probe/                 the probe page
  diagnostics/           the views listed in kit/04-LOOK.md
pipeline/                optional build-time scripts
parts/PARTS.json         the parts register
public/
  assets/                the web asset set and all geometry. This is what ships
  audio/                 what the site plays
  fonts/
assets-full/             the full asset set. Never part of the site build
assets-src/<part>/       the recipe for every generated or built asset: RECIPE.md, text only
audio/                   kept/, mix/, final/, RECIPE.md
tools/                   harness scripts, and the local render
tests/
references/              approved/, drafts/, STATUS.md. cache/ is ignored by git
scorecards/              one folder per round, text only
cut/                     SHOTS.md, CUTLIST.json, TABLE-TAKE.json, CUES.md
deliver/                 the card still, the card loop and its web copy, POST.md
out/                     stills/, clips/, the preview films, roughcut.mp4, committed through the harness. work/ is ignored by git
```

One owner per folder. `src/pages/<page>/`, `src/table/` and `src/boss/` are split so the pages can be built side by side. `src/table/models/` has one folder per model.

Which folders make up a unit:

| Unit | Folders |
| --- | --- |
| `step1` | `src/pages/step1/`, and the shared `src/shell/`, `src/cursor/`, `src/post/` |
| `step2` | `src/pages/step2/` |
| `marketing` | `src/pages/marketing/` |
| `pinball` | `src/pages/step3/`, `src/table/` |
| `boss` | `src/pages/step4/`, `src/boss/` |
| `decision` | `src/pages/step5/` |
| `site` | `src/ui/`, `src/audio/`, `src/stage/`, `src/probe/` |
| `film` | `src/film/` |

## The config

- `src/config.ts` imports `config/showcase.json`, validates it and exports it typed. `src/copy.ts` does the same for the two files in `content/`.
- No other file contains a number, an id, a name, a word of copy or an approved image path that those three files hold.
- Startup fails loudly if a key is missing; if a beat, a key, a sheet or a still names a unit, a beat or a camera that does not exist, where the camera name `film` always exists; if the beats of a page do not run from zero to that page's seconds in `film.units` with no gap or overlap; if `film.units` adds up to more than `film.maxSeconds`; if `budget.phaseHours` does not add up to `budget.runHours`; if `film.fps` is not a whole multiple of `film.previewFps` and of `deliver.cardLoop.fps`; if `cursor.armsOnlyInBeat` is not a beat; if an entry of `deliver.cardLoop.candidates` is not a key; if `content/narration.json` has a beat the config does not have or lacks one it has; if a line of the film, spoken at `audio.narratorMaxWordsPerSecond`, would run into the next line with less than `audio.lineGapSeconds` between them; if the table of events to cues names a cue that `audio.sfx` does not have; if the layout tree of a page names a copy key that does not exist; or if an approved image is missing.
- A camera in `cameras` is a lens angle and a note of what it is for. Its position is fitted and written back. The camera named `film` in a key means the film's own camera at that key's beat and moment.
- A key's `beat` and `at` name the moment of film mode the approved image shows: `at` is the share of the beat that has passed.
- A handful of values are the Builder's to tune and write back: everything under `cameras`, with `cameras.home.fovDeg` inside its limits; each key's `at`, once, when its camera is fitted, to the moment that matches its approved image best; the times in `film.beats` and `film.units`, inside `film.unitTuneFraction` and `film.maxSeconds`; each number under `live.step1`, `live.step2`, `live.pinball` and `live.boss`, by up to a quarter either way, when the bots or a round show a step dragging or rushing; and what each level of `live.quality` draws. Log each change. Two more values may move, each in one direction only: the sizes under `assetSets.web` may be lowered to fit `host`, and `critics.maxImageLongEdgePx` may be lowered in Phase 0. One value is Brandon's, and you write it for him when he sends it: `links.portfolioWork`, from the approval prompt. While it is empty the message page for touch devices shows no link. `film.plannedSeconds` is the record of each page's planned length and is never changed. Nothing else in the config is yours to change.

## The stage and its drivers

This is how one site becomes both the film and the live site, with nothing built twice.

- The stage is the running site: the current page, the cursor, every gag on the page, the simulation and the camera. There is one stage. Every mode runs it.
- A driver feeds the stage one thing each sim step: where the pointer is and whether its button is down. There are four:

| Driver | Used by | Where its input comes from |
| --- | --- | --- |
| `mouse` | `live` mode | The visitor's mouse and clicks |
| `script` | `film` mode and the computed films | `src/pages/<page>/script.ts`: the pointer's path, its clicks and the acting cues of each beat, as functions of time |
| `bot` | `npm run bots` | A scripted visitor from `live.bots` |
| `loop` | `loop` mode and the card loop | The loop's own closed script |

- A gag is a small state machine that belongs to its page. It reads the pointer, the cursor and the simulation, and it does not know which driver is running. The turrets shoot at the cursor whoever is steering.
- Film mode differs from live mode in exactly these ways, and in no other:
  1. The driver is `script`.
  2. The camera is the film's, from `src/film/`.
  3. The applicant is the AI: the script types the name and email in `applicant`, and the checkbox of step 4 answers with `copy:step4.verify.confirmedFilm`.
  4. A gag's live-only way out, the turrets overheating, the boss tiring, is not needed, because the script plays well enough. It still exists.
  5. The DOM controls are not drawn.
- Check G18 fails if a module under `src/pages/`, `src/table/` or `src/boss/` is loaded by film mode and not by live mode, or if a beat's gag does not exist in live mode.
- The stage reports events by name as they happen, with the sim step and the place: `key-press`, `bolt-hit`, `bumper`, `stamp` and the rest. Sound hangs on events. So do the checks that test the story.

## Determinism

A computed picture is a pure function of what it shows, the format, the tier, the asset set, the config and the two content files.

- No `Math.random`, `Date.now` or `performance.now` in anything that affects a pixel of a computed picture.
- All randomness comes from one seeded generator built from `seed`, with a named stream per system.
- Two kinds of motion exist, and both are deterministic:
  - Closed-form: the film's camera, a page turn, the light show's score, the ticker, a counter. Each is a function of time. Nothing is stepped from an earlier frame.
  - Stepped: the cursor and its springs, every gag, the paper, the coins, the boss fight, the pinball machine. They advance in fixed steps of `sim.stepHz` from a known start, with no dependence on frame rate or wall clock. The same start and the same driver input give the same state at step N, however the steps were grouped into frames.
- A film frame is a function of its index: time is the index divided by `film.fps`. The stepped state at that time is reached by replay from a checkpoint. `npm run simcache` writes a checkpoint every `sim.checkpointSeconds` along the film, and one at the start of every page.
- Every page starts clean. Nothing stepped is carried from one page to the next, so a page's frames can be rendered without the pages before it.
- A still is a function of a page, a moment and a camera. Its stepped state is reached by replaying that page's script to that moment.
- Rendering picture B after picture A gives the same B as a fresh page load.
- This holds exactly on one machine with one browser version. Phase 0 measures how far it holds between machines: the same still rendered on the Builder's VM and on two sandbox VMs, with the PSNR of each pair logged.
- Frames from two VMs may share one page of the film only if that PSNR is at least `quality.crossMachineMinPsnr`. If it is lower, work is still split across VMs, but only at page turns and one whole judged still per VM.
- Brandon's computer has a different browser build and a real graphics card. A coin or a ball may take a slightly different path there. That is expected and nobody compares them frame for frame. The pinball take is checked on his machine before a long render, as "The local render" says.
- The live site is allowed wall-clock time for input. It still advances the simulation in the same fixed steps.

## Samples

- A computed picture is the average of `tiers.<tier>.samplesPerFrame` samples. Each sample is jittered inside the pixel and places the key light at its own point of the light's area. Where the shot has a lens with focus, it is also placed at its own point on the lens. A film or loop frame also places each sample at its own moment inside the shutter set by `film.shutterDegrees`.
- The shutter's length is counted at `film.fps`, also when a preview is rendered at `film.previewFps`.
- A sample at a moment between two steps takes the stepped state between them.
- Accumulate in linear floating point. Tone curve, grade, glow, grain and dither run once, after accumulation.
- Sample sequences are low discrepancy and seeded.

## Loading and memory

- The loader knows every file a page needs, in each asset set, from one generated index.
- In `capture`, everything a picture needs is in memory before it is rendered. The call resolves when the picture is done, however long loading took.
- In `live`, the careers page and the cursor load first. Each later page loads while the visitor is on the one before it. The pinball machine is the largest and starts loading during step 1.
- Only one page's assets need to be on the graphics card at a time, plus the next page's while it loads. A page that has been left is released.
- Once a texture is uploaded, its decoded source is released.
- A stand-in is never silent. `parts/PARTS.json` is the register of every part, as `kit/03-METHOD.md` defines it. `info().standIns` is every part that carries the stand-in flag in the code or data now loaded, with its unit.
- Check G13 does not take the register's word alone. For every part it covers, as `kit/07-QUALITY-BAR.md` says which, it makes three tests, and it is red if any fails:
  1. The part's state in the register is not `stand-in`.
  2. The hash of the part's files differs from the hash recorded when it was a stand-in. This holds for every state, `fallback`, `general fallback` and `last resort` included, so changing a label changes nothing. Finishing a part always changes its files, if only because its stand-in flag is removed, so a part that is really finished always passes.
  3. The `standins` view shows no pixel flagged for that part in any judged still or frame, and the page reports no flagged code path for that part. Pixels and code paths flagged for other parts do not count against it.

## The frame interface

The page exposes one object on `window`:

```ts
interface Showcase {
  ready: Promise<void>
  info(): { fps: number; format: string; tier: string; assets: string; engineHash: string; pageHashes: Record<string, string>; standIns: { name: string; unit: string }[]; modules: { film: string[]; live: string[] }; counts: Record<string, { triangles: number; drawCalls: number; standingParts?: number }>; textureMb: Record<string, number>; versions: Record<string, string> }
  setFormat(id: string): Promise<void>
  setAssets(id: string): Promise<void>
  setDiagnostic(view: string): void
  renderStill(spec: StillSpec): Promise<void>
  pictureStats(): { invalidValues: number }
  typeRegister(page: string): { key: string; text: string; states: string[]; made: 'copy' | 'config' | 'runtime' }[]
  stillState(spec: StillSpec): { layout: { id: string; kind: string; planned: number[]; drawn: number[]; plannedHeight: number | null; height: number; mechanism: boolean }[]; type: { key: string; text: string; box: number[]; px: number; contrast: number }[]; cursor: CursorState }
  tableState(): { tiers: { id: string; standingParts: number; inserts: number; dropTargets: number; display: { box: number[]; charPx: number } }[]; openings: { id: string; tier: string; clearBalls: number }[]; rails: { id: string; from: string; to: string }[]; holds: { id: string; releases: boolean }[]; sealed: string[] }
  film(): { frameCount: number; units: { id: string; first: number; last: number }[]; beats: { id: string; first: number; last: number }[]; lines: { beat: string; first: number; last: number }[] }
  filmState(frameIndex: number): { unit: string; beat: string; camera: number[]; cursor: CursorState; events: { name: string; x: number; y: number; hitsCursor: boolean }[]; standIns: string[] }
  renderFilmFrame(frameIndex: number, tier: string): Promise<void>
  opening(): { frameCount: number }
  renderOpeningFrame(frameIndex: number): Promise<void>
  loop(): { frameCount: number; scene: string }
  loopState(frameIndex: number): { cursorBox: number[]; threatBox: number[] }
  renderLoopFrame(frameIndex: number, tier: string): Promise<void>
}
type StillSpec = { page: string; beat?: string; at?: number; scroll?: number; camera: string; tier: string; sheet?: string; interface?: boolean; touchOnly?: boolean; live?: string }
type CursorState = { x: number; y: number; heightPx: number; screenHeightPx: number; worldScale: number; acting: string; damage: string[]; arms: boolean; onPage: boolean; inBall: boolean; ballScreenPx: number }
```

- A still with a `beat` shows film mode at that share of the beat. A still with neither `beat` nor `sheet` shows the page at rest as a visitor first sees it, before any gag, with the cursor at its starting place. Every entry of `stills` in the config is one of these, but for `step3-result`, which has a beat: it shows the last screen of step 3 at the end of the scene, with the open ball, the cursor and the result card. `scroll` is how far down a tall page the view is, from 0 to 1. The careers page and the page of step 3 are the tall pages. On step 3, 0 is the first screen and 1 is the last screen, below the machine.
- A still with `sheet` draws the build's own version of that approved sheet: the same states, in the same arrangement, from the `sheet` camera. A sheet entry that names a `camera`, a `width` and a `height` is drawn from that camera at that size: `table-map` is the whole machine from straight above, taller than it is wide.
- `live` names a level of `live.quality` and draws the still through the live site's own path, with one sample.
- `info().counts` and `info().textureMb` have one entry for each page.
- `stillState` and `filmState` return what the checks need without rendering. `planned` is a part's box in the layout tree and `drawn` is where its edges fall in the picture, both in page pixels. `counts` and `type` come from the scene itself, never from reading a picture.
- Places are given in picture pixels: `x` and `y` of the cursor and of every event, and the boxes of `loopState`, are positions in the frame at `formats.hd`, whatever camera is in use. `heightPx` is the cursor's height in page pixels at the page surface, which is what measure M6 reads. `screenHeightPx` is its height in the picture, which is what measure M7 reads.
- An event's `hitsCursor` is true when the thing that happened struck the cursor: a bolt, a slab, a coin, the crank, a bumper, a steel ball, the doors, the stamp.
- `pictureStats` reports on the picture just rendered, before tone and grade. Measure M1 reads it.
- In `stillState`, `plannedHeight` is the entry of the part's kind in `scale.heights` when the kind is listed in `scale.kinds`, and null otherwise. `height` is how far the top of the part as built stands above the page surface. Both are in page pixels. `mechanism` is true for a thing the cursor works: the keyboard, a turret, each step 2 machine, the shredder, the loader port, the stamp. Measure M9 reads them. The pinball machine's parts are not in this list. `tableState` has them.
- `tableState` is read from the machine's layout file and its physics, not from a picture. `openings` lists every lane, door, chute, tube, ramp and turn of the spiral a ball can use, with its clear width in balls. `rails` gives where each rail is entered and where it lets a ball go: a tier, a hold or another rail, by id. `sealed` lists what no rail or opening leads into. Measures M8 and M10 read it.
- `inBall` is true while the cursor is sealed in the clear ball, and `ballScreenPx` is then the ball's width in the picture.
- `typeRegister` lists every run of type a page can ever show, with the states that show it and how its text is made. Check G11 reads it.
- `info().standIns` is read from the stand-in flags in the code and data that are loaded, not from the register. `info().modules` lists the modules under `src/pages/`, `src/table/` and `src/boss/` that each mode loads. Check G18 reads it.
- `renderLoopFrame` accepts the index one past the last frame. Check G14 uses it.
- After a call resolves, a clean picture is on the canvas. For a picture with the interface, the harness captures the page region that holds canvas and controls together.
- If one picture at the `final` tier does not fit in `sandbox.chunkBudgetMinutes`, add calls that split its samples across steps, and prove with `npm run determinism` that a split picture is pixel-identical to an unsplit one.

## Modes

Set by URL: `?mode=`, with `step`, `unit`, `which`, `format`, `tier`, `assets`, `quality`, `frame`, `first`, `last`, `bot` and `diag` as optional parameters.

| Mode | What it does |
| --- | --- |
| `live` | The site, as a visitor uses it. The default, and what the hosted address opens. `step=3` opens it at that step |
| `film` | The site playing itself in real time on this machine, with its sound. This is what the watch the film link opens. `which=a` plays film A. `unit=<id>` plays one page |
| `loop` | Plays the card loop in real time, repeating |
| `capture` | Renders nothing until asked through the frame interface. The harness and the local render use this |
| `probe` | Measures frame rate on this machine. See "The probe" |

- `assets` defaults to `web` in `live`, `film`, `loop` and `probe`, and to `full` in `capture`.
- `film` and `loop` play as fast as the machine can and may drop below the film's frame rate. They are for looking, not for recording.
- `live` with `bot=<name>` lets a bot drive, so a run can be watched.
- In `live`, a menu on the `M` key switches quality, step and diagnostic. It is for Brandon and is hidden from the tab order.

## Hashes and records

- The engine hash covers `src/` outside the page folders, `config/`, `content/` and the package lock file.
- Every page has a hash over its folders, as the table under "Folders" gives them, and its files in `public/assets/` and `assets-full/`.
- Every harness output has a record beside it: the engine hash, the hashes of the pages it shows, the format, the tier, the asset set, the diagnostic, the browser version and the machine.
- A command reuses an existing output only when its record matches the current state. Otherwise it renders again.
- Commits that touch only logs, scorecards, sound or kit files change no hash.

## The harness

Scripts in `tools/`, run through npm.

| Command | Output |
| --- | --- |
| `npm run build` | The static site in `dist/`, from `src/`, `content/` and `public/` only |
| `npm run caps` | The WebGL2 limits and extensions of this machine, written to `config/webgl-caps.json` |
| `npm run budget` | Seconds per sample and per picture at each format and tier on the current scene, the time of one simulated second, and the time the films and the loop would take |
| `npm run clock` | The clock. See below |
| `npm run animatic` | The rough cut: `out/roughcut.mp4`. See below |
| `npm run simcache` | The simulation's checkpoints along the film, under `out/work/` |
| `npm run take` | Searches for the pinball take and writes `cut/TABLE-TAKE.json`, as `kit/03-METHOD.md` section 10 says. Resumable. `--check` replays the kept take and prints when each pinball beat's event fell, and whether that is inside its beat give or take `film.beatToleranceSeconds` |
| `npm run paths` | The ball path test of `kit/03-METHOD.md` section 10. Runs the physics without the director and without rendering, reads the machine's layout and drops seeded balls on every tier. Prints every opening under `table.minClearanceBalls`, every rail with no entry or exit, every way into the Retirement box, and every ball that came to rest outside a hold, stuck in an opening or left the machine anywhere but the drain. Measure M10 reads it |
| `npm run bots` | Every bot in `live.bots`, `live.botSeeds` times each, through the whole live site without rendering. Prints for each run whether it finished, how long each step took, every beat's gag it reached, the longest time the pointer was ignored outside the pinball scene and the longest time the flippers were ignored inside it. `--watch` renders one run as a sheet |
| `npm run still -- --page P --beat B --at X --camera C --tier R --format F --assets A --diag V` | One still in `out/work/stills/`. `--key ID` and `--id ID` render a key or a judged still by name. `--sheet ID` renders the build's version of an approved sheet. `--interface` captures it with the controls on. `--live LEVEL` draws it through the live site's path |
| `npm run crops -- --key ID` | Grids of native-size crops, each with a long edge of at most `critics.maxImageLongEdgePx`: the cursor, every kind of control in the still, the smallest type, a contact shadow, a glass edge, and whatever the key is about |
| `npm run compare -- --key ID` | A comparison image `compare-<key>.jpg`: the approved image beside the key's still at the same size, and under them matching native-size crops. `--sheet ID` does the same for a sheet |
| `npm run measure -- --unit ID` | Every measure for that unit, as `kit/07-QUALITY-BAR.md` defines them |
| `npm run sheet -- --beat ID --tier T` | A contact sheet of `critics.contactSheetFrames` frames across a beat. `--unit ID` gives sheets across a page. `--film` gives sheets across the whole film. `--loop` gives one across the card loop. `--opening` gives one across film A's opening. `--pages` puts the six pages at rest on one sheet. `--motion NAME` gives consecutive frames of a named moment: a hit, a page turn, the reassembly, a bumper hit. `--live` draws a sheet through the live site's path with a bot driving |
| `npm run seq -- --first N --last M --tier T` | Every film frame from N to M as separate pictures |
| `npm run sound -- --cue ID --file F` | Measures a take the Builder got from the sound tool and files it. `--line BEAT:N` does the same for a narrator line. `--keep` runs the chain in `kit/03-METHOD.md` section 12 and writes the kept take with its record. `--pack` builds what the site ships. `--sheet` draws the kept sounds as waveforms on one picture |
| `npm run cut` | `cut/CUTLIST.json` and `cut/CUES.md` from `film.units`, `film.beats`, the kept lines and the events of the film |
| `npm run mix` | The review mix laid on the cut list. `--final` makes the final mixes for film B and for film A |
| `npm run film -- --which b --tier T --format F` | A film as `out/work/film-<which>-F-T.mp4`, with its sound if there is any. Takes `--first` and `--last`. `--unit ID` renders one page's chunk. `--join` joins the chunks that exist. `--from-hd` makes the `formats.preview` copy by scaling down a `formats.hd` film of the same build. `--review` makes the review cut |
| `npm run loop -- --tier T --format F` | The card loop, its web copy and the card still under `out/work/loop/`. Takes `--first` and `--last` to render a range, and `--join` to join the ranges that exist, so the loop can be split across sandbox agents |
| `npm run stress` | For four moments, a page at rest, step 1 under fire, the office tier in "Reply All" and the boss fight, half a second of film at `formats.hd`, encoded at `export.bitrateMbps` and again at `quality.compressionStressMbps`, with stills from both |
| `npm run pack -- --phase N --round R --unit ID` | The critic packs for a round |
| `npm run look -- --add FILE --caption TEXT --by NAME` | Adds a picture to the look log |
| `npm run status -- --phase N --unit ID` | The status pictures and the gallery |
| `npm run keep` | Copies into `out/stills/` the judged stills, comparison images and sheets of the unit or phase just finished, each with its record. `--film` also copies the newest preview films into `out/`. `--deliver` copies the loop, its web copy and the card still to `deliver/` |
| `npm run review` | Builds the review page |
| `npm run hostcheck` | Builds from a clean copy and reports the size of `dist/`, the largest file, what loads before the first complete picture, and the build time. See "Hosting" |
| `npm run determinism` | Renders the same pictures on fresh page loads and in a different order, and compares them |
| `npm run gate -- --phase N` | The machine checks, and the deliverable checks that phase names, with a pass or fail line for each |
| `npm run render:local` | The local render. See below |

Rules:

- The browser runs headless with software WebGL in this workspace.
- Stills kept in `out/stills/` are stored compressed at high quality, so the repo stays small.
- Judged stills, comparison images, the loop and the films are rendered with the `full` asset set. If it cannot be loaded under software rendering, log it, render with the largest sizes that load, and say so in the record.
- Any command that can exceed `sandbox.chunkBudgetMinutes` does its work in chunks and can be run again to continue.
- At most `sandbox.maxRenderProcesses` render processes run at once in one VM. Sandbox agents in their own VMs render ranges in parallel.
- Every harness output is written under `out/work/`, which git ignores.

### Films, chunks and disk

- A film is rendered one page at a time. Each chunk is encoded with the film's final settings and a closed group of pictures, so chunks join without being encoded again. The sound is added when the chunks are joined.
- In this workspace films are rendered at `film.previewFps`: every frame whose index is a multiple of `film.fps` divided by `film.previewFps`.
- Encoding: `export.videoCodec` in an `export.container` file, at `export.bitrateMbps` in `formats.hd` and at `previewFilm.bitrateMbps` in `formats.preview`. Sound is encoded as `export.audioCodec` at `export.audioKbps`.
- Film A is its opening's chunk joined in front of film B's chunks. Film B is never rendered twice for it.
- The card loop's frames are indexed at `film.fps`, like a film's. In this workspace it is rendered at `deliver.cardLoop.fps`: every frame whose index is a multiple of `film.fps` divided by that rate. The frame one past the last is then still frame 0.
- Frames are deleted as soon as their chunk is encoded. No command ever holds more than `sandbox.maxFramesOnDisk` frames on disk.
- Every render command checks free disk first. Under `sandbox.minFreeDiskGb` it deletes old output under `out/work/` and checks again before it refuses to start.
- A sandbox agent returns its chunks to the Builder as attachments. If attachments cannot carry video, the agent pushes its chunks, with their records, to its own branch under `out/chunks/`. The Builder fetches that branch and copies the chunks out without merging it. If neither works, the Builder renders the range itself.
- Every running long job is written under "Running jobs" in `kit/PROGRESS.md` when it starts: the command, the range, the log file, the VM and the time the render budget says it should take. It is removed when the job is done.

### The clock

`npm run clock` keeps `kit/CLOCK.json`. It is the first harness command built, and it is committed with every status.

- `npm run clock -- --start` marks the start of a task. It adds no time, and the next tick counts from it. A tick made on a different machine boot from the last one is treated the same way, so a forgotten `--start` cannot count the time between two tasks.
- `npm run clock -- --phase N` is a tick. It adds the whole time since the previous tick or start to phase N.
- `npm run clock -- --review-round N` ticks review round N. The first tick of a round opens it with `budget.reviewRoundHours`. Its time is kept apart from both allowances. It prints the time used in the round out of the time allowed, and `extra rounds: yes` or `no`, which is no once those hours are used. It never prints `budget report: due`.
- `npm run clock -- --review` records that the review was approved. From then on the allowance in force is `budget.afterReviewHours`, counted from zero, and Phase 6 has all of it as its box. A second call changes nothing.
- `npm run clock -- --continue N` records continuation N, where N is "Continuations" in `kit/PROGRESS.md` plus one. The Builder writes the new count back. Before the review it gives each of Phases 0 to 5 that is not `done` a new box: `budget.continueHours` split in proportion to those phases' boxes in `budget.phaseHours`. After the review it gives Phase 6 all of `budget.continueHours`. From then on the lines below are measured from the start of the continuation against the new boxes, with one exception: a phase that had already printed `half point: reached` or `box end: reached` keeps printing it. A continuation never reopens polishing before a first round, and never reopens the planned method for a part that went to its fallback.
- `npm run clock -- --extension N` ticks an extension after completion. Its time is kept apart from the build's. It prints the time used in the extension out of `budget.extendHours`, and `extra rounds: yes` or `no`, which is no once those hours are used. It never prints `budget report: due`.
- A tick with `--phase N` prints, in plain words:
  - Time used in this phase and under the allowance in force, and the time allowed.
  - `extra rounds: yes` or `no`. It is no once the time used under the allowance has reached the sum of the boxes up to and including this phase. In Phases 5 and 6 it is also no once the time left before the budget report is under `budget.reserveHours` for that phase.
  - `half point: reached` once this phase has itself used half of its own box.
  - `box end: reached` once this phase has itself used all of its own box.
  - In Phases 5 and 6 those two lines are counted against the phase's box less `budget.reserveHours` for that phase, so `box end: reached` is always printed before `budget report: due`.
  - `budget report: due` once the time used has reached the time allowed.
  - Minutes since the last status, and `status overdue` once that passes `budget.statusMaxGapMinutes`.
- The Builder reads those lines and follows the clock rules in `AGENTS.md`. The script decides nothing by itself.

### Looks and status

- A look is any picture someone rendered in order to look at it. `still`, `crops`, `compare`, `sheet` and `seq` each append a line to `out/work/looks/index.jsonl`: the file, a short caption, the time and who made it. A pipeline script that renders a preview adds it with `npm run look`.
- A build or render agent pushes its newest looks to its looks branch, `agent/<folder>-looks`, with every heartbeat. That branch is fetched and never merged. A short-lived agent attaches its looks to its report. The Builder adds both to the log with `npm run look`.
- A long render job writes a look at least every `budget.statusMaxGapMinutes`, so a status has something new to show while the job runs.
- `npm run status -- --phase N --unit ID` does this:
  1. Runs a clock tick for phase N. With `--review-round N` or `--extension N` in place of `--phase N` it ticks that instead.
  2. Chooses up to `status.maxPictures` pictures. First, for the unit in hand, one of its keys beside its approved image, reusing a still whose record matches the current build and otherwise rendering one at the `review` tier. Then the newest looks not already shown, the Builder's and the ones fetched from agent branches. With no `--unit` it uses the sheet of the six pages and the newest sheets. With `--sounds` the first picture is the waveform sheet of the kept sounds.
  - It never waits for the render slot. If a render job is running in this VM it renders nothing and uses the newest frames that job has written and the newest looks.
  - It never comes back empty. If nothing has been rendered yet, it uses `references/approved/contact-sheet.jpg`.
  3. Resizes each to at most `status.pictureLongEdgePx` on the long edge.
  4. Writes them to `out/stills/status/`, replacing the last set, with `STATUS.md` holding the captions and the time.
  5. Writes whatever file the inline display method from Phase 0 needs under `out/work/status/`.
  6. Prints the lines of the status message, including the time used out of the time allowed.
  - With `--no-render` it renders nothing and uses only pictures that already exist. With `--no-tick` it does not tick the clock. The pictures above a `REVIEW` block use both. The pictures above a `BUDGET REPORT` block use `--no-render`.
- The Builder then shows the gallery in the thread and posts the lines, as "Showing the work" in `AGENTS.md` says.

## The rough cut

`npm run animatic` exists so Brandon can judge the film's order and pace before anything is built.

- It needs no 3D. It is made from the approved images with `ffmpeg` or a small script.
- It follows `film.units` and `film.beats`, frame for frame at `film.previewFps`, in `formats.preview`.
- Each beat shows the approved image nearest to it, with a slow push toward where that beat's gag happens. A beat with no image of its own holds the image of the beat before it. A page turn is a quick dip between two images. The pinball beats use the images of the keys of unit `pinball`, each on the beat its key names.
- A small label in one corner names the beat. This is the only place a label appears over a picture, and only in the rough cut.
- It is silent.

## The local render

The masters are not made here. Brandon's computer has a real graphics card, and a film that is computed frame by frame does not care how fast the machine is. `npm run render:local` is the tool for it. It is run on his computer after the build, from a fresh clone, by an agent working for him.

- It needs Node, an installed Chrome and `ffmpeg`. It uses the installed Chrome with its graphics card on, in a visible window, and never downloads a browser.
- `npm run render:local -- --what film-b --test` first renders one judged still and writes it beside the kept still of the same key with their PSNR, so a machine that draws the scene differently is seen before a long render. It then runs `npm run take -- --check` on this machine. If a pinball beat's event falls outside its beat here by more than `film.beatToleranceSeconds`, it searches for a take on this machine and uses that one for the render, without changing the committed file. Then it renders the first `export.local.testSeconds` seconds, assembles them with sound, opens the result and stops.
- `npm run render:local -- --what film-b --go` renders the whole film: every frame at `film.fps` in `formats.master`, at the `final` tier with the `full` asset set, through `capture` mode. Frames are written and assembled in chunks, so a run that is interrupted carries on where it stopped. The chunks are joined with the final mix into an `export.local.container` file with `export.local.videoCodec`, named from `export.files`.
- `--what film-a` renders the opening and joins it in front of film B's chunks, reusing them if they exist. `--what loop` renders the card loop at `film.fps` and writes the card still from its frame 0.
- If `audio/final/` holds no mix, it renders silent and says so in its last line.
- It checks before it starts that the frame count equals the film's length times `film.fps`, and after it ends that the file holds that many frames.
- `npm run render:local -- --proof` is the proof made in this workspace: the same code path with software graphics, in `formats.preview` at the `draft` tier, for `export.proofSeconds` seconds of film B across a hit in step 1 and the same of film A's opening, with `ffprobe` on both results.
- No master is rendered in this workspace unless `deliver.sandboxMaster` is true.
- `README.md` gives the exact commands, written for someone opening the repo for the first time on a Mac.

What is rendered here are the preview films: film B and film A in `formats.hd` at `film.previewFps`, with the final mix, at the highest tier whose wall-clock time fits `sandbox.previewFilmMaxHours` with the pages split across sandbox agents, and never below `draft`. A film in `formats.hd` is too large to commit. It goes on the review page and is attached to the final message. `out/` holds its copy in `formats.preview`, named from `export.files`, and that copy is what is committed.

## The probe

`?mode=probe` measures what this workspace cannot: frame rate on a real graphics card.

- It runs each level of `live.quality` for `perf.probeSeconds` on each of four scenes, with a bot driving: the careers page, step 1 under fire, the office tier in "Reply All", and the boss fight.
- It shows, for each level and scene: median frames per second and the slowest one percent. Then the graphics card's name as the browser reports it, the screen size and the level the site would pick.
- It ends with one block of plain text and a Copy button, so Brandon can paste the numbers into the thread.

## Hosting

Two places host this, for two purposes.

- This workspace's app hosting, while the build runs: publish `dist/` with the review page so Brandon can open every link from the thread. Use `slug` for the address and `name` for the site's name.
- Brandon's own hosting, named in `host.name`, after the build: the public portfolio piece. The repo must deploy there as it stands, and the address must open the careers page in `live` mode.

For the second:

- `npm run build` on a clean clone, with nothing installed but the repo's packages, produces the whole site in `dist/`. No Blender, no Python, no browser download, no network call except the package registry.
- The site is static, with relative URLs, and works from any host at any base path. No server code, no environment variables, no runtime network calls except its own files.
- `dist/` holds the web asset set and `public/audio/` only. `assets-full/`, `audio/`, `references/`, `out/`, `pipeline/` and `scorecards/` are never copied into it.
- `vercel.json` at the root names the build command and the output folder, and sets long cache lifetimes for hashed files. `.vercelignore` lists the folders above.
- Limits, from `host`: `dist/` is at most `maxShippedMb` in all, no file is over `maxFileMb`, everything fetched before the first complete picture of the careers page is at most `firstLoadMaxMb`, and a clean build takes at most `maxBuildMinutes`. `npm run hostcheck` measures all four. Check G16 reads its result.
- The asset sizes in `assetSets.web` are the starting point for fitting those limits. If the web set does not fit, lower its texture sizes for the largest parts first, and log it. Type is never one of them.
- In Phase 0, read the hosting provider's current limits page and record what its static file limit counts. When this kit was written its free plan listed a limit of 100 MB on static file uploads. If what you find changes what `host.maxShippedMb` should be, log it as a note for Brandon. Do not change the key.
- Which extensions are portable cannot be measured here, where only one browser runs. In Phase 0 a supporting agent reads a public table of WebGL extension support by browser, records its address and the date, and an extension is marked `portable` in `config/webgl-caps.json` only if that table shows it in current Chrome, Safari, Firefox and Edge on a computer. Every extension that is not portable is used only behind a test, with a path that works without it.
- The site runs in current Chrome, Safari, Firefox and Edge on a computer. If a second browser engine can be driven in this workspace, load the site in it and keep a still. If not, log that it was not possible.
- A touch-only device gets the message page. Detect it by what the device reports about its pointer and hover, not by the width of the window.

### The review page

Brandon reviews on a tablet and plays the site on his Mac. He needs one link where everything plays.

- `npm run review` writes `dist/review.html` and copies into `dist/review/` whatever exists of: the pictures in `out/stills/status/`, `out/roughcut.mp4`, the review cut, the preview films, the newest `formats.hd` films under `out/work/` if there are any, the card loop and card still, every comparison image and sheet in `out/stills/`, the review mix, and every kept sound.
- The page has seven parts, in this order: Latest (the newest status pictures with their captions and the time), Open it (links to the site, to each step by its own link, to film mode, to the loop and to the probe), Sound board, Films, The card, Comparisons, Motion.
- The sound board holds, first, the review cut as a video with sound. Then the narrator: every line with a player, its beat, its words as written and its length, in film order, and the live-only lines after them. Then every cue with a player, its name, its length and the line that describes it, with each variant playable.
- Motion holds the sheets of the gags, the cursor's acting and the pinball scene.
- Each video plays in the page and each image is shown at full width. The page carries the date, the current phase and the time used from `kit/PROGRESS.md`.
- It is plain HTML with no framework. It is not part of the site, not part of any hash, and never part of a build for `host.name`.
- Run it before every publish here.
- If this workspace's hosting does not accept the size, leave out the largest videos and say so on the page.

## Tests

- Config and content validation, including every failure case above.
- Seeded random: same seed, same stream, same values.
- The layout tree of every page: no two boxes overlap unless one contains the other, boxes in a column share an edge, gaps in a group are equal, and every box lies inside the page.
- The keyboard layout: five rows, with Backspace, Tab, Caps Lock, Enter, a Shift at each end of its row, a space bar, "@" and ".", every letter and every digit, each once.
- The stage: the same start and the same driver input give the same state at step N whether the steps were run one at a time or in groups.
- Every gag: fed a pointer that never moves, and fed a pointer that does everything wrong, it still reaches its end, and it hands control back inside `live.controlTakenMaxSeconds`, except in the pinball scene, where the flippers are the visitor's control.
- The cursor: its world scale never changes, damage heals inside `cursor.damageHealSeconds`, and arms cannot be made outside `cursor.armsOnlyInBeat`.
- The director: with flipper input from the seeded random stream, every beat of the machine still starts in order, the ball only ever goes down a tier once that tier's beats are done, and the scene ends.
- The machine's layout: every rail's entry and exit names something that exists, every opening clears `table.minClearanceBalls`, and nothing leads into the Retirement box.
- Film: the pages fill the film with no gap or overlap, the beats fill each page, and the judged frame list follows its rule.
- The loop: every period divides the loop length, and the state one loop later equals the state at the start.
- The clock: `--start` adds nothing, a tick on a new machine boot adds nothing, every other gap is counted in full, `--review` starts the second allowance and a second `--review` changes nothing, a review round's time touches neither allowance, the reserve switches `extra rounds` at the right moment, `--continue` gives the unfinished phases new boxes, and each printed line switches at the right moment.
- Sampler: sequences are deterministic and cover the pixel, the light, the shutter and the lens.
- The mix: the same inputs give the same bytes.
