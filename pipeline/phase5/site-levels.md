# The quality levels of the live site: notes of the build agent `site_levels`

Part `quality-levels` (kit/03-METHOD.md, section 14). Branch `agent/site-levels`.
Every number below is MEASURED with the command beside it, STATED by the code or the kit, or UNKNOWN.

## What each level does, and where

| word of `live.quality` | read by | what it does |
|---|---|---|
| `softShadows: accumulated at rest` | `src/core/levelPlan.ts`, `Engine.frame` | a page at rest gathers 64 frames, the light moved over its area as in a computed picture |
| `softShadows: filtered` | the same | the light never moves: one sample with the filtered lookup; a page at rest gathers 8 frames in which only the taps of the filter turn, then the picture is kept and nothing is drawn |
| `softShadows: baked` | the same and `src/core/levelShadows.ts` | as `filtered`, and the shadows of what stands still are drawn once into the key's map and kept; only what moves is drawn into the map of each frame |
| `glass: refracting` | `src/core/levelPlan.ts`, `src/core/levelGlass.ts`, `App.setLevel` | the ball bends a picture of the floor inside its shell, as before |
| `glass: frosted, no refraction` | the same | the ball does not bend: its pale shell, its bright rim and its reflections stay, and what lies under it shows straight through, dimmed by the shell. See "Glass" |
| `particleFraction` | `src/core/levelSmall.ts`, `App.put` | the share of the small things of each emitter that is drawn |

## Decisions

1. Kept shadows are three's own shadow pass over the still things alone, into the same kind of map, through the same shadow camera. A kept frame draws one square that writes the kept depths into the frame's map, then the things that move. So a kept frame holds the depths a frame drawn whole would hold.
2. A thing counts as still when its world matrix, its geometry, its instances and its shape in the frame's list have not changed for `STILL.holdFrames` (12) frames. The cursor, skinned things and things with their own depth material always count as moving.
3. Whenever a kept thing changes, the frame bakes again without it. A thing that breaks the kept map again and again waits twice as long each time (`STILL.maxBreaks`), so a blinking thing does not cause a bake at every blink.
4. While the shadow camera moves (the camera scrolls), every frame is drawn whole, as before this work.
5. `Engine.picture()` never keeps shadows: a still at a level (`renderStill` with `live`) draws the whole map, so the counts of G15 are the worst case of a live frame.
6. The picker counts a frame longer than 0.4 s as a stall, since the frame loop never reports more than 0.5 s (`frameSeconds` in `src/main.ts`), and the old limit of 1 s could not be reached. After a stall it leaves out 6 frames. Six stalls in a row are no stall: the machine is that slow, and it steps down.
7. The film bar: `fitPicture` in `src/core/levelFit.ts` takes `FILM_BAR_PX` (56, the height `.fitted` of `src/ui/interface.module.css` uses) off the window's height while the mode is film. `sizer()` takes the mode as an argument; its call in `play()` passes it.
8. `startLevel` and `levelIsFixed` of `src/main.ts` call `src/core/levelStart.ts`, so they have tests.
9. Small things: an emitter says what it is on its own object, `userData.small`. That mark lies in files that are not mine: `pipeline/phase5/site-levels-NEEDS.patch`.
10. `accumulated at rest`, the jump. Each gathered frame takes one direction of the dome at one over its height, so the mean of the first few frames is far from where it ends: MEASURED before the change, careers page paused in film mode, 1920x1080 window, mean of the picture of 255: frame 1 189.11, frame 2 200.39, frame 8 191.42, frame 10 187.77, frame 64 187.47. `src/core/levelRest.ts` keeps the one-sample picture and shows `mix(one-sample, mean, (n - 1) / 63)` while frame n of 64 is gathered. Frame 64 is the mean alone, as before.
11. Glass. No live frame at any level draws a transmission pass; the perk cards and the boss's card are drawn the same at every level. The one thing that refracts is the ball, in its own shader, and it already listens on the window for `wjb-ball` and takes `bend` from it. `App.setLevel` says `bend: false` through that door at a level whose word is `frosted, no refraction` and `bend: true` otherwise and for every computed picture. So no frozen file is changed. The risk: that door was made for proof sheets; if its owner removes it, low bends again. `tests/site-levels-glass.test.ts` reads the ball's source and fails when the listener under that name, or the line that gives `bend` to the shader, is gone. It saves no measurable time: the shader still runs.
12. Motion blur of small fast things. Read in the code and seen in the sheet: a bolt and a dart each carry their own tail in a live frame. The slot's coins had nothing: `src/core/levelStreak.ts` draws each coin longer along the way it went since the frame before, by the film's own shutter (`film.shutterDegrees` / 360 of the travel), at most `STREAK.most` (3) lengths. The coins are found as `root.userData.coins`, the name `src/pages/step2/real/slot.ts` gives them. The ball of the machine is NOT stretched: it is drawn by a shader that knows it as a sphere, with the hero inside; a stretched ball would bend the hero. That is open.
13. The shadow map of a held light lies square on the page (see "The ragged shadow edge at `low`"). It holds for medium and low, in every live frame, moving or at rest, so the kept map of low and the frames around it use one and the same map.

## Measured so far

Machine: this VM, software GL, 4 cores. Times of frames here say nothing about a visitor's machine.

| what | command | result |
|---|---|---|
| three draft stills against the references made before any change | `npm run still -- --key <k> --format hd --tier draft --force` then `cmp` | MEASURED byte equal: step1-fire sha256 c7252177462bc248, table-wide 6503c2dd8a1a58a2, boss-fight 39c4973f36bf54b7 (first 16 digits) |
| determinism | `npm run determinism` | MEASURED pass, 12 pictures at hd, tier draft |
| tests | `npm test` | MEASURED exit 0 after the merge of origin/main 49a341ac; 1517 passed before the merge |
| bots | `npm run bots` | MEASURED all clear |
| kept shadows against the whole map, level low, stepped bot run 640x360 | `scripts/steps-probe.mjs` of this agent (not in the repo) | MEASURED careers page frames 20, 40, 60 byte equal; step 1 frames 40, 80, 120 byte equal, frame 160 differs in 24 of 230400 pixels (most 7 of 255) on the cursor; the table frames 40, 80, 120, 160 byte equal. Two runs with the whole map in every frame also differ from each other in frames 152 to 160, so that difference is the stepped live run itself, not the kept map |
| draws into the shadow map in one frame, careers page, level low | `scripts/live-probe.mjs` | MEASURED 3 draws and 8290 triangles kept, 22 draws and 60018 triangles whole; all draws of the frame 84 before, 65 after |
| step 1, keen bot, 160 frames, level low | the same | MEASURED 8 bakes, 148 kept frames, 12 whole frames |

## G15: the counts of a live frame at each level (first table, from my own probe)

`info().counts` after `renderStill` with `live: <level>`, hd, assets full. Limits of `perf`: triangles 3000000, 1500000, 700000; draw calls 600, 450, 300.

| key | high | medium | low |
|---|---|---|---|
| rail-cam | 1087148 / 316 | 743645 / 217 | 270935 / 89 |
| last-save | 1484876 / 449 | 1078698 / 342 | 510046 / 188 |
| boss-fight | 618218 / 455 | 469526 / 383 | 250608 / 241 |
| boss-down | 620840 / 394 | 456110 / 322 | 223076 / 181 |
| decision | 539181 / 285 | 385689 / 201 | 191059 / 92 |

CORRECTION (17:25Z): my first table held a row "step2-crank 888565 / 814, 604601 / 512" and I reported it as over the limit. That row was wrong: it came from my own probe, not from the gate. The gate itself, `npm run gate -- --phase 5 --only G15 --unit step2`: MEASURED pass, high 418067 triangles / 238 draw calls, medium 354645 / 238, low 293243 / 172. The five rows above come from the same probe of mine (`scripts/calls-probe.mjs`, not in the repo) and were not checked against the gate; the whole gate is the measure, see "G15, the whole gate" below.

## The change outside my files (NEEDS, accepted by the Builder at 16:48Z)

Eight lines in seven files, each `userData.small = ...` on the object that draws small things:
`src/pages/step1/real/turrets.ts` (two), `src/pages/step2/real/slot.ts`, `src/cursor/model/effects.ts`, `src/table/real/ball/index.ts`, `src/boss/real/transform.ts`, `src/pages/step4/real/boss-weapons.ts`, `src/pages/step5/real/stamp.ts`.
The mark is read by `src/core/levelSmall.ts` alone. A computed picture has no level (`engine.levelPlan` is null), the share is 1, and `SmallThings.apply` returns at its first line when the share is 1 and was 1 (STATED, the code).

### Proof that the eight marks change no computed picture (the Builder's conditions 2, 3, 5)

MEASURED 17:05Z to 17:08Z on the tree of 57b89e8f. "After" is the tree with the marks, "before" is the same tree with `git apply -R pipeline/phase5/site-levels-NEEDS.patch`, built again. Each picture hd, tier draft, compared with `cmp`; the number is the first 16 digits of its sha256, the same on both sides.

| touched part | frame | sha256 | what the eye finds in it |
|---|---|---|---|
| turrets, sparks (step 1 under fire) | key `step1-fire` | c7252177462bc248 | also byte equal to the reference made at a5724fb9, before any of this work |
| slot, coins | `--page step2 --beat step2.slot --at 0.5` | d2137c422f33054a | reels read 07 23 1991, no coin yet |
| slot, coins | `--page step2 --beat step2.slot --at 0.7` | e57ee73c455f8f57 | coins beside the lever |
| cursor, drops and puffs | key `step1-tug` | 8ebebb76da62cb75 | the tug of war over the shredder; whether a drop or a puff is in this frame is UNKNOWN |
| table, sweat | key `last-save` | bf9d1e70496a6df8 | the ball above the flippers; whether sweat is in this frame is UNKNOWN |
| table | key `table-wide` | 6503c2dd8a1a58a2 | also byte equal to the reference of a5724fb9 |
| boss transform, chips | `--page boss --beat boss.unfold --at 0.6` | 54831ceae01a5037 | the button out of the cracked page; whether a chip is in the air is UNKNOWN |
| boss fight, flecks | `--page boss --beat boss.slabs --at 0.3` | 38b5008fdce7b107 | a stream of sparks toward the cursor |
| boss fight | key `boss-fight` | 39c4973f36bf54b7 | also byte equal to the reference of a5724fb9 |
| stamp, dust | `--page decision --beat decision.letter --at 0.55` | f06b5e1386005f1b | the letter lies, the stamp has not come down yet: no dust in this frame |

Three frames of the film itself, `npm run determinism -- --only film-step1,film-step2,film-boss` (frames 2472, 3831, 8172, hd, draft), before against after with `cmp`: MEASURED byte equal, sha256 6f5c751349f5f719, 6584713698f310ae, c026e4c22efc216e. The film is computed with no level, and at `high` the share is 1 as well, so no count changes there (the three frames above are the measured part; "every count at high in a live frame" is STATED by the code, not counted).

After the marks: `npm test` exit 0, `npm run determinism` pass 12 pictures, `npm run bots` all clear, `npx tsc --noEmit -p .` exit 0 (MEASURED 16:58Z to 17:04Z).

## The page at rest at `high` (rule 2a)

`RM=1 node scripts/rest-probe.mjs` of this agent (not in the repo): the careers page, paused in film mode through reduced motion, the mean of the canvas of 255 read after each frame.

| | frame 1 | frame 2 | frame 8 | frame 64 | largest step between two frames |
|---|---|---|---|---|---|
| before `levelRest`, high, window 1920x1080 | 189.11 | 200.39 | 191.42 | 187.47 | 11.28 (frame 1 to 2) |
| after `levelRest`, high, window 960x540 | 189.51 | 189.71 | not noted | 187.87 | 0.78 (frame 18) |
| medium, window 1920x1080 | 189.02 | 189.26 | 189.42 | 8 frames only | 0.24 |
| low, window 1920x1080 | 189.36 | 189.59 | 189.73 | 8 frames only | 0.23 |

MEASURED: the jump of 11 of 255 at the second frame is gone. NOT the same window size before and after: the after run was made at 960x540 to save time, so the two rows of high are not a strict pair. What remains, MEASURED: the gathered picture is about 1.6 of 255 darker than the one-sample picture, so when the page moves again the picture steps back by that much in one frame. Not removed. After the last gathered frame nothing is drawn, at every level.

## Glass (rule 2b)

MEASURED by reading the code and by counts: no live frame draws a transmission pass at any level; the perk cards, the fields and the boss's card are one material at every level. The ball is the only thing that bends. Pictures of the ball at low with the bend on and off (`scripts/glass-probe.mjs`, keys `rail-cam` and `last-save`), looked at: with the bend off the ball keeps its pale shell, its bright rim and its reflections, and the floor under it shows straight. It did not read as a grey slab in those two pictures. The cards at low against high and medium: the native crops of the proof sheets, looked at; I saw no difference in the glass of the cards between the levels, which is what the code says.

## Motion blur of small fast things (rule 3)

Two sheets of twelve live frames each, level high, stepped clock: `scripts/streak-sheet.mjs` (not in the repo), step 1 under fire and the slot's coins. Looked at.

- Step 1 under fire: bolts are in the frames, small and dark, each with its own short tail. The tail is the page's own, not mine.
- The slot's coins: coins are in the air in the frames. I could NOT see in the native crops that a coin is longer along its way than a coin at rest: the coins tumble and overlap, and I made no pair with the stretch off. So "the coins are stretched in a live frame" is STATED by the code and by `tests/site-levels-streak.test.ts` (the matrix of an instance is stretched along its travel), and UNKNOWN in the picture.
- The ball: not stretched (decision 12). The dart: carries its own tail, not looked at in a picture by me.

## Smallest type at `low` (rule 4, the part that was measured)

Native crops, 1920x1080 window, pixel ratio 1, of the smallest line of type of each page, at each level. The number is (background + 0.05) / (ink + 0.05) in relative luminance, the background as the 60th percentile and the ink as the 1st percentile of the crop. It is a measure of the darkest ink against the paper, not of how sharp a stroke is.

| page | line | high | medium | low |
|---|---|---|---|---|
| careers | "Est. time: 5 minutes ..." | 15.42 | 15.23 | 14.54 |
| step 1 | "Minimum 3 characters required" | 10.55 | 10.55 | 10.55 |
| step 2 | "Also collected automatically ..." | 14.62 | 14.62 | 14.66 |
| step 3 | "Toxicity Tolerance Assessment" and the lines under it | 16.87 | 16.87 | 16.87 |
| step 4 | "This verification process ..." | 12.14 | 12.05 | 12.14 |
| step 5 | "Your application is very important ..." | 11.39 | 11.39 | 11.47 |

The headless browser of this VM has a device pixel ratio of 1, so the cap of the pixel ratio (2, 1.5, 1) changed nothing in these pictures: the three levels were all drawn at ratio 1. What the cap does on a screen of ratio 2 or 3 is UNKNOWN here.

### The ragged shadow edge at `low`

Seen in the crops: at low the edge of the shadow under a card (step 1, step 4, step 5) is ragged, a row of small teeth about 25 pixels apart; at medium the teeth are there too, fainter.

Cause, MEASURED by a pair: the same edge of step 1 in a still at `live: low` (whole map, one sample, no kept shadows) shows the same teeth, so the kept map of `levelShadows.ts` is not the cause. The cause is the map itself: at 1024 px a texel of the map is about two pixels of the page, the depths are read without interpolation, and the map stood turned against the page (the light comes from the side and from above, and the map's upward axis was the world's), so the straight lower edge of a card crossed one row of texels every 25 pixels or so.

Repair, in `LightRig.aim` of `src/core/renderer.ts` (decision 13): for a live frame of a level that holds its light still (medium and low), the map is turned (its upward axis is the page's upward axis seen from the light) and sheared (`squareLean`) so that both axes of the page run along the rows and the columns of the map. An edge that lies square on the page then falls into one row of texels along its whole length. A computed picture never takes this path: `tests/site-levels-square.test.ts` holds that its map stays upright and unsheared, and the three stills and `npm run determinism` are byte equal after it.

MEASURED by looking at the same crops again (`scripts/proof-levels.mjs`, steps 1, 4, 5 at low and medium, 18:10Z): the teeth under the cards of step 1 and step 5 at low are gone; the edge is one straight line with fine grain. Step 4: the blobs of the old picture are gone; what stays under that card is an even grain, and the same grain is in the picture of `high` made before the change, so it is the one-sample filter of a frame that is not yet at rest, not the level. Edges that do not lie square on the page (round corners, the table's parts) still step at 1024 px: not looked at.

### The invalid pixels of `youre-fired` under 4x multisampling

`scripts/msaa-probe.mjs` and `scripts/msaa-where.mjs` (not in the repo): the still `youre-fired` drawn through `renderStill` with `live: <level>`, once in a live session (the engine has 4x multisampling there) and once in a capture session (no multisampling), hd.

- MEASURED 17:50Z: live session 3 invalid pixels at high, at medium and at low; capture session 0. The 188 of the open item were not reproduced as a number; the kind of fault was.
- Where, MEASURED by reading the 64x36 count picture the app itself reads: two blocks of 30x30 pixels, at x 1140 to 1170, y 240 to 270 and at x 900 to 930, y 150 to 180 of the 1920x1080 picture. Looked at in the capture picture: each block holds one screw head of the sign "You're Fired", a few pixels wide, of bright metal. So the material is the metal of the sign's screws. Which term of its shading goes wrong at a sample outside the triangle I did not find.
- Clamp, where the samples are resolved: `src/core/levelClamp.ts` draws two squares over the multisampled target of a live frame before it is resolved, one that keeps the larger of each sample and 0, one that keeps the smaller of each sample and `SAMPLE_MOST` (60000), by the blend equations MAX and MIN. Only an engine with multisampling has it, so no computed picture passes through it.
- MEASURED after, 18:12Z, the same probe: 0 invalid pixels at high and at low (medium not run again). Its cost, STATED: two draws of four triangles over the whole multisampled picture in every live frame; the time was not measured.

## The 8 bit path (rule 8)

`scripts/bits-probe.mjs` (not in the repo): one session with `EXT_color_buffer_float` hidden (target `half`), one with `EXT_color_buffer_float` and `EXT_color_buffer_half_float` hidden (target `byte`, read from `info().versions.target`), stills of the careers page, step 1 and the table's page (step 3) at rest, hd, tier draft, and the same three with `live: low`. `tests/site-levels-bits.test.ts` holds that a machine with both hidden gets `byte`.

| picture | mean of the half float picture | mean of the 8 bit picture | mean difference of 255 | pixels off by more than 8 |
|---|---|---|---|---|
| careers | 191.54 | 120.47 | 71.07 | 99.9 % |
| step 1 | 201.61 | 131.01 | 70.60 | 100 % |
| table | 204.52 | 140.09 | 64.42 | 100 % |
| careers, low | 189.17 | 116.45 | 72.71 | 99.9 % |
| step 1, low | 199.35 | 126.93 | 72.42 | 100 % |
| table, low | 201.92 | 135.37 | 66.56 | 100 % |

MEASURED: the 8 bit path does not give the same picture. It is far darker, every metal is black (the medal, the steps of the progress bar, the cabinet's ring) and the orange is a deep red. The browser's log of the 8 bit session: "Framebuffer is incomplete: Attachment is not renderable" and "glGenerateMipmap: Texture format does not support mipmap generation". Read in the code: `src/post/studio.ts` builds the studio's surround with three's `PMREMGenerator`, which draws into half float targets (`node_modules/three/src/extras/PMREMGenerator.js`, line 477); with both extensions hidden that target cannot be drawn into, so the surround is black. That this is the whole cause is my reading, not measured: `src/post/post.ts` also makes a half float target. Both files are not mine. NOT REPAIRED. The pair is in the looks folder.

## G15, the whole gate (rule 6)

`npm run gate -- --phase 5 --only G15`, started 17:52Z on commit c4695813, 1000.7 s: MEASURED pass. 6 pages (marketing, step1, step2, pinball, boss, decision), 94 pictures drawn through the live path.

| level | most triangles of any picture | limit | most draw calls | limit |
|---|---|---|---|---|
| high | 774135 | 3000000 | 492 | 600 |
| medium | 774135 | 1500000 | 311 | 450 |
| low | 555445 | 700000 | 241 | 300 |

Memory, the gate's own words: web at hd 692.0 of 700 MB on pinball; full at uhd 2045.7 of 2400 MB on pinball. The gate prints the most of each level, not a row per page; no page is over a limit.

What the gate does NOT see, STATED from the code: it draws through `Engine.picture`, so (1) the two targets of `levelRest.ts`, held at `high` only while a page at rest is gathered and freed when the last frame is in, each of the picture's size in half float (1920x1080x8 bytes, 16.6 MB at hd, 33.2 MB for both), and (2) the kept shadow map of `levelShadows.ts` at `low` (1024x1024 depth, about 4 MB). With 692.0 of 700 MB measured on pinball, the first of these would go over the limit on that page while it is held, if the gate counted it. Not measured in a live session. This is open.
