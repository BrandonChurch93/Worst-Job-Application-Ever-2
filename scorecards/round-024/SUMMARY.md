# Round 24, unit `site`: a polish round past the round limit, on the whole live site

Judged: the site build of merge 45 (main ea483876). The packs of R5, R8 and R2 were built by the Builder on b7a645bf (the branch `merge-46`), the pack of R4 by `r24_fix_pack` on b3e4f902 (the branch `agent/pack-whole`); the three commits hold the same `src`, `config`, `content`, `cut`, `audio`, `references`, `parts`, `package.json` and `package-lock.json` (MEASURED by `git diff --stat`), and every pack's stamp names the engine e68903f7837ca4c7 and the same six page hashes. Started 2026-11-27T07:11Z, past `quality.polishMaxRounds` (2, reached with round 23), inside continuation 2 of the clock, by Brandon's note, point 4: a round limit or the clock does not close a loop below the bar. Critics: R2 (the jury), R4 (motion, in three sets), R5 (story and look) and R8 (the web page). The model families were set before any answer.

## Scores

| Critic | What it saw | Model family | Score | Severe | Major | Minor |
|---|---|---|---|---|---|---|
| R2 | the jury: the six stills drawn through the live site's path. Not asked again: all 25 pictures are byte equal to round 23's, whose answers are round 20's | Kimi, GPT, Claude, GLM (round 20) | passes by the rule's arithmetic, 0 of 30 against 0 of 50 | | | |
| R4-1 | motion, set A: the arrow walked across a page, one page turn whole on three sheets, a hit on the arrow, a key pressed and let go | GPT | 7 | 1 | 3 | 0 |
| R4-2 | motion, set B: the page takes the arrow, and gives it back on four sheets at every sixtieth of a second | Claude | 6 | 0 | 4 | 3 |
| R4-3 | motion, set C: the arrow into the ball, the ball out of the port, the save on three sheets at every sixtieth of a second, a flipper's blow wide and close | GLM | 7 | 0 | 2 | 0 |
| R5-1 | story and look: the six pages at rest, the screens with the controls, a visitor's visit on sheets, the machine's tiers and the way from one to the next | Claude | 7 | 0 | 5 | 3 |
| R8-1 | the site as a web page: the six pages at rest, the controls on, the touch page and the controls at their real size (nine pictures byte equal to round 23's) | Kimi | 7 | 0 | 2 | 3 |

Together: 1 severe, 16 major, 9 minor. All scores are STATED by the critics.

Not passed. The pass is the machine checks green including G15 to G18, the measures green, R4, R5 and R8 each at least 9 with no severe or major issue open, and R2 by its rule. The lowest score is 6 (R4-2). Round 23 scored 7, 8 and 7 with 2 severe, 9 major and 2 minor; round 22 scored 5, 8 and 6; round 21 scored 5, 8 and 7; round 20 scored 6, 7 and 7.

## Machine checks and measures

The machine checks are green on this build (MEASURED). On b7a645bf the whole `npm test` alone: 159 files and 1939 tests passed, 3 skipped. On the candidate of merge 46 (c817385d, the same site), one job at a time, 07:14Z to 08:16Z, every step with exit code 0: `npx tsc --noEmit`, the build, the whole tests (159 files and 1939 tests passed, 3 skipped), the cut list check, the mix, the take check, the look under load, the six shadow looks, the dark look and G15 (692.0 of 700 MB at hd on the machine's page, 2045.7 of 2400 MB at 3840x2160; 774135 of 3000000 triangles and 492 of 600 draw calls at the most). Merge 45 itself was green in the build, the cut list check, the mix, the take check, determinism and the bots.

The measures (MEASURED by `r24_measures` at the final tier, format hd, on b3e4f902, 07:11Z to 08:13Z): `step1`, `step2`, `marketing`, `boss` and `decision` each 8 green and 0 red; `pinball` 8 green and 2 red, its two standing lines: M2 `youre-fired`, soft share 1 against 0.02, and M3 `rail-cam`, 0.5365 against 0.8; the film's M7 green at draft. Those two red lines alone keep the round under the bar, apart from the scores.

## R2, the jury

Carried from round 23, which carried rounds 22, 21 and 20 (`R2-1.json` holds the carry and every answer). It passes by the rule: 0 of 30 answers (a) or (b) on the judged pictures against 0 of 50 on the controls. Said plainly beside it, as before: 28 of 30 jurors chose (d) for the live site.

## The one severe issue

R4-1 issue 1, the sheet after a page turn (`set-A-04.png`), 0:10.93 to 0:11.10 of the visit: "After the slab stops, the ordinary-looking arrow suddenly moves left across the upload panel despite no visitor input." True as seen, and the Builder's own open item of 05:58Z: at a turn the arrow was taken to the middle of the screen and walked back to the pointer once the new page had seated. Mended by `r24_fix_hand` for the visitor's hand only: the arrow rides its page where the hand is and arrives where the hand is. By its numbers (STATED): with a resting pointer the arrow walked by itself 287 to 897 px on the leaving page at the six turns and stood 298 to 866 px from the pointer when play began; now 0.0 to 5.9 px while the page leaves and 0.0 px from the pointer when play begins, on all six. The film is byte equal (9180 frames and 977 events, by `cmp`).

## Where the issues went

Mended, in merge 47 (ce259d65, on main and on the published site since 2026-11-27T10:36Z), each seen by the Builder at real size on frames in a row before it was accepted:

- R4-1 issue 1 (severe): above.
- R4-1 issue 3 (major), the hit's tail: `r24_fix_hand`. One lean and a stand; by its numbers the arrow is within 1 degree of its stand 15 frames after the hit (before, about 40).
- R4-1 issue 4 (major), a key's release does not read as a spring: `r24_fix_tug`. A let go cap is up in one frame, passes its seat by 2.3 px (before 1.3) and is at rest on the seventh frame; the socket's lip stays as it was (a shadow try did not show at 1920 by 1080 and was taken out).
- R4-2 issue 2 (major), the arrow turns in one frame as the page takes it: `r24_fix_tug`. What read as a turn was the arrow's drawn length falling to 0.597 in three frames (a stop kick firing again and again under a hand); the length now changes 0.115 a frame at the most and the angle 9.4 degrees a frame at the most. The tip's colour came in over six to eight frames before and after (counted by the Builder); it was no swap.
- R4-2 issue 3 (major), the sheet and the tray do not answer the pull: `r24_fix_tug`. The way in has a stop, and the tray is thrown 5 px on the grab and on the arrival and comes back over 13 frames.
- R4-2 issues 4 (major) and 5 (minor), the slot fades away and shows one black frame: `r24_fix_tug`. The slot shuts as a shutter in three frames with no black frame and no fade; film frames 2680 to 2698 change with it.
- R4-3 issue 1 (major), the save reads as the ball turning by itself: `r24_fix_gate`. The view goes down softly as the ball is lost, so the wire is in sight through the load: in the pictured save its lowest point stands 65.4 px or more above the screen's edge (before, 0.1 to 8.7 px under the edge in five frames); the wire gives under the ball, holds it, throws it and swings past its rest (numbers MEASURED by the helper). The bounds stand: no bat swings at a save, no new part or lamp, the film's take equal.
- R4-3 issue 2 (major), the ball leaves the port at one even pace: `r24_fix_gate`. The ball stands two frames and then moves 1.77, 5.03, 7.88, 10.32, 12.36, 13.99 px a frame (before 13.86 on every frame); film frames 4219 to 4257 change, the ball's place only.
- R5-1 issue 3 (major), the Date of birth panel open and empty: `r24_fix_date`. The empty tray lasted 0.16 s, not seconds; a row's machine now lies housed in the tray's floor and is uncovered as the field slides off it, on the live site and in the film (way B; film frames 3252 to 3276, 3547 to 3571, 3603 to 3624 and 3813 to 3832 change). Row 3's crank no longer vanishes in one frame as its tray shuts.
- R8-1 issue 3 (minor), the tube at the foot of step 3: `r24_fix_sharp`. The tube runs straight to the screen's edge with two rings and one even shadow band, at the high and the low level.

Answered by looking or measuring, with no change:

- R4-1 issue 2 (major), the page seats softly. Seen by the Builder at every frame at real size, live and film: the free edge closes 26 to 28 px a frame up to contact, the page lies flat three frames, the step row jumps 9 to 11 px, one knock back of 17 px over three frames follows, and the page is still 0.15 s after contact. The critic's sheet showed every second frame at 24 percent of the page. The seat stays; round 25's pack shows it in a strip of its own at 100 percent.
- R4-2 issue 1 (major), the arms are there at full length in one frame. MEASURED by `r24_fix_tug` before any change: the arms' share of their length over the six frames after the bite is 0.12, 0.39, 0.67, 0.87, 0.99, 1.04. They are the arrow's own arms of the approved `cursor-arms.png` and `step1-tug.png` and stay; the grip's jolt on the sheet's holder and the tray is new (issue 3). Round 25's pack shows the take at every frame at real size.
- R4-2 issue 6 (minor), the strips scattered anew in every frame. MEASURED by `r24_fix_tug`: each of the 15 strips keeps its place from frame to frame. Not changed.
- R4-2 issue 7 (minor), the given back arrow changes shape while the visitor moves it. MEASURED: the arrow stands in its rest pose for 19 frames before the release; what follows is the lean of travel every move shows. Pinned by a test; round 25's sheet says the stand and the lean in its heading and marks the release frame.
- R5-1 issue 6 (minor), a red tag cut by the frame's lower edge. Seen on every frame: the critic's frame is one of the four in which a spent tag crosses the screen's edge on its way off the page (`src/boss/fight.ts` line 235). Nothing is clipped at rest.

Open:

- R5-1 issue 7 (minor), the resume's small flat sheet: its one part that asks for a larger sheet is declined (below); kept open: whether the sheet at rest reads as real paper.
- R5-1 issue 8 (minor), step 3 at rest sparse; R8-1 issue 4 (minor), step 2's three fields empty; R8-1 issue 5 (minor), Submit's place on step 4: the approved pictures, with Brandon among his design points.
- From the fix pass itself, minor, each logged as an open item in `kit/PROGRESS.md`: in one save of a ball thrown straight down the mouth, one frame with the wire's lowest point 19.3 px above the screen's edge against the 20 asked; the view creeps 2.5 px after the kick; the ball is hazier at `rail-cam`; a dark dot of 4 px at the tube's foot; the floor at `youre-fired` soft at 3840x2160; a short light dash in the Date of birth field at rest; a few faint pixels of change in the dial's opening at the low level.
- Found after the round and in work: the dial's faint rings under the page in its tray's first frames on the live site (mended, in merge 48), and the dial's orange centre that is covered in one frame as its tray shuts, in the film and on the live site (a mend is ruled, for the merge after).

Contested, waits for Brandon:

- R8-1 issue 2 (major), the perk cards' rule over an empty lower half. The face was changed once for a critic in round 22 (ddf3f100); by the rule it is not changed again.

## Declined

Logged under "Declined issues" in `kit/PROGRESS.md`, each with the critic's words, each Brandon's to overrule:

1. R5-1 issue 1 (major): step 4 at rest is one small card and a lone Submit. The approved `boss-fight.png`, `boss-down.png` and `boss-stages.png`.
2. R5-1 issue 2 (major): steps 1 and 2 at rest are the same kind of scene. The approved `step2-rest.png`.
3. R5-1 issue 4 (major): the machine's dark blue and teal world against the warm paper of the pages. The approved machine pictures. Put to Brandon in Status 135.
4. R5-1 issue 5 (major): the stamp's bright red. The approved `decision.png`. Put to Brandon in Status 135.
5. R8-1 issue 1 (major): step 3 at rest gives nothing to do. The approved `loader-page.png`; the page starts by itself.
6. R5-1 issue 7 (minor), in its one part: a larger resume sheet. Beside the arrow of 70 px (`cursor.heightPxAt1080`, a kit number) the sheet of 64 by 88 px is not smaller than the approved `step1-tug.png` draws it.

## What this means for the bar

Four of the story seat's five major issues and both of the web page seat's ask to move away from pictures Brandon approved or to change a thing that is contested. While they stand, those two seats cannot reach 9 with a critic that weighs them. The seven points are with Brandon: his five design points (step 2's three plain fields, step 3 opening with no word, Submit alone under the card, the perk card's face before a touch, the skip link's words) and the two of Status 135 (the machine's dark world, the stamp's red). The motion seat's points were all taken or answered.

## What comes next for the unit

Round 25 on merge 47 (ce259d65), by Brandon's note, point 4: the motion seat on sheets at every frame and at real size in four sets from `r25_fix_pack`, the story and the web page seats on new packs of the same build, the families rotated again. The measures are run again by the Builder on main; `r24_fix_sharp` reports the machine's two lines green on its branch (M2 0.0093 against 0.02, M3 0.9355 against 0.8, STATED), and only the Builder's run counts. The state is shown to Brandon as below the bar in every status, and the work on it goes on unless he says to move on.
