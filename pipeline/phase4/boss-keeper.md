# The boss, kept: notes of the build agent `boss_keeper`

Branch `agent/boss-keeper`. Parts: `boss-body`, `boss-transform`, `boss-weapons`, `verify-card`, `health-bar`, `acting-boss`. Started 03:48 UTC on 2026-11-26 from `main` at 4f64ab7, limit 06:50 UTC.

## Before any change

MEASURED at 03:49 to 03:51 UTC on the untouched tree: `npm test` 96 files, 1345 of 1345 tests; `npm run build` ok; `npm run bots` "all clear". One `draft` still of `boss-fight` at hd: 10.98 s, 652261 triangles, 420 draw calls.

## What the approved images show that a quick look misses

Looked at `boss-fight.png`, `boss-down.png` and `boss-stages.png` at full size and in native crops of the boss, the hole and the wreck.

1. Highlight. The hull is not dark: it is a mid, bright steel whose brushing runs along the long axis, and the light lies on it as broad soft patches that fade across a whole plate, brightest toward the upper left. The legs and the cannon discs are a stop brighter than the hull and nearly white where they face the light. The glass block has no highlight on its face, only on its rounded upper and left edge.
2. Bevel. The octagonal frame has a chamfer about 8 px wide, far wider than a hairline, and it is the brightest band of the hull. Round the cap there is a dark seat about 6 px wide and then a second bright lip. A wreck plate is about 14 px thick and shows its whole lower left flank as a light band.
3. Gap. The pit is not one black pill. Inside the aluminium collar (about 14 px wide, bevelled inward) the wall is rough, dark grey and grainy where the light reaches it on the lower right, and only the floor is near black. Under the hull the dark is deepest right against the legs' roots.
4. Edge. The cracks are long, 60 to 110 px, brown and not black, thickest at the collar, and each ends in a hair after one or two forks. White chips of ceramic, 8 to 14 px, lie beside them with their own small shadows. The glass block's edge is a pale, almost white rounded band 8 to 10 px wide, and the page shows through the block a little greener and darker.
5. The wreck. Every piece is small and lies alone with page all round it: four plain trapezoid plates about 200 by 85 px without any ring or pocket, four short legs of two links with three round joints, two discs with a short barrel, and the glass block lying flat with three or four long cracks inside it. The cap's char is at both ends only, matt black with flaked, broken borders and orange showing through in chips, and the two wisps are thick at the root and curl.

## Looks spent

Counted by part, 40 each for this round. A look is one still rendered and looked at.

| Part | Looks |
| --- | --- |
| boss-body | 38 |
| boss-transform | 19 |
| boss-weapons | 15 |
| health-bar | 1 |
| acting-boss | 5 |
| verify-card | 1 |

## Measures

MEASURED at 04:19 UTC, `npm run measure -- --unit boss --tier review`, 1 m 28.6 s, record `out/work/measures/boss.json`: M1 pass, M2 FAIL (0.761 of 42754 textured pixels under 1 texel per pixel, limit 0.02, key `boss-fight`), M3 pass 0.8574 against 0.8, M4 pass (smallest type 18 px, contrast 4.63), M5, M6, M7, M9 pass. 7 green, 1 red.

M2: the texels view counts only meshes whose material holds a colour `map`. The soft pixels were the halo of each spark and muzzle and the pool under each dart, which stretched step 1's 64 px halo picture over up to 230 px. They are now fans of rings with the light in the corners of their faces (`glow()` in `boss-weapons.ts`), so no picture is stretched. MEASURED after the change, `npm run still -- --key boss-fight --format hd --tier draft --diag texels`: the only textured pixels left are the stars of the darts and the muzzle, all at full density. 

MEASURED at 04:40 UTC after the change, same command, 1 m 30.9 s: M1 pass; M2 pass 0.0088 against 0.02 (24976 textured pixels in 4 stills); M3 pass 0.8779 against 0.8; M4 pass (18 px, 4.63); M5, M6, M7, M9 pass. 8 green, 0 red.

MEASURED at 05:22 UTC on the tree of the second pass (brushed plates, the careers page's slab as the shield), same command, log `out/work/k/measure5.log`: M2 pass 0.0096 against 0.02 (238391 textured pixels in 4 stills); M3 pass 0.9182 against 0.8; 8 green, 0 red. On the way: 0.3313 with the careers page's picture at 1 texel to a page pixel on the block, 0.0274 with the picture finer but not on the block's wall.

## Decisions

1. The hull is cast metal, no brushing: the brushed streaks came from the normal map on a full metal, which is gone. Plate 0xb2b6ba, roughness 0.42.
2. The numerals stay on the cannons (settled by the brief).
3. A wing breaks into two halves when the boss splits, so the wreck holds six small plates where the approved image holds four. Whole wings as wreck were the "few large flat plates" of the brief.
4. The cursor's scorch at the power-down is `heal()` and then `hurt('scorched')` in the page's script: the damage window of the earlier hits cut the scorch short without the `heal()`.
5. The knees of the legs bend outward on both sides, as approved.
6. The fired slabs take the lacquer numbers of step 1's slabs (colour 0xa00d0b, roughness 0.46, coat 0.09).
7. The rim of the health track is lit by the lamps and not by the room: metalness 0.25 in place of 1, so the side toward the key light is the bright one.
8. A barrel turn of 0.70 rad is seen at `boss.lastStand` at 0.98 (26.9 s, cannon 0).
9. `content/copy.json` holds no key for the four stage words of the sheet (Resting, Breaking loose, Unfolding, Boss): none added, told to the Builder.
10. The merge commit 3f01ed8f was pushed without the trailer, by my mistake. History is not rewritten; every later merge carries it.
11. The halo and pool of the weapons are geometry with vertex colours, not a stretched picture (see Measures).
12. The smoke ring of the muzzle was wound the wrong way round and so was never drawn: found by forcing it opaque in a still. It is dark smoke (0.2 grey), since a mid grey does not read on the page.
13. The hull came out too pale at 0xb2b6ba beside the approved image: it is now 0x6f7378, roughness 0.38, still without brushing. The pockets are 0x63666a.
14. The glass block is clearer (opacity 0.44 over a floor of 0.38), its bright edge is a thin half clear band and it holds four cracks, not six.
15. The collar of the pit is a satin grey of its own (0x9a9c9c, roughness 0.6) and the wall under it is lighter and rougher, so the wall reads as broken stone and only the floor is near black.
16. The cursor is scorched twice by the script: at the power-down and again when the hot cap lands (1.2 s into the collapse, for 2.4 s), so the scorch is fresh at the key `boss-down` and gone before the unit ends, as `tests/boss.test.ts` asks.
17. The sheet shows no captions: ruled by the Builder at 04:44 UTC, the words of the approved sheet are the picture's own and no key is added.
18. The lower pair of legs read near black: the faces of their links lean about 30 degrees away from the key light, because a leg comes down 107 px from the hip to the foot. Each foot now carries a stem 52 px tall with the ball on its top (`ANKLE` in `src/boss/real/body.ts`), so a leg leans about half as much. The stem shrinks to nothing as the boss folds or falls flat. The links are a less mirror like metal (metalness 0.5, roughness 0.45).
19. Ruled by the Builder at 05:07 UTC: the hull is brushed. Decisions 1 and 13 are withdrawn. The plate is 0x7c8085, roughness 0.34, full metal, with a computed picture of fine straight lines along x as its colour map (`brushPixels()` in `src/boss/real/body-kit.ts`, 512 x 128 px, 0.33 MB with mips, 2.4 texels to a page pixel). Every plate is long along its own x, so the lines run along the long axis of each.
20. Every cut plate shows its thickness: a chamfer 2.4 px wide in two facets on the top edge, which the key light turns into a bright line, and a darker solid 3 px wider under it that ends 3.4 px lower (`EDGE`, material `plateSide` 0x35373a). The top face's normals lean by a hair (`CROWN`), so the sheen fades across a plate.
21. Wing halves are kept (ruling 2 left the choice to the comparison). The two halves of a wing now land in one heap, one lying on the other, at the places where the approved image holds a plate; with the two side plates the wreck shows four dark plate pieces. A half carries no bright lip and its bed is dark. A wrecked leg folds to 116 px between hip and foot (was 140).
22. The legs' links are 90 px (were 98) so a leg is straighter, and the shield stands 24 px further out and is 216 px tall (was 250), so the knees of the left pair no longer cross it. The links are a shade darker (0xb2b6ba).
23. The arrow aims along its shot: the script turns it to the line from its tip to the boss and 0.36 rad further up (`AIM_LIFT` in `src/pages/step4/index.ts`). MEASURED by a probe at the key (12.5 s): the cursor's own lean while it fires is 0.42 rad against 0.22 at rest and its spin lags by 0.03, so without the lift the arrow lay 0.24 rad below its shot, which is the flat arrow of the first report.
24. The scorch is held to the end of the film unit, ruled by the Builder at 05:07 UTC. In the film the script scorches the cursor at the power-down (27.2 s) and again when the wreck has come to rest (29.2 s, the moment the cursor sags), each for the cursor's longest 3.4 s, so the state is on at the key (29.0 s) and still on when the unit ends (32 s). Live visitors keep the first scorch only, and the page still waits for a whole cursor before it is done. In the film the page is done 0.35 s after the press whatever the cursor's state, since the film turns the page by the clock. `tests/boss.test.ts`: the check "leaves the cursor whole from the collapse on and when the film turns the page" held the opposite of the ruling at 31.5 s; it now holds that the cursor is scorched at the key and at 31.5 s, that the page is done, and, unchanged, that nothing hits the cursor after the power-down. Decision 16 is withdrawn.
25. The shield is the careers page's slab: `slabGeometry`, `SLAB` and `glassOptions` of `perk-cards.ts` are imported, so the shade of the ground edge and the bend near the rim are that page's. Its material is a grey of its own (0x808c89, 0.86 opaque) with the same picture laid finer (2.4 texels to a page pixel), and the picture also runs down the wall (`walled()`), because the block leans and its wall is seen: the careers page's 1 texel to a pixel failed measure M2 on the block (0.33 soft at `boss-fight`), and the wall alone left 0.027.
26. The spark of a dart on the shield was hidden: the slab is now nearly opaque and writes depth, and the plan put the spark at 60 px, inside the glass. `SHIELD` in `src/boss/plan.ts` is now `half: 108` (the block's real half height, was 118, so a dart that passes the block's end goes on to the hull) and `z: 92` (on the outer face of the leaning block). The spark's star is larger and fades slower (`(60 + 70 sqrt(u)) (1 - u)^1.1`), nearer the burst of the approved image. MEASURED after it, `npm run measure -- --unit boss --tier review`: M2 0.0095, M3 0.9226, 8 green.
27. The links of the legs are 0x9a9ea3 (were 0xc2c6c9): beside the darker hull the pale links read as another metal. The glass is 0x8c9895, 0.82 opaque. The smoke ring fades slower (`(1 - u)^0.8` at full strength).
28. The plates' roughness is 0.4 (was 0.34): while the plates fly in `boss.unfold` the tighter highlight filled whole plates with near white (share of pixels at 250 or more on every channel 0.051 before, 0.005 after, one still of the unfold at 0.5). The hull in the two keys keeps its sheen.
29. The pit: the collar is wider (`PIT.collar` 15, was 12) and lighter (0xb6b8b8), with a rolled lip, and the wall under it is darker (0x5a5550, was 0x7a746d) and steeper, so the hole reads as approved's bright ring round a black pit and not as a grey bowl. Judged from one crop beside approved's.
30. The plates darken as the boss falls: the plate material's colour eases from 0x7c8085 to 0x4a4d51 with the hull's `flat` (`PLATE_TONE` in `src/boss/real/body-kit.ts`, set in `poseFrame`). Lying flat under the room's light the live steel read as large pale sheets, and approved's wreck is dark pieces. One material is shared by the hull, the wings and the two side plates, and they all fall together, so one colour serves. Judged at `--key boss-down` beside approved and at `boss.collapse` 0.45 for the change in flight.
31. The verification card is the careers page's slab of pale glass (`slabGeometry`, `glassOptions`, `SLAB`, `GLASS`, `cardGlass` imported from `src/pages/marketing/real/perk-cards.ts`), not the shell's grey card: round 10's cards on main (R1-1 issue 1, R3-1 issue 0) call the card opaque grey plastic, and approved's is pale sea-green ground glass with a lit bevel. Its picture is the block's finer clone, so M2 holds: MEASURED `npm run measure -- --unit boss --tier review`: M2 0.0028 of 709585 textured px, M3 0.9424, 8 green. The key of the card is its own (`verify-card:w:h:r:thick`), the geometry is made per size and dropped with the part. The box, tick and rule are untouched.
32. The sheet's Unfolding state: the feet are drawn at 0.62 of their reach from the hips with the legs at 0.7 open, and the side plates 64 px from the middle (was 78), so the state reads as approved's compact plate with short bent legs and not as the whole boss without its guns (round 10, R1-1 issue 4). Only the sheet changes; the film's unfold is as it was.
33. Not solved: in the sheet's Breaking loose state a dark hairline runs level across the tilted cap (round 10, R1-1 issue 15). MEASURED by two stills: it lies on the upper edge of the open hole's inner well and does not move when the cap is lifted further (`cap.lift` 0.5 and 0.64 give the same line), so it is not the cap cutting a surface of mine. UNKNOWN what draws it; the wells are cut by the shell's view. Left as it was.
34. Not done: the bright bezel round the resting button (round 10, R1-1 issue 13). At rest the socket is the shell's pocket; a collar there needs a wider pocket and a new shape in a state three measures read (M5, M6, M9), and there was no time to prove it green.
35. The cracks of the fallen glass are finer (bright line 0.62 px half width, was 1.15; the dark line under it 0.8, was 1.1) and taper further to their ends: round 10 (R1-1 issue 11, R3-1 issue 2) reads them as lines of one width painted on. They are still lines on the face, not broken surfaces: see the least real list.
