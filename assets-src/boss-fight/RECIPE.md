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
- From: numbers. Track: a swept rim (shared chrome) and a flat floor (the shared brushed rail metal, cloned, darker, through `studio()`). Fill: one swept capsule in the shared orange.
- Command: none.
- Takes: first try, then tuned by eye.
- Why this one: the approved image shows a polished rim, a dark brushed floor and a satin orange fill.
- Date: 2026-11-26.

## Verify card

- Made by: code, `src/pages/step4/real/verify-card.ts`.
- From: numbers. The card is the shell's glass card. The checkbox is a swept frame (shared chrome), a dark seam (shared gap) and a cap (shared enamel, then the shared orange). The tick is a raised stroke of 46 slices in the shared white ink.
- Command: none.
- Takes: first try.
- Why this one: the approved image shows an orange cap in a pale frame with a white tick.
- Date: 2026-11-26.
