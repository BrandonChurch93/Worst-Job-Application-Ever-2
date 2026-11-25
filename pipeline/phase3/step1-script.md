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
| `step1.firstName` | 2 to 10 | turrets rise, P e r typed between shots, a dodge, a duck, "l", then it stands proud and still for over a second, is hit, holds the shock, scrambles clear, types the name to the end, Enter 8.9 | `bolt-hit-cursor` 5.89 |
| `step1.lastName` | 10 to 15 | eight keys, the board shuffles after each, three hunts with a look first, Enter | `keys-shuffle` 10.37 and seven more |
| `step1.email` | 15 to 20 | one slow key, then a run, Enter, three slabs hang and fall, three dives, the third off the keyboard | `slab-drop` 18.31, 18.86, 19.41 |
| `step1.resume` | 20 to 22 | the deck sinks, the paper slides out with friction, a look, a walk, a grab, a carry on an arc, a drop | `paper-slide` 20.45 |
| `step1.tug` | 22 to 28.25 | arms out, four pulls each with a wind-up, the shredder wins, 0.3 s with the arms torn | `arms-out` 22.03 |
| `step1.shredded` | 28.25 to 32 | strips fall to a pile for 1.0 s, the form empties a field at a time, the strips zip back for 1.0 s, a double take, exhausted, a trudge off | `strips-zip` 29.18 |

## Decisions

1. The helper of First name sits under its field at the left, and Last name and Email are moved down by `HELPER_ROOM`, 34 px. `FIELD_GAP` went from 16 to 12 so the form still ends above the note and the deck.
2. The one hit of the film is the shot of 5.42 s, which lands at 5.89 s. The key picture `step1-fire` is the frame at 6.0 s, so it shows the burn 0.1 s old, "Perpl" still in the field and the next bolt in the air, as approved. The letter burns away 0.2 s after the hit (`SINGE`).
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
