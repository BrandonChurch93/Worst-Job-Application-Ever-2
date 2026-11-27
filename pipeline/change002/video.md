# Unit video: notes

Branch `agent/b-video`, from `origin/main` at `dc3296b8f518165ed8691d04c0b76aaf1b4750ab`. Owner of this file: the video helper.
Every number below is MEASURED on this machine (4 cores, 7957 MB, no graphics card, the headless browser draws in software, Chromium 159.0.8154.6, ffmpeg 8.0.1) unless it says STATED or UNKNOWN. The command that gave a number stands beside it.

## What is built

- `tools/pinball-video.mjs` (with `tools/lib/pinball-video-scene.mjs`, `-encode.mjs`, `-control.mjs`): runs the scene in node to find the joins, renders the film's own frames between them through `renderFilmFrame`, encodes them, measures the file against the frames, and writes `src/pages/step3/video/`: the pieces `pinball.mp4.N.part`, `manifest.json` (joins, hashes, events, files and their pieces, how it was rendered), `.gitignore` (a stand-in's pieces stay out of git) and `states.json` (the state of the page and of the arrow at both joins).
- `src/pages/step3/video/plan.ts`: the rule of the joins and the named numbers. `phase.ts`: what the page does while the video plays (no clock of its own in a browser, the step clock in node). `bridge.ts`: the one object the page and the player share. `player.ts`: the `<video>` element of the live site.
- `src/pages/step3/index.ts`: small edits (the imports, `prepare`, `control`, the head of `step`, `save` and `load`, `skip`, `gag`) and one helper `rideOut` cut out of `skip`.
- `tests/b-video.test.ts`: 15 tests.
- `pipeline/change002/video-join.mjs` (the joins in the browser), `video-line.mjs` (the preload and the slow line), `video-skip.mjs` (real presses on the skip link), `video-cores.mjs` (the renderer's time for a frame with one and with several renderers), `video-strip.mjs` (pictures in a row for a report).

## Decisions

1. V1, the joins come from the events of the scene, never from seconds. Join in: the last film frame at least 0.04 s before `tube-run` (`VIDEO.inLead`). Join out: the last film frame that is over before the result card begins to rise, 0.2 s after `peel-up` (`VIDEO.outLag`). A film frame gathers light over its whole sixtieth: the frame after that one showed a half transparent card. On `main` today: frame 195 (3.250 s) to frame 2370 (39.500 s), 2176 frames, 36.267 s. The tool refuses to render when the film's script is already walking the arrow at the join out.
2. V2, the join in does not depend on the visitor because the page loads the film's own state there. The manifest carries the state of the page and of the arrow at the join in, saved from the film stage. When the live scene reaches the film second of the join (after `ball-seal`, the arrow shut in the ball in the cup) the page loads that state, so the last live picture is the film's state drawn by the live renderer. What the load changes in the picture is measured (row "load" below): the arrow inside the glass ball turns to the film's heading, 0.08 % of the pixels.
3. V3, the video is faded in and out, 0.2 s each (`VIDEO.fade`), while it stands still on its first and on its last frame over the page's own picture of that same frame. Why: the two pictures are the same state but not the same pixels (the film frame is made of many samples, the live frame of one; numbers below), and a cut between them showed as a flick on the edges and on the text. A fade between two pictures of one state shows no motion and no flick.
4. V4, the join out: 0.3 s before the end of the video (`VIDEO.underlay`) the page loads the film's state of the join out under the video and holds it; when the video's clock reaches its end the video is faded out; when it is gone the page lets its own clock run again and releases the arrow from the film's place with the stage's own eased hand-back (`CursorBody.release`).
5. V5, the manifest is the proof against a stale video. It holds `stage.hash()` of the film at both joins. `tests/b-video.test.ts` runs the film in node and fails when the joins, the hashes, the two states or the events between them are not those of the scene as built. So after the pinball unit's scene lands, the suite is red until `node tools/pinball-video.mjs` has been run again. That is meant.
6. V6, sound (ruled by the Builder): the file is silent. The page relays the film's events between the joins (from the manifest) through `emit`, each when the video's own clock (`video.currentTime`) has passed it, so the site's sound engine plays the scene's cues in time with the picture. It obeys the sound control and its level because it is the same engine; nothing doubles because the file has no track; a silent video may play without a press, and the engine itself was unlocked by the visitor's first press long before step 3. A step of the video's clock larger than 0.25 s (`VIDEO.jumpMax`: a seek or a tab that slept) passes its cues over without sounding them. The player pauses the video when the tab is hidden and plays it again when it is shown. `--sound <wav>` is kept in the tool for a file with its own track.
7. V7, control (ruled by the Builder): while the video and its two fades are on the screen the page reports `control: 'film'`. The stage counts those seconds apart (`longestIgnored.film`, `ignoredFilm` in a bot's run). `tools/lib/pinball-video-control.mjs` is the one place that leaves them out of `live.controlTakenMaxSeconds`; `tools/bots.mjs` and `tools/gate.mjs` call it and print the seconds. The way out is the skip link: it stays over the video and takes the visitor to the join out at once.
8. V8, never a dead screen, and never a visit without the table. No video ready at the join: the page holds the picture of the shut ball for at most 1 s (`VIDEO.waitMax`), then plays the table itself exactly as it did before there was a video (flippers, saves, everything). The same at once, with no wait, where no file can be played or with `?video=off`. A video whose clock stands still for 3 s (`VIDEO.stallMax`) is left for the join out. This changed from the first plan (4 s, then the page's short ending): the short ending cut the whole gag for every visitor on a slow line, and the table as it was is the better thing to fall back to. One line of `phase.ts` decides it.
9. V9, so the playable table is not gone from the site: it is what a visitor gets when the video cannot be had. Its code and its tests stay.
10. V10, the page keeps its picture still under the video (it loads the arrow's film state again every step), and while the page reports `'film'` the live loop draws one frame and stops (NEEDS `e941b2ad`), so the live renderer costs nothing while the video plays.
11. V11, in node (bots, tests, `clock=steps`) there is no player: the video phase lasts exactly the video's length on the step clock and relays the same events, so every run stays deterministic and the bots take the visitor's usual path.
12. V12, one file serves every browser: H.264 High in MP4, 4:2:0, 8 bit, BT.709 limited range tagged, `faststart`. Chrome, Edge, Safari and Firefox play it (STATED for the last three; MEASURED in Chromium 159: `canPlayType` says `probably`). A browser that cannot gets the table. `--codec h264,vp9` writes a WebM too and the player picks by `canPlayType`; not used, it would double the published size.
13. V13, the whole file is fetched from the moment the visitor arrives on step 1 (`prepare()` of step 3 runs through `app.loadLater()`, which `src/main.ts` calls once the first page is left; STATED from `src/app.ts` and `src/main.ts`, so the site's first load does not carry it), and handed to the element only when it is all there. So the video can never stall in the middle for the line, and "ready" is one fact: all bytes here, first frame decoded. The price: a line too slow to bring the whole file before the join gets the table.
14. V14, the stand-in. Rendered at tier draft: the first 3 and the last 3 frames at 1920 by 1080 as the real file will be, the frames between at 960 by 540 enlarged, one frame in 24 held (2.5 pictures a second). It serves for the joins, the player, the preload and the sound; it says nothing of the scene, the file size or the bitrate of the real file.
15. V15, the file is shipped in pieces. The host takes 20 MB a file (`config/showcase.json` `host.maxFileMb`) and the stand-in is 32 MB; the real file will be larger. The tool writes the whole file to `out/work/pinball-video/` and cuts it into pieces of at most 16 MB (0.8 of the limit, `PART_SHARE` in the tool) named `pinball.mp4.0.part` onward in `src/pages/step3/video/`; the manifest lists them; the player fetches them together and joins the bytes into one blob. No piece is a video by itself and nothing is encoded twice.
16. V16, the pieces of the stand-in are not committed: 32 MB of a throwaway in the history for ever. On a clone without them the player finds no file and the site plays the table (V8). `node tools/pinball-video.mjs ...` (the line under "The tool and the stand-in") makes them; the real pieces are committed once, by whoever renders the real frames.
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

`node pipeline/change002/video-join.mjs --pictures` (stepped clock, level high, bot keen, seed 1; `out/work/video-join/joins-draft-pictures.json`, pictures under `out/work/video-join/<size>/`). Differences per channel out of 255 over the whole picture of the stage: mean R, G, B; the largest; the share of pixels where any channel differs by more than 8. Two live frames of one state differ by about 0.9 at pixel ratio 1 and 0.6 at 2 (the grain), which is the floor of every number here.

| window | canvas buffer | load (visitor's state to film's) | join in: live to video | join out: video to live | first live frame after the hand-back |
|---|---|---|---|---|---|
| 1920x1080 @1 | 1920x1080 | 0.95 / 236 | 4.73, 4.54, 4.50 / 213 / 14.6 % | 5.06, 4.87, 4.80 / 232 / 19.3 % | 0.90 / 63 |
| 1920x1080 @2 | 1920x1080 | 0.64 / 225 | 3.69, 3.37, 3.22 / 150 / 6.2 % | 3.66, 3.33, 3.20 / 142 / 6.7 % | 0.60 / 35 |
| 1280x720 @1 | 1280x720 | 0.95 / 245 | 4.31, 4.06, 3.96 / 227 / 10.6 % | 3.83, 3.56, 3.46 / 149 / 8.9 % | 0.90 / 45 |
| 1280x720 @2 | 1920x1080 | 0.67 / 225 | 3.77, 3.46, 3.32 / 174 / 6.8 % | 3.77, 3.45, 3.31 / 169 / 7.5 % | 0.62 / 35 |
| 390x844 @1 | 390x219 | 0.81 / 190 | 6.56, 6.37, 6.29 / 223 / 16.9 % | 4.77, 4.52, 4.42 / 136 / 11.8 % | 0.78 / 5 |
| 844x390 @1 | 693x390 | 0.81 / 221 | 5.68, 5.47, 5.39 / 214 / 15.4 % | 4.12, 3.86, 3.78 / 133 / 10.1 % | 0.77 / 50 |

- What the differences are, read off the difference pictures (`in-diff-x8.png`, `out-diff-x8.png`): the edges of every shape and letter (a live frame is one sample a pixel, a film frame many, and the video is scaled from 1920 at every window but the first), the noise of the draft stand-in over the flat page, and a faint bluish cast in the upper left corner. No block of the picture is shifted, stretched or of another colour: the box of the video is the box of the canvas to the pixel at every size (`box` in the JSON), and the mean differs by 3 to 6 of 255 where a wrong colour range would give about 16 at black and white and a wrong matrix a cast on every colour.
- Because the two pictures are not the same pixels the cut is not used: the video is faded in over 0.2 s while it stands on its first frame, and out over 0.2 s while it stands on its last (V3). During a fade nothing moves.
- The load changes the arrow inside the glass ball only (0.08 % of the pixels over 8 at 1920x1080 @1).
- The hand-back: the arrow starts from the film's last place and moves 0.3 px in its first step and 27 px in its first 21 steps (`back.arrow` in the JSON); no jump.
- No page error at any size (`problems` empty).

### Phone sizes

The site shows its touch page (`touchOnly()` in `src/ui/device.ts`, then `mountTouchMessage` in `src/main.ts`) on a device with touch and neither hover nor a fine pointer, whatever its window: a phone never reaches step 3 and never fetches the video. So "phone sizes" here are desktop windows of 390 by 844 and 844 by 390: the stage is letterboxed to 390 by 219 and 693 by 390 and the video lies on it to the pixel. The numbers are in the table.

### The joins at the real clock

`node pipeline/change002/video-join.mjs --only 1280x720@1 --quality low --hide 12` (one visit at the real clock, bot keen; `out/work/video-join-time/joins.json`). On this machine the browser draws the stage in software: one live frame of the pinball page takes 0.2 s to several seconds, and the frozen live loop (`src/main.ts`) steps the stage once a display frame and no more than 0.1 s of stage time. So every time below that depends on a live frame is the time of this machine. What a machine with a graphics card gives: UNKNOWN, it cannot be measured here.

- Join in: play asked to the start of the fade 1512 ms, which is 2 frames of the page (the 2 live frames the player lets pass, as built). The fade 1483 ms, again 2 frames of the page (200 ms by the clock: on a machine at 60 a second it is 12 frames).
- The video itself: 2184 frames decoded, 49 dropped (`getVideoPlaybackQuality`), gap between presented frames median 16.7 ms, 99th percentile 33.5 ms. The largest gap is the 2 s the test hid the tab.
- Join out: last video frame to the end of the fade 3583 ms; from there to the page's clock running again 18.1 ms, 1.09 display frames.
- After the join in the canvas refines its rest picture for 64 display frames (frozen), then stops drawing: from there the video plays alone and the page costs nothing.
- A black or white flash: the pictures of the screen taken through both joins (`in-row-*.jpg`, `out-row-*.jpg`, with the mean light of each) show none; the video element is transparent until its first frame is decoded, has no poster and no background, and is only made visible after a frame callback said the first frame is there (`ready`).
- The first frame not decoded when play is asked: ruled out by `ready()`, which is false until the whole file is here, a frame was presented and `readyState >= 3`; play is asked only after the fade in, on a video that already shows its first frame.
- Colour range and matrix: the file is tagged BT.709, limited range (`ffprobe`: `color_range=tv`, `color_space=bt709`), which is what a browser assumes for a 1080 line file; the measured mean difference of 3 to 6 of 255 leaves no room for a range fault.
- Scaling: the element is laid on the canvas's own box, read from `getBoundingClientRect` at the join and on every resize; `object-fit: fill`.

### Sound

Same run. The offset between a cue's moment in the film and the video's clock when the page sounded it (before `VIDEO.cueLead` was added): first third of the video mean 14.65 ms, worst 120.13 ms; middle third 11.20 ms, 16.63 ms; last third 8.75 ms, 15.97 ms; all cues after the tab was hidden for 2 s and shown again 9.64 ms, 19.03 ms. 50 of 60 cues were sounded: 10 at the start were passed over because the video's clock had moved more than 0.25 s between two looks of the page, while the live loop refined its rest picture on this machine. The worst of the first third is over the Builder's 50 ms for the same cause. Since then a cue is sounded half a display frame ahead (`VIDEO.cueLead`), which takes about 8 ms off the mean.

How the rule against sound before a press is met: the video has no sound track and is `muted`, so a browser plays it without a press; the cues come out of the site's own engine, which the visitor's first press unlocked on step 1 or 2.

### The skip link

`node pipeline/change002/video-skip.mjs --at 28,31,34` (real presses of the mouse at 1280x720). The press was taken at 28.42 s, 31.43 s and 34.51 s of the video; each time the video left and the page stood on the result card (`out/work/video-skip/before-*.png`, `after-*.png`). Press to the video gone: 10994 ms, 10080 ms, 5116 ms on this machine (the live frames of the join out). The row of controls stands on its dark capsule over the video (NEEDS, `src/main.ts`).

### Not ready

`node pipeline/change002/video-line.mjs --step 3 --rates 0.5` (the line held to 0.5 Mbit/s down): the file is not here at the join; the page plays the table itself (`out/work/video-line-slow/gave-up-0.5.png`, and 20 s later `gave-up-0.5-later.png` with the ball on its way down the feed tube). The hold before it is at most 1 s (`VIDEO.waitMax`, pinned by a test).
