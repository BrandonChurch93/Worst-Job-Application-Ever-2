# Boss fight: recipes

Everything in this part is made in code when the page starts. No file is stored. No new texture is made: the part uses the four small pictures step 1 computes for its turrets.

## Darts, sparks, muzzle flashes

- Made by: code, `src/pages/step4/real/boss-weapons.ts`.
- From: numbers. The dart is an outline of four points, extruded 3 px with a 0.7 px bevel. A fleck is a needle of four points. The glow pictures are the ones of `src/pages/step1/real/turret-fx.ts`: star 256 px (0.25 MB), halo 64 px (0.016 MB), puff 64 px (0.016 MB), scorch 256 px (0.25 MB), computed from the seed. This part adds 0 MB.
- Command: none; `fx()` and `kit()` build them on first use.
- Takes: first try, then tuned by eye against `references/approved/boss-fight.png`.
- Why this one: the approved image shows the head of the cursor's arrow in white, a hair thin trail, a small spark with thin streaks.
- Date: 2026-11-26.

## Slabs, banner, pop-ups

- Made by: code. Slabs and the banner are `makeSlab` of step 1 with the shared red. A pop-up is the shell's glass card and buttons (`controls`), raised and lowered in `pose`.
- From: the layout's sizes.
- Command: none.
- Takes: first try.
- Why this one: the boss throws the slabs of step 1; a pop-up is a card of the same site.
- Date: 2026-11-26.

## Health bar

- Made by: code, `src/pages/step4/real/health-bar.ts`.
- From: numbers. Track: a swept rim (shared satin aluminium) and a floor swept as a shallow gutter (the shared brushed rail metal, cloned, darker, finer brushing, through `studio()`). Fill: one swept capsule with a flat top in the shared orange.
- Command: none.
- Takes: fourth (round back, then flat top; chrome rim, then satin; flat floor, then gutter).
- Why this one: the approved image shows a thin rim, a dark brushed floor shaded from its upper wall and a satin orange fill with a flat top.
- Date: 2026-11-26.

## Verify card

- Made by: code, `src/pages/step4/real/verify-card.ts`.
- From: numbers. The card is the shell's glass card. The checkbox is a swept frame (shared chrome), a dark seam (shared gap) and a cap (shared enamel, then the shared orange). The tick is a raised stroke of 46 slices in the shared white ink.
- Command: none.
- Takes: first try.
- Why this one: the approved image shows an orange cap in a pale frame with a white tick.
- Date: 2026-11-26.

## Slab lacquer

- Made by: code, `lacquer()` in `src/pages/step4/real/boss-weapons.ts`.
- From: numbers (`LACQUER`), and the shell's grain normal map (256 px, seed 71 past the site's seed) on the clear coat, as step 1's red has it. No file.
- Command: none.
- Takes: third try of three (the second was a rougher base with full specular, dropped).
- Why this one: its face is the nearest to the approved image's red, measured in the key's still.
- Date: 2026-11-26.
