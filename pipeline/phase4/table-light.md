# Table light: notes of the table lighter

Branch `agent/table-light`, made from `origin/phase4-base` (f634ffb). Folders `src/table/real/lights/` and `src/table/real/art/`. The older notes `lights.md` and `art.md` are read here and not edited; where this file says something else, this file holds.

## What the approved images show in my part that a quick look misses

1. The floor is close to black between the lamps. What reads as "a blue floor" is a thin gold or pale line every half ball and the lamps mirrored in the lacquer; the tone itself is darker than the darkest thing in our print.
2. No pool of light meets the next one. A lane lamp lights about one and a half balls of floor round it and then the floor falls back to dark, so the lamps count as separate points down a lane.
3. Each lamp is three things, not one: a lens brighter than the picture can hold, a soft halo of the same colour that the lens of the camera spreads over the dark ring round it, and a pool on the floor that is a good deal dimmer than the lens.
4. The brightest floor in a tier is not under a lamp of the lanes. It is the patch under each slingshot and at the feet of the cups, where a hidden lamp shines down a short way.
5. An insert has a dark line round it, then its colour, then a middle paler than its rim, and its picture is drawn in the dark of the same colour. Nothing is written under it and nothing is screwed beside it.
6. Steel does not look grey. It is dark with small hard lights in it: a row of lamp reflections along the back wall of the top lane, one white line down a rail. Outside the bright rim of the frame the room is black, in the tier pictures and in `table-wide` alike.

## Baseline (MEASURED on phase4-base before any change)

- `npm test`: 81 files, 1241 tests passed. `npm run build`: built. `npm run bots`: all clear.
- `npm run build && npm run counts -- --key table-wide --live low` (record `out/work/counts/key-table-wide-hd-live-low.json`): row `table-lights` 11 meshes, 11 colour calls, 0 shadow calls, 11 in all, 21060 triangles. Row `tier-art` 6 meshes, 6 colour calls, 0 shadow calls, 6 in all, 510 triangles. Whole frame 220 draw calls (limit 300), 547629 triangles.
- One draft still with its comparison, each from a cold start (`npm run compare -- --key <key> --tier draft --format hd`): tier-corporate 43 s, tier-office 39 s, tier-street 36 s, table-wide 42 s.
- Assets at the start: `public/assets/table/art` 8.7 MB, `assets-full/table/art` 28 MB, no assets of the lights.

## Decisions

- The night is made in three places and no others: the website's light (`table.pageDuskLevel`, the Builder's number), the fill of the hook, and the wide soft part of every lane lamp. Steel is not darkened here: the frame's owner makes his metal mirror the dark surround, and reads `wjlEnv` as before.
- Fill of a lit zone: `0.035 * general + 0.05 * flash` (was 0.05 for both). A flash therefore lifts the whole tier more than the lamps at rest do, and reads as a flash.
- Lane lamps: reach 3.0 balls (was 3.4) and power 0.5 (was 0.34) for the near pool; the wide soft part went from power 0.3 over 9 balls to 0.1 over 8 balls. Sling lamps power 0.95 over 2.4 balls (was 0.6 over 2.7). This is what keeps one pool from meeting the next.
- Lenses: `LENS = { on: 5.0, window: 3.2, rim: 0.5 }` (was 2.0, 1.45, 0.3). The glow of the page starts at 1.5 linear and a lit surface is held under 1.25, so only a lens above 1.5 gets a halo, and it gets it from the lens of the camera and not from a painted disc.
- Inserts: source 28 px over the floor, power 0.8, reach 2.6 balls (was 40, 1.0, 3.6): a spill round the window, not a wash of the tier. `INSERT_GLOW.on` was 1.55, then 2.6, and is 1.9 with a paler middle in the glow picture (see below), so the middle of a lit window passes the glow's threshold and its rim does not.
- No plate and no card at an insert. The kit says an insert carries a picture and no word and that the words go on the displays. The lights build no `insert-plate.<id>` any more (the shapes may still come: they are ignored), and the print has no card. Told `/root/pinball_stager`, who owns the shapes and the text.
- The floors: every row of chevrons and arrows is gone (top lane, launch, lift, inlanes, outlanes, centre, ramps, banks, car parks, garage), and so are the rays round the lamps, the ticks round bumpers, windows, pivots and the round model, the stars under posts, the dots over displays, the hatching in the slings and the zebra crossings. What answers a part is now one thin ring or one thin outline, tone on tone.
- Corporate: the sunburst keeps its arcs and every second ray, the zigzag bands are gone, at opacity 0.22 (was 0.3). Office: the two greens are darker, the keylines are grey-green instead of gold, the walkway is a pale grey (`#9c9c8c`, was `#c4c0b0`), and half of what lay about is gone. Street: the second tone and the paint are darker and greyer, the car parks are thin lines.
- The surround of each zone shows its lamps brighter (gain `min(8, power * 8)`, was `min(3, power * 2.4)`) and has a soft glow overhead (`SKY`), so lacquer and steel have something small and bright to mirror. Told `/root/table_framer`.
- The apron is not in `LIT` in this version. The frame's owner lifts the apron's ceramic himself from `levels(ctx, zone('street')).website`.

- The top of the frame's deck beyond a pit's edge takes no lamp light and no fill (`wjlPit` in the hook): it stands at the page's surface, over every lamp of the tier. Only what it mirrors lights it.
- A sling's lamp stands under its plastic: inside the sling's triangle its light is held at 0.22 (`SLING_TOP`), so the floor round the foot is the bright patch and the top of the plastic is not washed out.
- Pools on the lacquer (`HAZE` 0.05 in the hook): on a flat floor each lamp near it adds a soft pool in its own colour to the clear coat, whatever the colour of the print. Only light over about half a unit counts (`smoothstep(0.5, 2.4)`); without that limit the whole floor went grey.
- Lamps mirrored in the lacquer (`GLINT` in the hook, `CORE` in the pictures): each lane and rail lamp is written into the texture of its group as a small disc below zero, where no light is (the planes of `picturesOf` keep the light alone; the hook reads a negative value as the lamp's own level 2.6), and the floor shows it where the eye's line, turned by the floor, passes the lamp's height. Globes, bumper lamps and beacons are found by their true place. Strength follows the angle as lacquer does: 0.04 from straight above, rising to the full lamp at a grazing eye. An insert's lamp is under the floor and is not mirrored. Cost: three more reads of the light pictures on flat floors, no draw call, no triangle.
- A lit window: `INSERT_GLOW = { off: 0.05, on: 1.9 }`, and its glow picture is nearly white in the middle, its own colour at 0.74 of the radius and dark at the edge. An unlit window is dark glass with its picture just readable.
- The lamps over the bats (64 px up, power 0.9, was 0.5) are in the warm white of each tier's `windows` group, not in the gold or sodium of the lanes: orange under gold light turned red.
- Beacons: power 0.8 (was 1.1), and a single lamp lights a surface near it at most 3 times what the floor under that surface gets (was 8). The wall behind the firehouse was pink.
- `make.mjs` ends with `.linear(0.96, 6)`: nothing in a floor is pure black (one pixel of the office floor was, and the test of the art caught it).
- `table.pageDuskLevel` is 0.05 on main since 6060c7a (the Builder's change, asked here).

- After the Builder's look at 01:42 UTC (the whole machine dim in `table-wide`, the room round it grey): rail lamps gain 1.45 and lane lamps gain 1.4 in Corporate and the Street (the Office stays), fill down to `0.028 * general`, `HAZE` 0.065, the cold white of Corporate a little less blue (`[0.88, 0.93, 1.0]`).
- A window of a waking tier is never dead: its lamp stands at `INSERT_REST` 0.3 of the general lighting and its glass at `INSERT_GLOW.rest` 0.6 until the score lights it (then 1 and 1.9). Insert lamp: power 1.1 over 3.0 balls (was 0.8 over 2.6).
- The room round the machine is the renderer's clear colour (`look.background`, 29 of 255 in a still at any dusk). It is outside my folders: `pipeline/phase4/table-light-NEEDS.patch` makes it follow the website's light in `App.put` (`0.12 + 0.88 * website` of it), applied here as the commit `NEEDS: ...`. MEASURED in `table-wide`: the corner goes from (29, 29, 31) to (6, 6, 8); approved (4, 6, 8).

- Corporate gold (the Builder's point 2): the leaf of the print throws a lamp's light back in every direction in its own colour (`LEAF` 0.6 in the hook, on flat floors only, so no steel changes); the two golds of the palette are lighter (`#e3bd62`, `#c4a252`), the sunburst stands at 0.36 and the fans have heavier lines.
- The windows in the lanes are 38 by 25 px (were 29 by 18) with a larger arrow, in a brass bezel on Corporate: at the tier camera they read as lit windows, not dashes.
- The brass rods across the red carpet (the Builder's point 4) are built in `src/table/real/models/corporate/hq.ts`, not in my folders. Told the Builder.

## Measured after (at the first full version)

- `npm run build && npm run counts -- --key <key> --live low`, row `table-lights`, draw calls and triangles, before then after: tier-corporate 7 and 14902, then 6 and 14668; tier-office 7 and 18096, then 6 and 17862; tier-street 5 and 11614, then 4 and 11380; table-wide 11 and 21060, then 8 and 20358. Row `tier-art` is the same before and after: 3 and 172, 3 and 172, 2 and 170, 6 and 510. The "before" of the three tier keys was taken on a worktree of `origin/phase4-base`.
- `npm run still -- --key tier-corporate --format hd --force`: tier draft 36.8 s in the page (39.9 s with the start), tier review 66.0 s (69.2 s).
- `npm run measure -- --unit pinball --only M8 --tier review`: green, corporate 27 parts 0.0219 bare, office 26 parts 0.008, street 31 parts 0.0107.

## Asked of the Builder

- `table.pageDuskLevel`: 0.05 instead of 0.18. Granted at 6060c7a.
