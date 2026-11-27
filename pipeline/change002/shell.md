# Unit "shell": notes

Branch `agent/b-shell`, started from `origin/main` at dc3296b8 on 2026-11-27 at 21:26 UTC.

## 1. The field progress contract (contract 2 of the plan)

STATED by the note: "the progress bar counts fields".

The type, in `src/stage/types.ts`:

    export interface FieldProgress { done: number; total: number }

A page sets it by giving its `PageLogic` one more method, optional, beside `typing?()` and `volume?()`:

    fields?(): FieldProgress | null

It is read from the page's own state each time the stage makes a frame (`Stage.snap` in `src/stage/stage.ts`, through `railFields`), and nowhere else is anything kept. Example, in the object a page's `makePage` returns:

    const FIELDS = ['name', 'email', 'resume']
    // in the page's state: s.field, the index of the field in hand, saved and loaded with the rest
    fields: () => ({ done: s.field, total: FIELDS.length }),

How it is drawn: the stage writes `[done, total]` into `v` of the shape whose role is `progressRail` (the numbers a page hands the maker of a part; they are blended between two steps of the stage like every `v`). The rail's maker (`rail` and `railFill` in `src/shell/real/controls.ts`) lays a strip of `railSatin` over the `railFlat` bar: from the first button to the collar of the step in hand, and from that collar toward the next button by `done / total`. Both materials are the rail's own in `src/shell/materials.ts`; no prop, no new material, no new copy.

Decisions:
- `done` may be a fraction. A page that wants the fill to glide eases `done` in its own state; a page that reports whole numbers gets a fill that steps.
- `done / total` is clamped to 0..1. `total` of 0 or less, `null`, or no method at all: the rail is drawn as before, same key, same object.
- With `done` 0 on step 1 nothing is filled, so step 1 at rest looks as it did.
- The fraction is laid over the length of rail a visitor can see, from the collar of the step in hand to the far side of the next cap's edge (6 px under it), not from centre to centre: with three fields the three lengths seen are near 1 : 2 : 3. MEASURED in `tests/b-shell-fields.test.ts`.
- The steps behind the step in hand are filled too (`FILL_FROM_FIRST` in `controls.ts`). A page that reports nothing shows no fill at all, so steps 3, 4 and 5 show the bare rail until their pages report; `fields: () => ({ done: 0, total: 1 })` on a page with no fields keeps the fill behind its button. That line is for the owners of those pages, through the Builder.
- The fill has no eased motion of its own in the shell, because that would be state outside the page.

MEASURED: `npx vitest run tests/b-shell-fields.test.ts`: 8 tests passed. `npx tsc --noEmit -p .`: no output.
MEASURED by eye: `shell-pictures/rail-step2-2of3-draft.png`, a crop of `npm run still -- --page step2 --beat step2.open --at 0.9 --format hd --tier draft --force` with the stage told for that one render to report 2 of 3 on every page (not committed). The strip from 1 to 2 and two thirds of the way from 2 to 3 is the lighter satin; the rest is the flat grey of today.
