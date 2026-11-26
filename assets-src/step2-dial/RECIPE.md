# Recipes: step 2's rows, tray and dial

Nothing here is a picture. No file is downloaded, none is generated and none is stored in the repository. The parts `rows` and `dial` own no texture at all: 0 px, 0 MB. Their surfaces are the shared materials of `src/shell/materials.ts` (turned aluminium, satin aluminium, aluminium edge, keycap cream, orange, sunk glass, gap), and their shade is geometry and vertex colour.

## Dial body

- Made by: `seatGeometry()`, `housingGeometry()`, `plateGeometry()`, `faceGeometry()`, `edgesGeometry()`, `hubGeometry()`, `hubRingGeometry()` and `stopGeometry()` in `src/pages/step2/real/dial.ts`
- From: nothing. Numbers of `DIAL` and `DIAL_BODY` in `src/pages/step2/layout.ts`: a wheel of radius 89.2 px and 4.8 px thick with ten holes of radius 15 px on a ring of 66 px, a bezel 9 px wide, a plate 6.2 px under the wheel's top, a hub of radius 30 px and 14 px tall, a finger stop 38 px long.
- Prompt or command: none. Built once on first use by `geometries()` and kept for the page.
- Takes: about four looks. No texture: 0 px, 0 MB. The wheel's face reads the shared turned aluminium across the whole disc once (uv 0 to 1).
- Why this one: the approved dial is a stepped bezel, a dark groove, a wheel a hair lower with a bright chamfer round every hole, and a plate in sight under the holes. Each of those is a real step of the profile, so the light finds them by itself.
- Date: 2026-11-26

## Shade inside a finger hole

- Made by: `holeShadeGeometry()` in `src/pages/step2/real/dial.ts`
- From: nothing. A disc of the hole's size whose vertex colour darkens toward the side of the key light (`look.key.direction` of `src/post/look`), by `DIAL_BODY.shade` 0.46 over `DIAL_BODY.shadeReach` 0.78 of the hole.
- Prompt or command: none. Ten instances, multiplied over the plate, moved with the holes in `pose`.
- Takes: two. No texture: 0 px, 0 MB.
- Why this one: a wall 5 px tall is under what the shadow map resolves, and in the approved image the upper left third of each hole lies in a soft brown grey shade.
- Date: 2026-11-26

## Tray

- Made by: `trayJoint()`, `trayLiner()`, `trayFloor()` and `trayWallShade()` in `src/pages/step2/real/rows.ts`
- From: nothing. Numbers of `TRAY` and `TRAY_R` in `src/pages/step2/layout.ts`: a dark joint 0.9 px wide where the page parts, an aluminium rim 4.2 px wide, a wall that leans in by 0.7 px for each pixel of depth, a glass floor 8 px under the page.
- Prompt or command: none. The open tray's solids are built once and kept; a tray on its way open is built for its height and dropped after.
- Takes: three. No texture: 0 px, 0 MB. The floor's shade under the wall on the light's side is vertex colour, worked out from the key's direction and the tray's depth (`TRAY.soak`, `TRAY.soakReach`, `TRAY.bounce`).
- Why this one: the approved tray has a thin aluminium lip, bright along the lower right and dark along the upper left inside wall, and a floor that is darker in a band under the upper and left walls.
- Date: 2026-11-26
