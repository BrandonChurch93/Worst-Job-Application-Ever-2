# Careers page assets

No file is stored for the careers page. Every solid is built in code when the page first shows it, and every surface reads the shared pictures of `src/shell/materials.ts`.

## careers-solids.ts (geometry, built at run time)
- Made by: `src/pages/marketing/real/careers-solids.ts`
- From: numbers only
- Prompt or command: `scalloped(r, lobes, deep)`, `leaf(long, wide, high)`, `scattered(g, places)`, `mirrored(g)`
- Takes: under 5 ms each, once per size
- Why this one: a medal's rim and wreath and a slab's under side are plain sweeps and grids, so they need no stored file
- Date: 2026-11-26

## perk slab (geometry, built at run time)
- Made by: `slabGeometry(s, thick)` in `src/pages/marketing/real/perk-cards.ts`
- From: numbers only (`SLAB`, `GLASS`), the key light's direction from `src/post/look.ts`
- Prompt or command: two faces of 12 rings each round the card's outline, the under one turned over; vertex colours carry the shade of the near bevel and the bright lines
- Takes: under 5 ms, once per card size
- Why this one: one solid for the resting and the turning card, with a real under side, and no texture
- Date: 2026-11-26

## materials (no file)
- Made by: `cardGlass()` in `real/perk-cards.ts`, `medalFace()`, `medalMetal()`, the print and tape materials in `real/careers-page.ts`, the tape, pane and bezel in `real/ticker.ts`
- From: numbers only; `medalFace()` reads the shared turned aluminium's normal and anisotropy pictures of `materials()`
- Prompt or command: each is a `MeshPhysicalMaterial` passed through `studio()` of `src/post/studio.ts`
- Takes: nothing measurable
- Why this one: no texture of the careers page's own: 0 px, 0 MB
- Date: 2026-11-26
