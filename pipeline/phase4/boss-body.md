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
- The legs are two flat links on a vertical pin with a ball at the hip and at the ankle. Link length is fixed at 78 px; when a planted foot is further away than both links reach, a damper rod shows between knee and lower link. Folded, the knee lies under the frame.
- The shield is a thick glass plate in an aluminium rim, on a hinge pin held by two telescoping arms to the left end of the frame. It is stowed flat under the frame, slides out, turns and then leans back.
- `FOOT_OFF` moved from (218, 150) to a wider stance to match the approved image; `HIP_OFF` is now the corners of the frame. `fightRig` takes an optional sixth argument `{ aim, flash, hurt }`.
- The lip ring, the cracks and the ceramic chips of the socket are one object hung on a shape `rim-<socket id>`; the crack boxes stay in the draw list for the tests and are drawn by that object.
- Soot on the cap and smoke are the only two textures, both made in code (see `assets-src/boss-body/RECIPE.md`).

## Known weak points

See the reports to `/root`.
