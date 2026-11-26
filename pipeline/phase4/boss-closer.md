# boss-closer notes

Branch `agent/boss-closer`, from `origin/main` 997de9fb. Limit 10:00 UTC on 2026-11-26.

## Before any change (MEASURED, 06:56 to 06:59 UTC)

| what | command | number |
| --- | --- | --- |
| tests | `npm test` | 102 files, 1390 of 1390 |
| build | `npm run build` | ok |
| bots | `npm run bots` | all clear |
| `boss-fight` draft | `npm run compare -- --key boss-fight --tier draft --format hd` | 11.317 s, 677853 triangles, 473 draw calls |
| `boss-down` draft | `npm run compare -- --key boss-down --tier draft --format hd` | 11.441 s, 562687 triangles, 388 draw calls |
| sheet `boss-stages` draft | `npm run compare -- --sheet boss-stages --tier draft --format hd` | 9.058 s, 664450 triangles, 503 draw calls |

## What the approved images show that a quick look misses

1. Highlight: every gloss part (cap, tags, arrow face) carries one long soft window highlight along its upper edge, not a dot; on the cap it runs the whole length and stops short of the domed ends.
2. Bevel width: the glass card and the shield have a bevel of about 6 to 8 px at 1920 wide that is brighter than the face on the upper and left runs and darker than the face on the lower and right runs; the face itself is even.
3. Gap darkness: between plate and button, under the legs and inside the socket the gaps go to near black with a soft edge; the hollows carry the contrast, the steel faces stay mid grey.
4. Edge: the steel plates end in a thin bright line on the lit side and a warm reflected line on the lower side; nothing ends in a plain cut.
5. Glass: the page is seen through the glass as a lighter, cooler page with its shadow moved to the lower right; cracks are thin and bright on one side, dark on the other, and they stop short of the edge.

## Round 10 issues still true at 07:00 UTC (first three looks, draft, beside approved)

Severe
- R1-1 1: arrow in `boss-fight` points nearly right, small and grey. Mine: the direction at the key moment. Not mine: body and size.
- R1-1 2, R3-1 1: verify card reads as a pale opaque panel, weak bevel, no page seen through.
- R1-1 3: shield is a mint slab with a thick pale frame, no thin bright edge.
- R1-1 4: arrow in `boss-down` clean, no chips or flecks, no sag.
- R1-1 5: Unfolding state is the full plate with long legs.

Major
- R1-1 8, 13: plates dark and flat with bright rivets (wreck) and light with rivets (fight); cannon discs flat, no domed housing.
- R1-1 11, R3-1 4: fallen cap a thin plank, scorch printed, rim whole.
- R1-1 12, R3-1 3: broken shield opaque with pale frame, cracks as even pale lines.
- R3-1 5: wreck fragments without wall or underside.
- R3-1 6, R1-1 17: socket cracks as ink strokes; socket floor flat black.
- R1-1 14: Resting state in a black rim. R1-1 16: seam across the tilted cap.
- R1-1 10: tags not in a column; Session expired over the socket.
- R1-1 6, 7: orange duller, tags matte (the one orange is not mine; the tag lacquer is).
- R1-1 18: fine print under the card in `boss-fight`.
- R4-1 1, 4; R4-2 1 to 4; R9-1 1 to 4; R9-2 1 to 5: not yet checked on motion sheets, taken as true.
- R8-1 1: gap of about 220 px between helper line and Submit at rest.

Minor
- R1-1 19: wisps rise from mid cap, thin and even.

## Looks by part (40 each this round, counted from the first still; one render that shows two parts counts for both)

| part | looks at 07:40 UTC | what they were |
| --- | --- | --- |
| diagnosis (all parts, before change) | 3 | the two keys and the sheet beside approved |
| verify-card | 8 | `boss-fight` at draft 7, at review 1 |
| boss-body | 14 | `boss-fight` 8, `boss-down` 6 |
| boss-transform | 11 | `boss-down` 6, sheet `boss-stages` 5 |
| boss-weapons | 2 | motion sheet `boss.popups` 1, `boss-fight` compare 1 |
| health-bar | 1 | still of `boss.lastStand` at 0.22 |
| acting-boss | 15 | motion sheets 6 (verify twice, popups, unfold, lastStand, press), stills of single moments 9 |

## Decisions

- Glass does not transmit by refraction, and why. Real transmission was tried in Phase 3 and declined: it drew the opaque scene a second time (7.3 s and 122 draw calls against 4.5 s and 84, STATED in `kit/PROGRESS.md`) and it hid the shadows that fall on the glass. The shared glass is therefore opaque with a computed picture of the page under it. For the verify card and the shield I use neither: both are alpha blended panes (card 0.86 through, shield 0.8) so the real page and the real arm are seen through them, with an opaque polished bead as the bright edge and vertex colours on the bevel. It costs no second pass. What it cannot do: bend what is behind it.
- Why a paragraph showed under the verify card in `boss-fight`: `verify-fine-open` in `layout.ts` has `states: OPEN`, the three open states of the card, so it stayed through the fight. It is now taken out of the draw list once the state `fight` is on. At rest and while the card opens it is drawn as before. No test of copy use needed it (1395 of 1395 pass).
- Arrow in `boss-fight`: `AIM_LIFT` 0.36 to 0.72, so the stem lies about 40 degrees up to the right as in the approved image and the tip is on the dart line.
- Arrow in `boss-down`: the cursor has no chipped state (its damage states are burn, shredded, reassembled, flattened, scorched), so it is scorched, smoking and sagging (`exhausted`, called 1.45 s into the collapse). Its size is settled and small; the approved arrow is larger and is not to be matched in size.
- Plates: tone `0x8e9296` alive and `0x9a9ea2` in the wreck, roughness 0.46, brushing 0.42 deep. Before, the wreck's plates were `0x4a4d51` and read as dark flat shapes with bright rivets.
- Fallen cap: its own geometry (`src/boss/real/pill.ts`), 33 px tall against 18, a quarter ellipse in section, with blisters, a dent and three nicks. It is drawn in the shared orange. The live cap stays the shared button; the change of one for the other happens the moment the cap leaves the frame, at the same height (the pill is scaled to 18 px there and grows as it falls).
- Acting, both modes unless said: pride for 1.2 s when the box is ticked; shocked from the crack, then scared from the moment the legs come out to the end of the unfold (the reactions `rear` and `cower` are gone from the unfold, they read as a slump); a kick back on every shot and a flinch on the first shot of a burst; a cower and a kick away when a pop-up lands; after a hit, buckled (`exhausted`) for 1.1 s; at the second phase, squared up (`proud`) for 0.8 s and only then `angry` with the fume; at Session expired, a double take and `shocked` held for 1.5 s in place of the hurt pose; at the last press a stamp, then `proud` from 0.42 s. Film only: the hover by the box from 1.25 s, the dart to the far edge of the card at 6.95 s and the stand there to 8.7 s, the loaded point at 9.45 s, the press at 29.88 s and `done` 1.5 s after it (live keeps 0.35 s).
- The bar's jump back up: a piece `health-gain` lies on the end of the fill for 1.6 s after Session expired, the same orange with its own light, fading from 1.0 s.
- `tests/boss-closer-acting.test.ts` is new: five checks of the held poses and of the bar's gain in the film.
- Merge of `origin/main` at 07:34 UTC was pushed before the whole test run on the merged tree; the run after it was green (1395 of 1395, build, bots, 07:36 to 07:39 UTC). From here on the run comes before the push.

## After the first pass (MEASURED, 07:34 to 07:40 UTC)

| what | command | number |
| --- | --- | --- |
| tests | `npm test` | 103 files, 1395 of 1395, 72.8 s |
| build | `npm run build` | exit 0 |
| bots | `npm run bots` | all clear |
| measures | `npm run measure -- --unit boss --tier review` | 8 green, 0 red; M3 0.8132 (least 0.8) |
| `boss-fight` draft | `npm run compare -- --key boss-fight --tier draft --format hd` | 11.094 s, 642352 triangles, 472 draw calls |
| `boss-fight` review | `npm run still -- --key boss-fight --format hd --tier review --force` | 23.055 s, 642352 triangles, 472 draw calls |
| `boss-down` draft | `npm run compare -- --key boss-down --tier draft --format hd` | 11.534 s, 531478 triangles, 388 draw calls |
| sheet `boss-stages` draft | `npm run compare -- --sheet boss-stages --tier draft --format hd` | 9.066 s, 651466 triangles, 500 draw calls |

Textures: none added. STATED from the recipes: soot 512 x 128 (0.33 MB with mips), puff 64 x 64 (0.021 MB), brushing 512 x 128 (0.33 MB).

## Second pass (07:40 to 08:20 UTC)

Decisions:

- Seam on the lifted cap (R1-1 issue 16): the line moved with the socket when the socket was moved in the sheet, so it was the top edge of the `ink` toned well showing through the cap and not a seam of the cap. The wells are now toned `dark` while the cap lies over the hole (sheet stage 1, and the first 0.6 s after the lift in the film), `ink` after. The check in `tests/boss.test.ts` that asks for `ink` at 12 s was not touched and passes.
- Bezel at Resting (R1-1 issue 14): the sheet's Resting stage is drawn with the steel rim of the socket and a floor 5 below the page.
- Page at rest (R8-1 issue 1): not changed. `kit/02-SUBJECT.md` line 447 says "The socket is at the bottom center of the page, as the approved images show it."; Submit under the helper line would break both approved keys.
- Pop-ups as shields (R9-1 issue 7): they already stopped the darts. Now each dart kicks the dialog along its line on a spring (`POPUP.kick`, `spring`, `damp`), its title, words and buttons move with it, and the one that is shot down leans 13 px and holds its damage 0.34 s before it closes. A pressed button also holds 0.34 s.
- Session expired slab (R4-2 issues 2 and 3): a slab's landing point is moved short or long so that none comes to rest across the open socket (`SOCKET_CLEAR` in `src/boss/fight.ts`). A slab that hits the arrow drives 30 px on through it, a slab that lands plainly skids 16 px. Cracks that grow where a slab lands are not built.
- Collapse (smaller read of 07:12Z and R4-1 issue 4): the machine draws in on itself for 0.6 s (`FOLD`) before it falls apart; heavy plates stop first and at once, light parts overshoot and skid (`LANDS`); the hop is 0.4 of what it was so it reads less as a blast.
- Charge of the last stand (R9-1 issue 6): the arrow holds 0.15 s longer, winds up (`anticipate` at 24.2 s) and stamps at point blank (26.9 s), in the film.
- Wreck: steel `0x6c7076` (was `0x9a9ea2`), the shelves of the halves in brushed plate, the pins, rods and tubes of the torn shield hidden once it lies flat, the lying shield deeper green and less clear (`CLEAR_GLASS.lying` 0.62, `deep` `0x5f8376`).
- Live plates `0x7b7f85` (was `0x8e9296`), nearer the dark brushed steel of `boss-fight.png`.
- Socket collar: no normal and no roughness map (the dotted pattern is gone), a flat steel lip 5.8 px wide that stands 0.6 over the page and a steep step down behind it, pit wall `0x34312e`.
- The smoke over the scorched arrow and the size and line of the arrow in `boss-down` belong to the cursor (frozen for me); said to the Builder and to look_fixer.

Looks added since 07:40 UTC, by part (first-pass counts above):

| part | added | total | what they were |
| --- | --- | --- | --- |
| verify-card | 0 | 8 | |
| boss-body | 11 | 25 | `boss-fight` compare 4, `boss-down` compare 7 |
| boss-transform | 16 | 27 | `boss-down` compare 7, sheet `boss-stages` 8, beat sheet unfold 1 |
| boss-weapons | 7 | 9 | `boss-fight` compare 4, beat sheet popups 1, motion sheets `slab-drop` 1 and `hit` 1 |
| health-bar | 2 | 3 | beat sheet lastStand 2 |
| acting-boss | 9 | 24 | beat sheets popups 1, lastStand 2, collapse 3, unfold 1, press 1, motion sheet `hit` 1 |

## Third pass (08:20 to 08:45 UTC)

Decisions:

- Shield (R1-1 issue 12 and the `boss-fight` crop): the pane has a ground edge 12 px wide (`RIM.shield`), steel grey while it stands (`CLEAR_GLASS.edge` `0x727d7a`, metalness 0.7) and a pale glass bead once it lies (`bead` `0xc9dad4`, metalness 0.05); the lying bead casts a shadow, which costs 2 draw calls in `boss-down` (379 to 381, still under the 388 I was given).
- Resting bezel (R1-1 issue 14): drawn with `drawRim` alone. The whole socket under a seated cap cost 257100 triangles for nothing seen (sheet 883438 with it, 626718 with no socket, 638338 with the rim alone, MEASURED with `npm run compare -- --sheet boss-stages --tier draft --format hd`).
- Sweat in `boss.verify` (smaller read of 07:12Z): the beads are drawn by the cursor, 2 to 3 px wide in a 1920 frame, and are not mine to make larger. The arrow now hangs back on bare paper under the fine print (`STAND` in `script.ts`, 104 right and 132 below the box) instead of on the words, and turns nervous within 190 px of the box (was 150), so the beads and the tremble have a plain ground.
- Slab landings (R4-2 issues 2 and 5): a slab kicks up a low ring of paper dust for 0.5 s where it lands or hits (`LAND_DUST` in `src/pages/step4/real/boss-weapons.ts`): discs with a soft rim, vertex alpha, no texture, one draw call while it shows.
- Char on the fallen cap (R1-1 issue 11): the pale ash specks in the soot are darker (`grey` 74 to 40), so the burns read as char and not as a speckled print.
- Plates (R3-1 issue 5): the flange under each plate is dark on the live machine (`FLANGE_TONE.live` `0x35373a`) and lit steel in the wreck (`dead` `0x74777b`, roughness 0.44), so a fallen plate shows a wall with a bright edge. Lit steel on the live machine was tried and taken back: M3 fell to 0.798 against 0.8 (the dark gaps between the plates are part of the fine detail of `boss-fight`), with the dark flange it is 0.8063. The margin is thin.
- Cursor in `boss-down`: said to look_fixer at 08:20 UTC that `exhausted` with `scorched` shows as a folded shape about 50 px tall with no dark outline.

MEASURED at 08:40 UTC:

| what | command | number |
| --- | --- | --- |
| measures | `npm run measure -- --unit boss --tier review` | 8 green, 0 red; M3 0.8063 (least 0.8) |
| `boss-fight` draft | `npm run compare -- --key boss-fight --tier draft --format hd` | 11.618 s, 642536 triangles, 472 draw calls |
| `boss-fight` review | `npm run still -- --key boss-fight --format hd --tier review --force` | 23.174 s, 642536 triangles, 472 draw calls |
| `boss-down` draft | `npm run compare -- --key boss-down --tier draft --format hd` | 11.78 s, 533654 triangles, 381 draw calls |
| sheet `boss-stages` draft | `npm run compare -- --sheet boss-stages --tier draft --format hd` | 9.543 s, 638338 triangles, 501 draw calls |

Looks added since 08:20 UTC, by part:

| part | added | total | what they were |
| --- | --- | --- | --- |
| verify-card | 0 | 8 | |
| boss-body | 14 | 39 | `boss-fight` compare 6, `boss-fight` at review 3, `boss-down` compare 5 |
| boss-transform | 8 | 35 | `boss-down` compare 5, sheet `boss-stages` 3 |
| boss-weapons | 5 | 14 | `boss-fight` compare 1, motion sheet `slab-drop` 1, stills of a landing 2, sheet of the unit 1 |
| health-bar | 0 | 3 | |
| acting-boss | 5 | 29 | beat sheet verify 1, stills of the stand 3, sheet of the unit 1 |

## Fourth pass (08:42 UTC on)

Ruling of the Builder at 08:42 UTC (the arrow at `boss-down`): at the key the arrow stands, with hurt `scorched` on a standing act, and exhaustion comes after the key's moment with a seen change. The cursor model is not changed.

- Built: the arrow walks to the fallen button (28.0 to 28.6 s), stands there in act `plain` and is scorched from 29.0 s, sags to `exhausted` 0.15 s after the key (`SAG_AFTER` in `src/pages/step4/index.ts`), drags itself over and presses at 29.88 s, then holds `proud`. The sag in the collapse is gone.
- `tests/boss-closer-acting.test.ts`: the last test now holds the ruling (plain from 28.6 to 29.05 s, exhausted held 0.9 s or more between 29.05 and 30.4 s, proud 1.5 s or more after the press). It was changed because the ruling changes what it holds.
- SEEN in `npm run compare -- --key boss-down --tier draft --format hd` at 08:44 UTC: the arrow stands upright with its dark outline beside the fallen button. Its scorch marks are too small to read at this size (the cursor's size and its marks are not mine).

Looks: acting-boss 30 (one `boss-down` compare).

- Slabs (the `fired-0` crop of `boss-fight`): the lacquer is a deeper red with a line of light on the upper bevel (`LACQUER` in `src/pages/step4/real/boss-weapons.ts`: colour `0xba0a0b`, coat roughness 0.15, room 0.7). Before, the room's reflection laid a pale haze on the face and the slab read rose and matte. The shape of the slab is step 1's (`makeSlab`), not mine; its side walls stay less shaded than approved. Looks: boss-weapons 18 (four `boss-fight` compares).
- MEASURED 08:49 UTC, `npm run compare -- --key boss-fight --tier draft --format hd`: 11.718 s, 642536 triangles, 472 draw calls.
- Cracks round the socket: drawn 2.5 times their plan width (was 1.7) and a little darker (`0x33231b`), in `src/boss/real/transform.ts`. SEEN at 08:55 UTC in a crop of the `boss-fight` draft beside approved: the roots are about as heavy as approved; the colour of that look was `0x2b1e17`, which read black, and the committed `0x33231b` was not looked at by itself. Looks: boss-transform 36, boss-weapons 19 (a crop of the dart line and the burst: close to approved, not changed), acting-boss 31 (sheet of the unit: at 2:18.23 the arrow stands by the fallen button; in the sag after it the melted shape is hard to see on the paper, which is the cursor's own drawing).

On main with merge 30 (the shared look, 7f82c9cc), MEASURED 09:00 to 09:04 UTC:

| what | command | number |
| --- | --- | --- |
| gate | `npm test`, `npm run build`, `npm run bots` | 112 files, 1442 of 1442; build ok; bots all clear |
| measures | `npm run measure -- --unit boss --tier review` | 8 green, 0 red; M3 1.0339 (least 0.8; 0.8148 before the merge) |
| `boss-fight` draft | `npm run compare -- --key boss-fight --tier draft --format hd` | 12.215 s, 645616 triangles, 474 draw calls |
| `boss-down` draft | `npm run compare -- --key boss-down --tier draft --format hd` | 12.599 s, 536734 triangles, 383 draw calls |

SEEN in both compares at 09:01 UTC: nothing of the boss reads worse on the shared look. The caps are glossier and a brighter orange (the seated cap now has the approved gloss), the health fill carries a line of light, the legs are brighter. Looks: boss-transform 38 (the two compares, also for the cracks at their committed colour).
- Plates one step darker (R1-1 issue 13 and the `boss-fight` crop): `PLATE_TONE` live `0x6b6f75` (was `0x7b7f85`), dead `0x5d6166` (was `0x6c7076`) in `src/boss/real/body-kit.ts`. SEEN at 09:06 UTC in both compares: the live plates and the wreck's plates are nearer the approved dark steel; the legs stay brighter than approved. MEASURED 09:06 to 09:09 UTC on main at 7f82c9cc with this change: `npm test` 112 files, 1442 of 1442; `npm run build` ok; `npm run bots` all clear; `npm run measure -- --unit boss --tier review` 8 green, 0 red, M3 1.0325. Looks: boss-body 40 (the budget of this part is spent), boss-transform 39.
