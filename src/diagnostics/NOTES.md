# The measures and the diagnostic views: decisions

Phase 2, engine and blockout. `npm run measure` is `tools/measure.mjs`, its arithmetic is `tools/lib/measure-core.mjs` (pure, tested in `tests/measure.test.ts`), and what reads a picture is `tools/lib/measure-pictures.mjs`.

## How the measures are read

- Every number comes from `config/showcase.json` by the key `kit/07-QUALITY-BAR.md` names. The tool types none.
- The stills of a unit are its entries in `keys`, `stills` and `sheets` of the config, which is items 1 to 3 of the judged list for that unit. `site` is not a unit of `npm run measure`.
- "Each page at rest and each key" (M4, M5, M9) is every key of the unit and every entry of `stills` without a beat. A sheet has no `stillState` of a page, so no sheet is read by M4, M5, M6 or M9.
- `stillState` lists the type and the parts of the whole page, not only of what the camera sees. M4, M5 and M9 judge all of it. A run that fails on five stills of one page is printed once with the number of stills, and the record holds every item.
- M5 judges a key by the letter: a part that a gag has moved in the moment of a key is further from the layout tree than `layout.tolerancePx` and is reported. If the kit means only parts that are not being moved, `stillState` has to leave a part out while a gag moves it, or give its `planned` box as the place the gag puts it.
- M6, "at rest", is read as: the cursor is on the page and not in the ball, in a still from `home`. From a tier camera the ball's width is `ballScreenPx` and the cursor's length is `screenHeightPx`. A still from a tier camera in which the cursor is not in the ball is red.
- M7 reads every frame of the unit's beats in Node, and one frame on each side. "Changes on that frame or the next" is: the pair of `acting` and `damage` differs between the frame before and the frame of the event, or between the frame of the event and the one after. A reaction that `CursorState` does not carry (`react(name)`) cannot be seen by this measure: if a short reaction is to count, `CursorState` needs it.
- M9: a key travels down by `scale.heights.keyTravel`, so a keycap may stand between `keycap - keyTravel` and `keycap`. A progress button is round: both sides are held to `scale.sizes.progressButton`. Field, button and heroButton are held by their height on the page.
- M10: an end of a rail "opens onto a tier" when it names a tier or an opening of a tier, onto a hold when it names a hold, onto a rail when it names a rail. The lift's doors are the openings whose id ends in `lift.door` and its elbows those whose id ends in `elbow`: two of each, each clearing `table.minClearanceBalls`. The display's characters in the tier's still are `charPx` times the picture pixels per page pixel of that tier's key, read from the cursor in `stillState`. `npm run paths` is run once and its exit code and its `PROBLEM` lines are taken as they are.
- A measure that cannot be made says `not yet` and is neither green nor red. The exit code is 2 when one measure is red, 0 when all that ran are green, 1 when the tool failed.
- `--tier` and `--format` default to `draft` and `hd`. The tier is printed and recorded, because a judged still is rendered at `final`.
