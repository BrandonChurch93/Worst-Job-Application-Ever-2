# polish-hand: the arrow under a visitor's hand at a page turn and after a hit, and one measure of the page's seat

Branch `agent/polish-hand`, from b3e4f90220158fe00becaa34a91ff4ab2f9d0048. Times are UTC, 27 Nov 2026, read with `date -u`.

Files edited: `src/stage/stage.ts`, `src/cursor/body.ts` (not the arms, the take or the hand back). `src/cursor/view.ts` not edited.
Outside my files: one line, `src/pages/marketing/index.ts` line 380, as `pipeline/phase5/polish-hand-NEEDS.patch`, on the branch as commit 6eb162a6 (`NEEDS:`), accepted by the Builder at 07:57.
Tests: `tests/polish-hand.test.ts` (stepped, no browser), `tests/polish-hand-run.ts` (its helper), `tests/polish-hand-measure.test.ts` (writes the tables below, skipped unless `HAND_OUT` is set). No test of another owner was changed.
Scripts: `pipeline/phase5/polish-hand-shots.mjs` (pictures of the live site frame by frame and sheets at real size), `pipeline/phase5/polish-hand-gap.mjs` (the seat's numbers read from pictures).

Words: MEASURED means I ran the command given and read the number. STATED means I read it in the code. UNKNOWN means neither.

## 1. The ride through a page turn

### Before (MEASURED)

`HAND_OUT=/tmp/hand/before npx vitest run tests/polish-hand-measure.test.ts` on the starting commit; the summary and the hit's table are kept in `pipeline/phase5/polish-hand-before.txt`. The pack's visitor, 10734 frames of 60, six turns (the brief says five; marketing to step 1, four between the steps, step 5 back to marketing). A resting pointer from the step the turn starts:

| turn | starts, frame | the arrow walks on the leaving page | px from the pointer when given to play | walks after |
|---|---|---|---|---|
| 1 marketing to step 1 | 596 | 512.4 px over 23 frames | 608.1 | 639.7 px over 18 frames |
| 2 step 1 to step 2 | 2637 | 795.1 | 713.5 | 744.7 |
| 3 step 2 to step 3 | 5663 | 897.2 | 865.6 | 897.0 |
| 4 step 3 to step 4 | 8450 | 286.5 | 298.2 | 314.1 |
| 5 step 4 to step 5 | 10169 | 425.6 | 366.9 | 387.9 |
| 6 step 5 to marketing | 10673 | 389.2 | 399.2 | 422.0 |

Why (STATED, `src/stage/stage.ts` and `src/cursor/body.ts` at the starting commit): `lift()` set the target of the arrow to the hand over place (960, 540) on the leaving page, `enter()` reset the arriving arrow at that place, and at play the hand's spring walked it back to the pointer.

### The mend, for the hand only

- `body.ts` `lift()`: with `hand` true the arrow is not carried anywhere. Held by the page (taken, in the ball, off the page) it lies where it stood, its speed set to nothing. Free, it stays led by the hand (`air.led`) on the hand's own spring `HAND`.
- `stage.ts` `enter(index, arrive, hand)`: with `hand` true the arriving arrow is reset at the raw pointer, not at `HANDOFF`. `advancePhase` hands the raw pointer down.
- `body.ts` `reset(..., air)`: with `hand` true the arriving air is led, so a moving pointer takes the arrow with it on the slab's face through the arriving half.
- NEEDS, `src/pages/marketing/index.ts` line 380: the rejected careers page placed the arrow at `HANDOFF` on the step of the landing in every mode. The line now holds `s.mode === 'film' &&`, so the film's line is unchanged and under a hand the arrow stays at the pointer.

### Decisions

- The arrow's place is the pointer's place in the page's own units, on the slab's face. While the slab is tilted the arrow is drawn where that point of the slab is, so on screen it lies off the pointer and meets it as the slab comes flat. When the pointer points outside the tilted page's outline nothing else is drawn: the arrow stays on the slab's face at the pointer's page place (accepted by the Builder at 07:57).
- An arrow the page holds at the leave (the button of the careers page has it at the first turn) lies where it stood: the page, not the hand, has it.
- The arrow's height over the page is 16 units at rest, seen in perspective: on screen it lies up to 3.2 px from the pointer on a flat page. That is the same offset it has at rest on any page, not a move.
- Touch: `mountTouchMessage` mounts no stage, so there is no arrow and no turn there (STATED).
- A page that ends by itself: step 5 does not end by itself under a resting pointer within 25 s (MEASURED in a scratch test); the test takes the turn that comes longest after the last press.

### After (MEASURED, same command with `HAND_OUT=/tmp/hand/after`, kept in `pipeline/phase5/polish-hand-after.txt`)

Visitor: 10721 frames, six turns, ends.

| turn | resting: walks on the leaving page | px from the pointer at play | walks in 30 frames after | stroking pointer: px at play | furthest on the slab | within 2 px after |
|---|---|---|---|---|---|---|
| 1 | 0.0 | 0.0 | 0.0 | 18.0 | (held by the button on the leaving page) | 10 frames |
| 2 | 2.3 | 0.0 | 0.0 | 18.0 | 36.2 | 10 |
| 3 | 5.9 | 0.0 | 0.0 | 18.0 | 36.2 | 10 |
| 4 | 2.9 | 0.0 | 0.0 | 18.0 | 36.2 | 10 |
| 5 | 2.3 | 0.0 | 0.0 | 18.0 | 36.2 | 10 |
| 6 | 2.8 | 0.0 | 0.0 | 18.0 | 36.2 | 10 |

The 2.3 to 5.9 px on the leaving page are the hand's spring ending the visitor's own last move. The stroking pointer goes 560 px in 70 frames (8 px a frame); 18.0 and 36.2 px are the hand's own lag at that speed, the same as on a page at play.

### A fault found on the way and mended for the hand: the tray rose through the arrow

With the arrow now standing on the new page while it meets its seat, the tray under it hops 11 to 12 units (`SHIVER`) on the two frames after the contact and rose through the arrow, which stands 16 units high: on live frame 646 the arrow was drawn as a pale stub (seen at real size in the sheet of the turn, both runs). Before the change the arrow hung at height 260 over the middle and nothing reached it.

Mend, `src/stage/stage.ts` `hopUnder`: under a hand, while the seat's hop runs, the drawn arrow's height gains the hop of the loose thing it stands on, as the type on a card hops with the card. The body's state is not touched; the film's frame is not touched (`hand` false).

## 2. The hit's tail

### Before (MEASURED, the hit at frame 898 of step 1 under a resting hand, table in `polish-hand-before.txt`)

Thrown 60.0 px along the bolt's line on the frame of the hit, held 4 frames, back within 2 px at hit+9, passes the hand's place by 0.6 px once. The drawn angle: -22.9 degrees at hit+4, back to -12.0 at hit+7, then out again to -23.5 at hit+19 (a second swing of 10.9 degrees), upright about hit+40. A hand that moves off at 25 px a frame from hit+6: the arrow's step 44.5, then 10.3, then 25.7 px a frame (a lurch).

The film (MEASURED, `film hits of step 1` in the same tables): the film's arrow shows a stall of 1.5 degrees on the way back, no swing back out. The film's hit is left as it is (accepted by the Builder at 07:57).

### The mend, for the hand only (`HIT` untouched)

`TAIL = { lean: { k: 1600, c: 80 }, over: 0.25 }` in `body.ts`. Under a hand: the laid back pose ends with the hold; the arrow's own speed on the way back neither leans it nor tips it into a dive; it rights itself on the spring `TAIL.lean`, which does not swing past upright, until `TAIL.over` seconds after the hit. The way back goes to where the hand's spring would have had the arrow had no bolt thrown it (`ghost`), so a moving hand is joined at its own lag and speed.

### After (MEASURED, table in `polish-hand-after.txt`)

Place: thrown 60.0 px, held 4 frames, back within 2 px at hit+9, unchanged. Angle, hit+0 on: -2.8, -9.4, -16.1, -20.4, -20.0, -15.4, -10.8, -7.6, -5.5, -4.1, -2.3, -0.1, 1.5, 2.6, 3.2, 3.7, 4.1, 4.4 and then within 1 degree of where it stands (4.5 to 4.8, the stand of the `shocked` face): one way out, one way back, at rest by hit+15. A hand that moves off at 25 px a frame from hit+6: steps 1.4, 8.5, 13.7, 17.9, 22.5, 24.5, 21.0, 22.7, 24.3, 25.4, 25.9 px a frame, the largest change from one frame to the next 7.1 px. The burst, the squash and the page's answer are not touched (STATED: no line of them is in the diff).

A second bolt hits a resting pointer again 55 frames later (MEASURED); that is the page's game, not the tail.

## 3. The seat, measured, not changed

How: live site at 1920 by 1080, level `high`, stepped, the pack's visitor: `node pipeline/phase5/polish-hand-shots.mjs walk after-rest rest=596 586-690/2 638-658` (the hand lies still from the turn's start) and `... walk after-visitor 638-658 896-920`. Film: `npm run seq -- --first 850 --last 873 --tier draft --format hd` (`--format hd` added: without it the frames are 960 by 540 and no window can be cut at real size). Numbers: `node pipeline/phase5/polish-hand-gap.mjs DIR FIRST LAST CONTACT`. The gap is the rows of dark backing over the slab's upper, free edge down columns 600 to 700. The shifts are how many px higher than in the last picture the printed title, the rule with the step row and the Continue button stand. Windows of the sheets: head 290 by 170 at (1020, 0), tray 290 by 170 at (780, 290), unscaled.

Live, level high, contact = frame 644. The visitor's run and the resting run give the same table.

| frame from the contact | gap at the free edge px | title up px | rule and step row up px | foot up px |
|---|---|---|---|---|
| -6 | 152 | | | |
| -5 | 126 | | | |
| -4 | 99 | | | |
| -3 | 71 | | | |
| -2 | 44 | | | |
| -1 | 19 | | | |
| 0 contact | 0 | 9 | 9 | 2 |
| +1 | 0 | 6 | 11 | 2 |
| +2 | 0 | 3 | 9 | 1 |
| +3 | 11 | | | |
| +4 | 17 | | | |
| +5 | 12 | | | |
| +6 | 0 | 0 | 0 | 0 |
| +7 | 3 | | | |
| +8 | 3 | | | |
| +9 to +14 | 0 | 0 | 0 | 0 |

Film, hd draft, contact = film frame 858.

| frame from the contact | gap px | title up | rule and row up | foot up |
|---|---|---|---|---|
| -8 to -1 | 191, 167, 142, 116, 89, 61, 34, 11 | | | |
| 0 contact | 0 | 8 | 8 | 2 |
| +1 | 0 | 5 | 11 | 2 |
| +2 | 0 | 1 | 7 | 0 |
| +3 to +8 | 13, 17, 8, 1, 3, 2 | | | |
| +9 to +15 | 0 | 0 | 0 | 0 |

What the sheets show at real size: the dark band over the free edge shrinks 25 to 28 px a frame down to the frame before the contact and is gone on the contact frame; the slab is flat for three frames in a row; on the contact frame the head stands 9 px higher and a little larger and comes down over three frames, the step row and the rule ride higher than the print on those frames, and the tray's shadow is longer on four frames; the band comes back once at 11, 17, 12 px for three frames, is gone at +6, comes back at 3 px for two frames and is still from +9. In the film the tilted frames are blurred by the shutter; the flat frames 858 to 860 are sharp.

Reading: it arrives with speed and stops dead. It answers with one knock that is plain to see and a second of 3 px over two frames; whether the second is seen at 60 a second is UNKNOWN from stills. Proposal, if strictly one answer is wanted: drop the second entry of `TURN.knocks`; live frames +7 and +8 and film frames 864 to 866 would change. `JOLT` and `SHIVER` left alone. Nothing changed; the Builder decides.

## 4. Tests

`npx vitest run tests/polish-hand.test.ts`. Named bounds: `FLAT = { page: 2, screen: 4, after: 2, z: 1 }`, `MOVING = { far: 40, atPlay: 20, joined: 12 }`, `THROWN = { far: 60, hold: 4 }`, `TAILS = { pass: 1, back: 10, rest: 16, again: 0.5, jolt: 8 }`. For each of the six turns: resting hand, nothing fires that the page does not fire by itself, moving hand, a press during the turn, a press on the first step of play (the click lag). Also: the tray's hop under the arrow, a page that ends long after the last press, the skip link, the rejected careers page (stands on the pointer on the step of the landing, no move in 30 frames, no startle), the hit's place, angle and a hand moving off, and without a hand the film's turn and hit against literal lists of what they were.
