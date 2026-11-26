# Step 2: the slot machine and the crank, how each asset is made

Nothing here is a file. Every solid is built from numbers in `src/pages/step2/real/crank.ts`, `slot.ts` and `slot-kit.ts`, and every picture is computed from the seed when the part is first made. No downloaded file, no photograph, no generated picture, no picture with a word in it.

## Pictures

| Picture | What it is | Made by | Size | Memory |
| --- | --- | --- | --- | --- |
| Coin face | A normal map: a raised rim, a ring of 28 beads, a five pointed star struck in the middle, and fine wear from two octaves of seeded noise | `coinHeight()` through `normalsFrom()` in `slot.ts`, seed `config.seed + 211` | 256 x 256, RGBA 8 bit | 0.25 MB, 0.33 MB with its smaller copies |
| Meter segment, unlit | Colour: clear glass seen from above, a light rim, a darker core, a patch of gathered light on the lower right wall | `own()` in `crank.ts`, no seed, pure geometry of the pill | 32 x 128, RGBA 8 bit | 0.016 MB, 0.021 MB with its smaller copies |
| Meter segment, lit | Emission: yellow white along the centre line, orange at the rim | `own()` in `crank.ts`, no seed | 32 x 128, RGBA 8 bit | 0.016 MB, 0.021 MB with its smaller copies |

Total: 0.37 MB.

Shared pictures that are read and not copied: the brushing of `materials().aluminium` (the cabinet's frame reads it at a finer repeat through a clone that shares the same image), the turned face of `materials().aluminiumTurned` (the crank's bezel and hub cap).

## Solids

- Turned parts (`lathe()`): the crank's bezel wall, polished rim, turned face, hub neck, hub cap, washer, screw rings; the three drums; the lever's knob, rod and pivot barrel; the pins of the pay line; the faces of the coin.
- Swept parts (`loft()`, `sweep()`): the cabinet's frame with its round over and its chamfer down to the glass, the dark well, the glass, the payout mouth, the mount, the crank's arm (an eye round the hub with two fillets into a tapered bar), the meter segments.
- The screws of the bezel: a chamfered ring, a face with a cross cut through it (`THREE.ExtrudeGeometry` with a hole), a dark floor under the cut.
- The grip (`gripGeometry()`): a superellipse of power 3.2 turned round its long axis, a little fuller at the free end.
- The coin (`coinGeometry()`): 64 teeth round the edge as 128 flat facets, two faces with a lip, one geometry. All coins are one `THREE.InstancedMesh`, one draw call.
- The glass's sheen (`sheenGeometry()`): a grid of 49 by 17 points with a colour at each, drawn additively.

## Materials made here, all through `studio()`

- Crank: `glass` (meter, unlit), `lit` (meter, lit, emissive), `washer` (dark steel under the hub and in the screw cuts), `bar` (the arm: the shared aluminium, darker, brushed along its length).
- Slot: `drum` (off white enamel with painted shade), `glass` (dark, 20% opaque, no depth write), `well` and `mouth` (dark, never black), `gold` (the coins), `rod` (the lever), `frame` (the shared aluminium, darker and finer).
- Taken from `materials()`: `orange` (grip, knob, pay line), `chrome`, `steel`, `aluminiumSatin`, `aluminiumTurned`.
- Not through `studio()`: the sheen on the glass, a `MeshBasicMaterial` drawn additively, as the contract asks of a thing that only adds light.
