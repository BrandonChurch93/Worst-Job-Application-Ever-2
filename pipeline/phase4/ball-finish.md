# ball-finish: the clear ball and the displays

Owner `/root/ball_finisher`, branch `agent/ball-finish`. Parts `clear-ball`, `displays`. Earlier notes read: `ball-fix.md`, `ball-displays.md`.

## What the approved images hold in my part that a quick look misses

1. `clear-ball`, all three panels: the glass has no drawn line in it. Its rim is a soft band of bent floor that changes all the way round: dark teal where it bends the floor, a broad pale wash where it bends a lamp, and the inner wall shows as a second, offset edge only on part of the way round. Nothing in it repeats as a ring.
2. `clear-ball`, `last-save`: the lights in the ball are soft warm blobs, three to six of them, each a few percent of the disc, pressed against the rim on the side of a lamp and stretched along it. There is no window with a bar and no hard pinpoint except two or three tiny glints.
3. `lobby-doors`: the shadow is the largest thing the ball owns. It is two balls long, falls down the page toward the camera and a little left, is dense at the foot and soft at its end, and the gathered light is one small warm spot inside it, close to the foot.
4. `clear-ball` third panel, `youre-fired`: the arrow is ivory and matte with a soft sheen, the brightest thing in the ball, and its dark side wall shows as a band on the side away from the camera. The glass crosses in front of it only as one or two soft blobs.
5. `clear-ball` third panel: the struck ball is round. Nothing of the glass is cut or flattened: what tells the hit is the arrow, bent and thrown against the wall, and the bumper's light in the rim on that side. `table-wide`: the display carries six whole numerals with a glow that lies on the glass.

## Baseline before my first change

MEASURED on `origin/main` cfd83123 at 10:05 UTC: `npm test` 115 files, 1461 of 1461. `npm run build` built. `npm run bots` all clear ("keen reached every one of the 37 gags on every seed").

MEASURED 10:05 UTC with `npm run build && npm run counts -- --key table-wide --live low`:

| key | part | meshes | colour | shadow | calls | triangles |
| --- | --- | --- | --- | --- | --- | --- |
| table-wide | clear-ball | 2 | 2 | 0 | 2 | 18872 |
| table-wide | displays | 8 | 8 | 0 | 8 | 328 |

`table-wide` whole frame: 201 draw calls against 300.

## The issues of round 12 that are mine and still true on main (10:15 UTC)

Seen on cfd83123 at `draft`: the sheet `clear-ball`, and `lobby-doors`, `youre-fired`, `last-save` beside approved, each with the ball cropped at its real size.

Severe:
- R1-1 issue 3, sheet, all panels: "The spheres read as clear graphic outlines with repeated rims, over relatively flat and sparsely reflected surfaces." TRUE. The rim is three to five even concentric lines, the body has no bent floor in it, and the highlight is a window with a bar.
- R1-1 issue 2, sheet, right panel: "The arrow reads as another straight, hard, mostly matte pointer; the target is visibly warped and pinched". TRUE for the arrow (the acting's and the body's). In my part: the ball is drawn as a flat disc cut on one side, where approved keeps it round.

Major:
- R1-2 issue 8, `lobby-doors`: "a bright red glowing pool beneath and inside the ball; -a grounds the ball with a big soft dark cast shadow and one small warm highlight". TRUE: no dark shadow, three pale blobs on the carpet.
- R1-5 issue 7 and 12, `last-save`: "the build's ball is a flattened grey smear of glass and its cursor is grey metal with a black edge". Half true now: the ball is round in this still, the glass is a ring of lines, the arrow is grey beside approved's ivory.
- R1-5 issue 5, `rail-cam`: "the ball carries an inset rectangular panel and small text". TRUE as far as the window highlight goes: it reads as a panel. Not rendered yet at this key.
- R1-4 issue 6, `tier-street` crop: "the ball's interior reads dark and speckled with sparkles, so the cursor is grey and low-contrast". TRUE in the sheet's left panel (the drops) and in `youre-fired` (a dark far wall).
- R3-1 issue 3, `lobby-doors`: "the arrow itself looks more like an icon than a solid piece inside it". TRUE: the face is one flat grey, no reflection of the glass crosses it.
- R1-1 issue 16, sheet, left panel: "Dense pinpoints in the sphere". TRUE: about forty bright ringed drops over the whole ball where approved has about ten small ones in one patch.
- R1-1 issue 6 and 15, R1-2 issue 12: the arrow "dim, gray and edge-heavy". TRUE for grey. The edge is the body's.
- R8-2 issue 2, `last-save`: the amber readout "shows a cut-off message". TRUE: the display shows the start of a line running in, cut at the right.
- R8-1 issue 7, `tier-corporate`: "only one glyph". Not rendered yet, the same cause.

Minor:
- R3-2 issue 6: the third ball "still almost round". Stands against R1-1 issue 2 and the approved image: settled below.

## Tuning looks, by part

Counted from the first still. `clear-ball`: 4 at 10:12 UTC (sheet, `lobby-doors`, `youre-fired`, `last-save`, all `draft`). `displays`: 0.
