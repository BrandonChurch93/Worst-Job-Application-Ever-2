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
- Inserts: source 28 px over the floor, power 0.8, reach 2.6 balls (was 40, 1.0, 3.6): a spill round the window, not a wash of the tier. `INSERT_GLOW.on` 2.6 (was 1.55), so the middle of a lit window passes the glow's threshold and its rim does not.
- No plate and no card at an insert. The kit says an insert carries a picture and no word and that the words go on the displays. The lights build no `insert-plate.<id>` any more (the shapes may still come: they are ignored), and the print has no card. Told `/root/pinball_stager`, who owns the shapes and the text.
- The floors: every row of chevrons and arrows is gone (top lane, launch, lift, inlanes, outlanes, centre, ramps, banks, car parks, garage), and so are the rays round the lamps, the ticks round bumpers, windows, pivots and the round model, the stars under posts, the dots over displays, the hatching in the slings and the zebra crossings. What answers a part is now one thin ring or one thin outline, tone on tone.
- Corporate: the sunburst keeps its arcs and every second ray, the zigzag bands are gone, at opacity 0.22 (was 0.3). Office: the two greens are darker, the keylines are grey-green instead of gold, the walkway is a pale grey (`#9c9c8c`, was `#c4c0b0`), and half of what lay about is gone. Street: the second tone and the paint are darker and greyer, the car parks are thin lines.
- The surround of each zone shows its lamps brighter (gain `min(8, power * 8)`, was `min(3, power * 2.4)`) and has a soft glow overhead (`SKY`), so lacquer and steel have something small and bright to mirror. Told `/root/table_framer`.
- The apron is not in `LIT` in this version. The frame's owner lifts the apron's ceramic himself from `levels(ctx, zone('street')).website`.

## Asked of the Builder

- `table.pageDuskLevel`: 0.05 instead of 0.18. See the report for the two stills.
