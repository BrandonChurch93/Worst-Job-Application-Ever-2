# Lights: notes of the lamp lighter

Branch `agent/lights`. Part `table-lights` and `hook`, both in `src/table/real/lights/`.

## For every other owner

- Pass each material through `lit(studio(material), z)`. From then on the light of the zone's lamps reaches it and it reflects the zone's dark surround. Zones `first`, `apron` and `last` pass untouched.
- A material that gives light itself (emissive above zero, or an emissive map) and one with `userData.unlit = true` are left alone. A material that glows and should still take the light of the lamps beside it sets `material.userData.lit = true` before `lit`.
- An emissive mesh carries `mesh.userData.lightGroup = '<zone>.<group>'`. The names come from `groupsOf(zone)` of `src/table/real/lights/index.ts`.
- Levels are read in one place: `levels(ctx, zone)` of the same file gives `{ general, website, flash, groups[], byName }`. Do not read the anchors yourself.
- The colours of light are the named constants of `src/table/real/lights/colours.ts`, linear RGB.

## Decisions

- Ten channels of light per zone in three half float pictures of 320 by 180, one texel per 6 px, made in code from `layout.ts` at first use. Three lookups per fragment, no loop over lamps.
- A group with one lamp (an insert, a globe, a bumper lamp, a beacon) keeps its place as a uniform: the picture holds only what reaches each spot (fall off times what stands between), the direction is worked out per fragment, so walls and tops shade truly.
- The general lighting has many lamps in one channel. Its picture holds the amount, a fourth plane holds the mean direction to the lamps, and the shader rebuilds one lamp from it.
- Windows, displays, the marquee panel and the flash are fields with no one direction: lit by height and by how far a surface faces up.
- The law of fall off in the pictures is the law of the true lights of the renderer, so a lamp that turns into a true light near the clear ball changes nothing but its shadows.
- The hook is laid over the material's `onBeforeCompile` and `customProgramCacheKey` as accessors, so `studio()` may run before or after `lit`, and a later wrapper still works.
