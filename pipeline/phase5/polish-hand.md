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

Seen in the picture (`hop-before-above-after-below.png`, frames 644 to 648 at real size, before above and after below): before, frame 646 shows a pale stub where the arrow is; after, the arrow is whole on all five frames.

### What the page's jolt does to the arrow on the seat (MEASURED, left as it is by the Builder's ruling of 08:47)

The view is jolted on the seat (`JOLT`, `src/stage/turn.ts`: the camera is knocked 1 in 100 of its distance toward the slab and 4.9 units down, back in 5 frames), so everything on the page is carried outward from the middle and up, the arrow with it. The stepped bound `FLAT.screen` of 4 px is measured without the view's jolt and does not see this.

MEASURED in the pictures of `after-hop` (the topmost dark pixel of the arrow's outline, its tip, against frame 652 where it is (351, 470)): frame 644 (contact) 7 px left and 5 px up, 645 6 left 3 up, 646 5 left 2 up, 647 2 left 3 up, 648 1 right 2 up, 649 0 and 1 up, 650 1 left 1 down.
MEASURED stepped, with the view's transform written out in `tests/polish-hand-run.ts` (`onScreenJolted`), px from where the arrow comes to rest: 8.4 on the contact frame, then 6.8, 5.3, 3.3 (the jolt and the tray's hop), then 2.3, 1.8, 0.5, 0.5, 0.6 (the first knock tilts the slab), then 0.1 and less from the ninth frame after the contact. The stepped numbers and the pictures agree to the px.

My first report gave 7, 6, 6, 3 px and 0 from 648: that fit was of a window with the print in it and read only the sideways part rightly. The numbers above replace it.

The test pins it (`CARRY = { seat: 9, frames: 4, knock: 2.5, from: 9, still: 1 }`): at most 9 px on the four frames from the contact, at most 2.5 px until the ninth, at most 1 px after. For another pointer's place the carry is 1 in 100 of its distance from the middle plus 4.9 px up on the contact frame.

Left as it is: the arrow lies on the page and goes with the page when the page is knocked, as the print under it does.

## 2. The hit's tail

### Before (MEASURED, the hit at frame 898 of step 1 under a resting hand, table in `polish-hand-before.txt`)

Thrown 60.0 px along the bolt's line on the frame of the hit, held 4 frames, back within 2 px at hit+9, passes the hand's place by 0.6 px once. The drawn angle: -22.9 degrees at hit+4, back to -12.0 at hit+7, then out again to -23.5 at hit+19 (a second swing of 10.9 degrees), upright about hit+40. A hand that moves off at 25 px a frame from hit+6: the arrow's step 44.5, then 10.3, then 25.7 px a frame (a lurch).

The film (MEASURED, `film hits of step 1` in the same tables): the film's arrow shows a stall of 1.5 degrees on the way back, no swing back out. The film's hit is left as it is (accepted by the Builder at 07:57).

### The mend, for the hand only (`HIT` untouched)

`TAIL = { lean: { k: 1600, c: 80 }, over: 0.25 }` in `body.ts`. Under a hand: the laid back pose ends with the hold; the arrow's own speed on the way back neither leans it nor tips it into a dive; it rights itself on the spring `TAIL.lean`, which does not swing past upright, until `TAIL.over` seconds after the hit. The way back goes to where the hand's spring would have had the arrow had no bolt thrown it (`ghost`), so a moving hand is joined at its own lag and speed.

### After (MEASURED, table in `polish-hand-after.txt`)

Place: thrown 60.0 px, held 4 frames, back within 2 px at hit+9, unchanged. Angle, hit+0 on: -2.8, -9.4, -16.1, -20.4, -20.0, -15.4, -10.8, -7.6, -5.5, -4.1, -2.3, -0.1, 1.5, 2.6, 3.2, 3.7, 4.1, 4.4 and then within 1 degree of where it stands (4.5 to 4.8, the stand of the `shocked` face): one way out, one way back, at rest by hit+15. A hand that moves off at 25 px a frame from hit+6: steps 1.4, 8.5, 13.7, 17.9, 22.5, 24.5, 21.0, 22.7, 24.3, 25.4, 25.9 px a frame, the largest change from one frame to the next 7.1 px. The burst, the squash and the page's answer are not touched (STATED: no line of them is in the diff).

A second bolt hits a resting pointer again 55 frames later (MEASURED); that is the page's game, not the tail.

Seen in the picture (`hit-before-above-after-below.png`, frames 896 to 920 at real size, hit at 898): before, the arrow comes back by 906 and then leans far over to the left from 907 to 920; after, it comes back by 907 and stands near upright from 908 on. The burst, the lit caps on 898 and 899 and the scorch are the same in both rows.

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

Decided by the Builder at 08:24: the seat reads and stays as it is; the second knock stays; nothing changes in `TURN`, `JOLT` or `SHIVER`.

## 4. Tests

`npx vitest run tests/polish-hand.test.ts`. Named bounds: `FLAT = { page: 2, screen: 4, after: 2, z: 1 }`, `MOVING = { far: 40, atPlay: 20, joined: 12 }`, `THROWN = { far: 60, hold: 4 }`, `TAILS = { pass: 1, back: 10, rest: 16, again: 0.5, jolt: 8 }`. For each of the six turns: resting hand, nothing fires that the page does not fire by itself, moving hand, a press during the turn, a press on the first step of play (the click lag). Also: the four bots (each ends the site in six turns, and on every arriving page its arrow lies no further from its pointer than the pointer goes in one frame, plus `FLAT.page`), the tray's hop under the arrow, a page that ends long after the last press, the skip link, the rejected careers page (stands on the pointer on the step of the landing, no move in 30 frames, no startle), the hit's place, angle and a hand moving off, and without a hand the film's turn and hit against literal lists of what they were.

The four bots (MEASURED in a scratch test, the same loop as the test): keen 7955 frames, clumsy 9157, random 6752, skipper 7052, each ends in six turns. Their pointer moves through the turns (keen up to 32.5 px a frame); the arrow lies at most 31.2 px from it on the arriving page, less than one frame of the pointer's way.

## 5. Pictures

All from `node pipeline/phase5/polish-hand-shots.mjs` (the usage is in its head), kept in `out/work/polish-hand/`, which is not in the repo. Every window is cut from 1920 by 1080 and not scaled. The cross is the pointer's place, drawn into the sheet by the script.

- The turn into step 1, before beside after, every second frame from 594 to 676, six sheets: `walk before-rest rest=596 586-690/2` on a worktree of the starting commit, the same on the branch as `after-rest`, then `sheet before-rest+after-rest turn-a 594 2 7 310 405 596 145 2 cross mark=596:"turn starts" mark=626:"arriving page" mark=644:contact mark=656:"given to play"` and so on in steps of 14 frames. The pointer rests at (356, 471). Before, the arrow stands at (960, 540), right of the window, from about frame 606 to 656.
  What the six sheets show, before left and after right: 594 to 606, before the arrow walks off the button to the right from 598, after it lies on the button; 608 to 620, before no arrow in the window, after it lies on the button and darkens with the page as the page tips away; 622 to 634, the arriving page comes up, before no arrow, after it lies on the tilted page below the cross and nears it as the page comes flat; 636 to 648, after its tip is at the cross from 640, the contact 644 and the two knocks pass under it; 650 to 662, before the arrow walks in from the right from 658, after it stands on the cross; 664 to 676, before it reaches the cross at 664, goes past by a few px and is still by 672, after it has not moved.
- The tray's hop: `walk after-hop rest=596 640-652`; before is the same walk made before `hopUnder`.
- The hit at frame 898: `walk before-hit rest=896 894-922` on the worktree and `walk after-hit rest=896 894-922` on the branch.
- The seat: section 3.

## 6. The film is untouched

- Stage states (MEASURED): a test of mine kept outside the repo (`/tmp/zz-filmdiff.test.ts`, copied in as `tests/zz-filmdiff.test.ts`, run with `FILMDIFF=/tmp/hand/film-after2 npx vitest run tests/zz-filmdiff.test.ts`, removed again) writes for every film frame a sha1 of the draw list, the arrow's pose and the frame's turn, scroll, page, view, settle and cursor, and one line for every event. `cmp` of the files of the starting commit and of the branch: step 1 1920 frames and 351 events equal, the careers page 840 frames and 35 events equal, the whole film 9105 frames and 977 events equal.
- Draft stills (MEASURED): `npm run still -- --key step1-fire --format hd --tier draft`, `step1-tug`, `marketing-top` before the change and after it, `cmp`: see section 7.

## 7. Checks before the push of the first pass (MEASURED, one at a time, 08:33 to 08:45)

- `npm run still -- --key step1-fire --format hd --tier draft`, `--key step1-tug`, `--key marketing-top`, each `cmp` against the copy made on the starting commit: byte equal, all three. The copies were kept outside the repo.
- `npm run -s determinism`: pass, 12 pictures at hd, tier draft, identical across two fresh loads and two orders.
- `npm run -s bots`: 20 runs finished, none stuck; keen reached every one of the 37 gags on every seed; bots: all clear.
- `npm test`: 160 files passed and 4 skipped, 1983 tests passed and 4 skipped, 223.67 s (on the starting commit: 159 and 3, 1939 and 3; the difference is the 44 tests of `tests/polish-hand.test.ts` and the skipped measure).
- `npx tsc --noEmit -p .`: clean.
