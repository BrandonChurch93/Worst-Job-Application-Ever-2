# The gate of Phase 3: notes of the gate builder

Branch `agent/gate`. Files: `tools/gate.mjs`, `tools/parts.mjs`, `tools/lib/gate-checks.mjs`, `tools/HARNESS-NOTES.md`, `src/capture/showcase.ts`, `tests/gate-checks.test.ts`, `tests/gate-measures.test.ts`, `tests/gate-record.test.ts`, this file, `pipeline/phase3/gate-NEEDS.patch`.

A fact is MEASURED (the command is given), STATED (read somewhere) or UNKNOWN.

## What is built

- G13 in `tools/gate.mjs`, from Phase 3, with `--unit ID`. The three tests are `standInTests` in `tools/lib/gate-checks.mjs`.
- G15, from Phase 3, every page, `--unit` narrows it.
- G16, from Phase 5.
- `info().textureMb` is counted from the textures the renderer holds, with `info().textures` saying how the number is made up.
- `stillState().type[].contrast` is read from the materials of the scene. Each run also gives `ink`, `ground` and `contrastFrom`.
- `npm run parts -- --record NAME --files a,b,c [--replace] [--at COMMIT,COMMIT]`.
- 54 tests in three files, none of which needs a browser.
- How each works and what it reads: `tools/HARNESS-NOTES.md`, from "gate: G13, stand-ins" down.

## Decisions

1. The stand-in commits. Your proposal was to record against `d0f83c8`. I record each file as it was at the latest of `729ee56`, `4b65361`, `d0f83c8` that holds it. Why: MEASURED with `git diff --stat d0f83c8 729ee56 -- src`, 29 files of `src/` changed between the two while every part stayed a stand-in (`src/shell/materials.ts`, `src/core/renderer.ts`, `src/stage/stage.ts` among them). Against `d0f83c8` a part held in one of those files would pass test 2 before anybody had made anything. `--at` names other commits when you want them.
2. A file that none of the stand-in commits holds is refused. A maker's own file that did not exist then cannot show the part changed. The stubs of the seam exist at `729ee56` and export null, so they are the right files to name.
3. The record is read from git, never from the working tree, and G13 makes it again from git each time. A hash typed into the register fails test 2.
4. Test 2 is stricter than "differs from the recorded hash" in two ways, both because the plain reading passed by accident. MEASURED with a script over `parts/PARTS.json` at `729ee56`: of the 53 recorded hashes, 46 already differed from their files at `d0f83c8`, the last commit of Phase 2, because the files changed after the hash was taken. And the four recorded cursor parts name `src/shell/blockout.ts`, which was renamed to `src/shell/view.ts` in `4b65361`, so their hash "differed" by a rename. So: a recorded file that is gone fails, and a record that names no commit fails when its files today are what they were at any stand-in commit.
5. The `standins` view is drawn with one sample a pixel and read exactly. With the draft tier, edge pixels are mixes, and reading mixes named three parts that no mesh carries (MEASURED, see the notes).
6. G15 covers every page, as the kit says. Your brief said "covering `step1`": `--unit step1` gives that. G15 opens the set `web` at hd for every level and the set `full` at uhd, the size the film is rendered at, for its textures.
7. G16 makes its own test of live mode on the clean build and does not use `opensCareersLive` of the host report, which asks for the flag `careers-page` and so turns false on the day the careers page is finished. `tools/hostcheck.mjs` is not mine: it wants that line changed before Phase 5.
8. The contrast is base colour against base colour. Light, shadow, tone curve and grade are not in it. A lit measure needs a rendered picture and belongs to a picture measure, not to `stillState`.
9. The pixel test of G13 reads the keys, sheets and judged stills of the unit, as your brief says, and also one moment a second of the unit's film time through the film's camera, with the frame in which the page first reports each part. The kit says "any judged still or frame", and a part can be on screen in the film and in no key: MEASURED, `slabs` is in no key or sheet of step 1 and shows 47001 flagged pixels in film frame 1916. The moments are drawn as stills with one sample a pixel, not as film frames, because a film frame is drawn with many samples and its edge mixes are read as other parts.

## Where the kit and the brief or the code differ

- The kit names the state `built`. `tools/lib/film-parts.mjs` names it `finished`. G13 takes both as states.
- The kit's test 2 says finishing a part always changes its files "if only because its stand-in flag is removed". With the seam of Phase 3 the flag is in `src/shell/view.ts` and the real part is in its own file, so the recorded files of 7 parts of step 1 need not change at all when the part is made. The records of all 16 parts of step 1 want to be taken again against the files the parts are now made in (commands below).
- G15 today: the levels of `live.quality` draw alike (`spec.live` only sets the samples), so every level is held to its own limit with the same counts.

## Found

- MEASURED, `npm run gate -- --phase 3 --only G15`: step 1 draws 303 draw calls in `step1-fire`, over `perf.maxDrawCalls.low` (300). The pinball page draws 1026 in `table-wide`, over every level's limit (600, 450, 300). Both are stand-ins. Triangles are far inside: 148758 at most against 700000.
- MEASURED, the same run: textures are 264.2 MB for `web` at hd and 564.8 MB for `full` at uhd, against 700 and 2400. On step 1 none of it is a picture: it is the engine's targets, the shadow maps (160 MB, the same at every size) and the reflection. `info().textures.step1.largest` lists them.
- MEASURED in Node with `stillState` on every key: on the pinball page `copy:step3.table.modes.1.insert` has a contrast of 1.22 (ink 0.040 on a ground of 0.060). The tone rule gave 9.44 because it skipped wells. M4 will be red on pinball stills until that run or its floor changes. On step 2 the panel runs read 5.22 where the tones gave 7.44.
- The note `out/work/build-info.json` was written by every load of the source in Node, so a stale `dist/` passed as current. In `gate-NEEDS.patch`.
- No code path reports `materials`, `light-engine`, `page-turn`, `cursor-effects` or `acting-step1`. For them G13 is tests 1 and 2 only.

## The gate of Phase 2 today

MEASURED, `npm run gate -- --phase 2` on this branch at 13:55 UTC: 15 of 17 checks pass, G1 to G12, G14, G17, G18 among them, and D2 and D3 fail. Neither failure is from this branch.

- D2: `out/preview-b.mp4` was rendered at `d0f83c8`. MEASURED with `engineHash` and `pageHashes` of `tools/lib/hashes.mjs` in a worktree at each commit: the record's engine hash `e6f9508050543b35` is that of `d0f83c8`, and it already differs at `4b65361`, at `729ee56` and on `origin/main` (`6c70661`), where step1 and pinball differ too. D2 stays red on every branch until the preview is rendered again from the build as it is.
- D3: `out/work/render-local/proof.json` is under `out/work/`, which git ignores, so it is not in a fresh clone. `npm run render:local -- --proof` makes it, and it also names the build it was made from.

## The records to take (for the Builder: `parts/` is not mine)

MEASURED on a copy of the register (`--register /tmp/PARTS.try.json`): each of these commands exits 0 and says the files today are the same as recorded, so test 2 fails until the owner changes the file.

```
npm run parts -- --record shell --files src/shell/real/ground.ts,src/shell/real/controls.ts --replace
npm run parts -- --record type --files src/shell/real/type.ts --replace
npm run parts -- --record materials --files src/shell/materials.ts
npm run parts -- --record light-engine --files src/post/studio.ts
npm run parts -- --record cursor-body --files src/cursor/model/body.ts --replace
npm run parts -- --record cursor-effects --files src/cursor/model/effects.ts
npm run parts -- --record cursor-acting --files src/cursor/act/acting.ts --replace
npm run parts -- --record cursor-damage --files src/cursor/act/damage.ts --replace
npm run parts -- --record cursor-arms --files src/cursor/act/arms.ts --replace
npm run parts -- --record keyboard --files src/pages/step1/real/keyboard.ts --replace
npm run parts -- --record turrets --files src/pages/step1/real/turrets.ts --replace
npm run parts -- --record slabs --files src/pages/step1/real/slabs.ts --replace
npm run parts -- --record paper --files src/pages/step1/real/paper.ts --replace
npm run parts -- --record shredder --files src/pages/step1/real/shredder.ts --replace
npm run parts -- --record acting-step1 --files src/pages/step1/script.ts
```

The file lists are my reading of the seam, and you know each owner's files: change a list where the part is made elsewhere. `page-turn` has no line because I found no file that holds it outside `src/stage/stage.ts`: UNKNOWN, yours to name. Run them before the owners' branches are merged or after, the result is the same: the bytes come from the stand-in commits.

## The approved images: what a quick look misses

Read at full size from `references/approved/page-look.png` (crops at three times, and pixel values read with PIL: MEASURED, sRGB codes).

1. Where the highlight sits. The light comes from the upper left, so a pocket is lit on its lower and right lip (212, 218, 214 against the paper's 182, 188, 188) and shaded on its upper and left wall (133, 140, 138). On a raised thing it is a soft band along the upper shoulder, never a spot, and the shadow falls to the lower right.
2. How wide the bevel is. The rim of a field is about 3 to 4 px at 1920: a dark inner wall and a bright lip side by side. The button's satin bezel is about 8 to 9 px, and the orange cap rolls over about 10 to 12 px before it is flat.
3. How dark the gap is. Between cap and bezel lies a gap of about 2 px, near (92, 89, 84) at its darkest under the button. The darkest thing in the picture is the contact shadow beside dot 1 (56, 45, 41), and it is warm, not grey. Nothing is black.
4. What the edge does. No edge is a line. Every edge is rounded and carries a thin light line on the side that faces the light. A shadow is tight where the part meets the paper and widens as it leaves it, and near an orange part the paper takes some orange.
5. What the floor does. The floor of a field has the paper's value (182, 187, 183): a little cooler and smoother, not darker. A pocket reads by its rim alone. The stand-in tone for a pocket is darker than that, which is one reason the contrast is now read from the materials.

## Not done

- G13 reads the pixels of one film moment a second, not of every film frame. Between two moments it has the page's word in every frame of the preview rate. A still is never drawn in the middle of a page turn, so the frames of a turn have the page's word only.
- The texture count cannot read one texture of the renderer, the target it keeps for materials that let light through (three 0.187, `transmissionRenderTarget`; `src/shell/materials.ts` has a material with `transmission: 1`). It is counted at the size of the picture, half float, with a full chain: 21.1 MB at hd, 84.4 at uhd.
- The contrast does not read a colour picture that is an image or a canvas, only one made of numbers. Such a material is read by its colour alone.
