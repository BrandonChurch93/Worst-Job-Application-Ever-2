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
- The name of an insert is held at twice the size of the text font when it fits on one line, else at its own size on two or three lines. The line then runs at twice the size, two whole dots in every frame of the film (120 dots a second at `film.fps` 60), and is never made smaller.
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

## After the first report

- The halo is two things: a tight ring of eight taps round each lit dot, and a wide warm glow read from the small pictures of the same grid. The second is what makes a numeral look lit and not printed.
- The pane of a tier display carries small faint spots of the tier's general lamps, placed by where each lamp stands and sliding with the camera. The pane is taken to bulge a hair, so the spots are small and in a row. The main display has none: the marquee has no lamps of that kind.
- The sweep lifts the glow more than the dot, since a lit dot is already at the top of what the screen shows. MEASURED by one forced still: it is seen as a wider glow round two numerals and nothing harsher.
- `tests/table-displays-pick.test.ts` holds what is shown when: hint first, newest running mode, score after the line, the round used while the page gives no time.
- Looked at `last-save` and `youre-fired`: no tier display is in frame in either, as in the approved images.
- Looked at a sheet of `pinball.coffee`: the name is held, then the line runs, on the round used while the page gives no time.

## After merge 13 (main at 7d15ded and later)

- The main display now sits in the frame's new seat (`POCKET` 472 by 116, `seatOf`): its pitch is 3.66 page pixels a dot against 2.4 on a tier. MEASURED by a review still of `table-wide` and a draft still of `lobby-doors`, where the main display is seen close with a line running.
- The numerals of the score stand five dots apart, not two: the approved `table-wide` has its numerals set wide, and the score still ends four dots from the right edge.
- The hint's mouse has a lit wheel between its two buttons, and each button fills evenly. Looked at once on `tier-street` by forcing it.
- Looked at `rail-cam`: the office display is seen from the side with a line running; the mask, the beads and the liner part as they should.
- In `table-wide` the three tier displays are behind the wall at the foot of each tier from that camera. The approved `table-wide` shows none either. Only the main display is seen there.

## Measured at the end

| What | Command | Number |
| --- | --- | --- |
| `displays` row, `table-wide` | `npm run build && npm run counts -- --key table-wide --live low` | 8 meshes, 8 colour, 0 shadow, 8 calls, 328 triangles (stand-in before: 3 meshes, 6 calls, 72) |
| `displays` row, `tier-street` | same, `--key tier-street` | 4 meshes, 4 colour, 0 shadow, 4 calls, 164 triangles (before: 2, 4 calls, 48) |
| `displays` row, `tier-office` | same, `--key tier-office` | 4, 4, 0, 4 calls, 164 (before: 3, 5 calls, 60) |
| `displays` row, `tier-corporate` | same, `--key tier-corporate` | 4, 4, 0, 4 calls, 164 (before: 2, 3 calls, 36) |
| one draft still | `npm run still -- --key tier-street --format hd --tier draft` | 29.347 s, 1083499 triangles, 535 calls in the whole frame (other parts grew on main) |
| one review still | `npm run still -- --key table-wide --format hd --tier review` | 57.685 s, 61.7 s on the wall clock |
| asset sets | the three folders under `table/displays` do not exist | 0 MB each |

## The three things that still look least real

1. From `table-wide` a dot of the main display is about one screen pixel, so the numerals read as smooth strokes. The shader fades to a soft picture of the grid there on purpose, since single dots at that size shimmer.
2. The lamps in the pane of a tier display are soft round spots in a row. A real pane would show them with the shape of each lens.
3. The numerals of the main display are the two-dot strokes of the tiers. The approved image has thinner strokes with rounder ends.

## Open for the next owner

The work was ended by the Builder at 18:13 UTC, before the limit. What is left, in order:

1. The page does not yet give the times the displays need. Until it does, `pick.ts` shows the newest mode of the ball's tier in a round on `ctx.time` (name, line, four seconds of score), which is not tied to the moment the mode was lit. Wanted from the page of step 3: `v[0]`, the seconds since the mode was lit, on each `display.<tier>.<mode>` shape; `v = [seconds since the score last changed, the score before the change]` on `display.<tier>.score` and `marquee-score`; a shape `display.hint` of part `displays` with `v[0]`, the seconds it has been shown. `pick.ts` already reads all three, and `tests/table-displays-pick.test.ts` holds how. Once they are there, look at a sheet of a beat and check the name is held when the insert lights.
2. The roll of a changed numeral is built and tested in `screen.ts` (`drawScore`) and has never been seen in a picture, since no score shape carries `v`. Look at it at two frames after a score change.
3. The sweep was looked at in one forced still only, never in motion. It runs every 9 seconds for 2.6 seconds (`SWEEP` in `index.ts`).
4. The scroll was changed from 84 to 120 dots a second late. One sheet of `pinball.highway` was looked at after it: the end of a line runs out over three pictures and the score comes back. No whole line was watched from its start at the new pace.
5. The lamps in the pane (`mirrorOf` and `MIRROR` in `index.ts`) are soft round spots. Smaller, sharper spots with the shape of a lens would read more as glass.
6. Looks used: about 32 of 40.

How to force a picture for a look, and put it back after: in `pick.ts`, return `{ kind: 'hint', t: 0.6 }` or a mode at a fixed `t` on the first line of `pick`, render, then restore the file. Never commit that line.
