# Keyboard and turrets: notes of the build agent `keyboard`

Parts made real: `keyboard`, `turrets`. Branch `agent/keyboard`. Looks: `agent/keyboard-looks`.

## What a quick look at `references/approved/step1-fire.png` misses

1. The top of a cap is a wide, nearly flat plateau of about 85 percent of its footprint. The highlight is not on the top: it is a thin lighter line on the shoulder that faces the light (up and left), and the walls that face away (right and bottom) are a clearly darker warm tan.
2. The bevel is narrow: 6 to 8 px of lower wall show on a 90 px cap, from the taper of the wall and not from perspective, and the corner of the top is rounded to about 10 px.
3. The gap between two caps is about 10 px and it is the darkest tone of the picture, but a warm grey-brown near sRGB 95 and not black. Each cap throws a short shadow into it on the side away from the light.
4. The edge of the deck is a thin crisp chamfer that catches one bright line. The brushing runs along the length, shows as fine lines only inside the broad highlight band that crosses it, and the plate goes to a darker blue-grey toward its ends. The socket of a turret has the same thin bright lip round a dark ring.
5. A bolt is a white-yellow oval head of about 20 px with an orange tail of 70 to 80 px that thins to nothing. The flash is a star of thin rays of unequal length. A scorch is an irregular black middle of about 20 px inside a soft brown ring of about 40 px, with a grey wisp of smoke.

## What is built

| Thing | File | How |
| --- | --- | --- |
| Deck | `src/pages/step1/real/keyboard.ts` | One plate: top face with the key field and the two hatch holes cut out, a 2.4 px chamfer, walls 84 px deep so the sides are real through the whole rise. The key field is one pocket, 9.4 px deep, with a 1.1 px chamfered lip in aluminium and a dark floor. The shared aluminium, cloned, with a brushed normal picture and anisotropy. |
| Caps | `src/pages/step1/real/keyboard.ts`, `keyboard-kit.ts` | One instanced mesh for each size of cap, the Enter in the shared orange. A cap is lofted rings: a skirt that stands in the field, a wall that leans in 0.26 rad, a shoulder of radius 5, a rim and a dish 0.5 deep. Every frame each instance takes the place and the top of its key shape, so press, hop and shuffle are whatever the shapes say. A flying cap leans up to 4 degrees, from its hop and its name, and sinks by what the lean lifts under its legend (at most 0.8 px). |
| Hatches | `src/pages/step1/real/turrets.ts` | A turned bezel that stands 0.9 above the deck, a dark socket 36 deep, two half lids brushed like the deck that slide apart. How far open comes from `v[6]` of the turret shape. |
| Turrets | `src/pages/step1/real/turrets.ts` | Turned parts with flat bands: a fixed collar, a head that turns, with a seam groove, a 5 px chamfer, a shallow turned centre, three vent slots; a barrel in a darker steel with a sleeve, a gasket, a taper, a muzzle ring with a groove and a dark bore. It aims from `v[0], v[1]`, pulls back with the charge and kicks on the shot. |
| Charge, flash | `src/pages/step1/real/turrets.ts`, `turret-fx.ts` | An orb at the muzzle that grows with `v[2]`, eight sparks that fall into it, a star for 0.05 s after the shot. Each asks `ctx.light` for a light. |
| Bolt | same | A head that is white hot on top and orange at its rim, two additive cones for the tail. `ctx.light` with `shadow: true`. No painted halo and no painted streak: glow is the post chain's, the streak is the shutter's. |
| Scorch | same | A decal with a ragged charred middle and a brown ring, turned by its name, an ember for the first 0.2 s, four smoke puffs for 1.5 s, fading with `v[0]`. |
| Overheat | same | The turret's own clone of the metal takes a dull red emissive from `v[4]`, six steam puffs rise from `ctx.time` and the seed of its name, one red light. |

## Numbers of the shapes this part writes and reads

`turret-<i>` `v` = [cos aim, sin aim, charge 0..1, seconds since its last shot (1 when none), heat 0..1 when overheated, pull back px, hatch open 0..1, shots fired]. Written in `Turrets.draw`. The first `hatchShare` (0.3) of the rise opens the hatch, the rest lifts the turret.

`bolt-<n>` `v` = [share of its flight, 0..1 over its first 0.05 s]. `scorch-<n>` `v` = [share of its life left].

Read from /root/step1_director's shapes: `key-<name>` `v` = [press, hop px, shuffle, heat], `keyboard-deck` `v` = [rise, swing px, shake px]. Heights of the shapes are the truth for place: `v` is used only for the tumble.

## Glow and light, agreed with /root/light_keeper

Unit of `ctx.light`: power p means a white matte surface 100 px from the emitter, facing it, sends back about p times the colour in linear light; zero at `reach`. Six true lights a frame, two with shadows.

| Thing | Colour of the mesh, linear, past white | `ctx.light` colour | power | reach px | shadow |
| --- | --- | --- | --- | --- | --- |
| Bolt head | 16, 10, 4.5 | 1, 0.42, 0.1 | 1.0 | 260 | yes |
| Bolt tail | 3.2, 1.0, 0.18 | | | | |
| Muzzle flash | 9, 3.6, 0.9 falling over 0.05 s | 1, 0.5, 0.15 | 2.2 | 380 | no |
| Charge | 6, 2.5, 0.6 to 16, 7, 2 | 1, 0.45, 0.12 | 0.6 times charge squared | 160 | no |
| Overheated metal | emissive 0.55, 0.05, 0.012 | 1, 0.12, 0.03 | 0.35 | 140 | no |

Emissive meshes cast no shadow.

## Decisions

1. The deck and all caps are one object, keyed on the deck shape. A key shape answers `''` while the deck is in the list, and a lone cap object otherwise. This is what lets the caps be instanced.
2. The legend is the type maker's. The crest of the rim is at the key shape's `z1` and the dish lies 0.5 px below it, so a flat legend at `z1` is never under the plastic and hovers at most 0.5 px, which a straight-down camera does not show. This is the first of the two ways /root/type_setter offered: nothing changes on their side.
3. The field under the caps is one dark pocket and not sixty seats: from above the keyboard reads through its gaps, and sixty outlined seats read as embossed buttons (look 1 and 2 on the looks branch).
4. The deck's clone of the shared aluminium is darker and a little blue (0.6, 0.62, 0.66 of the shared colour) and rougher (0.5): at the shared values the right end of the plate rendered at sRGB 244, lighter than the page.
5. `material.envMapIntensity` does nothing in the pinned three (fact from /root/type_setter). The cap plastic and the dark parts use `specularIntensity`.
6. `Material.clone()` drops `onBeforeCompile`, so a cloned shared material is passed through `studio()` again, and a clone of one of mine takes the hooks of its source.
7. Overlays (bolt, flash, puffs, scorch) set `userData.order` to 900000 and up so the view draws them after everything opaque.
8. `Turrets.draw` gives the hatch the first 0.3 of the rise. No number of `TURRET` that /root/step1_director listed is changed, and `step` is as it was.

## One more mechanism that rises out of the page

1. Give it shapes. In the page's logic push one shape for the body with `part: '<name>'`, a `role`, `z0` at the surface it rises from and `z1` at its top, and `mechanism: true` once its top is at or above `scale.heights.machineMinTop`. Put every number a picture needs in `v` and write the meaning of each next to where it is pushed. Check: `npx vitest run tests/step1.test.ts`.
2. Give it a hole. Push a shape with `role: 'hatch'` (round) or cut a pocket in the plate it stands in (`deckGeometry` in `src/pages/step1/real/keyboard.ts` shows both: `face.holes.push(...)`, then a chamfered lip and dark walls with `sweep`).
3. Write the maker `src/pages/<page>/real/<name>.ts` as a `PartMaker`: `key` answers a string for the shape that owns the object, `''` for shapes the same object draws, `null` for what stays a stand-in. `make` builds round the shape's centre with z = 0 at `z0`. `pose` moves things and builds nothing. `drop` frees what the object alone owns.
4. Build solids from `turn()` (turned parts, `keyboard-kit.ts`) and `sweep()` (`src/shell/solids.ts`). Share geometry in a module cache, take metal and plastic from `kit()` or `materials()`, draw equal things as one `InstancedMesh`.
5. Keep it under the lids while it is down: lower it by a few px for the first quarter of the rise (`TURRET_LOOK.sunk`) and let the lids open in the first share of the rise (`TURRET.hatchShare`).
6. Anything that glows: a `MeshBasicMaterial` with `toneMapped: false` and a colour past white, `castShadow` off, and one `ctx.light({...})` a frame. Agree the values with the owner of the light.
7. Motion comes from the shape's numbers and `ctx.time` only. A seed comes from `hashName(shape.id)` or `hash01` of `src/core/random.ts`.
8. Look: `npm run still -- --page step1 --beat <beat> --at 0.3 --format hd --tier draft`, then `--tier review`; `npm run sheet -- --beat <beat> --tier draft` for the rise; `npm run still -- --key step1-fire --diag standins` shows what is still a stand-in.
9. Prove it: a test `tests/<name>*.test.ts` that walks the film and poses the object at every quarter second; `npm test`, `npm run build`, `npm run bots`, `npm run measure -- --unit step1` (M9 checks sizes and heights).

## What I learned

- A straight-down camera at 12 degrees shows no wall of a cap unless the wall leans. The lean is the bevel.
- `alphaMap` reads the green channel. A picture with white colour and the shape in alpha draws as a solid square.
- A rim of 1 px round a dish reads as an embossed button under a key light at 45 degrees. 0.5 px over 13 px reads as a moulded dish.
- A dial is what a turret is from straight above if its top carries rings and screws. A plain turned top with one wide chamfer and a darker barrel reads as a cylinder.
- In the film the turrets never overheat (MEASURED: a walk of the film in steps of 0.05 s finds heat 0 throughout). The glow and the steam show in a live run only.
