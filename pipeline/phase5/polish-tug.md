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
