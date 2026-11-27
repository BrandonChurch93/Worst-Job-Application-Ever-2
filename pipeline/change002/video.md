# Unit video: notes

Branch `agent/b-video`, from `origin/main` at `dc3296b8f518165ed8691d04c0b76aaf1b4750ab`. Owner of this file: the video helper.
Every number below is MEASURED on this machine (4 cores, 7957 MB, no graphics card, the headless browser draws in software, Chromium 159.0.8154.6, ffmpeg 8.0.1) unless it says STATED or UNKNOWN. The command that gave a number stands beside it.

## What is built

- `tools/pinball-video.mjs` (with `tools/lib/pinball-video-scene.mjs`, `-encode.mjs`, `-control.mjs`): runs the scene in node to find the joins, renders the film's own frames between them through `renderFilmFrame`, encodes them, measures the file against the frames, and writes `src/pages/step3/video/`: the pieces `pinball.mp4.N.part`, `manifest.json` (joins, hashes, events, files and their pieces, how it was rendered), `.gitignore` (a stand-in's pieces stay out of git) and `states.json` (the state of the page and of the arrow at both joins).
- `src/pages/step3/video/plan.ts`: the rule of the joins and the named numbers. `phase.ts`: what the page does while the video plays (no clock of its own in a browser, the step clock in node). `bridge.ts`: the one object the page and the player share. `player.ts`: the `<video>` element of the live site.
- `src/pages/step3/index.ts`: small edits (the imports, `prepare`, `control`, the head of `step`, `save` and `load`, `skip`, `gag`) and one helper `rideOut` cut out of `skip`.
- `tests/b-video.test.ts`: 16 tests.
- `pipeline/change002/video-join.mjs` (the joins in the browser), `video-line.mjs` (the preload and the slow line), `video-skip.mjs` (real presses on the skip link), `video-cores.mjs` (the renderer's time for a frame with one and with several renderers), `video-tiers.mjs` and `video-compare.mjs` (the film's frame of the join in at each tier, and two pictures compared), `video-strip.mjs` (pictures in a row for a report).

## Decisions

1. V1, the joins come from the events of the scene, never from seconds. Join in: the last film frame at least 0.04 s before `tube-run` (`VIDEO.inLead`). Join out: the last film frame that is over before the result card begins to rise, 0.2 s after `peel-up` (`VIDEO.outLag`). A film frame gathers light over its whole sixtieth: the frame after that one showed a half transparent card. On `main` today: frame 195 (3.250 s) to frame 2370 (39.500 s), 2176 frames, 36.267 s. The tool refuses to render when the film's script is already walking the arrow at the join out.
2. V2, the join in does not depend on the visitor because the page loads the film's own state there. The manifest carries the state of the page and of the arrow at the join in, saved from the film stage. When the live scene reaches the film second of the join (after `ball-seal`, the arrow shut in the ball in the cup) the page loads that state, so the last live picture is the film's state drawn by the live renderer. What the load changes in the picture is measured (row "load" below): the arrow inside the glass ball turns to the film's heading, 0.08 % of the pixels.
3. V3, the video is faded in and out, 0.2 s each (`VIDEO.fade`), while it stands still on its first and on its last frame over the page's own picture of that same frame. Why: the two pictures are the same state but not the same pixels (the film frame is made of many samples, the live frame of one; numbers below), and a cut between them showed as a flick on the edges and on the text. A fade between two pictures of one state shows no motion and no flick.
4. V4, the join out: 0.3 s before the end of the video (`VIDEO.underlay`) the page loads the film's state of the join out under the video and holds it; when the video's clock reaches its end the video is faded out; when it is gone the page lets its own clock run again and releases the arrow from the film's place with the stage's own eased hand-back (`CursorBody.release`).
5. V5, the manifest is the proof against a stale video. It holds `stage.hash()` of the film at both joins. `tests/b-video.test.ts` runs the film in node and fails when the joins, the hashes, the two states or the events between them are not those of the scene as built. So after the pinball unit's scene lands, the suite is red until `node tools/pinball-video.mjs` has been run again. That is meant.
6. V6, sound (ruled by the Builder): the file is silent. The page relays the film's events between the joins (from the manifest) through `emit`, each when the video's own clock (`video.currentTime`) has passed it, so the site's sound engine plays the scene's cues in time with the picture. It obeys the sound control and its level because it is the same engine; nothing doubles because the file has no track; a silent video may play without a press, and the engine itself was unlocked by the visitor's first press long before step 3. A cue older than 0.25 s when the page looks (`VIDEO.jumpMax`: a seek or a tab that slept) is passed over without sounding. The player pauses the video when the tab is hidden and plays it again when it is shown. `--sound <wav>` is kept in the tool for a file with its own track.
7. V7, control (ruled by the Builder): while the video and its two fades are on the screen the page reports `control: 'film'`. The stage counts those seconds apart (`longestIgnored.film`, `ignoredFilm` in a bot's run). `tools/lib/pinball-video-control.mjs` is the one place that leaves them out of `live.controlTakenMaxSeconds`; `tools/bots.mjs` and `tools/gate.mjs` call it and print the seconds. The way out is the skip link: it stays over the video and takes the visitor to the join out at once.
8. V8, never a dead screen, and never a visit without the table. No video ready at the join: the page holds the picture of the shut ball for at most 1 s (`VIDEO.waitMax`), then plays the table itself exactly as it did before there was a video (flippers, saves, everything). The same at once, with no wait, where no file can be played or with `?video=off`. A video whose clock stands still for 3 s (`VIDEO.stallMax`) is left for the join out. This changed from the first plan (4 s, then the page's short ending): the short ending cut the whole gag for every visitor on a slow line, and the table as it was is the better thing to fall back to. One line of `phase.ts` decides it.
9. V9, so the playable table is not gone from the site: it is what a visitor gets when the video cannot be had. Its code and its tests stay.
10. V10, the page keeps its picture still under the video (it loads the arrow's film state again every step), and while the page reports `'film'` the live loop draws one frame and stops (NEEDS `e941b2ad`), so the live renderer costs nothing while the video plays.
11. V11, in node (bots, tests, `clock=steps`) there is no player: the video phase lasts exactly the video's length on the step clock and relays the same events, so every run stays deterministic and the bots take the visitor's usual path.
12. V12, one file serves every browser: H.264 High in MP4, 4:2:0, 8 bit, BT.709 limited range tagged, `faststart`. Chrome, Edge, Safari and Firefox play it (STATED for the last three; MEASURED in Chromium 159: `canPlayType` says `probably`). A browser that cannot gets the table. `--codec h264,vp9` writes a WebM too and the player picks by `canPlayType`; not used, it would double the published size.
13. V13, the whole file is fetched from the moment the visitor arrives on step 1 (`prepare()` of step 3 runs through `app.loadLater()`, which `src/main.ts` calls once the first page is left; STATED from `src/app.ts` and `src/main.ts`, so the site's first load does not carry it), and handed to the element only when it is all there. So the video can never stall in the middle for the line, and "ready" is one fact: all bytes here, first frame decoded. The price: a line too slow to bring the whole file before the join gets the table.
14. V14, the stand-in. Rendered at tier draft: the first 3 and the last 3 frames at 1920 by 1080 as the real file will be, the frames between at 960 by 540 enlarged, one frame in 24 held (2.5 pictures a second). It serves for the joins, the player, the preload and the sound; it says nothing of the scene, the file size or the bitrate of the real file.
15. V15, the file is shipped in pieces. The host takes 20 MB a file (`config/showcase.json` `host.maxFileMb`) and the stand-in is 32 MB; the real file will be larger. The tool writes the whole file to `out/work/pinball-video/` and cuts it into pieces of at most 16 MB (0.8 of the limit, `PART_SHARE` in the tool) named `pinball.mp4.0.part` onward in `src/pages/step3/video/`; the manifest lists them; the player fetches them together and joins the bytes into one blob. No piece is a video by itself and nothing is encoded twice.
16. V16, the live site ships the stand-in now, marked as one (`render.standIn: true` in the manifest, and here), until the film's final render (the Builder's ruling of 23:43Z). Its pieces are not committed (the same ruling): only the code, the manifest, the states, the tests and these notes are. So the pieces must be made before the site is built for publishing, by the line under "The tool and the stand-in" (about 17 minutes on this machine: 96 small frames 9.6 min, 6 frames at tier final about 4 min, the encoding about 2.5 min), or copied into `src/pages/step3/video/` from where they were made. A build without them is a site that plays the table (V8), not a broken one. The real pieces are committed once, when the film's final frames exist, and the tool then empties the folder's `.gitignore` itself.
17. V17, frames are rendered once. `node tools/pinball-video.mjs --frames <folder> [--first N] [--rate 30] --tier final` renders nothing: it takes the film's own numbered frames (`000000.png` onward, as `tools/lib/film-render.mjs` writes them) and encodes, cuts, measures and writes the manifest from them. By default the join in is looked for at its own frame number (the folder holds the unit from its first frame) or at 0 (the folder holds exactly the span). Frames smaller than 1920 by 1080 are enlarged and frames at a lower rate are held, and the manifest then says `standIn: true`: the film's preview (960 by 540, 30 a second) can stand in, it cannot be the real file without a visual compromise.

## Events

- New, emitted by the page: `video-in` (the join in), `video-out` (the join out).
- Relayed during the video with their film names: every event of the scene between the joins (today 60 events: tube-run, lights-down, power-on, plunger, sling, carpet-roll, spinner, doors-slam, tier-fall, flasher, drop-target, bumper, flipper, inbox-take, ball-drop, firehouse-take, scoop-kick, ramp-roll, spiral, flipper-save, drain, ball-open, flatten, peel-up). Whatever the pinball unit adds is relayed too once the video is rendered from its scene.

## Sounds and words

None asked. No string is typed in code.

## NEEDS

`pipeline/change002/video-NEEDS.patch` (`git diff origin/main HEAD -- src/stage src/main.ts`; since the merge of `origin/main` at `dc4989f8` it applies on that commit, not on `dc3296b8`), applied on this branch as five commits whose subjects start `NEEDS:`. Accepted in principle by the Builder (22:57Z).

- `b38a905c`: `src/stage/types.ts`, `src/stage/stage.ts`, `src/stage/bots.ts`. `PageLogic.control` may be `'film'`; the stage counts such steps under their own key and starts a new count when the kind changes, so the film's seconds never run into the pointer's; `longestIgnored.film` and `BotRun.ignoredFilm`.
- `d29be32d`: `src/main.ts`, one line. A visitor who watches the film is not idle: without it the idle line of the narrator was said 12 s into the video.
- `9180dcb6`: `src/stage/stage.ts`, one line. The stage saves the film count only once a film span was counted, so the saved states of the film are byte for byte what they were (`tests/harness-simcache.test.ts` and `tests/polish-lamps.test.ts` were red without it).
- `db68cd5a`: `src/main.ts`, one line (`backing`). The row of controls stands on its dark capsule while the film plays; without it the skip link was white on the video's light table.
- `e941b2ad`: `src/stage/stage.ts`, one line (`skipOffered`): the skip link is offered on every step whose page reports `control: 'film'`, not only after `live.skipLinkAfterSeconds` (owner, change note 003 update 5: "with the skip link offered throughout"). And `src/main.ts`, one line (`draw`): while the page reports `'film'` the live loop draws one frame after a change and does not go on refining its rest picture (63 more frames, each 0.2 s to seconds on a machine without a graphics card, during which the page could not look at the video's clock).

Lines touched in the two tool files, for the one exception of item 8: `tools/bots.mjs` line 6 (the import) and lines 28 to 31 (`controlTaken(r)`, the printed seconds, the two limits); `tools/gate.mjs` line 17 (the import) and lines 593 to 596 (`pointer`, `flippers`, `film` in the bots check and the end of its note).

## Tests of the live step 3 that the replacement made untrue

Run: whole `npm test` after the page took the video's path, 27 tests red in 11 files. Two files were a fault of mine (the NEEDS line above). The other nine pin the playable table in a live visit; they are true of the path a visitor takes when the video cannot be had (V8), and each now says so in one line after its imports, `bridge.off = true`. Nothing in them was loosened. Note line: item 8 of change note 002.

- `tests/polish-gate.test.ts` (the live view under a gate)
- `tests/polish-port2.test.ts` (the port takes the arrow and lets the ball fall, live)
- `tests/polish-save.test.ts` (the save at the gate on the live site)
- `tests/polish-save2.test.ts` (the arrow and the view at a save, in a live visit)
- `tests/polish-save2-follow.test.ts` (the view while the ball rides an outlane rail)
- `tests/polish-save2-shut.test.ts` (the view while the ball rides an upper outlane rail to a shut gate)
- `tests/polish-slide.test.ts` (a beat's deadline while the visitor's ball is in play)
- `tests/site-backing.test.ts` (the row of controls over the machine)
- `tests/site-pointer-listeners.test.ts` (the flippers of step 3)

The bots: `tools/bots.mjs` and `tools/gate.mjs` as said under NEEDS. In node a bot takes the video's path on the step clock; it presses no flipper there because there is none.

## Measurements

### The tool and the stand-in

- `node tools/pinball-video.mjs --tier draft --middle preview --ends 3 --every 24 --codec h264 --edge final`: the stand-in, made again at 23:18Z on the merged main (`dc4989f8`, the rail of the shell unit is in the frames): the first 3 and the last 3 frames at 1920 by 1080, tier final; of the frames between, one in 24 at 960 by 540, tier draft, enlarged and held. The first making: 96 frames in 9.6 min.
- The file: `out/work/pinball-video/pinball.mp4`, H.264 High, yuv420p, 1920 by 1080, 60 a second, crf 16, `faststart`, no sound track: 32.25 MB, 7.458 Mbit/s, 2176 frames, 36.267 s. `ffprobe`: `color_range=tv`, `color_space=bt709`, `color_transfer=bt709`, `color_primaries=bt709` (the last two said `unknown` until the tags were also set on the frames with `setparams`; the encoder's own options did not write them).
- Shipped as 3 pieces: 16.00, 16.00 and 0.25 MB (`ls -la dist/bundle | grep part`); `cat` of the pieces compared with the file by `cmp`: the same bytes.
- Against its source frames, 30 frames spread through it (`ffmpeg` psnr and ssim, the tool prints them): PSNR mean 43.79 dB, least 37.58 dB; SSIM mean 0.9842, least 0.9021. The least values are on the enlarged middle frames of the stand-in.
- The size and the bitrate of the real file: UNKNOWN until it is rendered. The stand-in holds each picture for 24 frames, which a codec packs far smaller than a moving scene, and its enlarged draft frames carry noise, which packs larger.
- The published site against the kit's limits (`config/showcase.json` `host`: 95 MB shipped in all, 20 MB a file, 16 MB first load; checked by `npm run hostcheck`): `du -sh dist` 15 MB before the video; 47 MB with the stand-in; 54 MB with the site's sound files unpacked beside it (7 MB, not in git). The largest file is now a piece of 16 MB. For the real file 95 less 15 less 7 leaves about 73 MB, about 16 Mbit/s over 36.3 s. First load: the video is not in it (V13).

### The renderer's time for a frame, and four renderers at once

- 960 by 540, tier draft, one renderer, each frame following its neighbour (`node pipeline/change002/video-cores.mjs --slot 0 --of 4 --frames 2`): 5.01 s a frame, 12 frames a minute; the first frame of a run, which carries the scene from its start to that place (frame 467 of the span), 38.1 s.
- 1920 by 1080, tier final (24 samples), each frame following its neighbour: 39 s a frame (the times of the files `000000.png`, `000001.png`, `000002.png` of the stand-in's first three frames: 23:11:33, 23:12:12, 23:12:51). The 2176 frames of the span at that rate: 23.6 hours on this machine. Tier draft 19.5 s, review 25.5 s (`--time draft,review`).
- All four cores busy: one renderer already keeps them busy. `top` while one renderer drew: the browser's graphics process at 373 to 380 % of the 400 % of the four cores (it draws in software, on every core). Four renderers at once (`video-cores.mjs --workers 4`, then four processes `--slot 0..3 --of 4 --frames 5`): the first way stood still with no frame after 4 minutes; the second took the load average to 66, the machine stopped answering commands for 3 minutes and no renderer had finished its 5 frames after 3.5 minutes; both killed. So on this machine the frame time with all four cores busy is the time of one renderer, and more renderers make it slower, not faster. On a machine with a graphics card: UNKNOWN here.

### The pictures of the joins

`node pipeline/change002/video-join.mjs --pictures` (stepped clock, level high, bot keen, seed 1), run again at 23:23Z on the merged main with the stand-in whose first and last 3 frames are tier final, as the real file will be (`out/work/video-join/joins-final-edges-pictures.json`, pictures under `out/work/video-join/<size>/`; the first pass with draft edges: `joins-draft-pictures.json`). Differences per channel out of 255 over the whole picture of the stage: mean R, G, B; the largest; the share of pixels where any channel differs by more than 8. Two live frames of one state differ by about 0.9 at pixel ratio 1 and 0.6 at 2 (the grain), which is the floor of every number here.

| window | canvas buffer | load (visitor's state to film's) | join in: live to video | join out: video to live | first live frame after the hand-back |
|---|---|---|---|---|---|
| 1920x1080 @1 | 1920x1080 | 0.95 / 236 | 5.70, 6.17, 6.40 / 182 / 27.0 % | 5.61, 6.00, 6.21 / 190 / 29.4 % | 0.90 / 63 |
| 1920x1080 @2 | 1920x1080 | 0.64 / 225 | 4.79, 5.36, 5.66 / 132 / 12.7 % | 4.32, 4.84, 5.16 / 106 / 14.3 % | 0.60 / 35 |
| 1280x720 @1 | 1280x720 | 0.95 / 245 | 5.92, 6.41, 6.63 / 184 / 23.1 % | 4.91, 5.39, 5.66 / 116 / 19.7 % | 0.90 / 45 |
| 1280x720 @2 | 1920x1080 | 0.67 / 225 | 4.85, 5.40, 5.70 / 156 / 13.7 % | 4.40, 4.91, 5.22 / 144 / 15.3 % | 0.62 / 35 |
| 390x844 @1 | 390x219 | 0.81 / 190 | 7.73, 8.19, 8.40 / 224 / 31.7 % | 5.62, 6.07, 6.34 / 138 / 22.2 % | 0.78 / 5 |
| 844x390 @1 | 693x390 | 0.81 / 221 | 6.81, 7.25, 7.49 / 201 / 29.4 % | 5.04, 5.51, 5.79 / 126 / 20.5 % | 0.77 / 50 |

- These are larger than with draft edges (join in at 1920x1080 @1 then: 4.73, 4.54, 4.50 / 14.6 %). The cause is not the video and not the browser. The film's own frame of the join in, rendered three times at 1920 by 1080 and compared as PNG (`sharp`, mean of R over the whole frame): tier draft (2 samples) 208.80, tier review (8) 207.39, tier final (24) 201.82; the live picture of the same state (one sample) 206.16. So the film's renderer makes the same frame 7.0 of 255 darker at final than at draft and 5.6 darker than at review, the same in R, G and B, over the flat page nearly evenly (4 to 6.8 darker than the live picture on the paper, 0.5 to 1.2 on the ball and the cup). Why the tiers differ in light: UNKNOWN, it lies in the film's renderer, which is not this unit's. What it means: with the real file at tier final the live picture and the video's first picture differ by about 4.4 of 255 in light over the whole page, at both joins; a cut would show it as a step of light, the fade of 0.2 s shows it as the page dimming a little and, at the join out, lighting up again.
- The video in the browser against the frame it was made from (the browser's picture of the first video frame at 1920x1080 @1 against `000000.png`): mean difference 1.20, 1.02, 1.21; signed +0.55, -0.11, -0.41. The last frame: 2.66, 2.58, 2.62; signed +0.60, -0.05, -0.44. So the file and the browser's colour handling add about half a level of red and take about half a level of blue; no range or matrix fault (that would be 10 and more).
- What else the differences are, read off the difference pictures (`in-diff-x8.png`, `out-diff-x8.png`): the edges of every shape and letter (a live frame is one sample a pixel, a film frame many, and the video is scaled from 1920 at every window but the first). No block of the picture is shifted, stretched or of another size.
- Because the two pictures are not the same pixels the cut is not used: the video is faded in over 0.2 s while it stands on its first frame, and out over 0.2 s while it stands on its last (V3). During a fade nothing moves.
- The load changes the arrow inside the glass ball only (0.08 % of the pixels over 8 at 1920x1080 @1).
- The hand-back: the arrow starts from the film's last place and moves 0.4 px in its first step and 35.9 px in its first 17 steps (`back.arrow` in the JSON), at every size; no jump.
- No page error at any size (`problems` empty).

### Phone sizes

The site shows its touch page (`touchOnly()` in `src/ui/device.ts`, then `mountTouchMessage` in `src/main.ts`) on a device with touch and neither hover nor a fine pointer, whatever its window: a phone never reaches step 3 and never fetches the video. So "phone sizes" here are desktop windows of 390 by 844 and 844 by 390: the stage is letterboxed to 390 by 219 and 693 by 390 and the video lies on it to the pixel. The numbers are in the table.

### The joins at the real clock

`node pipeline/change002/video-join.mjs --only 1280x720@1 --quality low --hide 12` (one visit at the real clock, bot keen; `out/work/video-join-time/joins.json`), run again at 23:21Z on the merged main with the cue lead and with the live loop's refining stopped under the video. On this machine the browser draws the stage in software: one live frame of the pinball page takes 0.7 to 1.5 s here, and the page's loop and the video's fades run on the same thread. So every time below that depends on a live frame is the time of this machine. What a machine with a graphics card gives: UNKNOWN, it cannot be measured here.

- Join in: play asked to the start of the fade 1445 ms, which is 2 frames of the page (the 2 live frames the player lets pass, as built). The fade 1467 ms, one frame of the page (200 ms by the clock: on a machine at 60 a second it is 12 steps; here it was one step, a cut). From play asked to the first moving frame of the video (frame 2, media time 0.033 s): 150 ms, 9 display frames, during which the video stands on its first frame. That hold is the browser's start of play; it falls on the picture of the shut ball in the cup, 0.04 s before `tube-run`, where the scene itself stands. How long it is on a visitor's machine: UNKNOWN.
- The video itself: 2184 frames decoded, 47 dropped (`getVideoPlaybackQuality`), gap between presented frames median 16.7 ms, 99th percentile 33.4 ms. The largest gap, 2033 ms, is the 2 s the test hid the tab; the video's clock stood at 12.077 s from hidden to shown.
- Join out: last video frame to the start of the fade 1897 ms (one live frame: the page draws the film's last state under the video 0.3 s before its end, and on this machine that frame takes longer than 0.3 s; it was 3583 ms before the refining was stopped); the fade 1386 ms (one frame of the page); from the end of the fade to the page's clock running again 10.3 ms, 0.62 display frames.
- Under the video the canvas draws one frame after the state is loaded and then stops (NEEDS `e941b2ad`).
- A black or white flash: `Page.startScreencast` took every frame the browser composed through both joins. Join in: 55 pictures within 4 s of it; mean light (0 to 255) of the pictures on either side of the join 203.52, 203.63, 203.44, the step between neighbours (mean difference per channel) 0.72 and 0.20. Join out: 24 pictures, light 204.06 to 204.12, largest step between neighbours 0.52. All 132 pictures of the run: light 76.15 (the scene's own lights down) to 204.12; none black, none white. The video element is transparent until its first frame is decoded, has no poster and no background, and is only made visible after a frame callback said the first frame is there (`ready`).
- The first frame not decoded when play is asked: ruled out by `ready()`, which is false until the whole file is here, a frame was presented and `readyState >= 3`; play is asked only after the fade in, on a video that already shows its first frame.
- Colour range and matrix: the file is BT.709, limited range, and all four tags say so (`ffprobe`, above); the measured mean difference of the pictures leaves no room for a range fault (a range fault alone is about 16 of 255 in the darks).
- Scaling: the element is laid on the canvas's own box, read from `getBoundingClientRect` at the join and on every resize; `object-fit: fill`.

### Sound

Same run. The offset between a cue's moment in the film and the video's clock when the page sounded it, as mean of the absolute offsets and worst: first third of the video 3.82 ms, 7.53 ms (19 cues); middle third 5.02 ms, 7.90 ms (20); last third 4.87 ms, 9.63 ms (20); the 46 cues after the tab was hidden for 2 s and shown again 4.76 ms, 9.63 ms. The Builder's limits: under 16.7 ms on average, under 50 ms at worst. With the mean signed offset -1.21 ms: the cue lead of 1/120 s puts them about even round their frames.

59 of 60 cues sounded in that run; `tube-run` and the first knocks among them (before the refining was stopped: 50 of 60, 10 passed over at the start, worst 120 ms). The one passed over was the last, `peel-up`, 0.196 s before the end: the page drew its frame under the video then (1.9 s here), looked again after the end, and the rule passed the cue over because the clock had moved more than 0.25 s. Changed since (`phase.ts`, tested): a cue is passed over only when the cue itself is older than 0.25 s (`VIDEO.jumpMax`), so a page that looks late still sounds what just happened, and a tab that slept still does not sound what it slept through. Not measured again in the browser after that change: UNKNOWN until the next run; pinned in node by `tests/b-video.test.ts`.

How the rule against sound before a press is met: the video has no sound track and is `muted`, so a browser plays it without a press; the cues come out of the site's own engine, which the visitor's first press unlocked on step 1 or 2.

### The skip link

`node pipeline/change002/video-skip.mjs --at 2,18,34` (1280x720, a visit driven by the mouse, real presses of the mouse on the link; `out/work/video-skip/skip.json`, `before-*.png`, `after-*.png`), at 23:34Z. The link stood on the screen from the video's first second (NEEDS `e941b2ad`).

| press at video second | video stopped after the press | fade over after the press | video gone, the page's clock running, after the press |
|---|---|---|---|
| 2.39 | 95.0 ms | 1576 ms | 1583 ms |
| 18.43 | 21.1 ms | 1211 ms | 1222 ms |
| 34.48 | 25.1 ms | 1330 ms | 1347 ms |

Each time the page then stood on the result card of step 3 (the pictures). The time from the stop to the end of the fade is one live frame of this machine; by the clock it is 0.2 s. The row of controls stands on its dark capsule over the video (NEEDS `db68cd5a`).

A correction to the first report: the presses reported then (28.42 s, 31.43 s, 34.51 s; "press to gone" 10994, 10080, 5116 ms) were not taken by the stage. That run was driven by the bot keen (`bot=keen` in the address), and with a bot as the driver a press on the link is not the stage's input; the video ran to its own end each time and the times were the rest of the video. The pictures before and after were true, the conclusion was not. The script now drives the visit by the mouse and says so at its head. In node the skip is pinned by `tests/b-video.test.ts` through the stage's own input.

### Not ready

`node pipeline/change002/video-line.mjs --step 3 --rates 0.5` (the line held to 0.5 Mbit/s down): the file is not here at the join; the page plays the table itself (`out/work/video-line-slow/gave-up-0.5.png`, and 20 s later `gave-up-0.5-later.png` with the ball on its way down the feed tube). The hold before it is at most 1 s (`VIDEO.waitMax`, pinned by a test).

### No wait

- The fetch begins when the visitor arrives on step 1 (V13) and all pieces are asked for together. In every run of `video-join.mjs` and `video-skip.mjs` (visits begun on step 3, so with no steps before it, on the unheld line of this machine, the pieces served from the same machine) the video was there and played at the join.
- The time a visitor has: the seconds of steps 1 and 2. `npm run bots` at 23:44Z (all clear, keen reached 37 of 37 gags on every seed), steps 1 and 2 together: keen 23.6 + 15.3 = 38.9 s; clumsy 57.1 to 59.1 s; random 20.8 + 21.2 = 42.0 s; skipper 20.8 + 20.8 = 41.6 s. The stand-in is 33 811 412 bytes: to be whole in 38.9 s it needs 6.95 Mbit/s, in 57.1 s 4.74 Mbit/s (a sum, not a run). A slower line, or a visitor quicker than keen, gets the table (V8). For the real file the same sum is done again with its size: at 73 MB, 15.7 Mbit/s for keen.
- The same run, step 3: keen 40.7 s and clumsy 41.2 to 41.3 s of which 36.27 s are the video (`pre-rendered film: 36.27 s, left out of the limit of 8 s by item 8 of change note 002`); random 5.0 to 5.1 s and skipper 7.5 s, who press the skip link as the video begins (film 0.01 s). Pointer ignored outside the video: 4.24 s (keen, clumsy), 2.48 s (random, skipper); the limit is 8 s.
- "Slow" tested: 0.5 Mbit/s down, 150 ms latency (`Network.emulateNetworkConditions`), from step 3: not ready, and the visitor sees the shut ball for at most 1 s and then plays the table (above). Never a dead screen: the hold is bounded by `VIDEO.waitMax` and pinned by a test.
- A whole visit from the careers page on a held line: not measured (one such run takes over 6 minutes here and was stopped unfinished at 22:50Z). UNKNOWN.

## The real render, for whoever does it

1. The pinball unit's scene lands on main; `npx vitest run tests/b-video.test.ts` goes red (the manifest's joins, hashes and events are those of the old scene). That is the guard.
2. The unit's frames are rendered once at 1920 by 1080, 60 a second, tier final, by the film's own renderer. Then `node tools/pinball-video.mjs --frames <that folder> --tier final` (or, with no frames yet, `node tools/pinball-video.mjs --tier final`, which renders the span itself: 39 s a frame on this machine).
3. The tool prints the size and the measure against the frames, writes the pieces, the manifest and the states, and empties `src/pages/step3/video/.gitignore`. Commit the pieces. Check the size against 73 MB (above).
4. Run `node pipeline/change002/video-join.mjs --pictures`, then `--only 1280x720@1 --quality low --hide 12`, then `video-skip.mjs`, and read the join pictures at 1920x1080 @1: cut (`VIDEO.fade: 0`) only if no group of pixels can be seen to jump (the Builder's ruling); with the tiers differing in light as measured above, the fade stays.

## What bears on splitting the film's final render

- Seconds a picture at 1920 by 1080 on this machine (4 cores, no graphics card, the browser draws in software), each picture following its neighbour: tier draft 19.53 s, tier review 25.45 s (`node tools/pinball-video.mjs --time draft,review`), tier final 39 s (the three first frames of the stand-in, above). At 960 by 540, tier draft: 5.01 s.
- The 2176 pictures of the pinball stretch at 39 s: 23.6 hours on one such machine. On N such machines 23.6 / N hours: 4 machines 5.9 h, 8 machines 2.95 h, 12 machines 1.97 h, 24 machines 0.98 h (sums from the measured 39 s).
- What a piece costs to begin: its first picture carries the scene from the start of the unit to that place. Measured at frame 467 of the span (film second 11.0 of the unit): 38.1 s for the first picture against 5.01 s for the next, so about 33 s for 11 scene seconds, 3 s a scene second. The last piece of the unit (second 39.5) would begin about 2 minutes late. Small against hours, but it sets a floor: pieces of fewer than a few hundred pictures waste their time on the start.
- One machine holds one renderer: one renderer keeps all four cores at 373 to 380 %; four at once gave no picture in 3.5 minutes (above). So more machines, not more renderers a machine.
- Whether pieces made apart join without a seam. MEASURED on this machine only: `npm run determinism` at 23:44Z, `pass, 12 pictures at hd, tier draft, identical across two fresh loads and two orders`, with `still-pinball` and `film-pinball` among them: a picture reached by a fresh load is the same, pixel for pixel, as the same picture reached in another order. STATED from the code: the film's own plan joins chunks made on other machines (`sameBuild` in `tools/lib/film-plan.mjs` compares the records of two chunks and leaves the machine out by its default). And at tier final, 23:53Z: frame 2 of the span drawn as the first picture of a fresh session (`node pipeline/change002/video-seam.mjs 2 final /tmp/seam-2-final.png`, 54.0 s) against the same frame of the stand-in, which was drawn after its two neighbours in another session 40 minutes earlier: 0 of 6 220 800 values differ. So on one machine a piece that begins anywhere gives the picture the unbroken render gives. Across two different machines: UNKNOWN, no second machine was to be had here. The check to run before the split is trusted: the same three pictures at tier final on two of the machines, compared with `node pipeline/change002/video-compare.mjs a.png b.png`.
- How many machines one folder of frames can take: the frames are separate numbered files (`000000.png` onward), no file is written by two machines, so the number is not limited by the folder; the tool's `--frames` names the files that are missing and refuses, so a piece that did not arrive is seen before anything is encoded.
- The step that cuts the stretch out of the final frames: `node tools/pinball-video.mjs --frames <folder> --tier final` when the folder holds the pinball unit from its first frame, `--whole film` when it holds the whole film from its first frame, `--first N` for anything else. `--out <folder>` writes the pieces somewhere else than the site (a proof run).
- That step proved on the stand-in's frames, 23:50Z to 23:52Z: a folder of 2186 files numbered as a whole film would be (`004210.png` to `006395.png`: the unit begins at film frame 4020, the join in is its frame 195, five files too many at each end), then `node tools/pinball-video.mjs --frames /tmp/filmframes --whole film --tier draft --out out/work/pinball-video/proof`. It printed `took 2176 pictures from 2176 files of /tmp/filmframes, 004215.png to 006390.png, 1920 by 1080`, rendered nothing, and its three pieces, its whole file and its `states.json` compared with the stand-in's by `cmp`: the same bytes, each. Its manifest differs only in the record of how the frames were made (`given`, `first`, `files`). PSNR and SSIM printed the same (43.79 / 37.58 dB, 0.9842 / 0.9021). The encoding of 2176 frames took about 2.3 minutes.
- The tier changes the light of the picture (above: final 7.0 of 255 darker than draft on the paper). Pieces of one render must all be of one tier, or the seam is seen.

## Not done, and UNKNOWN

- The real file: waits for the pinball unit's scene (Decision D6). Its size, bitrate and its measure against its frames: UNKNOWN.
- Every time at the real clock on a machine with a graphics card (the 2 live frames before the fade, the fades, the start of play, the join out): UNKNOWN. This machine draws a live frame of the pinball page in 0.7 to 1.5 s.
- Safari and Firefox: not run here. STATED: both play H.264 High in MP4 from a blob. Their colour handling of the file against the canvas: UNKNOWN.
- Why the film's renderer gives a darker frame at tier final than at draft (7.0 of 255 on the join in frame): UNKNOWN, outside this unit; told to the Builder.
- The last cue (`peel-up`) in the browser after the change of the passing-over rule: not measured again.
- `npm run hostcheck` with the pieces in place: not run (it builds a clean copy, on which the stand-in's pieces are not present).
