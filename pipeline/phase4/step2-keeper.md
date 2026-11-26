# Step 2 keeper notes

Branch `agent/step2-keeper`. Parts: `rows`, `dial`, `slot`, `crank`, `acting-step2`.

## What the approved images hold that a quick look misses

1. Highlight: on the dial the light sits on the upper left only. The hub carries one broad soft sheen on its upper left shoulder (peak 255,215,162 on a body of 213,106,39), not a pin point; the wheel face holds two bright fans and two dark fans, the bright ones toward upper left and lower right.
2. Bevel: the housing round the wheel is a stepped ring about 9 to 10 px wide at hd with a thin dark gap inside it, and each finger hole has a countersink about 2 to 3 px wide that is lit on its lower right lip and dark on its upper left.
3. Gap: the tray's upper and left walls are not black. On column x=1400 the wall reads 58 to 77, the floor's shade band under it about 50, and the line between them 33. The wall is lighter than the shade it throws.
4. Edge: the rim of the tray on the upper and left sides is mid grey (106 to 128), not white; only the lower and right rim catches a thin bright line. The inner corner is round, not mitred.
5. Tone: the shade in the tray leans blue green against the warm paper, and the lit lower wall is a thin strip, thinner than the shaded upper wall.

## Decisions

1. Dial hub: a clone of the shared orange with its colour lifted (`HUB_ORANGE_LIFT` 1.6 in `layout.ts`, hue kept; /root ruled at 04:44 UTC that it stays as a stand-in and goes when the shared orange is right) and a soft painted sheen toward the key, because the shared orange with `envMapIntensity` 0.25 and `keySpecular` 0 renders brick red where the approved hub is bright. The clone runs through the shared studio hooks. The grip of the crank and the knob of the lever still take the shared orange as it is.
2. Dial housing and base ring: a darker clone of the shared steel (`dial-housing`), through the shared studio hooks. The housing is a flat sloped bezel with crisp chamfers on a stepped base ring; each finger hole has a countersink; the hub stands on a foot in a dark seat.
3. Tray: `TRAY_R` 18 and rim 6.5 for a rounder inner corner; the wall shade runs over the upper and left rim (`rimShade`) so that rim reads mid grey; the wall is lighter than the floor's shade band; a slight cool tint in shade (`cool`).
4. The crank's key: the cursor was `angry` from 13.36 s until the crank threw it at 15.22 s, so steam and the red tip stood over the grip at 15.2 s. The temper now ends at 14.16 s, after the stamp at 13.9 s (`TEMPER.spent`), and it takes the crank `plain`. The key's `at` is right and is not changed.
5. The two fields above the crank show `copy:step2.rows.phone.gaveUp` and `copy:step2.rows.birth.recorded` at the crank's key, where the approved image shows them empty. Kept: the kit says a closed row shows its value, and the approved image was made before the rows had results. Told to the Builder as a place where the kit wins over the image.
6. M2: the unlit meter segment's picture is 128 by 512 px (was 64 by 256), and the segment is two meshes: a top with the picture and an upright wall of plain glass in the tone of the picture's rim. Every soft pixel was on that wall, where a picture laid on from above has no texels.
7. The empty tray near 13.37 s: a machine sank by flattening to nothing, and only then did its tray start to shut, so the tray stood empty for the time between. The tray now starts to shut when the lift is under `COVER` (0.25), when the machine is under the page's level, and shuts over it. This holds for all three machines.
8. The crossing at 0.53 s of `step2.open`: found. The stage holds the cursor at the hand-off place (960, 540, z 260) for the first 0.5 s of every unit but the first and sets it down at 0.5 s (`src/stage/stage.ts`, `advancePhase`, and `src/stage/CONTRACT.md` line 79). My script's pointer stood at (1575, 395) from 0 s, so the cursor dashed 630 px to it the moment it was set down. The pointer now waits at the hand-off place until 0.52 s and walks to its place by 0.8 s (`ARRIVE`), so the cursor is set down where it is and walks. The rest key at 1.0 s is unchanged. Nothing of the film's hand-over needs to change for this.
9. The slot's lever hangs from a bracket at the cabinet's side (`SLOT.pivotY`, 58 px under the cabinet's top) and no longer stands on a mount under it. The knob's travel, the cursor's path and the event's place are unchanged. At rest the knob is 28 px over the bracket, pulled it hangs 68 px under it, as the approved sheet shows it. The rod is 5.6 px in radius (was 4.6).
10. The wells of the three fields, the Continue button, the header and the cursor's pose are the shell's and the cursor's, which are frozen: compared and reported, not changed.
11. A mistake, kept in the history because history is not rewritten: the merge commit 5ab90332 has git's own message and no trailer. Every commit after it is made with a message of mine.

## Looks counted (at most 40 a part)

| Part | Looks |
| --- | --- |
| `dial` | 9 |
| `rows` | 3 |
| `crank` | 4 |
| `slot` | 5 |
| `acting-step2` | 15 |

The stills that `npm run measure` renders by itself are not counted.

## MEASURED

- `npm test`: 98 files, 1358 of 1358 tests passed. `npm run build`: built. `npm run bots`: "bots: all clear".
- `npm run measure -- --unit step2 --only M2 --tier review`: pass, 5 stills, 54239 textured pixels, the largest soft share 0.0041 against 0.02 (was 0.0509).
- `npm run still -- --key step2-dial --format hd --tier review`: 20.3 s, 519583 triangles, 252 draw calls (was 517647 and 252).
- `npm run still -- --key step2-crank --format hd --tier review`: 20.6 s, 836523 triangles, 671 draw calls (was 521 draw calls: the ten meter walls and their passes).
- `npm run still -- --key step2-rest --format hd --tier review`: 18.3 s, 420989 triangles, 189 draw calls.
- `npm run still -- --sheet machines --format hd --tier review`: 17.6 s, 652975 triangles, 670 draw calls.
- `time npm run still -- --key step2-dial --format hd --tier draft`: 9.6 s in the page, 12.7 s on the clock.
- Textures of step 2 made in code: the unlit meter picture 128 by 512 px, 0.25 MB (0.33 MB with mips); the lit meter picture 64 by 256 px, 0.06 MB (0.08 MB with mips). The keeper added no other texture.
