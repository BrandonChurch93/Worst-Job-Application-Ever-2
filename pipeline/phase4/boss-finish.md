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

| part | looks | what they were |
| --- | --- | --- |
| boss-body | 8 | diagnosis compares 2, shield stills 4, `boss-fight` compares 2 |
| boss-transform | 2 | diagnosis `boss-down` 1, sheet 1 |
| boss-weapons | 3 | `boss-fight` compares |
| verify-card | 1 | diagnosis |
| health-bar | 1 | diagnosis |
| acting-boss | 0 | |

## Decisions

- Shield: glass pane with a thin bright bead (4.4 px), a painted dark green band inside the rim (vertex colour ring, deeper on the far side), tilt 0.1 rad when it stands, hinge pins moved to the pane's boss-side edge with short rods.
- Slabs: first salvo re-timed (`SLAB.every[0]` 1.56 s, `salvoGap` 0.11, `fan` 0.2) and the middle shot fired from the upper cannon so the three tags stand in a loose column at the key; all tags tilt the same way as in the approved image; the cursor's snap aside moved with it (`ACT.snap` 11.94).
- R1-1 4: the arrow sags at the key `boss-down` (Builder, 10:15); the earlier ruling held in `SAG_AFTER` and its test is replaced.

## MEASURED

| what | command | number |
| --- | --- | --- |
| `boss-fight` draft after shield and slabs | `npm run compare -- --key boss-fight --tier draft --format hd` | 651810 triangles, 476 draw calls, about 12 s |
