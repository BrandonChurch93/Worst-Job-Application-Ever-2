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
| Deck | `src/pages/step1/real/keyboard.ts` | One plate: top face with the key field and the two hatch holes cut out, a 2.4 px chamfer, walls 84 px deep so the sides are real through the whole rise. The key field is one pocket, 9.4 px deep, with a 1.1 px chamfered lip; its floor (the bed) is the same aluminium, a little rougher, and reads mid grey in the shadow of the caps. The plate is the shared aluminium at 0.95 of its colour, roughness 0.52, with my brushed normal map along the length. The plate casts shadows, the bed does not. |
| Caps | `src/pages/step1/real/keyboard.ts`, `keyboard-kit.ts` | Every cap is a stretch of ONE mesh, so the caps are one draw in every pass. A cap is lofted rings: a skirt that stands in the field, a wall that stands straight, a round shoulder of radius 4.6 in eight steps, a rim and a dish 0.5 deep. Each frame a cap that moved has its stretch of the buffer written again from the place and the top of its key shape; the others are left, and nothing is sent when no cap moved. Press, hop and shuffle are whatever the shapes say. A flying cap leans up to 4 degrees, from its hop and its name, and sinks by what the lean lifts under its legend (at most 0.8 px). The Enter is a second mesh in the shared orange that casts no shadow; a core 0.6 px inside it, in the caps mesh, casts its shadow. |
| Hatches | `src/pages/step1/real/turrets.ts` | A turned bezel that stands 0.9 above the deck, a dark socket 36 deep, two half lids brushed like the deck that slide apart (one instanced mesh of two). How far open comes from `v[6]` of the turret shape. A hatch casts no shadow. |
| Turrets | `src/pages/step1/real/turrets.ts` | Turned parts with flat bands: a fixed collar, a head that turns, with a seam groove, a 5 px chamfer, a shallow turned centre, three vent slots; a barrel in a darker steel with a sleeve, a gasket, a taper, a muzzle ring with a groove and a dark bore. It aims from `v[0], v[1]`, pulls back with the charge and kicks on the shot. |
| Charge, flash | `src/pages/step1/real/turrets.ts`, `turret-fx.ts` | An orb at the muzzle that grows with `v[2]`, eight sparks that fall into it (one instanced mesh), a star for 0.05 s after the shot. Each asks `ctx.light` for a light. |
| Bolt | same | A thin streak: a head 22 by 5.4 px that is white hot on top and orange at its rim, two additive cones for the tail (one instanced mesh of two), up to 112 px long. `ctx.light` with `shadow: true`. No painted halo and no painted streak: glow is the post chain's, the streak is the shutter's. |
| Scorch | same | A decal of 62 px: a small charred pit with a ragged edge and ash flecks inside a wide singed halo that goes from dark brown to tan, turned by its name. For its first half second it is alive: an ember that falls as exp(-age / 0.35), nine sparks that fly out and fall back (one instanced mesh), then two smoke puffs for 1.5 s. It lies on the cap it struck, or on the nearest cap within 36 px when it struck a gap: its middle is moved at most 14 px to stay on the cap and the decal is cut at the cap's shoulder, so no burn hangs over a gap. Smoke and sparks rise from the moved middle. It fades over its last 0.4 s. |
| Overheat | same | The turret's own clones of the metal go dark (hot metal mirrors less) and take a dull red emissive from `v[4]`, the barrel hotter than the head; six white steam puffs rise from `ctx.time` and the seed of its name; one red light. Seen only with heat forced to 1 in a still: no still command reaches the live state. |

## Numbers of the shapes this part writes and reads

`turret-<i>` `v` = [cos aim, sin aim, charge 0..1, seconds since its last shot (1 when none), heat 0..1 when overheated, pull back px, hatch open 0..1, shots fired]. Written in `Turrets.draw`. The first `hatchShare` (0.3) of the rise opens the hatch, the rest lifts the turret.

`bolt-<n>` `v` = [share of its flight, 0..1 over its first 0.05 s]. `scorch-<n>` `v` = [share of its life left].

Read from /root/step1_director's shapes: `key-<name>` `v` = [press, hop px, shuffle, heat], `keyboard-deck` `v` = [rise, swing px, shake px]. Heights of the shapes are the truth for place: `v` is used only for the tumble.

## Glow and light, agreed with /root/light_keeper

Unit of `ctx.light`: power p means a white matte surface 100 px from the emitter, facing it, sends back about p times the colour in linear light; zero at `reach`. Six true lights a frame, two with shadows. The emitter's body is 20 px: light at distance d is power times colour times (100² + 20²) / (d² + 20²). Reflected light is capped at linear 1.25 and glow starts at 1.3, so only emissive parts glow. The bolt was first 1.0 at reach 260 and washed three caps pale yellow; /root/light_keeper suggested 0.25 to 0.35 at reach 90 to 120, taken.

| Thing | Colour of the mesh, linear, past white | `ctx.light` colour | power | reach px | shadow |
| --- | --- | --- | --- | --- | --- |
| Bolt head | 16, 10, 4.5 | 1, 0.4, 0.09 | 0.3 | 110 | yes |
| Bolt tail | 3.2, 1.0, 0.18 | | | | |
| Muzzle flash | 9, 3.6, 0.9 falling over 0.05 s | 1, 0.5, 0.15 | 0.9 | 220 | no |
| Charge | 6, 2.5, 0.6 to 16, 7, 2 | 1, 0.45, 0.12 | 0.3 times charge squared | 110 | no |
| Overheated metal | emissive 0.42, 0.03, 0.006 on the head, 2.2 to 3.2 times that on the barrel | 1, 0.12, 0.03 | 0.35 | 140 | no |

Emissive meshes cast no shadow.

## Decisions

1. The deck and all caps are one object, keyed on the deck shape. A key shape answers `''` while the deck is in the list, and a lone cap object otherwise. This is what lets the caps be one mesh.
2. The legend is the type maker's. The crest of the rim is at the key shape's `z1` and the dish lies 0.9 px below it, so a flat legend at `z1` is never under the plastic and hovers at most 0.5 px, which a straight-down camera does not show. This is the first of the two ways /root/type_setter offered: nothing changes on their side.
3. The field under the caps is one pocket and not sixty seats: from above the keyboard reads through its gaps, and sixty outlined seats read as embossed buttons (look 1 and 2 on the looks branch). Its floor was dark at first; the Builder's critic issue 1 made it the deck's aluminium in the caps' shadow, because a dark floor outlined every cap in black like a drawing.
4. The deck is bright silver (the Builder's critic issue 2): the shared aluminium at 0.95 of its colour, roughness 0.52 and anisotropy 0.45 so that the highlight is broad and both ends of the plate are alike under the 20 degree lens. My first deck was darker and blue-grey; it read as painted steel beside the header rule.
5. `material.envMapIntensity` does nothing in the pinned three (fact from /root/type_setter). The cap plastic and the dark parts use `specularIntensity`.
6. `Material.clone()` drops `onBeforeCompile`, so a cloned shared material is passed through `studio()` again, and a clone of one of mine takes the hooks of its source.
7. Overlays (bolt, flash, puffs, scorch) set `userData.order` to 900000 and up so the view draws them after everything opaque.
8. `Turrets.draw` gives the hatch the first 0.3 of the rise (`TURRET.hatchShare`). When the turrets go down every scorch is gone in 0.4 s (`TURRET.scorchFade`, the rule of /root/step1_director). No number of `TURRET` that /root/step1_director listed is changed, and `step` is as it was.

9. The corners of the deck are rounded to 5 px, not 18: the ground cuts the well as a plain rectangle, and a rounder plate left a dark notch of the well at each corner.
10. The home lens is 20 degrees since main 77d4dc7. Nothing of mine relied on walls being hidden: the deck's walls go 84 px down, the collar of a turret 112 px, the socket 36 px.
11. Draw calls (the Builder's critic issue 3). MEASURED with `npm run counts -- --key step1-fire --format hd --live low`: keyboard 135 calls before, 32 after; turrets 85 before, 42 after; the picture 471 before, 325 after. Caps are one mesh and not one `InstancedMesh`: nine sizes of cap would need a stretch in the vertex shader, and the diagnostic views and shadow passes swap materials and would draw every cap at one size. A buffer written by hand is the same in every pass. Only the plate, the caps and a turret's collar, head and barrel cast shadows.
12. The Enter by a vertex colour on the cap plastic was tried and taken out: M4 reads the material under a legend and found white on cream (1.21 against 4.5).
13. The flash and scorch pictures are 256 px: at 128 px M2 found them under one texel a screen pixel in the key picture.
14. Cap walls stand straight (the Builder's issue of 15:32Z: the lit rim of every cap was ragged). The key light is about 27 degrees above the page, so a wall is lit only where light comes through the gaps of the row above, and a leaning wall showed that as bulges under a wavy shadow edge. With a straight wall the camera sees only the round shoulder, which is above the shadow of the next row everywhere and is lit evenly. The look lock's ten degrees of slope is given up for this.
15. Turret barrel (same message): a stepped tube, sleeve of radius 18.5, tube 15.2, muzzle ring 18 with a groove, bore of radius 12 and 24 deep, 76 px out of the head (the head is 80 wide), lifted 0.17 rad so that it points at a cursor that floats above the page and the camera above sees into the bore. It aims by `v[0], v[1]` of the turret shape, which the step's logic turns toward the cursor with `TURRET.aimLag`.
16. Bolt (same message): head 22 by 5.4 px, an orange tail 6 px thick and up to 112 px long with a white-hot core 3 px thick inside it (instance colours of one mesh), and a star flare of 0.1 s where it strikes, before the ember and the sparks. The halo round a bolt is the post chain's glow on these colours and the light on the caps is `ctx.light`.
17. Softer caps (the Builder's message of 15:42Z): the shoulder is a quarter ellipse 8 px wide and 5.6 px high in 10 steps (`CAP.shoulder`, `CAP.fall`), the dish is 0.9 px deep over 16 px and its rings grow rounder toward the middle so no crease runs to the corners (a dish of plain inset rectangles read as a pyramid), and each cap stands 1.2 px inside its key rectangle on every side (`CAP.gap`), which widens the dark gap by 2.4 px. MEASURED after it with `npm run measure -- --unit step1`: 8 green, M4 least contrast 4.64 (as before), M5 furthest 0 px, M9 furthest 0 px. The scorch is clipped 9 px inside the cap edge so it stays on the flat of the top.
18. The barrel is longer than the socket is wide, so it stays stowed while the turret is under the deck: `poseTurret` pulls it back by `TURRET_LOOK.stowed` (62 px) and keeps its lift at 0 until the rise is past `TURRET_LOOK.clear` (0.72 of the way up), then slides it out and lifts it over the rest of the rise. Going down runs the same numbers backward. Before this the muzzle came up through the plate beside the hatch at about 3.06 s.
19. The aim in the fire still (same message). MEASURED from the pixels of the draft still of `step1-fire`: the true bearing from the left turret to the arrow is about 14 degrees above level and the barrel stands at about 10; from the right turret about 6.5 degrees and the barrel is within two. Neither turret holds a lock at unit time 6.0, so the difference is `TURRET.aimLag` (0.16). The barrels read as level because the arrow stands one and a half rows above the turret row. Both numbers that would change this (the lag, and where the arrow stands at 6.0) are /root/step1_director's, and were sent to them.
20. Round 3 of the critics (16:00Z). What the blobs on the key tops were, each MEASURED by a draft still of `step1-fire` with and without it: the smudge on Shift and the @ key was the shadow of the left turret's head and barrel (the key light is about 27 degrees above the page, so a part 54 px above the cap tops throws about 106 px); it is gone with `castShadow` off on everything under the turret's `head` group, the collar still casts. The diagonal smudge from W to D is the shadow of the arrow, which is not this part's. The fine mottle was the speckle normal map at 0.07, now 0.03; what is left is the grazing shadow sampling of the key light on the tops.
21. The bed between the caps is lit steel (same round): `bed.receiveShadow = false` and the bed's colour at 0.72 of the shared aluminium. With shadows the bed was dark everywhere, because caps 27 px above it stand about 12 px apart under a 27 degree light. NOT DONE, and the first thing for whoever takes this on: a cap in the air now throws no shadow on the bed (it still does on other caps and on the deck), so in the shuffle the flying caps lose weight; see `--page step1 --beat step1.lastName --at 0.094`. The way to have both: give the caps mesh a `customDepthMaterial` and a `customDistanceMaterial` that read a per-vertex number `moved` (0 for a cap at home, 1 for one that is off its seat, written in the same place the cap's stretch of the buffer is rewritten) and throw away the vertices of caps at home in the shadow passes; then set `bed.receiveShadow` back to true. Seated caps then cast nothing into the gaps and a moved cap casts a true shadow. A second way is one instanced mesh of soft dark quads on the bed under each moved cap, pushed along the light by height over tan of 27 degrees.
22. The stray mark between Q and W in `step1-fire` (round 3, page critic): no shape of this part draws a glyph. In the still at 3abcbf1 the arrow's tip stands on the foot of the legend 4 and its tail covers the left stroke of the legend W; the bright specks on the arrow are on the arrow itself.

## One more mechanism that rises out of the page

1. Give it shapes. In the page's logic push one shape for the body with `part: '<name>'`, a `role`, `z0` at the surface it rises from and `z1` at its top, and `mechanism: true` once its top is at or above `scale.heights.machineMinTop`. Put every number a picture needs in `v` and write the meaning of each next to where it is pushed. Check: `npx vitest run tests/step1.test.ts`.
2. Give it a hole. Push a shape with `role: 'hatch'` (round) or cut a pocket in the plate it stands in (`deckGeometry` in `src/pages/step1/real/keyboard.ts` shows both: `face.holes.push(...)`, then a chamfered lip and dark walls with `sweep`).
3. Write the maker `src/pages/<page>/real/<name>.ts` as a `PartMaker`: `key` answers a string for the shape that owns the object, `''` for shapes the same object draws, `null` for what stays a stand-in. `make` builds round the shape's centre with z = 0 at `z0`. `pose` moves things and builds nothing. `drop` frees what the object alone owns.
4. Build solids from `turn()` (turned parts, `keyboard-kit.ts`) and `sweep()` (`src/shell/solids.ts`). Share geometry in a module cache, take metal and plastic from `kit()` or `materials()`, draw equal things as one `InstancedMesh`, and things of a few sizes that move as stretches of one mesh (the caps). Count with `npm run counts -- --key <key> --format hd --live low`: a mesh that casts a shadow is drawn once in every shadow pass, six times for each shadowed emitter.
5. Keep it under the lids while it is down: lower it by a few px for the first quarter of the rise (`TURRET_LOOK.sunk`) and let the lids open in the first share of the rise (`TURRET.hatchShare`). Any piece that reaches further from the axis than the hole is wide (a barrel, an arm) stays pulled in until the body is clear of the plate (`TURRET_LOOK.stowed`, `TURRET_LOOK.clear`): look at three stills across the rise and three across the sinking before calling it done.
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

## Fix round

Owner: `/root/keys_fixer`, branch `agent/keys`. It answers the round 3 issues R4-1 #1, R4-2 #2, #4, #5, R1-1 #6 and R8-1 #2. The slab issues are in `pipeline/phase3/slabs.md`.

### What a quick look misses (five things the approved image and the critics' frames show)

1. The approved caps are one even tone from edge to edge. The only darker tone on a cap is its lower and right wall. There is no cap that is darker than its neighbour.
2. The gaps between the caps are light steel, lighter than the walls of the caps, and they are the same tone across the whole field.
3. A cap that is down is told from its neighbours by a darker top and a thinner lit rim, not by its size: from straight above 6 px of travel moves no edge.
4. The dark marks on the approved keyboard are small crisp pits (on the space bar and in the gap between U and I), never a soft brown cloud beside a legend.
5. In the critics' frames the shuffle was read from two samples 0.45 s apart: whatever is not visible in a single frame of the flight is not seen at all.

### What changed

- Pressed keys. The struck key stands at full travel on the frame of the strike (`v[0] = 1`), is held there for `HOLD` 0.1 s, and springs back by 0.24 s with one overshoot of about 1.5 px above its rest (`spring()` in `src/pages/step1/index.ts`: 1 while held, then `cos(1.5 pi t) (1 - t)^1.5`). `ground()` follows the same curve, so the cursor rides the cap down and up. A bolt that lands on a key taps it to 0.55 of its travel (`TAP`). A bolt that hits the cursor drives the key under the body down (`THUD`, 0.26 s, held 0.07 s) and shakes the tray at 0.4 of the shuffle's amplitude.
- A pressed cap is darker. The cap material carries a vertex colour; a cap at depth d is tinted by `1 - 0.24 d` (`SUNK` in `real/keyboard.ts`). This is what reads at the size of a sheet tile.
- The field answers in the same frame. On the strike frame the focused field's glow goes to 1 for `PULSE.hold` 0.05 s and fades over 0.3 s, the caret is on, and the letter is in. On the frame a bolt hits the cursor the glow and the caret go out. A slab that lands pulses the field too.
- Shuffle. `shuffled()` in `keyboard.ts` now swaps each letter with a neighbour at most 2.3 pitches away (pairs; an odd one out joins a ring of three), so no cap crosses the field. Each cap launches on its own frame: a ripple outward from the struck key at 0.09 s a 100 px plus a seeded jitter of 0.025 s (`launchOf`). A cap crouches 0.035 s, flies 0.165 s along a path bowed sideways so two swapping caps pass beside each other, 24 to 64 px high by distance, lands with a hard stop and one seat spring of 0.09 s (`flightOf`). The tray jolts at the first launch and at each landing wave, and caps that keep their seat stir by 1.6 px. A flying cap has a shade on the bed that slides away from it as it rises (offset `hop x (1.8, 1.67)` along the key light) and an undrawn ghost box that casts its real shadow.
- Covered legends. A legend whose cap is under a higher flying cap is hidden for those frames. This was the class of the stray glyph: the type is drawn after the plastic, so a covered legend showed through the cap above it.
- Cap look. Cream `0xefe9dd`, roughness 0.66, `specularIntensity` 0.4, no clearcoat, no speckle normal picture. The caps mesh receives shadows and casts none. The bed is the shared aluminium at 0.9, 0.91, 0.93.
- Enter lamp. The orange accent on Enter is `studio(m.orange.clone())` with an emissive `0xff5a08` at intensity 0 at rest and `0.9 x depth` while the key is down, so it glows only when Enter is pressed.

### Decisions

1. The mottle on the cap tops was the caps' own shadows on each other. MEASURED: a draft still of `step1.lastName` at 0.094 with `caps.receiveShadow = false` showed even caps and no blotch; with `castShadow = true` the blotches were back. The caps keep receiving (the cursor, the turrets and the slabs still shade them) and cast none. The price: a cap at rest throws no shadow on the bed, which the lit bed of decision 21 above had already given up.
2. A pressed key is shown by tone as well as by height. From straight above a 6 px dip moves nothing on screen; the critic's "dip 1 to 2 px with a tightened shadow" is answered by the tint and by the cursor's own shadow closing up as `ground()` falls.
3. The local shuffle changes which letter sits where after the first press. `script.ts` reads `shuffled()` through `makePlan`, so the film's cursor path follows; I did not edit `script.ts`. The times of the beats are unchanged.
4. The overshoot of a returning key rises above the rest height by about 1.5 px. `tests/step1.test.ts` checked the pressed key's `z1` exactly; it now checks a range.
5. `SHAKE.px` is 5.5, under the 6 that `tests/step1-script.test.ts` (not mine) allows.
6. The stray mark between Q and W in the key still: decision 22 above stands (the arrow's tip and tail over two legends). In motion the same reading came from legends showing through overlapping caps, which is fixed by hiding covered legends.

### Second pass (the Builder's order of 18:45Z)

7. Scorch marks are small crisp pits off the legends. The picture (`scorchPicture`, still 256 px, 0.33 MB, no memory added) has a charred pit with a hard ragged edge and a narrow brown ring in place of the wide halo; the mark is 54 px (`SCORCH.size`), was 62. `layScorch` keeps the pit's middle `SCORCH.legend` 24 px to the side of the middle of a letter cap, 52 px on a cap with a word, and leaves it where the bolt struck on the space bar. The side is the side the bolt struck, by the mark's seed when it struck dead centre.
8. Impact flash on the hit frame. When a bolt hits the cursor the page draws a shape `scorch-9000N` with `v[1] = 1` at the place of the hit for `STRIKE.seconds` 0.5 s. The scorch maker draws it as a strike only: no mark and no smoke, a star flare of 96 to 186 px for 0.1 s and the sparks. It stays where the hit was while the cursor is thrown clear.
9. A soft shade of each cap on the bed. Every seated cap now has one patch of the `shades` mesh, 6 px smaller than the cap and moved `SHADE.rest` 10 px along the key light, so the gap below and right of a cap is darker than the gap above and left. It tightens to 4 px while the key is down (`SHADE.tight`). It is geometry only and no cap casts on another cap, so the mottle does not come back. MEASURED: draft still of `step1-fire`, draw calls 280 (was 279), triangles 488097 (was 487287).
10. Bolts are thin streaks (the Builder's point 4). Head 13 by 3.6 px (was 22 by 5.4) at glow 10, 6.5, 3 (was 16, 10, 4.5); orange tail 2.6 px thick and up to 168 px long (was 6 px and 112); the white-hot core 1.5 px thick (was 3). The light a bolt throws on the caps is unchanged.
11. The field's rim: `/root/surface_fixer` applied `0.8 + 1.6 v` and a core lift of `1 + 0.7 v` in `controls.ts` on `agent/glass` (04debbf). It is on main since merge 19. MEASURED by two draft stills of `step1.firstName`, at 0.758 (the frame after the press of L, glow 1) and 0.7985 (0.34 s later, glow 0): the rim and its spill are plainly brighter on the press.

12. In a swap one cap flies over and the other under: the cap that moves to a later seat flies at 1.25 of its height and the other at 0.75 (`FLIGHT.over`, `FLIGHT.under`), so two caps that cross are never at one height. Of two caps that overlap only the lower one loses its legend for those frames; before, both could, and blank caps flew. MEASURED by a review still of `step1.lastName` at 0.094 before (4 blank caps in the air) and a draft still after (none).

13. A pit rides its cap. `layScorch` took a cap only if its top was within 3 px of the height the bolt struck at, so a cap that hopped in the tray's shake or dipped under a tap lost its pit: the mark stayed at the old height and was hidden inside the plastic. MEASURED: draft stills of `step1.firstName` at 0.644 and 0.650 (the hit and three frames later) showed three pits on W vanish in 0.05 s; with `SCORCH.ride` 16 px and the mark lifted to the cap's top they stay.
14. The Enter lamp was looked at on the press: draft stills of `step1.email` at 0.492 (before, lamp dark) and 0.506 (Enter down, lamp lit).

15. A cap in the air throws a clear shadow that leaves it as it rises (the Builder's note of 19:17Z). Above a hop of 4.5 px the cap's shade is no longer on the bed, where the caps round it hid it, but 3 px above the tops of the seated caps (`SHADE.over`), so it falls across the space bar, the number row, the seated neighbours and the gaps alike. It is two patches, a wide soft one and a core of 0.74 of its size, moved `hop x (1.8, 1.67)` along the key light and widened by a quarter of the hop. A cap above it hides it, which is right: that cap takes the real shadow of the ghost box. Tried first at 0.6 px above the tops: the caps that stir by 1.6 px showed the patch in their own dish (draft still, number row), hence 3 px and the threshold of 4.5.

16. A bullet hole, not a dark spot (round 4, R3-1 #1). `scorchPicture` in `real/turret-fx.ts` now draws a hole seen from above under the page's light from the upper left: a dark shaft, the deck's metal faintly at its foot, a lit far wall, a raised splintered cream rim with a lit side and a shaded side, charred black in places, the rim's cast shadow on the cap and a dark brown singe that fades outward. The picture is the same 256 px and 0.33 MB, so no memory was added. The mark no longer turns (`turn: 0`), because the light in the picture has a side; its width and height still vary by seed. `SCORCH.size` 52, `SCORCH.core` 13 and `SCORCH.legend` 27, so the rim clears the letter and the dense part of the singe ends before the cap's shoulder cuts it.

17. The hot spot and the wisp sit under the cursor (round 4, R1-1 #3, the half that is mine; agreed with `/root/acting_fixer` at 19:51Z). The cursor's place at 6.0 s is the acting fixer's: it plans to stand on J, be hit there at about 5.61 s and stay through 6.0 s, with the right turret's next shot landing on the same spot. Mine is built to follow the cursor wherever the script puts it: the strike shape `scorch-9000N` now lives 1.5 s (`STRIKE.seconds`, was 0.5) and carries, at the place of the hit, a warm glow on the cap top that dies in about a second (`SCORCH.hotSeconds` 0.55, 150 px), a warm lamp (`EMIT.struck`) and a thin wisp of three puffs that rises from it. Every fresh hole also gives a short warm lamp (`EMIT.ember`) while its ember is alive, so the keys round the newest marks are the lit ones, and its smoke is a narrow wisp (three puffs, 2.1 times as tall as wide, 15 to 39 px wide) instead of two round puffs. Since the turrets aim at the cursor the marks of that moment lie round it by construction. `tests/keys-strike.test.ts` holds the 1.5 s. Looked at on main's film after the acting fixer's change came in (merge of 20:00Z): at 6.0 s the cursor stands on J, the cap under it glows, the sparks of the hit lie round it, the wisp rises over it, and the holes of that moment are on K, U and R beside it. The wisp of a strike is drawn at the cursor's height so the cursor does not hide it.

18. Deck, caps and turret finish (round 4, R1-1 #4, #5, #6). Deck: roughness 0.46, anisotropy 0.5, brushing bump 0.1 (was 0.22), colour times (0.84, 0.85, 0.875), edge chamfer 3.4 px (was 2.4). Caps: `0xf0e6d3`, roughness 0.62, `SHADE.dark` 0.52 and `SHADE.rest` 11 for deeper lower seams. Enter: the shared orange with roughness 0.3 and a clear coat of 0.6 for a brighter rolloff. Turret: housing and hatch rim at colour times (0.38, 0.39, 0.415), roughness 0.36, anisotropy 0.7 for a directional brushed highlight; barrel times (0.2, 0.205, 0.22); socket `0x4c4a47` (was `0x8a8782`). This goes back on decision 4 of this round (the bright silver deck): round 4 asked for the darker satin metal of the approved image.

19. A bolt on a key is seen to strike (round 4, R4-1 #5 and R4-2 #4; the Builder's note 2 of 19:53Z). The struck cap now goes to the bottom of its travel and springs back (`TAP` 0.2 s, held 0.05 s, depth 1; it was 0.55 of the travel for 0.16 s), and the tray answers with a small jolt round the strike (`TAP.shake` 0.22 of a slab's: about 1.2 px of deck and a hop of up to 3.3 px on the caps near it), unless a larger jolt is still running. The flash at the point of contact is the one of decision 9. The bolts and the muzzle flash are larger and brighter, still streaks and not balls: head 20 by 5.2 px at glow 14, 8.5, 3.6 with a soft star halo of 58 px round it, tail 3.8 px thick with a core of 2.1 px, bolt lamp 0.45 over 150 px, muzzle flash 124 to 184 px across (was 86 to 130) and its lamp 1.2 over 260 px. The number of bolts and the times of the shots are not changed: the acting is timed to them. The place of the strike on the cursor is kept in its own field of the page state (`struckAt`), so a later jolt does not move the flash.

20. A slab lands dead (round 4, R4-2 #1, #2, #3; the Builder's note 1). What was already there since the first fix push and is in the sheets only if they start before the landing: the slab arrives 110 px up, hangs 0.2 s and falls 0.2 s with a cubic acceleration, its shadow from the key light lies about 200 px down and right while it hangs and closes under it as it falls, the deck jolts 5.5 px and dies in 0.25 s, and the caps round it hop. Changed now: the caps under the slab are at the bottom of their travel on the landing frame itself (they took 0.03 s), the slab sinks the key travel in 0.015 s and its 1.2 px bounce is gone. A purpose-made soft shadow that starts wide and tightens was not built.

21. The bolts, ruled by the Builder at 20:15Z: longer, not fatter. Head 8 by 3 px at glow 12, 7.5, 3.3, tail 2.6 px thick and up to 92 px long with a core of 1.4 px, no halo; bolt lamp 0.3 over 110 px. The muzzle flash is 24 to 32 px across, lasts two frames (`TURRET_LOOK.flashSeconds` 0.034) and its lamp is 0.6 over 160 px. This replaces the bolt and flash sizes of decision 19; the dip of the struck cap and the tray's jolt of decision 19 stay. Looked at on the fire key: the blob over Caps Lock at 6.0 s is gone and the legend reads.
22. The deck as a tray, by tone (Builder, 20:15Z): the flat top of the deck is drawn in two tones. A rim 9 px wide (`DECK_LOOK.rim`) and the chamfer stay in the light deck steel; the face inside the rim is the well, `metal(0.5, 0.5, 0.1)` at 0.37, 0.38, 0.41 of the shared aluminium, and the bed between the caps is 0.36, 0.37, 0.395. No new shape: the same flat face is split into two meshes so each can carry its tone, which costs one draw call; no texture is added. NOT DONE: the well's floor does not darken toward its walls and is not darker at the upper left; it is one flat tone. Looked at on the fire key beside the approved image: dark well, light narrow rim, caps and legends as before.

### Not reached

- The landing frame of a slab falls between two sheet samples; what shows it afterwards is the pressed keys under the slab only.
- At sheet size a hole reads as a dark dot with a pale rim; the wall and the metal at its foot show only close up.
- The orange bounce of a discharge on the turret housing (R1-1 #6) is the muzzle lamp only; no reflection was added.
- The caps' crown and corners (R1-1 #5) were not reshaped in round 5; only the colour, the gloss and the seams changed.

### MEASURED (2026-11-25, on the working tree of the first fix commit, main at ed12811)

- `npm test`: 72 files, 1151 tests passed.
- `npm run build`: built.
- `npm run bots`: "bots: all clear", gags 37 of 37 for each bot.
- `npm run measure -- --unit step1`: 7 green, 1 red. The red is M3 on `key:step1-tug` (0.6683, red on main, the tug fixer's). `key:step1-fire` is not in the failing list of M3, so it is at 0.8 or more; its exact value is UNKNOWN, the tool prints only the least.
- `npm run counts -- --key step1-fire --live low`: on main keyboard 4 meshes, 6 calls, 77380 triangles and the picture 115 calls, 270969 triangles; on this branch keyboard 6 meshes, 8 calls, 39580 triangles and the picture 114 calls, 233169 triangles. Turrets 31 calls, 12796 triangles on both.
- `npm run still -- --key step1-fire --format hd --tier draft --force`: 9.9 s (12.8 s wall), triangles 487287, draw calls 279.
- `npm run still -- --key step1-fire --format hd --tier review --force`: 20.5 s (23.7 s wall), triangles 487287, draw calls 279. Before the fix round the same command gave 22.4 s, triangles 1016487, draw calls 293: the caps left the shadow passes.
- Textures: none added. STATED from `assets-src/keyboard/RECIPE.md` and `assets-src/slabs/RECIPE.md`: keyboard and turrets 2.0 MB with mipmaps (512 px brushed 1.33, 256 px star 0.33, 64 px puff 0.02, 256 px scorch 0.33), slabs 3.82 MB.

### Tuning looks

Of 40 each in the fix round: keyboard 27, turrets 20, slabs 5.

## Fix round 3: the look

Owner: `/root/keys_look_fixer`, branch `agent/keys-look`, 2026-11-25 from 21:22Z. Files: `real/keyboard.ts`, `real/keyboard-kit.ts`, `real/turrets.ts`, `real/turret-fx.ts`. Nothing outside them was changed. How anything moves, the layout, the type and the light are not touched.

### What round 5 found and what was done

1. The deck (R1-1 issue 2, severe). MEASURED on `references/approved/step1-fire.png` with a script that reads the mean of 12 px squares: the approved steel beside the keys runs from 135 to 202 (lower left 202, 201, 199; upper middle 162, 161, 161), the gaps between its caps 64 to 139, the page 221, 216, 210. The build on main: deck 98 to 107, page 229, 225, 217. Now the deck's face is 162 to 185 with highlights to 201, the rim 207 with a line at 249, the bed between the caps 101 to 112.
   - FOUND IN THE SECOND PASS, and the largest single change: the face of the deck was drawn over the whole deck, key field and hatches included. The field of the keys reaches 0.1 px past the top and the bottom of the deck (`KEYS.y = DECK.y + 8`, `DECK_LOOK.field` 7, lip 1.1), so as a hole in the face it crossed the face's own outline, and the triangulation of a shape whose hole crosses its outline is not defined: MEASURED in a throwaway test, 5 of 5 points inside the left hatch lay inside a triangle of the face. So the bed between the caps was never seen (the gaps showed the face), and neither was the well of a hatch (the turret stood on flat deck). This was so on main too: the same call with the same numbers. Now the face is the two ends of the deck beside the field, each cut from the outline by an upright line (`cut` in `keyboard.ts`), each with its hatch as a hole. The gaps between the caps show the dark bed, as the approved image's do, and a turret stands in a dark well.
   - The face (`kit().well`) is a satin steel of its own: colour `0xdfe0e1`, metalness 0.35, roughness 0.44, the shared brushed normal picture, anisotropy 0.55. A full metal seen from straight above mirrors the dim room over the page and can only be dark, so part of the light is given back diffusely, as a satin finish does.
   - Long soft highlights: the face carries a tone at every point, `sheen(u, v)` in `keyboard-kit.ts`: soft upright bands across the brushing, a little lighter toward the upper left. It is not a picture. Tried first as a colour picture of 512 by 256 px laid once over the deck: MEASURED `npm run measure -- --unit step1` M2 red, 0.9591 of the textured pixels under one texel a pixel. So the flat face is split until no edge is longer than 40 px (`refine`, `DECK_LOOK.cell`) and the tone is written at its points.
   - The rim (`kit().deck`, `0xe6e7e8`, metalness 0.5, roughness 0.3): a quarter round of 8 px (`DECK_LOOK.roll`, was a chamfer of 3.4 px), a flat land of 4.5 px, then a groove 2 px wide and 1 px deep that parts the rim from the face. Corner radius 8 px (was 5).
   - The bed between the caps is 0.3 of the shared aluminium. The dark is in the gaps and in the wells and nowhere else.
2. The struck key keeps its legend (R1-1 issue 4). The glow of a strike was a 150 px star picture drawn additively over the cap, and a lamp of power 0.8 over 170 px. Now: a soft round halo of 46 px (`SCORCH.hotSize`, a 64 px picture `haloPicture`) at the point of impact, dead in 0.4 s; the lamp 0.28 over 64 px. A small scorch stays for the 1.5 s the strike shape lives, kept clear of the legend by `layScorch`, and fades over its last 0.4 s. The sparks of a hit last 0.24 s (was 0.55) and are 6 (was 9). NOTE: in the key still at 6.0 s the arrow itself stands on the middle of H and its body covers the letter. STATED from `src/pages/step1/index.ts` line 849: the page hides a legend only under a flying cap. Where the arrow stands is not mine. Not looked at in a frame without the arrow: UNKNOWN beyond the code.
3. The turrets (R1-1 issue 6).
   - The head is a turned knob, not a ball: a straight body 40 px in radius, an edge rounded over 10 px (`TURRET_LOOK.dome`) and a top that rises 2.4 px to its centre (`crown`), in `kit().chrome` (`0x8e9196`, metalness 0.9, roughness 0.42): MEASURED 180, 181, 183 on its top, 252 at its brightest point. The first pass had a dome 27 px high in a paler, glossier chrome and it read as a white ball.
   - The barrel is 134 px from the axis (was 116). Its sleeve is 19 px in radius, the taper runs from 15.6 px to 11.4 px and ends in a collar of 13.8 px (first pass: 12.8 to 9, too thin beside the approved one). The muzzle collar is its own small mesh that glows orange (`GLOW.tip`): 0.3 of its heat at rest, rising with the charge, full for a moment after a shot, with a 32 px halo and a small lamp.
   - The well: the socket under a hatch was 36 px deep under a deck 24 px high, so its floor was under the page. It is 20 px deep now, in `kit().dark`, and the collar that rises with the head is `kit().dark` too. With the face fixed (1 above) the well is seen: a dark ring round the head inside the bright bezel.
   - The doors of a hatch are seen for the first time (the face lay over them): they are the satin of the face, at a tone of 0.74 (`doorTone`), which MEASURED 183 against the face's 185 beside them.
   - The bolt is thinner and shorter: head 8 by 2.4 px, tail 2 px thick and at most 76 px long, core 1.1 px. Its lamp is 0.16 over 64 px (was 0.3 over 110).
   - The bolt is lobbed: drawn up to 26 px (`TURRET_LOOK.lob`), and never more than 0.085 of its whole flight (`lobShare`), to the picture's upper side of its line, by `sin(pi u) ^ 0.4` of its flight `u`. It leaves the muzzle and lands on its mark exactly and flies above the line of the legends between. The flight, the times and the hit are the motion owner's and are unchanged: this is where the streak is drawn only. LOOKED AT at 6.0 s: the left bolt is above the Caps Lock legend and the legend reads whole.
4. The marks on the keys (R1-1 issue 5, the keys' half). `scorchPicture` is drawn again at the same 256 px: a ragged blot of black char with a pit in it, a crust that breaks into flecks, and a brown singe round it that fades over a third of the radius. No raised cream rim and no bronze ring. A fresh mark was multiplied by 7 in red and green while its ember lived, which made the ring glow; it is now 1.9 and 1.25, with a 30 px halo that dies in a third of a second. The mark is 54 px (was 52).
5. The caps (R1-1 issue 7). Colour `0xeee7db` (was `0xf0e6d3`): MEASURED cap top 227, 219, 205 against the approved 215 to 225, 207 to 216, 195 to 203. The shoulder is no longer a quarter round of 8 px: a hard lower edge, a flat slope 4.8 px wide that falls 5.6 px, a crest of 1.3 px radius and a top that is flat but for a dish of 0.55 px. The corner radius is 11 px (was 9), nearer the approved caps' round corners. The shade under a resting cap reaches 6.5 px (was 11) and is a cool grey.

### What is still wrong beside the approved image (looked at in the compare and the crops of `step1-fire`)

1. The turret is seen from straight above, so its head is a bright disc with a rounded edge. The approved turret is seen from a little to one side: a cylinder with a lit top and a darker wall, standing well out of a deep black well. The camera is not mine.
2. The caps are flatter than the approved ones. The approved cap has a deep soft dish and a warm lower shoulder; ours has a flat top and a pale frame. The approved keys are also smaller with wider dark gaps, which is the layout's.
3. A mark is a blot of char with a brown edge. The approved mark is a hole with melted, glossy lips and a thin bright orange rim. There is no relief in ours.
4. The approved image has three or four tracers in the air with bright sparking heads. At 6.0 s the build has one bolt in flight; when bolts fly is the motion owner's.
5. The steel of the deck is even. The approved steel has scuffs, a dark reflection along the wall of its well and warm spill from the tracers.

### Decisions

1. The deck's face is not a full metal (metalness 0.35). See 1 above.
2. The face of the deck is the two ends beside the key field. If the layout ever leaves room above or below the keys the face would need those strips too; today there is none (the field is 0.1 px taller than the deck).
3. The lob of a bolt is drawn, not flown: see 3 above.
4. The strike shape leaves a mark for its own 1.5 s (`SCORCH.strikeSeconds`, the same number `tests/keys-strike.test.ts` holds for the page).
5. The socket is 20 px deep because the deck is 24 px high: a deeper one is under the page.
6. No test was changed and none was added.

### Textures

- New: `haloPicture` 64 by 64 px, RGBA 8 bit, 0.016 MB, 0.02 MB with mipmaps.
- Redrawn at the same size: `scorchPicture` 256 px, 0.25 MB, 0.33 MB with mipmaps.
- The sheen of the deck is no picture: 0 px, 0 MB.
- Total of the pictures of the keyboard and the turrets: 1.54 MB, 2.04 MB with mipmaps (STATED from the sizes in `assets-src/keyboard/RECIPE.md`; main had 1.52 MB and 2.02 MB, the difference is the halo).

### MEASURED (2026-11-25, 22:02Z to 22:08Z, on this branch at the commit before the last chrome tone, and on main at 054d9be in a second worktree)

| What | Command | Main | This branch |
| --- | --- | --- | --- |
| Tests | `npm test` | 79 files, 1230 tests | 79 files, 1230 tests |
| Build | `npm run build` | built | built |
| Bots | `npm run bots` | all clear | all clear |
| Measure at review | `npm run measure -- --unit step1 --tier review` | STATED by the Builder: M2 0.0159, M3 0.8846, M4 14 px and 4.64, M9 1.87 px | 8 green, 0 red. M2 0.0083, M3 0.8846, M4 14 px and 4.64, M9 1.87 px |
| Measure at draft | `npm run measure -- --unit step1` | STATED by the Builder: M2 0.0216, red | 8 green, 0 red. M2 0.015, M3 1.2974 |
| Draw calls of the picture, live low | `npm run counts -- --key step1-fire --live low` | 120 | 125 |
| Triangles of the picture, live low | same | 236139 | 229745 |
| Keyboard, live low | same | 7 meshes, 10 calls, 40468 triangles | 7 meshes, 10 calls, 37906 triangles |
| Turrets, live low | same | 33 meshes, 35 calls, 14638 triangles | 38 meshes, 40 calls, 10806 triangles |
| One draft still | `npm run still -- --key step1-fire --format hd --tier draft --force` | 11.75 s, 437746 triangles, 282 calls | 11.28 s, 448691 triangles, 280 calls |
| One review still | the same with `--tier review` | 24.12 s | 22.19 s |

The five calls more in the turrets are the muzzle collar, its halo and the mark of the strike. The face of the deck is 2 pieces split to 40 px; the keyboard has fewer triangles than main because the face no longer lies under the keys.
