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
- After the critics' third round (16:02Z): the grain at home is quieter (pits `PIT_DEPTH` 1 where they were 1.6, the ceramic's `normalScale` 0.075 where it was 0.085). The card is drawn with `glassCard`: lighter (`glassThick` is 0xa8b0af) and carrying the page's own grain picture at 0.03, so the page's tooth is faintly in the slab. The field's liner takes no shadow, so its rim is a lit silver line all round (MEASURED across the left rim: 183, 180 where it was 101, 80; approved 114, 131), and the soak in the field glass is 0.5 deep where it was 0.62. A chip stands on a dark seat 1.1 wider than itself (`SEAM`), which reads as a clearance seam.
- Not reached, for whoever takes this on. (1) The card is still opaque: no transmitted detail, no refracted band at its edge, no inset inner panel inside the dashed line, and its shadow is the light's. A way in: two more rings in `card` at 25.5 and 26.5 from the edge with a step in the vertex colour of `washed`. (2) The chip has no real socket; the seat is a flat dark sheet at 0.12, not a pocket at `scale.heights.buttonSocket`, because the chip's shape carries no `pocket` and its layout is the step's. (3) The top inner wall of a field is still a dark line 4 to 5 pixels deep (MEASURED 51 to 65 against the approved 82 to 97): it is the lip's shadow on the liner's leaning wall and on the glass. (4) The orange is glossier and a little redder than the approved satin; the turned faces are glossier than the approved brushed satin. Raise `roughness` on `orange` and `aluminiumTurned` and look. (5) Page tone, MEASURED in `references/approved/step1-fire.png` against `npm run still -- --key step1-fire --format hd --tier draft` (before this round): patch (700,150,900,190) approved (208, 204, 198), build (216, 213, 206); patch (1000,960,1500,1040) approved (193, 184, 170), build (178, 172, 161). The approved page-look patch at the upper left is (216, 213, 207) against (216, 212, 205). So the ceramic's colour matches the page look and is a step lighter than the fire key at the top, and the build falls off more toward the lower right than the fire key does: that is the light's fall, not the ceramic's colour. Not changed.
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

## Fix round

Owner of this round: glass (`surface_fixer`), branch `agent/glass`, 2026-11-25. Files changed: `src/shell/materials.ts`, `src/shell/real/controls.ts`, `assets-src/surface/RECIPE.md`, this file.

### What the approved images show that a quick look misses (my five lines, MEASURED with columns of pixels through `references/approved/step1-tug.png` and `page-look.png`)

1. Highlight position. The card has no highlight on its face. Its brightest pixels are a line one pixel wide on the lower and right edges (239 where the face is 185), just inside the dark rim; the upper and left edges carry no such line.
2. Bevel width. From the outer edge of the card: a dark warm rim 2 to 3 px, a shoulder that ramps over about 14 px, then the engraved dashes at 22 to 26 px. Inside the dashes the face is a separate panel.
3. Gap darkness. The rim on the light's side is near (114, 105, 95) and never under 72; the rim away from the light is near (108, 104, 99). Nothing on the card is as dark as the 50 to 60 the build had in its field rims.
4. Edge behaviour. The shoulder toward the light is the darkest part of the glass (72 to 77) and the panel under it stays dark for another 15 px (102 to 144) before it recovers to the face (189): the slab shades itself there. The shoulder away from the light is lighter than the face (197 to 217).
5. Shadow. The card's shadow on the page is gone in about 8 px and has no hard core: far shorter than a 12 px slab would throw under this key (29 px). A field's upper inner shadow ramps over 16 px from 110 to 175 and never goes under 92.

### What was built

- The card (`card()` in `controls.ts`, `slabbed()` in `materials.ts`). The geometry is a low aluminium band (`aluminiumRim`, 3.4 high, 2.7 wide, with a chamfer out and a flat top), a slab with a wall, a tight round of 1.8 and a ground bevel that rises `min(h * 0.3, 3.6)` over 12.5 px, and, for an upload zone, a flat band up to 27.5 px from the edge and a panel sunk 0.5 inside the dashed line (the panel is at the card's height exactly, so the type and the chip stand where the layout says). Each vertex carries where it lies on the card (`slab`, `slabEdge`); the material works out the rest for every pixel, so it holds at any distance and costs no triangles.
- In the material: the shoulder toward the light is shaded to 0.5 and the one away from it lifted by 0.16; the panel is shaded where the light enters (a soft dip of 0.4 that follows the two edges on the light's side); the page's grain is read under the slab and shifted by the slope of the face (`bend` 26 px), so it bends in a narrow band at the bevel and is stronger where the glass is thin; a slow cloud moves the colour by 3 percent; the frost is two fine readings of the grain's slopes with hairline marks from the brushed picture laid 20 degrees off the page's axes; sparse bright points come from the difference of two readings of the height; a wide sheen is added to the reflected light across the face, falling toward the light's side, 0.6 of it tied to the shadow so that it is not the shadow's own shape.
- The shade of the form is laid on the finished light (`outgoingLight`), not on the matt colour. On the matt colour it moved the shoulder only from 169 to 137 (MEASURED in `page-look`), because the coat's reflection is not touched by it.
- The glass throws no shadow of its own; only the band does. MEASURED in `page-look` at hd, row 500 across the right edge: the shadow is 6 px wide (60, 95, 98, 100, 98, 140, then page), where it was 14.
- The ground. Pits 0.16 (was 0.45), coarse swell 0.07 (was 0.2), strength 0.04 (was 0.046), colour 0xf0f0ed (was 0xebebe7); up close the fine readings carry more (`CLOSE_TOOTH` 2.85, was 1.7). Nothing is painted in to light or darken the page.
- Fields. `RIM` 2.6 (was 3.2), the liner is lighter and less of a mirror (`aluminiumSatin` 0xc9ccce, metalness 0.35), the soak is 0.3 deep over 7 px (was 0.5 over 4.5), the glint 0.14.
- Browse files. The cap stands in a seat: a satin collar 2.4 wide and 2.2 high let into the glass, a dark clearance of 1.1 inside it, the cap rising from that. The collar throws the tight shadow, the cap the longer soft one.
- Orange: 0xb94503, roughness 0.57, coat 0.14 at roughness 0.36 (was 0xc24400, 0.5, 0.3 at 0.09). One material, so the Enter key, the active step and the action button all moved. Steel face of the other steps: 0x9da1a6 at roughness 0.3 (was 0x8e9399 at 0.2).
- For keys_fixer (asked by message, critic R4-2 #4): the focus ring's spill goes 0.8 to 2.4 with `v[0]` (was 0.8 to 1.3) and the core line lifts by 0.7 of itself. At `v[0]` = 0 nothing changes.

### Numbers (MEASURED)

- M3, `npm run measure -- --unit step1 --tier review`: 0.8853 on `step1-tug` where 0.8 is the least (it was 0.68 on main, STATED in the brief). `step1-fire` is green in the same run; 1.26 was read from its review still before the last changes of the ground and the orange (`node out/work/hf.mjs`, the tool's own function), not again after.
- On the way: the first card alone gave 0.85 at draft and 0.56 at review, because review averages 8 samples a pixel and detail under a pixel wide is lost. What carries the number is detail 2 px wide: the frost read at 3.0 texels a page pixel (glass region 0.0034 to 0.0054) and the ground's tooth up close (0.0040 to 0.0106). The glass alone does not carry it: both are needed. (Not measured apart; from the regions' shares the frame would stand near 0.75 with the ground left as it was. That is an estimate.)
- The same run: M1, M2, M3, M4, M5, M6, M7, M9 green. M4 turned red once (type on the orange 4.31 where 4.5 is the least) with a lighter orange, 0xc64c08; with 0xb94503 it is 4.67.
- `npm run still -- --key step1-tug --format hd --tier draft`: before 618027 triangles, 295 draw calls, 11.7 s; after 599811 triangles, 286 draw calls, 11.2 s. Review: 23.7 s.
- Textures: none added. The card reads the grain (1024 px, 4.00 MB) and the brushed picture (512 px, 1.00 MB) that were already there. Total still 5.50 MB.

### Decisions

- The card is opaque geometry that paints what glass would show. Real transmission was measured by the last owner at 7.3 s and 122 draw calls against 4.5 s and 84, and it hides the shadows that fall on the glass.
- The approved `step1-tug.png` is the whole page and the build's key frame is three times closer, so M3 on that key compares a close view with a far one. The number is reached with a fine tooth on paper and glass, never with pores: both were looked at in the review still at native size.
- Tuning looks used on the card: 13 of 40.
- `npm run counts -- --key step1-tug --live low` after: 75 draw calls (limit 300), 162313 triangles. Before: not yet run on main.

### Still least real

1. The frost up close is a little too even and sparkles more than etched glass does.
2. The page's grain seen through the slab does not move against the face when the camera moves: it is a reading shifted by the slope, not a second layer at depth.
3. The Browse cap is still darker and glossier at its rim than the approved pill, and its shadow is longer.
