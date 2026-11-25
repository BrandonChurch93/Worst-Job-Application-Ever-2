# Cursor acting, damage and arms

Branch `agent/cursor-act`. Parts: `cursor-acting`, `cursor-damage`, `cursor-arms`.

## What the approved images show

1. Where the highlight sits: one soft broad band along the upper left of the white face, a hand's width in from the edge, and a second thinner one on the dark edge band itself. On the arms it is a faint long streak on the upper side of the tube, never a hard line: the rubber is matte.
2. How wide the bevel is: the dark edge band is 6 to 8 percent of the body's width, with a rounded shoulder of about a third of that between the face and the band. An arm is about 7 percent of the body's height thick, the cuff ring half as thick again.
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
3. A burn is placed by the knock that comes with it in the same step, on the side the bolt came from, inside 2.1 units of the middle of the head so a hole of radius 1.75 (the clean hole; the charred one is 1.4) never leaves the body. `hurt('burn', seconds, at)` may give the place in page pixels.
4. Heal window: the first hurt opens a window of `cursor.damageHealSeconds` less two steps. No wound lasts longer than 0.85 of the heal time, and none past the window, however often it is hurt again.
5. A shredding left alone turns into a reassembly by itself, so strips never just vanish.
6. Torn off arms trail for at most 0.3 s after `setArms(false)`, and only while the stage still allows arms. In the film today the gag leaves `step1.tug` on the same step, so they are not seen. The director can hold the gag for 0.3 s to show them.
7. Gulp and bounce run on an integer step count with whole periods, and a fresh body takes its state at once. Reason: the 8 s card loop must meet itself.
8. Sheets: states in the order of the approved images, camera pushed in, the cursor's own size untouched.
9. The arms use one material of their own through `studio()`: matte rubber, `specularIntensity` 0.5, roughness 0.66, sheen 0.8, colour 0x262524. One 64 px normal picture. An arm is 7 percent of the body's height thick (radius 0.035) and widens to the wrist, as in the approved image.
10. The arms are four draws for the pair: one tube mesh for both arms, and instanced palms, cuffs and finger joints. An arm is 5.4 percent of the body's height thick at rest and thins to 0.78 of that when stretched. A hand is mirrored by its layout, never by a negative scale. An arm that reaches across the body rides over its face.
11. The pose is clamped where it is read (`LIMIT` in `src/cursor/body.ts`): stretch 0.5 to 1.5, lean within 0.8. Reason: springs stacked on a hit could fold the body through itself.
12. The settled pile is the arrow fanned open (`lie()` and `FAN` in `src/cursor/body.ts`): each strip is swung about its own top end, slid along itself and pushed from its neighbour, flat on the page, stacked by 0.36 px. Reason: the cut gives three long strips and six short ones, so a tight fan of equal sticks, as in the approved image, cannot be had from this cut; a fan of the arrow reads as shredded and still as the cursor.
13. A reassembled body is held by two lengths of matte tape (`src/cursor/act/tape.ts`, one draw, no texture). Each is rolled on from one end once the strips stand, and pulled off from the other end as the seams fade. Reason: askew strips alone read as a broken cursor, not as a mended one.
14. A burn hole flakes clean before it closes: `burnt` goes from 1 to 0 over shares 0.44 to 0.60 of its life, the hole closes from 0.64. The damage sheet shows it at 0.63, the punched hole of the approved image. The acting sheet shows it at 0.2, burnt and glowing.
15. A closed hand rides 7 px above the height the page gives it (`HOLD` in `src/cursor/view.ts`), so the fingers lie on the sheet and not inside it.
16. The arms sheet draws the real resume sheet, at its true size of 220 by 300 px, in the poses holding and pulling. So the sheet's camera is pushed in less than on the other two (2.9 against 5.2) and the cursors are smaller in it than in the approved image, where the paper is drawn smaller than it is in the film.
17. While the arms are out, an angry cursor shows 28 percent of its heat and no steam (`BUSY` in `src/cursor/act/acting.ts`). Reason: in the key still of the tug the approved cursor is white, and steam 19 s after the burn read as the singe still smoking.
18. Limits on stretch and lean are leaned into, not hit (`soft` in `src/cursor/body.ts`): stretch stays inside 0.55 to 1.4, lean right inside 0.34, lean left inside 0.6. Leaning right stops short of 0.42, where the arrow stands upright on its tail and stops reading as a cursor. A clenched fist is drawn 1.4 times the size of the open hand, or it is lost on the sheet it holds. An arm is rooted 9 percent in from the shoulder so it leaves from under the edge.
19. A hit knocks the body over (`TUMBLE` in `src/cursor/body.ts`): a `recoil` turns it 1 radian the way the bolt was going (with the lean of its flight on top the tip points about 45 degrees up, as approved; 1.25 laid it flat) within about 0.1 s, holds it for 60 percent of the reaction and swings it back on a softer spring. It is carried in `spin` of the pose, apart from `lean`, so the soft limit on lean stays. Reason: in `references/approved/step1-fire.png` the struck cursor lies on its other shoulder, tip up and to the right. A lean of 0.3 to 0.6 only stood it upright, which read as an arrow pointing up; past upright it reads as a cursor knocked over. Seen in key `step1-fire` at 6.0 s and in stills at 6.1, 6.2, 6.3 and 6.45 s (knocked, in the air, swinging back, standing).
20. A shredded body does not melt, and a reassembled one melts only in the last 12 percent of its mend (`LIFE.reassembled.firm` in `src/cursor/act/damage.ts`). Reason: the page asks for `exhausted` at the moment the strips zip together, and the droop hid the seams and the tape, so the mend read as a blob. The tape is placed through `body.anchor()`, so it stays on the body when the body is stretched or bent.
21. A scorch sends char 0.62 at its worst (`LIFE.scorched.reach`) and the crust draws back to the tip as it heals. Agreed with cursor_modeller: 0.62 draws the burnt tip of the approved damage sheet (a crust of about 4.3 units with a brown fringe); char 1 is a crust over 40 percent of the head, kept for a worse burn.
22. Thrown through the air the cursor goes tip first (`DIVE` in `src/cursor/body.ts`): when it is more than 5 px off its floor and faster than 150 px a second, `spin` turns the tip toward the way it flies, at most 1.25 radians, by the sine of the angle between the two, so a flight tail first leaves it alone and nothing jumps. Reason: the approved fire image shows the flying cursor turned, tip leading. Measured in the film of step 1 at 6.0 s: the flee is nearly straight up, the turn is 0.36 radians.

## Agreed with other owners

- cursor_modeller: nine strips cut along the tail, index 0 leftmost, y up the page; holes up to four, radius up to about 2.4 units; `seam`, `crack`, `peel`, `gulp` in `BodyLook`; `emit()` for the body's own light, passed on by `src/cursor/view.ts` to `ctx.light`.
- cursor_modeller, the split of heat, melt and burn: the actor sends heat 0 to 1 (with a pulse of 8 percent) and steam 0 to 1, the model draws the whole picture of heat and its light. Exhausted: the actor sends melt 1, stretch 0.8, bend 0.15; droop, tail and runs are the model's. Burn: the actor sends radius 1.4 while charred (the modeller measured 2.15 as 0.45 of the body's width against 0.2 in the approved image) widening to 1.75 as the char flakes off (2.15 with the model's broken rim was near half the body's width, the approved punched hole is about a quarter), glow and `burnt`; the rim is the model's. `Hole.burnt` is in the contract (1 or left out is charred, 0 is punched clean).
- slab_maker: a shape of part `paper` with id `resume-paper:<name>` is a sheet of its own. With `v = [0, 0, 0, pull, lx, ly, rx, ry, 0, 0, 1]` it lies flat at the box given (220 by 300), `pull` 0 is clean and 1 is creased with the dog ear. It reads no other shape when it is not bitten. The held edge is 5 px above the sheet's `z0`.
- step1_director: when the tug is lost the page calls `setArms(false)` and the gag stays `step1.tug` for 0.3 s more (`TIMES.lost`), so the torn off arms are seen. The body is brought nearer the sheet: hands about 70 px from the shoulders in the key still.
- step1_director: no names change in `ACTING`, `REACTIONS`, `DAMAGE`. Gaits come with the acting state. Gulp is automatic under nervous. The body braces by itself while arms are on. Asked for 1.0 s of `shredded` and 1.0 s of `reassembled` in place of 0.45 and 0.6.
- step1_director (7efbadd): after the tug is lost the body is held whole over the card for the 0.3 s, then dives, and `recoil` stays at the loss. The flee before the one hit goes up and to the right, so the turn of decision 22 lays the cursor tip up and to the right in the key frame at 6.0 s; the one hit is at 7.138 s.

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

## Round 3 issues on the arms sheet: what was done and what is open

Done on the last push (looked at once each at review, not scored by a critic):

1. Fingers: the three fingers sit closer (`lay` in `src/cursor/act/arms.ts`, x 2.5, splay 0.11) and an open hand curls a little (0.14 and 0.22 radians), the thumb opens less (0.95). Idle, waving and bracing all draw from these numbers.
2. Holding and pulling: the hands are 68 px apart on the top edge (`PAPER.hands` 34 in `src/cursor/sheets.ts`) and the body stands nearer the sheet (68 and 100 px from the tip), so the arms are short arcs.

Open, for whoever comes next:

1. Holding paper: the sheet is the real resume sheet at true size (220 by 300 px beside a 70 px cursor), so it cannot be held in front of the arrow by its two sides. Wanted: a small sheet. Either slab_maker gives `resume-paper:<name>` a size, or the pose draws a small sheet of its own under `src/cursor/act/`.
2. Pulling paper: no feed slit is in the sheet's draw list. Add the slot shape of step 1 to the list in `arms()` of `src/cursor/sheets.ts` under the pulling pose and set `pull` so the sheet bends into it.
3. Bracing: the hands are placed by `left` and `right` in `ARMS` (page px from the tip and a height); the wrist follows the arm's end tangent in `Limb.pose` of `src/cursor/act/arms.ts`, there is no bend back at the wrist. A wrist angle per pose is the missing number.
4. An upper arm over the white face: the shoulders are `anchor()` points of the body, `ROOT` 0.09 of the way in from the side (`src/cursor/view.ts`). Moving them to the edge band needs the anchor from cursor_modeller.

Also from round 3, asked by cursor_modeller:

1. Done: exhausted sends no sweat (`FEEL.exhausted` in `src/cursor/act/feel.ts`), so the melt has no beads.
2. Done on the two sheets only: a body with a hole lies at z 1, not at hover, so the page seen through the hole is less in the body's own shadow. On the page the cursor keeps its hover.
3. Open: a shredded pile of 14 to 16 narrow slivers. The model cuts as many strips as `StripPose` entries are sent; the pile, the fan and the mend in `src/cursor/body.ts` are written for nine (3 long, 6 short) and the tests in `tests/cursor-act.test.ts` and `tests/cursor-act-mend.test.ts` count nine.
