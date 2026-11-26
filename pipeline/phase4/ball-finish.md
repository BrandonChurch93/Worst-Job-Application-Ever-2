# ball-finish: the clear ball and the displays

Owner `/root/ball_finisher`, branch `agent/ball-finish`. Parts `clear-ball`, `displays`. Earlier notes read: `ball-fix.md`, `ball-displays.md`.

## What the approved images hold in my part that a quick look misses

1. `clear-ball`, all three panels: the glass has no drawn line in it. Its rim is a soft band of bent floor that changes all the way round: dark teal where it bends the floor, a broad pale wash where it bends a lamp, and the inner wall shows as a second, offset edge only on part of the way round. Nothing in it repeats as a ring.
2. `clear-ball`, `last-save`: the lights in the ball are soft warm blobs, three to six of them, each a few percent of the disc, pressed against the rim on the side of a lamp and stretched along it. There is no window with a bar and no hard pinpoint except two or three tiny glints.
3. `lobby-doors`: the shadow is the largest thing the ball owns. It is two balls long, falls down the page toward the camera and a little left, is dense at the foot and soft at its end, and the gathered light is one small warm spot inside it, close to the foot.
4. `clear-ball` third panel, `youre-fired`: the arrow is ivory and matte with a soft sheen, the brightest thing in the ball, and its dark side wall shows as a band on the side away from the camera. The glass crosses in front of it only as one or two soft blobs.
5. `clear-ball` third panel: the struck ball is round. Nothing of the glass is cut or flattened: what tells the hit is the arrow, bent and thrown against the wall, and the bumper's light in the rim on that side. `table-wide`: the display carries six whole numerals with a glow that lies on the glass.

## Baseline before my first change

MEASURED on `origin/main` cfd83123 at 10:05 UTC: `npm test` 115 files, 1461 of 1461. `npm run build` built. `npm run bots` all clear ("keen reached every one of the 37 gags on every seed").

MEASURED 10:05 UTC with `npm run build && npm run counts -- --key table-wide --live low`:

| key | part | meshes | colour | shadow | calls | triangles |
| --- | --- | --- | --- | --- | --- | --- |
| table-wide | clear-ball | 2 | 2 | 0 | 2 | 18872 |
| table-wide | displays | 8 | 8 | 0 | 8 | 328 |

`table-wide` whole frame: 201 draw calls against 300.

## The issues of round 12 that are mine and still true on main (10:15 UTC)

Seen on cfd83123 at `draft`: the sheet `clear-ball`, and `lobby-doors`, `youre-fired`, `last-save` beside approved, each with the ball cropped at its real size.

Severe:
- R1-1 issue 3, sheet, all panels: "The spheres read as clear graphic outlines with repeated rims, over relatively flat and sparsely reflected surfaces." TRUE. The rim is three to five even concentric lines, the body has no bent floor in it, and the highlight is a window with a bar.
- R1-1 issue 2, sheet, right panel: "The arrow reads as another straight, hard, mostly matte pointer; the target is visibly warped and pinched". TRUE for the arrow (the acting's and the body's). In my part: the ball is drawn as a flat disc cut on one side, where approved keeps it round.

Major:
- R1-2 issue 8, `lobby-doors`: "a bright red glowing pool beneath and inside the ball; -a grounds the ball with a big soft dark cast shadow and one small warm highlight". TRUE: no dark shadow, three pale blobs on the carpet.
- R1-5 issue 7 and 12, `last-save`: "the build's ball is a flattened grey smear of glass and its cursor is grey metal with a black edge". Half true now: the ball is round in this still, the glass is a ring of lines, the arrow is grey beside approved's ivory.
- R1-5 issue 5, `rail-cam`: "the ball carries an inset rectangular panel and small text". TRUE as far as the window highlight goes: it reads as a panel. Not rendered yet at this key.
- R1-4 issue 6, `tier-street` crop: "the ball's interior reads dark and speckled with sparkles, so the cursor is grey and low-contrast". TRUE in the sheet's left panel (the drops) and in `youre-fired` (a dark far wall).
- R3-1 issue 3, `lobby-doors`: "the arrow itself looks more like an icon than a solid piece inside it". TRUE: the face is one flat grey, no reflection of the glass crosses it.
- R1-1 issue 16, sheet, left panel: "Dense pinpoints in the sphere". TRUE: about forty bright ringed drops over the whole ball where approved has about ten small ones in one patch.
- R1-1 issue 6 and 15, R1-2 issue 12: the arrow "dim, gray and edge-heavy". TRUE for grey. The edge is the body's.
- R8-2 issue 2, `last-save`: the amber readout "shows a cut-off message". TRUE: the display shows the start of a line running in, cut at the right.
- R8-1 issue 7, `tier-corporate`: "only one glyph". Not rendered yet, the same cause.

Minor:
- R3-2 issue 6: the third ball "still almost round". Stands against R1-1 issue 2 and the approved image: settled below.

## The one diagnosis of the grey arrow (10:16 UTC)

SEEN in one run, `node assets-src/table/ball/diag.mjs --keys lobby-doors --variants noshell,loud,loudz --tier draft --box 783,480,600,600 --size 600 --noref`:

- With the shells not drawn (`noshell`) the arrow is the same mid grey with the same heavy black side. So the grey is not the tint of the glass and not the droplets. It is the light that reaches the arrow inside the ball: my `sealed` lamp, whose level `INSIDE.most` 0.6 held the ivory face near sRGB 150 where approved is 175 to 225.
- The black side is the arrow's own body, seen edge-on because of how the arrow is turned. Not mine: told `/root/machine_finisher` and `/root`.
- With the shadow painted loud (`loud`, `loudz`) the shadow is drawn and is not hidden by the carpet. MEASURED on the stills with a pixel read: the carpet in it is sRGB 58 against 113 beside it. It was aimed by a rule of my own (`KEY_AWAY`, turned from the door in the lobby) and not by the tier's head lamps, so it fell where the frame does not show it.

## Decisions (first pass, 10:20 to 10:50 UTC)

1. The arrow's light: `INSIDE` now `{ key: 2.6, fill: 0.6, lamps: 0.12, face: 1.6, least: 0.85, most: 1.0 }`. The face reads ivory white in the sheet and at `lobby-doors`, `youre-fired`.
2. The glass is painted without any ring that repeats: the concentric `rings`, the `inner` waves, the four thin arcs and the window with its bar are gone from `glsl.ts`. What is left is the bent floor in the wall, uneven round the angle, one feathered patch of the room's light with a short bright arc in the rim, one fine line on the inner wall on the lit side, a soft dark edge, and one reflection for each lamp.
3. The wall is thicker: `RIN` 0.84 (was 0.875), now set in `glsl.ts` and passed on by `index.ts`. The arrow's limit in the tests is 40 px of 48, inside it.
4. Drops: `DROPS` 22 (was 64), smaller, with less shine. That also takes 3360 triangles off the ball.
5. The shadow follows the tier's head lamps: the decal reads `keyOf(zone).toward` from `src/table/real/lights/key.ts`, so it falls the way every other shadow of the tier falls. It is larger and softer, and it carries one warm highlight in the lamps' own colour; the two spots of the low lamps are gone, their shadows are kept faint. AGREED with `/root/lamp_finisher` (10:21 UTC): its hook keeps cutting the key light under the ball by `SHADOW.clear` 0.4 and drops its own spot (`SHADOW.spot` 0 on `agent/lamp-finish`), so there is one highlight and it is mine. Its key turns to `unit(0.3, 0.58, 0.95)` on all tiers this round; my decal follows on the merge. The decal never reads shorter than a slant of 1.2, because approved shows a long shadow.
6. A hit: the glass stays round. `SQUASH` is `{ cut: 0, thin: 0.05, wide: 0.02 }` (was 0.6, 0.35, 0.25). The glass shows the hit only as a glint in the rim on the struck side. R3-2 issue 6 ("still almost round") is set aside: the approved sheet and R1-1 issue 2 stand against it. TOLD `/root/machine_finisher` at 10:27 UTC that the arrow must carry the blow and stay inside 0.84 of the radius.
7. Displays: a line no longer runs through the grid dot by dot. It is shown a page at a time (`pagesOf`), each page whole words alone, centred, at twice the size where the words fit, and a word too long for that on a page of its own at its own size. A page stands `PACE.page` 0.9 s (54 frames of the film). No moment shows a lone letter or a cut word. `modeSeconds` and `scrollSeconds` keep their names, so `pick.ts` is untouched.

8. The wall as drawn and the bore are two numbers: `WALL` 0.84 (in `glsl.ts`: the inner wall of the picture, the cut faces, the drops) and `RIN` 0.875 (the bore the arrow is fitted to, pinned by `tests/cursor-fit.test.ts` to `BORE.wall` in `src/cursor/model/`, which is not mine). The arrow never lies in the drawn wall: MEASURED by `/root/machine_finisher`, its furthest corner is 0.81 of the radius.
9. Round 12's film issues that are mine (from `/root`, 10:33 UTC). R4-3 issues 5 and 6 (a pinched blob for two frames, a dark opening): SEEN after decision 6 in `node assets-src/table/ball/hit.mjs --frame 5013 --count 6 --step 1 --size 300`, film frames 5011 to 5016 across the bumper hit of 5010: the ball is a whole round sphere on each frame. R9-1 issues 1 and 3, R9-2 issue 6 (the arrow lost in the glass): the far wall now lays a dark ground behind the arrow (0.3 of the scene behind is taken away in the middle of the ball, none at the wall), the arrow's own light is up (decision 1), and the shell has a rim of light (the `lip` in `frontFragment`). The firmer black edge is the body's, not mine.

## Decisions (second pass, 10:48 to 11:15 UTC, times from `date -u`)

10. The glass, measured beside approved. MEASURED with a ring read of both sheets (mean brightness of twelve spokes at each share of the radius, sRGB): the approved balls are not brighter than mine on the mean (about 100 at the wall, 60 to 80 inside); what they have is range, 50 beside 240 on one ring, and no colour of their own. So: the tier's tint is taken out of the glass (`plain()` in `glsl.ts`: the room's light, the floor's bounce and the surround are read three parts neutral, a hair warm); the wall holds five soft arcs of different length, width and share of the radius (`arc()`), placed from the light's side and shifted by where the ball stands on the floor, so no two balls and no two places show the same set; one window of the room on the outer wall (`window()`, feathered, no bar); a crescent in the wall toward the light, broken by the streak; a warm pool inside on the far side (back shell); the lamps as blobs stretched along the rim. The even pale ring of the first pass is gone.
11. A long word on a display. A word too long for twice the size (`Micromanagement.`) was a small dim line. It is now as wide as it is set and twice as tall (`tall()` in `screen.ts`), in the held name as well as on its page: it fills the display and is as bright as the pages beside it. SEEN at `tier-corporate`. The halo on the glass is up by about four tenths.
12. The speed streak asked by R4-3 issue 5 is NOT built. The ball's shape carries no speed (`v` holds closed, since, sweat, hit strength, hit angle, since hit), `pose` may keep no memory, and `src/table/draw.ts` is frozen. The first half of that issue (a rigid sphere on every frame) is done. R4-3 issue 6 (the dark opening at 1:25.40): SEEN in `node assets-src/table/ball/hit.mjs --frame 5123 --count 5 --step 1 --size 300`, film frames 5121 to 5125: a whole round shell and a whole arrow on each frame.
13. TOLD `/root/look_finisher` (11:11 UTC, owner of the arrow's body): a thinner black side at low cameras (ruling 0.045 of the arrow's height), a face no darker than now, a narrow highlight on the bevel welcome, `RIN` stays pinned to `BORE.wall`.

## Tuning looks, by part

Counted strictly, one for each still or row of film frames, all `draft` but one `review`. `clear-ball`: 20 by 10:46 UTC (first pass, as reported); 22 (sheet, `youre-fired`); 25 (sheet, `last-save`, `lobby-doors`); 28 (the same three); 29 (film frames 5121 to 5125); 31, 33, 35, 37 (sheet and `lobby-doors`, four runs). 37 of 40. `displays`: 2 by 10:46 UTC; 3 (`tier-corporate`). 3 of 40.
