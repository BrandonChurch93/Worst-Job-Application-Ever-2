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
| page (ceramic) | ink | sunk | charcoal, a hair of lit ceramic at the lower right |
| cap (keycap, light button) | ink | sunk | the same, edge in cap colour, shallower |
| glass (field value, glass tone) | ink | flat | charcoal with a soft edge, drawn after the glass |
| paper | ink | flat | charcoal with a soft edge |
| metal (aluminium) | ink | cut | dark floor, shadowed wall upper left, lit wall lower right |
| accent, danger, dark | ink | flat | charcoal with a soft edge |
| accent, danger, dark, metal | inkLight | raised | warm off-white, a faint darker edge at the lower right |
| anything else | inkLight | raised | the same, a little lower |

## Decisions

- Geometry, not SDF. Sharp at 1920 and 3840 with the capture's accumulation and the live MSAA, no texture memory, and the edge can carry real normals so the lit side comes from the light and not from paint.
- Ink is sRGB 24 25 27 (`0x18191b`) with `specularIntensity` 0.15 and roughness 0.62. MEASURED: the title core renders 36 36 36 at `--format uhd --tier review`; the approved core is 32 to 42. Never pure black.
- `material.envMapIntensity` does nothing in three 0.187 when the reflection comes from `scene.environment` (`node_modules/three/src/renderers/WebGLRenderer.js` near line 2749). MEASURED: black ink rendered 70 at 0.3 and at 0.08, and 28 with `specularIntensity` 0.2. I use `specularIntensity`. Told the Builder, surface_mason, light_keeper and keyboard_smith.
- Type lies `HOVER` 0.05 above the `z1` of its shape, with polygon offset, receives shadow, casts none. It is an alpha-blended layer drawn in the opaque pass with depth write, so it is in the picture a transmissive part refracts. A run on glass is drawn after the glass, without depth write.
- No part of a frame reads a clock or a random number. The maker reads only the shape and `ctx`.
- Legends of keys (`key-<name>-legend`) are mine. Agreed with keyboard_smith: the floor of the dish is flat and exactly at the key's `z1`, 15 px in from the cap's edge, 64 by 26 px on a 1u cap. A flat legend 0.05 above `z1` lies on it. If a legend ever gets wider than cap width minus 30 or taller than 26 px I tell keyboard_smith. A flying cap tumbles a few degrees in the shuffle and the legend stays level: not visible from straight on.
- Asked of surface_mason, no answer yet: the top of the glass in a field pocket exactly at `scale.heights.field`, and the top of a progress button flat at its `z1` under the numeral. Edge colours of sunk and cut type come from `materials().ceramic.color` and `materials().aluminium.color`, so they follow the surface when it changes.

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

## What I learned

- The shoulder rings were culled until their winding was turned to face the camera: a ring that does not show is first a winding question.
- The view sets `renderOrder` from the list order on every mesh, so a text run is always drawn after the surface under it.
- The `type` diagnostic paints my meshes opaque black, shoulders included, so a glyph is about 0.6 px heavier there than in the beauty view.
