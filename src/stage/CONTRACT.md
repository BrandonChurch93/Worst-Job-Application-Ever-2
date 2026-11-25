# The stage contract

This is how a page plugs into the one stage. Everything named here is plain TypeScript with no three.js and no DOM, so it runs the same in the browser and in Node.

## Coordinates

- Page pixels. `x` runs right from 0 to 1920. `y` runs down from 0. A page is 1920 wide and at least 1080 tall.
- Heights are page pixels above the page surface. Below the surface they are negative.
- The world the pictures are drawn in is `(x - 960, 540 - y, z)`. A page needs it only for its own cameras: `toWorld` in `src/stage/camera.ts`.
- A driver gives the pointer in viewport pixels. The stage adds the page's scroll before a page sees it, so `io.pointer` is in page pixels.

## A page

`src/pages/<page>/index.ts` exports `makePage(): PageLogic`, as `src/stage/types.ts` types it. It is called after the fonts are loaded, so it may measure type. `src/pages/stub.ts` is a whole page in 76 lines: read it first.

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

## Working on a part

- Work in your own folders only. Never edit `package.json`, `content/`, `references/`, `kit/`, `config/`, `src/stage/`, `src/shell/`, `src/cursor/`, `src/core/`, `src/app.ts`, `src/main.ts` or another builder's folder. If you need something there, say so in a message and carry on with a workaround in your own folder.
- Every word a visitor reads comes from `content/copy.json` by key. The cursor has no face. A page must still pass as a real web page.
- No em dashes and no added exclamation points in any file. Almost no code comments. No `Math.random`, `Date.now` or `performance.now` in anything a frame is computed from. No surface pure black or pure white.
- Commit to your own branch and push it at least every thirty minutes, also when the work is half done. Merge `origin/main` into it before every push. Never force push.
