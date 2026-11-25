# Cursor model: body and effects

Parts `cursor-body` and `cursor-effects`. Branch `agent/cursor-model`. Owner of `src/cursor/model/`, `src/cursor/contract.ts`, `tests/cursor-model*.test.ts`, `assets-src/cursor-model/`.

## What I see in the approved images

1. Highlight: one thin bright streak just inside the upper left edge of the enamel, where the shoulder turns toward the lamp, and a wide dim picture of the light across the upper part of the face. The lower right shoulder carries a grey shade. The face between them is nearly flat and plain white.
2. Bevel: the enamel is a pillow. Its shoulder is about 0.6 to 0.7 of an outline unit wide (about 2.5 px at 70 px high) and the rest is a low dome. The corners are a little rounded, the tip nearly sharp.
3. Gap: between the black band and the enamel there is a tiny dark groove. It reads as a hairline, darker than the band, not as a space.
4. Edge: a separate glossy black band, about 4% of the body's width, standing a little lower than the enamel, with its own thin highlight on the upper left. The underside is flat and black. The shadow is tight and dark at the lower right contact and soft further out.
5. States: angry is a deep red tip, orange in the middle and a yellow fade into white, the black band unchanged, a steam wisp above. Scared is one pale stone material with no black edge. Exhausted is wavy, melted and glossy with no edge to see. A burn is a ragged charred ring with ember glow and the page seen through it. Flattened is lumpy with fine hairline cracks. Shredded is thin strips, white on top and black on the sides, lying along the tail.

## How it is built

- `shape.ts`: the outline with rounded corners as rings of 122 points, the band's section, the enamel's shoulder and dome, an own Delaunay net for the face. One closed solid: 2075 points, 4116 triangles.
- `deform.ts`: every bend of the body, on the processor, in this order: gulp, puff, flat, melt, stretch, bend, peel, tremble. Normals are worked out again after it.
- `material.ts`: one material for enamel and edge (a number on each point says which), built on the shared `studio()` rule and the shared colours of `materials().enamel` and `.edge`. The shader holds crazing, seams, pale stone, char, heat, melt, and up to 4 holes.
- `strips.ts`: the solid clipped into strips across the tail's axis, with black cut faces.
- `body.ts`: the model. `apply` does nothing when the look is the one it has.
- `effects.ts`: two instanced meshes. Sweat is flattened half balls of water. Steam, smoke and dust are soft balls with a lit round form, eaten into by cloud from the detail texture. No flat cards.
- `texture.ts`: the one texture. See `assets-src/cursor-model/RECIPE.md`.

## Decisions

1. One material for enamel and edge, with a number on each point for which it is. Two materials would be two draw calls for each cursor and a seam in the highlight.
2. The body is deformed on the processor and its normals worked out again, 4116 triangles for each cursor, only when the look changes. The shader stays the shared one and the shadow is right for free.
3. Holes are cut in the shader, by throwing away the points inside, with a charred wall mesh inside each one. The shadow material throws away the same points, so light falls through a hole onto the page. At most 4 holes at once.
4. Strips are cut parallel to the tail, `STRIP_AXIS`, not along the page's y: cut along y, a strip through the notch would be two pieces.
5. One 512 px detail texture for the body and the effects.
6. `anchor` gives the point at half the body's thickness, so an arm leaves the side of the body and not its top or the page.
7. `emit` gives lights in the root's own space. The view turns them to the page.
8. The body is 2.3 outline units thick (8.5 px, 12% of its height). The rounded corners cost 0.3 units of height: the body is 18.7 units from tip to tail's end where the outline is 19.
9. Steam, smoke and dust are balls and not cards: each has a round lit form, lies over what is under it without cutting into it, and holds up when the camera tilts.
10. Sweat adds its highlight in full and darkens what is under it by its own alpha (custom blending: one, one minus source alpha), so a bead has a bright glint and a thin dark edge without a render of what is behind it.
11. Heat stays under the tone curve's knee. Brighter than that, the curve washes red to salmon. The deep red of the approved image is a dark saturated red, so the tip gives off less than the orange behind it.
12. Effects that are not asked for are not drawn: both meshes are hidden at rest.

## One more kind of damage: the model's side

1. `src/cursor/contract.ts`: add one number (or one small record) to `BodyLook`, with a comment that says what 0 and 1 are, and its rest value in `restLook`. Commit it alone, subject starting `CONTRACT:`, and tell the owner of `src/cursor/act/` in the same minute. Add, never rename.
2. `src/cursor/model/body.ts`: add the rest value to the look in the constructor, and read the number in `apply`. `apply` already skips a look it has, since the key is the whole look.
3. If the damage changes the shape: `src/cursor/model/deform.ts`, a field, its clamp in `set`, and its step in `point`, placed in the order of the list above (what presses the body comes before stretch, what curls it comes after).
4. If it changes the surface: `src/cursor/model/material.ts`, a place for the number in `uState` or `uMarks` (or a new uniform in `bodyUniforms`), set in `apply`, and one block in `wjaSurface` that changes `col`, `wjaRough`, `wjaCoat`, `wjaTilt` or `wjaGlow`. If it removes material, do the same in `bodyDepthMaterial`, so the shadow agrees.
5. If it gives off light: add an emitter in `emit` in `body.ts`.
6. If it needs a new detail: use a channel of the detail texture at a new scale. Add a texture only if no channel can do it, and then write its recipe.
7. `pipeline/phase3/cursor-model-sets.ts`: add cells at 0, 0.5 and 1 and one mixed with another state. Render with `node pipeline/phase3/cursor-model-sweep.mjs --set <name>` and look.
8. `tests/cursor-model.test.ts`: add the look to `LOOKS`, so "same look, same geometry" covers it.
9. `npm test`, `npm run build`, `npm run bots`, then the sheet: `npm run compare -- --sheet cursor-damage --tier review`.

## The sweep

`node pipeline/phase3/cursor-model-sweep.mjs --set rest|body|surface|damage|effects|fix [--samples 8] [--cols n] [--pitch px] [--time s] [--tag name]` draws every number of `BodyLook` and `EffectsLook` at 0, 0.5 and 1 and mixed, on the site's own renderer, light and ground, outside the site. Pictures land in `out/work/cursor-model/`.

## Light: proposal

`BodyModel.emit(out)` is in the contract. The body adds one emitter for a hot tip (orange red, power 0.9 times heat, reach 14 to 30 units) and one for each hole that still glows (orange, power 0.7 times glow squared, reach 6 to 17 units), in the root's own space. The view calls it after `body.apply`, turns each by the body's turn, moves it to the page (page x = world x + 960, page y = 540 - world y) and passes it to `ctx.light`. The call in `src/cursor/view.ts` belongs to the owner of that file.
