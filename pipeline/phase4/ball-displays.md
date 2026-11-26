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
7. The front shell writes a depth after all, not its own: the depth of the middle of the chord the view cuts through the ball (`gl_FragDepth` in `frontFragment`), which is the depth the camera focuses on. The rim is now sharp in `lobby-doors`, `youre-fired` and `rail-cam` (seen in 460 px crops, 04:06 UTC) and the cursor stays sharp. Known cost: where the cursor stands nearer than the ball's middle the front glass is not drawn over it. Open halves and grade true keep the shell's own depth.
8. The light inside the ball never falls under a luminance of 0.5 and never rises over 0.6 before the gains (`INSIDE.least`, `INSIDE.most`), so the cursor is as bright on a rail and in a scoop as on a tier floor. In `rail-cam` and `youre-fired` it was dark grey before (seen 04:06 UTC).
9. The HQ doors in the ball (`uDoor`, `DOOR` in `index.ts`): the front of the box of part `model-hq` is drawn with the modeller's numbers of decision 6 (doorway, brass frame, kick plates, lobby with lamp panels, steel lintel, glass wall in mullions) and no longer with the grid of windows. The leaves are drawn shut; `hq.door.left` is not read yet.
10. The pool, the veil and the brim take the soft light held to a luminance of 0.35 and the gathered lamp light held to 0.6: in the lobby the ball's inside was a white haze.
