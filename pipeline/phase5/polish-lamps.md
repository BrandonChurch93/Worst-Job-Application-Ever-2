# The lamp windows under the ball (agent/polish-lamps)

Branch `agent/polish-lamps`, from `308e96a176a61ee1a2f6e7bea92e96c5c48b67ab`. Files: `src/table/real/lights/over.ts` (new), `src/table/real/lights/levels.ts`, `src/table/real/art/index.ts`, `src/table/real/ball/lamps.ts`, in `src/pages/step3/index.ts` only the lines that light a window when the ball rolls over it, `tests/polish-lamps.test.ts`, `pipeline/phase5/polish-lamps-*.mjs`, this file.

Each fact is MEASURED (command and number), STATED (read in a file or in a mail) or UNKNOWN. "Before" is 308e96a1, kept as a second work tree. A "step" is a step of the pack's walk at 60 a second (`run.json`, 10795 steps), a "film frame" is a frame of the film at 60 a second; the pinball unit starts on film frame 4020.

## What the critic saw, and why (before)

1. "White bumper", 2:06.93 to 2:07.00: steps 7616 to 7620, the ball crosses the white window (`street.insert.3`) at 36 to 39 px a step. STATED in `src/table/real/lights/levels.ts`: the window answered the place of the ball alone, so it stood at its full level from the first step a ball lay on it. MEASURED, `node pipeline/phase5/polish-lamps-measure.mjs run RUN.json --from 126 --to 127.2 --near 0.55` on 308e96a1: glass glow 0.67, 0.80, 0.91, 0.99, 1.00, 1.00, 0.94 on steps 7614 to 7620. MEASURED, `node pipeline/phase5/polish-lamps-rim.mjs walk` on the before pictures: glass clear of the ball 217 to 249 of 255, the rim of the ball darker than the glass beside it at 24 of 26, 32 of 42, 46 of 51, 37 of 46, 26 of 31 places on steps 7616 to 7620. What I saw: the window is one white disc, its picture gone, a halo outside the brass ring, the ball white inside with a faint rim.
2. "Yellow clock bumper", 2:06.35: step 7580, the ball crosses the amber window (`street.insert.2`) at 108.8 px a step. MEASURED, same command: glass glow 0.64, 0.64, 0.65, 0.97, 0.91, 0.72 on steps 7577 to 7582: one bright frame.
3. The heights. MEASURED, `node pipeline/phase5/polish-lamps-measure.mjs heights`: the glass 0.85 px (rim) to 1.30 px (middle) over the floor the ball rolls on, the plate 0.5, the brass seat ring 0.3 to 1.4; the plane of the ball's shadow 3.4 (STATED, `src/table/real/ball/index.ts`).

## Decisions

1. The count. A window keeps a count of how far its brighter light has come up, 0 to 1. It lives in the stepped state of the page (`s.over`, keyed `insert.<id>`, kept only while a ball is in reach of the window) and so in whatever the stage saves. It rises by `dt / OVER.rise` on every step in which the middle of the ball is over the glass (gap at or under half a ball below zero), holds while the ball is in reach but off the middle, and is dropped when the ball is out of reach (gap at or over `ANSWER.reach` 0.55). `OVER.rise` is 4/60 s: four frames. The draw list carries it as the second number of the window's `v`; the art reads the draw list only. The window's answer is `risen(count)` times the answer of the place alone (`near`, unchanged), so it is never over what it was. No number of round 12 is changed (reach 0.55, hit 1.0, lit 0.72, rest 0.34, on 0.64). The Builder ruled this not contested (mail, clock 13:43Z).
2. The eased rise. `risen` is the smooth step, so the four frames take 0.04, 0.27, 0.37, 0.27 and 0.04 of the way; the most one frame takes is 0.367. My test first said "under 0.36"; that was my own wrong sum and I set it to "under 0.4" before any push.
3. The soft dark spot. In the window's own shader the glass gives `1 - OVER.shade * (1 - smoothstep(0, OVER.far, q))` of its own light, `q` the distance from the middle of the ball in ball radii, `shade` 0.45, `far` 2.1 radii: one radius and the reach of the window's answer. Beyond `far` the factor is exactly 1. The fall is level at both ends, so there is no edge. A first form (a bell of 1.15 radii, shade 0.3, cut from 1.26 radii) did not show beside the ball in the pictures and was dropped.
4. What the ball shows. In `src/table/real/ball/lamps.ts`, while the ball stands on the glass of a window (`onGlass`: 1 with its middle inside the rim of the glass, 0 when the rims part), the wall of the ball takes `1 - OVER.wall` (0.15) of that window's light and its show of the window `1 - OVER.show` (0.65). The order of the lamps is still by what they were (`rank`). The window's colour in the ball follows the window's level, so it comes up with the count and leaves with the place. `src/table/real/ball/index.ts` and `ball/glsl.ts` are not touched.
5. The heights are left as they are (the Builder agreed; it logs the open item). They are pinned in the test.
6. The pictures of the film: the chosen passes are drawn, the rest is proved on the draw list (the Builder accepted this).
7. Pushes. The brief asks for a push every 15 minutes and for all four checks green before every push. The checks take longer than that together with the pictures on this machine, so I committed as I went and pushed only with the checks green.
8. `pipeline/phase5/polish-lamps-rim.py` of my first commit is gone; `polish-lamps-rim.mjs` does its work, so that every script of mine is a `polish-lamps-*.mjs`.
9. The sheets sent with the reports are cut and laid side by side by a throw away script outside the repository; nothing in them is scaled except the one at 3 times.

## MEASURED after (tree of this branch)

Glass glow of a lit window per frame, before then after. Film: `node pipeline/phase5/polish-lamps-measure.mjs film --near 1` in each tree (stepped). Walk: `node pipeline/phase5/polish-lamps-measure.mjs run RUN.json --from 126 --to 127.2 --near 0.55`; the after column keeps the count from row to row at 1/60 s, while the page steps at 1/240 s, so the count on the walk may stand up to 0.19 higher than the column says. The pictures of the walk are drawn by the page itself.

| pass | frames | before | after |
| --- | --- | --- | --- |
| walk, pass 1, amber, 108.8 px a step | 7577 to 7582 | 0.64, 0.64, 0.65, 0.97, 0.91, 0.72 | 0.64, 0.64, 0.64, 0.69, 0.68, 0.65 |
| walk, pass 2, white, 36 to 39 px a step | 7614 to 7621 | 0.67, 0.80, 0.91, 0.99, 1.00, 1.00, 0.94, 0.81 | 0.64, 0.64, 0.64, 0.69, 0.82, 0.94, 0.89, 0.78 |
| walk, pass 2, amber, 40 to 45 px a step | 7620 to 7626 | 0.78, 0.93, 1.00, 1.00, 0.98, 0.85, 0.67 | 0.64, 0.64, 0.70, 0.82, 0.92, 0.82, 0.66 |
| film, white, 21 to 23 px a frame | 6213 to 6223 | 0.87, 0.93, 0.98, 1.00, 1.00, 1.00, 1.00, 0.97, 0.92, 0.84, 0.74 | 0.64, 0.64, 0.65, 0.75, 0.89, 0.98, 1.00, 0.97, 0.92, 0.84, 0.74 |
| film, amber | 6222 to 6227 | 0.86, 0.92, 0.97, 0.99, 0.99, 0.99 | 0.64, 0.64, 0.64, 0.72, 0.85, 0.95 |

- The middle of the ball is nearest the middle of the window on step 7618 (12.1 px off, white), step 7623 (14.2 px, amber), film 6217 (14.2 px, white). The window is fullest on 7619, 7624 and 6219: one frame, one frame and two frames after. On the film the level on 6218 is 0.98 against 1.00 on 6219.
- On the walk the ball is over the glass for three steps only, so the count stops at about 0.75 and the window stops at 0.94 (white) and 0.92 (amber) instead of 1.00. On pass 1 the ball is over the glass for one step and the window goes from 0.64 to 0.69: the one bright frame is gone, and so is most of the answer to a ball that fast.
- The film's count on `street.insert.3`: 0, 0, 0.125, 0.375, 0.625, 0.875, 1 on 6213 to 6219 (in `tests/polish-lamps.test.ts`).
- Rim and glass on the pictures of the walk, luminance of 255, `node pipeline/phase5/polish-lamps-rim.mjs walk RUN.json DIR 7579 ... 7625` on the before and the after pictures. "Glass" is the glass clear of the ball, "floor" is the floor 12 px outside the glass (the halo), "rim darker" is at how many places round the ball the rim (43.5 to 47 px from its middle) is darker than the glass just outside it (50.5 to 55 px).

| step | window | glass before, after | floor before, after | rim darker before | rim darker after |
| --- | --- | --- | --- | --- | --- |
| 7580 | amber | 221, 202 | 51, 47 | 35 of 37 | 35 of 37 |
| 7581 | amber | 219, 204 | 50, 49 | 20 of 26 | 20 of 26 |
| 7616 | white | 240, 212 | 46, 35 | 24 of 26 | 20 of 26 |
| 7617 | white | 239, 203 | 48, 33 | 32 of 42 | 28 of 42 |
| 7618 | white | 230, 170 | 46, 33 | 46 of 51 | 41 of 51 |
| 7619 | white | 248, 235 | 49, 42 | 37 of 46 | 42 of 46 |
| 7620 | white | 248, 246 | 48, 46 | 26 of 31 | 27 of 31 |
| 7621 | amber | (white 236, 234) | (white 39, 38) | 11 of 29 | 11 of 29 |
| 7622 | amber | 194, 174 | 49, 45 | 25 of 45 | 28 of 45 |
| 7623 | amber | 188, 171 | 52, 48 | 42 of 51 | 40 of 51 |
| 7624 | amber | 221, 213 | 54, 50 | 37 of 38 | 37 of 38 |
| 7625 | amber | 219, 215 | 50, 50 | 10 of 13 | 7 of 13 |

  The white window with the ball 151 px from its middle and its level at 0.65: glass 220, floor 34 to 35 (step 7622). So the halo is gone on 7616 to 7618 (floor 33 to 35) and is not gone on 7619 (42) and 7620 (46). The rim measure holds on the walk only: the film's camera looks from low down, so the same reading on film frames is not valid and is not given.
- The ball's place, speed and roll on film 6213 to 6229: `node pipeline/phase5/polish-lamps-path.mjs` gives the same 17 rows in both trees (pinned in the test). Every saved state of the film without the count: `node pipeline/phase5/polish-lamps-state.mjs` gives `4e4de23c7807426f` in both trees (2520 frames; pinned in the test). The walk: `node pipeline/phase5/pack-frames-look.mjs RUN.json DIR 2 7575 ... 7626` replayed the recorded walk on this tree to step 7626 and drew 27 pictures in 435.9 s; it stops with an error when the walk leaves the recorded rows, and it did not. The rows hold the place of the ball at each step; its roll on the walk is UNKNOWN beyond that.
- `tests/polish-ball.test.ts`: the film's state hash at 18, 21 and 24 s changed (f235b7d4, f676307c, f011e14b to f75112a9, 66a8fde5, 8758c1fe); the other eleven are as they were. Only those three numbers are changed, with one line saying why. At those moments (film 5100, 5280, 5460) a ball is in reach of a window and the state holds its count.

## The bound: nothing changes with no ball over or beside a window

- Key pictures at draft, `npm run still -- --key K`, then `cmp` with the same from 308e96a1: `table-wide` byte equal; `tier-street` byte equal; `tier-office` differs; `tier-corporate` differs.
- `tier-office` is film frame 5064 and `tier-corporate` is film frame 4776: in both a ball is in reach of a window (ranges below). `tier-office`: 9557 px differ, none by more than 4 of 255, inside the box x 884 to 1281, y 483 to 853 (the ball beside the blue window). `tier-corporate`: 45736 px differ, 2471 of them by more than 8, the most 20 of 255; those lie in the box x 909 to 1011, y 716 to 819, the white hour glass window the ball stands beside: before it was raised by the ball beside it (the place alone), now it stands at its lit level until the middle of a ball is over it. I looked at both side by side: in `tier-corporate` the window is a little less white, its picture as before; in `tier-office` I see no difference by eye.
- Pictures of the walk with a ball on the street tier and out of reach of every window, `cmp` of before and after: steps 7575, 7576, 7577, 7583, 7584, 7585, 7611, 7612, 7613 byte equal (9 pictures). Steps 7578, 7614 and 7626, with the ball in reach (gap 0.50, 0.34, 0.37 balls), differ.
- The factor of the spot is exactly 1 past `far` (the smooth step is 1 there), and the shader skips an empty place in the list of balls.

## The film frames that change

Every frame in which some window has a ball in reach (gap under 0.55 balls), from the stepped draw list (the window's `v` has two numbers): 575 frames, pinned in the test as `CHANGED`. No other frame's draw list or state differs (the test: `v` of one number, no count in the state, on the other 1945).

4759 to 4800, 4875 to 4884, 4953 to 5141, 5278 to 5428, 5432 to 5485, 5491 to 5496, 5554 to 5580, 5828 to 5838, 5844 to 5855, 6139 to 6152, 6158 to 6164, 6210 to 6255, 6261 to 6266.

Drawn before and after: 6213 to 6227 (the white window, then the amber one). The others are not drawn; what changes in them is the same law on the same draw list.

## Not mended, and open

1. (a) "the rim darker than the lit glass behind it all the way round on every frame": not reached. The table above: no frame has it at every place, and the soft spot lowers the glass right beside the rim, which works against this measure on 7616 to 7618, 7623 and 7625. The rim's own brightness is made in `src/table/real/ball/glsl.ts` (the wall's shine and the flecks of line 327), which is not mine this round. What it would take: a NEEDS patch there that holds the rim's shine under the glass's level while `onGlass` is over 0. Not written: no time to prove it in pictures.
2. The white window at its full level: the glass stands at 235 to 246 of 255 on steps 7619 and 7620 (248 before), its picture is nearly gone there and the floor outside the ring is at 42 and 46 against 34 with the window at its lit level. To bring that down the hit level 1.0 of round 12 would have to come down, or the window would have to hold back while a ball is on it by more than a soft spot. Rule 6: contested, logged, not changed.
3. The heights (2c): left as they are, pinned. The Builder logs the open item.
4. A ball that crosses a window in one or two steps (pass 1) now hardly lights it (0.64 to 0.69). That follows from "up over 3 to 5 frames from the frame the middle is over the glass". If the answer to a fast ball is wanted back, the count would have to go on rising after the ball has left the middle; that is a choice for the Builder.

## What I saw in the pictures (real size unless said)

- `lamps-pass2.png` (steps 7614 to 7619 white, 7620 to 7625 amber, before above, after below): before, the white window is a plain white disc from 7616 on, the hats gone, a pale halo outside the brass ring, the ball a white disc with a thin rim on 7618. After, the glass is cream on 7614 to 7618 with the hats drawn, a soft grey shade lies round the ball and moves with it, the rim of the ball is seen all the way round on 7617 and 7618; on 7619 the glass is white again right of the ball and the hats are faint. Amber: before, bright from 7621; after, the glass is a duller orange beside the ball on 7621 to 7623 and comes up on 7624. I see no edge to the shade, no ring and no hole.
- `lamps-pass1.png` (7577 to 7582): before, 7580 is one frame of yellow white glass with a halo; after, the window stays near its lit level on all six frames, with a soft shade where the ball lies on it on 7580 and 7581.
- `lamps-film.png` (6215 to 6219 white, 6223 to 6227 amber): before, the white window is at full white from 6215; after, it is cream with a darker patch under the ball on 6215 to 6217, whiter on 6218, full on 6219. Amber the same, three frames later. The ball's outline is the same in both rows. The pale pool on the floor left of the ball on 6219 is in both.
- `lamps-3x.png` (step 7618 at 3 times, the middle of the ball 12.1 px from the middle of the white window): before, white glass, the ball's rim lost on its upper left; after, cream glass, grey shade round the ball, the rim of the ball lighter than the shade in places and unbroken. Through the ball I see the ball's own small show of the hats and of the bezel, as before; I see no line of the 1.3 px step.
- Film frames 6217 and 6219 from straight above (`node tools/still.mjs --page pinball --beat pinball.save --at 0.872222 --camera tier-1 --live high`, and `--at 0.883333`), at 3 times: the same reading as the walk.

## Scripts

- `polish-lamps-measure.mjs`: `film [--near N]` the windows a ball is near on each film frame, stepped; `run RUN.json --from S --to S` the same on a walk's rows; `heights`.
- `polish-lamps-film.mjs OUT_DIR FIRST-LAST`: whole film frames at draft.
- `polish-lamps-path.mjs`: the ball's place, speed, roll and the count on film 6213 to 6229.
- `polish-lamps-state.mjs`: one number for every saved state of the film without the count.
- `polish-lamps-rim.mjs`: rim, glass and halo on pictures of a walk.
