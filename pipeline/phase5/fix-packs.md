# Fix pass after round 20: the pack tool

Branch `agent/fix-packs`, from `origin/main` at dc83c2d0. Files changed: `tools/lib/pack-site.mjs`, `tools/lib/pack-plan.mjs`, `tests/pack-site.test.ts`, `tests/fix-packs.test.ts`, this file.

## Before any change

- MEASURED, `npm ci && npm run build && npm test`: green, 1764 tests passed.
- Three draft stills of `origin/main` kept outside the repo in `/home/user/workspace/base-stills/`: `step1-fire`, `table-wide`, `boss-fight`, format hd.

## How the visitor was steered, and how each window was chosen (round 20)

- One seeded visitor reads `window.liveRun.told()` every 1/60 s and goes where `told().hint` says, 11 steps late, at 1500 px a second. It presses within 22 px of the place, types, scrolls, and holds the Shift keys as the hint says.
- Its one way to be hit: the first time a hint carried `dodge` it stood 120 steps. Nothing made it wait for a bolt.
- Walk: the middle 12 pictures of the longest stretch of page 1 in which arrow and pointer both move.
- Turn: 6 steps before the first turn to 6 after it, on three sheets. The shiver of the seated page ends 14 steps after the turning, so the last sheet cut it.
- Hit: the first `bolt-hit-cursor` of step 1, and with none the `tug-lost`. With no bolt the sheet named for a hit showed the lost tug.
- Taken, given back, into the ball, flippers: 12 pictures with the moment as the sixth (the fourth for the flippers), cropped round the arrow's place at that one step.

## What changed

### The visitor (`makeVisitor`)

- a. `STANDS`: on the page `step1`, from the gag `step1.firstName` until the gag `step1.lastName`, the visitor stands still, hands off, until `told().hits` holds one `bolt-hit-cursor` of that page. It then goes on a reaction time late, as before. `STANDS.mostSteps` (900 steps, 15 s) ends the wait when no bolt lands.
- The run file says what happened: `stood: { steps, mostSteps, boltHits, capReached }`. The pack prints one line of it at every build. When the cap is reached with no hit, the line says that the sheet of the hit shows another blow.
- b. `STROKE`: once the page has taken the arrow (`step1.tug` told), the arrow has lain dead 30 steps and the place the page wants the pointer jumps by 200 px or more, the visitor goes there 2 steps late and not 11. Once a visit. It is one stroke at the visitor's own speed.

### The moments (`momentsOf`)

- `released`: the step the page lets go, read from the stroke: the pointer's first long move, less `STROKE.reactSteps`.
- `leaves` and `left`: the ball's first step of its way out of the port, and the step its middle is `PORT.clear` (150 px of the page) from where the arrow was sealed.
- `met`: the step a flipper strikes the ball: within 24 steps of a press, the arrow's speed changes by 4 px a step or more and the ball then goes 3 px a step or more up the table.

### The sheets (`motionGroups`)

- Every moment's run starts three pictures before the moment (`LEAD`), so the moment is the fourth picture: the hit (a), the release (b), the seal (c), the blow of the flipper (d), the taking (f).
- A run may lie on two sheets in a row, pictures 1 to 12 and 13 to 24. The heading of each says `sheet 1 of 2 of one run, frames 1 to 12 of 24`, and the brief has a paragraph `One run on two sheets` that names the two files.
- e. The turn: one run of 24 pictures that ends 16 steps after the turning ends (`TURN.after`). The second sheet holds the seat, its knocks and the shiver.
- c. Into the ball: one run of 24 from three pictures before the seal when the ball is out of the port inside it. In the real visit the ball lies 1.5 s in the port, longer than two sheets hold, so the moment is two runs of one sheet each: the seal, and the ball leaving the port. The brief says so under `One event on two sheets`, with the seconds not shown.
- d. The flippers: one run of 24 from three pictures before the blow.
- The window of a close sheet (`runWindow`) is one fixed window for the whole run, set on the middle of the arrow's places over the run. It is the tile, uncut and unscaled, while the way fits with `ROOM` round it. A longer way gets a wider window in the tile's proportions, shown smaller, and the heading then gives the percent.
- The limit (`WORTH`): when the set would hold more than `critics.maxFilesPerMessage` files, every moment keeps a sheet and the second sheets go in this order: the give-back, the flippers, into the ball, the page turn.

## Decisions

- The order of worth in the brief ("the page turn, into the ball, the flippers, the give-back") is read from most to least worth. The Builder confirmed it at 20:16 UTC.
- "Three frames before the paper is bitten" (f): the bite is the step at which the site first tells of `step1.tug`, when the slot has the sheet and the arms come out. The 0.4 s of the sheet being drawn in before it is not all in the sheet: its last three pictures are.
- The give-back has one sheet. With the stroke 2 steps after the release, the arrow is seen lying, let go and easing away inside 12 pictures.
- The turn's run starts where the old page stands on its edge. The first half of the turn (the old page swinging away) is no longer in the motion pack: two sheets hold 0.8 s and the limit leaves no third.
- Not taken, as the brief says: a run of the steel balls.
