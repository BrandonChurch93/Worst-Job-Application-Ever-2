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
- Each lamp of the general lighting is two sources in its group: a tight pool from 26 px over the lens, and a wide soft one from 120 px, so a tier is lit in pools and still nowhere black.
- A low fill, tied to the general level, lights every surface a little from above in the tier's own tone, so roofs are not lit from nowhere.
- Reflections: one small picture of the surround per zone (256 by 128, made in code), dark, with the zone's lamps as bright spots and a faint tint of the lit floor below. In it no lamp is nearer than 420 px and none is wider than 0.045 rad, the eye is 20 px over the floor, and inserts, sling lamps and displays are left out: so a glossy floor shows the lamps as rows of small spots at grazing angles and never as a wash (the floor owner measured a cream wash in `lobby-doors` with the first version). It is each material's `envMap` unless the material brings its own, and its strength follows the general level. It is one fixed picture per zone, not remade as groups change: remaking it each frame was judged too dear.
- Floor reflections: the floor reflects the same surround through its clear coat, so the lamps show in it as soft spots. No second pass that draws the tier upside down: chosen for cost, and because the lamps are what a dark glossy floor shows first. Agreed by message with the floor owner as the starting point.
- True lights: at most 6, at most 2 with shadows, only in the zone the clear ball is in: the lamps of single groups (inserts, globes, bumper lamps, beacons) within about 5 balls of the ball, a beacon at full level, and the two nearest lamps of the general lighting. The share a true light takes is taken out of the group's picture (for the general lighting: a soft hole round that lamp), so nothing is lit twice.
- The office has ten groups without a group for its lane lamps, so its four amber lane lamps and the lamps under its slings ride in `office.windows` with the coffee machine: all small warm lamps that follow the general level.
- One group alone, for the proof sheet: `solo('<zone>.<group>')` of `index.ts`, or from outside the page the event `wjl-solo` with the name as detail.
- Label plates are drawn without any type: the type on them is the shape `insert-label.<id>`, drawn by the type renderer from `content/copy.json`.
- Lamps cast no shadows of their own; lenses, bezels and plates receive them.

## What a quick look at the approved images misses, in my part

1. The lamps of the lanes are not white: on every tier the four lamps beside the slings are warm amber domes in turned rings, and each throws a pool only about a ball wide.
2. The arrow windows of the top lane and the launch lane are small, lit evenly, with the arrow as a darker mark on a bright lens, and their light shows mostly as a row of spots mirrored in the steel rail beside them.
3. Under every sling plastic there is a lamp: the brightest patches of floor on each tier lie at the foot of the slings, in front of the flippers.
4. The bumper caps of the office glow from inside, brightest in the middle of the cap, and the light falls out below the cap as a warm ring on the floor and on the copper sleeve.
5. The tiers are never lit evenly: the corners behind the models and the lower shoulders fall to near dark, the surround is fully dark, and the globes at the HQ doors and both beacons show a second time as reflections in the clear coat of the floor.

## Colour constants (linear RGB, `src/table/real/lights/colours.ts`)

| Constant | Value | Used for |
| --- | --- | --- |
| `CORPORATE_COLD_WHITE` | 0.78, 0.88, 1.0 | `corporate.general`: the arrow windows |
| `CORPORATE_GOLD` | 1.0, 0.62, 0.24 | `corporate.lanes`: lane lamps and sling lamps |
| `CORPORATE_GLOBE` | 1.0, 0.93, 0.82 | `corporate.globe.left`, `corporate.globe.right` |
| `CORPORATE_WINDOW` | 1.0, 0.74, 0.4 | `corporate.windows`: HQ and the beach case |
| `CORPORATE_FLASH` | 0.92, 0.95, 1.0 | `corporate.flash` |
| `OFFICE_FLUORESCENT` | 0.86, 1.0, 0.92 | `office.general` |
| `OFFICE_BUMPER` | 1.0, 0.95, 0.84 | `office.bumper.1` to `.3` |
| `OFFICE_COFFEE` | 1.0, 0.7, 0.36 | `office.windows`: coffee machine, lane lamps, sling lamps |
| `OFFICE_FLASH` | 0.94, 1.0, 0.97 | `office.flash` |
| `STREET_DUSK` | 1.0, 0.8, 0.56 | `street.general` |
| `STREET_SODIUM` | 1.0, 0.5, 0.16 | `street.lanes` |
| `STREET_RED` | 1.0, 0.06, 0.03 | `street.red`: the firehouse beacon |
| `STREET_BLUE` | 0.05, 0.22, 1.0 | `street.blue`: the police beacon |
| `STREET_WINDOW` | 1.0, 0.76, 0.42 | `street.windows` |
| `STREET_FLASH` | 1.0, 0.93, 0.84 | `street.flash` |
| `DISPLAY_AMBER` | 1.0, 0.5, 0.08 | `<zone>.display` of every zone |
| `MARQUEE_PANEL` | 0.72, 0.8, 1.0 | `marquee.panel` |

Insert colours are not mine: `insertColour(n)` and `INSERT_GLOW` of `src/table/real/art/inserts.ts`.

## Proof

`node assets-src/table/lights/proof.mjs` (or `--zone corporate`) writes `out/work/lights/sheet-<zone>.jpg`: the tier with every group at its level, then lit by each group alone. With `--keys` it also writes `out/work/lights/sheet-keys.jpg`: `table-wide` and the three tier keys, each beside its approved image.

The lenses of the arrow windows and of the lane lamps are one mesh; a fourth vertex colour channel says which group a lens belongs to, so each lights with its own group.

## What it costs (MEASURED on this machine, 15:35 to 15:37 UTC, branch at a852226)

- One material through the hook: `npm run still -- --key tier-office --format hd --tier draft --force` took 23.319 s with the hook on and 19.114 s with the hook off (first line of `hook` returning at once, same build otherwise). The 4.2 s holds the making of the light pictures and the surround of the zones in view, and the compiling of the patched programs; it is paid once per page load, not per frame.
- `npm run still -- --key tier-corporate --format hd --tier review --force`: 40.148 s.
- `npm run counts -- --key <key> --live low`, row `table-lights`, real against the stand-in it replaces (part and hook both off):

| Key | Colour calls, real | Calls with shadow passes, real | Triangles, real | Colour calls, stand-in | Calls, stand-in | Triangles, stand-in |
| --- | --- | --- | --- | --- | --- | --- |
| table-wide | 11 | 11 | 21060 | 74 | 136 | 19096 |
| tier-corporate | 7 | 7 | 14902 | 26 | 74 | 10508 |
| tier-office | 7 | 7 | 18096 | 24 | 82 | 11344 |
| tier-street | 5 | 5 | 11614 | 24 | 59 | 8108 |

- Whole frame, same command, real against stand-in: table-wide 616 calls and 228682 triangles against 741 and 226718; tier-corporate 294 and 172730 against 361 and 168336; tier-office 388 and 192310 against 463 and 185558; tier-street 376 and 201814 against 430 and 198308.
- Per zone the part draws at most 6 meshes (corporate: lenses, sockets, plates, screws, globes, globe glass; office and street: the first four). A tier key shows parts of two zones, hence 7.
- No file ships from my folder: the pictures of light, the surround and every lamp are made in code. Asset sets: 0 MB.
