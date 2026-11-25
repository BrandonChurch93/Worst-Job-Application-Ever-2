# Step 1: the script and the page motion

Branch `agent/step1-script`. Part: `acting-step1`. Files: `src/pages/step1/index.ts`, `script.ts`, `layout.ts`, `NOTES.md`, `tests/step1-script.test.ts`.

The meaning of every number a maker reads is in `src/pages/step1/NOTES.md`, in the table at its end.

## What the approved images show that a quick look misses

1. Where the highlight sits: on the cursor it is one soft band along the upper left faces, never a dot, and the fields carry a thin light line on their lower inner lip, because the light comes from the upper left and the lip faces it. The focused field glows orange around its whole rim, strongest at the corners nearest the caret.
2. How wide the bevel is: the dark rim of the cursor is 4 to 5 px at 1920, a keycap rolls over in about 6 px and its top is a little smaller than its base, so each key shows a lit top edge and a shaded lower edge. The well of the keyboard has a lip as wide as a key gap.
3. How dark the gap is: between keys it is dark warm grey, not black, with a tight contact shadow at the lower right of each cap. The slot of the shredder is the darkest thing in the frame, a slit nearly black, and the paper casts its shadow into it.
4. What the edge does: the paper is creased on diagonals that start at the two fists, its far edge is already inside the slot and its near corners lift. The burn hole has a raised charred rim with an orange inner lip and a thin thread of smoke that rises straight up. A scorch on a key is a soft dark star, not a disc.
5. What the frame says: in the fire picture two bolts are in the air at once, one from each side, and the cursor leans away from the nearer one while the field above still reads "Perpl" with the helper under it at the left. In the tug picture the body is braced back from the slot at an angle, both arms are straight with strain, and the cursor, the paper and the slot fill the middle third of the frame.

## The film, second by second

Times are seconds of the unit. Events are read from a run of the stage in film mode and are checked by `tests/step1-script.test.ts`.

| Beat | Seconds | What is played | Event |
| --- | --- | --- | --- |
| `step1.keyboard` | 0 to 2 | lands at 0.96, struts to First name, taps it at 1.5, the deck rises with a start, a swing past its seat and a rattle of keys | `keyboard-rise` 1.50 |
| `step1.firstName` | 2 to 10 | P e r typed, the hatches open at 3.03, a double take, the left turret charges and it leaps to "p" as the shot leaves, "l", a leap clear across the board to W where it stands proud for over a second; at 5.72 it sees the bolts and jumps for the row above (the key picture at 6.0); it lands, takes the pause for a win, is hit at 7.14, holds the shock to 7.8, types the name to the end, Enter 9.6 | `bolt-hit-cursor` 7.14 |
| `step1.lastName` | 10 to 15 | eight keys, the board shuffles after each, three hunts with a look first, Enter | `keys-shuffle` 10.37 and seven more |
| `step1.email` | 15 to 20 | one slow key, then a run, Enter, three slabs hang and fall, three dives, the third off the keyboard | `slab-drop` 18.31, 18.86, 19.41 |
| `step1.resume` | 20 to 22 | the deck sinks, the paper slides out with friction, a look, a walk, a grab, a carry on an arc, a drop | `paper-slide` 20.45 |
| `step1.tug` | 22 to 28.25 | arms out, four pulls each with a wind-up, the shredder wins, 0.3 s with the arms torn | `arms-out` 22.03 |
| `step1.shredded` | 28.25 to 32 | strips fall to a pile for 1.0 s, the form empties a field at a time, the strips zip back for 1.0 s, a double take, exhausted, a trudge off | `strips-zip` 29.18 |

## Decisions

1. The helper of First name sits under its field at the left, and Last name and Email are moved down by `HELPER_ROOM`, 34 px. `FIELD_GAP` went from 16 to 12 so the form still ends above the note and the deck.
2. The key picture `step1-fire` is the frame at 6.0 s and the script is timed to it (the Builder asked): the turrets rise 0.72 s into the beat (`TIMES.turretDelay`), so they fire at 4.125, 4.575, 5.025, 5.475 and 5.925. At 6.0 the bolt of 5.475 is 66 px from its target on the W cap and 106 px from the cursor, the bolt of 5.925 has left the left barrel, the bolt of 5.025 landed 0.33 s before near K, the cursor is in the air on its way up and to the right to the 5 (a flight at about 37 degrees above the row, so that the cursor thrown tip first lies as in the approved image: the cursor's actor asked), "Perpl" is in the field and the focus ring is lit. The one hit of the film is the shot of 6.825, which lands at 7.138 while the cursor stands proud a second time. The letter burns away 0.2 s after the hit (`SINGE`). `tests/step1-script.test.ts` holds the frame.
3. The cursor is still for over a second before the hit and for 0.6 s in the shock. A pose needs a hold to be read.
4. The click on First name waits until the cursor stands on the page. The test "clicks the field only once the cursor stands on the page" holds it.
5. The landing of a slab shakes the deck, the keys and the hatches in the plane of the page by at most 2.2 px for 0.25 s. The `home` camera is the Builder's and is not moved. Slabs that lie do not shake.
6. The third dive leaves the keyboard for the page, so the cursor is already beside the resume when the deck sinks.
7. The tug is armed for 5.06 s of film. The check of the brief needs more than 5 s, and the rest of the beat is given to the 0.3 s of torn arms.
8. The film camera pushes in from 21.1 to 22.1 s and pulls back from 27.6 to 28.9 s, so the strips, the pile and the emptying form are seen from home. In the tug the cursor's tip keeps 163 px or more from the frame edge (MEASURED by the test "keeps the cursor, the hands and the slot well inside the frame all through the tug", `npx vitest run tests/step1-script.test.ts`).
9. A line of the sheet that the shredder has eaten is parked at the slot under the page. The count of shapes stays the same from frame to frame.
10. The hands are kept on the paper: at most `300 * (1 - amount) - 34` px from the slot (`TUG.inside`), 128 px apart. Agreed with slab_maker, who asked for 28. The strain of the tug is measured from the hands, so the sheet is taut in a haul and never crushed between the hands and the slot. The body stays 42 to 92 px from the hands (`TUG.reach`), as cursor_actor asked, so the arms keep their thickness.
13. The film tug loses the sheet slowly: 0.44 gone at the middle of the beat, so the key picture has a sheet with its title, as approved. The loss comes in the last half second.
14. The Browse chip's label is `inkLight`, as the approved images show a dark chip with light type.
15. The size of the page title (28 px) and of the heading (60 px) are `TYPE` in `src/shell/parts.ts`, which is frozen. They were left.
11. In live mode the shredded gag counts its whole length toward `live.skipLinkAfterSeconds + 3`. The way out of every gag is the same plain timer.
12. Pile 1.0 s and reassembly 1.0 s, as cursor_actor asked.
16. The strips of paper hang in a heap just under the hood and the strips of the cursor fall on to a pile 176 px under the slot, so the reassembly is seen in the open and not inside the paper. Once the message shows, the paper strips are drawn back under the hood in 0.3 s and the slot shuts.
17. The number row and Backspace show their legends as soon as the well is open, as keyboard_smith reported them blank at 1.76 s.
18. The film camera in the tug pushes in slowly to the key picture at 25.125 (a window 1051 px wide) and then right in to a window 600 px wide by 26.8, as the sheet gets short. The Builder asked for the cursor as large in frame as approved. MEASURED: with a window 716 px wide at the key picture M3 falls to 0.6134 against 0.8 (fine detail of `key:step1-tug`); at 1051 px it is 0.806. So the key picture keeps the wide window and the push comes after it.
19. The end: whole at 30.18, a double take, it leans toward the message and freezes (shocked) for 0.4 s, stamps once in anger at 30.8, sags at 31.18 and starts its trudge toward the form as the page turns at 31.5.
20. The slabs have weight: the keys under a slab go down their full travel and stay down, the slab sinks with them, stops dead and rebounds once by 1.2 px inside 0.06 s (the slab owner's proposal), the deck shakes 4.5 px in its plane for 0.25 s and the caps within 460 px hop up to 15 px, the nearest first.
21. The form empties for a cause on the page: the focus ring lights on Email, its caret runs back along the line and takes the address a character at a time, then Last name, then First name, 0.28 s each, while the cursor lies in strips. No letter is a shape of its own, so the letters do not drop: that would need the type owner.
22. The keyboard note sits 24 px under the form (was 14), clear of the contact shadow of the resume card and 28 px above the deck: asked by the type owner, seen in a draft still.
23. Legends: a single letter, digit or sign is set at 26 px and a word (Tab, Shift, Enter) at 20 px, the sizes the type owner measured on the approved image (cap heights 19 and 15 px).
24. After the loss the body is driven over the card (6 px above its face, 84 px up the page from the slot) for the 0.3 s before the shredder has it, so it is seen whole with its arms gone, not cut by the plate: seen by the cursor's actor. The knock at the loss stays `recoil`, which now turns the body as it is yanked.
25. The tug camera at the key still (25.125 s) frames about 900 px of the page, so the cursor is 149 px tall in a 1920 frame (was 128). MEASURED with `npm run measure -- --unit step1 --only M3` at four widths of frame: 1054 px 1.3387 (the least of the two keys), 949 px 1.1363, 902 px 1.008, 852 px 0.8635, 600 px 0.6701 (red). 902 px is the closest with room to spare; the push to 600 px comes after the key still, by 26.35 s.
26. Builder, 15:32: the tug camera shows the whole drop zone, the paper from the hands to the slot, the rollers and the strips. It pushes in for 2.7 s to a 928 px frame and holds; the 600 px push is gone and decision 25 is replaced. MEASURED `npm run measure -- --unit step1`: M3 1.0925 at 6df5400. The cursor is 145 px tall in the 1920 frame.
27. Builder, 15:32: an upload glyph (an arrow rising out of an open tray, 64 px wide, 3 px line, ink) above the prompt of the drop zone, as six boxes of the shell on the face of the card, hidden once the resume is received. The prompt and the Browse chip move down 38 px so the three are centred in the zone. No part of another owner was needed.
28. Slab owner, 15:36: paper strips hang under the hood from the first bite and never go back in; at the key still six hang with u from 0.30 to 0.34.
29. Builder, round 3 (page critic, severe): the tug frame cut the labels and fields of the right column mid word. Both tug frames now end at page x 972 (`FIELD_X` - 16), in the gutter, and both frames start 46 px above the drop zone so its label is whole with 10 px of page above it. The wide frame is 1000 px (was 1200), the close frame stays 928 px, so the cursor stays about 145 px tall, which the Builder accepts with the drop zone whole. MEASURED: `npm run measure -- --unit step1` 8 green, M3 1.092; `npx vitest run tests/step1-script.test.ts` prints the field column 31 px outside the right edge, the label 19 px under the top edge, least cursor margin 86 px (was 228 px: the wide frame now starts at the same height as the close one, under the lead line of the step, which a higher frame cut through its letters; the tip of the cursor is nearest the top edge at 22.93 s; the test asks for 70 px).

## Agreed with other owners

- slab_maker: `resume-paper` v = `[lift, bite, amount, pull, lx, ly, rx, ry, vx, vy, hands]`; the title is `part: 'paper'`; the title and seven lines are pushed every frame in the tug and after; `shredder-jaw-0` and `-1` v = `[open, turn, feed]`; `open` is 1 from the feed of the paper, seconds before the first strip; `strip-<i>` v = `[u, ink]`, leaving from `HOOD`; `email-slab-<i>` v = `[since landing, impact]`.
- keyboard_smith: `TURRET` numbers and `Turrets.step` are unchanged; `key-<name>` v = `[press, hop, shuffle, heat]`; `keyboard-deck` v = `[rise, swing, shake]`.
- cursor_actor: no name in `ACTING`, `REACTIONS`, `DAMAGE` changed; shredded and reassembled 1.0 s each; the gag stays `step1.tug` for 0.3 s after the loss so the torn arms show.
- surface_mason: `field-focus` v = `[glow]`, `field-caret` v = `[jump]`.

## One more gag with its live way out and its events

Written with slab_maker, whose half is in `pipeline/phase3/slabs.md`.

1. Name the beat and its event. They live in `config/film.json` and `content/copy.json`, which are frozen for agents: the Builder adds them. Check with `npx vitest run tests/film.test.ts`.
2. In `src/pages/step1/index.ts` add the phase to `type Phase` and its line to `GAG`. Put every number of the gag in one const in `src/pages/step1/script.ts`, next to `TIMES`.
3. Step it in `step()` from the page state only: `s.phase`, `s.phaseTime`, `io.pointer`, `io.pressed`. No clock, no random. Every number the next frame needs goes into the state object, so `save()` and `load()` carry it with no more code. Check: `npx vitest run tests/step1.test.ts -t "save"`.
4. Give it a way out that needs no skill, then the plain timer: `s.mode === 'live' && s.phaseTime >= live.skipLinkAfterSeconds`. If the gag takes the pointer from the player, give it back inside `live.controlTakenMaxSeconds`. The whole gag, timer included, ends inside `live.skipLinkAfterSeconds + 3`.
5. Add its case to `hint()`: where a player should point now, and `down` only on the frame a press helps. Add what it leaves behind to `skip()`: every list emptied, every flag back.
6. Emit each event once: `io.emit('<name>', x, y, hitsCursor)`, at the frame the thing is seen to happen, not when it is decided.
7. Draw it in `shapes()`: stable ids, a `part`, heights from `config.scale.heights`, and the numbers a maker needs in `v`. Write the meaning of each `v` into the table in `src/pages/step1/NOTES.md`. A shape is never grown to show an action: it moves, or a second shape appears.
8. Script the film: add the times to a const in `script.ts`, the moves and the click to `makePlan()`. The test of the next step reads the time of the event.
9. Add the beat and its event to the table `BEATS` in `tests/step1-script.test.ts`. `npx vitest run tests/step1-script.test.ts`: the event must lie inside the beat, 0.25 s either way.
10. `npm run bots`: all three bots must finish the page, the one that does nothing included.
11. Make it real as a `PartMaker` in `src/pages/step1/real/<part>.ts` that reads the shapes by id and their `v`. Its owner registers it. Write the recipe of any texture in `assets-src/<folder>/RECIPE.md`.
12. Look: `npm run sheet -- --beat <beat> --tier draft`, then `npm run still -- --page step1 --beat <beat> --at 0.5 --format hd --tier draft`, and once with `--diag standins`. The twelve frames alone must tell the gag.
13. `npm test && npm run build && npm run bots && npm run measure -- --unit step1`.

## One more beat of acting

Written with cursor_actor, whose half (the body) is in `pipeline/phase3/cursor-act.md`.

1. Decide what the idea is in one line, and which layer plays it. A mood that lasts is a state. A thing that happens once is a reaction. A place to be is a move.
2. If the body cannot play it yet, cursor_actor adds it: a state is a name in `ACTING` in `src/cursor/body.ts`, a row in `GAIT` and a row in `FEEL` in `src/cursor/act/feel.ts`; a reaction is a name in `REACTIONS`, a length in `REACTION_SECONDS` and a case in `reactionPose()`: wind-up, pose, then nothing. Check: `npx vitest run tests/cursor-act.test.ts tests/film.test.ts`.
3. In `src/pages/step1/script.ts` add the times of the beat to a const of its own (see `FIRST`, `RESUME`). Give the idea four times: wind-up, move, pose, hold. The hold is at least 0.4 s with the pointer still.
4. In `makePlan()` write the moves with `to(from, until, x, y, { arc, ease })`, `leap()` for a jump and `stomp()` for a blow. Two moves never overlap. Use an arc for anything but a walk along a line, `ease: 'in'` for a fall, `'out'` for a throw, `'snap'` for a start.
5. Add the cues: `act(time, '<state>')` for the mood, `react(time, '<reaction>')` for the one-off, `hop(time)` for a start. A reaction comes one or two frames after its cause, never on it.
6. If the page causes the reaction (a hit, a landing, a near miss), call `io.cursor.react()` in `step()` at the cause, so live mode plays it too.
7. `npx vitest run tests/step1-script.test.ts`: no moves overlap, the pointer is still where a pose is held, the events stay in their beats, the cursor stays inside the frame.
8. `npm run sheet -- --beat <beat> --tier draft` and read the twelve frames with no notes: is each idea one clear pose. Then `npm run sheet -- --motion hit` or `--motion reassembly` for the fast ones.
9. `npm run still -- --sheet cursor-acting --format hd --tier draft` to see the state beside the others.
10. `npm test && npm run build && npm run bots && npm run measure -- --unit step1`.
