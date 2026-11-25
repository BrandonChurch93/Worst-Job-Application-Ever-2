# Step 5, Decision: notes of the build agent

Unit `decision`, page `step5`. Files: `layout.ts` (the page and its places), `timeline.ts` (every second the page knows), `script.ts` (the film pointer and the film reactions), `index.ts` (the state machine), `tests/step5.test.ts`.

## What the page does

1. `decision.wait` (0 to 2 s). One full width panel: "Processing your application...", "Current wait time:", a dark counter with "6-8 business months", "Your application is very important to us. Please hold." Event `hold-music` at 0.4 s. The cursor is nervous and paces under the panel.
2. `decision.letter` (2 to 6 s). The counter spins to zeros (2.0 to 2.35 s), the panel sinks flush into the page, the letter drops on the left column (`letter-drop` and `paper-slide` at 2.8 s), the metrics panel rises on the right reading 00:00. The stamp comes in from above the top edge and lands at 4.3 s (`stamp`) on the letter and the cursor, which is flattened (`flatten`) and held under the block until the block has lifted (5.1 s). The block is carried to its rest place under the metrics panel.
3. `decision.metrics` (6 to 10 s). The three readouts count up from 6.1 to 7.0 s, the button "Accept Rejection" and the link "Share Your Achievement" rise from 6.6 s and take a press from 7.0 s. The flat cursor peels up by itself (`peel-up` near 7.1 s, whole at 7.7 s). A press of the button emits `button-press`.
4. `decision.reset`. The button stays down 0.45 s, then `done()` is true and the stage turns the page.

## Decisions

- Kit against brief. The brief says "Nothing on this page hurts the cursor". The kit says the stamp flattens it (01-FILM, the decision beats; the note of the key `decision`: "In the build it is flattened"; 02-SUBJECT: "The stamp block slams down on the letter and the cursor"). The kit wins, and it holds for every visitor, as in step 1 where the visitor always loses. When the stamp block comes in (3.6 s) a cursor that is not where the stamp will land is taken and walked to the letter in 0.5 s. When the block looms (3.9 s) the cursor freezes where it stands, scared. It is flattened at 4.3 s and let go when the block has lifted (5.1 s). Control is taken for 1.5 s at most. In the film the cursor has walked to the letter by itself before 3.6 s, so it is only held from 3.9 s. There is no dodge, so `hint()` gives none on this page.
- Whole again. The Builder added: the cursor is whole by the first frame of the page that follows, and no damage lasts longer than `cursor.damageHealSeconds`. The heal is 3.4 s. A press of the button (or a skip) while the cursor is still flat shortens the heal to 0.33 s, so the cursor is whole before `done()`.
- Film timing. The stage leaves a page when `done()` turns true. The film pointer presses at 9.3 s (inside `decision.metrics`), `done()` at 9.75 s, so `page-turn` comes at 9.75 s, inside the tolerance of `decision.reset` (10 to 12 s less 0.25 s).
- The wait panel title is `copy:transitions.step5`. 01-FILM names the line, and the copy of step 5 has no such line.
- "Your Time" is `filmSeconds()` in film mode (02:33). On the live site it is the seconds since the stage started, `io.elapsed`, with `io.time` as the fallback. `elapsed` was asked for as `NEEDS.patch`, the Builder put it on `main`, and the patch file is removed.
- The stamp block is wider than its mark, so the flat cursor lies beside the word and does not cover it.
- The cursor presses the right end of the button, clear of its label.
- The share link swaps itself for the share line (`copy:step5.shareText` with `{time}` filled, shown as `runtime:step5.shareText`) and emits `share`, which has no sound cue. The app may copy the line to the clipboard on that event.
- `copy:step5.closing` is not on this page: it belongs to the footer of the careers page that follows.
- The cursor stands on what is under it (`cursor.setGround`): 12 on a panel, 14 on the button, 1 on the letter.
- Live way out: a pointer that never moves or does the wrong thing still gets the whole story by time alone, and 20 s (`live.skipLinkAfterSeconds`) after the button is up the page takes the cursor for at most 1.95 s, presses its own button and lets go. `skip()` settles the story and presses at once.
- `hint()` sends a capable visitor to read the letter where the stamp lands, then to the button.

## After the measures of blockout round 1

- M4. The stamp's ink (the word and its four bars) has the tone `dark` in the blockout, not `danger`: on the paper `danger` gave a contrast of 4.47, `dark` gives 7.7. The red of the stamp belongs to the look of the part `stamp`.
- M7. The event `stamp` is emitted at the cursor when the block strikes it (at the mark's centre if it ever misses), on the step the damage `flattened` begins.
- M7. The event `peel-up` is the cursor's own act, so it is emitted with hitsCursor false.

## Seen, not mine to change

- A stand-in shape that floats above the page (the stamp block in the air, the letter while it drops) casts a hollow shadow in the blockout view: an outline, with light inside it. A shape that rests on the page is right. The cause is not known. This page only gives the shape its place and its height. The stamp flies at 200 to 220 and is carried at 120, under the 320 the lamps cover.

## Not done

- No beauty: every part is a stand-in shape.
- The share line is not copied to the clipboard by this page.
