# The machine's two red measures at the final tier, and the foot of the clear tube

Branch `agent/polish-sharp`, from `b3e4f902`. Files changed: `src/table/real/ball/index.ts`, `src/table/real/frame/steel.ts`, `src/table/real/frame/loader.ts`, `src/table/real/frame/geo.ts`, `tests/polish-sharp.test.ts`, `pipeline/phase5/polish-sharp-look.mjs`, this file. Outside my files, as `pipeline/phase5/polish-sharp-NEEDS.patch` and two commits whose subject starts with `NEEDS:`: `src/diagnostics/views.ts`, `src/diagnostics/NOTES.md`.

How the pictures were read: `node pipeline/phase5/polish-sharp-look.mjs texels BEAUTY TEXELS APPROVED OUT` counts what M2 counts and draws the three maps; `node pipeline/phase5/polish-sharp-look.mjs detail BEAUTY APPROVED OUT [BEFORE]` gives M3's ratio whole and per block of 32 px. Stills: `npm run still -- --key K --format hd --tier T [--diag texels]`.

## M2 at `youre-fired`

- MEASURED before (final, hd): 2,073,600 pixels, 55,991 textured, 1 counted (blur circle under 1.5 px), 1 soft. The measure stood on one pixel.
- The cause: the `texels` view repaints every mesh opaque. The ball's shadow (`ball.shadow`, a clear quad about 500 px square on the floor) hid the printed floor under the ball, which is the only textured surface inside the lens's sharp range, and was itself counted as bare. The firehouse and the bank are painted by rule in the shader and carry no picture: they are rightly untextured.
- The mend: the shadow carries `userData.texels = 'through'`, and the view leaves a mesh with that mark out (NEEDS patch, accepted by the Builder 08:53 UTC on terms: the mark on `ball.shadow` alone, pinned by a test, two lines in the notes of the views).
- MEASURED after (final, hd): 337,386 textured, 254,134 counted, 741 soft, a share of 0.0029 against a limit of 0.02.
- No texture was added or enlarged. No lens number was changed.
- MEASURED, the floor's density inside the sharp range at `youre-fired` (texels per pixel, limit 1.0): hd 1920x1080: least 0.54, 5th hundredth 1.08, middle 1.17, 95th hundredth 1.29, most 1.31. uhd 3840x2160 (`npm run still -- --key youre-fired --format uhd --tier final --diag texels`): 1,349,261 textured, 788,613 counted, 788,613 soft, a share of 1.0; least 0.27, 5th hundredth 0.54, middle 0.58, 95th hundredth 0.61, most 0.61. At the master's size the full set's floor (8192x4608) is under the limit everywhere in focus. Nothing is mended for that here: the film is drawn at 1920x1080.
- Not marked, and UNKNOWN in pixels: other clear meshes that lie over the printed floor and are repainted bare by the view: the pools of light `corporate.glow.<zone>` and `office.glow.<zone>` (STATED, from the code). Counting them takes the `texels` view twice per still, with and without each.

## M3 at `rail-cam`

- MEASURED before (final, hd): build 1.848e-3, approved 3.444e-3, ratio 0.537. The approved picture holds 60 % of its fine detail in the ball and the wires at the middle of the frame; the build's wires there were a broad pale core with soft dark edges.
- The mend: a polished wire that is wide on the screen shows the room as hard lines along it, as the approved picture's chrome does: the panel overhead as a bright crown, a warm line of the lamps down each flank, the dark of the room between (`MIRROR` in `src/table/real/frame/steel.ts`). The lines are cut in the mirrored ray's height with an edge one pixel wide, so they do not crawl. A wire further off than `MIRROR.near` page pixels to a screen pixel is drawn as before.
- MEASURED after (final, hd): build 3.275e-3, ratio 0.951.
- By region (shares of the approved picture's whole detail): x 640 to 960, y 540 to 810: approved 0.278, build 0.198 (before 0.127); x 960 to 1280, y 540 to 810: approved 0.319, build 0.178 (before 0.102). The ball is not changed: it is still hazier than the approved picture's, and what lifts the whole number is the wires. The next step, if the ball's own share is wanted, is harder glints in the glass (`src/table/real/ball/glsl.ts`), which every key of the machine would show.
- No texture was added or enlarged.

## The foot of the clear tube on the first screen

- Before: the feed tube's corner under the first screen (rail point 1627, 1094.4) was rounded over 105.6 px, so the bend began at page y 989 and the middle line stood 17 px to the right at the screen's lower edge. The shadow of the slanted run was laid square to it and reached up into the first screen, and the shadow under the edge began at nothing and eased in over 40 px: the wedge and its hard edge.
- The mend, in `loader.ts`: the corner is rounded no further up than 1 px under the screen's lower edge (`FOOT`), so the middle line is straight to y 1080. The rail's places are not touched. The collars further down stand where they stood (`line(false, true)` gives the old line's length). Under the edge the shadow goes on as the first screen's last row lies and turns to the lamp's way over 60 px of tube, as dark from the first as that row; a row whose foot would step back inside the bend keeps the foot before it. The inside of the tight bend is one clean edge (`crease` in `Geo.pipe`).
- What stays: the tube is 106 px wide (`TUBE.outer` 53) because it holds the 96 px ball with a wall; the approved picture's is about 85 px (MEASURED on the picture, rows 1040 and 1076). The Builder agreed 08:53 UTC.
- What stays, and why: the two straight runs of a tube 106 px wide meet inside the bend at page y 1071, 9 px over the screen's edge, because the rail's corner lies 14.4 px under it. In the still it is a dark dot about 4 px high at the tube's right wall on the last rows. To put it under the edge the rail's corner would have to lie 10 px lower, which is the rail's place and the film's take.

## The ten draft stills, before (b3e4f902) and after, hd

- Changed: `rail-cam` (126,980 pixels: the wires), `youre-fired` (16,057: the close wire at the lower right), `loader-page` (24,396: the tube's foot and its shadow), `table-wide` (3,490, x 1164 to 1342, y 154 to 223: the feed tube's elbow under the cabinet is tighter, the same change as the foot), `lobby-doors` (203 at the right edge, x 1908 to 1919, the greatest difference 14 of 255).
- Equal in every pixel: `last-save`, `tier-office`, `tier-street`, `tier-corporate`, `reply-all`.
- The sheet `clear-ball`: 9,883 pixels, y 0 to 128, the blurred wires behind; the ball itself is equal.

## The ball's drawn shadow while the ball is in the feed tube (asked 09:34 UTC, as a patch only)

- Seen in film frames 4260 and 4262 (draft, hd): a dark smudge left of the tube beside the ball at the elbow. The Builder saw the same on the base.
- The cause, STATED from the code: `own.decal.visible = L.tier && lift < r * 6` in `src/table/real/ball/index.ts`. `L.tier` is true as soon as the ball's middle is in a zone that has lamps, which begins at page y 1080, while the ball is still in the tube. The shadow lies on the floor under the ball, so it shows where the floor beside the tube is in sight and is hidden where the tube runs over the housing: that is why it is seen for a few frames and then goes.
- MEASURED from the film's take without a browser (`SHADOW_TRACE=1 npx vitest run tests/polish-sharp-shadow.test.ts` with the patch): the shadow was on with the ball in the tube in film frames 4259 to 4536 (3.983 s to 8.6 s of the machine's unit). With the patch it comes on at frame 4537, the ball's middle within a quarter ball of the rail's last point.
- The patch: `pipeline/phase5/polish-sharp-NEEDS-shadow.patch`, on this branch's head (it uses `line` of `loader.ts` as this branch exports it). It adds `piped(x, y, z)` to the ball's file: true when the ball's middle is inside the bore of the feed tube; the shadow is off there. It holds its test, `tests/polish-sharp-shadow.test.ts`. It is NOT applied on this branch: the long measure was running on the frozen source.
- UNKNOWN: which of frames 4259 to 4536 change as pictures (no browser was free). The key `table-wide` stands at 7.6 s, inside that span, so its still can change.
- The drain tube is not handled by the patch.

## Decisions

- The texels view is mended by a mark and not by a brick picture baked for the firehouse.
- The wires get lines only when wide on the screen: far off they would shimmer.
- The tube keeps its width.
- G15 is not run: no texture's size changed (`tests/polish-sharp.test.ts` pins every size in both sets).
