# The motion pack of the site: true headings and the visitor's hand

Round 23, tools only. No file of the site is changed. The visitor (`VISITOR`) and its run file are the same for the same build; only which moments are chosen, the labels under the frames and the headings are new.

## Why

In round 22 the critic of motion saw a sheet under the heading "as the visitor's flipper meets the ball and the ball goes off it" at step 6764. No bat of the visitor's moved there: the machine's own save had thrown a lost ball back. The critic also saw bats rise with no ball near and could not know it was the visitor's hand, and took the light of a turret's bolt on the keys for key presses.

## What changed

Files: `tools/lib/pack-site.mjs`, `tools/pack.mjs`, `tests/pack-site.test.ts`, `tests/fix-packs.test.ts` (two tests, by leave), this file.

### A. The hand under the frames

- The sheets of the moments `flippers`, `flip` and `save` carry ` L`, ` R` or ` L R` after the time under a frame (`handAt`), and their heading ends with `Under a frame, L or R: the visitor held the left or the right flipper at that frame or since the one before it.`
- Ruling of the Builder, 02:03Z of 2026-11-27: a frame carries L or R when the hand held that flipper at that frame's step or at any step since the frame before it on the sheet. Reason: the frames are 2 steps apart, and a tap of one step between two frames (the run has one, at step 7005) would be lost if only the frame's own step were read. The columns read are the run's own (`COL.left`, `COL.right`). The sentence of the heading was changed by the same ruling.
- Read in `walk` and `replay`, for whoever reads a sheet closely: picture i is drawn before the visitor's events of step i are sent, so a key that goes down at step i first moves the bat in picture i + 1.
- The plan keeps the letters of a sheet in `hands`, and the key file keeps them too.

### B. `flip` is true or it is left out

- A step is a stroke only when all of this holds (`momentsOf`): the visitor has the flippers; the ball's speed changes by `MEETS.kick` px a step or more and the ball then goes `MEETS.lifts` or more up the table; the visitor pressed a flipper at most `MEETS.soon` (4) steps before; the ball was on that bat's side of the page's middle or within half a ball of it; the step is no save of the machine's; the site tells of no other blow on the ball at that step (`hits`); the change of speed is `MEETS.share` of the hardest such change or more (this keeps a soft throw after a press that met nothing out, as the test of that in `tests/fix-packs.test.ts` asks). Of each press the first such step is taken.
- The old way back (the first lift after any press) is gone. With no stroke `met` is null, no sheet stands under that heading, and `pack.json` says so in `leftOut`.
- Ruling of the Builder, 02:03Z: of the true strokes the one is shown whose hand holds the flipper longest, and of two held as long the earlier. On dd63b290 the true strokes are step 7006 (left, the hand taps for 1 step) and step 7876 (right, held 12 steps); 7876 is shown.

### C. The new moment `save`

- What the run records of a save: I looked at the run file's keys (`gags`, `hits`, `acts`, `rows`) and at what the page tells (`told()` in `src/main.ts`). The page tells of a save by name, `flipper-save`, only as a hit on the arrow, once, inside the gag `pinball.save`. In the run of dd63b290 there is no such entry in `hits`. Every other save the page calls `flasher` and does not tell.
- So the finder takes a `flipper-save` of `hits` where there is one, and reads every other save from the ball's own path in the rows (`SAVE`): the ball was going down the table, and in one step it stands 30 px of the page or more up the table, within one ball of the page's middle, and the step after its speed differs from that jump by 12 px or more. The ball was put there, not struck. This is what `atGate` in `src/table/physics.ts` does at a save: it puts the ball at the gate's mouth and throws it. On dd63b290 the saves are at steps 6764, 6779, 7157, 7284, 7564 and 7572.
- Ruling of the Builder, 02:03Z: the save shown is the first of the run whose sheet shows the bat start, the ball leave and the bat fall. As a rule of the finder (`SAVE.rest`, `SAVE.whole`): no other save and no flipper held by the visitor from 36 steps before the save (a stroke of 12, its fall of 12 and the bounce of 10, the page's own numbers in `LIVE` of `src/table/physics.ts`) to 26 steps after it (the machine's stroke of 12 and its fall of 12). With none such, the first save.
- On dd63b290 the first save, 6764, is not whole: the visitor holds the right flipper from 6760 to 6762, and a second save stands 15 steps after it, at 6779, with a tap of the left flipper at 6778, so a bat is raised again before it is down. 6779 is not whole for the same reason, seen from the other side. 7157 is the first that is whole, and it is shown.
- The run starts two frames before the save and is 24 frames long on two sheets. The heading is `Consecutive frames as the machine saves a ball lost between the bats: its own bat strikes as the save throws the ball back`, then the size words, the part words and the time span as on the other sheets, then the sentence of the hand.

### D. The hit names what struck

- `as a turret's bolt hits the arrow` for `bolt-hit-cursor`, `as the lost tug of war hits the arrow` for `tug-lost`, and for a name with no plain word of its own `what the page calls "..."` (`struckWords`).
- `no key is pressed in these frames` is added only when the run shows no button and no flipper held in any step from the frame before the sheet's first to its last, and no press sent in them (`handsOff`).

### E. The new moment `type`

- The first press of the mouse button inside the key block of step 1 once the page asks for the first name (the gag `step1.firstName`), and its release. The run starts two frames before the press. The heading is `Consecutive frames as the visitor's arrow presses a key of the page's keyboard and lets it go` with the size words of the window as on the other close sheets.

### The limit of ten files

- The order in which second sheets go is now: the turn's first sheet, the ball leaving the port, the second sheet of the save, then the second sheet of the stroke, then of given back (`WORTH`).
- `pack.json` now holds two plain fields for this pack, `leftOut` and `limitTook`, and the heading of every file beside its name.

## Not changed

- The R4 brief, word for word. `VISITOR`, `walk`, `rowOf`, `COL`, the run file.
- `MEETS.within` is no longer read by the tool. It stays in the constant.

## A file outside my list

- `tests/fix-packs.test.ts`, by the Builder's leave of 02:03Z: two tests changed to the new rules, each with one comment line above it, and nothing else in that file. (1) With no blow while a bat rises there is no stroke (the test wanted the first lift after a press, which is how the machine's save came under the stroke's heading in round 22). (2) Under the limit the turn's first sheet goes before a flip sheet.
