# Round 23, unit `site`: polish round 2 on the whole live site

Judged commit: 41acb795 (merge 44, the branch `merge-44`; on main as 178cb8e5 and, with the film's fit to the voice on top, on the published site since 2026-11-27T04:43Z). Started 2026-11-27T03:53Z as polish round 2 of at most 2 (`quality.polishMaxRounds`), past the clock (`extra rounds: no`, `box end: reached`), by Brandon's note, point 4: a round limit or the clock does not close a loop below the bar. Critics: R2 (the jury), R4 (motion), R5 (story and look) and R8 (the web page). The packs were built from clean checkouts of 41acb795 in fresh sandboxes by `r23_packs_a` (R8, R2, R4) and `r23_packs_b` (R5); every file equal by sha256 to the agents' lists (MEASURED). The model families were set before any answer and differ from round 22's on every seat.

## Scores

| Critic | What it saw | Model family | Score | Severe | Major | Minor |
|---|---|---|---|---|---|---|
| R2 | the jury: the six stills drawn through the live site's path. Not asked again: all 25 pictures are byte equal to round 22's, round 21's and round 20's, whose 30 answers stand | Kimi, GPT, Claude, GLM (round 20) | passes by the rule's arithmetic, 0 of 30 against 0 of 50 | | | |
| R4-1 | motion: ten sheets of twelve consecutive frames of a visitor's run of the live site | GLM | 7 | 1 | 4 | 0 |
| R5-1 | story and look: the six pages at rest, the screens with the controls and moments of a visitor's run | Kimi | 8 | 0 | 1 | 2 |
| R8-1 | the site as a web page: the six pages at rest, the controls on, the touch page and the controls at their real size | GPT | 7 | 1 | 4 | 0 |

Together: 2 severe, 9 major, 2 minor. All scores are STATED by the critics.

Not passed. The pass is the machine checks green including G15 to G18, the measures green, R4, R5 and R8 each at least 9 with no severe or major issue open, and R2 by its rule. The lowest score is 7 (R4-1 and R8-1). Round 22 scored 5, 8 and 6 with 1 severe, 11 major and 4 minor; round 21 scored 5, 8 and 7; round 20 scored 6, 7 and 7.

## Machine checks and measures

The machine checks are green on this commit (MEASURED, 04:31Z): 1870 of 1870 tests, the build, the take equal, two fresh loads equal, 0 errors in the shadow runs and the dark look, G15 pass in 1945.9 s, the bots all clear with the keen visitor at all 37 gags on every seed.

The measures (MEASURED by `r23_measures` at the final tier, format hd, 03:54Z to 04:55Z): `step1`, `step2`, `marketing`, `boss` and `decision` each 8 green and 0 red; `pinball` 8 green and 2 red, its two standing lines: M2 `youre-fired`, soft share 1 against 0.02, and M3 `rail-cam`, 0.5365 against 0.8. Those two alone keep the round under the bar. The least contrast of type is 4.62 on every page (least allowed 4.5); the smallest type is 14 px on step 1 (least allowed 14).

## R2, the jury

Carried from round 22, which carried rounds 21 and 20 (`R2-1.json` holds the carry and every answer). It passes by the rule: 0 of 30 answers (a) or (b) on the judged pictures against 0 of 50 on the controls. Said plainly beside it, as before: 28 of 30 jurors chose (d) for the live site.

## The two severe issues

R4-1 issue 1, the save sheet (`set-A-08.png`), 1:59.25 to 1:59.38 of the visit: "The clear ball reverses and rises out of the drain before the bat can reach it. The bat sweeps and returns beside the ball, but no visible contact changes its path, so the save looks like the ball is being pulled back up rather than struck." The Builder read the sheet frame by frame and the critic is right. It is the fault round 22's fix left open and named (the bat's tip passes half a ball's width beside the ball).

R8-1 issue 1, step 3 at rest (`set-A-04.png`): "At rest the page introduces an assessment but gives no cue for how to start it or whether it is about to start automatically." Round 22's seat raised the same as a major. It asks to move away from the approved `loader-page.png`; declined again, and with Brandon as one of his five design points.

## Where the issues went

Taken, in work for merge 45 and round 24:

- R4-1 issue 1 (severe), the save: `r24_fix_save` (`agent/polish-save`), started 04:42Z. Its staging (STATED by it at its start, after measuring 37 saves in 8 visits): the shut gate takes the ball with its own weight, holds it, winds up and kicks it; the ball never moves between two steps by more than its speed allows (today it is moved 0.37 to 0.50 ball widths in one step, 3 to 9 times what its speed allows); the machine's bat does not swing at a save; the film's path is not touched.
- R4-1 issue 3 (major, the pressed key shows only a shade), issue 4 (major, the give back after the tug cannot be read) and issue 5 (major, the page does not answer a bolt's hit and the hot spot lingers): `r24_fix_step1` (`agent/polish-keys`), started 04:42Z. MEASURED by it at its start: the cap goes its 6 px along the line of sight, about 1.3 px on screen; it rises 9 frames before the visitor's hand lets go; the hit presses the key under the arrow for 0.05 s, which is why a key seemed pressed with no press; the hot halo decays with 0.4 s; at the give back the visitor waits 23 frames and the sheet began after the page's press was over.
- R4-1 issue 2 (major), the page turn sheet (`set-A-02.png`) "is already almost face-on" in its first frame: the fault is the pack's, which kept only the last twelve frames of the turn under the limit of ten files and left the heading as it was. `r24_fix_pack` (`agent/pack-whole`), started 04:57Z: no heading says more than its frames hold, the turn is shown whole, the save's window holds the gate and both bats, the key sheet carries the visitor's press as marks, and the motion critic's sheets go into two sets when ten files are not enough. Whether the seat itself has weight is judged in round 24, on a sheet that shows it.
- R5-1 issue 1 (major), "the pinball table itself is rebuilt between frames": the machine is one cabinet with three tiers; the critic's sheet shows twelve moments 3.7 s apart, so what lies between two tiers falls between two frames. `r24_fix_pack` adds a sheet of the ball's way from tier to tier as the live site shows it. If the site only cuts from tier to tier, the issue becomes the site's own and is taken as that.

Open, not mended:

- R5-1 issue 2 (minor), steps 1 and 2 at rest alike, and issue 3 (minor), step 3 at rest sparser than the others: both are the approved pictures (`step2-rest.png`, `loader-page.png`); with Brandon among his design points.

Waiting for Brandon, put to him in every status since Status 123:

- R8-1 issue 2 (major): the touch page ends the visit. It shows a link the moment `links.portfolioWork` is set; a way to the film from that page is not in the kit.
- The five design points the web page and story seats rest their scores on: step 2's three empty fields, step 3 opening with no word on what to do, Submit alone under the card on step 4, the perk card's face before a touch, the words of the skip link. While they stand as approved, the web page seat cannot reach 9: four of its five issues in this round are these points.

## Declined

Logged under "Declined issues" in `kit/PROGRESS.md`, each with the critic's words, each Brandon's to overrule:

1. R8-1 issue 1 (severe): step 3 at rest gives no cue for how to start. The approved `loader-page.png` and `kit/02-SUBJECT.md` give its layout; the page starts by itself.
2. R8-1 issue 3 (major): Submit's place on step 4. The approved `boss-fight.png`, `boss-down.png` and `boss-stages.png` put the card at the top left and Submit's socket at bottom centre.
3. R8-1 issue 4 (major): step 2's three fields look like the same empty dropdown. The approved `step2-rest.png` shows them so.
4. R8-1 issue 5 (major): the words of the skip link are `copy:live.skip`, Brandon's.

## What comes next for the unit

The three fix helpers end by 06:50Z. Their work goes into merge 45 with the tests, the build, the take's check, the browser checks and the published site; then round 24 on the merged commit, with new packs from clean checkouts and the families rotated again. Round 24 is past `quality.polishMaxRounds` and past the clock: by Brandon's note, point 4, the loop is not closed below the bar; the state is shown to him as below the bar in every status, and the work on it goes on unless he says to move on.
