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

## Looks used (limit 40 per part in this round)

See the table at the foot.

## Decisions

