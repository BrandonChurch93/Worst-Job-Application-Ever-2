# Cursor acting, damage and arms

Branch `agent/cursor-act`. Parts: `cursor-acting`, `cursor-damage`, `cursor-arms`.

## What the approved images show

1. Where the highlight sits: one soft broad band along the upper left of the white face, a hand's width in from the edge, and a second thinner one on the dark edge band itself. On the arms it is a faint long streak on the upper side of the tube, never a hard line: the rubber is matte.
2. How wide the bevel is: the dark edge band is 6 to 8 percent of the body's width, with a rounded shoulder of about a third of that between the face and the band. An arm is about 3 percent of the body's height thick, the cuff ring half as thick again.
3. How dark the gap is: the contact shadow under the body is tight and close to black for a few pixels at the lower right, then a soft wide shadow. Between fingers, and between a hand and the paper it holds, the gap is nearly as dark as the rubber. Between strips of a reassembled body it is a hairline, not a slot.
4. What the edge does: the face rolls over into the band, it does not meet it at a crease. The rim of a burn hole is raised, charred black, and glows orange on its inner lip. The cut edge of a strip is clean and pale. The edge of a flattened body is thin and its face is crazed with fine cracks.
5. What the states do: nervous is short with beads of sweat, shocked is stretched tall off the page, angry is red to orange from the tip with steam, scared is pale matte stone leaning away, exhausted sags and runs, the hole lets the page show through. Arms leave from the sides of the head, bow under their own slack and end in a hand a fifth of the body's height.

## How it is put together

Three layers, each with its own state, in `src/cursor/body.ts`:

1. Where it goes: the position spring and the gait, picked by the acting state (`GAIT`): plain walk, strut for confident and proud, tiptoe for nervous and scared, drag for exhausted. The speed and the step events are as they were, so no script timing moved.
2. How it feels: `FEEL` in `src/cursor/act/feel.ts`, one row of numbers per acting state. The sim eases each number with its own time (`FEEL_EASE`), so a change of state is seen.
3. What just happened: `reactionPose()` gives each reaction a wind-up, a pose and a hold. Springs (`SPRING`) chase the sum of the three layers and overshoot.

Damage is a list of wounds, each with the share of its life that has passed (`CursorPose.wounds`). `src/cursor/act/damage.ts` turns that share into what is seen (`LIFE`), so every heal plays out. Strips are a small sim of nine falling pieces seeded through `hash01`. Arms are sprouted by a stiff spring and exist only while the stage allows them.

`src/cursor/act/acting.ts` and `damage.ts` only write numbers into the look. The body and the effects draw them. `src/cursor/act/arms.ts` draws the arms itself.

## Decisions

1. Timing of position, height and step events was left exactly as on main. Everything new is posture on top. Reason: the film timing, the bots and the loop seam depend on it.
2. `cursorReal.acting`, `damage` and `arms` are true only when the body is real too. Without a real body the stand-in arms, strips and sweat keep drawing, and the still lists them as stand-ins, which is the truth.
3. A burn is placed by the knock that comes with it in the same step, on the side the bolt came from, inside 2.1 units of the middle of the head so a hole of radius 2.15 never leaves the body. `hurt('burn', seconds, at)` may give the place in page pixels.
4. Heal window: the first hurt opens a window of `cursor.damageHealSeconds` less two steps. No wound lasts longer than 0.85 of the heal time, and none past the window, however often it is hurt again.
5. A shredding left alone turns into a reassembly by itself, so strips never just vanish.
6. Torn off arms trail for at most 0.3 s after `setArms(false)`, and only while the stage still allows arms. In the film today the gag leaves `step1.tug` on the same step, so they are not seen. The director can hold the gag for 0.3 s to show them.
7. Gulp and bounce run on an integer step count with whole periods, and a fresh body takes its state at once. Reason: the 8 s card loop must meet itself.
8. Sheets: states in the order of the approved images, camera pushed in, the cursor's own size untouched.
9. The arms use one material of their own through `studio()`: matte rubber, `specularIntensity` 0.5, roughness 0.72, sheen 0.55. One 64 px normal picture.

## Agreed with other owners

- cursor_modeller: nine strips cut along the tail, index 0 leftmost, y up the page; holes up to four, radius up to about 2.4 units; `seam`, `crack`, `peel`, `gulp` in `BodyLook`; `emit()` for the body's own light, passed on by `src/cursor/view.ts` to `ctx.light`.
- step1_director: no names change in `ACTING`, `REACTIONS`, `DAMAGE`. Gaits come with the acting state. Gulp is automatic under nervous. The body braces by itself while arms are on. Asked for 1.0 s of `shredded` and 1.0 s of `reassembled` in place of 0.45 and 0.6.

## One more beat of acting

1. Decide which layer it is. A lasting mood is a state. A thing that happens once is a reaction.
2. A state: add its name to `ACTING` in `src/cursor/body.ts`, a row to `GAIT` there (copy the nearest and change `stride`, `hop`, `rock`, `dip`), and a row to `FEEL` in `src/cursor/act/feel.ts`. Keep `stretch` inside 0.45 to 1.5 and the rest inside 0 to 1.
3. A reaction: add its name to `REACTIONS` and its length to `REACTION_SECONDS` in `src/cursor/body.ts`, and a case to `reactionPose()` in `src/cursor/act/feel.ts`: first the wind-up against the move, then the pose, then nothing, so the springs settle past rest by themselves.
4. If it needs a look no number gives yet, add the number to `Feel`, `FEEL_KEYS` and `FEEL_EASE`, write it into the look in `src/cursor/act/acting.ts`, and ask the owner of `src/cursor/contract.ts` for the field in `BodyLook` or `EffectsLook`.
5. Call it from the page: `io.cursor.act('<state>')` or `io.cursor.react('<reaction>')`, as in `src/pages/step1/index.ts`.
6. Add it to a sheet in `src/cursor/sheets.ts` with `restPose(x, y, { acting: '<state>' })`.
7. `npx vitest run tests/cursor-act.test.ts tests/film.test.ts`: the tests run over every name in `ACTING` and `REACTIONS`, and the loop seam must still hold.
8. `npm run still -- --sheet cursor-acting --format hd --tier draft`, then `npm run sheet -- --beat <the beat> --tier draft`. Look for wind-up, pose, overshoot, settle, in that order.
9. `npm test && npm run build && npm run bots`.

## One more kind of damage

1. Add its name to `DAMAGE` in `src/cursor/body.ts`. `hurt('<kind>')` then works, heals inside the window and is saved and loaded with no more code.
2. Add its life to `LIFE` in `src/cursor/act/damage.ts`: the shares at which it lands, holds and heals. Add a branch to `woundOf()` that turns the share `w.at` into numbers of the look. Every number must come back to rest at share 1, by a ramp and not a switch.
3. If the body needs a new number to draw it, ask the owner of `src/cursor/contract.ts` for the field in `BodyLook`, with its range.
4. If it has loose parts, seed them from `s.seed + s.shreds` with `hash01`, step them in `step()` where the strips are stepped, and send them in the pose.
5. Add it to the damage sheet in `src/cursor/sheets.ts`: `restPose(x, y, { damage: ['<kind>'], healing: <the share that reads best> })`.
6. `npx vitest run tests/cursor-act.test.ts`: the test over every name in `DAMAGE` checks it is healed inside `cursor.damageHealSeconds` and shows on the way. Add its line to the test "nothing switches back".
7. `npm run still -- --sheet cursor-damage --format hd --tier draft` and `npm run compare -- --sheet cursor-damage`.
8. Call it from the page: `io.cursor.hurt('<kind>')`, then `npm run sheet -- --beat <the beat> --tier draft` to see hit, reaction, settle and heal in order.
9. `npm test && npm run build && npm run bots`.
