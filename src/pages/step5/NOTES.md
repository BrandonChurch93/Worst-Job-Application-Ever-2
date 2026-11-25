# Step 5, Decision: notes of the build agent

Unit `decision`, page `step5`. Files: `layout.ts` (the page and its places), `timeline.ts` (every second the page knows), `script.ts` (the film pointer and the film reactions), `index.ts` (the state machine), `tests/step5.test.ts`.

## What the page does

1. `decision.wait` (0 to 2 s). One full width panel: "Processing your application...", "Current wait time:", a dark counter with "6-8 business months", "Your application is very important to us. Please hold." Event `hold-music` at 0.4 s. The cursor is nervous and paces under the panel.
2. `decision.letter` (2 to 6 s). The counter spins to zeros (2.0 to 2.35 s), the panel sinks flush into the page, the letter drops on the left column (`letter-drop` and `paper-slide` at 2.8 s), the metrics panel rises on the right reading 00:00. The stamp comes in from above the top edge and lands at 4.3 s (`stamp`). If the cursor is under the block it is flattened (`flatten`) and held under the block until the block has lifted (5.1 s). The block is carried to its rest place under the metrics panel.
3. `decision.metrics` (6 to 10 s). The three readouts count up from 6.1 to 7.0 s, the button "Accept Rejection" and the link "Share Your Achievement" rise from 6.6 s and take a press from 7.0 s. The flat cursor peels up by itself (`peel-up` near 7.1 s, whole at 7.7 s). A press of the button emits `button-press`.
4. `decision.reset`. The button stays down 0.45 s, then `done()` is true and the stage turns the page.

## Decisions

- Kit against brief. The brief says "Nothing on this page hurts the cursor". The kit says the stamp flattens it (01-FILM, the decision beats, and the note of the key `decision`: "In the build it is flattened"). The kit wins: the stamp flattens the cursor when the cursor is under the block. The Builder agreed and added: the cursor is whole by the first frame of the page that follows, no damage lasts longer than `cursor.damageHealSeconds`. A press of the button (or a skip) while the cursor is still flat shortens the heal to 0.33 s, so the cursor is whole before `done()`.
- Film timing. The stage leaves a page when `done()` turns true. The film pointer presses at 9.3 s (inside `decision.metrics`), `done()` at 9.75 s, so `page-turn` comes at 9.75 s, inside the tolerance of `decision.reset` (10 to 12 s less 0.25 s).
- The wait panel title is `copy:transitions.step5`. 01-FILM names the line, and the copy of step 5 has no such line.
- "Your Time" is `filmSeconds()` in film mode (02:33). On the live site it is the seconds since the stage started, `io.elapsed` (see NEEDS.patch, accepted by the Builder), with `io.time` as the fallback.
- The stamp block is wider than its mark, so the flat cursor lies beside the word and does not cover it.
- The cursor presses the right end of the button, clear of its label.
- The share link swaps itself for the share line (`copy:step5.shareText` with `{time}` filled, shown as `runtime:step5.shareText`) and emits `share`, which has no sound cue. The app may copy the line to the clipboard on that event.
- `copy:step5.closing` is not on this page: it belongs to the footer of the careers page that follows.
- The cursor stands on what is under it (`cursor.setGround`): 12 on a panel, 14 on the button, 1 on the letter.
- Live way out: a pointer that never moves or does the wrong thing still gets the whole story by time alone, and 20 s (`live.skipLinkAfterSeconds`) after the button is up the page takes the cursor for at most 1.95 s, presses its own button and lets go. `skip()` settles the story and presses at once.
- `hint()` sends a capable visitor to read the letter where the stamp lands, with `dodge` to the bottom centre, then to the button.

## Not done

- No beauty: every part is a stand-in shape.
- The share line is not copied to the clipboard by this page.
