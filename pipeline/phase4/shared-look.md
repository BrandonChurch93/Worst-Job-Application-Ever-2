# The shared look (branch `agent/shared-look`, agent `look_fixer`)

Facts are MEASURED (with the command), STATED (with the source) or UNKNOWN. Pixels are of 1920 by 1080 pictures. Helper scripts live in the ignored folder `out/work/shared-look/` (`hdr.cjs`, `orange.cjs`, `pair.cjs`, `rows.cjs`); they read a PNG with `sharp` and print rows of ink, medians of orange pixels and crops side by side.

## What the approved images show that a quick look misses

1. The highlight on an orange part is not on its face. It is one thin bright line on the upper left rim, where the face rolls over into the wall, and a fainter second line on the rim of the foot ring. The face is an even, saturated orange with no sheen across it (`step2-rest`, cap at x 1198 to 1290; `marketing-top`, hero button).
2. The roll of the cap's edge is about 4 px on a cap 92 px wide, a twentieth of the width. The foot ring is about 9 px wide. The hero pill's shoulder is about 8 px and its metal bezel about 5 px.
3. The gap is never black. The step between the cap and its foot ring on the lower right is the darkest orange in the picture, near (131, 51, 13), and the seam between a pill and its bezel is a line of 1 to 2 px near (60, 35, 25).
4. The edge of a shadow is not one edge. Beside the cap the page falls to about 110 of 255 at the contact and comes back to 221 over some 30 px to the lower right; the far side has no line at all. The rail is a flat dark strip (108 to 130) with lit edges 1 px wide, not a round pipe.
5. The header rule is 9 rows thick (rows 160 to 168 on `step2-rest`) with a bright flat top and a dark line under it; ours is 5 rows. The waiting Continue button is paler than its own socket's shadow and its words are paler than its face: it reads as switched off, which M4 does not let type do.

## Item A: the one orange

Patches, the same in each picture: the face of the current progress cap (a box of 40 by 40 px round its middle), the face of the hero button of `marketing-top` (all orange pixels of rows 300 to 1080). Command: `node out/work/shared-look/orange.cjs <png> x0 y0 x1 y1`, the median of the pixels it takes for orange.

| Patch | Approved | Build before (review) | Build after (review) |
| --- | --- | --- | --- |
| `step2-rest`, progress cap | (200, 89, 27) | (163, 64, 14) | AFTER_CAP |
| `marketing-top`, hero button | (204, 92, 34) | (168, 72, 30) | AFTER_HERO |
| `boss-fight`, progress cap | (183, 77, 23) | BEFORE_BOSS | AFTER_BOSS |
| `page-look`, progress cap | (193, 80, 32) | none | none |
| `step1-fire`, progress cap | (191, 83, 33) | none | none |
| `decision`, progress cap | (171, 61, 15) | none | none |

What was found:

- MEASURED: the flat face of an orange part is drawn at about 0.66 of its colour in linear light (the key alone: 5.47 times 0.377 over pi), the page near it at about 0.87. The orange is darker than its own colour, and its colour may not be lighter: `tests/glass3.test.ts` and M4 hold `contrast(inkOnOrange, orange)` at 4.6 and the old colour stood at 4.627.
- Tried and dropped (draft looks, the cap of `step2-rest`): more of the studio's reflection (`envMapIntensity` 0.9 and 1.0) gave (165, 80, 39) and (177, 95, 51), a milky face, no line; a sheen of (1, 0.3, 0.04) at full strength gave (152, 75, 27), darker; a higher index of refraction with an orange tint gave white haze.
- Built: the same luminance with the approved hue, 0xbe5418 (contrast with `inkOnOrange` 4.61, MEASURED by the same sum as the test), and the pigment gives back 1.7 times the lamps' diffuse light (`ORANGE_LIFT`, in the shader, the wrapper `lifted`). `specularIntensity` 0.3, `clearcoatRoughness` 0.1, `envMapIntensity` 0.5, `roughness` 0.55.
- DECISION, said plainly: M4 and the test read the colour of the material, not the lit face. With the lift the drawn face is lighter than the colour M4 reads, as on the approved images. The contrast of the drawn pixels is in the table of measures below. The approved pictures themselves stand near 3.6 on the same sum. If the Builder wants the drawn contrast at 4.5, `ORANGE_LIFT` goes back toward 1.15 and the face toward (165, 75, 28).
- The cap: a foot ring 6 px wide with a rounded rim, a wall that leans in 1.6 px, an edge that rolls over 4.6 px and a face crowned by 0.4 px (it was 1.3 px with a shoulder 13 px wide, which spread the studio's light over the whole face as a pale blotch).
- The hub of step 2's dial clones this material and multiplies its colour by `HUB_ORANGE_LIFT` 1.6 on top: it is now lifted twice. Its colour with the constant at 1 is in the report.

The waiting Continue button (`materials().waiting`): 0x5b6168 to 0x6e7379, the lightest grey that keeps 4.6 with `inkOnOrange` (4.71). DECISION: the approved pill (about 0x9a9d9e with paler words) is not reachable while M4 holds 4.5 for its words; the face went as light as the measure allows and the words stay the light ink. Not lifted: lifting it would take the drawn contrast of its words under 4.5.

## Item B: where the header lies

MEASURED with `node out/work/shared-look/hdr.cjs <png>`: rows of ink of the title (cap top and baseline), the middle of the rail, the rows of the divider, the rows of the heading.

| Picture | Title top / baseline | Rail middle | Divider rows | Heading rows |
| --- | --- | --- | --- | --- |
| approved `page-look` | 81 / 118 | 98 | 158 to 167 | none |
| approved `step1-fire` | 77 / 111 | 90 | 148 to 156 | 202 to 229 |
| approved `step2-rest` | 85 / 119 | 99 | 160 to 168 | 208 to 236, subline 264 to 285, footer 1007 to 1022 |
| approved `step2-dial` | 85 / 120 | 99 | 160 to 168 | 207 to 236 |
| approved `step2-crank` | 85 / 120 | 99.5 | 160 to 169 | 207 to 237 |
| approved `decision` | 85 / 119 | 99.5 | 160 to 168 | 207 to 236 |
| approved `boss-fight` | 83 / 118 | 97.5 | 158 to 166 | 206 to 234 |
| approved `boss-down` | 83 / 117 | 96.5 | 157 to 165 | 205 to 234 |
| build before, `step2-rest` | 59 / 92 | 75.5 | 150 to 152 | 202 to 230, subline 258 to 279, footer 996 to 1011 |
| build after, `step2-rest` (draft, first set 84, 98, 162, 207, 264, 306) | 84 / 117 | 97 | 162 to 166 | 207 to 235, subline 264 to 285 |

DECISION: one set for every step page, the middle of the six later images (`step1-fire` is the older outlier): `titleY` 85, `progressY` 99, `ruleY` 162, `headingY` 208, `sublineY` 264, `contentY` 306. The sizes of the title, the buttons and the type are not changed.

DECISION on content: `contentY` moves by 6, so the gap from heading to content stays 98 px and every page that reads `HEADER.contentY` moves as one piece by 6 px. It does not move by the 17 px that `step2-rest` shows, because that needs the pitch and the footer of each page to change with it.

For the owners, not changed by me:

- `src/pages/step2/layout.ts`: approved first label at y 323 (built 312 after this pass), row pitch 149 (built 143 to 144), footer baseline 1022 (built 1011). `ROW_Y` would be `HEADER.contentY + 11` and the pitch 149.
- `src/pages/marketing/layout.ts`: the nav kept at y 76 and rule 148 by the `NEEDS:` commit; the approved rule lies near y 131.
- `src/pages/step1/layout.ts`, `src/pages/step3/index.ts`, `src/pages/stub.ts`, `src/boss/body.ts` (`progressCentre`): follow `HEADER` by themselves, no number to change.
- The header rule is 6 px in the layout and 9 rows on the approved pages: its height is `[LEFT, ruleY - 2, w, 6]` in `header()`. Left as it is in this pass ("sizes do not change"); to item C or H if the Builder wants it.

Tests that held a number of the old header: none. MEASURED: `npx vitest run` with only `HEADER` changed, 1387 of 1387 passed, no test file touched.

## Looks counted (tuning looks; baseline and three-panel pictures not counted)

| Part | Used | Of |
| --- | --- | --- |
| shell | LOOKS_SHELL | 40 |
| type | 0 | 40 |
| light-engine | 0 | 40 |
| cursor-body | 0 | 40 |

## Measures, before and after

BEFORE at review (`npm run -s measure -- --unit <unit> --tier review`, on a1893333, files in `out/work/shared-look/before/`):

| Unit | M1 | M2 soft share | M3 least ratio | M4 least contrast | M5 | M6 | M7 | M9 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| marketing | pass | 0.0001 | 0.6781 FAIL | 4.61 | 0 px | 0 px | pass | 0 px |
| step1 | pass | 0.0132 | 0.957 | 4.63 | 0 px | 0 px | pass | 0 px |
| step2 | pass | 0.004 | 0.8177 | 4.63 | 0 px | 0 px | pass | 0 px |
| boss | pass | 0.0028 | 0.9429 | 4.63 | 0 px | 0 px | pass | 0 px |
| decision | pass | 0.0932 FAIL | 0.7566 FAIL | 4.63 | 0 px | 0 px | pass | 0 px |
| pinball | BEFORE_PINBALL |

AFTER_MEASURES
