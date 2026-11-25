# Round 1, blockout (critic R4)

- Judged commit: 0dfc589. Pack built from e2f5b6e, 29 files in three sets.
- Started 2026-11-25T10:34:28Z. Answers in by 10:49Z. Key released 10:53Z.
- Pass bar: every critic at least `quality.blockoutPass` (7), no severe issue, no red measure of M1, M4, M5, M6, M7, M9, M10.
- Result: NOT PASSED. Scores 7, 7, 7. One severe issue from a critic. Measures 20 green, 12 red at the judged commit.

## Scores

| Critic | Set | What it saw | Score | Severe | Major | Minor |
| --- | --- | --- | --- | --- | --- | --- |
| reviewer-01 | A | six pages at rest, type at real size, the live screen, the film screen, the controls | 7 | 0 | 3 | 5 |
| reviewer-02 | B | nine sheets across the film | 7 | 0 | 6 | 0 |
| reviewer-03 | C | seven sheets of step 1's beats, the pinball cameras | 7 | 1 | 6 | 0 |

Merged score: 7 (the lowest of the three).

## Measures at the judged commit

- MEASURED: M4, M5, M6, M7, M9, M10 on six pages and the film: 20 green, 12 red. The file is `measures.txt`.
- M1, M2, M3, M8 were not built when the round was measured. They ran later on main; their numbers are in kit/PROGRESS.md under "Open items".
- Every red line went to the owner of its page at 10:39Z.

## Every issue, with its owner or the reason it is declined

| No | Critic | Weight | Where | Issue in short | Ruling |
| --- | --- | --- | --- | --- | --- |
| 1 | reviewer-03 | severe | step 1, beat 7, film 0:44.90 to 0:45.70 | The reset and the message that asks for everything again show for under a second before the page turns | step 1: the reset lands at least 2.0 s before the turn, front-on; time taken from the tug (`step1.tug` 22 to 28, `step1.shredded` 28 to 32) |
| 2 | reviewer-02 | major | marketing, 0:06.33 to 0:12.70 | Nothing new for about six seconds | marketing: perk visits spread over their beat, the ticker beat changes every second, the bound to Apply starts its beat |
| 3 | reviewer-02 | major | pinball, 1:39.83, rail camera | The sign is cut by the frame | pinball: compare with approved `rail-cam.png`, fit if it differs |
| 4 | reviewer-02 | major | pinball, 1:16.13 to 1:17.93 | The view jumps between two tier views; the ball seems to teleport | pinball: one ride low and behind the ball up the launch lane, as kit/01 says |
| 5 | reviewer-02 | major | boss, 2:05.67 to 2:15.40 | Dialogs, tiles, the timer and Submit compete; samples repeat | boss: one attack at a time with trigger and answer, repeated poses cut, the boss alone before it breaks |
| 6 | reviewer-02 | major | step 4 at rest | Submit alone at bottom centre | DECLINED: approved `boss-fight.png` and `boss-down.png` show the socket there |
| 7 | reviewer-02 | major | step 1, 0:32.07 and 0:33.47 | The "Invalid email" slab covers the typed address | step 1: no slab rests over the address; both readable in every frame |
| 8 | reviewer-03 | major | pinball camera 9 | The last save is framed high and wide | pinball: lower and tighter, as approved `last-save.png` |
| 9 | reviewer-03 | major | pinball camera 6 | A bumper covers the ball; the tower leaves the frame | pinball: compare with approved `lobby-doors.png`, fit |
| 10 | reviewer-03 | major | pinball camera 7 | The whole office tier has equal weight | DECLINED: approved `reply-all.png` shows the tier so; kit/01 fits this camera to its key |
| 11 | reviewer-03 | major | pinball cameras 2, 3, 4 | The drain and lower edge are cut | Tiers 3 and 2 DECLINED: approved `tier-corporate.png` and `tier-office.png` end just under the flippers. Tier 1 to pinball: fit to approved `tier-street.png` with the apron edge |
| 12 | reviewer-03 | major | step 1, beat 4 | As issue 7 | step 1, with issue 7 |
| 13 | reviewer-03 | major | pinball camera 10, the map | Labels faint; the bottom is cut | pinball: labels answered by the paper plates merged after the pack; the bottom fitted with a margin as approved `table-map.png` |
| 14 | reviewer-01 | major | step 3 at rest | The loader port stands at the right edge and is cut by the screen | DECLINED: approved `loader-page.png` shows the port there, running off the screen's lower edge |
| 15 | reviewer-01 | major | the film screen | The film bar covers the ticker; the play button sits on no column | interface: the bar in a strip under the fitted frame, the play button on the frame's middle |
| 16 | reviewer-01 | major | step 4 at rest | As issue 6 | DECLINED as issue 6 |
| 17 | reviewer-01 | minor | step 1 at rest | Continue is light and low on step 1, dark and near the fields on step 2 | step 1: drawn as step 2's, which is the approved one (`step2-rest.png`) |
| 18 | reviewer-01 | minor | the live screen | The controls read at about 9 px in the picture and crowd the title | interface: the link at least 14 px, clear of the title |
| 19 | reviewer-01 | minor | every step page | The step indicator's pill runs about 10 px past the content edge | the Builder: the rail is now a narrow channel between the first and last buttons and ends at the content edge, as approved `step2-rest.png` shows it (60dc3d6, 559f6fa) |
| 20 | reviewer-01 | minor | marketing | Empty space under the line in each perk card | DECLINED: the fine print appears in that space, as approved `marketing-top.png` shows |
| 21 | reviewer-01 | minor | set A | The set holds no sheets | Not an issue of the build: the sheets were in sets B and C |

## A fault of the pack, not of the site

- The type windows of set A were centred on runs wider than the window, so a line could look cut at both ends. It was sent as it was in round 1 because the round could not pass on the measures. For round 2 a window starts at the left end of a wide run, and the heading says each picture is a window cut out of a page.

## What changes next

- The owners fix the issues above by 11:37Z. Their branches are merged and checked on main.
- Round 2, the last blockout round `quality.blockoutMaxRounds` allows, judges that commit with three fresh critics of other families per set.
- Issues about materials, light and detail were not raised in this round. Had they been, they would go to the look lock.
