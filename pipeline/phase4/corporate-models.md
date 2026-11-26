# Corporate models, second owner

Branch `agent/corporate-models`, from `origin/main` 49569eb. Started 02:35 UTC. The first owner's notes are in `corporate.md`.

## What a quick look at the approved images misses

1. The tower is glass with rooms behind it, not a painted box: in `lobby-doors` every bay shows rows of ceiling lamps deep inside, seen from below at an angle, so the floors and ceilings must be there and the glass must be see through and dark blue green.
2. The band is wider than the glass under it and its lower lip is chamfered and bright: it throws a dark strip on the lobby glass, and its letters stand on a brushed face whose streaks run the long way.
3. The lobby glass mirrors the two globe lamps: there is a second, dimmer pair of globes behind the panes.
4. From above the tower is a roof with a glass middle over a lit hall, and the front leans in by only a few pixels: what says "office tower" there is what is seen down through the roof.
5. The revolving door has no frame at all: four thick clear slabs with bright edges, held at the post by small brass clamps; the brass is in the post and its collars only.

## Baseline (MEASURED 02:39 UTC, `npm run build && npm run counts -- --key <key> --live low`)

| key | calls of my folder | triangles of my folder | whole frame calls | whole frame triangles |
| --- | --- | --- | --- | --- |
| table-wide | 21 | 57169 | 216 | 473936 |
| tier-corporate | 22 | 58165 | 118 | 265074 |
| lobby-doors | 19 | (not summed) | 139 | 333801 |

Per part at table-wide (meshes, colour, shadow, calls, triangles): hq 3/3/2/5/20884; boardroom 2/2/2/4/11584; beach 3/3/0/3/6921; revolving 2/2/1/3/4824; ladder 1/1/1/2/8184; wedges 1/1/1/2/3884; notes 1/1/1/2/888.

## Decisions

- HQ rebuilt as one straight shaft of glass over a lobby, with an open hall up the middle and a glazed lantern in the roof, instead of three stepped blocks with plant on top. The rooms are real: floors, ceilings with lamps, desks, lifts, columns. The glass is real and see through.
- A fourth shared material, `pane`: glass whose tint is the vertex colour and whose density is the second texture coordinate. The tower, the lobby, the lantern and the door leaves use it. The test of the folder allows it.
- The canopy and the vestibule are gone: the band is the canopy.
- The door leaves cast no shadow now, and their glass is a second instanced mesh marked `fine`, so the low tier draws the brass leaves without glass. This keeps the calls of HQ at five.
- The mirrored globes are two dim spheres behind the lobby glass at the mirrored places of the layout posts `corporate.globe.left` and `corporate.globe.right`.
- The seven rods and the cross strip of the carpet are removed; the two gold lines along the long edges stay.
- The front face stays upright: the place of the roof sign is the layout's.
- The solid material of the folder passes through the frame owner's `steel()` so polished faces show the room of the tier.
