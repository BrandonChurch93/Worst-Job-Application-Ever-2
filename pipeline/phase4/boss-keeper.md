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
| boss-body | 21 |
| boss-transform | 7 |
| boss-weapons | 11 |
| health-bar | 1 |
| acting-boss | 3 |
| verify-card | 0 |

## Measures

MEASURED at 04:19 UTC, `npm run measure -- --unit boss --tier review`, 1 m 28.6 s, record `out/work/measures/boss.json`: M1 pass, M2 FAIL (0.761 of 42754 textured pixels under 1 texel per pixel, limit 0.02, key `boss-fight`), M3 pass 0.8574 against 0.8, M4 pass (smallest type 18 px, contrast 4.63), M5, M6, M7, M9 pass. 7 green, 1 red.

M2: the texels view counts only meshes whose material holds a colour `map`. The soft pixels were the halo of each spark and muzzle and the pool under each dart, which stretched step 1's 64 px halo picture over up to 230 px. They are now fans of rings with the light in the corners of their faces (`glow()` in `boss-weapons.ts`), so no picture is stretched. MEASURED after the change, `npm run still -- --key boss-fight --format hd --tier draft --diag texels`: the only textured pixels left are the stars of the darts and the muzzle, all at full density. 

MEASURED at 04:40 UTC after the change, same command, 1 m 30.9 s: M1 pass; M2 pass 0.0088 against 0.02 (24976 textured pixels in 4 stills); M3 pass 0.8779 against 0.8; M4 pass (18 px, 4.63); M5, M6, M7, M9 pass. 8 green, 0 red.

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
