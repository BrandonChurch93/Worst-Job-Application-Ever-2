# boss-finish notes

Branch `agent/boss-finish`, from `origin/main` cfd83123. Start 10:02, limit 13:08 on my clock (about 6 minutes ahead of the Builder's).

## Before any change (MEASURED, 10:03 to 10:08)

| what | command | number |
| --- | --- | --- |
| tests | `npm test` | 115 files, 1461 of 1461 |
| build | `npm run build` | ok |
| bots | `npm run bots` | all clear |
| `boss-fight` draft | `npm run still -- --key boss-fight --format hd --tier draft` | about 12 s, 651090 triangles, 475 draw calls |

## What the approved images show that a quick look misses

1. Shield: a thick slab of glass about 95 by 250 px, tilted 6 to 8 degrees, a thin bright outer rim, a dark line inside it, a lit bevel of 8 to 10 px on the upper left runs and a dark green band of about 10 px on the right and lower runs; the face falls from about 170 at the top to about 135 at the foot, with soft dark bars of the body seen through it.
2. Highlight: the cap carries one long soft window along its upper edge that stops short of the domed ends; the approved cap is plumper (about 300 by 90) than the build's.
3. Gap darkness: under plates and legs and in the socket the gaps go near black with soft edges; the steel faces stay mid grey and end in a thin bright line on the lit side.
4. Unfolding: the plate hugs the button, small trapezoid plates above and below it, short bent legs, no cannons and no shield yet.
5. Wreck: small plain brushed slabs with a visible wall and a hard shadow; the lying shield is a long clear bar with fine cracks; the fallen cap has burnt, blistered ends with chips cut into the outline and smoke that curls from the ends.

## Round 10 issues still true at 10:14 (first looks, draft, beside approved)

Severe
- R1-1 3: shield.
- R1-1 5: Unfolding state on the sheet.
- R1-1 4: arrow in `boss-down` (stands, must sag at the key; ruling of 10:15).

Major
- R1-1 8: body plates and bezel. R1-1 10: slabs not in a column.
- R1-1 11, R3-1 4: fallen cap. R1-1 12, R3-1 3: lying shield. R1-1 13, R3-1 5: wreck pieces.
- R1-1 14: Resting bezel. R1-1 17: socket floor.
- Sheet drawn at 0.86 of the approved size. Health track gradient (approved 200 to 75 left to right, build 151 to 99).

Closed in my eyes at the first look: R1-1 1, 2 (mostly), 6, 7, 16, 18. Motion and acting issues (R4, R9) not looked at yet.

## Looks by part (40 each this round, counted from the first still)

Counted at 10:50.

| part | looks | what they were |
| --- | --- | --- |
| boss-body | 18 | diagnosis compares 2, shield stills 4, `boss-fight` compares 7, one `review` still, leg compares 2, wreck compares 2 |
| boss-transform | 13 | diagnosis `boss-down` 1, sheet `boss-stages` 4, `boss-down` compares 8 |
| boss-weapons | 5 | `boss-fight` compares |
| verify-card | 1 | diagnosis |
| health-bar | 3 | diagnosis 1, track crops 2 |
| acting-boss | 2 | `boss-down` stills for the sag |

## Decisions

- Shield: glass pane with a thin bright bead (4.4 px), a painted dark green band inside the rim (vertex colour ring, deeper on the far side), tilt 0.1 rad when it stands, hinge pins moved to the pane's boss-side edge with short rods.
- Slabs: first salvo re-timed (`SLAB.every[0]` 1.56 s, `salvoGap` 0.11, `fan` 0.2) and the middle shot fired from the upper cannon so the three tags stand in a loose column at the key; all tags tilt the same way as in the approved image; the cursor's snap aside moved with it (`ACT.snap` 11.94).
- R1-1 4: the arrow sags at the key `boss-down` (Builder, 10:15); the earlier ruling held in `SAG_AFTER` and its test is replaced.

## MEASURED

| what | command | number |
| --- | --- | --- |
| `boss-fight` draft after shield and slabs | `npm run compare -- --key boss-fight --tier draft --format hd` | 651810 triangles, 476 draw calls, about 12 s |
| `boss-fight` review | `npm run compare -- --key boss-fight --tier review --format hd` | 24.5 s, 652450 triangles |
| gate at 10:21, 10:35, 10:39, 10:46 | `npm test`, `npm run build`, `npm run bots` | 115 files, 1461 of 1461; build ok; bots all clear |

## More decisions

- Shield resized to 92 by 244 (`SHIELD` in `src/boss/body.ts`) so its proportion is the approved one in both keys; the darts aim at its outward face.
- The sheet `boss-stages` is drawn at 1920 by 1080 with the four stages at the approved stations (`STAGES` in `src/boss/body.ts`); Unfolding is the fight rig with its legs folded at the corners, no cannons and no shield.
- Legs: links 80 long, so a standing leg is nearly straight and the rod telescopes for the rest; links lie face up.
- Wreck: the frame halves break along a toothed line (`TEAR`), walls go dark, pins, screws and joints go dull with the plate (`WORN`).
- Lying shield: more tint (`CLEAR_GLASS.lying` 0.5), a green bead in place of the pale one, wider crack lines (`CRACK`).
- Fallen cap: lacquer with a clear coat, both ends burst open with a raised torn lip (`HOLES`, `LIP` in `pill.ts`), smoke that meanders.

## Round 14 (R1-1, R3-1) by issue

| issue | state at 10:50 |
| --- | --- |
| R1-1 1 severe, boss silhouette | legs straight and steel, barrels heavier with bores and collars, screws smaller and duller; face frame shape unchanged |
| R1-1 2 severe, red tiles | three in the air in a loose rising group, all tilted one way; lane check still to look at |
| R1-1 7 severe, stations | stages at the approved stations, sheet at 1920 by 1080 |
| R1-1 8 severe, legs | Unfolding legs folded at the corners; boss legs straight steel |
| R1-1 9 major, shield | tinted pane, bead, dark band; darts and flash on the outward face |
| R1-1 10 major, cap, tiles, fill, channel | cap lacquer done; track graded; indent and fill still open |
| R1-1 11, 15 major, socket | collar rolled and brighter; weathering and chips open |
| R1-1 12 major, wreck | toothed breaks, dark walls, dull pins; glass slab with wider cracks |
| R1-1 13 major, scorched cap and smoke | burst ends, soot, meandering smoke |
| R1-1 14 major, layout of the wreck | halves spread on a wider diagonal, none stacked, socket clear |
| R1-1 16 major, resting and breaking loose | open |
| R3-1 1 major, torn ends | pits with a raised lip at both ends; wall thickness still thin |
| R3-1 2 major, fallen shield | page seen through a green tint, wider bright cracks |
| R3-1 3 minor, trail | open |

