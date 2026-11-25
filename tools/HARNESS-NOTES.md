# Harness notes: the render commands

Decisions taken by the harness builder while building `film`, `seq`, `sheet`, `loop`, `render:local` and `stress`. Facts marked MEASURED were run in the builder's VM (4 cores, software WebGL).

## film

- Defaults: `--which b`, `--format preview`, `--tier draft`, `--assets full`, the rate `film.previewFps`.
- A page is rendered in pieces of at most 300 rendered frames, split evenly, never more than `sandbox.maxFramesOnDisk`. The split depends only on the page, the rate and the limit, so every VM cuts a page at the same frames. `--piece N` changes the limit.
- Frames wait as PNG in `out/work/film/frames/<piece>/` with a note of the build they belong to. A piece is encoded as soon as its last frame is written, checked with `ffprobe` for its frame count, and its frames are deleted. Only one piece's frames are ever on disk: the folder of any other piece is deleted before a piece starts.
- A stopped run carries on at the frame where it stopped: frames on disk whose note matches the build are kept, a piece with a matching record is not rendered again, a page's chunk with a matching record is not joined again.
- Pieces land in `out/work/film/chunks/pieces/`, a page's chunk in `out/work/film/chunks/<page>-F-T.mp4`, each with a record beside it. A chunk is its pieces joined with `ffmpeg -c copy`.
- Encoding: `libx264`, high profile, the bitrate of the format as the target with 1.5 times as the ceiling, a key picture every second, closed groups (`-flags +cgop`), no scene cut pictures, bt709 tags, time base 90000. Every piece starts on a key picture, so pieces and chunks join with no picture encoded twice.
- A record matches when everything but `machine` is the same: hashes, format, tier, asset set, diagnostic, rate, codec, bitrate, range, and the browser version when a browser is open. This is what lets a chunk rendered in another VM be joined here. With `--join` no browser is opened, so the browser version is not compared either.
- `--first N --last M` renders exactly the frames of that range that fall on the preview rate and writes a clip `out/work/film-<which>-F-T-<first>-<last>.mp4` named by the frames it really holds. It never writes the whole film's file.
- `--unit ID` renders that page's chunk and joins nothing.
- `--join` joins the page chunks of this build that exist, in film order. If pages are missing it says `NOT THE WHOLE FILM`, lists them, and the record says `complete: false`.
- Sound: when `audio/mix/review.wav` exists it is laid under the joined film as `export.audioCodec` at `export.audioKbps`. A film with pages missing, or a clip, gets the stretches of the mix that belong to its pictures. Film A gets silence under its opening.
- `--which a` renders the opening's chunk (`opening-F-T.mp4`) and joins it in front of film B's chunks, which are shared and never rendered for it again. Should the page say the opening is not built, the command says so and exits 1 before it renders anything.
- `--from-hd` scales `film-<which>-hd-T.mp4` down to `formats.preview` at `previewFilm.bitrateMbps` and copies its sound. It refuses a film whose record is not of this build.
- `--review` renders film B and writes it as `out/work/review-cut.mp4` (`export.files.reviewCut`).
- `--chunks-to DIR` copies finished chunks with their records, and under `DIR/pieces/` the pieces of pages that are not whole. `--chunks-from DIR` takes both in, after checking each file against the hash in its record.
- `--minutes M` stops cleanly after M minutes, prints `NOT FINISHED`, and exits 2. Exit 1 is kept for "cannot do its work".
- `--by NAME` names who made the looks. A look is written every `status.minGapMinutes` of rendering.
- Free disk is checked first. Under `sandbox.minFreeDiskGb` it deletes, in this order and stopping as soon as there is room: waiting frames, `seq`, `determinism`, `roughcut`, `stress`, `crops`, `stills`.

## sheet

- One sheet is at most `critics.contactSheetFrames` pictures and at most `critics.maxImageLongEdgePx` on its long edge. With 12 pictures of 16 by 9 that is 3 columns by 4 rows with tiles 461 px wide. A heading sits above the grid, a label under each picture: time in the film, beat, frame. Nothing is drawn over a picture.
- Files: `out/work/sheets/sheet-<kind>-<id>-[NofM]-F-T.jpg`, each with a record beside it and one line in the look log. A sheet whose record matches this build is not rendered again (`--force` renders it anyway).
- `--beat ID`: 12 frames spread evenly over the beat. `--unit ID`: one sheet for every 12 s of the page, the frames spread evenly (`--sheets N` sets the number). `--film`: one sheet for each page, 12 frames each (`--sheets N` spreads N sheets over the whole film instead). `--pages`: the six pages at rest through `renderRest`.
- `--loop` and `--opening`: 12 frames spread over the loop or the opening. Should the page say they are not built, the command says so and exits 1.
- `--motion NAME`: the frame comes from the events of `filmState`, read in the browser without rendering. `hit` is the first event with `hitsCursor`, or whose name ends in `hit-cursor`; `page-turn` and `bumper` are the events of those names; `reassembly` is `strips-zip`; any other name is taken as an event name. `--nth K` takes the K-th, `--unit ID` looks in one page only. The sheet is 12 frames in a row at the preview rate with a third of them before the event; `--every-frame` uses every film frame.
- `--live`: the live site's own mode with a bot as the driver (`--bot`, default the first of `live.bots`; `--seed`, default the `seed` of the config) and a clock that is stepped, not real time. 12 moments spread over the run's length, which is read from `out/work/bots.json` or given with `--seconds`. Labels are the run's time, the page and the last gag reached. It uses `src/main.ts` as the Builder wrote it: `&bot=NAME&seed=N&clock=steps` in live mode and `window.liveRun = { state(), advance(seconds) }`. The patch I asked for is gone from the branch: main has the same calls.
- The stub pages emit `bolt-hit-cursor` with `hitsCursor` false, so `hit` also goes by the name.

## seq

- `npm run seq -- --first N --last M` writes every film frame from N to M, at `film.fps`, as `out/work/seq/frame-NNNNNN-F-T.png`, each with a note of its build beside it. `--step K` writes every K-th frame. `--format` and `--tier` default to `preview` and `draft`; `--diag NAME` renders a diagnostic view.
- A run is at most `sandbox.maxFramesOnDisk` frames. A longer range is refused with a sentence that says so.
- A frame of this build that is already there is kept (`--force` renders it again). The run's record is `out/work/seq/seq-<first>-<last>-F-T.json`, and its look line is the middle frame.
- `--opening` and `--loop` write frames of the opening and of the card loop (`opening-frame-...`, `loop-frame-...`). Should the page say those are not built, the command says so and exits 1.

## render:local

- Everything it writes is under `out/work/render-local/`. Rate `film.fps`, `export.local.videoCodec` in `export.local.container`. It uses the same pieces, records and resume as `film`: a page is rendered in pieces (120 frames for a master, so about 2 s of frames wait on disk at a time), a stopped run carries on at the frame where it stopped, pieces are joined with `ffmpeg -c copy`.
- `--proof`: the harness's headless browser with software graphics, `formats.preview`, `draft`, `export.proofSeconds` of film B in a row across the first hit on the cursor in step 1 (a third of the frames before the hit), and the first `export.proofSeconds` of the opening. Files `out/work/render-local/proof/proof-film-b.mov` and `proof-opening.mov`; the record `out/work/render-local/proof.json` holds `engineHash`, `pageHashes` and `parts: [{ what, file }]` with the `ffprobe` result of each part. Each file is checked for its frame count, size and rate.
- `--proof` alone makes both parts. Should the page say the opening is not built, it exits 1 after writing film B's part. `--proof --what film-b` makes film B's part only and exits 0; `--proof --what film-a` makes the opening's part only.
- `--what film-b|film-a|loop` with `--test` or `--go` uses the installed Chrome in a window with its graphics card on. It is looked for at the usual place of the system, or at `WJA_CHROME`. No browser is downloaded: with no Chrome it exits 1 and says where it looked.
- No master with software graphics: when the browser reports a software renderer and the format is `formats.master`, it exits 1 unless `deliver.sandboxMaster` is true. `--software --format preview --tier draft` runs the `--test` and `--go` paths in this workspace, which is how they were tested here.
- `--test`: one judged still (the first of `stills` that has a kept copy in `out/stills/`) is rendered in the kept still's format and tier, written beside it as `out/work/render-local/test/<name>-beside.jpg` with the PSNR, both sides as JPEG of the same settings so that two identical renders give `identical`. Under `quality.crossMachineMinPsnr` it says so in the last line. Then `npm run take -- --check`, then the first `export.local.testSeconds` seconds as `<name>-test.mov` with the mix, opened with the system's own command (`--no-open` leaves it shut). `--skip-still` and `--skip-take` leave a step out.
- NOT DONE: the search for a take on this machine when `take --check` fails. `tools/take.mjs` is not built, so there is no way yet to search into a file other than the committed one, or to tell the site to use it. Today a failing check is printed, named in the last line, and the command exits 1 after the test render.
- `--go`: checks first that the film reports its length times `film.fps` frames, renders every page, joins, and checks that the file holds that many frames, at the right size and rate. Names: `export.files.filmB`, `filmA`, and the stem of `cardLoop`, with `.mov`.
- `--what film-a`: the opening as its own chunk in front of film B's chunks, which are reused when they are of this build.
- `--what loop`: every frame of the loop at `film.fps`, and `card-still.jpg` from its frame 0.
- Sound: the mix is looked for in `audio/final/` as `film-b.*`, then `<export.files.filmB>.*`, `final-b.*`, `b.*`, then any sound file with `b` as a word of its name (the same with `a`). The kit does not name the files: UNKNOWN until the mix exists. In the `.mov` it is laid in as 24 bit PCM at 48 kHz, since the kit names no sound codec for the master. `--mix FILE` names the mix outright. With no mix the file is silent and the last line says so.
- UNKNOWN: the installed Chrome path was never run. This workspace has no Chrome and no screen.

## loop

- Defaults `--format` `deliver.cardLoop.format`, `--tier draft`. The loop's frames are indexed at `film.fps`; every `film.fps / deliver.cardLoop.fps`-th is rendered. It refuses a loop whose `frameCount` is not `deliver.cardLoop.seconds` times `film.fps`.
- Pieces and resume as in `film`, under `out/work/loop/chunks/`. `--first N --last M` renders a range and joins nothing; `--join` joins the ranges that exist and opens a browser only if the picture of frame 0 is missing.
- Files: `out/work/loop/card-loop.mp4` (the chunk, `export.videoCodec` at `export.bitrateMbps`), `card-loop-web.mp4` (`webWidth` wide, even height, `webBitrateMbps`, encoded once from the loop), `card-still.jpg` (frame 0, rendered as a picture of its own, never taken from the film file), each with a record.
- The seam: with a browser open, the frame one past the last is rendered and compared with frame 0 pixel for pixel. The result is in the record; when they differ the command exits 1.
- The opening's tier. `renderOpeningFrame(i)` takes no tier and draws at the tier of the last picture drawn. So before an opening frame the harness reads `showcase.info().tier`, and when it is not the tier asked for it draws film frame 0 at that tier once. MEASURED: `sheet --opening` 9.6 s at draft and 28.5 s at review, so the tier is the one asked for.
- The seam. `renderLoopFrame` wraps its index, so the frame one past the last is frame 0 by construction and that check only proves the wrap. What a viewer sees is the step from the last picture to the first, so `loop` also writes `card-loop-seam-F-T.jpg`: the last three pictures and the first three, read back from the written loop, each labelled with how much it differs from the one before it in dB. When the step over the seam is larger than every step beside it the command says so. It does not exit 1 for that: the config names no limit for it.

## stress

- The four moments come from the keys of the config: `step2-rest` (a page at rest), `step1-fire`, `reply-all` (the office tier in "Reply All"), `boss-fight`. The frame is the key's place in its beat, and the half second is that many frames in a row with a third of them before it.
- Defaults `--format hd`, `--tier draft`, rate `film.previewFps` (15 frames): the rate at which the films of this workspace are encoded. `--fps 60` uses every frame. `--moment ID` does one moment.
- Each moment is encoded with the film's own encoder settings at `export.bitrateMbps` and at `quality.compressionStressMbps`. Files under `out/work/stress/`: the two films, a still from each (the frame of the key, decoded), the frame as rendered, and a sheet `stress-<id>-F-T.jpg` of the three whole pictures over the three in their own pixels round the cursor, each labelled under it with the bitrate asked for, the bitrate got and the PSNR against the rendered frame. A record sits beside the sheet, and a look line is added.
- Half a second is short for an encoder that aims at an average, so each encode is made in two passes. The bitrate got is printed beside the one asked for. It is above the target, because half a second holds the key picture of its second and so more than half of that second's bits (MEASURED on the merged pages, `node tools/stress.mjs`: 22.7 to 26.6 Mbps for 20 asked, 8.2 to 9.7 for 5 asked, PSNR 46.2 to 47.7 dB at 20 and 45.9 to 47.0 dB at 5, four moments in 1.6 min). The still is the frame of the key, a third of the way in, which is not the key picture.
- The still is decoded with exact rounding (`accurate_rnd+full_chroma_int`). Without it a flat ground of 204,201,199 came back as 202,200,198 and the PSNR read 41 dB for a picture that was right.
