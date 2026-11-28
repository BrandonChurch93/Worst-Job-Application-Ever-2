# Step 5, Decision: notes of the build agent

Unit `decision`, page `step5`. Files: `layout.ts` (the page and its places), `timeline.ts` (every second the page knows), `script.ts` (the film pointer and the film reactions), `index.ts` (the state machine), `tests/step5.test.ts`.

## What the page does

1. `decision.wait` (0 to 2 s). One full width panel: "Processing your application...", "Current wait time:", a dark counter with "6-8 business months", "Your application is very important to us. Please hold." Event `hold-music` at 0.4 s. The cursor is nervous and paces under the panel.
2. `decision.letter` (2 to 6 s). The counter spins to zeros (2.0 to 2.35 s), the panel sinks flush into the page, the letter drops on the left column (`letter-drop` and `paper-slide` at 2.8 s), the metrics panel rises on the right reading 00:00. The stamp comes in from above the top edge and lands at 4.3 s (`stamp`) on the letter and the cursor, which is flattened (`flatten`) and held under the block while the block lifts and is carried to its rest place under the metrics panel. As the block is laid on its side there (5.85 s) the flat cursor falls from its rubber to the right of it.
3. `decision.metrics` (6 to 10 s). The three readouts count up from 6.1 to 7.0 s, the button "Accept Rejection" and the link "Share Your Achievement" rise from 6.6 s and take a press from 7.0 s. The flat cursor, lying right of the stamp, peels up by itself (`peel-up` near 7.1 s, whole at 7.7 s). A press of the button emits `button-press`.
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

- A stand-in shape that floats above the page (the stamp block in the air, the letter while it drops) casts a hollow shadow in the blockout view: an outline, with light inside it. A shape that rests on the page is right. The cause is not known. This page only gives the shape its place and its height. The foot of the stamp flies at 120 to 140, rises to 170 in the wind up before the hit, and is carried at 120. Its top stands 164 px over its foot, so for the 0.24 s of the wind up the top of the grip is at up to 334, which is 14 px over the 320 the lamps cover; no fault was seen in the frames of the hit.

## The real parts (Phase 4)

Makers in `real/`: `wait.ts`, `letter.ts` with `letterStock.ts`, `stamp.ts` with `stampInk.ts`, `metrics.ts`. What each is made of and why is in `pipeline/phase4/decision.md`; the textures are in `assets-src/decision/RECIPE.md`.

- `wait`: the panel is the shared glass card. The counter is a chrome bezel, a dark gap and smoked glass 1.6 px below the bezel's top. The digits (`wait-value`, `wait-count`, part `wait`) are lamps under the glass with a halo, and they light the panel through `ctx.light`.
- `letter`: one sheet of 72 by 48 cells, flat under its print, lifted at its four corners (3.4 px at the lower right), with fibre in its colour and in its normals. A painted shade lies under it and fades as the sheet leaves the page. The sheet and all that is printed on it lie turned by `SHEET_ROT` (0.012 rad) about the sheet's middle; the mark's border and word turn with it. In the air the sheet is lifted by a little light of its own (`AIR` in `letter.ts`, by height only) so that it does not fall grey.
- `stamp`: a lacquered block on a dark red rubber die with a waisted grip on a chrome band, block and grip both red. Upright while it works; set down, it is laid on its side with the grip away from the reader and a little off square (`LIE` in `script.ts`), so that the reader sees its side: grip, band, block, die. The mark is geometry in red ink: a double border drawn from `letter-mark-top`, and the word `letter-stamp` (part `stamp`), both under one picture of uneven ink cover.
- `metrics`: the panel, the wait panel (which calls the same `panelOf`) and the three readouts are the careers page's slab of pale glass (`cardGlass`, `slabGeometry`, `groundEdge`, `SLAB`, `GLASS` of `src/pages/marketing/real/perk-cards.ts`, imported, not copied). A readout is that slab cut open at 1/0.55 of its size and set down at 0.55, so its ground edge is narrow, with a flat face of its own a little lighter than the panel. The shadow on the page is thrown by the foot inside the slab alone. The readouts have the tone `glass` in the layout, so the type on them is the flat ink on glass.
- "Your Time" is the film's own length in film mode (`filmSeconds()`, 153 s, so 02:33) and the visitor's own elapsed time in live mode. It is not a free constant, so it does not read 02:41 as the approved image does.
- The stamp at rest lies on its side (`LIE.turn`, a quarter turn) and is turned by `LIE.rot` (-0.17 rad), so the grip, the block and the dark edge of its rubber show in profile, as in the approved image. In action it is upright and seen from above. The cursor stands under the lower right of the mark, inside the block's outline, and is struck there.

### The numbers in `v`

| Shape | v[0] | v[1] | v[2] | v[3] |
| --- | --- | --- | --- | --- |
| `stamp-block`, `stamp-grip` | seconds since the hit, capped at 9 | seconds since the block came to rest at its place, capped at 9 | lean of the block before the fall, in radians | how far it is laid on its side, 0 upright to 1 lying |
| `stamp-dust` | seconds since the hit | | | |

`stamp-dust` is in the draw list only for `HIT.dustSeconds` (0.62 s) after the hit.

### The acting (recipe 5)

One word for each beat, all in `script.ts` as `PACE`, `HOPE`, `GIVE` and `CUES`, tested in `tests/decision-acting.test.ts`.

| Beat | Word | What the cursor does |
| --- | --- | --- |
| The wait, 0 to 2 s | worried | stands under the panel to 0.9 s, crouches (`anticipate`), tiptoes 170 px right, flinches at the count (1.24 s), tiptoes back 70 px past where it stood, and stands, `nervous` |
| The letter falls, 2 to 4.3 s | hope | stands still while the sheet falls, hops when it lands (`jump`, `proud`), struts to the foot of the sheet (2.9 to 3.5 s), looks up at 3.62 s (`doubleTake`) and freezes |
| The stamp, 4.3 s | frozen | no move from 3.5 s to the hit, then flat |
| The peel and the button, 6 to 10 s | beaten | peels itself up, looks at the one button (7.82 s), drags itself there in 0.65 s, stands 0.4 s, and presses once with no flourish, `exhausted` |

Every hold is a pointer that does not move, so the gag ends by itself in live mode: the script only drives the film.

## Not done

- The share line is not copied to the clipboard by this page.

- After the hit the cursor is carried under the stamp and dropped to its right (`STUCK` in `script.ts`); the page holds it until it has landed (`AT.fling[1]`).

## After round 8 (the fix round)

What is above is as it was built; where this section differs, this section holds. The reasons are in `pipeline/phase4/decision-fix.md`.

- Places. The two columns are 560 tall (button's middle at y 952, link's at 1036). The wait panel has its own top (`WAIT`, 52 px lower). The sheet lies square (`SHEET_ROT = 0`). The mark lies in the sheet's lower right corner (`MARK_AT`), the stamp rests under the middle of the glass (`REST_AT`), the letter's print is inset by `LETTER_PAD`. The underline of the link is the shape `share-rule`, role `underline`, part `metrics`: flat printed ink.
- The path of the film cursor starts at the hand-off place (960, 540), as `start` says, stays there to 0.52 s and backs off the counter to `waitSpotOf()` by 0.86 s.
- Times of the stamp (`timeline.ts`, whole frames of 30 a second, seconds of the unit): in 4.57 to 4.87, hang to 5.30, fall to 5.43, contact 5.433, rebound in the next frame, held to 5.70, lifted straight up to 5.97, carried to 6.40, laid down by 6.63. The stamp is posed from `since()`, the seconds since the letter's beat began, so it goes on after that beat ends at 6.0.
- The cursor is struck with its tip under the block's lower edge (`SPOT`), its stem outside. It rides with the block (`STUCK`). Over its place the block shakes once (`AT.shake`), the flat cursor is thrown clear, the block is set down, and the cursor comes down swaying with a soft shade of its own on the page (`fallShade`), skids and lies flat right of the block from 7.07, where it is hurt again for `STUCK.heal` seconds so that the key at 7.2 holds it flat.
- The numbers in `v` of `stamp-block` and `stamp-grip`: v[4] is how large the block is drawn (1 at rest, more the higher it is, a little less in the frame of contact), v[5] its height over the page. The sheet `letter` has v[0], how far its three far corners are kicked up (0 to 1), for two frames after the hit.
- The acting. `PACE` is gone. `ARRIVE`, `HOPE`, `GIVE` and `CUES` in `script.ts`; the states are set by the page in both modes.

| Beat | Word | What the cursor does |
| --- | --- | --- |
| The wait, 0 to 2 s | nervous | set down on the counter, backs off it to the bare glass by 0.86 s and holds its place to 2.0 s: beads, tremble, gulp |
| The letter falls, 2 to 3.5 s | shocked | flinches as the counter spins (2.03), stands tall as the sheet falls (2.45), jumps as it lands (2.8), then holds a tilt toward it (3.06 to 3.5) |
| The letter read, 3.5 to 4.9 s | proud | puffs up and holds (3.5 to 3.94), dusts itself off (3.94), struts to the sheet's corner (4.44 to 4.8) |
| The stamp, 4.9 to 5.43 s | scared | the shadow is on it at 4.93: rears, then small, pale and laid back, held to the hit |
| The peel and the button, 7.07 to 10 s | exhausted | lies flat 0.4 s, peels itself up with nothing else moving, looks at the button (7.88), drags itself there (8.29 to 8.9), holds 0.3 s, then one strike (`stamp` reaction at 9.2, press at 9.3) |

## After change 002 (the narrator's lines 8 and 9, the film only)

What is above is as it was built; where this section differs, this section holds. The reasons, the tables of times and of re-pinned tests are in `pipeline/change002/decision.md`.

- The unit is 17.1 s in the film (it was 12). Beats: the wait 0 to 2, the letter 2 to 6, the metrics 6 to 13.8, the reset 13.8 to 17.1.
- Nothing a visitor sees or does has changed. The stamp, the carry, the fling and the landing at 7.07 s are as they were in both modes. The film has three numbers of its own in `FILM` (`timeline.ts`): `heal`, how long the landed arrow takes to be whole (2.3 s; a visitor's is still `STUCK.heal`, 0.78 s); `read` and `sag`, when it acts the fourth and fifth phrases of the line; and `press`, which is worked out from the line's end.
- `SAID` in `timeline.ts` is when each phrase of line 8 starts after the stamp, and its end. A test holds it to the words in `content/narration.json` and the narrator's pace in the config, so a change of the line or the pace fails a test and does not drift.
- The press is the first whole frame (of 30 a second) from which the page turns no sooner than the line's end and the gap between two lines: 13.433 s. The page turns at 13.8875 s. The walk to the button keeps the gaps it had, counted back from the press (`GIVE`).

| Beat | Word | What the film cursor does |
| --- | --- | --- |
| "After careful consideration," and "the company", 5.43 to 8.56 s | (flat) | struck, carried, flung, lies flat right of the block from 7.07 to 8.22 s with nothing else moving |
| "has decided", 8.56 to 9.81 s | exhausted | peels itself up (8.22 to 8.86), is whole at 9.37, slumps and holds |
| "to move forward", 9.81 to 11.68 s | proud | puffs up and leans to the letter, as it did when the letter fell, and holds |
| "with other candidates.", 11.68 to 13.56 s | exhausted | sags (11.68), holds 0.33 s, looks at the one button (12.01), drags itself there (12.42 to 13.03), holds 0.3 s, strikes (13.33), presses (13.43) |
| "On to / the next application." (a draft), 13.89 to 17.01 s | plain | the page has turned back to the careers page, whose own script runs on: entered at 14.39, the arrow lands, lies flat, stands, leans at the Apply button (from 15.52) and at 16.79 sets off to its opening place; the unit ends 0.31 s into that walk (a fault, see `pipeline/change002/decision.md`) |

- The peel cannot start later than it does: the arrow must be whole inside `cursor.damageHealSeconds` (4 s) of the stamp, and it is whole 3.93 s after it.
- The key `decision` in the config is at 0.15385 of its beat (it was 0.3): the same 7.2 s of the unit as before, now that the beat is longer.
