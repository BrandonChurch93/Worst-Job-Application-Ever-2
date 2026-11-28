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
| "On to / the next application." (a draft), 13.89 to 17.01 s | plain | the page has turned back to the careers page, whose own script runs on: entered at 14.39, the arrow lands, lies flat, stands, leans at the Apply button (from 15.52, held from 16.07) and holds that lean to the unit's last frame; the walk to its opening place is past the end of the film (`LANDING.walk`, ruled by the Builder, see `pipeline/change002/decision.md`) |

- The peel cannot start later than it does: the arrow must be whole inside `cursor.damageHealSeconds` (4 s) of the stamp, and it is whole 3.93 s after it.
- The key `decision` in the config is at 0.15385 of its beat (it was 0.3): the same 7.2 s of the unit as before, now that the beat is longer.

## After the real take of line 8 (the Builder's task of 04:10Z)

What is above was timed to a stand-in of 8.125 s. Where this section differs, this section holds.

The take (MEASURED by the Builder, `public/audio/index.json`): `line.decision.letter.0` is 12.742 s; its phrases start at 0.006, 3.466, 5.616, 8.166 and 11.01 s. `SAID` in `timeline.ts` holds those six numbers, and `tests/decision-acting.test.ts` holds `SAID` to `standIns().get('decision.letter.0')` exactly, so a new or edited take fails the test.

The film (seconds of the unit, MEASURED from the code and from `npm run cut`):

| What | When |
| --- | --- |
| The stamp (`stamp`), line 8 starts | 5.433 |
| The arrow lands flat | 7.067 |
| It peels itself up | 8.22 to 8.86, whole at 9.37 |
| "the company" starts | 8.899 |
| It dusts itself off (`READ.dust`, 0.9 s) | 9.929 |
| "has decided" starts: it turns to the letter, on edge (`READ.hear`) | 11.049 |
| It draws a breath (`READ.breath`, 0.35 s) | 12.649 |
| "to move forward" starts: it puffs up and leans to the letter (`READ.look`) | 13.599 |
| It hops (`READ.hop`, 0.5 s) | 15.443 |
| "with other candidates." starts: it sags (`READ.sag`) | 16.443 |
| It looks at the button (`GIVE.look`) | 16.753 |
| It drags itself there (`GIVE.walk`) | 17.013 to 17.623 |
| The blow (`GIVE.strike`) | 17.933 |
| The press (`button-press`) | 18.033 |
| Line 8 ends | 18.175 |
| The turn (`page-turn`), line 9 starts | 18.4875 |
| Line 9 ends (3.198 s) | 21.6855 |
| The unit ends | 21.7 |

- The unit is 21.7 s (it was 17.1). Beats: the metrics 6 to 18.4, the reset 18.4 to 21.7. The wait and the letter are as they were.
- Not as the Builder wrote it, and why. He asked for the arrow flat through the first two phrases, peeling up into the third. No damage may last longer than `cursor.damageHealSeconds` (4 s; `src/stage/CONTRACT.md`, the cursor's body enforces it from the first hurt, and two tests hold it). The hit is where the line starts, so the arrow is whole at the latest 3.97 s into the line, 0.5 s into "the company"; the third phrase starts at 5.616. So the arrow lies flat under the first phrase, peels itself up in the pause after it and is whole as "the company" is said. `FILM.heal` is still 2.3. To have it down through the second phrase needs a ruling: a longer damage for this unit (the cursor's rule, not this page's), or the arrow lying down whole (the body's `spread`, as the boss page uses it), which I have not tried.
- A move in each pause, none on top of another: the peel in the first, the dusting in the second, a breath in the third, a hop in the fourth. Each ends 0.2 s or more before the phrase that follows. The pauses are about 1.2 s (STATED by the Builder; the index holds only the starts, and the sound file is not in the repo, so I could not measure where each phrase's words end).
- The last phrase is 1.73 s and the press is 0.14 s before its end, so the walk to the button starts 0.26 s after the look (it was 0.41 s).

The live site (the Builder's ruling):

- A press while line 8 is being said is seen at once: the button goes down, `button-press` is emitted, the arrow gives its blow (`react('stamp')`). The page then holds until the phrase being said has ended and `audio.lineGapSeconds`, and turns. `holdAfterPress` in `timeline.ts` gives the length from `SAID`. The longest hold is 3.14 s (a press as the fourth phrase starts).
- "The phrase has ended" is the start of the next phrase, since the take's index holds only starts. That includes the pause after the words. If the shell ends the line at the pause, about 1.2 s of quiet come before the turn.
- A press after the line has ended turns 0.45 s later, as before. So does the skip link, whenever it is used. The self walk comes 20 s into the metrics, after the line has ended, so it is as it was.
- Control is not taken during the hold. One thing had to change for that: a press in the last 0.07 s of the throw used to end the page with the arrow still held by the page; now the throw is let finish and the arrow is given back.

## The push-in under the line, the film only (the Builder's task of 04:29Z)

From 7.0 s to 16.0 s of the unit the frame did not change at frame size; the read was carried by an arrow 70 px long. The film now pushes in slowly through the page's `view()`. The numbers are `VIEW` in `timeline.ts`, in one place.

- In: from the arrow's landing (7.067 s) to the start of "to move forward" (13.599 s), eased at both ends, 6.53 s. Held to 0.2 s after the sag is cued (16.643 s). Out: to the whole page as the walk to the button starts (17.013 s), 0.37 s.
- The closer view is 1.5 times closer, centred on page (960, 720): it shows page x 320 to 1600, y 360 to 1080. The view goes straight in and down, with no drift to a side. The lower edge of the view is the lower edge of the page, and on the way in the view never shows past the page.
- In it are the REJECTED mark, the block at rest, the arrow where it lies and acts, and the button. The mark's top corner is the thing nearest the caption.
- The caption lies still on the screen while the page moves under it, so on the way in it passes over the metrics panel. With the view's centre kept on x 960 it covers the first two letters of "Performance Metrics" from about 9.1 s to 10.3 s and the left rim of the first tile after that; it does not cover the "Your Time" label or the digits. A centre further right (1018 was tried, to put the three things in the middle) took the caption over the label and the first digit as well. In the hold it lies over the gap between the letter and the panel and covers no words.
- The caption is not in the view. The film lays it over the finished frame as its own 1920 by 1080 picture at a fixed place (`pipeline/change002/shell-film-captions.mjs`; on this page y 202 to 264, centred on x 960). The view does not move or scale it. `VIEW.clear` is the screen y the three things stay below.
- The hit's shake comes first and is as it was; the push-in starts after it has ended.
- The live site is not changed: `view()` gives the push-in only when the stage's mode is `film`.
- Not as asked, and why: "held through 'with other candidates.'" and "back out in time for the walk" cannot both hold. The walk starts 0.57 s into that phrase, since the press must fall inside the take's last words. The view holds through the sag and is out as the walk starts.
- The walk's start is `FILM.toButton`; `GIVE.walk` and `VIEW.out` both read it.
- The key `decision` (7.908 s of the unit) falls 0.84 s into the push-in, at a zoom of 1.023. Its `at` was not moved.

Tests: `tests/decision-view.test.ts`.

## Timed ahead for the lines without pauses (the Builder's task of 08:11Z November 28, branch `agent/b-decision`, not merged before the takes are kept)

What is above was timed to the kept take of line 8, 12.742 s with a pause before each phrase. Where this section differs, this section holds. The numbers are provisional (`pipeline/change002/fast-takes.json`, MEASURED by the Builder): line 8 is 6.049 s, its phrases start at 0.03, 1.721, 2.491, 3.569 and 4.822 s; line 9 is 1.339 s. `SAID` in `timeline.ts` holds line 8's six numbers and `tests/decision-acting.test.ts` holds `SAID` to that file until the take is kept. The page types no number of line 9: it is said over the careers page, and only the unit's length in the config makes room for it.

The film (seconds of the unit, MEASURED from the code and a run of the stage):

| What | When |
| --- | --- |
| The stamp (`stamp`), "After careful consideration," starts | 5.433 |
| The arrow, flat, is thrown off the block | 6.333 |
| It lands flat; the push-in starts | 7.067 |
| "the company" starts | 7.154 |
| It peels itself up (`peel-up` at 7.771) and fills | 7.50 to 7.92 |
| "has decided" starts: it is whole and stands slumped | 7.924 |
| "to move forward" starts: it puffs up and leans to the letter (`READ.look`) | 9.002 |
| "with other candidates." starts: it sags (`READ.sag`); the view is at its closest | 10.255 |
| It drags itself to the button (`GIVE.walk`); the view comes back out with it | 10.313 to 10.923 |
| The blow (`GIVE.strike`); the view is the whole page | 11.233 |
| The press (`button-press`) | 11.333 |
| Line 8 ends | 11.482 |
| The turn (`page-turn`), line 9 starts | 11.7875 |
| Line 9 ends | 13.127 |
| The arrow on the careers page steps to the button and leans | 13.40 to 14.15 |
| It stands again there and is at rest | 14.6 |
| The unit ends | 14.6 |

- The unit is 14.6 s (it was 21.7). Beats: the metrics 6 to 11.7, the reset 11.7 to 14.6. The wait and the letter are as they were. The film is 207.7 s, 12462 frames.
- Why not shorter. Line 9 ends at 13.127 s. The film ends on the careers page, on the arrow's landing (`LANDING` in `src/pages/marketing/script.ts`, not this page's). There the arrow lies flat, stands, steps to the button and leans on it (13.40 to 14.15 s), stands again and is at rest at 14.6 s: from 14.59 s no number of its pose changes by more than 0.0005 rad a step. The unit ends there, 1.47 s after line 9's last word, with nothing held after it.
- It was 14.9 s at first: `tests/careers-fix-landing.test.ts` holds the arrow still over the unit's last 0.3 s, and 14.9 is the shortest tenth at which that test passes. The Builder asked for no hold at the end (about 14.1 s, taking the landing to settle at 13.45 s). At 14.1 s the arrow is still leaning and still sliding left, so 14.6 is the nearest length with the landing whole. That one test fails at 14.6 and is not this page's to change.
- What is kept of the acting, and why. The hit, the arrow flat, the peel: flat from the hit for 2.06 s (under the block, carried, thrown, 0.43 s lying still), whole as "the company" ends. `FILM.heal` follows from `SAID`: 0.858 s, where a visitor's is 0.78. Then two moves and no more, each as its phrase starts: the puff and the lean to the letter on "to move forward", and the sag on "with other candidates.". The line is a false hope and its fall, and those two are the hope and the fall; the puff also holds the look at the letter, since the arrow leans to it. Each pose is held a second or more.
- What is not played: the dusting, the turn to the letter on edge, the breath, the hop and the look at the button. They stood in the kept take's pauses and there are no pauses. The Builder's guess was the look at the letter on "has decided"; it would start in the same step as the peel ends, and it would leave "to move forward" with nothing.
- The last phrase is 1.23 s and the press is 0.15 s before its end. The walk (0.61 s), the lean back (0.31 s) and the blow (0.1 s) fill it, so the walk starts 0.06 s after the sag is cued: the arrow sags and goes.
- The push-in (`VIEW`): in from the landing (7.067) to the start of "with other candidates." (10.255), 3.19 s, at most 0.24 of a zoom a second; out with the walk, from 10.313 to 0.1 s before the press (11.233). There is no hold. To the fourth phrase it would have been 1.9 s, which is not slow.
- The key `decision`: its `at` is 0.22807 of the shorter beat, 7.3 s of the unit: the letter stamped, the arrow lying flat (it lies from 7.07 to 7.50). Left at 0.15385 it would have shown the arrow in the air at 6.88 s.

The live site:

- The same `SAID`, so the hold after a press under the line is shorter. A press as soon as the button is up (7.0 s) falls 0.15 s before the first phrase's end; the page turns 0.45 s after it, as it did before change 002. The longest hold is 1.55 s (a press as "to move forward" starts); it was 3.14 s.
- Nothing else a visitor meets has changed: the wait before the letter (2 s), the letter, the stamp at 5.43 s, the arrow whole 0.78 s after it lands, the button up at 7.0 s, the walk by itself after 20 s.
- One mend. An arrow that lands after the press (a press in the last steps of the throw, with a hold only a little longer than 0.45 s) was given the whole heal and could be handed on flat. It is now given what is left of the hold, less 0.12 s, as a press on a lying arrow always was.

Tests re-pinned: see `pipeline/change002/decision.md`.

Not done here, and why: the site does not start on this branch. `contentProblems` in `src/copy.ts` takes a line's soonest end from `audio.narratorMaxWordsPerSecond` (1.6): line 8 is 13 words, 8.125 s by that rule, and line 9 starts 6.35 s after line 8. Without pauses the line is said at 2.15 words a second. The number is the config's, not this page's.
