# The measures and the diagnostic views: decisions

Phase 2, engine and blockout. `npm run measure` is `tools/measure.mjs`, its arithmetic is `tools/lib/measure-core.mjs` (pure, tested in `tests/measure.test.ts`), and what reads a picture is `tools/lib/measure-pictures.mjs`.

## How the measures are read

- Every number comes from `config/showcase.json` by the key `kit/07-QUALITY-BAR.md` names. The tool types none.
- The stills of a unit are its entries in `keys`, `stills` and `sheets` of the config, which is items 1 to 3 of the judged list for that unit. `site` is not a unit of `npm run measure`.
- "Each page at rest and each key" (M4, M5, M9) is every key of the unit and every entry of `stills` without a beat. A sheet has no `stillState` of a page, so no sheet is read by M4, M5, M6 or M9.
- `stillState` lists the type and the parts of the whole page, not only of what the camera sees. M4, M5 and M9 judge all of it. A run that fails on five stills of one page is printed once with the number of stills, and the record holds every item.
- M5 leaves out a part that a gag has moved: `stillState().layout[i].moved` is true for it (the Builder's reading, 10:44 UTC). The line says how many were left out and the record names them (`numbers.leftOutAsMoved`). A page at rest moves nothing, so a moved part in a still without a beat is itself a red item. A build whose `stillState` has no `moved` is read as before: every part is judged.
- M6, "at rest", is read as: the cursor is on the page and not in the ball, in a still from `home`. From a tier camera the ball's width is `ballScreenPx` and the cursor's length is `screenHeightPx`. A still from a tier camera in which the cursor is not in the ball is red.
- M7 reads every frame of the unit's beats in Node, and one frame on each side. The cursor "changes" from one frame to the next when its `acting` differs, its `damage` differs, a reaction begins or gives way to another (`reaction` goes from nothing to a name, or from one name to another), or the same reaction starts again (`reactionAt` is lower than on the frame before). A reaction that only ends is no change. The change may lie between the frame before and the frame of the event, or between that frame and the next. `reaction` and `reactionAt` are read as optional, so the measure runs on a build without them.
- M9: a key travels down by `scale.heights.keyTravel`, so a keycap may stand between `keycap - keyTravel` and `keycap`. A progress button is round: both sides are held to `scale.sizes.progressButton`. Field, button and heroButton are held by their height on the page.
- M10: an end of a rail "opens onto a tier" when it names a tier or an opening of a tier, onto a hold when it names a hold, onto a rail when it names a rail. The lift's doors are the openings whose id ends in `lift.door` and its elbows those whose id ends in `elbow`: two of each, each clearing `table.minClearanceBalls`. The display's characters in the tier's still are `charPx` times the picture pixels per page pixel of that tier's key, read from the cursor in `stillState`. `npm run paths` is run once and its exit code and its `PROBLEM` lines are taken as they are.
- A measure that cannot be made says `not yet` and is neither green nor red. The exit code is 2 when one measure is red, 0 when all that ran are green, 1 when the tool failed.
- `--tier` and `--format` default to `draft` and `hd`. The tier is printed and recorded, because a judged still is rendered at `final`.

## The hook of the views

`applyView(view, context)` in `src/diagnostics/views.ts`. It draws nothing itself: it changes the scene for one sample and gives back what puts the scene right again, so the engine's own passes stay as they are. `beauty` is never given to it, so a `beauty` still cannot be changed by it.

The context (`ViewContext`) carries: the scene and the camera, the picture's size, the camera's pose, the layout tree of the page on show, the frame's draw list (its runs of type are the shapes of kind `text`), the frame's events with their age in film frames, the lights of the rig, and two functions that are only called by the views that need them, `table()` for `tableState` and `colliders()` for the physics shapes. A view adds what it draws over the picture through one object (`Change`) that takes it away again.

`NEEDS.patch` is what this asks of files that are not mine:

- `src/app.ts`: builds the context from the frame it has just put on show, names the two lights of the rig `key` and `dome`, lets `setDiagnostic` take `lights.NAME`, and collects the events of the frame and of the half second before it, only when the view is `events`.
- `src/stage/types.ts`: `Collider`, and `colliders?()` on `PageLogic`.
- `src/pages/step3/index.ts`: `colliders()`, from the table's walls, posts, bumpers, slingshots, solid models, targets that stand, flippers at their angle, holds, openings, rails and balls. The `colliders` view is empty for a page without it.

## What each view draws

A view is drawn without tone and grade: a pixel is the sRGB code of a linear value from 0 to 1. A tool that reads a view decodes sRGB first.

- `standins`: as before, one colour for each stand-in name.
- `ids`: each part (`userData.standIn`) in a flat colour whose largest channel is 1, on black. A pixel whose largest channel is under one half shows nothing at all. M1 reads its edge.
- `height`: world z as grey, `0.5 + 0.5 z / (|z| + 64)`: one half is the page surface. `greyToHeight` turns it back. Where nothing is drawn the pixel is dark blue.
- `shadow`: the shadow term of all lights that cast, 1 is lit and 0 is in shadow, on every surface.
- `type`: meshes that carry `userData.type` in black, all else white, and a blue box for each run of the draw list, turned as the run is turned. Type that is hidden behind a part stays hidden.
- `layout`: the picture as it is, with the box of every node of the layout tree at the page surface, one colour for each kind.
- `events`: the picture as it is, with a ring and a cross where each event of this frame happens and a smaller, fainter ring for each event of the half second before. Red is an event that hits the cursor, cyan one that does not. A still without a beat has no events.
- `colliders`: the scene in one dark tone and the physics shapes over it, at the height of their tier's floor, one colour for each kind. A shape with a radius is a ring, or a thick bar when it has two points.
- `coverage`: the still's own camera. Bare floor black, everything that marks it white, nothing at all dark grey. A mesh is floor when it says `userData.coverage = 'floor'`, or, in the blockout, when it is the table's layout surface (`standIn` is `table-layout` and it is neither a shape nor type). Every other mesh is a mark unless it says `userData.coverage = 'none'`.
- `texels`: red is texels per screen pixel divided by 4, along the screen axis that has fewer; green is 1 on a textured pixel and 0 on an untextured one; blue is the blur circle in pixels divided by 8. A mesh is textured when its material has a `map` with an image.
- `lights`: the picture with one light group lit, the others and the studio environment at zero, and the glow of materials that do not belong to the group at zero. `lights` is the first group, `lights.NAME` the one named. A light's group is `userData.lightGroup`, or its name.

## What the finished look has to expose

- Textures (M2, `texels`): nothing beyond a `map` on the material of each textured mesh, with `repeat` set if it repeats. A mesh that takes several maps at different scales is judged by `map` alone. If the engine gets a lens with focus, the blur circle the view computes (`aperture * |d - focus| / d` at the focus plane, in pixels) has to be the engine's own, from `CameraPose.focus` and `CameraPose.aperture`.
- The mark `userData.texels = 'through'` (M2, `texels`): for a mesh that only darkens or lightens the surface under it and has no surface detail of its own, such as a drawn shadow. The view leaves such a mesh out, so the pixel shows the surface the eye sees there. It exists because the view repaints every mesh opaque: the ball's shadow, a clear quad about 500 px square on the floor, hid the textured floor under the ball and was itself counted as bare.
- The mark stands on `ball.shadow` and on nothing else. At the key `youre-fired` (final tier, hd) before it: 55,991 textured pixels, 1 counted, 1 soft. With it: 337,386 textured, 254,134 counted, 741 soft, a share of 0.0029.
- Light groups (`lights`): each light of the machine carries `userData.lightGroup`, and each mesh that glows with a group carries the same name, so its glow stays on with its group. The lights have to be in the context's list: today `src/app.ts` gives the rig's two.
- Coverage (M8): when the playfield is one mesh with its lines in a texture, the printed lines are not meshes any more. The table then has to give the lines to the view: either as flat meshes that carry `userData.coverage = 'mark'` and are drawn only in this view, or the measure has to read the playfield's texture. That is a decision for the round in which the playfield gets its print.
- Parts (`ids`, M1): every mesh carries `userData.standIn` with its part's name, as now.

## How the measures that read a picture are made

- The stills of the measures are rendered through `tools/lib/capture.mjs` into `out/work/measures/stills/`, one at a time in one browser, each with its record, and a still whose record still holds is used again. A run with `--only M4,M5,M6,M7,M9,M10` opens no browser.
- M1 renders every judged still of the unit as `beauty` and takes `invalidValues` from `pictureStats()` after it. For a still from `home` it renders the `ids` view as well and counts the pixels on the four edges whose largest channel is under one half: those show nothing at all. The cursor's place is `stillState`'s, against the hd frame. A sheet has no cursor state and is read for invalid values only.
- M2 renders every judged still in the `texels` view. A pixel is textured when its green is over one half, counted when its blur circle is under `detail.focusCocPx`, soft when its texels per pixel are under `detail.minTexelsPerPixel`. With no textured pixel in the unit the measure says `not yet`: that is the blockout.
- M3 takes the mean square of the Laplacian of the luminance, over the whole key and over the approved image scaled to the key's size (`fit: cover`, the resize kernel of sharp), and divides. It is made on the blockout too: a number under the limit there says that the stand-in picture has less fine detail than the approved image, which is true. Draft tier and the `hd` format are not the judged ones, and the tier is printed.
- M8 takes each tier's key from its tier camera in the `coverage` view. The radius is `table.bareDistanceFraction` times `table.tierWidthBalls` times the ball's width in the picture (`ballScreenPx` of `stillState`). The share is the bare floor further than the radius from any mark, over every pixel of the tier in the picture, the floor in sight and what stands on it together. The record also holds the floor in sight alone (`floorPixelsInSight`), for the stricter reading.
- A view's picture is the mean of the tier's samples, so a pixel on the border of two parts lies between their two values. The thresholds above put such a pixel on the side that covers more of it.
