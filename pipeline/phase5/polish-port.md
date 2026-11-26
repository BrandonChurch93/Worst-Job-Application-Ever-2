# The machine page's own moments: the pull, the close, the ride, the card, the wedge

Branch `agent/polish-port`. Files changed: `src/pages/step3/index.ts` (not `direct()`, not `SHOT`, `PULL`, `NEST`, `RIDE`), `src/table/real/frame/loader.ts`, `src/pages/step3/NOTES.md`, `tests/polish-port.test.ts`, this file.

How the numbers were taken: `PORT_TRACE=/tmp/trace.json npx vitest run tests/polish-port.test.ts` steps the film's take of the pinball page and writes, for every frame of 60, the arrow's pose, the ball's place, the page's scroll, the shell's numbers, the card's height and the port ring's clock. The port's middle is (1627, 520), the ball is 96 px.

## What each moment did before (MEASURED, origin/main 02eeb686, film, per frame of 60)

- The pull. The arrow is taken at 1.933 s and driven by its spring to the port, slowing as it comes (per frame 13, 11.5, 9.7, 7.8, 5.8, 4.1 px). It stands with its tip on (1627, 520) at z 30, stretch 1.08, turn 0.42 from 2.10 s to 2.300 s. In one frame (2.300 to 2.317) z goes 30.4 to -39.4, stretch 1.085 to 0.780, turn 0.42 to -0.60, and the place switches from tip on the middle to body on the middle. The glass does not make it smaller (`sealedFit().hold` is 1.000): what was read as a shrink is the shortening, the sink and the turn, all in that frame. Event `ball-seal` at 2.300.
- The close. The shell's `v[0]` runs straight from 0.05 to 0.97 over 16 frames (2.317 to 2.567) and is 1 at 2.583. Nothing answers the meeting but the arrow's own turn to 0.55 and stretch 0.8. The cup's ring answered once, at the seal.
- The drop. Release at 3.3 s (`tube-run` 3.296). The ball runs at about 832 px/s, steady. On the screen its y is 520 (3.3), 589 (3.4), 624, 643, 652, 657, 659 (3.9) and then stays at 657 to 661: 140 px in 0.6 s, then pinned. The arrow's turn stays near -0.12: no roll.
- The card. Shown from 39.533 s. Height 3.8 (39.6), 6.7, 9.9, 11.9, 12 (40.0); the button's cap 4.0 to 14. It starts 3 px high with its face and words whole in the first frame, 0.4 s smoothstep, no settle.
- The drain (film). Ball on the drain rail 37.7 to 38.65, held at the outlet, shell opens 38.65 to 38.85, arrow out at 38.9. The arrow's turn stays near -0.3 on the rail: no roll.

## What each does now (MEASURED the same way)

- The pull. The aim runs from where the arrow was taken to the port with growing speed (`PLUNGE`: per frame 0.9, 1.7, 2.5, 3.2, 3.9, 4.5, 5.1, 5.4 px from 2.05 to 2.18 s) and the body is stretched as it goes, 1.25 to 1.30 (the body's own stretch, its most is 1.3). Then the sink, 5 frames (2.233 to 2.300): z 30.7, 28.5, 21.3, 10.3, 2.4; stretch 1.268, 1.153, 1.001, 0.861, 0.784; turn 0.38, 0.15, -0.16, -0.44, -0.59; the tip moves so that the middle of the body comes onto the middle of the cup (the place `sealedFit` gives for the sealed pose), so the frame after, sealed, has the same turn (-0.60), the same stretch (0.780) and the same place. The arrow stays over the page until it is sealed: an arrow that is not sealed is not drawn under the page (seen: at z -19 it was gone for a frame). The cup answers at the seal as before (ring clock 0 at 2.300).
- The close. `shutOf`: the halves swing slowly to half shut over the first 70 % (v 0.05 to 0.50 by 2.483) and snap over the last 5 frames (0.50, 0.54, 0.62, 0.75, 0.91, 1). At the meeting (2.583) the ball is pressed by its own hit channel (`LATCH`: strength 0.85 toward page down, dying as the ball's maker sets) and the cup's ring answers a second time (ring clock back to 0). The arrow's answer is `act.caught` in the director, unchanged; on main it turned the arrow from -0.60 to 0.55 in one frame (2.567 to 2.583). Now the page turns the arrow to that pose over the second half of the close (`LATCH.turn`): per frame 0.02, 0.10, 0.17, 0.20, 0.21, 0.20, 0.15, 0.09, 0.01 rad from 2.45 to 2.583, so the director's strike finds it there.
- The drop. The view follows as a damped spring that starts soft and stiffens (`DROP`). Ball's y on the screen: 520 (3.3), 602 (3.4), 677, 739, 780, 793 (3.8), 778, 742, 685 (4.1), 648, 630, 639, 650, 656. From 4.6 s the page's plain rule follows again; the scroll differs from before by 0.69 px at 4.6 s, 0.012 px at 5.2 s and nothing from 7.63 s.
- The roll. On the feed rail and on the drain rail the arrow turns with the way travelled, a whole number of turns, slowing over the last 15 % (`TUMBLE`, 1 rad for each ball's width). In the film the roll down the feed tube is over after 10.5 balls (2 turns, 3.3 to 4.55 s) so that the wide view of the table from 5.2 s is what it was; on the live site it runs the whole tube (7 turns). On the drain rail 2 turns (37.75 to 38.6 s).
- The card. Rises from 0 (flush) over 0.55 s: smoothstep over the first 70 %, 1.5 px over the top, then back without going under. The button's cap the same.

## Decisions

- The ball's speed in the tube is set in `direct()` (the lines for `feed` and `drain`), which is not mine in this round. The ball's speed on the page is as it was; what changed is the view (it lags and catches up) and the roll.
- The ball is not moved for the recoil: `tests/machine-runner-arrow.test.ts` holds the drawn ball on the machine's ball. The recoil is the ball's own press, which dies over its maker's time.
- The film's roll ends before the cut to `table-wide`, because the still `table-wide` shows the ball in the feed tube and must stay byte equal.
- The card: a shape has no strength I can set, so the card's face, its words and the button are drawn from the first frame of the result, now flush with the page (height 0.02 px) and not 3 px high. Not mended: they still come in one frame. To bring them in over frames the shell's card and type would need a strength on the shape, outside my files.
- The wedge: see below.

## The wedge at the lower right of the first screen: not mended

- What is seen (film frame 4254, the view 241 px down the page, real size): a thin hard edged spike of light on the page, from the tube's right edge where the bend toward the right begins (page y about 1041), running about 120 px to the right and 15 degrees upward, between the straight tube's shadow above it and the bend's shadow under it.
- Where it is made: `loader.ts`, the tube's shadow on the page, laid as rows square to the tube (`row`, `CAST`, `SHADE`). The right side of this bend is its inside, so the rows turn toward each other there.
- What was tried: a point of a row that would fall behind the row before it was kept on that row, so the strip cannot fold. Rendered and looked at: the spike was still there, only its far end had another shape. So crossing rows are not what leaves the spike, or not alone. The change was taken out again; `loader.ts` is as on `origin/main`.
- UNKNOWN: what exactly leaves the spike. Not tried for want of time: laying the rows of the feed tube along the lamp as the last screen's tube does (`bent`); the round before found that this changes the still `table-wide`.

## Which pictures change

- Film, pinball unit (starts at film frame 4020, frame = 4020 + 60 t): 4136 to 4158 (the pull and the sink), 4159 to 4204 (the close and the press), 4219 to about 4480 (the view's lag, the roll to 4.55 s; from 4.6 s the scroll differs by less than 0.7 px and falls to nothing by 7.63 s), 6283 to 6337 (the roll on the drain rail), 6392 to 6424 (the card's rise).
- No event moved: all 68 events of the take are at the step they were (`tests/polish-port.test.ts`, the first test, holds the list).

## The turn at the latch and the double images (the Builder's question, 23:38Z)

- The turn of about 90 degrees across one frame at the latch is on `origin/main` too (MEASURED, the trace of main: turn -0.60 at 2.567 s, 0.55 at 2.583 s). It is not the swap to the sealed arrow (that is at 2.300 s); it is the strike `act.caught` in the director, which sets the arrow to `LOADER.alarm[0]` in one step.
- Mended from my file without touching the director: from half of the close on, the page strikes the arrow a little toward that same pose each step (`LATCH.turn`), so the director's strike at the meeting finds it there. Per frame the turn is at most 0.21 rad (`tests/polish-port.test.ts` holds it under 0.25).
- What draws a double image: the film draws each frame with an open shutter (`config/showcase.json`, `film.shutterDegrees` 180: several samples inside the frame's time, `src/core/sampler.ts`). Where the pose jumps inside the shutter, the samples show two arrows. It is one arrow drawn at two times, not two arrows and not a blend of two frames.
- f4174 (the latch): the jump was the strike. With the turn spread the jump is gone. Seen at real size (frames 4170 to 4175): before, the arrow lies pointing left through 4173, 4174 is a double image, 4175 stands upright; now it turns a little in each of 4170 to 4174 and 4174 shows one arrow.
- f4158 (the seal): turn, stretch and place are continuous across the seal now, but the arrow's height is not: over the page at 2.4 before, at the ball's middle (-39.4) after, and the sealed arrow is drawn another way (inside the ball, dimmed). An arrow that is not sealed is not drawn under the page, so the page cannot carry it lower before the seal. A frame with one arrow there would need the seal to fall on a frame's edge and not inside its shutter, which would move the event `ball-seal`; not allowed in this round. UNKNOWN: why the two images still lie about 10 px apart (not measured).

## The motion pack of the live site (built once, on bdc0477a)

- `out/work/packs/round-022/R4/`, 10 sheets, 418 s, exit 0. Built before the latch's turn was spread, so its sheet of the way into the ball still shows the old turn.
- `set-A-07.png` (the arrow goes into the ball, 1:36.55 to 1:36.92, the live run draws 30 pictures a second): the arrow is drawn toward the middle of the cup and grows smaller over three pictures (1:36.58, .62, .65), lies small pointing left to 1:36.82, the halves come from 1:36.75 and close, and between 1:36.85 and 1:36.92 the arrow goes from pointing down and left to upright in the shut ball: the turn at the latch, across two pictures.
- `set-A-08.png` (the ball leaves the port, 1:38.12 to 1:38.48): the ball rests four pictures, then goes down with growing steps, and the arrow inside points another way in each picture (up left, up, up, left, down left, up right, right): it rolls.
- The last screen's tube on the live site (the drain to the split): the pack holds no sheet of it and I made none. UNKNOWN on the live site. In the film (frames 6283 to 6337, seen) the arrow turns in the ball down the drain rail, 2 turns.

## Checks on the last commit (the turn spread; MEASURED, 23:49Z to 23:59Z)

- The three stills `table-wide`, `step1-fire`, `boss-fight` (hd, draft): `cmp` 0 against the ones made on `origin/main` before any change.
- `npm test`: 148 files, 1818 tests passed. `npm run bots`: exit 0. `npm run take -- --check`: `diff` against main's output empty. `npm run determinism`: pass, 12 pictures, identical across two fresh loads and two orders. `npx tsc --noEmit -p .`: clean, run last.
- Not seen in pictures: the card's odd frames 6419, 6421, 6423 with the words 0.6 px proud (the even frames 6416 to 6426 were seen, words whole).
