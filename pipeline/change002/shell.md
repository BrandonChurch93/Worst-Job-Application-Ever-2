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

### 1a. The Builder's rulings of 21:36 UTC on the rail, and what changed

- STATED by the Builder: `FILL_FROM_FIRST` stays true; a page with a rail and no `fields`, or `null`, is drawn as 0 of 1; the fill is the orange plastic of the button in hand, with a notch at each field's boundary.
- Done in `src/shell/real/controls.ts`: `railCount` gives 0 of 1 when the rail holds no count, so steps 3, 4 and 5 keep the fill up to the collar of their button with no line in their pages. The fill is `materials().orange`, the material of the cap of the step in hand. `railNotches` gives one notch at each boundary between two fields (total minus 1 of them), drawn as a strip of the `gap` material 2.5 px wide over the rail and the fill (`NOTCH_WIDE`, `NOTCH_OVER`). No new material.
- The fraction now runs from the collar of the step in hand to the edge of the next cap, so a notch stands exactly where the fill of that many fields ends; a full count goes 6 px under the cap.
- Found while doing it: two other shapes of the build carry the role `progressRail`, the boss's `health-track` (which uses `v` for its own lift) and the careers page's `process-rail`. `railFields` in `src/stage/stage.ts` and the fill in `controls.ts` now act only on the shape with id `progress-rail`. Before this, a boss page reporting fields would have had its health track's `v` overwritten.
- Test changed: `tests/b-shell-fields.test.ts`, "draws a page that reports nothing, null, or no fields at all with the key and the object of today" is now "draws a page with a rail that reports nothing, null, or no fields at all as 0 of 1: bare on step 1, filled up to the collar of the step in hand after it" (this note, 1a). Two tests added: the orange and the notches; the other rails left alone. The ratio of a full count to one field is now pinned between 3 and 3.3 (the 6 px under the cap).
- MEASURED: `npx vitest run tests/b-shell-fields.test.ts tests/b-shell-chrome.test.ts tests/ui.test.ts`: 3 files, 41 tests passed. `npx tsc --noEmit -p .`: no output.
- MEASURED on `out/work/stills/step2-step2_open-0p9-hd-draft.png` (hd, draft, 2 of 3 stamped for the render only): mean colour of the fill 213, 97, 37, relative luminance 0.228; of the bare rail 114, 117, 119, relative luminance 0.178. The difference is in hue more than in luminance.
- Picture: `shell-pictures/rail-orange-step1-1of3-step2-2of3.png`: step 1 at 1 of 3 and step 2 at 2 of 3 at 1920 wide (crops), and the same two frames scaled to 390 wide under them.

## 2. The header hook (asked by the Builder, 21:41 UTC)

The type, in `src/stage/types.ts`:

    export interface Chrome { header: number }

A page gives its `PageLogic` one more optional method:

    chrome?(): Chrome | null

`header` is how far the header is in: 1 in place, 0 off the top of the screen. It is read from the page's own state at each frame (`slideHeader` in `src/stage/stage.ts`, called in `Stage.snap` after `railFields`). Example:

    chrome: () => ({ header: 1 - easeOut(s.fightIn) }),

- The header is the shapes `header-title`, `header-rule`, `progress-rail`, `progress-1` to `progress-5` and their numerals (`isHeader`). Each is moved up by `(1 - header) * HEADER_OUT` page pixels (`HEADER_OUT` 240) and marked `moved`. The page's own shapes are not changed: the frame holds copies.
- No method, `null`, or `header` 1 or more: the frame is what the page drew. Values under 0 count as 0.
- The page eases the number itself; the shell keeps no state.
- MEASURED: `tests/b-shell-chrome.test.ts`, 6 tests passed. Picture `shell-pictures/chrome-header-0p55-step2-draft.png`: step 2 with `header` 0.55 stamped for one render (not committed), the header 108 px up.
