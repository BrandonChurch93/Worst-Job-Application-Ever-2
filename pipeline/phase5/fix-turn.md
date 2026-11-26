# fix-turn: the page turn (dark triangles, shimmer, seat)

Branch `agent/fix-turn`, from `origin/main` dc83c2d0. Times are UTC, 26 Nov 2026, read with `date -u`.

Files edited: `src/shell/view.ts`, `src/core/renderer.ts`, `src/stage/turn.ts`. `src/core/levelShadows.ts` not edited. No file outside the brief's list needed a change, so there is no NEEDS patch.
Tests: new `tests/fix-turn.test.ts`; in `tests/stage-turn.test.ts` only two numbers my work changes (speed at the seat, depth of the first knock).

## 1. What was seen (before, `origin/main`)

MEASURED, `npm run seq -- --first 846 --last 869 --tier draft --force` in a clean worktree of `origin/main`, frames looked at at 960 by 540:
- frames 846 to 856: two black triangles in the lower corners of the resume tray, a hard band across the page under it, and rings of moire in the grain below the band.
- frame 857 to 858: the mean of a plain patch of the page (x 300 to 700, y 440 to 520) jumps from 192.5 to 212.4 in one frame, the band switching off.
- frames 4026 to 4037 (into step 3): rings of moire in the grain right of the cursor, clearest at 4031.

## 2. The cause

STATED from the code, and MEASURED that the faults are gone when it is removed:
the slab was turned for real in the scene (`pivot.rotation.x = f.turn` in `src/shell/view.ts`), but everything that shades a page takes the scene's own axes to be the page's axes:
- `patchHeights` in `src/post/studio.ts` squeezes the scene's z above a knee in the shadow depth pass. On a tilted slab the knee cuts through the face as a line (the band), and big triangles such as the glass of the tray get depths that do not match their neighbours (the black triangles).
- the fit of the shadow map in `aim()` (`src/core/renderer.ts`) is made for bounds that lie flat, so the map was coarse and its depths wrong on the tilted face (acne and rings).
- the page materials take their grain from the scene's x and y (`wjaAt`), so the grain slid across the face as it turned and beat against the pixel grid (the shimmer).
Which of the three made which mark was not taken apart one by one: UNKNOWN beyond the above.

## 3. The mend (decision)

The slab now lies still in the scene for the whole turn. What turns is whoever looks at it and lights it, the other way, about the same axis: the camera, the key and dome lights, the point the key's falloff is measured from, and the studio environment. Seen from the slab that is the same picture, and every rule that holds for a flat page holds in every frame of the turn.
- `view.ts`: the pivot is no longer rotated; the page writes `scene.userData.turn = { angle, y }`. The cursors, which stay with the camera as before, sit in a group that is turned back by the same angle.
- `renderer.ts`: `slabTurn(scene)`; `LightRig.setTurn` and `round()` turn the light directions and the falloff point; `aim()` while turning fits the map to the whole box of the bounds and lets the shadow bias grow for a grazing light (`GRAZE`, named in the file); `Engine.sample` turns the camera and `scene.environmentRotation` for the draw and puts them back.
- A flat page takes the old path untouched: `slabTurn` gives null when the angle is under 1e-6.

## 4. The seat

- `TURN.land = 0.8`: the slab meets the seat at 0.8 of the speed of the hand over (was a coast down to between 0.2 and 0.8). MEASURED in `tests/fix-turn.test.ts`: the last three 60 fps frames before the seat cover 5.0, 5.3 and 5.8 degrees, then the angle is 0.
- knocks 1.5 and 0.4 degrees became 6 and 1.8 degrees, same lengths (0.22 and 0.12 of the half turn). 3 and 4.5 degrees were tried first and gave a pulse of 3.5 and 4.5 percent.
- `TURN.seat` stays 0.6, `seatedAt()` is unchanged, the length of the turn is unchanged, the shiver still starts at the seat. The time of the seat was not moved.

## 5. What the pictures show (after)

MEASURED, `npm run seq -- --first 846 --last 869 --tier draft --force` and `--first 4026 --last 4049`, every frame looked at at 960 by 540 and in real size crops:
- no triangle, no band and no ring of moire in any of the 48 frames. The tray, the fields, the type and the funnel keep their shading and their shadows.
- the plain patch of the page (x 300 to 700, y 440 to 520), frames 852 to 858: 246.4, 245.2, 243.1, 239.4, 233.0, 222.8, 214.1. It falls without a jump to the flat value. Before it ran 219.9 down to 192.5 and jumped to 212.4.
- the page is brighter than flat while it comes in, because its face is then turned toward the key light (the key comes from above: direction -0.65, 0.6, 0.36). For about six frames the plain face is close to white (246 of 255) and its grain is faint. That is the light the kit sets falling on a tilted face; I did not cap it. STATED, from the direction of the key.
- the seat: the top of the page moves 14, 8, 3 px in frames 855, 856, 857 against the flat page and is at rest in 858 (960 wide; double at 1920).
- the knock, frames 859 to 863: the patch goes 214.1, 221.2, 225.1, 226.3, 225.2, 221.7, 214.9 (a pulse of 5.7 percent of the flat value over five frames) and the top of the page moves 2, 4, 4, 4, 2 px at 960 wide. The slab is 5.95 degrees off flat at its deepest, in frame 861.
- the shiver starts in frame 858, the frame of the seat: the cards stand off the page with their shadows in 858 as in the before frames.
- leaving step 2 (frames 3990 to 4019, rendered with the 3 degree knock, the leave is not touched by the knock): the page darkens evenly as it turns from the key, the shadows grow long, no acne seen. At 4009 the long shadows of the step lamps are a little streaky.

## 6. Seen and not mine, not mended

- Into step 3 the front of the pinball cabinet (the skyline) shows under the lower edge of the slab while it is tilted. It is there on `origin/main` too (frames 4026 to 4030). With the slab now fast into the seat it shows until 4033. The kit says nothing but the edge and a dark backing shows round a page. The cause is not in the turn: the cabinet hangs below the fold of the page. Not mended.
- The shadow of the cursor during a turn falls on the tilted slab away from the cursor, since the cursor stays with the camera, as it did before.

## 7. Memory

STATED from the diff: the mend adds no render target and no shadow map, and changes the size of none. `aim()` only changes the fit, the near and far planes and the bias of the maps that exist.

## 8. Second pass (after the Builder's reading of the first, 20:46 to 21:10)

1. The cabinet under the slab into step 3. Cause, STATED from the code: `view.ts` already leaves out, while a page turns, what lies wholly below the fold (`s.y > top + tall`), but the marquee's anchor starts exactly on the fold (y 1080), so it was drawn. Mend, in `view.ts` only: while the slab is tilted further than the deepest knock (`TURN.knocks[0].size`, 6 degrees), what starts on the fold is left out as well. Within the knock's reach nothing changes, because the marquee throws a wedge of shadow on the lower right corner of the page (MEASURED: with the marquee left out in the knock frames as well, about 2000 pixels differed in rows 506 to 539, columns 827 to 958 of each of 4038 to 4048).
   MEASURED: frames 4026 to 4040 looked at, no cabinet in any; frames 4038 to 4048 `cmp` byte equal with the switch and without it (11 of 11 SAME); still `table-wide` byte equal to main's.
   Left: the wedge of shadow comes on between 4036 and 4037 (11 to 5.8 degrees of tilt). The tube of the loader crosses the fold and is still drawn over the slab's lower edge, as on main.
2. The white page. Decision: not a plain factor. A factor small enough to hold the page under 8 percent would also flatten the pulse of the knock and the darkening of a leaving page. Instead the lights follow the turn in full when the face turns from the key (positive angle), and when it turns toward the key they follow by `TOWARD * tanh(angle / TOWARD)`, `TOWARD` = 8 degrees, named in `renderer.ts` (8.5 was tried first: peak 232.1). Camera and environment follow in full as before.
   MEASURED, same patch, frames 846 to 858: 74.7, 117.2, 153.3, 186.2, 212.4, 231.2, 231.4, 231.4, 231.1, 230.3, 228.2, 221.9, 214.0. Peak 231.4, 8.1 percent over the flat 214.0. (846 to 849 are low because at that tilt the patch lies partly off the face.) Knock, 859 to 864: 220.7, 223.7, 224.5, 223.8, 221.1, 214.9, a pulse of 4.9 percent; top of the page 2, 4, 4, 4, 2 px at 960 wide. Grain is seen in the real size crop of 853.
   Step 3, patch x 300 to 700, y 250 to 330, frames 4026 to 4038: 230.5 up to 232.4 at 4033, then 230.0, 225.1, 218.5; flat 216.6. Peak 7.3 percent over flat.
3. The leave of step 2, frames 4003 to 4014, rendered with the 6 degree knock and `TOWARD` 8.5 (a leaving page has positive angles, which `TOWARD` does not touch): the page darkens evenly frame by frame. 4006 to 4008 show the long shadows of the step lamps lying slantwise over the page as the key grazes it. At 4009 in real size the grain stands out in relief under the raking light and one soft slanting streak is left at the upper right; no acne, type sharp.
4. Live turn, marketing to step 1, 16 frames at 1/15 s per level, levels high, medium and low forced with `quality=`, on the first pass build 7ca28835 (lights in full follow, before `TOWARD` and the fold rule): MEASURED, looked at as sheets of 16: no triangle and no band at any level, the leaving page darkens evenly, the arriving page was near white as in the film then. Not captured again on the last build: UNKNOWN for `TOWARD` in the live site, though it is the same code path.
5. Seen in the after frames at draft tier: the shadow of the cursor on the turning slab shows as two blobs in 4026 to 4033. The cursor stays with the camera while the slab moves under it, so its shadow slides fast and the two shutter samples of the draft tier land apart. Not mended. UNKNOWN at final tier.
6. G15 not run, by the Builder's word. The diff adds no render target and no shadow map and changes the size of none.
7. Live turn on the last build (ecb5ddf2), level medium only, 16 frames at 1/15 s, `quality=medium`, bot keen: MEASURED, looked at as a sheet: no triangle, no band, the leaving page darkens evenly, the arriving page is cream and not white. Mean of a plain strip at the foot of the page (x 600 to 1400, y 880 to 1040 at 1920 by 1080), frames 9 to 15: 223.2, 229.2, 215.5, 220.6, 213.7, 209.4, 209.4. Peak 9.5 percent over the flat 209.4 on that strip, which is nearer the camera than the film's patch. High and low on the last build: UNKNOWN.
8. Checks on ecb5ddf2 (MEASURED): three stills `cmp` byte equal to main's; `npm run determinism` pass, 12 pictures; `npm run bots` all clear; `npm test` 141 files, 1768 tests passed; `npx tsc --noEmit -p .` exit 0, run last. Pushed as d1e37afb (merge of main fdaf7c8e, which brought no change under `src`, `tests`, `tools` or `config`).
