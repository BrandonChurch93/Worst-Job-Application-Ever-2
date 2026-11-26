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

## The first round-21 pack of R4 (commit 00f2ae4f)

MEASURED with `npm run -s pack -- --phase 5 --round 21 --unit site --role R4`: exit 0, 10 files (round 20 had 9), 23.1 MB, 496 s. Every sheet is 1399 px wide and 1210 to 1364 px high.

MEASURED from `out/work/packs/cache/00f2ae4fc758/live-high/site-run.json`: finished true, 10290 steps, 171.5 s, 37 gags, the last `decision.reset` at step 10202; `stood` 141 steps of 900, 2 bolts on the arrow (steps 903 and 975, both at 1560.6, 855.5).

What the sheets show, looked at one by one:

- 01 walk, steps 52 to 74: the arrow crossing the perks cards.
- 02 and 03 turn, steps 626 to 672, one run of 24: the page from its edge to seated. The difference between consecutive pictures of the page's top band is above nothing until step 668 and nothing at 670 and 672, so the run ends on a still page. The shiver itself was not seen by eye in tiles that show the whole page at about a quarter of its size.
- 04 hit, steps 897 to 919, contact at 903 as picture 4: the spark, the arrow thrown and turned, smoke, the arrow coming back with a burn. The arrow stood about 52 px from the right muzzle, so the bolt that hit had no flight to see and the turret hid part of the knock-back. Mended below.
- 05 taken, steps 1757 to 1779: three pictures of the paper going in, the bite as picture 4, the arrow pulled to the slot.
- 06 given back, steps 2447 to 2469, release at 2453: the arrow lying, let go, easing right about 200 px by the last picture. The end of the ease is after the sheet.
- 07 seal, steps 5674 to 5696, and 08 the ball leaving the port, steps 5768 to 5790: the shells closing round the arrow; the whole ball rolling into the tube, out of the ring by picture 9.
- 09 and 10 flippers, steps 6616 to 6662, one run of 24, the blow at 6622 as picture 4: the ball off the flipper, up between the lamps, off one and back down.

## The place of the stand-still (asked by the Builder at 20:34 UTC)

- The visitor no longer stands where it happens to be. From `step1.firstName` it walks to the key nearest the middle of the key block (`keyBlock(cfg).place`, the key `g`, 623 px from the nearer muzzle) and stands there, hands off.
- It goes on after the first bolt on the arrow that struck a third of the key block's width (421 px) or more from either muzzle. The cap of 900 steps stays.
- The sheet of the hit is made of that bolt (`hitTaken`), or of the first bolt when none struck that far.
- The run's file says which: `stood.at` (the key and its place), `stood.hit` (`step`, `nth` bolt, its place, `fromMuzzle` px, `least` px, `far`), and `stood.capReached` is true when the cap ran out with no far hit. The pack's log says the same in one line.
- `BLOCK` holds the numbers of the key block that the kit does not set (top of the deck, width of an end, barrel). `tests/fix-packs.test.ts` holds them against `src/pages/step1/keyboard.ts` and `turrets.ts`, so a change of the page breaks the test and not the sheet.
