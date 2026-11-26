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

## Decisions (third pass, 11:17 to 11:30 UTC, times from `date -u`)

14. `/root` (11:19 UTC): looks do not move between parts; the three left on `clear-ball` stand. The glass is worked from the code and from pixel reads of stills I already had, and `/root` sends the pictures of each merge.
15. MEASURED with `python3 /tmp/prof.py` (twelve spokes, mean sRGB at each share of the radius) on my sheet still of 11:09 UTC and on `references/approved/clear-ball.png`: beside the floor round it, my ball's inside was darker (about 30 inside against 55 outside) where the approved ball's inside is lighter than its floor (65 to 80 against 40 to 55); my lit side was 187 to 244 across the whole wall where approved peaks at 220 in one place and is 130 to 160 beside it; my far side read 150 to 177 at 0.9 of the radius where approved reads 53 to 112. Changes from that, in `glsl.ts`:
    - the dark spot the decal lays right under the ball is 0.4 (was 0.7) and narrower, because it was seen through the ball from above and blackened the inside;
    - the crescent toward the light is 0.5 (was 0.7), the one away from it 0.22 (was 0.35), the lip's lit share 0.6 (was 0.8), its far share 0.3 (was 0.45), its base 0.08 (was 0.14), the grey of the dark edge 0.3 (was 0.5): a darker contour, less white;
    - the floor seen bent in the far wall is brighter and wider: 1.35 of the floor (was 1.1), from 0.6 of the radius (was 0.66), 0.55 of the picture (was 0.4);
    - the warm pool stands on the side away from the light as the eye sees it, so at a low camera it lies at the foot of the ball and not at its side; it is wider and stronger (1.5, was 0.8).
16. The glass is lit from where the tier's head lamps are: `uSoftDir` is `keyOf(zone).toward` (lifted to at least 0.5 up) where the tier has a key, and the old fixed side elsewhere (the sheet). The bright crescent, the window and the shadow now agree: the light side of the ball is the side away from its shadow. The arrow's own light keeps its side.
17. Displays at a low camera: the dots lie under the mask, and seen from the side they hid behind it, so the word at `last-save` was dim. The dots now slip at most 0.18 of a dot behind the mask. SEEN at `last-save`, before and after: the word reads lit. The coarse picture of a far display is a little hotter (1.6 and 1.4, were 1.3 and 1.1).

SEEN in one `clear-ball` look (`lobby-doors`, 11:22 UTC) after 15 (but for the bent floor and the pool's size) and 16: the ball is clearer, no longer milky, the rim is thin and dark against the bright doors, the bright part of the rim sits upper right. MEASURED on that still with a pixel read: the carpet in the shadow is sRGB 55 to 66 against 120 to 130 beside it, but on main's key the shadow is long and falls lower left, away from the foot, and does not read as the ball's own.

CHANGED WITHOUT HAVING SEEN IT (for the pictures of the next merge):
- sheet `clear-ball`: everything in 15. Look for: the inside no darker than the floor round it, the lit side of the wall no longer a white wedge, the far side quieter, a warm pool between the arrow and the wall on the side away from the light.
- `lobby-doors`: the bent floor from 0.6 of the radius and the pool at the foot, lower left of the arrow.
- `rail-cam`, `last-save`, the three tier keys: 15 and 16 together: the bright crescent on the upper right of the ball, toward the head lamps.

## Decisions (fourth pass, 11:31 to 11:40 UTC)

18. SEEN in one `clear-ball` look (sheet, 11:33 UTC, on 2579690c): the lit wedge is gone and one crisp crescent is left toward the head lamps (MEASURED 241 at its peak, 100 to 150 beside it); the inside is no darker than before; the warm pool was a wide tan smear between the arrow and the wall, and the five arcs together covered about nine tenths of the wall's round, which is why the wall read as one even grey band. Changes from that, in `glsl.ts`:
    - three arcs, not five, shorter and with firmer ends (`arc()`): one bright one near the light (0.8 of the room's light, 0.42 long each way), one small one on the outer wall, one faint one on the far side. Together about four tenths of the round, so most of the wall is clear glass between them;
    - the warm pool is a small bright spot (about 40 degrees of the round, between 0.6 and 0.82 of the radius, 2.4 strong) and no longer a smear.
19. A test pins decision 16: `tests/table-ball.test.ts`, "the glass is lit from the side of the tier's head lamps, and its shadow falls the other way".
20. Round 12's ten acting issues added by `/root` at 11:28 UTC (the reads that were not made). What of them lies in my folders is how clearly the arrow shows through the glass: decision 9 (dark ground behind it, rim of light), decision 15 (less white on the wall in front of it) and decision 18 (the wall is mostly clear between three arcs) are that. The states themselves (flat, pale, the sag, the double take, sweat on the body) are the cursor model's, and the moment, the size in the picture and the cut are `machine_finisher`'s. The ball's own sweat (22 small drops on the inner wall, growing with the sweat number of the shape) is unchanged: the approved sheet rules "restrained droplets" and round 1 asked for fewer pinpoints.

CHANGED WITHOUT HAVING SEEN IT (for the pictures of the 12:05 UTC merge): everything in 18, on every key. Look for: three separate reflections in the wall with clear glass between them, and one small warm spot inside the ball on the side away from the head lamps (lower left from above, at the foot at `lobby-doors`).

## Decisions (fifth pass, 11:55 to 12:10 UTC, times from `date -u`)

21. The shadow and the thrown light under the ball (`/root`, 11:54 and 11:57 UTC: the first thing a viewer misses). MEASURED on the crop of merge 34 at `lobby-doors`: the shadow was there (carpet 83 against 155 sRGB) but lay well away from the foot as a broad soft gradient, so it did not read as the ball's. Changes in `decalFragment` (`glsl.ts`) and in `index.ts`:
   - the shadow's middle is 0.55 of a radius times the slant from the foot (was 0.9), it is 1.0 by 1.08 radii (was 1.25 by 1.2) and its edge is firmer (`smoothstep(0.3, 1.0, e)`, was 0.12);
   - the dark at the point of contact is 0.6 deep over 0.4 of a radius (was 0.4 over 0.55);
   - the thrown light is one patch at 0.8 of a radius from the foot, inside the shadow, about 0.2 by 0.13 of a radius with a faint halo, in the head lamps' colour turned a little warmer (`(1, 0.9, 0.72)`, times 2.2);
   - a ball off the floor: its shadow moves out by the true angle of the head lamps (0.58 of the slant the decal draws at rest) and fades more slowly (`1 / (1 + lift / (4 r))`, was 2.5 r); a ball under its zone's floor no longer makes the numbers run away (`lift` is never below 0; MEASURED in a test print: a weight of 4 where 0.8 is the most).
   SEEN in the one look left (sheet, 11:58 UTC, drawn with the first three lines above): a dark pocket at the foot of the ball in panel 1 (MEASURED 15 to 25 against 50 sRGB on the floor beside it). NOT SEEN: the long shadow and the thrown light. MEASURED by the sheet's own numbers (`SHEET.from` in `src/pages/step3/index.ts`) and a test print of the decal's uniforms: the head lamps of every tier throw the shadow down the page and a little left, which in the sheet's first panel and at `last-save` is onto the flipper in front of the ball. The decal lies on the floor, so there the flipper hides it. Approved shows the patch of light on top of that flipper. Drawing it there needs the decal lifted to the flipper's top where the shadow crosses one; that is not built.
22. The middle panel of the sheet: the page sets that ball 0.6 of a ball above the floor (`SHEET.fly`, `src/pages/step3/NOTES.md`: "in flight"), so it does float, and its shadow lies to the side. Approved shows it standing on the floor. The page is not mine; I say so in my report.
23. The sandbox lost its sign-in to GitHub at 11:51 UTC (`git push`: "could not read Username"). Fetch still works. Each further commit goes to `/root` as a bundle (`git bundle create ... agent/ball-finish ^origin/main ^<last commit on origin>`), and looks go as files.

CHANGED WITHOUT HAVING SEEN IT (for the pictures of merge 35): the thrown light on the floor (never in view in any still of mine); the last line of 21 (a ball off the floor); the warmer colour of the patch. Look for: at `lobby-doors`, a dense shadow that starts at the foot of the ball and one warm patch of light inside it close to the foot; in the sheet's middle panel, a shadow nearer the ball than before.

## Decisions (sixth pass, 12:10 to 12:25 UTC)

24. `/root` (12:12 UTC): no more looks on `clear-ball` in this round, and the shadow on the flipper is not to be built blind. It is an open item:
   - the fact: the head lamps of every tier throw the ball's shadow down the page and a little left (MEASURED: the decal's `uShade[0]` is (-0.46, -0.89) in the zone's frame at the sheet's two Street places and at an Office place; `SHEET.from` puts the sheet's camera on the down-page side). At `last-save` and in the sheet's first panel that is onto the flipper in front of the ball;
   - why nothing shows there: the decal is one flat piece 3.4 px over the floor (5.6 over a rug), and the bat stands 56 px high (`BAT.top` in `src/table/real/play/flippers.ts`), so the bat hides it;
   - what it needs: the decal's flat piece cut finer (60 by 60, 7198 triangles more, inside the 10000) and raised in its vertex shader over the bat's outline to the bat's crowned top (lip 4.4, crown 15, top 56), the bat's place read from the shape `flipper.<id>` of the draw list; on the raised part a soft shade round the ball and the warm patch laid on the crest beside the ball. Approved paints that patch on the bat although a clear ball beside a bat that high would throw its light on the floor under itself, so its place and size have to be set by eye, in three or four looks at `last-save` and the sheet. I wrote it once (12:12 UTC, typecheck clean) and took it out unseen.
25. Displays at every key of the unit, SEEN (five looks, 12:15 and 12:16 UTC, on 20a0c143): `reply-all` has two displays in frame, each with the whole word "Reply-All" lit behind its dark bezel with its glow on the glass; the sheet `table-map` has three, each with six whole numerals; `youre-fired`, `lobby-doors` and `loader-page` have no dot display in frame. With `tier-corporate`, `tier-office`, `tier-street`, `table-wide` and `last-save` seen before, that is every key and sheet of the unit but `rail-cam`, where `/root`'s picture of merge 34 shows none in frame. No change to the displays came of it.

## Counts (MEASURED 12:19 UTC on 20a0c143 and 11:39 UTC on a0e5bc10, the same numbers; before on cfd83123 in a second work tree at 11:15 UTC)

`npm run counts -- --key <key> --live low`, the rows `clear-ball` and `displays`:

| key | part | calls before | calls after | triangles before | triangles after |
|---|---|---|---|---|---|
| tier-corporate, tier-office, tier-street | clear-ball | 3 | 3 | 18874 | 18874 |
| tier-corporate, tier-office, tier-street | displays | 4 | 4 | 164 | 164 |
| table-wide | clear-ball | 2 | 2 | 18872 | 18872 |
| table-wide | displays | 8 | 8 | 328 | 328 |

## Tuning looks, by part

Counted strictly, one for each still or row of film frames, all `draft` but one `review`. `clear-ball`: 20 by 10:46 UTC (first pass, as reported); 22 (sheet, `youre-fired`); 25 (sheet, `last-save`, `lobby-doors`); 28 (the same three); 29 (film frames 5121 to 5125); 31, 33, 35, 37 (sheet and `lobby-doors`, four runs). 37; 38 (`lobby-doors`, 11:22 UTC); 39 (sheet, 11:33 UTC). 39 of 40; 40 (sheet, 11:58 UTC, decision 21). 40 of 40: the part's looks are spent, and every change to the ball after 11:58 UTC is unseen. `displays`: 2 by 10:46 UTC; 3 (`tier-corporate`); 5 (`table-wide`, `last-save`); 7 (`last-save` twice, the display alone studied); 8 (`table-wide`, 11:31 UTC, the two displays alone studied); 10 (`tier-office`, `tier-street`, 11:41 UTC: SEEN a page of whole words on each, "(In Lieu of" and "Entry-Level", lit behind the dark bezel). 10; 13 (`reply-all`, `youre-fired`, `lobby-doors`, 12:15 UTC, the displays alone studied: the ball at `lobby-doors` covered before I opened the picture, the ball at `youre-fired` and `reply-all` in view only in a copy 640 px wide, and no change to the ball made after it); 15 (`loader-page`, the sheet `table-map`, 12:16 UTC). 15 of 40.
