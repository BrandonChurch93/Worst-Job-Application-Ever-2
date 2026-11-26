# The quality levels of the live site: notes of the build agent `site_levels`

Part `quality-levels` (kit/03-METHOD.md, section 14). Branch `agent/site-levels`.
Every number below is MEASURED with the command beside it, STATED by the code or the kit, or UNKNOWN.

## What each level does, and where

| word of `live.quality` | read by | what it does |
|---|---|---|
| `softShadows: accumulated at rest` | `src/core/levelPlan.ts`, `Engine.frame` | a page at rest gathers 64 frames, the light moved over its area as in a computed picture |
| `softShadows: filtered` | the same | the light never moves: one sample with the filtered lookup; a page at rest gathers 8 frames in which only the taps of the filter turn, then the picture is kept and nothing is drawn |
| `softShadows: baked` | the same and `src/core/levelShadows.ts` | as `filtered`, and the shadows of what stands still are drawn once into the key's map and kept; only what moves is drawn into the map of each frame |
| `glass` | `src/core/levelPlan.ts` | see "Glass" |
| `particleFraction` | `src/core/levelSmall.ts`, `App.put` | the share of the small things of each emitter that is drawn |

## Decisions

1. Kept shadows are three's own shadow pass over the still things alone, into the same kind of map, through the same shadow camera. A kept frame draws one square that writes the kept depths into the frame's map, then the things that move. So a kept frame holds the depths a frame drawn whole would hold.
2. A thing counts as still when its world matrix, its geometry, its instances and its shape in the frame's list have not changed for `STILL.holdFrames` (12) frames. The cursor, skinned things and things with their own depth material always count as moving.
3. Whenever a kept thing changes, the frame bakes again without it. A thing that breaks the kept map again and again waits twice as long each time (`STILL.maxBreaks`), so a blinking thing does not cause a bake at every blink.
4. While the shadow camera moves (the camera scrolls), every frame is drawn whole, as before this work.
5. `Engine.picture()` never keeps shadows: a still at a level (`renderStill` with `live`) draws the whole map, so the counts of G15 are the worst case of a live frame.
6. The picker counts a frame longer than 0.4 s as a stall, since the frame loop never reports more than 0.5 s (`frameSeconds` in `src/main.ts`), and the old limit of 1 s could not be reached. After a stall it leaves out 6 frames. Six stalls in a row are no stall: the machine is that slow, and it steps down.
7. The film bar: `fitPicture` in `src/core/levelFit.ts` takes `FILM_BAR_PX` (56, the height `.fitted` of `src/ui/interface.module.css` uses) off the window's height while the mode is film. `sizer()` takes the mode as an argument; its call in `play()` passes it.
8. `startLevel` and `levelIsFixed` of `src/main.ts` call `src/core/levelStart.ts`, so they have tests.
9. Small things: an emitter says what it is on its own object, `userData.small`. That mark lies in files that are not mine: `pipeline/phase5/site-levels-NEEDS.patch`.
