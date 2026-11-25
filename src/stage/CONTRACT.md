# The stage contract

This is how a page plugs into the one stage. Everything named here is plain TypeScript with no three.js and no DOM, so it runs the same in the browser and in Node.

## Coordinates

- Page pixels. `x` runs right from 0 to 1920. `y` runs down from 0. A page is 1920 wide and at least 1080 tall.
- Heights are page pixels above the page surface. A pocket's floor is negative.
- The world the pictures are drawn in is `(x - 960, 540 - y, z)`. A page never needs it.
- A driver gives the pointer in viewport pixels. The stage adds the page's scroll before a page sees it, so `io.pointer` is in page pixels.

## A page

`src/pages/<page>/index.ts` exports `makePage(): PageLogic`, as `src/stage/types.ts` types it. It is called after the fonts are loaded, so it may measure type.

- `layout` is the tree of the page at rest and of every run of type it can ever show. Build it with `src/shell/layout.ts` and `src/shell/parts.ts`.
- `gags` lists the page's gags in order. A gag's `id` is the id of its beat in `film.beats`, and its `event` is that beat's event.
- `reset(ctx)` puts the page in its first state. `ctx.mode` is `live` or `film`. In film mode `ctx.applicant` holds the applicant from the config.
- `step(io)` advances one step of `1 / sim.stepHz` seconds. Everything stepped moves here and nowhere else. No clock, no `Math.random`: take a stream from `src/core/random.ts` and keep its state in `save()`.
- `save()` returns plain data that `JSON.stringify` can write, and `load()` takes it back. Together they hold everything `step` reads, so that the state after `load(save())` runs on exactly as before.
- `draw(out)` pushes one `Shape` for everything that can be seen now. Call `drawLayout` from `src/shell/layout.ts` for the tree, then push what moves. A shape's `id` stays the same while the thing exists, because the stage blends two steps by id.
- `scroll()` is how far down the page the view is, in page pixels.
- `view()` is the live camera when it is not `home` at the page's scroll, and null otherwise. `camera(name, time)` gives the page's own named cameras, and null for a name it does not have.
- `script(time)` is the film: the pointer in viewport pixels as a function of the seconds since the page arrived. It must be a pure function of time.
- `hint()` is what a capable visitor would do now, in page pixels. The bots read it. `dodge` is where to be to stay out of a hit.
- `skip()` plays the step's ending, as the skip link does.
- `done()` turns true when the page is over. The stage then turns the page.
- `gag()` is the id of the gag in progress, or null.
- `ignoring()` is true while the page does not listen to the visitor's control: the pointer, or the flippers when `control` is `flippers`.
- `states()` names the states the page is in now, as the layout tree uses them: `rest` at first.

## Words

A shape or a layout node never holds a string to show. It holds a key:

- `copy:step1.heading` for a word in `content/copy.json`.
- `applicant.filmFirstName` for a word in the config.
- `data:keyboard.keys.q` for a word in a data file beside the code, registered with `registerData` from `src/shell/words.ts`. Only legends and numerals.
- `runtime:step1.firstName` with `text`, for what is made at run time: typed input, a counter, the score display. Nothing else.

## Events

`io.emit(name, x, y, hitsCursor)` reports that something happened, at a place in page pixels. In live mode a gag emits the same events as in film mode. The names of the film are the `event` entries of `film.beats`. Sound hangs on them, and so do the checks.

## The cursor

`io.cursor` is the one `CursorBody` from `src/cursor/body.ts`. The stage moves it toward the pointer. A gag may `act`, `react`, `hurt`, `knock`, `take` and `drive` it, and must `release` it. It gives control back by itself inside `live.controlTakenMaxSeconds`. It has no face. Its size never changes.

## Rules a gag keeps

- It does not know which driver is running.
- It ends by itself. With a pointer that never moves it still reaches its end, inside `live.skipLinkAfterSeconds` of no progress.
- It keeps its live way out, also in film mode.
