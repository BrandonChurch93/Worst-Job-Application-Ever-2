# The models of Tier 1, The Street

Owner: the modeller of the street. Branch `agent/street`. Files: `src/table/real/models/street/`, `tests/table-street.test.ts`, this file.

## What the approved images show that a quick look misses

1. The firehouse is two materials, not one: a pale stone ground storey under red brick, with a stone frame round the door, and its roof is a grey deck inside a parapet with small units on it, not a red lid.
2. Both beacons are ribbed domes on a chromed ring, and the roof round each is washed in its colour: the light lands on things.
3. The bank is lit from inside: the warm light is behind the columns, on the wall and the doors, and the columns stand dark against it on a base of real steps.
4. The houses stand on a kerbed strip of their own with grass on it, and no two roofs have the same colour or the same shape.
5. The road signs are plates that stand clear of the floor on the sling posts, with a bright wire edge and screw heads at the posts, and the rubber shows under them.

## What is built

All of it is code: `geo.ts` (a builder of triangles with a place, a normal, a colour and a `face` attribute), `mats.ts` (one painted material whose fragment shader moulds brick courses, stone blocks, board marked concrete, shingles, clapboard, stucco, gloss paint, honeycomb sheeting and roofing felt from the `face` attribute; one metal; glowing surfaces; beacon lenses), `kit.ts` (walls with holes, windows with reveal, frame, glazing bars, sill and lintel, parapets, beacons, sign boards), and one file for each model. There are no asset files: 0 MB in every asset set.

- `model-firehouse`: base plate, stone ground storey, brick above, band course, cornice, parapet with stone cap, felt deck, hose tower with louvres and a pyramid roof, roof hatch, cooling unit, two vents, five lit windows upstairs and one with a brass pole behind it, lit windows on the side, the bay with a dark inside and hose racks, a door of four panels with a row of small panes, a stone door frame with a keystone and two yellow guard posts, the beacon, the sign board.
- `model-police`: blue painted brick on a stone plinth, a recessed entrance with four pale steps to double doors, a stone frame with a small pediment and a round lamp over the doors, barred ground windows, lit upper windows, parapet roof with a stair house, a radio mast, a cooling unit, two vents, the beacon, the sign board.
- `model-bank`: three steps, four fluted columns with bases and capitals, an entablature with dentils, a plain pediment, a roof of standing seams, tall bronze doors with panels and a lit transom, a night deposit slot, a lamp in the porch ceiling, three tall lit windows on the side that faces the table, the sign board on the ridge.
- `model-garage`: a round tower of three open decks on eight pillars each, round a board marked ramp wall, with kerbs, painted bay lines, yellow wheel stops, strip lamps under each deck, a stair head on the roof.
- `model-houses`: six houses on two kerbed strips of grass: clapboard, brick and stucco, gable roofs both ways and hip roofs, a door with a step and a path, lit windows, a chimney, a mailbox on a post, a hedge.
- `model-moms`: a clapboard house on a stone footing with a dark red roof, a porch with four posts, rails and a lean-to roof, a porch light, a flower box, a mat with nothing on it, gable windows, a mailbox, the sign board on two posts from the porch roof. The cellar hatch: a timber frame round the mouth, two doors of five boards each with battens, strap hinges, bolt heads and a ring pull, and a lit sleeve inside the mouth.
- `model-road-signs`: two pressed plates on the sling posts at 46 px, yellow honeycomb sheeting, black chevrons that point inward, a black line inside a rolled edge, a rivet at each post and one in the middle, grime along the lower edge. Each plate hops when its sling is struck.
- Street things on the two shoulders, where no ball can come: four street lamps, two hydrants, a bus shelter with a lit blank panel, two parked toy cars.

## Decisions

- No picture files: every surface is geometry and a procedural surface in the shader, so there is no letter or number anywhere and nothing to load.
- The seven parts share one build for the zone (`streetOf`), and each part keeps the meshes that are its own, so that the static geometry of all seven is one mesh for each material. Colour pass: firehouse 5 (painted static of all models, door, door frame, red reflector, red lens), police 2 (blue reflector, blue lens), bank 1 (metal static of all models), garage 1 (lit surfaces of all models), houses 1 (screws, instanced, `fine`), Mom's 2 (cellar doors instanced twice, cellar light), road signs 2. Total 14.
- The garage: the ball on `rail.spiral` fills a ring of radius 1.14 balls plus and minus half a ball, at every height from the floor to over the top deck, because the three turns are half a ball apart. No deck can reach into that ring. The garage is therefore a tower inside the turns: radius = the rail's radius less half of `table.minClearanceBalls`, read from the layout, 49.5 px. It stands from the tier floor to the top of the model's box (221 px). A test holds it inside the rail.
- The same ring crosses the front 0.44 balls of the police station's footprint and the place of `sign.street.police`. That is the layout's, not mine to move: reported to the Builder.
- Sign boards stand at the place, size and turn of each `sign.<model id>` text shape, read from the draw list, on two brackets from the roof. They draw no letter.
- The firehouse door slides straight up behind the wall. The window with the brass pole is the second from the left, clear of the door's travel.
- The cellar doors lie on a frame that is 3.5 px high where the ball comes in and 8 px at the far end, hinged on the long sides, and open to 86 degrees so that a ball passes between them.
- The plate of a road sign is the post triangle grown by 6 px with corners of 9 px, as agreed with the hardware owner.
- Street things are placed from the boxes of Mom's house and the rows of houses, on the shoulders behind `shoulder.edge` and `inlane.floor`, where the layout has no opening and no rail.

## Agreed with other owners

- Hardware: sling posts end in a flat shoulder 46 px over the floor, radius 7 px; the plate's underside is at 46 px and the rivets through it are mine; the band shows under it. The scoop mouths are theirs, flush in the floor, radius 0.58 balls, nothing over 6 px: the garage door and the cellar doors over them are mine.
- Play: asked where `rail.spiral` passes and how it is carried. No answer yet. I keep everything of the garage inside the rail's radius less half the clearance.
- Lights: my lit surfaces carry `userData.lightGroup` (`street.red`, `street.blue`, `street.windows`) and take their level from `levels()`. Told where they are.
