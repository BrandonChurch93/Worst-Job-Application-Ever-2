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
- Looks: I count every still I rendered while tuning. After 38 of the 40 I stopped tuning the shader.

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

`counts` rows: `table-wide --live low`: clear-ball real, 2 meshes, 2 colour, 0 shadow, 2 calls, 18872 triangles. `tier-office --live low`: 3 meshes, 3 colour, 0 shadow, 3 calls, 18874 triangles. `tier-office --live high`: 3 calls, 18874 triangles.

Asset sets: none. `public/assets/table/ball/` and `assets-full/table/ball/` do not exist; the part is code alone, 0 MB in both sets.
