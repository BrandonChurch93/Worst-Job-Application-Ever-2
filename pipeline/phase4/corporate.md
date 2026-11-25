# Tier 3, Corporate: the seven models

Owner: corporate. Branch: `agent/corporate`. Code: `src/table/real/models/corporate/`. Tests: `tests/table-corporate.test.ts`.

## What the approved images show that a quick look misses

1. `lobby-doors.png`: the tower is steel and dark blue-green glass, not gold. What reads as lit windows is ceiling light panels seen through the glass, long rectangles in perspective inside each bay, with dark glass round them. Brass is only at the door frame, the revolving door and the carpet's piping.
2. `lobby-doors.png`: the band that carries the name is one long steel slab with a chamfered lower lip, wider than the glass under it, so it throws a shadow line across the lobby glass. The lobby glass has its own thin mullions and reflects the globe lamps.
3. `lobby-doors.png`: the panes of the revolving door are thick slabs with rounded corners and bright refracting edges. They have no frame all the way round: each is held by small brass clamps at the post. The post has turned collars at three heights and stands on a stepped disc at the left edge of the carpet.
4. `tier-corporate.png`: the beach case is the brightest thing on the tier and spills light on the floor round it. Its lid has a visible thickness with a bright rim, and the brass plate sits on the lid's back edge, not on the wall.
5. `tier-corporate.png` and `table-wide.png`: the marble wedges are thick (not a printed plastic), their chamfer catches one line of highlight, the veins run across the long side, and the lamps under them spill white at the lower edge. The notes lie leaning well back, each turned a little differently. The ladder ends in a flat steel flap at its foot.

## Decisions

- Three materials for the whole tier: one opaque material whose finish (polished, brushed, gloss, matte, stone, satin, leather, cloth) is picked by a mesh's coordinates from a small palette of roughness and metalness, one material that glows (the same, plus emissive of the windows colour times the vertex colour times a share carried in the second coordinate), one cheap clear material (thin, Fresnel edge, drawn in a single pass). This is what holds the tier to 14 colour calls.
- Colour calls at low quality: HQ 3 (solid, glow, the two door leaves as one instanced mesh), revolving door 2 (rotor, panes), beach 3 (solid, lit scene, clear case), boardroom 2 (solid, twelve chairs as one instanced mesh), ladder 1, notes 1 (three leaves as one instanced mesh), wedges 1. Sum 13.
- Fine meshes (hidden at low quality): the steel and gold frame of the tower's glass, the welds and foot screws of the ladder, the feet of the notes and the pencil tick, the folders, glasses and speaker phone of the boardroom, the screws of the revolving door's floor ring.
- The doors of the HQ open inward into a lit vestibule. The stand-in shape draws them swinging outward: outward leaves would sweep through the ball and the revolving door. The leaves are brass frames with open grilles, so the lit lobby shows through them.
- The whole HQ object rings 0.7 px for half a second on the slam; the frame is static geometry and is not rebuilt.
- The revolving door's floor ring and post are round, so they turn with the rotor and cost no call of their own. The ring stands on the carpet (the carpet is 3 px thick).
- The beach scene is lit from inside by a warm strip under the lid, all the way round. An opaque lit ceiling would hide the scene from the camera that looks straight down. The scene itself takes a fifth share of the windows light so it reads sunlit when the case is on, and the painted sky a half share.
- The beach case has no door, slot, hinge or handle: four walls, a lid, four screws.
- The boardroom is an open room on a carpet with a brass edge: a table 50 px high, chairs whose backs reach the 0.9 balls the layout gives the model.
- The notes stand on leaves of spring steel hinged at the floor and lean back 0.3 rad at rest, so the yellow paper shows from straight above. Struck, a leaf leans back a further 0.34 rad and comes to rest in under two seconds with two swings and a fast small flutter.
- The ladder follows the rail of the layout, corners bent to a radius. The way up and the way down of the layout run closer together than one lane is wide and meet at the foot, so a wire of one way is left out wherever it would stand in the path of a ball on the other way (within 58 px of that way's centre line). Hoops are cut the same way.
- The wedge is the triangle of the three post centres grown by 6 px, 46 to 53 px over the floor, as agreed with the hardware owner. Veins are thin faces a twentieth of a pixel over the top, drawn from a seed.
- Brass and gold tones were pulled toward pale yellow after the first look: polished brass under the warm lamps read orange, and orange belongs to the flippers, the plunger knob and the lift.
- No picture files: every pattern (windows, veins, sand, sky) is made in code from the seed 20261125. Asset sets of this tier: 0 MB.

## Agreed with other owners

- play_maker (ramps): wire radius 2.6 px; under wires 0.36 ball either side of the rail, centre 11 px over the rail's height (the rail's height is the underside of the ball); side wires 0.56 ball either side, centre 40 px over it; hoops of radius 2.2 wire round the outside on a 55.4 px arc about the ball's centre; a weld bead at every crossing in a fine mesh; steel 0xd0d4d8; a leg of wire from the hoop's lowest point to a round foot plate of radius 14 with two screws, two legs where the rail is over one ball high. I space hoops 1.5 balls and rungs half a ball.
- hardware_maker (posts): sling posts end in a flat shoulder 46 px over the floor, radius 7 px; my plate lies on it, 7 px thick; they put no screw heads on those posts, my brass screws are the fixing; the rubber's outer face is 11.5 px from the post centres, so the plate stays within 6 px of the triangle of post centres.
- lamp_lighter (lights): the HQ windows, lobby, canopy soffit, skylight and the beach case all sit on the one group `corporate.windows`, warm office white, lit with the general level. They do not change the level of `windows`; their lens level for a lit window is 1.45, so my factor on a pane is 1.25. They raised the lamp that lights surfaces which face up, so the wedge tops and roofs are no longer dim (their next push on `agent/lights`).

## Measured

See the report at the end of this file.

### First complete version (commit d7fd6fb, 16:54 UTC)

| Fact | Value | Command |
| --- | --- | --- |
| MEASURED tests | 63 files, 1064 tests pass | `npm test` |
| MEASURED build | built | `npm run build` |
| MEASURED bots | all clear | `npm run bots` |
| MEASURED colour calls of the seven models, low quality | 13 (HQ 3, beach 3, boardroom 2, revolving door 2, ladder 1, notes 1, wedges 1) | `npm run build && npm run counts -- --key tier-corporate --live low` |
| MEASURED triangles of the seven, colour and shadow passes, low quality | 43763 in `tier-corporate` (HQ 15800, boardroom 8432, ladder 5712, beach 4903, revolving door 4424, wedges 3604, notes 888) | same |
| MEASURED `tier-corporate` whole frame, low quality | before (main, all seven stand-ins): UNKNOWN at low, not taken; after: 188 draw calls, 221039 triangles | same |
| MEASURED `table-wide` whole frame, low quality | after: 475 draw calls, 299795 triangles (175 calls over the limit of 300, with other owners' stand-ins still in) | `npm run counts -- --key table-wide --live low` |
| MEASURED `tier-corporate` draft still | before: 27.3 s, 350412 triangles, 802 draw calls; after: 30.4 s, 530984 triangles, 679 draw calls | `npm run still -- --key tier-corporate --format hd --tier draft` |
| MEASURED `tier-corporate` review still | 54.2 s, 537066 triangles, 697 draw calls | `npm run still -- --key tier-corporate --format hd --tier review --force` |
| MEASURED asset sets of this tier | 0 MB in `assets-src/table/corporate/`, `public/assets/table/corporate/`, `assets-full/table/corporate/` (nothing in them) | `du -sh` |
