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

## Needs outside my folder

- `pipeline/phase4/ball-NEEDS.patch`: the cursor in the ball is drawn at the top of the ball, not at its centre. The page hands the cursor the ball's centre (`px(b.z) + BALL / 2`) and the cursor's view adds half a ball and one pixel again. The patch hands it the ball's foot in the two places (play and the sheet).
