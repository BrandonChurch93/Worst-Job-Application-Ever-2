# Damage fix round: textures

No new texture and no new asset file in this round. Everything the fix round changed is geometry (`src/cursor/model/shape.ts`, `deform.ts`, `body.ts`, `strips.ts`) and shader code (`material.ts`, `effects.ts`).

| Texture | Content | Size | Memory | Made by |
| --- | --- | --- | --- | --- |
| cursor detail | three bands of seeded value noise and a cell pattern, read for grain, crust, crack lines, cloud | 512 by 512 px, RGBA, 8 bit | 1.0 MB, about 1.33 MB with its mips | `detailData()` in `src/cursor/model/texture.ts`, seeded through `src/core/random.ts` |

Unchanged from the first build: see `assets-src/cursor-model/RECIPE.md`. To remake it: `detailTexture()` builds it at start from the seed in `config`; no file is read.
