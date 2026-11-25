# Surface: the slab, the shell's controls, the shared materials

Owner: surface_mason. Branch `agent/surface`. Files: `src/shell/materials.ts`, `src/shell/solids.ts`, `src/shell/real/ground.ts`, `src/shell/real/controls.ts`, `tests/surface.test.ts`, `assets-src/surface/RECIPE.md`.

## What the approved images show that a quick look misses

1. Highlight position. No material has a bright spot in the middle of a face. The ceramic has none at all; the aluminium has one band that lies across the brushing; the orange plastic has its light along the upper left edge of the face and a thin bright line on the moulded radius; the glass has only a wide soft sheen that is strongest toward the upper left.
2. Bevel width. The lips are narrow and they are not all the same: the pocket of a field rounds over in about 2 pixels, the aluminium liner inside it is about 2 pixels and sits below that lip, the glass card has a wide shoulder of about 14 pixels inside a metal rim of 3, the button's bezel ring is about 5, and the header rule is a raised bar about 6 tall, not a line.
3. Gap darkness. Where two parts meet there is a dark line, and it is never black: the ring between button and bezel and the groove round a progress button's face are a warm dark grey near (60, 58, 55), darkest in a line one or two pixels wide.
4. Edge behaviour. Every edge that faces the light (upper left) is dark on its inner wall and throws a soft shadow down and right; the edge that faces away (lower right) carries a thin bright line. The field shows it best: dark upper inner wall with a shadow onto the glass, bright lower inner lip.
5. The glass is not see-through and not green. Its body is a cool grey, near (188, 193, 189) in a field and (176, 180, 179) in the card, with no grain to be seen; the dashed line of the upload zone is engraved 22 to 26 pixels in from the rim and is darker than the face, not lighter.

## One more control in each of the four materials

A control is a shape in a page's draw list with `part: 'shell'`. Its `role` picks the build in `src/shell/real/controls.ts`; its `tone` picks the material; its heights are its own `z0` and `z1`. Words come from `content/copy.json` by key.

Ceramic (a new pocket in the slab):
1. In the page's layout add a shape with `pocket: true`, `z0` below 0 and `z1: 0`. The slab cuts the pocket by itself: `cutsOf` in `src/shell/real/ground.ts` reads every shape that carries `pocket`.
2. If the pocket needs room under the part, add its role to `pocketCut` in `src/shell/solids.ts` (the `under` number).
3. `npx vitest run tests/surface.test.ts` (the pocket test walks the draw list of step 1; add the new page's states to `states()` if it is on another page).
4. `npm run still -- --page <page> --format hd --tier draft --diag height` and look: the pocket is darker than the page by its depth.

Frosted glass (a new card or field):
1. Add a shape with `role: 'card'` (stands on the page, `z0: 0`) or `role: 'field'` with `pocket: true` (sunk, top at `z1: 0`, glass at `z0`).
2. For another form, add a function beside `card` in `controls.ts` that sweeps `outlineOf(s, inset)` along a `profile([...])` and uses `materials().glass` (a plate), `materials().glassThick` (a slab that stands on the page) or, for glass in a pocket, the face `sunkGlass(s, inset, depth)` gives with `materials().glassSunk`; then a `case` for its role in `make`.
3. `npm run still -- --page <page> --format hd --tier draft` then `npm run compare -- --sheet page-look --tier draft --format hd`.

Brushed aluminium (a new rail, rule, bezel or turned button):
1. Add a shape with `role: 'rule'`, `'progressRail'` (with `pocket: true`), `'progressButton'` or `'buttonSocket'`.
2. For another form, sweep a profile in `controls.ts` with `materials().aluminium`; mark a profile point `true` where the edge is crisp. A face that is turned on a lathe takes `materials().aluminiumTurned` and coordinates from 0 to 1 across the face (see `progressButton`).
3. The brushing runs along the page's x. A part that must be brushed the other way needs coordinates turned a quarter, not a new material.
4. `npm run still -- --page <page> --format hd --tier draft --diag ids` to see the part is one object, then the beauty still.

Glossy plastic (a new button):
1. Add a shape with `role: 'button'`, `'heroButton'` or `'chip'` and `tone: 'accent'` (orange), `'danger'` (red) or `'metal'` (smoked grey). Seat it in a `role: 'buttonSocket'` shape with `pocket: true` for the bezel and the dark ring.
2. Its label is a `text` shape 0.05 above the button's `z1`; the top of the button is flat at `z1` for that reason.
3. `npm run still -- --page <page> --format hd --tier draft` and `npm run compare -- --sheet page-look --tier review --format hd`.

A new material: add it to `Materials` and `makeMaterials` in `src/shell/materials.ts`, through `physical(...)` so it passes `studio()`; add its name to the list in `tests/surface.test.ts`. Add, never rename.

## Decisions

- The slab is two things. What a page's layout fixes (the pockets) is built once for a key and kept. What moves (the openings: keyboard well, shredder slot) is one mesh whose buffers are refilled in `pose` only when the openings change, so an opening that slides open costs no build and no new geometry object.
- Openings are real geometry with floors and walls, not a cut in a shader: the diagnostic views swap materials and would lose a cut.
- The slab is 28 thick, or 10 more than the deepest opening when that is more. Its underside is closed with an unlit dark sheet so a page turn never shows through.
- Heights are the shape's. The only numbers of mine are how far a pocket goes under its part (`pocketCut`: field 5, rail 1.5, socket 0.6) so the part has a floor to stand on.
- The field's glass has its top exactly at the shape's `z0` (agreed with type_setter, who draws the value on it). The glass throws no shadow.
- The glass is frosted and not see-through: a satin body with a soft coat, no transmission. Nothing on a page ever passes under glass, so real transmission bought nothing to see; it drew the opaque scene twice (MEASURED: `npm run still -- --id rest-step1 --format hd --tier draft` took 7.3 s and 122 draw calls with it, 4.5 s and 84 without) and it hid every shadow that fell on the glass, which is what made the fields read flat.
- A field's glass (`glassSunk`) carries the shadow its pocket throws into its body as vertex colour. The key's own shadow at a depth of 6 is hard and under 10 pixels wide; the approved field shows a dark band that holds for about 8 pixels and then fades over about 14. MEASURED down one column of a field at review tier, approved against this build: 111 to 116 held then up to 187, against 126 held then up to 183. In frosted glass the wall shadows the body of the glass under a point as well as its face, so the band is wider and softer than a shadow on a hard floor. `sunkGlass` in `controls.ts` works that share out for each vertex from `look.key.direction` and the pocket's depth, and adds the little light the lit wall on the far side gives back. If the key moves, the band moves with it at the next build.
- Cards carry the colour of a second glass, `glassThick`: the approved card is darker than a field's glass, (156, 161, 159) at its middle against (188, 193, 189). MEASURED in this build at review tier (`npm run compare -- --sheet page-look --tier review --format hd`, then the mean of a patch): card middle (157, 162, 160), field (179, 184, 179).
- A glass card is one swept solid drawn with `glassSunk` and vertex colour (`washed` in `controls.ts`). The approved card is brighter toward the light across its whole face, its shoulder on the light's side is darker than the face and its shoulder on the far side is brighter: frosted glass shades itself at the edge the light enters and lets the light out at the far edge. A hard chamfer lit by its normal gave the opposite and read as plastic.
- The rim of a field's pocket: the ceramic rounds over in 2.2 pixels (`pocketCut.lip`) and the aluminium liner starts below that lip, so the approved order is kept: page, soft ceramic edge, dark metal line, glass.
- `aluminiumTurned` is a second aluminium for lathe-turned faces: its highlight is stretched along rings from a direction picture. The stock stretch of this three.js release bends the mirror only for a face seen from the side, so a face seen from above showed no fan of light; `stretched` in `materials.ts` reads the room nine times along the ring's direction instead. It costs nine reads of the room for each pixel of those five small faces only.
- `aluminiumEdge` is aluminium with no brushing picture, for rims 3 pixels wide where the picture only gave a ragged line.
- `aluminiumSatin` is the liner of a field's pocket: a darker satin aluminium, part matt. MEASURED across the approved field's left rim at review tier: 146, 73, 67, 114, 131, 75, 72 (page, dark line, rim, dark line, glass); this build with the satin: 144, 63, 58, 101, 80, 56. A bright mirror rim read 180 there and the field looked outlined in white.
- The rim of a field is 3.2 pixels wide with a round top. At 4.4 it matched the approved rim in a close view, but the lip's shadow covers the whole rim on the light's side, so at page size the top of every field became a heavy dark line.
- A turned progress button is two meshes: a flange in `aluminiumEdge` (a chamfer 5.6 wide, a groove, a step up) and the turned face in `aluminiumTurned`. The approved button has a wide bright flange round a darker face; one crowned disc had no flange to catch the light.
- The current progress button is a moulded cap on a rounded foot 6 wide with a shoulder of 13, with no groove between them: a groove gave a hard dark crescent on the far side that the approved button does not have.
- The card's shoulder is shaded by vertex colour far more than its form shades it (`EDGE` 1.15 toward the light, 0.65 of that away from it, the shoulder itself rises only 0.8): MEASURED from the frame inward on the light's side, approved 120, 90, 96, 98, 111, 123, 132, 141, 153; this build 137, 135, 139, 139, 146, 154, 159, 165, 169. The coat's reflection is not moved by vertex colour, which is why the number looks large for what it does.
- The header rule is drawn at the size of its shape. The shape was 2 pixels tall and the approved bar is about 6, so the size is asked for in `pipeline/phase3/surface-NEEDS.patch` and not drawn larger by this file.
- The grain is laid at two texels a page pixel and glass carries the same picture as a faint frost (see `assets-src/surface/RECIPE.md`): the measure for soft textures counts what is drawn larger than it is, and at one texel a pixel the grain was soft in the master.
- The grain's relief follows how near the camera is, worked out in the shader from the projection and the depth of the pixel (1 at home), never from a clock or a camera's name. At home nothing changes. Nearer, the relief falls and a tooth a pixel or two wide takes its place, so a close view shows eggshell and not plaster. MEASURED on `npm run compare -- --sheet cursor-acting --tier review --format hd`, spread of grey after taking off a 2 pixel blur: approved 4.44 and 4.37, this build 4.52 and 4.64. The tooth cannot go lower at the tug key's distance: MEASURED with `npm run measure -- --unit step1`, M3 is 0.8817 with it (limit 0.8) and 0.6333 with the relief only.
- The slab's flat mesh keeps one bounding sphere for the whole page whatever its openings are, so the order things are drawn in cannot change when a film frame carves more openings (found by light_keeper).
- Nothing is painted into the ground to lighten or darken it; the fall of light across the page is the light's (agreed with light_keeper).
- The focus ring reads the shape's `v[0]` (the director's glow number, 0 to 1): its spill is 0.8 at rest and 1.3 on the frame a character lands.
- `material.envMapIntensity` does nothing in this three.js release when the scene has an environment (MEASURED by type_setter). Reflection strength is set with `specularIntensity`, and for the orange with a warm `specularColor`, which is what took the pink out of it.
- The focus ring of a field is unlit additive geometry on the liner's rim, not a light: it must look the same in every tier.
- A shell shape with a role this file does not know still gets a real plate in its tone's material, so no page falls back to a stand-in because of a new role.
- Words of the shell (`header-title`) are the type setter's: `controls.key` gives null for text, the view passes it to the type maker.

## What I learned

- A change of the light changes every painted share. The soak in the field glass was tuned for a key at 0.69 height; when the key dropped to 0.45 the same numbers gave a band twice as deep. Whatever is laid in by hand must be worked out from `look.key.direction`, and looked at again after every merge of the light.
- Measure a column of pixels through the approved crop before tuning by eye. The field's band, the card's dark and bright shoulders and the bow-tie of the turned face were all found in numbers first.
- Leather and eggshell differ in one thing: leather has ridges that join, eggshell has pits that do not. A band of noise gives ridges; keeping only its low places gives pits.

- A montage scaled down lies about tone. The card looked flat and the rail looked too light beside the approved image; a grid of means and a column of pixels said the card already ran 198 to 150 against 195 to 165 and the rail was lighter than the approved one. Numbers first, then the eye at native size.
- Vertex colour only moves the matt share of a coated material. In shadow the coat's reflection is most of what is left, so a painted share has almost no effect there (MEASURED: 2.5 times the colour under a field's lip moved the pixel from 56 to 64).
- At a low key a tilt of 13 degrees changes the matt light by almost half. A soft shoulder that looks harmless in a section drawing is the strongest thing on the page under a raking light.
- Magnified grain is not grain seen closer. A real surface shows finer detail as the camera nears; a picture only gets bigger. Taking the picture's own blurred copy from it in the shader gives the fine part alone, with no second picture.
- White noise blurred is not grain: it keeps its slow lumps, and at half size the page looks like plaster. The grain is the difference of two blurs, so only the 2 to 4 pixel band is left.
- Grain strength must be judged at native size beside the crop. At half size every grain looks right.
- The same normal picture looks three times stronger when its features get finer, because slope is height over width. Change one, retune the other.
- A flat glossy face that looks straight up shows the picture of whatever is overhead. With a bright overhead that adds white to every channel and orange turns pink; tinting the reflection is cleaner than weakening it.
- In a view from straight above a vertical wall has no pixels. The liner of a field leans so its inner wall is seen and can carry the dark upper edge and the bright lower lip.
