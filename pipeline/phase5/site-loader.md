# site-loader: notes and decisions

Branch `agent/site-loader`. A fact is MEASURED (the command and the number), STATED (read) or UNKNOWN.

## What loaded on origin/main a5724fb9 (point 1)

- MEASURED `npm run hostcheck`: dist 14.125 MB in 26 files; largest `bundle/index-*.js` 5.097 MB; first picture after 10 files, 6.218 MB stored, 2.089 MB sent with text compressed; build 2.4 s, 4.5 s with the install.
- MEASURED `node pipeline/phase5/site-loader-measure.mjs --mbit 10` and `--mbit 1.5` (960x540): the first complete picture of the careers page after 6.64 s and 16.55 s. The first frame alone costs about 4.4 s: this VM draws in software.
- MEASURED `node pipeline/phase5/site-loader-measure.mjs --mbit 1.5 --scale 8 --bot skipper --quality low --view 640x360 --until step3 --after 150 --name base-skipper-1.5`: after the first picture the only fetches of the visit are the pictures of the table (13 seen, 7.876 MB), all asked for at once when the careers page is left. Longest frame (median): careers 3.17 s (1.03), step 1 2.50 s (0.67), step 2 3.97 s (0.78), step 3 8.50 s (0.75).
- The line is divided by 8 after the first picture (`--scale 8`) because software frames make a visit 8 to 14 times longer than a visitor's: megabytes per second of play stay those of the line named.
- No page but step 3 fetches pictures. The six pages' code is one bundle (5.35 MB, 1.93 MB gzip).

## Decisions

1. `src/core/load.ts` is the loader. A picture belongs to a page (`picture(page, folder, file, ...)`). `src/table/real/assets.ts` keeps its three exports and hands every picture to it as a picture of `step3` (NEEDS patch).
2. Live order: `showPage(flow, page, set)` is called from `App.loadLater()` with the page on show. It loads the page on show, the next one, and a page named in `EARLY` that many pages ahead (`step3: 2`, so the table starts on step 1). Every other page that was started is released.
3. On the live site a picture is `ready()` only once it is on the graphics card. Pictures are decoded one at a time and put on the card one at a time with `renderer.initTexture`, each after an animation frame of its own, so no drawn frame carries a decode result or an upload, and no two uploads share a frame. The `ImageBitmap` is closed right after the upload.
4. A capture, a still, a film frame and a stepped run load as before: `loadTable` before the first frame, all at once, kept, never released, `ready()` true once decoded. The texture is made with the same settings as before.
5. Release: `texture.dispose()`, the entry back to idle. If the page is shown again (film mode of the site), it is fetched again, from the browser's cache.
6. The limit I hold for a stall: no step of the loader may hold the main thread longer than 50 ms on a visitor's machine, three frames at 60 a second. The loader measures its own longest upload (`info().loading.longestUploadMs`).
7. The view draws nothing of its own. A shape whose maker answers null is not drawn. Its part is `waiting` while its pictures are on their way (`waitsFor`), and on the list of stand-ins when nobody makes it or its pictures can no longer arrive (failed, or not in the asset set). A part whose pictures were never asked for (a unit test with no loading) is on the list too, as before.
8. The cursor: all five makers are used without a null branch. A missing one throws with the part's name when the cursor is built, and `cursorUnmade()` names it in `standIns`.
9. The wait: `holdsTurn` in `src/stage/turn.ts`, asked by one line in `Stage.advancePhase`. Only `App.start` sets it (`setTurnWait`), and only when the app is neither a capture nor stepped, so films, stills, stepped runs and the bots step exactly as before. The tap is the cursor's own reaction `tap` (0.42 s), every 0.6 s. A forced turn (film) is never held.
10. The wait does not go through `StageOptions`, so `src/main.ts` is not touched for it. `main.ts` is not changed at all: its one loading line calls `app.loadLater()` as before.
11. `.vercelignore`: each folder now starts with a slash. STATED (https://vercel.com/docs/deployments/vercel-ignore: it works like `.gitignore`): a line `audio/` with no leading slash matches a folder of that name at any depth, so it would have kept `public/audio/`, the site's sound, from the host.
12. `tools/hostcheck.mjs`: "opens the careers page in live mode" asked for the flag `careers-page` to be reported, which a finished page never does. It now asks for no flag at all. It also serves the build from `/some/folder/` and lets the skipper play to step 1, says what the sound files weigh, and exits 2 when either fails.
13. `tests/harness-parts.test.ts`: `cursor-body` left the list of flags the scan must find, because the only place that carried it as a flag was the stand-in path of the view that is gone. The test now holds that no file carries it.

## Not done, and why

- The code of the six pages is still one bundle fetched before the first picture (1.93 MB sent). Splitting it by page means dynamic imports in `src/pages/index.ts` and in everything that reads `pages` at start (`App.check`, the films), which is frozen for me.
- What a page's makers put on the card besides fetched pictures (geometry, drawn textures) is released by the makers' own `drop`. I do not change them.
