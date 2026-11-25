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
- The general lighting has many lamps in one channel. Its picture holds the amount; two planes hold the side the light comes from and a third (the channel the flash leaves free, since the flash is worked out from the general picture in the shader) holds how far it leans from straight above, each weighted by amount. The shader rebuilds one lamp from them. The lean is kept apart from the side so that between two lamps, where the sides cancel, the light still leans as each lamp does: with one mean direction the light there came from straight above and made a bright smudge between every two lamps.
- A flat floor (facing up, lower than 16 px over its zone's floor) takes only the diffuse light of the lamps of the general lighting and the lane lamps. Their gloss is seen once, as the spots of the surround; a gloss worked out from the one rebuilt lamp drew long white streaks across the clear coat. Single lamps (inserts, globes, bumper lamps, beacons) keep their gloss.
- A wall takes the general lighting through a soft knee (`0.6 a / (1 + 1.5 a)`) and 0.4 of its gloss, since the lamps are lenses in the floor and the rebuilt lamp stands 44 px over it: without the knee the bright steel walls of the frame beside the top lane lamps went to flat white (seen at 16:22 UTC in a scratch merge of `agent/frame` and this branch; with the knee they show a scallop per lamp).
- A display throws a faint amber wash about one ball out from its glass (three sources of power 0.22, reach 2.4 balls), as its owner asked: at rest about 8 percent of its dots are lit.
- A surface that faces up is lit by the general lighting from a lamp that rides over it (the rebuilt lamp stands 44 px over the surface, not over the floor), with a slow fall by height (halved at 170 px), and the top fill rises to 2.6 times between 20 and 130 px. Before this a top at 53 px was lit from below its own height: the corporate owner saw white stone sling plates read mid grey from above. Looked at in a scratch merge with `agent/corporate`, `agent/play`, `agent/displays` and `agent/ball` at 16:50 UTC: the plates read warm near white, roofs are lit, nothing clips.
- Clear glass (a transparent material under 0.5 opacity) takes a quarter of the lamps' light: it shows the lamps in its reflection, not as a matte thing does. Without this the lift tube of the frame went to white blobs over each lamp of the lift lane (its alpha rises with the light it sends back). Seen in a scratch merge of all owners' branches at 16:58 UTC, gone at 17:01 UTC.
- The general lighting on any one fragment is never taken as nearer than its lamp is to the floor under it by more than 1.4 times, and a thing more than 40 to 100 px over the floor takes it through the same knee as a wall.
- The globes are brightest where they face the eye and fall to 0.3 at their edge, so each reads as a ball of opal glass and not a flat white disc.
- `CORPORATE_WINDOW` went from 1.0, 0.74, 0.4 to 1.0, 0.83, 0.6 and the lamp at the HQ door from power 1.3 to 0.85, as the corporate owner asked: the gold light turned the steel of the tower to brass.
- The four street lamps of the shoulders (places from the street owner) are sources in `street.windows`. Not done: a source in the open cellar of Mom's hatch. The street has all ten channels in use and the cellar is lit only while its doors are open, which needs a level of its own.
- The beacons went from power 2.0 and reach 7.5 balls to power 1.1 and reach 5.2 balls: at full level the red one washed the whole steel wall behind the firehouse pink in `youre-fired` (seen in the scratch merge at 17:08 UTC; at 17:10 UTC the red falls off along the wall).
- The window sources at the garage and the bank stood low and near, so the field on the models themselves was about 3.1 and 2.5 (worked out by the street owner from `fall`), and pale concrete and stone clipped to cream. The garage source is now at 110 px with power 0.9 (about 0.75 at its middle), the bank's two at 70 px with power 0.3 and 0.2 (about 0.6 and 0.4). The street owner had painted both models darker to answer it and was told at once.
- A lamp stands over each flipper bat (64 px up, 0.85 balls in from the pivot, power 0.5, reach 3 balls), in the tier's lane lamp group (`lanes` in corporate and street, `windows` in the office). Before it the light pictures held about 0.05 at the flipper pivots (MEASURED: a test that printed the planes at each pivot, 17:27 UTC) and the play owner saw the bats read dark brick. There is no lamp as a thing there: it stands for the lamps a table has under its return lanes. Looked at 17:30 UTC in `tier-street` and `last-save`: the bats read lit orange.
- The garage (after main 46e4bc6 moved it to centre (15.2, 5.45) and made it 4.3 balls high) no longer stands in a lamp's way as a solid box: only a core of 0.15 of its box width does. As a box 413 px high it shaded the rail lamps' light and the police station's window light off the floor round it. Its window source reads the model's box, so it moved with the model: local (499, 17), 110 px up, power 0.9; the field is about 0.75 at the core and about 0.2 at the police front 147 px away. The police front's own two window sources (0.12 balls before the front) stand now 12 px from the garage rim. Looked at 17:31 UTC in `tier-street`: nothing clips on the police station or the garage.
- Rail lamps: times 1.3 in corporate, 0.8 in the office (its floor is pale), 1.35 in the street.
- Windows, displays, the marquee panel and the flash are fields with no one direction: lit by height and by how far a surface faces up.
- The law of fall off in the pictures is the law of the true lights of the renderer, so a lamp that turns into a true light near the clear ball changes nothing but its shadows.
- The hook is laid over the material's `onBeforeCompile` and `customProgramCacheKey` as accessors, so `studio()` may run before or after `lit`, and a later wrapper still works.
- Each lamp of the general lighting is two sources in its group: a tight pool from 44 px over the lens, and a wide soft one from 150 px, so a tier is lit in pools and still nowhere black.
- A low fill, tied to the general level, lights every surface a little from above in the tier's own tone, so roofs are not lit from nowhere.
- Reflections: one small picture of the surround per zone (256 by 128, made in code), dark, with the zone's lamps as bright spots and the lit floor below as a tint (0.08 to 0.20 of the tier's fill tone, so metal seen from above is not black). In it no lamp is nearer than 420 px and none is wider than 0.045 rad, the eye is 20 px over the floor, and inserts, sling lamps and displays are left out: so a glossy floor shows the lamps as rows of small spots at grazing angles and never as a wash (the floor owner measured a cream wash in `lobby-doors` with the first version). It is each material's `envMap` unless the material brings its own, and its strength follows the general level. It is one fixed picture per zone, not remade as groups change: remaking it each frame was judged too dear.
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
| `CORPORATE_WINDOW` | 1.0, 0.83, 0.6 | `corporate.windows`: HQ and the beach case |
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
- Measured again at 16:35 to 16:37 UTC with main at 915b3b4 merged (the real frame is in): the row `table-lights` is unchanged in all four keys, real and stand-in. Whole frame, real against stand-in: table-wide 513 calls and 263322 triangles against 638 and 261358; tier-corporate 244 and 187542 against 311 and 183148; tier-office 302 and 209448 against 377 and 202696; tier-street 297 and 217014 against 351 and 213508.
- Measured a third time at 17:20 to 17:23 UTC with every owner's part merged (main at 44051e8): the row `table-lights` is again unchanged. Whole frame, real against stand-in (part and hook off): table-wide 225 calls and 544363 triangles against 350 and 542399; tier-corporate 123 and 351561 against 190 and 347167; tier-office 153 and 445476 against 228 and 438724; tier-street 121 and 349396 against 175 and 345890.
- Same build, `npm run still -- --key tier-office --format hd --tier draft --force`: 33.294 s with the hook on, 26.195 s with the hook off (17:25 UTC). `npm run still -- --key tier-corporate --format hd --tier review --force`: 61.358 s (17:24 UTC).
- Making the light pictures, timed in node on this machine at 17:27 UTC: marquee 39 ms, corporate 605 ms, office 423 ms, street 584 ms; each surround 8 to 23 ms. It is done once per zone at first use, on the main thread.
- Per zone the part draws at most 6 meshes (corporate: lenses, sockets, plates, screws, globes, globe glass; office and street: the first four). A tier key shows parts of two zones, hence 7.
- No file ships from my folder: the pictures of light, the surround and every lamp are made in code. Asset sets: 0 MB.
