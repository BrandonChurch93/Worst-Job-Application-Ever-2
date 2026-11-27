# Polish tug: the takeover, the release and the struck key of step 1

Branch `agent/polish-tug`. Files changed: `src/pages/step1/index.ts`, `src/cursor/body.ts` (arms and hand-back only), `tests/polish-tug.test.ts`, this note and its two tables and two tools.

## What was measured first (MEASURED)

`POLISH_TUG_TABLE=/tmp/m/before.tsv npx vitest run tests/polish-tug.test.ts` on `origin/main` at 02eeb686, the live stage under the keen bot at 240 steps a second. The table is `pipeline/phase5/polish-tug-before.tsv`; the same run after the mends is `pipeline/phase5/polish-tug-after.tsv`.

Before, round the bite (step 4882):

- The arms were whole at once: the sprout spring stood at 0.52 after one frame of 60 and 0.86 after two and a half, while the page slid the hands from the shoulder to the paper over 0.16 s by a lerp of its own, so the picture showed a full loop of arm that the hands then dragged out.
- The paper swung from the first step of the bite (0.14 rad after one and a half frames), before any hand was on it.
- The arrow was not hauled: in the 40 steps after the bite it went from (551, 518) to (709, 416), toward the visitor's pointer, while its shoulder stayed 269 to 241 px from the slot and the arms grew to 168 px. The pull was ramped in over 0.42 s, so the arms were slack for all of it.
- The body's lean did not change with the reach (0.248 to 0.204 rad).

Before, round the release (step 7832):

- The arrow stood still and went straight off on the 0.35 s hand-back of the body. Under the pack's visitor, whose pointer waits 900 px away, that is the one frame turn the critic saw.
- The slot shut in 0.25 s. Its two pale panels meet and sink in the last 0.07 s of that, one picture of 30 a second.

## What was changed

1. The reach. `ARM.grow` in `body.ts` is the spring the arms sprout on (1300, 47): 0.18, 0.47, 0.73, 0.91 of their length after 1, 2, 3, 4 frames of 60. The page no longer moves the hands itself: it names the paper's two edges at once and the body's spring carries the hands there. While the grip is open the body leans toward the hands (`ARM.toward`), and back against them once it is shut.
2. The grab. `TAKE.reach` (0.075 s) after the bite the hands count as closed. Until then the paper stands upright in the slot. On that step it swings to the arrow on a damped swing (`TAKE.swing`) that goes past and comes back, the arrow is pressed long (`TAKE.long`) and knocked toward the paper (`TAKE.kick`).
3. The haul. The slack between the arrow and arm's length at the grab is let out over `TAKE.haul` (0.2 s), so the page's spring hauls the arrow in on taut arms from the grab on. The pull is no longer ramped.
4. The loss. After the paper is in, the empty hands are shed over `SHED.seconds` (0.29 s, inside the body's own 0.3 s) while the arrow is thrown back `SHED.back` px from the mouth and comes back; only then is it shredded.
5. The give-back. The arrow drops its pose, stands `GIVE.hold` at the least, and is released at `GIVE.settle` (0.42 s) with a hand-back eased over `GIVE.back` (0.44 s, was 0.35 s for every page: `release(over)` in `body.ts` takes the page's own seconds, other pages keep 0.35 s).
6. The slot's closing. `SHUT`: 0.36 s, and the last 0.3 of its travel, where the panels meet and drop into the page, 2.2 times as slowly. It is the same in the film.
7. The struck key. `THUD.held`, `THUD.back`, `THUD.pop`: the key is held down 0.05 s, is back at its full height 0.10 s after the hit, goes `THUD.pop` px above it and is at rest at 0.2 s. The scorch is untouched.

## What was measured after (MEASURED)

`npx vitest run tests/polish-tug.test.ts`, the live stage under the keen bot at 240 steps a second, and the film of step 1 for the key:

- reach: the hands close 0.079 s after the bite; the arms are 0.18, 0.47, 0.73, 0.91 of their length after 1, 2, 3, 4 frames of 60; the body leans 0.081 rad toward the paper by then. The paper does not turn before the hands close.
- grab and haul: the paper moves 9.78 px a step at most in the second after the bite; in the 0.3 s after the hands close the arrow comes 92.1 px nearer the slot and never falls back more than 1.41 px; the arms are 187.9 px at the grab and 70.9 px after; the body leans 0.453 rad back from the paper at the most in the second after the grab.
- release: the arms are shed over 0.292 s; the page holds the arrow 4.25 s of the 8 s it may; the arrow stands still 0.221 s before the mouse has it; in the first frame of 60 after it moves 0.28 px; its lean changes 10.4 degrees in a frame of 60 at the most in the half second after.
- struck key (film, the H key): 6.00 down on the hit, back at its full height 0.100 s after it, 3.56 above it at the most, at rest at 0.25 s.

In pictures (`node pipeline/phase5/fix-tug-steps.mjs walk a2`, the pack's own visitor, every second step of 60, real size): `out/work/fix-tug/a2-take.png` shows the bite at step 1764, the hands in the air at 1766, on the paper at 1768 with the paper swung, and the arrow hauled to the paper from 1770 to 1782; `a2-lose.png` shows the arms shed over steps 2312 to 2318; the slot's panels arrive over two pictures and sink over four.

## Decisions

- `SPRING.sprout` in `body.ts` is left where it is and is no longer read: its line belongs to a block the arrow agent edits at the same time. It can go when both branches are in.
- The held paper's lean is held short by the peak of the swing (`SWING_PEAK`) so the swing never passes `TAKE.lean` (0.6 rad), the number `tests/fix-tug.test.ts` holds.
- A recoil at the give-back was tried and taken out: the pack reads "given back" as the first move after the arrow has lain dead, so a recoil there would have been taken for the release. The recoil is at the loss, where the paper goes.
- The arrow is released while the slot is still closing (0.3 s to 0.79 s after the strips are tidied). Waiting for the slot would put the release on the step the pack's visitor has the page turned.
- No test of another owner was changed.

## Open

- When the visitor's pointer is far from the slot at the bite (269 px under the keen bot, 290 px under the pack's visitor) the arms are up to 190 px long on the frame they close, before the haul shortens them to 71 px in 0.3 s.
- The slot's pale panels still leave in one picture at the very end: they sink under the page. A fade needs a material of its own in `real/shredder.ts`; not done.

## Which film frames change (MEASURED 23:39Z)

How: `pipeline/phase5/polish-tug-filmdiff.ts.txt` copied as `tests/polish-tug-filmdiff.test.ts` into this branch and into a worktree of `origin/main` (fb56846a), run on each with `FILMDIFF=<path> npx vitest run tests/polish-tug-filmdiff.test.ts`, then removed. It plays the film of step 1 by its script and writes, per frame of 60, a hash of the page's draw list and the arrow's pose, and per event its step and name.

- Events: 351 on both, the two lists byte equal by `cmp`: no event moved. The beat of every frame is the same on both (0 of 1920 differ).
- Frames of step 1 that differ: 337 of 1920. Unit frame (film frame, step 1 starts at film second 14, frame 840):
  - 352 to 360 (film 1192 to 1200, unit 5.87 to 6.00 s, `step1.firstName`): the struck key springs back.
  - 1322 to 1613 and 1615 to 1621 (film 2162 to 2453 and 2455 to 2461, unit 22.03 to 27.02 s, `step1.tug`): the reach, the grab and the haul.
  - 1830 to 1858 (film 2670 to 2698, unit 30.50 to 30.97 s, `step1.shredded`): the slot's last closing.
- This reads the state a frame is drawn from, not the drawn picture. The film sheets (`npm run sheet -- --beat step1.tug`) were not made: the one browser was taken by the pack until the limit.

## The pack of round 22 (MEASURED 23:48Z)

`npm run -s pack -- --phase 5 --round 22 --unit site --role R4` at commit c7730f7d: exit 0, 10 files, 412 s. Sheets in `out/work/packs/round-022/R4/`: `set-A-04.png` the hit at step 899, `set-A-05.png` control taken at step 1854, `set-A-06.png` given back at step 2614. What the pictures show, each looked at, the small things in crops:

- Control taken (0:30.80 to 0:31.17, a picture every 1/30 s): the paper stands in the slot; at 0:30.93 the arms are out of the body with the hands in the air on the way; at 0:30.97 the hands are on the paper, arms long; at 0:31.00 the paper is swung and the arrow has begun toward it; 0:31.03 to 0:31.17 the arrow comes nearer the paper in every picture, leaning, arms shortening. The arrow does not drift away from the paper. The paper's jerk at the bite is not legible at this size and stride.
- Given back (0:43.47 to 0:43.83): the arrow stands still at its standard tilt from 0:43.47 to 0:43.60; the slot is dark and shut until 0:43.60, bright with a dark core at 0:43.63, pale at 0:43.67, then fainter in each of 0:43.70, 0:43.73 and 0:43.77, gone at 0:43.80: no single white frame. The arrow moves with the visitor from 0:43.63 and turns from its standard tilt to upright over 0:43.63, 0:43.67, 0:43.70 (three pictures, four frames of 60), where round 21 showed it in one picture. The angle per frame of 60 under the pack's visitor is UNKNOWN: the sheet shows every second frame; by eye about 35 degrees over four frames. The turn itself is the lean into the visitor's move, which is not my part of `body.ts`.
- The hit (0:14.88 to 0:15.25): the bolt meets the arrow on G at 0:14.98, the page shakes, the scorch is on G from 0:15.05. Whether G stands at its full height again is not resolved by the picture at this size: UNKNOWN on the live site. The spring back is MEASURED in the film only (H key, 0.100 s); the code is the same for both (`sprung` in `index.ts`, no branch on the mode), and a key the visitor holds down stays down.

## Seen in the film's numbers, not mine, not changed

The arrow's place jumps 90 px in one frame at unit frame 1682 (unit 28.03 s, film frame 2522) in the film of step 1: (789.4, 643.0) to (783.4, 733.0). The same on `origin/main` (that frame's state is equal on both).

## The 90 px in one film frame at unit frame 1682 (asked 23:58Z, read 00:02Z)

Not a jump of a drawn arrow and not a seam between two paths: the shredding itself. No source changed for it, so no film frame changes.

- Cause, STATED from the code: `src/pages/step1/index.ts`, `stepShredded`: line 686 drives the arrow down into the slot; line 688 `if (crossed(SHRED.gone)) io.cursor.setOnPage(false)` takes it off the page; lines 689 to 693 place it at `PILE` (60 px under the slot, `script.ts` line 22), put it back on the page and hurt it `shredded` (`SHRED = { gone: 0.46, pile: 0.64 }`, `script.ts` line 23). `src/cursor/body.ts` lines 269 to 271 and 704 to 717 (`pile()`, not my part) start the strips 38 to 50 px above that place, at the slot's mouth, and throw them down to it.
- MEASURED, a dump of the arrow's pose per film frame with its `onPage` flag (a throwaway test like `polish-tug-filmdiff.ts.txt`, removed after): `onPage` is 0 from unit frame 1672 to 1681 (film 2512 to 2521), z down to -57.6; at 1682 (film 2522) `onPage` is 1, damage `shredded`, place (783.4, 733.0).
- MEASURED in pictures, `npm run -s seq -- --first 2508 --last 2540 --tier draft` (exit 0, 67.9 s), every frame from 2516 to 2540 cropped round the slot at the preview format's real size: 2516 to 2521 show only the paper's strips under the slot and no arrow; at 2522 the arrow's strips are at the slot's mouth; from 2523 to 2540 they fall down and to the right a little further each frame. Nothing drawn moves 90 px in one frame. At 2522 the strips are there at their full length in one frame (about 100 px in this view) and do not come out of the mouth over frames: that is `pile()` in `body.ts`, not changed, told to the Builder.
- Other frames of step 1's film, same dump, the arrow's largest move of place in one frame: 116.67 px (unit frame 627), 116.39 (628), 114.48 (931), 107.88 (629), 105.25 (626), all inside fast flights whose neighbours are of like size. A lone jump (over 30 px, both neighbours under a third of it) happens twice: unit frame 1682 (above) and unit frame 349 (film 1189, unit 5.817 s), where the drawn arrow goes 60.00 px in one frame at the bolt's hit, stands 4 frames and travels back: `HIT.shove: 60`, `hold: 0.07` in `src/cursor/body.ts` line 38 and `knock()` lines 297 to 302, not my part, not changed.
- `npm run -s take -- --check`: exit 0, "take: every one of the 10 beat events fell inside its beat", "hits within 0.15 s of a cut of the film: 0".

## The arrow's strips come out of the mouth (asked 00:02Z, one commit of its own)

Before: at film frame 2522 the whole bundle of the arrow's strips was at the slot's mouth in one frame, each at its full length.

What changed, `src/cursor/body.ts` only, by the Builder's leave: `EMERGE = { least: 0.05, most: 0.12, under: 18 }`, two fields on a loose strip (`out`, `slow`), one line in `drop()` and `emerged()`, which the pose now gives the strips through. The fall of the strips is not touched: for the 0.05 to 0.12 s a strip takes to come out it is only shown up to 18 page pixels higher, under the hood's roller, and low, and from then on it is shown where it is. So the state is today's again as soon as the slowest strip is out.

- A strip has no length to grow and no clip in the pose (x, y, z, rot, tilt; the tilt is a roll about its length), and the model is not mine. Only the hood's roller hides a strip: the card above it does not (tried with 64 and 34 pixels: strips showed above the hood, seen in the pictures, dropped). 18 pixels is what the roller hides.
- MEASURED, the state dump against the commit before (7803a6c7): 7 frames of step 1 differ, unit 1682 to 1688, film 2522 to 2528; every frame from 2529 on is equal; the events byte equal by `cmp` (351).
- MEASURED in pictures, `npm run -s seq -- --first 2520 --last 2534 --tier draft` before and after, every frame 2520 to 2532 round the slot at the preview's real size: no strip above the lower lip in any frame; at 2522 the bundle hangs from under the roller, shorter than before by eye about a quarter; it is longer in each of 2523 to 2526; 2527 reads as before; 2528 on is the same picture. NOT reached: at 2522 most of each strip's length is already below the lip in that one frame. A growth from nothing needs a clip or a length in the model (`src/cursor/model/body.ts`), not done.
- MEASURED on the live site by numbers only (`npx vitest run tests/polish-tug-strips.test.ts`): film, bot keen (strips first at 30.417 s) and bot clumsy (41.525 s): the strips show only in `step1.shredded`, with the arrow on the page and hurt `shredded`, the highest strip 0.38 on the first step, 9.17 a frame on, 34.33 at 0.12 s. No live picture of it was made.
