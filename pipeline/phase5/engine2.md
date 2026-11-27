# Round 26, check: the built site in a second browser engine

Branch `agent/engine2`, cut from `2ce6ca9d`. Written 2026-11-27, 19:53 to 20:43 UTC. The site was not changed. The two files of this check are this one and `pipeline/phase5/engine2-load.mjs`.

Marks: MEASURED (run here, command given), STATED (read somewhere), UNKNOWN.

## Short answer

- The careers page drew in two engines besides Chromium: WebKit 26.4 (Playwright's WPE build for Linux, which is not Safari itself) and Firefox 148.0.2 (in a window under Xvfb). Firefox headless did not give a WebGL context in this VM.
- In both, the console held no error, `gl.getError()` was 0, the context was never lost, `standIns` was empty, and the float target was taken.
- The heading is the same shape, weight and colour in the three engines. The mean difference per channel in the heading crop is 1.6 to 1.7 against Chromium; 0.9 is grain between two runs of one engine. All of the heading's pixels that differ by more than 32 lie within 4 pixels of the ink.
- WebKit and Firefox gave the same pixels, picture for picture (20 of 20). Both drew on Mesa llvmpipe; Chromium drew on SwiftShader. So what was compared here is two browser engines over one software rasteriser, against Chromium over another.
- With the site's time moved by the tool (`clock=steps`), `bot=skipper` reached all six pages in both engines, at the same seconds as Chromium, and Decision stood. In real time the visit did not get past step 3 in six minutes: 0.5 to 0.7 frames a second on the careers page, on a software GL with 4 cores. That is this VM, not a fault of the engine: Chromium here ran at 0.24.
- One thing found that holds in every engine: `showcase.ready` settles before the first frame is on the canvas. See "Found".

## The machine

MEASURED: Ubuntu 26.04.1, 4 cores, 7 GB, no GPU, node v20.20.2, Mesa 26.0.8 llvmpipe (LLVM 21.1.8). `npm ci` and `npm run build` exit 0; `dist/` is 15 MB; `dist/audio/` holds only `index.json`.

## What was installed, all outside the repo

- `PLAYWRIGHT_HOST_PLATFORM_OVERRIDE=ubuntu24.04-x64 npx playwright-core install firefox` and `... install webkit`, into `~/.cache/ms-playwright`: Firefox 148.0.2 (build 1511), WebKit 26.4 (build 2272). Without the override: "ERROR: Playwright does not support firefox on ubuntu26.04-x64". `npx playwright-core install-deps`: "Cannot install dependencies for ubuntu26.04-x64 with Playwright 1.59.1" (its closing mark left off here).
- apt: `libegl1 libegl-mesa0 libgles2 mesa-utils`, then for WebKit `libgtk-4-1 libgraphene-1.0-0 libevent-2.1-7t64 libgstreamer-gl1.0-0 libgstreamer-plugins-bad1.0-0 libavif16 libwayland-server0 libmanette-0.2-0 libenchant-2-2 libsecret-1-0 libwoff1 libharfbuzz-icu0 libhyphen0 libflite1 libepoxy0 libatomic1 gstreamer1.0-plugins-base gstreamer1.0-plugins-good`.
- WebKit still asked for two libraries Ubuntu 26.04 no longer ships: `libicu74_74.2-1ubuntu3.1_amd64.deb` and `libxml2_2.9.14+dfsg-1.3ubuntu3.10_amd64.deb`, fetched from archive.ubuntu.com (`pool/main/i/icu/`, `pool/main/libx/libxml2/`), unpacked with `dpkg -x`, and their `.so` files copied into `~/.cache/ms-playwright/webkit-2272/minibrowser-wpe/sys/lib/` and `minibrowser-gtk/sys/lib/`.
- `package.json` and `package-lock.json` are untouched; the script uses the `playwright-core` already in `node_modules`.

## The script

`node pipeline/phase5/engine2-load.mjs --engine chromium|firefox|webkit --job careers|visit|stepped --out DIR --name NAME` after `npm run build`. It serves `dist/` with `tools/lib/serve.mjs`, opens the page at 1920 by 1080 and ratio 1, and writes `NAME.json` and its pictures into `DIR`. Before the site's code it adds a script that counts animation frames, keeps the site's own WebGL context of the canvas `#stage`, and notes every extension asked of it. It keeps every console line, page error, failed request and answer of 400 or more.

- `careers`: `/?quality=low`, waits for `showcase.ready`, 3 s, a picture, `showcase.info()`, the WebGL facts; `--also 30,60` keeps later pictures.
- `visit`: `/?bot=skipper&quality=low` in real time, a picture every 10 s, until Decision has stood 8 s or `--seconds` (360).
- `stepped`: the same with `&clock=steps`; the tool moves the site's time one second at a call with `window.liveRun.advance(1, true)` and reads the canvas, so a slow machine still reaches every page.
- Firefox needs a window: `xvfb-run -a -s "-screen 0 1920x1200x24" node ... --engine firefox --headed`.

## Base: Chromium

`node pipeline/phase5/engine2-load.mjs --engine chromium --job careers --out ../e2 --name chromium`

MEASURED: headless shell 159.0.8154.6 through `tools/lib/browser.mjs`. Ready after 0.6 s. Console: 0 lines. `info()`: tier draft, format live, assets web, engineHash 7cd3b37117ec03b3, standIns [], target float, three 0.187.0. `info().fps` is 60, which is the configured rate, not a measurement. Measured rate: 0.24 to 0.26 frames a second (median 4.2 s a frame). The screenshot call took 15.8 s.

WebGL: VERSION "WebGL 2.0 (OpenGL ES 3.0 Chromium)", renderer "ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero) (0x0000C0DE)), SwiftShader driver)", MAX_TEXTURE_SIZE 8192, MAX_SAMPLES 4, 31 extensions. Asked and missing: KHR_parallel_shader_compile, WEBGL_multisampled_render_to_texture, WEBGL_render_shared_exponent.

Picture `chromium-careers.png`: the whole careers page. Header with three links and an orange "Apply for a Job" button, the heading "Where your work-life balance goes to die, beautifully." in two lines, a second orange button, the silver seal "Excellence in Synergy", three frosted glass cards, the ticker strip at the foot, the white arrow cursor. Top left, the page's two DOM controls: the sound ring and "Watch the film instead".

## Try 1: Firefox 148.0.2, headless, through playwright-core. No WebGL.

`node pipeline/phase5/engine2-load.mjs --engine firefox --job careers --out ../e2 --name firefox-t1a` (and t1b to t1e with `--prefs` and `--env`).

MEASURED: the page loaded; `showcase.ready` rejected with "THREE.WebGLRenderer: Error creating WebGL context." The careers page did not draw.

- No prefs. Console: "WebGL creation failed: * AllowWebgl2:false restricts context creation on this system. ()".
- With `webgl.force-enabled: true`, and then also with the EGL libraries from apt, `gfx.x11-egl.force-enabled`, `webgl.out-of-process: false`, `security.sandbox.content.level: 0`, and the environment `LIBGL_ALWAYS_SOFTWARE=1`: "WebGL creation failed: * tryNativeGL () * Exhausted GL driver options. (FEATURE_FAILURE_WEBGL_EXHAUSTED_DRIVERS)".

Cause as far as found: headless Firefox has no display to make a GL context on in this VM. With a display (try 3) the same build draws. This is the test machine, not the site.

## Try 2: WebKit 26.4, through playwright-core. Draws.

`node pipeline/phase5/engine2-load.mjs --engine webkit --job careers --also 30,60,100 --out ../e2 --name webkit-t2b`

This is Playwright's WebKit for Linux (the WPE MiniBrowser, headless). It is the WebKit engine, with its own JavaScript and WebGL front end, but it is not Safari itself: no macOS, no Metal, no Apple GPU. Its user agent says "Version/26.4 Safari/605.1.15" on a Mac, and its unmasked renderer says "Apple Inc." / "Apple GPU"; both are masks. MEASURED from `/proc/PID/maps` of its web process: it maps `libEGL_mesa`, `libgallium-26.0.8` and `libLLVM.so.21.1`, so it drew on Mesa llvmpipe.

MEASURED: ready after 0.6 s (1.3 s in the first run). Console: 0 lines, no page error, no failed request. `info()`: the same as Chromium's (tier draft, format live, standIns [], target float). WebGL: VERSION "WebGL 2.0", GLSL "WebGL GLSL ES 3.00", MAX_TEXTURE_SIZE 16384, MAX_SAMPLES 8, 31 extensions. Asked and missing: WEBGL_multisampled_render_to_texture, WEBGL_render_shared_exponent. Rate: 0.47 frames a second (median 2.1 s a frame).

Pictures:

- `webkit-t2b-careers.png`, at ready + 3 s: near black. Mean 11, 11, 12, which is the body background `#0b0b0c` of `index.html`; brightest pixel 31. Only the sound ring and "Watch the film instead" show, dark on dark. The canvas had no frame yet: the first frame came 13.75 s after ready.
- `webkit-t2b-careers-plus030s.png`, 30 s later: the whole careers page, with every part named under Chromium above. The ticker has moved on and the cursor is elsewhere, since it is a later moment. `-plus060s` and `-plus100s`: the same page.

## Try 3: Firefox 148.0.2, in a window under Xvfb, through playwright-core. Draws.

`xvfb-run -a -s "-screen 0 1920x1200x24" node pipeline/phase5/engine2-load.mjs --engine firefox --headed --job careers --also 30 --out ../e2 --name firefox-t3a`

The third way is the same Firefox build launched not headless, on a virtual display, with no pref changed.

MEASURED: ready after 1.2 s. `info()`: the same as Chromium's. WebGL: VERSION "WebGL 2.0", renderer "llvmpipe, or similar", vendor "Mesa", MAX_TEXTURE_SIZE 16384, MAX_SAMPLES 8, 16 extensions. Asked and missing: EXT_color_buffer_half_float, KHR_parallel_shader_compile, WEBGL_clip_cull_distance, WEBGL_multisampled_render_to_texture, WEBGL_render_shared_exponent. EXT_color_buffer_float is there, and the site asks for it first (`src/core/accumulator.ts` lines 42 and 43), so the target stays float. Rate: 0.46 frames a second.

Console, word for word: 32 warnings of one kind, no error. The first six are

`WebGL warning: generateMipmap: Tex image TEXTURE_CUBE_MAP_POSITIVE_X level 0 is incurring lazy initialization.`

for the six faces, then 26 of

`WebGL warning: drawElementsInstanced: Tex image TEXTURE_CUBE_MAP_POSITIVE_X level 1 is incurring lazy initialization.`

for the faces of levels 1 to 5 (level 5 cut short by the limit), then `After reporting 32, no further warnings will be reported for this WebGL context.` Firefox says this when a cube map's storage is made empty and it has to clear it before use; it costs a little time at the first draw and changes no pixel. One more line, `WEBGL_debug_renderer_info is deprecated in Firefox and will be removed. Please use RENDERER.`, is caused by this check's own facts reader, not by the site.

Picture `firefox-t3a-careers.png`: the whole careers page with every part named under Chromium. Firefox's screenshot call took 28 s, so its "ready + 3 s" picture is in truth later than the first frame.

## All three: the mode

MEASURED in each: `prefers-reduced-motion` false, `any-hover` true, `any-pointer: fine` true, coarse false, `maxTouchPoints` 0, canvas 1920 by 1080 and not hidden, `#fail` hidden. So each engine ran live mode: not the film, not the touch notice, not the failure page.

## What differs in the picture

Type is not text of the browser. STATED from the source: the glyph outlines are baked into `dist/fonts/*.json` and built into meshes with `THREE.ShapePath` and `ShapeGeometry` (`src/shell/real/type.ts` lines 41 to 63); there is no atlas and no canvas text. The live picture is multisampled four times (`LIVE_MULTISAMPLES = 4`, `src/app.ts` line 44). So a difference in the type can only come from the rasteriser's edges.

MEASURED, mean absolute difference per channel (R, G, B), heading crop x 120 to 1040, y 180 to 362:

| Pair | Whole picture | Heading crop | Over 32 in the crop |
| --- | --- | --- | --- |
| Chromium, two runs (grain, ticker, cursor) | 1.59, 1.61, 1.60 | 0.91, 0.91, 0.91, max 6 | 0 % |
| WebKit +30 s and +60 s | 1.52, 1.54, 1.53 | 0.91, 0.91, 0.91, max 6 | 0 % |
| Firefox first and +30 s | 1.52, 1.54, 1.53 | 0.92, 0.92, 0.92, max 7 | 0 % |
| Chromium and WebKit +30 s (live, other moment) | 2.56, 2.58, 2.56 | 1.94, 1.99, 2.04, max 160 | 0.16 % |
| Chromium and Firefox (live, other moment) | 2.50, 2.52, 2.50 | 1.94, 1.99, 2.04, max 161 | 0.16 % |
| Chromium and WebKit, same second (stepped, 0 s) | 1.45, 1.44, 1.43, max 187 | 1.63, 1.69, 1.75, max 161 | 0.16 % |
| Chromium and Firefox, same second (stepped, 0 s) | 1.45, 1.44, 1.43, max 187 | 1.63, 1.69, 1.75, max 161 | 0.16 % |
| WebKit and Firefox, same second (stepped) | 0 | 0 | 0 % |

At the same second, WebKit against Chromium: the signed mean difference is +0.02, +0.01, -0.00 over the whole picture, so there is no shift of brightness or colour. In the heading crop, 100 % of the pixels that differ by more than 32 lie within 4 pixels of ink (ink: darker than 128 in Chromium's picture). Ink pixels: 30692 in Chromium, 30751 in WebKit and Firefox, 0.2 % apart, so the weight is the same. Horizontal steps of more than 16 between neighbours: 33831 with a mean of 50.6 in Chromium, 30138 with a mean of 53.8 in WebKit and Firefox. So llvmpipe's edges have about a tenth fewer grey pixels and slightly steeper steps than SwiftShader's. Seen at six times size (`heading-edges-x6.png`, the letters "beau", Chromium above, WebKit in the middle, Firefox below): the same letter shapes, with single edge pixels a shade lighter or darker. Nothing is blurred, nothing is missing.

Cause: the two software rasterisers place multisample coverage on edges slightly differently. It is not the browser engine: WebKit and Firefox, on the same llvmpipe, give 20 of 20 stepped pictures identical pixel for pixel.

Pictures: `heading-side-by-side.png` (the crop three times: Chromium, WebKit, Firefox, top to bottom; the three read the same), `heading-edges-x6.png`, `heading-diff-chromium-webkit-x4gain.png` (the difference times four: thin outlines of the letters on black).

## The visit, `bot=skipper`

### With the site's time moved by the tool, 1920 by 1080

`node pipeline/phase5/engine2-load.mjs --engine webkit --job stepped --out ../e2 --name webkit-stepped` (the same for chromium; firefox with `xvfb-run` and `--headed`).

MEASURED: all six pages reached and drawn in each engine, at the same seconds of the site's time: careers 0, step 1 at 11 s, step 2 at 31 s, step 3 at 52 s, step 4 at 75 s, step 5 (Decision) at 97 s, the run ended by itself at 109 s. Wall time: Chromium 108.5 s, WebKit 88.9 s, Firefox 79.6 s. The first still, which waits for the first frame, took 9.3 s in Chromium, 7.7 s in WebKit and 5.3 s in Firefox. After that a still took a median of 3.9 s in Chromium, 2.6 s in WebKit and 1.9 s in Firefox; on step 3 up to 15.1 s, 22.2 s and 20.6 s. At every still `gl.getError()` was 0 and the context was not lost. At the end `standIns` and `waiting` were empty. Console: WebKit 0 lines; Firefox the 32 warnings above and nothing else.

Against Chromium at the same second, per page: mean difference per channel 0.1 to 2.15, at most 0.30 % of pixels over 32 (`stepped-diff-webkit.json`, `stepped-diff-firefox.json`).

What the Firefox pictures show, each looked at in halves at real size (WebKit's are the same pixels):

- `firefox-stepped-030s-step1.png`: header "The Worst Job Application Ever", the step row with 1 orange, "Step 1: About You", the resume drop zone with "Browse files" and the cursor over its text, the fields First name, Last name and Email, "Minimum 3 characters required", Continue.
- `firefox-stepped-050s-step2.png`: "Step 2: Personal Details", 2 orange, the labels Contact number, Date of birth and Audio volume with their sublines, three recessed fields with chevrons, Continue. The skipper opens no machine.
- `firefox-stepped-055s-step3.png`: "Step 3: Skills Assessment", "Toxicity Tolerance Assessment" and its three lines, the cursor, before the table opens.
- `firefox-stepped-060s-step3.png`: the table in the dark while it is revealed (mean 8.7): pipes, a flipper, a round blue insert with a magnifier, a coffee lid, cubicles, all dim. Chromium's picture of the same second is as dark.
- `firefox-stepped-070s-step3.png`: the table lit: cubicles, the clear ball with the arrow sealed in it, coffee lids, orange flippers, red slingshots, lit round inserts, the "Coffee" machine, the dot display.
- `firefox-stepped-090s-step4.png`: "Step 4: Submit", 4 orange, the glass card "Human Verification" with the checkbox "I am not a robot" and the cursor over the label, the small print under it, the orange Submit button.
- `firefox-stepped-100s-step5.png`: "Step 5: Decision", the paper card "Position Filled" with its two paragraphs, the cursor as an arrow.
- `firefox-stepped-109s-step5.png`: the same card with the red "REJECTED" stamp mark, the glass panel "Performance Metrics" (Your Time 01:42, Average Time 14:32, Target Time 02:00, Applicant #420,069), the red rubber stamp lying beside it, the orange "Accept Rejection" button, "Share Your Achievement". The cursor is drawn as a crumpled white shape, not an arrow; it is the same in Chromium's picture of that second, so it is not a matter of the engine.

### In real time

`node pipeline/phase5/engine2-load.mjs --engine webkit --job visit --out ../e2 --name webkit-visit1080`, and with `--width 640 --height 360`; Firefox with `xvfb-run`, `--headed`, 640 by 360.

MEASURED, six minutes each:

| Engine, window | Reached | Stopped | Frames a second |
| --- | --- | --- | --- |
| WebKit, 1920 by 1080 | step 1 at 245.1 s | on step 1, by the limit | careers 0.46 to 0.50, step 1 0.62 |
| WebKit, 640 by 360 | step 1 at 142.9 s, step 2 at 303.5 s, step 3 at 347.4 s | on step 3, by the limit | careers 0.65 to 0.78, step 1 1.3, step 2 40 to 62 while the page rests, step 3 0.6 to 2.1 |
| Firefox, 640 by 360 | step 1 at 149.5 s, step 2 at 325 s | on step 2, by the limit | careers 0.72 to 0.74, step 1 1.2 to 1.6, step 2 59 while the page rests |

Console: WebKit 0 lines in both runs; Firefox the warnings above only. On step 1 `loading.waiting` held `tier-art` in the stills up to 25 s (WebKit, small window), 30 s (Firefox) and 45 s (WebKit, 1920 by 1080) after the page came on show, and was empty in the next still.

Cause of the slow walk: the site moves its time by at most 0.1 s a frame (`src/main.ts` line 438, `Math.min(0.1, dt)`), so at 0.7 frames a second the careers page's 11 s take about 150 s. Slow is the number above, not a failure: no step failed, the bot went on each time.

A window with a ninth of the pixels is only about one and a half times faster on the careers page (0.72 against 0.47). So most of a frame's cost here does not scale with the window. UNKNOWN which part; not followed.

The 640 by 360 pictures show the same pages small. At that size the two DOM controls at the top left lie over the careers page's own header line; at 1920 by 1080 they do not. 640 by 360 is not a size the site is made for, so this is noted, not counted.

### `bot=keen` on step 2

`node pipeline/phase5/engine2-load.mjs --engine firefox --headed --job stepped --query "?bot=keen&quality=low&clock=steps&step=2" --until step3 --every 2 --out ../e2 --name firefox-keen2` under `xvfb-run`; the same in Chromium, and in WebKit with `--every 10`.

Step 2 was chosen since the skipper opens none of its three machines. MEASURED in all three engines: gags `step2.dial`, `step2.slot`, `step2.crank`, `step2.continue`; step 3 on show at 15 s of the site's time; `gl.getError()` 0 at each of 16 stills, context not lost, `standIns` []. Firefox against Chromium at the same second: mean difference per channel 1.54 to 1.69 on step 2, at most 0.11 % over 32 (`keen2-diff.json`).

Pictures, looked at in halves at real size:

- `firefox-keen2-004s-step2.png`: the first field reads "Close enough. We were never going to call."; under it the rotary dial of brushed metal with the digits 1 to 0, an orange centre and a finger stop, "Dial your 10-digit number.", the cursor on the dial.
- `firefox-keen2-008s-step2.png`: the second field, ringed orange, reads "Date of birth recorded. Corrections are not supported."; under it the slot machine with three reels 05, 04, 1999, an orange ball lever, gold coins lying about, "Pull the lever to select your date of birth."
- `firefox-keen2-012s-step2.png`: the third field reads "94%"; under it the crank on a round plate with an orange grip, ten bars of which nine glow orange, "Rotate the crank clockwise. Target: 100% (10 full rotations)." The crank's grip hangs below the panel over a few letters of the footnote line. The cursor is over the bars, not on the grip.

The WebKit run with a still every 10 s differs from the Firefox run with a still every 2 s by more than grain at the same second (1.9 against 1.55 from Chromium). In the skipper runs, taken at the same seconds, the two were identical. Likely the grain follows the count of frames drawn, and reading a still draws one. UNKNOWN, not followed.

## Found

1. `showcase.ready` settles before the first frame is on the canvas. MEASURED: ready after 0.6 to 1.7 s in every engine; the first frame after 5.3 to 9.3 s (stepped) and about 14 s (live: 13.75 s in WebKit, 14.0 s in Firefox) on this software GL. Between the two the visitor sees the near black body background with the two DOM controls dark on dark. Chromium's screenshot waits for a frame, so it hid this; WebKit's does not (`webkit-t2b-careers.png`). It is in every engine, and how long it lasts on a real GPU is UNKNOWN. Not mended.
2. No fault of the engine found: no shader error, no blank page after the first frame, no missing part in any picture looked at, in WebKit or in Firefox.

## UNKNOWN still

- Safari itself on macOS (Metal, Apple GPU) and Firefox on a real GPU: neither can be run in this VM.
- Firefox headless with WebGL.
- The frame rate on real hardware, in any engine.
- A real time visit past step 3 in a second engine.
- `bot=keen` on steps 1, 3, 4 and 5 in a second engine.
- Sound: `dist/audio/` holds no sound here, and nothing was listened to.
