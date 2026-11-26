# lamp-finish: the light in the machine and the printed floors

Agent `lamp_finisher`, parts `table-lights` and `tier-art`, branch `agent/lamp-finish`, from main cfd83123. Started 2026-11-26 10:02 UTC, limit 13:02 UTC.
Earlier owners' notes are read, not edited: `lamp-fix.md`, `lamp-keeper.md`, `table-light.md`, `lights.md`, `art.md`.

Labels: MEASURED (a command was run and its number read), STATED (read in code or a note), UNKNOWN.

## Start

- MEASURED 10:03 to 10:05 UTC on untouched main cfd83123: `npm test` 115 files, 1461 of 1461 passed; `npm run build` exits 0; `npm run bots` prints "bots: all clear".
- MEASURED: `node assets-src/table/lights/look.mjs --name s0 --keys ...`: one draft still with its pair takes 18.7 to 26.6 s after the first (42.8 s with the session's start).

## What the approved images show in my part that a quick look misses

1. A lit window in the floor is pale, not dark: its face is cream to white over most of its width and only the outer third carries the colour, so the red one reads pink-white and the blue one sky-white. The line art is dark and thin on that pale face.
2. Shadows are short. In `tier-street` and `tier-office` a building or a cup darkens the floor for less than half its own height, with a soft edge, and nothing crosses a lane.
3. Every warm thing lies twice: once as itself and once as a soft warm patch on the floor beside it (under each sling, round each round lane lamp, under each cup's rim). The floor between those patches is deep and even, never black.
4. From the low cameras the floor is a dark mirror with large tiles of slightly different depth: the red of the firehouse bay and the warm of each window stand in it as soft upright streaks that reach toward the camera, and far lamps become round discs out of focus.
5. The Office floor is light: a muted grey-teal with cream bands and a grain so fine it reads as tooth, not speckle. Its light is warm white, not green.

## Issues of round 12 that are my folders' and still true on main (s0 stills, 10:07 UTC)

Severe:

- R1-5 issues 1 and 4 (`rail-cam`, `last-save`): "the approved still is a warm night city: deep teal glossy streets, warm lamp glow, dark mood; the build is a bright, cool, grey daylight scene with flat pale ambience and no warm pools of light". Still true in my half: no warm pools, the lamps are small and the far ones do not glow; the pale walls are the frame's.
- R1-4 issue 4 (`youre-fired`): "the page is matte with fine blueprint lines; -a's floor is dark glossy, wet-looking tiles with strong red and warm reflections spilling from the door and beacon". Still true: the floor before the bay shows thin line art and no red.
- R1-3 issues 3 and 4 (`tier-office`, `reply-all`): "Cool, hard-edged shadows and muted, synthetic surfaces dominate the build"; "cooler and flatter, with long dark shadows around the top row and almost no warm reflected light beneath the main mechanisms". Still true: the cups throw shadows two cup widths long across the cream band, the light is green-white.
- R1-1 issue 1 (`table-wide`), my half: "The rails and inserts are isolated points of light rather than a coherent field of reflections". Still true.

Major:

- R1-3 issues 21 and 22, R1-1 issue 13 (inserts): "Broad dark radial fields with glowing colored centers replace the target's luminous pale enamel faces, concentric bezels and fine dark illustration". Still true on all three tiers: each window is a dark saturated disc with a small hot middle.
- R1-2 issue 7 (`tier-corporate`): "the hourglass insert is dark grey and unlit while the magnifier and clipboard glow". To be checked on s0 `tier-corporate`.
- R1-4 issue 12 (`tier-street`): "a large hard dark shadow from the highway and garage falls across the page". To be checked on s0 `tier-street`.
- R1-2 issue 6 (`tier-corporate`): "dimmer and cooler, with large soft dark shadow pools across the upper half".
- R1-3 issues 9 and 10, R3-1 issue 4, R3-3 issue 5, R3-2 issue 7 (Office floor): "The build's stipple is coarse and repetitive, and a faint fan of guide lines"; "The heavy, even speckle looks like exposed carpet rather than artwork under a polished pinball coating; the floor does not pick up a distinct reflection from the nearby bright rims". Still true.
- R1-2 issue 8 (`lobby-doors`), my half: "a bright red glowing pool beneath and inside the ball". To be checked.

Minor:

- R1-5 issue 13, R1-5 issue 14: "cools the scene"; "warm and darken these crops, restore the glossy reflections".

Not my folders (named so the Builder can pass them on): the tilt of the tier cameras (ruled), the pale walls behind `youre-fired` and round `last-save` (frame), the steel balls reading as milky beads (hardware), the arrow's grey face (cursor), every sign's type, the paper clutter on the Office shoulders (models or frame: not in my print).

## Looks

Counted from the first still, by part. Limit 40 a part in this round.

| Time UTC | Part | Stills | What | Running: lights, art |
| --- | --- | --- | --- | --- |
| 10:07 | both | 9 | s0, untouched main: tier-office, reply-all, youre-fired, last-save, table-wide, lobby-doors (lights), tier-corporate, tier-street, rail-cam (art) | 6, 3 |
| 10:11 | both | 4 | a1, steep key and pale inserts: tier-office, reply-all (lights), tier-street, tier-corporate (art) | 8, 5 |
| 10:16 | both | 3 | a2, floor closed round tall parts: tier-office (lights), tier-street, tier-corporate (art) | 9, 7 |
| 10:22 | both | 3 | a3, fine Office grain, no fan, bounce: tier-office, reply-all (art), tier-street (lights) | 10, 9 |
| 10:26 | both | 4 | a4, after first push: tier-street (art), tier-corporate, youre-fired, table-wide (lights) | 13, 10 |
| 10:28 | lights | 4 | a5, walls cut, haze peaked: tier-street, youre-fired, last-save, table-wide | 17, 10 |
| 10:32 | both | 3 | a6: reply-all, lobby-doors (lights), tier-corporate (art) | 19, 11 |
| 10:39 | both | 4 | a7, lamps answer the ball: tier-office (art), lobby-doors, last-save, table-wide (lights) | 22, 12 |
| 10:42 | art | 1 | review still of tier-office for the time of one review still (87.3 s) | 22, 13 |
| 10:46 | both | 2 | a8, Corporate laid in slabs with wear, sling pools smaller: tier-corporate (art), lobby-doors (lights) | 23, 14 |
| 10:49 | both | 2 | a9: tier-corporate (art, the full set was not remade, so the same picture as a8), table-wide (lights) | 24, 15 |
| 10:53 | art | 1 | a10, flecks in the Corporate stone: tier-corporate | 24, 16 |
| 10:54 | art | 1 | rv1, review still of tier-corporate for M3's own number | 24, 17 |
| 11:00 | art | 1 | rv2, review still of tier-corporate with stronger flecks, veins, the sunburst at 0.72 | 24, 18 |
| 11:09 | art | 2 | a11, flecks one step back, inserts deeper at the rim: tier-corporate, reply-all | 24, 20 |
| 11:13 | both | 2 | a12, grit in the Street asphalt: tier-street (art), youre-fired (lights) | 25, 21 |
| 11:16 | lights | 3 | a13, `DEEP` and `POOL` of Office and Street: tier-office, tier-street, table-wide | 28, 21 |
| 11:19 | lights | 4 | a14, sheen along the floor, head lamps of Office and Street lower: table-wide, tier-office, youre-fired, reply-all | 32, 21 |
| 11:22 | lights | 6 | h1, film frames before and after a hit: three round the first bumper hit (16.51 s, camera tier-2), three round the firehouse kick (29.01 s, camera tier-1) | 38, 21 |
| 11:25 | art | 1 | a15, Office tiles greener: tier-office (taken back, see decisions) | 38, 22 |

## Decisions

- 10:09 The head lamps stand steep (`KEYS` toward `unit(0.3, 0.58, 0.95)`) on all three tiers and are wide (`SHADE.spread` 0.13, blur 2). A part 40 px tall throws about 20 px of shadow, soft. Reason: point 5 and R1-3 issues 3 and 4, R1-4 issue 12. The powers fall (corporate 0.56, office 0.72, street 0.42) since a steep lamp lights the floor with 0.8 of itself where the low one gave 0.4.
- 10:09 Near and far ends of a tier differ by 0.72 to 1.12 (were 0.22 to 1.5): the approved tiers are even from head to foot, and the old fall left the head of the Office dim.
- 10:10 A lit insert is a pale face: lens and glow atlases redrawn (`glass()` in `inserts.mjs`), near white in the middle, the colour at the rim, a dark line at the seat, the picture a dark line 10 units wide. `INSERT_GLOW` 0.05, 0.42, 0.8. Reason: point 4, R1-3 issue 21.
- 10:13 The floor round the foot of anything tall is closed off from the head lamps (`CLOSE` in `key.ts`, alpha of the key picture, `SHADOW.closed` 0.8): a tight dark line at the foot and a wide soft one. No draw call, no new picture: the alpha channel held the height before and nothing read it.
- 10:18 Office print: tiles lighter (`#496268`, `#40575d`), the stipple four times finer and 52000 marks instead of 14000, the rays and inner arc under the flippers gone on Office and Street (`plain`), lines in muted gold. Reason: R1-3 issues 9 and 10. Corporate keeps its gold fans: the approved Corporate has them.
- 10:20 `SHADOW.spot` 0 at the request of `/root/ball_finisher`: its decal draws the one warm highlight under the clear ball, turned to `keyOf(zone).toward`. `SHADOW.clear` stays 0.4.
- 10:20 Warm bounce: `BOUNCE` 0.55, tint 1.0/0.74/0.46, dying out 46 px over the floor, strongest on undersides. Reason: point 2.
- 10:24 Told `/root/frame_finisher` what walls take from the hook. 10:27 `SHADOW.wall` 0.45: an upright face takes 0.55 of the head lamp, so no wall outshines the floor beside it.
- 10:27 The haze round a lamp is peaked (`HAZE` 0.014 from amount 2 to 12, light compression): a hot warm middle under each sling in place of a flat pale disc. Street pools 0.85 of full (were 0.6), Corporate 0.95.
- 10:31 Lacquer: `WET` 0.16 (was 0.1), `GLINT.level` 7, `STREAK.level` 3, `SPILL` 1.5: each globe and lane lamp leaves a streak toward the camera in the close keys (seen in `lobby-doors` a7 under the right globe).
- 10:31 Inserts quieter: `INSERT_GLOW` rest 0.34, lit 0.64, and 1.0 only under a ball. Reason: beside the approved `reply-all` the lit windows were the brightest things on the floor.
- 10:36 Round 12 motion issues given to me by /root (R4-3 issues 2, 3, 8, R4-4 issue 2), done in `levels.ts` as a pure reading of the draw list, no clock and no state:
  - an insert rises as a ball rolls onto it and is full with the ball over its middle (`near()`, `ANSWER.reach` 0.55 balls), a window the score has lit stands at `INSERT_LIT` 0.72 so the ball still raises it; the window's glow in `art/index.ts` follows the same number (`INSERT_GLOW.hit` 1.0);
  - the two globes at the carpet rest at 0.62 and flare to full when a ball strikes their post (`ANSWER.globeRest`, `globeReach` 1.1 balls);
  - a bumper lamp rests at 0.36 (was 0.5), is full on the frame of the hit and falls back over 0.4 s (was 0.25);
  - the red of the firehouse holds 0.6 with the ball in the bay, is full on the frame of the catch (0.3 s) and of the kick (falls to idle over 1.2 s); its pool before the bay and its image in the lacquer follow the same level;
  - the scoop of the letter tray flashes the Office (0.8 of a flash, 0.25 s) on the frame it takes the ball and the frame it kicks it.
  `/root/machine_finisher` confirmed the numbers in the draw list (10:41): nothing needed from it.
- 10:46 Corporate print: slabs with a dark joint and pale arris, the scratches of play, base 1.18 times brighter. Sling pools smaller and lower (`SLING` power 3.6, reach 0.95).
- 10:50 FOUND: `look.mjs` and `npm run still` read the full asset set, so a floor remade with `--set web` alone shows nothing. Both sets are remade each time (web 26 s, full 190 s for Corporate).
- 10:55 M3, MEASURED with the measure's own sum (`node assets-src/table/lights/sharp.mjs <name>`, the mean square Laplacian of the still over the approved image's at the same size) on review stills of `tier-corporate` (`npm run still -- --key tier-corporate --format hd --tier review`): 0.512 before the flecks, 0.539 with strong flecks, veins and the sunburst at 0.72. The draft stills read higher (0.70 to 0.71) because they are not smoothed, so the draft number is no guide to the review one. By blocks of 240 by 180 px (`node assets-src/table/lights/grid.mjs <name> <key>`): the open floor holds 11 to 19 against the approved 35 to 74, and tripling the print's marks moved a block by 2 to 3. The approved floor is smooth marble: its fine detail is in the hardware on it (posts, screws, wire guides, lamp rings with hard small highlights), in the frame and at the head wall.
- 11:02 DECISION: the Corporate stone keeps flecks at a level that reads as granite (pale 0.6, gold 0.5, 60000 marks), not the stronger set of rv2, which read as glitter under the slings. M3 on the tier keys cannot be passed from the print alone without a floor that no longer looks like the approved one. I do not raise it further.
- 11:00 Inserts: lens and glow fall to the deep colour at 0.74 of the radius and darker to the seat, so a lit window is plainly brightest in the middle (point 4).
- 11:12 Street print: the grit of asphalt (60000 stones of the aggregate, pale and dark, over roads and paving, under the painted bays). Web set 8.18 MB after it (limit 9).
- 11:14 To `/root/street_finisher` (told by /root it builds the beacon cover): what the hook does with emissive and `userData.lit`, that the red group now holds and flashes with the catch and the kick, that I throw the beacon's colour myself and it adds no `ctx.light`. No answer asked.
- 11:15 From `/root/frame_finisher`: with its navy cabinet walls `table-wide` is 0.954 of the approved; it asks for no drop of the floors. MEASURED on my branch before its walls are in main: 1.04 (`means2.mjs a14 table-wide`); by blocks (`cells.mjs a14 table-wide`) the Office floor in `table-wide` is darker than the approved (90 against 110, 62 against 69) while from straight above (`tier-office`) it is brighter (1.09). So the gap is the sheen along the floor, not the lamps: `SHEEN.coat` 0.1 (was 0.03) adds only at a low eye. Head lamps of the Office 0.66 (was 0.72) and of the Street 0.39 (was 0.42), pools of the Office 0.8 (was 0.6) and of the Street 0.98 (was 0.85), `DEEP` office 0.7/0.56, street 0.66/0.46.
- 11:22 SEEN in film frames (`look.mjs --beat pinball.coffee --at 0.3675,0.3825,0.42 --camera tier-2`, hits from `npm run take -- --check`: bumpers at 16.51, 17.33, 17.61, 17.93, 18.36, 18.91 s): the struck bumper's cap is at rest 0.04 s before the hit, full 0.02 s after it and nearly back 0.17 s after. Round the firehouse kick at 29.01 s (`--beat pinball.fired --at 0.8286,0.8657,0.95 --camera tier-1`): the beacon and its red on the roof are larger on the kick frame than 0.1 s before; from straight above the red on the floor before the bay is weak. So the pool before the bay is stronger: power 2.6 (was 1.7), reach 3 balls (was 2.6). NOT SEEN after that change: no lights look left for it.
- 11:24 `SPILL` 2.2 (was 1.5) and `SHEEN.pools` 0.8 (was 0): what a lit opening throws on the lacquer is stronger, and the haze round a lamp is brighter from a low eye than from above (R1-4 issue 4, R3-1 issue 4, R3-3 issue 5).
- 11:26 Office tiles: a greener, deeper pair (`#3e6664`, `#365a59`) read more saturated than the approved (build 66,97,85 against approved 62,79,74 on a tile); taken back to `#496268`, `#40575d`, whose hue matches (76,93,89) and which is 18 percent brighter. I leave it brighter: the Office floor in `table-wide` is already darker than the approved, and the mean of `table-wide` is ruled.
- Looks: lights stand at 38 of 40 at 11:26. The last two are kept for `table-wide` and one close key after the frame's navy walls are in main.

