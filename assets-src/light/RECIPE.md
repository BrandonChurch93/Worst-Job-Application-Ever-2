# Light: how each texture is made

Nothing here is a file. The light has one texture that surfaces read, the studio environment, and it is drawn by code when the page starts. There is no downloaded file, no photo and no generated picture. The shadow maps and the glow's working pictures are render targets, not assets; their sizes are listed last so the memory is on record.

| Texture | What it is | Pixels | Megabytes |
| --- | --- | --- | --- |
| studio environment | what glossy surfaces reflect: one large soft light at the upper left, dim surroundings | 768 by 1024 | 6.00 |

STATED, not measured: the size follows from the code of the three.js release in `package.json`, which lays a 256 pixel cube out as 768 by 1024 texels of four half floats (8 bytes a texel): 6,291,456 bytes.

## studio environment (768 by 1024, RGBA half float, 6.00 MB)
Made by: `studioEnvironment(renderer)` in `src/post/studio.ts`.
From: four plain shapes with flat colours, no picture: a dim room (linear 0.09), a soft light of 26 by 20 units at 20 units toward `look.studio.direction` (linear 7.5, 7.2, 6.9), a wider and dimmer sheet behind it (linear 0.55) that gives the light its soft edge, and a long dim strip behind the viewer (linear 0.22) so a flat glossy face is never a black mirror.
Prompt or command: `studioEnvironment(renderer)`, once, when the engine starts. The shapes are drawn into a cube and blurred for every roughness by the renderer's own environment filter, with a first blur of 0.03.
Takes: UNKNOWN on its own; it is part of opening the page, which `npm run budget` gives as 0.8 s in all.
Why this one: the approved images show highlights only as one broad soft band on the upper left shoulder of glossy parts and a thin light line on upper left lips, never a window, a dot or a second light. One large soft rectangle with a soft edge gives that. The light in the reflection stands higher than the key throws its shadows from (`look.studio.direction` against `look.key.direction`): with both at the key's low angle, flat metal faces that look at the viewer went dark.
Date: 2026-11-25

## Render targets, for the record

| Target | Pixels | Bytes a texel | Megabytes |
| --- | --- | --- | --- |
| key shadow map, `live.quality` high and every still | 4096 by 4096 | 4 | 64.0 |
| fill shadow map | 2048 by 2048 | 4 | 16.0 |
| emitter shadow maps, two lamps, six faces each laid out in one picture of 2048 by 1024 | 2 of 2048 by 1024 | 4 | 16.0 |
| glow, half size down to 1/64, two sets, at `hd` | 960 by 540 and smaller | 8 | 11.1 |

STATED from the settings in `src/post/look.ts` and the layout the three.js release uses for a point light's shadow; not read back from the graphics card.
