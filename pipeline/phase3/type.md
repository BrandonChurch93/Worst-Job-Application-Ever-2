# Type: notes of the type setter

Branch `agent/type`. Looks branch `agent/type-looks`. Part made real: `type`.

## What the approved images show that a quick look misses

1. The highlight never sits on the ink. On `step1-fire.png` and `page-look.png` the title is a cool charcoal near sRGB 32 34 35 on ceramic near 227 226 222, and the soft highlight of the ceramic stops at the edge of every letter: the ink is its own matte layer.
2. The bevel is a hair. Printed letters have about 1 px (at 1920) of light edge at their lower right, a little brighter than the ceramic beside it: the print lies a touch below the glaze and the key light catches the far wall. It is never a stroke round the letter.
3. The gap is dark only in the engraved numerals. The floor of the "2" on aluminium is near 38 40 42, with a dark wall at the upper left and a bright wall at the lower right, each about 1.5 px wide at 1920. Printed type has no gap at all.
4. The edge is slightly soft and the grain of the ground shows faintly through it. No letter has a hard aliased edge and none has a halo. The value in the field ("Perpl", near 27 21 17) is the crispest type on the page, because it lies on glass.
5. White type on orange and on the dark key is warm off-white near 249 229 214, never paper white, with a faint darker warm edge at the lower right, as a raised pad print has. Keycap legends are a warmer charcoal than the page type (darkest near 72 63 53) and sit dead centre.

## How the type is made

- Geometry from the font outlines, no SDF and no texture. A glyph is a filled shape plus one or two narrow rings ("shoulders") round its outline. One run is one geometry, one material, one draw call.
- `setRun(spec)` is a pure function from words and style to numbers. The same words give the same arrays. A run is rebuilt only when its own words change. A glyph outline is tessellated once for each font, character and step count, and kept.
- Curve steps by size: 3 up to 20 px, 4 up to 30 px, 6 up to 64 px, 10 above.
- What a run lies on is read from the layout, not typed: first the shape its id names (`<stem>-cap`, `<stem>-pocket`, `<stem>`), else the highest shape under its middle whose top is at the run's height.

| Lies on | Ink | Setting | What it looks like |
| --- | --- | --- | --- |
| page (ceramic) | ink | sunk | charcoal, a hair of light at the lower right |
| cap (keycap, light button) | ink | sunk | the same, shallower |
| glass (field value, glass tone) | ink | flat | charcoal with a soft edge, drawn after the glass |
| paper | ink | flat | charcoal with a soft edge |
| metal (aluminium) | ink | flat print | matte ink `0x232427` with a 0.4 px soft edge; no wall, no floor |
| smoked (a chip or button of tone metal) | any | raised | warm off-white: only light type reads on the smoked capsule |
| accent, danger, dark | ink | flat | charcoal with a soft edge |
| accent, danger, dark, metal | inkLight | raised | warm off-white, a faint darker edge at the lower right |
| anything else | inkLight | raised | the same, a little lower |

## Decisions

- Geometry, not SDF. Sharp at 1920 and 3840 with the capture's accumulation and the live MSAA, no texture memory, and the edge can carry real normals so the lit side comes from the light and not from paint.
- Ink is sRGB 48 46 43 (`0x302e2b`, see the two inks below; before that 36 39 42, `0x24272a`) with `specularIntensity` 0.15 and roughness 0.62; on keycaps a warmer 63 53 42 (`0x3f352a`). MEASURED with ink at `0x28292b` on `--sheet page-look --tier review --format hd`: the mean of the darkest 3% of the title's box was 42 43 43 against 37 39 41 in `page-look.png`, so the ink went a step darker and cooler. Never pure black.
- The ink of sunk print carries the ceramic's own grain picture as its normal map at 0.16 (uv = page pixels, the same as the slab), so the grain shows faintly through the print as in the approved crops. No texture of my own.
- Type on metal is printed, not cut (changed at look 30). The study line for type says ink on brushed metal is matte, even and sharp-edged and the highlight passes behind it; the cut I had first showed a lit lower wall at 8x beside the approved numeral, which reads as a second edge. The print is a matte layer of its own, so the turned finish under it cannot lift it.
- The material's own colour is the ink and the vertex colours are counted from it, one material for each setting in the table. Reason, MEASURED: `typeContrasts` in `src/capture/showcase.ts` reads `material.color` of the mesh that carries a run. With white materials and the ink in the vertices `npm run measure -- --unit step1` gave M4 FAIL, least contrast 1.19, as soon as the real ceramic was under the type. Now M4 passes, least 4.64 (white on the orange and on the smoked capsule; the white went to `0xfdf3e6` for it).
- Two inks on the page, read off the approved `step1-fire.png` (MEASURED, darkest 3 to 5% of each line with PIL): title 48 47 45, heading 56 53 50, label 61 56 50, value 65 62 57, and the subline 105 100 94, the helper the same family. So the ink is a warm charcoal `0x302e2b` (renders 50 48 45 at review) and the regular weight on the page (`inter-400`: sublines, helpers, body) takes the soft ink `0x67625c` (renders 97 91 85), style `page:soft`. The layout gives only tone `ink`, so the font is the key: in this system the regular weight is the quiet voice. The soft ink is as light as the 4.5 contrast floor lets it be with some room (M4 least stays 4.64, from the white on orange).
- A shoulder is set in page pixels. When a camera comes nearer than the home view the vertex shader draws each shoulder in by as much as it is nearer (attribute `wjaRing`), so an edge never grows past its width at 1920. Further away it is left alone.
- A text shape with `turnX` (the marquee, a plate on a building) needs nothing of its own: the view turns the object about the shape's centre and the run stands 0.05 off its board.
- `material.envMapIntensity` does nothing in three 0.187 when the reflection comes from `scene.environment` (`node_modules/three/src/renderers/WebGLRenderer.js` near line 2749). MEASURED: black ink rendered 70 at 0.3 and at 0.08, and 28 with `specularIntensity` 0.2. I use `specularIntensity`. Told the Builder, surface_mason, light_keeper and keyboard_smith.
- Type lies `HOVER` 0.05 above the `z1` of its shape, with polygon offset, receives shadow, casts none. It is an alpha-blended layer drawn in the opaque pass with depth write, so it is in the picture a transmissive part refracts. A run on glass is drawn after the glass, without depth write.
- No part of a frame reads a clock or a random number. The maker reads only the shape and `ctx`.
- Legends of keys (`key-<name>-legend`) are mine. Agreed with keyboard_smith: the floor of the dish is flat and exactly at the key's `z1`, 15 px in from the cap's edge, 64 by 26 px on a 1u cap. A flat legend 0.05 above `z1` lies on it. If a legend ever gets wider than cap width minus 30 or taller than 26 px I tell keyboard_smith. A flying cap tumbles a few degrees in the shuffle and the legend stays level: not visible from straight on.
- Asked of surface_mason, no answer yet: the top of the glass in a field pocket exactly at `scale.heights.field`, and the top of a progress button flat at its `z1` under the numeral. Sunk type has a 0.3 px band of its own ink at alpha 0.8 (the soft edge of real print) and then a near-white lip (`0xf2efe8`) at alpha 0.5 fading to nothing at 0.9 px, so it brightens whatever it lies on and needs no colour from the surface.
- Told by slab_maker: the resume sheet bends, so the paper maker sets `resume-paper-title` itself from the same outlines through `TypeRegister.set` and lays it on the bent sheet. The director is changing that shape to `part: 'paper'`. Until then my flat run shows and the paper's stays hidden. No objection.

## How a new page gets its type

1. Put every word in `content/copy.json` and give it a text shape in the page's layout through `src/shell/layout.ts`, with part `type`, a `tone` of `ink` or `inkLight`, a size from the `TYPE` table and the height of what it lies on as `z1`.
2. If it lies on a named shape, name it `<stem>-label` beside `<stem>-cap`, `<stem>-pocket` or `<stem>`. Otherwise it is enough that it lies inside a shape whose top is at its own `z1`.
3. A word that changes while the page runs gets a `runtime:` text key and its words through the page state, as the field value and the counter of step 1 do. Nothing else is needed: its run is rebuilt when the words change and kept otherwise.
4. Run `npm run still -- --page <page> --diag type` and check that every run is there, black on white, inside its box.
5. Run `npm run still -- --page <page> --format uhd --tier review` and look at the smallest type in a crop at 4x: sharp, even, the right setting for its ground.
6. If the ground is a new material, add one line to `GROUND_OF_TONE` and, if none of the eight settings fits, one entry to `styles()` in `src/shell/real/type.ts`, and one line to the table above.
7. Run `npm test`, `npm run build`, `npm run bots`.

## Looks used (limit 40)

| No | Command | What I changed or checked |
| --- | --- | --- |
| 1 | `npm run still -- --key step1-fire --format hd --tier draft` | baseline with the stand-in |
| 2 | same | first real type |
| 3 | same | ink too grey (80): found `envMapIntensity` is ignored |
| 4 | same | `specularIntensity` 0.2: ink 28 |
| 5 | `--format uhd --tier review` | ink `0x18191b`, core 36 |
| 6 | same | crops of title, numerals, field, keys |
| 7 | same, `--force` | shoulder winding turned: lit edge and engraved walls now show |
| 8 | `npm run compare -- --key step1-fire --tier draft --format hd` | beside the approved image |
| 9 | `npm run crops -- --key step1-fire --tier review` | engraved numerals too heavy, light edge on the chip a halo |
| 10 | `npm run still -- --key step1-fire --format uhd --tier review --force` | light edge is now a near-white lip at low alpha (follows any ground); engraving thinner and scaled by size |
| 11 | `npm run compare -- --sheet page-look --tier draft` | beside the approved sheet |
| 12 | `npm run sheet -- --beat step1.firstName --tier draft` | the value grows letter by letter |
| 13, 14 | `npm run still -- --page step1 --beat step1.firstName --at 0.3` and `--at 0.6` | shimmer: four static runs differ by 0 between the two frames |
| 15 | `npm run compare -- --key step1-tug --tier draft --format hd` | the word on the paper turns with the paper |
| 16 | `npm run compare -- --key step1-fire --tier review --format hd` | for the report |

| 17, 18, 19 | `npm run still -- --key step1-fire --format uhd --tier review --force`, three times | ink was too dark and too crisp beside the approved crops: ink raised from 24 to 40, a soft band of ink added at the edge, engraved lip weaker, legends warmer |
| 20, 21 | scratch merge of surface, light and keyboard with type, `--key step1-fire` at uhd and hd review | first look on real materials: the chip is smoked, so its label went light; grain added to the ink; white warmer |
| 22 | `npm run compare -- --key step1-fire --tier review --format hd` on main 63c4dd0 | among the others |
| 23 | `npm run still -- --key step1-fire --tier review --format hd --force` | shoulders hold their width near a camera: unchanged at home |
| 24 | `npm run compare -- --sheet page-look --tier review --format hd` on the 20 degree lens | numerals sink into the dark sectors of the turned metal: told surface_mason; cut floor made matte |
| 25 | `npm run still -- --sheet page-look --tier review --format hd --force` | numeral floor 47, metal 84 to 100 in the dark sectors |
| 26 | `npm run compare -- --key step1-fire --tier review --format hd` | ink `0x24272a`, grain 0.16, lighter white print, warmer legends |

| 27 | `npm run still -- --key step1-fire --tier review --format hd --force` | after the ink moved into the material's colour: the picture is the same |
| 28 | `npm run still -- --key step1-fire --tier review --format hd --force` | soft ink for subline and helper, first value: 92 87 80 against 105 100 94, ink 46 45 42 against 56 53 50 |
| 29 | the same | ink `0x302e2b`, soft `0x67625c`: 50 48 45 and 97 91 85; six crops beside the approved image looked at |
| 30 | `npm run still -- --key step1-fire --tier review --format hd --force` | numerals on metal as flat matte print: at 8x beside the approved numeral the lit lower wall is gone and the numeral reads as one dark shape |
Checks that are not tuning looks: `--key tier-corporate` and `--key table-wide` at draft (the signs of the table, flat and standing, are all set by this maker), `--id rest-step1 --diag type`, one draft still in each of the seven beats of step 1, one of each of `--page marketing`, `step2`, `boss`, `decision`.

## What I learned

- The shoulder rings were culled until their winding was turned to face the camera: a ring that does not show is first a winding question.
- The view sets `renderOrder` from the list order on every mesh, so a text run is always drawn after the surface under it.
- The `type` diagnostic paints my meshes opaque black, shoulders included, so a glyph is about 0.6 px heavier there than in the beauty view.

## Measured (2026-11-25, this VM)

- `npm run still -- --key step1-fire --format hd --tier draft`: 3.7 s, 155,896 triangles, 305 draw calls. With the stand-in type: 3.2 s, 84,708 triangles, 303 draw calls.
- `npm run still -- --key step1-fire --format uhd --tier review --force`: 19.6 s, same triangles and draw calls.
- `npm run still -- --id rest-step1 --diag type`: 2.4 s, 47,401 triangles, 137 draw calls, every run inside its box.
- Textures of the part: none, 0 MB.
- `npm run measure -- --unit step1` on main 77d4dc7 with this branch: M4 pass, 103 runs, smallest 18 px, least contrast 4.64. M2 and M3 are red there and are not type: M2 counts pixels of a `map`, which type has none of; M3 is the fine detail of the whole key. `npm run gate -- --phase 3 --only G11`: pass.
- Shimmer: the regions of the title, the subline, the Resume label and the helper line differ by 0 between `--at 0.3` and `--at 0.6` of `step1.firstName` at hd draft.

## Seen and not mine

- On `step1-fire.png` and `page-look.png` the "Browse files" chip is dark graphite with light type. The layout gives a chip of tone `metal` with type of tone `ink`, so I engrave it dark. If the chip is to be dark, its label needs tone `inkLight` in `src/pages/step1/layout.ts`.
