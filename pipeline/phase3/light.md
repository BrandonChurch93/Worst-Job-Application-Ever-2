# Light, shadows and the post chain: notes of the look lock

Part: `light-engine`. Branch `agent/light`. Files: `src/core/renderer.ts`, `src/core/sampler.ts`, `src/post/look.ts`, `src/post/post.ts`, `src/post/studio.ts`, `src/post/emitters.ts`, `tests/light-emitters.test.ts`, `tests/light-sampler.test.ts`, `tests/sampler.test.ts`, `assets-src/light/RECIPE.md`.

A fact below is MEASURED (the command and the number are given), STATED (read somewhere) or UNKNOWN.

## What the approved images show that a quick look misses

1. The ceramic is not one grey. MEASURED with `node out/work/light/measure.mjs references/approved/page-look.png <patch>`: 233.8 at the upper left corner, 222.3 in the middle, 217.2 at the lower left, 199.6 at the upper right, 197.5 at the lower right (sRGB luminance, 0 to 255). The fall is mostly from left to right, so the light stands near the left edge and not far away.
2. No shadow is black and none is blue, but the contact is much darker than the rest of the shadow: the darkest values right against a part are 13 to 50, and a few pixels out the same shadow is 110 to 130 and warm (red above blue by 6 to 10).
3. A shadow is about one and a half times as long as its part is tall, and its far end is several times softer than its near end. The rule under the header has a shadow that is one tight dark line.
4. Nothing glossy has a bright dot. The orange enamel has one broad soft band on its upper left shoulder and a thin light line on its upper left lip, and it is darker at the lower right. Pockets are the other way round: dark along the upper left wall, light along the lower right one.
5. Only what gives off light glows: the bolts have a white core, an orange halo two to three times the core's width, and they put warm light on the edges of the caps beside them and on the brushed deck. The ceramic itself never blooms, not even at 234.

## What is built

| Piece | Where | How |
| --- | --- | --- |
| Key and its shadow | `LightRig` in `src/core/renderer.ts`, the filter in `src/post/studio.ts` | One directional light. Each sample stands at its own point of the light's area and blurs its shadow by the piece of the area it stands for (`areaSplit`), with a blocker search first, so the blur is zero at the contact and grows with the distance to what throws the shadow. |
| Falloff across the page | `studio()` in `src/post/studio.ts` | The key's strength at a surface point is `(d0² / d²)^1.5`, with `d` the distance from that point to `look.key.at`. It is computed from the position in the world, in the light, before the surface answers: it is light, not paint. A shadowed point still gets no key. |
| Fill | `LightRig` | One directional light a sample, at a direction of the dome above the page, more of them near the top. Its strength is divided by the height of its direction, so a flat page gets exactly `look.dome.intensity` from the fill in a picture of any number of samples. It has its own shadow map and the same filter: that is the dark line at a contact. |
| Emitters | `src/post/emitters.ts`, `LightRig.light` | A pool of 6 point lamps that always exists; 2 of them throw shadows. An unused lamp has strength 0 and its shadow map is not redrawn. More emitters than lamps are joined, the nearest and weakest first. The number of lights the shaders are compiled for never changes. |
| Glow | `Glow` in `src/post/post.ts` | What is brighter than `look.glow.threshold` after exposure is halved 6 times at `hd` and added back before the tone curve. The number of halvings follows the picture's height, so the glow is the same share of the picture at every format. |
| Only emitters glow | `studio()` | The light a surface sends back (everything but its own emission) is pressed softly under `look.glow.surfaceMax`, which is below where the glow starts. A surface can be lit as hard as an emitter likes and still not bloom. |
| Tone curve, grade, grain, dither | `Post` in `src/post/post.ts` | Exposure, then a curve that is straight up to `look.knee` and has a soft shoulder above it, saturation, grain seeded by the frame, dither before eight bits. |
| Studio | `studioEnvironment` | See `assets-src/light/RECIPE.md`. |
| Hollow shadows | `LightRig.close` | Every solid material that throws a shadow has both its sides drawn into the shadow maps, so an open shell or a sheet with pockets throws the shadow of what the light sees first. Glass and see-through materials keep the renderer's rule. |
| Doubled cursor shadow | the filter | A picture of 2 samples used to show the cursor's shadow twice, once for each place of the light. Now each sample is soft on its own and the two overlap. |

## Every setting and why

`src/post/look.ts`:

| Setting | Value | Why |
| --- | --- | --- |
| `key.direction` | -0.65, 0.6, 0.45 | Shadows fall down and to the right and reach twice the height of the part; the soft far end fades, so what is seen is about one and a half times. At the first value (0.69 up) a 6 px pocket and a low button had almost no shadow. |
| `key.radius` | 0.13 rad | Half the angle of the light's area. The far end of a 40 px part's shadow is about 20 px soft, the contact is sharp. At 0.2 the shadow of a part 5 px tall was all soft edge and no dark middle. |
| `key.intensity` | 4.55 | With the fill, puts the ceramic of the surface owner (`0xecebe6`) where the approved page look has it. See the table of measurements. |
| `key.colour` | 1, 0.975, 0.945 | The approved ceramic is 6 warmer in red than in blue at the upper left; at 0.92 blue it was 10. |
| `key.at` | -1200, 1000, 3750 px from the middle of the view | Fitted to the five patches of the approved page look by least squares (`out/work/light/fit.mjs`, not in the repository). |
| `key.shadowMapPx` | 4096 | One texel is 0.45 px of the page at `hd` (see "Shadow texel"). |
| `key.biasPx`, `key.normalBiasPx` | 0.1, 0.2 px | Small, because the filter follows the slope of the surface it is on. Larger values lifted the shadow off the contact. |
| `dome.intensity` | 0.34 | The fill a flat page gets. Lower than the first fit (0.46) so a shadow is clearly darker than its page; higher than 0.25, where the shadow under the keyboard went near black. |
| `dome.colour` | 1, 0.975, 0.945 | Warm. The fill was bluish before, which made every shadow blue grey; the approved shadows are warm grey. |
| `dome.shadowMapPx` | 2048 | The fill's shadows are wide; a texel of 1 px is enough. |
| `emitters.pool`, `emitters.shadows` | 6, 2 | What the keyboard owner sends in the busiest frame of the key: six lights, two with shadows. |
| `emitters.shadowMapPx` | 512 | A face of a lamp's shadow cube. A lamp's reach is 140 to 380 px, so a texel is about 1 px near the lamp. |
| `emitters.sizePx` | 5 | How far a lamp moves between samples, which softens its shadow. |
| `studio.direction` | -0.52, 0.5, 0.69 | Where the soft light stands in the reflection. Kept higher than the key: at the key's angle flat metal went dark. |
| `studio.shadeKey`, `studio.shadeFill` | 0.7, 0.6 | How much of the studio's reflection a surface loses where the key does not reach it (in its shadow, or turned away from it) and where the fill does not. This made the upper left wall of a field pocket dark and took the contact of the first stepper from 20 to 11 (approved 13). |
| `envDiffuse` | 0.05 | The share of the studio that reaches a surface with no shadow in it. Low, so the contact can be dark. |
| `keySpecular` | 0 | The key gives no highlight of its own. Highlights come from the studio, so there is no bright dot. |
| `exposure`, `knee` | 1, 0.74 | The ceramic's upper left sits just on the shoulder (linear 0.83 goes to 0.82), nothing on the page clips. |
| `saturation` | 1 | The grade is in the light's colour; nothing is added after. |
| `grain` | 0.011 | About 1 level of 255 on the ceramic. The approved ceramic's speckle (5 to 8 levels) is the surface owner's eggshell, not film grain. |
| `glow.threshold`, `glow.knee` | 1.5, 0.2 | Glow starts at linear 1.3 after exposure. |
| `glow.surfaceKnee`, `glow.surfaceMax` | 0.95, 1.25 | No lit surface is brighter than 1.25, which is under 1.3. `tests/light-sampler.test.ts` holds that. |
| `glow.strength`, `glow.rings` | 0.8; 1, 1, 0.8, 0.45, 0.15, 0.05 | Most of the glow is in the first three rings (about 4, 8 and 16 px at `hd`), which is the halo of two to three core widths of the approved bolts; the last rings are the faint wide veil. |

`src/post/studio.ts`:

| Setting | Value | Why |
| --- | --- | --- |
| `shadowFilter.blurTaps` | 16 | The most taps one sample takes: a picture of one sample, and a live frame while something moves. |
| `shadowFilter.tapsPerPicture`, `minTaps` | 64, 8 | A picture spends about 64 taps a light in all: draft 16 a sample, review and final 8. The taps of the samples of one picture are turned against each other, so they make one even disk between them. |
| `shadowFilter.searchDepth`, `searchMax` | 0.07, 40 texels | How far the blocker search looks. |
| `shadowFilter.blurMin`, `blurMax` | 1.1, 44 texels | No shadow edge is sharper than one texel, so a texel never shows; the widest blur a sample makes. |
| `shadowFilter.slopeMax` | 40 | The steepest surface the filter follows before it gives up and uses the plain bias. |
| `EMITTER_BODY_PX` | 20 | An emitter is a small body, not a point: its light at distance d is `1 / (d² + 20²)`. At 12 a bolt 6 px over a cap burned it white. |

## Units for whoever sends a light

`ctx.light({ x, y, z, colour, power, reach, shadow })`. Agreed with the keyboard owner: power 1 means a white matte surface 100 px away, facing the light, sends back about `colour` in linear light. The light is zero at `reach`. Up to 6 are true lights in a frame and 2 of those throw shadows (the strongest that ask for one); more are joined, never dropped. A thing that should glow needs an emissive colour above 1.3 in linear light after exposure; anything that only reflects cannot glow.

One call sets what is drawn: `rig.setLevel(level)`, with `'high'`, `'medium'`, `'low'` or `null`. `null` is a computed picture with everything on (`look.key.shadowMapPx`, `look.dome.shadowMapPx`, 6 lamps, 2 with shadows). A level takes `live.quality.<level>.shadowMapPx` for the key and half of it for the fill. `setQuality(keyPx, domePx)` still works and does the same from two sizes. The depth offsets of a shadow map grow with its texel, so a coarse map has no speckle and the page is as bright at low as at high.

MEASURED, `npm run still -- --key step1-fire --format hd --live <level> --force` with `rig.setLevel(spec.live ?? null)` put in the still path for the measurement only:

| level | draws | draw calls | triangles | limit | ceramic upper left, sRGB luminance |
|---|---|---|---|---|---|
| high | key and fill shadows, 6 lamps, 2 lamp shadows | 482 | 748260 | 600 | 229.5 |
| medium | key and fill shadows, 4 lamps, 1 lamp shadow | 356 | 510996 | 450 | 229.4 |
| low | the key's shadow pass alone, 2 lamps | 196 | 223622 | 300 | 229.4 |
| null (draft) | everything | 482 | 748260 | | |

The live site: `live.quality` high gets 6 lamps and 2 with shadows and the fill's shadows; medium gets 4 lamps and 1 with shadows; low gets 2 lamps, none with shadows, and no fill shadows (its shadow map would be 512 px). `rig.level` scales the key and the fill together and nothing else: the emitters keep their strength, so on the dimmed pinball page the table's lamps carry the picture.

## Techniques

Worked:

- A blocker search and a filter for every sample, with the light's area split between moving the light and blurring. Two samples already give one soft shadow.
- One tap always at the surface point itself in the blocker search. Without it a thin shadow was missed by all taps in some pixels and was full of light specks.
- Shadow lookups that follow the slope of the surface they are on (from the screen derivatives of the shadow coordinate). This ended the hatch pattern the low fill directions drew on the flat page, and let the bias be a tenth of a pixel.
- Dividing each fill direction's strength by its height: the page is as bright in a draft as in a final, and a live frame does not change brightness when it comes to rest.
- Keeping a draft's fill directions near the top. Two low directions drew two long streaks from every tall part.
- A cap on reflected light under the glow's threshold. Before it, a cap lit by a bolt bloomed like the bolt.
- The glow's size counted from the picture's height.
- Dimming the studio's reflection by the shadows of the key and the fill. A glossy pocket floor is lit mostly by reflection, so a shadow of the lamps alone hardly showed on it; with this the pocket wall hides the soft light as well.

Did not work:

- Moving the light between samples with a hard shadow for each (what the build did before): at 2 samples the cursor has two shadows, at 8 a shadow is a staircase.
- Giving each sample every eighth tap of one big disk: one sample's taps then lie along one arm of the spiral, and since each sample also has its own light position the errors do not cancel. It was noisier than fewer, well spread taps.
- The key at 0.69 up: shadows as long as the part is tall are too short for parts 4 to 8 px tall.
- The soft light of the reflection at the key's angle: flat metal faces went dark grey.
- Both sides into the shadow map for glass: the glass plate of the drop zone shadowed its own pocket.
- The renderer's own soft shadow types: the first needs a hardware comparison and gives no depth to search, the second leaks light at contacts.

## Measurements

All on this machine: 4 cores, software rendering, one render at a time.

Ceramic against the approved page look, MEASURED with `npm run still -- --sheet page-look --format hd --tier review --force`, then `node out/work/light/measure.mjs <png> 20,20,80,60 600,200,200,60 900,280,60,60 100,980,100,60 1800,160,100,60 1800,1000,100,60` on both pictures (mean sRGB luminance of the patch):

| Patch | Approved | This build |
| --- | --- | --- |
| upper left corner | 233.8 | 230.6 |
| upper middle | 226.3 | 223.9 |
| middle | 222.3 | 220.0 |
| lower left | 217.2 | 217.8 |
| upper right | 199.6 | 203.0 |
| lower right | 197.5 | 194.1 |

Upper left to lower right is 36.3 levels in the approved image and 36.5 in the build. The largest difference in one patch is 3.4.

Contact shadow, MEASURED with the same tool. The two pictures do not have the parts in the same place, so the patch is the same thing in both (the lower right foot of the first stepper button and the shadow a few pixels out), not the same pixels:

| | Approved | This build |
| --- | --- | --- |
| darkest value at the contact | 13 (patch 1105,120,30,30) | 11 (patch 1085,85,30,30) |
| first percentile at the contact | 16 | 15 |
| darkest value in the body of the shadow | 113 (patch 1290,125,25,25) | 91 (patch 1100,100,30,30) |

Nothing in a shadow is 0 and red is above blue in every shadow patch.

Shadow texel, MEASURED by computing the shadow camera the rig fits to the view with the same code as `LightRig.place`:

| Map | Format or level | One texel on the page | The 2 px rule | The 6 px pocket |
| --- | --- | --- | --- | --- |
| key, 4096 | `hd` | 0.45 px | 4.4 texels | 13 texels |
| key, 4096 | `uhd` | 0.90 px of the picture | 2.2 texels | 6.7 texels |
| fill, 2048 | `hd` | 0.90 px | | |
| key, 2048 | live, medium | 0.90 px | 2.2 texels | 6.7 texels |
| key, 1024 | live, low | 1.80 px | 1.1 texels | 3.3 texels |

At live low the 2 px rule has one texel: its shadow is there but soft. MEASURED: `npm run still -- --sheet page-look --format uhd --tier draft --force` took 30.9 s; a crop of the stepper at twice its size shows no texel step in any shadow edge.

Cost of one still, MEASURED with `npm run still -- --key step1-fire --format hd --tier <tier> --force` (the number the tool prints). "Before" is the same page with my files as they were on main at a844b0c, in a second worktree:

| Tier | Before | After |
| --- | --- | --- |
| draft (2 samples) | 9.8 s | 17.3 s |
| review (8 samples) | 25.4 s | 41.4 to 43.4 s |
| final (24 samples) | UNKNOWN (not run; about 67 s from the cost of a sample) | 114.9 s |

Later, on 7a48290 (main with the keyboard owner's next version and the 20 degree lens), the same commands: draft 11.3 s, review 21.0 s, 763376 triangles, 491 draw calls. That is 1.6 s a sample and 8.0 s fixed. With the fill's shadow switched off for the test: draft 9.2 s, review 17.6 s, so the fill's shadow is about 0.4 s a sample and 1.2 s fixed; the two lamp shadows are about 0.3 s a sample (draft 8.6 s without them too). The times of a still depend more on the page's parts than on the light: the table above was the first keyboard.

In that table one sample was about 2.6 s and is about 4.0 s. The scene went from 408580 triangles and 352 draw calls to 884726 and 596 in the same count, because the rig now draws the fill's shadow map and both sides of every solid. `npm run still -- --sheet page-look --format hd --tier review --force`: 31.0 s, 361994 triangles, 238 draw calls. Texture memory of the light: see `assets-src/light/RECIPE.md` (STATED from the sizes, not read from the GPU).

Bolt light, MEASURED on `out/work/stills/key-step1-fire-hd-review.png`: the top of the cap beside the bolt (patch 1355,868,14,10) is 243, 229, 205; the same place on the next cap away from it (patch 1255,868,14,10) is 228, 219, 204. The bolt adds warm light and no cap is burned out (highest value 243).

Live frame time: UNKNOWN on the merged page. `npm run budget` was last run on the stand-in page (1.03 s a sample at `hd` on this machine with software rendering, which says nothing about a real GPU).

## Decisions

- The keyboard owner's unit for an emitter is the law (see "Units").
- The falloff is computed from the position in the world, not painted on the picture.
- The shadow filter and the light law are patches of the renderer's shared shader pieces, so every material of every owner gets them, the diagnostic views too. No owner has to call anything but `studio()`.
- The key is lower than the reflection's soft light: `look.key.direction` and `look.studio.direction` are separate.
- Both sides of solid shadow casters go into the shadow maps. Glass does not.
- A material's own `envMapIntensity` is honoured (asked for by the type owner).
- Lit surfaces are capped under the glow's threshold.
- The fill has the same strength on a flat page at every tier, so tiers differ in noise and softness only.

- Solid things are drawn in a fixed order (group, render order, material, id) and not by distance. Cause, MEASURED with `npm run determinism`: 99 pixels of still-step1 differed after a step 1 film frame. The ground's flat mesh swaps in a larger buffer when a film frame carves more openings, its bounding sphere is worked out once from whatever the buffer held, three sorts solid things by the depth of that sphere, so the flat page and the pocket collars (same ceramic, one plane, meeting at edges 2 to 4 px outside each pocket) were drawn in the other order and the other mesh won the seam pixels. After the fix: `npm run determinism -- --format preview`, pass, 12 pictures identical. The cost is that nearer solids are not drawn first, so hidden pixels are shaded more often; draft time of step1-fire at hd stayed 11.2 s.
- The levels of the live site are one call, `setLevel`, and low keeps the key's real shadow pass and drops every other, since the key's shadow is what makes the page read as lit from the upper left.

## What is not done

- The approved shadows are still a little wider and softer than the build's on tall parts.
- The cost of a sample rose by half. The first places to win it back: fewer taps for the fill, and no fill shadow at draft.
- `--diag shadow` shows black rectangles where another owner's hidden shapes are (the drop zone, the left end of two fields). The diagnostic draws every mesh with one shadow material; that file is frozen for me.
- `rig.level` is kept and works, but no page sets it yet.
- The live frame time on the merged page was not measured. `npm run budget` at `uhd`: 9.17 s a sample, 7.26 s fixed, draft 25.6 s warm, review 80.6 s, final 227.3 s predicted (the run was stopped before `hd`).
