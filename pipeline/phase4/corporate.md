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

### Later decisions (after the first complete version)

- The windows colour is the lights owner's constant; I import it. Lamps behind glass are written as a white (1, 0.9, 0.72) divided by that constant, so the panes stay office white whatever the constant becomes. The lights owner then moved the constant from (1, 0.74, 0.4) to (1, 0.83, 0.6) and cut the lamp at the door from 1.3 to 0.85 so the steel no longer reads gold; after that I took the blue out of the HQ's steel again (0x9ca8bd, dark 0x727d8f, bright trim 0xbac4d4).
- The tower is steel and dark teal glass, no gold on it: every gold fin, coping line and roof finial became bright steel. Brass stays at the portal, the door leaves, the revolving door and the carpet rods.
- Panes are 24 px wide and 27 px high (were 17 by 20.5) in a thin dark frame with a bright fin at every third column, set evenly about the middle of each wall. Behind a lit pane: a teal ceiling, a darker wall, a dark sill, and one to three rows of small ceiling lamps that shrink with depth. Four kinds of room, a run of one to four panes each.
- The glass of the lobby and of the door leaves is drawn on the material that glows, at a quarter of its colour with a share of 4 (`HALL`), so it gives light without also being lit to white by the lamps in front of it. Its light is a smooth sheet, colour set at every corner (`Geo.blend`), amber where dim and cream where bright, with lamp bars over it and a dark desk at the foot of each lobby pane.
- The door leaves are one instanced mesh on the material that glows (brass frame at share 0, glass at share 4), still one call.
- The roofs are paved (slabs of slightly different grey, dark joints) and carry plant joined by ducts, a hatch, a dish, a mast and two fans; the skylight is glass over the lit hall with four lamps under it.
- The ladder is one frame: the outer under wire and the outer guide wire run the whole loop; an inner under wire stands only where it is clear of the other lane; a rung every quarter ball, across one lane or across both where the lanes run as one; cradles every 1.5 balls on a leg and a foot, moved along where a sling, post, insert, lamp or model is in the way. The layout runs the down leg through the tip of the right sling: any wire point over a sling plate is lifted to clear the marble (plate top + wire radius + 1.6 px). Wire colour is scaled by how far its surface faces up, so the flanks are dark as polished wire is.
- The notes lean back 0.62 rad at rest (0.3 read as a line from above), each with its own lean and turn; their tops reach about 16 px over the boardroom's front edge, so the chairs were set 5 px back.
- The revolving door's panes have no frame round them: a brass rail under, a 2.2 px trim over and at the free edge, two clamps at the post, and a pale green strip on the top and outer edge of each pane in the solid mesh, which is what is seen of the glass from straight above.
- The beach: sand as one smooth sheet (44 by 30, colour at every corner from the slope, the wet line and soft shade under the palm, the chair and the parasol), sea in seven blended bands, a palm of thirteen feathered fronds in two tiers.
- The fascia and the two piers are graded from their upper edge to their lip in vertex colour (`Geo.grade`), as brushed steel under lamps that stand over it.
- `Geo` gained `blend` (a face with a colour at each corner), `tint` (colour by the way a surface faces) and `grade` (colour by place). Nothing outside my folder changed.

## Agreed with other owners

- play_maker (ramps): wire radius 2.6 px; under wires 0.36 ball either side of the rail, centre 11 px over the rail's height (the rail's height is the underside of the ball); side wires 0.56 ball either side, centre 40 px over it; hoops of radius 2.2 wire round the outside on a 55.4 px arc about the ball's centre; a weld bead at every crossing in a fine mesh; steel 0xd0d4d8; a leg of wire from the hoop's lowest point to a round foot plate of radius 14 with two screws, two legs where the rail is over one ball high. I space hoops 1.5 balls and rungs half a ball.
- hardware_maker (posts): sling posts end in a flat shoulder 46 px over the floor, radius 7 px; my plate lies on it, 7 px thick; they put no screw heads on those posts, my brass screws are the fixing; the rubber's outer face is 11.5 px from the post centres, so the plate stays within 6 px of the triangle of post centres.
- lamp_lighter (lights): the HQ windows, lobby, canopy soffit, skylight and the beach case all sit on the one group `corporate.windows`, warm office white, lit with the general level. They do not change the level of `windows`; their lens level for a lit window is 1.45, so my factor on a pane is 1.15. They raised the lamp that lights surfaces which face up, so the wedge tops and roofs are no longer dim (their next push on `agent/lights`).

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
| MEASURED asset sets of this tier | the three folders do not exist: 0 MB | `du -sh assets-src/table/corporate public/assets/table/corporate assets-full/table/corporate` |

### Final version (18:25 UTC, main merged at fde6688)

| Fact | Value | Command |
| --- | --- | --- |
| MEASURED gates | tsc clean, 1146 tests pass, build OK, bots all clear | `npx tsc --noEmit -p . && npm test && npm run build && npm run bots` |
| MEASURED colour calls of the seven, low quality | 13 of 14 (HQ 3, beach 3, boardroom 2, revolving door 2, ladder 1, notes 1, wedges 1) | `npm run build && npm run counts -- --key tier-corporate --live low` |
| MEASURED triangles of the seven, colour and shadow passes, low quality | 58001 in `tier-corporate` (HQ 20644, boardroom 11584, ladder 8184, beach 7917, revolving door 4824, wedges 3960, notes 888) | same |
| MEASURED triangles of the seven as built, once each | 45196, of which 34711 not fine (HQ 12982 + 2884 fine, beach 6921, boardroom 5792 + 2399, ladder 4092 + 3598, revolving door 2500 + 1072, wedges 1980, notes 444 + 532) | a count over `parts[...].make` in vitest, the same sum as `tests/table-corporate.test.ts` |
| MEASURED `tier-corporate` whole frame, low quality | 121 draw calls, 347828 triangles (first version: 188 calls, 221039 triangles; before, all stand-ins: UNKNOWN at low) | `npm run counts -- --key tier-corporate --live low` |
| MEASURED `table-wide` whole frame, low quality | 220 draw calls, 542075 triangles (first version: 475 calls, 299795 triangles) | `npm run counts -- --key table-wide --live low` |
| MEASURED `lobby-doors` whole frame, low quality | 137 draw calls, 372991 triangles | `npm run counts -- --key lobby-doors --live low` |
| MEASURED `tier-corporate` draft still | 36.1 s, 908005 triangles, 597 draw calls (before, all stand-ins: 27.3 s, 350412 triangles, 802 draw calls) | `npm run still -- --key tier-corporate --format hd --tier draft` |
| MEASURED `tier-corporate` review still | 63.9 s, 928549 triangles, 603 draw calls | `npm run still -- --key tier-corporate --format hd --tier review --force` |
| MEASURED `lobby-doors` stills | draft 33.4 s, 968751 triangles, 620 draw calls; review 64.1 s, 981545 triangles, 624 draw calls | `npm run still -- --key lobby-doors --format hd --tier draft` and `--tier review --force` |

The whole-frame numbers hold every owner's parts as they stood on main at that time, so the rise in triangles between the first and the final version is mostly theirs (the type alone is 111560 at low).

### After the report of 18:30 (18:47 UTC, three more commits)

| Fact | Value | Command |
| --- | --- | --- |
| MEASURED gates | tsc clean, 1146 tests pass, build OK, bots all clear | `npx tsc --noEmit -p . && npm test && npm run build && npm run bots` |
| MEASURED colour calls of the seven, low quality | 13 of 14, unchanged | `npm run build && npm run counts -- --key tier-corporate --live low` |
| MEASURED triangles of the HQ, colour and shadow passes, low quality | 20884 (was 20644); the other six unchanged, so 58241 for the seven | same |
| MEASURED triangles of the seven as built, once each | 45316, of which 34831 not fine | the count of `tests/table-corporate.test.ts`, printed once |
| MEASURED whole frame, low quality | `tier-corporate` 121 calls, 347772 triangles; `lobby-doors` 137 calls, 372935 triangles; `table-wide` 220 calls, 541723 triangles | `npm run counts -- --key <key> --live low` |
| MEASURED stills | `tier-corporate` draft 37.7 s, 922967 triangles, 597 calls; `lobby-doors` draft 34.4 s, 985687 triangles, 621 calls; `lobby-doors` review 65.0 s, 998353 triangles, 625 calls | `npm run still -- --key <key> --format hd --tier draft` and `--tier review --force` |

UNKNOWN: why the whole frames at low hold a few hundred triangles fewer than at 18:25 while the HQ holds 240 more. Not looked into.

What changed: the wall of dark glass takes a broad sheen (`Geo.grade` over the panes of each wall); the door leaves show a hall in one-point view behind the glass (back wall, a lift with its lamp, a lit side panel, three rows of ceiling lamps, a pale floor) in place of three lamp bars; the marble of the wedges went from 0xe6ebf5 to 0xc9cfdc so the veins hold under the sling lamp.

Tried and taken back: turning the shading normal of the notes' paper upward by 0.55 rad. MEASURED by eye in one draft still: no visible change, the notes stand in the shade of the left wall, so the light is the cause and not the paper.

## The three least real things

1. The tower from the low camera still reads as a model of a building lit evenly: the panes have no reflection of the lamps and the floor in them, and the steel has no streak of highlight, because the glass is drawn as light and not as glass over a room.
2. The lobby glass beside the doors is still a flat cream sheet with lamp bars and a desk line. The door leaves now show a drawn hall, but it is a flat drawing on the glass: it does not shift as the camera moves.
3. The ladder from straight above is a flat cage of even grey wire; the approved image shows a chrome ramp with hard highlights and a deep shadow under it. The notes are dim olive leaves under the boardroom's shade.
