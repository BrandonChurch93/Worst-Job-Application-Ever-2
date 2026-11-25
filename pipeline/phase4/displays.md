# Displays

Part `displays`, branch `agent/displays`. Notes are added as the work goes.

## What I see in the approved images, in my part, that a quick look misses

1. Only `table-wide` shows a display at all, and it is the main one: the tier keys, `reply-all`, `youre-fired` and `last-save` have no tier display in frame, so the tier displays have no picture to copy and are built from the brief.
2. The main display is not a lit orange box: it is a long dark strip of fine perforated mesh across the whole face under the skyline, and only a window in the middle of it is alive.
3. The numerals are thin single strokes with round ends, set wide apart, and each has a soft halo that falls on the dark round it. The halo is wider than the stroke and much dimmer.
4. The backdrop of the lit window is a little lighter and warmer than the mesh beside it: the unlit dots are still there as dark beads, and the glow of the lit ones lifts the whole window a hair.
5. The display sits inside a double bezel of brushed aluminium with a dark gap between the two, so the glass reads as set down in a pocket and never as flush with the face.

## Decisions

- Everything is made in code. No picture ships from this folder: the asset sets are 0 MB.
- `font.ts` holds two dot fonts as rows of data: text of 5 by 7 dots with two rows under the line and widths that follow the letter, and ten score numerals of 9 by 15 with strokes two dots thick.
- `screen.ts` is the grid of 128 by 30 and what it shows at one moment. It has no three.js in it, so the tests run it in Node.
- `pick.ts` reads what to show from the `text` shapes of the part and from nothing else. The hint shape comes first, then the newest mode still running, then the score.
- All four displays share one grid and two small data pictures of it (one read dot by dot, one read softly for the halo and for the far view). The grid is drawn again only when what it shows changes.
- One display is two meshes. The first is the liner walls and the smoked pane as one mesh with one material: the colour and the cover of each corner say what is dust and what is clear glass, and a picture of two texels says what is matte and what is polished. The second is one quad at the mask whose shader draws the mask, its holes, the beads behind them and the halo on the inside of the glass, all found along the line of sight so the layers part as the camera moves.
- The name of an insert is held at twice the size of the text font when it fits on one line, else at its own size on two or three lines. The line then runs at twice the size, 84 dots a second, and is never made smaller.
- The score rolls only the numerals that changed, over two frames of the film.
- The hint is a mouse from above between two flipper bats. The left button and its bat light, then the right, once a second: two changes a second in all.
- From far away, where a dot is smaller than a pixel, the shader fades from the single beads to the soft picture of the same grid so the strokes stay even and do not shimmer.
- The dot level is `levels(ctx, zone).byName.display` times `DISPLAY_AMBER` with no other factor, as agreed with the owner of the lights.
- The main display takes its seat from the frame (`POCKET` and `seatOf` in `src/table/real/frame/marquee.ts`) when the frame gives them, and from the numbers of the old pocket until then.

## Measured, first complete version (commit after `f3e5c17`)

All MEASURED on this machine unless marked.

| What | Command | Before (stand-in) | After |
| --- | --- | --- | --- |
| `displays` row, `table-wide` | `npm run build && npm run counts -- --key table-wide --live low` | 3 meshes, 6 calls, 72 triangles | 8 meshes, 8 colour, 0 shadow, 8 calls, 328 triangles |
| `displays` row, `tier-street` | same with `--key tier-street` | 2 meshes, 4 calls, 48 triangles | 4 meshes, 4 colour, 0 shadow, 4 calls, 164 triangles |
| `displays` row, `tier-office` | same with `--key tier-office` | 3 meshes, 5 calls, 60 triangles | 4 meshes, 4 colour, 0 shadow, 4 calls, 164 triangles |
| `displays` row, `tier-corporate` | same with `--key tier-corporate` | 2 meshes, 3 calls, 36 triangles | 4 meshes, 4 colour, 0 shadow, 4 calls, 164 triangles |
| whole frame, `tier-street` draft | `npm run still -- --key tier-street --format hd --tier draft` | 391544 triangles, 802 calls, 21.538 s (main at 9787ac1) | 373170 triangles, 796 calls, 22.061 s (other parts changed on main in between) |
| one review still | `npm run still -- --key tier-street --format hd --tier review` | not run | 39.697 s, 43.3 s on the wall clock |
| asset sets | `ls assets-src/table/displays public/assets/table/displays assets-full/table/displays` | none | none: 0 MB each |
| tests | `npm test` | 62 files, 1053 tests | 63 files, 1068 tests |

One display is 2 draw calls and 82 triangles. The four together are 328 of the 4000 allowed.

## What the page does not carry yet

- STATED by the Builder: the mode shapes will carry `v[0]`, the seconds since the mode was lit. Until then `pick.ts` shows the newest mode of the ball's tier in a round on the frame's time: the name, the line, then four seconds of score.
- The score shapes carry no time of the last change, so the roll of a changed numeral is built and tested but is not seen in the film. Wanted: `v = [seconds since the score last changed, the score before the change]`.
- The shape `display.hint` with `v[0]` is not on the page yet. The picture is built and tested, and was looked at once by forcing it.
