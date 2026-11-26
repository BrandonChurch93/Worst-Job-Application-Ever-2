# The quality levels of the live site: notes of the build agent `site_levels`

Part `quality-levels` (kit/03-METHOD.md, section 14). Branch `agent/site-levels`.
Every number below is MEASURED with the command beside it, STATED by the code or the kit, or UNKNOWN.

## What each level does, and where

| word of `live.quality` | read by | what it does |
|---|---|---|
| `softShadows: accumulated at rest` | `src/core/levelPlan.ts`, `Engine.frame` | a page at rest gathers 64 frames, the light moved over its area as in a computed picture |
| `softShadows: filtered` | the same | the light never moves: one sample with the filtered lookup; a page at rest gathers 8 frames in which only the taps of the filter turn, then the picture is kept and nothing is drawn |
| `softShadows: baked` | the same and `src/core/levelShadows.ts` | as `filtered`, and the shadows of what stands still are drawn once into the key's map and kept; only what moves is drawn into the map of each frame |
| `glass` | `src/core/levelPlan.ts` | see "Glass" |
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

## G15: the counts of a live frame at each level (first table, before any lowering)

`info().counts` after `renderStill` with `live: <level>`, hd, assets full. Limits of `perf`: triangles 3000000, 1500000, 700000; draw calls 600, 450, 300.

| key | high | medium | low |
|---|---|---|---|
| rail-cam | 1087148 / 316 | 743645 / 217 | 270935 / 89 |
| last-save | 1484876 / 449 | 1078698 / 342 | 510046 / 188 |
| boss-fight | 618218 / 455 | 469526 / 383 | 250608 / 241 |
| boss-down | 620840 / 394 | 456110 / 322 | 223076 / 181 |
| decision | 539181 / 285 | 385689 / 201 | 191059 / 92 |
| step2-crank | 888565 / **814** | 604601 / **512** | 293243 / 172 |

MEASURED over the limit: step2-crank, draw calls, at high (814 of 600) and medium (512 of 450). Every other key and every page at rest is inside. Not lowered yet.

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
