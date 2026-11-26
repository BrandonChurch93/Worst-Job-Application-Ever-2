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
