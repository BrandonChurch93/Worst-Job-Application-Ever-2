# Unit video: notes

Branch `agent/b-video`, from `origin/main` at `dc3296b8f518165ed8691d04c0b76aaf1b4750ab`. Owner of this file: the video helper.
Every number below is MEASURED on this machine (4 cores, 7957 MB, no graphics card, the headless browser draws in software) unless it says STATED or UNKNOWN.

## What is built

- `tools/pinball-video.mjs` (with `tools/lib/pinball-video-scene.mjs`, `-encode.mjs`, `-control.mjs`): runs the scene in node to find the joins, renders the film's own frames between them through `renderFilmFrame`, encodes them, measures the files against the frames, and writes `src/pages/step3/video/`: `pinball.mp4`, `pinball.webm`, `manifest.json` (joins, hashes, events, files, how it was rendered) and `states.json` (the state of the page and of the arrow at both joins).
- `src/pages/step3/video/plan.ts`: the rule of the joins and the named numbers. `phase.ts`: what the page does while the video plays (pure, no clock of its own in a browser, the step clock in node). `bridge.ts`: the one object the page and the player share. `player.ts`: the `<video>` element of the live site.
- `src/pages/step3/index.ts`: 6 small edits (the import, `prepare`, `control`, the head of `step`, `save` and `load`, `skip`, `gag`) and one helper `rideOut` cut out of `skip`.
- `tests/b-video.test.ts`: 12 tests.
- `pipeline/change002/video-join.mjs`: the measurements of the joins in the browser. `pipeline/change002/video-line.mjs`: the slow line.

## Decisions

1. V1, the joins come from the events of the scene, not from seconds. Join in: the last film frame at least 0.04 s before `tube-run` (`VIDEO.inLead`). Join out: the first film frame at least 0.19 s after `peel-up` (`VIDEO.outLag`). On `main` today that is frame 195 (3.250 s) and frame 2371 (39.517 s): 2177 frames, 36.283 s. The tool refuses to render when the film's script is already walking the arrow at the join out.
2. V2, the join in does not depend on the visitor because the page loads the film's own state there. The manifest carries the state of the page and of the arrow at the join in, saved from the film stage. When the live scene reaches the film second of the join (after `ball-seal`, when the arrow is shut in the ball in the cup) the page loads that state, so the last live picture is the film's state drawn by the live renderer. The player then lets at least 2 display frames of that picture pass before it shows the video, whose first frame is the same film frame.
3. V3, the join out the same way round: 0.3 s before the end of the video (`VIDEO.underlay`) the page loads the film's state of the join out under the video and holds it; when the video's clock reaches its end the page hides the video inside that very step of the stage, lets its own clock run again, and releases the arrow from the film's place with the stage's own eased hand-back (`CursorBody.release`, 0.35 s).
4. V4, the manifest is the proof against a stale video. It holds `stage.hash()` of the film at both joins. `tests/b-video.test.ts` runs the film in node and fails when the joins, the hashes, the two states or the events between them are not those of the scene as built. So after the pinball unit's scene lands, the suite is red until `node tools/pinball-video.mjs` has been run again. That is meant.
5. V5, sound (ruled by the Builder at 21:39 UTC): the file is silent. The page relays the film's events between the joins (from the manifest) through `emit`, each when the video's own clock (`video.currentTime`) has passed it, so the site's sound engine plays the scene's cues in time with the picture. It obeys the sound control and its level because it is the same engine; nothing doubles because the file has no track; a silent video may play without a press, and the engine itself was unlocked by the visitor's first press long before step 3. A step of the video's clock larger than 0.25 s (`VIDEO.jumpMax`: a tab that slept) passes its cues over without sounding them. The player pauses the video when the tab is hidden and plays it when it is shown again. `--sound <wav>` in the tool muxes a track for the day the Builder wants it baked.
6. V6, control (ruled by the Builder): while the video plays the page reports `control: 'film'`. The stage counts those seconds apart (`longestIgnored.film`, `ignoredFilm` in a bot's run). `tools/lib/pinball-video-control.mjs` is the one place that leaves them out of `live.controlTakenMaxSeconds`; `tools/bots.mjs` and `tools/gate.mjs` call it and print the seconds.
7. V7, never a dead screen. No video ready at the join: the page holds the picture of the shut ball in the cup for at most 4 s (`VIDEO.waitMax`), then plays its own short ending (the ball rides the drain rail to the outlet, as the skip link has always done from there): 2 s later the ball opens. A video whose clock stands still for 3 s (`VIDEO.stallMax`) is left for the join out. A browser that can play neither file, a failed fetch: the same 4 s and the page's own ending.
8. V8, the page keeps its picture still under the video (it loads the arrow's film state again every step), so the live renderer stops drawing after its 64 frames of rest and costs nothing for the rest of the video.
9. V9, in node (bots, tests, `clock=steps`) there is no player: the video phase lasts exactly the video's length on the step clock and relays the same events, so every run stays deterministic.
10. V10, the stand-in. Rendered at tier draft: the first 3 and the last 3 frames at 1920 by 1080 as the real file will be, the frames between at 960 by 540 enlarged, one frame in 24 held (2.5 pictures a second). It is good for the joins, the player, the preload and the sound; it is not good for judging the scene, the file size or the bitrate of the real file.

## Events

- New, emitted by the page: `video-in` (the join in), `video-out` (the join out).
- Relayed during the video with their film names: every event of the scene between the joins (today: tube-run, lights-down, power-on, plunger, sling, carpet-roll, spinner, doors-slam, tier-fall, flasher, drop-target, bumper, flipper, inbox-take, ball-drop, firehouse-take, scoop-kick, ramp-roll, spiral, flipper-save, drain, ball-open, flatten, peel-up). Whatever the pinball unit adds (`strike:*`, `loot`, `frenzy-on`) is relayed too once the video is rendered from its scene.

## Sounds and words

None asked.

## NEEDS

`pipeline/change002/video-NEEDS.patch` (applied on this branch as commit `b38a905c`, subject `NEEDS:`): `src/stage/types.ts`, `src/stage/stage.ts`, `src/stage/bots.ts`. `PageLogic.control` may be `'film'`; the stage counts such steps as ignored under their own key and starts a new count when the kind changes, so the film's seconds never run into the pointer's; `longestIgnored.film` and `BotRun.ignoredFilm`. No hash of a stage changes.

Lines touched in the two tool files, for the one exception of item 8: `tools/bots.mjs` the import and the 4 lines after `STUCK`/`finished` is printed (`controlTaken(r)`); `tools/gate.mjs` the import and the 3 lines `pointer`, `flippers`, `film` in the bots check with the end of its note.
