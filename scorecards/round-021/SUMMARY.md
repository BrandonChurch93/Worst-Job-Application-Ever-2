# Round 21, unit `site`: the second round on the whole live site

Judged commit: f6a5e0eb (merge 42 on main, pushed 22:15Z and on the published site since then). Started 2026-11-26T22:16Z, the second and last round of `quality.siteMaxRounds` (2). Critics: R2 (the jury), R4 (motion), R5 (story and look) and R8 (the web page). The packs were built from clean checkouts of f6a5e0eb in fresh sandboxes by `r21_packs_a` (R8, R2, R4) and `r21_packs_b` (R5); every file's sha256 on the agents' lists equals the file the critic saw. No family judged the role it judged in round 20. The kit's briefs were sent unchanged.

## Scores

| Critic | What it saw | Model family | Score | Severe | Major | Minor |
|---|---|---|---|---|---|---|
| R2 | the jury: the six stills drawn through the live site's path. Not asked again: all 25 pictures and the three briefs are byte equal to round 20's, whose 30 answers stand | Kimi, GPT, Claude, GLM (round 20) | passes by the rule's arithmetic, 0 of 30 against 0 of 50 | | | |
| R4-1 | motion: nine sheets of twelve consecutive frames of a visitor's run of the live site | Claude | 5 | 2 | 7 | 5 |
| R5-1 | story and look: the six pages at rest, the touch page and moments of a visitor's run | GPT | 8 | 0 | 3 | 0 |
| R8-1 | the site as a web page: the six pages at rest and the controls at their real size | GLM | 7 | 2 | 4 | 0 |

Together: 4 severe, 14 major, 5 minor.

Not passed. The pass is the machine checks green including G15 to G18, the measures green, R4, R5 and R8 each at least 9 with no severe or major issue open, and R2 by its rule. The lowest score is 5 (R4-1). Round 20 scored 6, 7 and 7 with 3 severe, 11 major and 5 minor. The critics of the two rounds are different models in every role, and R4's sheets are not round 20's: since merge 42 the pack's visitor is hit by a bolt on step 1, a beat is held over two sheets in a row and the flipper sheets have a wider frame. So the two rounds' numbers are not one scale.

## R2, the jury

Carried from round 20 (`R2-1.json` holds the carry and every answer). It passes by the rule: 0 of 30 answers (a) or (b) on the judged pictures against 0 of 50 on the controls. Said plainly beside it, as in round 20: 28 of 30 jurors chose (d) for the live site.

## Severe issues

1. R4-1 issue 1, the flipper sheet, 1:52.42 to 1:52.62 of the visit: after the right flipper's stroke the ball flies for two frames and then hangs in a cluster 30 px wide for seven frames. It reads as hovering, not as steel thrown by a bat.
2. R4-1 issue 2, the same sheet, 1:52.65 to 1:53.02: the ball goes round the lit orange part at a steady 5 to 10 px a frame and glides down. MEASURED by the Builder in the code and the picture: the part is a flat lamp window (`office.insert.*`), not a bumper, and nothing there kicks a ball; the ball's slow way over it is the fault.
3. R8-1 issue 1, step 3 at rest: the first screen shows a heading, the copy and the port, and neither an action nor a status.
4. R8-1 issue 2, the touch page: the card says why the application is not there and leaves the visitor at a dead end.

## Where the issues went

The clock allows an extra round (tick 209 at 22:37Z: 4.90 h of the phase's 12 h, `extra rounds: yes`), so step 6's first polish round started at 22:48Z as round 22. Five sandbox agents, each on a branch from `origin/main` with its own files, first pass wanted by 23:40Z, hard limit 00:05Z:

- `r21_fix_ball` (`agent/polish-ball`): R4-1 issues 1 and 2 (severe), 3 (the ball rests on the sloped bat) and 4 (the stroke takes three frames). Live only, behind a switch, so the film's take stays byte equal.
- `r21_fix_port` (`agent/polish-port`): R4-1 issues 12 (the arrow jumps into the port in one frame) and 13 (the ball glides in the tube), and four points of the Builder's own on the machine page's first and last screens.
- `r21_fix_tug` (`agent/polish-tug`): R4-1 issues 5 (the cord is there in one frame, with no wind-up or throw), 6 (the release is a one-frame pop and the arrow snaps upright) and 14 (the struck key does not spring back inside the run).
- `r21_fix_turn` (`agent/polish-turn`): R4-1 issues 7 (the new page seats on a long soft tail with no landing beat) and 11 (the step bubbles change material in one frame).
- `r21_fix_arrow` (`agent/polish-arrow`): R4-1 issues 8 (the perk card snaps flat in one frame), 9 (the arrow lies on its side and turns upright in one frame) and 10 (the arrow's shadow slides 30 px away from it).

Waiting for Brandon, shown to him in Status 117 with the approved images beside the live pages:

- R8-1 issue 2 (severe) and R5-1 issue 3 (major), the touch page as a dead end. By `kit/03-METHOD.md` the page holds the words of `copy:live.touchOnly` and a link to `links.portfolioWork`, and nothing else loads behind it. The link is not set, so the page shows none. It shows the link the moment the address is in the config. A way to the film from that page is not in the kit and is his to add.
- R8-1 issue 5 (major), the perk cards' divider over an empty row. Approved `marketing-top.png` shows the fine print on all three cards; `kit/02-SUBJECT.md` hides it until the arrow touches a card, and the build follows those words. Which of the two the page at rest should show is his word.
- R8-1 issue 3 and R5-1 issue 1 (major), step 4 at rest: Submit stands alone at bottom centre and the page between is bare. No approved image shows step 4 at rest; the approved `boss-fight.png`, `boss-down.png` and `boss-stages.png` put the card at the top left and Submit's socket at bottom centre.

## Declined

Logged under "Declined issues" in `kit/PROGRESS.md`, each with the critic's words, each Brandon's to overrule:

1. R8-1 issue 1, severe: step 3 at rest. The page starts by itself 1.3 s after it lands (MEASURED on the live site), so a visitor does not stand before this screen; the approved `loader-page.png` and `kit/02-SUBJECT.md` ("one control at the right, the loader port") give its layout.
2. R8-1 issue 4, major: the three blank fields of step 2 (approved `step2-rest.png` shows them empty; `content/copy.json` holds no placeholder). Declined before, round 20.
3. R5-1 issue 2, major: with its three rows shut step 2 repeats step 1 (approved `step2-rest.png`). Declined before, round 20.
4. R8-1 issue 6, major, in part: the words "Accept Defeat" on the skip link are `copy:live.skip`, Brandon's words. The other part, that the bare speaker icon reads as an indicator and not as a control, is taken by the Builder for merge 43.

## What comes next for the unit

Merge 43 when the five agents report (first passes 23:35Z to 23:40Z, the pass ends by 00:05Z), with the tests, the build, the take's check, the browser checks and the published site. Then round 22 on the merged commit with new packs from clean checkouts and the families rotated again. By Brandon's note 4 a round limit does not close the loop below the bar: the state is shown to him as below the bar in every status, and the work goes on until he says to move on.
