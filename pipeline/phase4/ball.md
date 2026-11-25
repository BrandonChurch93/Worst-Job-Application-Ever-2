# The clear ball

Part `clear-ball`. Branch `agent/ball`. Folder `src/table/real/ball/`.

## What I see in the approved images that a quick look misses

1. The ball has two edges, not one: the outer outline and, a little inside it at about nine tenths of the radius, the ring of the inner wall. The band between them is brighter than the middle and carries the surround bent and upside down.
2. The seam is a hair line on a tilted great circle that runs through the plug. The plug is small, about one fourteenth of the ball across, and it is a turned metal disc with a slot, not a dot.
3. The highlights are soft window shapes on the upper left, with a weaker copy of them upside down on the far inner wall at the lower right. The lamps are small warm points that gather at the rim on the side away from each lamp, and the beacon lays a red arc on the rim in `youre-fired`.
4. The shadow in `lobby-doors` is a soft dark ellipse with a bright star of gathered light at the place of contact, and the glossy floor carries a faint mirror of the ball.
5. The arrow is large, more than half the ball across, crisp white with a dark edge, and it faces the camera even in the low views. The drops of sweat sit on the wall round it and are each a tiny lens with its own highlight.

## Decisions

- The maker answers every shape of kind `ball` whose part is `clear-ball`, so the three balls of the sheet are the same thing as `ball.clear`.
- Five drawings at most, in this order, all after the solid things and so after the cursor: `ball.shadow` (the decal on the floor), `ball.back` (the far half of the shell: far seam, far plug, the window upside down on the far inner wall, depth tested so the arrow hides it), `ball.sweat` (one instanced mesh, hidden while dry), `ball.core` (grade `true` alone), `ball.front` (the near half: wall band, ring, seam, plug, highlights).
- The shell is a shader of my own and carries `userData.unlit = true`: the lights hook cannot patch it, so it reads the lamps itself from `groupsOf` and `levels` (`lamps.ts`), the eight brightest at the ball's place, every sample of every frame.
- The wall: the ring of the inner wall is at 0.875 of the radius. Outside it the shell is nearly opaque and shows the floor bent through a solid ball; inside it the shell is nearly clear so the arrow reads, with a slow rise of the bent picture toward the ring.
- Grade `bend` (the fallback and the default): the bent picture is the floor art of the tier, sampled by page place (`u = x / 1920`, `v = 1 - (y - zone top) / 1080`), times the light on the floor, with a soft glow where a low lamp (an insert) lies. Grade `true`: one more sphere with true transmission under the same shell, and the band of the shell is thinned to let it show.
- The ball rolls without slipping: its turn is a law of its place on the page alone (`rollAt`), so no frame depends on the one before it.
- The halves are one geometry: two half shells, the two cut faces of the wall, the plug. The vertex shader swings them open on a hinge at the foot by one number from 0 to 1. The plug turns home in the first 0.6 s after the ball closes.
- The numbers I read on the ball's `v`: `[share closed 0..1, seconds since it closed, sweat 0..1]`. Without them the ball is closed, long closed and dry.
- The shadow is a decal on the zone's floor: one soft ellipse away from the key of the soft light, two more away from the two strongest low lamps, each with the bright spot of gathered light in it, and a dark touch under the foot that fades as the ball lifts.
- A lamp has two numbers, not one: `amount`, the light that reaches the ball from it, and `shine`, how bright the lamp itself looks in a mirror. The highlights use `shine`, so a lamp is a small sharp point and not a wash. A lit insert is a window in the floor and not a bulb: it is not mirrored as a point, it is a lit disc in the bent picture of the floor and in the mirror of the floor on the shell.
- The window of the soft light is 0.46 by 0.29 with one bar, brighter toward one side. Its copy on the far inner wall is one eighth as bright, so it does not lie over the arrow.
- The outline: the last 5 hundredths of the radius are dark (0.22 of the colour, nearly opaque), and the band dims a little toward it. Without this the ball had no edge against a pale floor.
- The bright spot of the shadow lies at 1.05 of the radius from the foot, away from the key, at the ball's edge as seen from above and not under the arrow. The shadow of the key is never weaker than 0.3 while the soft light is on.
- STATED, not solved in grade `bend`: the arrow is drawn by its owner before the shell and the shell cannot bend it. Its length is 0.73 of the ball, so from most views its outline stays inside 0.6 of the radius, where a real wall would not bend it either; toward the ring the shell lays its bent picture over it (up to half). True bending of the arrow's outline happens in grade `true` alone, where the transmission pass redraws the arrow through the core.
- The bent picture knows three more things about the floor, all read from the frozen layout: beyond 3 to 9 radii it is not known; inside the footprint of the nearest model of the tier it is not floor; over a flat that a model owner built on the floor it is that flat's colour (the carpet of the HQ, `0xa3161c`, STATED from `models/corporate/mats.ts` at 17:35 UTC). Where the floor is not known the wall band is 0.34 as dense and lets the scene behind it show, unbent, under the outline, the ring and the highlights. Before this the band was a flat blue hoop in `lobby-doors`: it showed the tier's navy floor from far away.
- A lit insert counts 0.3 in the light on the floor: it is a window, and its own disc (radius 0.55 of a ball) is in the bent picture.
- The shadow lies 3.4 px over the zone's floor, not 1.2: the carpet is 2.5 px thick with a 3 px edge, the Street's plinths are 3 px. Things lower than that carry the shadow on their tops; the brass ring of the revolving door (5.2 px) and the rods on the carpet (4.6 px) still hide it.
- Looks: I count every still I rendered. 40 of 40 by 17:20 UTC, then the Builder granted 12 more for the two faults in `lobby-doors` (the hoop, the shadow under the carpet); all 12 are used (4 of them I had rendered just before the grant as report stills, 2 were the same still twice after a slip in my script). 52 in all. Nothing is tuned after the last one.

## Needs outside my folder

- `pipeline/phase4/ball-NEEDS.patch`: the cursor in the ball is drawn at the top of the ball, not at its centre. The page hands the cursor the ball's centre (`px(b.z) + BALL / 2`) and the cursor's view adds half a ball and one pixel again. The patch hands it the ball's foot in the two places (play and the sheet).

## Measured (my VM, 25 November, format hd)

Commands: `node assets-src/table/ball/proof.mjs [--grade true] [--tier review] key:<id> sheet:<id>` (prints seconds and `info().counts` of the page), with the part switched off in `index.ts` for the "before" rows; `npm run build && npm run counts -- --key <id> --live low`.

| key, draft, grade bend | triangles before | after | draw calls before | after | seconds before | after |
| --- | --- | --- | --- | --- | --- | --- |
| table-wide | 534388 | 548396 | 1050 | 1048 | 27.7 | 27.7 |
| tier-corporate | 338580 | 351374 | 610 | 608 | 9.1 | 8.7 |
| tier-office | 317534 | 331544 | 549 | 548 | 9.1 | 8.8 |
| tier-street | 385520 | 397098 | 680 | 677 | 7.9 | 8.2 |
| lobby-doors | 377587 | 390381 | 683 | 681 | 7.4 | 7.3 |

"Before" is the stand-in ball, which also draws into the shadow passes; mine casts no shadow, so the page's calls fall by 1 to 3 while the triangles rise by about 13000.

The two grades of what is seen through the ball, sweat held at 0.6:

| still | grade | seconds | draw calls of the page | triangles of the page |
| --- | --- | --- | --- | --- |
| lobby-doors draft | bend | 14.8 | 703 | 394373 |
| lobby-doors draft | true | 24.2 | 795 | 569266 |
| lobby-doors review | bend | 39.2 | 864 | 403093 |
| lobby-doors review | true | 69.6 | 956 | 577986 |
| sheet clear-ball draft (3 balls) | bend | 22.7 | 537 | 599510 |
| sheet clear-ball draft (3 balls) | true | 31.2 | 602 | 772116 |

Grade bend is 4 drawings of the ball in the colour pass (3 while dry). Grade true is 5, and the renderer adds its own pass for transmission that draws the solid scene again: 92 more calls and 175000 more triangles in lobby-doors, 30 s more on a review still.

After the merge of the real models (main 9c7a181), draft, grade bend, from the same script: sheet clear-ball 27.4 s, 441 calls, 870920 triangles; lobby-doors 33.5 s, 621 calls, 929543 triangles; tier-office 16.7 s, 342 calls, 984840 triangles; rail-cam 12.3 s, 361 calls, 976444 triangles. Grade true was not rendered again after the merge.

`counts` rows: `table-wide --live low`: clear-ball real, 2 meshes, 2 colour, 0 shadow, 2 calls, 18872 triangles. `tier-office --live low`: 3 meshes, 3 colour, 0 shadow, 3 calls, 18874 triangles. `tier-office --live high`: 3 calls, 18874 triangles.

Asset sets: none. `public/assets/table/ball/` and `assets-full/table/ball/` do not exist; the part is code alone, 0 MB in both sets.

## Last round, 17:50 to 18:15 UTC (ended early by the Builder)

Decisions:
- The picture bent through the wall is now traced: the ray leaves the ball, meets the nearest four models of the tier as boxes (from `table.models`, each drawn in 0.45 ball from its box because the real models stand back from their boxes), then the sky, then the floor. A box hit gives a wall with bars, rows and a dark foot, lit by `washAt` in `lamps.ts` (the zone's lamps and fill at that place). Wall colours are my reading of the other owners' models: `WALLS` in `index.ts`, by part first (`model-hq` brass), then by layout tone.
- The lit insert in the bent picture has a hot middle, ribs, eighteen facets and a dark bezel; the wall gathers the insert's colour on the side nearest the insert.
- The shadow is longer (key slant 1.8, lamp slant up to 2.4) and darker (key up to 0.72), its star has two more rays. On and beside the carpet the decal lies 5.6 px above the floor so that it also darkens the brass rods of the door floor (they reach 5.2 px); elsewhere it stays at 3.4 px.
- Looks: 52 before this round, then 16 granted and 3 more; used 18 of 19 (a: 7, b: 11). Total 70.

Seen after the last change of each thing (MEASURED means the still was rendered and looked at in a crop):
- band in low views: `shot:pinball.lobby@0.35@table-lobby` (h3, h4, h5), `key:lobby-doors` (h7). Carpet red at the top of the ball, brass below.
- band over the lit insert: `sheet:clear-ball` (h6), once. Not one colour any more: pale at the far side, strong blue toward the insert.
- shadow in a low view: the same shot (h5). Carpet 166,60,60 lit and 57,23,26 in the shade (pixel values from h4).
- grade true and the open halves on the sheet (t4, o4), loader-page, rail-cam, reply-all, youre-fired, last-save (h2): seen before the insert and shadow changes of 18:05 to 18:10, not after.

Open for the next owner:
1. In `key:lobby-doors` the ball stands 2 px in front of the hq box. The band there is a clear grey and blue rim with little of the room in it, because every bent ray meets the wall at once. A wall picture with more in it (the real door: brass posts, pale panes, the lit strip above) would have to come from the hq model's owner, as colours or as a small texture.
2. The low-view shadow is a broad dark area in front of the ball with a soft bluish spot, not yet the long narrow shape with a sharp warm star of the approved lobby image. The numbers are in `decalFragment` (`glsl.ts`) and the last lines of `pose` (`index.ts`). The spot takes the colour of the tier's soft light, which is bluish in Corporate.
3. On the loader page the ball is faint: a thin ring and the seam. There is no floor picture there (`uArtOn` 0), so the band has only the dark surround to show.
4. The sheet has no light, so the sheet balls throw no shadow; the Builder owns sheet balls with a name that gets true light.
5. Grade true and the open halves were not looked at after 18:05.
