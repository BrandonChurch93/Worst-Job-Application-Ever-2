# boss-body and boss-transform

Owner: boss-body agent. Branch `agent/boss-body`. Parts: `boss-body`, `boss-transform`.

## What the approved images show that a quick look misses

1. The highlight sits on the upper left edge of every metal piece as a hair of white about 1 px wide, and on the orange cap as one long soft band along its upper shoulder, never as a spot in the middle of a face.
2. The bevel of the frame is narrow, about 2 px on a plate 372 px long, but the lip round the cap is a second, wider step: a dark bezel about 6 px wide and then a bright inner edge, so the cap reads as sunk in a pocket, not laid on a plate.
3. The gap round the cap and under each cannon disc is near black but not black: one can still see the brushing in it, and it is darkest on the upper left where the key light cannot reach.
4. The edge of the glass shield is the brightest thing on the boss: a thin aluminium rim, then a wide bevel in the glass that is lighter than its face. The face itself is grey green and dull.
5. The shadow is one deep soft mass down and to the right of the whole body, the legs each throw their own narrow one, and the empty socket has a bright lip ring, a rough inner wall, and cracks that are thin brown forked lines with chips lying a little way off.

## Decisions

- One shape for each rigid piece (frame, two side plates, four legs, two cannons, shield, cap), each with a `role` the maker reads and its pose numbers in `v`. `drawRig` builds nothing itself.
- The frame is two halves on a hinge along the long axis of the cap. Closed, they hang under the cap like a shut book and come out of the socket with it; they swing open between 1.3 s and 1.8 s of the unfold. When the boss falls the two halves come apart: with the two side plates that makes the four plates of `boss-down.png`.
- The two side plates are the liner of the socket: they start standing on edge inside the pit, rise out of it, turn flat and seat under the frame.
- The cannons are the shared progress button (same geometry and materials as steps 1 and 2 on the rail) on a housing that rises under it, with a barrel that slides out from under the disc. The numeral is real type on its face.
- The legs are two flat links on a vertical pin with a ball at the hip and at the ankle. Link length is fixed at 100 px; when a planted foot is further away than both links reach, a damper rod shows between knee and lower link. Folded, the knee lies under the frame.
- The shield is a thick glass plate in an aluminium rim, on a hinge pin held by two telescoping arms to the left end of the frame. It is stowed flat under the frame, slides out, turns and then leans back.
- `FOOT_OFF` moved from (218, 150) to (236, 192), a wider stance to match the approved image; `HIP_OFF` is now the corners of the frame. `fightRig` takes an optional sixth argument `{ aim, flash, hurt }`.
- The lip ring, the cracks and the ceramic chips of the socket are one object hung on a shape `rim-<socket id>`; the crack boxes stay in the draw list for the tests and are drawn by that object.
- Soot on the cap and smoke are the only two textures, both made in code (see `assets-src/boss-body/RECIPE.md`). The soot is a skin of the cap's own geometry, so it bends over the shoulders and the ends. Each wisp of smoke is one ribbon whose points are moved by `ctx.time` alone.
- The glass of the shield is its own material (grey green, see-through at 0.86, clear coat), made in `src/boss/real/body-kit.ts` and passed through `studio()`. The arms show through it.
- When the boss falls, the second half of the frame is thrown clear to the right so that nothing lies over the fallen cap; the lower side plate lands between the socket and the cap.

- After the Builder's first look: the steel of frame, plates and legs is a dark gunmetal of my own (`plate`, `pocket`, `link` in `body-kit.ts`), bright work is kept for chamfers, screws, the lip round the cap, pins and the turned discs. The body stands higher (frame top at z 86, cap top at z 98). Legs are flat bars 28 px wide with turned knuckles 42 px wide at hip and knee and a foot 46 px wide. The frame halves carry their bed as a shallow pocket, so they land as solid plates.

## Agreed with the boss-fight agent

- The mouth of each barrel is given by `muzzleAt(x, y, i, aim)` in `src/boss/body.ts`: 92 px from the centre of the cannon, at z 82.5, turned toward `aim` by at most 0.7 rad. They pass `aim` (the cursor centre eased over 0.25 s) in the sixth argument of `fightRig` and fire slabs and the flash `muzzle-N` from the same formula (their own copy until this is on main, then my export; the name must not change).
- Feet moved to (236, 192) from the centre and the cannons to (-10, 116); they read `FOOT_OFF` and `CANNON_OFF`.
- The shield stays centred at (x - 252, y). Darts from the left stop on the plane x - 288 while |dy| < 118 and fly at z 30 to 34; shield sparks sit at z 100.
- They call `fightRig` with a sixth argument `{ flash: f.flash / 0.12, hurt: 1 - shown / 100 }`.

## Known weak points

See the reports to `/root`.
