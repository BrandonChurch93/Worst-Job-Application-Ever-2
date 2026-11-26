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


## Round 14 film issues (R4, R9), Builder's order

Looks since 10:50, by part: acting-boss 2 + 8 (sheet `boss.slabs`, three motion sheets of the slabs, frame 7346, unfold, last stand, press) = 10; boss-body 18; boss-transform 16; boss-weapons 5; verify-card 1; health-bar 5.

| item | what was changed | state |
| --- | --- | --- |
| 1 contact frame | a slab dives to the page over its last 150 px and stops dead with one hop (`FLY` in `src/boss/weapons.ts`); a hit holds the slab on the arrow for 0.05 s before the knock (`STRIKE`, `Fight.blow` in `src/boss/fight.ts`); a slab that reaches the card stops at its rim and bounces (`RIM_GAP`); a rested slab slides off the page by the shortest free way (`leave`, `LEAVE`), none fades | looked at in motion sheets, pushed in b50a91a4 |
| 1 frame 7346 | the slab's type was not drawn while it left the muzzle (k below 0.98) and at the end of sinking; type is now drawn for the whole life of a slab, scaled with it while it emerges; a slab has no back face | looked at |
| 2 arrow answers | unfold: the arrow stands at the button, is thrown back on the crack (recoil with the throw's direction, held shocked), runs for cover and cowers still; first slab: `rear` before it, dodge after; hit: thrown key `THROWN`; `boss.popups`: only the first dialog knocks, later ones get `fume`; the hit of `boss.popups` throws the arrow (`STRUCK`) and the `dustOff` shake runs whole | unfold looked at; hits to be looked at |
| 3 `boss.verify` | one move that stops short (`SHORT`), a held pull back, the commit, the dip on the click, then a held pose below the card (`ANSWER`) clear of its edge | to be looked at |
| 4 `boss.press` | the fallen button sinks 7 px in 2 frames under the tip, is held 1 frame and springs back with one overshoot (`PRESS`, `sunk`); the arrow's ground follows it | to be looked at close |
| 5 `boss.lastStand` | phase 2 wander centred 60 px left of home so the boss is whole in the frame (`wander`); "really": `rear` with `shocked` as the banner lands, `doubleTake` at the bar's jump, then `angry` with `fume` | looked at (`last-a`) |
| 6 red dash | the banner and a slab are not drawn below a least scale (`BANNER_LEAST`, `SLAB_LEAST`) | to be looked at |

Decisions:

- The press stays at 29.88 s: `tests/boss-closer-acting.test.ts` holds proud for 1.5 s after it and the sag for 1.1 s before it. The turn is the stage's, at unit seconds less `TURN_HALF` (31.5 s); the page keeps the pointer on the fallen button to 32 s and calls no cue after `act('proud')` at 30.3 s.
- `SAG_AT` 1.66 to 1.57: the boss dies 0.08 s later now (27.32 s), the sag stays at 28.89 s.
- The boss hides header stations 1 and 2 (`over`) once the cannons unfold: the discs are the cannons' then.
- Sent to look_finisher (11:12): the arrow's contour beside "Invalid input" (R9-2 issue 4), R9-1 issue 6, and the glass of the card (R1-1 issues 10 and 15). No answer yet, nothing agreed.

## After the first pass (11:34 to 12:00)

Looks since the first pass, by part: acting-boss about 20 in all (sheets of unfold, verify, popups, last stand, press); boss-body 18 + 3 (two texel stills, one key `boss-down`); boss-transform 16; boss-weapons 5; verify-card 2; health-bar 5.

The eight added acting issues:

| issue | what was changed | state |
| --- | --- | --- |
| R9-1 7 dodge, own fire | a pale flash at the tip for every dart (`TIP_FLASH` in `src/boss/fight.ts`), a nub at the fill's end on every landing (`STRUCK_GLOW`) | sheets looked at; tip flash and bar flash not looked at close |
| R9-1 8 dialogs as cover | the arrow stands below the first dialog and its shots stop on it (`BLOCKED`), goes round the second (`ROUND`), is hit once (`STRUCK`) and holds a shake for 0.9 s (`SHAKE`, `dustOff`) | sheet `pop-a` looked at; the shake's read not judged close |
| R9-1 9 bar fills back | the arrow goes under the bar (`BAR`) and holds there from 22.86 to 24.15 s while it fills | sheet looked at |
| R9-2 9 scared | thrown back, runs behind the left edge of the card (`COVER`), cowers still; pale, stiff and the lean are the body's | sheet `unfold-b` looked at |
| R9-2 10 confidence | `jump` at 9.25 s then `rear` before the first slab; darts flash at the tip | sheet looked at |
| R9-2 11 anger | `fume` on the later dialogs and after "really", no knock; the red tip from inside is the body's | sheet looked at |
| R9-2 12 double take | `startle` and shocked as the banner lands, `doubleTake` at the bar's jump, held under the bar | sheet looked at |
| R9-2 13 proud | `act('proud')` with `dustOff`, pointer held on the button to the turn | sheet `press-c` looked at |

Decisions:

- M2 on the sheet `boss-stages`: the bevel facets of the plates carried the brushing stretched; `grained()` in `src/boss/real/body.ts` lays it at full density on the four plate geometries.
- `boss-down`, the arrow (Builder, 11:53): the scrap was the kit's `exhausted` melt, 0.41 at the key, where the body's ink outline has faded to 0.16. `SAG_AT` 1.57 to 1.7: the sag now begins at 28.93 s, so at the key the arrow is slumped and leaning with its outline (melt 0.20, ink about 0.7). Size untouched. The melt runs on after the key; the body and its material are look_finisher's.
- The press stays at 29.88 s.

MEASURED:

| what | command | number |
| --- | --- | --- |
| M2 before the fix, 11:47 | `npm run measure -- --unit boss --tier review` | M2 red 0.0254 against 0.02 on `sheet:boss-stages`, 7 green 1 red |
| soft texels after the fix | `npm run still -- --sheet boss-stages --format hd --tier review --diag texels`, own count | 4 soft of 91790 textured pixels |
| melt at the key | trace of `stage.cursor.pose().feel` | 0.411 before, 0.198 after |
| gate 11:54 | `npm test`, `npm run build`, `npm run bots` | 117 files, 1472 of 1472; build ok; bots all clear |

## 12:00 to 12:30

Looks, by part: acting-boss 20 + 11 (dodge-a, tip-a, dodge-b, shake-a, shake-b, hit-b, pop-b, bar-b, take-a, take-b, take-c, hit-c, turn-a: 13, so 33 of 40); boss-body 21 + 1 (key `boss-fight` at review); health-bar 5 + 1 (barflash-a).

- A hit sets `shocked`, not `exhausted` (Builder agreed, 12:20): the melted arrow could not be read through the shake. `exhausted` is the sag at `boss-down` only.
- The dust off comes 0.3 s after a hit in every phase (`DUST_AFTER` in `src/boss/fight.ts`); the page's own second dust off in the pop-up phase is gone (`SHAKE` is now only how long the page waits before the arrow is calm again, 1.2 s).
- The double take (`LOOKS` in `src/pages/step4/index.ts`): the page aims the arrow at the bar from 0.56 to 0.9 s after the banner, at the boss to 1.12 s, at the bar again to 1.64 s with `doubleTake` at 1.02 s (its tall stretch falls in the second look), then the snap back with `angry` and `fume`. The arrow stands at (900,350), clear of the card (`BAR` in `script.ts`).
- The press: at 29.88 s in my file (`PRESS`, `sunk`), the arrow stays on the button until 31.5 s. From 31.5 s the arrow leaves the button to the left and up (frames 8433 to 8454): that is the stage's turn, not this page.
- M2 by the full measure at 12:00: 0.0027 against 0.02, 8 green.
