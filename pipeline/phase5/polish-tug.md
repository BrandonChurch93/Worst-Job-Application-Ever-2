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

## The strips grow down from the lip (asked 00:14Z, for the merge after 43, one commit of its own: df2a79cf)

By the Builder's leave for `applyStrips` in `src/cursor/model/body.ts` and what it needs in the pose.

What changed:

- `src/cursor/contract.ts`: a strip of the pose may name `below` (a line across the page over the body's place, in the body's pixels up the page) and `shown` (0 to 1, how far it has come out).
- `src/cursor/body.ts`: `EMERGE = { least: 0.16, most: 0.19, lip: 43 }`. `emerged()` gives a loose strip its own fall (x, y, rot untouched; z and tilt eased as in d4b94e4e) and the two new fields until it is out; the 18 px shift under the hood of d4b94e4e is gone. The blend of two poses carries the two fields. `lip: 43` is `PILE.y - HOOD.y` of step 1 (`script.ts`: the hood's line 17 px under the slot's middle, the pile 60 px under it), written as a number here because the cursor does not read a page's file.
- `src/cursor/model/body.ts`: `LIP = { first: 0.12, whole: 0.55, least: 0.2, lift: 0.5 }` and `underLip()`. For a strip that names a lip the model measures the strip's own length up the page as its fall would draw it, holds it up so that only its share is under the lip (0.12 at the first, the whole at 0.55 of its coming out), lifts it off the page by half of what it is held up (the mouth stands at the hood's height, as the paper's strips leave it), and from 0.55 to 1 lets it go to where its fall has it, quickening as a fall does. Every point above the lip is drawn back along the strip to the lip, so nothing is drawn above it. A strip that names no lip goes through none of this.

Decisions:

- The root of the body is turned by the arrow's lean (0.376 at that frame), so "up" in the pose is not up the page. The lip is a line across the page, so the model reads its own root's turn and measures up the page.
- The first try shifted the strip in the pose and clipped it in the model. Dropped: the strips are 7 to 20 px long up the page and fall 4.3 px a frame, so a strip that only follows its fall is whole in 2 to 5 frames, never 5 to 7. To take 5 to 7 frames a strip must be held at the mouth while it comes out and then catch its fall up. That is what is built, and it is the cost: see "not mended".
- Without the lift the held strips slid under the paper's strips and looked see-through (seen in the picture of the second try); with it they pass over them.
- `tests/polish-tug-strips.test.ts` gains one check for the film and two bots, on the model itself: share drawn on the first step at most 0.2, nothing over the lip, each strip whole in 5 to 7 frames, the share never falling, no lip named after 7 to 12 frames, and then the strip's pose holds only x, y, z, rot, tilt.

Film frames that change, MEASURED by the state dump (pose and draw list hashed per frame, `polish-tug-filmdiff.ts.txt` run in worktrees of 518e4428, of merge 43 (19c0d013) and of the new head): 12 frames of step 1 differ, film 2522 to 2533, against both; every other of the 1920 frames is equal; from 2534 on the state is byte equal; the events byte equal by `cmp` (351 lines). No beat or event moves.

MEASURED on the model, `npx vitest run tests/polish-tug-strips.test.ts`, the same for the film (strips first at 28.033 s), bot keen (30.417 s) and bot clumsy (41.525 s): each of the 15 strips shows 0.16 of its length on the first step (film frame 2522), 0.30 to 0.33 a frame on, 0.58 to 0.66 three frames on, and is whole after 5.25 to 6.00 frames; the highest drawn point over the lip is 0.0000 px on every step; the pose names no lip after 11.25 frames.

MEASURED in pictures, the film: `npm run -s seq -- --first 2518 --last 2536 --tier draft --force` (exit 0), every frame 2520 to 2533 round the mouth at the preview's real size, three rows (main, d4b94e4e, new). What the new row shows: 2520 and 2521 no arrow strip; 2522 short stubs at the roller's lower edge; longer in each of 2523 to 2527, all from that edge, none above it; 2528 whole and still at the mouth; 2529 leaving it; 2530 to 2532 dropping to the right and down, drawn as several faint copies (the film's blur of a fast move); 2533 nearly where main and d4b94e4e have the bundle at 2532. Pixels against the d4b94e4e pictures: 2520 and 2521 no pixel differs.

MEASURED in pictures, the live site: `node pipeline/phase5/polish-tug-live.mjs walk LABEL` (the pack's visitor on the built site, a picture of every step from 20 to 70 steps after `step1.shredded` begins).

Not mended, and why:

- The drop after the strips are whole is quicker than the fall was: the bundle goes from the mouth to its place in about 4 frames (2529 to 2533) where main and d4b94e4e take the fall over 6 and more, and the film's blur draws it as faint copies in 2530 to 2532. This is the price of holding a short strip at the mouth for 5 to 7 frames while its fall, untouched, runs on without it. Two numbers set it: `LIP.whole` (earlier whole, longer drop) and `EMERGE.least` / `most` (a longer whole time lands the bundle later than 2533).
- With the lift the strips' cut ends stand about 2 draft pixels (4 of the film's) under the roller's lower edge, in its shadow, not flush with it.
- A white speck of 2 pixels on the roller's lower edge at 2528: it is in the d4b94e4e picture of that frame too (bright pixels counted on rows 336 to 345: 23 there, 22 here). Not from this change; UNKNOWN what it is.

Checks on the head that holds this and merge 43 (24b41006), one at a time, 00:44Z to 00:54Z:

- `npx tsc --noEmit -p .`: exit 0.
- `npx vitest run`: 153 files passed, 1 skipped; 1854 tests passed, 1 skipped (merge 43 alone: 1851 passed, 1 skipped; the 3 more are the new check for the film and two bots).
- `npm run -s determinism`: exit 0, "determinism: pass, 12 pictures at hd, tier draft, identical across two fresh loads and two orders".
- `npm run -s take -- --check`: exit 0, "take: every one of the 10 beat events fell inside its beat", "hits within 0.15 s of a cut of the film: 0".
- `npm run -s bots`: exit 0, "keen reached every one of the 37 gags on every seed", "bots: all clear".
- Stills at draft by `cmp`: `table-wide` and `boss-fight` byte equal to the pictures of `origin/main` kept from 23:00Z; `step1-fire` byte equal to my own of d4b94e4e.
- `step1-fire` against merge 43: `npm run -s still -- --key step1-fire --tier draft` in a worktree of 19c0d013 (exit 0), `cmp` with the new head's: byte equal.

The live picture row, `node pipeline/phase5/polish-tug-live.mjs walk strips2` on the new head (exit 0; `step1.shredded` begins at step 2329), every step 2367 to 2382 round the mouth, each pixel twice: 2367 no arrow strip; 2368 short strips at the roller's lower edge; longer in each of 2369 to 2373, all from that edge; 2374 and 2375 whole at the mouth; 2376 to 2378 dropping to the right and down; 2379 to 2382 at the pile's place.

## The strips run their fall late, with no catch up (pass of 01:00Z to 01:40Z)

Asked by the Builder at 01:00Z: the growth from the lip is taken, the quick drop after it is not (in 2530 to 2532 the bundle was drawn as faint separate copies and crossed in 4 frames what the fall took 10 for). Aim: no strip moves in a frame more than about 7 px, no separate copies in the blur, the place and pose where each strip rests byte equal to merge 43's, the events byte equal.

Decision, which of the two ways: the plain one. A strip runs its own fall late by the frames it took to come out, and there is no catch up at all. The other way (a catch up spread evenly) was tried first as a strip fed down at 7 px a frame toward a fall that ran on time: MEASURED, the strip's middle then went 7.1 to 8.7 px a frame for 18 frames and met its fall with a step from about 8 px to 3.7 px in one frame, so it was dropped.

What the code does now:

- `src/cursor/body.ts`: `EMERGE = { time: 2 / 15, lip: 43 }`. A strip is made with `out` one step under 0; `drop()` first counts `out` up to 1 over `EMERGE.time` (8 film frames) and returns, so the fall does not begin until the strip is out; from then on `drop()` is the fall as it was, from the same first state. `emerged()` gives the pose `below` (the lip) and `out` while `out < 1`, and the bare pose after. `slow`, `EMERGE.least` and `EMERGE.most` are gone.
- `src/cursor/model/body.ts`: `LIP = { first: 0.12, least: 0.2, lift: 0.5 }`. While a strip names a lip it is held up the page by `(below - first * length - foot) * (1 - out)`: it goes at an even pace from "12 in 100 of it under the lip" to the place its fall begins at. The clip at the line and the lift off the page are as they were. `LIP.whole` and the hold and the quick drop are gone.
- `src/cursor/contract.ts`: the pose field `shown` is now `out`, one line says what it is.
- A number of my own: `EMERGE.time` 2/15 s. MEASURED why: the longest way a strip has to go from the lip to where its fall begins is 55 px in the film (strip 7, 56 px long), and 55 px in 8 frames is 6.9 px a frame.

MEASURED, the largest step any strip's middle makes from one film frame to the next, page pixels, the film of step 1, frame 2523 on (the step into the named frame), by `npx vitest run tests/polish-tug-strips.test.ts -t "film of step 1: each"` (the lines `STRIDE middle`), the same test file run in a worktree of each commit:

| into film frame | 2523 | 2524 | 2525 | 2526 | 2527 | 2528 | 2529 | 2530 | 2531 | 2532 | 2533 | 2534 | 2535 | 2536 | 2537 | 2538 | 2539 | 2540 | 2541 | 2542 | 2543 | 2544 | 2545 | 2546 | 2547 | 2548 | 2549 | 2550 | 2551 | 2552 | 2553 | 2554 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| merge 43 (19c0d013) | 10.0 | 10.4 | 11.3 | 9.2 | 8.7 | 10.3 | 8.8 | 6.4 | 6.1 | 6.7 | 6.7 | 4.9 | 5.3 | 5.4 | 5.0 | 4.4 | 3.1 | 4.1 | 3.7 | 2.4 | 3.1 | 2.2 | 1.6 | 2.2 | 1.1 | 1.7 | 0.2 | 0.2 | 1.2 | 1.1 | 1.1 | 0.8 |
| the quick drop (d327942c) | 3.8 | 3.4 | 4.1 | 5.2 | 6.3 | 8.2 | 10.4 | 18.3 | 27.9 | 30.9 | 34.6 | 7.4 | 5.3 | 5.4 | 5.0 | 4.4 | 3.1 | 4.1 | 3.7 | 2.4 | 3.1 | 2.2 | 1.6 | 2.2 | 1.1 | 1.7 | 0.2 | 0.2 | 1.2 | 1.1 | 1.1 | 0.8 |
| now | 6.9 | 5.9 | 6.2 | 6.0 | 6.1 | 7.0 | 6.6 | 7.0 | 4.6 | 5.8 | 6.7 | 5.4 | 6.3 | 6.8 | 6.8 | 6.6 | 5.6 | 6.8 | 6.4 | 5.1 | 5.9 | 5.1 | 4.9 | 4.7 | 3.8 | 4.4 | 2.9 | 2.7 | 3.3 | 2.6 | 1.8 | 0.6 |

From 2555 to 2581 the three lines hold 0.1 to 1.8 px a frame each (the full lines are printed by the test). The largest now is 7.0 px (into 2528 and 2530); the largest of merge 43 is 11.3 px, of the quick drop 34.6 px. The largest step of any one point of a strip (the lines `STRIDE point`, which count the turn of the strip too): now 8.4 px (into 2523 and 2525), merge 43 11.6 px, the quick drop 34.6 px. On the live site the middle's largest step is 7.8 px (bot keen) and 8.0 px (bot clumsy), both into the first frame after the strips show; the test holds all three under 8.

MEASURED, the strips are whole (film frames after they first show): 1.25 2.00 2.25 3.25 4.50 5.75 6.00 7.50 7.75 8.00 6.25 5.50 3.50 4.50 2.25; the share drawn on the first step is 0.12 of every strip; no lip is named after 8.00 frames; nothing is drawn over the lip (0.0000 px). No strip is held: each moves in every frame until it is out.

MEASURED, what changes in the film against merge 43 (19c0d013), by the state dump (`pipeline/phase5/polish-tug-filmdiff.ts.txt`, a sha1 of the page's draw list and the arrow's whole pose for each of the first 1920 film frames of step 1, and a line for every event):

- Events: `cmp` of the two event files: byte equal, 351 lines. No beat and no event moves.
- Film frames whose state differs: 2522 to 2576, 55 frames in a row, no gap. The first frame from which the state is byte equal again is 2577.
- The rest pose is equal by hash: 2577 `e83cbeaac9a7` in both, 2640 `c83e0ddf6478` in both, and every frame between and after to 2760. STATED from the code: `drop()` ends on `p.x = p.tx; p.y = p.ty; p.rot = p.tr`, tilt 0, the strip's own layer, so a strip rests in the same place however late.
- This is past the "about 2545" of the leave. Why: the fall itself is not shorter than it was. Every strip is now 8.25 frames behind its fall of merge 43 (33 steps of 240 a second: the 32 of `EMERGE.time` and the one the count begins under 0 by), so the last strip comes to rest that much later; when the last one rested in merge 43 I did not measure by itself (2576 less 8.25 says about 2568). What the pictures show of that is under "Not mended".

MEASURED in pictures: `npm run -s seq -- --first 2518 --last 2562 --tier draft --force` on this code (exit 0, 45 pictures) and `--first 2533 --last 2562` in a worktree of 19c0d013 (exit 0, 30 pictures); pixels that differ between merge 43 and now per frame, counted over the whole 960 by 540 picture (any difference / more than 24 levels): 2520 and 2521 none; 2522 13795/6151; 2530 22428/9508; 2540 14261/6948; 2545 10796/5436; 2550 7341/2387; 2555 3919/920; 2560 2258/349; 2562 1979/230.

What the pictures show (the sheets `polish-tug-late-fall-2520-2533.png`, `-2534-2545.png`, `-2546-2562.png`, crops at the preview's real size):

- 2522 to 2529: the strips come down out of the mouth, each longer in every frame, the short ones whole first. No frame in which the bundle stands still under the lip.
- 2530 to 2540: the bundle goes down and to the right as one drawn bundle with its own smear along the way it goes; I see no second, fainter copy of it beside the first in any of these frames.
- 2541 to 2553: the camera begins to pull back at about 2541. In merge 43 the bundle lies in its pile by then; now it is still on its last stretch and settles into the pile while the camera moves. By 2554 the two rows look alike to my eye at this size.
- 2554 to 2576 (the fourth sheet, `-2563-2577.png`, holds 2563 to 2577): the two rows look alike to my eye; counted, 2563 has 1927 pixels that differ at all and 177 by more than 24 levels, 2570 2161 and 142, 2575 1159 and 50, 2576 268 and 1, 2577 and 2578 none (rendered for this on both commits, `--first 2563 --last 2578`, exit 0 each).

Not mended, and why:

- The film differs from merge 43 for 55 frames, 2522 to 2576, where the leave said to about 2545. The plain reading cannot be shorter: the strips land 8.25 frames after their landing of merge 43, and the fall of merge 43 itself runs to about 2568. A shorter feed would end sooner but would break the 7 px (55 px in 6 frames is 9.2 px a frame).
- The bundle is still on the last stretch of its fall when the camera begins to pull back (about 2541); in merge 43 it was down by then. Whether that reads as a fault I cannot say from stills; it is one for the Builder's eye on the sheet of 2534 to 2545.
- On the live site the middle of one strip goes 7.8 px (keen) and 8.0 px (clumsy) into the first frame, over the "about 7"; the film's largest is 7.0 px.
- The largest step of a single point of a strip is 8.4 px in the film (into 2523 and 2525): the short strips turn as they come out. The fall's own largest in merge 43 after its first seven frames is 6.9 px.
- The two notes of the pass before stand: the cut ends sit about 2 draft pixels under the roller's lower edge, and the 2 pixel speck at 2528 is in merge 43's picture too.

Checks on this code, one at a time, 01:11Z to 01:20Z:

- `npx tsc --noEmit -p .`: exit 0.
- `npx vitest run tests/polish-tug-strips.test.ts`: 6 passed (the film and the two bots, two checks each). The check of the growth was rewritten for the new numbers: a fifth or less at first, nothing over the lip, whole within 8 frames, the middle's largest step at most 8 px, no lip named after 8.25 frames, the last pose with the keys `rot tilt x y z` alone.
- `npm run -s determinism`: exit 0, "determinism: pass, 12 pictures at hd, tier draft, identical across two fresh loads and two orders".
- `npm run -s still -- --key step1-fire --tier draft` (exit 0), `cmp` with merge 43's picture: byte equal (md5 b87598cee9b47b8a82c66601b42892dc both).
- `npx vitest run` (all): 153 files passed, 1 skipped; 1854 tests passed, 1 skipped.
