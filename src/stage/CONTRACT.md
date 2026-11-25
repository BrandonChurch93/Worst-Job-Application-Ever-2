# The stage contract

This is how a page plugs into the one stage. Everything named here is plain TypeScript with no three.js and no DOM, so it runs the same in the browser and in Node.

## Coordinates

- Page pixels. `x` runs right from 0 to 1920. `y` runs down from 0. A page is 1920 wide and at least 1080 tall.
- Heights are page pixels above the page surface. Below the surface they are negative.
- The world the pictures are drawn in is `(x - 960, 540 - y, z)`. A page needs it only for its own cameras: `toWorld` in `src/stage/camera.ts`.
- A driver gives the pointer in viewport pixels. The stage adds the page's scroll before a page sees it, so `io.pointer` is in page pixels.

## A page

`src/pages/<page>/index.ts` exports `makePage(): PageLogic`, as `src/stage/types.ts` types it. It is called after the fonts are loaded, so it may measure type. `src/pages/stub.ts` is a whole page in 76 lines: read it first.

A page module may also export `prepare(): Promise<void>`. It is awaited once before any page is made, in the browser, in the tests and in the tools: the place to start a library that starts asynchronously, such as the physics.

- `layout` is the tree of the page at rest and of every run of type it can ever show. Build it with `src/shell/layout.ts` and `src/shell/parts.ts`. `layoutProblems` must find nothing in it: nothing outside the page, nothing overlapping, the parts of a row or a column sharing an edge and standing at equal gaps.
- `gags` lists the page's gags in order. A gag's `id` is the id of its beat in `film.beats`, and its `event` is that beat's event.
- `reset(ctx)` puts the page in its first state. `ctx.mode` is `live` or `film`. In film mode `ctx.applicant` holds the applicant from the config. `ctx.variant` is `''`, or `rejected` for the careers page after the rejection.
- `step(io)` advances one step of `1 / sim.stepHz` seconds. Everything stepped moves here and nowhere else. No clock, no `Math.random`: take a stream from `src/core/random.ts` with `ctx.seed` and keep its state in `save()`.
- `save()` returns plain data that `JSON.stringify` can write, and `load()` takes it back. Together they hold everything `step` reads, so that the state after `load(save())` runs on exactly as before. The stage saves once a simulated second and seeks by loading.
- `draw(out)` pushes one `Shape` for everything that can be seen now, over the whole page and not only the screen in view. Call `drawLayout` from `src/shell/layout.ts` for the tree, then push what moves. A shape's `id` stays the same while the thing exists, because the stage blends two steps by id.
- `scroll()` is how far down the page the view is, in page pixels. A tall page moves it itself: by `io.pointer.wheel` in live mode, by its script in film mode.
- `view()` is the live camera when it is not `home` at the page's scroll, and null otherwise. `camera(name, time)` gives the page's own named cameras from `cameras` in the config, and `film` for the film's camera at that time, and null for a name it does not have.
- `script(time)` is the film: the pointer in viewport pixels as a function of the seconds since the page arrived. It must be a pure function of time.
- `hint()` is what a capable visitor would do now, in page pixels: where to be, whether to press, which flipper to hold, which key to type. The bots read it. `dodge` is where to be to stay out of a hit.
- `skip()` plays the step's ending, as the skip link does.
- `done()` turns true when the page is over. The stage then turns the page.
- `gag()` is the id of the gag in progress, or null.
- `control` is `pointer`, or `flippers` while the visitor has the flippers in place of the pointer. It may be a getter.
- `ignoring()` is true while the page does not listen to the visitor's control. It may not stay true for longer than `live.controlTakenMaxSeconds`.
- `states()` names the states the page is in now, as the layout tree uses them: `rest` at first.
- `sheet(id)` gives the build's version of an approved sheet of `sheets` in the config that belongs to the page: a draw list, the cursors in it and the camera. Null for a sheet it does not have.
- `tableState()` is the pinball page's alone.

## Shapes

A shape is `box`, `disc`, `capsule`, `ball`, `text` or `well`, at `x, y, w, h` in page pixels, from height `z0` to `z1`, in one of the tones of `Tone`. `part` is the name of its part in `parts/PARTS.json`.

- `r` rounds a box's corners. `rot` turns a shape about its centre on the page, in radians, clockwise as seen. `turnX` and `turnY` tip it.
- `ball` is a sphere `w` across standing on `z0`.
- `text` holds `words` and `type`, lies at `z1`, and has its top left at `x, y`: `y` is the top of the capitals.
- `pocket: true` marks a shallow recess of the layout, such as a field. The blockout draws it as a flat darker patch.
- A still's state gives each part's `height` as its top above the page surface, whatever it stands on. A part of the pinball machine that lies on another part takes a kind `scale.kinds` does not list, since the scale measure leaves the machine out.
- `moved: true` says a gag holds the shape away from its place in the layout tree on this frame. The layout measure leaves it out and counts it. A shape at rest never carries it.
- `mechanism: true` marks the working part of a machine, the part whose top the scale measure holds to `scale.heights.machineMinTop`. A deck or a housing is not one.
- The cursor's state a still reports carries `reaction` and `reactionAt` beside `acting` and `damage`: the reaction playing and the share of it that has passed. A strike is answered when damage or acting changes, or a reaction starts or starts again, on the frame of the strike or the next.
- `well` is a real opening in the slab, `x, y, w, h`, with its floor at `z0`. Things in it are ordinary shapes with negative heights. Wells may touch: where two meet the step between their floors is drawn.
- `fixed: true` keeps a shape in the picture while the page turns. Everything else outside the screen in view is dropped during a turn.

## Words

A shape or a layout node never holds a string to show. It holds a key:

- `copy:step1.heading` for a word in `content/copy.json`.
- `applicant.filmFirstName` for a word in the config.
- `data:keyboard.keys.q` for a word in a data file beside the code, registered with `registerData` from `src/shell/words.ts`. Only legends and numerals.
- `runtime:step1.firstName` with `text`, for what is made at run time: typed input, a counter, the score display. Nothing else.

## Events

`io.emit(name, x, y, hitsCursor)` reports that something happened, at a place in page pixels. In live mode a gag emits the same events as in film mode. The names of the film are the `event` entries of `film.beats`. Sound hangs on them, and so do the checks. The stage emits `page-turn` itself when a page starts to leave, and the cursor emits `step` as it walks.

## The cursor

`io.cursor` is the one `CursorBody` from `src/cursor/body.ts`. The stage moves it toward the pointer. It has no face. Its size never changes.

- `act(state)` sets how it carries itself. `react(name)` plays a short reaction. `hurt(kind)` damages it, and the damage heals inside `cursor.damageHealSeconds` by itself. `knock(vx, vy, vz)` throws it.
- `take(by)` takes it from the visitor, `drive(x, y, z)` or `place(x, y, z)` moves it while taken, and `release()` hands it back with an eased blend. It hands itself back inside `live.controlTakenMaxSeconds`.
- `setArms(true, [left, right])` gives it arms that reach to two places on the page. Only in the beat `cursor.armsOnlyInBeat`. `setArms(false)` takes them away.
- `seal(true)` puts it in the clear ball. While sealed it is never handed back by itself: `take('ball')`, then `place` it at the ball's centre every step, then `seal(false)` and `release()`.
- `setOnPage(false)` hides it.

## Film timing

- A unit of the film is one page, except `decision`, which is step 5 and then the careers page again with the variant `rejected`.
- Beat times count from the unit's start, and so does `io.time` on a unit's first page.
- The first 0.5 s of every unit but the first is the page arriving, with the cursor in the air at the hand-off place. The last 0.5 s of every unit but the last is the page leaving. `step` runs through both, but the pointer cannot press.
- In film mode the stage starts the leave at the unit's seconds less 0.5 s, whatever `done()` says. In live mode it starts when `done()` turns true.
- Every beat with an event must report it inside the beat, give or take `film.beatToleranceSeconds`. The page that follows may not show damage on its first frame, and no damage may last longer than `cursor.damageHealSeconds`.

## Rules a gag keeps

- It does not know which driver is running.
- It ends by itself. With a pointer that never moves it still reaches its end: once a gag has run for `live.skipLinkAfterSeconds` it plays its own ending and hands control back.
- It keeps its live way out, also in film mode.
- Every visitor can finish and every visitor is rejected. There is no fail state.

## Looking at a page

- `npm run still -- --page <unit> --format preview --tier draft` renders the page at rest into `out/work/stills/`. `--beat <id> --at 0.5` gives a moment of the film, `--scroll 0.5` moves down a tall page, `--camera <name>` picks a camera, and `--id`, `--key` and `--sheet` render a judged still, a key or a sheet by name.
- `npm run bots` plays the whole live site with each bot and prints what it reached. `--bot keen --seed 20261124` runs one.
- `npm test` and `npm run build` must stay green.
- The site itself: `npm run build`, serve `dist/`, and open `index.html?mode=live&step=3` or `?mode=film&unit=pinball`.

## What the blockout round judges

The fourth critic round looks at stand-in pictures and judges only this: whether each page is laid out like a real web page, with aligned columns, even spacing and a clear order of importance; whether its text can be read; the order and pace of the beats; whether it is clear from the placeholders what each beat is; whether each pinball camera frames what it is for; and whether the controls are placed well and clear of the page's content.

## Making a part real

A stand-in is what `src/shell/view.ts` draws for a shape when nobody has made it: a grey solid, plain type. A part becomes real when its owner gives the view a maker for it. The view, the registry and the types are in `src/shell/view.ts`, `src/real/index.ts` and `src/real/types.ts`, and they are frozen: an owner fills its own file and nothing else.

- A `PartMaker` answers three questions about one shape of the draw list. `key(s, ctx)`: null while this shape is still a stand-in, `''` when another shape's object draws it, otherwise a string that names everything the object is built from. `make(s, ctx)`: the object, a `THREE.Object3D`, built round the shape's centre on the page, with its own z = 0 at the shape's `z0`, x to the right and y up the page. `pose(o, s, ctx)`: called for every sample of every frame, it moves what moves and builds nothing.
- The view puts the object at the shape's centre and `z0`, turns it by `rot`, `turnX` and `turnY`, and then calls `pose`, which may move it again. It builds the object once for each key and keeps it while the key stays the same, so a key never holds a number that changes every frame. What changes every frame goes through `pose`: read `s.z0`, `s.z1`, `s.v` and the other shapes in `ctx.byId`.
- A page passes numbers to its maker in `v` on the shape: how far a key is down, where a barrel points, how charged it is. The stage blends `v` between sim steps like `x` and `y`, so they must be numbers that may be blended. `role` on a shape is the kind its layout node has: `field`, `button`, `keycap`.
- A maker reads no clock and draws no random number. `ctx.time` is the frame's time in seconds, the same on every machine. Whatever flickers, drifts or sparks is a pure function of `ctx.time` and a seed.
- A part that gives off light says so in `pose`: `ctx.light({ x, y, z, colour, power, reach })`, in page pixels and heights. The light rig turns that into light on the page for this frame.
- A shape that is `text` goes to its part's maker first and, when that says null, to the type maker in `src/shell/real/type.ts`. So a part may set its own legends, or leave them to the type.
- The slab is made by the `GroundMaker` in `src/shell/real/ground.ts`: the whole surface in world units, with a real pocket for every shape that carries `pocket: true` and a real opening for every `well`. While it is real, type on a pocket's floor lies at its own height.
- A real mesh does not carry `userData.standIn`. The view writes `userData.part` and `userData.shape` on every mesh of a made object, and `userData.type` on those of a run of type, so the diagnostic views still find them. A mesh that must keep its own `renderOrder` sets `userData.order`.
- The view frees nothing a maker made. `drop(o)` tells the maker the object is gone. Share geometry and materials between objects wherever you can: a keyboard is some sixty keys.
- The cursor is made of five parts in `src/cursor/`: `model/body.ts`, `model/effects.ts`, `act/acting.ts`, `act/damage.ts`, `act/arms.ts`, put together by `src/cursor/view.ts` as `src/cursor/contract.ts` says. Each exports null until it is made, and the view draws the stand-in for what is missing.
- `info().standIns` and `filmState().standIns` list a part while any shape of it is still drawn as a stand-in. Check G13 reads them and the `standins` view.

## Making the table real

The table has hundreds of shapes, so its parts are built whole, zone by zone, and not shape by shape. The page of step 3 has seven zones from the top: `first`, `marquee`, `corporate`, `office`, `street`, `apron`, `last` (`ZONES` in `src/table/draw.ts`). The three tiers are 1920 by 1080 each and their floors lie 96, 192 and 288 below the page.

- For every part and every zone the part stands in, the draw list carries one shape of kind `anchor`, named `whole.<part>.<zone>`. An anchor is never drawn. It spans its zone, so its object sits at the middle of the zone with z = 0 on the zone's floor, x to the right and y up the page, in page pixels. One ball is 96.
- `src/table/real/zone.ts` has what an owner needs: `zoneOf(anchor)`, `local`, `localBalls` and `localOf` to put a place of `src/table/layout.ts` or a shape of the draw list into the zone's frame, `shapesIn(ctx, part, zone)`, and `whole(part, { version, build, pose, drop })`, which makes a `PartMaker` that answers the part's anchors with one object for each zone and answers the part's single shapes with `''`. `build` throws when it leaves a zone empty that has shapes of the part.
- While an anchor is answered with null, its part stays on the list of stand-ins, also when every single shape of it is real. A part that is built shape by shape answers its anchors with `''`.
- Everything that moves carries its state in `v` on its shape, read in `pose` through `ctx.byId`: a flipper its angle in radians, 0 when level and positive when its tip is below its pivot (`flipper.<id>`), a target 1 when it is up (`target.<id>`), an insert and a lamp 1 when lit (`insert.<id>`, `lamp.<id>`), the plunger how far it is pulled, 0 to 1 (`plunger.rod`), the lobby doors 1 when shut (`hq.door.left`). The balls are single shapes of kind `ball`: `ball.clear` and `ball.steel.N`.
- Places, sizes and what the ball collides with are in `src/table/layout.ts`, and only the Builder changes that file, `draw.ts` and `physics.ts`. A model reads its place there (`table.models`, `table.bumpers`, `table.targets` and the rest) and adds whatever the ball never touches in its own folder. A change to something the ball touches comes as a patch for the Builder.
- Each folder under `src/table/real/` belongs to one owner, who fills the `parts` of its `index.ts`. `src/table/real/index.ts` says which folder makes which part and is frozen, like `zone.ts`.
- The floor of a tier is printed. Its mesh carries a mask on `userData.coverageMap`, white where something is printed and black where the floor is bare, and the `coverage` view and measure M8 read that mask. Everything else that is drawn on a tier counts as marking the floor.
- The anchors of `table-lights` come with the moving shapes, one for the marquee and one for each tier, and carry in `v` how bright the zone's general lighting is and how bright the website's own light is, each 0 to 1.
- Every material drawn in a zone of the table passes once through `lit(material, zone)` of `src/table/real/light.ts` when it is made. It does nothing until the owner of `table-lights` fills `src/table/real/lights/hook.ts`, and from then on it is how the zone's light groups reach every surface. So a material is shared inside a zone and not between zones.
- A tier draws many of the same thing: posts, screws, lamps, rubbers. Draw them as instanced meshes and keep one zone's object to a few dozen draw calls.

## Working on a part

- Work in your own files only: your brief names them. Never edit `package.json`, `content/`, `references/`, `kit/`, `config/`, `src/stage/`, `src/real/`, `src/app.ts`, `src/main.ts` or another builder's files. If you need something there, say so in a message and carry on with a workaround in your own folder.
- Every word a visitor reads comes from `content/copy.json` by key. The cursor has no face. A page must still pass as a real web page.
- No em dashes and no added exclamation points in any file. Almost no code comments. No `Math.random`, `Date.now` or `performance.now` in anything a frame is computed from. No surface pure black or pure white.
- Commit to your own branch and push it at least every thirty minutes, also when the work is half done. Merge `origin/main` into it before every push. Never force push.
