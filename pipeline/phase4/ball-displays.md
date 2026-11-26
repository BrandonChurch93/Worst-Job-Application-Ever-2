# The clear ball and the dot displays, second owner

Branch `agent/ball-displays`, from `origin/main` 1101091. Folders `src/table/real/ball/` and `src/table/real/displays/`. The first owners' notes are `pipeline/phase4/ball.md` and `pipeline/phase4/displays.md`.

## What the approved images show that a quick look misses

1. The ball is a thick shell, not a soap bubble: it has two edges. A thin dark line is its outline, and a tenth of the radius inside it a second ring runs where the inner wall turns away. Between the two the floor is seen bent, bright and pressed thin, and that band is what makes the ball the first thing the eye finds from above.
2. The cursor is the brightest thing in the ball. Its face is near white (sRGB 176,177,172 in `tier-office`, 157,154,150 in the red light of `youre-fired`), its dark edge band is even all round, and it is 55 to 65 percent of the ball across. It has a soft slope of light from the upper left and no dark side.
3. One window highlight only: a soft rectangle high on the left of the outer wall, cut by one bar, with a faint echo low on the right on the inner wall. The lamps of the tier sit as small warm points crowded along the rim and never across the middle, which stays clear for the cursor.
4. The shadow is short and dense and hugs the foot of the ball on the side away from the key. Inside it, off the middle, lies one small spot of gathered light, far brighter than the floor round it, with a short star. In `lobby-doors` the shadow runs long toward the camera over the carpet and the spot lies right at the foot.
5. The seam is a hairline round the ball with glints on it and one small metal plug. The sweat is fine beads on the upper inner wall alone. In every close key the ball is the sharp thing in the picture and the models behind it are soft.

## Baseline, before the first change

MEASURED at 03:17 UTC on `origin/main` 1101091, 4 cores: `npm test` 95 files, 1341 of 1341 passed. `npm run build` exit 0. `npm run bots` "bots: all clear".

MEASURED `npm run build && npm run counts -- --key table-wide --live low`:

| row | meshes | colour calls | shadow calls | calls | triangles |
| --- | --- | --- | --- | --- | --- |
| displays | 8 | 8 | 0 | 8 | 328 |
| clear-ball | 2 | 2 | 0 | 2 | 18872 |
| whole frame | | | | 207 (limit 300) | 461752 |

MEASURED `npm run compare -- --key <key> --tier draft --format hd`, 03:19 to 03:26 UTC, every pass counted:

| key | seconds | triangles | draw calls |
| --- | --- | --- | --- |
| table-wide | 39.7 | 1127286 | 623 |
| tier-corporate | 39.4 | 968082 | 608 |
| lobby-doors | 36.8 | 970165 | 623 |
| tier-office | 38.3 | 1280507 | 586 |
| reply-all | 41.9 | 1416887 | 628 |
| tier-street | 33.4 | 1192934 | 535 |
| youre-fired | 41.7 | 1205192 | 564 |
| rail-cam | 31.6 | 1020415 | 468 |
| last-save | 41.4 | 1292386 | 575 |

## Why the cursor in the ball is dark

MEASURED on `tier-office`, draft, the mean of 8 by 8 pixels on the cursor's face at 866,650 (`sharp`, linear luminance of the sRGB bytes). The approved image has 0.43 on the face (sRGB 176,177,172).

| what | sRGB | linear luminance |
| --- | --- | --- |
| as it is on main | 70,66,62 | 0.058 |
| the shell not drawn | 72,68,64 | 0.061 |
| the shell not drawn, the website's light held at 1 (`src/app.ts` `put`) | 222,217,211 | 0.706 |

The shell takes 5 percent. The website's own light leaving takes the rest: `put()` in `src/app.ts` sets `rig.level` and `scene.environmentIntensity` to `table.pageDuskLevel` (0.05) in the machine, the cursor's body is a material of `src/cursor/model/material.ts` that never passes through `lit(material, zone)`, so the key, the dome and the reflections on it fall to a twentieth and the lamps of the tier, which reach every other surface through the hook, never reach it. The face is 11.6 times darker than it is in the website's light.
| the cursor's material through the lights hook of the tier (`lit(bodyMaterial, zone('office'))`), shell not drawn | 86,83,80 | 0.090 |
| with `ball-displays-NEEDS.patch` and the ball's light on it | 201,199,191 | 0.573 |

The hook alone is not the cure: the lamps' pictures give little light 48 px over the floor, so the face stays dark grey (0.090).

## Decisions

1. The cure for the dark cursor is a light of the body's own while it is sealed (`pipeline/phase4/ball-displays-NEEDS.patch`, on this branch as the commit `NEEDS:`): `sealed` in `src/cursor/model/material.ts` holds one lamp, the way to it and a fill, and counts only on a body whose look has `sealed` (set by the cursor's view from `inBall`). The ball's `pose` writes it from `lightAt`: the tier's general level and flash in the tier's fill colour, plus the colour of the lamps near the ball, times one minus the website's level, so it is nothing on the loader page and follows every flash and blackout of the lights owner. The lamp follows the body's own face by half, so that a face turned to a low camera is lit as one seen from above is.
2. The first patch is on `main` since merge 20 (4f64ab74). `pipeline/phase4/ball-displays-NEEDS.patch` now holds a second, smaller one on top of it (`src/cursor/model/material.ts` only): the sealed lamp tops the body up to its own level and is no longer added on top of what the scene gives. Why: in `lobby-doors` the cursor is already lit and mirrors the bright lobby, and with the first patch its face went flat white. MEASURED, the mean of 8 by 8 pixels at 990,720 of the draft still, linear luminance: main before the first patch 0.576, with the first patch 0.960, with the second 0.590; `tier-office` at 866,650 stays 0.546 (the approved face is 0.43). The lamp's light is worked out apart and, at the end of the material, only the share the body's outgoing light still lacks is added. On the ball's side the light is held to a luminance of 0.6 before the gains (`INSIDE.most`).
3. The front shell does not write depth. Tried at 03:38 UTC in `youre-fired`: the shell stands half a ball nearer than the focus, so the lens spread the whole ball. The cursor writes its own depth at the focus and stays sharp; the glass takes the blur of what stands behind it.
4. The shadow: the key's shadow is shorter and denser (slant 1.15 for 1.8, at most 0.86 for 0.72), and the spot of gathered light is a small core with short rays at 1.2 ball radii. MEASURED with a still that drew the shadow's share in red (`tier-office`, 03:50 UTC): the shadow was there before, but the broad glow of the spot (0.12 over 0.45 radii) lay over all of it and read as a grey haze.
5. The glass: the bent picture starts at 0.55 of the radius (was 0.36), the band between the two edges is brighter (gain 1.9), a bright brim lies just inside a thin dark outline (0.972 to 0.996 of the radius, was 0.958 to 0.993), and the lamps show in the band as points through the glass.
6. Agreed with `/root/corporate_modeller` (about 03:50 UTC): it sends one message when the colours or measures of the HQ doors change, I never read its files, no word means the last numbers hold. Its numbers (branch `agent/corporate-models` 92524864): brass frame #896124 lit, #5b4014 in shade; leaf rail #a6762d, kick plate #9f722b; lobby wall #80755f, lift fronts #a0865a, ceiling #b2a17d with lamp panels #f0ebe0; wall beside the doors #4b5b5d to #45676a in mullions #5c6063; lintel #6f7071 to #898a8b. Doorway 182.4 px wide, 144 px high, brass 216.4 px wide, head to 153.6 px, lintel to 206.4 px; middle at x = 10 balls, y = TIER_Y[0] + 4.5 balls, facing +y. The leaves move: shape `hq.door.left`, `v[0] > 0.5` shut, else `v[2]` seconds since let go.
7. The ball is sharp where the camera focuses on it: the back shell writes a depth, not its own but the depth of the middle of the chord the view cuts through the ball (`gl_FragDepth` in `backFragment`), which is the depth the camera's focus is set to. The front shell still writes none and is drawn over the cursor as before. First tried on the front shell (04:06 UTC): the rim was sharp, but the glass was no longer drawn over the parts of the cursor nearer than the middle, and in `tier-office` the cursor stood on top of the ball (seen 04:27 UTC), so it moved to the back shell. The drops on the far inner wall are drawn at a depth just in front of the ball's middle so that they still show. Open halves and grade true keep the shell's own depth.
8. The light inside the ball never falls under a luminance of 0.5 and never rises over 0.6 before the gains (`INSIDE.least`, `INSIDE.most`), so the cursor is as bright on a rail and in a scoop as on a tier floor. In `rail-cam` and `youre-fired` it was dark grey before (seen 04:06 UTC).
9. The HQ doors in the ball (`uDoor`, `DOOR` in `index.ts`): the front of the box of part `model-hq` is drawn with the modeller's numbers of decision 6 (doorway, brass frame, kick plates, lobby with lamp panels, steel lintel, glass wall in mullions) and no longer with the grid of windows. The leaves are drawn shut; `hq.door.left` is not read yet.
10. The pool, the veil and the brim take the soft light held to a luminance of 0.35 and the gathered lamp light held to 0.6: in the lobby the ball's inside was a white haze.
11. The shadow is as dark where the tier's general light is low as where it is high: its strength takes the greater of the soft light and the floor's light (`key` in `pose`). On the sheet `clear-ball` the general light is low and the balls had a star and no shadow (seen 04:17 UTC).
12. The bent picture of the floor starts at 0.68 of the radius (0.55 at 04:00, 0.36 before): nearer the middle it lay over the cursor as a veil (`youre-fired`, seen 04:29 UTC).
13. Looks of the ball in Phase 4: 54 stills in 14 rounds, over the limit of 40, reported to `/root` at 04:47 UTC. Ruling of `/root` (04:49 UTC): no still to tune or check the ball until round 11 begins; the displays have a count of their own. The door code of decision 14 was written without a look and is to be looked at with the first look of round 11. MEASURED at 05:02 UTC: two film frames rendered with it gave no shader error (`problems` of the capture session empty); the ball in them was not looked at.
14. The HQ doors in the ball take the modeller's colours of 04:35 UTC: right jamb #785825, left jamb #816d4b, leaf stiles #bc8c44, top rail #946a29, kick plate 0.85 of the top rail, the lobby wall at half of #80755f in three bands from the floor up (0.6, 1.0, 1.5), two slanting pale streaks on each pane. The leaves read `hq.door.left`: `v[0] > 0.5` is shut, else they fold to the jambs over 0.35 s of `v[2]` (`DOOR.swing`, my own number, not the modeller's).
15. Agreed with `/root/table_runner` (04:40 UTC): the score shapes carry `v = [seconds since the change capped at 9, the score before]`, the modes `v[0]`, `display.hint` is there only in live play before the first flip; the cursor lies flat under the three tier cameras by its intent; it lowers `ACT.lead` to 0.1 so the tail stays inside the rim and I do not clip the plate; the balls of the sheet keep `z0` at the floor's z, no new field. Its branch was merged into this one at 04:50 UTC on the word of `/root`.
16. The lamps in the pane of a tier display are small sharp points with a faint disc round each (`MIRROR.size` 2.6, `grows` 1.6, `gain` 0.2; the housing's shader sums a disc, a core and a faint halo). Tried and left: a lens with a ring (read as bubbles on the glass), a flat pale disc (read as dust).
17. The sweep and the roll are left as the first owner built them.
18. The score stands in the middle of the grid with 8 dots between numerals (was at the right with 5): the approved `table-wide` has six numerals set wide apart in the middle of the lit window. From far the numerals have a hot pale core (`wjdCoarse`), and the halo is a little redder. Seen at 05:07 UTC beside the approved main display: the place and the spacing agree; ours is still yellower, the approved numerals are cream at the core in an orange red glow on a red brown window.
19. The displays' own amber is the lamps' `DISPLAY_AMBER` times `TONE` (1.15, 0.8, 0.86), so the dots are orange as in the approved `table-wide` and no dimmer; the hot core is paler (1.0, 0.8, 0.42); the window is lifted by the wide glow only from far. The colour of the light the displays cast is the lamp keeper's and is not changed. MEASURED at 05:11 UTC on the main display in `table-wide`, brightest 3 percent of the window, then the next band, then the backdrop, ours beside approved: 250,205,131 beside 253,245,185; 191,137,84 beside 218,171,113; 49,25,10 beside 67,34,19 (taken with `TONE` 1, 0.7, 0.75 and the lift of the try before; the last values were looked at in one film frame of the Street display and not measured in `table-wide`).
20. The modeller's last word on the doors (05:12 UTC, `agent/corporate-models` 12e8db56, no measure changed): the jamb fronts run from 0.3 of their tone at the floor through 1.5 at 0.58 of the height to 0.35 under the head; the head runs from 0.16 to 0.8 of #8a6a2c; the streaks on the panes are fainter. In the ball's door code since 05:14 UTC, not looked at. Its time ends at 05:35 UTC; after that the numbers hold.
21. Ruling of `/root` (05:45 UTC) on the film facts, in `displays/pick.ts` and `displays/screen.ts` since 107f3e1a: a mode that lights still shows at once on all four displays and cuts a line that is running; the line that was cut goes to the back of a queue and is shown whole once, in the order the modes were lit, when no newer mode is on; the score comes back only when the queue is empty; the name stands 1.0 s (`PACE.hold`, was 1.5). The queue keeps no state: `running(lit)` works it out each frame from every timed mode's `v[0]`, so the same frame of the film always shows the same thing. A line that is shown again starts after its name (`t = PACE.hold + seconds into the replay`) and lasts `scrollSeconds(line)`. Four tests in `tests/table-displays-pick.test.ts`. The score, its roll and the sweep are not changed. In the film the queue starts after the table has left the frame; `/root` logs that as the cut's length. Not mine and not changed: the page's own state name still uses `NAME = 1.5` (`src/pages/step3/index.ts` line 129), told to the table runner at 05:49 UTC.
22. In the back shell a lamp's spot gives the same light however wide it is drawn (`lampsBack` in `glsl.ts`: times `min(1, 0.0049 / near^2)`, so a lamp farther than 214 units is as before and the nearest is at 0.22). Seen at 05:58 UTC: in `lobby-doors` the haze is gone, the doorway with its brass stiles and kick plates shows through the ball and the cursor has its dark edge; in `tier-office` the same crop before and after shows no difference; the sheet and `tier-corporate` at 06:00 UTC show no change to the eye.

## Displays: what was seen (looks 40 of 40)

All film frames below are `draft`, `hd`, rendered one after the other in one session by a helper of my own that is not in the repo (it calls `renderFilmFrame` as `tools/sheet.mjs` does and keeps each frame whole, so a crop is at real size).

| Point | Seen in | What it shows |
| --- | --- | --- |
| 2, the roll | two stills of `tier-office` with `pick` forced to a score that had just changed (0012340 to 0012350, 0 and 1 frame after) | frame 0: the lower half of the old numeral over the upper half of the new one; frame 1: the new one five dots short of its place. In place on frame 2 |
| 3, the sweep | four frames in a row of `pinball.launch` (10.80 to 10.88 s, the camera of Tier 3), `SWEEP` forced to 0.25 s so that it crosses the score in them | a wider glow that moves from the first numeral to the third; no dot gets harsher |
| 4, the scroll | sheet of `pinball.coffee` (name held, the line enters at the right and runs through 7 pictures); frames of `pinball.save` and `pinball.drain` at 35.7 s and 38 s | the last line enters at the right edge at 35.5 s; at 38 s it reads "Hats. Also kn", every dot sharp, no smear |
| 5, the lamps | the same frames, and 12.6 s | points in a row in the upper pane |

MEASURED, by stepping the page of the film frame by frame and asking `pick` (a test of my own, not in the repo), after the table runner's times were merged:

- The displays show the score from 5.2 s to 10.9 s (000000) and again from 41.35 s. Between the two a mode is always on: each of the nine modes is lit before the line of the one before has run out. So no score change is ever on a display in the film, and the roll is never seen in it. The last score change before 41.35 s was 4.9 s earlier.
- The sweep runs on the score only. In the film it can be seen from 9.0 s to 10.9 s; a tier display is in frame for the last quarter second of that.
- No line is seen to its end in the film. A line needs 5.7 to 7.8 s (name 1.5 s, then 120 dots a second). The modes are lit at 10.9, 12.1, 13.3, 15, 19, 23, 26, 29.5 and 34 s, so the first two show their names only, the third 0.2 s of its line, the next five 3 to 4.5 s of 6.4 to 7.8, and the last one (lit at 34 s, done at 41.35 s) is cut by the result card: the table is out of frame at 39.5 s.

## Round 11 (from 05:42 UTC): looks ball 9 of 40, displays 0 of 40

Looks of the ball: `lobby-doors`, `tier-office`, the sheet `clear-ball` (05:43 UTC, on 328c961f), `lobby-doors` once more with the shadow's plane tinted to see where it lies (05:51 UTC, the tint is not in the code), `lobby-doors` with the two shells tinted (05:56 UTC), `lobby-doors` and `tier-office` after decision 22 (05:58 UTC), the sheet and `tier-corporate` (06:00 UTC).

Seen:

- Sheet `clear-ball` in the table runner's new view (the left bat under the first ball): the three balls read as clear glass, each cursor is light grey with dark sides, the right ball has a dark shadow with a star to its lower right, the left ball a faint one. The thin line with a small ring in the middle ball is the seam and the plug of the ball that opens, not a fault.
- `tier-office` beside the approved image: the glass and the cursor agree in tone (cursor light grey in ours, off white in the approved); under our ball there is no dark shadow with a bright spot as in the approved one. Our ball lies over the lit green insert there.
- `lobby-doors` beside the approved image: our ball's inside is a cream haze with pale door lines, the cursor is white with almost no shading, and there is no broad shadow on the carpet.

Found, `lobby-doors`:

- The shadow is drawn. With its plane tinted it covers the carpet round the ball. The key's camera stands about 0.8 of a ball radius over the floor and about 15 radii away (worked out from the picture: the ball is 190 px in radius and its foot 150 px under its middle), so a shadow two radii long toward the camera is about 25 px high in the picture. The approved image looks down from higher and nearer with a wide lens. The camera is the table runner's.
- The cursor's white is not the ball's lamp. MEASURED: the face is at linear luminance 0.93 to 0.96 (`252,250,245`), the approved one at 0.33 to 0.37 (`160,157,154` to `166,163,160`). STATED from `src/cursor/model/material.ts` lines 45 to 48: the sealed lamp only tops the body up to its own level (at most 0.6 times the gains) and adds nothing where the scene's lights already light the body more. So in the lobby the scene's own lights make the face white. Not in my files.
- The cream haze inside the ball was the back shell's picture of the lamps. Seen at 05:56 UTC in one look with the front shell tinted green and the back shell tinted magenta (the tints are not in the code): the whole inside was magenta. A lamp nearer than 214 units is drawn as a wider spot (up to 0.15 times 1.4), and each wide spot kept the brightness of a small one, so the two globe lamps by the doors washed the inside. Decision 22.

Not looked at in round 11: `tier-street`, `youre-fired`, `rail-cam` under the table runner's new `rail` camera, the true grade, the open halves. The door colours of decisions 14 and 20 were in the `lobby-doors` look: the doorway, the brass jambs and two lamp marks show in the ball, washed by the haze at 05:43 UTC. After decision 22 the real doors show through the middle of the ball; the bent doors are only in the outer third, a pale band in that look, so the door colours of decisions 14 and 20 are still not judged.
