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
