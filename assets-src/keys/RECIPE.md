# Recipes: fix round on the keyboard, the turrets and the slabs

Every picture here is made in code when the page starts. No file is downloaded and none is stored in the repository.

The fix round added no picture. Round 5 redrew one, the scorch picture, at the same size (see the end of this file), so the texture memory of these parts did not grow.

## Speckle normal picture of the caps (no longer used by the caps)

- Made by: nothing now. The cap material in `src/pages/step1/real/keyboard-kit.ts` carries no normal picture any more.
- From: the earlier cap material read a copy of the shared speckle picture of `materials()` as its normal picture (the copy shared the image, so it cost no memory). It is no longer read by the caps.
- Prompt or command: none.
- Takes: none. 0 px, 0 MB on the caps.
- Why this one: the approved caps are an even matte cream. A flat colour with a vertex tint for depth is closer than any grain.
- Date: 2026-11-25

## Shade patch under a flying cap

- Made by: `shades` in `src/pages/step1/real/keyboard.ts`, an instanced flat patch drawn on the bed, one per cap that is off its seat.
- From: nothing. A plain dark material at opacity 0.4, moved by `hop x (1.8, 1.67)` along the key light and widened with height.
- Prompt or command: none.
- Takes: no picture. 0 px, 0 MB.
- Why this one: a cap that leaves its socket has to leave its shadow behind on the bed, and the shadow map alone is too soft to read at the size of a cap.
- Date: 2026-11-25

## Ghost caster of a flying cap

- Made by: `ghosts` in `src/pages/step1/real/keyboard.ts`, an instanced box that is not drawn and casts a shadow, one per cap with a hop above 3 px.
- From: nothing.
- Prompt or command: none.
- Takes: no picture. 0 px, 0 MB.
- Why this one: the caps no longer cast on each other at rest (that was the mottle), so a cap in the air gets its real shadow from a plain box instead.
- Date: 2026-11-25

## Bullet hole picture (the scorch picture, redrawn in round 5)

- Made by: `scorchPicture` in `src/pages/step1/real/turret-fx.ts`, when the page starts.
- From: nothing. Arithmetic on the pixel's distance and bearing from the centre, with seeded noise from `src/core/random.ts` for the ragged rim and the singe.
- Prompt or command: none.
- Takes: one picture, 256 by 256 px, RGBA, 0.33 MB with mipmaps. It replaces the earlier scorch picture of the same size, so the memory did not grow.
- Why this one: a hole has a wall, a torn raised rim and metal at its foot. The light in the picture comes from the upper left like the page's key light, so the mark is laid without turning.
- Date: 2026-11-25
