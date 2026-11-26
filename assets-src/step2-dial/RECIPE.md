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

## Wheel face

- Made by: `turnedFine()` in `src/pages/step2/real/dial.ts`
- From: the shared turned aluminium of `materials()`, copied with its shader rules (the studio's and the stretch of the room along the cut), so it stands under the same light as everything else. Changed numbers, all in `DIAL_BODY`: the cut's depth `cut` 0.012 (shared: 0.06), roughness `faceRough` 0.2, stretch `faceStretch` 1, colour times `faceLight` 1.5. The turned pictures are laid one texel to a page pixel (`turned` 256).
- Prompt or command: none.
- Takes: four. No new texture: 0 px, 0 MB (it reads the shared turned pictures).
- Why this one: at 178 px across, the shared cut read as a few hard rings; the approved face is light brushed metal with soft fans of light and no ring to count.
- Date: 2026-11-26

## Tray

- Made by: `trayJoint()`, `trayLiner()`, `trayFloor()` and `trayWallShade()` in `src/pages/step2/real/rows.ts`
- From: nothing. Numbers of `TRAY` and `TRAY_R` in `src/pages/step2/layout.ts`: a dark joint 0.9 px wide where the page parts, a rolled rim 5.6 px wide in the shared chrome (`trayRim()`), holding a line of light all round, a satin wall, a wall that leans in by 1.3 px for each pixel of depth, a glass floor 8 px under the page.
- Prompt or command: none. The open tray's solids are built once and kept; a tray on its way open is built for its height and dropped after.
- Takes: eight. No texture: 0 px, 0 MB. The floor's shade under the wall on the light's side is vertex colour, worked out from the key's direction and the tray's depth: once in the glass itself (`TRAY.floor`) and once as a copy of the floor multiplied over it and over the words on it (`TRAY.soak`), tuned against the column x 1500 of the approved `step2-dial`.
- Why this one: the approved tray has a thin aluminium lip, bright along the lower right and dark along the upper left inside wall, and a floor that is darker in a band under the upper and left walls.
- Date: 2026-11-26
## Hub lacquer

- Made by: `lacquered()` in `src/pages/step2/real/dial.ts`
- From: the shared orange of `materials()`, copied with its shader rules. Numbers of `DIAL_BODY` in `src/pages/step2/layout.ts`: clearcoat 1, `hubCoat` 0.03, `hubRough` 0.1, `hubIor` 1.9. The colour is the shared one.
- Prompt or command: none.
- Takes: three. No texture: 0 px, 0 MB.
- Why this one: the approved hub is a polished knob with one clear point of light on the side of the key; the shared orange gave the dome a dull even face.
- Date: 2026-11-26

## Dial's shade on the floor

- Made by: `castGeometry()` in `src/pages/step2/real/dial.ts`
- From: nothing. Numbers of `DIAL_BODY` in `src/pages/step2/layout.ts`: `cast` 0.62, `castIn` 8, `castOut` 44, `castAway` 22, `castOver` 0.2. A disc of vertex colour multiplied over the floor, moved away from the key's direction by the dial's rise.
- Prompt or command: none.
- Takes: three. No texture: 0 px, 0 MB.
- Why this one: the approved dial stands in a deep soft shadow on the tray's floor; the sunk glass's fill light left the lamp's shadow too faint to read.
- Date: 2026-11-26

