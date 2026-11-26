# Frame keeper, round 6

Branch `agent/frame-keeper`, from `origin/main` 4f64ab74. Folders: `src/table/real/frame/`, `hardware/`, `play/`.

## What a quick look misses in the approved images (my parts)

1. The chrome is dark, not pale: a rail, a hoop or a cap is mostly the dark room, cut by two or three thin white lines that run its whole length, with the lamp colour only on its under side.
2. The rails of the frame are shallow and nearly as dark as the floor from above: the long highlight sits on the inner chamfer only, the land itself is a slow gradient with no seam and no row of dark screws.
3. Every sling plate stands off the floor on three posts with a ring of wire or rubber round them: the ring shows as a rim all round under the plate's edge, and the lamp under the plate lights the posts, not the plate.
4. A bat is one clean orange lozenge with a black band on its side and one small chrome screw at each end: no disc on top, no wall under it.
5. The drain is a deep dark mouth with walls: its plate, its screws and its slot share one grid, and the apron beside it is plain ceramic with no seam running into the slot.

## Point 1: three largest differences of each key that are these folders' (MEASURED at 4f64ab74, draft hd, each looked at full size)

- table-wide: side walls and south rail ends tall pale slabs with striped lands; marquee smaller, paler, on a ribbed grey foot; highway wire and trestles pale grey to white, tubes thick and dark (size is the layout's).
- tier-corporate: rails near white sheets with black dot screws and seams; bats washed orange with a white pivot disc and black dot, grey shoulder wall under each; sling posts and ring hidden under the plates, lift tube near black with a brown elbow.
- tier-office: same rails; bumpers flat pale discs; ramp wire and hoops pale grey.
- tier-street: top right corner a large white rounded block; lower shoulders black with pockets; lift tube and elbow.
- rail-cam: wire rails thick matte blue grey with no glints; hoops full white rings; back wall a flat striped grey slab, lift elbow a large ribbed barrel.
- last-save: each bat on a tall grey slab wall with the white disc and black dot; slings and inlane guides flat plate on thin dark posts and slab walls; apron flat near white with grey seams, shallow drain, black box at lower right, post caps and rings dark.

## Counts before any change (MEASURED: `npm run build && npm run counts -- --key <key> --live low`, at 4f64ab74)

| key | hardware | frame | targets | flippers | bumpers | loader | lift | ramps | marquee | scene |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| table-wide | 21 / 30368 | 16 / 11732 | 15 / 23180 | 12 / 33360 | 8 / 48192 | 8 / 9408 | 8 / 8108 | 5 / 20536 | 4 / 2168 | 195 / 449426 |
| tier-corporate | 13 / 19488 | 9 / 8375 | 7 / 11420 | 5 / 13900 | 2 / 17556 | 4 / 3696 | 3 / 2416 | 0 / 0 | 4 / 2168 | 109 / 252142 |
| tier-office | 16 / 26252 | 12 / 10766 | 11 / 18208 | 7 / 19460 | 8 / 48192 | 3 / 4432 | 6 / 5892 | 3 / 15740 | 1 / 806 | 129 / 335094 |
| tier-street | 19 / 27952 | 13 / 9666 | 8 / 12060 | 6 / 16680 | 2 / 17556 | 2 / 4352 | 3 / 2342 | 5 / 20536 | 0 / 0 | 106 / 269420 |

Cells are draw calls / triangles.

## Counts after (MEASURED at 04:17 UTC on 67501935, same command)

| key | hardware | frame | targets | flippers | bumpers | loader | lift | ramps | marquee |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| table-wide | 21 / 30368 | 16 / 11732 | 15 / 23180 | 12 / 33216 | 8 / 48192 | 8 / 9408 | 8 / 8108 | 5 / 20536 | 4 / 2168 |
| tier-corporate | 13 / 19488 | 9 / 8375 | 7 / 11420 | 5 / 13840 | 2 / 17556 | 4 / 3696 | 3 / 2416 | 0 / 0 | 4 / 2168 |
| tier-office | 16 / 26252 | 12 / 10766 | 11 / 18208 | 7 / 19376 | 8 / 48192 | 3 / 4432 | 6 / 5892 | 3 / 15740 | 1 / 806 |
| tier-street | 19 / 27952 | 13 / 9666 | 8 / 12060 | 6 / 16608 | 2 / 17556 | 2 / 4352 | 3 / 2342 | 5 / 20536 | 0 / 0 |

Draw calls equal in every part and every key; triangles equal or fewer (bats lost 144 with the pivot disc).

## Looks used (limit 40 per part in this round)

One draft still shows several parts; each still is counted once, under the part it was rendered for.

| time UTC | key | for | count |
| --- | --- | --- | --- |
| 03:40 to 03:55 | six keys of point 1 | all | 6 |
| 03:57 to 04:07 | rail-cam 1, last-save 2, tier-street 1, table-wide 1, loader-page 1 | chrome, bats, drain, loader | 6 |
| 04:08 to 04:13 | youre-fired 2, table-wide 1, tier-corporate 1, loader-page 1, last-save 1, tier-office 1 | walls, loader | 7 |
| 04:19 to 04:21 | youre-fired, loader-page, tier-office, table-wide | walls, loader, marquee | 4 |
| 04:23 to 04:25 | youre-fired, table-wide, loader-page, tier-office | loader, marquee foot, tube | 4 |
| 04:29 to 04:34 | last-save, rail-cam, tier-corporate, tier-street, table-wide at draft; last-save at review | all, and the time of a review still | 6 |
| 04:34 to 04:36 | tier-corporate, last-save | bats, elbow | 2 |
| 04:42 to 04:45 | last-save 2, rail-cam 2 | highway wire | 4 |
| 04:46 to 04:57 | tier-street 2, table-wide 1, loader-page 3, last-save 3, tier-office 2, rail-cam 2 | walls, loader bed, wire | 13 |
| 05:01 to 05:05 | tier-street, last-save, table-wide, tier-corporate | tubes, wire | 4 |
| 05:05 to 05:07 | last-save, tier-street | tube line, wire | 2 |
| 05:08 to 05:10 | last-save, tier-corporate | wire | 2 |
| 05:10 to 05:20 | last-save 5, tier-office 1, rail-cam 1 | wire: which term makes it pale | 7 |
| 05:21 to 05:27 | loader-page 2, table-wide 2 | loader ring and bowl, rail ends, marquee | 4 |
| 05:33 to 05:35 | tier-corporate at draft, last-save at review (78 s, looked at) | lift tube, a review still | 2 |
| 05:36 to 05:40 | tier-corporate 2, tier-street 1, tier-office 1 | lift tube from above | 4 |

Total at 05:41 UTC, the end of this count: 77 stills (the rows above summed). One still shows several parts, so the split by part is my reading of what each was rendered for, not a log: ramps about 24, frame about 19, loader 10, hardware 6, flippers 5, lift 11, marquee 3, bumpers 2, targets 1. No part is at 40.

The times in the table from 05:01 on are read back from the pushes (05:20, 05:28, 05:41 by `date -u`), not each off the clock.

### Round 11 (from 05:42 UTC, 40 per part)

| time UTC | key | for | count |
| --- | --- | --- | --- |
| 05:46 | loader-page | loader: ring's gradient | 1 |

Total in round 11: 1 (loader 1).

## Decisions

- Point 2. `steel()` term `sky` now draws a dark ceiling with long thin tube lamps and lamp colour only near the horizon below; the hardware's caps, rings and posts carry it (`sky: 0.6`), the highway's wire is 0.07 rough so it takes it whole. The room is the same code for all three folders: one place to tune.
- Point 2, walls. `steel()` has a new term `wall`: the share of the room and of the lamps' broad shine an upright face keeps (by its world normal). Frame aluminium runs `wall: 0.12`, so tall walls are dark with the glints of the chamfers, where lands and chamfers keep the room. MEASURED in `youre-fired` draft, x 0..600, y 0..450: (96,81,77) before, (59,49,47) at 0.3, (52,43,42) at 0.12, approved (29,34,38). lamp_keeper asked for it and leaves `wjlEnv` alone.
- Point 3. The sling plates, their corner screws and cups are the modellers' (`models/corporate/wedges.ts`, `models/street/things.ts`, `models/office/staplers.ts`); mine are the three posts and the rubber ring. The ring's size is a promise to them (`waist + 2 * bandThick` = 11.5, held by `tests/table-hardware.test.ts`), so it stays; the ring no longer takes the plate's shadow, so it shows as a rim under the plate's edge.
- Point 4. The drain's slot is as wide as the two grey blocks stand apart, so block screws and bezel screws share their columns. Sent to table_runner: `drain-label` stands at 7 over a plate whose top is at 6, `apron-card-words` at slab + 2 hangs between the paper (slab + 1) and the cover (slab + 2.4).
- Point 5. Every place in `frame/tier.ts` and `hardware/tier.ts` reads the layout (`COLS`, `MOUTH`, `OUTLANE`, `<tier>.exit`, `<tier>.chute.mouth`). Left typed, as my own detail with no counterpart in the layout: the rail joint at 5.6 balls and the kerb stripe's span. The shoulder rim's height is my own constant: lowered from 56 to 30 px, so a bat no longer stands on a slab wall.
- Point 6. `MACHINE_ORANGE` untouched. The bats' paint is a little less rough so the orange is deeper under the lamps; the pivot is a chrome dome with a slot, where a white disc with a black hole read as an eye.
- Point 8. Loader: the cup is near black, deep, and aluminium outside the lamps now loses its mirror where its paint is dark (`wjf-dim`), so the bowl no longer reads mid grey; ring toned to the approved brushed grey. Marquee: its size is the layout's `marquee.back`; the grey behind and under it was my foot (beam, braces, plate), now dark.
- Rail-cam: the near wire lies inside the camera's blur, so its glints cannot show; told table_runner.
- The clear tube's turned-away wall was 4.2 times bright over the table and read as a pale striped sheet at a low eye; now 1.8.
- `steel()` has a third new term, `paint`: the share of the room that paint, plastic and rubber give back. Play and hardware run 0.4. MEASURED on the left bat's top in `tier-corporate` draft: blue channel 55, 50, 47 before and 36, 32, 29 after (approved 27 to 30); the orange itself is untouched.
- The bats' two screws are dull steel: polished domes read as white discs from above.

- The chrome's ceiling is rings of lamp at two heights, not strips at fixed bearings: a straight wire shows either as one line, and a curved wire keeps its line where strips broke into dashes that read as a rope. The rings are narrower on a thin wire's energy (`keep`), so a wire a few pixels wide goes dark grey, not pale.
- Clear tubes under the lamps (the lift's, the drain's, the feed's inside a tier) show the upper ring of lamp as thin hard lines down the walls that face the eye, strong on one side and faint on the other; the broad halo and the share of its own light a tube takes as opacity are down (0.08, 0.13), so from above it is clear with streaks, where it read as a frosted sheet. Two soft rings on both walls read as ribbed glass. Not on the page, not on the flat covers.
- The highway's wire stayed a pale tube at a low eye whatever the room did. MEASURED by turning terms off one at a time in `last-save`: not the lamps' direct shine, not the rows of lamps, not the floor field; it is `sky` (the polish rings) spread over a wire a few pixels wide. The rings now lose energy with the square of the thinning and play's steel runs `sky: 0.3`, `panel: 0.2`, `horizon: 0.4`.
- The loader's tube lies in a bed that is the bowl's own tone inside the bowl and the ring's dark aluminium through the ring: it read as a dark box.
- Frame aluminium's upright faces keep 0.06 of the room (`wall`), its screws mirror a ceiling near the lands' own, so a row of screws is not a row of black dots.
- The loader's bowl is turned whole and the tube's mouth stands out of its wall; only the ring is slotted. The slot's bed inside the bowl read as a dark box whatever its tone. The ring's face is a mid grey of its own (`FACE`, `EDGE`), darker than the collars. The ring's top is shaded round its turn (`Geo.tint`): dark toward the top of the page, light toward its lower right, as approved (54 at the top, 113 left, 171 lower right there).
- The sunk panels of the side rails' south ends are near black (`SLOPE`): from the player's end they read as two grey planks. MEASURED in `table-wide` draft: (34,33,31).
- Seen, not mine, told to their owners: the floor inside the lower shoulders is black in `tier-office` and `tier-street` (lamp_keeper); `rail-cam` near wire inside the lens's blur (table_runner, who lowered the camera and closed the lens). The marquee's title draws heavy and black across the whole picture in `table-wide` (table_runner, 05:25).

## MEASURED times (04:07 to 04:34 UTC, this VM)

- One `draft` still, hd: 21 s (`loader-page`), 34 to 46 s (the table's keys). Command: `npm run still -- --key <key> --format hd --tier draft --force`.
- One `review` still, hd: 84 s (`last-save`), same command with `--tier review`.
- Asset sets: `public/assets/table/frame` 0.062 MB, `assets-full/table/frame` 0.136 MB, `assets-src/table/frame` 2.024 MB (`du -sb`); hardware and play have none.

## Still least real at 04:40 UTC

1. The light on the bats and on the lift's elbow: a bat's top falls from (238,150,36) at the pivot to (126,79,29) at the tip where approved is even, and the elbow is (73,53,34) against (161,79,27). The lamps are lamp_keeper's; told at 04:34.
2. The highway's wire from a low eye (`last-save`): still a pale grey tube at draft size, where approved is a dark mirror with thin white lines. The hoops and trestles are right.
3. The frame's lands from straight above: pale sheets with fine stripes and a row of dark screws, where approved is one slow gradient. The south ends of the side rails stand as tall brushed posts in `table-wide` (their height is the layout's).

## Draw calls, MEASURED about 05:30 UTC at f66fec4d (`npm run build && npm run counts -- --key <key> --live low`)

- `tier-corporate`, `tier-office`, `tier-street`: every row of mine has the draw calls of the first measure (hardware 13/16/19, frame 9/12/13, targets 7/11/8, flippers 5/7/6, bumpers 2/8/2, loader 4/3/2, lift 3/6/3, ramps -/3/5, marquee 4/1/-).
- `table-wide`: loader 10 calls and 13966 triangles, was 8 and 9408. The same 10 comes out with the loader file of the push before (14004 triangles), so it is not this round's loader: main's 2a5a2c59 moved the wide camera to show the machine to its near end, and two more loader meshes are in view. Every other row of mine equal: hardware 21, frame 16, targets 15, flippers 12, bumpers 8, lift 8, ramps 5, marquee 4. Scene 201.
- Triangles of my rows in `table-wide`: 187052 before, 189610 now (ramps fell with main's layout, loader rose with the camera).
